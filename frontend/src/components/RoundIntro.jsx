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
  const color = isTransmitter ? 'var(--neon-amber)' : 'var(--neon-cyan)';

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 8500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(5,5,16,0.78)', backdropFilter: 'blur(12px) saturate(110%)',
        cursor: 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div style={{
        width: 'min(580px, calc(100% - 32px))',
        background: 'linear-gradient(180deg, rgba(18,21,50,0.98), rgba(6,8,24,0.98))',
        border: `2px solid ${color}`,
        borderRadius: 6,
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
          padding: '30px 28px 26px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 20, textAlign: 'center',
        }}>
          {/* Round counter */}
          <div>
            <div className="label" style={{ color: 'var(--ink-dim)', marginBottom: 4 }}>
              RD {String((gameState.round ?? 0) + 1).padStart(2, '0')} / {String(gameState.totalRounds ?? '?').padStart(2, '0')}
            </div>
          </div>

          {/* Transmitter */}
          <div style={{
            width: '100%', padding: '14px 0',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div className="label mb-4" style={{ color: 'var(--ink-dim)' }}>
              {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
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
            <div className="pixel-title" style={{ fontSize: 'clamp(10px,2.8vw,14px)', color, lineHeight: 1.6 }}>
              {isTransmitter
                ? (lang === 'pt' ? 'É a sua vez de transmitir!' : 'Your turn to transmit!')
                : (lang === 'pt' ? 'Calibre a posição certa' : 'Calibrate the right position')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
