import React, { useRef, useCallback, useEffect } from 'react';
import { tCard } from '../i18n.js';

const DEFAULT_SIZE = 320;

function abbrev(name = '') {
  const w = String(name).trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  if (w.length >= 2) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  return w[0].slice(0, 2).toUpperCase();
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * (Math.PI / 180);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export default function PressurePanel({
  card,
  lang,
  value = 50,
  onChange,
  disabled = false,
  showNeedle = false,
  showTarget = null,
  showAverage = null,
  showMyVote = null,
  readoutLabel,
  otherVotes = [],
  players = [],
  size: sizeProp,
}) {
  const svgRef   = useRef(null);
  const dragging = useRef(false);
  const idBase   = useRef(null);
  if (!idBase.current) idBase.current = `mfd-${Math.random().toString(36).slice(2)}`;

  const size    = sizeProp || DEFAULT_SIZE;
  const R       = size / 2;          // center / radius of bounding circle
  const trackR  = R * 0.76;         // ~122 for size=320
  const arcStart = Math.PI;
  const arcEnd   = 2 * Math.PI;

  const uid = (k) => `${idBase.current}-${k}`;

  const polar = (angle, len) => ({
    x: R + Math.cos(angle) * len,
    y: R + Math.sin(angle) * len,
  });

  const valToAngle = (v) =>
    arcStart + Math.max(0, Math.min(100, v)) / 100 * (arcEnd - arcStart);

  const arcPath = (a0, a1, len) => {
    const p0 = polar(a0, len);
    const p1 = polar(a1, len);
    const lg = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    return `M ${p0.x} ${p0.y} A ${len} ${len} 0 ${lg} 1 ${p1.x} ${p1.y}`;
  };

  // ── Drag interaction ──────────────────────────────────────────────────────

  const getAngle = useCallback((cx, cy) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((cx - rect.left) / rect.width) * size;
    const py = ((cy - rect.top)  / rect.height) * (size / 2);
    const dx = px - R, dy = py - R;
    let a = Math.atan2(dy, dx);
    if (a < 0) a += 2 * Math.PI;
    if (a < Math.PI) a = a < Math.PI / 2 ? 2 * Math.PI : Math.PI;
    return Math.max(0, Math.min(100, Math.round((a - Math.PI) / Math.PI * 100)));
  }, [R, size]);

  const onDown = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    dragging.current = true;
    const t = e.touches?.[0] ?? e;
    const v = getAngle(t.clientX, t.clientY);
    if (v !== null) onChange?.(v);
  }, [disabled, getAngle, onChange]);

  const onMove = useCallback((e) => {
    if (!dragging.current || disabled) return;
    e.preventDefault();
    const t = e.touches?.[0] ?? e;
    const v = getAngle(t.clientX, t.clientY);
    if (v !== null) onChange?.(v);
  }, [disabled, getAngle, onChange]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    if (disabled) return undefined;
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
  }, [disabled, onMove, onUp]);

  // ── Layout ────────────────────────────────────────────────────────────────

  const svgH = size / 2 + 76;                     // extra height for bottom labels
  const vb   = `0 -12 ${size} ${size / 2 + 86}`;  // viewBox
  const showPointer = !disabled || showNeedle;

  // ── Needle geometry ───────────────────────────────────────────────────────

  const nAngle  = valToAngle(value);
  const nTip    = polar(nAngle, trackR - 4);
  const nBase   = polar(nAngle, -10);
  const nLeft   = polar(nAngle + Math.PI / 2, 5);
  const nRight  = polar(nAngle - Math.PI / 2, 5);
  const nShimL  = polar(nAngle + Math.PI / 2, 1.5);
  const nShimR  = polar(nAngle - Math.PI / 2, 1.5);
  const nShimT  = polar(nAngle, trackR - 8);

  // ── Tick marks ────────────────────────────────────────────────────────────

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a     = valToAngle(i);
    const major = i % 25 === 0;
    const mid   = i % 10 === 0 && !major;
    const r0    = trackR + 13;
    const r1    = trackR + (major ? 28 : mid ? 21 : 16);
    const p0    = polar(a, r0);
    const p1    = polar(a, r1);
    ticks.push(
      <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}
        stroke={major ? 'rgba(110,165,255,.95)' : mid ? 'rgba(65,110,210,.65)' : 'rgba(30,58,145,.48)'}
        strokeWidth={major ? 2.2 : mid ? 1.4 : 0.8}
        strokeLinecap="round" />
    );
    // Minor subtick halfway between 5-unit marks
    if (i < 100) {
      const a2 = valToAngle(i + 2.5);
      const q0 = polar(a2, trackR + 13);
      const q1 = polar(a2, trackR + 13);
      // skip — too dense; keep clean
    }
  }

  // ── Numeric labels (25/50/75 only — 0 and 100 land off-screen at arc edges) ─

  const numLabels = [25, 50, 75].map(v => {
    const pt = polar(valToAngle(v), trackR + 42);
    return (
      <text key={v} x={pt.x} y={pt.y + 4} textAnchor="middle"
        style={{ fontFamily:'var(--f-read)', fontSize:16, fill:'rgba(72,126,235,.82)' }}>
        {v}
      </text>
    );
  });

  // ── Target marker (diamond) ───────────────────────────────────────────────

  let targetEl = null;
  if (showTarget !== null) {
    const a    = valToAngle(showTarget);
    const perp = { x: -Math.sin(a), y: Math.cos(a) };
    const top  = polar(a, trackR + 18);
    const bot  = polar(a, trackR - 22);
    const mid  = polar(a, trackR);
    const d1   = { x: mid.x + perp.x * 5.5, y: mid.y + perp.y * 5.5 };
    const d2   = { x: mid.x - perp.x * 5.5, y: mid.y - perp.y * 5.5 };
    targetEl = (
      <g style={{ filter:'drop-shadow(0 0 8px rgba(0,255,136,.95))' }}>
        <line x1={bot.x} y1={bot.y} x2={top.x} y2={top.y} stroke="#00ff88" strokeWidth={2.5} />
        <polygon points={`${top.x},${top.y} ${d1.x},${d1.y} ${bot.x},${bot.y} ${d2.x},${d2.y}`}
          fill="#00ff88" />
      </g>
    );
  }

  // ── My-vote marker (dashed cyan line) ─────────────────────────────────────

  let myVoteEl = null;
  if (showMyVote !== null) {
    const a   = valToAngle(showMyVote);
    const top = polar(a, trackR + 20);
    const bot = polar(a, trackR - 22);
    myVoteEl = (
      <g style={{ filter:'drop-shadow(0 0 6px rgba(0,255,255,.85))' }}>
        <line x1={bot.x} y1={bot.y} x2={top.x} y2={top.y}
          stroke="#00ffff" strokeWidth={2} strokeDasharray="5 3.5" />
        <circle cx={top.x} cy={top.y} r={4} fill="#00ffff" />
      </g>
    );
  }

  // ── Average marker ────────────────────────────────────────────────────────

  let avgEl = null;
  if (showAverage !== null) {
    const a  = valToAngle(showAverage);
    const tp = polar(a, trackR - 5);
    const bA = polar(a + Math.PI / 2, 7);
    const bB = polar(a - Math.PI / 2, 7);
    avgEl = (
      <g style={{ filter:'drop-shadow(0 0 6px rgba(255,224,0,.85))' }}>
        <polygon points={`${tp.x},${tp.y} ${bA.x},${bA.y} ${bB.x},${bB.y}`}
          fill="#ffe000" stroke="#2a1a00" strokeWidth={1} />
      </g>
    );
  }

  // ── Player markers: hex chips on inward poles ─────────────────────────────

  // Sort by position for consistent alternating depth
  const sortedVotes = [...otherVotes]
    .filter(v => v.position !== null && Number.isFinite(v.position))
    .sort((a, b) => a.position - b.position);

  const playerEls = sortedVotes.map(({ playerId, position }, si) => {
    const player = players.find(p => p.id === playerId);
    const color  = player?.color ?? '#6688cc';
    const label  = player?.rank != null ? `#${player.rank}` : abbrev(player?.name || '');
    const isRank = player?.rank != null;
    const a      = valToAngle(position);

    // Alternate hex depth so overlapping votes don't collide
    const chipR    = trackR - (si % 2 === 0 ? 30 : 48);
    const stemTop  = polar(a, trackR - 2);
    const chipPt   = polar(a, chipR);
    const hexR     = 10;

    return (
      <g key={playerId}>
        {/* Thin radial pole */}
        <line x1={stemTop.x} y1={stemTop.y} x2={chipPt.x} y2={chipPt.y}
          stroke={color} strokeWidth={1.1} opacity={0.55} />
        {/* Tick notch on the arc */}
        <circle cx={stemTop.x} cy={stemTop.y} r={2.2} fill={color} opacity={0.9} />
        {/* Hex chip */}
        <g style={{ filter:`drop-shadow(0 0 4px ${color}88)` }}>
          <polygon points={hexPoints(chipPt.x, chipPt.y, hexR)}
            fill="#04060f" stroke={color} strokeWidth={1.3} />
          <text x={chipPt.x} y={chipPt.y + 4} textAnchor="middle"
            style={{
              fontFamily: isRank ? 'var(--f-read)' : 'var(--f-body)',
              fontSize: isRank ? 12 : 8,
              fill: color,
              fontWeight: 900,
              letterSpacing: '0.02em',
              pointerEvents: 'none',
            }}>
            {label}
          </text>
        </g>
      </g>
    );
  });

  // ── Spectrum labels (HTML, rendered below SVG) ────────────────────────────

  const leftLabel  = tCard(card, 'left', lang)  || '';
  const rightLabel = tCard(card, 'right', lang) || '';

  return (
    <div className="pressure-panel pressure-panel--combat"
      style={{ position:'relative', width:'100%', maxWidth:size, margin:'0 auto' }}>

      {/* ── Spectrum endpoint labels (above gauge, clear of the readout) ── */}
      <div className="pressure-axis-labels">
        <span title={leftLabel}>◀ {leftLabel}</span>
        <span title={rightLabel}>{rightLabel} ▶</span>
      </div>

      {/* CRT readout overlay (HTML, absolute-positioned over SVG) */}
      <div className="pressure-gauge-wrap"
        style={{ '--pressure-readout-top': `${(R / (svgH + 10)) * 100}%` }}>

        <div className="pressure-readout pressure-readout--combat">
          <div className="pressure-readout__label">
            {readoutLabel || (lang === 'pt' ? 'PRESSAO' : 'PRESSURE')}
          </div>
          <div className="pressure-readout__value">
            {String(Math.round(value)).padStart(2, '0')}
          </div>
        </div>

        <svg ref={svgRef}
          width="100%" height={svgH} viewBox={vb}
          className="gauge-svg gauge-svg--combat"
          onMouseDown={onDown} onTouchStart={onDown}
          style={{ cursor:disabled?'default':'grab', userSelect:'none', touchAction:'none', display:'block' }}>

          <defs>
            {/* Glow filter */}
            <filter id={uid('glow')} x="-40%" y="-80%" width="180%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Soft blur */}
            <filter id={uid('soft')} x="-30%" y="-70%" width="160%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            {/* Spectrum gradient: blue(cold/left) → amber/red(warm/right) */}
            <linearGradient id={uid('grad')} x1="0" y1="0" x2={size} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#1244dd" stopOpacity="0.92" />
              <stop offset="22%"  stopColor="#0077bb" stopOpacity="0.82" />
              <stop offset="45%"  stopColor="#1a3f6a" stopOpacity="0.72" />
              <stop offset="58%"  stopColor="#6a3a10" stopOpacity="0.72" />
              <stop offset="78%"  stopColor="#cc5500" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#ee2244" stopOpacity="0.92" />
            </linearGradient>
            {/* Bezel rim gradient */}
            <linearGradient id={uid('rim')} x1="0" y1="0" x2={size} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#1a2560" stopOpacity="0.55" />
              <stop offset="50%"  stopColor="#0d1535" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1a2560" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          {/* ── Outer bezel ─────────────────────────────────────────────── */}
          <path d={arcPath(arcStart - 0.05, arcEnd + 0.05, trackR + 46)}
            fill="none" stroke="#05070d" strokeWidth={32} />
          {/* Bezel metallic rim */}
          <path d={arcPath(arcStart, arcEnd, trackR + 48)}
            fill="none" stroke={`url(#${uid('rim')})`} strokeWidth={2.5} />
          <path d={arcPath(arcStart, arcEnd, trackR + 31)}
            fill="none" stroke="rgba(45,65,160,.18)" strokeWidth={1} />

          {/* ── Track substrate ─────────────────────────────────────────── */}
          <path d={arcPath(arcStart, arcEnd, trackR)}
            fill="none" stroke="#03050b" strokeWidth={30} />

          {/* ── Spectrum gradient track ─────────────────────────────────── */}
          <path d={arcPath(arcStart, arcEnd, trackR)}
            fill="none" stroke={`url(#${uid('grad')})`}
            strokeWidth={24} strokeLinecap="butt"
            style={{ filter:`url(#${uid('soft')})` }} />

          {/* Track edge highlights (depth illusion) */}
          <path d={arcPath(arcStart, arcEnd, trackR + 10)}
            fill="none" stroke="rgba(0,0,0,.6)" strokeWidth={4} />
          <path d={arcPath(arcStart, arcEnd, trackR - 10)}
            fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={4} />
          {/* Very subtle surface sheen */}
          <path d={arcPath(arcStart, arcEnd, trackR + 11)}
            fill="none" stroke="rgba(90,140,255,.07)" strokeWidth={2} />

          {/* Inner dashed ring */}
          <path d={arcPath(arcStart, arcEnd, trackR - 26)}
            fill="none" stroke="rgba(38,70,190,.18)"
            strokeWidth={1} strokeDasharray="4 8" />

          {/* ── Tick marks and labels ────────────────────────────────────── */}
          {ticks}
          {numLabels}

          {/* Zone separators at 1/3 and 2/3 */}
          {[33, 67].map(v => {
            const a  = valToAngle(v);
            const p0 = polar(a, trackR - 13);
            const p1 = polar(a, trackR + 13);
            return <line key={v} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}
              stroke="rgba(80,120,255,.22)" strokeWidth={1.5} />;
          })}

          {/* Arc endpoint terminator lines (thin, well inside bezel zone) */}
          {[arcStart, arcEnd].map((a, i) => {
            const inner = polar(a, trackR - 14);
            const outer = polar(a, trackR + 12);
            return (
              <line key={i}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke="rgba(60,100,200,.28)" strokeWidth={1.5} strokeLinecap="round" />
            );
          })}

          {/* ── Markers (drawn before needle so needle is on top) ─────────── */}
          {targetEl}
          {myVoteEl}
          {playerEls}
          {avgEl}

          {/* ── Needle ──────────────────────────────────────────────────── */}
          {showPointer && (
            <g className="needle-glow-cyan"
              style={{ transition: dragging.current ? 'none' : 'transform 0.2s cubic-bezier(.4,1.6,.5,1)' }}>
              {/* Drop shadow */}
              <polygon
                points={`${nTip.x},${nTip.y} ${nLeft.x},${nLeft.y} ${nBase.x},${nBase.y} ${nRight.x},${nRight.y}`}
                fill="rgba(0,0,0,.45)" filter={`url(#${uid('soft')})`} />
              {/* Main body */}
              <polygon
                points={`${nTip.x},${nTip.y} ${nLeft.x},${nLeft.y} ${nBase.x},${nBase.y} ${nRight.x},${nRight.y}`}
                fill="#2255bb" stroke="rgba(0,8,30,.85)" strokeWidth={0.8} />
              {/* Shimmer highlight stripe */}
              <polygon
                points={`${nShimT.x},${nShimT.y} ${nShimL.x},${nShimL.y} ${nBase.x},${nBase.y} ${nShimR.x},${nShimR.y}`}
                fill="rgba(140,185,255,.28)" />
              {/* Bright tip */}
              <circle cx={nTip.x} cy={nTip.y} r={3} fill="#99ccff" opacity={0.85} />
              {/* Center hub ring */}
              <circle cx={R} cy={R} r={14} fill="#060a1a" stroke="rgba(55,95,215,.65)" strokeWidth={2} />
              <circle cx={R} cy={R} r={9}  fill="#080d22" stroke="rgba(65,110,240,.38)" strokeWidth={1} />
              {/* Hub center pip */}
              <circle cx={R} cy={R} r={3.5} fill="rgba(100,155,255,.9)" />
              <circle cx={R} cy={R} r={1.5} fill="#fff" opacity={0.7} />
            </g>
          )}

          {/* Value badge near needle tip */}
          {showPointer && (() => {
            const lp = polar(nAngle, trackR + 15);
            const bx = lp.x - 21, by = lp.y - 11;
            const bw = 42, bh = 20;
            return (
              <g style={{ pointerEvents:'none' }}>
                <rect x={bx} y={by} width={bw} height={bh} rx={2}
                  fill="#020610" stroke="rgba(48,88,205,.62)" strokeWidth={1.2} opacity={0.96} />
                {/* Corner bracket accents */}
                {[[bx,by],[bx+bw,by],[bx,by+bh],[bx+bw,by+bh]].map(([px,py], i) => {
                  const sx = px === bx ? 1 : -1;
                  const sy = py === by ? 1 : -1;
                  return (
                    <g key={i} stroke="#3a6ecc" strokeWidth={1.1} strokeLinecap="round">
                      <line x1={px} y1={py} x2={px + sx*5} y2={py} />
                      <line x1={px} y1={py} x2={px} y2={py + sy*4} />
                    </g>
                  );
                })}
                <text x={lp.x} y={lp.y + 4} textAnchor="middle"
                  style={{ fontFamily:'var(--f-read)', fontSize:16, fill:'#7aaeff' }}>
                  {Math.round(value)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
