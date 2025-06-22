import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { generateText } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SpeechToTextInput } from '../components/SpeechToTextInput';
import { HistoryList } from '../components/HistoryList';
import { StoredOrganizedNote } from '../types';
import { storageService } from '../utils/localStorageService';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const NOTES_HISTORY_KEY = 'organizedNotesHistory';

export const NoteTaker: React.FC = () => {
  const [sourceText, setSourceText] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [sourceLink, setSourceLink] = useState<string>('');
  const [organizedNotes, setOrganizedNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingLink, setIsFetchingLink] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [notesHistory, setNotesHistory] = useState<StoredOrganizedNote[]>([]);

  useEffect(() => {
    setNotesHistory(storageService.getHistory<StoredOrganizedNote>(NOTES_HISTORY_KEY));
  }, []);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (['text/plain', 'text/markdown', 'text/html', 'text/text'].includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setSourceText(text);
        setError('');
      } else {
        setError('Unsupported file type. Please upload a text-based file (.txt, .md, .html) or paste the content.');
      }
    }
  };

  const handleFetchFromLink = async () => {
    if (!sourceLink.trim()) {
      setError("Please enter a URL.");
      return;
    }
    setIsFetchingLink(true);
    setError('');
    try {
      // Basic fetch. This will likely hit CORS issues for many sites.
      // A backend proxy would be needed for robust fetching.
      // For now, it's a best-effort attempt.
      const response = await fetch(sourceLink);
      if (!response.ok) {
        throw new Error(`Failed to fetch content from URL (status: ${response.status}). The server might not allow direct fetching (CORS). Try pasting the content manually.`);
      }
      const text = await response.text();
      // Rudimentary HTML to text conversion
      const doc = new DOMParser().parseFromString(text, "text/html");
      setSourceText(doc.body.textContent || "Could not extract text content from the URL.");

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch from URL. This could be due to network issues or CORS policy. Please try pasting the content directly.');
      setSourceText(''); // Clear source text on error
    } finally {
      setIsFetchingLink(false);
    }
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNotes.trim()) {
      setError('Please enter some notes to organize.');
      return;
    }
    setIsLoading(true);
    setError('');
    setOrganizedNotes('');

    const timestamp = new Date().toISOString();
    const formattedTimestamp = format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss");

    let prompt: string;
    if (sourceText.trim()) {
      prompt = `Source Material (context for notes):\n---\n${sourceText}\n---\n\nUser's Notes (Timestamp: ${formattedTimestamp}):\n---\n${userNotes}\n---\n\nPlease synthesize my notes, considering the source material, into a concise summary, key takeaways, or structured notes. Organize them clearly, perhaps with headings or bullet points. Explicitly include the timestamp (${formattedTimestamp}) in your organized output if relevant or as a reference.`;
    } else {
      prompt = `User's Notes (Timestamp: ${formattedTimestamp}):\n---\n${userNotes}\n---\n\nPlease help me organize these notes into a structured summary, a set of key points, or a coherent piece of text. Organize them clearly, perhaps with headings or bullet points. Explicitly include the timestamp (${formattedTimestamp}) in your organized output if relevant or as a reference.`;
    }
    
    try {
      const result = await generateText(prompt);
      setOrganizedNotes(result.text);
      const newHistoryItem: StoredOrganizedNote = {
        id: uuidv4(),
        timestamp,
        userInput: userNotes,
        sourceText: sourceText.trim() ? sourceText : undefined,
        organizedNote: result.text,
      };
      const updatedHistory = storageService.addHistoryItem<StoredOrganizedNote>(NOTES_HISTORY_KEY, newHistoryItem);
      setNotesHistory(updatedHistory);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, userNotes]);

  const handleDeleteNote = (id: string) => {
    const updatedHistory = storageService.removeHistoryItem<StoredOrganizedNote>(NOTES_HISTORY_KEY, id);
    setNotesHistory(updatedHistory);
  };

  const renderNotePreview = (item: StoredOrganizedNote) => (
    <>
      Notes on: {item.userInput.substring(0, 50)}{item.userInput.length > 50 ? '...' : ''}
      {item.sourceText && <span className="text-xs text-slate-400 block"> (with source)</span>}
    </>
  );


  return (
    <div className="max-w-3xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <p className="text-slate-300 mb-4">
        Paste any source text, upload a text file, or provide a link (optional). Then, type or speak your notes. The AI will help organize them.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="sourceText" className="block text-sm font-medium text-sky-300 mb-1">
            Source Material (Optional)
          </label>
          <textarea
            id="sourceText"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={5}
            placeholder="Paste article, book excerpt, lecture transcript, etc."
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
          />
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <div>
                 <label htmlFor="fileUpload" className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-md text-sm shadow-sm inline-flex items-center">
                    <i className="fas fa-upload mr-2"></i>Upload Text File
                </label>
                <input id="fileUpload" type="file" onChange={handleFileUpload} className="hidden" accept=".txt,.md,.html,.text" />
            </div>
            <div className="flex-grow flex gap-2">
                <input 
                    type="url" 
                    value={sourceLink} 
                    onChange={(e) => setSourceLink(e.target.value)} 
                    placeholder="Or paste URL of source (publicly accessible)"
                    className="flex-grow px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-slate-400 text-sm"
                />
                <button 
                    type="button" 
                    onClick={handleFetchFromLink} 
                    disabled={isFetchingLink || !sourceLink}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-sm disabled:opacity-50 flex items-center"
                >
                    {isFetchingLink ? <LoadingSpinner/> : <><i className="fas fa-link mr-1"></i> Fetch</>}
                </button>
            </div>
          </div>
           <p className="text-xs text-slate-400 mt-1">For complex files (PDF, DOCX), please copy and paste the text content directly.</p>
        </div>
        
        <SpeechToTextInput
          id="userNotes"
          value={userNotes}
          onChange={setUserNotes}
          rows={5}
          placeholder="Type or speak your thoughts, questions, or key points here..."
          label="Your Notes / What You'd Say Out Loud"
        />

        <button
          type="submit"
          disabled={isLoading || !userNotes.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><i className="fas fa-lightbulb mr-2"></i>Organize Notes</>}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {organizedNotes && !isLoading && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Newly Organized Notes:</h3>
          <MarkdownRenderer content={organizedNotes} />
        </div>
      )}

      <HistoryList
        items={notesHistory}
        onDeleteItem={handleDeleteNote}
        title="Saved Organized Notes"
        renderItemPreview={renderNotePreview}
        noItemsMessage="No organized notes saved yet."
      />
    </div>
  );
};
