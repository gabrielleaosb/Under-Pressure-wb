const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3001;

// ==================== GAME DATA ====================

const THEMES = [
  { id: 0,  emoji: '🎬', namePT: 'Filmes & Séries',      nameEN: 'Movies & TV',        color: '#ff6b6b' },
  { id: 1,  emoji: '🍕', namePT: 'Comida & Bebida',       nameEN: 'Food & Drinks',       color: '#ffa07a' },
  { id: 2,  emoji: '🔬', namePT: 'Ciência & Tech',        nameEN: 'Science & Tech',      color: '#00ced1' },
  { id: 3,  emoji: '⚽', namePT: 'Esportes',              nameEN: 'Sports',              color: '#32cd32' },
  { id: 4,  emoji: '🎵', namePT: 'Música',                nameEN: 'Music',               color: '#ff69b4' },
  { id: 5,  emoji: '🌿', namePT: 'Natureza & Animais',    nameEN: 'Nature & Animals',    color: '#5dbb63' },
  { id: 6,  emoji: '🏛️', namePT: 'História & Geografia',  nameEN: 'History & Geography', color: '#d2691e' },
  { id: 7,  emoji: '🎮', namePT: 'Videogames',            nameEN: 'Video Games',         color: '#9400d3' },
  { id: 8,  emoji: '💼', namePT: 'Trabalho & Carreira',   nameEN: 'Work & Career',       color: '#4169e1' },
  { id: 9,  emoji: '🧠', namePT: 'Filosofia & Emoções',   nameEN: 'Philosophy',          color: '#ff8c00' },
  { id: 10, emoji: '🛸', namePT: 'Espaço & Ficção',       nameEN: 'Space & Sci-Fi',      color: '#00bfff' },
  { id: 11, emoji: '🎭', namePT: 'Cultura Pop',           nameEN: 'Pop Culture',         color: '#ff1493' },
];

