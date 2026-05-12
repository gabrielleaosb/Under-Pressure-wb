import React, { useMemo } from 'react';

// ── Palettes ─────────────────────────────────────────────────────────────────
const PAL_RED = {
  '0':'#c9304a','1':'#6a1424','2':'#ff6680','3':'#1a1f3a','4':'#00d9ff',
  '5':'#ffb84d','6':'#fff066','7':'#e8e8f0','8':'#1a0a10','9':'#3a3a48',
  'a':'#ff6a1f','b':'#ffd54a','c':'#ff1a3a','d':'#000',
};
const PAL_BLUE = {
  '0':'#2a82d4','1':'#0e3a6e','2':'#7ec8ff','3':'#1a1f3a','4':'#ffb84d',
  '5':'#00ffff','6':'#a8fff8','7':'#e8e8f0','8':'#08101e','9':'#3a3a48',
  'a':'#ff6a1f','b':'#ffd54a','c':'#ff1a3a','d':'#000',
};

// ── FTL-style 16×16 cruiser sprites ──────────────────────────────────────────
const FTL_RED_INTACT = `
................
.......0220.....
......02222.....
.....02222200...
....022222220...
...0222244222...
..02222244222.0.
.022222222222.0.
.022222222222.0.
..02222244222.0.
...0222244222...
....022222220...
.....02222200...
......02222.....
.......0220.....
................`;

const FTL_BLUE_INTACT = `
................
......0220......
.....02222......
....02222200....
....022222220...
....0222255222..
.0.02222255222..
.0.022222222222.
.0.022222222222.
.0.02222255222..
....0222255222..
....022222220...
....02222200....
.....02222......
......0220......
................`;

// ── Sprite parser ─────────────────────────────────────────────────────────────
function parseSprite(grid) {
  const rows = grid.trim().split('\n').map(r => r);
  const h    = rows.length;
  const w    = Math.max(...rows.map(r => r.length));
  return { rows, w, h };
}

// ── Damage application (algorithmic) ─────────────────────────────────────────
function applyDamage(base, level, seed = 0) {
  if (level === 0) return base;
  const rand = n => { let x = Math.sin(seed * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
  const rows = base.rows.map(r => r.split(''));
  const h = rows.length, w = Math.max(...rows.map(r => r.length));

  const hullPx = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < (rows[y]?.length || 0); x++)
      if (rows[y][x] !== '.' && rows[y][x] !== '8') hullPx.push([x, y]);

  const addSmoke = (count, sk) => {
    for (let i = 0; i < count; i++) {
      const sx = Math.floor(rand(sk+i)*w), sy = Math.max(0, Math.floor(rand(sk+i+7)*3));
      while (rows[sy].length < w) rows[sy].push('.');
      if (rows[sy][sx] === '.') rows[sy][sx] = '9';
    }
  };

  if (level >= 1) {
    const n = Math.floor(hullPx.length * 0.08);
    for (let i = 0; i < n; i++) { const [x,y] = hullPx[Math.floor(rand(i+1)*hullPx.length)]; rows[y][x]='1'; }
    addSmoke(2, 11);
  }
  if (level >= 2) {
    const fires = Math.floor(hullPx.length * 0.12);
    for (let i = 0; i < fires; i++) { const [x,y] = hullPx[Math.floor(rand(i+17)*hullPx.length)]; rows[y][x] = i%2?'a':'b'; }
    addSmoke(4, 23);
  }
  if (level >= 3) {
    const d = Math.floor(hullPx.length * 0.28);
    for (let i = 0; i < d; i++) { const [x,y] = hullPx[Math.floor(rand(i+41)*hullPx.length)]; rows[y][x] = i%3===0?'.':i%3===1?'c':'a'; }
    addSmoke(7, 31);
  }
  if (level >= 4) {
    for (let y=0;y<h;y++) for (let x=0;x<(rows[y]?.length||0);x++) {
      const c=rows[y][x]; if (c!=='.') {
        const r=rand(y*100+x);
        rows[y][x] = r<.2?'.':r<.5?'a':r<.75?'b':'c';
      }
    }
  }
  return { rows: rows.map(r => r.join('')), w, h };
}

// ── PixelArt renderer ─────────────────────────────────────────────────────────
function PixelArt({ rows, w, h, palette, pixel }) {
  return (
    <div className="pixel-grid" style={{
      gridTemplateColumns: `repeat(${w}, ${pixel}px)`,
      gridTemplateRows:    `repeat(${h}, ${pixel}px)`,
    }}>
      {rows.flatMap((row, y) =>
        Array.from({ length: w }).map((_, x) => {
          const c = row[x] || '.';
          return (
            <i key={`${x}-${y}`} style={{
              background: c === '.' ? 'transparent' : (palette[c] || '#f0f'),
            }}/>
          );
        })
      )}
    </div>
  );
}

// ── Public Ship component ─────────────────────────────────────────────────────
export default function ShipDisplay({ teamIndex, damage, maxDamage, size = 80, animate = true }) {
  const pct    = Math.min(1, damage / maxDamage);
  const level  = pct >= 1 ? 4 : pct >= .7 ? 3 : pct >= .4 ? 2 : pct >= .2 ? 1 : 0;

  const base   = useMemo(() => parseSprite(teamIndex === 0 ? FTL_RED_INTACT : FTL_BLUE_INTACT), [teamIndex]);
  const sprite = useMemo(() => applyDamage(base, level, teamIndex * 100 + level), [base, level, teamIndex]);
  const pal    = teamIndex === 0 ? PAL_RED : PAL_BLUE;

  // pixel size: target `size` px total width across 16 columns
  const pixel  = Math.max(2, Math.round(size / sprite.w));

  const animStyle = level >= 4
    ? { animation: 'ship-explode 1.5s ease forwards' }
    : level >= 3
      ? { animation: 'ship-shake .35s infinite' }
      : animate
        ? { animation: `ship-float ${3 + teamIndex * 0.8}s ease-in-out infinite` }
        : {};

  const color    = teamIndex === 0 ? 'var(--team-0)' : 'var(--team-1)';
  const hpPct    = Math.max(0, (1 - pct) * 100);
  const hpColor  = pct > .6 ? 'var(--neon-coral)' : pct > .3 ? 'var(--orange)' : 'var(--neon-mint)';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div className="pixel" style={animStyle}>
        <PixelArt rows={sprite.rows} w={sprite.w} h={sprite.h} palette={pal} pixel={pixel}/>
      </div>
      {/* HP bar with cell dividers */}
      <div className="hpbar" style={{ width: sprite.w * pixel, borderColor: color }}>
        <div className="hpbar-fill" style={{ width:`${hpPct}%`, background:`linear-gradient(90deg,${hpColor},${hpColor})`, boxShadow:`0 0 8px ${hpColor}` }}>
          <div className="hpbar-cells"/>
        </div>
      </div>
    </div>
  );
}
