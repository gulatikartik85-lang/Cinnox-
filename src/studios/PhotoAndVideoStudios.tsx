import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, RotateCcw, Upload } from 'lucide-react';
import { cinnoxApi } from '../lib/cinnoxApi';
import { sanitizeSvgMarkup } from '../utils/svgHelpers';

function readFileAsBase64(file: File): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const parts = dataUrl.split(',');
      resolve({
        dataUrl,
        base64: parts[1] || '',
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded image'));
    reader.readAsDataURL(file);
  });
}

// 5. AI Photo Editor Studio
export const PhotoEditorStudio: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [instruction, setInstruction] = useState('Cinematic purple-blue twilight mood with crisp contrast');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [critique, setCritique] = useState('');
  const [presetTitle, setPresetTitle] = useState('');
  const [compareSplit, setCompareSplit] = useState(100);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [tintHex, setTintHex] = useState('#6D28D9');
  const [tintOpacity, setTintOpacity] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const loaded = await readFileAsBase64(file);
      setImageUrl(loaded.dataUrl);
      setImageBase64(loaded.base64);
      setMimeType(loaded.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image');
    }
  };

  const handleAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBase64) {
      setError('Please upload a photo first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await cinnoxApi.editPhoto({ imageBase64, mimeType, instruction });
      setPresetTitle(res.presetTitle);
      setCritique(res.critique);
      setBrightness(Math.min(180, Math.max(50, res.brightness)));
      setContrast(Math.min(180, Math.max(50, res.contrast)));
      setSaturate(Math.min(200, Math.max(0, res.saturate)));
      setHueRotate(Math.min(180, Math.max(-180, res.hueRotate)));
      setSepia(Math.min(100, Math.max(0, res.sepia)));
      setVignette(Math.min(85, Math.max(0, res.vignette)));
      setTintHex(res.tintHex || '#6D28D9');
      setTintOpacity(Math.min(0.45, Math.max(0, res.tintOpacity)));
      setCompareSplit(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo editing failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxW = 1200;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      // Draw original on full canvas
      ctx.filter = 'none';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Clip right/left split based on compareSplit%
      const splitX = Math.round((canvas.width * compareSplit) / 100);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, canvas.height);
      ctx.clip();

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      if (tintOpacity > 0) {
        ctx.globalAlpha = tintOpacity;
        ctx.fillStyle = tintHex;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }

      if (vignette > 0) {
        const rad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.25,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.72
        );
        rad.addColorStop(0, 'rgba(0,0,0,0)');
        rad.addColorStop(1, `rgba(0,0,0,${(vignette / 100).toFixed(2)})`);
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
    };
    img.src = imageUrl;
  }, [imageUrl, brightness, contrast, saturate, hueRotate, sepia, vignette, tintHex, tintOpacity, compareSplit]);

  const exportFullImage = () => {
    if (!imageUrl) return;
    const prev = compareSplit;
    setCompareSplit(100);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const a = document.createElement('a');
      a.download = 'cinnox-edited-photo.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      setCompareSplit(prev);
    }, 80);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAiEdit}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            1. Upload Photo (JPG, PNG, WebP)
          </label>
          <label className="flex items-center justify-center gap-2.5 h-24 rounded-xl border border-dashed border-slate-300 dark:border-indigo-800/80 bg-slate-50 dark:bg-[#070913] hover:border-violet-500 cursor-pointer transition-colors text-xs font-medium text-slate-600 dark:text-slate-300">
            <Upload className="w-4 h-4 text-violet-600 dark:text-violet-300" />
            <span>{imageUrl ? 'Replace Uploaded Photo' : 'Click to Upload Photo From Your Device'}</span>
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
        </div>

        <div>
          <label
            htmlFor="edit-inst"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            2. Describe How AI Should Retouch This Photo
          </label>
          <input
            id="edit-inst"
            type="text"
            required
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'Cinema Violet & Blue Grade',
              'Warm Golden Hour Glow',
              'Crisp Monochrome Noir',
              'Bright Clean Product Shot',
            ].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInstruction(p)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-[11px] text-slate-600 dark:text-slate-300 hover:border-violet-500 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !imageUrl}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Analyzing & Grading...' : 'Apply AI Photo Edit'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {presetTitle || 'Live Canvas Retouch Studio'}
              </h2>
              {critique && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{critique}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturate(100);
                  setHueRotate(0);
                  setSepia(0);
                  setVignette(0);
                  setTintOpacity(0);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={exportFullImage}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG</span>
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full max-h-[480px] object-contain rounded-xl border border-slate-200 dark:border-indigo-900/60 bg-[#070913]"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
            <label className="space-y-1">
              <span className="text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Before / After Split</span>
                <span className="font-mono">{compareSplit}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={compareSplit}
                onChange={(e) => setCompareSplit(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Brightness</span>
                <span className="font-mono">{brightness}%</span>
              </span>
              <input
                type="range"
                min={50}
                max={160}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Contrast</span>
                <span className="font-mono">{contrast}%</span>
              </span>
              <input
                type="range"
                min={60}
                max={175}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Saturation</span>
                <span className="font-mono">{saturate}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={saturate}
                onChange={(e) => setSaturate(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// 6. AI Background Remover Studio
export const BackgroundRemoverStudio: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<{
    subjectLabel: string;
    backgroundDescription: string;
    strategy: string;
    bgRed: number;
    bgGreen: number;
    bgBlue: number;
    confidenceNote: string;
  } | null>(null);
  const [tolerance, setTolerance] = useState(42);
  const [backdrop, setBackdrop] = useState<'transparent' | 'obsidian' | 'gradient' | 'white'>('transparent');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setAnalysis(null);
    try {
      const loaded = await readFileAsBase64(file);
      setImageUrl(loaded.dataUrl);
      setImageBase64(loaded.base64);
      setMimeType(loaded.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image');
    }
  };

  const handleRemove = async () => {
    if (!imageBase64) return;
    setError('');
    setLoading(true);
    try {
      const res = await cinnoxApi.analyzeBackgroundRemove({ imageBase64, mimeType });
      setAnalysis(res);
      setTolerance(Math.min(95, Math.max(15, res.recommendedTolerance)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl || !analysis) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      const scale = Math.max(img.width, img.height) > maxDim ? maxDim / Math.max(img.width, img.height) : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const frame = ctx.getImageData(0, 0, w, h);
      const data = frame.data;
      const targetR = analysis.bgRed;
      const targetG = analysis.bgGreen;
      const targetB = analysis.bgBlue;
      const maxDist = tolerance * 2.2;

      const dist = (idx: number) => {
        const dr = data[idx] - targetR;
        const dg = data[idx + 1] - targetG;
        const db = data[idx + 2] - targetB;
        return Math.sqrt(dr * dr + dg * dg + db * db);
      };

      if (analysis.strategy === 'global-chroma') {
        for (let i = 0; i < data.length; i += 4) {
          const d = dist(i);
          if (d < maxDist) {
            const alphaRatio = Math.max(0, (d - maxDist * 0.65) / (maxDist * 0.35));
            data[i + 3] = d < maxDist * 0.65 ? 0 : Math.round(data[i + 3] * alphaRatio);
          }
        }
      } else {
        // Border-seeded BFS matte extraction preserving interior foreground pixels
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const pushIfBg = (x: number, y: number) => {
          const pos = y * w + x;
          if (visited[pos]) return;
          visited[pos] = 1;
          const pIdx = pos * 4;
          if (dist(pIdx) <= maxDist) {
            queue[tail++] = pos;
          }
        };

        for (let x = 0; x < w; x++) {
          pushIfBg(x, 0);
          pushIfBg(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushIfBg(0, y);
          pushIfBg(w - 1, y);
        }

        while (head < tail) {
          const pos = queue[head++];
          const pIdx = pos * 4;
          data[pIdx + 3] = 0;
          const x = pos % w;
          const y = (pos - x) / w;
          if (x > 0) pushIfBg(x - 1, y);
          if (x < w - 1) pushIfBg(x + 1, y);
          if (y > 0) pushIfBg(x, y - 1);
          if (y < h - 1) pushIfBg(x, y + 1);
        }
      }

      ctx.putImageData(frame, 0, 0);
    };
    img.src = imageUrl;
  }, [imageUrl, analysis, tolerance]);

  const exportTransparentPng = () => {
    const srcCanvas = canvasRef.current;
    if (!srcCanvas) return;

    const out = document.createElement('canvas');
    out.width = srcCanvas.width;
    out.height = srcCanvas.height;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    if (backdrop === 'obsidian') {
      ctx.fillStyle = '#070913';
      ctx.fillRect(0, 0, out.width, out.height);
    } else if (backdrop === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, out.width, out.height);
    } else if (backdrop === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, out.width, out.height);
      grad.addColorStop(0, '#5B21B6');
      grad.addColorStop(1, '#1D4ED8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, out.width, out.height);
    }

    ctx.drawImage(srcCanvas, 0, 0);
    const a = document.createElement('a');
    a.download = 'cinnox-background-removed.png';
    a.href = out.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
        <label className="flex items-center justify-center gap-2.5 h-28 rounded-xl border border-dashed border-slate-300 dark:border-indigo-800/80 bg-slate-50 dark:bg-[#070913] hover:border-violet-500 cursor-pointer transition-colors text-xs font-medium text-slate-600 dark:text-slate-300">
          <Upload className="w-4 h-4 text-violet-600 dark:text-violet-300" />
          <span>{imageUrl ? 'Upload Another Image' : 'Select Image to Extract Foreground Subject'}</span>
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>

        <button
          type="button"
          onClick={handleRemove}
          disabled={loading || !imageUrl}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Segmenting Subject...' : 'Remove Background'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Extracted Subject: {analysis.subjectLabel}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {analysis.backgroundDescription} · {analysis.confidenceNote}
              </p>
            </div>
            <button
              type="button"
              onClick={exportTransparentPng}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>

          <div
            className={`rounded-xl overflow-hidden border border-slate-200 dark:border-indigo-900/60 flex items-center justify-center p-4 ${
              backdrop === 'transparent'
                ? 'checkerboard-alpha'
                : backdrop === 'obsidian'
                  ? 'bg-[#070913]'
                  : backdrop === 'white'
                    ? 'bg-white'
                    : 'cinnox-accent-gradient'
            }`}
          >
            <canvas ref={canvasRef} className="max-h-[440px] max-w-full object-contain" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <label className="space-y-1 text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Edge Sensitivity Tolerance</span>
                <span className="font-mono">{tolerance}</span>
              </span>
              <input
                type="range"
                min={12}
                max={105}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </label>

            <div className="flex flex-wrap gap-2 text-xs">
              {(
                [
                  { id: 'transparent', label: 'Transparent' },
                  { id: 'obsidian', label: 'Dark Obsidian' },
                  { id: 'gradient', label: 'Purple-Blue' },
                  { id: 'white', label: 'Pure White' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBackdrop(b.id)}
                  className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
                    backdrop === b.id
                      ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-indigo-900/70 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 7. AI Video Generator Studio (Real Storyboard + Animated Canvas + Downloadable WebM Recording)
export const VideoGeneratorStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'A lone spacecraft gliding above glowing violet rings of an alien planet toward a blue star'
  );
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [mood, setMood] = useState('Epic Sci-Fi Cinema');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [storyboard, setStoryboard] = useState<{
    title: string;
    narrativeSummary: string;
    scenes: Array<{
      sceneNumber: number;
      durationSec: number;
      caption: string;
      cameraMotion: string;
      accentColor: string;
      svgScene: string;
    }>;
  } | null>(null);

  const [playing, setPlaying] = useState(true);
  const [webmUrl, setWebmUrl] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);

  const width = aspectRatio === '9:16' ? 540 : aspectRatio === '1:1' ? 720 : 960;
  const height = aspectRatio === '9:16' ? 960 : aspectRatio === '1:1' ? 720 : 540;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWebmUrl('');
    setLoading(true);
    try {
      const data = await cinnoxApi.generateVideoStoryboard({ prompt, aspectRatio, mood });
      setStoryboard(data);
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video storyboard generation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!storyboard?.scenes?.length) return;
    let cancelled = false;
    let rafId = 0;

    const preload = async () => {
      const imgs = await Promise.all(
        storyboard.scenes.map(
          (scene) =>
            new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              const clean = sanitizeSvgMarkup(scene.svgScene);
              const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(img);
              };
              img.src = url;
            })
        )
      );
      if (cancelled) return;
      loadedImagesRef.current = imgs;

      const totalSec = storyboard.scenes.reduce((acc, s) => acc + Math.max(2, s.durationSec), 0);
      const startTime = performance.now();

      const drawFrame = (now: number) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const elapsedSec = playing ? ((now - startTime) / 1000) % totalSec : 0;
        let accum = 0;
        let sceneIdx = 0;
        let localProgress = 0;

        for (let i = 0; i < storyboard.scenes.length; i++) {
          const d = Math.max(2, storyboard.scenes[i].durationSec);
          if (elapsedSec <= accum + d || i === storyboard.scenes.length - 1) {
            sceneIdx = i;
            localProgress = Math.min(1, Math.max(0, (elapsedSec - accum) / d));
            break;
          }
          accum += d;
        }

        const scene = storyboard.scenes[sceneIdx];
        const img = loadedImagesRef.current[sceneIdx];

        ctx.fillStyle = '#06070E';
        ctx.fillRect(0, 0, width, height);

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          let scale = 1.06;
          let tx = 0;
          let ty = 0;
          if (scene.cameraMotion === 'zoom-in') {
            scale = 1 + localProgress * 0.14;
          } else if (scene.cameraMotion === 'zoom-out') {
            scale = 1.14 - localProgress * 0.12;
          } else if (scene.cameraMotion === 'pan-left') {
            scale = 1.12;
            tx = (0.5 - localProgress) * width * 0.08;
          } else {
            scale = 1.12;
            tx = (localProgress - 0.5) * width * 0.08;
          }
          ctx.translate(width / 2 + tx, height / 2 + ty);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();
        }

        // Caption bar overlay
        const barGrad = ctx.createLinearGradient(0, height - 130, 0, height);
        barGrad.addColorStop(0, 'rgba(6,7,14,0)');
        barGrad.addColorStop(1, 'rgba(6,7,14,0.88)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, height - 130, width, 130);

        ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.fillText(scene.caption, width / 2, height - 38);

        // Progress bar
        ctx.fillStyle = scene.accentColor || '#7C3AED';
        ctx.fillRect(0, height - 4, width * (elapsedSec / totalSec), 4);

        if (playing) {
          rafId = requestAnimationFrame(drawFrame);
        }
      };

      rafId = requestAnimationFrame(drawFrame);
    };

    preload();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [storyboard, playing, width, height]);

  const exportWebmVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || !storyboard || typeof MediaRecorder === 'undefined') {
      setError('Your browser does not support WebM canvas recording.');
      return;
    }
    setPlaying(true);
    setRecording(true);
    setWebmUrl('');
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setWebmUrl(url);
      setRecording(false);
    };
    const totalMs = Math.min(
      14000,
      Math.round(storyboard.scenes.reduce((a, s) => a + Math.max(2, s.durationSec), 0) * 1000)
    );
    recorder.start();
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, totalMs);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4"
      >
        <div>
          <label
            htmlFor="vid-prompt"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Video Scene Prompt
          </label>
          <textarea
            id="vid-prompt"
            rows={3}
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="vid-ratio"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Video Aspect Ratio
            </label>
            <select
              id="vid-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Shorts / Reels</option>
              <option value="1:1">1:1 Square Feed</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="vid-mood"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Visual Pacing &amp; Mood
            </label>
            <input
              id="vid-mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-indigo-900/70 bg-slate-50 dark:bg-[#070913] text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-6 rounded-xl cinnox-accent-gradient text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Generating 4-Scene Video...' : 'Generate Animated Video'}</span>
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-900/70 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {storyboard && (
        <div className="rounded-2xl border border-slate-200 dark:border-indigo-950/70 bg-white dark:bg-[#0B0E1C] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {storyboard.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {storyboard.narrativeSummary}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-indigo-900/70 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{playing ? 'Pause' : 'Play'}</span>
              </button>
              <button
                type="button"
                onClick={exportWebmVideo}
                disabled={recording}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg cinnox-accent-gradient text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {recording ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{recording ? 'Encoding WebM...' : 'Record & Download WebM'}</span>
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full max-h-[460px] object-contain rounded-xl border border-slate-200 dark:border-indigo-900/60 bg-[#06070E]"
          />

          {webmUrl && (
            <div className="pt-2 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs">
              <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                WebM video clip encoded and ready.
              </span>
              <a
                href={webmUrl}
                download="cinnox-ai-video.webm"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
              >
                Save .webm File
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
