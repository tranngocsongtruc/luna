
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Tool, Content } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { GroundingMetadata } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const parseJsonFromMarkdown = (text: string): any => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("Failed to parse JSON directly, returning raw text. Error:", e);
    console.warn("Raw text was:", text);
    // Fallback: if it's not perfectly formatted JSON but still looks like it (e.g. missing quotes on keys sometimes)
    // we return the cleaned string for the user to inspect or attempt manual parsing.
    // For robust applications, more advanced fuzzy parsing or error reporting to user is needed.
    return { error: "Failed to parse JSON", rawText: jsonStr };
  }
};


export interface GeminiResponse {
  text: string;
  groundingMetadata?: GroundingMetadata;
}

export const generateText = async (
  prompt: string,
  systemInstruction?: string,
  tools?: Tool[],
  thinkingBudget?: number // Optional: 0 to disable thinking
): Promise<GeminiResponse> => {
  try {
    const params: GenerateContentParameters = {
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {},
    };

    if (systemInstruction && params.config) {
      params.config.systemInstruction = systemInstruction;
    }
    if (tools && params.config) {
      params.config.tools = tools;
    }
    if (thinkingBudget !== undefined && params.config) {
        if (GEMINI_MODEL_TEXT === 'gemini-2.5-flash-preview-04-17') {
             params.config.thinkingConfig = { thinkingBudget };
        } else {
            console.warn("ThinkingConfig is only available for 'gemini-2.5-flash-preview-04-17'. Ignoring.");
        }
    }


    const response: GenerateContentResponse = await ai.models.generateContent(params);
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    return {
        text: response.text,
        groundingMetadata
    };

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        return { text: `Error generating content: ${error.message}` };
    }
    return { text: "An unknown error occurred while generating content." };
  }
};

export const generateTextWithJsonOutput = async (
  prompt: string,
  systemInstruction?: string
): Promise<any> => {
  try {
    const params: GenerateContentParameters = {
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    };
     if (systemInstruction && params.config) {
      params.config.systemInstruction = systemInstruction;
    }

    const response: GenerateContentResponse = await ai.models.generateContent(params);
    return parseJsonFromMarkdown(response.text);

  } catch (error) {
    console.error("Gemini API call for JSON failed:", error);
    if (error instanceof Error) {
        return { error: `Error generating JSON content: ${error.message}` };
    }
    return { error: "An unknown error occurred while generating JSON content." };
  }
};

export const generateTextStream = async (
  prompt: string,
  systemInstruction?: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const params: GenerateContentParameters = {
    model: GEMINI_MODEL_TEXT,
    contents: prompt,
    config: {},
  };
  if (systemInstruction && params.config) {
    params.config.systemInstruction = systemInstruction;
  }
  return ai.models.generateContentStream(params);
};

// Example of a function that might use vision capabilities if needed later
export const generateTextFromImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: imageBase64,
    },
  };
  const textPart = { text: prompt };
  // Ensure you use a model that supports vision, e.g., 'gemini-1.5-flash-latest' or 'gemini-pro-vision'
  // For this example, let's assume GEMINI_MODEL_TEXT is vision-capable for demonstration,
  // but in reality, you'd use a specific vision model.
  const response: GenerateContentResponse = await ai.models.generateContent({
    // model: 'gemini-1.5-flash-latest', // Correct model for vision
    model: GEMINI_MODEL_TEXT, // Placeholder, replace with actual vision model
    contents: { parts: [textPart, imagePart] },
  });
  return response.text;
};

// Function for Chat
export const createChat = (systemInstruction?: string) => {
  return ai.chats.create({
    model: GEMINI_MODEL_TEXT,
    config: systemInstruction ? { systemInstruction } : {},
  });
};
