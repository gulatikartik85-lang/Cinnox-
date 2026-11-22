import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Crown,
  RotateCcw,
  Volume2,
  VolumeX,
  Coins,
  Bot,
  Users,
} from 'lucide-react';
import { soundFX } from '../utils/sound';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { AdMobNativeCard } from './AdSlots';
import type { AdConsentStatus } from '../types';

interface SnakesAndLaddersProps {
  playerName: string;
  consent: AdConsentStatus;
  onStatusChange: (isPlaying: boolean) => void;
  onMatchFinished: (winnerName: string, humanWon: boolean, playersCount: number, durationSeconds: number) => void;
  onWatchPostMatchRewardedAd: () => void;
  onExit: () => void;
}

interface SnakeOrLadder {
  from: number;
  to: number;
}

const LADDERS: SnakeOrLadder[] = [
  { from: 4, to: 25 },
  { from: 13, to: 46 },
  { from: 33, to: 49 },
  { from: 42, to: 63 },
  { from: 50, to: 69 },
  { from: 62, to: 81 },
  { from: 74, to: 92 },
];

const SNAKES: SnakeOrLadder[] = [
  { from: 27, to: 5 },
  { from: 40, to: 3 },
  { from: 43, to: 18 },
  { from: 54, to: 31 },
  { from: 66, to: 45 },
  { from: 76, to: 58 },
  { from: 89, to: 53 },
  { from: 99, to: 41 },
];

const JUMP_MAP = new Map<number, { to: number; kind: 'ladder' | 'snake' }>([
  ...LADDERS.map((l) => [l.from, { to: l.to, kind: 'ladder' as const }] as const),
  ...SNAKES.map((s) => [s.from, { to: s.to, kind: 'snake' as const }] as const),
]);

function getTileCoord(tile: number): { row: number; col: number; x: number; y: number } {
  const clamped = Math.max(1, Math.min(100, tile));
  const zero = clamped - 1;
  const rowFromBottom = Math.floor(zero / 10);
  const row = 9 - rowFromBottom;
  const colInRow = zero % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  return { row, col, x: col * 100 + 50, y: row * 100 + 50 };
}

interface SLPlayer {
  id: number;
  name: string;
  isBot: boolean;
  pos: number;
  color: string;
  bgClass: string;
}

