import type { Server as HttpServer } from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  applyDiceRoll,
  applyTokenMove,
  chooseBotTokenId,
  createInitialTokens,
} from '../src/game/ludoEngine.ts';
import type { LudoGameState, PlayerColor, PlayerSeat } from '../src/types.ts';
import { db } from './ludoDb.ts';

interface ClientConnection {
  ws: WebSocket;
  clientId: string;
  userId: number | null;
  name: string;
  avatarUrl: string;
  roomCode: string | null;
}

interface ServerRoom {
  roomCode: string;
  isPrivate: boolean;
  maxPlayers: 2 | 4;
  hostClientId: string;
  seats: Array<PlayerSeat & { clientId: string | null }>;
  state: LudoGameState;
  botTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

const rooms = new Map<string, ServerRoom>();
const connections = new Map<WebSocket, ClientConnection>();

const PLAYER_AVATAR = '/src/assets/images/avatar_champion_one_1795161899775.jpg';
const BOT_AVATAR = '/src/assets/images/avatar_ai_bot_1795161899436.jpg';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getColorsForSize(maxPlayers: 2 | 4): PlayerColor[] {
  return maxPlayers === 2 ? ['red', 'yellow'] : ['red', 'green', 'yellow', 'blue'];
}

function broadcastRoom(room: ServerRoom): void {
  for (const conn of connections.values()) {
    if (conn.roomCode === room.roomCode && conn.ws.readyState === WebSocket.OPEN) {
      const seat = room.seats.find((s) => s.clientId === conn.clientId);
      conn.ws.send(
        JSON.stringify({
          type: 'room_state',
          state: room.state,
          hostClientId: room.hostClientId,
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
          yourColor: seat?.color || null,
        })
      );
    }
  }
}

function syncPlayersIntoState(room: ServerRoom): void {
  room.state.players = room.seats.map((s) => ({
    color: s.color,
    name: s.name,
    avatarUrl: s.avatarUrl,
    isBot: s.isBot,
    userId: s.userId,
    connected: s.connected,
    finishedOrder: s.finishedOrder,
  }));
}

function recordOnlineMatchCompletion(room: ServerRoom): void {
  if (!room.state.winnerColor) return;
  const winnerSeat = room.seats.find((s) => s.color === room.state.winnerColor);
  const durationSeconds = Math.max(10, Math.floor((Date.now() - room.state.startedAt) / 1000));

  db.prepare(
    `INSERT INTO matches (mode, winner_user_id, winner_name, winner_color, players_count, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    room.isPrivate ? 'online_private' : 'online_public',
    winnerSeat?.userId || null,
    winnerSeat?.name || 'Player',
    room.state.winnerColor,
    room.seats.length,
    durationSeconds
  );

  for (const seat of room.seats) {
    if (!seat.isBot && seat.userId) {
      const isWinner = seat.color === room.state.winnerColor;
      const rewardCoins = isWinner ? 200 : 40;
      db.prepare(
        `UPDATE users
         SET matches_played = matches_played + 1,
             wins = wins + ?,
             coins = coins + ?
         WHERE id = ?`
      ).run(isWinner ? 1 : 0, rewardCoins, seat.userId);
    }
  }
}

function scheduleBotTurnIfNeeded(room: ServerRoom): void {
  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = null;
  }
  if (room.state.status !== 'playing') return;

  const activeSeat = room.state.players[room.state.currentTurnIndex];
  if (!activeSeat || !activeSeat.isBot) return;

  room.botTimer = setTimeout(() => {
    if (room.state.status !== 'playing') return;
    if (room.state.phase === 'awaiting_roll') {
      const { nextState, autoPassed } = applyDiceRoll(room.state);
      room.state = nextState;
      broadcastRoom(room);
      if (autoPassed) {
        scheduleBotTurnIfNeeded(room);
      } else {
        scheduleBotTurnIfNeeded(room);
      }
      return;
    }

    if (room.state.phase === 'awaiting_move') {
      const tokenId = chooseBotTokenId(room.state);
      if (tokenId !== null) {
        const res = applyTokenMove(room.state, tokenId);
        room.state = res.nextState;
        broadcastRoom(room);
        if (res.wonGame) {
          recordOnlineMatchCompletion(room);
          return;
        }
      }
      scheduleBotTurnIfNeeded(room);
    }
  }, 650);
}

function createRoomForClient(
  conn: ClientConnection,
  maxPlayers: 2 | 4,
  isPrivate: boolean
): ServerRoom {
  const roomCode = generateRoomCode();
  const colors = getColorsForSize(maxPlayers);

  const seats: Array<PlayerSeat & { clientId: string | null }> = [
    {
      color: colors[0],
      name: conn.name,
      avatarUrl: conn.avatarUrl || PLAYER_AVATAR,
      isBot: false,
      userId: conn.userId,
      connected: true,
      finishedOrder: null,
      clientId: conn.clientId,
    },
  ];

  const state: LudoGameState = {
    roomId: `room-${roomCode}`,
    roomCode,
    mode: isPrivate ? 'online_private' : 'online_public',
    status: 'waiting',
    players: [],
    tokens: createInitialTokens(),
    currentTurnIndex: 0,
    phase: 'awaiting_roll',
    diceValue: null,
    consecutiveSixes: 0,
    lastAction: `Room ${roomCode} created. Share the code or start with bots!`,
    winnerColor: null,
    turnCount: 0,
    startedAt: Date.now(),
    chatMessages: [],
  };

  const room: ServerRoom = {
    roomCode,
    isPrivate,
    maxPlayers,
    hostClientId: conn.clientId,
    seats,
    state,
    botTimer: null,
    createdAt: Date.now(),
  };

  syncPlayersIntoState(room);
  rooms.set(roomCode, room);
  conn.roomCode = roomCode;
  return room;
}

function leaveCurrentRoom(conn: ClientConnection): void {
  if (!conn.roomCode) return;
  const room = rooms.get(conn.roomCode);
  conn.roomCode = null;
  if (!room) return;

  const seatIdx = room.seats.findIndex((s) => s.clientId === conn.clientId);
  if (seatIdx !== -1) {
    if (room.state.status === 'waiting') {
      room.seats.splice(seatIdx, 1);
    } else {
      // Convert disconnected seat into a bot so match continues smoothly for remaining friends
      room.seats[seatIdx].isBot = true;
      room.seats[seatIdx].connected = false;
      room.seats[seatIdx].clientId = null;
      room.seats[seatIdx].name = `${room.seats[seatIdx].name} (Auto)`;
      room.state.lastAction = `${room.seats[seatIdx].name} switched to Auto-Bot.`;
    }
  }

  const remainingHumans = room.seats.filter((s) => !s.isBot && s.clientId);
  if (remainingHumans.length === 0) {
    if (room.botTimer) clearTimeout(room.botTimer);
    rooms.delete(room.roomCode);
    return;
  }

  if (room.hostClientId === conn.clientId) {
    room.hostClientId = remainingHumans[0].clientId!;
  }
  syncPlayersIntoState(room);
  broadcastRoom(room);
  scheduleBotTurnIfNeeded(room);
}

export function getPublicRoomsSummary() {
  const list: Array<{
    roomCode: string;
    playersCount: number;
    maxPlayers: number;
    hostName: string;
  }> = [];

  for (const room of rooms.values()) {
    if (!room.isPrivate && room.state.status === 'waiting' && room.seats.length < room.maxPlayers) {
      list.push({
        roomCode: room.roomCode,
        playersCount: room.seats.length,
        maxPlayers: room.maxPlayers,
        hostName: room.seats[0]?.name || 'Host',
      });
    }
  }
  return list;
}

export function getActiveRoomsCount(): number {
  return rooms.size;
}

export function setupMultiplayer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = crypto.randomBytes(6).toString('hex');
    const conn: ClientConnection = {
      ws,
      clientId,
      userId: null,
      name: 'Guest Player',
      avatarUrl: PLAYER_AVATAR,
      roomCode: null,
    };
    connections.set(ws, conn);

    ws.send(JSON.stringify({ type: 'welcome', clientId }));

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const action = String(msg.type || '');

      if (action === 'identify') {
        conn.name = String(msg.name || 'Guest Player').trim().slice(0, 32) || 'Guest Player';
        conn.userId = typeof msg.userId === 'number' ? msg.userId : null;
        if (typeof msg.avatarUrl === 'string' && msg.avatarUrl) {
          conn.avatarUrl = msg.avatarUrl;
        }
        return;
      }

      if (action === 'create_room') {
        leaveCurrentRoom(conn);
        if (typeof msg.name === 'string' && msg.name.trim()) {
          conn.name = msg.name.trim().slice(0, 32);
        }
        if (typeof msg.userId === 'number') conn.userId = msg.userId;
        const maxPlayers = msg.maxPlayers === 2 ? 2 : 4;
        const isPrivate = msg.isPrivate !== false;
        const room = createRoomForClient(conn, maxPlayers, isPrivate);
        broadcastRoom(room);
        return;
      }

      if (action === 'join_room') {
        leaveCurrentRoom(conn);
        if (typeof msg.name === 'string' && msg.name.trim()) {
          conn.name = msg.name.trim().slice(0, 32);
        }
        if (typeof msg.userId === 'number') conn.userId = msg.userId;

        const code = String(msg.roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', error: `Room "${code}" not found` }));
          return;
        }
        if (room.state.status !== 'waiting') {
          ws.send(JSON.stringify({ type: 'error', error: 'Match already started in that room' }));
          return;
        }
        if (room.seats.length >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'error', error: 'Room is already full' }));
          return;
        }

        const colors = getColorsForSize(room.maxPlayers);
        const nextColor = colors[room.seats.length];
        room.seats.push({
          color: nextColor,
          name: conn.name,
          avatarUrl: conn.avatarUrl || PLAYER_AVATAR,
          isBot: false,
          userId: conn.userId,
          connected: true,
          finishedOrder: null,
          clientId: conn.clientId,
        });
        conn.roomCode = room.roomCode;
        room.state.lastAction = `${conn.name} joined the room!`;
        syncPlayersIntoState(room);

        if (room.seats.length === room.maxPlayers) {
          room.state.status = 'playing';
          room.state.startedAt = Date.now();
          room.state.lastAction = `All ${room.maxPlayers} players ready! ${room.seats[0].name} rolls first.`;
        }
        broadcastRoom(room);
        return;
      }

      if (action === 'quick_match') {
        leaveCurrentRoom(conn);
        if (typeof msg.name === 'string' && msg.name.trim()) {
          conn.name = msg.name.trim().slice(0, 32);
        }
        if (typeof msg.userId === 'number') conn.userId = msg.userId;

        const desiredPlayers = msg.maxPlayers === 2 ? 2 : 4;
        let openRoom: ServerRoom | null = null;
        for (const r of rooms.values()) {
          if (
            !r.isPrivate &&
            r.maxPlayers === desiredPlayers &&
            r.state.status === 'waiting' &&
            r.seats.length < r.maxPlayers
          ) {
            openRoom = r;
            break;
          }
        }

        if (!openRoom) {
          const created = createRoomForClient(conn, desiredPlayers, false);
          broadcastRoom(created);
          return;
        }

        const colors = getColorsForSize(openRoom.maxPlayers);
        const nextColor = colors[openRoom.seats.length];
        openRoom.seats.push({
          color: nextColor,
          name: conn.name,
          avatarUrl: conn.avatarUrl || PLAYER_AVATAR,
          isBot: false,
          userId: conn.userId,
          connected: true,
          finishedOrder: null,
          clientId: conn.clientId,
        });
        conn.roomCode = openRoom.roomCode;
        openRoom.state.lastAction = `${conn.name} joined the match!`;
        syncPlayersIntoState(openRoom);

        if (openRoom.seats.length === openRoom.maxPlayers) {
          openRoom.state.status = 'playing';
          openRoom.state.startedAt = Date.now();
          openRoom.state.lastAction = `Match started! ${openRoom.seats[0].name}'s turn.`;
        }
        broadcastRoom(openRoom);
        return;
      }

