// components.jsx — shared visual primitives for Under Pressure
// Loaded as text/babel after React + Babel. Exports to window.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ──────────────────────────────────────────────────────────────
   STARFIELD — animated twinkly background
   ────────────────────────────────────────────────────────────── */
function Starfield({ density = 80, drift = true, nebula = true }) {
  const stars = useMemo(() => {
    const out = [];
    for (let i = 0; i < density; i++) {
      const size = Math.random() < 0.85 ? 1 + Math.random() * 1.2 : 2 + Math.random() * 1.5;
      out.push({
        left: Math.random() * 110,   // slight overshoot for drift
        top: Math.random() * 100,
        size,
        op: 0.35 + Math.random() * 0.55,
        tw: 1.8 + Math.random() * 4,
        delay: Math.random() * 4,
      });
    }
    return out;
  }, [density]);
  return (
    <div className="starfield" style={{ background: nebula ? undefined : 'var(--space-0)' }}>
      <div style={{ position: 'absolute', inset: 0, animation: drift ? 'drift 60s linear infinite' : 'none' }}>
        {stars.map((s, i) => (
          <span key={i} className="star" style={{
            left: s.left + '%',
            top: s.top + '%',
            width: s.size + 'px',
            height: s.size + 'px',
            '--op': s.op,
            '--tw': s.tw + 's',
            opacity: s.op,
            animationDelay: -s.delay + 's',
          }} />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PIXEL SHIPS — three styles × five damage states
   Encoded as small grids of single chars → color map.
   Char map (compact alphabet):
     . = empty
     0..9, a..z = palette indices into a per-ship palette
   ────────────────────────────────────────────────────────────── */

// helper: turn a string grid (rows separated by \n) into rect array
function parseSprite(grid) {
  const rows = grid.trim().split('\n').map(r => r);
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  return { rows, w, h };
}

// PALETTES per ship style (always 5 damage variants share base, but damage adds fire/smoke layers)
// Index meaning: 0 hull-main, 1 hull-shadow, 2 hull-hi, 3 cockpit, 4 cockpit-hi,
// 5 engine, 6 engine-glow, 7 accent, 8 dark, 9 smoke, a fire-orange, b fire-yellow, c crit-red

const PAL_RED = {
  '0': '#c9304a',  // hull main
  '1': '#6a1424',  // hull shadow
  '2': '#ff6680',  // hull highlight
  '3': '#1a1f3a',  // cockpit dark
  '4': '#00d9ff',  // cockpit glow
  '5': '#ffb84d',  // engine orange
  '6': '#fff066',  // engine yellow
  '7': '#e8e8f0',  // accent white
  '8': '#1a0a10',  // outline
  '9': '#3a3a48',  // smoke gray
  'a': '#ff6a1f',  // fire orange
  'b': '#ffd54a',  // fire yellow
  'c': '#ff1a3a',  // critical red
  'd': '#000',
};
const PAL_BLUE = {
  '0': '#2a82d4',
  '1': '#0e3a6e',
  '2': '#7ec8ff',
  '3': '#1a1f3a',
  '4': '#ffb84d',
  '5': '#00ffff',
  '6': '#a8fff8',
  '7': '#e8e8f0',
  '8': '#08101e',
  '9': '#3a3a48',
  'a': '#ff6a1f',
  'b': '#ffd54a',
  'c': '#ff1a3a',
  'd': '#000',
};

// ── STYLE A: FTL-style chunky cruiser (16×16, side view, nose right) ──
const FTL_RED = {
  intact: `
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
................`,
};
const FTL_BLUE = {
  intact: `
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
.....02222.......
......0220......
................`,
};

// ── STYLE B: Side-scroller silhouette (X-wing/Rebel) 16×10 ──
const REBEL_RED = {
  intact: `
................
.......00.......
......0220......
.....022220.....
.000022222200000
.022222002222220
.000022222200000
.....022220.....
......0220......
................`,
};
const REBEL_BLUE = REBEL_RED;

// ── STYLE C: Futurama-cute round Planet Express vibe 16×12 ──
const CUTE_RED = {
  intact: `
................
.....002200.....
....02222220....
...0222442220...
..022224442220..
.02222244422220.
.02222222222220.
.05022222220500.
.05055000550500.
..056550055650..
....555..555....
................`,
};
const CUTE_BLUE = CUTE_RED;

// damage overlay generator — applies char swaps to a base sprite at certain pixels
// `level` 0..4 ; 0 intact, 4 explosion-frame
function applyDamage(base, level, rngSeed = 0) {
  if (level === 0) return base;
  // Build a seeded pseudo-random sequence
  const rand = (n) => {
    let x = Math.sin(rngSeed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const rows = base.rows.map(r => r.split(''));
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));

  // collect hull pixel coords
  const hullPx = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < (rows[y]?.length || 0); x++) {
      const c = rows[y][x];
      if (c !== '.' && c !== '8') hullPx.push([x, y, c]);
    }
  }

  if (level >= 1) {
    // light scratches: change some hull -> shadow color "1"
    const n = Math.floor(hullPx.length * 0.08);
    for (let i = 0; i < n; i++) {
      const [x, y] = hullPx[Math.floor(rand(i + 1) * hullPx.length)];
      if (rows[y][x] !== '.') rows[y][x] = '1';
    }
    // add a few smoke wisps above
    addSmoke(rows, 2, w, h, rand, 11);
  }
  if (level >= 2) {
    // fire patches
    const fires = Math.floor(hullPx.length * 0.12);
    for (let i = 0; i < fires; i++) {
      const [x, y] = hullPx[Math.floor(rand(i + 17) * hullPx.length)];
      rows[y][x] = i % 2 ? 'a' : 'b';
    }
    addSmoke(rows, 4, w, h, rand, 23);
  }
  if (level >= 3) {
    // critical: many pixels destroyed (.) or red-hot
    const destroyed = Math.floor(hullPx.length * 0.28);
    for (let i = 0; i < destroyed; i++) {
      const [x, y] = hullPx[Math.floor(rand(i + 41) * hullPx.length)];
      rows[y][x] = (i % 3 === 0) ? '.' : (i % 3 === 1) ? 'c' : 'a';
    }
    addSmoke(rows, 7, w, h, rand, 31);
  }
  if (level >= 4) {
    // explosion: replace bulk of ship with fire/smoke pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < (rows[y]?.length || 0); x++) {
        const c = rows[y][x];
        if (c !== '.') {
          const r = rand(y * 100 + x);
          if (r < 0.2) rows[y][x] = '.';
          else if (r < 0.5) rows[y][x] = 'a';
          else if (r < 0.75) rows[y][x] = 'b';
          else rows[y][x] = 'c';
        }
      }
    }
    // outward expanding star burst
    const cx = w / 2, cy = h / 2;
    for (let r = 0; r < 32; r++) {
      const ang = rand(r) * Math.PI * 2;
      const dist = 2 + rand(r + 7) * (Math.max(w, h) * 0.6);
      const px = Math.round(cx + Math.cos(ang) * dist);
      const py = Math.round(cy + Math.sin(ang) * dist);
      if (py >= 0 && py < h && px >= 0 && px < (rows[py]?.length || 0)) {
        rows[py][px] = r % 2 ? 'a' : 'b';
      }
    }
  }

  return { rows: rows.map(r => r.join('')), w, h };
}

function addSmoke(rows, count, w, h, rand, seed) {
  for (let i = 0; i < count; i++) {
    const sx = Math.floor(rand(seed + i) * w);
    const sy = Math.max(0, Math.floor(rand(seed + i + 7) * 3));
    // pad row if needed
    while (rows[sy].length < w) rows[sy].push('.');
    if (rows[sy][sx] === '.') rows[sy][sx] = '9';
    if (sy > 0 && rows[sy - 1] && rows[sy - 1][sx] === '.') {
      while (rows[sy - 1].length < w) rows[sy - 1].push('.');
      rows[sy - 1][sx] = '9';
    }
  }
}

// Render any sprite grid to a div grid (pure CSS pixel art — crisp at any size)
function PixelArt({ grid, palette, pixel = 6, glow = false, shake = false }) {
  const { rows, w, h } = parseSprite(grid);
  return (
    <div className={`pixel-grid ${glow ? 'pixel-glow' : ''} ${shake ? 'shake-hard' : ''}`} style={{
      gridTemplateColumns: `repeat(${w}, ${pixel}px)`,
      gridTemplateRows: `repeat(${h}, ${pixel}px)`,
      filter: glow ? 'drop-shadow(0 0 6px rgba(0,255,255,0.4))' : undefined,
    }}>
      {rows.flatMap((row, y) =>
        Array.from({ length: w }).map((_, x) => {
          const c = row[x] || '.';
          if (c === '.') return <i key={`${x}-${y}`} style={{ background: 'transparent' }} />;
          return <i key={`${x}-${y}`} style={{ background: palette[c] || '#f0f' }} />;
        })
      )}
    </div>
  );
}

function Ship({ style = 'ftl', team = 0, damage = 0, pixel = 6, shake, glow }) {
  // damage: 0=intact, 1=smoking, 2=fire, 3=critical, 4=explosion
  const base = useMemo(() => {
    if (style === 'rebel') return parseSprite((team === 0 ? REBEL_RED : REBEL_BLUE).intact);
    if (style === 'cute') return parseSprite((team === 0 ? CUTE_RED : CUTE_BLUE).intact);
    return parseSprite((team === 0 ? FTL_RED : FTL_BLUE).intact);
  }, [style, team]);
  const dmg = useMemo(() => applyDamage(base, damage, team * 100 + damage), [base, damage, team]);
  const pal = team === 0 ? PAL_RED : PAL_BLUE;
  const grid = dmg.rows.join('\n');
  const autoShake = damage >= 3;
  return (
    <PixelArt
      grid={grid}
      palette={pal}
      pixel={pixel}
      glow={glow}
      shake={shake ?? autoShake}
    />
  );
}

/* ──────────────────────────────────────────────────────────────
   PRESSURE GAUGE — semicircular instrument
   props:
     value      0..100 current needle position (also a number you can drive externally)
     target     optional 0..100 the secret target (transmitter screen) or true value (reveal)
     average    optional 0..100 the team's averaged guess (reveal)
     votes      optional [{value, color, name}] individual votes (reveal)
     interactive  if true, drag to set value (calls onChange)
     onChange   (v)=>void when interactive
     variant    'classic' | 'horizon' | 'pill'
     size       diameter in px
   ────────────────────────────────────────────────────────────── */
function PressureGauge({
  value = 50,
  target,
  average,
  votes,
  showTarget = false,
  interactive = false,
  onChange,
  variant = 'classic',
  size = 320,
  label = 'PRESSÃO',
  unit = 'kPa',
}) {
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const radius = size / 2;
  const innerR = radius * 0.62;
  const trackR = radius * 0.82;
  const arcStart = Math.PI; // pi rad (left)
  const arcEnd = 2 * Math.PI; // 2pi (right)

  // value (0..100) to angle in radians (PI..2PI)
  const valToAngle = (v) => arcStart + (Math.max(0, Math.min(100, v)) / 100) * (arcEnd - arcStart);

  const polar = (a, r) => ({
    x: radius + Math.cos(a) * r,
    y: radius + Math.sin(a) * r,
  });

  // Arc path from value a..b on radius r
  const arcPath = (a, b, r) => {
    const p1 = polar(a, r);
    const p2 = polar(b, r);
    const large = Math.abs(b - a) > Math.PI ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };

  // Mouse / touch handling
  const updateFromEvent = useCallback((clientX, clientY) => {
    if (!svgRef.current || !onChange) return;
    const rect = svgRef.current.getBoundingClientRect();
    // map client point to svg coords (size × size/2)
    const px = ((clientX - rect.left) / rect.width) * size;
    const py = ((clientY - rect.top) / rect.height) * (size / 2);
    const dx = px - radius;
    const dy = py - radius;
    let a = Math.atan2(dy, dx); // -pi..pi
    if (a < 0) a += 2 * Math.PI; // wrap so it's in our pi..2pi range
    // clamp
    if (a < Math.PI) {
      // top half: clamp to nearest end
      a = (a < Math.PI / 2) ? 2 * Math.PI : Math.PI;
    }
    const t = (a - Math.PI) / Math.PI;
    onChange(Math.max(0, Math.min(100, Math.round(t * 100))));
  }, [onChange, radius, size]);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e) => {
      if (!dragging.current) return;
      const t = e.touches ? e.touches[0] : e;
      updateFromEvent(t.clientX, t.clientY);
    };
    const onUp = () => { dragging.current = false; };
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
  }, [interactive, updateFromEvent]);

  const handleDown = (e) => {
    if (!interactive) return;
    e.preventDefault();
    dragging.current = true;
    const t = e.touches ? e.touches[0] : e;
    updateFromEvent(t.clientX, t.clientY);
  };

  // Visual zones - blue (0-40), green (40-60), red (60-100)
  const zoneBlue  = arcPath(valToAngle(0),  valToAngle(40), trackR);
  const zoneGreen = arcPath(valToAngle(40), valToAngle(60), trackR);
  const zoneRed   = arcPath(valToAngle(60), valToAngle(100), trackR);

  // tick marks
  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a = valToAngle(i);
    const major = i % 25 === 0;
    const r1 = trackR + (variant === 'pill' ? 10 : 14);
    const r2 = r1 + (major ? 10 : 5);
    const p1 = polar(a, r1);
    const p2 = polar(a, r2);
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? 'var(--ink)' : 'var(--ink-dim)'}
        strokeWidth={major ? 2 : 1}
      />
    );
  }
  // tick labels at 0/25/50/75/100
  const tickLabels = [0, 25, 50, 75, 100].map(i => {
    const a = valToAngle(i);
    const p = polar(a, trackR + 36);
    return (
      <text key={i} x={p.x} y={p.y + 4} textAnchor="middle"
        style={{ fontFamily: 'var(--f-read)', fontSize: 16, fill: 'var(--ink-dim)' }}>
        {i}
      </text>
    );
  });

  // needle
  const needleA = valToAngle(value);
  const needleTip = polar(needleA, trackR - 6);
  const needleBase1 = polar(needleA + Math.PI / 2, 6);
  const needleBase2 = polar(needleA - Math.PI / 2, 6);
  // we want needleBase relative to center, so:
  const baseA1 = needleA + Math.PI / 2;
  const baseA2 = needleA - Math.PI / 2;
  const baseR = 8;
  const nb1 = polar(baseA1, baseR);
  const nb2 = polar(baseA2, baseR);

  // value label at needle tip
  const tipLabel = polar(needleA, trackR + 12);

  // optional target marker
  let targetMarker = null;
  if (showTarget && target != null) {
    const a = valToAngle(target);
    const p1 = polar(a, trackR - 18);
    const p2 = polar(a, trackR + 18);
    targetMarker = (
      <g className="needle-glow-mint">
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="var(--neon-mint)" strokeWidth={3} />
        <circle cx={p1.x} cy={p1.y} r={4} fill="var(--neon-mint)" />
      </g>
    );
  }

  // optional average marker (reveal phase) - second needle in yellow over the green target
  let avgMarker = null;
  if (average != null) {
    const a = valToAngle(average);
    const tip = polar(a, trackR - 6);
    const bb1 = polar(a + Math.PI / 2, 7);
    const bb2 = polar(a - Math.PI / 2, 7);
    avgMarker = (
      <g className="needle-glow-yellow">
        <polygon
          points={`${tip.x},${tip.y} ${bb1.x},${bb1.y} ${bb2.x},${bb2.y}`}
          fill="var(--neon-amber)" stroke="#3a2a00" strokeWidth={1}
        />
      </g>
    );
  }

  // individual vote dots
  let voteDots = null;
  if (votes && votes.length) {
    voteDots = votes.map((v, i) => {
      const a = valToAngle(v.value);
      const p = polar(a, trackR - 22);
      return (
        <circle key={i} cx={p.x} cy={p.y} r={5}
          fill={v.color} stroke="#000" strokeWidth={1.5}
          opacity={0.95}
          style={{ filter: `drop-shadow(0 0 6px ${v.color})` }}
        />
      );
    });
  }

  return (
    <div className="gauge-wrap" style={{ position: 'relative', width: size, height: size / 2 + 80 }}>
      {/* readout box at center */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '54%',
        transform: 'translate(-50%, 0)',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div className="t-title" style={{ fontSize: 9, color: 'var(--ink-dim)' }}>{label}</div>
        <div className="t-read glow-text-amber" style={{
          fontSize: size * 0.16,
          marginTop: 4,
          filter: 'drop-shadow(0 0 8px rgba(255,224,0,0.6))',
        }}>
          {String(Math.round(value)).padStart(2, '0')}
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 12 }}>{unit}</div>
      </div>
      <svg
        ref={svgRef}
        width={size}
        height={size / 2 + 50}
        viewBox={`0 -10 ${size} ${size / 2 + 60}`}
        className="gauge-svg"
        onMouseDown={handleDown}
        onTouchStart={handleDown}
        style={{ cursor: interactive ? 'grab' : 'default', userSelect: 'none', touchAction: 'none' }}
      >
        {/* outer ring */}
        <path
          d={arcPath(arcStart, arcEnd, trackR + 28)}
          fill="none" stroke="var(--metal-2)" strokeWidth={2}
        />
        {/* bg track */}
        <path
          d={arcPath(arcStart, arcEnd, trackR)}
          fill="none" stroke="var(--space-1)" strokeWidth={22} strokeLinecap="butt"
        />
        {/* zones */}
        <path d={zoneBlue}  fill="none" stroke="var(--neon-blue)"  strokeWidth={18} strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,170,255,0.7))' }} />
        <path d={zoneGreen} fill="none" stroke="var(--neon-mint)"  strokeWidth={18} strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.7))' }} />
        <path d={zoneRed}   fill="none" stroke="var(--neon-coral)" strokeWidth={18} strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,51,85,0.7))' }} />
        {/* ticks */}
        {ticks}
        {tickLabels}
        {/* target (mint diamond) */}
        {targetMarker}
        {/* vote dots */}
        {voteDots}
        {/* average (yellow needle behind main) */}
        {avgMarker}
        {/* main needle */}
        <g className="needle-glow-yellow" style={{ transition: dragging.current ? 'none' : 'transform 0.25s cubic-bezier(.4,1.6,.5,1)' }}>
          <polygon
            points={`${needleTip.x},${needleTip.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`}
            fill="var(--neon-amber)" stroke="#3a2a00" strokeWidth={1.2}
          />
          <circle cx={radius} cy={radius} r={6} fill="#000" stroke="var(--neon-amber)" strokeWidth={2} />
        </g>
        {/* value badge near needle tip when interactive */}
        {interactive && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={tipLabel.x - 18} y={tipLabel.y - 11}
              width={36} height={20} rx={3}
              fill="var(--space-0)" stroke="var(--neon-amber)" strokeWidth={1.5}
            />
            <text x={tipLabel.x} y={tipLabel.y + 4} textAnchor="middle"
              style={{ fontFamily: 'var(--f-read)', fontSize: 16, fill: 'var(--neon-amber)' }}>
              {Math.round(value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   ROULETTE WHEEL — 12 spinning segments
   props: themes [{label, color}], spinning bool, target index, onSpinEnd
   ────────────────────────────────────────────────────────────── */
function RouletteWheel({ themes, size = 360, spinning, targetIndex, onSpinEnd }) {
  const [angle, setAngle] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (!spinning) return;
    finished.current = false;
    // 4-5 full rotations + land on targetIndex
    const segSize = 360 / themes.length;
    // pointer is at top (270deg / -90). we want target segment's MIDDLE under pointer.
    // svg drawn so segment 0 starts at angle 0 (top). Center of seg i = i*seg + seg/2
    // we want that center to align with 0 (pointer at top). So rotation = -centerAngle + N*360
    const centerOfTarget = targetIndex * segSize + segSize / 2;
    const finalRotation = 360 * 5 - centerOfTarget + (Math.random() - 0.5) * (segSize * 0.6);
    setAngle(finalRotation);
    const t = setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        onSpinEnd && onSpinEnd();
      }
    }, 4200);
    return () => clearTimeout(t);
  }, [spinning, targetIndex, themes.length, onSpinEnd]);

  const radius = size / 2;
  const segCount = themes.length;
  const segArc = (2 * Math.PI) / segCount;

  // Build segments as SVG paths
  const segments = themes.map((th, i) => {
    const a0 = -Math.PI / 2 + i * segArc;       // start at top
    const a1 = -Math.PI / 2 + (i + 1) * segArc;
    const p0 = { x: radius + Math.cos(a0) * radius, y: radius + Math.sin(a0) * radius };
    const p1 = { x: radius + Math.cos(a1) * radius, y: radius + Math.sin(a1) * radius };
    const d = `M ${radius} ${radius} L ${p0.x} ${p0.y} A ${radius} ${radius} 0 0 1 ${p1.x} ${p1.y} Z`;
    // label position
    const mid = (a0 + a1) / 2;
    const lr = radius * 0.7;
    const lx = radius + Math.cos(mid) * lr;
    const ly = radius + Math.sin(mid) * lr;
    const labelAngle = (mid * 180 / Math.PI) + 90;
    return { d, lx, ly, labelAngle, ...th };
  });

  return (
    <div className="wheel-wrap" style={{ width: size, height: size }}>
      <div className="wheel-pointer" />
      <div className="wheel-hub">
        <div className="t-title glow-text-cyan" style={{ fontSize: 10, textAlign: 'center' }}>
          GIRAR
        </div>
      </div>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: `rotate(${angle}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(.18,.85,.25,1)' : 'none',
          filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.25))',
        }}
      >
        <defs>
          <radialGradient id="wheel-shine" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="rgba(255,255,255,0.0)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </radialGradient>
        </defs>
        {segments.map((s, i) => (
          <g key={i}>
            <path d={s.d} fill={s.color} stroke="#000" strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 0 ${s.color})` }} />
            <text
              x={s.lx} y={s.ly}
              textAnchor="middle"
              transform={`rotate(${s.labelAngle} ${s.lx} ${s.ly})`}
              style={{
                fontFamily: 'var(--f-read)',
                fontSize: Math.max(13, size / 22),
                fill: '#0a0a1e',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {s.label}
            </text>
          </g>
        ))}
        <circle cx={radius} cy={radius} r={radius - 2} fill="url(#wheel-shine)" />
        <circle cx={radius} cy={radius} r={radius - 1}
          fill="none" stroke="var(--metal-2)" strokeWidth={3} />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SCOREBOARD TOP BAR
   props: teams [{name, color, hp, score, shipStyle}], round, totalRounds, onSettings
   ────────────────────────────────────────────────────────────── */
