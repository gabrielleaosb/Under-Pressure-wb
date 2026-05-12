/**
 * GameEngine — runs exclusively in the HOST's browser.
 * Listens for player action requests in Firebase and drives game logic.
 * Replaces the Node.js WebSocket server.
 */
import { db, ref, get, set, update, remove, push, onValue, onChildAdded } from './firebase.js';
import { PLAYER_COLORS, TEAM_NAME_PAIRS, CARDS, THEMES,
         selectCard, computeResult, genId } from './gameData.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function teamPlayers(room, teamIdx) {
  return Object.values(room.players || {}).filter(p => p.teamIndex === teamIdx);
}

// ── Unique room code ────────────────────────────────────────────────────────

export async function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    const snap = await get(ref(db, `rooms/${code}/code`));
    if (!snap.exists()) return code;
  }
  return genId().slice(0, 4).toUpperCase();
}

// ── Create room (called once by host) ───────────────────────────────────────

export async function createRoom(code, hostId, playerName) {
  const pair = TEAM_NAME_PAIRS[Math.floor(Math.random() * TEAM_NAME_PAIRS.length)];
  const roomData = {
    code,
    hostId,
    phase: 'lobby',
    round: 0,
    activeTeamIndex: 0,
    psychicId: null,
    clue: null,
    timerEnd: null,
    winner: null,
    damage0: 0, damage1: 0,
    score0:  0, score1:  0,
    psychicIdx0: 0, psychicIdx1: 0,
    currentTheme: null,
    currentCard:  null,
    revealResult: null,
    settings: { rounds:10, maxDamage:5, clueTimer:60, voteTimer:60 },
    teams: {
      '0': { name: pair[0], color: '#ff3355' },
      '1': { name: pair[1], color: '#00aaff' },
    },
    players: {
      [hostId]: {
        id: hostId, name: playerName,
        color: PLAYER_COLORS[0],
        teamIndex: null, connected: true, isHost: true, isBot: false,
      },
    },
    createdAt: Date.now(),
  };
  await set(ref(db, `rooms/${code}`), roomData);
}

// ── Add player to existing room ─────────────────────────────────────────────

export async function addPlayerToRoom(code, playerId, playerName) {
  const room = await getRoom(code);
  if (!room) return { error: 'room_not_found' };
  if (room.phase !== 'lobby') {
    // Allow re-join by same name
    const existing = Object.values(room.players || {}).find(p => p.name === playerName && !p.connected);
    if (existing) {
      await update(ref(db, `rooms/${code}/players/${existing.id}`), { connected: true });
      return { rejoin: true, playerId: existing.id };
    }
    return { error: 'game_in_progress' };
  }
  if (Object.keys(room.players || {}).length >= 20) return { error: 'room_full' };

  const colorIdx = Object.keys(room.players || {}).length % PLAYER_COLORS.length;
  await set(ref(db, `rooms/${code}/players/${playerId}`), {
    id: playerId, name: playerName,
    color: PLAYER_COLORS[colorIdx],
    teamIndex: null, connected: true, isHost: false, isBot: false,
  });
  return { ok: true };
}

// ── GameEngine class (instantiated by host) ──────────────────────────────────

