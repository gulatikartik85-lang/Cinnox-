import React, { useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2, Send, ShieldAlert } from 'lucide-react';
import type { HelpHubMeta } from '../data/helpHubs';
import { helpworldApi, type StructuredAssistResponse } from '../lib/helpworldApi';
import { ReadAloudButton, VoiceMicButton } from '../components/SpeechAndAccessibilityBar';

const MODE_OPTIONS: Record<string, string[]> = {
  student: ['Study Notes', 'Homework Step-by-Step', 'Project Ideas', 'Exam Practice Quiz'],
  jobs: ['Remote & WFH Roles', 'Resume & Cover Letter', 'Job Scam Check', 'Interview Prep'],
  business: ['Business Ideas', 'Local Marketing', 'Pricing & Costs', '30-Day Launch Plan'],
  health: ['Fitness & Mobility', 'Balanced Nutrition', 'Sleep & Recovery', 'General Wellness'],
  legal: ['Consumer Rights', 'Tenant & Housing', 'Workplace Basics', 'Govt Services Guide'],
  tech: ['Android Phone Help', 'Computer & Laptop', 'Wi-Fi & Internet', 'Scam & Security Check'],
  daily: ['Home Cooking Ideas', 'Travel Checklist', 'Smart Shopping', 'Daily Schedule'],
  assistant: ['Everyday Question', 'Letter / Message Draft', 'Step-by-Step Guide'],
};

export const GeneralHelpHub: React.FC<{
  hub: HelpHubMeta;
  language: string;
  ttsVoice: string;
  onNavigate: (path: string) => void;
}> = ({ hub, language, ttsVoice, onNavigate }) => {
  const modes = MODE_OPTIONS[hub.slug] || MODE_OPTIONS.assistant;
  const [selectedMode, setSelectedMode] = useState(modes[0]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StructuredAssistResponse | null>(null);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [copied, setCopied] = useState(false);

  const runHelp = async (queryText?: string) => {
    const q = (queryText ?? prompt).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await helpworldApi.askAssist({
        hubSlug: hub.slug,
        hubName: hub.name,
        prompt: q,
        language,
        context: selectedMode,
        history,
      });
      setResult(res);
      setHistory((prev) => [
        ...prev.slice(-4),
        { role: 'user', content: q },
        { role: 'model', content: res.answer },
      ]);
      if (queryText) setPrompt(queryText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate help right now.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = `${result.title}\n\n${result.answer}\n\nNext Steps:\n${result.actionSteps
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n')}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      {hub.disclaimer && (
        <div className="rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/25 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            {hub.disclaimer}
          </p>
        </div>
      )}

      {/* Interactive Mode Selector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#060B15] border border-slate-200 dark:border-slate-800">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMode(m)}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedMode === m
                  ? 'hw-accent-gradient text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Starter Questions */}
        {hub.quickPrompts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Try a common question or type your own below:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {hub.quickPrompts.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => runHelp(qp)}
                  className="text-left px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 text-xs sm:text-sm text-slate-700 dark:text-slate-200 bg-slate-50/70 dark:bg-[#070C17] transition-colors cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form + Voice Mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runHelp();
          }}
          className="space-y-3"
        >
          <label htmlFor="hub-prompt-input" className="block text-sm font-semibold text-slate-900 dark:text-white">
            Your question ({language})
          </label>
          <textarea
            id="hub-prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask ${hub.name} in ${language}...`}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <VoiceMicButton
              language={language}
              onTranscript={(spoken) => setPrompt((prev) => (prev ? `${prev} ${spoken}` : spoken))}
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="min-h-[44px] px-6 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Thinking...' : 'Get Free Answer'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {result && (
        <section
          aria-live="polite"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-5"
        >
          {result.isEmergencyAlert && (
            <div className="rounded-xl border border-red-500 bg-red-600/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-300">
                    Potential Emergency Detected — Contact Local Emergency Services Immediately
                  </p>
                  <p className="text-xs text-red-700/90 dark:text-red-200/90 mt-0.5">
                    Dial 112 (India/EU), 911 (US/Canada), or 999 (UK) without delay.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/hub/emergency')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open SOS Contacts
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              {result.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <ReadAloudButton
                text={`${result.title}. ${result.answer}`}
                voiceName={ttsVoice}
              />
              <button
                type="button"
                onClick={copyResult}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {result.answer}
          </div>

          {result.actionSteps?.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Action Steps
              </h3>
              <ol className="space-y-2">
                {result.actionSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-mono tabular-nums text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.safetyNotice && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              {result.safetyNotice}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
