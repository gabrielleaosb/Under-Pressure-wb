import React, { useState, useEffect, useRef } from 'react';
import { tCard } from '../i18n.js';
import { playClick, playTimerTick, playAlarmTick } from '../sounds.js';

function useCountdown(timerEnd) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!timerEnd) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnd]);
  return remaining;
}

export default function CardPicker({ gameState, myId, lang, send, isHost }) {
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const isPsychic = gameState.psychicId === myId || (psychicPlayer?.isBot && isHost);
  const options = Object.values(gameState.cardPickOptions || {});
  const [selected, setSelected] = useState(null);
  const remaining = useCountdown(gameState.timerEnd);
  const total = 20;
  const pct = total > 0 ? remaining / total : 0;
  const lastTickRef = useRef(null);

  useEffect(() => {
    if (remaining <= 0 || lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const handlePick = (card) => {
    setSelected(card.id);
    playClick();
    send('pick_card', { cardId: card.id });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 28 }}>
      <div className="panel bevel glow-amber" style={{ padding: '14px 22px', textAlign: 'center', width: 'min(560px, 100%)' }}>
        <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 6 }}>
          ▸ {psychicPlayer?.name || '?'} · {lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(15px, 2.5vw, 20px)' }}>
          {lang === 'pt' ? 'Escolhendo a carta...' : 'Choosing the card...'}
        </div>
      </div>

      {isPsychic && options.length > 0 && (
        <>
          <div className="t-title text-dim" style={{ fontSize: 9 }}>
            {lang === 'pt' ? 'ESCOLHA UMA CARTA PARA TRANSMITIR' : 'CHOOSE A CARD TO TRANSMIT'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 'min(560px, 100%)' }}>
            {options.map((card) => {
              const isChosen = selected === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => handlePick(card)}
                  disabled={selected !== null}
                  className="panel bevel"
                  style={{
                    padding: '16px 20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    gap: 12,
                    cursor: selected ? 'default' : 'pointer',
                    border: `1px solid ${isChosen ? 'var(--neon-amber)' : 'rgba(255,255,255,0.1)'}`,
                    background: isChosen ? 'rgba(255,224,0,0.08)' : 'rgba(255,255,255,0.02)',
                    boxShadow: isChosen ? '0 0 20px rgba(255,224,0,0.3)' : 'none',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--f-body)',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'rgba(0,170,255,0.9)',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    ◀ {tCard(card, 'left', lang)}
                  </span>
                  <span style={{ fontFamily: 'var(--f-title)', fontSize: 8, color: 'var(--ink-dim)' }}>
                    ──────
                  </span>
                  <span style={{
                    fontFamily: 'var(--f-body)',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'rgba(255,51,85,0.9)',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {tCard(card, 'right', lang)} ▶
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isPsychic && (
        <div className="panel bevel glow-cyan" style={{
          width: 'min(560px, 100%)',
          padding: 28,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>
          <div className="t-title glow-text-amber" style={{ fontSize: 16 }}>{psychicPlayer?.name || '?'}</div>
          <div className="t-title text-dim" style={{ fontSize: 10 }}>
            {lang === 'pt' ? 'está escolhendo a carta...' : 'is choosing the card...'}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 8, height: 8,
                background: 'var(--neon-amber)',
                borderRadius: '50%',
                boxShadow: '0 0 6px var(--neon-amber)',
                animation: `flicker 1.4s steps(4) ${i * .2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {gameState.timerEnd > 0 && (
        <div style={{ width: 'min(500px, 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-read)', fontSize: 16, color: pct < .25 ? 'var(--neon-coral)' : 'var(--ink-dim)', marginBottom: 6 }}>
            <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span>
            <span>{remaining}s</span>
          </div>
          <div className="timer-bar-outer">
            <div className={`timer-bar-inner${pct < .25 ? ' danger' : pct < .5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
