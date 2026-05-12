import React, { useMemo, useState } from 'react';

export const SHIP_SWATCHES = {
  red: '#ff5468',
  blue: '#4cb6ff',
  emerald: '#41d694',
  amber: '#ffbf4d',
  violet: '#b685ff',
  cyan: '#4de8e8',
  pink: '#ff82c4',
  bone: '#f0ebe0',
  toxic: '#c0ff3e',
  void: '#8790ad',
};

export const SHIP_MODELS = [
  { id: 'nova_01', name: 'Lancer', profile: [1, 2, 3, 3, 2], nose: 2, tail: 2, canopy: 9, engines: 2, fins: 'none' },
  { id: 'nova_02', name: 'Arrow', profile: [1, 2, 2, 3, 2], nose: 4, tail: 1, canopy: 10, engines: 1, fins: 'none' },
  { id: 'nova_03', name: 'Manta', profile: [1, 3, 4, 4, 2], nose: 2, tail: 2, canopy: 8, engines: 2, fins: 'wide' },
  { id: 'nova_04', name: 'Drift', profile: [2, 2, 3, 3, 2], nose: 3, tail: 1, canopy: 9, engines: 2, fins: 'top' },
  { id: 'nova_05', name: 'Basilisk', profile: [1, 3, 3, 4, 2], nose: 2, tail: 3, canopy: 11, engines: 3, fins: 'wide' },
  { id: 'nova_06', name: 'Raptor', profile: [2, 3, 4, 4, 3], nose: 2, tail: 2, canopy: 9, engines: 2, fins: 'stab' },
  { id: 'nova_07', name: 'Warden', profile: [2, 3, 3, 3, 2], nose: 3, tail: 3, canopy: 12, engines: 3, fins: 'none' },
  { id: 'nova_08', name: 'Needle', profile: [1, 1, 2, 2, 1], nose: 5, tail: 1, canopy: 11, engines: 1, fins: 'none' },
  { id: 'nova_09', name: 'Halo', profile: [2, 3, 4, 3, 2], nose: 2, tail: 2, canopy: 8, engines: 2, fins: 'top' },
  { id: 'nova_10', name: 'Harpoon', profile: [1, 2, 3, 4, 2], nose: 3, tail: 2, canopy: 10, engines: 2, fins: 'lower' },
  { id: 'nova_11', name: 'Quill', profile: [1, 2, 2, 4, 3], nose: 2, tail: 1, canopy: 11, engines: 2, fins: 'stab' },
  { id: 'nova_12', name: 'Comet', profile: [2, 2, 3, 4, 2], nose: 4, tail: 2, canopy: 10, engines: 1, fins: 'top' },
  { id: 'nova_13', name: 'Anvil', profile: [2, 4, 4, 3, 2], nose: 2, tail: 3, canopy: 8, engines: 3, fins: 'none' },
  { id: 'nova_14', name: 'Dart', profile: [1, 1, 2, 3, 2], nose: 5, tail: 1, canopy: 10, engines: 1, fins: 'none' },
  { id: 'nova_15', name: 'Scythe', profile: [1, 3, 4, 4, 2], nose: 1, tail: 2, canopy: 7, engines: 2, fins: 'stab' },
  { id: 'nova_16', name: 'Beacon', profile: [2, 2, 3, 3, 2], nose: 3, tail: 3, canopy: 10, engines: 2, fins: 'none' },
  { id: 'nova_17', name: 'Pike', profile: [1, 2, 3, 4, 3], nose: 2, tail: 1, canopy: 11, engines: 1, fins: 'lower' },
  { id: 'nova_18', name: 'Atlas', profile: [2, 3, 3, 3, 2], nose: 2, tail: 4, canopy: 10, engines: 3, fins: 'top' },
  { id: 'nova_19', name: 'Glider', profile: [1, 3, 4, 4, 3], nose: 1, tail: 2, canopy: 7, engines: 2, fins: 'wide' },
  { id: 'nova_20', name: 'Skipper', profile: [1, 2, 3, 4, 2], nose: 3, tail: 2, canopy: 8, engines: 2, fins: 'top' },
  { id: 'nova_21', name: 'Relic', profile: [2, 2, 3, 4, 3], nose: 2, tail: 3, canopy: 11, engines: 3, fins: 'lower' },
  { id: 'nova_22', name: 'Monarch', profile: [1, 3, 4, 4, 2], nose: 1, tail: 2, canopy: 8, engines: 2, fins: 'wide' },
  { id: 'nova_23', name: 'Shard', profile: [1, 1, 2, 3, 2], nose: 4, tail: 1, canopy: 10, engines: 1, fins: 'lower' },
  { id: 'nova_24', name: 'Aegis', profile: [2, 3, 3, 4, 2], nose: 3, tail: 3, canopy: 9, engines: 3, fins: 'none' },
  { id: 'nova_25', name: 'Spine', profile: [1, 2, 2, 4, 3], nose: 2, tail: 2, canopy: 11, engines: 2, fins: 'stab' },
  { id: 'nova_26', name: 'Mirage', profile: [1, 3, 4, 4, 3], nose: 1, tail: 2, canopy: 7, engines: 2, fins: 'wide' },
  { id: 'nova_27', name: 'Forge', profile: [2, 4, 4, 3, 2], nose: 2, tail: 4, canopy: 9, engines: 3, fins: 'top' },
  { id: 'nova_28', name: 'Pulse', profile: [1, 2, 3, 3, 2], nose: 3, tail: 2, canopy: 10, engines: 2, fins: 'lower' },
  { id: 'nova_29', name: 'Hydra', profile: [1, 3, 4, 4, 2], nose: 2, tail: 3, canopy: 8, engines: 3, fins: 'stab' },
  { id: 'nova_30', name: 'Orbit', profile: [2, 2, 3, 4, 2], nose: 3, tail: 2, canopy: 9, engines: 2, fins: 'top' },
];

