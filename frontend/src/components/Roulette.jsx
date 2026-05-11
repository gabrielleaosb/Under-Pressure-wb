import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../gameData.js';
import { t, tTheme } from '../i18n.js';
import { playRouletteSpin, playThemeReveal, playClick } from '../sounds.js';

const N   = THEMES.length;   // 12
const SEG = 360 / N;         // 30° per segment
const CX  = 150, CY = 150, R = 138;

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segPath(cx, cy, r, startDeg, endDeg) {
  const p1    = polarToCartesian(cx, cy, r, startDeg);
  const p2    = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 ${large},1 ${p2.x},${p2.y} Z`;
}

export default function Roulette({ gameState, myId, lang, send, spinning }) {
  const isPsychic    = gameState.psychicId === myId;
  const selectedTheme = gameState.currentTheme; // server picks this at spin-time

  // We manipulate the SVG transform directly to avoid React batching killing the CSS transition
  const wheelRef     = useRef(null);
  const totalRotRef  = useRef(0);      // accumulated degrees across rounds
  const hasSpunRef   = useRef(false);  // prevents double-fire

  const [revealVisible, setRevealVisible] = useState(false);
  const [isSpinning,    setIsSpinning]    = useState(false);

  // ── Trigger spin animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!spinning || !selectedTheme || hasSpunRef.current) return;
    if (!wheelRef.current) return;

    hasSpunRef.current = true;
    setIsSpinning(true);
    setRevealVisible(false);

    // Calculate target rotation so selectedTheme.id lands under the pointer (12 o'clock)
    // Segment i occupies [i*SEG, (i+1)*SEG] measured clockwise from the top.
    // Its center is at i*SEG + SEG/2 from the top.
    // A clockwise rotation of R degrees moves position R to the top.
    // We want the segment center at the top → rotate by (360 - center) to bring it up.
    const segCenter = selectedTheme.id * SEG + SEG / 2;
    const current   = ((totalRotRef.current % 360) + 360) % 360;
    let   delta     = ((360 - segCenter) - current + 360) % 360;
    if (delta < 5) delta += 360;           // ensure at least one more degree
    const finalRot  = totalRotRef.current + 360 * 6 + delta;  // 6 full spins + landing
    totalRotRef.current = finalRot;

    const el = wheelRef.current;

    // Step 1: make sure transition is OFF at the current position (already is on fresh mount)
    el.style.transition = 'none';
    el.style.transform  = `rotate(${finalRot - 360 * 6 - delta}deg)`;  // current position

    // Step 2: one rAF to let the browser register the "from" state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Now apply the transition + destination → CSS animates
        el.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.82, 0.08, 1.0)';
        el.style.transform  = `rotate(${finalRot}deg)`;
      });
    });

    playRouletteSpin();

    setTimeout(() => {
      setIsSpinning(false);
      setRevealVisible(true);
      playThemeReveal();
    }, 4000);
  }, [spinning, selectedTheme]);

  // ── Reset when a new round starts ──────────────────────────────────────────
  useEffect(() => {
    if (!spinning && !selectedTheme) {
      hasSpunRef.current = false;
      setRevealVisible(false);
      setIsSpinning(false);
    }
  }, [spinning, selectedTheme]);

  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);

  return (
    <div className="roulette-container" style={{ paddingTop: 8, paddingBottom: 24 }}>
      <h2 className="pixel-title text-center"
        style={{ fontSize: 'clamp(8px,2.5vw,12px)', color: 'var(--cyan)' }}>
        {t('roulette_title', lang)}
      </h2>

      <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)', letterSpacing: 2, textAlign: 'center' }}>
        {lang === 'pt' ? 'NAVEGADOR:' : 'NAVIGATOR:'}{' '}
        <span style={{ color: 'var(--yellow)' }}>{psychicPlayer?.name || '?'}</span>
      </div>

      {/* Pointer arrow */}
      <div className="roulette-pointer" />

      {/* Wheel */}
      <div className="roulette-wheel-wrap" style={{ position: 'relative' }}>
        <svg
          ref={wheelRef}
          width={300} height={300} viewBox="0 0 300 300"
          style={{ display: 'block', transform: 'rotate(0deg)', willChange: 'transform' }}
        >
          {/* Glow ring */}
          <circle cx={CX} cy={CY} r={R + 8} fill="none"
            stroke="rgba(0,255,255,0.12)" strokeWidth={14} />

          {/* Segments */}
          {THEMES.map((theme, i) => {
            const startDeg = i * SEG;
            const endDeg   = (i + 1) * SEG;
            const midDeg   = startDeg + SEG / 2;
            const ep = polarToCartesian(CX, CY, R * 0.82, midDeg);  // emoji
            return (
              <g key={theme.id}>
                <path
                  d={segPath(CX, CY, R, startDeg, endDeg)}
                  fill={theme.color}
                  stroke="#050510"
                  strokeWidth={2.5}
                  opacity={0.9}
                />
                {/* Divider */}
                <line
                  x1={CX} y1={CY}
                  x2={polarToCartesian(CX, CY, R, startDeg).x}
                  y2={polarToCartesian(CX, CY, R, startDeg).y}
                  stroke="rgba(0,0,0,0.45)" strokeWidth={1.5}
                />
                {/* Emoji */}
                <text
                  x={ep.x} y={ep.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={20}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                  transform={`rotate(${midDeg}, ${ep.x}, ${ep.y})`}
                >
                  {theme.emoji}
                </text>
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={24} fill="#0d0d1e" stroke="#00ffff" strokeWidth={2.5} />
          <circle cx={CX} cy={CY} r={15} fill="rgba(0,255,255,0.1)" />
          <circle cx={CX} cy={CY} r={6}  fill="#00ffff"
            style={{ filter: 'drop-shadow(0 0 6px #00ffff)' }} />

          {/* Outer metallic rim */}
          <circle cx={CX} cy={CY} r={R + 2}  fill="none" stroke="#111130" strokeWidth={5} />
          <circle cx={CX} cy={CY} r={R + 4}  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
          <circle cx={CX} cy={CY} r={R - 0}  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </svg>

        {/* Spinning glow overlay */}
        {isSpinning && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(ellipse, transparent 50%, rgba(0,255,255,0.1) 100%)',
            animation: 'blink-bar 0.25s infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Theme reveal */}
      {revealVisible && selectedTheme && (
        <div className="theme-reveal pixel-box text-center"
          style={{ padding: '18px 32px', maxWidth: 340, width: '100%' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{selectedTheme.emoji}</div>
          <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: 'var(--dim)', marginBottom: 8 }}>
            {lang === 'pt' ? 'TEMA SELECIONADO' : 'SELECTED THEME'}
          </div>
          <div className="pixel-title"
            style={{
              fontSize: 'clamp(10px,3.5vw,16px)',
              color: selectedTheme.color,
              textShadow: `0 0 20px ${selectedTheme.color}`,
            }}>
            {tTheme(selectedTheme, lang)}
          </div>
        </div>
      )}

      {/* Spin button — psychic only, roulette phase only */}
      {isPsychic && !spinning && (
        <button
          className="btn btn-yellow btn-lg"
          onClick={() => { playClick(); send('spin_roulette'); }}
          style={{ fontSize: 13, letterSpacing: 4, minWidth: 220 }}
        >
          ⚡ {t('spin_btn', lang)} ⚡
        </button>
      )}

      {/* Waiting — others */}
      {!isPsychic && (
        <div style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: 'var(--dim)', letterSpacing: 3, textAlign: 'center' }}>
          📡 {t('waiting_spin', lang)}
        </div>
      )}

      {/* In-flight label */}
      {isSpinning && (
        <div style={{
          fontFamily: 'var(--f-vt)', fontSize: 26, color: 'var(--yellow)',
          letterSpacing: 4, textAlign: 'center',
          animation: 'blink-bar 0.35s infinite',
        }}>
          ⚡ {lang === 'pt' ? 'GIRANDO...' : 'SPINNING...'} ⚡
        </div>
      )}
    </div>
  );
}
