import React, { useEffect, useRef, useState } from 'react';

const DURATION = 5500; // ms visible before auto-dismiss

export default function RoundIntro({ gameState, myId, lang, onDone }) {
  const [fading, setFading] = useState(false);
  const onDoneRef = useRef(onDone);
  const timerRef  = useRef(null);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => onDoneRef.current?.(), 350);
    }, DURATION);
    return () => clearTimeout(timerRef.current);
  }, []);

  const dismiss = () => {
    clearTimeout(timerRef.current);
    setFading(true);
    setTimeout(() => onDoneRef.current?.(), 280);
  };

  const transmitter   = gameState.players?.find(p => p.id === gameState.psychicId);
  const isTransmitter = myId === gameState.psychicId;

  const color    = isTransmitter ? 'var(--neon-amber)' : 'var(--neon-cyan)';
  const roleIcon = isTransmitter ? '📡' : '🎯';
  const roleLine = isTransmitter
    ? (lang === 'pt' ? 'VOCÊ TRANSMITE A DICA' : 'YOU SEND THE CLUE')
    : (lang === 'pt' ? 'VOCÊ CALIBRA O PAINEL' : 'YOU CALIBRATE THE PANEL');
  const roleHint = isTransmitter
    ? (lang === 'pt' ? 'Gire a roleta · Escolha a pista' : 'Spin the wheel · Give the clue')
    : (lang === 'pt' ? 'Ouça a pista · Ajuste o ponteiro' : 'Hear the clue · Adjust the needle');

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 8500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div style={{
        width: '88%', maxWidth: 340,
        background: 'rgba(4,6,18,0.97)',
        border: `2px solid ${color}`,
        borderRadius: 14,
        boxShadow: `0 0 60px ${color}44`,
        overflow: 'hidden',
        animation: 'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Progress bar — pure CSS, no JS updates */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: '100%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            transformOrigin: 'left center',
            animation: `progress-shrink ${DURATION}ms linear forwards`,
          }}/>
        </div>

        <div style={{
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, textAlign: 'center',
        }}>
          {/* Round counter */}
          <div>
            <div className="label" style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>
              {lang === 'pt' ? 'RODADA' : 'ROUND'}&nbsp;
              {(gameState.round ?? 0) + 1} / {gameState.totalRounds ?? '?'}
            </div>
          </div>

          {/* Transmitter */}
          <div style={{
            width: '100%', padding: '14px 0',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="label mb-4" style={{ color: 'var(--ink-dim)' }}>
              📡 {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 36, color: 'var(--neon-amber)', lineHeight: 1 }}>
              {transmitter?.name ?? '?'}
            </div>
          </div>

          {/* Role box */}
          <div style={{
            width: '100%', padding: '14px 16px', borderRadius: 8,
            border: `2px solid ${color}`,
            background: `${color}09`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{roleIcon}</div>
            <div className="pixel-title" style={{ fontSize: 'clamp(9px,2.5vw,11px)', color, lineHeight: 2 }}>
              {roleLine}
            </div>
            <div style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--ink-dim)', marginTop: 6 }}>
              {roleHint}
            </div>
          </div>

          <div style={{ fontFamily: 'var(--f-body)', fontSize: 11, color: 'var(--ink-dim)' }}>
            {lang === 'pt' ? 'toque para continuar' : 'tap to continue'}
          </div>
        </div>
      </div>
    </div>
  );
}
