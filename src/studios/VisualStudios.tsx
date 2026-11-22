import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { cinnoxApi } from '../lib/cinnoxApi';
import { downloadSvgAsPng, downloadSvgFile, sanitizeSvgMarkup, svgToDataUrl } from '../utils/svgHelpers';

// 1. AI Image Generator Studio
export const ImageGeneratorStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'A futuristic glass observatory overlooking cosmic purple and cobalt auroras over dark basalt mountains'
  );
  const [style, setStyle] = useState('Cinematic Vector Illustration');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    title: string;
    enhancedPrompt: string;
    palette: string[];
    compositionNotes: string;
    svg: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.generateImage({ prompt, style, aspectRatio });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const ratioSize =
    aspectRatio === '16:9'
      ? { w: 1280, h: 720 }
      : aspectRatio === '4:3'
        ? { w: 1024, h: 768 }
        : aspectRatio === '9:16'
          ? { w: 720, h: 1280 }
          : { w: 1024, h: 1024 };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="img-prompt"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Describe Your Artwork
          </label>
          <textarea
            id="img-prompt"
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe subject, lighting, mood, and setting..."
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="img-style"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Art Style
            </label>
            <select
              id="img-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Cinematic Vector Illustration</option>
              <option>Minimalist Geometric</option>
              <option>Editorial Poster Art</option>
              <option>Isometric Sci-Fi Architecture</option>
              <option>Botanical &amp; Organic</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="img-ratio"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Aspect Ratio
            </label>
            <select
              id="img-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option value="16:9">16:9 Widescreen</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Classic</option>
              <option value="9:16">9:16 Vertical</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>{loading ? 'Synthesizing Artwork...' : 'Generate Artwork'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {result.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {result.compositionNotes}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadSvgFile(result.svg, `cinnox-${result.title.toLowerCase().replace(/\W+/g, '-')}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-indigo-800/70 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-violet-500 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SVG</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadSvgAsPng(
                    result.svg,
                    `cinnox-${result.title.toLowerCase().replace(/\W+/g, '-')}`,
                    ratioSize.w,
                    ratioSize.h
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-indigo-900/60 bg-[#070913] flex items-center justify-center">
            <img
              src={svgToDataUrl(result.svg)}
              alt={result.title}
              className="max-h-[520px] w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">Palette:</span>
            {result.palette.map((hex, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 font-mono">
                <span
                  className="w-3.5 h-3.5 rounded-sm border border-white/20 inline-block"
                  style={{ backgroundColor: hex }}
                />
                {hex}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 2. AI Logo Maker Studio
export const LogoMakerStudio: React.FC = () => {
  const initialBrand =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('brand') || 'NovaPulse'
      : 'NovaPulse';
  const [brandName, setBrandName] = useState(initialBrand);
  const [tagline, setTagline] = useState('Intelligent Cloud Systems');
  const [industry, setIndustry] = useState('Technology & AI');
  const [style, setStyle] = useState('Minimalist Geometric');
  const [colorMood, setColorMood] = useState('Obsidian, Purple & Electric Blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [concepts, setConcepts] = useState<
    Array<{
      conceptName: string;
      styleTag: string;
      rationale: string;
      palette: string[];
      fontPairing: string;
      svg: string;
    }>
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.makeLogos({
        brandName,
        tagline,
        industry,
        style,
        colorMood,
      });
      setConcepts(data.concepts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo generation failed');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="logo-brand"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Brand Name
            </label>
            <input
              id="logo-brand"
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="logo-tagline"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tagline (Optional)
            </label>
            <input
              id="logo-tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="logo-industry"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Industry
            </label>
            <input
              id="logo-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="logo-style"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Logo Style
            </label>
            <select
              id="logo-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Minimalist Geometric</option>
              <option>Monogram &amp; Lettermark</option>
              <option>Abstract Tech Prism</option>
              <option>Luxury Crest Emblem</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="logo-color"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Color Mood
            </label>
            <input
              id="logo-color"
              type="text"
              value={colorMood}
              onChange={(e) => setColorMood(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95 disabled:opacity-60 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Designing 3 Concepts...' : 'Generate 3 Logo Concepts'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {concepts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {concepts.map((c, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-4 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-indigo-900/60 bg-[#070913] aspect-[4/3] flex items-center justify-center">
                  <img
                    src={svgToDataUrl(c.svg)}
                    alt={`${brandName} ${c.conceptName}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs text-violet-600 dark:text-violet-300 font-medium">
                    {c.styleTag} · {c.fontPairing}
                  </p>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {c.conceptName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {c.rationale}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-indigo-950/60">
                <button
                  type="button"
                  onClick={() => downloadSvgFile(c.svg, `${brandName}-logo-${idx + 1}`)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-indigo-800/70 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-violet-500 cursor-pointer"
                >
                  Export SVG
                </button>
                <button
                  type="button"
                  onClick={() => downloadSvgAsPng(c.svg, `${brandName}-logo-${idx + 1}`, 1200, 900)}
                  className="flex-1 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
                >
                  Export PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 13. AI Thumbnail Maker Studio (1280x720 HD Canvas Compositor)
export const ThumbnailMakerStudio: React.FC = () => {
  const [videoTitle, setVideoTitle] = useState('How I Automated My Entire Workflow With AI');
  const [niche, setNiche] = useState('Tech & AI Tutorials');
  const [visualTheme, setVisualTheme] = useState('Electric Purple & Blue Cinematic');
  const [badgeText, setBadgeText] = useState('2026 GUIDE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [headline, setHeadline] = useState('15X FASTER AI');
  const [subBadge, setSubBadge] = useState('2026 GUIDE');
  const [accentColor, setAccentColor] = useState('#7C3AED');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [ctrAnalysis, setCtrAnalysis] = useState('');
  const [svgBackdrop, setSvgBackdrop] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await cinnoxApi.makeThumbnail({
        videoTitle,
        niche,
        visualTheme,
        badgeText,
      });
      setHeadline(data.hookHeadline);
      setSubBadge(data.subBadge);
      setAccentColor(data.accentColor || '#7C3AED');
      setTextColor(data.textColor || '#FFFFFF');
      setCtrAnalysis(data.ctrAnalysis);
      setSvgBackdrop(data.svgBackdrop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thumbnail generation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !svgBackdrop) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cleanSvg = sanitizeSvgMarkup(svgBackdrop);
    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, 1280, 720);
      ctx.drawImage(img, 0, 0, 1280, 720);

      // Contrast scrim on left third for crisp CTR legibility
      const grad = ctx.createLinearGradient(0, 0, 900, 0);
      grad.addColorStop(0, 'rgba(6, 7, 14, 0.86)');
      grad.addColorStop(0.6, 'rgba(6, 7, 14, 0.45)');
      grad.addColorStop(1, 'rgba(6, 7, 14, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Callout badge
      if (subBadge.trim()) {
        ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
        const padX = 24;
        const textW = ctx.measureText(subBadge.toUpperCase()).width;
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(72, 130, textW + padX * 2, 52, 12);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(subBadge.toUpperCase(), 72 + padX, 166);
      }

      // Multi-line bold headline
      ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 20;

      const words = headline.trim().split(/\s+/);
      const lines: string[] = [];
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > 720 && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      lines.slice(0, 4).forEach((line, i) => {
        ctx.fillText(line, 72, 285 + i * 98);
      });
      ctx.shadowBlur = 0;

      URL.revokeObjectURL(url);
    };

    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [svgBackdrop, headline, subBadge, accentColor, textColor]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'cinnox-thumbnail-1280x720.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="thumb-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Video Title / Topic
            </label>
            <input
              id="thumb-title"
              type="text"
              required
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="thumb-niche"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Channel Niche
            </label>
            <input
              id="thumb-niche"
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="thumb-theme"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Visual Mood
            </label>
            <select
              id="thumb-theme"
              value={visualTheme}
              onChange={(e) => setVisualTheme(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option>Electric Purple &amp; Blue Cinematic</option>
              <option>Dark Studio High Contrast</option>
              <option>Bold Editorial Creator</option>
              <option>Minimalist Blueprint Grid</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Composing Thumbnail...' : 'Generate 1280×720 Thumbnail'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {svgBackdrop && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Live 1280×720 HD Thumbnail Canvas
            </h2>
            <button
              type="button"
              onClick={downloadPng}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 1280×720 PNG</span>
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full rounded-xl border border-slate-200 dark:border-indigo-900/60 bg-[#06070E]"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Edit Overlay Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Edit Badge Text
              </label>
              <input
                type="text"
                value={subBadge}
                onChange={(e) => setSubBadge(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Accent Color
              </label>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-full h-9 p-1 rounded-lg border border-slate-200 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] cursor-pointer"
              />
            </div>
          </div>

          {ctrAnalysis && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-white">CTR Tip:</strong> {ctrAnalysis}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
