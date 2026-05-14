export function scoreFromDiff(diff) {
  if (diff <= 5) return 5;
  if (diff <= 15) return 4;
  if (diff <= 25) return 3;
  if (diff <= 40) return 2;
  if (diff <= 60) return 1;
  return -1;
}

export function boostBonus(diff) {
  if (diff <= 15) return 3;
  if (diff <= 25) return 1;
  return -2;
}

export function normalizeVote(raw) {
  if (typeof raw === 'number') {
    return { position: Math.max(0, Math.min(100, Math.round(raw))), boost: false };
  }
  const position = Math.max(0, Math.min(100, Math.round(Number(raw?.position) || 50)));
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