const CARDS = [
  // 0 — Movies & TV
  { id:  0, t: 0, lP: 'Previsível',     lE: 'Predictable',   rP: 'Surpreendente',  rE: 'Surprising'    },
  { id:  1, t: 0, lP: 'Lento',          lE: 'Slow-paced',    rP: 'Frenético',      rE: 'Action-packed' },
  { id:  2, t: 0, lP: 'Sério',          lE: 'Serious',       rP: 'Cômico',         rE: 'Comedic'       },
  { id:  3, t: 0, lP: 'Clássico',       lE: 'Classic',       rP: 'Contemporâneo',  rE: 'Contemporary'  },
  { id:  4, t: 0, lP: 'Arthouse',       lE: 'Arthouse',      rP: 'Blockbuster',    rE: 'Blockbuster'   },
  // 1 — Food & Drinks
  { id:  5, t: 1, lP: 'Saudável',       lE: 'Healthy',       rP: 'Indulgente',     rE: 'Indulgent'     },
  { id:  6, t: 1, lP: 'Suave',          lE: 'Mild',          rP: 'Apimentado',     rE: 'Spicy'         },
  { id:  7, t: 1, lP: 'Doce',           lE: 'Sweet',         rP: 'Amargo',         rE: 'Bitter'        },
  { id:  8, t: 1, lP: 'Barato',         lE: 'Budget',        rP: 'Sofisticado',    rE: 'Gourmet'       },
  { id:  9, t: 1, lP: 'Cru',            lE: 'Raw',           rP: 'Muito Cozido',   rE: 'Overcooked'    },
  // 2 — Science & Tech
  { id: 10, t: 2, lP: 'Comprovado',     lE: 'Proven',        rP: 'Teórico',        rE: 'Theoretical'   },
  { id: 11, t: 2, lP: 'Simples',        lE: 'Simple',        rP: 'Complexo',       rE: 'Complex'       },
  { id: 12, t: 2, lP: 'Seguro',         lE: 'Safe',          rP: 'Perigoso',       rE: 'Dangerous'     },
  { id: 13, t: 2, lP: 'Analógico',      lE: 'Analog',        rP: 'Digital',        rE: 'Digital'       },
  { id: 14, t: 2, lP: 'Obsoleto',       lE: 'Obsolete',      rP: 'Futurístico',    rE: 'Futuristic'    },
  // 3 — Sports
  { id: 15, t: 3, lP: 'Individual',     lE: 'Solo',          rP: 'Coletivo',       rE: 'Team'          },
  { id: 16, t: 3, lP: 'Físico',         lE: 'Physical',      rP: 'Mental',         rE: 'Mental'        },
  { id: 17, t: 3, lP: 'Devagar',        lE: 'Slow',          rP: 'Veloz',          rE: 'Fast'          },
  { id: 18, t: 3, lP: 'Amador',         lE: 'Amateur',       rP: 'Profissional',   rE: 'Professional'  },
  { id: 19, t: 3, lP: 'Seguro',         lE: 'Safe',          rP: 'Radical',        rE: 'Extreme'       },
  // 4 — Music
  { id: 20, t: 4, lP: 'Calmo',          lE: 'Calm',          rP: 'Agitado',        rE: 'Intense'       },
  { id: 21, t: 4, lP: 'Simples',        lE: 'Simple',        rP: 'Elaborado',      rE: 'Complex'       },
  { id: 22, t: 4, lP: 'Melancólico',    lE: 'Melancholic',   rP: 'Animado',        rE: 'Upbeat'        },
  { id: 23, t: 4, lP: 'Acústico',       lE: 'Acoustic',      rP: 'Eletrônico',     rE: 'Electronic'    },
  { id: 24, t: 4, lP: 'Old-school',     lE: 'Old-school',    rP: 'Contemporâneo',  rE: 'Contemporary'  },
  // 5 — Nature & Animals
  { id: 25, t: 5, lP: 'Doméstico',      lE: 'Domestic',      rP: 'Selvagem',       rE: 'Wild'          },
  { id: 26, t: 5, lP: 'Microscópico',   lE: 'Microscopic',   rP: 'Gigantesco',     rE: 'Gigantic'      },
  { id: 27, t: 5, lP: 'Dócil',          lE: 'Gentle',        rP: 'Feroz',          rE: 'Fierce'        },
  { id: 28, t: 5, lP: 'Terrestre',      lE: 'Land',          rP: 'Aquático',       rE: 'Aquatic'       },
  { id: 29, t: 5, lP: 'Raro',           lE: 'Rare',          rP: 'Comum',          rE: 'Common'        },
  // 6 — History & Geography
  { id: 30, t: 6, lP: 'Antigo',         lE: 'Ancient',       rP: 'Moderno',        rE: 'Modern'        },
  { id: 31, t: 6, lP: 'Local',          lE: 'Local',         rP: 'Global',         rE: 'Global'        },
  { id: 32, t: 6, lP: 'Pacífico',       lE: 'Peaceful',      rP: 'Conflituoso',    rE: 'Conflict-torn' },
  { id: 33, t: 6, lP: 'Esquecido',      lE: 'Forgotten',     rP: 'Famoso',         rE: 'Renowned'      },
  { id: 34, t: 6, lP: 'Pequena Nação',  lE: 'Small Nation',  rP: 'Império',        rE: 'Empire'        },
  // 7 — Video Games
  { id: 35, t: 7, lP: 'Casual',         lE: 'Casual',        rP: 'Hardcore',       rE: 'Hardcore'      },
  { id: 36, t: 7, lP: 'Solo',           lE: 'Singleplayer',  rP: 'Multiplayer',    rE: 'Multiplayer'   },
  { id: 37, t: 7, lP: 'Fácil',          lE: 'Easy',          rP: 'Impossível',     rE: 'Impossible'    },
  { id: 38, t: 7, lP: 'Curto',          lE: 'Short',         rP: 'Interminável',   rE: 'Endless'       },
  { id: 39, t: 7, lP: 'Realista',       lE: 'Realistic',     rP: 'Fantasioso',     rE: 'Fantasy'       },
  // 8 — Work & Career
  { id: 40, t: 8, lP: 'Criativo',       lE: 'Creative',      rP: 'Técnico',        rE: 'Technical'     },
  { id: 41, t: 8, lP: 'Estressante',    lE: 'Stressful',     rP: 'Tranquilo',      rE: 'Relaxed'       },
  { id: 42, t: 8, lP: 'Bem Pago',       lE: 'Well-paid',     rP: 'Explorado',      rE: 'Underpaid'     },
  { id: 43, t: 8, lP: 'Solitário',      lE: 'Solitary',      rP: 'Social',         rE: 'Social'        },
  { id: 44, t: 8, lP: 'Manual',         lE: 'Manual',        rP: 'Intelectual',    rE: 'Intellectual'  },
  // 9 — Philosophy & Emotions
  { id: 45, t: 9, lP: 'Otimista',       lE: 'Optimistic',    rP: 'Pessimista',     rE: 'Pessimistic'   },
  { id: 46, t: 9, lP: 'Racional',       lE: 'Rational',      rP: 'Emocional',      rE: 'Emotional'     },
  { id: 47, t: 9, lP: 'Egoísta',        lE: 'Selfish',       rP: 'Altruísta',      rE: 'Altruistic'    },
  { id: 48, t: 9, lP: 'Medo',           lE: 'Fear',          rP: 'Coragem',        rE: 'Courage'       },
  { id: 49, t: 9, lP: 'Caos',           lE: 'Chaos',         rP: 'Ordem',          rE: 'Order'         },
  // 10 — Space & Sci-Fi
  { id: 50, t: 10, lP: 'Próximo',       lE: 'Near',          rP: 'Infinito',       rE: 'Infinite'      },
  { id: 51, t: 10, lP: 'Habitável',     lE: 'Habitable',     rP: 'Hostil',         rE: 'Hostile'       },
  { id: 52, t: 10, lP: 'Descoberto',    lE: 'Discovered',    rP: 'Misterioso',     rE: 'Mysterious'    },
  { id: 53, t: 10, lP: 'Micro',         lE: 'Small-scale',   rP: 'Cósmico',        rE: 'Cosmic'        },
  { id: 54, t: 10, lP: 'Real',          lE: 'Real',          rP: 'Ficção',         rE: 'Fiction'       },
  // 11 — Pop Culture
  { id: 55, t: 11, lP: 'Cult',          lE: 'Cult',          rP: 'Mainstream',     rE: 'Mainstream'    },
  { id: 56, t: 11, lP: 'Nostálgico',    lE: 'Nostalgic',     rP: 'Atual',          rE: 'Current'       },
  { id: 57, t: 11, lP: 'Sério',         lE: 'Serious',       rP: 'Irônico',        rE: 'Ironic'        },
  { id: 58, t: 11, lP: 'Nicho',         lE: 'Niche',         rP: 'Universal',      rE: 'Universal'     },
  { id: 59, t: 11, lP: 'Underground',   lE: 'Underground',   rP: 'Viral',          rE: 'Viral'         },
];

