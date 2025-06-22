import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechRecognitionHook } from '../types';

// Polyfill for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Update transcript with final results, append to existing final transcript if continuous
      setTranscript(prev => prev + finalTranscript); 
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Audio capture failed. Ensure microphone is enabled and not in use.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please grant permission in browser settings.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // Only set isListening to false if it wasn't intentionally stopped
      // For continuous mode, it might restart automatically or we might restart it.
      // For this hook, if it ends and we were 'listening', it means it stopped unexpectedly or finished a segment.
      // If we called stopListening(), isListening would already be false.
      if (recognitionRef.current && isListening) {
         // If we want it to truly stop on 'onend', then setIsListening(false) here.
         // If we want it to attempt to continue until explicitly stopped, we might call recognition.start() again.
         // For now, let's assume 'onend' means it stopped and needs to be restarted manually by user.
         // setIsListening(false); // This might be too aggressive if it auto-restarts
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]); // Added isListening to dependency array, careful with re-initialization

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript(''); // Clear previous transcript before starting new session
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e: any) {
        console.error("Error starting recognition:", e);
        setError(`Could not start voice recognition: ${e.message}. Ensure microphone is connected and permission granted.`);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { transcript, isListening, error, startListening, stopListening, setTranscript, setIsListening };
};
