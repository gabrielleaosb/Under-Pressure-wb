let ctx = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function note(freq, start, dur, type = 'sine', vol = 0.25, freqEnd = null) {
  const c = ac(); if (!c) return;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// ── UI ──────────────────────────────────────────────
export function playClick() {
  const c = ac(); if (!c) return;
  note(900, c.currentTime, 0.04, 'square', 0.1);
}

export function playJoin() {
  const c = ac(); if (!c) return;
  note(440, c.currentTime, 0.08, 'sine', 0.2);
  note(660, c.currentTime + 0.08, 0.1, 'sine', 0.18);
}

export function playError() {
  const c = ac(); if (!c) return;
  note(220, c.currentTime, 0.12, 'sawtooth', 0.2);
  note(180, c.currentTime + 0.12, 0.15, 'sawtooth', 0.2);
}

// ── Roulette ────────────────────────────────────────
export function playRouletteSpin() {
  const c = ac(); if (!c) return;
  const now = c.currentTime;
  // Mechanical wheel: ticks start fast and slow exponentially to a stop
  let t = 0;
  let interval = 0.035;        // start: ~28 ticks/s
  const decay = 1.062;         // each gap grows by 6.2%
  const totalDur = 3.5;

  while (t < totalDur) {
    const pitch = 450 + Math.random() * 120;
    note(pitch, now + t, 0.028, 'square', 0.09 + (t / totalDur) * 0.06);
    interval *= decay;
    t += interval;
    if (interval > 0.55) break;
  }

  // Final "thud" when it stops
  note(180, now + totalDur, 0.25, 'sine', 0.28);
  note(90,  now + totalDur, 0.4,  'sine', 0.2);
}

export function playThemeReveal() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Ascending fanfare
  [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.09, 0.25, 'sine', 0.22));
  // Sparkle layer
  [2093, 1760].forEach((f, i) => note(f, t + 0.3 + i * 0.08, 0.12, 'sine', 0.1));
}

// ── Phase changes ────────────────────────────────────
export function playPhaseChange() {
  const c = ac(); if (!c) return;
  note(660, c.currentTime, 0.08, 'sine', 0.18);
  note(880, c.currentTime + 0.1, 0.12, 'sine', 0.18);
}

export function playVotingStart() {
  const c = ac(); if (!c) return;
  note(440, c.currentTime,       0.1, 'sine', 0.2);
  note(550, c.currentTime + 0.1, 0.1, 'sine', 0.2);
  note(660, c.currentTime + 0.2, 0.15,'sine', 0.2);
}

// ── Voting ───────────────────────────────────────────
export function playVoteSubmit() {
  const c = ac(); if (!c) return;
  note(550, c.currentTime,       0.07, 'sine', 0.18);
  note(660, c.currentTime + 0.07, 0.1, 'sine', 0.18);
}

export function playTimerTick() {
  const c = ac(); if (!c) return;
  note(1100, c.currentTime, 0.04, 'square', 0.07);
}

export function playAlarmTick() {
  const c = ac(); if (!c) return;
  note(880, c.currentTime,       0.06, 'square', 0.22);
  note(440, c.currentTime + 0.1, 0.06, 'square', 0.18);
}

// ── Reveal ───────────────────────────────────────────
export function playRevealDrum() {
  const c = ac(); if (!c) return;
  note(120, c.currentTime, 0.15, 'sine', 0.35);
  note(80,  c.currentTime + 0.05, 0.3, 'sine', 0.25);
}

export function playPerfect() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, t + i * 0.07, 0.2, 'sine', 0.22));
}

export function playGoodResult() {
  const c = ac(); if (!c) return;
  note(440, c.currentTime, 0.12, 'sine', 0.2);
  note(550, c.currentTime + 0.1, 0.15, 'sine', 0.2);
}

export function playDamageHit(heavy = false) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Impact
  note(60,  t,        0.5, 'sawtooth', heavy ? 0.5 : 0.3);
  note(120, t + 0.05, 0.3, 'sawtooth', heavy ? 0.35 : 0.2);
  // Alarm blip
  note(880, t,        0.08, 'square', 0.2);
  note(660, t + 0.12, 0.06, 'square', 0.15);
  if (heavy) {
    // Extra rumble for critical damage
    note(40, t + 0.1, 0.6, 'sine', 0.4);
    note(1200, t + 0.08, 0.1, 'sawtooth', 0.15);
  }
}

// ── Game Over ────────────────────────────────────────
export function playWin() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Victory fanfare
  const melody = [523, 523, 523, 415, 523, 659, 784];
  const times  = [0, 0.18, 0.36, 0.54, 0.64, 0.74, 0.9];
  melody.forEach((f, i) => note(f, t + times[i], 0.25, 'sine', 0.25));
  // Bass
  [130, 165, 196].forEach((f, i) => note(f, t + 0.9 + i * 0.1, 0.3, 'sine', 0.2));
}

export function playLose() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  note(440, t,       0.3, 'sawtooth', 0.22);
  note(349, t + 0.3, 0.3, 'sawtooth', 0.22);
  note(262, t + 0.6, 0.5, 'sawtooth', 0.28);
}

export function playExplosion() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Low boom
  note(40,  t,        1.2, 'sawtooth', 0.5);
  note(60,  t + 0.05, 0.8, 'sine',     0.4);
  note(80,  t,        0.6, 'sawtooth', 0.3);
  // High crack
  note(2000, t,       0.1, 'square',   0.25, 100);
  // Rumble
  for (let i = 0; i < 5; i++) {
    note(50 + Math.random() * 30, t + i * 0.15, 0.3, 'sine', 0.2);
  }
}
