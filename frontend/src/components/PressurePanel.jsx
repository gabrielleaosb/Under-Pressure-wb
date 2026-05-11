import React, { useRef, useCallback, useEffect } from 'react';
import { tCard } from '../i18n.js';

// ── Gauge geometry ──────────────────────────────────────────────────────────
const CX = 155, CY = 158, R = 130, RINNER = 96, RMID = (130 + 96) / 2; // 113

// Value [0,100] → standard-math angle (0°=right, CCW positive)
//   v=0   → 180° (left endpoint)
//   v=50  → 90°  (top / 12-o'clock)
//   v=100 → 0°   (right endpoint)
function valToAngle(v) { return 180 - v * 1.8; }

// Standard-math angle → SVG point (y-axis inverted: subtract sin)
function pt(deg, radius) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

// ── Arc helpers ─────────────────────────────────────────────────────────────
// Going from v1 to v2 (left → upper → right) is COUNTER-CLOCKWISE in SVG → sweep=0
// Going back v2 → v1 is CLOCKWISE → sweep=1
// All our arcs span ≤ 180° so large=0 always.

function arcPath(v1, v2, radius) {
  const p1 = pt(valToAngle(v1), radius);
  const p2 = pt(valToAngle(v2), radius);
  return `M${p1.x},${p1.y} A${radius},${radius} 0 0,0 ${p2.x},${p2.y}`;
}

function ringSegment(v1, v2) {
  const o1 = pt(valToAngle(v1), R), o2 = pt(valToAngle(v2), R);
  const i1 = pt(valToAngle(v1), RINNER), i2 = pt(valToAngle(v2), RINNER);
  // outer CCW (sweep=0), inner CW back (sweep=1)
  return `M${o1.x},${o1.y} A${R},${R} 0 0,0 ${o2.x},${o2.y} L${i2.x},${i2.y} A${RINNER},${RINNER} 0 0,1 ${i1.x},${i1.y} Z`;
}

// ── Zone data ───────────────────────────────────────────────────────────────
const ZONES = [
  { from: 0,  to: 42,  fill: 'rgba(0,80,220,0.18)', stroke: '#2255ff', label: 'cold' },
  { from: 42, to: 58,  fill: 'rgba(0,200,120,0.22)', stroke: '#00e88f', label: 'sweet' },
  { from: 58, to: 100, fill: 'rgba(220,50,20,0.18)',  stroke: '#ff4422', label: 'hot' },
];

