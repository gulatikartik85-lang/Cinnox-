import React, { useState } from 'react';
import { ArrowLeftRight, Calculator, Loader2, Send } from 'lucide-react';
import { GLOBAL_LANGUAGES } from '../data/helpHubs';
import { helpworldApi, type StructuredAssistResponse } from '../lib/helpworldApi';
import { ReadAloudButton, VoiceMicButton } from '../components/SpeechAndAccessibilityBar';

export const MoneyEducationHub: React.FC<{ language: string; ttsVoice: string }> = ({
  language,
  ttsVoice,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState(30000);
  const [currency, setCurrency] = useState('₹');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<StructuredAssistResponse | null>(null);

  const needs = Math.round(monthlyIncome * 0.5);
  const wants = Math.round(monthlyIncome * 0.3);
  const savings = Math.max(0, monthlyIncome - needs - wants);
  const emergencyTarget = needs * 6;

  const askMoneyGuide = async (q?: string) => {
    const query = (q ?? prompt).trim();
    if (!query) return;
    setLoading(true);
    try {
      const res = await helpworldApi.askAssist({
        hubSlug: 'money',
        hubName: 'Money Education',
        prompt: query,
        language,
        context: `User budget example: ${currency}${monthlyIncome}/month`,
      });
      setAnswer(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live 50 / 30 / 20 Budget Planner */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-emerald-500" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Interactive 50 / 30 / 20 Monthly Budget Calculator
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Currency symbol"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm font-semibold text-slate-900 dark:text-white"
            >
              <option value="₹">INR (₹)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
            <input
              type="number"
              min={0}
              aria-label="Monthly income"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value) || 0))}
              className="w-36 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070C17] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">50% Essentials</p>
            <p className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white mt-1">
              {currency}
              {needs.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070C17] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">30% Personal / Flexible</p>
            <p className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white mt-1">
              {currency}
              {wants.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070C17] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">20% Savings &amp; Debt</p>
            <p className="font-mono tabular-nums text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {currency}
              {savings.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070C17] border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">6-Month Safety Target</p>
            <p className="font-mono tabular-nums text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {currency}
              {emergencyTarget.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* AI Financial Literacy Mentor */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Ask Financial Literacy Educator ({language})
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askMoneyGuide();
          }}
          className="space-y-3"
        >
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about budgeting, paying off loans faster, safe savings habits, or avoiding scams..."
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VoiceMicButton language={language} onTranscript={(t) => setPrompt(t)} />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Preparing Plan...' : 'Ask Money Guide'}</span>
            </button>
          </div>
        </form>

        {answer && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {answer.title}
              </h4>
              <ReadAloudButton text={answer.answer} voiceName={ttsVoice} />
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {answer.answer}
            </p>
            {answer.safetyNotice && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{answer.safetyNotice}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export const TranslationHub: React.FC<{ ttsVoice: string }> = ({ ttsVoice }) => {
  const [sourceLanguage, setSourceLanguage] = useState('Auto Detect');
  const [targetLanguage, setTargetLanguage] = useState('Hindi');
  const [tone, setTone] = useState('Natural everyday');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState<{
    detectedLanguage: string;
    translatedText: string;
    pronunciationGuide: string;
    contextTip: string;
  } | null>(null);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await helpworldApi.translate({
        text,
        sourceLanguage,
        targetLanguage,
        tone,
      });
      setOutput(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed.');
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLanguage === 'Auto Detect') return;
    const prev = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(prev);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleTranslate}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              From
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            >
              <option value="Auto Detect">Auto Detect</option>
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.native})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={swapLanguages}
              aria-label="Swap languages"
              className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-sky-500 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Translate To
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or speak any sentence, letter, travel question, or sign text..."
          className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VoiceMicButton language={sourceLanguage === 'Auto Detect' ? 'English' : sourceLanguage} onTranscript={(t) => setText(t)} />
            <select
              aria-label="Translation style"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="Natural everyday">Natural Everyday</option>
              <option value="Polite & formal">Polite &amp; Formal</option>
              <option value="Simple easy words">Simple Words</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="min-h-[44px] px-6 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Translating...' : 'Translate Instantly'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {output && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>Detected: {output.detectedLanguage}</span>
              <span aria-hidden="true"> · </span>
              <span>Target: {targetLanguage}</span>
            </div>
            <ReadAloudButton text={output.translatedText} voiceName={ttsVoice} label="Hear Translation" />
          </div>

          <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
            {output.translatedText}
          </p>

          {output.pronunciationGuide && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-sky-700 dark:text-sky-300">
              <strong>Pronunciation:</strong> {output.pronunciationGuide}
            </div>
          )}

          {output.contextTip && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{output.contextTip}</p>
          )}
        </section>
      )}
    </div>
  );
};
