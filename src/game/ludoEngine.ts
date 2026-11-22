import type { GameMode, LudoGameState, PlayerColor, PlayerSeat, TokenState } from '../types';

export const PLAYER_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// Clockwise 52-cell outer track on a 15x15 grid [row, col]
export const OUTER_TRACK_COORDS: ReadonlyArray<readonly [number, number]> = [
  [13, 6], // 0: Red Start (Safe)
  [12, 6], // 1
  [11, 6], // 2
  [10, 6], // 3
  [9, 6],  // 4
  [8, 5],  // 5
  [8, 4],  // 6
  [8, 3],  // 7
  [8, 2],  // 8: Star Safe
  [8, 1],  // 9
  [8, 0],  // 10
  [7, 0],  // 11
  [6, 0],  // 12
  [6, 1],  // 13: Green Start (Safe)
  [6, 2],  // 14
  [6, 3],  // 15
  [6, 4],  // 16
  [6, 5],  // 17
  [5, 6],  // 18
  [4, 6],  // 19
  [3, 6],  // 20
  [2, 6],  // 21: Star Safe
  [1, 6],  // 22
  [0, 6],  // 23
  [0, 7],  // 24
  [0, 8],  // 25
  [1, 8],  // 26: Yellow Start (Safe)
  [2, 8],  // 27
  [3, 8],  // 28
  [4, 8],  // 29
  [5, 8],  // 30
  [6, 9],  // 31
  [6, 10], // 32
  [6, 11], // 33
  [6, 12], // 34: Star Safe
  [6, 13], // 35
  [6, 14], // 36
  [7, 14], // 37
  [8, 14], // 38
  [8, 13], // 39: Blue Start (Safe)
  [8, 12], // 40
  [8, 11], // 41
  [8, 10], // 42
  [8, 9],  // 43
  [9, 8],  // 44
  [10, 8], // 45
  [11, 8], // 46
  [12, 8], // 47: Star Safe
  [13, 8], // 48
  [14, 8], // 49
  [14, 7], // 50
  [14, 6], // 51
];

export const START_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

export const HOME_STRETCH_COORDS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7], // 56: Goal
  ],
  green: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6], // 56: Goal
  ],
  yellow: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7], // 56: Goal
  ],
  blue: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8], // 56: Goal
  ],
};

export const YARD_SLOT_COORDS: Record<PlayerColor, ReadonlyArray<readonly [number, number]>> = {
  red: [
    [10.8, 1.8],
    [10.8, 3.2],
    [12.2, 1.8],
    [12.2, 3.2],
  ],
  green: [
    [1.8, 1.8],
    [1.8, 3.2],
    [3.2, 1.8],
    [3.2, 3.2],
  ],
  yellow: [
    [1.8, 10.8],
    [1.8, 12.2],
    [3.2, 10.8],
    [3.2, 12.2],
  ],
  blue: [
    [10.8, 10.8],
    [10.8, 12.2],
    [12.2, 10.8],
    [12.2, 12.2],
  ],
};

export function getGlobalTrackIndex(color: PlayerColor, relPos: number): number | null {
  if (relPos < 0 || relPos > 50) return null;
  return (START_OFFSET[color] + relPos) % 52;
}

export function getTokenBoardCoord(token: TokenState): readonly [number, number] {
  if (token.pos === -1) {
    return YARD_SLOT_COORDS[token.color][token.id];
  }
  if (token.pos >= 0 && token.pos <= 50) {
    const trackIdx = getGlobalTrackIndex(token.color, token.pos)!;
    return OUTER_TRACK_COORDS[trackIdx];
  }
  const stretchIdx = Math.min(5, Math.max(0, token.pos - 51));
  return HOME_STRETCH_COORDS[token.color][stretchIdx];
}

export function createInitialTokens(): Record<PlayerColor, TokenState[]> {
  return {
    red: [0, 1, 2, 3].map((id) => ({ id, color: 'red', pos: -1 })),
    green: [0, 1, 2, 3].map((id) => ({ id, color: 'green', pos: -1 })),
    yellow: [0, 1, 2, 3].map((id) => ({ id, color: 'yellow', pos: -1 })),
    blue: [0, 1, 2, 3].map((id) => ({ id, color: 'blue', pos: -1 })),
  };
}