function ScoreBar({ teams, round, totalRounds, onSettings, compact = false }) {
  const [t0, t1] = teams;
  return (
    <div className="panel bevel" style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: compact ? 8 : 14,
      padding: compact ? '8px 10px' : '10px 14px',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #0c0e26, #07081a)',
      borderColor: 'var(--metal-2)',
    }}>
      <TeamPanel team={t0} flip={false} compact={compact} />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 60 }}>
        <div className="t-title text-dim" style={{ fontSize: 7 }}>RODADA</div>
        <div className="t-read glow-text-cyan" style={{ fontSize: compact ? 22 : 28 }}>
          {String(round).padStart(2,'0')}<span className="text-faded">/{String(totalRounds).padStart(2,'0')}</span>
        </div>
        <button
          onClick={onSettings}
          className="btn btn-ghost btn-icon"
          style={{ minHeight: 30, height: 30, width: 30, padding: 0, margin: '2px auto 0' }}
          title="Configurações"
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 1.5v2 M8 12.5v2 M1.5 8h2 M12.5 8h2 M3.5 3.5l1.4 1.4 M11.1 11.1l1.4 1.4 M3.5 12.5l1.4-1.4 M11.1 4.9l1.4-1.4"
              stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
      </div>
      <TeamPanel team={t1} flip={true} compact={compact} />
    </div>
  );
}

