/**
 * GameEngine — FFA mode.
 * Runs in the HOST's browser.
 * Transmitter rotates through ALL players. Everyone else votes individually.
 * Points awarded per-player by proximity. No teams.
 * Streaks and BOOST create round-to-round pressure.
 */
import { db, ref, get, set, update, remove, push, onValue, onChildAdded, runTransaction } from './firebase.js';
import { PLAYER_COLORS, selectCard, selectOpenCards, genId } from './gameData.js';
import { scoreFromDiff, boostBonus, clampPosition, normalizeVote, transmitterScore } from './gameRules.mjs';
import { SHIP_IDS, SHIP_COLORS } from './components/ShipRoster.jsx';

const ROUND_INTRO_DURATION_MS = 4600;
const PLAYER_NAME_MAX_LENGTH = 24;

// ── Scoring ───────────────────────────────────────────────────────────────────

function buildHighlight(type, playerId, playerName, value = null) {
  return { type, playerId, playerName, value };
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

function getShipLoadout(index = 0) {
  return {
    ship: SHIP_IDS[index % SHIP_IDS.length] || 'nova_01',
    shipColor: SHIP_COLORS[index % SHIP_COLORS.length] || 'blue',
    shipAccent: SHIP_COLORS[(index + 5) % SHIP_COLORS.length] || 'cyan',
  };
}

function sanitizeShipLoadout(loadout = {}, fallback = {}) {
  const fallbackShip = SHIP_IDS.includes(fallback.ship) ? fallback.ship : getShipLoadout(0).ship;
  const fallbackColor = SHIP_COLORS.includes(fallback.shipColor) ? fallback.shipColor : getShipLoadout(0).shipColor;
  const fallbackAccent = SHIP_COLORS.includes(fallback.shipAccent) ? fallback.shipAccent : getShipLoadout(0).shipAccent;
  return {
    ship: SHIP_IDS.includes(loadout.ship) ? loadout.ship : fallbackShip,
    shipColor: SHIP_COLORS.includes(loadout.shipColor) ? loadout.shipColor : fallbackColor,
    shipAccent: SHIP_COLORS.includes(loadout.shipAccent) ? loadout.shipAccent : fallbackAccent,
  };
}

function sanitizePlayerName(name, fallback = 'Player') {
  return String(name || fallback).trim().slice(0, PLAYER_NAME_MAX_LENGTH) || fallback;
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

export async function createRoom(code, hostId, playerName, loadout = {}) {
  const safeName = sanitizePlayerName(playerName);
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
    settings: { rounds: 7, clueTimer: 30, voteTimer: 30, targetMode: 'random', cardMode: 'themed', cardOptions: 3 },
    players: {
      [hostId]: {
        id: hostId, name: safeName,
        color: PLAYER_COLORS[0],
        ...sanitizeShipLoadout(loadout, getShipLoadout(0)),
        connected: true, isHost: true, isBot: false,
      },
    },
    playerScores: {},
    playerStreaks: {},
    startingTransmitterId: hostId,
    createdAt: Date.now(),
    hostHeartbeatAt: Date.now(),
  };
  await set(ref(db, `rooms/${code}`), roomData);
}

// ── Add player ────────────────────────────────────────────────────────────────

export async function addPlayerToRoom(code, playerId, playerName, loadout = {}) {
  const room = await getRoom(code);
  if (!room) return { error: 'room_not_found' };
  const existingById = room.players?.[playerId];

  if (existingById) {
    await update(ref(db, `rooms/${code}/players/${playerId}`), {
      connected: true,
      name: sanitizePlayerName(playerName, existingById.name),
      ...sanitizeShipLoadout(loadout, existingById),
    });
    return { rejoin: true, playerId };
  }

  if (room.phase !== 'lobby') {
    return { error: 'game_in_progress' };
  }

  const activeCount = Object.values(room.players || {}).filter(p => p.connected !== false || p.isBot).length;
  if (activeCount >= 20) return { error: 'room_full' };

  const colorIdx  = Object.keys(room.players || {}).length % PLAYER_COLORS.length;
  const shipIdx   = Object.keys(room.players || {}).length;
  const selectedLoadout = sanitizeShipLoadout(loadout, getShipLoadout(shipIdx));
  await set(ref(db, `rooms/${code}/players/${playerId}`), {
    id: playerId, name: sanitizePlayerName(playerName),
    color: PLAYER_COLORS[colorIdx],
    ...selectedLoadout,
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
    this._skipping= false;
    this._finalizing = false;
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
      this._checkVoteCompletion(snap.val() || {}).catch(e => console.error('[Engine] checkVoteCompletion:', e));
    });
    this._unsubs.push(unsub2);

    // Watch player connections to skip rounds when transmitter drops
    const unsub3 = onValue(rref(this.roomCode, 'players'), snap => {
      this._onPlayersChanged(snap.val() || {}).catch(e => console.error('[Engine] onPlayersChanged:', e));
    });
    this._unsubs.push(unsub3);
  }

  stop() { this._unsubs.forEach(u => u()); this._unsubs = []; this._clearTimer(false); }

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

  _clearTimer(clearRemote = true) {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (clearRemote) roomUpdate(this.roomCode, { timerEnd: null }).catch(() => {});
  }

  // ── Game phases ─────────────────────────────────────────────────────────────

  async _startRound() {
    const room = await getRoom(this.roomCode);
    if (!room) return;

    const players = allPlayers(room).filter(p => p.isBot || p.connected !== false);
    if (players.length < 2) return;

    const startId = room.startingTransmitterId || room.transmitterId || this.hostId;
    const startIndex = Math.max(0, players.findIndex(p => p.id === startId));
    const tx = players[(startIndex + (room.round || 0)) % players.length] || players[0];
    const roundIntroUntil = Date.now() + ROUND_INTRO_DURATION_MS;

    const cardMode = room.settings?.cardMode ?? 'themed';
    const cardOptions = room.settings?.cardOptions ?? 3;

    const baseUpdate = {
      psychicId: tx.id, transmitterId: tx.id,
      clue: null, revealResult: null, currentTheme: null, currentCard: null,
      timerEnd: null, cardPickOptions: null, roundIntroUntil, revealUnlockAt: null,
    };

    if (cardMode === 'livre') {
      const usedIds = Object.keys(room.usedCardIds || {}).map(Number);
      const options = selectOpenCards(cardOptions, usedIds);
      await Promise.all([
        roomUpdate(this.roomCode, { ...baseUpdate, phase: 'pick_card', cardPickOptions: options }),
        remove(rref(this.roomCode, 'votes')),
        remove(rref(this.roomCode, 'psychicSecret')),
        remove(rref(this.roomCode, 'emojiReactions')),
      ]);
      if (tx.isBot) {
        setTimeout(async () => {
          const r = await getRoom(this.roomCode);
          if (!r || r.phase !== 'pick_card') return;
          await this._applyCardPick(Object.values(r.cardPickOptions || {})[0]);
        }, ROUND_INTRO_DURATION_MS + 450);
      } else {
        this._setTimer(20000, async () => {
          const r = await getRoom(this.roomCode);
          if (!r || r.phase !== 'pick_card') return;
          await this._applyCardPick(Object.values(r.cardPickOptions || {})[0]);
        });
      }
    } else {
      await Promise.all([
        roomUpdate(this.roomCode, { ...baseUpdate, phase: 'roulette' }),
        remove(rref(this.roomCode, 'votes')),
        remove(rref(this.roomCode, 'psychicSecret')),
        remove(rref(this.roomCode, 'emojiReactions')),
      ]);
      if (tx.isBot) setTimeout(() => this._autoSpinForBot(), ROUND_INTRO_DURATION_MS + 450);
      else this._setTimer(20000, async () => {
        const r = await getRoom(this.roomCode);
        if (!r || r.phase !== 'roulette') return;
        await this._spinRoulette(this.hostId, true);
      });
    }
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

  async _spinRoulette(requestedBy, forced = false) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'roulette') return;
    if (!forced && Number(room.roundIntroUntil || 0) > Date.now()) return;
    const tx = Object.values(room.players || {}).find(p => p.id === room.psychicId);
    const canSpin = forced || room.psychicId === requestedBy || (requestedBy === this.hostId && tx?.isBot);
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

  async _applyCardPick(card) {
    if (!card) return;
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'pick_card') return;
    this._clearTimer();
    await set(rref(this.roomCode, 'usedCardIds', String(card.id)), true);
    await roomUpdate(this.roomCode, {
      phase: 'spinning',
      currentCard: { id: card.id, lP: card.lP, lE: card.lE, rP: card.rP, rE: card.rE },
      cardPickOptions: null,
    });
    setTimeout(() => this._activatePsychic(room.psychicId), 900);
  }

  async _activatePsychic(txId) {
    const room = await getRoom(this.roomCode);
    if (!room || !['spinning', 'pick_card'].includes(room.phase)) return;
    const tx = allPlayers(room).find(p => p.id === txId);
    const targetMode = room.settings?.targetMode ?? 'random';

    if (targetMode === 'choose' && !tx?.isBot) {
      // Transmitter picks position + clue together in psychic phase
      await this._startPsychicCluePhase(txId);
    } else {
      const target = Math.floor(Math.random() * 81) + 10;
      await set(rref(this.roomCode, 'psychicSecret'), { targetPosition: target });
      await this._startPsychicCluePhase(txId);
    }
  }

  async _startPsychicCluePhase(txId) {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const duration = (room.settings?.clueTimer ?? 30) * 1000;
    await roomUpdate(this.roomCode, { phase: 'psychic' });
    const tx = allPlayers(room).find(p => p.id === txId);
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
        const secretSnap = await get(rref(this.roomCode, 'psychicSecret'));
        if (!secretSnap.exists()) {
          await set(rref(this.roomCode, 'psychicSecret'), { targetPosition: Math.floor(Math.random() * 81) + 10 });
        }
        await roomUpdate(this.roomCode, { clue: '(sem dica)', timerEnd: null });
        await this._proceedToVoting();
      });
    }
  }

  async _proceedToVoting() {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const dur  = (room.settings?.voteTimer ?? 60) * 1000;
    await roomUpdate(this.roomCode, { phase: 'voting' });

    // Auto-vote for bots (non-transmitter)
    const botVoters = allPlayers(room).filter(p => p.isBot && p.id !== room.psychicId);
    if (botVoters.length > 0) {
      const autoVotes = {};
      botVoters.forEach(b => {
        autoVotes[b.id] = { position: Math.round(15 + Math.random() * 70), boost: Math.random() > 0.8 };
      });
      await update(rref(this.roomCode, 'votes'), autoVotes);
    }

    this._setTimer(dur, () => this._finalizeVoting().catch(e => console.error('[Engine] finalizeVoting:', e)));
  }

  async _checkVoteCompletion(votes) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'voting') return;
    const voters = allPlayers(room).filter(p => p.id !== room.psychicId && (p.isBot || p.connected !== false));
    if (voters.length > 0 && voters.every(p => votes[p.id] !== undefined)) {
      this._clearTimer();
      await this._finalizeVoting().catch(e => console.error('[Engine] finalizeVoting:', e));
    }
  }

  async _finalizeVoting() {
    if (this._finalizing) return;
    this._finalizing = true;
    let lockRef = null;
    let releaseLockOnError = false;
    try {
      const room = await getRoom(this.roomCode);
      if (!room || room.phase !== 'voting') return;

      lockRef = rref(this.roomCode, 'finalizeLocks', String(room.round || 0));
      const lockResult = await runTransaction(lockRef, (current) => {
        if (current) return undefined;
        return { hostId: this.hostId, round: room.round || 0, ts: Date.now() };
      });
      if (!lockResult.committed) return;
      releaseLockOnError = true;

      const [votesSnap, secretSnap] = await Promise.all([
        get(rref(this.roomCode, 'votes')),
        get(rref(this.roomCode, 'psychicSecret')),
      ]);
      const rawVotes = votesSnap.val() || {};
      const eligibleVoters = allPlayers(room).filter(p => (
        p.id !== room.psychicId && (p.isBot || p.connected !== false || rawVotes[p.id] !== undefined)
      ));
      const votes = Object.fromEntries(
        eligibleVoters
          .filter((player) => rawVotes[player.id] !== undefined)
          .map((player) => [player.id, normalizeVote(rawVotes[player.id])]),
      );
      const target = clampPosition(secretSnap.val()?.targetPosition);

      const voters = eligibleVoters;
      const roundScores = {};
      const roundStreaks = {};
      const highlights = [];
      const previousStreaks = room.playerStreaks || {};

      voters.forEach(p => {
        const vote = votes[p.id];
        if (!vote) return;
        const diff = Math.abs(vote.position - target);
        const baseScore = scoreFromDiff(diff);
        const bonus = vote.boost ? boostBonus(diff) : 0;
        const streak = diff <= 15 ? (previousStreaks[p.id] || 0) + 1 : 0;
        const streakBonus = streak >= 3 ? 1 : 0;
        const points = baseScore + bonus + streakBonus;

        roundScores[p.id] = points;
        roundStreaks[p.id] = streak;

        if (diff <= 5) highlights.push(buildHighlight('perfect', p.id, p.name, diff));
        else if (vote.boost && diff <= 25) highlights.push(buildHighlight('boost_hit', p.id, p.name, points));
        else if (vote.boost && diff > 25) highlights.push(buildHighlight('boost_miss', p.id, p.name, bonus));
        else if (streak >= 3) highlights.push(buildHighlight('streak', p.id, p.name, streak));
      });

      const numericVotes = Object.values(votes).map(v => v.position).filter(pos => Number.isFinite(pos));
      const averageVote = numericVotes.length
        ? Math.round(numericVotes.reduce((sum, pos) => sum + pos, 0) / numericVotes.length)
        : target;
      const avgDiff = Math.abs(averageVote - target);
      const txScore = transmitterScore(voters, votes, target);
      const txPoints = txScore.points;
      if (room.psychicId) {
        const txStreak = txScore.cleanSweep ? (previousStreaks[room.psychicId] || 0) + 1 : 0;
        roundScores[room.psychicId] = txPoints + (txStreak >= 3 ? 1 : 0);
        roundStreaks[room.psychicId] = txStreak;
        const tx = allPlayers(room).find(p => p.id === room.psychicId);
        if (txScore.cleanSweep && voters.length >= 2) {
          highlights.push(buildHighlight('clean_tx', room.psychicId, tx?.name || '?', txPoints));
        }
      }

      const existing = (await get(rref(this.roomCode, 'playerScores'))).val() || {};
      const scoreUpdates = {};
      const streakUpdates = {};
      allPlayers(room).forEach((player) => {
        scoreUpdates[player.id] = (existing[player.id] || 0) + (roundScores[player.id] || 0);
        streakUpdates[player.id] = roundStreaks[player.id] || 0;
      });

      const txName = allPlayers(room).find(p => p.id === room.psychicId)?.name;
      const revealUnlockAt = Date.now() + 5000;
      const revealResult = {
        target,
        votes,
        averageVote,
        avgDiff,
        roundScores,
        streaks: streakUpdates,
        highlights: highlights.slice(0, 5),
        transmitterScore: txPoints,
        transmitterScoreBreakdown: txScore,
        revealUnlockAt,
      };

      const historyEntry = {
        round: room.round,
        transmitterId: room.psychicId,
        transmitterName: txName,
        theme: room.currentTheme ?? null,
        card: room.currentCard ?? null,
        clue: room.clue ?? null,
        target,
        averageVote,
        avgDiff,
        votes,
        roundScores,
        streaks: streakUpdates,
        highlights: highlights.slice(0, 5),
        transmitterScore: txPoints,
      };
      const historyKey = push(rref(this.roomCode, 'roundHistory')).key || genId();
      await update(ref(db), {
        [`rooms/${this.roomCode}/playerScores`]: scoreUpdates,
        [`rooms/${this.roomCode}/playerStreaks`]: streakUpdates,
        [`rooms/${this.roomCode}/roundHistory/${historyKey}`]: historyEntry,
        [`rooms/${this.roomCode}/phase`]: 'reveal',
        [`rooms/${this.roomCode}/revealResult`]: revealResult,
        [`rooms/${this.roomCode}/revealUnlockAt`]: revealUnlockAt,
        [`rooms/${this.roomCode}/timerEnd`]: null,
      });
      releaseLockOnError = false;
    } catch (e) {
      if (releaseLockOnError && lockRef) {
        await remove(lockRef).catch(() => {});
      }
      throw e;
    } finally {
      this._finalizing = false;
    }
  }

  async _doNextRound(room) {
    const nextRound = (room.round || 0) + 1;
    if (nextRound >= (room.settings?.rounds ?? 7)) {
      const scoresSnap = await get(rref(this.roomCode, 'playerScores'));
      const scores = scoresSnap.val() || {};
      const entries = allPlayers(room).map((p) => [p.id, scores[p.id] || 0]);
      const topScore = entries.reduce((best, [, score]) => Math.max(best, score), -Infinity);
      const winnerIds = entries.filter(([, score]) => score === topScore).map(([id]) => id);
      await roomUpdate(this.roomCode, { phase: 'gameover', winner: winnerIds[0] || null, winnerIds });
      return;
    }
    await roomUpdate(this.roomCode, { round: nextRound });
    await this._startRound();
  }

  async _advanceRound() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'reveal') return;
    if (Number(room.revealUnlockAt || room.revealResult?.revealUnlockAt || 0) > Date.now()) return;
    await this._doNextRound(room);
  }

  async _skipRound() {
    this._clearTimer();
    const room = await getRoom(this.roomCode);
    if (!room) return;
    await this._doNextRound(room);
  }

  async _onPlayersChanged(players) {
    const room = await getRoom(this.roomCode);
    if (!room) return;

    // During voting: re-check completion in case a voter just disconnected
    if (room.phase === 'voting') {
      const votesSnap = await get(rref(this.roomCode, 'votes'));
      await this._checkVoteCompletion(votesSnap.val() || {});
      return;
    }

    // During pre-voting phases: skip round if transmitter disconnected
    if (!['roulette', 'spinning', 'psychic', 'pick_card'].includes(room.phase)) return;
    if (this._skipping) return;
    const transmitter = players[room.psychicId];
    if (!transmitter || transmitter.connected === false) {
      this._skipping = true;
      try { await this._skipRound(); } finally { this._skipping = false; }
    }
  }

  async _resetToLobby() {
    this._clearTimer();
    await Promise.all([
      roomUpdate(this.roomCode, {
        phase: 'lobby', round: 0,
        psychicId: null, clue: null, revealResult: null,
        currentTheme: null, currentCard: null, timerEnd: null,
        winner: null, winnerIds: null, startingTransmitterId: null, cardPickOptions: null, revealUnlockAt: null,
      }),
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'actions')),
      remove(rref(this.roomCode, 'playerScores')),
      remove(rref(this.roomCode, 'playerStreaks')),
      remove(rref(this.roomCode, 'finalizeLocks')),
    ]);
  }

  async _ensureDevBots(room) {
    const botSeeds = [
      ['bot_0', 'Bot-Alpha'],
      ['bot_1', 'Bot-Beta'],
      ['bot_2', 'Bot-Gamma'],
    ];
    const updates = {};

    botSeeds.forEach(([id, name], index) => {
      if (room.players?.[id]) return;
      updates[id] = {
        id,
        name,
        isBot: true,
        color: PLAYER_COLORS[(allPlayers(room).length + index) % PLAYER_COLORS.length],
        connected: false,
        isHost: false,
        ...getShipLoadout(allPlayers(room).length + index),
      };
    });

    if (Object.keys(updates).length) {
      await update(rref(this.roomCode, 'players'), updates);
      return getRoom(this.roomCode);
    }

    return room;
  }

  async _prepareFreshGame() {
    const room = await getRoom(this.roomCode);
    const activePlayers = allPlayers(room || {}).filter(p => p.isBot || p.connected !== false);
    await roomUpdate(this.roomCode, {
      round: 0,
      winner: null,
      winnerIds: null,
      startingTransmitterId: activePlayers.some(p => p.id === room?.transmitterId) ? room.transmitterId : this.hostId,
      revealUnlockAt: null,
    });
    await Promise.all([
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'finalizeLocks')),
      set(rref(this.roomCode, 'playerScores'), {}),
      set(rref(this.roomCode, 'playerStreaks'), {}),
    ]);
  }

  // ── Central action dispatcher ────────────────────────────────────────────────

  async _processAction(type, data, by) {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const actor = room.players?.[by];
    if (!actor) return;
    const isHost = by === this.hostId;

    switch (type) {

      case 'set_ship': {
        // Any player can set their own ship; host can set bots
        if (by !== data.playerId && !isHost) return;
        const targetPlayer = room.players?.[data.playerId || by] || {};
        const ship = SHIP_IDS.includes(data.ship) ? data.ship : SHIP_IDS[0];
        const color = SHIP_COLORS.includes(data.color) ? data.color : 'blue';
        const accent = SHIP_COLORS.includes(data.accent) ? data.accent : (targetPlayer.shipAccent || 'cyan');
        await update(rref(this.roomCode, 'players', data.playerId || by), { ship, shipColor: color, shipAccent: accent });
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
        if ([5,7,10,15,20].includes(data.rounds)) s.rounds = data.rounds;
        if ([30,60,90].includes(data.clueTimer))   s.clueTimer = data.clueTimer;
        if ([30,60,90].includes(data.voteTimer))   s.voteTimer = data.voteTimer;
        if (['random','choose'].includes(data.targetMode)) s.targetMode = data.targetMode;
        if (['themed','livre'].includes(data.cardMode)) s.cardMode = data.cardMode;
        if ([1,3,5].includes(data.cardOptions)) s.cardOptions = data.cardOptions;
        if (Object.keys(s).length) await update(rref(this.roomCode, 'settings'), s);
        break;
      }


      case 'start_game': {
        if (!isHost || room.phase !== 'lobby') return;
        const activePlayers = allPlayers(room).filter(p => p.isBot || p.connected !== false);
        if (activePlayers.length < 2) return;
        await this._prepareFreshGame();
        await this._startRound();
        break;
      }

      case 'spin_roulette':
        await this._spinRoulette(by);
        break;

      case 'pick_card': {
        if (room.phase !== 'pick_card') return;
        if (Number(room.roundIntroUntil || 0) > Date.now()) return;
        const txPlayer = allPlayers(room).find(p => p.id === room.psychicId);
        const canPick = room.psychicId === by || (by === this.hostId && txPlayer?.isBot);
        if (!canPick) return;
        const options = Object.values(room.cardPickOptions || {});
        const chosen = options.find(c => c.id === data.cardId) || options[0];
        if (!chosen) return;
        await this._applyCardPick(chosen);
        break;
      }

      case 'submit_clue': {
        const tx = Object.values(room.players || {}).find(p => p.id === room.psychicId);
        const canClue = room.psychicId === by || (by === this.hostId && tx?.isBot);
        if (room.phase !== 'psychic' || !canClue) return;
        const clue = String(data.clue || '').trim().slice(0, 40);
        if (!clue) return;
        if (room.settings?.targetMode === 'choose' && data.position !== undefined) {
          const pos = clampPosition(data.position, 50, 5, 95);
          await set(rref(this.roomCode, 'psychicSecret'), { targetPosition: pos });
        }
        this._clearTimer();
        await roomUpdate(this.roomCode, { clue, timerEnd: null });
        await this._proceedToVoting();
        break;
      }

      case 'submit_vote': {
        if (room.phase !== 'voting' || by === room.psychicId) return;
        if (actor?.connected === false) return;
        const pos = clampPosition(data.position);
        await set(rref(this.roomCode, 'votes', by), { position: pos, boost: !!data.boost });
        break;
      }

      case 'advance_round':
        // Any player can advance
        await this._advanceRound();
        break;

      case 'emoji_reaction': {
        const ok = ['OK','GG','!!','??','+1'];
        const emoji = ok.includes(data.emoji) ? data.emoji : 'OK';
        const pname = Object.values(room.players||{}).find(p=>p.id===by)?.name || '?';
        await push(rref(this.roomCode,'emojiReactions'), { playerId:by, playerName:pname, emoji, ts:Date.now(), id:genId() });
        break;
      }

      case 'new_game':
        if (!isHost) return;
        await this._prepareFreshGame();
        await this._startRound();
        break;

      case 'back_to_lobby':
        if (!isHost) return;
        await this._resetToLobby();
        break;

      // ── Dev commands ───────────────────────────────────────────────────────

      case 'dev_add_bots': {
        if (!isHost || room.phase !== 'lobby') return;
        await this._ensureDevBots(room);
        break;
      }

      case 'dev_setup_transmitter_test': {
        if (!isHost || room.phase !== 'lobby') return;
        await this._ensureDevBots(room);
        await roomUpdate(this.roomCode, { transmitterId: by });
        await this._prepareFreshGame();
        await this._startRound();
        break;
      }

      case 'dev_setup_voter_test': {
        if (!isHost || room.phase !== 'lobby') return;
        const hydratedRoom = await this._ensureDevBots(room);
        const bot = allPlayers(hydratedRoom).find((player) => player.isBot);
        if (!bot) return;
        await roomUpdate(this.roomCode, { transmitterId: bot.id });
        await this._prepareFreshGame();
        await this._startRound();
        break;
      }

      case 'dev_skip_phase':
        if (!isHost) return;
        await this._devSkip(room);
        break;

      case 'dev_next_psychic': {
        if (!isHost) return;
        const nonBots = allPlayers(room).filter((player) => !player.isBot);
        const currentIndex = nonBots.findIndex((player) => player.id === room.transmitterId);
        const next = nonBots[(currentIndex + 1 + nonBots.length) % nonBots.length];
        if (!next) return;
        await roomUpdate(this.roomCode, { transmitterId: next.id });
        if (room.phase !== 'lobby') {
          await this._prepareFreshGame();
          await this._startRound();
        }
        break;
      }
    }
  }

  async _devSkip(room) {
    this._clearTimer();
    const phase = room.phase;
    if (phase === 'lobby') {
      await this._processAction('start_game', {}, this.hostId);
    } else if (phase === 'pick_card') {
      await this._applyCardPick(Object.values(room.cardPickOptions || {})[0]);
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
      voters.filter(p => existing[p.id] === undefined).forEach(p => {
        upd[p.id] = { position: Math.round(20+Math.random()*60), boost: false };
      });
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
