import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  Crown,
  Volume2,
  VolumeX,
  ArrowLeft,
  RotateCcw,
  Send,
  Copy,
  Check,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Share2,
  Coins,
} from 'lucide-react';
import {
  getLegalTokenIds,
  getTokenBoardCoord,
  HOME_STRETCH_COORDS,
  OUTER_TRACK_COORDS,
  SAFE_TRACK_INDICES,
} from '../game/ludoEngine';
import { ADMOB_ACTIVE_CONFIG } from '../config/admob';
import { AdMobNativeCard } from './AdSlots';
import { soundFX } from '../utils/sound';
import type { AdConsentStatus, LudoGameState, PlayerColor, TokenState } from '../types';

export type BoardTheme = 'classic' | 'royal' | 'emerald';

interface LudoBoardProps {
  gameState: LudoGameState;
  localPlayerColors: PlayerColor[] | null; // null = all human seats on this device (pass & play)
  isRolling: boolean;
  consent?: AdConsentStatus;
  boardTheme?: BoardTheme;
  onChangeBoardTheme?: (theme: BoardTheme) => void;
  onWatchPostMatchRewardedAd?: () => void;
  onShareInvite?: (roomCode?: string) => void;
  onRollDice: () => void;
  onMoveToken: (tokenId: number) => void;
  onSendChat?: (text: string) => void;
  onPlayAgain: () => void;
  onExitGame: () => void;
}

const COLOR_STYLES: Record<
  PlayerColor,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    tokenFill: string;
    yardBg: string;
  }
> = {
  red: {
    label: 'Red',
    bg: 'bg-red-600',
    border: 'border-red-400',
    text: 'text-red-400',
    tokenFill: '#EF4444',
    yardBg: 'bg-[#DC2626]',
  },
  green: {
    label: 'Green',
    bg: 'bg-emerald-600',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    tokenFill: '#10B981',
    yardBg: 'bg-[#059669]',
  },
  yellow: {
    label: 'Yellow',
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    text: 'text-amber-400',
    tokenFill: '#F59E0B',
    yardBg: 'bg-[#D97706]',
  },
  blue: {
    label: 'Blue',
    bg: 'bg-blue-600',
    border: 'border-blue-400',
    text: 'text-blue-400',
    tokenFill: '#3B82F6',
    yardBg: 'bg-[#2563EB]',
  },
};

const THEME_STYLES: Record<
  BoardTheme,
  { label: string; frame: string; neutralCell: string; borderColor: string }
> = {
  classic: {
    label: 'Classic Ivory',
    frame: 'bg-[#0B172A] border-amber-400/45',
    neutralCell: 'bg-slate-100',
    borderColor: 'border-slate-300/80',
  },
  royal: {
    label: 'Royal Midnight',
    frame: 'bg-[#060F1E] border-amber-400/70',
    neutralCell: 'bg-[#E2E8F0]',
    borderColor: 'border-slate-400/60',
  },
  emerald: {
    label: 'Emerald Felt',
    frame: 'bg-[#06231B] border-emerald-400/50',
    neutralCell: 'bg-emerald-50',
    borderColor: 'border-emerald-200/80',
  },
};

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
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-white to-slate-100 border-2 border-amber-300 shadow-xl p-2.5 grid grid-cols-3 grid-rows-3 gap-1 transition-transform ${
        rolling ? 'animate-dice-roll' : ''
      }`}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={`w-full h-full rounded-full transition-opacity ${
            activePips.includes(i)
              ? value === 6
                ? 'bg-red-600 opacity-100'
                : 'bg-[#081222] opacity-100'
              : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}

