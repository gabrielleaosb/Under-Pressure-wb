import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../gauge-lab.css';

const SIZE = 300;
const R = SIZE / 2;
const TR = R * 0.76;
const A0 = Math.PI;
const A1 = 2 * Math.PI;

const VARIANTS = [
  {
    id: 'binnacle',
    name: 'Binnacle',
    tone: 'Bússola naval',
    note: 'Moldura de latão almirante com rebites, arco engravedro por zonas e ponteiro cônico. Vitoriano de bordo.',
    left: '← FRIO',
    right: 'QUENTE →',
  },
  {
    id: 'sonar',
    name: 'Sonar Scope',
    tone: 'CRT submarino',
    note: 'Visor de sonar: fósforo verde, scanlines, reticula de alcance e ponteiro de feixe de contato.',
    left: '← EVITAR',
    right: 'ALVO →',
  },
  {
    id: 'bulkhead',
    name: 'Bulkhead Gauge',
    tone: 'Manômetro naval',
    note: 'Manômetro de antepara: moldura aço pesado, zonas de segurança industrial e ponteiro de emergência.',
    left: '← VÁCUO',
    right: 'PRESSÃO →',
  },
  {
    id: 'barometer',
    name: 'Ship Barometer',
    tone: 'Barômetro vitoriano',
    note: 'Barômetro aneróide: anel ornamental, zonas de previsão e pátina de latão envelhecido.',
    left: '← TEMPESTADE',
    right: 'BELO TEMPO →',
  },
  {
    id: 'combat',
    name: 'Combat MFD',
    tone: 'Display tático',
    note: 'Multi-function display de combate: brackets táticos de HUD, targeting e escala de engajamento.',
    left: '← RETIRADA',
    right: 'ATAQUE →',
  },
];

