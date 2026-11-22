import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Download, Loader2, Printer, Send, Trash2, Volume2 } from 'lucide-react';
import { cinnoxApi, type UserProfile } from '../lib/cinnoxApi';

// 8. AI Voice Generator Studio (Real Gemini 3.8 TTS WAV Output)
export const VoiceGeneratorStudio: React.FC = () => {
  const [text, setText] = useState(
    'Welcome to Cinnox. Your creative workspace for imagery, voiceovers, code, and intelligent automation.'
  );
  const [voiceName, setVoiceName] = useState('Kore');
  const [style, setStyle] = useState('Warm, crisp studio narrator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await cinnoxApi.generateVoice({ text, voiceName, style });
      setAudioUrl(`data:${res.mimeType};base64,${res.audioBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Script Text (Up to 2,000 characters)
          </label>
          <textarea
            rows={4}
            required
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Voice Persona
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option value="Kore">Kore — Balanced Studio Voice</option>
              <option value="Puck">Puck — Bright &amp; Energetic</option>
              <option value="Charon">Charon — Deep Broadcast Narrator</option>
              <option value="Fenrir">Fenrir — Bold Documentary</option>
              <option value="Zephyr">Zephyr — Calm &amp; Conversational</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Delivery Style
            </label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          <span>{loading ? 'Synthesizing Audio...' : 'Generate Voice Audio'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Generated Studio WAV ({voiceName})
            </h2>
            <a
              href={audioUrl}
              download={`cinnox-voice-${voiceName.toLowerCase()}.wav`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download WAV</span>
            </a>
          </div>

          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
};

// 9. AI Code Generator Studio
export const CodeGeneratorStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Write a TypeScript debounce hook with cleanup and generic argument inference for React 19'
  );
  const [language, setLanguage] = useState('TypeScript');
  const [includeTests, setIncludeTests] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    filename: string;
    language: string;
    code: string;
    explanation: string;
    complexityNote: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.generateCode({ prompt, language, includeTests });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Describe the Function, Component, or Script
          </label>
          <textarea
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="sm:w-64">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Language / Stack
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>TypeScript</option>
              <option>Python</option>
              <option>React TSX</option>
              <option>JavaScript</option>
              <option>SQL (PostgreSQL / SQLite)</option>
              <option>Go</option>
              <option>Rust</option>
              <option>HTML / Tailwind CSS</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-4 sm:pt-5">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(e) => setIncludeTests(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded"
            />
            <span>Include usage example or unit test</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Writing Clean Code...' : 'Generate Code'}</span>
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
            <div>
              <p className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-300">
                {result.filename} · {result.language}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {result.complexityNote}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(result.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="rounded-xl bg-[#06070E] border border-indigo-950/80 p-4 overflow-x-auto text-xs font-mono text-slate-100 leading-relaxed">
            <code>{result.code}</code>
          </pre>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Notes:</strong> {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
};

// 10. AI Chatbot Studio
export const ChatbotStudio: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [persona, setPersona] = useState('general');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      cinnoxApi
        .getChatHistory(`user-${user.id}-${persona}`)
        .then((res) => {
          setMessages(res.messages.map((m) => ({ role: m.role, content: m.content })));
        })
        .catch(() => {});
    }
  }, [user, persona]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextHistory = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const res = await cinnoxApi.sendChat({
        message: trimmed,
        persona,
        sessionId: user ? `user-${user.id}-${persona}` : `guest-${persona}`,
        history: messages,
      });
      setMessages([...nextHistory, { role: 'model', content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat response failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] overflow-hidden flex flex-col h-[600px]">
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-indigo-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Assistant Mode:
          </label>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="general">Cinnox General Copilot</option>
            <option value="coder">Code Architect</option>
            <option value="marketer">Growth &amp; SEO Strategist</option>
            <option value="tutor">Study &amp; STEM Tutor</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setMessages([])}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Thread</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
            <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Start a conversation with Cinnox
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions, brainstorm strategies, debug code, or outline essays.{' '}
              {user ? 'Your messages save automatically.' : 'Sign in anytime to save thread history.'}
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user'
                    ? 'cinnox-accent-gradient text-white'
                    : 'bg-slate-100 dark:bg-[#11152A] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-indigo-950/70'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#11152A] inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="p-4 border-t border-slate-200 dark:border-indigo-950/70 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cinnox anything..."
          className="flex-1 h-11 px-4 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send chat message"
          className="h-11 px-5 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

// 11. AI Resume Builder Studio
export const ResumeBuilderStudio: React.FC = () => {
  const [fullName, setFullName] = useState('Jordan Patel');
  const [email, setEmail] = useState('jordan.patel@example.com');
  const [location, setLocation] = useState('Austin, TX');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Software Engineer');
  const [experienceYears, setExperienceYears] = useState('6 years');
  const [skills, setSkills] = useState('TypeScript, React, Node.js, PostgreSQL, AWS, Docker, GraphQL');
  const [backgroundSummary, setBackgroundSummary] = useState(
    'Led frontend architecture and API optimization across two B2B SaaS platforms, mentoring 4 junior developers and cutting p95 latency by 38%.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resume, setResume] = useState<{
    fullName: string;
    headline: string;
    contactLine: string;
    summary: string;
    skills: string[];
    experience: Array<{ role: string; company: string; period: string; bullets: string[] }>;
    education: Array<{ degree: string; institution: string; year: string }>;
    atsTips: string[];
  } | null>(null);

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.buildResume({
        fullName,
        email,
        location,
        targetRole,
        experienceYears,
        skills,
        backgroundSummary,
      });
      setResume(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume build failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleBuild}
        className="no-print rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Job Title
            </label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Experience Level
            </label>
            <input
              type="text"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Core Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Career Highlights, Past Projects &amp; Education
          </label>
          <textarea
            rows={3}
            value={backgroundSummary}
            onChange={(e) => setBackgroundSummary(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Crafting ATS Resume...' : 'Build Resume'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {resume && (
        <div className="space-y-4">
          <div className="no-print flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 p-8 sm:p-10 shadow-sm space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                {resume.fullName}
              </h2>
              <p className="text-sm font-semibold text-violet-700 mt-0.5">{resume.headline}</p>
              <p className="text-xs text-slate-500 mt-1">{resume.contactLine}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Executive Summary
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{resume.summary}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Core Skills
              </h3>
              <p className="text-sm text-slate-800">{resume.skills.join(' · ')}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Experience
              </h3>
              {resume.experience.map((exp, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {exp.role} — <span className="font-medium text-slate-700">{exp.company}</span>
                    </p>
                    <span className="text-xs font-mono text-slate-500">{exp.period}</span>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {resume.education.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Education
                </h3>
                {resume.education.map((edu, i) => (
                  <div key={i} className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-slate-900">
                      {edu.degree}, {edu.institution}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{edu.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {resume.atsTips.length > 0 && (
            <div className="no-print rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                ATS Optimization Notes
              </h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {resume.atsTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 14. AI Business Name Generator Studio
export const BusinessNameStudio: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const [description, setDescription] = useState(
    'An AI design and automation platform helping small businesses launch marketing assets quickly'
  );
  const [industry, setIndustry] = useState('SaaS & AI Productivity');
  const [style, setStyle] = useState('Short, Brandable & Tech-Forward');
  const [keywords, setKeywords] = useState('spark, flow, grid, pulse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [names, setNames] = useState<
    Array<{
      brandName: string;
      tagline: string;
      domainIdea: string;
      category: string;
      rationale: string;
    }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.generateBusinessNames({
        description,
        industry,
        style,
        keywords,
      });
      setNames(data.names || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Business name generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Describe Your Business or Startup
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Naming Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Short, Brandable &amp; Tech-Forward</option>
              <option>Two-Word Compound</option>
              <option>Editorial Luxury</option>
              <option>Playful &amp; Consumer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seed Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
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
          <span>{loading ? 'Generating 8 Brand Ideas...' : 'Generate 8 Business Names'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {names.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {names.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <p className="text-xs font-mono text-violet-600 dark:text-violet-300">
                  {item.category} · {item.domainIdea}
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {item.brandName}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {item.tagline}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                  {item.rationale}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onNavigate(`/tools/logo-maker?brand=${encodeURIComponent(item.brandName)}`)
                }
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-violet-500 cursor-pointer"
              >
                <span>Design Logo for {item.brandName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