function TeamPanel({ team, flip, compact }) {
  const hpPct = Math.max(0, Math.min(100, (team.hp / team.maxHp) * 100));
  const damageLevel =
    hpPct === 0 ? 4 :
    hpPct <= 25 ? 3 :
    hpPct <= 50 ? 2 :
    hpPct <= 80 ? 1 : 0;
  const teamIdx = team.idx;
  const colorVar = teamIdx === 0 ? 'var(--team-0)' : 'var(--team-1)';
  return (
    <div style={{
      display: 'flex',
      flexDirection: flip ? 'row-reverse' : 'row',
      gap: 10,
      alignItems: 'center',
    }}>
      <div style={{ flex: '0 0 auto' }}>
        <Ship style={team.shipStyle || 'ftl'} team={teamIdx} damage={damageLevel} pixel={compact ? 2 : 3} />
      </div>
      <div style={{ flex: 1, textAlign: flip ? 'right' : 'left', minWidth: 0 }}>
        <div className="t-title" style={{
          fontSize: compact ? 9 : 10,
          color: colorVar,
          textShadow: `0 0 6px ${colorVar}`,
          marginBottom: 5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {team.name}
        </div>
        <div className="hpbar" style={{ borderColor: colorVar }}>
          <div className="hpbar-fill" style={{
            width: hpPct + '%',
            background: `linear-gradient(90deg, ${colorVar}, ${colorVar})`,
            boxShadow: `0 0 10px ${colorVar}`,
          }}>
            <div className="hpbar-cells" />
          </div>
        </div>
        <div className="t-mono" style={{
          fontSize: 13,
          color: colorVar,
          marginTop: 4,
          display: 'flex',
          justifyContent: flip ? 'flex-end' : 'flex-start',
          gap: 8,
        }}>
          <span>HP {team.hp}/{team.maxHp}</span>
          <span className="text-dim">·</span>
          <span>{team.score} PTS</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PLAYER AVATAR — initials in colored circle (or square pixel chip)
   ────────────────────────────────────────────────────────────── */
function Avatar({ name, color, size = 36, square = false, ring = false }) {
  const initials = (name || '??').split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || '?';
  return (
    <div style={{
      width: size,
      height: size,
      flex: '0 0 auto',
      background: color,
      color: '#0a0a1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: square ? 4 : '50%',
      fontFamily: 'var(--f-title)',
      fontSize: size * 0.32,
      border: '2px solid #000',
      boxShadow: ring ? `0 0 0 2px ${color}, 0 0 12px ${color}` : `inset 0 -3px 0 rgba(0,0,0,0.25)`,
      letterSpacing: '0.04em',
    }}>
      {initials}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   CONFETTI burst — used on reveal/game over
   ────────────────────────────────────────────────────────────── */
function Confetti({ count = 60, colors = ['#00ffff', '#ff3355', '#00aaff', '#ffe000', '#00ff88', '#b066ff'], duration = 3 }) {
  const bits = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      dur: duration * (0.7 + Math.random() * 0.6),
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      size: 4 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 200,
    })),
  [count, duration, colors]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate3d(0, -20px, 0) rotate(0); opacity: 1; }
          100% { transform: translate3d(var(--cx, 0), 100vh, 0) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {bits.map((b, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: b.left + '%',
          top: -10,
          width: b.size,
          height: b.size * 1.5,
          background: b.color,
          opacity: 0.95,
          animation: `confetti-fall ${b.dur}s cubic-bezier(.3,.4,.5,1) ${b.delay}s forwards`,
          '--cx': b.drift + 'px',
          boxShadow: `0 0 6px ${b.color}`,
        }} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SOUND ICON (mock — visual only)
   ────────────────────────────────────────────────────────────── */
function SoundIcon({ on = true, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M3 10v4h4l5 4V6L7 10H3z" fill={color}/>
      {on
        ? <path d="M16 8c2 2 2 6 0 8 M19 5c4 4 4 10 0 14"
            stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        : <path d="M16 9l6 6 M22 9l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      }
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   PIXEL LOGO — UNDER PRESSURE wordmark in pixel-style
   Just the chunky title with a small ship glyph above
   ────────────────────────────────────────────────────────────── */
function PixelLogo({ shipStyle = 'ftl', size = 'lg', tagline = 'PARTY GAME · ESPAÇO PROFUNDO' }) {
  const titleSize = size === 'lg' ? 28 : size === 'md' ? 18 : 12;
  const subSize = size === 'lg' ? 9 : size === 'md' ? 8 : 7;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size === 'lg' ? 14 : 8 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Ship style={shipStyle} team={0} damage={1} pixel={size === 'lg' ? 4 : 2} />
        <Ship style={shipStyle} team={1} damage={2} pixel={size === 'lg' ? 4 : 2} />
      </div>
      <div className="t-title glow-text-cyan flicker" style={{
        fontSize: titleSize,
        textAlign: 'center',
        lineHeight: 1.25,
      }}>
        UNDER<br/>PRESSURE
      </div>
      <div className="t-title text-dim" style={{ fontSize: subSize, letterSpacing: '0.18em' }}>
        {tagline}
      </div>
    </div>
  );
}

// Theme wheel data
const THEMES_PT = [
  { label: 'FILMES',   color: '#ff3355' },
  { label: 'COMIDA',   color: '#ffb84d' },
  { label: 'CIÊNCIA',  color: '#00ffff' },
  { label: 'ESPORTE',  color: '#00ff88' },
  { label: 'MÚSICA',   color: '#b066ff' },
  { label: 'NATUREZA', color: '#3ed64a' },
  { label: 'HISTÓRIA', color: '#ffd54a' },
  { label: 'GAMES',    color: '#00aaff' },
  { label: 'TRABALHO', color: '#ff6a1f' },
  { label: 'MENTE',    color: '#ff66aa' },
  { label: 'ESPAÇO',   color: '#7ec8ff' },
  { label: 'POP',      color: '#ffe000' },
];
const THEMES_EN = [
  { label: 'FILMS',   color: '#ff3355' },
  { label: 'FOOD',    color: '#ffb84d' },
  { label: 'SCIENCE', color: '#00ffff' },
  { label: 'SPORTS',  color: '#00ff88' },
  { label: 'MUSIC',   color: '#b066ff' },
  { label: 'NATURE',  color: '#3ed64a' },
  { label: 'HISTORY', color: '#ffd54a' },
  { label: 'GAMES',   color: '#00aaff' },
  { label: 'WORK',    color: '#ff6a1f' },
  { label: 'MIND',    color: '#ff66aa' },
  { label: 'SPACE',   color: '#7ec8ff' },
  { label: 'POP',     color: '#ffe000' },
];

const STRINGS = {
  pt: {
    create: 'CRIAR NAVE',
    board: 'EMBARCAR',
    name_placeholder: 'NOME DO PILOTO',
    pt: 'PT', en: 'EN',
    start_mission: 'INICIAR MISSÃO',
    transmitter: 'TRANSMISSOR',
    calibrate: 'CALIBRAR',
    watch: 'OBSERVAR',
    rounds: 'RODADAS',
    damage_limit: 'LIMITE DE DANO',
    timer: 'TEMPORIZADOR',
    spin: 'GIRAR ROLETA',
    thinking: 'transmissor está pensando…',
    your_clue: 'SUA PISTA',
    one_word: 'uma palavra',
    confirm: 'CONFIRMAR',
    revote: 'AJUSTAR',
    target: 'ALVO',
    average: 'MÉDIA',
    grade: { perfect:'PERFEITO!', vc:'MUITO PERTO', c:'PERTO', r:'RAZOÁVEL', f:'LONGE' },
    you: 'VOCÊ', captain: 'CAPITÃ',
    next_round: 'PRÓXIMA RODADA',
    new_mission: 'NOVA MISSÃO',
    new_crew: 'NOVA TRIPULAÇÃO',
    leave: 'SAIR DA SALA',
    settings: 'CONFIGURAÇÕES',
    volume: 'VOLUME',
    language: 'IDIOMA',
    room: 'CÓDIGO DA SALA',
    final_score: 'PONTUAÇÃO FINAL',
    crew_destroyed: 'TRIPULAÇÃO DESTRUÍDA',
    crew_survived: 'TRIPULAÇÃO SOBREVIVEU',
    best_transmitter: 'MELHOR TRANSMISSOR',
    best_hit: 'MELHOR ACERTO',
    worst_miss: 'PIOR ERRO',
    role_transmitter: '📡 VOCÊ TRANSMITE',
    role_calibrate:   '🎯 VOCÊ CALIBRA',
    role_watch:       '👁 VOCÊ OBSERVA',
  },
  en: {
    create: 'CREATE SHIP',
    board: 'BOARD SHIP',
    name_placeholder: 'PILOT NAME',
    pt: 'PT', en: 'EN',
    start_mission: 'START MISSION',
    transmitter: 'TRANSMITTER',
    calibrate: 'CALIBRATE',
    watch: 'WATCH',
    rounds: 'ROUNDS',
    damage_limit: 'DAMAGE LIMIT',
    timer: 'TIMER',
    spin: 'SPIN WHEEL',
    thinking: 'transmitter is thinking…',
    your_clue: 'YOUR CLUE',
    one_word: 'one word',
    confirm: 'CONFIRM',
    revote: 'ADJUST',
    target: 'TARGET',
    average: 'AVERAGE',
    grade: { perfect:'PERFECT!', vc:'VERY CLOSE', c:'CLOSE', r:'REASONABLE', f:'FAR' },
    you: 'YOU', captain: 'CAPTAIN',
    next_round: 'NEXT ROUND',
    new_mission: 'NEW MISSION',
    new_crew: 'NEW CREW',
    leave: 'LEAVE ROOM',
    settings: 'SETTINGS',
    volume: 'VOLUME',
    language: 'LANGUAGE',
    room: 'ROOM CODE',
    final_score: 'FINAL SCORE',
    crew_destroyed: 'CREW DESTROYED',
    crew_survived: 'CREW SURVIVED',
    best_transmitter: 'BEST TRANSMITTER',
    best_hit: 'BEST HIT',
    worst_miss: 'WORST MISS',
    role_transmitter: '📡 YOU TRANSMIT',
    role_calibrate:   '🎯 YOU CALIBRATE',
    role_watch:       '👁 YOU WATCH',
  },
};

Object.assign(window, {
  Starfield, Ship, PixelArt, PressureGauge, RouletteWheel,
  ScoreBar, TeamPanel, Avatar, Confetti, SoundIcon, PixelLogo,
  THEMES_PT, THEMES_EN, STRINGS,
  PAL_RED, PAL_BLUE,
});
