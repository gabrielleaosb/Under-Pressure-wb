let ctx        = null;
let masterGain = null;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function master() {
  const c = ac(); if (!c) return null;
  if (!masterGain) {
    masterGain = c.createGain();
    masterGain.gain.value = Number(localStorage.getItem('up_vol') ?? 0.7);
    masterGain.connect(c.destination);
  }
  return masterGain;
}

export function setVolume(v) {
  const val = Math.max(0, Math.min(1, v));
  const mg = master();
  if (mg) mg.gain.value = val;
  localStorage.setItem('up_vol', val);
}

export function getVolume() {
  return masterGain?.gain.value ?? Number(localStorage.getItem('up_vol') ?? 0.7);
}

// ── Core helpers ───────────────────────────────────────────────────────────

function osc(freq, startT, dur, type = 'sine', vol = 0.22, freqEnd = null) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const mg = master(); if (!mg) return;
  o.connect(g); g.connect(mg);
  o.type = type;
  o.frequency.setValueAtTime(freq, startT);
  if (freqEnd !== null) o.frequency.exponentialRampToValueAtTime(freqEnd, startT + dur);
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(vol, startT + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
  o.start(startT); o.stop(startT + dur + 0.015);
}

function chord(freqs, startT, dur, type = 'sine', vol = 0.18) {
  freqs.forEach(f => osc(f, startT, dur, type, vol));
}

// ── UI ─────────────────────────────────────────────────────────────────────

export function playClick() {
  const c = ac(); if (!c) return;
  osc(820, c.currentTime, 0.045, 'square', 0.1);
}

export function playJoin() {
  const c = ac(); if (!c) return;
  osc(440, c.currentTime,       0.09, 'sine', 0.2);
  osc(660, c.currentTime + 0.09, 0.12,'sine', 0.18);
}

export function playError() {
  const c = ac(); if (!c) return;
  osc(220, c.currentTime,       0.12, 'sawtooth', 0.18);
  osc(185, c.currentTime + 0.13, 0.15,'sawtooth', 0.16);
}

// ── Roulette ───────────────────────────────────────────────────────────────
// Roda mecânica: clicks acelerados → desaceleração exponencial → thud final

export function playRouletteSpin() {
  const c = ac(); if (!c) return;
  const now = c.currentTime;
  const totalDur = 3.5;

  // Ticks que desaceleram exponencialmente
  let t = 0, interval = 0.032, decay = 1.065;
  while (t < totalDur) {
    // Cada tick = sine burst curto + harmônico
    osc(380 + Math.random() * 80, now + t, 0.025, 'sine', 0.10);
    osc(760 + Math.random() * 60, now + t, 0.015, 'sine', 0.04);
    interval *= decay;
    t += interval;
    if (interval > 0.52) break;
  }

  // Thud de parada
  osc(100, now + totalDur,       0.35, 'sine',     0.32);
  osc(55,  now + totalDur + 0.05, 0.5, 'sine',     0.22);
  osc(180, now + totalDur,       0.08, 'square',   0.12);
}

export function playThemeReveal() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Acorde ascendente + brilho
  [523, 659, 784, 1047].forEach((f, i) => osc(f, t + i * 0.085, 0.28, 'sine', 0.20));
  osc(2093, t + 0.32, 0.14, 'sine', 0.09);
  osc(1568, t + 0.40, 0.14, 'sine', 0.09);
}

// ── Fases ──────────────────────────────────────────────────────────────────

export function playPhaseChange() {
  const c = ac(); if (!c) return;
  osc(660, c.currentTime,       0.09, 'sine', 0.17);
  osc(880, c.currentTime + 0.11, 0.13,'sine', 0.17);
}

export function playVotingStart() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  osc(440, t,       0.09,  'sine', 0.18);
  osc(550, t + 0.1, 0.09,  'sine', 0.18);
  osc(660, t + 0.2, 0.14,  'sine', 0.18);
}

// ── Votação ────────────────────────────────────────────────────────────────

export function playVoteSubmit() {
  const c = ac(); if (!c) return;
  osc(550, c.currentTime,        0.07, 'sine', 0.17);
  osc(660, c.currentTime + 0.07, 0.10, 'sine', 0.17);
}

export function playTimerTick() {
  const c = ac(); if (!c) return;
  osc(1050, c.currentTime, 0.04, 'square', 0.07);
}

export function playAlarmTick() {
  const c = ac(); if (!c) return;
  osc(900, c.currentTime,       0.06, 'square', 0.18);
  osc(450, c.currentTime + 0.1, 0.06, 'square', 0.14);
}

// ── Revelação ──────────────────────────────────────────────────────────────

export function playRevealDrum() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Bumbo grave
  osc(110, t,        0.2,  'sine',     0.4,  50);
  osc(60,  t + 0.03, 0.35, 'sine',     0.3);
  // Snare sintético
  osc(200, t + 0.18, 0.08, 'sawtooth', 0.12);
}

export function playPerfect() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  [523, 659, 784, 1047, 1319].forEach((f, i) =>
    osc(f, t + i * 0.065, 0.22, 'sine', 0.22)
  );
}

export function playGoodResult() {
  const c = ac(); if (!c) return;
  osc(440, c.currentTime,        0.12, 'sine', 0.18);
  osc(550, c.currentTime + 0.1,  0.15, 'sine', 0.18);
}

export function playDamageHit(heavy = false) {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Impacto grave
  osc(55,  t,        heavy ? 0.7 : 0.45, 'sine',     heavy ? 0.55 : 0.35, 28);
  osc(80,  t + 0.04, heavy ? 0.5 : 0.3,  'sawtooth', heavy ? 0.35 : 0.2);
  // Alarme
  osc(880, t,        0.08, 'square', 0.18);
  osc(660, t + 0.1,  0.06, 'square', 0.14);
  if (heavy) {
    osc(38,  t + 0.1, 0.7,  'sine',   0.4);
    osc(1200,t,       0.1,  'sawtooth', 0.12);
    // Alarme pulsante extra
    [0, 0.25, 0.5].forEach(d => {
      osc(880, t + 0.2 + d, 0.07, 'square', 0.15);
      osc(440, t + 0.27 + d,0.07, 'square', 0.12);
    });
  }
}

// ── Game Over ──────────────────────────────────────────────────────────────

export function playWin() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Fanfarra vitória estilo arcade
  const melody = [523, 523, 523, 415, 523, 659, 784];
  const times  = [0, 0.17, 0.34, 0.51, 0.6, 0.7, 0.85];
  melody.forEach((f, i) => osc(f, t + times[i], 0.22, 'sine', 0.24));
  // Baixo
  [130, 165, 196].forEach((f, i) => osc(f, t + 0.85 + i * 0.1, 0.28, 'sine', 0.18));
  // Brilho final
  osc(1568, t + 0.85, 0.2, 'sine', 0.1);
}

export function playLose() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  osc(440, t,       0.28, 'sawtooth', 0.2);
  osc(370, t + 0.28, 0.28,'sawtooth', 0.2);
  osc(277, t + 0.56, 0.5, 'sawtooth', 0.25);
}

export function playExplosion() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  // Boom grave
  osc(38,  t,        1.4, 'sine',     0.55, 22);
  osc(55,  t + 0.04, 1.0, 'sine',     0.42);
  osc(75,  t,        0.7, 'sawtooth', 0.3);
  // Crack agudo
  osc(2200, t,       0.08,'square',   0.22, 80);
  // Rumble estocástico
  for (let i = 0; i < 6; i++)
    osc(42 + Math.random() * 28, t + i * 0.13, 0.3, 'sine', 0.2);
}
