export interface AudioRecordingController {
  stop: () => void;
  abort: () => void;
}

class VoiceService {
  private activeRecording: AudioRecordingController | null = null;

  speak(text: string, lang: string = 'en', onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  abortRecording() {
    const recording = this.activeRecording;
    this.activeRecording = null;
    recording?.abort();
  }

  isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition
    );
  }

  startSpeechRecognition(
    language: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): AudioRecordingController | null {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) return null;

    this.abortRecording();

    const recognition = new SpeechRecognition();
    const requestedLang = language?.toLowerCase() || 'en';
    const langMap: Record<string, string> = {
      te: 'te-IN',
      telugu: 'te-IN',
      hi: 'hi-IN',
      hindi: 'hi-IN',
      en: 'en-US',
      english: 'en-US',
    };

    const targetLang = langMap[requestedLang] || (requestedLang.startsWith('te') ? 'te-IN' : requestedLang.startsWith('hi') ? 'hi-IN' : 'en-US');
    recognition.lang = targetLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let hasEnded = false;

    const controller: AudioRecordingController = {
      stop: () => {
        try { recognition.stop(); } catch { /* ignore */ }
      },
      abort: () => {
        hasEnded = true;
        try { recognition.abort(); } catch { /* ignore */ }
      },
    };

    this.activeRecording = controller;

    recognition.onstart = () => {
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      let isFinal = false;

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0] && item[0].transcript) {
          fullTranscript += item[0].transcript + ' ';
        }
        if (item && item.isFinal) {
          isFinal = true;
        }
      }

      const text = fullTranscript.replace(/\s+/g, ' ').trim();
      if (text) {
        onResult(text, isFinal);
      }
    };


    recognition.onerror = (event: any) => {
      if (hasEnded) return;
      if (event.error === 'no-speech') {
        // Ignore temporary silence in continuous mode
        return;
      }
      hasEnded = true;
      if (this.activeRecording === controller) this.activeRecording = null;
      const err = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'not-allowed'
        : 'recording-failed';
      onError(err);
    };

    recognition.onend = () => {
      if (this.activeRecording === controller) this.activeRecording = null;
      if (!hasEnded) {
        hasEnded = true;
        onEnd?.();
      }
    };

    try {
      recognition.start();
    } catch {
      if (this.activeRecording === controller) this.activeRecording = null;
      onError('recording-failed');
      return null;
    }

    return controller;
  }



  startRecording(
    onStart: () => void,
    onAudio: (audio: Blob) => void,
    onError: (error: string) => void,
  ): AudioRecordingController | null {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError('unsupported');
      return null;
    }

    this.abortRecording();
    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let cancelled = false;
    let stoppedByUser = false;
    const chunks: BlobPart[] = [];
    let maxDuration: ReturnType<typeof setTimeout> | undefined;
    const releaseStream = () => {
      if (maxDuration) clearTimeout(maxDuration);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };
    const controller: AudioRecordingController = {
      stop: () => {
        stoppedByUser = true;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
        else {
          cancelled = true;
          releaseStream();
          if (this.activeRecording === controller) this.activeRecording = null;
        }
      },
      abort: () => {
        cancelled = true;
        if (recorder && recorder.state !== 'inactive') recorder.stop();
        releaseStream();
      },
    };
    this.activeRecording = controller;

    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((audioStream) => {
        if (cancelled) {
          audioStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = audioStream;
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
          .find((type) => MediaRecorder.isTypeSupported(type));
        recorder = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => {
          releaseStream();
          if (this.activeRecording === controller) this.activeRecording = null;
          onError('recording-failed');
        };
        recorder.onstop = () => {
          releaseStream();
          if (this.activeRecording === controller) this.activeRecording = null;
          if (cancelled || !stoppedByUser) return;
          const audio = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' });
          if (audio.size === 0) onError('no-speech');
          else if (audio.size > 10 * 1024 * 1024) onError('recording-too-long');
          else onAudio(audio);
        };
        recorder.start();
        onStart();
        maxDuration = setTimeout(() => controller.stop(), 30000);
      })
      .catch((error: DOMException) => {
        if (cancelled) return;
        if (this.activeRecording === controller) this.activeRecording = null;
        const code = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
          ? 'not-allowed'
          : error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError'
            ? 'audio-capture'
            : 'recording-failed';
        onError(code);
      });

    return controller;
  }
}

export const voiceService = new VoiceService();
