import React, { useRef, useState } from 'react';
import { Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { GLOBAL_LANGUAGES } from '../data/helpHubs';
import { helpworldApi } from '../lib/helpworldApi';

export const ReadAloudButton: React.FC<{
  text: string;
  voiceName?: string;
  label?: string;
}> = ({ text, voiceName = 'Kore', label = 'Listen (Audio)' }) => {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  };

  const handleSpeak = async () => {
    if (playing) {
      stop();
      return;
    }
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await helpworldApi.synthesizeSpeech({
        text: text.slice(0, 1500),
        voiceName,
      });
      const audio = new Audio(`data:${res.mimeType};base64,${res.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      setPlaying(true);
      await audio.play();
    } catch {
      // Fallback to browser SpeechSynthesis for offline/accessibility resilience
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text.slice(0, 1000));
        utter.onend = () => setPlaying(false);
        utter.onerror = () => setPlaying(false);
        setPlaying(true);
        window.speechSynthesis.speak(utter);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={loading || !text.trim()}
      aria-label={playing ? 'Stop reading aloud' : 'Read response aloud'}
      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1220] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
      ) : playing ? (
        <VolumeX className="w-4 h-4 text-emerald-500" />
      ) : (
        <Volume2 className="w-4 h-4 text-sky-500" />
      )}
      <span>{loading ? 'Preparing Audio...' : playing ? 'Stop Audio' : label}</span>
    </button>
  );
};

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const VoiceMicButton: React.FC<{
  language: string;
  onTranscript: (text: string) => void;
}> = ({ language, onTranscript }) => {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechLocale =
    GLOBAL_LANGUAGES.find((l) => l.code === language)?.speechLang || 'en-US';

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setListening(false);
  };

  const startVoice = async () => {
    setError('');
    if (listening) {
      stopRecording();
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (RecognitionCtor) {
      try {
        const rec = new RecognitionCtor();
        rec.lang = speechLocale;
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (event) => {
          const text = event.results?.[0]?.[0]?.transcript || '';
          if (text.trim()) onTranscript(text.trim());
        };
        rec.onerror = () => {
          setError('Microphone permission unavailable. Try typing or upload audio.');
          setListening(false);
        };
        rec.onend = () => setListening(false);
        recognitionRef.current = rec;
        setListening(true);
        rec.start();
        return;
      } catch {
        // Fallback to MediaRecorder + backend Gemini transcription
      }
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Voice input requires microphone access on HTTPS.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = String(reader.result || '');
          setTranscribing(true);
          try {
            const res = await helpworldApi.transcribeAudio({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
              language,
            });
            onTranscript(res.transcript);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Transcription failed.');
          } finally {
            setTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };
      recorderRef.current = recorder;
      setListening(true);
      recorder.start();
    } catch {
      setError('Microphone access was blocked.');
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={startVoice}
        disabled={transcribing}
        aria-label={listening ? 'Stop voice input' : 'Speak instead of typing'}
        className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          listening
            ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1220] text-slate-700 dark:text-slate-200 hover:border-sky-500'
        }`}
      >
        {transcribing ? (
          <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
        ) : listening ? (
          <MicOff className="w-4 h-4 text-red-500" />
        ) : (
          <Mic className="w-4 h-4 text-sky-500" />
        )}
        <span>{transcribing ? 'Transcribing...' : listening ? 'Stop Mic' : 'Speak'}</span>
      </button>
      {error && <span className="text-[11px] text-red-500 mt-1">{error}</span>}
    </div>
  );
};
