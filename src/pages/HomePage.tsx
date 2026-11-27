import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  ArrowRight,
  Globe,
  Heart,
  Moon,
  Search,
  Siren,
  Sun,
  X,
} from 'lucide-react';
import {
  GLOBAL_LANGUAGES,
  HELP_HUBS,
  HUB_CATEGORIES,
  UI_COPY,
  type HubCategory,
} from '../data/helpHubs';
import { HelpHubIcon } from '../components/HelpHubIcon';
import { AdMobSlot } from '../components/AdMobSlot';
import { PWAInstallButton } from '../components/PWAAndOffline';
import { helpworldApi, type AccessibilityPrefs, type UserProfile } from '../lib/helpworldApi';

interface HomePageProps {
  language: string;
  onChangeLanguage: (lang: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  accessibility: AccessibilityPrefs;
  onChangeAccessibility: (next: AccessibilityPrefs) => void;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  language,
  onChangeLanguage,
  theme,
  onToggleTheme,
  accessibility,
  onChangeAccessibility,
  user,
  onUserUpdated,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | HubCategory>('all');
  const [heroError, setHeroError] = useState(false);

  const copy = UI_COPY[language] || UI_COPY.English;

  const filteredHubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HELP_HUBS.filter((hub) => {
      const catOk = category === 'all' || hub.category === category;
      const textOk =
        !q ||
        hub.name.toLowerCase().includes(q) ||
        hub.hindiName.toLowerCase().includes(q) ||
        hub.tagline.toLowerCase().includes(q) ||
        hub.categoryLabel.toLowerCase().includes(q);
      return catOk && textOk;
    });
  }, [search, category]);

  const toggleFav = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const res = await helpworldApi.toggleFavorite(slug);
      onUserUpdated(res.user);
    } catch {
      // ignore transient error
    }
  };

  return (
    <main className="pb-8">
      {/* Hero Section */}
      <section className="hw-hero-mesh border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-700 dark:text-sky-300">
                <span>HelpWorld AI</span>
                <span aria-hidden="true">·</span>
                <span>14 Everyday Hubs</span>
                <span aria-hidden="true">·</span>
                <span>Free &amp; Accessible Worldwide</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-2xl [text-wrap:balance]">
                {language === 'Hindi' ? (
                  copy.heroTitle
                ) : (
                  <>
                    One trusted AI app{' '}
                    <span className="hw-text-gradient">for everyone</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                {copy.heroSub}
              </p>

              {/* Search + Primary CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    aria-label="Search HelpWorld modules"
                    className="w-full h-12 pl-10 pr-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1220] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('/hub/assistant')}
                  className="min-h-[48px] px-5 rounded-xl hw-accent-gradient text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{copy.openAssistant}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Language, Theme, Accessibility & Android Install Strip */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220]">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  <select
                    aria-label="Select global language"
                    value={language}
                    onChange={(e) => onChangeLanguage(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    {GLOBAL_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-white dark:bg-[#0B1220]">
                        {l.label} ({l.native})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 hover:border-sky-500 whitespace-nowrap cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeAccessibility({
                      ...accessibility,
                      textScale:
                        accessibility.textScale === 'normal'
                          ? 'lg'
                          : accessibility.textScale === 'lg'
                            ? 'xl'
                            : 'normal',
                    })
                  }
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 hover:border-sky-500 whitespace-nowrap cursor-pointer"
                >
                  <Accessibility className="w-4 h-4 text-emerald-500" />
                  <span>
                    Text: {accessibility.textScale === 'normal' ? '100%' : accessibility.textScale === 'lg' ? '115%' : '125%'}
                  </span>
                </button>

                <PWAInstallButton />
              </div>
            </div>

            <div className="lg:col-span-5 flex">
              <div className="relative w-full min-h-[240px] lg:min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0A1322]">
                {!heroError ? (
                  <img
                    src="/src/assets/images/hero_helpworld_globe_1795768851651.jpg"
                    alt="HelpWorld AI global pavilion in cyan and emerald daylight"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full hw-hero-mesh flex items-center justify-center p-6">
                    <span className="font-display text-2xl font-bold hw-text-gradient">
                      HelpWorld AI
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                  <p className="text-xs font-medium text-sky-200">
                    Voice, Vision, Translation &amp; Everyday Guidance
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    Accessible on Android, mobile browsers, and desktop
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column summary bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800/70">
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                14
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Dedicated AI assistance hubs
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                30+
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Hindi, English &amp; world languages
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                $0
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Free everyday core help for everyone
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                24/7
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Offline-ready SOS contact directory
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Quick Access Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <button
          type="button"
          onClick={() => onNavigate('/hub/emergency')}
          className="w-full rounded-2xl border border-red-300/80 dark:border-red-900/70 bg-red-50/80 dark:bg-red-950/25 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:border-red-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Siren className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200">
              {copy.emergencyBanner}
            </span>
          </div>
          <span className="text-xs font-bold text-red-700 dark:text-red-300 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
            <span>Open Emergency Help</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Top Google AdMob Banner Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <AdMobSlot
          variant="banner"
          pagePath="/"
          isPlusUser={user?.isPlus}
          onOpenPlus={() => onNavigate('/plus')}
        />
      </div>

      {/* 14 HelpWorld Modules Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Choose How We Can Help Today
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Tap any card to open its AI hub with voice input, read-aloud audio, and saved history.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter help hubs"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800"
          >
            {HUB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat.id
                    ? 'hw-accent-gradient text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredHubs.map((hub) => {
            const isFav = Boolean(user?.favoriteHubs?.includes(hub.slug));
            const iconTone =
              hub.slug === 'emergency'
                ? 'from-red-600 to-rose-500 text-white'
                : hub.category === 'care_safety'
                  ? 'from-emerald-600 to-teal-500 text-white'
                  : hub.category === 'growth'
                    ? 'from-sky-600 to-blue-600 text-white'
                    : 'from-cyan-600 to-emerald-500 text-white';

            return (
              <article
                key={hub.slug}
                onClick={() => onNavigate(`/hub/${hub.slug}`)}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 hover:border-sky-500 dark:hover:border-sky-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconTone} flex items-center justify-center shadow-sm`}
                    >
                      <HelpHubIcon slug={hub.slug} className="w-5 h-5" />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFav(e, hub.slug)}
                      aria-label={isFav ? `Remove ${hub.name} from favorites` : `Save ${hub.name} to favorites`}
                      className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                        isFav
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10'
                          : 'text-slate-400 hover:text-sky-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-mono tabular-nums">{String(hub.id).padStart(2, '0')}</span>
                    <span aria-hidden="true">·</span>
                    <span>{hub.categoryLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{hub.capabilityLabel}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                    {language === 'Hindi' ? hub.hindiName : hub.name}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {hub.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <span>Open Hub</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Native AdMob Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <AdMobSlot
          variant="native"
          pagePath="/"
          isPlusUser={user?.isPlus}
          onOpenPlus={() => onNavigate('/plus')}
        />
      </div>

      {/* Editorial Feature Spotlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-48 h-48 sm:h-auto shrink-0 bg-slate-900">
              <img
                src="/src/assets/images/feature_health_wellness_1795768851576.jpg"
                alt="Healthy lifestyle notebook and wellness kit"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Trusted Health &amp; Crisis Guidance
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Responsible Wellness &amp; Emergency Direction
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Learn healthy routines and nutrition basics safely, with clear medical disclaimers
                  and instant redirection to local emergency numbers whenever danger is detected.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/hub/health')}
                  className="min-h-[40px] px-4 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold cursor-pointer"
                >
                  Health Guidance
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/hub/emergency')}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-red-500 cursor-pointer"
                >
                  Emergency SOS
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-48 h-48 sm:h-auto shrink-0 bg-slate-900">
              <img
                src="/src/assets/images/feature_study_career_1795768852492.jpg"
                alt="Study and small business desk workspace"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  Education, Work &amp; Financial Literacy
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Honest Career Support Without Fake Promises
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Prepare for exams, spot fraudulent job listings, build realistic small business
                  plans, and practice monthly 50/30/20 budgeting.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/hub/student')}
                  className="min-h-[40px] px-4 py-2 rounded-xl hw-accent-gradient text-white text-xs font-semibold cursor-pointer"
                >
                  Student Help
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/hub/jobs')}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500 cursor-pointer"
                >
                  Verified Job Finder
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
