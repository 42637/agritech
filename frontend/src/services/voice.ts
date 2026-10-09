class VoiceService {
  // Text-To-Speech (TTS)
  speak(text: string, lang: string = 'en', onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stop(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate BCP-47 language tag
    if (lang === 'te') utterance.lang = 'te-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // Speech-To-Text (STT)
  startListening(lang: string = 'en', onResult: (text: string) => void, onError?: (err: any) => void): any {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError("Browser speech recognition not supported. Please use text input.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    if (lang === 'te') recognition.lang = 'te-IN';
    else if (lang === 'hi') recognition.lang = 'hi-IN';
    else recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      if (onError) onError(event.error);
    };

    recognition.start();
    return recognition;
  }
}

export const voiceService = new VoiceService();