// ==================== SERVER SETUP ====================

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Space Pressure Game Server v1.0\n');
});

const wss = new WebSocket.Server({ server });

const rooms = new Map();
const wsToInfo = new Map();

// ==================== HELPERS ====================

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const PLAYER_COLORS = [
  '#ff4655','#00c2ff','#ffb800','#00ff88',
  '#ff00cc','#88ff00','#ff6600','#6600ff',
  '#00ffcc','#ff0066','#ccff00','#0066ff',
];

const TEAM_NAME_PAIRS = [
  ['Galáxia Vermelha', 'Nebulosa Azul'],
  ['Meteoro Carmim', 'Pulsar Ciano'],
  ['Nova Dourada', 'Quasar Prateado'],
  ['Cometa Escarlate', 'Éden Safira'],
];

function wsSend(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function getPublicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    totalRounds: room.settings.rounds,
    activeTeamIndex: room.activeTeamIndex,
    psychicId: room.psychicId,
    currentTheme: room.currentTheme,
    currentCard: room.currentCard,
    clue: room.clue,
    votes: ['reveal', 'gameover'].includes(room.phase) ? room.votes : null,
    submittedVotes: Object.keys(room.votes || {}),
    timerEnd: room.timerEnd,
    damage: [...room.damage],
    scores: [...room.scores],
    roundHistory: room.roundHistory,
    emojiReactions: room.emojiReactions,
    revealResult: room.revealResult,
    winner: room.winner,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      teamIndex: p.teamIndex,
      connected: p.connected,
      isHost: p.isHost,
    })),
    teams: room.teams,
    settings: room.settings,
  };
}