// ── Math ──────────────────────────────────
function pt(angle, r) {
  return { x: R + Math.cos(angle) * r, y: R + Math.sin(angle) * r };
}
function v2a(v) {
  return A0 + Math.max(0, Math.min(100, v)) / 100 * Math.PI;
}
function arc(a0, a1, r) {
  const p1 = pt(a0, r), p2 = pt(a1, r);
  const lg = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${lg} 1 ${p2.x} ${p2.y}`;
}

// ── BINNACLE ──────────────────────────────
function BinnacleGuts({ value }) {
  const na = v2a(value);
  const tip = pt(na, TR - 5);
  const bA = pt(na + Math.PI / 2, 8);
  const bB = pt(na - Math.PI / 2, 8);
  const back = pt(na + Math.PI, TR * 0.22);

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a = v2a(i);
    const major = i % 25 === 0;
    const med = i % 10 === 0 && !major;
    const p1 = pt(a, TR + 18), p2 = pt(a, TR + 18 + (major ? 14 : med ? 9 : 5));
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? '#e8c048' : med ? '#c09830' : '#8a6818'}
        strokeWidth={major ? 2.5 : med ? 1.5 : 1} />
    );
  }

  return (
    <>
      <defs>
        <linearGradient id="brass-rim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6a4810" />
          <stop offset="28%" stopColor="#e0b840" />
          <stop offset="58%" stopColor="#c89020" />
          <stop offset="100%" stopColor="#6a4810" />
        </linearGradient>
        <filter id="brass-needle-glow">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer brass bezel ring */}
      <path d={arc(A0, A1, TR + 38)} fill="none" stroke="url(#brass-rim)" strokeWidth={18} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 47)} fill="none" stroke="#4a3008" strokeWidth={1.5} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 29)} fill="none" stroke="#3a2004" strokeWidth={1} strokeLinecap="butt" />

      {/* Rivet bolts at arc ends + midpoint */}
      {[0, 50, 100].map(v => {
        const p = pt(v2a(v), TR + 38);
        return <g key={v}>
          <circle cx={p.x} cy={p.y} r={6} fill="#2a1604" stroke="#e8c048" strokeWidth={1.5} />
          <circle cx={p.x} cy={p.y} r={2.5} fill="#6a4810" />
        </g>;
      })}

      {/* Track background */}
      <path d={arc(A0, A1, TR)} fill="none" stroke="#1a0e04" strokeWidth={22} strokeLinecap="butt" />

      {/* Bronze zones: cold / ideal / hot */}
      <path d={arc(v2a(0), v2a(40), TR)} fill="none" stroke="#2e2000" strokeWidth={18} strokeLinecap="butt" />
      <path d={arc(v2a(40), v2a(60), TR)} fill="none" stroke="#5a4200" strokeWidth={18} strokeLinecap="butt" />
      <path d={arc(v2a(60), v2a(100), TR)} fill="none" stroke="#6a2c00" strokeWidth={18} strokeLinecap="butt" />

      {/* Inner bezel edge */}
      <path d={arc(A0, A1, TR - 12)} fill="none" stroke="#6a4808" strokeWidth={1} strokeLinecap="butt" />

      {ticks}

      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map(v => {
        const p = pt(v2a(v), TR + 46);
        return <text key={v} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 18, fill: '#c8a030' }}>{v}</text>;
      })}

      {/* Zone labels inside arc */}
      {[
        { v: 20, label: 'FRIO', color: '#7a5818' },
        { v: 50, label: 'IDEAL', color: '#a08020' },
        { v: 80, label: 'QUENTE', color: '#8a4000' },
      ].map(({ v, label, color }) => {
        const p = pt(v2a(v), TR - 32);
        return <text key={label} x={p.x} y={p.y + 3} textAnchor="middle"
          style={{ fontFamily: 'var(--f-body)', fontSize: 8.5, fill: color, fontWeight: 700, letterSpacing: '.06em' }}>{label}</text>;
      })}

      {/* Needle */}
      <g filter="url(#brass-needle-glow)">
        <polygon
          points={`${tip.x},${tip.y} ${bA.x},${bA.y} ${back.x},${back.y} ${bB.x},${bB.y}`}
          fill="#e8c048" stroke="#5a3c00" strokeWidth={1} />
      </g>

      {/* Hub — compass rose */}
      <circle cx={R} cy={R} r={11} fill="#1a0e04" stroke="#e8c048" strokeWidth={2.5} />
      <circle cx={R} cy={R} r={5} fill="#c8a030" stroke="#4a2c04" strokeWidth={1} />
      <line x1={R - 8} y1={R} x2={R + 8} y2={R} stroke="#e8c048" strokeWidth={1} />
      <line x1={R} y1={R - 8} x2={R} y2={R + 8} stroke="#e8c048" strokeWidth={1} />

      {/* Value readout box */}
      <rect x={R - 28} y={R - 70} width={56} height={28} rx={2}
        fill="#1a0e04" stroke="#8a6010" strokeWidth={1.5} />
      <path d={`M ${R - 25} ${R - 70} H ${R + 25}`} stroke="#e8c040" strokeWidth={0.5} />
      <text x={R} y={R - 78} textAnchor="middle"
        style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: '#8a6010', fontWeight: 700, letterSpacing: '.12em' }}>PRESSÃO</text>
      <text x={R} y={R - 47} textAnchor="middle"
        style={{ fontFamily: 'var(--f-vt)', fontSize: 24, fill: '#e8c048' }}>{Math.round(value)}</text>
    </>
  );
}

// ── SONAR ─────────────────────────────────
function SonarGuts({ value }) {
  const na = v2a(value);
  const tip = pt(na, TR);

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a = v2a(i);
    const major = i % 25 === 0;
    const p1 = pt(a, TR + 14), p2 = pt(a, TR + 14 + (major ? 13 : 6));
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? '#00ff88' : '#008844'}
        strokeWidth={major ? 2 : 1} />
    );
  }

  return (
    <>
      <defs>
        <filter id="sonar-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sonar-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer bezel ring */}
      <path d={arc(A0, A1, TR + 36)} fill="none" stroke="#002510" strokeWidth={24} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 48)} fill="none" stroke="#003820" strokeWidth={2} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 24)} fill="none" stroke="#004422" strokeWidth={1} strokeLinecap="butt" />

      {/* Track background */}
      <path d={arc(A0, A1, TR)} fill="none" stroke="#001a0a" strokeWidth={20} strokeLinecap="butt" />

      {/* Full active arc glow */}
      <g filter="url(#sonar-soft)">
        <path d={arc(A0, A1, TR)} fill="none" stroke="#00cc66" strokeWidth={3} strokeLinecap="butt" />
      </g>

      {/* Reticle rings at 25%, 50%, 75% */}
      {[25, 50, 75].map(v => (
        <path key={v} d={arc(A0, A1, TR * v / 100)}
          fill="none" stroke="#003a1a" strokeWidth={1} strokeDasharray="5 6" />
      ))}

      {/* Range zone dividers */}
      {[33, 66].map(v => {
        const a = v2a(v);
        const p1 = pt(a, TR * 0.3), p2 = pt(a, TR + 14);
        return <g key={v} filter="url(#sonar-soft)">
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#005530" strokeWidth={1.5} strokeDasharray="3 4" />
        </g>;
      })}

      {ticks}

      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map(v => {
        const p = pt(v2a(v), TR + 44);
        return <text key={v} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 17, fill: '#00cc66' }}>{v}</text>;
      })}

      {/* Needle — thin beam */}
      <g filter="url(#sonar-glow)">
        <line x1={R} y1={R} x2={tip.x} y2={tip.y} stroke="#00ff88" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={tip.x} cy={tip.y} r={4.5} fill="#00ff88" />
      </g>

      {/* Hub target reticle */}
      <circle cx={R} cy={R} r={14} fill="none" stroke="#004422" strokeWidth={2} />
      <circle cx={R} cy={R} r={5} fill="#00aa55" stroke="#001a0a" strokeWidth={1} />
      <line x1={R - 12} y1={R} x2={R + 12} y2={R} stroke="#005530" strokeWidth={1.5} />
      <line x1={R} y1={R - 12} x2={R} y2={R + 12} stroke="#005530" strokeWidth={1.5} />

      {/* Value readout — phosphor display */}
      <text x={R} y={R - 72} textAnchor="middle"
        style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: '#008844', fontWeight: 700, letterSpacing: '.14em' }}>CONTATO</text>
      <g filter="url(#sonar-glow)">
        <text x={R} y={R - 44} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 34, fill: '#00ff88' }}>
          {String(Math.round(value)).padStart(3, '0')}
        </text>
      </g>
    </>
  );
}

// ── BULKHEAD ──────────────────────────────
function BulkheadGuts({ value }) {
  const na = v2a(value);
  const tip = pt(na, TR - 4);
  const bA = pt(na + Math.PI / 2, 11);
  const bB = pt(na - Math.PI / 2, 11);

  const ticks = [];
  for (let i = 0; i <= 100; i += 10) {
    const a = v2a(i);
    const major = i % 50 === 0;
    const p1 = pt(a, TR + 16), p2 = pt(a, TR + 16 + (major ? 17 : 10));
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="#c8c8c8" strokeWidth={major ? 3.5 : 2} />
    );
  }

  return (
    <>
      {/* Heavy steel bezel */}
      <path d={arc(A0, A1, TR + 42)} fill="none" stroke="#2a2a2a" strokeWidth={24} strokeLinecap="butt" />
      {/* Bevel highlights */}
      <path d={arc(A0, A1, TR + 54)} fill="none" stroke="#555" strokeWidth={2} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 30)} fill="none" stroke="#111" strokeWidth={2} strokeLinecap="butt" />
      {/* Bezel inner shadow */}
      <path d={arc(A0, A1, TR + 53)} fill="none" stroke="#111" strokeWidth={1} strokeLinecap="butt" />

      {/* Track background */}
      <path d={arc(A0, A1, TR)} fill="none" stroke="#1a1a1a" strokeWidth={24} strokeLinecap="butt" />

      {/* Safety zones: DANGER / CAUTION / SAFE */}
      <path d={arc(v2a(0), v2a(30), TR)} fill="none" stroke="#cc2200" strokeWidth={20} strokeLinecap="butt" />
      <path d={arc(v2a(30), v2a(65), TR)} fill="none" stroke="#cc8800" strokeWidth={20} strokeLinecap="butt" />
      <path d={arc(v2a(65), v2a(100), TR)} fill="none" stroke="#226622" strokeWidth={20} strokeLinecap="butt" />

      {/* Track separator line */}
      <path d={arc(A0, A1, TR + 11)} fill="none" stroke="#111" strokeWidth={2} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR - 11)} fill="none" stroke="#111" strokeWidth={2} strokeLinecap="butt" />

      {/* Zone labels */}
      {[
        { v: 15, label: 'PERIGO', color: '#ff5533' },
        { v: 47, label: 'CUIDADO', color: '#ffaa00' },
        { v: 82, label: 'SEGURO', color: '#44bb44' },
      ].map(({ v, label, color }) => {
        const p = pt(v2a(v), TR - 34);
        return <text key={label} x={p.x} y={p.y + 3} textAnchor="middle"
          style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: color, fontWeight: 900, letterSpacing: '.06em' }}>{label}</text>;
      })}

      {/* Hex bolts at bezel */}
      {[0, 50, 100].map(v => {
        const p = pt(v2a(v), TR + 42);
        return <g key={v}>
          <circle cx={p.x} cy={p.y} r={8} fill="#222" stroke="#666" strokeWidth={2} />
          <circle cx={p.x} cy={p.y} r={4} fill="#111" stroke="#444" strokeWidth={1} />
          <circle cx={p.x} cy={p.y} r={1.5} fill="#333" />
        </g>;
      })}
      {/* Extra bolts */}
      {[25, 75].map(v => {
        const p = pt(v2a(v), TR + 42);
        return <g key={v}>
          <circle cx={p.x} cy={p.y} r={6} fill="#222" stroke="#555" strokeWidth={1.5} />
          <circle cx={p.x} cy={p.y} r={2.5} fill="#111" stroke="#444" strokeWidth={1} />
        </g>;
      })}

      {ticks}

      {/* Tick labels */}
      {[0, 50, 100].map(v => {
        const p = pt(v2a(v), TR + 50);
        return <text key={v} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--f-body)', fontSize: 13, fill: '#ccc', fontWeight: 900 }}>{v}</text>;
      })}

      {/* Heavy red needle */}
      <g style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.9))' }}>
        <polygon
          points={`${tip.x},${tip.y} ${bA.x},${bA.y} ${bB.x},${bB.y}`}
          fill="#ee3300" stroke="#1a0000" strokeWidth={1.5} />
        <polygon
          points={`${tip.x},${tip.y} ${bA.x},${bA.y} ${bB.x},${bB.y}`}
          fill="none" stroke="#ff6644" strokeWidth={0.8} />
      </g>

      {/* Heavy steel hub nut */}
      <circle cx={R} cy={R} r={16} fill="#1e1e1e" stroke="#555" strokeWidth={3} />
      <circle cx={R} cy={R} r={9} fill="#2a2a2a" stroke="#777" strokeWidth={1.5} />
      <circle cx={R} cy={R} r={3.5} fill="#444" />

      {/* LCD readout */}
      <rect x={R - 32} y={R - 74} width={64} height={34} rx={2}
        fill="#0a0a0a" stroke="#444" strokeWidth={2.5} />
      <rect x={R - 30} y={R - 72} width={60} height={30} rx={1}
        fill="#080808" stroke="#222" strokeWidth={1} />
      <text x={R} y={R - 80} textAnchor="middle"
        style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: '#888', fontWeight: 900, letterSpacing: '.1em' }}>kPa</text>
      <text x={R} y={R - 47} textAnchor="middle"
        style={{ fontFamily: 'var(--f-vt)', fontSize: 28, fill: '#ff6600' }}>
        {String(Math.round(value)).padStart(3, '0')}
      </text>
    </>
  );
}

// ── BAROMETER ─────────────────────────────
function BarometerGuts({ value }) {
  const na = v2a(value);
  const tip = pt(na, TR - 4);
  const bA = pt(na + Math.PI / 2, 5.5);
  const bB = pt(na - Math.PI / 2, 5.5);
  const back = pt(na + Math.PI, TR * 0.28);

  const ticks = [];
  for (let i = 0; i <= 100; i += 2) {
    const a = v2a(i);
    const major = i % 10 === 0;
    const med = i % 5 === 0 && !major;
    const p1 = pt(a, TR + 17), p2 = pt(a, TR + 17 + (major ? 13 : med ? 8 : 5));
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? '#d4a020' : '#8a6418'}
        strokeWidth={major ? 2 : 1} />
    );
  }

  const zones = [
    { from: 0, to: 33, label: 'TEMPEST.', color: '#504080' },
    { from: 33, to: 66, label: 'VARIÁVEL', color: '#3a5870' },
    { from: 66, to: 100, label: 'BELO TEMPO', color: '#6a5020' },
  ];

  return (
    <>
      <defs>
        <linearGradient id="baro-rim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6a4808" />
          <stop offset="25%" stopColor="#e8c040" />
          <stop offset="50%" stopColor="#f4d048" />
          <stop offset="75%" stopColor="#c89028" />
          <stop offset="100%" stopColor="#6a4808" />
        </linearGradient>
        <linearGradient id="baro-hub" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c040" />
          <stop offset="100%" stopColor="#8a5c10" />
        </linearGradient>
      </defs>

      {/* Outer ornamental rim */}
      <path d={arc(A0, A1, TR + 40)} fill="none" stroke="url(#baro-rim)" strokeWidth={22} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 51)} fill="none" stroke="#4a3008" strokeWidth={2} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR + 29)} fill="none" stroke="#3a2004" strokeWidth={1} strokeLinecap="butt" />

      {/* Ornamental dots on outer rim */}
      {Array.from({ length: 21 }, (_, i) => {
        const p = pt(v2a(i * 5), TR + 40);
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#2a1604" stroke="#d4a828" strokeWidth={0.5} />;
      })}

      {/* Track background */}
      <path d={arc(A0, A1, TR)} fill="none" stroke="#1e1206" strokeWidth={22} strokeLinecap="butt" />

      {/* Weather zones — subdued patina colors */}
      {zones.map((z, i) => (
        <path key={i} d={arc(v2a(z.from), v2a(z.to), TR)}
          fill="none" stroke={z.color} strokeWidth={18} strokeLinecap="butt" />
      ))}

      {/* Inner face ring */}
      <path d={arc(A0, A1, TR - 12)} fill="none" stroke="#4a3008" strokeWidth={1.5} strokeLinecap="butt" />

      {/* Zone labels */}
      {zones.map(z => {
        const p = pt(v2a((z.from + z.to) / 2), TR - 30);
        return <text key={z.label} x={p.x} y={p.y + 3} textAnchor="middle"
          style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: '#b09030', fontWeight: 700, letterSpacing: '.04em' }}>{z.label}</text>;
      })}

      {ticks}

      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map(v => {
        const p = pt(v2a(v), TR + 46);
        return <text key={v} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 17, fill: '#c8a030' }}>{v}</text>;
      })}

      {/* Elegant tapered needle */}
      <g style={{ filter: 'drop-shadow(0 0 3px rgba(200,160,40,0.55))' }}>
        <polygon
          points={`${tip.x},${tip.y} ${bA.x},${bA.y} ${back.x},${back.y} ${bB.x},${bB.y}`}
          fill="#d4a020" stroke="#4a2c04" strokeWidth={0.8} />
      </g>

      {/* Ornate hub */}
      <circle cx={R} cy={R} r={13} fill="#1a0e06" stroke="url(#baro-hub)" strokeWidth={3} />
      <circle cx={R} cy={R} r={7} fill="#c8a030" stroke="#4a2c04" strokeWidth={1} />
      <circle cx={R} cy={R} r={3.5} fill="#1a0e06" />

      {/* Value readout — brass engraved box */}
      <rect x={R - 29} y={R - 71} width={58} height={30} rx={3}
        fill="#1a0e06" stroke="#8a6010" strokeWidth={1.5} />
      <text x={R} y={R - 78} textAnchor="middle"
        style={{ fontFamily: 'var(--f-body)', fontSize: 7.5, fill: '#8a6010', fontWeight: 700, letterSpacing: '.14em' }}>PRESSÃO ATM.</text>
      <text x={R} y={R - 47} textAnchor="middle"
        style={{ fontFamily: 'var(--f-vt)', fontSize: 24, fill: '#e8c040' }}>{Math.round(value)}</text>
    </>
  );
}

// ── COMBAT MFD ───────────────────────────
function CombatGuts({ value }) {
  const na = v2a(value);
  const tip = pt(na, TR - 2);
  const bA = pt(na + Math.PI / 2, 6.5);
  const bB = pt(na - Math.PI / 2, 6.5);

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a = v2a(i);
    const major = i % 25 === 0;
    const p1 = pt(a, TR + 14), p2 = pt(a, TR + 14 + (major ? 15 : 7));
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? '#4488ff' : '#1a3866'}
        strokeWidth={major ? 2 : 1} />
    );
  }

  // Arc end points for bracket placement
  const leftEnd = pt(A0, TR);   // (R - TR, R)
  const rightEnd = pt(A1, TR);  // (R + TR, R)

  return (
    <>
      <defs>
        <filter id="combat-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="combat-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer arc border glow */}
      <g filter="url(#combat-soft)">
        <path d={arc(A0, A1, TR + 30)} fill="none" stroke="#0a2060" strokeWidth={2} strokeLinecap="butt" />
      </g>

      {/* Track background */}
      <path d={arc(A0, A1, TR + 28)} fill="none" stroke="#05102a" strokeWidth={14} strokeLinecap="butt" />
      <path d={arc(A0, A1, TR)} fill="none" stroke="#06102c" strokeWidth={22} strokeLinecap="butt" />

      {/* Zone fills — cold blue shades */}
      <path d={arc(v2a(0), v2a(33), TR)} fill="none" stroke="#0c2255" strokeWidth={18} strokeLinecap="butt" />
      <path d={arc(v2a(33), v2a(66), TR)} fill="none" stroke="#0e2a66" strokeWidth={18} strokeLinecap="butt" />
      <path d={arc(v2a(66), v2a(100), TR)} fill="none" stroke="#0a1e55" strokeWidth={18} strokeLinecap="butt" />

      {/* Active arc rim */}
      <g filter="url(#combat-glow)">
        <path d={arc(A0, A1, TR)} fill="none" stroke="#2255cc" strokeWidth={1.8} strokeLinecap="butt" />
      </g>

      {/* Range zone separators */}
      {[33, 66].map(v => {
        const a = v2a(v);
        const p1 = pt(a, TR - 11), p2 = pt(a, TR + 14);
        return <g key={v} filter="url(#combat-soft)">
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3366dd" strokeWidth={1.5} />
        </g>;
      })}

      {/* Mid-range ring */}
      <path d={arc(A0, A1, TR * 0.55)} fill="none" stroke="#0a1e3a" strokeWidth={1} strokeDasharray="3 7" />

      {/* HUD brackets at arc ends */}
      <g filter="url(#combat-soft)" stroke="#3366dd" strokeWidth={2} fill="none" strokeLinecap="square">
        {/* Left bracket */}
        <path d={`M ${leftEnd.x - 18} ${leftEnd.y} L ${leftEnd.x} ${leftEnd.y} L ${leftEnd.x} ${leftEnd.y - 20}`} />
        <path d={`M ${leftEnd.x - 18} ${leftEnd.y} H ${leftEnd.x - 10}`} stroke="#4488ff" strokeWidth={1.5} />
        {/* Right bracket */}
        <path d={`M ${rightEnd.x + 18} ${rightEnd.y} L ${rightEnd.x} ${rightEnd.y} L ${rightEnd.x} ${rightEnd.y - 20}`} />
        <path d={`M ${rightEnd.x + 18} ${rightEnd.y} H ${rightEnd.x + 10}`} stroke="#4488ff" strokeWidth={1.5} />
      </g>

      {ticks}

      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map(v => {
        const p = pt(v2a(v), TR + 44);
        return <text key={v} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 17, fill: '#3377ee' }}>{v}</text>;
      })}

      {/* Zone labels */}
      {[
        { v: 16, label: 'RECUAR', color: '#1e4488' },
        { v: 50, label: 'MANTER', color: '#2255aa' },
        { v: 83, label: 'ATACAR', color: '#1e3a88' },
      ].map(({ v, label, color }) => {
        const p = pt(v2a(v), TR - 32);
        return <text key={label} x={p.x} y={p.y + 3} textAnchor="middle"
          style={{ fontFamily: 'var(--f-body)', fontSize: 8, fill: color, fontWeight: 700, letterSpacing: '.08em' }}>{label}</text>;
      })}

      {/* Precision needle */}
      <g filter="url(#combat-glow)">
        <polygon
          points={`${tip.x},${tip.y} ${bA.x},${bA.y} ${bB.x},${bB.y}`}
          fill="#4488ff" stroke="#00081a" strokeWidth={1} />
      </g>

      {/* Targeting hub reticle */}
      <circle cx={R} cy={R} r={15} fill="none" stroke="#0e2a55" strokeWidth={2} />
      <circle cx={R} cy={R} r={7} fill="#020a20" stroke="#3366dd" strokeWidth={1.5} />
      <circle cx={R} cy={R} r={2.5} fill="#2255cc" />
      <line x1={R - 13} y1={R} x2={R + 13} y2={R} stroke="#0e2a55" strokeWidth={1.5} />
      <line x1={R} y1={R - 13} x2={R} y2={R + 13} stroke="#0e2a55" strokeWidth={1.5} />

      {/* Bracketed digital readout */}
      <g stroke="#1a3a88" strokeWidth={1.5} fill="none">
        <path d={`M ${R - 34} ${R - 78} H ${R - 26} M ${R - 34} ${R - 42} H ${R - 26}`} />
        <path d={`M ${R - 34} ${R - 78} V ${R - 42}`} />
        <path d={`M ${R + 34} ${R - 78} H ${R + 26} M ${R + 34} ${R - 42} H ${R + 26}`} />
        <path d={`M ${R + 34} ${R - 78} V ${R - 42}`} />
      </g>
      <text x={R} y={R - 82} textAnchor="middle"
        style={{ fontFamily: 'var(--f-body)', fontSize: 7.5, fill: '#1e3a88', fontWeight: 700, letterSpacing: '.12em' }}>PRESSURE</text>
      <g filter="url(#combat-glow)">
        <text x={R} y={R - 48} textAnchor="middle"
          style={{ fontFamily: 'var(--f-vt)', fontSize: 32, fill: '#4488ff' }}>
          {String(Math.round(value)).padStart(3, '0')}
        </text>
      </g>
    </>
  );
}

// ── Preview card ──────────────────────────
const GUTS = { binnacle: BinnacleGuts, sonar: SonarGuts, bulkhead: BulkheadGuts, barometer: BarometerGuts, combat: CombatGuts };
const SVG_H = R + 62;

function GaugePreview({ variant, selected, onSelect }) {
  const [value, setValue] = useState(50);
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const updateFromEvent = useCallback((clientX, clientY) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const px = (clientX - rect.left) * scale;
    const py = (clientY - rect.top) * scale + 20; // +20 for viewBox offset
    const dx = px - R, dy = py - R;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    if (angle < Math.PI) angle = angle < Math.PI / 2 ? 2 * Math.PI : Math.PI;
    setValue(Math.max(0, Math.min(100, Math.round(((angle - Math.PI) / Math.PI) * 100))));
  }, []);

  const onDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    const t = e.touches ? e.touches[0] : e;
    updateFromEvent(t.clientX, t.clientY);
  }, [updateFromEvent]);

  const onMove = useCallback((e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    updateFromEvent(t.clientX, t.clientY);
  }, [updateFromEvent]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  const Guts = GUTS[variant.id];

  return (
    <article className={`gl-card gl-card--${variant.id}${selected ? ' is-selected' : ''}`}>
      <div className="gl-card__header">
        <div>
          <div className="gl-card__tone">{variant.tone}</div>
          <h2>{variant.name}</h2>
        </div>
        <button className="gl-pick" onClick={onSelect}>
          {selected ? 'Escolhido' : 'Marcar'}
        </button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 -20 ${SIZE} ${SVG_H}`}
        className="gl-gauge-svg"
        onMouseDown={onDown}
        onTouchStart={onDown}
        style={{ cursor: 'grab', userSelect: 'none', touchAction: 'none', display: 'block' }}
      >
        <Guts value={value} />
      </svg>

      <div className="gl-labels">
        <span className="gl-label-left">{variant.left}</span>
        <span className="gl-label-right">{variant.right}</span>
      </div>

      <p>{variant.note}</p>
    </article>
  );
}

export default function GaugeLab() {
  const [selected, setSelected] = useState(VARIANTS[0].id);
  const sel = VARIANTS.find(v => v.id === selected) || VARIANTS[0];

  return (
    <main className="gl">
      <section className="gl-hero">
        <div>
          <div className="home-eyebrow">MOCKUP DE PAINEL — MANÔMETROS</div>
          <h1 className="t-title glow-text-cyan">
            Painéis navais
            <span>arraste para calibrar</span>
          </h1>
          <p>
            Cinco estilos inspirados em instrumentação naval: bússola de latão, sonar CRT, manômetro de antepara, barômetro vitoriano e display de combate tático. Todos interativos — arraste no arco.
          </p>
        </div>
        <div className="gl-hero__callout panel bevel glow-amber">
          <span className="t-title text-dim">Selecionado</span>
          <strong>{sel.name}</strong>
          <small>{sel.note}</small>
        </div>
      </section>

      <section className="gl-grid">
        {VARIANTS.map(v => (
          <GaugePreview
            key={v.id}
            variant={v}
            selected={selected === v.id}
            onSelect={() => setSelected(v.id)}
          />
        ))}
      </section>
    </main>
  );
}
