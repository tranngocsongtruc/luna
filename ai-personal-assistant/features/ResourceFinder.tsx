import React, { useState, useCallback, useEffect } from 'react';
import { generateText, GeminiResponse } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { UserProfile, GroundingChunk, StoredResourceResult } from '../types';
import { SpeechToTextInput } from '../components/SpeechToTextInput';
import { HistoryList } from '../components/HistoryList';
import { storageService } from '../utils/localStorageService';
import { v4 as uuidv4 } from 'uuid';

const initialProfile: UserProfile = {
  affiliations: '',
  situations: '',
  information: '',
  interests: '',
};
const PROFILE_STORAGE_KEY = 'aiAssistantUserProfile';
const RESOURCES_HISTORY_KEY = 'resourceFinderHistory';

export const ResourceFinder: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isProfileSaved, setIsProfileSaved] = useState<boolean>(false);
  const [history, setHistory] = useState<StoredResourceResult[]>([]);

  useEffect(() => {
    const savedProfile = storageService.getItem<UserProfile>(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      setUserProfile(savedProfile);
      setIsProfileSaved(true);
    }
    setHistory(storageService.getHistory<StoredResourceResult>(RESOURCES_HISTORY_KEY));
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
    setIsProfileSaved(false); 
  };

  const saveProfile = () => {
    storageService.setItem(PROFILE_STORAGE_KEY, userProfile);
    setIsProfileSaved(true);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter what resources you are looking for.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResponse(null);

    const profileString = `
      Affiliations: ${userProfile.affiliations || 'Not specified'}
      Current Situations: ${userProfile.situations || 'Not specified'}
      Other Information: ${userProfile.information || 'Not specified'}
      Interests: ${userProfile.interests || 'Not specified'}
    `.trim();

    const prompt = `
      Based on the following user profile:
      ---
      PROFILE:
      ${profileString}
      ---
      Please find relevant resources (articles, organizations, tools, support groups, communities, educational materials, etc.) related to: "${query}".
      Prioritize resources that align with the user's profile.
      Provide a brief description for each resource and why it might be relevant.
      Use Google Search to find up-to-date information and list the source URLs if available.
    `;
    
    try {
      const result = await generateText(prompt, undefined, [{ googleSearch: {} }]);
      setResponse(result);
      if (result.text && !result.text.startsWith("Error")) {
        const newHistoryItem: StoredResourceResult = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          query: query,
          resources: result.text,
          groundingMetadata: result.groundingMetadata
        };
        const updatedHistory = storageService.addHistoryItem<StoredResourceResult>(RESOURCES_HISTORY_KEY, newHistoryItem);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [query, userProfile]);

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = storageService.removeHistoryItem<StoredResourceResult>(RESOURCES_HISTORY_KEY, id);
    setHistory(updatedHistory);
  };

  const renderResourcePreview = (item: StoredResourceResult) => (
    <>Query: {item.query.substring(0,50)}{item.query.length > 50 ? '...' : ''}</>
  );


  return (
    <div className="max-w-3xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <p className="text-slate-300 mb-4">
        Tell us about yourself (optional, helps find better resources) and what you're looking for. Use the microphone to speak your query.
        Your profile information is stored locally in your browser.
      </p>
      
      <div className="mb-6 p-4 bg-slate-700/70 rounded-lg">
        <h3 className="text-lg font-semibold text-sky-300 mb-2">Your Profile (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="affiliations" className="block text-sm font-medium text-slate-300 mb-1">Affiliations</label>
            <input type="text" name="affiliations" id="affiliations" value={userProfile.affiliations} onChange={handleProfileChange} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm placeholder-slate-400" placeholder="e.g., Student, Engineer"/>
          </div>
          <div>
            <label htmlFor="interests" className="block text-sm font-medium text-slate-300 mb-1">Interests</label>
            <input type="text" name="interests" id="interests" value={userProfile.interests} onChange={handleProfileChange} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm placeholder-slate-400" placeholder="e.g., AI, Hiking"/>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="situations" className="block text-sm font-medium text-slate-300 mb-1">Current Situations/Challenges</label>
            <textarea name="situations" id="situations" value={userProfile.situations} onChange={handleProfileChange} rows={2} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm placeholder-slate-400" placeholder="e.g., Job hunting, learning Python"></textarea>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="information" className="block text-sm font-medium text-slate-300 mb-1">Other Relevant Information</label>
            <textarea name="information" id="information" value={userProfile.information} onChange={handleProfileChange} rows={2} className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md shadow-sm placeholder-slate-400" placeholder="e.g., Prefers online courses"></textarea>
          </div>
        </div>
        <button
            onClick={saveProfile}
            disabled={isProfileSaved}
            className="mt-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-1.5 px-3 rounded-md shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isProfileSaved ? <><i className="fas fa-check mr-2"></i>Profile Saved</> : 'Save Profile Locally'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SpeechToTextInput
          id="resourceQuery"
          value={query}
          onChange={setQuery}
          placeholder="e.g., 'scholarships for cs students', 'mental health support groups', 'beginner Python tutorials'"
          label="What resources are you looking for?"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><i className="fas fa-search-plus mr-2"></i>Find Resources</>}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {response && response.text && !isLoading && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Found Resources:</h3>
          <MarkdownRenderer content={response.text} />
          {response.groundingMetadata && response.groundingMetadata.groundingChunks && response.groundingMetadata.groundingChunks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-sky-300 mb-1">Sources & Further Reading:</h4>
              <ul className="list-disc list-inside text-sm">
                {response.groundingMetadata.groundingChunks.map((chunk: GroundingChunk, index: number) =>
                  chunk.web && chunk.web.uri ? (
                    <li key={index} className="truncate my-1">
                      <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                        {chunk.web.title || chunk.web.uri}
                      </a>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      <HistoryList
        items={history}
        onDeleteItem={handleDeleteHistoryItem}
        title="Saved Resource Searches"
        renderItemPreview={renderResourcePreview}
        noItemsMessage="No resource searches saved yet."
      />
    </div>
  );
};