function DiceFace({ value, rolling }: { value: number | null; rolling: boolean }) {
  const pipsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const activePips = value ? pipsMap[value] || [4] : [4];

  return (
    <div
      className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-slate-100 border-2 border-amber-300 shadow-xl p-2.5 grid grid-cols-3 grid-rows-3 gap-1 ${
        rolling ? 'animate-dice-roll' : ''
      }`}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={`w-full h-full rounded-full ${
            activePips.includes(i)
              ? value === 6
                ? 'bg-red-600'
                : 'bg-[#081222]'
              : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}

export function SnakesAndLadders({
  playerName,
  consent,
  onStatusChange,
  onMatchFinished,
  onWatchPostMatchRewardedAd,
  onExit,
}: SnakesAndLaddersProps) {
  const [mode, setMode] = useState<'ai' | 'local2p'>('ai');
  const [players, setPlayers] = useState<SLPlayer[]>([
    { id: 0, name: playerName, isBot: false, pos: 1, color: '#EF4444', bgClass: 'bg-red-500' },
    { id: 1, name: 'Astra Bot', isBot: true, pos: 1, color: '#F59E0B', bgClass: 'bg-amber-500' },
  ]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [statusText, setStatusText] = useState(`${playerName}'s turn — Roll the dice!`);
  const [winner, setWinner] = useState<SLPlayer | null>(null);
  const [muted, setMuted] = useState(soundFX.muted);
  const startedAtRef = useRef<number>(Date.now());
  const winReportedRef = useRef(false);

  // Sync active gameplay ad suppression
  useEffect(() => {
    onStatusChange(!winner);
    return () => onStatusChange(false);
  }, [winner, onStatusChange]);

  function startNewGame(selectedMode: 'ai' | 'local2p') {
    setMode(selectedMode);
    startedAtRef.current = Date.now();
    winReportedRef.current = false;
    setWinner(null);
    setTurnIdx(0);
    setDiceValue(null);
    setRolling(false);
    const nextPlayers: SLPlayer[] = [
      { id: 0, name: playerName, isBot: false, pos: 1, color: '#EF4444', bgClass: 'bg-red-500' },
      selectedMode === 'ai'
        ? { id: 1, name: 'Astra Bot', isBot: true, pos: 1, color: '#F59E0B', bgClass: 'bg-amber-500' }
        : { id: 1, name: 'Player 2', isBot: false, pos: 1, color: '#3B82F6', bgClass: 'bg-blue-500' },
    ];
    setPlayers(nextPlayers);
    setStatusText(`${nextPlayers[0].name}'s turn — Roll the dice!`);
  }

  function applyRoll() {
    if (winner || rolling) return;
    setRolling(true);
    soundFX.playDiceRoll();
    navigator.vibrate?.(25);

    window.setTimeout(() => {
      setRolling(false);
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);

      setPlayers((prev) => {
        const active = prev[turnIdx];
        let nextPos = active.pos + roll;
        let msg = `${active.name} rolled ${roll}!`;

        if (nextPos > 100) {
          msg = `${active.name} rolled ${roll} (needs ${100 - active.pos} to win).`;
          const nextTurn = (turnIdx + 1) % prev.length;
          setTurnIdx(nextTurn);
          setStatusText(`${msg} ${prev[nextTurn].name}'s turn.`);
          return prev;
        }

        const jump = JUMP_MAP.get(nextPos);
        if (jump) {
          if (jump.kind === 'ladder') {
            soundFX.playGoal();
            msg = `${active.name} climbed ladder ${nextPos} → ${jump.to}!`;
          } else {
            soundFX.playCapture();
            msg = `${active.name} hit snake ${nextPos} → ${jump.to}!`;
          }
          nextPos = jump.to;
        } else {
          soundFX.playTokenHop();
        }

        const updated = prev.map((p, idx) => (idx === turnIdx ? { ...p, pos: nextPos } : p));
        const activeUpdated = updated[turnIdx];

        if (nextPos === 100) {
          setWinner(activeUpdated);
          setStatusText(`${activeUpdated.name} reached 100 and wins!`);
          soundFX.playWin();
          confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
          if (!winReportedRef.current) {
            winReportedRef.current = true;
            const dur = Math.max(5, Math.floor((Date.now() - startedAtRef.current) / 1000));
            onMatchFinished(activeUpdated.name, !activeUpdated.isBot, updated.length, dur);
          }
          return updated;
        }

        const bonus = roll === 6;
        const nextTurn = bonus ? turnIdx : (turnIdx + 1) % updated.length;
        setTurnIdx(nextTurn);
        setStatusText(
          bonus
            ? `${msg} Rolled 6 — Roll again!`
            : `${msg} ${updated[nextTurn].name}'s turn.`
        );
        return updated;
      });
    }, 400);
  }

  // Bot turn automation
  useEffect(() => {
    if (winner || rolling) return;
    const current = players[turnIdx];
    if (!current?.isBot) return;
    const t = window.setTimeout(() => {
      applyRoll();
    }, 750);
    return () => window.clearTimeout(t);
  });

  // Render 100 tiles ordered visually from top-left (100) to bottom-left (1)
  const boardTiles = useMemo(() => {
    const tiles: Array<{ num: number; row: number; col: number }> = [];
    for (let r = 0; r < 10; r++) {
      const rowFromBottom = 9 - r;
      for (let c = 0; c < 10; c++) {
        const num =
          rowFromBottom % 2 === 0
            ? rowFromBottom * 10 + c + 1
            : rowFromBottom * 10 + (10 - c);
        tiles.push({ num, row: r, col: c });
      }
    }
    return tiles;
  }, []);

  const currentPlayer = players[turnIdx];

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
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

        <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-md">
          {statusText}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startNewGame('ai')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
              mode === 'ai' ? 'bg-[#F59E0B] text-[#081222]' : 'bg-[#162947] text-slate-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            type="button"
            onClick={() => startNewGame('local2p')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
              mode === 'local2p' ? 'bg-[#F59E0B] text-[#081222]' : 'bg-[#162947] text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2P</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.muted = !muted;
              setMuted(soundFX.muted);
            }}
            aria-label="Toggle mute"
            className="p-2 rounded-lg bg-[#162947] text-white"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Split: 10x10 Board + Dice Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[580px] aspect-square rounded-2xl bg-[#0B172A] p-2 sm:p-3 border-2 border-emerald-400/45 shadow-2xl select-none">
            <div className="relative w-full h-full rounded-xl overflow-hidden grid grid-cols-10 grid-rows-10 border border-slate-700">
              {boardTiles.map((tile) => {
                const isAlt = (tile.row + tile.col) % 2 === 0;
                const jump = JUMP_MAP.get(tile.num);
                return (
                  <div
                    key={tile.num}
                    className={`border-[0.5px] border-slate-300/20 flex flex-col items-start justify-start p-0.5 sm:p-1 ${
                      tile.num === 100
                        ? 'bg-amber-400 text-[#081222]'
                        : jump?.kind === 'ladder'
                          ? 'bg-emerald-900/55 text-emerald-200'
                          : jump?.kind === 'snake'
                            ? 'bg-red-950/60 text-red-200'
                            : isAlt
                              ? 'bg-[#132645] text-slate-200'
                              : 'bg-[#0C1B33] text-slate-300'
                    }`}
                  >
                    <span className="text-[9px] sm:text-[11px] font-mono font-bold leading-none">
                      {tile.num}
                    </span>
                  </div>
                );
              })}

              {/* SVG Overlay for Ladders & Snakes */}
              <svg
                viewBox="0 0 1000 1000"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {LADDERS.map((lad) => {
                  const a = getTileCoord(lad.from);
                  const b = getTileCoord(lad.to);
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const len = Math.hypot(dx, dy) || 1;
                  const nx = (-dy / len) * 12;
                  const ny = (dx / len) * 12;
                  const rungs = 6;

                  return (
                    <g key={`lad-${lad.from}`} opacity="0.88">
                      <line
                        x1={a.x + nx}
                        y1={a.y + ny}
                        x2={b.x + nx}
                        y2={b.y + ny}
                        stroke="#F59E0B"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <line
                        x1={a.x - nx}
                        y1={a.y - ny}
                        x2={b.x - nx}
                        y2={b.y - ny}
                        stroke="#F59E0B"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      {Array.from({ length: rungs }).map((_, i) => {
                        const t = (i + 1) / (rungs + 1);
                        const rx = a.x + dx * t;
                        const ry = a.y + dy * t;
                        return (
                          <line
                            key={i}
                            x1={rx + nx}
                            y1={ry + ny}
                            x2={rx - nx}
                            y2={ry - ny}
                            stroke="#FDE68A"
                            strokeWidth="4"
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {SNAKES.map((snk) => {
                  const head = getTileCoord(snk.from);
                  const tail = getTileCoord(snk.to);
                  const mx = (head.x + tail.x) / 2 + (head.x > tail.x ? -65 : 65);
                  const my = (head.y + tail.y) / 2;
                  return (
                    <g key={`snk-${snk.from}`} opacity="0.9">
                      <path
                        d={`M ${head.x} ${head.y} Q ${mx} ${my} ${tail.x} ${tail.y}`}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <path
                        d={`M ${head.x} ${head.y} Q ${mx} ${my} ${tail.x} ${tail.y}`}
                        fill="none"
                        stroke="#FCA5A5"
                        strokeWidth="4"
                        strokeDasharray="10 14"
                        strokeLinecap="round"
                      />
                      <circle cx={head.x} cy={head.y} r="15" fill="#DC2626" stroke="#FFFFFF" strokeWidth="3" />
                    </g>
                  );
                })}
              </svg>

              {/* Player Pawns */}
              {players.map((p, idx) => {
                const c = getTileCoord(p.pos);
                const sameTile = players.every((other) => other.pos === p.pos);
                const offsetX = sameTile ? (idx === 0 ? -14 : 14) : 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      left: `${c.col * 10 + 5}%`,
                      top: `${c.row * 10 + 5}%`,
                      transform: `translate(calc(-50% + ${offsetX}%), -50%)`,
                      backgroundColor: p.color,
                    }}
                    className="absolute z-20 w-[6%] h-[6%] min-w-[18px] min-h-[18px] rounded-full border-2 border-white ludo-pawn transition-all duration-300 flex items-center justify-center"
                  >
                    <span className="w-[42%] h-[42%] rounded-full bg-white/90" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 flex items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-semibold text-emerald-400">Snakes &amp; Ladders</p>
              <h2 className="text-xl font-extrabold text-white truncate">{currentPlayer.name}</h2>
              <p className="text-xs text-slate-300">
                {currentPlayer.isBot ? 'Astra Bot is rolling...' : 'Tap Roll Dice to advance toward 100!'}
              </p>
            </div>

            <button
              type="button"
              disabled={Boolean(winner) || rolling || currentPlayer.isBot}
              onClick={applyRoll}
              className="flex flex-col items-center gap-2 shrink-0 disabled:opacity-60"
            >
              <DiceFace value={diceValue} rolling={rolling} />
              <span className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] text-[#081222] text-xs font-extrabold">
                {rolling ? 'Rolling...' : 'Roll Dice'}
              </span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300">Players</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border ${
                    idx === turnIdx && !winner
                      ? 'bg-[#162947] border-amber-400/60'
                      : 'bg-[#091529] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.bgClass}`} />
                    <span className="text-xs font-bold text-white truncate">{p.name}</span>
                  </div>
                  <p className="text-lg font-mono font-extrabold text-amber-300 tabular-nums mt-1">
                    Tile {p.pos}/100
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Post-Match Victory Modal */}
      {winner && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0F1E36] border-2 border-amber-400/60 p-6 text-center shadow-2xl space-y-5 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-400">Snakes &amp; Ladders Complete</p>
              <h2 className="text-2xl font-extrabold text-white">{winner.name} Wins!</h2>
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
                onClick={() => startNewGame(mode)}
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
