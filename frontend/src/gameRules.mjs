export function scoreFromDiff(diff) {
  if (diff === 0) return 8;
  if (diff <= 5) return 5;
  if (diff <= 15) return 4;
  if (diff <= 25) return 3;
  if (diff <= 40) return 1;
  if (diff <= 50) return 0;
  if (diff <= 60) return -1;
  return -2;
}

export const DEFAULT_ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export function boostBonus(diff) {
  if (diff <= 15) return 4;
  if (diff <= 25) return 1;
  return -4;
}

export function clampPosition(value, fallback = 50, min = 0, max = 100) {
  const numeric = Number(value);
  const base = Number.isFinite(numeric) ? numeric : fallback;
  return Math.max(min, Math.min(max, Math.round(base)));
}

export function normalizeVote(raw) {
  if (typeof raw === 'number') {
    return { position: clampPosition(raw), boost: false };
  }
  const position = clampPosition(raw?.position);
  return { position, boost: !!(raw?.boost ?? raw?.surge ?? raw?.overdrive) };
}

export function canonicalPlayerName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function findRejoinPlayer(players = {}, playerName) {
  const wanted = canonicalPlayerName(playerName);
  if (!wanted) return null;

  return Object.values(players).find((player) => (
    !player.isBot &&
    player.connected === false &&
    canonicalPlayerName(player.name) === wanted
  )) || null;
}

export function roomExpiresAt(createdAt, ttlMs = DEFAULT_ROOM_TTL_MS) {
  const created = Number(createdAt);
  if (!Number.isFinite(created) || created <= 0) return 0;
  return created + ttlMs;
}

export function isRoomExpired(room, now = Date.now(), ttlMs = DEFAULT_ROOM_TTL_MS) {
  if (!room) return true;
  const explicitExpiry = Number(room.expiresAt);
  if (Number.isFinite(explicitExpiry) && explicitExpiry > 0) return explicitExpiry <= now;
  const fallbackExpiry = roomExpiresAt(room.createdAt, ttlMs);
  return fallbackExpiry > 0 && fallbackExpiry <= now;
}

export function transmitterScore(voters, votes, target) {
  const submittedVoters = voters.filter((player) => {
    const vote = votes[player.id];
    return vote && Number.isFinite(vote.position);
  });
  const hitters = submittedVoters.filter((player) => Math.abs(votes[player.id].position - target) <= 25);
  const strongHits = hitters.filter((player) => Math.abs(votes[player.id].position - target) <= 15);
  const cleanSweep = voters.length > 0 && submittedVoters.length === voters.length && hitters.length === voters.length;
  const cleanSweepBonus = cleanSweep ? Math.ceil(voters.length / 2) : 0;

  return {
    points: hitters.length * 2 + strongHits.length + cleanSweepBonus,
    hits: hitters.length,
    strongHits: strongHits.length,
    submitted: submittedVoters.length,
    expected: voters.length,
    cleanSweep,
    cleanSweepBonus,
  };
}

function buildHighlight(type, playerId, playerName, value = null) {
  return { type, playerId, playerName, value };
}

function allPlayers(room) {
  return Object.values(room?.players || {});
}

// ── Team Survival mode ────────────────────────────────────────────────────────

export const TEAM_INITIAL_HP = 100;
export const TEAM_COLORS = ['#ff4655', '#00c2ff', '#ffb800', '#00ff88'];
export const TEAM_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

export function teamHullChange(avgDiff, missedBoosts = 0, timedOut = false) {
  let base;
  if (avgDiff <= 5)       base = 10;
  else if (avgDiff <= 15) base = 5;
  else if (avgDiff <= 25) base = -5;
  else if (avgDiff <= 40) base = -15;
  else if (avgDiff <= 60) base = -25;
  else                    base = -35;
  return base - missedBoosts * 8 - (timedOut ? 10 : 0);
}

export function resolveRound({
  room,
  rawVotes = {},
  target,
  now = Date.now(),
}) {
  const players = allPlayers(room);
  const safeTarget = clampPosition(target);
  const eligibleVoters = players.filter((player) => (
    player.id !== room.psychicId &&
    (player.isBot || player.connected !== false || rawVotes[player.id] !== undefined)
  ));
  const votes = Object.fromEntries(
    eligibleVoters
      .filter((player) => rawVotes[player.id] !== undefined)
      .map((player) => [player.id, normalizeVote(rawVotes[player.id])]),
  );

  const roundScores = {};
  const highlights = [];

  eligibleVoters.forEach((player) => {
    const vote = votes[player.id];
    if (!vote) return;
    const diff = Math.abs(vote.position - safeTarget);
    const baseScore = scoreFromDiff(diff);
    const bonus = vote.boost ? boostBonus(diff) : 0;
    const points = baseScore + bonus;

    roundScores[player.id] = points;

    if (diff <= 5) highlights.push(buildHighlight('perfect', player.id, player.name, diff));
    else if (vote.boost && diff <= 25) highlights.push(buildHighlight('boost_hit', player.id, player.name, points));
    else if (vote.boost && diff > 25) highlights.push(buildHighlight('boost_miss', player.id, player.name, bonus));
  });

  const numericVotes = Object.values(votes).map((vote) => vote.position).filter((position) => Number.isFinite(position));
  const averageVote = numericVotes.length
    ? Math.round(numericVotes.reduce((sum, position) => sum + position, 0) / numericVotes.length)
    : safeTarget;
  const avgDiff = Math.abs(averageVote - safeTarget);
  const txScore = transmitterScore(eligibleVoters, votes, safeTarget);
  const txPoints = txScore.points;

  if (room.psychicId) {
    roundScores[room.psychicId] = txPoints;
    const tx = players.find((player) => player.id === room.psychicId);
    if (txScore.cleanSweep && eligibleVoters.length >= 2) {
      highlights.push(buildHighlight('clean_tx', room.psychicId, tx?.name || '?', txPoints));
    }
  }

  const scoreUpdates = {};
  const existingScores = room.playerScores || {};
  players.forEach((player) => {
    scoreUpdates[player.id] = (existingScores[player.id] || 0) + (roundScores[player.id] || 0);
  });

  const txName = players.find((player) => player.id === room.psychicId)?.name ?? null;
  const revealUnlockAt = now + 5000;
  const visibleHighlights = highlights.slice(0, 5);
  const revealResult = {
    target: safeTarget,
    votes,
    averageVote,
    avgDiff,
    roundScores,
    highlights: visibleHighlights,
    transmitterScore: txPoints,
    transmitterScoreBreakdown: txScore,
    revealUnlockAt,
  };
  const historyEntry = {
    round: room.round ?? 0,
    transmitterId: room.psychicId ?? null,
    transmitterName: txName,
    theme: room.currentTheme ?? null,
    card: room.currentCard ?? null,
    clue: room.clue ?? null,
    target: safeTarget,
    averageVote,
    avgDiff,
    votes,
    roundScores,
    highlights: visibleHighlights,
    transmitterScore: txPoints,
  };

  return {
    eligibleVoters,
    votes,
    target: safeTarget,
    averageVote,
    avgDiff,
    roundScores,
    scoreUpdates,
    revealResult,
    historyEntry,
  };
}
