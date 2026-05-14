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
