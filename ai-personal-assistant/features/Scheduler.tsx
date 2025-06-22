import React, { useState, useCallback, useEffect } from 'react';
import { generateTextWithJsonOutput, generateText } from '../services/geminiService'; // Using generateText first
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SpeechToTextInput } from '../components/SpeechToTextInput';
import { HistoryList } from '../components/HistoryList';
import { StoredSchedule, ParsedEvent } from '../types';
import { storageService } from '../utils/localStorageService';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, isValid } from 'date-fns';

const SCHEDULE_HISTORY_KEY = 'schedulerHistory';

// Simple regex to find potential events like "HH:MM AM/PM - Event Title" or "YYYY-MM-DD HH:MM Event Title"
// This is very basic and can be improved.
const EVENT_REGEX_LINES = [
    /^(?:(\d{4}-\d{2}-\d{2})?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*-\s*)(.+)$/im, // Date (opt) HH:MM AM/PM - Title
    /^(?:(\d{4}-\d{2}-\d{2})?\s*(\d{1,2}:\d{2})\s*-\s*)(.+)$/im, // Date (opt) HH:MM - Title
    /^(?:Task|Event):\s*(.+?)(?:\s*@\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?))?(?:\s*on\s*(\w+\s\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?))?$/im // Task: Title @ Time on Date
];