export default function PressurePanel({
  card, lang, value, onChange,
  disabled = false, showTarget = null,
  otherVotes = [], players = [],
}) {
  const svgRef   = useRef(null);
  const dragging = useRef(false);

  // ── Drag interaction ──────────────────────────────────────────────────────
  const posFromEvent = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return value;
    const rect    = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const svgX    = ((clientX - rect.left)  / rect.width)  * 310;
    const svgY    = ((clientY - rect.top)   / rect.height) * 210;
    const dx = svgX - CX;
    const dy = CY - svgY;  // flip y
    let angleDeg  = Math.atan2(dy, dx) * (180 / Math.PI);
    // Clamp to [0°, 180°] (valid gauge range)
    angleDeg = Math.max(0, Math.min(180, angleDeg));
    return Math.round(Math.max(0, Math.min(100, (180 - angleDeg) / 1.8)));
  }, [value]);

  const onPD = useCallback((e) => { if (disabled) return; e.preventDefault(); dragging.current = true; onChange(posFromEvent(e)); }, [disabled, onChange, posFromEvent]);
  const onPM = useCallback((e) => { if (!dragging.current || disabled) return; e.preventDefault(); onChange(posFromEvent(e)); }, [disabled, onChange, posFromEvent]);
  const onPU = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPM, { passive: false });
    window.addEventListener('pointerup',   onPU);
    window.addEventListener('touchmove',   onPM, { passive: false });
    window.addEventListener('touchend',    onPU);
    return () => {
      window.removeEventListener('pointermove', onPM);
      window.removeEventListener('pointerup',   onPU);
      window.removeEventListener('touchmove',   onPM);
      window.removeEventListener('touchend',    onPU);
    };
  }, [onPM, onPU]);

  // ── Derived geometry ──────────────────────────────────────────────────────
  const needleAngle = valToAngle(value);
  const needleTip   = pt(needleAngle, R - 12);
  const needleBack  = pt(needleAngle + 180, 18);
  const needleL     = pt(needleAngle + 90,  7);
  const needleR     = pt(needleAngle - 90,  7);

  // Target needle (reveal phase)
  const ta    = showTarget !== null ? valToAngle(showTarget) : null;
  const tTip  = ta !== null ? pt(ta, R - 8)    : null;
  const tBack = ta !== null ? pt(ta + 180, 18)  : null;
  const tL    = ta !== null ? pt(ta + 90,  6)   : null;
  const tR    = ta !== null ? pt(ta - 90,  6)   : null;

  // Zone color for the active arc
  const activeArcColor = value < 42 ? '#0066ff' : value <= 58 ? '#00e88f' : '#ff4400';

  const leftLabel  = tCard(card, 'left',  lang);
  const rightLabel = tCard(card, 'right', lang);

  return (
    <div className="pressure-panel pixel-box">
      {/* Panel label */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--f-pixel)', fontWeight: 800, fontSize: 11, color: 'rgba(0,212,255,0.6)', letterSpacing: 2 }}>
          PRESSURE SPECTRUM
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 310 210"
        style={{ width: '100%', maxWidth: 500, display: 'block', margin: '0 auto', cursor: disabled ? 'default' : 'crosshair', touchAction: 'none' }}
        onPointerDown={onPD}
        onTouchStart={onPD}
      >
        <defs>
          {/* Active arc gradient: left=blue, center=green, right=red */}
          <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0044ff" />
            <stop offset="35%"  stopColor="#0099ff" />
            <stop offset="50%"  stopColor="#00e88f" />
            <stop offset="65%"  stopColor="#ffdd00" />
            <stop offset="100%" stopColor="#ff3300" />
          </linearGradient>
          <filter id="glow-needle" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-target" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-arc" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Background ring (full gauge shape) ── */}
        <path d={ringSegment(0, 100)}
          fill="rgba(8,14,40,0.7)"
          stroke="rgba(255,255,255,0.05)" strokeWidth={1}
        />

        {/* ── Zone fills ── */}
        {ZONES.map(z => (
          <path key={z.from} d={ringSegment(z.from, z.to)} fill={z.fill} />
        ))}

        {/* ── Baseline (diameter) ── */}
        <line
          x1={pt(valToAngle(0), R + 12).x} y1={CY}
          x2={pt(valToAngle(100), R + 12).x} y2={CY}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1}
        />

        {/* ── Full outer arc (track) ── */}
        <path d={arcPath(0, 100, R)}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
        <path d={arcPath(0, 100, RINNER)}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {/* ── Zone border arcs ── */}
        {[42, 58].map(v => {
          const tip = pt(valToAngle(v), R + 4);
          const base = pt(valToAngle(v), RINNER - 4);
          return <line key={v} x1={tip.x} y1={tip.y} x2={base.x} y2={base.y}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="3,3" />;
        })}

        {/* ── ACTIVE POSITION ARC ── the key visual indicator ── */}
        {value > 0 && (
          <path
            d={arcPath(0, value, RMID)}
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth={16}
            strokeLinecap="round"
            opacity={0.9}
            filter="url(#glow-arc)"
          />
        )}
        {/* Outer bright edge of active arc */}
        {value > 0 && (
          <path
            d={arcPath(0, value, R - 4)}
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}

        {/* ── Tick marks ── */}
        {Array.from({ length: 21 }, (_, i) => {
          const v = i * 5;
          const isMajor = v % 25 === 0;
          const isMid   = v % 10 === 0 && !isMajor;
          const oR = R + 1;
          const iR = isMajor ? RINNER + 5 : isMid ? RINNER + 12 : RINNER + 17;
          const o  = pt(valToAngle(v), oR);
          const ii = pt(valToAngle(v), iR);
          return (
            <line key={v}
              x1={o.x} y1={o.y} x2={ii.x} y2={ii.y}
              stroke={isMajor ? 'rgba(255,255,255,0.8)' : isMid ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'}
              strokeWidth={isMajor ? 3 : isMid ? 1.5 : 1}
            />
          );
        })}

        {/* ── Number labels at major ticks ── */}
        {[0, 25, 50, 75, 100].map(v => {
          const p = pt(valToAngle(v), RINNER - 16);
          return (
            <text key={v} x={p.x} y={p.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.5)" fontSize={11} fontFamily="Space Mono"
            >
              {v}
            </text>
          );
        })}

        {/* ── Other voters' needles ── */}
        {otherVotes.map(({ playerId, position }) => {
          const p = players.find(pl => pl.id === playerId);
          if (!p) return null;
          const ang = valToAngle(position);
          const tip = pt(ang, R - 20);
          return (
            <line key={playerId}
              x1={CX} y1={CY} x2={tip.x} y2={tip.y}
              stroke={p.color} strokeWidth={4} strokeLinecap="round" opacity={0.65}
            />
          );
        })}

        {/* ── Target needle (reveal) ── */}
        {tTip && (
          <g filter="url(#glow-target)">
            <polygon
              points={`${tTip.x},${tTip.y} ${tL.x},${tL.y} ${tBack.x},${tBack.y} ${tR.x},${tR.y}`}
              fill="#00e88f" stroke="#ffffff" strokeWidth={2}
              style={{ animation: 'target-drop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            />
          </g>
        )}
        {/* Target arc highlight */}
        {showTarget !== null && showTarget > 0 && (
          <path
            d={arcPath(0, showTarget, RMID)}
            fill="none" stroke="#00e88f" strokeWidth={4}
            strokeLinecap="round" opacity={0.5}
          />
        )}

        {/* ── Main needle ── */}
        {!disabled && (
          <g filter="url(#glow-needle)">
            <polygon
              points={`${needleTip.x},${needleTip.y} ${needleL.x},${needleL.y} ${needleBack.x},${needleBack.y} ${needleR.x},${needleR.y}`}
              fill="#ffd000" stroke="#fff" strokeWidth={1.5}
            />
          </g>
        )}

        {/* ── Center hub ── */}
        <circle cx={CX} cy={CY} r={22} fill="url(#hub-fill)" stroke="rgba(0,212,255,0.5)" strokeWidth={2.5} />
        <defs>
          <radialGradient id="hub-fill" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1a2a60" />
            <stop offset="100%" stopColor="#060c1e" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={13} fill="rgba(0,212,255,0.1)" />
        <circle cx={CX} cy={CY} r={6}  fill="#00d4ff"
          style={{ filter: 'drop-shadow(0 0 6px #00d4ff)' }} />

        {/* ── Digital value readout ── */}
        {!disabled && (
          <text x={CX} y={CY + 42} textAnchor="middle"
            fill={activeArcColor} fontSize={30} fontFamily="Space Mono" fontWeight="700"
            style={{ filter: `drop-shadow(0 0 8px ${activeArcColor})` }}>
            {String(Math.round(value)).padStart(3, ' ')}
          </text>
        )}

        {/* ── Endpoint labels ── */}
        {/* Left label */}
        <text x={pt(valToAngle(0), R + 16).x} y={CY + 4}
          textAnchor="end" dominantBaseline="middle"
          fill="#6699ff" fontSize={10} fontFamily="Exo 2" fontWeight="700">
          ←
        </text>
        {/* Right label */}
        <text x={pt(valToAngle(100), R + 16).x} y={CY + 4}
          textAnchor="start" dominantBaseline="middle"
          fill="#ff8866" fontSize={10} fontFamily="Exo 2" fontWeight="700">
          →
        </text>
      </svg>

      {/* Spectrum word labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px 0', gap: 8 }}>
        <span style={{ fontFamily: 'var(--f-pixel)', fontWeight: 800, fontSize: 9, color: '#6699ff', maxWidth: '44%', wordBreak: 'break-word' }}>
          ← {leftLabel}
        </span>
        <span style={{ fontFamily: 'var(--f-pixel)', fontWeight: 800, fontSize: 9, color: '#ff8866', maxWidth: '44%', wordBreak: 'break-word', textAlign: 'right' }}>
          {rightLabel} →
        </span>
      </div>

      {!disabled && (
        <p style={{ fontFamily: 'var(--f-body)', fontSize: 11, color: 'var(--dim)', textAlign: 'center', marginTop: 8 }}>
          {lang === 'pt' ? '— arraste na escala —' : '— drag on the scale —'}
        </p>
      )}
    </div>
  );
}