export const SHIP_IDS = SHIP_MODELS.map((model) => model.id);
export const SHIP_COLORS = Object.keys(SHIP_SWATCHES);

export const SHIP_LABELS = {
  pt: Object.fromEntries(SHIP_MODELS.map((model) => [model.id, model.name])),
  en: Object.fromEntries(SHIP_MODELS.map((model) => [model.id, model.name])),
};

const GRID_W = 24;
const GRID_H = 16;
const CY = 8;

function shadeColor(hex, amount) {
  const raw = hex.replace('#', '');
  const channels = raw.match(/.{1,2}/g) || ['88', '88', '88'];
  const next = channels.map((channel) => {
    const base = parseInt(channel, 16);
    return Math.max(0, Math.min(255, base + amount)).toString(16).padStart(2, '0');
  });
  return `#${next.join('')}`;
}

function makePalette(color) {
  const base = SHIP_SWATCHES[color] || SHIP_SWATCHES.blue;
  return {
    '0': base,
    '1': shadeColor(base, -56),
    '2': shadeColor(base, 38),
    '3': '#10203d',
    '4': color === 'amber' ? '#fff4a3' : '#7ef6ff',
    '5': '#ff9f38',
    '6': '#ffe56d',
    '7': shadeColor(base, 74),
    '8': '#040812',
    '9': '#3a3a48',
    a: '#ff6a1f',
    b: '#ffd54a',
    c: '#ff3758',
  };
}

function blankGrid() {
  return Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => '.'));
}

function getShipModel(shipId) {
  return SHIP_MODELS.find((model) => model.id === shipId) || SHIP_MODELS[0];
}

function setPixel(grid, x, y, value) {
  if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
  grid[y][x] = value;
}

function drawColumn(grid, x, halfHeight, noseBias = 0) {
  for (let offset = -halfHeight; offset <= halfHeight; offset += 1) {
    const taper = Math.abs(offset) === halfHeight ? 1 : 0;
    const char = taper && x > 8 + noseBias ? '2' : '0';
    setPixel(grid, x, CY + offset, char);
  }
}

function addFins(grid, model, bodyEnd) {
  const finX = bodyEnd - 6;
  if (model.fins === 'none') return;

  if (model.fins === 'top' || model.fins === 'wide' || model.fins === 'stab') {
    setPixel(grid, finX, CY - 4, '0');
    setPixel(grid, finX + 1, CY - 5, '0');
    setPixel(grid, finX + 2, CY - 5, '2');
  }
  if (model.fins === 'lower' || model.fins === 'wide' || model.fins === 'stab') {
    setPixel(grid, finX, CY + 4, '0');
    setPixel(grid, finX + 1, CY + 5, '0');
    setPixel(grid, finX + 2, CY + 5, '2');
  }
  if (model.fins === 'stab') {
    setPixel(grid, finX - 2, CY - 3, '1');
    setPixel(grid, finX - 2, CY + 3, '1');
  }
}

