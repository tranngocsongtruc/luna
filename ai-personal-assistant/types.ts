export interface NavItem {
  name: string;
  path: string;
  icon: string;
  description: string;
}

export interface UserProfile {
  affiliations: string;
  situations: string;
  information: string;
  interests: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: { 
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export enum AssistantFeatureId {
  HOME = "home",
  CONTEXT = "context",
  NOTES = "notes",
  RESOURCES = "resources",
  EDUCATION = "education",
  EMERGENCY = "emergency",
  SCHEDULE = "schedule",
}

export interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface StoredItem {
  id: string;
  timestamp: string; // ISO string
}

export interface StoredOrganizedNote extends StoredItem {
  userInput: string;
  sourceText?: string;
  organizedNote: string;
}

export interface StoredResourceResult extends StoredItem {
  query: string;
  resources: string; // The markdown response from AI
  groundingMetadata?: GroundingMetadata;
}

export interface StoredEducationalAnswer extends StoredItem {
  question: string;
  answer: string; // The markdown response from AI
}

export interface ParsedEvent {
  id: string;
  title: string;
  startDateTime: string; // Attempt to get YYYY-MM-DDTHH:mm
  endDateTime?: string; // Attempt to get YYYY-MM-DDTHH:mm
  description?: string;
  location?: string;
  originalText: string; // The line from markdown that represents this event
}

export interface StoredSchedule extends StoredItem {
  userInput: string;
  currentSchedule?: string;
  generatedSchedule: string; // The full markdown schedule
  parsedEvents?: ParsedEvent[];
}

export type HistoryItemType = StoredOrganizedNote | StoredResourceResult | StoredEducationalAnswer | StoredSchedule;
