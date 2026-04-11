import { useState, useRef, useEffect, useCallback } from "react";

export type VoiceInputState = {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
};

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    error: null,
    isSupported: false,
  });

  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const isSupported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setState((prev) => ({ ...prev, isSupported }));
  }, []);

  const startListening = useCallback((lang: string = "en-US") => {
    // Check support directly
    const isSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
      }));
      return;
    }

    try {
      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configuration
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Show interim results
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      // Event handlers
      recognition.onstart = () => {
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
        }));
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setState((prev) => ({
          ...prev,
          transcript: prev.transcript + finalTranscript,
          interimTranscript: interimTranscript,
        }));
      };

      recognition.onerror = (event: any) => {
        let errorMessage = "Speech recognition error occurred";
        
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "No microphone found. Please check your microphone.";
            break;
          case "not-allowed":
            errorMessage = "Microphone permission denied. Please allow microphone access.";
            break;
          case "network":
            errorMessage = "Network error. Please check your internet connection.";
            break;
          case "aborted":
            // User stopped, not an error
            return;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
          error: errorMessage,
        }));
      };

      recognition.onend = () => {
        setState((prev) => ({
          ...prev,
          isListening: false,
          interimTranscript: "",
        }));
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: error instanceof Error ? error.message : "Failed to start voice input",
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState((prev) => ({
        ...prev,
        isListening: false,
        interimTranscript: "",
      }));
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      interimTranscript: "",
      error: null,
    }));
  }, []);

  const setTranscript = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      transcript: text,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
    fullText: state.transcript + state.interimTranscript,
  };
};