function addCockpit(grid, model, bodyStart, bodyEnd) {
  const canopyX = Math.min(bodyEnd - 2, bodyStart + Math.floor(model.canopy / 2) + 4);
  setPixel(grid, canopyX - 1, CY - 1, '3');
  setPixel(grid, canopyX, CY - 1, '4');
  setPixel(grid, canopyX + 1, CY, '4');
  setPixel(grid, canopyX, CY + 1, '3');
}

function addAccent(grid, bodyStart, bodyEnd) {
  const y = CY;
  for (let x = bodyStart + 3; x < bodyEnd - 2; x += 3) {
    if (grid[y][x] === '0') grid[y][x] = '7';
  }
}

function addEngines(grid, model, bodyStart) {
  const centerShift = model.engines === 1 ? [0] : model.engines === 2 ? [-1, 1] : [-2, 0, 2];
  centerShift.forEach((shift, index) => {
    setPixel(grid, bodyStart - 2, CY + shift, index % 2 === 0 ? '6' : '5');
    setPixel(grid, bodyStart - 1, CY + shift, '5');
  });
}

function addOutline(grid) {
  const outlined = grid.map((row) => [...row]);
  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      if (grid[y][x] !== '.') continue;
      const nearHull = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && grid[ny][nx] !== '.');
      if (nearHull) outlined[y][x] = '8';
    }
  }
  return outlined;
}

function buildSprite(model) {
  const grid = blankGrid();
  const bodyStart = 4;
  const bodyEnd = 17;
  const segment = Math.floor((bodyEnd - bodyStart) / model.profile.length);

  model.profile.forEach((halfHeight, index) => {
    const startX = bodyStart + index * segment;
    const endX = index === model.profile.length - 1 ? bodyEnd : startX + segment;
    for (let x = startX; x < endX; x += 1) {
      const t = (x - startX) / Math.max(1, endX - startX);
      const next = model.profile[Math.min(model.profile.length - 1, index + 1)];
      const currentHeight = Math.round(halfHeight + (next - halfHeight) * t);
      drawColumn(grid, x, currentHeight, model.nose);
    }
  });

  for (let step = 0; step < model.tail; step += 1) {
    const x = bodyStart - 1 - step;
    const halfHeight = Math.max(1, model.profile[0] - Math.floor(step / 2));
    drawColumn(grid, x, halfHeight);
    if (step > 0) {
      setPixel(grid, x, CY - halfHeight - 1, '1');
      setPixel(grid, x, CY + halfHeight + 1, '1');
    }
  }

  for (let step = 0; step < model.nose; step += 1) {
    const x = bodyEnd + step;
    const halfHeight = Math.max(0, model.profile[model.profile.length - 1] - step - 1);
    if (halfHeight === 0) {
      setPixel(grid, x, CY, step === model.nose - 1 ? '2' : '0');
    } else {
      drawColumn(grid, x, halfHeight, model.nose);
    }
  }

  addFins(grid, model, bodyEnd);
  addCockpit(grid, model, bodyStart, bodyEnd);
  addAccent(grid, bodyStart, bodyEnd);
  addEngines(grid, model, bodyStart);

  return addOutline(grid).map((row) => row.join(''));
}

function applyDamage(rows, level, seed = 0) {
  if (!level) return rows;
  const next = rows.map((row) => row.split(''));
  const hull = [];
  const rand = (n) => {
    const x = Math.sin(seed * 991 + n * 313) * 10000;
    return x - Math.floor(x);
  };

  for (let y = 0; y < next.length; y += 1) {
    for (let x = 0; x < next[y].length; x += 1) {
      if (['0', '1', '2', '3', '4', '7'].includes(next[y][x])) hull.push([x, y]);
    }
  }

  const burnPixels = (count, chars) => {
    for (let i = 0; i < count; i += 1) {
      const [x, y] = hull[Math.floor(rand(i + count) * hull.length)] || [];
      if (x == null) continue;
      next[y][x] = chars[i % chars.length];
    }
  };

  if (level >= 1) burnPixels(Math.max(2, Math.floor(hull.length * 0.08)), ['1', '9']);
  if (level >= 2) burnPixels(Math.max(4, Math.floor(hull.length * 0.12)), ['a', 'b', '1']);
  if (level >= 3) burnPixels(Math.max(6, Math.floor(hull.length * 0.2)), ['.', 'c', 'a', '9']);
  if (level >= 4) burnPixels(Math.max(12, Math.floor(hull.length * 0.35)), ['.', 'a', 'b', 'c', '9']);

  return next.map((row) => row.join(''));
}