export function createLocalGame(
  mode: GameMode,
  playerName: string,
  playerAvatar: string,
  botAvatar: string
): LudoGameState {
  const players: PlayerSeat[] = [];

  if (mode === 'vs_ai_2p') {
    players.push(
      { color: 'red', name: playerName, avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'yellow', name: 'Astra Bot', avatarUrl: botAvatar, isBot: true, finishedOrder: null }
    );
  } else if (mode === 'vs_ai_4p') {
    players.push(
      { color: 'red', name: playerName, avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'green', name: 'Orion Bot', avatarUrl: botAvatar, isBot: true, finishedOrder: null },
      { color: 'yellow', name: 'Nova Bot', avatarUrl: botAvatar, isBot: true, finishedOrder: null },
      { color: 'blue', name: 'Vega Bot', avatarUrl: botAvatar, isBot: true, finishedOrder: null }
    );
  } else if (mode === 'local_2p') {
    players.push(
      { color: 'red', name: `${playerName} (P1)`, avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'yellow', name: 'Player 2', avatarUrl: playerAvatar, isBot: false, finishedOrder: null }
    );
  } else {
    players.push(
      { color: 'red', name: `${playerName} (P1)`, avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'green', name: 'Player 2', avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'yellow', name: 'Player 3', avatarUrl: playerAvatar, isBot: false, finishedOrder: null },
      { color: 'blue', name: 'Player 4', avatarUrl: playerAvatar, isBot: false, finishedOrder: null }
    );
  }

  return {
    roomId: `local-${Date.now()}`,
    mode,
    status: 'playing',
    players,
    tokens: createInitialTokens(),
    currentTurnIndex: 0,
    phase: 'awaiting_roll',
    diceValue: null,
    consecutiveSixes: 0,
    lastAction: `${players[0].name}'s turn — Roll the dice!`,
    winnerColor: null,
    turnCount: 0,
    startedAt: Date.now(),
  };
}

export function getLegalTokenIds(
  tokens: Record<PlayerColor, TokenState[]>,
  color: PlayerColor,
  dice: number
): number[] {
  const list = tokens[color] || [];
  const movable: number[] = [];
  for (const t of list) {
    if (t.pos === 56) continue;
    if (t.pos === -1) {
      if (dice === 6) movable.push(t.id);
    } else if (t.pos + dice <= 56) {
      movable.push(t.id);
    }
  }
  return movable;
}

function advanceTurnIndex(state: LudoGameState): number {
  const total = state.players.length;
  for (let offset = 1; offset <= total; offset++) {
    const idx = (state.currentTurnIndex + offset) % total;
    if (state.players[idx].finishedOrder === null) {
      return idx;
    }
  }
  return state.currentTurnIndex;
}

export function applyDiceRoll(
  state: LudoGameState,
  forcedRoll?: number
): { nextState: LudoGameState; roll: number; autoPassed: boolean } {
  if (state.status !== 'playing' || state.phase !== 'awaiting_roll') {
    return { nextState: state, roll: state.diceValue || 1, autoPassed: false };
  }

  const roll = forcedRoll ?? Math.floor(Math.random() * 6) + 1;
  const activePlayer = state.players[state.currentTurnIndex];
  const nextSixes = roll === 6 ? state.consecutiveSixes + 1 : 0;

  // Official Ludo rule: 3 consecutive 6s forfeits turn
  if (nextSixes >= 3) {
    const nextIdx = advanceTurnIndex(state);
    const nextPlayer = state.players[nextIdx];
    return {
      roll,
      autoPassed: true,
      nextState: {
        ...state,
        diceValue: roll,
        consecutiveSixes: 0,
        currentTurnIndex: nextIdx,
        phase: 'awaiting_roll',
        turnCount: state.turnCount + 1,
        lastAction: `${activePlayer.name} rolled three 6s! Turn passes to ${nextPlayer.name}.`,
      },
    };
  }

  const legalIds = getLegalTokenIds(state.tokens, activePlayer.color, roll);
  if (legalIds.length === 0) {
    const nextIdx = advanceTurnIndex(state);
    const nextPlayer = state.players[nextIdx];
    return {
      roll,
      autoPassed: true,
      nextState: {
        ...state,
        diceValue: roll,
        consecutiveSixes: 0,
        currentTurnIndex: nextIdx,
        phase: 'awaiting_roll',
        turnCount: state.turnCount + 1,
        lastAction: `${activePlayer.name} rolled ${roll} (no legal moves). ${nextPlayer.name}'s turn.`,
      },
    };
  }

  return {
    roll,
    autoPassed: false,
    nextState: {
      ...state,
      diceValue: roll,
      consecutiveSixes: nextSixes,
      phase: 'awaiting_move',
      lastAction: `${activePlayer.name} rolled ${roll}! Choose a highlighted token.`,
    },
  };
}