export function LudoBoard({
  gameState,
  localPlayerColors,
  isRolling,
  consent = 'personalized',
  boardTheme = 'classic',
  onChangeBoardTheme,
  onWatchPostMatchRewardedAd,
  onShareInvite,
  onRollDice,
  onMoveToken,
  onSendChat,
  onPlayAgain,
  onExitGame,
}: LudoBoardProps) {
  const [muted, setMuted] = useState(soundFX.muted);
  const [autoMoveSingle, setAutoMoveSingle] = useState(true);
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);
  const [chatText, setChatText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [recentRolls, setRecentRolls] = useState<number[]>([]);
  const [boardCallout, setBoardCallout] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const winTriggeredRef = useRef<string | null>(null);
  const lastTurnRollRef = useRef<string>('');
  const lastActionRef = useRef<string>('');
  const lastChatIdRef = useRef<string>('');

  const activePlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn =
    gameState.status === 'playing' &&
    activePlayer &&
    !activePlayer.isBot &&
    (localPlayerColors === null || localPlayerColors.includes(activePlayer.color));

  const legalTokenIds = useMemo(() => {
    if (!isMyTurn || gameState.phase !== 'awaiting_move' || gameState.diceValue === null) {
      return new Set<number>();
    }
    return new Set(getLegalTokenIds(gameState.tokens, activePlayer.color, gameState.diceValue));
  }, [isMyTurn, gameState.phase, gameState.diceValue, gameState.tokens, activePlayer?.color]);

  // Fast Auto-Move when exactly 1 legal move exists (smooth mobile UX)
  useEffect(() => {
    if (!autoMoveSingle || !isMyTurn || gameState.phase !== 'awaiting_move') return;
    if (legalTokenIds.size !== 1) return;
    const onlyTokenId = Array.from(legalTokenIds)[0];
    const timer = window.setTimeout(() => {
      onMoveToken(onlyTokenId);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [autoMoveSingle, isMyTurn, gameState.phase, legalTokenIds, onMoveToken]);

  // Clear hover preview when phase changes
  useEffect(() => {
    if (gameState.phase !== 'awaiting_move') {
      setHoveredTokenId(null);
    }
  }, [gameState.phase]);

  // Desktop Spacebar convenience shortcut to roll dice
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        isMyTurn &&
        gameState.phase === 'awaiting_roll' &&
        !isRolling
      ) {
        e.preventDefault();
        onRollDice();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMyTurn, gameState.phase, isRolling, onRollDice]);

  // Compute landing target preview coord when hovering a legal token
  const previewTargetCoord = useMemo(() => {
    if (
      hoveredTokenId === null ||
      !isMyTurn ||
      gameState.phase !== 'awaiting_move' ||
      gameState.diceValue === null ||
      !legalTokenIds.has(hoveredTokenId)
    ) {
      return null;
    }
    const token = gameState.tokens[activePlayer.color]?.[hoveredTokenId];
    if (!token) return null;
    const nextPos = token.pos === -1 ? 0 : token.pos + gameState.diceValue;
    return getTokenBoardCoord({ ...token, pos: nextPos });
  }, [
    hoveredTokenId,
    isMyTurn,
    gameState.phase,
    gameState.diceValue,
    gameState.tokens,
    activePlayer?.color,
    legalTokenIds,
  ]);

  // Track recent dice rolls per turn
  useEffect(() => {
    if (gameState.diceValue === null) return;
    const key = `${gameState.roomId}-${gameState.turnCount}-${gameState.currentTurnIndex}-${gameState.diceValue}`;
    if (lastTurnRollRef.current !== key) {
      lastTurnRollRef.current = key;
      setRecentRolls((prev) => [gameState.diceValue!, ...prev].slice(0, 6));
    }
  }, [gameState.roomId, gameState.turnCount, gameState.currentTurnIndex, gameState.diceValue]);

  // Show big-moment callout banner & haptic buzz on captures / home goals / triple 6s
  useEffect(() => {
    const action = gameState.lastAction || '';
    if (!action || lastActionRef.current === action) return;
    lastActionRef.current = action;

    let label: string | null = null;
    if (action.includes('captured')) {
      label = 'CAPTURED! +Bonus Roll';
      navigator.vibrate?.([40, 30, 60]);
    } else if (action.includes('Home Goal')) {
      label = 'HOME GOAL! +Bonus Roll';
      navigator.vibrate?.([50, 30, 50]);
    } else if (action.includes('three 6s')) {
      label = 'THREE 6s — Turn Passed!';
    }
    if (!label) return;
    setBoardCallout(label);
    const t = window.setTimeout(() => setBoardCallout(null), 1800);
    return () => window.clearTimeout(t);
  }, [gameState.lastAction]);

  // Float emoji reaction when new online chat emoji arrives
  useEffect(() => {
    const msgs = gameState.chatMessages || [];
    if (msgs.length === 0) return;
    const latest = msgs[msgs.length - 1];
    if (latest.id !== lastChatIdRef.current) {
      lastChatIdRef.current = latest.id;
      setFloatingReaction(`${latest.sender}: ${latest.text}`);
      const t = window.setTimeout(() => setFloatingReaction(null), 2200);
      return () => window.clearTimeout(t);
    }
  }, [gameState.chatMessages]);

  // Trigger celebratory confetti & sound when game ends
  useEffect(() => {
    if (gameState.status === 'finished' && gameState.winnerColor) {
      const key = `${gameState.roomId}-${gameState.winnerColor}`;
      if (winTriggeredRef.current !== key) {
        winTriggeredRef.current = key;
        soundFX.playWin();
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.58 },
        });
      }
    }
  }, [gameState.status, gameState.winnerColor, gameState.roomId]);

  // Group all active player tokens by board cell so overlapping tokens offset cleanly
  const tokenRenderList = useMemo(() => {
    const allTokens: TokenState[] = [];
    for (const p of gameState.players) {
      for (const t of gameState.tokens[p.color] || []) {
        allTokens.push(t);
      }
    }

    const coordBuckets = new Map<string, TokenState[]>();
    for (const t of allTokens) {
      const [r, c] = getTokenBoardCoord(t);
      const key = `${r.toFixed(1)},${c.toFixed(1)}`;
      const bucket = coordBuckets.get(key) || [];
      bucket.push(t);
      coordBuckets.set(key, bucket);
    }

    const result: Array<{
      token: TokenState;
      row: number;
      col: number;
      dx: number;
      dy: number;
      scale: number;
    }> = [];

    for (const bucket of coordBuckets.values()) {
      bucket.forEach((token, idx) => {
        const [row, col] = getTokenBoardCoord(token);
        let dx = 0;
        let dy = 0;
        let scale = 1;
        if (bucket.length > 1) {
          const angle = (idx / bucket.length) * Math.PI * 2;
          dx = Math.cos(angle) * 18;
          dy = Math.sin(angle) * 18;
          scale = 0.82;
        }
        result.push({ token, row, col, dx, dy, scale });
      });
    }
    return result;
  }, [gameState.players, gameState.tokens]);

  const themeCfg = THEME_STYLES[boardTheme];

  // Precompute special track & home stretch cells
  const cellMeta = useMemo(() => {
    const map = new Map<
      string,
      {
        bg: string;
        isStar: boolean;
        startColor?: PlayerColor;
        entryDir?: 'up' | 'down' | 'left' | 'right';
        entryColor?: string;
      }
    >();
    const startMap = new Map<number, PlayerColor>([
      [0, 'red'],
      [13, 'green'],
      [26, 'yellow'],
      [39, 'blue'],
    ]);

    OUTER_TRACK_COORDS.forEach(([r, c], idx) => {
      const startColor = startMap.get(idx);
      const isStar = SAFE_TRACK_INDICES.has(idx);
      let bg = themeCfg.neutralCell;
      if (startColor === 'red') bg = 'bg-red-500';
      else if (startColor === 'green') bg = 'bg-emerald-500';
      else if (startColor === 'yellow') bg = 'bg-amber-400';
      else if (startColor === 'blue') bg = 'bg-blue-500';
      map.set(`${r},${c}`, { bg, isStar, startColor });
    });

    // Home-stretch entry arrow squares
    map.set('14,7', { bg: themeCfg.neutralCell, isStar: false, entryDir: 'up', entryColor: 'text-red-600' });
    map.set('7,0', { bg: themeCfg.neutralCell, isStar: false, entryDir: 'right', entryColor: 'text-emerald-600' });
    map.set('0,7', { bg: themeCfg.neutralCell, isStar: false, entryDir: 'down', entryColor: 'text-amber-600' });
    map.set('7,14', { bg: themeCfg.neutralCell, isStar: false, entryDir: 'left', entryColor: 'text-blue-600' });

    (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).forEach((color) => {
      HOME_STRETCH_COORDS[color].slice(0, 5).forEach(([r, c]) => {
        const bg =
          color === 'red'
            ? 'bg-red-500'
            : color === 'green'
              ? 'bg-emerald-500'
              : color === 'yellow'
                ? 'bg-amber-400'
                : 'bg-blue-500';
        map.set(`${r},${c}`, { bg, isStar: false });
      });
    });

    return map;
  }, [themeCfg.neutralCell]);

  const winnerPlayer = gameState.players.find((p) => p.color === gameState.winnerColor);

  function toggleMute() {
    soundFX.muted = !muted;
    setMuted(soundFX.muted);
  }

  function handleCopyCode() {
    if (!gameState.roomCode) return;
    navigator.clipboard?.writeText(gameState.roomCode).catch(() => {});
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 2000);
  }

  return (
    <div className="max-w-[1320px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Compact Game Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0F1E36] border border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExitGame}
            className="px-3 py-1.5 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Match</span>
          </button>
          {gameState.roomCode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-[#081222] border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-1.5"
              >
                <span>Room: {gameState.roomCode}</span>
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {onShareInvite && (
                <button
                  type="button"
                  onClick={() => onShareInvite(gameState.roomCode)}
                  title="Invite friends to this match"
                  className="px-2.5 py-1.5 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Invite</span>
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-md">
          {gameState.lastAction}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoMoveSingle((prev) => !prev)}
            title="Automatically move when only 1 token has a legal move"
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
              autoMoveSingle
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                : 'bg-[#162947] border-white/10 text-slate-300'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Auto-Move</span>
          </button>

          {onChangeBoardTheme && (
            <div className="hidden sm:flex items-center gap-1 bg-[#081222] rounded-lg p-1 border border-white/10">
              {(['classic', 'royal', 'emerald'] as BoardTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChangeBoardTheme(t)}
                  title={THEME_STYLES[t].label}
                  className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-colors ${
                    boardTheme === t ? 'bg-[#F59E0B] text-[#081222]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-white transition-colors"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Arena Split: Board Left, Controls + Players Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 15x15 Ludo Board */}
        <div className="lg:col-span-7 flex justify-center">
          <div
            className={`relative w-full max-w-[600px] aspect-square rounded-2xl p-2 sm:p-3 border-2 shadow-2xl select-none transition-colors ${themeCfg.frame}`}
          >
            {boardCallout && (
              <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-xl bg-[#F59E0B] text-[#081222] text-xs font-extrabold shadow-2xl whitespace-nowrap">
                {boardCallout}
              </div>
            )}
            {floatingReaction && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl bg-[#081222]/90 border border-amber-400/50 text-white text-xs font-bold shadow-xl whitespace-nowrap">
                {floatingReaction}
              </div>
            )}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 grid grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] border border-slate-700">
              {/* Render 225 cells with Home Yards and Center Goal overlaid cleanly */}
              {Array.from({ length: 15 }).map((_, r) =>
                Array.from({ length: 15 }).map((__, c) => {
                  const isRedYard = r >= 9 && c <= 5;
                  const isGreenYard = r <= 5 && c <= 5;
                  const isYellowYard = r <= 5 && c >= 9;
                  const isBlueYard = r >= 9 && c >= 9;
                  const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

                  if (isRedYard || isGreenYard || isYellowYard || isBlueYard || isCenter) {
                    return <div key={`${r}-${c}`} className="border-[0.5px] border-transparent" />;
                  }

                  const meta = cellMeta.get(`${r},${c}`);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`border-[0.5px] ${themeCfg.borderColor} flex items-center justify-center ${
                        meta?.bg || themeCfg.neutralCell
                      }`}
                    >
                      {meta?.isStar && (
                        <Star
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            meta.startColor
                              ? 'text-white fill-white/85'
                              : 'text-slate-600 fill-slate-300'
                          }`}
                        />
                      )}
                      {meta?.entryDir === 'up' && (
                        <ChevronUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${meta.entryColor}`} />
                      )}
                      {meta?.entryDir === 'down' && (
                        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${meta.entryColor}`} />
                      )}
                      {meta?.entryDir === 'left' && (
                        <ChevronLeft className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${meta.entryColor}`} />
                      )}
                      {meta?.entryDir === 'right' && (
                        <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${meta.entryColor}`} />
                      )}
                    </div>
                  );
                })
              )}

              {/* 4 Corner Home Yards */}
              {(
                [
                  { color: 'green' as PlayerColor, pos: 'top-0 left-0', bg: 'bg-[#059669]' },
                  { color: 'yellow' as PlayerColor, pos: 'top-0 right-0', bg: 'bg-[#D97706]' },
                  { color: 'red' as PlayerColor, pos: 'bottom-0 left-0', bg: 'bg-[#DC2626]' },
                  { color: 'blue' as PlayerColor, pos: 'bottom-0 right-0', bg: 'bg-[#2563EB]' },
                ] as const
              ).map((yard) => {
                const isActiveSeat =
                  activePlayer?.color === yard.color && gameState.status === 'playing';
                return (
                  <div
                    key={yard.color}
                    className={`absolute ${yard.pos} w-[40%] h-[40%] ${yard.bg} p-[6.5%] border border-slate-800/60 transition-all ${
                      isActiveSeat ? 'ring-3 ring-inset ring-white' : ''
                    }`}
                  >
                    <div className="w-full h-full rounded-2xl bg-white/95 shadow-inner grid grid-cols-2 grid-rows-2 p-[14%] gap-[18%]">
                      {[0, 1, 2, 3].map((slot) => (
                        <div
                          key={slot}
                          className={`rounded-full border-2 ${COLOR_STYLES[yard.color].border} bg-slate-100`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Center 3x3 Home Goal Triangles */}
              <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] border border-slate-800 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 50,50 0,100" fill="#059669" />
                  <polygon points="0,0 100,0 50,50" fill="#D97706" />
                  <polygon points="100,0 100,100 50,50" fill="#2563EB" />
                  <polygon points="0,100 100,100 50,50" fill="#DC2626" />
                  <circle cx="50" cy="50" r="17" fill="#081222" stroke="#F59E0B" strokeWidth="3" />
                </svg>
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Destination Landing Target Ring on Token Hover */}
              {previewTargetCoord && (
                <div
                  style={{
                    left: `${((previewTargetCoord[1] + 0.5) / 15) * 100}%`,
                    top: `${((previewTargetCoord[0] + 0.5) / 15) * 100}%`,
                  }}
                  className="pointer-events-none absolute z-10 w-[5.8%] h-[5.8%] rounded-full border-3 border-amber-400 bg-amber-400/20 animate-target-ping"
                />
              )}

              {/* Animated 3D Royal Pawn Tokens */}
              {tokenRenderList.map(({ token, row, col, dx, dy, scale }) => {
                const isMovable =
                  activePlayer?.color === token.color && legalTokenIds.has(token.id);
                const leftPct = ((col + 0.5) / 15) * 100;
                const topPct = ((row + 0.5) / 15) * 100;
                const fill = COLOR_STYLES[token.color].tokenFill;

                return (
                  <button
                    key={`${token.color}-${token.id}`}
                    type="button"
                    disabled={!isMovable}
                    onClick={() => isMovable && onMoveToken(token.id)}
                    onMouseEnter={() => isMovable && setHoveredTokenId(token.id)}
                    onMouseLeave={() => setHoveredTokenId(null)}
                    aria-label={`${token.color} token ${token.id + 1}`}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: `translate(calc(-50% + ${dx}%), calc(-50% + ${dy}%)) scale(${scale})`,
                    }}
                    className={`absolute z-20 w-[5.5%] h-[5.5%] min-w-[20px] min-h-[20px] rounded-full transition-all duration-200 flex items-center justify-center ${
                      isMovable ? 'cursor-pointer z-30' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`w-full h-full rounded-full border-2 border-white ludo-pawn flex items-center justify-center ${
                        isMovable ? 'animate-token-ready ring-4 ring-amber-300/90' : ''
                      }`}
                      style={{ backgroundColor: fill }}
                    >
                      <span className="w-[46%] h-[46%] rounded-full bg-white/90 shadow-inner" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side Panel: Dice Control, Player Seats, Room Chat */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Turn & Dice Box */}
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-amber-400">
                    {gameState.status === 'finished' ? 'Match Complete' : 'Current Turn'}
                  </p>
                  {gameState.consecutiveSixes > 0 && gameState.status === 'playing' && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                      6s: {gameState.consecutiveSixes}/3
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {activePlayer && (
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${COLOR_STYLES[activePlayer.color].bg}`}
                    />
                  )}
                  <h2 className="text-xl font-extrabold text-white truncate">
                    {activePlayer?.name || 'Waiting'}
                  </h2>
                </div>
                <p className="text-xs text-slate-300">
                  {gameState.status === 'finished'
                    ? 'Victory achieved!'
                    : isMyTurn
                      ? gameState.phase === 'awaiting_roll'
                        ? 'Tap Roll Dice (or press Space) to play.'
                        : 'Tap a glowing token on the board.'
                      : activePlayer?.isBot
                        ? 'Computer is thinking...'
                        : 'Waiting for opponent move...'}
                </p>
              </div>

              <button
                type="button"
                disabled={!isMyTurn || gameState.phase !== 'awaiting_roll' || isRolling}
                onClick={onRollDice}
                className="flex flex-col items-center gap-2 shrink-0 disabled:opacity-60 group focus:outline-none"
              >
                <DiceFace value={gameState.diceValue} rolling={isRolling} />
                <span
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isMyTurn && gameState.phase === 'awaiting_roll'
                      ? 'bg-[#F59E0B] group-hover:bg-amber-400 text-[#081222]'
                      : 'bg-[#162947] text-slate-300'
                  }`}
                >
                  {isRolling ? 'Rolling...' : 'Roll Dice'}
                </span>
              </button>
            </div>

            {recentRolls.length > 0 && (
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">Recent Rolls</span>
                <div className="flex items-center gap-1.5">
                  {recentRolls.map((r, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold tabular-nums ${
                        i === 0
                          ? r === 6
                            ? 'bg-red-500 text-white'
                            : 'bg-[#F59E0B] text-[#081222]'
                          : 'bg-[#081222] text-slate-300 border border-white/10'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player Roster & Progress */}
          <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300">Players</h3>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map((seat, idx) => {
                const isCurrent =
                  idx === gameState.currentTurnIndex && gameState.status === 'playing';
                const homeCount = (gameState.tokens[seat.color] || []).filter(
                  (t) => t.pos === 56
                ).length;
                return (
                  <div
                    key={seat.color}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'bg-[#162947] border-amber-400/60'
                        : 'bg-[#091529] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={seat.avatarUrl}
                        alt={seat.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/15"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${COLOR_STYLES[seat.color].bg}`}
                          />
                          <span className="truncate">{seat.name}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {seat.isBot
                            ? 'AI Opponent'
                            : seat.connected === false
                              ? 'Auto-Bot'
                              : 'Player'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2, 3].map((pip) => (
                          <span
                            key={pip}
                            className={`w-2 h-2 rounded-full ${
                              pip < homeCount ? COLOR_STYLES[seat.color].bg : 'bg-white/15'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono tabular-nums font-bold text-amber-300">
                        {homeCount}/4
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Online Room Quick Chat */}
          {onSendChat && (
            <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300">Table Chat</h3>
              <div className="flex flex-wrap gap-1.5">
                {['👏 Nice!', '🔥 Fire!', '😂 Haha', '🎲 Lucky 6!', '😎 GG!'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSendChat(preset)}
                    className="px-2.5 py-1 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-[11px] text-slate-200 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                {(gameState.chatMessages || []).length === 0 ? (
                  <p className="text-slate-500">Say hello to the table.</p>
                ) : (
                  gameState.chatMessages!.map((m) => (
                    <p key={m.id} className="text-slate-200">
                      <strong className={COLOR_STYLES[m.color].text}>{m.sender}:</strong> {m.text}
                    </p>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatText.trim()) {
                    onSendChat(chatText.trim());
                    setChatText('');
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Send message..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#081222] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="px-3 py-2 rounded-lg bg-[#F59E0B] hover:bg-amber-400 text-[#081222]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Victory Celebration Modal (Gameplay Finished — Safe for Post-Match Ads) */}
      {gameState.status === 'finished' && winnerPlayer && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0F1E36] border-2 border-amber-400/60 p-6 sm:p-7 text-center shadow-2xl space-y-5 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto">
              <Crown className="w-9 h-9 text-amber-400" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-400">Victory Celebration</p>
              <h2 className="text-3xl font-extrabold text-white">{winnerPlayer.name} Wins!</h2>
              <p className="text-sm text-slate-300">
                All 4 {COLOR_STYLES[winnerPlayer.color].label} tokens reached the center crown.
              </p>
            </div>

            {onWatchPostMatchRewardedAd && (
              <button
                type="button"
                onClick={onWatchPostMatchRewardedAd}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <Coins className="w-4 h-4" />
                <span>
                  Watch Rewarded Ad for +{ADMOB_ACTIVE_CONFIG.rewardedCoinBonus} Bonus Coins
                </span>
              </button>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onExitGame}
                className="flex-1 py-3 rounded-xl bg-[#162947] hover:bg-[#1E355B] text-white text-sm font-semibold transition-colors"
              >
                Home Lobby
              </button>
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>

            {/* Post-Match AdMob Native Ad (Strictly after match ends, never during gameplay) */}
            <AdMobNativeCard placement="post_match" consent={consent} gameplayActive={false} />
          </div>
        </div>
      )}
    </div>
  );
}
