import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Coins,
} from 'lucide-react';
import { soundFX } from '../utils/sound';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { AdMobNativeCard } from './AdSlots';
import type { AdConsentStatus } from '../types';

interface ClassicSnakeGameProps {
  consent: AdConsentStatus;
  onStatusChange: (isPlaying: boolean) => void;
  onGameEnded: (score: number, durationSeconds: number) => void;
  onWatchPostMatchRewardedAd: () => void;
  onExit: () => void;
}

const GRID_SIZE = 20;
const BEST_SCORE_KEY = 'ludostar_snake_best';

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Point {
  x: number;
  y: number;
}

export function ClassicSnakeGame({
  consent,
  onStatusChange,
  onGameEnded,
  onWatchPostMatchRewardedAd,
  onExit,
}: ClassicSnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY) || '0');
    } catch {
      return 0;
    }
  });
  const [speedMs, setSpeedMs] = useState<number>(130);

  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const dirRef = useRef<Dir>('RIGHT');
  const nextDirRef = useRef<Dir>('RIGHT');
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const scoreRef = useRef<number>(0);
  const startedAtRef = useRef<number>(Date.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Strictly suppress ads while Snake gameplay is active
  useEffect(() => {
    onStatusChange(gameState === 'playing');
    return () => onStatusChange(false);
  }, [gameState, onStatusChange]);

  const spawnFood = useCallback((snake: Point[]): Point => {
    let candidate: Point;
    let tries = 0;
    do {
      candidate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      tries++;
    } while (snake.some((s) => s.x === candidate.x && s.y === candidate.y) && tries < 200);
    return candidate;
  }, []);

  const startGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    snakeRef.current = initialSnake;
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    foodRef.current = spawnFood(initialSnake);
    scoreRef.current = 0;
    startedAtRef.current = Date.now();
    setScore(0);
    setGameState('playing');
  }, [spawnFood]);

  const changeDirection = useCallback((dir: Dir) => {
    const curr = dirRef.current;
    if (
      (dir === 'UP' && curr === 'DOWN') ||
      (dir === 'DOWN' && curr === 'UP') ||
      (dir === 'LEFT' && curr === 'RIGHT') ||
      (dir === 'RIGHT' && curr === 'LEFT')
    ) {
      return;
    }
    nextDirRef.current = dir;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        changeDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        changeDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        setGameState((prev) =>
          prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeDirection]);

  // Draw board on Canvas
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const cell = size / GRID_SIZE;

    ctx.fillStyle = '#081222';
    ctx.fillRect(0, 0, size, size);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }

    // Draw Food (Golden Royal Orb)
    const f = foodRef.current;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(f.x * cell + cell / 2, f.y * cell + cell / 2, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(f.x * cell + cell * 0.42, f.y * cell + cell * 0.42, cell * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Draw Snake
    snakeRef.current.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.fillStyle = isHead ? '#34D399' : '#10B981';
      const pad = isHead ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.roundRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, 6);
      ctx.fill();
    });
  }, []);

  useEffect(() => {
    drawBoard();
  }, [drawBoard, gameState]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const tick = window.setInterval(() => {
      const snake = [...snakeRef.current];
      dirRef.current = nextDirRef.current;
      const head = { ...snake[0] };

      if (dirRef.current === 'UP') head.y -= 1;
      else if (dirRef.current === 'DOWN') head.y += 1;
      else if (dirRef.current === 'LEFT') head.x -= 1;
      else head.x += 1;

      const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
      const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);

      if (hitWall || hitSelf) {
        soundFX.playCapture();
        navigator.vibrate?.([60, 40, 60]);
        setGameState('gameover');
        const finalScore = scoreRef.current;
        if (finalScore > bestScore) {
          setBestScore(finalScore);
          try {
            localStorage.setItem(BEST_SCORE_KEY, String(finalScore));
          } catch {
            // ignore
          }
        }
        const dur = Math.max(3, Math.floor((Date.now() - startedAtRef.current) / 1000));
        onGameEnded(finalScore, dur);
        return;
      }

      snake.unshift(head);
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        soundFX.playGoal();
        navigator.vibrate?.(20);
        foodRef.current = spawnFood(snake);
      } else {
        snake.pop();
      }

      snakeRef.current = snake;
      drawBoard();
    }, speedMs);

    return () => window.clearInterval(tick);
  }, [gameState, speedMs, bestScore, drawBoard, onGameEnded, spawnFood]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0F1E36] border border-white/10 px-4 py-2.5">
        <button
          type="button"
          onClick={onExit}
          className="px-3 py-1.5 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-mono font-bold tabular-nums">
          <span className="text-emerald-400">Score: {score}</span>
          <span className="text-amber-300 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            Best: {bestScore}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#081222] rounded-lg p-1 border border-white/10">
          {[
            { label: 'Chill', ms: 165 },
            { label: 'Classic', ms: 125 },
            { label: 'Turbo', ms: 85 },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSpeedMs(s.ms)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${
                speedMs === s.ms ? 'bg-[#F59E0B] text-[#081222]' : 'text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Arena Grid (2 Columns on Desktop, Compact Board + Touch Controls on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 flex justify-center">
          <div
            className="relative w-full max-w-[460px] aspect-square rounded-2xl bg-[#0B172A] p-2.5 border-2 border-emerald-400/45 shadow-2xl touch-none"
            onTouchStart={(e) => {
              const t = e.touches[0];
              touchStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              if (!touchStartRef.current) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - touchStartRef.current.x;
              const dy = t.clientY - touchStartRef.current.y;
              if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                if (Math.abs(dx) > Math.abs(dy)) {
                  changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
                } else {
                  changeDirection(dy > 0 ? 'DOWN' : 'UP');
                }
              }
              touchStartRef.current = null;
            }}
          >
            <canvas
              ref={canvasRef}
              width={440}
              height={440}
              className="w-full h-full rounded-xl border border-white/10"
            />

            {gameState === 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#081222]/80 rounded-2xl p-6 text-center space-y-4">
                <h2 className="text-2xl font-extrabold text-white">Classic Snake Arcade</h2>
                <p className="text-xs text-slate-300 max-w-xs">
                  Eat golden orbs to grow! Use Arrow Keys, Swipe, or the D-Pad buttons.
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="px-6 py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-extrabold flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Snake Game</span>
                </button>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#081222]/80 rounded-2xl p-6 text-center space-y-4">
                <h2 className="text-2xl font-extrabold text-white">Paused</h2>
                <button
                  type="button"
                  onClick={() => setGameState('playing')}
                  className="px-6 py-3 rounded-xl bg-emerald-500 text-[#081222] text-sm font-extrabold flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Touch D-Pad + Controls */}
        <div className="md:col-span-5 rounded-2xl bg-[#0F1E36] border border-white/10 p-5 flex flex-col items-center space-y-5">
          <div className="w-full flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Controls</h3>
            {gameState === 'playing' && (
              <button
                type="button"
                onClick={() => setGameState('paused')}
                className="px-3 py-1.5 rounded-lg bg-[#162947] text-xs font-semibold text-white flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-44">
            <div />
            <button
              type="button"
              onClick={() => changeDirection('UP')}
              aria-label="Move Up"
              className="h-12 rounded-xl bg-[#162947] active:bg-[#F59E0B] active:text-[#081222] border border-white/10 flex items-center justify-center text-white"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => changeDirection('LEFT')}
              aria-label="Move Left"
              className="h-12 rounded-xl bg-[#162947] active:bg-[#F59E0B] active:text-[#081222] border border-white/10 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => changeDirection('DOWN')}
              aria-label="Move Down"
              className="h-12 rounded-xl bg-[#162947] active:bg-[#F59E0B] active:text-[#081222] border border-white/10 flex items-center justify-center text-white"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => changeDirection('RIGHT')}
              aria-label="Move Right"
              className="h-12 rounded-xl bg-[#162947] active:bg-[#F59E0B] active:text-[#081222] border border-white/10 flex items-center justify-center text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Swipe on the board, use the D-Pad, or Arrow/WASD keys. Score 5+ to earn bonus coins!
          </p>
        </div>
      </div>

      {/* Post-Match Game Over Modal + Ads */}
      {gameState === 'gameover' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0F1E36] border-2 border-amber-400/60 p-6 text-center shadow-2xl space-y-5 my-auto">
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-400">Snake Arcade Finished</p>
              <h2 className="text-3xl font-extrabold text-white tabular-nums">Score: {score}</h2>
              <p className="text-xs text-slate-300 tabular-nums">Best Score: {bestScore}</p>
            </div>

            <button
              type="button"
              onClick={onWatchPostMatchRewardedAd}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Watch Rewarded Ad for +{ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Bonus Coins</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-3 rounded-xl bg-[#162947] hover:bg-[#1E355B] text-white text-sm font-semibold"
              >
                Home
              </button>
              <button
                type="button"
                onClick={startGame}
                className="flex-1 py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-extrabold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>

            <AdMobNativeCard placement="post_match" consent={consent} gameplayActive={false} />
          </div>
        </div>
      )}
    </div>
  );
}
