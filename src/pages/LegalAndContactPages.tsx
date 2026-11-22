import React, { useState } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';
import { cinnoxApi } from '../lib/cinnoxApi';

export const PrivacyPolicyPage: React.FC = () => (
  <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <header className="border-b border-slate-200 dark:border-indigo-950/70 pb-6">
      <p className="text-xs font-medium text-violet-600 dark:text-violet-300">Legal Notice</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
        Privacy Policy
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        Last updated: November 21, 2026
      </p>
    </header>

    <section className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
        1. Information We Collect
      </h2>
      <p>
        When you create an account on Cinnox, we store your display name, email address, securely
        hashed password, favorite tool selections, and saved AI generations inside our database so
        you can revisit your workspace across sessions.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        2. AI Prompts &amp; Uploaded Media
      </h2>
      <p>
        Prompts, text snippets, and photos submitted to our 15 AI studios are transmitted securely to
        our server-side Gemini API pipeline strictly to generate your requested output. Uploaded
        photos used in the AI Photo Editor and AI Background Remover are processed in memory and are
        not publicly published.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        3. Google AdSense &amp; Advertising Cookies
      </h2>
      <p>
        Cinnox displays responsive Google AdSense advertisements across non-intrusive banner,
        in-feed, and studio sidebar spaces. Google and its partners may use cookies to serve ads
        based on prior visits to this website or other sites on the internet. Users may opt out of
        personalized advertising via Google Ads Settings.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        4. Affiliate Partner Links
      </h2>
      <p>
        Our Recommended Creator Stack includes affiliate links to external software partners.
        Clicking an affiliate link logs an anonymized click count on our platform and may earn
        Cinnox a referral commission at no additional cost to you.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        5. Data Deletion &amp; Contact
      </h2>
      <p>
        You may delete individual generation records directly from your User Dashboard at any time,
        or request full account deletion through our Contact page.
      </p>
    </section>
  </main>
);

export const TermsPage: React.FC = () => (
  <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <header className="border-b border-slate-200 dark:border-indigo-950/70 pb-6">
      <p className="text-xs font-medium text-violet-600 dark:text-violet-300">Legal Agreement</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
        Terms of Service
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        Effective: November 21, 2026
      </p>
    </header>

    <section className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
        1. Acceptable Use
      </h2>
      <p>
        You may use Cinnox’s 15 studios for personal, educational, and commercial creative work.
        You agree not to use the platform to generate unlawful, abusive, infringing, or deceptive
        material, nor attempt to bypass rate limits or scrape automated responses.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        2. Output Ownership &amp; Verification
      </h2>
      <p>
        Subject to underlying model terms, you retain rights to export and use the text, SVG
        illustrations, logos, videos, code, resumes, and audio clips you generate on Cinnox.
        Always review generated code, legal/medical prose, and business name trademarks before
        production or commercial launch.
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white pt-3">
        3. Service Availability
      </h2>
      <p>
        AI features rely on live server-side API connectivity. We strive for fast response times and
        high uptime, and provide real error notices whenever an upstream quota or configuration
        issue occurs rather than displaying synthetic placeholder output.
      </p>
    </section>
  </main>
);

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await cinnoxApi.submitContact({ name, email, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <p className="text-xs font-medium text-violet-600 dark:text-violet-300">Support &amp; Partnerships</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Contact Cinnox
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Questions about our 15 AI studios, ad placements, affiliate partnerships, or your user
            account? Send our team a direct message.
          </p>
          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
              <Mail className="w-4 h-4 text-violet-600 dark:text-violet-300" />
              <span>Direct Inquiries</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Advertising, creator partnerships, and technical support requests are stored directly
              in our support queue.
            </p>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 sm:p-8">
            {submitted ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Message Received
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Thank you for contacting Cinnox. Your inquiry has been logged for review.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    minLength={2}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sponsor placement, feedback, or support"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    minLength={10}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
