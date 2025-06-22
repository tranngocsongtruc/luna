import React, { useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SpeechToTextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  label: string;
  disabled?: boolean;
}

export const SpeechToTextInput: React.FC<SpeechToTextInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 3,
  label,
  disabled = false,
}) => {
  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    setTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onChange(value ? `${value} ${transcript}` : transcript);
      setTranscript(''); // Clear transcript after appending
    }
  }, [transcript, onChange, value, setTranscript]);

  const handleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-sky-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled || isListening}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed pr-10"
        />
        <button
          type="button"
          onClick={handleListen}
          disabled={disabled}
          title={isListening ? 'Stop recording' : 'Start recording'}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-300 hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500
                        ${isListening ? 'bg-red-500 hover:bg-red-400' : 'bg-slate-600 hover:bg-slate-500'}`}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>
      </div>
      {speechError && <p className="text-xs text-red-400 mt-1">{speechError}</p>}
    </div>
  );
};
