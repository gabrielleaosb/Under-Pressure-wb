import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreFromDiff, boostBonus, normalizeVote, transmitterScore } from './gameRules.mjs';

test('scoreFromDiff maps miss distance to base score', () => {
  assert.equal(scoreFromDiff(0), 5);
  assert.equal(scoreFromDiff(5), 5);
  assert.equal(scoreFromDiff(15), 4);
  assert.equal(scoreFromDiff(25), 3);
  assert.equal(scoreFromDiff(40), 2);
  assert.equal(scoreFromDiff(60), 1);
  assert.equal(scoreFromDiff(61), -1);
});

test('boostBonus rewards close guesses and punishes risky misses', () => {
  assert.equal(boostBonus(15), 3);
  assert.equal(boostBonus(25), 1);
  assert.equal(boostBonus(26), -2);
});

test('normalizeVote accepts legacy and current vote payloads', () => {
  assert.deepEqual(normalizeVote(101.8), { position: 100, boost: false });
  assert.deepEqual(normalizeVote({ position: -4, overdrive: true }), { position: 0, boost: true });
  assert.deepEqual(normalizeVote({ position: 37.6, boost: true }), { position: 38, boost: true });
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