// Function to parse events from markdown text
const parseEventsFromMarkdown = (markdown: string): ParsedEvent[] => {
    const events: ParsedEvent[] = [];
    const lines = markdown.split('\n');
    let currentDateContext: string | null = null;

    lines.forEach(line => {
        // Check for date context lines like "### Monday, July 29th, 2024"
        const dateMatch = line.match(/^(?:#+\s*)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?)/i);
        if (dateMatch && dateMatch[1]) {
           try {
             // Attempt to parse this date context. This is tricky without knowing the exact year.
             // For simplicity, let's assume current year if not specified.
             let parsedDate = new Date(dateMatch[1] + (dateMatch[1].includes(',') ? '' : `, ${new Date().getFullYear()}`));
             if(isValid(parsedDate)) {
                currentDateContext = format(parsedDate, 'yyyy-MM-dd');
             }
           } catch (e) { /* ignore parse error for context */ }
        }


        for (const regex of EVENT_REGEX_LINES) {
            const match = regex.exec(line.trim());
            if (match) {
                let title: string = '';
                let timeStr: string | undefined = undefined;
                let dateStr: string | undefined = undefined;

                if (regex.source.includes('Date (opt) HH:MM')) { // First two regexes
                    dateStr = match[1];
                    timeStr = match[2];
                    title = match[3];
                } else { // Third regex (Task: ...)
                    title = match[1];
                    timeStr = match[2];
                    dateStr = match[3]; // Date can be in various formats here
                }
                
                title = title.trim();

                let fullStartDateTime: string | undefined = undefined;

                if (timeStr) {
                    timeStr = timeStr.trim();
                    let hours = 0;
                    let minutes = 0;
                    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
                    if (timeParts) {
                        hours = parseInt(timeParts[1], 10);
                        minutes = parseInt(timeParts[2], 10);
                        if (timeParts[3] && timeParts[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
                        if (timeParts[3] && timeParts[3].toUpperCase() === 'AM' && hours === 12) hours = 0; // Midnight case
                    }

                    let eventDate = currentDateContext ? new Date(currentDateContext + 'T00:00:00') : new Date(); // Default to today if no date context
                    if (dateStr) {
                         try {
                            // Attempt to parse dateStr, combine with current year if not present.
                            let parsedEventDate = new Date(dateStr + (dateStr.includes(',') ? '' : `, ${new Date().getFullYear()}`));
                            if (isValid(parsedEventDate)) eventDate = parsedEventDate;
                         } catch (e) { /* ignore parse error for event-specific date */ }
                    }
                    
                    eventDate.setHours(hours, minutes, 0, 0);
                    if (isValid(eventDate)) {
                        fullStartDateTime = format(eventDate, "yyyy-MM-dd'T'HH:mm");
                    }
                }
                 if (title && fullStartDateTime) { // Only add if we have title and a valid start time
                    events.push({
                        id: uuidv4(),
                        title: title,
                        startDateTime: fullStartDateTime,
                        originalText: line.trim(),
                    });
                    break; 
                }
            }
        }
    });
    return events;
};


const generateGoogleCalendarUrl = (event: ParsedEvent): string => {
  const GCalBase = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = encodeURIComponent(event.title);
  let dates = '';
  if (event.startDateTime) {
    // Google Calendar format is YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
    // Our format is YYYY-MM-DDTHH:mm
    const startDate = parseISO(event.startDateTime);
    if(isValid(startDate)){
        // Assuming a 1-hour duration if no end time.
        const endDate = event.endDateTime ? parseISO(event.endDateTime) : new Date(startDate.getTime() + 60 * 60 * 1000);
        if(isValid(endDate)){
            dates = `&dates=${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`;
        }
    }
  }
  const details = event.description ? `&details=${encodeURIComponent(event.description + ` (Originally: ${event.originalText})`)}` : `&details=${encodeURIComponent(`Originally: ${event.originalText}`)}`;
  const location = event.location ? `&location=${encodeURIComponent(event.location)}` : '';
  return `${GCalBase}&text=${title}${dates}${details}${location}`;
};


export const Scheduler: React.FC = () => {
  const [currentSchedule, setCurrentSchedule] = useState<string>('');
  const [tasksToUpdate, setTasksToUpdate] = useState<string>('');
  const [generatedSchedule, setGeneratedSchedule] = useState<string>('');
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<StoredSchedule[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory<StoredSchedule>(SCHEDULE_HISTORY_KEY));
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('Browser does not support notifications.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const setReminder = async (event: ParsedEvent) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      setError('Notification permission denied. Please enable notifications in browser settings.');
      return;
    }
    if (!event.startDateTime) {
        setError("Event has no start time, can't set reminder.");
        return;
    }

    const eventTime = parseISO(event.startDateTime);
    if (!isValid(eventTime)) {
        setError("Invalid event time for reminder.");
        return;
    }
    const now = new Date();
    const timeToEvent = eventTime.getTime() - now.getTime();

    if (timeToEvent <= 0) {
      setError(`Cannot set reminder for "${event.title}" as it's in the past or now.`);
      return;
    }

    setTimeout(() => {
      new Notification('Upcoming Event Reminder', {
        body: `${event.title} is starting now!`,
        icon: '/logo192.png', // Replace with your app's icon
      });
    }, timeToEvent);
    // Simple feedback, can be improved with a toast
    alert(`Reminder set for "${event.title}" at ${format(eventTime, 'p')}.`);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksToUpdate.trim()) {
      setError('Please enter tasks or updates for your schedule.');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedSchedule('');
    setParsedEvents([]);

    const prompt = `
      You are a schedule assistant.
      ${currentSchedule.trim() ? `Current schedule provided by user:\n---\n${currentSchedule}\n---\n` : 'The user has not provided an existing schedule. Assume this is a new schedule or an update to an implicit one.'}

      Tasks/Updates requested by user:
      ---
      ${tasksToUpdate}
      ---

      Please generate an updated or new schedule based on the request.
      Organize the schedule clearly using markdown. Use headings for days (e.g., "### Monday, July 29th, 2024").
      For each task or event, try to include a specific time (e.g., "09:00 AM - Meeting with Team" or "14:30 - Doctor's Appointment").
      If there are conflicts from the new tasks with the existing schedule (if provided), point them out and suggest resolutions if possible, or incorporate changes logically.
      The output should be the full updated schedule text.
      If the request is vague (e.g. "plan my week"), make reasonable assumptions.
    `;
    
    try {
      // First, get the markdown schedule
      const result = await generateText(prompt);
      setGeneratedSchedule(result.text);
      
      if (result.text && !result.text.startsWith("Error")) {
        const events = parseEventsFromMarkdown(result.text);
        setParsedEvents(events);

        const newHistoryItem: StoredSchedule = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          userInput: tasksToUpdate,
          currentSchedule: currentSchedule.trim() ? currentSchedule : undefined,
          generatedSchedule: result.text,
          parsedEvents: events,
        };
        const updatedHistory = storageService.addHistoryItem<StoredSchedule>(SCHEDULE_HISTORY_KEY, newHistoryItem);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSchedule, tasksToUpdate]);


  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = storageService.removeHistoryItem<StoredSchedule>(SCHEDULE_HISTORY_KEY, id);
    setHistory(updatedHistory);
  };

  const renderSchedulePreview = (item: StoredSchedule) => (
    <>Schedule for: {item.userInput.substring(0,50)}{item.userInput.length > 50 ? '...' : ''}</>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <p className="text-slate-300 mb-4">
        Enter your current schedule (optional) and the tasks or updates you want to make. Use the microphone for requests.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentSchedule" className="block text-sm font-medium text-sky-300 mb-1">
            Current Schedule (Optional - Paste here)
          </label>
          <textarea
            id="currentSchedule"
            value={currentSchedule}
            onChange={(e) => setCurrentSchedule(e.target.value)}
            rows={5}
            placeholder="e.g., Monday: 9 AM - Meeting, 1 PM - Lunch..."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
        </div>
        <SpeechToTextInput
          id="tasksToUpdate"
          value={tasksToUpdate}
          onChange={setTasksToUpdate}
          rows={5}
          placeholder="e.g., 'Add a doctor's appointment on Wednesday at 3 PM.' or 'Plan my tasks for tomorrow: finish report, call John, gym.'"
          label="Tasks / Updates / New Schedule Request"
        />
        <button
          type="submit"
          disabled={isLoading || !tasksToUpdate.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><i className="fas fa-calendar-check mr-2"></i>Update/Generate Schedule</>}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {generatedSchedule && !isLoading && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Generated Schedule:</h3>
          <MarkdownRenderer content={generatedSchedule} />

          {parsedEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-600">
              <h4 className="text-lg font-semibold text-sky-300 mb-2">Identified Events:</h4>
              <ul className="space-y-2">
                {parsedEvents.map(event => (
                  <li key={event.id} className="p-2 bg-slate-600/50 rounded flex justify-between items-center">
                    <div>
                      <span className="font-medium text-sky-200">{event.title}</span>
                      {event.startDateTime && <span className="text-xs text-slate-400 block">{format(parseISO(event.startDateTime), "MMM d, yyyy 'at' p")}</span>}
                    </div>
                    <div className="flex space-x-2">
                       {event.startDateTime && (
                        <a 
                            href={generateGoogleCalendarUrl(event)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-green-600 hover:bg-green-500 text-white font-semibold py-1 px-2 rounded shadow-sm"
                            title="Add to Google Calendar"
                        >
                            <i className="fab fa-google mr-1"></i> GCal
                        </a>
                       )}
                       {event.startDateTime && (
                        <button
                            onClick={() => setReminder(event)}
                            className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-1 px-2 rounded shadow-sm"
                            title="Set Reminder (Browser Notification)"
                        >
                            <i className="fas fa-bell mr-1"></i> Reminder
                        </button>
                       )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <HistoryList
        items={history}
        onDeleteItem={handleDeleteHistoryItem}
        title="Saved Schedules"
        renderItemPreview={renderSchedulePreview}
        noItemsMessage="No schedules generated yet."
      />
    </div>
  );
};
