
import React, { useState, useCallback } from 'react';
import { generateText } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const EmergencyCaller: React.FC = () => {
  const [situation, setSituation] = useState<string>('');
  const [script, setScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleGenerateScript = useCallback(async () => {
    if (!situation.trim()) {
      setError('Please describe your emergency situation to generate a script.');
      return;
    }
    setIsLoading(true);
    setError('');
    setScript('');

    const prompt = `
      The user is in an emergency situation and needs guidance on what to say when calling emergency services (e.g., 911).
      Their described situation is: "${situation}".
      Generate a clear, calm, and concise script they can read to an emergency operator.
      The script should prompt for or include placeholders for:
      1. Their exact location (address, landmarks).
      2. The nature of the emergency.
      3. Number of people involved/injured (if applicable).
      4. Their name and phone number.
      5. Any immediate dangers or specific instructions for responders (e.g., "door is unlocked", "beware of dog").
      Emphasize they should stay on the line and answer all questions.
      IMPORTANT: Start the script by clearly stating the nature of the emergency and location.
    `;
    
    try {
      const result = await generateText(prompt);
      setScript(result.text);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [situation]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <div className="p-4 mb-6 bg-red-800/70 border-2 border-red-600 text-red-100 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-3 flex items-center">
          <i className="fas fa-exclamation-triangle text-3xl mr-3 text-yellow-300"></i>IMPORTANT: Emergency Guidance
        </h2>
        <p className="mb-2 text-lg">
          This feature <strong className="underline">DOES NOT CALL 911</strong> or any emergency service.
        </p>
        <p className="mb-2">
          In a real emergency, <strong className="text-xl">DIAL 911 (or your local emergency number) IMMEDIATELY</strong> from a phone.
        </p>
        <p>
          This tool is designed to help you prepare what to say to an emergency operator.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-sky-300 mb-2">Describe Your Emergency Situation:</h3>
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={4}
          placeholder="e.g., 'There's a fire in my kitchen.', 'Someone collapsed and is not breathing.', 'I witnessed a car accident.'"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
        />
      </div>
      
      <button
        onClick={handleGenerateScript}
        disabled={isLoading || !situation.trim()}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
      >
        {isLoading ? <LoadingSpinner /> : <><i className="fas fa-file-alt mr-2"></i>Generate Guidance Script</>}
      </button>

      {error && <ErrorMessage message={error} />}

      {script && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Guidance Script for Emergency Call:</h3>
          <p className="text-sm text-yellow-300 mb-2 italic">
            Remember to stay as calm as possible and speak clearly. Provide your exact location first.
          </p>
          <MarkdownRenderer content={script} />
        </div>
      )}
    </div>
  );
};