function PixelArt({ rows, palette, pixel, glow = false, shake = false }) {
  return (
    <div
      className={`pixel-grid ${shake ? 'shake-hard' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${rows[0]?.length || 1}, ${pixel}px)`,
        gridTemplateRows: `repeat(${rows.length || 1}, ${pixel}px)`,
        filter: glow ? `drop-shadow(0 0 ${Math.max(8, pixel * 2)}px rgba(0,255,255,0.35))` : undefined,
      }}
    >
      {rows.flatMap((row, y) =>
        row.split('').map((char, x) => (
          <i
            key={`${x}-${y}`}
            style={{ background: char === '.' ? 'transparent' : palette[char] || '#ff00ff' }}
          />
        )),
      )}
    </div>
  );
}

export function ShipIcon({
  ship = SHIP_MODELS[0].id,
  color = 'blue',
  pixel = 4,
  glow = false,
  shake = false,
  damage = 0,
}) {
  const model = useMemo(() => getShipModel(ship), [ship]);
  const baseSprite = useMemo(() => buildSprite(model), [model]);
  const rows = useMemo(() => applyDamage(baseSprite, damage, ship.length + pixel), [baseSprite, damage, ship, pixel]);
  const palette = useMemo(() => makePalette(color), [color]);

  return (
    <div className="pixel" aria-hidden="true">
      <PixelArt rows={rows} palette={palette} pixel={pixel} glow={glow} shake={shake || damage >= 3} />
    </div>
  );
}

export function ShipPicker({ currentShip = SHIP_MODELS[0].id, currentColor = 'blue', lang = 'pt', onConfirm, onClose }) {
  const [ship, setShip] = useState(currentShip);
  const [color, setColor] = useState(currentColor);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="panel bevel glow-cyan"
        style={{
          width: 'min(980px, 100%)',
          maxHeight: 'min(90vh, 880px)',
          overflow: 'auto',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          background: 'linear-gradient(180deg,#0d1026,#060818)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 'clamp(9px,2.5vw,12px)' }}>
              {lang === 'pt' ? 'HANGAR TATICO' : 'TACTICAL HANGAR'}
            </div>
            <div className="t-body text-dim" style={{ fontSize: 13, marginTop: 8 }}>
              {lang === 'pt' ? 'Sprites pixel art novos, sem SVG.' : 'New pixel art sprites, no SVG.'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ minWidth: 32, minHeight: 32, fontSize: 16, padding: 0 }}>
            X
          </button>
        </div>

        <div className="panel bevel" style={{ padding: 20, minHeight: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <ShipIcon ship={ship} color={color} pixel={7} glow />
          <div className="t-title glow-text-amber" style={{ fontSize: 10 }}>
            {SHIP_LABELS[lang]?.[ship] || ship}
          </div>
        </div>

        <div>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 8 }}>
            {lang === 'pt' ? 'MODELOS' : 'MODELS'}
          </div>
          <div className="ship-picker-grid">
            {SHIP_MODELS.map((model) => {
              const active = model.id === ship;
              return (
                <button
                  key={model.id}
                  onClick={() => setShip(model.id)}
                  style={{
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    background: active ? 'rgba(0,255,255,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${active ? 'var(--neon-cyan)' : 'var(--metal-2)'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: active ? '0 0 12px rgba(0,255,255,0.4)' : 'none',
                  }}
                >
                  <ShipIcon ship={model.id} color={color} pixel={3} glow={active} />
                  <span style={{ fontFamily: 'var(--f-body)', fontSize: 11, fontWeight: 800, color: active ? 'var(--neon-cyan)' : 'var(--ink-dim)' }}>
                    {model.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 8 }}>
            {lang === 'pt' ? 'PALETAS' : 'PALETTES'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SHIP_COLORS.map((swatch) => {
              const active = swatch === color;
              const fill = SHIP_SWATCHES[swatch];
              return (
                <button
                  key={swatch}
                  onClick={() => setColor(swatch)}
                  style={{
                    width: 34,
                    height: 34,
                    background: fill,
                    border: `2.5px solid ${active ? 'var(--neon-cyan)' : '#000'}`,
                    boxShadow: active ? `0 0 12px ${fill}, 0 0 0 2px var(--neon-cyan)` : `0 0 6px ${fill}66`,
                    cursor: 'pointer',
                    borderRadius: 6,
                  }}
                />
              );
            })}
          </div>
        </div>

        <button className="btn btn-primary btn-pulse" style={{ fontSize: 11 }} onClick={() => onConfirm(ship, color)}>
          {lang === 'pt' ? 'CONFIRMAR NAVE' : 'CONFIRM SHIP'}
        </button>
      </div>
    </div>
  );
}
