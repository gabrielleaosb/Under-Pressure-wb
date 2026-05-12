import React, { useState } from 'react';
import { SHIP_MODELS, ShipIcon } from './ShipRoster.jsx';

export default function ShipShowroom() {
  const [selected, setSelected] = useState(SHIP_MODELS[0].id);
  const monoColor = 'bone';

  return (
    <div className="ship-showroom">
      <div className="ship-showroom__header">
        <div>
          <div className="home-eyebrow">CATALOGO DE NAVES</div>
          <h1 className="t-title glow-text-cyan" style={{ fontSize: 'clamp(18px,4vw,32px)', lineHeight: 1.2, marginTop: 16 }}>
            30 MODELOS
            <br />
            PIXEL ART
          </h1>
          <p className="home-subtitle" style={{ marginTop: 14 }}>
            Abra esta tela com <code>?shipyard</code>. Todos os modelos abaixo sao sprites em grade, sem SVG, para comparar silhuetas e escolher os finais.
          </p>
        </div>

        <div className="panel bevel glow-cyan ship-showroom__hero">
          <ShipIcon ship={selected} color={monoColor} pixel={9} glow />
          <div className="t-title glow-text-amber" style={{ fontSize: 10 }}>
            {selected}
          </div>
        </div>
      </div>

      <div className="ship-showroom__grid">
        {SHIP_MODELS.map((model) => {
          const active = model.id === selected;
          return (
            <button
              key={model.id}
              className="ship-showroom__card"
              onClick={() => setSelected(model.id)}
              style={{
                borderColor: active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.08)',
                boxShadow: active ? '0 0 18px rgba(0,255,255,0.25)' : 'none',
              }}
            >
              <ShipIcon ship={model.id} color={monoColor} pixel={4.2} glow={active} />
              <div className="ship-showroom__label">{model.id}</div>
              <div className="ship-showroom__name">{model.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
