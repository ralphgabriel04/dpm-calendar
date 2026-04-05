"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./Button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  language?: string;
  className?: string;
  buttonVariant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  continuous?: boolean;
  showText?: boolean;
  placeholder?: string;
}

// Type for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

// Use any for window properties to avoid global type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWindowSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
};

export function VoiceInput({
  onTranscript,
  onPartialTranscript,
  language = "fr-FR",
  className,
  buttonVariant = "outline",
  size = "icon",
  continuous = false,
  showText = false,
  placeholder = "Cliquez pour parler...",
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  useEffect(() => {
    const SpeechRecognitionAPI = getWindowSpeechRecognition();
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  // Initialize speech recognition
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("La reconnaissance vocale n'est pas supportee par ce navigateur");
      return;
    }

    const SpeechRecognitionAPI = getWindowSpeechRecognition();

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setPartialText("");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = "Une erreur est survenue";
      switch (event.error) {
        case "not-allowed":
          errorMessage = "Acces au microphone refuse";
          break;
        case "no-speech":
          errorMessage = "Aucune parole detectee";
          break;
        case "network":
          errorMessage = "Erreur reseau";
          break;
        case "aborted":
          errorMessage = "";
          break;
      }
      if (errorMessage) setError(errorMessage);
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setPartialText(interimTranscript);
        onPartialTranscript?.(interimTranscript);
      }

      if (finalTranscript) {
        setPartialText("");
        onTranscript(finalTranscript);
        if (!continuous) {
          recognition.stop();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, continuous, onTranscript, onPartialTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isListening ? "default" : buttonVariant}
        size={size}
        onClick={toggleListening}
        className={cn(
          isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
        )}
        title={isListening ? "Arreter l'ecoute" : "Commencer l'ecoute vocale"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {showText && (
        <div className="flex-1 min-w-0">
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="truncate">
                {partialText || placeholder}
              </span>
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for voice input
export function useVoiceInput(options: {
  language?: string;
  continuous?: boolean;
  onTranscript?: (text: string) => void;
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognitionAPI = getWindowSpeechRecognition();
    setIsSupported(!!SpeechRecognitionAPI);
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setTranscript((prev) => prev + " " + text);
    options.onTranscript?.(text);
  }, [options]);

  const clear = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    clear,
    VoiceInputComponent: (props: Partial<VoiceInputProps>) => (
      <VoiceInput
        onTranscript={handleTranscript}
        language={options.language}
        continuous={options.continuous}
        {...props}
      />
    ),
  };
}
