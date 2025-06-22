
import { NavItem, AssistantFeatureId } from './types';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_MODEL_VISION = 'gemini-1.5-flash-latest'; // If vision needed

export const NAV_ITEMS: NavItem[] = [
  {
    name: "Context Explainer",
    path: "/context",
    icon: "fas fa-question-circle",
    description: "Get explanations for events, slang, trends, and more."
  },
  {
    name: "Note Taker",
    path: "/notes",
    icon: "fas fa-microphone-alt",
    description: "Record your thoughts and notes while reading or learning."
  },
  {
    name: "Resource Finder",
    path: "/resources",
    icon: "fas fa-search-location",
    description: "Discover resources tailored to your profile and needs."
  },
  {
    name: "Educational Assistant",
    path: "/education",
    icon: "fas fa-graduation-cap",
    description: "Ask educational questions and get clear answers."
  },
  {
    name: "Emergency Guide",
    path: "/emergency",
    icon: "fas fa-first-aid",
    description: "Guidance for emergency situations (does not call 911)."
  },
  {
    name: "Scheduler",
    path: "/schedule",
    icon: "fas fa-calendar-alt",
    description: "Build and update your personal or work schedules."
  }
];

export const FEATURE_ID_MAP: { [key: string]: AssistantFeatureId } = {
  "/context": AssistantFeatureId.CONTEXT,
  "/notes": AssistantFeatureId.NOTES,
  "/resources": AssistantFeatureId.RESOURCES,
  "/education": AssistantFeatureId.EDUCATION,
  "/emergency": AssistantFeatureId.EMERGENCY,
  "/schedule": AssistantFeatureId.SCHEDULE,
};
