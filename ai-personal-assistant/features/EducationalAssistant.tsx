import React, { useState, useCallback, useEffect } from 'react';
import { generateText } from '../services/geminiService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SpeechToTextInput } from '../components/SpeechToTextInput';
import { HistoryList } from '../components/HistoryList';
import { StoredEducationalAnswer } from '../types';
import { storageService } from '../utils/localStorageService';
import { v4 as uuidv4 } from 'uuid';

const EDUCATION_HISTORY_KEY = 'educationalAssistantHistory';

export const EducationalAssistant: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<StoredEducationalAnswer[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory<StoredEducationalAnswer>(EDUCATION_HISTORY_KEY));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnswer('');

    const prompt = `Please answer the following educational question clearly, concisely, and accurately. If the question is complex, break it down into understandable parts. If appropriate, provide examples or analogies. Question: "${question}"`;
    
    try {
      const result = await generateText(prompt);
      setAnswer(result.text);
      if (result.text && !result.text.startsWith("Error")) {
        const newHistoryItem: StoredEducationalAnswer = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          question: question,
          answer: result.text,
        };
        const updatedHistory = storageService.addHistoryItem<StoredEducationalAnswer>(EDUCATION_HISTORY_KEY, newHistoryItem);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [question]);

  const handleDeleteHistoryItem = (id: string) => {
    const updatedHistory = storageService.removeHistoryItem<StoredEducationalAnswer>(EDUCATION_HISTORY_KEY, id);
    setHistory(updatedHistory);
  };
  
  const renderEducationalPreview = (item: StoredEducationalAnswer) => (
    <>Question: {item.question.substring(0,50)}{item.question.length > 50 ? '...' : ''}</>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 bg-slate-800 shadow-xl rounded-lg">
      <p className="text-slate-300 mb-4">
        Ask any educational question. Use the microphone to speak your query. The AI will try to provide a clear and informative answer.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SpeechToTextInput
          id="educationalQuestion"
          value={question}
          onChange={setQuestion}
          rows={3}
          placeholder="e.g., 'How does photosynthesis work?', 'What are black holes?', 'Explain the theory of relativity in simple terms.'"
          label="Your Question:"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center"
        >
          {isLoading ? <LoadingSpinner /> : <><i className="fas fa-book-reader mr-2"></i>Get Answer</>}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {answer && !isLoading && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-md shadow">
          <h3 className="text-xl font-semibold text-sky-400 mb-2">Answer:</h3>
          <MarkdownRenderer content={answer} />
        </div>
      )}

      <HistoryList
        items={history}
        onDeleteItem={handleDeleteHistoryItem}
        title="Saved Questions & Answers"
        renderItemPreview={renderEducationalPreview}
        noItemsMessage="No questions saved yet."
      />
    </div>
  );
};
