import React from 'react';
import { ArrowLeft, Globe, Heart } from 'lucide-react';
import { GLOBAL_LANGUAGES, HELP_HUBS, type HelpHubMeta } from '../data/helpHubs';
import { HelpHubIcon } from '../components/HelpHubIcon';
import { AdMobSlot } from '../components/AdMobSlot';
import { GeneralHelpHub } from '../modules/GeneralHelpHub';
import { EmergencyHub } from '../modules/EmergencyHub';
import { MoneyEducationHub, TranslationHub } from '../modules/MoneyAndTranslateHubs';
import {
  GlobalLanguageAndAccessibilityHub,
  ImageAiHub,
  VoiceAssistantHub,
} from '../modules/VoiceImageLanguageHubs';
import { helpworldApi, type AccessibilityPrefs, type UserProfile } from '../lib/helpworldApi';

interface HubWorkspacePageProps {
  hub: HelpHubMeta;
  language: string;
  onChangeLanguage: (lang: string) => void;
  ttsVoice: string;
  onChangeVoice: (voice: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  accessibility: AccessibilityPrefs;
  onChangeAccessibility: (next: AccessibilityPrefs) => void;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  onNavigate: (path: string) => void;
}

export const HubWorkspacePage: React.FC<HubWorkspacePageProps> = ({
  hub,
  language,
  onChangeLanguage,
  ttsVoice,
  onChangeVoice,
  theme,
  onToggleTheme,
  accessibility,
  onChangeAccessibility,
  user,
  onUserUpdated,
  onNavigate,
}) => {
  const isFav = Boolean(user?.favoriteHubs?.includes(hub.slug));

  const toggleFav = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const res = await helpworldApi.toggleFavorite(hub.slug);
      onUserUpdated(res.user);
    } catch {
      // ignore
    }
  };

  const relatedHubs = HELP_HUBS.filter(
    (h) => h.category === hub.category && h.slug !== hub.slug
  ).slice(0, 4);

  const renderModule = () => {
    switch (hub.slug) {
      case 'emergency':
        return <EmergencyHub language={language} ttsVoice={ttsVoice} />;
      case 'money':
        return <MoneyEducationHub language={language} ttsVoice={ttsVoice} />;
      case 'translate':
        return <TranslationHub ttsVoice={ttsVoice} />;
      case 'voice':
        return <VoiceAssistantHub language={language} ttsVoice={ttsVoice} />;
      case 'image':
        return <ImageAiHub language={language} ttsVoice={ttsVoice} />;
      case 'languages':
        return (
          <GlobalLanguageAndAccessibilityHub
            language={language}
            onChangeLanguage={onChangeLanguage}
            ttsVoice={ttsVoice}
            onChangeVoice={onChangeVoice}
            theme={theme}
            onToggleTheme={onToggleTheme}
            accessibility={accessibility}
            onChangeAccessibility={onChangeAccessibility}
          />
        );
      default:
        return (
          <GeneralHelpHub
            hub={hub}
            language={language}
            ttsVoice={ttsVoice}
            onNavigate={onNavigate}
          />
        );
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All 14 Hubs</span>
            </button>
            <span aria-hidden="true">/</span>
            <span>{hub.categoryLabel}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 dark:text-white font-semibold">{hub.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl hw-accent-gradient text-white flex items-center justify-center shrink-0">
              <HelpHubIcon slug={hub.slug} className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {language === 'Hindi' ? hub.hindiName : hub.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{hub.tagline}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220]">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <select
              aria-label="Response language"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-[#0B1220]">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={toggleFav}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              isFav
                ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
            <span>{isFav ? 'Pinned' : 'Pin Hub'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-9 min-w-0">{renderModule()}</div>

        <aside className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] p-5 space-y-3">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Related Help Hubs
            </h2>
            <div className="space-y-1.5">
              {relatedHubs.map((rel) => (
                <button
                  key={rel.slug}
                  type="button"
                  onClick={() => onNavigate(`/hub/${rel.slug}`)}
                  className="w-full min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-left transition-colors cursor-pointer"
                >
                  <HelpHubIcon slug={rel.slug} className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {rel.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <AdMobSlot
        variant="banner"
        pagePath={`/hub/${hub.slug}`}
        isPlusUser={user?.isPlus}
        onOpenPlus={() => onNavigate('/plus')}
      />
    </main>
  );
};
