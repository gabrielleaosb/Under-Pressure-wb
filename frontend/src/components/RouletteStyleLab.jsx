import React, { useMemo, useState } from 'react';
import { THEMES } from '../gameData.js';
import '../roulette-lab.css';

const STYLE_VARIANTS = [
  {
    id: 'blackhole',
    name: 'Event Horizon',
    note: 'Buraco negro com disco de acrecao, particulas orbitando e centro pesado. Minha escolha para o jogo.',
    tone: 'Buraco negro',
    accent: '#00f5ff',
    accent2: '#ffcf33',
    core: '#02030a',
    colors: ['#1a102f', '#4c1d95', '#00d5ff', '#2dffb3', '#fff06a', '#ff5b7f', '#060712'],
  },
  {
    id: 'galaxy',
    name: 'Spiral Galaxy',
    note: 'Roleta como uma galaxia vista de cima: bracos em espiral, poeira estelar e leitura ainda clara.',
    tone: 'Galaxia',
    accent: '#73f7ff',
    accent2: '#ff7edb',
    core: '#11164a',
    colors: ['#152a63', '#2148a6', '#00c8ff', '#58ffc4', '#ffe66b', '#ff6aa2', '#7e58ff'],
  },
  {
    id: 'nebula',
    name: 'Nebula Bloom',
    note: 'Mais colorida e misteriosa, com nuvens de gas e uma aura viva sem depender de filtros caros.',
    tone: 'Nebulosa',
    accent: '#b066ff',
    accent2: '#00ffcc',
    core: '#150923',
    colors: ['#37105f', '#8c3dff', '#ff4fb8', '#00d6ff', '#00ff9d', '#ffe66d', '#2a1848'],
  },
  {
    id: 'warp',
    name: 'Warp Gate',
    note: 'Sensacao de dobra espacial: aneis de velocidade, estrelas em fuga e foco forte no ponteiro.',
    tone: 'Dobra',
    accent: '#00ffff',
    accent2: '#ffffff',
    core: '#07162f',
    colors: ['#082048', '#005fb8', '#00d5ff', '#6dfffb', '#ffffff', '#ffe66b', '#244dff'],
  },
  {
    id: 'pulsar',
    name: 'Pulsar Beacon',
    note: 'Visual de farol cosmico, com feixes ritmados. Bom para criar tensao antes do resultado.',
    tone: 'Pulsar',
    accent: '#ffe000',
    accent2: '#00aaff',
    core: '#090b18',
    colors: ['#09111f', '#123a8a', '#00aaff', '#00ffff', '#ffe000', '#ff8a00', '#ff3355'],
  },
  {
    id: 'supernova',
    name: 'Supernova Core',
    note: 'A mais explosiva: brilho quente, fragmentos orbitais e energia alta para momentos de festa.',
    tone: 'Supernova',
    accent: '#ffb000',
    accent2: '#ff3355',
    core: '#2a0700',
    colors: ['#ff3d00', '#ff8a00', '#ffe000', '#fff4a3', '#00e5ff', '#7b61ff', '#170812'],
  },
];

const PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  angle: index * 22.5,
  distance: 44 + (index % 5) * 9,
  size: 2 + (index % 3),
  delay: -(index * 0.33),
  duration: 6.5 + (index % 4) * 1.2,
}));

function gradientFor(colors) {
  const slice = 100 / THEMES.length;
  return THEMES
    .map((theme, index) => {
      const color = colors[index % colors.length] || theme.color;
      return `${color} ${index * slice}% ${(index + 1) * slice}%`;
    })
    .join(', ');
}

function RoulettePreview({ variant, selected, onSelect }) {
  const [angle, setAngle] = useState(0);
  const gradient = useMemo(() => gradientFor(variant.colors), [variant.colors]);

  const spin = () => {
    const landing = 360 * 4 + 40 + Math.floor(Math.random() * 280);
    setAngle((current) => current + landing);
  };

  return (
    <article
      className={`roulette-lab-card roulette-lab-card--${variant.id}${selected ? ' is-selected' : ''}`}
      style={{
        '--accent': variant.accent,
        '--accent-2': variant.accent2,
        '--core': variant.core,
      }}
    >
      <div className="roulette-lab-card__header">
        <div>
          <div className="roulette-lab-card__tone">{variant.tone}</div>
          <h2>{variant.name}</h2>
        </div>
        <button className="roulette-lab-pick" onClick={onSelect}>
          {selected ? 'Escolhida' : 'Marcar'}
        </button>
      </div>

      <div className="roulette-lab-wheel" style={{ '--spin-angle': `${angle}deg`, '--wheel-gradient': gradient }}>
        <div className="roulette-lab-spacefield" aria-hidden="true">
          {PARTICLES.map((particle) => (
            <span
              key={particle.id}
              className="roulette-lab-particle"
              style={{
                '--particle-angle': `${particle.angle}deg`,
                '--particle-distance': `${particle.distance}px`,
                '--particle-size': `${particle.size}px`,
                '--particle-delay': `${particle.delay}s`,
                '--particle-duration': `${particle.duration}s`,
              }}
            >
              <i />
            </span>
          ))}
        </div>

        <div className="roulette-lab-pointer" />
        <div className="roulette-lab-aura" />
        <div className="roulette-lab-wheel__disc">
          <div className="roulette-lab-wheel__ticks" />
          {THEMES.map((theme, index) => {
            const rotate = (360 / THEMES.length) * index + (360 / THEMES.length) / 2;
            return (
              <span
                key={theme.id}
                className="roulette-lab-wheel__label"
                style={{ '--label-angle': `${rotate}deg` }}
              >
                {theme.shortPT}
              </span>
            );
          })}
        </div>
        <div className="roulette-lab-hub">
          <span>{variant.id === 'blackhole' ? 'VOID' : 'UP'}</span>
        </div>
      </div>

      <p>{variant.note}</p>

      <button className="btn btn-yellow roulette-lab-spin" onClick={spin}>
        GIRAR AMOSTRA
      </button>
    </article>
  );
}

export default function RouletteStyleLab() {
  const [selected, setSelected] = useState(STYLE_VARIANTS[0].id);
  const selectedVariant = STYLE_VARIANTS.find((variant) => variant.id === selected) || STYLE_VARIANTS[0];

  return (
    <main className="roulette-lab">
      <section className="roulette-lab-hero">
        <div>
          <div className="home-eyebrow">MOCKUP DE ROLETA</div>
          <h1 className="t-title glow-text-cyan">
            Roletas cosmicas
            <span>Under Pressure</span>
          </h1>
          <p>
            Agora o mockup assume o tema de espaco e naves: buraco negro, galaxia, nebulosa, dobra, pulsar e
            supernova. As particulas usam transform e poucos elementos para manter o giro fluido.
          </p>
        </div>
        <div className="roulette-lab-hero__callout panel bevel glow-amber">
          <span className="t-title text-dim">Selecionada</span>
          <strong>{selectedVariant.name}</strong>
          <small>{selectedVariant.note}</small>
        </div>
      </section>

      <section className="roulette-lab-grid">
        {STYLE_VARIANTS.map((variant) => (
          <RoulettePreview
            key={variant.id}
            variant={variant}
            selected={selected === variant.id}
            onSelect={() => setSelected(variant.id)}
          />
        ))}
      </section>
    </main>
  );
}