      if (action === 'start_match') {
        if (!conn.roomCode) return;
        const room = rooms.get(conn.roomCode);
        if (!room || room.hostClientId !== conn.clientId || room.state.status !== 'waiting') return;

        const colors = getColorsForSize(room.maxPlayers);
        const botNames = ['Astra Bot', 'Orion Bot', 'Nova Bot', 'Vega Bot'];
        while (room.seats.length < room.maxPlayers) {
          const idx = room.seats.length;
          room.seats.push({
            color: colors[idx],
            name: botNames[idx] || `Bot ${idx}`,
            avatarUrl: BOT_AVATAR,
            isBot: true,
            userId: null,
            connected: true,
            finishedOrder: null,
            clientId: null,
          });
        }
        room.state.status = 'playing';
        room.state.startedAt = Date.now();
        room.state.lastAction = `Match started! ${room.seats[0].name} rolls first.`;
        syncPlayersIntoState(room);
        broadcastRoom(room);
        scheduleBotTurnIfNeeded(room);
        return;
      }

      if (action === 'roll_dice') {
        if (!conn.roomCode) return;
        const room = rooms.get(conn.roomCode);
        if (!room || room.state.status !== 'playing') return;
        const activeSeat = room.seats[room.state.currentTurnIndex];
        if (!activeSeat || activeSeat.clientId !== conn.clientId) return;

        const { nextState, autoPassed } = applyDiceRoll(room.state);
        room.state = nextState;
        broadcastRoom(room);
        if (autoPassed) {
          scheduleBotTurnIfNeeded(room);
        }
        return;
      }