function broadcastRoom(room) {
  const state = getPublicState(room);
  for (const p of room.players) {
    if (!p.ws || p.ws.readyState !== WebSocket.OPEN) continue;
    wsSend(p.ws, { type: 'room_state', state });
    if (p.id === room.psychicId && room.targetPosition !== null &&
        ['psychic', 'voting', 'reveal'].includes(room.phase)) {
      wsSend(p.ws, { type: 'psychic_target', targetPosition: room.targetPosition });
    }
  }
}

function clearRoomTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
  room.timerEnd = null;
}

// ==================== GAME LOGIC ====================

function getTeamPlayers(room, teamIdx) {
  return room.players.filter(p => p.teamIndex === teamIdx);
}

function computeResult(avg, target) {
  const diff = Math.abs(avg - target);
  if (diff <= 5)  return { points: 3, damage: 0, grade: 'PERFECT',     gradePT: 'PERFEITO!' };
  if (diff <= 15) return { points: 2, damage: 0, grade: 'VERY CLOSE',  gradePT: 'MUITO PRÓXIMO!' };
  if (diff <= 25) return { points: 1, damage: 1, grade: 'CLOSE',       gradePT: 'PRÓXIMO!' };
  if (diff <= 40) return { points: 0, damage: 1, grade: 'REASONABLE',  gradePT: 'RAZOÁVEL...' };
  return           { points: 0, damage: 2, grade: 'FAR',          gradePT: 'LONGE!' };
}

function getCurrentPsychic(room) {
  const team = getTeamPlayers(room, room.activeTeamIndex);
  if (!team.length) return null;
  return team[room.psychicIndices[room.activeTeamIndex] % team.length];
}

function selectCard(room) {
  let available = CARDS.filter(c => !room.usedCardIds.has(c.id));
  if (!available.length) {
    room.usedCardIds = new Set();
    available = [...CARDS];
  }
  const card = available[Math.floor(Math.random() * available.length)];
  room.usedCardIds.add(card.id);
  const theme = THEMES.find(t => t.id === card.t);
  return { theme, card };
}

function startRound(room) {
  room.clue = null;
  room.votes = {};
  room.targetPosition = null;
  room.revealResult = null;
  room.emojiReactions = [];
  room.currentTheme = null;
  room.currentCard = null;
  clearRoomTimer(room);

  const psychic = getCurrentPsychic(room);
  if (!psychic) return;
  room.psychicId = psychic.id;
  room.phase = 'roulette';
  broadcastRoom(room);
}

function activatePsychicPhase(room) {
  if (room.phase !== 'spinning') return;
  // Theme & card already chosen at spin time; just pick the secret target
  room.targetPosition = Math.floor(Math.random() * 81) + 10; // 10–90
  room.phase = 'psychic';

  const dur = room.settings.clueTimer * 1000;
  room.timerEnd = Date.now() + dur;
  room.timerHandle = setTimeout(() => {
    if (room.phase !== 'psychic') return;
    room.clue = room.lang === 'en' ? '(no clue)' : '(sem dica)';
    room.damage[room.activeTeamIndex] = Math.min(
      room.damage[room.activeTeamIndex] + 1, room.settings.maxDamage
    );
    clearRoomTimer(room);
    if (room.damage[room.activeTeamIndex] >= room.settings.maxDamage) {
      room.phase = 'gameover';
      room.winner = room.activeTeamIndex === 0 ? 1 : 0;
      broadcastRoom(room);
    } else {
      proceedToVoting(room);
    }
  }, dur);

  broadcastRoom(room);
  const psychicPlayer = room.players.find(p => p.id === room.psychicId);
  if (psychicPlayer?.ws) {
    wsSend(psychicPlayer.ws, { type: 'psychic_target', targetPosition: room.targetPosition });
  }
}

function proceedToVoting(room) {
  clearRoomTimer(room);
  room.phase = 'voting';
  const dur = room.settings.voteTimer * 1000;
  room.timerEnd = Date.now() + dur;
  room.timerHandle = setTimeout(() => {
    if (room.phase === 'voting') finalizeVoting(room);
  }, dur);
  broadcastRoom(room);
}

