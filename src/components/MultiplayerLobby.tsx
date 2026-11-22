import { useState, useEffect } from 'react';
import {
  Users,
  KeyRound,
  Globe,
  Copy,
  Check,
  Play,
  ArrowLeft,
  RefreshCw,
  Link2,
  UserCircle2,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { ludoApi } from '../lib/ludoApi';
import { AdMobNativeCard } from './AdSlots';
import type { AdConsentStatus, LudoGameState } from '../types';

interface MultiplayerLobbyProps {
  playerName: string;
  isSignedIn: boolean;
  onChangeGuestName: (name: string) => void;
  consent: AdConsentStatus;
  roomState: LudoGameState | null;
  isHost: boolean;
  wsError: string | null;
  onCreateRoom: (maxPlayers: 2 | 4, isPrivate: boolean) => void;
  onJoinRoom: (roomCode: string) => void;
  onQuickMatch: (maxPlayers: 2 | 4) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onBack: () => void;
}

export function MultiplayerLobby({
  playerName,
  isSignedIn,
  onChangeGuestName,
  consent,
  roomState,
  isHost,
  wsError,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onStartMatch,
  onLeaveRoom,
  onBack,
}: MultiplayerLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 4>(4);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publicRooms, setPublicRooms] = useState<
    Array<{ roomCode: string; playersCount: number; maxPlayers: number; hostName: string }>
  >([]);

  async function refreshPublicRooms() {
    try {
      const res = await ludoApi.getPublicRooms();
      setPublicRooms(res.rooms);
    } catch {
      setPublicRooms([]);
    }
  }

  useEffect(() => {
    refreshPublicRooms();
    const interval = window.setInterval(refreshPublicRooms, 5000);
    return () => window.clearInterval(interval);
  }, []);

  if (roomState && roomState.status === 'waiting') {
    const inviteUrl = roomState.roomCode
      ? `${window.location.origin}/?room=${roomState.roomCode}`
      : '';

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-amber-400">
                {roomState.mode === 'online_private' ? 'Private Room Lobby' : 'Public Match Lobby'}
              </p>
              <h2 className="text-2xl font-extrabold text-white">Waiting for Players</h2>
            </div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="px-3.5 py-2 rounded-lg bg-[#162947] hover:bg-[#1E355B] text-xs font-semibold text-white"
            >
              Leave Room
            </button>
          </div>

          {roomState.roomCode && (
            <div className="p-4 rounded-xl bg-[#081222] border border-amber-400/35 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">Share Room Code or Invite Friends</p>
                  <p className="text-2xl font-mono font-extrabold tracking-widest text-amber-300">
                    {roomState.roomCode}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(roomState.roomCode!).catch(() => {});
                      setCopiedCode(true);
                      window.setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(inviteUrl).catch(() => {});
                      setCopiedLink(true);
                      window.setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#162947] hover:bg-[#1E355B] border border-white/15 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `Join my LUDO STAR room! Code: ${roomState.roomCode}`;
                      if (navigator.share) {
                        navigator.share({ title: 'LUDO STAR Invite', text: shareText, url: inviteUrl }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(`${shareText} ${inviteUrl}`).catch(() => {});
                        setCopiedLink(true);
                        window.setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-[#162947] hover:bg-[#1E355B] border border-white/15 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Share</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Join my LUDO STAR match! Room Code: ${roomState.roomCode} — Tap to play: ${inviteUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#081222] text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-300">
              Joined Players ({roomState.players.length})
            </p>
            <div className="space-y-2">
              {roomState.players.map((seat) => (
                <div
                  key={seat.color}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#091529] border border-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={seat.avatarUrl}
                      alt={seat.name}
                      className="w-9 h-9 rounded-lg object-cover border border-white/15"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{seat.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{seat.color} Seat</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">Ready</span>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={onStartMatch}
              className="w-full py-3.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Match Now (Auto-fill Empty Seats with Bots)</span>
            </button>
          ) : (
            <p className="text-center text-xs text-slate-300 py-2">
              Waiting for the room host to start the match...
            </p>
          )}
        </div>

        <AdMobNativeCard placement="lobby" consent={consent} gameplayActive={false} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#162947] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {isSignedIn ? (
          <p className="text-xs text-slate-300">
            Playing online as <strong className="text-white">{playerName}</strong>
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <UserCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <label htmlFor="guest-name-input" className="text-xs text-slate-300 whitespace-nowrap">
              Your Name:
            </label>
            <input
              id="guest-name-input"
              type="text"
              value={playerName}
              maxLength={24}
              onChange={(e) => onChangeGuestName(e.target.value)}
              placeholder="Enter nickname"
              className="w-36 px-2.5 py-1.5 rounded-lg bg-[#0F1E36] border border-white/15 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {wsError && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-xs text-red-200">
          {wsError}
        </div>
      )}

      {/* Room Size Toggle */}
      <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Online Multiplayer &amp; Private Rooms</h1>
          <p className="text-xs text-slate-300">
            Any player can join with a Room Code, Invite Link, or Public Quick Match — no login required.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-[#081222] border border-white/10">
          <button
            type="button"
            onClick={() => setMaxPlayers(2)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              maxPlayers === 2 ? 'bg-[#F59E0B] text-[#081222]' : 'text-slate-300 hover:text-white'
            }`}
          >
            2 Players
          </button>
          <button
            type="button"
            onClick={() => setMaxPlayers(4)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              maxPlayers === 4 ? 'bg-[#F59E0B] text-[#081222]' : 'text-slate-300 hover:text-white'
            }`}
          >
            4 Players
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Create Private Room */}
        <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="space-y-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white">Create Private Room</h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                Generate a 6-character code or invite link for friends.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onCreateRoom(maxPlayers, true)}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-[#081222] text-xs sm:text-sm font-extrabold transition-colors"
          >
            Create {maxPlayers}P Room
          </button>
        </div>

        {/* Join Private Room with Code */}
        <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-4 sm:p-6 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="space-y-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-white">Join Room Code</h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                Enter a friend&apos;s code to join their table.
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim()) onJoinRoom(joinCode.trim().toUpperCase());
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. A4K9P2"
              maxLength={8}
              className="flex-1 min-w-0 px-3 py-2 sm:py-2.5 rounded-xl bg-[#081222] border border-white/15 text-xs sm:text-sm font-mono uppercase text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#081222] text-xs sm:text-sm font-extrabold transition-colors shrink-0"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Public Quick Match & Open Rooms */}
      <div className="rounded-2xl bg-[#0F1E36] border border-white/10 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Public Online Matchmaking</h2>
              <p className="text-xs text-slate-300">
                Join any open public table or start a new live match.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshPublicRooms}
              aria-label="Refresh public rooms"
              className="p-2.5 rounded-xl bg-[#162947] hover:bg-[#1E355B] text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onQuickMatch(maxPlayers)}
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors"
            >
              Quick Match ({maxPlayers}P)
            </button>
          </div>
        </div>

        {publicRooms.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {publicRooms.map((r) => (
              <div
                key={r.roomCode}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#081222] border border-white/10"
              >
                <div>
                  <p className="text-sm font-bold text-white">{r.hostName}&apos;s Table</p>
                  <p className="text-xs font-mono text-slate-400">
                    {r.roomCode} · {r.playersCount}/{r.maxPlayers} Players
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinRoom(r.roomCode)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] text-[#081222] text-xs font-bold"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 pt-1">
            No open public tables waiting right now — click <strong>Quick Match</strong> to open one!
          </p>
        )}
      </div>

      {/* Native Ad on Game Lobby */}
      <AdMobNativeCard placement="lobby" consent={consent} gameplayActive={false} />
    </div>
  );
}
