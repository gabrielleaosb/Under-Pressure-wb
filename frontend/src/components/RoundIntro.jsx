import React, { useEffect, useRef, useState } from 'react';

const DURATION = 6000; // ms

export default function RoundIntro({ gameState, myId, lang, onDone }) {
  const [progress, setProgress] = useState(100);
  const [fading,   setFading]   = useState(false);
  const onDoneRef  = useRef(onDone);
  const startRef   = useRef(Date.now());
  const rafRef     = useRef(null);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    // Animate progress bar
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct     = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (elapsed < DURATION - 400) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFading(true);
        setTimeout(() => onDoneRef.current?.(), 400);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line

  const dismiss = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setFading(true);
    setTimeout(() => onDoneRef.current?.(), 280);
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const activeTeam    = gameState.teams?.[gameState.activeTeamIndex];
  const transmitter   = gameState.players?.find(p => p.id === gameState.psychicId);
  const myTeam        = gameState.players?.find(p => p.id === myId)?.teamIndex;
  const isTransmitter = myId === gameState.psychicId;
  const isActive      = myTeam === gameState.activeTeamIndex;

  let roleIcon, roleLine;
  if (isTransmitter) {
    roleIcon = '📡';
    roleLine = lang === 'pt' ? 'VOCÊ TRANSMITE A DICA' : 'YOU SEND THE CLUE';
  } else if (isActive) {
    roleIcon = '🎯';
    roleLine = lang === 'pt' ? 'VOCÊ CALIBRA O PAINEL' : 'YOU CALIBRATE THE PANEL';
  } else {
    roleIcon = '👁';
    roleLine = lang === 'pt' ? 'VOCÊ ASSISTE ESTA RODADA' : 'YOU WATCH THIS ROUND';
  }

  const teamColor = activeTeam?.color || 'var(--cyan)';

  return (
    <div
      onClick={dismiss}
      style={{
        position:   'fixed', inset: 0, zIndex: 8500,
        display:    'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        cursor:     'pointer',
        opacity:    fading ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div style={{
        width: '88%', maxWidth: 340,
        background:   'rgba(4,6,18,0.97)',
        border:       `2px solid ${teamColor}`,
        borderRadius: 14,
        boxShadow:    `0 0 60px ${teamColor}44`,
        overflow:     'hidden',
        animation:    'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Progress bar at top */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: teamColor,
            boxShadow:  `0 0 8px ${teamColor}`,
            transition: 'none',
          }}/>
        </div>

        <div style={{
          padding:        '28px 28px 24px',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            22,
          textAlign:      'center',
        }}>

          {/* 1 — Active team */}
          <div>
            <div style={{ fontFamily:'var(--f-body)', fontSize:11, fontWeight:800, color:'var(--dim2)', letterSpacing:2, marginBottom:8, textTransform:'uppercase' }}>
              {lang === 'pt' ? 'rodada' : 'round'} {(gameState.round ?? 0) + 1}
            </div>
            <div className="pixel-title" style={{
              fontSize:   'clamp(16px,5vw,22px)',
              color:      teamColor,
              textShadow: `0 0 20px ${teamColor}`,
              lineHeight: 1.5,
            }}>
              {activeTeam?.name}
            </div>
          </div>

          {/* 2 — Transmitter */}
          <div style={{
            width:         '100%',
            padding:       '14px 0',
            borderTop:     '1px solid rgba(255,255,255,0.07)',
            borderBottom:  '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontFamily:'var(--f-body)', fontSize:11, fontWeight:800, color:'var(--dim2)', letterSpacing:2, marginBottom:8 }}>
              📡 {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
            </div>
            <div style={{ fontFamily:'var(--f-vt)', fontSize:36, color:'var(--yellow)', lineHeight:1 }}>
              {transmitter?.name ?? '?'}
            </div>
          </div>

          {/* 3 — Your role (one line, big) */}
          <div style={{
            width:        '100%',
            padding:      '14px 16px',
            borderRadius: 8,
            border:       `2px solid ${isTransmitter ? 'var(--yellow)' : isActive ? 'var(--cyan)' : 'var(--dim)'}`,
            background:   isTransmitter ? 'rgba(255,224,0,0.07)' : isActive ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{roleIcon}</div>
            <div className="pixel-title" style={{
              fontSize: 'clamp(9px,2.5vw,11px)',
              color:    isTransmitter ? 'var(--yellow)' : isActive ? 'var(--cyan)' : 'var(--dim2)',
              lineHeight: 2,
            }}>
              {roleLine}
            </div>
          </div>

          <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--dim2)' }}>
            {lang === 'pt' ? 'toque para continuar' : 'tap to continue'}
          </div>
        </div>
      </div>
    </div>
  );
}