export function applyTokenMove(
  state: LudoGameState,
  tokenId: number
): {
  nextState: LudoGameState;
  moved: boolean;
  captured: boolean;
  reachedGoal: boolean;
  wonGame: boolean;
} {
  if (state.status !== 'playing' || state.phase !== 'awaiting_move' || state.diceValue === null) {
    return { nextState: state, moved: false, captured: false, reachedGoal: false, wonGame: false };
  }

  const activePlayer = state.players[state.currentTurnIndex];
  const dice = state.diceValue;
  const legal = getLegalTokenIds(state.tokens, activePlayer.color, dice);
  if (!legal.includes(tokenId)) {
    return { nextState: state, moved: false, captured: false, reachedGoal: false, wonGame: false };
  }

  const nextTokens: Record<PlayerColor, TokenState[]> = {
    red: state.tokens.red.map((t) => ({ ...t })),
    green: state.tokens.green.map((t) => ({ ...t })),
    yellow: state.tokens.yellow.map((t) => ({ ...t })),
    blue: state.tokens.blue.map((t) => ({ ...t })),
  };

  const movingToken = nextTokens[activePlayer.color][tokenId];
  const newPos = movingToken.pos === -1 ? 0 : movingToken.pos + dice;
  movingToken.pos = newPos;

  let captured = false;
  let capturedNames: string[] = [];

  // Check capture on outer track if not safe square
  const globalIdx = getGlobalTrackIndex(activePlayer.color, newPos);
  if (globalIdx !== null && !SAFE_TRACK_INDICES.has(globalIdx)) {
    for (const seat of state.players) {
      if (seat.color === activePlayer.color) continue;
      for (const oppToken of nextTokens[seat.color]) {
        const oppGlobal = getGlobalTrackIndex(seat.color, oppToken.pos);
        if (oppGlobal === globalIdx) {
          oppToken.pos = -1;
          captured = true;
          capturedNames.push(seat.name);
        }
      }
    }
  }

  const reachedGoal = newPos === 56;
  const allFinished = nextTokens[activePlayer.color].every((t) => t.pos === 56);

  const nextPlayers = state.players.map((p) => ({ ...p }));
  let winnerColor = state.winnerColor;
  let nextStatus: LudoGameState['status'] = state.status;
  let wonGame = false;

  if (allFinished && nextPlayers[state.currentTurnIndex].finishedOrder === null) {
    const finishedCount = nextPlayers.filter((p) => p.finishedOrder !== null).length;
    nextPlayers[state.currentTurnIndex].finishedOrder = finishedCount + 1;
    if (finishedCount === 0) {
      winnerColor = activePlayer.color;
      wonGame = true;
      nextStatus = 'finished';
    }
  }

  if (wonGame) {
    return {
      moved: true,
      captured,
      reachedGoal,
      wonGame: true,
      nextState: {
        ...state,
        status: 'finished',
        phase: 'finished',
        players: nextPlayers,
        tokens: nextTokens,
        winnerColor,
        diceValue: null,
        consecutiveSixes: 0,
        lastAction: `${activePlayer.name} wins the match!`,
      },
    };
  }

  const bonusTurn = dice === 6 || captured || reachedGoal;
  const nextTurnIndex = bonusTurn ? state.currentTurnIndex : advanceTurnIndex(state);
  const nextPlayer = nextPlayers[nextTurnIndex];

  let message = `${activePlayer.name} moved a token.`;
  if (captured) {
    message = `${activePlayer.name} captured ${capturedNames[0]} and earned a bonus roll!`;
  } else if (reachedGoal) {
    message = `${activePlayer.name} reached Home Goal and earned a bonus roll!`;
  } else if (dice === 6) {
    message = `${activePlayer.name} rolled a 6 — roll again!`;
  } else {
    message = `${nextPlayer.name}'s turn — roll the dice.`;
  }

  return {
    moved: true,
    captured,
    reachedGoal,
    wonGame: false,
    nextState: {
      ...state,
      players: nextPlayers,
      tokens: nextTokens,
      currentTurnIndex: nextTurnIndex,
      phase: 'awaiting_roll',
      diceValue: null,
      consecutiveSixes: bonusTurn && dice === 6 ? state.consecutiveSixes : 0,
      turnCount: state.turnCount + 1,
      lastAction: message,
    },
  };
}

export function chooseBotTokenId(state: LudoGameState): number | null {
  if (state.diceValue === null) return null;
  const activePlayer = state.players[state.currentTurnIndex];
  const dice = state.diceValue;
  const legal = getLegalTokenIds(state.tokens, activePlayer.color, dice);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  let bestId = legal[0];
  let bestScore = -Infinity;

  for (const id of legal) {
    const token = state.tokens[activePlayer.color][id];
    const targetPos = token.pos === -1 ? 0 : token.pos + dice;
    let score = 0;

    if (targetPos === 56) score += 200; // Finish token
    if (token.pos === -1 && dice === 6) score += 80; // Spawn from yard

    const globalIdx = getGlobalTrackIndex(activePlayer.color, targetPos);
    if (globalIdx !== null) {
      if (SAFE_TRACK_INDICES.has(globalIdx)) {
        score += 45;
      } else {
        // Check capture opportunity
        for (const seat of state.players) {
          if (seat.color === activePlayer.color) continue;
          for (const opp of state.tokens[seat.color]) {
            if (getGlobalTrackIndex(seat.color, opp.pos) === globalIdx) {
              score += 150;
            }
          }
        }
      }
    }

    if (targetPos >= 51 && targetPos < 56) score += 65; // Safe home stretch
    score += Math.max(0, targetPos); // Prefer advancing lead token

    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return bestId;
}