      if (action === 'move_token') {
        if (!conn.roomCode) return;
        const room = rooms.get(conn.roomCode);
        if (!room || room.state.status !== 'playing') return;
        const activeSeat = room.seats[room.state.currentTurnIndex];
        if (!activeSeat || activeSeat.clientId !== conn.clientId) return;

        const tokenId = Number(msg.tokenId);
        const res = applyTokenMove(room.state, tokenId);
        if (!res.moved) return;

        room.state = res.nextState;
        broadcastRoom(room);
        if (res.wonGame) {
          recordOnlineMatchCompletion(room);
        } else {
          scheduleBotTurnIfNeeded(room);
        }
        return;
      }

      if (action === 'chat_message') {
        if (!conn.roomCode) return;
        const room = rooms.get(conn.roomCode);
        if (!room) return;
        const seat = room.seats.find((s) => s.clientId === conn.clientId);
        if (!seat) return;
        const text = String(msg.text || '').trim().slice(0, 80);
        if (!text) return;
        const msgs = room.state.chatMessages || [];
        msgs.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: seat.name,
          color: seat.color,
          text,
          ts: Date.now(),
        });
        room.state.chatMessages = msgs.slice(-20);
        broadcastRoom(room);
        return;
      }

      if (action === 'leave_room') {
        leaveCurrentRoom(conn);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(conn);
      connections.delete(ws);
    });
  });
}
