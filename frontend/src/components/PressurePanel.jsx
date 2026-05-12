import React, { useRef, useCallback, useEffect } from 'react';
import { tCard } from '../i18n.js';

// ── Geometry ────────────────────────────────────────────────────────────────
const CX = 150, CY = 162, R = 124, RNEEDLE = 108;

const toAngle = v => 180 - v * 1.8;                          // v→angle (math°)
const pt = (deg, r) => ({                                     // angle→SVG point
  x: CX + r * Math.cos(deg * Math.PI / 180),
  y: CY - r * Math.sin(deg * Math.PI / 180),
});
const arc = (v1, v2, r) => {                                  // track arc path
  const p1 = pt(toAngle(v1), r), p2 = pt(toAngle(v2), r);
  return `M${p1.x},${p1.y} A${r},${r} 0 0,0 ${p2.x},${p2.y}`;
};

// ── Needle (triangle pointing outward from center) ───────────────────────────
function Needle({ value, color, glowColor, width = 7, len = RNEEDLE }) {
  const a    = toAngle(value);
  const tip  = pt(a, len);
  const base = pt(a + 180, 14);
  const l    = pt(a + 90, width);
  const r    = pt(a - 90, width);
  return (
    <g style={{ filter: `drop-shadow(0 0 7px ${glowColor || color})` }}>
      <polygon
        points={`${tip.x},${tip.y} ${l.x},${l.y} ${base.x},${base.y} ${r.x},${r.y}`}
        fill={color} stroke="rgba(255,255,255,0.55)" strokeWidth={1}
      />
    </g>
  );
}

// ── Badge with value near needle tip ────────────────────────────────────────
function Badge({ value, color, extraR = 20 }) {
  const p = pt(toAngle(value), RNEEDLE + extraR);
  return (
    <g>
      <rect x={p.x - 19} y={p.y - 12} width={38} height={24} rx={5} ry={5}
        fill="rgba(0,0,0,0.82)" stroke={color} strokeWidth={1.5} />
      <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={13} fontFamily="Space Mono, monospace" fontWeight="700">
        {Math.round(value)}
      </text>
    </g>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PressurePanel({
  card, lang,
  value, onChange,
  disabled = false,
  showTarget = null,
  otherVotes = [], players = [],
}) {
  const svgRef   = useRef(null);
  const dragging = useRef(false);

  const eventToValue = useCallback(e => {
    const svg = svgRef.current; if (!svg) return value;
    const rect = svg.getBoundingClientRect();
    const cx   = e.touches ? e.touches[0].clientX : e.clientX;
    const cy   = e.touches ? e.touches[0].clientY : e.clientY;
    const svgX = ((cx - rect.left) / rect.width)  * 300;
    const svgY = ((cy - rect.top)  / rect.height) * 190;
    let deg = Math.atan2(CY - svgY, svgX - CX) * 180 / Math.PI;
    deg = Math.max(0, Math.min(180, deg));
    return Math.round(Math.max(0, Math.min(100, (180 - deg) / 1.8)));
  }, [value]);

  const onDown = useCallback(e => {
    if (disabled) return;
    e.preventDefault(); dragging.current = true; onChange(eventToValue(e));
  }, [disabled, onChange, eventToValue]);

  const onMove = useCallback(e => {
    if (!dragging.current || disabled) return;
    e.preventDefault(); onChange(eventToValue(e));
  }, [disabled, onChange, eventToValue]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  const leftLabel  = tCard(card, 'left',  lang);
  const rightLabel = tCard(card, 'right', lang);

  return (
    <div className="pressure-panel pixel-box">
      <svg
        ref={svgRef}
        viewBox="0 0 300 190"
        style={{
          width: '100%', maxWidth: 460, display: 'block', margin: '0 auto',
          cursor: disabled ? 'default' : 'crosshair',
          touchAction: 'none', userSelect: 'none',
        }}
        onPointerDown={onDown}
        onTouchStart={onDown}
      >
        {/* ── Background track ── */}
        <path d={arc(0, 100, R)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={14} strokeLinecap="round"/>

        {/* ── Zone colour segments on track (subtle, no fill between 0→value) ── */}
        <path d={arc(0,  42, R)} fill="none" stroke="rgba(40,80,255,0.35)"  strokeWidth={14} strokeLinecap="round"/>
        <path d={arc(42, 58, R)} fill="none" stroke="rgba(0,200,120,0.35)"  strokeWidth={14} strokeLinecap="round"/>
        <path d={arc(58,100, R)} fill="none" stroke="rgba(255,80,40,0.35)"  strokeWidth={14} strokeLinecap="round"/>

        {/* ── Tick marks at 0, 25, 50, 75, 100 ── */}
        {[0, 25, 50, 75, 100].map(v => {
          const o = pt(toAngle(v), R + 9), i = pt(toAngle(v), R - 9);
          const tp = pt(toAngle(v), R + 24);
          return (
            <g key={v}>
              <line x1={o.x} y1={o.y} x2={i.x} y2={i.y}
                stroke="rgba(255,255,255,0.55)" strokeWidth={2.5}/>
              <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.4)" fontSize={10}
                fontFamily="Space Mono, monospace">{v}</text>
            </g>
          );
        })}

        {/* ── Individual vote dots (reveal only) ── */}
        {otherVotes.map(({ playerId, position }) => {
          const p = players.find(pl => pl.id === playerId);
          if (!p) return null;
          const pos = pt(toAngle(position), R);
          return (
            <g key={playerId}>
              <circle cx={pos.x} cy={pos.y} r={7}
                fill={p.color} stroke="rgba(0,0,0,0.6)" strokeWidth={2}/>
            </g>
          );
        })}

        {/* ── Target needle (reveal) ── */}
        {showTarget !== null && (
          <>
            <Needle value={showTarget} color="#00e88f" glowColor="#00ff88" width={9}/>
            <Badge  value={showTarget} color="#00e88f" extraR={24}/>
          </>
        )}

        {/* ── Main / voter needle ── */}
        {!disabled && (
          <>
            <Needle value={value} color="#ffe000" glowColor="#ffcc00" width={8}/>
            <Badge  value={value} color="#ffe000"/>
          </>
        )}

        {/* ── Center hub ── */}
        <circle cx={CX} cy={CY} r={16} fill="#080c1a" stroke="rgba(0,212,255,0.45)" strokeWidth={2}/>
        <circle cx={CX} cy={CY} r={6}  fill="#00d4ff"/>

        {/* ── Spectrum end arrows ── */}
        <text x={pt(toAngle(0),   R + 20).x - 2} y={CY + 12} textAnchor="end"
          fill="rgba(140,160,255,0.7)" fontSize={11}
          fontFamily="'Press Start 2P', monospace">←</text>
        <text x={pt(toAngle(100), R + 20).x + 2} y={CY + 12} textAnchor="start"
          fill="rgba(255,160,120,0.7)" fontSize={11}
          fontFamily="'Press Start 2P', monospace">→</text>
      </svg>

      {/* Word labels */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'2px 20px 8px', gap:8 }}>
        <span style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:12, color:'rgba(140,160,255,0.85)', maxWidth:'44%', wordBreak:'break-word' }}>
          ← {leftLabel}
        </span>
        <span style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:12, color:'rgba(255,160,120,0.85)', maxWidth:'44%', wordBreak:'break-word', textAlign:'right' }}>
          {rightLabel} →
        </span>
      </div>

      {!disabled && (
        <p style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--dim2)', textAlign:'center', paddingBottom:4 }}>
          {lang === 'pt' ? 'arraste a agulha para votar' : 'drag the needle to vote'}
        </p>
      )}
    </div>
  );
}
