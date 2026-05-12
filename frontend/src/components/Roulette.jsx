/**
 * Roulette — implementation matching the Claude Design template exactly.
 * Segments start at top (-π/2), hub overlay, VT323 labels,
 * CSS transition 4s cubic-bezier(.18,.85,.25,1).
 */
import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../gameData.js';
import { t } from '../i18n.js';
import { playRouletteSpin, playThemeReveal, playClick } from '../sounds.js';

export default function Roulette({ gameState, myId, lang, send, spinning, isHost }) {
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const psychicIsBot  = psychicPlayer?.isBot === true;
  const isPsychic     = gameState.psychicId === myId || (psychicIsBot && isHost);
  const selectedTheme = gameState.currentTheme;

  const [angle,        setAngle]        = useState(0);
  const [revealVisible,setRevealVisible] = useState(false);
  const [isAnimating,  setIsAnimating]  = useState(false);
  const hasAnimated = useRef(false);
  const angleRef    = useRef(0);      // accumulated rotation

  // Spin when phase = 'spinning' and theme is known
  useEffect(() => {
    if (!spinning || !selectedTheme || hasAnimated.current) return;
    hasAnimated.current = true;
    setIsAnimating(true);
    setRevealVisible(false);

    // Design's rotation formula:
    // segments[i] center is at: -90 + i*(360/N) + (360/N)/2 degrees
    // To land target at top (pointer), we rotate to bring that center to 0 (top)
    const N          = THEMES.length;
    const segSize    = 360 / N;
    const centerOfTarget = selectedTheme.id * segSize + segSize / 2;
    // 5 full spins + offset to land target at top + small random wobble
    const addedRotation = 360 * 5 - centerOfTarget + (Math.random() - 0.5) * (segSize * 0.6);
    const newAngle   = angleRef.current + addedRotation;
    angleRef.current = newAngle;

    // Two rAF to ensure transition triggers from current state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAngle(newAngle);
      });
    });

    playRouletteSpin();

    setTimeout(() => {
      setIsAnimating(false);
      setRevealVisible(true);
      playThemeReveal();
    }, 4400);
  }, [spinning, selectedTheme]);

  // Reset on new round
  useEffect(() => {
    if (!spinning && !selectedTheme) {
      hasAnimated.current = false;
      setRevealVisible(false);
      setIsAnimating(false);
    }
  }, [spinning, selectedTheme]);

  const SIZE   = 360;
  const radius = SIZE / 2;      // 180
  const segArc = (2 * Math.PI) / THEMES.length;

  const themeName = (th) => lang === 'en' ? th.shortEN : th.shortPT;
  const fullName  = (th) => lang === 'en' ? th.nameEN  : th.namePT;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, paddingBottom:20 }}>

      <h2 className="t-title glow-text-cyan text-center" style={{ fontSize:'clamp(10px,2.2vw,13px)' }}>
        {lang==='pt'?'ROLETA DE TEMAS':'THEME ROULETTE'}
      </h2>

      <div style={{ fontFamily:'var(--f-body)', fontSize:14, color:'var(--ink-dim)' }}>
        📡 {lang==='pt'?'Transmissor:':'Transmitter:'}
        {' '}<span style={{ color:'var(--neon-amber)', fontWeight:800 }}>{psychicPlayer?.name || '?'}</span>
      </div>

      {/* ── Wheel ── */}
      <div className="wheel-wrap" style={{ width:SIZE, height:SIZE, position:'relative' }}>

        {/* Amber pointer triangle at top */}
        <div className="wheel-pointer"/>

        {/* Hub overlay (sits on top of SVG, fixed) */}
        <div className="wheel-hub"
          style={{ cursor: isPsychic && !spinning ? 'pointer' : 'default' }}
          onClick={() => { if (isPsychic && !spinning && !isAnimating) { playClick(); send('spin_roulette'); } }}
        >
          <div className="t-title glow-text-cyan" style={{ fontSize:9, textAlign:'center', userSelect:'none' }}>
            {isPsychic && !spinning ? (lang==='pt'?'GIRAR':'SPIN') : '···'}
          </div>
        </div>

        {/* Spinning SVG */}
        <svg
          width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{
            display: 'block',
            transform: `rotate(${angle}deg)`,
            transition: isAnimating
              ? 'transform 4s cubic-bezier(.18,.85,.25,1)'
              : 'none',
            filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.25))',
            willChange: 'transform',
          }}
        >
          <defs>
            {/* Radial shine overlay for depth */}
            <radialGradient id="wheel-shine" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.0)"/>
              <stop offset="80%"  stopColor="rgba(255,255,255,0.0)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0.5)"/>
            </radialGradient>
          </defs>

          {/* Segments */}
          {THEMES.map((th, i) => {
            // Segment i starts at top (-π/2) and goes clockwise
            const a0 = -Math.PI/2 + i * segArc;
            const a1 = -Math.PI/2 + (i+1) * segArc;
            const p0 = { x: radius + Math.cos(a0)*radius, y: radius + Math.sin(a0)*radius };
            const p1 = { x: radius + Math.cos(a1)*radius, y: radius + Math.sin(a1)*radius };
            const d  = `M ${radius} ${radius} L ${p0.x} ${p0.y} A ${radius} ${radius} 0 0 1 ${p1.x} ${p1.y} Z`;

            // Label position at 70% radius along segment bisector
            const mid = (a0 + a1) / 2;
            const lr  = radius * 0.70;
            const lx  = radius + Math.cos(mid) * lr;
            const ly  = radius + Math.sin(mid) * lr;
            // Rotate label to read along radial direction
            const labelDeg = mid * 180 / Math.PI + 90;
            const fontSize = Math.max(13, SIZE / 22);  // ≈16 for 360

            return (
              <g key={th.id}>
                <path d={d} fill={th.color} stroke="#050510" strokeWidth={2}/>
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${labelDeg} ${lx} ${ly})`}
                  style={{
                    fontFamily: 'var(--f-read)',
                    fontSize,
                    fill: '#0a0a1e',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                >
                  {themeName(th)}
                </text>
              </g>
            );
          })}

          {/* Radial shine overlay */}
          <circle cx={radius} cy={radius} r={radius - 2} fill="url(#wheel-shine)"/>

          {/* Outer metallic rim */}
          <circle cx={radius} cy={radius} r={radius - 1}
            fill="none" stroke="var(--metal-2)" strokeWidth={3}/>
        </svg>
      </div>

      {/* Theme reveal card */}
      {revealVisible && selectedTheme && (
        <div className="theme-reveal panel bevel text-center" style={{
          padding:'16px 32px', maxWidth:340, width:'100%',
          border:`2px solid ${selectedTheme.color}`,
          boxShadow:`0 0 30px ${selectedTheme.color}55`,
        }}>
          <div className="label mb-6" style={{ color:'var(--ink-dim)' }}>
            {lang==='pt'?'TEMA DA RODADA':'ROUND THEME'}
          </div>
          <div className="t-title" style={{
            fontSize:'clamp(11px,3.5vw,16px)',
            color: selectedTheme.color,
            textShadow:`0 0 20px ${selectedTheme.color}`,
            lineHeight:2,
          }}>
            {fullName(selectedTheme)}
          </div>
        </div>
      )}

      {/* Spin button (below hub — backup for smaller screens) */}
      {isPsychic && !spinning && !isAnimating && (
        <button className="btn btn-yellow btn-lg"
          onClick={() => { playClick(); send('spin_roulette'); }}
          style={{ fontSize:12, letterSpacing:3, minWidth:200 }}>
          ⚡ {lang==='pt'?'GIRAR':'SPIN'} ⚡
        </button>
      )}

      {!isPsychic && !isAnimating && !revealVisible && (
        <div style={{ fontFamily:'var(--f-body)', fontSize:14, color:'var(--ink-dim)' }}>
          {lang==='pt'
            ? `Aguardando ${psychicPlayer?.name} girar...`
            : `Waiting for ${psychicPlayer?.name} to spin...`}
        </div>
      )}

      {isAnimating && (
        <div style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--neon-amber)', letterSpacing:4, animation:'blink-bar .4s infinite' }}>
          ⚡ {lang==='pt'?'GIRANDO...':'SPINNING...'} ⚡
        </div>
      )}
    </div>
  );
}
