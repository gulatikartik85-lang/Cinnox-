import React, { useState } from 'react';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { helpworldApi, type UserProfile } from '../lib/helpworldApi';

export const PlusMembershipPage: React.FC<{
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}> = ({ user, onUserUpdated, onNavigate }) => {
  const [loading, setLoading] = useState(false);

  const togglePlus = async (enable: boolean) => {
    if (!user) {
      onNavigate('/signup');
      return;
    }
    setLoading(true);
    try {
      const res = await helpworldApi.setPlusStatus(enable);
      onUserUpdated(res.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white [text-wrap:balance]">
          Free Forever for Everyone · Optional Ad-Free Plus
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Every essential HelpWorld AI feature—including emergency help, student help, voice,
          translation, and image vision—remains 100% free with zero forced payments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                For Everyone Worldwide
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Free Forever
              </h2>
              <p className="font-mono tabular-nums text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full access to all 14 everyday AI hubs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Offline emergency contacts &amp; accessibility tools</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Supported responsibly by non-intrusive Google AdMob ads</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            Continue Using Free
          </button>
        </div>

        <div className="rounded-2xl border border-sky-500/60 bg-white dark:bg-[#0B1220] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Optional Supporter Tier
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                HelpWorld Plus
              </h2>
              <p className="font-mono tabular-nums text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                $2.99 <span className="text-xs font-normal text-slate-500">/ optional monthly</span>
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Removes all AdMob banners across the entire app</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Helps subsidize free access for students &amp; communities</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Cancel or switch back to Free anytime with 1 tap</span>
              </li>
            </ul>
          </div>

          {user?.isPlus ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => togglePlus(false)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {loading ? 'Updating...' : 'Switch Back to Free (Ad-Supported)'}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => togglePlus(true)}
              className="w-full min-h-[44px] rounded-xl hw-accent-gradient text-white text-sm font-semibold cursor-pointer"
            >
              {loading ? 'Activating...' : user ? 'Enable Optional Ad-Free Preview' : 'Sign Up to Preview Plus'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export const PrivacyPolicyPage: React.FC = () => (
  <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <div className="flex items-center gap-2.5 text-emerald-500">
      <ShieldCheck className="w-6 h-6" />
      <span className="text-xs font-semibold">Privacy &amp; Data Protection</span>
    </div>
    <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
      Privacy Policy – HelpWorld AI
    </h1>
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
      <p>
        <strong>1. Free Access Without Forced Tracking:</strong> Core HelpWorld AI tools work
        without requiring personal registration. When you create an account, we store only your
        display name, email, hashed password, and language/accessibility preferences.
      </p>
      <p>
        <strong>2. Voice &amp; Image Privacy:</strong> Microphone audio and uploaded photos are
        processed strictly to answer your immediate question and are never sold to third parties.
      </p>
      <p>
        <strong>3. Google AdMob Disclosure:</strong> The free tier displays Google AdMob
        advertisements to keep everyday help free worldwide. Optional HelpWorld Plus disables ads
        completely.
      </p>
      <p>
        <strong>4. Your Deletion Rights:</strong> Signed-in users can clear all saved history inside
        the Personalised Dashboard with a single tap.
      </p>
    </div>
  </main>
);

export const TermsPage: React.FC = () => (
  <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
      Terms &amp; Responsible Safety Standards
    </h1>
    <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
      <p>
        <strong>Emergency &amp; Medical Safety:</strong> HelpWorld AI provides general wellness
        education only and does not replace doctors, clinics, or emergency responders. In any life
        or safety emergency, dial 112, 911, 999, or local emergency services immediately.
      </p>
      <p>
        <strong>Honest Career &amp; Financial Guidance:</strong> HelpWorld AI strictly prohibits
        guaranteed income claims, fake job offers, or get-rich-quick schemes. Verify job postings
        on official employer portals and never pay upfront fees for employment.
      </p>
      <p>
        <strong>Legal Information:</strong> Civic and legal explanations are general educational
        summaries and not formal legal representation.
      </p>
    </div>
  </main>
);

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await helpworldApi.submitContact({ name, email, topic, message });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        Contact HelpWorld AI Support
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Need help with accessibility, language support, or feedback? Send us a note below.
      </p>

      {sent ? (
        <div className="rounded-2xl border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/25 p-6 text-sm text-emerald-800 dark:text-emerald-200">
          Thank you! Your message has been received by the HelpWorld AI team.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-6 space-y-4"
        >
          <input
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm"
          />
          <input
            type="email"
            required
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm"
          />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm"
          >
            <option>General Feedback</option>
            <option>Accessibility Request</option>
            <option>Language Support Request</option>
            <option>Safety &amp; Privacy</option>
          </select>
          <textarea
            rows={4}
            required
            minLength={10}
            placeholder="How can we improve HelpWorld AI for you?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#060B15] text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] px-6 py-2.5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Send Message</span>
          </button>
        </form>
      )}
    </main>
  );
};
