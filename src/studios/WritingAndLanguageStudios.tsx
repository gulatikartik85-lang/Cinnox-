import React, { useState } from 'react';
import { ArrowRightLeft, Check, Copy, Download, Loader2 } from 'lucide-react';
import { cinnoxApi } from '../lib/cinnoxApi';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

// 3. AI Text Generator
export const TextGeneratorStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Launch announcement blog post for a productivity workflow tool tailored to remote engineering teams'
  );
  const [format, setFormat] = useState('Blog Article');
  const [tone, setTone] = useState('Clear & Authoritative');
  const [length, setLength] = useState('Medium (~450 words)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await cinnoxApi.generateText({ prompt, format, tone, length });
      setOutput(res.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Text generation failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadMd = () => {
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cinnox-generated-text.md';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="txt-prompt"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Topic or Writing Brief
          </label>
          <textarea
            id="txt-prompt"
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="txt-format"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Format
            </label>
            <select
              id="txt-format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Blog Article</option>
              <option>Email Campaign</option>
              <option>Product Description</option>
              <option>SEO Landing Copy</option>
              <option>Executive Summary</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="txt-tone"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tone
            </label>
            <select
              id="txt-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Clear &amp; Authoritative</option>
              <option>Conversational</option>
              <option>Persuasive</option>
              <option>Technical Editorial</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="txt-length"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Length
            </label>
            <select
              id="txt-length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Short (~180 words)</option>
              <option>Medium (~450 words)</option>
              <option>Long-Form (~900 words)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Writing Copy...' : 'Generate Text'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {output && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {output.split(/\s+/).filter(Boolean).length} words
            </span>
            <div className="flex items-center gap-2">
              <CopyButton text={output} />
              <button
                type="button"
                onClick={downloadMd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.MD</span>
              </button>
            </div>
          </div>

          <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {output}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. AI Story Writer
export const StoryWriterStudio: React.FC = () => {
  const [premise, setPremise] = useState(
    'An archivist discovers an encrypted lighthouse broadcast repeating coordinates beneath the Arctic ice'
  );
  const [genre, setGenre] = useState('Sci-Fi Mystery');
  const [tone, setTone] = useState('Atmospheric & Suspenseful');
  const [characters, setCharacters] = useState('Dr. Elena Vance, Pilot Kael');
  const [continuationPrompt, setContinuationPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [story, setStory] = useState<{
    title: string;
    chapters: Array<{ heading: string; text: string }>;
    writingNote: string;
  } | null>(null);

  const handleGenerate = async (isContinuation: boolean) => {
    setError('');
    setLoading(true);
    try {
      const fullPrevious = story?.chapters.map((c) => `${c.heading}\n${c.text}`).join('\n\n');
      const res = await cinnoxApi.writeStory({
        premise: isContinuation ? continuationPrompt || 'Continue with a dramatic turning point.' : premise,
        genre,
        tone,
        characters,
        previousStory: isContinuation ? fullPrevious : undefined,
      });

      if (isContinuation && story) {
        setStory({
          title: story.title,
          chapters: [...story.chapters, { heading: res.chapterHeading, text: res.storyText }],
          writingNote: res.writingNote,
        });
        setContinuationPrompt('');
      } else {
        setStory({
          title: res.title,
          chapters: [{ heading: res.chapterHeading, text: res.storyText }],
          writingNote: res.writingNote,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Story generation failed');
    } finally {
      setLoading(false);
    }
  };

  const fullText = story
    ? `${story.title}\n\n${story.chapters.map((c) => `${c.heading}\n\n${c.text}`).join('\n\n')}`
    : '';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
        <div>
          <label
            htmlFor="story-premise"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Story Premise
          </label>
          <textarea
            id="story-premise"
            rows={3}
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Sci-Fi Mystery</option>
              <option>Epic Fantasy</option>
              <option>Psychological Thriller</option>
              <option>Contemporary Drama</option>
              <option>Adventure Fiction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tone
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Key Characters
            </label>
            <input
              type="text"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleGenerate(false)}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Drafting Chapter...' : 'Write Opening Chapter'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {story && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-indigo-950/60 pb-4">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {story.title}
            </h2>
            <CopyButton text={fullText} />
          </div>

          <div className="space-y-6">
            {story.chapters.map((ch, idx) => (
              <section key={idx} className="space-y-2">
                <h3 className="font-display text-base font-bold text-violet-700 dark:text-violet-300">
                  {ch.heading}
                </h3>
                <div className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {ch.text}
                </div>
              </section>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-indigo-950/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Continue Story Direction (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={continuationPrompt}
                onChange={(e) => setContinuationPrompt(e.target.value)}
                placeholder="e.g., They descend beneath the ice shelf and find an active beacon..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(true)}
                className="h-10 px-4 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Writing...' : 'Continue Next Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 12. AI Translator
const LANGUAGES = [
  'Auto Detect',
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Arabic',
  'Chinese (Simplified)',
  'Portuguese',
  'Italian',
  'Russian',
  'Bengali',
  'Tamil',
  'Urdu',
  'Turkish',
  'Indonesian',
  'Vietnamese',
  'Dutch',
];

export const TranslatorStudio: React.FC = () => {
  const [text, setText] = useState(
    'Welcome to Cinnox. Create artwork, videos, code, and global translations in seconds.'
  );
  const [sourceLanguage, setSourceLanguage] = useState('Auto Detect');
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [formality, setFormality] = useState('Natural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    detectedSourceLanguage: string;
    translatedText: string;
    transliteration: string;
    alternativePhrasing: string;
    culturalNote: string;
  } | null>(null);

  const handleSwap = () => {
    if (sourceLanguage === 'Auto Detect') return;
    const prevSource = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(prevSource);
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.translateText({
        text,
        sourceLanguage,
        targetLanguage,
        formality,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleTranslate}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              From
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap languages"
              className="h-10 w-10 rounded-xl border border-slate-200 dark:border-indigo-900/70 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-violet-500 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              {LANGUAGES.filter((l) => l !== 'Auto Detect').map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Register
            </label>
            <select
              value={formality}
              onChange={(e) => setFormality(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Natural</option>
              <option>Casual</option>
              <option>Formal / Business</option>
            </select>
          </div>
        </div>

        <textarea
          rows={4}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to translate..."
          className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Translating...' : 'Translate Now'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Detected: <strong className="text-slate-900 dark:text-white">{result.detectedSourceLanguage}</strong> →{' '}
              <strong className="text-violet-600 dark:text-violet-300">{targetLanguage}</strong>
            </span>
            <CopyButton text={result.translatedText} />
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#070913] border border-slate-200 dark:border-indigo-900/60 p-4 text-base font-medium text-slate-900 dark:text-white leading-relaxed">
            {result.translatedText}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-indigo-950/70 p-4 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Pronunciation / Guide</p>
              <p className="text-slate-600 dark:text-slate-400">{result.transliteration}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-indigo-950/70 p-4 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Alternative Phrasing</p>
              <p className="text-slate-600 dark:text-slate-400">{result.alternativePhrasing}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">Cultural Note:</strong> {result.culturalNote}
          </p>
        </div>
      )}
    </div>
  );
};

// 15. AI Social Media Post Generator
export const SocialMediaPostStudio: React.FC = () => {
  const [topic, setTopic] = useState(
    'Announcing our free 15-in-1 AI creative studio suite for designers, developers, and marketers'
  );
  const [platform, setPlatform] = useState('LinkedIn');
  const [tone, setTone] = useState('Insightful & Crisp');
  const [goal, setGoal] = useState('Saves & Link Clicks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    hook: string;
    caption: string;
    callToAction: string;
    hashtags: string[];
    visualSuggestion: string;
    bestPostingWindow: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.generateSocialPost({ topic, platform, tone, goal });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Post generation failed');
    } finally {
      setLoading(false);
    }
  };

  const fullCopy = result
    ? `${result.hook}\n\n${result.caption}\n\n${result.callToAction}\n\n${result.hashtags.join(' ')}`
    : '';

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Post Topic or Campaign Announcement
          </label>
          <textarea
            rows={3}
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>LinkedIn</option>
              <option>Instagram</option>
              <option>X / Twitter</option>
              <option>TikTok</option>
              <option>YouTube Shorts</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tone
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Campaign Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Drafting Post...' : 'Generate Platform Post'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-300">
              {platform} · Best Window: {result.bestPostingWindow}
            </p>
            <CopyButton text={fullCopy} />
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-[#070913] border border-slate-200 dark:border-indigo-900/60 p-4 space-y-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            <p className="font-bold text-slate-900 dark:text-white">{result.hook}</p>
            <p>{result.caption}</p>
            <p className="font-semibold text-violet-700 dark:text-violet-300">{result.callToAction}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              {result.hashtags.join(' ')}
            </p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">Visual Direction:</strong> {result.visualSuggestion}
          </p>
        </div>
      )}
    </div>
  );
};
