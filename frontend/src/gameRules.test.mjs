import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ROOM_TTL_MS,
  scoreFromDiff,
  boostBonus,
  clampPosition,
  normalizeVote,
  transmitterScore,
  findRejoinPlayer,
  isRoomExpired,
  resolveRound,
  roomExpiresAt,
} from './gameRules.mjs';

test('scoreFromDiff maps miss distance to base score', () => {
  assert.equal(scoreFromDiff(0), 8);
  assert.equal(scoreFromDiff(1), 5);
  assert.equal(scoreFromDiff(5), 5);
  assert.equal(scoreFromDiff(15), 4);
  assert.equal(scoreFromDiff(25), 3);
  assert.equal(scoreFromDiff(40), 1);
  assert.equal(scoreFromDiff(41), 0);
  assert.equal(scoreFromDiff(50), 0);
  assert.equal(scoreFromDiff(51), -1);
  assert.equal(scoreFromDiff(60), -1);
  assert.equal(scoreFromDiff(61), -2);
  assert.equal(scoreFromDiff(100), -2);
});

test('boostBonus rewards close guesses and punishes risky misses', () => {
  assert.equal(boostBonus(15), 4);
  assert.equal(boostBonus(25), 1);
  assert.equal(boostBonus(26), -4);
  assert.equal(boostBonus(99), -4);
});

test('normalizeVote accepts legacy and current vote payloads', () => {
  assert.deepEqual(normalizeVote(101.8), { position: 100, boost: false });
  assert.deepEqual(normalizeVote({ position: -4, overdrive: true }), { position: 0, boost: true });
  assert.deepEqual(normalizeVote({ position: 0, boost: true }), { position: 0, boost: true });
  assert.deepEqual(normalizeVote({ position: 37.6, boost: true }), { position: 38, boost: true });
});

test('clampPosition preserves zero and falls back only for invalid values', () => {
  assert.equal(clampPosition(0), 0);
  assert.equal(clampPosition('0'), 0);
  assert.equal(clampPosition(undefined), 50);
  assert.equal(clampPosition('abc', 42), 42);
  assert.equal(clampPosition(3, 50, 5, 95), 5);
});

test('transmitterScore counts hits, strong hits and clean sweep bonus', () => {
  const voters = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const votes = {
    a: { position: 50 },
    b: { position: 65 },
    c: { position: 75 },
  };

  assert.deepEqual(transmitterScore(voters, votes, 60), {
    points: 11,
    hits: 3,
    strongHits: 3,
    submitted: 3,
    expected: 3,
    cleanSweep: true,
    cleanSweepBonus: 2,
  });
});

test('resolveRound scores voters, transmitter, streaks and round history payload', () => {
  const room = {
    round: 2,
    psychicId: 'tx',
    clue: 'banana',
    currentCard: { id: 100, lP: 'Ruim', rP: 'Bom' },
    players: {
      tx: { id: 'tx', name: 'Navegador', connected: true },
      a: { id: 'a', name: 'Ana', connected: true },
      b: { id: 'b', name: 'Bia', connected: true },
      c: { id: 'c', name: 'Caio', connected: false },
    },
    playerScores: { tx: 3, a: 1, b: 2, c: 9 },
    playerStreaks: { tx: 2, a: 2, b: 0, c: 1 },
  };

  const resolved = resolveRound({
    room,
    rawVotes: {
      a: { position: 50, boost: true },
      b: { position: 80, boost: true },
      c: { position: 55, boost: false },
    },
    target: 50,
    now: 1000,
  });

  assert.deepEqual(resolved.roundScores, {
    tx: 6,
    a: 13,
    b: -3,
    c: 5,
  });
  assert.deepEqual(resolved.scoreUpdates, {
    tx: 9,
    a: 14,
    b: -1,
    c: 14,
  });
  assert.equal(resolved.revealResult.averageVote, 62);
  assert.equal(resolved.revealResult.avgDiff, 12);
  assert.equal(resolved.revealResult.revealUnlockAt, 6000);
  assert.equal(resolved.historyEntry.round, 2);
  assert.equal(resolved.historyEntry.transmitterName, 'Navegador');
  assert.equal(resolved.historyEntry.votes.a.position, 50);
});

test('findRejoinPlayer matches disconnected human by normalized name only', () => {
  const players = {
    a: { id: 'a', name: 'Ana Maria', connected: true },
    b: { id: 'b', name: 'Bia   Costa', connected: false },
    c: { id: 'c', name: 'Bia Costa', connected: false, isBot: true },
  };

  assert.equal(findRejoinPlayer(players, ' bia costa ')?.id, 'b');
  assert.equal(findRejoinPlayer(players, 'Ana Maria'), null);
  assert.equal(findRejoinPlayer(players, ''), null);
});

test('room expiration uses explicit expiry and createdAt fallback', () => {
  const createdAt = 1000;
  assert.equal(roomExpiresAt(createdAt), createdAt + DEFAULT_ROOM_TTL_MS);
  assert.equal(isRoomExpired({ createdAt }, createdAt + DEFAULT_ROOM_TTL_MS - 1), false);
  assert.equal(isRoomExpired({ createdAt }, createdAt + DEFAULT_ROOM_TTL_MS), true);
  assert.equal(isRoomExpired({ createdAt, expiresAt: 5000 }, 4999), false);
  assert.equal(isRoomExpired({ createdAt, expiresAt: 5000 }, 5000), true);
});
