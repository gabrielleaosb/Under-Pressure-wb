import React, { useMemo, useState } from 'react';
import '../background-lab.css';

const VARIANTS = [
  {
    id: 'atlas',
    name: 'Mapa Estelar Tatico',
    tag: 'Navegacao',
    note: 'Grid de cockpit, rotas finas e setores discretos. Melhor encaixe com a roleta Star Atlas.',
  },
  {
    id: 'nebula',
    name: 'Nebulosa CRT',
    tag: 'Atmosfera',
    note: 'Nebulosa suave com dithering/scanline. Visual mais cinematografico sem particulas reais.',
  },
  {
    id: 'parallax',
    name: 'Deriva Profunda',
    tag: 'Movimento',
    note: 'Tres profundidades de estrelas com deslocamento lento. Sensacao de nave em curso.',
  },
  {
    id: 'radar',
    name: 'Radar Orbital',
    tag: 'Cockpit',
    note: 'Aneis grandes, varredura lenta e marcadores de setor. Forte identidade de painel naval.',
  },
  {
    id: 'debris',
    name: 'Campo de Destrocos',
    tag: 'Tensao',
    note: 'Tracos pequenos cruzando o fundo como poeira e fragmentos. Bom para fases de pressao.',
  },
  {
    id: 'constellation',
    name: 'Constelacoes de Rota',
    tag: 'Assinatura',
    note: 'Linhas de constelacao e pontos de rota. Unico, limpo e facil de levar para o jogo.',
  },
];

function Stars({ count = 34 }) {
  const stars = useMemo(() => Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${4 + Math.random() * 92}%`,
    top: `${5 + Math.random() * 88}%`,
    size: `${1 + Math.random() * 1.8}px`,
    delay: `${-Math.random() * 5}s`,
  })), [count]);

  return (
    <div className="bgm-stars">
      {stars.map((star) => (
        <i key={star.id} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />
      ))}
    </div>
  );
}

function Preview({ variant }) {
  return (
    <div className={`bgm-preview bgm-preview--${variant.id}`}>
      <Stars count={variant.id === 'parallax' ? 52 : 28} />
      <div className="bgm-layer bgm-layer--grid" />
      <div className="bgm-layer bgm-layer--radar" />
      <div className="bgm-layer bgm-layer--routes" />
      <div className="bgm-layer bgm-layer--debris" />
      <div className="bgm-cockpit">
        <div className="bgm-cockpit__rail">
          <span>RD 04</span>
          <b>COMANDO</b>
        </div>
        <div className="bgm-cockpit__core">
          <div />
        </div>
        <div className="bgm-cockpit__rank">
          <span>#1 NOVA</span>
          <span>#2 ORION</span>
          <span>#3 VEGA</span>
        </div>
      </div>
    </div>
  );
}

export default function BackgroundLab() {
  const [selected, setSelected] = useState(VARIANTS[0]);

  return (
    <main className="bgm-page">
      <header className="bgm-hero">
        <div>
          <span className="bgm-kicker">MOCKUP DE BACKGROUND</span>
          <h1>Fundos para ponte de nave</h1>
          <p>
            Opcoes leves para substituir o campo simples de estrelas. Todas usam CSS e poucos elementos,
            pensadas para manter fluidez no jogo.
          </p>
        </div>
        <aside className="bgm-selected">
          <span>Selecionado</span>
          <b>{selected.name}</b>
          <p>{selected.note}</p>
        </aside>
      </header>

      <section className="bgm-grid">
        {VARIANTS.map((variant) => (
          <article key={variant.id} className={`bgm-card${selected.id === variant.id ? ' is-selected' : ''}`}>
            <div className="bgm-card__head">
              <div>
                <span>{variant.tag}</span>
                <h2>{variant.name}</h2>
              </div>
              <button type="button" onClick={() => setSelected(variant)}>
                {selected.id === variant.id ? 'Escolhido' : 'Marcar'}
              </button>
            </div>
            <Preview variant={variant} />
            <p>{variant.note}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
