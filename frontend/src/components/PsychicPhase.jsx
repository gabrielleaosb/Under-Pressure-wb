import React, { useState, useEffect, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tCard } from '../i18n.js';
import { playTimerTick, playAlarmTick, playClick } from '../sounds.js';

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

export default function PsychicPhase({ gameState, myId, lang, send, myTargetPos, isHost }) {
  const [clue, setClue] = useState('');
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const isPsychic     = gameState.psychicId === myId || (psychicPlayer?.isBot && isHost);
  const remaining     = useCountdown(gameState.timerEnd);
  const total         = gameState.settings.clueTimer;
  const pct           = total > 0 ? remaining / total : 0;

  const lastTickRef = useRef(null);
  useEffect(() => {
    if (remaining <= 0 || lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const handleSubmit = () => {
    const trimmed = clue.trim().split(/\s+/)[0];
    if (trimmed) send('submit_clue', { clue: trimmed });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 28 }}>
      <div className="panel bevel glow-amber" style={{ padding: '10px 18px', textAlign: 'center', width: 'min(420px, 100%)' }}>
        <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
          ▸ {psychicPlayer?.name || '?'} · {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 13, marginTop: 6 }}>
          {tCard(gameState.currentCard, 'left', lang)} ← → {tCard(gameState.currentCard, 'right', lang)}
        </div>
      </div>

      {isPsychic && myTargetPos !== null && (
        <>
          <div className="panel bevel glow-cyan" style={{ width: 'min(420px, 100%)', padding: 14 }}>
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={myTargetPos}
              onChange={() => {}}
              disabled
              showTarget={myTargetPos}
              readoutLabel={t('target_label', lang)}
            />
          </div>

          <div className="panel bevel" style={{ width: 'min(420px, 100%)', padding: 14 }}>
            <label className="t-title text-dim" style={{ display: 'block', fontSize: 8, marginBottom: 8 }}>
              ▸ {t('clue_label', lang)}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="input"
                value={clue}
                onChange={e => setClue(e.target.value.replace(/\s/g, ''))}
                placeholder={t('clue_ph', lang)}
                maxLength={40}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ flex: 1, minWidth: 160 }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={() => { playClick(); handleSubmit(); }} disabled={!clue.trim()}>
                ▸ {t('send_clue', lang)}
              </button>
            </div>
          </div>
        </>
      )}

      {isPsychic && myTargetPos === null && (
        <div className="panel bevel glow-cyan" style={{ width: 'min(420px, 100%)', padding: 20, textAlign: 'center' }}>
          <div className="t-title glow-text-cyan" style={{ fontSize: 10 }}>
            {lang === 'pt' ? 'RECEBENDO ALVO...' : 'RECEIVING TARGET...'}
          </div>
        </div>
      )}

      {!isPsychic && (
        <div className="panel bevel glow-cyan" style={{
          width: 'min(420px, 100%)',
          padding: 22,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>
          <div className="t-title glow-text-amber" style={{ fontSize: 12 }}>{psychicPlayer?.name || '?'}</div>
          <div className="t-mono text-dim" style={{ fontSize: 16 }}>{t('psychic_watch', lang)}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 8,
                height: 8,
                background: 'var(--neon-cyan)',
                borderRadius: '50%',
                boxShadow: '0 0 6px var(--neon-cyan)',
                animation: `flicker 1.4s steps(4) ${i * .2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ width: 'min(380px, 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-read)', fontSize: 13, color: pct < .25 ? 'var(--neon-coral)' : 'var(--ink-dim)', marginBottom: 4 }}>
          <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span>
          <span>{remaining}s</span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < .25 ? ' danger' : pct < .5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
