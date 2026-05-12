/**
 * PressurePanel — exact port of the Claude Design template's PressureGauge.
 * Coordinate system: center (radius, radius), arc from π to 2π (left→bottom→right),
 * viewBox clips to show only the upper semicircle.
 */
import React, { useRef, useCallback, useEffect } from 'react';
import { tCard } from '../i18n.js';

const DEFAULT_SIZE = 320;

export default function PressurePanel({
  card, lang,
  value = 50, onChange,
  disabled = false,
  showTarget = null,
  otherVotes = [], players = [],
  size: sizeProp,
}) {
  const svgRef   = useRef(null);
  const dragging = useRef(false);

  // Use responsive size
  const size    = sizeProp || DEFAULT_SIZE;
  const radius  = size / 2;
  const trackR  = radius * 0.82;
  const arcStart = Math.PI;         // left  (9 o'clock in math)
  const arcEnd   = 2 * Math.PI;     // right (3 o'clock in math)

  // ── Geometry helpers ───────────────────────────────────────────────────────

  const polar = (a, r) => ({
    x: radius + Math.cos(a) * r,
    y: radius + Math.sin(a) * r,
  });

  // v [0..100] → angle [arcStart..arcEnd]
  const valToAngle = (v) => arcStart + Math.max(0, Math.min(100, v)) / 100 * (arcEnd - arcStart);

  // Arc path with sweep=1 (clockwise, goes through bottom — clipped by viewBox to show top)
  const arcPath = (a, b, r) => {
    const p1 = polar(a, r), p2 = polar(b, r);
    const large = Math.abs(b - a) > Math.PI ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };

  // ── Drag interaction ───────────────────────────────────────────────────────

  const updateFromEvent = useCallback((clientX, clientY) => {
    if (!svgRef.current || !onChange) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Map to SVG coords (SVG is size × size/2 rendered, viewBox height = size/2+60)
    const px = ((clientX - rect.left)  / rect.width)  * size;
    const py = ((clientY - rect.top)   / rect.height) * (size / 2);
    const dx = px - radius, dy = py - radius;
    let a = Math.atan2(dy, dx);
    if (a < 0) a += 2 * Math.PI;
    // Clamp to valid range [π, 2π]
    if (a < Math.PI) a = (a < Math.PI / 2) ? 2 * Math.PI : Math.PI;
    const t = (a - Math.PI) / Math.PI;
    onChange(Math.max(0, Math.min(100, Math.round(t * 100))));
  }, [onChange, radius, size]);

  const onDown = useCallback((e) => {
    if (disabled) return;
    e.preventDefault(); dragging.current = true;
    const t = e.touches ? e.touches[0] : e;
    updateFromEvent(t.clientX, t.clientY);
  }, [disabled, updateFromEvent]);

  const onMove = useCallback((e) => {
    if (!dragging.current || disabled) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    updateFromEvent(t.clientX, t.clientY);
  }, [disabled, updateFromEvent]);

  const onUp = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  }, [onMove, onUp]);

  // ── Zone arc paths (0-40 blue, 40-60 green, 60-100 red) ───────────────────
  const zoneBlue  = arcPath(valToAngle(0),  valToAngle(40), trackR);
  const zoneGreen = arcPath(valToAngle(40), valToAngle(60), trackR);
  const zoneRed   = arcPath(valToAngle(60), valToAngle(100), trackR);

  // ── Tick marks (every 5; major at 0,25,50,75,100) ─────────────────────────
  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const a     = valToAngle(i);
    const major = i % 25 === 0;
    const r1    = trackR + 14;
    const r2    = r1 + (major ? 10 : 5);
    const p1    = polar(a, r1), p2 = polar(a, r2);
    ticks.push(
      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? 'var(--ink)' : 'var(--ink-dim)'}
        strokeWidth={major ? 2 : 1}
      />
    );
  }

  // ── Tick labels ────────────────────────────────────────────────────────────
  const tickLabels = [0, 25, 50, 75, 100].map(i => {
    const a = valToAngle(i);
    const p = polar(a, trackR + 36);
    return (
      <text key={i} x={p.x} y={p.y + 4} textAnchor="middle"
        style={{ fontFamily:'var(--f-read)', fontSize:16, fill:'var(--ink-dim)' }}>
        {i}
      </text>
    );
  });

  // ── Main needle ────────────────────────────────────────────────────────────
  const needleA   = valToAngle(value);
  const needleTip = polar(needleA, trackR - 6);
  const nb1       = polar(needleA + Math.PI/2, 8);
  const nb2       = polar(needleA - Math.PI/2, 8);

  // Value badge near needle tip (only when interactive)
  const tipLabel  = polar(needleA, trackR + 12);

  // ── Target marker (line + circle, shown in reveal) ────────────────────────
  let targetMarker = null;
  if (showTarget !== null) {
    const a   = valToAngle(showTarget);
    const tp1 = polar(a, trackR - 18);
    const tp2 = polar(a, trackR + 18);
    targetMarker = (
      <g style={{ filter:'drop-shadow(0 0 6px rgba(0,255,136,0.85))' }}>
        <line x1={tp1.x} y1={tp1.y} x2={tp2.x} y2={tp2.y}
          stroke="var(--neon-mint)" strokeWidth={3}/>
        <circle cx={tp1.x} cy={tp1.y} r={4} fill="var(--neon-mint)"/>
      </g>
    );
  }

  // ── Average marker in yellow (when both target + avg shown) ───────────────
  let avgMarker = null;
  if (showTarget !== null && !disabled) {
    // In reveal mode, `value` is the avg vote — show it as a second needle
    const a   = valToAngle(value);
    const tip = polar(a, trackR - 6);
    const bb1 = polar(a + Math.PI/2, 7);
    const bb2 = polar(a - Math.PI/2, 7);
    avgMarker = (
      <g style={{ filter:'drop-shadow(0 0 6px rgba(255,224,0,0.85))' }}>
        <polygon
          points={`${tip.x},${tip.y} ${bb1.x},${bb1.y} ${bb2.x},${bb2.y}`}
          fill="var(--neon-amber)" stroke="#3a2a00" strokeWidth={1}
        />
      </g>
    );
  }

  // ── Individual vote dots ───────────────────────────────────────────────────
  const voteDots = otherVotes.map(({ playerId, position }) => {
    const p = players.find(pl => pl.id === playerId);
    if (!p) return null;
    const a  = valToAngle(position);
    const pt = polar(a, trackR - 22);
    return (
      <circle key={playerId} cx={pt.x} cy={pt.y} r={5}
        fill={p.color} stroke="#000" strokeWidth={1.5} opacity={0.95}
        style={{ filter:`drop-shadow(0 0 6px ${p.color})` }}
      />
    );
  });

  const leftLabel  = tCard(card, 'left',  lang);
  const rightLabel = tCard(card, 'right', lang);

  // SVG viewBox: show from y=-10 to y=size/2+50 → hides the bottom arc
  const svgH  = size / 2 + 50;
  const vbStr = `0 -10 ${size} ${size / 2 + 60}`;

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:size, margin:'0 auto' }}>
      {/* ── Value readout box (absolute, centered below hub) ── */}
      <div style={{
        position: 'absolute',
        left: '50%', top: `${(radius / (svgH + 10)) * 100}%`,
        transform: 'translate(-50%, 0)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        <div className="t-title text-dim" style={{ fontSize:9 }}>
          {lang==='pt'?'PRESSÃO':'PRESSURE'}
        </div>
        <div className="t-read glow-text-amber" style={{
          fontSize: size * 0.16,
          marginTop: 4,
          filter: 'drop-shadow(0 0 8px rgba(255,224,0,0.6))',
        }}>
          {String(Math.round(value)).padStart(2, '0')}
        </div>
        <div className="t-mono text-dim" style={{ fontSize:12 }}>kPa</div>
      </div>

      {/* ── Gauge SVG ── */}
      <svg
        ref={svgRef}
        width="100%"
        height={svgH}
        viewBox={vbStr}
        className="gauge-svg"
        onMouseDown={onDown}
        onTouchStart={onDown}
        style={{ cursor: disabled ? 'default' : 'grab', userSelect:'none', touchAction:'none', display:'block' }}
      >
        {/* Outer decorative ring */}
        <path d={arcPath(arcStart, arcEnd, trackR + 28)}
          fill="none" stroke="var(--metal-2)" strokeWidth={2}/>

        {/* Background track */}
        <path d={arcPath(arcStart, arcEnd, trackR)}
          fill="none" stroke="var(--space-1)" strokeWidth={22} strokeLinecap="butt"/>

        {/* Zone arcs with neon glow */}
        <path d={zoneBlue}  fill="none" stroke="var(--neon-blue)"  strokeWidth={18} strokeLinecap="butt"
          style={{ filter:'drop-shadow(0 0 4px rgba(0,170,255,0.7))' }}/>
        <path d={zoneGreen} fill="none" stroke="var(--neon-mint)"  strokeWidth={18} strokeLinecap="butt"
          style={{ filter:'drop-shadow(0 0 4px rgba(0,255,136,0.7))' }}/>
        <path d={zoneRed}   fill="none" stroke="var(--neon-coral)" strokeWidth={18} strokeLinecap="butt"
          style={{ filter:'drop-shadow(0 0 4px rgba(255,51,85,0.7))' }}/>

        {/* Tick marks */}
        {ticks}
        {tickLabels}

        {/* Target line (reveal) */}
        {targetMarker}

        {/* Vote dots (reveal) */}
        {voteDots}

        {/* Average needle (reveal, yellow) */}
        {avgMarker}

        {/* Main needle (interactive) */}
        {!disabled && (
          <g className="needle-glow-yellow"
            style={{ transition: dragging.current ? 'none' : 'transform 0.2s cubic-bezier(.4,1.6,.5,1)' }}>
            <polygon
              points={`${needleTip.x},${needleTip.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`}
              fill="var(--neon-amber)" stroke="#3a2a00" strokeWidth={1.2}
            />
            <circle cx={radius} cy={radius} r={6} fill="#000" stroke="var(--neon-amber)" strokeWidth={2}/>
          </g>
        )}

        {/* Value badge at needle tip (interactive only) */}
        {!disabled && (
          <g style={{ pointerEvents:'none' }}>
            <rect x={tipLabel.x - 18} y={tipLabel.y - 11} width={36} height={20} rx={3}
              fill="var(--space-0)" stroke="var(--neon-amber)" strokeWidth={1.5}/>
            <text x={tipLabel.x} y={tipLabel.y + 4} textAnchor="middle"
              style={{ fontFamily:'var(--f-read)', fontSize:16, fill:'var(--neon-amber)' }}>
              {Math.round(value)}
            </text>
          </g>
        )}
      </svg>

      {/* Spectrum word labels */}
      <div style={{ display:'flex', justifyContent:'space-between', padding:'0 8px', marginTop:4, gap:8 }}>
        <span style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:12, color:'rgba(0,170,255,0.8)', maxWidth:'44%', wordBreak:'break-word' }}>
          ← {leftLabel}
        </span>
        <span style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:12, color:'rgba(255,51,85,0.8)', maxWidth:'44%', wordBreak:'break-word', textAlign:'right' }}>
          {rightLabel} →
        </span>
      </div>

      {!disabled && (
        <p style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--ink-faint)', textAlign:'center', marginTop:6 }}>
          {lang==='pt'?'arraste a agulha para votar':'drag the needle to vote'}
        </p>
      )}
    </div>
  );
}