function finalizeVoting(room) {
  clearRoomTimer(room);
  const teamP = getTeamPlayers(room, room.activeTeamIndex);
  const voterIds = teamP.filter(p => p.id !== room.psychicId).map(p => p.id);
  const voteValues = voterIds.map(id => room.votes[id]).filter(v => v !== undefined);
  const avg = voteValues.length ? voteValues.reduce((a, b) => a + b, 0) / voteValues.length : 50;

  const result = computeResult(avg, room.targetPosition);
  room.damage[room.activeTeamIndex] = Math.min(
    room.damage[room.activeTeamIndex] + result.damage, room.settings.maxDamage
  );
  room.scores[room.activeTeamIndex] += result.points;

  room.revealResult = { avg, target: room.targetPosition, diff: Math.abs(avg - room.targetPosition), ...result };
  room.roundHistory.push({
    round: room.round,
    activeTeam: room.activeTeamIndex,
    psychicId: room.psychicId,
    psychicName: room.players.find(p => p.id === room.psychicId)?.name,
    theme: room.currentTheme,
    card: room.currentCard,
    clue: room.clue,
    target: room.targetPosition,
    avg,
    diff: Math.abs(avg - room.targetPosition),
    result,
    votes: { ...room.votes },
  });

  if (room.damage[room.activeTeamIndex] >= room.settings.maxDamage) {
    room.phase = 'gameover';
    room.winner = room.activeTeamIndex === 0 ? 1 : 0;
    broadcastRoom(room);
    return;
  }

  room.phase = 'reveal';
  broadcastRoom(room);
}

function advanceRound(room) {
  room.round++;
  if (room.round >= room.settings.rounds) {
    room.phase = 'gameover';
    if (room.scores[0] > room.scores[1]) room.winner = 0;
    else if (room.scores[1] > room.scores[0]) room.winner = 1;
    else room.winner = -1;
    broadcastRoom(room);
    return;
  }
  room.psychicIndices[room.activeTeamIndex]++;
  room.activeTeamIndex = room.activeTeamIndex === 0 ? 1 : 0;
  startRound(room);
}

// ==================== ROOM MANAGEMENT ====================

function createRoom(ws, playerName) {
  const playerId = genId();
  const code = genCode();
  const names = TEAM_NAME_PAIRS[Math.floor(Math.random() * TEAM_NAME_PAIRS.length)];

  const player = { id: playerId, name: playerName, color: PLAYER_COLORS[0], teamIndex: null, connected: true, isHost: true, ws };

  const room = {
    code, hostId: playerId,
    players: [player],
    teams: [
      { name: names[0], color: '#ff4655' },
      { name: names[1], color: '#00c2ff' },
    ],
    settings: { rounds: 10, maxDamage: 5, clueTimer: 60, voteTimer: 60 },
    phase: 'lobby',
    round: 0, activeTeamIndex: 0,
    psychicId: null, psychicIndices: [0, 0],
    currentTheme: null, currentCard: null,
    targetPosition: null, clue: null, votes: {},
    timerEnd: null, timerHandle: null,
    damage: [0, 0], scores: [0, 0],
    roundHistory: [], emojiReactions: [],
    usedCardIds: new Set(),
    revealResult: null, winner: null,
  };

  rooms.set(code, room);
  wsToInfo.set(ws, { playerId, roomCode: code });
  wsSend(ws, { type: 'joined', playerId, roomCode: code });
  broadcastRoom(room);
}

function joinRoom(ws, code, playerName) {
  const room = rooms.get(code);
  if (!room) return wsSend(ws, { type: 'error', message: 'room_not_found' });

  if (room.phase !== 'lobby') {
    const existing = room.players.find(p => p.name === playerName && !p.connected);
    if (existing) {
      existing.connected = true;
      existing.ws = ws;
      wsToInfo.set(ws, { playerId: existing.id, roomCode: code });
      wsSend(ws, { type: 'reconnected', playerId: existing.id });
      broadcastRoom(room);
      if (existing.id === room.psychicId && room.targetPosition !== null) {
        wsSend(ws, { type: 'psychic_target', targetPosition: room.targetPosition });
      }
      return;
    }
    return wsSend(ws, { type: 'error', message: 'game_in_progress' });
  }

  if (room.players.length >= 20) return wsSend(ws, { type: 'error', message: 'room_full' });

  const playerId = genId();
  const colorIdx = room.players.length % PLAYER_COLORS.length;
  const player = { id: playerId, name: playerName, color: PLAYER_COLORS[colorIdx], teamIndex: null, connected: true, isHost: false, ws };

  room.players.push(player);
  wsToInfo.set(ws, { playerId, roomCode: code });
  wsSend(ws, { type: 'joined', playerId, roomCode: code });
  broadcastRoom(room);
}