export class GameEngine {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId   = hostId;
    this._unsubs  = [];
    this._timer   = null;
    this._processingAction = false;
    this._actionQueue = [];
  }

  start() {
    // onChildAdded fires only for NEW actions, never for deletions → no duplicates
    const unsub = onChildAdded(rref(this.roomCode, 'actions'), snap => {
      const key = snap.key; const action = snap.val();
      if (key && action) this._enqueue(key, action);
    });
    this._unsubs.push(unsub);

    // Watch votes to auto-finalize when everyone's voted
    const unsub2 = onValue(rref(this.roomCode, 'votes'), snap => {
      this._checkVoteCompletion(snap.val() || {});
    });
    this._unsubs.push(unsub2);
  }

  stop() {
    this._unsubs.forEach(u => u());
    this._unsubs = [];
    this._clearTimer();
  }

  // ── Action queue (process one at a time) ──────────────────────────────────

  _enqueue(key, action) {
    this._actionQueue.push({ key, action });
    if (!this._processingAction) this._drainQueue();
  }

  async _drainQueue() {
    this._processingAction = true;
    while (this._actionQueue.length) {
      const { key, action } = this._actionQueue.shift();
      try {
        await this._processAction(action.type, action, action.by);
      } catch(e) { console.error('GameEngine action error:', e); }
      await remove(rref(this.roomCode, 'actions', key));
    }
    this._processingAction = false;
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  _setTimer(ms, cb) {
    this._clearTimer();
    const end = Date.now() + ms;
    roomUpdate(this.roomCode, { timerEnd: end });
    this._timer = setTimeout(cb, ms);
  }

  _clearTimer() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    roomUpdate(this.roomCode, { timerEnd: null }).catch(() => {});
  }

  // ── Game phases ───────────────────────────────────────────────────────────

  async _startRound() {
    const room = await getRoom(this.roomCode);
    if (!room) return;

    // Sort: humans first so bots don't steal the psychic role
    const active = teamPlayers(room, room.activeTeamIndex)
      .sort((a, b) => (a.isBot ? 1 : 0) - (b.isBot ? 1 : 0));
    if (!active.length) return;

    const idx0    = room.psychicIdx0 ?? 0;
    const idx1    = room.psychicIdx1 ?? 0;
    const psychicIdx = room.activeTeamIndex === 0 ? idx0 : idx1;
    const psychic = active[psychicIdx % active.length];

    await Promise.all([
      roomUpdate(this.roomCode, {
        phase: 'roulette', psychicId: psychic.id,
        clue: null, revealResult: null, currentTheme: null, currentCard: null, timerEnd: null,
      }),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'emojiReactions')),
    ]);

    // When the psychic is a bot, auto-handle their turn so humans can vote
    if (psychic.isBot) {
      setTimeout(() => this._autoSpinForBot(), 1600);
    }
  }

  async _autoSpinForBot() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'roulette') return;
    // Spin on behalf of the bot psychic
    await this._spinRoulette(this.hostId);
    // After animation, auto-submit a clue
    setTimeout(async () => {
      const r = await getRoom(this.roomCode);
      if (!r || r.phase !== 'psychic') return;
      const secretSnap = await get(rref(this.roomCode, 'psychicSecret'));
      const target = secretSnap.val()?.targetPosition ?? 50;
      // Give a directional clue based on position
      const clue = target < 35
        ? (r.currentCard?.lP || 'esquerda')
        : target > 65
          ? (r.currentCard?.rP || 'direita')
          : (r.lang === 'en' ? 'middle' : 'meio');
      await roomUpdate(this.roomCode, { clue, timerEnd: null });
      await this._proceedToVoting();
    }, 2200); // wait for spin animation + brief reveal
  }

  async _spinRoulette(requestedBy) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'roulette') return;
    // Host can spin on behalf of a bot psychic
    const psychicPlayer = Object.values(room.players || {}).find(p => p.id === room.psychicId);
    const canSpin = room.psychicId === requestedBy ||
      (requestedBy === this.hostId && psychicPlayer?.isBot);
    if (!canSpin) return;

    const usedIds  = Object.keys(room.usedCardIds || {}).map(Number);
    const { theme, card } = selectCard(usedIds);

    await roomUpdate(this.roomCode, {
      phase: 'spinning',
      currentTheme: { id:theme.id, namePT:theme.namePT, nameEN:theme.nameEN, shortPT:theme.shortPT, shortEN:theme.shortEN, color:theme.color },
      currentCard:  { id:card.id,  lP:card.lP, lE:card.lE, rP:card.rP, rE:card.rE },
    });
    await set(rref(this.roomCode, 'usedCardIds', String(card.id)), true);

    // 5200ms: animation 3800ms + reveal visible ~1400ms before transitioning
    setTimeout(() => this._activatePsychic(room.psychicId), 5200);
  }

  async _activatePsychic(psychicId) {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'spinning') return;

    const target   = Math.floor(Math.random() * 81) + 10; // 10–90
    const duration = (room.settings?.clueTimer ?? 60) * 1000;

    await roomUpdate(this.roomCode, { phase: 'psychic' });
    await set(rref(this.roomCode, 'psychicSecret'), { targetPosition: target });

    this._setTimer(duration, async () => {
      const r = await getRoom(this.roomCode);
      if (!r || r.phase !== 'psychic') return;
      const newDmg = this._applyDamage(r, 1);
      if (newDmg[r.activeTeamIndex] >= r.settings.maxDamage) {
        await roomUpdate(this.roomCode, { ...newDmg.update, phase:'gameover', winner: r.activeTeamIndex===0?1:0, clue:'(sem dica)' });
      } else {
        await roomUpdate(this.roomCode, { ...newDmg.update, clue:'(sem dica)', timerEnd:null });
        await this._proceedToVoting();
      }
    });
  }

  _applyDamage(room, amount) {
    const i = room.activeTeamIndex;
    const key = `damage${i}`;
    const val = Math.min((room[key]||0) + amount, room.settings?.maxDamage ?? 5);
    return { update: { [key]: val }, values: i===0 ? [val, room.damage1||0] : [room.damage0||0, val] };
  }

  async _proceedToVoting() {
    const room = await getRoom(this.roomCode);
    const dur  = (room?.settings?.voteTimer ?? 60) * 1000;
    await roomUpdate(this.roomCode, { phase: 'voting' });

    // Bots on the active team auto-vote immediately so they don't block finalization
    const botVoters = Object.values(room.players || {})
      .filter(p => p.teamIndex === room.activeTeamIndex && p.isBot && p.id !== room.psychicId);
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
    const nonPsychic = teamPlayers(room, room.activeTeamIndex).filter(p => p.id !== room.psychicId);
    if (nonPsychic.length > 0 && nonPsychic.every(p => votes[p.id] !== undefined)) {
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

    const voterIds = teamPlayers(room, room.activeTeamIndex)
      .filter(p => p.id !== room.psychicId).map(p => p.id);
    const vals = voterIds.map(id => votes[id]).filter(v => v !== undefined);
    const avg  = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 50;

    const result = computeResult(avg, target);
    const i      = room.activeTeamIndex;
    const newDmg = Math.min((room[`damage${i}`]||0) + result.damage, room.settings?.maxDamage ?? 5);
    const newScr = (room[`score${i}`]||0) + result.points;

    const revealResult = { avg, target, diff: Math.abs(avg-target), ...result };
    const histEntry = {
      round: room.round, activeTeam: i, psychicId: room.psychicId,
      psychicName: Object.values(room.players||{}).find(p=>p.id===room.psychicId)?.name,
      theme: room.currentTheme, card: room.currentCard,
      clue: room.clue, target, avg, diff: Math.abs(avg-target),
      result, votes,
    };

    await push(rref(this.roomCode, 'roundHistory'), histEntry);

    if (newDmg >= (room.settings?.maxDamage ?? 5)) {
      await roomUpdate(this.roomCode, {
        [`damage${i}`]: newDmg, [`score${i}`]: newScr,
        revealResult, phase: 'gameover', winner: i===0?1:0, timerEnd: null,
      });
    } else {
      await roomUpdate(this.roomCode, {
        [`damage${i}`]: newDmg, [`score${i}`]: newScr,
        revealResult, phase: 'reveal', timerEnd: null,
      });
    }
  }

  async _advanceRound() {
    const room = await getRoom(this.roomCode);
    if (!room || room.phase !== 'reveal') return;

    const next = room.round + 1;
    if (next >= (room.settings?.rounds ?? 10)) {
      const s0 = room.score0||0, s1 = room.score1||0;
      const winner = s0>s1 ? 0 : s1>s0 ? 1 : -1;
      await roomUpdate(this.roomCode, { phase:'gameover', winner });
      return;
    }

    const prevActive = room.activeTeamIndex;
    const nextActive = prevActive===0 ? 1 : 0;
    const idxKey = `psychicIdx${prevActive}`;
    await roomUpdate(this.roomCode, {
      round: next,
      activeTeamIndex: nextActive,
      [idxKey]: (room[idxKey]||0) + 1,
    });
    await this._startRound();
  }

  async _resetToLobby() {
    this._clearTimer();
    await Promise.all([
      roomUpdate(this.roomCode, {
        phase:'lobby', round:0,
        damage0:0, damage1:0, score0:0, score1:0,
        psychicIdx0:0, psychicIdx1:0,
        activeTeamIndex:0, winner:null,
        psychicId:null, clue:null, revealResult:null,
        currentTheme:null, currentCard:null, timerEnd:null,
      }),
      remove(rref(this.roomCode, 'roundHistory')),
      remove(rref(this.roomCode, 'votes')),
      remove(rref(this.roomCode, 'psychicSecret')),
      remove(rref(this.roomCode, 'usedCardIds')),
      remove(rref(this.roomCode, 'emojiReactions')),
      remove(rref(this.roomCode, 'actions')),
    ]);
  }

  // ── Central action dispatcher ─────────────────────────────────────────────

  async _processAction(type, data, by) {
    const room = await getRoom(this.roomCode);
    if (!room) return;
    const isHost = by === this.hostId;

    switch (type) {

      case 'assign_team': {
        const targetId = data.targetPlayerId || by;
        if (!isHost && targetId !== by) return;
        const ti = data.teamIndex===0||data.teamIndex===1 ? data.teamIndex : null;
        await update(rref(this.roomCode, 'players', targetId), { teamIndex: ti });
        break;
      }

      case 'rename_team':
        if (!isHost) return;
        if (data.teamIndex===0||data.teamIndex===1) {
          const name = String(data.name||'').trim().slice(0,30);
          if (name) await update(rref(this.roomCode,'teams',String(data.teamIndex)), { name });
        }
        break;

      case 'update_settings': {
        if (!isHost || room.phase!=='lobby') return;
        const s = {};
        if ([5,10,15].includes(data.rounds))    s.rounds    = data.rounds;
        if ([3,5,7].includes(data.maxDamage))   s.maxDamage = data.maxDamage;
        if ([30,60,90].includes(data.clueTimer))s.clueTimer = data.clueTimer;
        if ([30,60,90].includes(data.voteTimer))s.voteTimer = data.voteTimer;
        if (Object.keys(s).length) await update(rref(this.roomCode,'settings'), s);
        break;
      }

      case 'start_game': {
        if (!isHost || room.phase!=='lobby') return;
        const t0 = teamPlayers(room,0), t1 = teamPlayers(room,1);
        const hasBots = Object.values(room.players||{}).some(p=>p.isBot);
        const min = hasBots ? 1 : 2;
        if (t0.length<min||t1.length<min) return;
        await roomUpdate(this.roomCode, {
          round:0, damage0:0, damage1:0, score0:0, score1:0,
          psychicIdx0:0, psychicIdx1:0, activeTeamIndex:0, winner:null,
        });
        await Promise.all([
          remove(rref(this.roomCode,'roundHistory')),
          remove(rref(this.roomCode,'usedCardIds')),
        ]);
        await this._startRound();
        break;
      }

      case 'spin_roulette':
        await this._spinRoulette(by);
        break;

      case 'submit_clue': {
        const cluePlayer = Object.values(room.players||{}).find(p=>p.id===room.psychicId);
        const canClue = room.psychicId===by || (by===this.hostId && cluePlayer?.isBot);
        if (room.phase!=='psychic' || !canClue) return;
        const clue = String(data.clue||'').trim().split(/\s+/)[0].slice(0,60);
        if (!clue) return;
        this._clearTimer();
        await roomUpdate(this.roomCode, { clue, timerEnd:null });
        await this._proceedToVoting();
        break;
      }

      case 'submit_vote': {
        if (room.phase!=='voting' || by===room.psychicId) return;
        const pos = Math.max(0, Math.min(100, Math.round(Number(data.position)||50)));
        await set(rref(this.roomCode,'votes',by), pos);
        break;
      }

      case 'advance_round':
        // Any player can advance — no host restriction
        await this._advanceRound();
        break;

      case 'emoji_reaction': {
        const ok = ['😱','🔥','💀','😂','👏','😮','🤯','💥'];
        const emoji = ok.includes(data.emoji) ? data.emoji : '😱';
        const name  = Object.values(room.players||{}).find(p=>p.id===by)?.name || '?';
        await push(rref(this.roomCode,'emojiReactions'), { playerId:by, playerName:name, emoji, ts:Date.now(), id:genId() });
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

      // ── Dev commands ─────────────────────────────────────────────────────

      case 'dev_add_bots': {
        if (!isHost || room.phase!=='lobby') return;
        const n = Object.keys(room.players||{}).length;
        const bots = {
          bot_0: { id:'bot_0', name:'Bot-Alpha', isBot:true, color:PLAYER_COLORS[(n)%12],   teamIndex:0, connected:false, isHost:false },
          bot_1: { id:'bot_1', name:'Bot-Beta',  isBot:true, color:PLAYER_COLORS[(n+1)%12], teamIndex:0, connected:false, isHost:false },
          bot_2: { id:'bot_2', name:'Bot-Gamma', isBot:true, color:PLAYER_COLORS[(n+2)%12], teamIndex:1, connected:false, isHost:false },
          bot_3: { id:'bot_3', name:'Bot-Delta', isBot:true, color:PLAYER_COLORS[(n+3)%12], teamIndex:1, connected:false, isHost:false },
        };
        await update(rref(this.roomCode,'players'), bots);
        break;
      }

      case 'dev_skip_phase':
        if (!isHost) return;
        await this._devSkip(room);
        break;

      // Rotate the psychic so the next player (likely a bot) becomes psychic
      case 'dev_next_psychic': {
        if (!isHost) return;
        const npKey = `psychicIdx${room.activeTeamIndex}`;
        await roomUpdate(this.roomCode, { [npKey]: (room[npKey] || 0) + 1 });
        if (room.phase !== 'lobby') await this._startRound();
        break;
      }

      case 'dev_damage': {
        if (!isHost) return;
        const team = data.team ?? room.activeTeamIndex;
        const val  = Math.max(0, Math.min(room.settings?.maxDamage??5, Number(data.damage)||0));
        await roomUpdate(this.roomCode, { [`damage${team}`]: val });
        break;
      }
    }
  }

  async _devSkip(room) {
    this._clearTimer();
    const phase = room.phase;
    if (phase === 'lobby') {
      // Auto-assign unassigned players alternately
      const players = Object.values(room.players||{});
      const updates = {};
      players.filter(p=>p.teamIndex===null).forEach((p,i) => {
        updates[`players/${p.id}/teamIndex`] = i%2;
      });
      if (Object.keys(updates).length) await update(ref(db,`rooms/${this.roomCode}`), updates);
      await this._processAction('start_game',{}, this.hostId);
    } else if (phase==='roulette'||phase==='spinning') {
      if (!room.currentTheme) {
        const usedIds = Object.keys(room.usedCardIds||{}).map(Number);
        const { theme, card } = selectCard(usedIds);
        await roomUpdate(this.roomCode, {
          currentTheme:{ id:theme.id,emoji:theme.emoji,namePT:theme.namePT,nameEN:theme.nameEN,color:theme.color },
          currentCard: { id:card.id, lP:card.lP,lE:card.lE,rP:card.rP,rE:card.rE },
        });
        await set(rref(this.roomCode,'usedCardIds',String(card.id)), true);
      }
      const r2 = await getRoom(this.roomCode);
      await this._activatePsychic(r2.psychicId);
    } else if (phase==='psychic') {
      await roomUpdate(this.roomCode, { clue:'[DEV]', timerEnd:null });
      await this._proceedToVoting();
    } else if (phase==='voting') {
      const nonPsychic = teamPlayers(room, room.activeTeamIndex).filter(p=>p.id!==room.psychicId);
      const vSnap = await get(rref(this.roomCode,'votes'));
      const existing = vSnap.val()||{};
      const upd = {};
      nonPsychic.filter(p=>existing[p.id]===undefined).forEach(p=>{ upd[p.id]=Math.round(30+Math.random()*40); });
      if (Object.keys(upd).length) await update(rref(this.roomCode,'votes'), upd);
      await this._finalizeVoting();
    } else if (phase==='reveal') {
      await this._advanceRound();
    } else if (phase==='gameover') {
      await this._resetToLobby();
      await this._startRound();
    }
  }
}
