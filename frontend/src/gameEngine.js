/**
 * GameEngine — FFA mode.
 * Runs in the HOST's browser.
 * Transmitter rotates through ALL players. Everyone else votes individually.
 * Points awarded per-player by proximity. No teams.
 * Streaks and BOOST create round-to-round pressure.
 */
import { db, ref, get, set, update, remove, push, onValue, onChildAdded, runTransaction } from './firebase.js';
import { PLAYER_COLORS, selectCard, selectOpenCards, selectTwoOpenCards, genId } from './gameData.js';
import {
  DEFAULT_ROOM_TTL_MS,
  TEAM_COLORS,
  TEAM_INITIAL_HP,
  TEAM_NAMES,
  clampPosition,
  findRejoinPlayer,
  isRoomExpired,
  resolveRound,
  resolveRoundGrid,
  roomExpiresAt,
  teamHullChange,
} from './gameRules.mjs';
import { SHIP_IDS, SHIP_COLORS } from './components/ShipRoster.jsx';

const ROUND_INTRO_DURATION_MS = 4600;
const PLAYER_NAME_MAX_LENGTH = 24;

// ── Scoring ───────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

function rref(roomCode, ...paths) {
  return ref(db, ['rooms', roomCode, ...paths].join('/'));
}

async function getRoom(roomCode) {
  const snap = await get(ref(db, `rooms/${roomCode}`));
  return snap.val();
}

export async function deleteRoomIfExpired(roomCode, now = Date.now()) {
  const room = await getRoom(roomCode);
  if (!room || !isRoomExpired(room, now)) return false;
  await remove(ref(db, `rooms/${roomCode}`));
  return true;
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
    const snap = await get(ref(db, `rooms/${code}`));
    if (!snap.exists()) return code;
    if (isRoomExpired(snap.val())) {
      await remove(ref(db, `rooms/${code}`)).catch(() => {});
      return code;
    }
  }
  return genId().slice(0, 4).toUpperCase();
}

// ── Create room ───────────────────────────────────────────────────────────────

export async function createRoom(code, hostId, playerName, loadout = {}, initialGameMode = 'ffa') {
  const safeName = sanitizePlayerName(playerName);
  const createdAt = Date.now();
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
    settings: { rounds: 7, clueTimer: 30, voteTimer: 30, targetMode: 'random', cardMode: 'livre', cardOptions: 3, gameMode: initialGameMode, numTeams: 2, navigatorMode: 'fixed' },
    teams: initialGameMode === 'survival' ? { t0: { id:'t0', name:'Alpha', color: TEAM_COLORS[0], hp: TEAM_INITIAL_HP, eliminated: false }, t1: { id:'t1', name:'Beta', color: TEAM_COLORS[1], hp: TEAM_INITIAL_HP, eliminated: false } } : null,
    players: {
      [hostId]: {
        id: hostId, name: safeName,
        color: PLAYER_COLORS[0],
        ...sanitizeShipLoadout(loadout, getShipLoadout(0)),
        connected: true, isHost: true, isBot: false,
      },
    },
    playerScores: {},
    startingTransmitterId: hostId,
    createdAt,
    expiresAt: roomExpiresAt(createdAt, DEFAULT_ROOM_TTL_MS),
    hostHeartbeatAt: createdAt,
  };
  await set(ref(db, `rooms/${code}`), roomData);
}

// ── Add player ────────────────────────────────────────────────────────────────

