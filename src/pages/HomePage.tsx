import React, { useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Heart, Search, X } from 'lucide-react';
import {
  AFFILIATE_PARTNERS,
  AI_TOOLS,
  TOOL_CATEGORIES,
  type ToolCategory,
} from '../data/toolsCatalog';
import { ToolIcon } from '../components/ToolIcon';
import { AdSenseSlot } from '../components/AdSenseSlot';
import { cinnoxApi, type UserProfile } from '../lib/cinnoxApi';

interface HomePageProps {
  onNavigate: (path: string) => void;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  user,
  onUserUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolCategory>('all');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AI_TOOLS.filter((tool) => {
      const catMatch = selectedCategory === 'all' || tool.category === selectedCategory;
      const searchMatch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.categoryLabel.toLowerCase().includes(q) ||
        tool.outputLabel.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [searchQuery, selectedCategory]);

  const handleFavoriteToggle = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const res = await cinnoxApi.toggleFavorite(slug);
      onUserUpdated(res.user);
    } catch {
      // ignore transient error
    }
  };

  return (
    <main className="pb-8">
      {/* Hero Section */}
      <section className="cinnox-hero-mesh border-b border-slate-200/80 dark:border-indigo-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-700 dark:text-violet-300">
                <span>Cinnox Platform</span>
                <span aria-hidden="true">·</span>
                <span>15 Production Studios</span>
                <span aria-hidden="true">·</span>
                <span>Unified Workspace</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-2xl [text-wrap:balance]">
                Fifteen specialized AI studios inside{' '}
                <span className="cinnox-text-gradient">one workspace</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Create vector imagery, brand logos, animated WebM video scenes, studio voiceovers,
                clean source code, tailored resumes, and global translations without switching apps.
              </p>

              {/* Search Bar + Primary CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 15 AI tools (image, logo, video, voice, code...)"
                    aria-label="Search AI tools"
                    className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-300 dark:border-indigo-800/70 bg-white dark:bg-[#0B0E1D] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <a
                  href="#directory"
                  className="h-11 px-5 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
                >
                  <span>Explore All Studios</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 flex">
              <div className="relative w-full min-h-[240px] lg:min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-indigo-900/60 bg-[#0A0C18]">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_cinnox_studio_1795255530135.jpg"
                    alt="Cinnox obsidian and ultraviolet refraction prisms"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full cinnox-hero-mesh flex items-center justify-center p-6 text-center">
                    <span className="font-display text-2xl font-bold cinnox-text-gradient">
                      Cinnox Studio
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
                  <p className="text-xs font-medium text-indigo-200">
                    Visual, Audio, Code &amp; Editorial Workflows
                  </p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    Real-time generation with instant export across 15 tools
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column studio summary row below hero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-200/80 dark:border-indigo-950/60">
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                15
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Dedicated AI tool pages
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                30+
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Global translation languages
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                5
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Studio neural voice personas
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                100%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Real-time API outputs &amp; exports
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Responsive Google AdSense Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <AdSenseSlot variant="banner" pagePath="/" onNavigate={onNavigate} />
      </div>

      {/* 15 AI Tools Directory */}
      <section id="directory" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Complete AI Tool Directory
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select any studio below to launch its dedicated workspace.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter AI tools by category"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0D1020] border border-slate-200 dark:border-indigo-950/70"
          >
            {TOOL_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'cinnox-accent-gradient text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1D] p-12 text-center space-y-3">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              No AI tools matched "{searchQuery}"
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Try searching for image, logo, video, voice, code, resume, or translator.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold cinnox-accent-gradient text-white cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const isFav = Boolean(user?.favoriteTools?.includes(tool.slug));
              const iconTone =
                tool.category === 'visual'
                  ? 'from-violet-600 to-blue-600 text-white'
                  : tool.category === 'writing'
                    ? 'from-indigo-600 to-cyan-500 text-white'
                    : tool.category === 'code_voice'
                      ? 'from-blue-600 to-emerald-500 text-white'
                      : 'from-purple-600 to-pink-500 text-white';

              return (
                <article
                  key={tool.slug}
                  onClick={() => onNavigate(`/tools/${tool.slug}`)}
                  className="group relative rounded-2xl border border-slate-200 dark:border-indigo-900/70 cinnox-card-glow p-5 hover:border-violet-500 dark:hover:border-violet-400 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconTone} flex items-center justify-center shadow-sm`}
                      >
                        <ToolIcon slug={tool.slug} className="w-5 h-5" />
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleFavoriteToggle(e, tool.slug)}
                        aria-label={isFav ? `Remove ${tool.name} from favorites` : `Save ${tool.name} to favorites`}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isFav
                            ? 'text-violet-600 dark:text-violet-400 bg-violet-500/10'
                            : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-300'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="font-mono tabular-nums">
                        {String(tool.id).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{tool.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tool.outputLabel}</span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                      {tool.name}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {tool.tagline}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-indigo-950/60 flex items-center justify-between text-xs font-semibold text-violet-700 dark:text-violet-300">
                    <span>Open Studio</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* In-Feed AdSense Placement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <AdSenseSlot variant="infeed" pagePath="/" onNavigate={onNavigate} />
      </div>

      {/* Curated Studio Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-48 h-48 sm:h-auto shrink-0 bg-[#0A0C18]">
              <img
                src="/src/assets/images/showcase_visual_ai_1795255529935.jpg"
                alt="Precision lenses for Cinnox Photo and Image Studios"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
                  Visual Production Pipeline
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Photo Retouching &amp; Background Matte Extraction
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Upload real photos for multimodal color calibration, live before-and-after inspection,
                  and transparent alpha PNG exports.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/tools/photo-editor')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold cinnox-accent-gradient text-white cursor-pointer"
                >
                  Launch Photo Editor
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/tools/background-remover')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-indigo-800/70 text-slate-700 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                >
                  Remove Backgrounds
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-48 h-48 sm:h-auto shrink-0 bg-[#0A0C18]">
              <img
                src="/src/assets/images/showcase_audio_wave_1795255529986.jpg"
                alt="Studio microphone for Cinnox Voice Generator"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-300">
                  Audio &amp; Motion Synthesis
                </p>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Neural Voiceovers &amp; Animated Video Clips
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Turn written scripts into broadcast-ready WAV speech audio and render 4-scene
                  animated WebM video clips directly in your browser.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/tools/voice-generator')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold cinnox-accent-gradient text-white cursor-pointer"
                >
                  Launch Voice Studio
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/tools/video-generator')}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-indigo-800/70 text-slate-700 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                >
                  Create WebM Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Marketing & Partner Stack Section */}
      <section
        id="partners"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-200 dark:border-indigo-950/70"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Recommended Creator Stack &amp; Partner Offers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Affiliate Disclosure: Cinnox may earn a partner commission when you sign up via
              recommended tools below at no extra cost to you.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AFFILIATE_PARTNERS.map((partner) => (
            <div
              key={partner.slug}
              className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-5 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-300">
                  {partner.category}
                </p>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                  {partner.name}
                </h3>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {partner.offer}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              <a
                href={partner.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={() => cinnoxApi.trackAffiliateClick(partner.slug, partner.name)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-indigo-800/70 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-violet-500 transition-colors"
              >
                <span>{partner.ctaLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
