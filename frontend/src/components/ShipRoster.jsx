import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

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
  { id: 'nova_01', name: 'Needle', role: 'Duelist', sprite: `
......2...........
.....222..........
....22022.........
...22033022.......
55220044002222....
6622770000000222..
55220044002222....
...22033022.......
....22022.........
.....222..........
......2...........
  ` },
  { id: 'nova_02', name: 'Manta', role: 'Wing', sprite: `
..2...........2...
.222.........222..
22022.......22022.
22200222222200222.
..220044440022....
....22077022......
..220044440022....
22200222222200222.
22022.......22022.
.222.........222..
..2...........2...
  ` },
  { id: 'nova_03', name: 'Brick', role: 'Tank', sprite: `
....222222222.....
..220000000022....
552000333300022...
6620077447700022..
6620004444000022..
552000333300022...
..220000000022....
....222222222.....
  ` },
  { id: 'nova_04', name: 'Halo', role: 'Orbit', sprite: `
.....2222222......
...22000000022....
..20022...22002...
.2002..333..2002..
.2002.34443.2002..
.2002..333..2002..
..20022...22002...
...22000000022....
.....2222222......
  ` },
  { id: 'nova_05', name: 'Beetle', role: 'Crawler', sprite: `
....2.....2.......
...222...222......
552200222002255...
662003333300266...
..20034443002.....
..20037773002.....
662003333300266...
552200222002255...
...222...222......
....2.....2.......
  ` },
  { id: 'nova_06', name: 'Shark', role: 'Rusher', sprite: `
...........2......
.........2222.....
......22200022....
552222000333022...
66200007774400222.
552222000333022...
......22200022....
.........2222.....
...........2......
  ` },
  { id: 'nova_07', name: 'Shrine', role: 'Relic', sprite: `
.......22.........
......2002........
....22033022......
...2003443002.....
552007777700255...
662000444000266...
552007777700255...
...2003443002.....
....22033022......
......2002........
.......22.........
  ` },
  { id: 'nova_08', name: 'Comet', role: 'Scout', sprite: `
55................
6655..............
556622............
..5520022.........
....200330222.....
....200744000222..
....200330222.....
..5520022.........
556622............
6655..............
55................
  ` },
  { id: 'nova_09', name: 'Fork', role: 'Interceptor', sprite: `
..222.......222...
.20022.....22002..
55200222222200255.
66200033330002666.
...2207447022.....
.....200002.......
...2207447022.....
66200033330002666.
55200222222200255.
.20022.....22002..
..222.......222...
  ` },
  { id: 'nova_10', name: 'Carrier', role: 'Heavy', sprite: `
..222222222222....
220000000000022...
2003377777330022..
20030000003300022.
66200444440002666.
66200333330002666.
20030000003300022.
2003377777330022..
220000000000022...
..222222222222....
  ` },
  { id: 'nova_11', name: 'Viper', role: 'Blade', sprite: `
2.............2...
22...........22...
2022.......2202...
200222222222002...
552003333300255...
662007444700266...
552003333300255...
200222222222002...
2022.......2202...
22...........22...
2.............2...
  ` },
  { id: 'nova_12', name: 'Monolith', role: 'Core', sprite: `
......2222........
.....200002.......
....20033002......
...2003443002.....
552007777700255...
662000444000266...
662000333000266...
552007777700255...
...2003443002.....
....20033002......
.....200002.......
......2222........
  ` },
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
const SPRITE_CACHE = new Map();
const DAMAGE_CACHE = new Map();
const PALETTE_CACHE = new Map();

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
  if (PALETTE_CACHE.has(color)) return PALETTE_CACHE.get(color);
  const base = SHIP_SWATCHES[color] || SHIP_SWATCHES.blue;
  const palette = {
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
  PALETTE_CACHE.set(color, palette);
  return palette;
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
  const safeModel = model || SHIP_MODELS[0];
  if (SPRITE_CACHE.has(safeModel.id)) return SPRITE_CACHE.get(safeModel.id);
  if (safeModel.sprite) {
    const rawRows = safeModel.sprite.trim().split('\n').map((row) => row.trim()).filter(Boolean);
    const width = Math.max(...rawRows.map((row) => row.length));
    const rows = rawRows.map((row) => row.padEnd(width, '.'));
    SPRITE_CACHE.set(safeModel.id, rows);
    return rows;
  }

  const grid = blankGrid();
  const bodyStart = 4;
  const bodyEnd = 17;
  const profile = safeModel.profile || SHIP_MODELS[0].profile || [1, 2, 3, 2, 1];
  const segment = Math.floor((bodyEnd - bodyStart) / profile.length);

  profile.forEach((halfHeight, index) => {
    const startX = bodyStart + index * segment;
    const endX = index === profile.length - 1 ? bodyEnd : startX + segment;
    for (let x = startX; x < endX; x += 1) {
      const t = (x - startX) / Math.max(1, endX - startX);
      const next = profile[Math.min(profile.length - 1, index + 1)];
      const currentHeight = Math.round(halfHeight + (next - halfHeight) * t);
      drawColumn(grid, x, currentHeight, safeModel.nose);
    }
  });

  for (let step = 0; step < (safeModel.tail || 1); step += 1) {
    const x = bodyStart - 1 - step;
    const halfHeight = Math.max(1, profile[0] - Math.floor(step / 2));
    drawColumn(grid, x, halfHeight);
    if (step > 0) {
      setPixel(grid, x, CY - halfHeight - 1, '1');
      setPixel(grid, x, CY + halfHeight + 1, '1');
    }
  }

  for (let step = 0; step < (safeModel.nose || 1); step += 1) {
    const x = bodyEnd + step;
    const halfHeight = Math.max(0, profile[profile.length - 1] - step - 1);
    if (halfHeight === 0) {
      setPixel(grid, x, CY, step === (safeModel.nose || 1) - 1 ? '2' : '0');
    } else {
      drawColumn(grid, x, halfHeight, safeModel.nose);
    }
  }

  addFins(grid, safeModel, bodyEnd);
  addCockpit(grid, safeModel, bodyStart, bodyEnd);
  addAccent(grid, bodyStart, bodyEnd);
  addEngines(grid, safeModel, bodyStart);

  const rows = addOutline(grid).map((row) => row.join(''));
  SPRITE_CACHE.set(safeModel.id, rows);
  return rows;
}

