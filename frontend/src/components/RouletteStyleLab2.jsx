import React, { useMemo, useState } from 'react';
import { THEMES } from '../gameData.js';
import '../roulette-lab2.css';

const N = THEMES.length;
const SEG = 360 / N;

const VARIANTS = [
  {
    id: 'singularity',
    name: 'Singularity',
    note: 'Disco de acreção em perspectiva 3D: roleta inclinada com corona quente, buraco negro central e gravidade visual.',
    tone: 'Buraco negro 3D',
    accent: '#ff8800', accent2: '#00bbff', core: '#000000',
    colors: ['#1c0028', '#320040', '#4e0058', '#700050', '#960038', '#b01808', '#100014'],
  },
  {
    id: 'annular',
    name: 'Void Ring',
    note: 'Anel anular puro: labels dentro da faixa orbital, vazio absoluto no centro. A roleta mais legível da série.',
    tone: 'Anel orbital',
    accent: '#8899ff', accent2: '#00ddff', core: '#010014',
    colors: ['#080032', '#0e004c', '#140066', '#180080', '#1c0098', '#2000b0', '#05001c'],
  },
  {
    id: 'scanner',
    name: 'Deep Scanner',
    note: 'Radar fósforo: verde sobre preto absoluto, linhas táticas radiais, scanlines CRT e hub pulsante.',
    tone: 'Radar cósmico',
    accent: '#00ff88', accent2: '#00cc55', core: '#000a03',
    colors: ['#001006', '#00180a', '#00200e', '#002a12', '#003216', '#003a1a', '#000804'],
  },
  {
    id: 'prism',
    name: 'Crystal Prism',
    note: 'Contraste extremo: alternância preto absoluto e lavanda cristalina. Bordas refratadas como arestas de gema.',
    tone: 'Prisma cristal',
    accent: '#d0c0ff', accent2: '#8866ff', core: '#040010',
    colors: ['#050015', '#ddd5ff', '#0b0028', '#ccc5ff', '#110038', '#bbb8f8', '#030010'],
  },
  {
    id: 'corona',
    name: 'Solar Corona',
    note: 'Ejeção de massa coronal: núcleo branco-quente, chamas laranjas e extremidades vermelhas no vácuo.',
    tone: 'Ejeção solar',
    accent: '#ffcc00', accent2: '#ff5500', core: '#180300',
    colors: ['#ff1500', '#ff4400', '#ff7700', '#ffaa00', '#ffcc00', '#ffee88', '#1a0200'],
  },
  {
    id: 'atlas',
    name: 'Star Atlas',
    note: 'Carta estelar de observatório: graticule de coordenadas, paleta noturna profissional e elegância científica.',
    tone: 'Carta celeste',
    accent: '#a8c4e0', accent2: '#5080a8', core: '#000a18',
    colors: ['#000d20', '#001128', '#001530', '#001938', '#001d40', '#002148', '#000618'],
  },
];

function segGradient(colors) {
  const step = 100 / N;
  return THEMES.map((_, i) => `${colors[i % colors.length]} ${i * step}% ${(i + 1) * step}%`).join(', ');
}

function arcPath(cx, cy, OR, IR, startDeg, endDeg) {
  const r = (d) => (d * Math.PI) / 180;
  const s = r(startDeg), e = r(endDeg);
  const cos = Math.cos, sin = Math.sin;
  return [
    `M ${cx + OR * cos(s)} ${cy + OR * sin(s)}`,
    `A ${OR} ${OR} 0 0 1 ${cx + OR * cos(e)} ${cy + OR * sin(e)}`,
    `L ${cx + IR * cos(e)} ${cy + IR * sin(e)}`,
    `A ${IR} ${IR} 0 0 0 ${cx + IR * cos(s)} ${cy + IR * sin(s)}`,
    'Z',
  ].join(' ');
}