function reconnectPlayer(ws, playerId, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;
  player.connected = true;
  player.ws = ws;
  wsToInfo.set(ws, { playerId, roomCode });
  wsSend(ws, { type: 'reconnected', playerId });
  broadcastRoom(room);
  if (player.id === room.psychicId && room.targetPosition !== null) {
    wsSend(ws, { type: 'psychic_target', targetPosition: room.targetPosition });
  }
}

// ==================== MESSAGE HANDLER ====================

function handleMessage(ws, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return; }

  const { type, ...data } = msg;

  if (type === 'create_room') {
    const name = String(data.playerName || '').trim().slice(0, 20);
    if (!name) return wsSend(ws, { type: 'error', message: 'invalid_name' });
    return createRoom(ws, name);
  }
  if (type === 'join_room') {
    const name = String(data.playerName || '').trim().slice(0, 20);
    const code = String(data.roomCode || '').trim().toUpperCase();
    if (!name || !code) return wsSend(ws, { type: 'error', message: 'invalid_input' });
    return joinRoom(ws, code, name);
  }
  if (type === 'reconnect') {
    return reconnectPlayer(ws, data.playerId, String(data.roomCode || '').toUpperCase());
  }

  const info = wsToInfo.get(ws);
  if (!info) return wsSend(ws, { type: 'error', message: 'not_in_room' });
  const room = rooms.get(info.roomCode);
  if (!room) return wsSend(ws, { type: 'error', message: 'room_gone' });
  const player = room.players.find(p => p.id === info.playerId);
  if (!player) return;

  const isHost = player.id === room.hostId;
  const isPsychic = player.id === room.psychicId;

  switch (type) {
    case 'update_settings':
      if (!isHost || room.phase !== 'lobby') return;
      if ([5,10,15].includes(data.rounds))   room.settings.rounds = data.rounds;
      if ([3,5,7].includes(data.maxDamage))  room.settings.maxDamage = data.maxDamage;
      if ([30,60,90].includes(data.clueTimer)) room.settings.clueTimer = data.clueTimer;
      if ([30,60,90].includes(data.voteTimer)) room.settings.voteTimer = data.voteTimer;
      broadcastRoom(room);
      break;

    case 'assign_team': {
      if (room.phase !== 'lobby') return;
      // Host can move anyone; non-host can only move themselves
      const targetId = data.targetPlayerId || player.id;
      if (!isHost && targetId !== player.id) return;
      const target = room.players.find(p => p.id === targetId);
      if (!target) return;
      target.teamIndex = (data.teamIndex === 0 || data.teamIndex === 1) ? data.teamIndex : null;
      broadcastRoom(room);
      break;
    }

    case 'rename_team':
      if (!isHost) return;
      if (data.teamIndex === 0 || data.teamIndex === 1) {
        const name = String(data.name || '').trim().slice(0, 30);
        if (name) { room.teams[data.teamIndex].name = name; broadcastRoom(room); }
      }
      break;

    case 'start_game': {
      if (!isHost || room.phase !== 'lobby') return;
      const t0 = getTeamPlayers(room, 0);
      const t1 = getTeamPlayers(room, 1);
      if (t0.length < 2 || t1.length < 2) return wsSend(ws, { type: 'error', message: 'need_teams' });
      room.round = 0; room.damage = [0,0]; room.scores = [0,0];
      room.roundHistory = []; room.usedCardIds = new Set();
      room.psychicIndices = [0,0]; room.activeTeamIndex = 0; room.winner = null;
      startRound(room);
      break;
    }

    case 'spin_roulette': {
      if (!isPsychic || room.phase !== 'roulette') return;
      // Select theme & card NOW so client can animate the wheel to the correct segment
      const { theme: spinTheme, card: spinCard } = selectCard(room);
      room.currentTheme = { id: spinTheme.id, emoji: spinTheme.emoji, namePT: spinTheme.namePT, nameEN: spinTheme.nameEN, color: spinTheme.color };
      room.currentCard  = { id: spinCard.id, lP: spinCard.lP, lE: spinCard.lE, rP: spinCard.rP, rE: spinCard.rE };
      room.phase = 'spinning';
      broadcastRoom(room);
      setTimeout(() => activatePsychicPhase(room), 3700);
      break;
    }

    case 'submit_clue': {
      if (!isPsychic || room.phase !== 'psychic') return;
      const clue = String(data.clue || '').trim().slice(0, 60);
      if (!clue) return;
      clearRoomTimer(room);
      room.clue = clue;
      proceedToVoting(room);
      break;
    }

    case 'submit_vote': {
      if (room.phase !== 'voting') return;
      const teamP = getTeamPlayers(room, room.activeTeamIndex);
      if (!teamP.some(p => p.id === player.id)) return;
      if (isPsychic) return;
      const pos = Math.max(0, Math.min(100, Number(data.position) || 50));
      room.votes[player.id] = Math.round(pos);
      const nonPsychic = teamP.filter(p => p.id !== room.psychicId);
      if (nonPsychic.length > 0 && nonPsychic.every(p => room.votes[p.id] !== undefined)) {
        finalizeVoting(room);
      } else {
        broadcastRoom(room);
      }
      break;
    }

    case 'advance_round':
      if (!isHost || room.phase !== 'reveal') return;
      advanceRound(room);
      break;

    case 'emoji_reaction': {
      const allowed = ['😱','🔥','💀','😂','👏','😮','🤯','💥'];
      const emoji = allowed.includes(data.emoji) ? data.emoji : '😱';
      room.emojiReactions = [
        ...(room.emojiReactions || []).slice(-15),
        { playerId: player.id, playerName: player.name, emoji, id: genId(), ts: Date.now() }
      ];
      broadcastRoom(room);
      break;
    }

    case 'new_game':
      if (!isHost) return;
      clearRoomTimer(room);
      Object.assign(room, {
        round: 0, damage: [0,0], scores: [0,0],
        roundHistory: [], usedCardIds: new Set(),
        psychicIndices: [0,0], activeTeamIndex: 0, winner: null,
        clue: null, votes: {}, targetPosition: null,
        revealResult: null, emojiReactions: [],
        currentTheme: null, currentCard: null,
      });
      startRound(room);
      break;

    case 'back_to_lobby':
      if (!isHost) return;
      clearRoomTimer(room);
      Object.assign(room, {
        phase: 'lobby', round: 0, damage: [0,0], scores: [0,0],
        roundHistory: [], usedCardIds: new Set(),
        psychicIndices: [0,0], activeTeamIndex: 0, winner: null,
        clue: null, votes: {}, targetPosition: null,
        revealResult: null, emojiReactions: [],
        currentTheme: null, currentCard: null,
      });
      broadcastRoom(room);
      break;
  }
}

// ==================== WS EVENTS ====================

wss.on('connection', (ws) => {
  ws.on('message', (data) => handleMessage(ws, data.toString()));

  ws.on('close', () => {
    const info = wsToInfo.get(ws);
    if (info) {
      const room = rooms.get(info.roomCode);
      if (room) {
        const player = room.players.find(p => p.id === info.playerId);
        if (player) { player.connected = false; player.ws = null; }
        const anyConnected = room.players.some(p => p.connected);
        if (!anyConnected) {
          setTimeout(() => {
            const r = rooms.get(info.roomCode);
            if (r && !r.players.some(p => p.connected)) {
              clearRoomTimer(r);
              rooms.delete(info.roomCode);
              console.log(`Room ${info.roomCode} cleaned up.`);
            }
          }, 5 * 60 * 1000);
        } else {
          broadcastRoom(room);
        }
      }
    }
    wsToInfo.delete(ws);
  });

  ws.on('error', () => { try { ws.close(); } catch {} });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Space Pressure server on port ${PORT}`);
});
