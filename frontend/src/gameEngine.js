/**
 * GameEngine — FFA mode.
 * Runs in the HOST's browser.
 * Transmitter rotates through ALL players. Everyone else votes individually.
 * Points awarded per-player by proximity. No teams, no damage.
 */
import { db, ref, get, set, update, remove, push, onValue, onChildAdded } from './firebase.js';
import { PLAYER_COLORS, TEAM_NAME_PAIRS, CARDS, THEMES, selectCard, genId } from './gameData.js';

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreFromDiff(diff) {
  if (diff <=  5) return 5;
  if (diff <= 15) return 4;
  if (diff <= 25) return 3;
  if (diff <= 40) return 2;
  if (diff <= 60) return 1;
  return 0;
}

function transmitterBonus(avgDiff) {
  if (avgDiff <= 10) return 3;
  if (avgDiff <= 25) return 2;
  if (avgDiff <= 40) return 1;
  return 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rref(roomCode, ...paths) {
  return ref(db, ['rooms', roomCode, ...paths].join('/'));
}

async function getRoom(roomCode) {
  const snap = await get(ref(db, `rooms/${roomCode}`));
  return snap.val();
}

async function roomUpdate(roomCode, data) {
  await update(ref(db, `rooms/${roomCode}`), data);
}

function allPlayers(room) {
  return Object.values(room.players || {});
}

// ── Room code generator ───────────────────────────────────────────────────────

export async function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    const snap = await get(ref(db, `rooms/${code}/code`));
    if (!snap.exists()) return code;
  }
  return genId().slice(0, 4).toUpperCase();
}

// ── Create room ───────────────────────────────────────────────────────────────

export async function createRoom(code, hostId, playerName) {
  const roomData = {
    code, hostId,
    phase: 'lobby',
    round: 0,
    transmitterId: hostId,   // fixed for the whole game, set in lobby
    psychicId: null,
    clue: null,
    timerEnd: null,
    winner: null,
    winnerIds: null,
    currentTheme: null,
    currentCard: null,
    revealResult: null,
    settings: { rounds: 10, clueTimer: 60, voteTimer: 60 },
    players: {
      [hostId]: {
        id: hostId, name: playerName,
        color: PLAYER_COLORS[0],
        ship: 'cruiser', shipColor: 'blue',
        connected: true, isHost: true, isBot: false,
      },
    },
    playerScores: {},
    createdAt: Date.now(),
  };
  await set(ref(db, `rooms/${code}`), roomData);
}

// ── Add player ────────────────────────────────────────────────────────────────

export async function addPlayerToRoom(code, playerId, playerName) {
  const room = await getRoom(code);
  if (!room) return { error: 'room_not_found' };

  if (room.phase !== 'lobby') {
    const existing = Object.values(room.players || {}).find(p => p.name === playerName && !p.connected);
    if (existing) {
      await update(ref(db, `rooms/${code}/players/${existing.id}`), { connected: true });
      return { rejoin: true, playerId: existing.id };
    }
    return { error: 'game_in_progress' };
  }

  if (Object.keys(room.players || {}).length >= 20) return { error: 'room_full' };

  const colorIdx  = Object.keys(room.players || {}).length % PLAYER_COLORS.length;
  const shipIdx   = Object.keys(room.players || {}).length;
  const SHIPS_DEFAULT = ['interceptor','cargo','stealth','saucer','biplane','orb','shark','bug','spade','cruiser'];
  const COLORS_DEFAULT= ['red','emerald','violet','cyan','pink','bone','toxic','void','amber','blue'];
  await set(ref(db, `rooms/${code}/players/${playerId}`), {
    id: playerId, name: playerName,
    color: PLAYER_COLORS[colorIdx],
    ship:      SHIPS_DEFAULT[shipIdx % 10],
    shipColor: COLORS_DEFAULT[shipIdx % 10],
    connected: true, isHost: false, isBot: false,
  });
  return { ok: true };
}

// ── GameEngine class ──────────────────────────────────────────────────────────

