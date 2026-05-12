import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../gameData.js';
import { t } from '../i18n.js';
import { playRouletteSpin, playThemeReveal, playClick } from '../sounds.js';

const N   = THEMES.length;    // 12
const SEG = 360 / N;          // 30°
const CX  = 180, CY = 180, R = 166;

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° = top, clockwise
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segPath(cx, cy, r, startDeg, endDeg) {
  const p1    = polarToCartesian(cx, cy, r, startDeg);
  const p2    = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 ${large},1 ${p2.x},${p2.y} Z`;
}

export default function Roulette({ gameState, myId, lang, send, spinning, isHost }) {
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const psychicIsBot  = psychicPlayer?.isBot === true;
  const isPsychic     = gameState.psychicId === myId || (psychicIsBot && isHost);
  const selectedTheme = gameState.currentTheme;

  const wheelRef       = useRef(null);
  const totalRotRef    = useRef(0);
  const hasAnimatedRef = useRef(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [isSpinning,    setIsSpinning]    = useState(false);

  // Trigger animation when phase = 'spinning' and theme is known
  useEffect(() => {
    if (!spinning || !selectedTheme || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    setIsSpinning(true);
    setRevealVisible(false);

    // Where should the wheel land? Segment i center = i*SEG + SEG/2 from top (CW)
    // To land that at the pointer (top): rotate by (360 - center)
    const segCenter  = selectedTheme.id * SEG + SEG / 2;
    const currentMod = ((totalRotRef.current % 360) + 360) % 360;
    let   delta      = ((360 - segCenter) - currentMod + 360) % 360;
    if (delta < 5) delta += 360;
    const finalRot   = totalRotRef.current + 360 * 7 + delta; // 7 full spins
    totalRotRef.current = finalRot;

    const el = wheelRef.current;
    if (!el) return;

    // Double rAF to ensure browser sees the "from" state before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 4.2s cubic-bezier(0.1, 0.85, 0.05, 1.0)';
        el.style.transform  = `rotate(${finalRot}deg)`;
      });
    });

    playRouletteSpin();

    setTimeout(() => {
      setIsSpinning(false);
      setRevealVisible(true);
      playThemeReveal();
    }, 4400);
  }, [spinning, selectedTheme]);

  // Reset on new round
  useEffect(() => {
    if (!spinning && !selectedTheme) {
      hasAnimatedRef.current = false;
      setRevealVisible(false);
      setIsSpinning(false);
    }
  }, [spinning, selectedTheme]);

  const themeShort = (theme) => lang === 'en' ? theme.shortEN : theme.shortPT;
  const themeName  = (theme) => lang === 'en' ? theme.nameEN  : theme.namePT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 24 }}>

      {/* Title */}
      <h2 className="pixel-title text-center"
        style={{ fontSize: 'clamp(11px,2.5vw,14px)', color: 'var(--cyan)' }}>
        {lang === 'pt' ? 'ROLETA DE TEMAS' : 'THEME ROULETTE'}
      </h2>

      {/* Transmitter info */}
      <div style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--dim2)', textAlign: 'center' }}>
        📡 {lang === 'pt' ? 'Transmissor:' : 'Transmitter:'}
        {' '}<span style={{ color: 'var(--yellow)', fontWeight: 800 }}>{psychicPlayer?.name || '?'}</span>
      </div>

      {/* Pointer */}
      <div style={{
        width: 0, height: 0,
        borderLeft:  '14px solid transparent',
        borderRight: '14px solid transparent',
        borderTop:   '28px solid var(--yellow)',
        filter: 'drop-shadow(0 0 10px var(--yellow))',
        marginBottom: -6, zIndex: 2, flexShrink: 0,
      }}/>

      {/* Wheel wrapper */}
      <div style={{
        borderRadius: '50%',
        boxShadow: '0 0 0 6px rgba(0,212,255,0.12), 0 0 60px rgba(0,212,255,0.2), 0 20px 80px rgba(0,0,0,0.6)',
        flexShrink: 0,
      }}>
        <svg
          ref={wheelRef}
          width="min(88vw, 400px)"
          height="min(88vw, 400px)"
          viewBox={`0 0 ${CX*2} ${CY*2}`}
          style={{ display: 'block', transform: 'rotate(0deg)', willChange: 'transform' }}
        >
          {/* Outer glow ring */}
          <circle cx={CX} cy={CY} r={R + 8} fill="none" stroke="rgba(0,200,255,0.18)" strokeWidth={14}/>

          {THEMES.map((theme, i) => {
            const startDeg = i * SEG;
            const endDeg   = (i + 1) * SEG;
            const midDeg   = startDeg + SEG / 2;
            // VT323 at 16px: each char ≈ 9px wide — fits comfortably in segment
            const tp    = polarToCartesian(CX, CY, R * 0.63, midDeg);
            const short = themeShort(theme);

            return (
              <g key={theme.id}>
                <path
                  d={segPath(CX, CY, R, startDeg, endDeg)}
                  fill={theme.color}
                  stroke="#050510"
                  strokeWidth={2.5}
                  opacity={0.92}
                />
                {/* Stroke for contrast behind text */}
                <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={16} fontFamily="'VT323', monospace"
                  fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth={4} strokeLinejoin="round"
                  style={{ userSelect:'none', pointerEvents:'none' }}
                  transform={`rotate(${midDeg}, ${tp.x}, ${tp.y})`}
                >{short}</text>
                {/* Foreground text */}
                <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={16} fontFamily="'VT323', monospace"
                  fill="#fff" fontWeight="700"
                  style={{ userSelect:'none', pointerEvents:'none' }}
                  transform={`rotate(${midDeg}, ${tp.x}, ${tp.y})`}
                >{short}</text>
              </g>
            );
          })}

          {/* Inner hub */}
          <circle cx={CX} cy={CY} r={26} fill="#070912" stroke="var(--cyan)" strokeWidth={2.5}/>
          <circle cx={CX} cy={CY} r={16} fill="rgba(0,255,255,0.1)"/>
          <circle cx={CX} cy={CY} r={7}  fill="var(--cyan)"
            style={{ filter: 'drop-shadow(0 0 6px var(--cyan))' }}/>

          {/* Outer rim */}
          <circle cx={CX} cy={CY} r={R + 1}  fill="none" stroke="rgba(0,0,0,0.6)"  strokeWidth={5}/>
          <circle cx={CX} cy={CY} r={R + 3}  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1}/>
        </svg>
      </div>

      {/* Theme reveal */}
      {revealVisible && selectedTheme && (
        <div style={{
          padding: '16px 32px', maxWidth: 360, width: '100%', textAlign: 'center',
          border: `2px solid ${selectedTheme.color}`,
          background: 'rgba(4,6,18,0.95)',
          boxShadow: `0 0 30px ${selectedTheme.color}55`,
          borderRadius: 10,
          animation: 'theme-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div className="label mb-6" style={{ color: 'var(--dim2)' }}>
            {lang === 'pt' ? 'TEMA DA RODADA' : 'ROUND THEME'}
          </div>
          <div className="pixel-title" style={{
            fontSize: 'clamp(11px,3.5vw,16px)',
            color: selectedTheme.color,
            textShadow: `0 0 20px ${selectedTheme.color}`,
            lineHeight: 2,
          }}>
            {themeName(selectedTheme)}
          </div>
        </div>
      )}

      {/* Spin button */}
      {isPsychic && !spinning && (
        <button
          className="btn btn-yellow btn-lg"
          onClick={() => { playClick(); send('spin_roulette'); }}
          style={{ fontSize: 13, letterSpacing: 3, minWidth: 220 }}
        >
          ⚡ {lang === 'pt' ? 'GIRAR' : 'SPIN'} ⚡
        </button>
      )}

      {/* Waiting — non-psychic */}
      {!isPsychic && !isSpinning && !revealVisible && (
        <div style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--dim2)', textAlign: 'center' }}>
          {lang === 'pt'
            ? `Aguardando ${psychicPlayer?.name} girar...`
            : `Waiting for ${psychicPlayer?.name} to spin...`}
        </div>
      )}

      {/* Spinning indicator */}
      {isSpinning && (
        <div style={{
          fontFamily: 'var(--f-vt)', fontSize: 26, color: 'var(--yellow)',
          letterSpacing: 4, textAlign: 'center',
          animation: 'blink-bar 0.4s infinite',
        }}>
          ⚡ {lang === 'pt' ? 'GIRANDO...' : 'SPINNING...'} ⚡
        </div>
      )}
    </div>
  );
}
