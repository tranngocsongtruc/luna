import React, { useState, useCallback } from 'react';
import { generateText, GeminiResponse } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { GroundingChunk } from '../types';
import { SpeechToTextInput } from '../components/SpeechToTextInput';

export const ContextExplainer: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a term or concept to explain.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResponse(null);

    const prompt = `Explain the following concept, event, slang, trend, or phenomenon in a clear, concise, and easy-to-understand manner. If it's a very recent event or trend, provide context based on current information. Term: "${query}"`;
    
    try {
      const result = await generateText(prompt, undefined, [{ googleSearch: {} }]);
      setResponse(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <p className="text-slate-300 mb-4">
        Enter an event, slang, trend, or any phenomenon you want to understand better. The AI will provide a clear explanation. Use the microphone to speak your query.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SpeechToTextInput
          id="contextQuery"
          value={query}
          onChange={setQuery}
          placeholder="e.g., 'quiet quitting', 'the metaverse', 'Occam's Razor'"
          label="What do you want to understand?"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><i className="fas fa-search mr-2"></i>Explain</>}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {response && response.text && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Explanation:</h3>
          <MarkdownRenderer content={response.text} />
           {response.groundingMetadata && response.groundingMetadata.groundingChunks && response.groundingMetadata.groundingChunks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold text-sky-300 mb-1">Sources:</h4>
              <ul className="list-disc list-inside text-sm">
                {response.groundingMetadata.groundingChunks.map((chunk: GroundingChunk, index: number) =>
                  chunk.web && chunk.web.uri ? (
                    <li key={index} className="truncate">
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
    </div>
  );
};