export class GameEngine {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId   = hostId;
    this._unsubs  = [];
    this._timer   = null;
    this._queue   = [];
    this._draining= false;
  }

  start() {
    // onChildAdded: fires only on NEW actions, not deletions
    const unsub = onChildAdded(rref(this.roomCode, 'actions'), snap => {
      const key = snap.key, action = snap.val();
      if (key && action) this._enqueue(key, action);
    });
    this._unsubs.push(unsub);

    // Watch votes to auto-finalize
    const unsub2 = onValue(rref(this.roomCode, 'votes'), snap => {
      this._checkVoteCompletion(snap.val() || {});
    });
    this._unsubs.push(unsub2);
  }

  stop() { this._unsubs.forEach(u => u()); this._unsubs = []; this._clearTimer(); }

  _enqueue(key, action) {
    this._queue.push({ key, action });
    if (!this._draining) this._drain();
  }

  async _drain() {
    this._draining = true;
    while (this._queue.length) {
      const { key, action } = this._queue.shift();
      try { await this._processAction(action.type, action, action.by); }
      catch(e) { console.error('[Engine]', e); }
      await remove(rref(this.roomCode, 'actions', key)).catch(() => {});
    }
    this._draining = false;
  }

  _setTimer(ms, cb) {
    this._clearTimer();
    roomUpdate(this.roomCode, { timerEnd: Date.now() + ms });
    this._timer = setTimeout(cb, ms);
  }

  _clearTimer() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    roomUpdate(this.roomCode, { timerEnd: null }).catch(() => {});
  }

  // ── Game phases ─────────────────────────────────────────────────────────────

  async _startRound() {
    const room = await getRoom(this.roomCode);
    if (!room) return;

    const players = allPlayers(room);
    if (players.length < 2) return;

    // Fixed transmitter — same person every round, set in lobby
    const txId = room.transmitterId || this.hostId;
    const tx   = players.find(p => p.id === txId) || players[0];

    await Promise.all([
      roomUpdate(this.roomCode, {
        phase: 'roulette', psychicId: tx.id,
        clue: null, revealResult: null, currentTheme: null, currentCard: null, timerEnd: null,
      }),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'emojiReactions')),
    ]);

    if (tx.isBot) setTimeout(() => this._autoSpinForBot(), 1600);
  }

  async _autoSpinForBot() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'roulette') return;
    await this._spinRoulette(this.hostId);
    setTimeout(async () => {
      const r = await getRoom(this.roomCode);
      if (!r || r.phase !== 'psychic') return;
      const s = await get(rref(this.roomCode, 'psychicSecret'));
      const target = s.val()?.targetPosition ?? 50;
      const clue = target < 35 ? (r.currentCard?.lP || 'esquerda') : target > 65 ? (r.currentCard?.rP || 'direita') : 'meio';
      await roomUpdate(this.roomCode, { clue, timerEnd: null });
      await this._proceedToVoting();
    }, 2200);
  }

  async _spinRoulette(requestedBy) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'roulette') return;
    const tx = Object.values(room.players || {}).find(p => p.id === room.psychicId);
    const canSpin = room.psychicId === requestedBy || (requestedBy === this.hostId && tx?.isBot);
    if (!canSpin) return;

    const usedIds = Object.keys(room.usedCardIds || {}).map(Number);
    const { theme, card } = selectCard(usedIds);
    await roomUpdate(this.roomCode, {
      phase: 'spinning',
      currentTheme: { id:theme.id, namePT:theme.namePT, nameEN:theme.nameEN, shortPT:theme.shortPT, shortEN:theme.shortEN, color:theme.color },
      currentCard:  { id:card.id, lP:card.lP, lE:card.lE, rP:card.rP, rE:card.rE },
    });
    await set(rref(this.roomCode, 'usedCardIds', String(card.id)), true);
    setTimeout(() => this._activatePsychic(room.psychicId), 5200);
  }

  async _activatePsychic(txId) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'spinning') return;
    const target   = Math.floor(Math.random() * 81) + 10;
    const duration = (room.settings?.clueTimer ?? 60) * 1000;
    await roomUpdate(this.roomCode, { phase: 'psychic' });
    await set(rref(this.roomCode, 'psychicSecret'), { targetPosition: target });

    const tx = Object.values(room.players || {}).find(p => p.id === txId);
    if (tx?.isBot) {
      setTimeout(async () => {
        const r = await getRoom(this.roomCode);
        if (!r || r.phase !== 'psychic') return;
        const s = await get(rref(this.roomCode, 'psychicSecret'));
        const t2 = s.val()?.targetPosition ?? 50;
        const clue = t2 < 35 ? (r.currentCard?.lP || 'esquerda') : t2 > 65 ? (r.currentCard?.rP || 'direita') : 'meio';
        await roomUpdate(this.roomCode, { clue, timerEnd: null });
        await this._proceedToVoting();
      }, 2000);
    } else {
      this._setTimer(duration, async () => {
        const r = await getRoom(this.roomCode);
        if (!r || r.phase !== 'psychic') return;
        await roomUpdate(this.roomCode, { clue: '(sem dica)', timerEnd: null });
        await this._proceedToVoting();
      });
    }
  }

  async _proceedToVoting() {
    const room = await getRoom(this.roomCode);
    const dur  = (room?.settings?.voteTimer ?? 60) * 1000;
    await roomUpdate(this.roomCode, { phase: 'voting' });

    // Auto-vote for bots (non-transmitter)
    const botVoters = allPlayers(room).filter(p => p.isBot && p.id !== room.psychicId);
    if (botVoters.length > 0) {
      const autoVotes = {};
      botVoters.forEach(b => { autoVotes[b.id] = Math.round(15 + Math.random() * 70); });
      await update(rref(this.roomCode, 'votes'), autoVotes);
    }

    this._setTimer(dur, () => this._finalizeVoting());
  }

  async _checkVoteCompletion(votes) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'voting') return;
    const voters = allPlayers(room).filter(p => p.id !== room.psychicId);
    if (voters.length > 0 && voters.every(p => votes[p.id] !== undefined)) {
      this._clearTimer();
      await this._finalizeVoting();
    }
  }

  async _finalizeVoting() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'voting') return;

    const [votesSnap, secretSnap] = await Promise.all([
      get(rref(this.roomCode, 'votes')),
      get(rref(this.roomCode, 'psychicSecret')),
    ]);
    const votes  = votesSnap.val() || {};
    const target = secretSnap.val()?.targetPosition ?? 50;

    const voters = allPlayers(room).filter(p => p.id !== room.psychicId);
    const roundScores = {};
    const diffs = [];

    voters.forEach(p => {
      const pos = votes[p.id];
      if (pos === undefined) return;
      const diff = Math.abs(pos - target);
      roundScores[p.id] = scoreFromDiff(diff);
      diffs.push(diff);
    });

    const avgDiff  = diffs.length ? diffs.reduce((a,b)=>a+b,0)/diffs.length : 100;
    const txBonus  = transmitterBonus(avgDiff);
    if (room.psychicId) roundScores[room.psychicId] = txBonus;

    // Update cumulative player scores
    const existing = (await get(rref(this.roomCode, 'playerScores'))).val() || {};
    const scoreUpdates = {};
    Object.entries(roundScores).forEach(([pid, pts]) => {
      scoreUpdates[pid] = (existing[pid] || 0) + pts;
    });
    await set(rref(this.roomCode, 'playerScores'), scoreUpdates);

    const txName = allPlayers(room).find(p => p.id === room.psychicId)?.name;
    await push(rref(this.roomCode, 'roundHistory'), {
      round: room.round,
      transmitterId: room.psychicId,
      transmitterName: txName,
      theme: room.currentTheme,
      card: room.currentCard,
      clue: room.clue,
      target,
      votes,
      roundScores,
      transmitterBonus: txBonus,
      avgDiff: Math.round(avgDiff),
    });

    await roomUpdate(this.roomCode, {
      phase: 'reveal',
      revealResult: { target, votes, roundScores, transmitterBonus: txBonus, avgDiff: Math.round(avgDiff) },
      timerEnd: null,
    });
  }

  async _advanceRound() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'reveal') return;

    const nextRound = room.round + 1;
    if (nextRound >= (room.settings?.rounds ?? 10)) {
      // Determine winner from playerScores
      const scoresSnap = await get(rref(this.roomCode, 'playerScores'));
      const scores = scoresSnap.val() || {};
      let topScore = -1;
      Object.values(scores).forEach(s => { if (s > topScore) topScore = s; });
      const winnerIds = Object.entries(scores).filter(([,s]) => s === topScore).map(([id]) => id);
      await roomUpdate(this.roomCode, {
        phase: 'gameover',
        winner:    winnerIds[0] || null,
        winnerIds,
      });
      return;
    }

    await roomUpdate(this.roomCode, { round: nextRound });
    await this._startRound();
  }

  async _resetToLobby() {
    this._clearTimer();
    await Promise.all([
      roomUpdate(this.roomCode, {
        phase: 'lobby', round: 0,
        psychicId: null, clue: null, revealResult: null,
        currentTheme: null, currentCard: null, timerEnd: null,
        winner: null, winnerIds: null,
      }),
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'actions')),
      remove(rref(this.roomCode, 'playerScores')),
    ]);
  }

  // ── Central action dispatcher ────────────────────────────────────────────────

  async _processAction(type, data, by) {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const isHost = by === this.hostId;

    switch (type) {

      case 'set_ship': {
        // Any player can set their own ship; host can set bots
        if (by !== data.playerId && !isHost) return;
        const validShips  = ['cruiser','interceptor','cargo','stealth','saucer','biplane','orb','shark','bug','spade'];
        const validColors = ['red','blue','emerald','amber','violet','cyan','pink','bone','toxic','void'];
        const ship  = validShips.includes(data.ship)   ? data.ship  : 'cruiser';
        const color = validColors.includes(data.color) ? data.color : 'blue';
        await update(rref(this.roomCode, 'players', data.playerId || by), { ship, shipColor: color });
        break;
      }

      case 'set_transmitter': {
        if (!isHost || room.phase !== 'lobby') return;
        const tp = Object.values(room.players || {}).find(p => p.id === data.playerId);
        if (!tp) return;
        await roomUpdate(this.roomCode, { transmitterId: tp.id });
        break;
      }

      case 'update_settings': {
        if (!isHost || room.phase !== 'lobby') return;
        const s = {};
        if ([5,10,15,20].includes(data.rounds))    s.rounds    = data.rounds;
        if ([30,60,90].includes(data.clueTimer))   s.clueTimer = data.clueTimer;
        if ([30,60,90].includes(data.voteTimer))   s.voteTimer = data.voteTimer;
        if (Object.keys(s).length) await update(rref(this.roomCode, 'settings'), s);
        break;
      }

      case 'start_game': {
        if (!isHost || room.phase !== 'lobby') return;
        const players = allPlayers(room);
        const hasBots = players.some(p => p.isBot);
        const min = hasBots ? 2 : 3; // FFA needs at least 2 voters + 1 transmitter = 3
        const minFallback = hasBots ? 2 : 2;
        if (players.length < minFallback) return;
        await roomUpdate(this.roomCode, { round: 0, winner: null, winnerIds: null });
        await Promise.all([
          remove(rref(this.roomCode, 'roundHistory')),
          remove(rref(this.roomCode, 'usedCardIds')),
          set(rref(this.roomCode, 'playerScores'), {}),
        ]);
        await this._startRound();
        break;
      }

      case 'spin_roulette':
        await this._spinRoulette(by);
        break;

      case 'submit_clue': {
        const tx = Object.values(room.players || {}).find(p => p.id === room.psychicId);
        const canClue = room.psychicId === by || (by === this.hostId && tx?.isBot);
        if (room.phase !== 'psychic' || !canClue) return;
        const clue = String(data.clue || '').trim().split(/\s+/)[0].slice(0, 60);
        if (!clue) return;
        this._clearTimer();
        await roomUpdate(this.roomCode, { clue, timerEnd: null });
        await this._proceedToVoting();
        break;
      }

      case 'submit_vote': {
        if (room.phase !== 'voting' || by === room.psychicId) return;
        const pos = Math.max(0, Math.min(100, Math.round(Number(data.position) || 50)));
        await set(rref(this.roomCode, 'votes', by), pos);
        break;
      }

      case 'advance_round':
        // Any player can advance
        await this._advanceRound();
        break;

      case 'emoji_reaction': {
        const ok = ['😱','🔥','💀','😂','👏','😮','🤯','💥'];
        const emoji = ok.includes(data.emoji) ? data.emoji : '😱';
        const pname = Object.values(room.players||{}).find(p=>p.id===by)?.name || '?';
        await push(rref(this.roomCode,'emojiReactions'), { playerId:by, playerName:pname, emoji, ts:Date.now(), id:genId() });
        break;
      }

      case 'new_game':
        if (!isHost) return;
        await this._resetToLobby();
        await this._startRound();
        break;

      case 'back_to_lobby':
        if (!isHost) return;
        await this._resetToLobby();
        break;

      // ── Dev commands ───────────────────────────────────────────────────────

      case 'dev_add_bots': {
        if (!isHost || room.phase !== 'lobby') return;
        const n = Object.keys(room.players || {}).length;
        const bots = {
          bot_0: { id:'bot_0', name:'Bot-Alpha', isBot:true, color:PLAYER_COLORS[(n)%12],   connected:false, isHost:false },
          bot_1: { id:'bot_1', name:'Bot-Beta',  isBot:true, color:PLAYER_COLORS[(n+1)%12], connected:false, isHost:false },
          bot_2: { id:'bot_2', name:'Bot-Gamma', isBot:true, color:PLAYER_COLORS[(n+2)%12], connected:false, isHost:false },
        };
        await update(rref(this.roomCode, 'players'), bots);
        break;
      }

      case 'dev_skip_phase':
        if (!isHost) return;
        await this._devSkip(room);
        break;

      case 'dev_next_psychic': {
        if (!isHost) return;
        await roomUpdate(this.roomCode, { transmitterIdx: (room.transmitterIdx || 0) + 1 });
        if (room.phase !== 'lobby') await this._startRound();
        break;
      }
    }
  }

  async _devSkip(room) {
    this._clearTimer();
    const phase = room.phase;
    if (phase === 'lobby') {
      await this._processAction('start_game', {}, this.hostId);
    } else if (phase === 'roulette' || phase === 'spinning') {
      if (!room.currentTheme) {
        const usedIds = Object.keys(room.usedCardIds||{}).map(Number);
        const { theme, card } = selectCard(usedIds);
        await roomUpdate(this.roomCode, {
          currentTheme:{ id:theme.id,namePT:theme.namePT,nameEN:theme.nameEN,shortPT:theme.shortPT,shortEN:theme.shortEN,color:theme.color },
          currentCard: { id:card.id, lP:card.lP,lE:card.lE,rP:card.rP,rE:card.rE },
        });
        await set(rref(this.roomCode,'usedCardIds',String(card.id)), true);
      }
      const r2 = await getRoom(this.roomCode);
      await this._activatePsychic(r2.psychicId);
    } else if (phase === 'psychic') {
      await roomUpdate(this.roomCode, { clue:'[DEV]', timerEnd:null });
      await this._proceedToVoting();
    } else if (phase === 'voting') {
      const voters = allPlayers(room).filter(p => p.id !== room.psychicId);
      const vSnap  = await get(rref(this.roomCode,'votes'));
      const existing = vSnap.val() || {};
      const upd = {};
      voters.filter(p => existing[p.id] === undefined).forEach(p => { upd[p.id] = Math.round(20+Math.random()*60); });
      if (Object.keys(upd).length) await update(rref(this.roomCode,'votes'), upd);
      await this._finalizeVoting();
    } else if (phase === 'reveal') {
      await this._advanceRound();
    } else if (phase === 'gameover') {
      await this._resetToLobby();
      await this._startRound();
    }
  }
}