function AnnularWheel({ variant, angle }) {
  const S = 320, cx = 160, cy = 160, OR = 148, IR = 66;

  return (
    <div className="rl2-wheel-wrap rl2-wheel-wrap--annular">
      <div className="rl2-pointer rl2-pointer--annular" />
      <div className="rl2-hub">
        <span>VOID</span>
      </div>
      <svg
        width={S} height={S} viewBox={`0 0 ${S} ${S}`}
        className="rl2-annular-svg"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: 'transform 3.65s cubic-bezier(.12,.86,.16,1)',
          willChange: 'transform',
        }}
      >
        <defs>
          <radialGradient id="ann-vig" cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </radialGradient>
          <radialGradient id="ann-inner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor={`color-mix(in srgb, ${variant.accent} 22%, transparent)`} />
          </radialGradient>
        </defs>

        {/* Outer atmosphere rings */}
        {[8, 14, 22].map((offset) => (
          <circle
            key={offset}
            cx={cx} cy={cy} r={OR + offset}
            fill="none"
            stroke={variant.accent}
            strokeWidth={offset === 8 ? 0.8 : 0.4}
            strokeOpacity={offset === 8 ? 0.4 : offset === 14 ? 0.22 : 0.1}
          />
        ))}

        {/* Arc segments */}
        {THEMES.map((theme, i) => {
          const GAP = 1.6;
          const start = -90 + i * SEG + GAP / 2;
          const end = start + SEG - GAP;
          const mid = (start + end) / 2;
          const midRad = (mid * Math.PI) / 180;
          const lr = (OR + IR) / 2;
          const lx = cx + lr * Math.cos(midRad);
          const ly = cy + lr * Math.sin(midRad);
          const color = variant.colors[i % variant.colors.length];

          return (
            <g key={theme.id}>
              <path
                d={arcPath(cx, cy, OR, IR, start, end)}
                fill={color}
                stroke={variant.accent}
                strokeWidth={0.5}
                strokeOpacity={0.4}
              />
              {/* Outer edge highlight strip */}
              <path
                d={arcPath(cx, cy, OR, OR - 10, start, end)}
                fill={variant.accent}
                fillOpacity={0.1}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid + 90} ${lx} ${ly})`}
                style={{
                  fontFamily: 'var(--f-vt)',
                  fontSize: 13.5,
                  fill: variant.accent,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                {theme.shortPT}
              </text>
            </g>
          );
        })}

        {/* Vignette */}
        <circle cx={cx} cy={cy} r={OR} fill="url(#ann-vig)" />
        {/* Inner glow ring */}
        <circle cx={cx} cy={cy} r={IR} fill="url(#ann-inner-glow)" />
        {/* Inner border */}
        <circle cx={cx} cy={cy} r={IR} fill="none" stroke={variant.accent} strokeWidth={1} strokeOpacity={0.4} />
        {/* Outer rim */}
        <circle cx={cx} cy={cy} r={OR + 2} fill="none" stroke={variant.accent} strokeWidth={1.5} strokeOpacity={0.55} />
        {/* Center hole fill */}
        <circle cx={cx} cy={cy} r={IR - 1} fill={variant.core} />
      </svg>
    </div>
  );
}

function StandardWheel({ variant, angle, gradient }) {
  const is3d = variant.id === 'singularity';

  const disc = (
    <div
      className="rl2-disc"
      style={{ '--spin-angle': `${angle}deg`, '--wheel-gradient': gradient }}
    >
      {THEMES.map((theme, i) => (
        <span
          key={theme.id}
          className="rl2-label"
          style={{ '--label-angle': `${SEG * i + SEG / 2}deg` }}
        >
          {theme.shortPT}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`rl2-wheel-wrap rl2-wheel-wrap--${variant.id}`}>
      {is3d && <div className="rl2-corona-ring" />}
      <div className={`rl2-pointer${is3d ? ' rl2-pointer--singularity' : ''}`} />
      {is3d ? <div className="rl2-3d-stage">{disc}</div> : disc}
      <div className="rl2-hub">
        <span>
          {is3d ? '●'
            : variant.id === 'corona' ? '☀'
            : variant.id === 'scanner' ? '⊕'
            : variant.id === 'atlas' ? '✦'
            : '◈'}
        </span>
      </div>
      <div className="rl2-aura" />
    </div>
  );
}

function RoulettePreview({ variant, selected, onSelect }) {
  const [angle, setAngle] = useState(0);
  const gradient = useMemo(() => segGradient(variant.colors), [variant.colors]);
  const spin = () => setAngle((c) => c + 360 * 4 + 40 + Math.floor(Math.random() * 280));

  return (
    <article
      className={`rl2-card rl2-card--${variant.id}${selected ? ' is-selected' : ''}`}
      style={{ '--accent': variant.accent, '--accent-2': variant.accent2, '--core': variant.core }}
    >
      <div className="rl2-card__header">
        <div>
          <div className="rl2-card__tone">{variant.tone}</div>
          <h2>{variant.name}</h2>
        </div>
        <button className="rl2-pick" onClick={onSelect}>
          {selected ? 'Escolhida' : 'Marcar'}
        </button>
      </div>

      {variant.id === 'annular'
        ? <AnnularWheel variant={variant} angle={angle} />
        : <StandardWheel variant={variant} angle={angle} gradient={gradient} />}

      <p>{variant.note}</p>
      <button className="btn btn-yellow rl2-spin" onClick={spin}>
        GIRAR AMOSTRA
      </button>
    </article>
  );
}

export default function RouletteStyleLab2() {
  const [selected, setSelected] = useState(VARIANTS[0].id);
  const sel = VARIANTS.find((v) => v.id === selected) || VARIANTS[0];

  return (
    <main className="rl2">
      <section className="rl2-hero">
        <div>
          <div className="home-eyebrow">MOCKUP DE ROLETA — SÉRIE 2</div>
          <h1 className="t-title glow-text-cyan">
            Cosmos reimaginado
            <span>abordagens alternativas</span>
          </h1>
          <p>
            Segunda série de estilos: perspectiva 3D, anel anular, radar fósforo, prisma cristal, corona solar e carta estelar. Estruturas radicalmente diferentes — legibilidade no centro de cada escolha.
          </p>
        </div>
        <div className="rl2-hero__callout panel bevel glow-amber">
          <span className="t-title text-dim">Selecionada</span>
          <strong>{sel.name}</strong>
          <small>{sel.note}</small>
        </div>
      </section>

      <section className="rl2-grid">
        {VARIANTS.map((v) => (
          <RoulettePreview
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
