import React, { useEffect, useState } from 'react';
import { Loader2, PhoneCall, ShieldAlert, Siren } from 'lucide-react';
import { helpworldApi, type EmergencyEntry, type StructuredAssistResponse } from '../lib/helpworldApi';
import { ReadAloudButton, VoiceMicButton } from '../components/SpeechAndAccessibilityBar';

const FALLBACK_DIRECTORY: EmergencyEntry[] = [
  {
    country: 'India',
    code: 'IN',
    unified: '112',
    police: '100',
    ambulance: '108',
    fire: '101',
    helplines: 'Women: 1091 · Child: 1098 · Mental Health (Tele-MANAS): 14416',
  },
  {
    country: 'United States & Canada',
    code: 'US',
    unified: '911',
    police: '911',
    ambulance: '911',
    fire: '911',
    helplines: 'Suicide & Crisis Lifeline: 988 · Poison Control: 1-800-222-1222',
  },
  {
    country: 'United Kingdom',
    code: 'UK',
    unified: '999',
    police: '999',
    ambulance: '999',
    fire: '999',
    helplines: 'NHS Non-Emergency: 111 · Police Non-Emergency: 101',
  },
  {
    country: 'European Union',
    code: 'EU',
    unified: '112',
    police: '112',
    ambulance: '112',
    fire: '112',
    helplines: 'Unified EU emergency service free on all mobile networks',
  },
];

export const EmergencyHub: React.FC<{ language: string; ttsVoice: string }> = ({
  language,
  ttsVoice,
}) => {
  const [directory, setDirectory] = useState<EmergencyEntry[]>(FALLBACK_DIRECTORY);
  const [selectedCode, setSelectedCode] = useState('IN');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<StructuredAssistResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    helpworldApi
      .getEmergencyDirectory()
      .then((res) => {
        if (res.directory?.length) setDirectory(res.directory);
      })
      .catch(() => {
        // Offline-ready fallback already loaded
      });
  }, []);

  const currentCountry = directory.find((d) => d.code === selectedCode) || directory[0];

  const askEmergencySafety = async (q?: string) => {
    const query = (q ?? prompt).trim();
    if (!query) return;
    setLoading(true);
    setError('');
    try {
      const res = await helpworldApi.askAssist({
        hubSlug: 'emergency',
        hubName: 'Emergency Help',
        prompt: query,
        language,
        context: `User region: ${currentCountry.country} (Emergency: ${currentCountry.unified})`,
      });
      setGuide(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reach AI triage. Dial your local emergency number directly.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Immediate SOS Dialer Panel (Offline-Ready) */}
      <section className="rounded-2xl border border-red-400/60 dark:border-red-900/80 bg-red-50/70 dark:bg-red-950/25 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Siren className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Immediate Emergency Contacts (Offline Ready)
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                If anyone is in immediate danger, unconscious, injured, or facing fire/crime, call
                emergency services first.
              </p>
            </div>
          </div>

          <select
            aria-label="Select country emergency numbers"
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1220] text-sm font-semibold text-slate-900 dark:text-white shrink-0"
          >
            {directory.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.country}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'All-in-One SOS', num: currentCountry.unified },
            { label: 'Police', num: currentCountry.police },
            { label: 'Ambulance / Medical', num: currentCountry.ambulance },
            { label: 'Fire Rescue', num: currentCountry.fire },
          ].map((item) => (
            <a
              key={item.label}
              href={`tel:${item.num}`}
              className="min-h-[68px] rounded-xl border border-red-300/80 dark:border-red-900/70 bg-white dark:bg-[#0B1220] p-3.5 flex items-center justify-between gap-2 hover:border-red-500 transition-colors"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-red-600 dark:text-red-400">
                  {item.num}
                </p>
              </div>
              <PhoneCall className="w-5 h-5 text-red-500 shrink-0" />
            </a>
          ))}
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          Support Helplines: {currentCountry.helplines}
        </p>
      </section>

      {/* Calm First-Aid & Safety Guidance */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          AI First-Aid &amp; Safety Guidance ({language})
        </h3>

        <div className="flex flex-wrap gap-2">
          {[
            'Minor burn cooling first-aid steps',
            'Power outage & gas leak safety checklist',
            'Road accident bystander safety steps',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setPrompt(preset);
                askEmergencySafety(preset);
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askEmergencySafety();
          }}
          className="space-y-3"
        >
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the situation calmly (for active emergencies, dial emergency services first)..."
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm text-slate-900 dark:text-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <VoiceMicButton language={language} onTranscript={(t) => setPrompt(t)} />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="min-h-[44px] px-5 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{loading ? 'Loading Safety Steps...' : 'Get Safety Steps'}</span>
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {guide && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {guide.title}
            </h3>
            <ReadAloudButton text={`${guide.title}. ${guide.answer}`} voiceName={ttsVoice} />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {guide.answer}
          </p>
          {guide.actionSteps?.length > 0 && (
            <ol className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {guide.actionSteps.map((s, i) => (
                <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2.5">
                  <span className="font-mono font-bold text-red-500">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
};