export async function addPlayerToRoom(code, playerId, playerName, loadout = {}) {
  const room = await getRoom(code);
  if (!room) return { error: 'room_not_found' };
  if (isRoomExpired(room)) {
    await remove(ref(db, `rooms/${code}`)).catch(() => {});
    return { error: 'room_not_found' };
  }

  const safeName = sanitizePlayerName(playerName);
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
    const rejoinPlayer = findRejoinPlayer(room.players, safeName);
    if (rejoinPlayer) {
      await update(ref(db, `rooms/${code}/players/${rejoinPlayer.id}`), {
        connected: true,
        name: safeName,
        ...sanitizeShipLoadout(loadout, rejoinPlayer),
      });
      return { rejoin: true, playerId: rejoinPlayer.id };
    }
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
    id: playerId, name: safeName,
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
    const unsub = onChildAdded(rref(this.roomCode, 'actions'), snap => {
      const key = snap.key, action = snap.val();
      if (key && action) this._enqueue(key, action);
    });
    this._unsubs.push(unsub);

    // FFA votes
    const unsub2 = onValue(rref(this.roomCode, 'votes'), snap => {
      this._checkVoteCompletion(snap.val() || {}).catch(e => console.error('[Engine] checkVoteCompletion:', e));
    });
    this._unsubs.push(unsub2);

    // Survival team votes
    const unsub4 = onValue(rref(this.roomCode, 'teamVotes'), snap => {
      this._checkTeamVoteCompletion(snap.val() || {}).catch(e => console.error('[Engine] checkTeamVoteCompletion:', e));
    });
    this._unsubs.push(unsub4);

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

  // ── Team helpers ────────────────────────────────────────────────────────────

  _buildTeams(count) {
    const teams = {};
    for (let i = 0; i < count; i++) {
      const id = `t${i}`;
      teams[id] = { id, name: TEAM_NAMES[i], color: TEAM_COLORS[i], hp: TEAM_INITIAL_HP, eliminated: false };
    }
    return teams;
  }

  _activeTeamIds(room) {
    return Object.values(room.teams || {})
      .filter(t => !t.eliminated)
      .map(t => t.id);
  }

  _teamNavigatorId(room, teamId) {
    const players = allPlayers(room).filter(p => p.teamId === teamId && (p.isBot || p.connected !== false));
    if (room.settings?.navigatorMode === 'rotating') {
      const lastNav = room.teams?.[teamId]?.lastNavigatorId;
      const idx = players.findIndex(p => p.id === lastNav);
      return players[(idx + 1) % Math.max(1, players.length)]?.id || players[0]?.id;
    }
    return players.find(p => p.teamRole === 'navigator')?.id || players[0]?.id;
  }

  // ── Game phases ─────────────────────────────────────────────────────────────

  async _startRound() {
    const room = await getRoom(this.roomCode);
    if (!room) return;

    if (room.settings?.gameMode === 'survival') {
      await this._startTeamRound(room);
      return;
    }

    if (room.settings?.gameMode === 'grid') {
      await this._startGridRound(room);
      return;
    }

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

  async _startTeamRound(room) {
    const activeTeamIds = this._activeTeamIds(room);
    if (activeTeamIds.length < 1) return;

    const roundIntroUntil = Date.now() + ROUND_INTRO_DURATION_MS;
    const cardMode = room.settings?.cardMode ?? 'themed';
    const cardOptions = room.settings?.cardOptions ?? 3;

    // Assign navigators
    const teamStateInit = {};
    const teamUpdates = {};
    activeTeamIds.forEach(teamId => {
      const navId = this._teamNavigatorId(room, teamId);
      teamStateInit[teamId] = { navigatorId: navId, clue: null, clueReady: false, timedOut: false };
      teamUpdates[teamId] = { ...room.teams[teamId], lastNavigatorId: navId };
    });

    const baseUpdate = {
      clue: null, revealResult: null, currentTheme: null, currentCard: null,
      timerEnd: null, cardPickOptions: null, roundIntroUntil, revealUnlockAt: null,
      psychicId: null, teamState: teamStateInit, teams: teamUpdates,
    };

    if (cardMode === 'livre') {
      const usedIds = Object.keys(room.usedCardIds || {}).map(Number);
      const options = selectOpenCards(cardOptions, usedIds);
      await Promise.all([
        roomUpdate(this.roomCode, { ...baseUpdate, phase: 'pick_card', cardPickOptions: options }),
        remove(rref(this.roomCode, 'teamVotes')),
        remove(rref(this.roomCode, 'teamSecrets')),
        remove(rref(this.roomCode, 'votes')),
        remove(rref(this.roomCode, 'psychicSecret')),
        remove(rref(this.roomCode, 'emojiReactions')),
      ]);
      this._setTimer(20000, async () => {
        const r = await getRoom(this.roomCode);
        if (!r || r.phase !== 'pick_card') return;
        await this._applyCardPick(Object.values(r.cardPickOptions || {})[0]);
      });
    } else {
      await Promise.all([
        roomUpdate(this.roomCode, { ...baseUpdate, phase: 'roulette' }),
        remove(rref(this.roomCode, 'teamVotes')),
        remove(rref(this.roomCode, 'teamSecrets')),
        remove(rref(this.roomCode, 'votes')),
        remove(rref(this.roomCode, 'psychicSecret')),
        remove(rref(this.roomCode, 'emojiReactions')),
      ]);
      this._setTimer(20000, async () => {
        const r = await getRoom(this.roomCode);
        if (!r || r.phase !== 'roulette') return;
        await this._spinRoulette(this.hostId, true);
      });
    }
  }

  async _startGridRound(room) {
    const players = allPlayers(room).filter(p => p.isBot || p.connected !== false);
    if (players.length < 2) return;

    const startId = room.startingTransmitterId || room.transmitterId || this.hostId;
    const startIndex = Math.max(0, players.findIndex(p => p.id === startId));
    const tx = players[(startIndex + (room.round || 0)) % players.length] || players[0];
    const roundIntroUntil = Date.now() + ROUND_INTRO_DURATION_MS;

    const usedIds = Object.keys(room.usedCardIds || {}).map(Number);
    const [cardX, cardY] = selectTwoOpenCards(usedIds);

    await Promise.all([
      roomUpdate(this.roomCode, {
        psychicId: tx.id, transmitterId: tx.id,
        clue: null, revealResult: null, currentTheme: null, currentCard: null,
        currentCardX: { id: cardX.id, lP: cardX.lP, lE: cardX.lE, rP: cardX.rP, rE: cardX.rE },
        currentCardY: { id: cardY.id, lP: cardY.lP, lE: cardY.lE, rP: cardY.rP, rE: cardY.rE },
        timerEnd: null, cardPickOptions: null, roundIntroUntil, revealUnlockAt: null,
        phase: 'spinning',
      }),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'emojiReactions')),
    ]);
    await Promise.all([
      set(rref(this.roomCode, 'usedCardIds', String(cardX.id)), true),
      set(rref(this.roomCode, 'usedCardIds', String(cardY.id)), true),
    ]);
    setTimeout(() => this._activatePsychic(tx.id), ROUND_INTRO_DURATION_MS + 1200);
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

    if (room.settings?.gameMode === 'grid') {
      const targetX = Math.floor(Math.random() * 11);
      const targetY = Math.floor(Math.random() * 11);
      await set(rref(this.roomCode, 'psychicSecret'), { targetX, targetY });
      await this._startPsychicCluePhase(txId);
      return;
    }

    if (room.settings?.gameMode === 'survival') {
      // Generate a random secret per active team (targetMode='choose' deferred to clue phase)
      const activeTeamIds = this._activeTeamIds(room);
      const targetMode = room.settings?.targetMode ?? 'random';
      if (targetMode !== 'choose') {
        const secretUpdates = {};
        activeTeamIds.forEach(teamId => {
          secretUpdates[teamId] = { targetPosition: Math.floor(Math.random() * 81) + 10 };
        });
        await set(rref(this.roomCode, 'teamSecrets'), secretUpdates);
      }
      await this._startTeamCluePhase(room);
      return;
    }

    const tx = allPlayers(room).find(p => p.id === txId);
    const targetMode = room.settings?.targetMode ?? 'random';

    if (targetMode === 'choose' && !tx?.isBot) {
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
        let clue;
        if (r.settings?.gameMode === 'grid') {
          const { targetX = 5, targetY = 5 } = s.val() || {};
          clue = targetX > 6 ? (r.currentCardX?.rP || 'direita')
               : targetX < 4 ? (r.currentCardX?.lP || 'esquerda')
               : targetY > 6 ? (r.currentCardY?.rP || 'alto')
               : targetY < 4 ? (r.currentCardY?.lP || 'baixo')
               : 'centro';
        } else {
          const t2 = s.val()?.targetPosition ?? 50;
          clue = t2 < 35 ? (r.currentCard?.lP || 'esquerda') : t2 > 65 ? (r.currentCard?.rP || 'direita') : 'meio';
        }
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

  async _startTeamCluePhase(room) {
    const duration = (room.settings?.clueTimer ?? 30) * 1000;
    await roomUpdate(this.roomCode, { phase: 'psychic' });
    this._setTimer(duration, async () => {
      const r = await getRoom(this.roomCode);
      if (!r || r.phase !== 'psychic') return;
      // Force-ready all teams that haven't submitted
      const activeTeamIds = this._activeTeamIds(r);
      const updates = {};
      activeTeamIds.forEach(teamId => {
        if (!r.teamState?.[teamId]?.clueReady) {
          updates[`rooms/${this.roomCode}/teamState/${teamId}/clue`] = '(sem dica)';
          updates[`rooms/${this.roomCode}/teamState/${teamId}/clueReady`] = true;
          updates[`rooms/${this.roomCode}/teamState/${teamId}/timedOut`] = true;
        }
      });
      if (Object.keys(updates).length) await update(ref(db), updates);
      await this._proceedToTeamVoting();
    });
  }

  async _checkAllCluesReady() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'psychic' || room.settings?.gameMode !== 'survival') return;
    const activeTeamIds = this._activeTeamIds(room);
    const allReady = activeTeamIds.every(teamId => room.teamState?.[teamId]?.clueReady === true);
    if (allReady) {
      this._clearTimer();
      await this._proceedToTeamVoting();
    }
  }

  async _proceedToTeamVoting() {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const dur = (room.settings?.voteTimer ?? 60) * 1000;
    await roomUpdate(this.roomCode, { phase: 'voting' });
    this._setTimer(dur, () => this._finalizeTeamVoting(true).catch(e => console.error('[Engine] finalizeTeamVoting:', e)));
  }

  async _checkTeamVoteCompletion(teamVotes) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'voting' || room.settings?.gameMode !== 'survival') return;
    const activeTeamIds = this._activeTeamIds(room);
    const allDone = activeTeamIds.every(teamId => {
      const navId = room.teamState?.[teamId]?.navigatorId;
      const calibrators = allPlayers(room).filter(p =>
        p.teamId === teamId && p.id !== navId && (p.isBot || p.connected !== false)
      );
      const votes = teamVotes[teamId] || {};
      return calibrators.length === 0 || calibrators.every(p => votes[p.id] !== undefined);
    });
    if (allDone) {
      this._clearTimer();
      await this._finalizeTeamVoting(false).catch(e => console.error('[Engine] finalizeTeamVoting:', e));
    }
  }

  async _finalizeTeamVoting(timedOut = false) {
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

      const [teamVotesSnap, teamSecretsSnap] = await Promise.all([
        get(rref(this.roomCode, 'teamVotes')),
        get(rref(this.roomCode, 'teamSecrets')),
      ]);
      const allTeamVotes = teamVotesSnap.val() || {};
      const allTeamSecrets = teamSecretsSnap.val() || {};
      const activeTeamIds = this._activeTeamIds(room);

      const teamResults = {};
      const teamUpdates = {};
      const highlights = [];

      activeTeamIds.forEach(teamId => {
        const navId = room.teamState?.[teamId]?.navigatorId;
        const target = clampPosition(allTeamSecrets[teamId]?.targetPosition ?? 50);
        const rawVotes = allTeamVotes[teamId] || {};
        const calibrators = allPlayers(room).filter(p =>
          p.teamId === teamId && p.id !== navId && (p.isBot || p.connected !== false)
        );

        const votes = calibrators
          .filter(p => rawVotes[p.id] !== undefined)
          .map(p => ({ ...p, vote: rawVotes[p.id] }));

        const positions = votes
          .map(v => (typeof v.vote?.position === 'number' ? v.vote.position : null))
          .filter(x => x !== null);

        const avgVote = positions.length
          ? Math.round(positions.reduce((s, x) => s + x, 0) / positions.length)
          : target;
        const avgDiff = Math.abs(avgVote - target);

        const missedBoosts = votes.filter(v => v.vote?.boost && Math.abs(v.vote.position - target) > 25).length;
        const teamTimedOut = timedOut || (room.teamState?.[teamId]?.timedOut === true);
        const hpDelta = teamHullChange(avgDiff, missedBoosts, teamTimedOut);
        const currentHp = room.teams?.[teamId]?.hp ?? TEAM_INITIAL_HP;
        const newHp = Math.max(0, Math.min(TEAM_INITIAL_HP, currentHp + hpDelta));
        const eliminated = newHp <= 0;

        teamResults[teamId] = { target, avgVote, avgDiff, hpDelta, newHp, eliminated, timedOut: teamTimedOut };
        teamUpdates[teamId] = { ...room.teams[teamId], hp: newHp, eliminated };
        if (eliminated) highlights.push({ type: 'ship_down', teamId, teamName: room.teams[teamId]?.name });
      });

      const historyKey = push(rref(this.roomCode, 'roundHistory')).key || genId();
      await update(ref(db), {
        [`rooms/${this.roomCode}/teams`]: { ...room.teams, ...teamUpdates },
        [`rooms/${this.roomCode}/teamResults`]: teamResults,
        [`rooms/${this.roomCode}/roundHistory/${historyKey}`]: {
          round: room.round,
          card: room.currentCard ?? null,
          theme: room.currentTheme ?? null,
          teamResults,
          highlights,
        },
        [`rooms/${this.roomCode}/phase`]: 'reveal',
        [`rooms/${this.roomCode}/revealResult`]: { teamResults, highlights, revealUnlockAt: Date.now() + 5000 },
        [`rooms/${this.roomCode}/revealUnlockAt`]: Date.now() + 5000,
        [`rooms/${this.roomCode}/timerEnd`]: null,
      });
      releaseLockOnError = false;
    } catch (e) {
      if (releaseLockOnError && lockRef) await remove(lockRef).catch(() => {});
      throw e;
    } finally {
      this._finalizing = false;
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
      const isGrid = room.settings?.gameMode === 'grid';
      botVoters.forEach(b => {
        autoVotes[b.id] = isGrid
          ? { x: Math.round(Math.random() * 10), y: Math.round(Math.random() * 10), boost: Math.random() > 0.8 }
          : { position: Math.round(15 + Math.random() * 70), boost: Math.random() > 0.8 };
      });
      await update(rref(this.roomCode, 'votes'), autoVotes);
    }

    this._setTimer(dur, () => this._finalizeVoting().catch(e => console.error('[Engine] finalizeVoting:', e)));
  }

  async _checkVoteCompletion(votes) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'voting') return;
    if (room.settings?.gameMode === 'survival') return; // handled by _checkTeamVoteCompletion
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
      const existing = (await get(rref(this.roomCode, 'playerScores'))).val() || {};
      const isGrid = room.settings?.gameMode === 'grid';
      const resolved = isGrid
        ? resolveRoundGrid({
            room: { ...room, playerScores: existing },
            rawVotes,
            targetX: secretSnap.val()?.targetX,
            targetY: secretSnap.val()?.targetY,
            now: Date.now(),
          })
        : resolveRound({
            room: { ...room, playerScores: existing },
            rawVotes,
            target: secretSnap.val()?.targetPosition,
            now: Date.now(),
          });
      const { scoreUpdates, revealResult, historyEntry } = resolved;
      const historyKey = push(rref(this.roomCode, 'roundHistory')).key || genId();
      await update(ref(db), {
        [`rooms/${this.roomCode}/playerScores`]: scoreUpdates,
        [`rooms/${this.roomCode}/roundHistory/${historyKey}`]: historyEntry,
        [`rooms/${this.roomCode}/phase`]: 'reveal',
        [`rooms/${this.roomCode}/revealResult`]: revealResult,
        [`rooms/${this.roomCode}/revealUnlockAt`]: revealResult.revealUnlockAt,
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

    if (room.settings?.gameMode === 'survival') {
      // Check win condition: ≤1 active team
      const r = await getRoom(this.roomCode);
      const activeTeams = Object.values(r.teams || {}).filter(t => !t.eliminated);
      if (activeTeams.length <= 1) {
        const winner = activeTeams[0] || null;
        await roomUpdate(this.roomCode, {
          phase: 'gameover',
          winner: winner?.id || null,
          winnerTeamName: winner?.name || null,
        });
        return;
      }
      await roomUpdate(this.roomCode, { round: nextRound });
      await this._startRound();
      return;
    }

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
    const room = await getRoom(this.roomCode);
    const playerRemovals = {};
    allPlayers(room || {}).forEach(p => {
      if (!p.isBot && p.connected === false) playerRemovals[`rooms/${this.roomCode}/players/${p.id}`] = null;
    });
    // Reset team HPs and elimination status if in survival mode
    const teamReset = {};
    Object.values(room?.teams || {}).forEach(t => {
      teamReset[t.id] = { ...t, hp: TEAM_INITIAL_HP, eliminated: false, lastNavigatorId: null };
    });
    await Promise.all([
      roomUpdate(this.roomCode, {
        phase: 'lobby', round: 0,
        psychicId: null, clue: null, revealResult: null,
        currentTheme: null, currentCard: null, timerEnd: null,
        winner: null, winnerIds: null, winnerTeamName: null,
        startingTransmitterId: null, cardPickOptions: null, revealUnlockAt: null,
        ...(Object.keys(teamReset).length ? { teams: teamReset } : {}),
      }),
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'actions')),
      remove(rref(this.roomCode, 'playerScores')),
      remove(rref(this.roomCode, 'finalizeLocks')),
      remove(rref(this.roomCode, 'teamVotes')),
      remove(rref(this.roomCode, 'teamSecrets')),
      remove(rref(this.roomCode, 'teamState')),
      remove(rref(this.roomCode, 'teamResults')),
      ...(Object.keys(playerRemovals).length ? [update(ref(db), playerRemovals)] : []),
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
    const playerRemovals = {};
    allPlayers(room || {}).forEach(p => {
      if (!p.isBot && p.connected === false) playerRemovals[`rooms/${this.roomCode}/players/${p.id}`] = null;
    });
    // Reset team HPs
    const teamReset = {};
    Object.values(room?.teams || {}).forEach(t => {
      teamReset[t.id] = { ...t, hp: TEAM_INITIAL_HP, eliminated: false, lastNavigatorId: null };
    });
    await roomUpdate(this.roomCode, {
      round: 0,
      winner: null,
      winnerIds: null,
      winnerTeamName: null,
      startingTransmitterId: activePlayers.some(p => p.id === room?.transmitterId) ? room.transmitterId : this.hostId,
      revealUnlockAt: null,
      ...(Object.keys(teamReset).length ? { teams: teamReset } : {}),
    });
    await Promise.all([
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'finalizeLocks')),
      remove(rref(this.roomCode, 'teamVotes')),
      remove(rref(this.roomCode, 'teamSecrets')),
      remove(rref(this.roomCode, 'teamState')),
      remove(rref(this.roomCode, 'teamResults')),
      set(rref(this.roomCode, 'playerScores'), {}),
      ...(Object.keys(playerRemovals).length ? [update(ref(db), playerRemovals)] : []),
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
        const inRange = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
        if (inRange(data.rounds, 3, 30))      s.rounds = data.rounds;
        if (inRange(data.clueTimer, 15, 120)) s.clueTimer = data.clueTimer;
        if (inRange(data.voteTimer, 15, 120)) s.voteTimer = data.voteTimer;
        if (['random','choose'].includes(data.targetMode)) s.targetMode = data.targetMode;
        if (['themed','livre'].includes(data.cardMode)) s.cardMode = data.cardMode;
        if ([1,3,5].includes(data.cardOptions)) s.cardOptions = data.cardOptions;
        if (['ffa','survival','grid'].includes(data.gameMode)) s.gameMode = data.gameMode;
        if ([2,3,4].includes(data.numTeams)) s.numTeams = data.numTeams;
        if (['fixed','rotating'].includes(data.navigatorMode)) s.navigatorMode = data.navigatorMode;

        const modeChanged = s.gameMode !== undefined && s.gameMode !== room.settings?.gameMode;
        const numTeamsChanged = s.numTeams !== undefined && s.numTeams !== room.settings?.numTeams;
        const newMode = s.gameMode ?? room.settings?.gameMode ?? 'ffa';
        const newNumTeams = s.numTeams ?? room.settings?.numTeams ?? 2;

        if (Object.keys(s).length) await update(rref(this.roomCode, 'settings'), s);

        // Rebuild teams if mode or team count changed
        if (newMode === 'survival' && (modeChanged || numTeamsChanged)) {
          const teams = this._buildTeams(newNumTeams);
          // Unassign players that were in teams that no longer exist
          const playerUpdates = {};
          allPlayers(room).forEach(p => {
            if (p.teamId && !teams[p.teamId]) playerUpdates[p.id] = { ...p, teamId: null, teamRole: null };
          });
          await roomUpdate(this.roomCode, { teams });
          if (Object.keys(playerUpdates).length) await update(rref(this.roomCode, 'players'), playerUpdates);
        } else if ((newMode === 'ffa' || newMode === 'grid') && modeChanged) {
          await roomUpdate(this.roomCode, { teams: null });
        }
        break;
      }

      case 'join_team': {
        if (room.phase !== 'lobby') return;
        const { teamId, role } = data;
        if (!room.teams?.[teamId]) return;
        if (!['navigator', 'calibrator'].includes(role)) return;
        // If joining as navigator, demote existing navigator in that team
        if (role === 'navigator') {
          const existingNav = allPlayers(room).find(p => p.id !== by && p.teamId === teamId && p.teamRole === 'navigator');
          if (existingNav) {
            await update(rref(this.roomCode, 'players', existingNav.id), { teamRole: 'calibrator' });
          }
        }
        await update(rref(this.roomCode, 'players', by), { teamId, teamRole: role });
        break;
      }

      case 'leave_team': {
        if (room.phase !== 'lobby') return;
        await update(rref(this.roomCode, 'players', by), { teamId: null, teamRole: null });
        break;
      }

      case 'randomize_teams': {
        if (!isHost || room.phase !== 'lobby') return;
        const numTeams = room.settings?.numTeams ?? 2;
        const active = allPlayers(room).filter(p => p.isBot || p.connected !== false);
        const shuffled = [...active].sort(() => Math.random() - 0.5);
        const playerUpdates = {};
        shuffled.forEach((p, i) => {
          const teamId = `t${i % numTeams}`;
          const role = i < numTeams ? 'navigator' : 'calibrator';
          playerUpdates[p.id] = { ...p, teamId, teamRole: role };
        });
        await update(rref(this.roomCode, 'players'), playerUpdates);
        break;
      }


      case 'start_game': {
        if (!isHost || room.phase !== 'lobby') return;
        const activePlayers = allPlayers(room).filter(p => p.isBot || p.connected !== false);
        if (activePlayers.length < 2) return;
        if (room.settings?.gameMode === 'survival') {
          const numTeams = room.settings?.numTeams ?? 2;
          const teams = room.teams || this._buildTeams(numTeams);
          const activeTeamIds = Object.keys(teams);
          // Each team must have at least 1 player
          const valid = activeTeamIds.every(teamId =>
            activePlayers.some(p => p.teamId === teamId)
          );
          if (!valid) return;
          if (!room.teams) await roomUpdate(this.roomCode, { teams });
        }
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
        if (room.phase !== 'psychic') return;

        if (room.settings?.gameMode === 'survival') {
          const myTeamId = actor?.teamId;
          if (!myTeamId) return;
          const navId = room.teamState?.[myTeamId]?.navigatorId;
          if (navId !== by) return;
          const clue = String(data.clue || '').trim().slice(0, 40);
          if (!clue) return;
          if (room.settings?.targetMode === 'choose' && data.position !== undefined) {
            const pos = clampPosition(data.position, 50, 5, 95);
            await set(rref(this.roomCode, `teamSecrets/${myTeamId}`), { targetPosition: pos });
          }
          const updates = {
            [`rooms/${this.roomCode}/teamState/${myTeamId}/clue`]: clue,
            [`rooms/${this.roomCode}/teamState/${myTeamId}/clueReady`]: true,
          };
          await update(ref(db), updates);
          await this._checkAllCluesReady();
          break;
        }

        const tx = Object.values(room.players || {}).find(p => p.id === room.psychicId);
        const canClue = room.psychicId === by || (by === this.hostId && tx?.isBot);
        if (!canClue) return;
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
        if (room.phase !== 'voting') return;
        if (actor?.connected === false) return;

        if (room.settings?.gameMode === 'grid') {
          if (by === room.psychicId) return;
          const gx = Math.max(0, Math.min(10, Math.round(Number(data.x) || 0)));
          const gy = Math.max(0, Math.min(10, Math.round(Number(data.y) || 0)));
          await set(rref(this.roomCode, 'votes', by), { x: gx, y: gy, boost: !!data.boost });
          break;
        }

        if (room.settings?.gameMode === 'survival') {
          const myTeamId = actor?.teamId;
          if (!myTeamId) return;
          const navId = room.teamState?.[myTeamId]?.navigatorId;
          if (by === navId) return; // navigator doesn't vote
          if (room.teams?.[myTeamId]?.eliminated) return;
          const pos = clampPosition(data.position);
          await set(rref(this.roomCode, `teamVotes/${myTeamId}/${by}`), { position: pos, boost: !!data.boost });
          break;
        }

        if (by === room.psychicId) return;
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
      if (room.settings?.gameMode === 'grid') {
        const voters = allPlayers(room).filter(p => p.id !== room.psychicId);
        const vSnap = await get(rref(this.roomCode, 'votes'));
        const existing = vSnap.val() || {};
        const upd = {};
        voters.filter(p => existing[p.id] === undefined).forEach(p => {
          upd[p.id] = { x: Math.round(Math.random() * 10), y: Math.round(Math.random() * 10), boost: false };
        });
        if (Object.keys(upd).length) await update(rref(this.roomCode, 'votes'), upd);
        await this._finalizeVoting();
      } else if (room.settings?.gameMode === 'survival') {
        // Fill missing team votes with random positions
        const activeTeamIds = this._activeTeamIds(room);
        const tvSnap = await get(rref(this.roomCode, 'teamVotes'));
        const allTeamVotes = tvSnap.val() || {};
        const tvUpd = {};
        activeTeamIds.forEach(teamId => {
          const navId = room.teamState?.[teamId]?.navigatorId;
          const calibrators = allPlayers(room).filter(p => p.teamId === teamId && p.id !== navId && (p.isBot || p.connected !== false));
          calibrators.forEach(p => {
            if ((allTeamVotes[teamId] || {})[p.id] === undefined) {
              tvUpd[`teamVotes/${teamId}/${p.id}`] = { position: Math.round(20 + Math.random() * 60), boost: false };
            }
          });
        });
        if (Object.keys(tvUpd).length) {
          const fbUpd = Object.fromEntries(Object.entries(tvUpd).map(([k, v]) => [`rooms/${this.roomCode}/${k}`, v]));
          await update(ref(db), fbUpd);
        }
        await this._finalizeTeamVoting(false);
      } else {
        const voters = allPlayers(room).filter(p => p.id !== room.psychicId);
        const vSnap  = await get(rref(this.roomCode,'votes'));
        const existing = vSnap.val() || {};
        const upd = {};
        voters.filter(p => existing[p.id] === undefined).forEach(p => {
          upd[p.id] = { position: Math.round(20+Math.random()*60), boost: false };
        });
        if (Object.keys(upd).length) await update(rref(this.roomCode,'votes'), upd);
        await this._finalizeVoting();
      }
    } else if (phase === 'reveal') {
      await this._advanceRound();
    } else if (phase === 'gameover') {
      await this._resetToLobby();
      await this._startRound();
    }
  }
}
