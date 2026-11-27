import React, { useState } from 'react';
import { Camera, Globe, Loader2, Upload, Volume2 } from 'lucide-react';
import { GLOBAL_LANGUAGES } from '../data/helpHubs';
import { helpworldApi, type AccessibilityPrefs } from '../lib/helpworldApi';
import { ReadAloudButton, VoiceMicButton } from '../components/SpeechAndAccessibilityBar';

export const VoiceAssistantHub: React.FC<{ language: string; ttsVoice: string }> = ({
  language,
  ttsVoice,
}) => {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTitle, setReplyTitle] = useState('');
  const [replyText, setReplyText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

  const handleVoiceAsk = async (spokenText?: string) => {
    const query = (spokenText ?? transcript).trim();
    if (!query) return;
    setLoading(true);
    setError('');
    setAudioUrl('');
    try {
      const assist = await helpworldApi.askAssist({
        hubSlug: 'voice',
        hubName: 'AI Voice Assistant',
        prompt: query,
        language,
        context: 'Keep reply natural, warm, and conversational for spoken playback.',
      });
      setReplyTitle(assist.title);
      setReplyText(assist.answer);

      try {
        const tts = await helpworldApi.synthesizeSpeech({
          text: assist.answer,
          voiceName: ttsVoice,
        });
        setAudioUrl(`data:${tts.mimeType};base64,${tts.audioBase64}`);
      } catch {
        // User can still read text or use ReadAloudButton browser fallback
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice assistant could not process that request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Hands-Free AI Voice Assistant ({language})
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tap Speak to ask using your voice instead of typing, or edit the text and hear a
            natural spoken answer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VoiceMicButton
            language={language}
            onTranscript={(spoken) => {
              setTranscript(spoken);
              handleVoiceAsk(spoken);
            }}
          />
          <button
            type="button"
            disabled={loading || !transcript.trim()}
            onClick={() => handleVoiceAsk()}
            className="min-h-[44px] px-5 py-2 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
            <span>{loading ? 'Speaking Answer...' : 'Ask & Speak Reply'}</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your spoken words appear here (or type directly)..."
          className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {replyText && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {replyTitle}
            </h3>
            <ReadAloudButton text={replyText} voiceName={ttsVoice} />
          </div>

          {audioUrl && (
            <audio controls autoPlay src={audioUrl} className="w-full">
              Your browser does not support audio playback.
            </audio>
          )}

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {replyText}
          </p>
        </section>
      )}
    </div>
  );
};

export const ImageAiHub: React.FC<{ language: string; ttsVoice: string }> = ({
  language,
  ttsVoice,
}) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    summary: string;
    detailedExplanation: string;
    extractedText: string;
    nextSteps: string[];
    safetyNotice: string;
  } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;
    setLoading(true);
    setError('');
    try {
      const res = await helpworldApi.analyzeImage({
        imageBase64: previewUrl,
        mimeType,
        question,
        language,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAnalyze}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <label className="min-h-[220px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-sky-500 transition-colors overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded preview for Image AI"
                className="max-h-64 rounded-xl object-contain"
              />
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-sky-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Upload or Take Photo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Homework pages, letters, signs, error screens, labels
                </p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              What would you like to know about this image?
            </label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Example: Translate this sign, explain this math question, or summarize this letter..."
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <VoiceMicButton language={language} onTranscript={(t) => setQuestion(t)} />
              <button
                type="submit"
                disabled={loading || !previewUrl}
                className="min-h-[44px] px-5 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span>{loading ? 'Analyzing Image...' : 'Understand Image'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {result.summary}
            </h3>
            <ReadAloudButton
              text={`${result.summary}. ${result.detailedExplanation}`}
              voiceName={ttsVoice}
            />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {result.detailedExplanation}
          </p>
          {result.extractedText && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060B15] border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {result.extractedText}
            </div>
          )}
          {result.safetyNotice && (
            <p className="text-xs text-amber-700 dark:text-amber-300">{result.safetyNotice}</p>
          )}
        </section>
      )}
    </div>
  );
};

export const GlobalLanguageAndAccessibilityHub: React.FC<{
  language: string;
  onChangeLanguage: (lang: string) => void;
  ttsVoice: string;
  onChangeVoice: (voice: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  accessibility: AccessibilityPrefs;
  onChangeAccessibility: (next: AccessibilityPrefs) => void;
}> = ({
  language,
  onChangeLanguage,
  ttsVoice,
  onChangeVoice,
  theme,
  onToggleTheme,
  accessibility,
  onChangeAccessibility,
}) => {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-sky-500" />
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Global Language &amp; Accessibility Preferences
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Preferred App &amp; AI Response Language
            </label>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.native})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Text-to-Speech Voice Persona
            </label>
            <select
              value={ttsVoice}
              onChange={(e) => onChangeVoice(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            >
              <option value="Kore">Kore (Clear Warm Guide)</option>
              <option value="Zephyr">Zephyr (Calm Gentle Narrator)</option>
              <option value="Puck">Puck (Bright Energetic)</option>
              <option value="Charon">Charon (Deep Steady)</option>
              <option value="Fenrir">Fenrir (Crisp Direct)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Text Size Scale
            </p>
            <div className="flex gap-1.5">
              {(['normal', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChangeAccessibility({ ...accessibility, textScale: sz })}
                  className={`flex-1 min-h-[38px] rounded-lg text-xs font-semibold cursor-pointer ${
                    accessibility.textScale === sz
                      ? 'hw-accent-gradient text-white'
                      : 'bg-slate-100 dark:bg-[#060B15] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sz === 'normal' ? '100%' : sz === 'lg' ? '115%' : '125%'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:border-sky-500 cursor-pointer"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">Display Mode</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeAccessibility({ ...accessibility, highContrast: !accessibility.highContrast })
            }
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:border-sky-500 cursor-pointer"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">High Contrast</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {accessibility.highContrast ? 'Enabled' : 'Standard'}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeAccessibility({
                ...accessibility,
                reducedMotion: !accessibility.reducedMotion,
              })
            }
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:border-sky-500 cursor-pointer"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">Reduced Motion</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {accessibility.reducedMotion ? 'Motion Minimized' : 'Standard Smooth'}
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
