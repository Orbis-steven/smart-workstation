import { useEffect, useRef, useState } from 'react';

export function useSpeechRecognition({
  locale = 'zh',
  onUnsupported,
  onTranscript,
  onError,
  onStart,
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const recognitionErrorRef = useRef(false);

  const stop = () => {
    recognitionRef.current?.stop();
  };

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onUnsupported?.();
      return;
    }

    if (isListening) {
      stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    recognitionErrorRef.current = false;
    setTranscript('');
    setIsListening(true);
    onStart?.();

    recognition.onresult = (event) => {
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const nextTranscript = event.results[index][0]?.transcript || '';
        if (event.results[index].isFinal) {
          finalTranscriptRef.current += nextTranscript;
        } else {
          interimText += nextTranscript;
        }
      }

      const combinedText = `${finalTranscriptRef.current}${interimText}`.trim();
      latestTranscriptRef.current = combinedText;
      setTranscript(combinedText);
    };

    recognition.onerror = (event) => {
      recognitionErrorRef.current = true;
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onend = async () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (recognitionErrorRef.current) return;

      const finalTranscript = (finalTranscriptRef.current || latestTranscriptRef.current || '').trim();
      await onTranscript?.(finalTranscript);
    };

    recognition.start();
  };

  useEffect(() => (
    () => {
      recognitionRef.current?.stop();
    }
  ), []);

  return {
    isListening,
    start,
    stop,
    transcript,
  };
}