function applyDamage(rows, level, seed = 0, cacheKey = '') {
  if (!level) return rows;
  const key = `${cacheKey}:${level}:${seed}`;
  if (DAMAGE_CACHE.has(key)) return DAMAGE_CACHE.get(key);
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

  const damaged = next.map((row) => row.join(''));
  DAMAGE_CACHE.set(key, damaged);
  return damaged;
}

function PixelArt({ rows, palette, pixel, glow = false, shake = false }) {
  const canvasRef = useRef(null);
  const width = rows[0]?.length || 1;
  const height = rows.length || 1;
  const cssWidth = width * pixel;
  const cssHeight = height * pixel;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.ceil(cssWidth * dpr);
    canvas.height = Math.ceil(cssHeight * dpr);

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    rows.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        if (char === '.') return;
        ctx.fillStyle = palette[char] || '#ff00ff';
        ctx.fillRect(x * pixel, y * pixel, pixel, pixel);
      });
    });
  }, [rows, palette, pixel, cssWidth, cssHeight]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-canvas ${shake ? 'shake-hard' : ''}`}
      width={cssWidth}
      height={cssHeight}
      style={{
        width: cssWidth,
        height: cssHeight,
        filter: glow ? `drop-shadow(0 0 ${Math.max(8, pixel * 2)}px rgba(0,255,255,0.35))` : undefined,
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export const ShipIcon = memo(function ShipIcon({
  ship = SHIP_MODELS[0].id,
  color = 'blue',
  pixel = 4,
  glow = false,
  shake = false,
  damage = 0,
}) {
  const safeShip = typeof ship === 'string' && ship ? ship : SHIP_MODELS[0].id;
  const model = useMemo(() => getShipModel(safeShip), [safeShip]);
  const baseSprite = useMemo(() => buildSprite(model), [model]);
  const rows = useMemo(() => applyDamage(baseSprite, damage, safeShip.length, safeShip), [baseSprite, damage, safeShip]);
  const palette = useMemo(() => makePalette(color), [color]);

  return (
    <div className="pixel" aria-hidden="true">
      <PixelArt rows={rows} palette={palette} pixel={pixel} glow={glow} shake={shake || damage >= 3} />
    </div>
  );
});

export function ShipPicker({ currentShip = SHIP_MODELS[0].id, currentColor = 'blue', lang = 'pt', onConfirm, onClose }) {
  const initialShip = typeof currentShip === 'string' && SHIP_IDS.includes(currentShip) ? currentShip : SHIP_MODELS[0].id;
  const initialColor = typeof currentColor === 'string' && SHIP_COLORS.includes(currentColor) ? currentColor : 'blue';
  const [ship, setShip] = useState(initialShip);
  const [color, setColor] = useState(initialColor);
  const selectedModel = SHIP_MODELS.find((model) => model.id === ship) || SHIP_MODELS[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.92)',
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
          backdropFilter: 'none',
          contain: 'layout paint',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 'clamp(9px,2.5vw,12px)' }}>HANGAR</div>
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
          <div className="t-mono text-dim" style={{ fontSize: 13 }}>
            {selectedModel.role}
          </div>
        </div>

        <div>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 8 }}>
            SHIP
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
                    contain: 'layout paint',
                    transform: active ? 'translateY(-1px)' : 'none',
                    transition: 'border-color .08s linear, background .08s linear, transform .08s linear',
                  }}
                >
                  <ShipIcon ship={model.id} color={color} pixel={3.2} glow={active} />
                  <span style={{ fontFamily: 'var(--f-body)', fontSize: 11, fontWeight: 800, color: active ? 'var(--neon-cyan)' : 'var(--ink-dim)' }}>
                    {model.name}
                  </span>
                  <span className="t-mono" style={{ fontSize: 10, color: active ? 'var(--neon-amber)' : 'var(--ink-faint)' }}>
                    {model.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 8 }}>
            COLOR
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
                    contain: 'layout paint',
                  }}
                />
              );
            })}
          </div>
        </div>

        <button className="btn btn-primary" style={{ fontSize: 11 }} onClick={() => onConfirm(ship, color)}>
          OK
        </button>
      </div>
    </div>
  );
}
