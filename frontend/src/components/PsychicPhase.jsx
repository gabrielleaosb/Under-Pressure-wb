import React, { useState, useEffect, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme, tCard } from '../i18n.js';
import { playTimerTick, playAlarmTick, playClick } from '../sounds.js';

function useCountdown(timerEnd) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!timerEnd) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerEnd]);
  return remaining;
}

export default function PsychicPhase({ gameState, myId, lang, send, myTargetPos, isHost }) {
  const [clue, setClue] = useState('');
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const isPsychic     = gameState.psychicId === myId || (psychicPlayer?.isBot && isHost);
  const activeTeam    = gameState.teams[gameState.activeTeamIndex];
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
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Phase header */}
      <div className="flex items-center justify-between gap-12" style={{ flexWrap: 'wrap' }}>
        <div>
          {/* Readable round label */}
          <div className="label mb-4" style={{ color: 'var(--dim2)' }}>
            {t('round_n', lang)} {gameState.round + 1} / {gameState.totalRounds}
          </div>
          <div className="pixel-title" style={{ fontSize: 'clamp(13px,3vw,17px)', color: activeTeam.color, textShadow: `0 0 14px ${activeTeam.color}` }}>
            {activeTeam.name}
          </div>
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 8, textAlign: 'center',
          border: `2px solid ${isPsychic ? 'var(--yellow)' : 'var(--dim)'}`,
          background: isPsychic ? 'rgba(255,224,0,0.08)' : 'transparent',
        }}>
          <div className="label mb-4" style={{ color: 'var(--dim2)' }}>
            📡 {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 26, color: 'var(--yellow)', lineHeight: 1 }}>
            {psychicPlayer?.name}
          </div>
          {isPsychic && (
            <div style={{ fontFamily: 'var(--f-body)', fontSize: 11, color: 'var(--yellow)', marginTop: 4, fontWeight: 700 }}>
              {lang === 'pt' ? '← você' : '← you'}
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      <div>
        <div className="flex justify-between mb-8">
          <span className="label" style={{ color: 'var(--dim2)' }}>
            {isPsychic ? t('clue_label', lang) : t('psychic_watch', lang)}
          </span>
          <span style={{
            fontFamily: 'var(--f-vt)', fontSize: 22,
            color: pct < .25 ? 'var(--red)' : pct < .5 ? 'var(--orange)' : 'var(--cyan)',
          }}>
            {remaining}s
          </span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct<.25?' danger':pct<.5?' warn':''}`} style={{ width:`${pct*100}%` }} />
        </div>
      </div>

      {/* Theme & spectrum card */}
      <div className="pixel-box-yellow p-16 text-center">
        <div style={{ fontFamily:'var(--f-body)', fontWeight:900, fontSize:13, color:gameState.currentTheme?.color, letterSpacing:2, marginBottom:8 }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="label mb-4" style={{ color: 'var(--dim2)' }}>TEMA / THEME</div>
        <div className="pixel-title" style={{ fontSize: 'clamp(14px,3.5vw,18px)', color: 'var(--yellow)', textShadow: '0 0 14px var(--yellow)' }}>
          {tTheme(gameState.currentTheme, lang)}
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 13, color: '#88aaff' }}>
            ← {tCard(gameState.currentCard, 'left', lang)}
          </span>
          <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 13, color: '#ffaa88' }}>
            {tCard(gameState.currentCard, 'right', lang)} →
          </span>
        </div>
      </div>

      {/* Psychic: target + clue input */}
      {isPsychic && myTargetPos !== null && (
        <>
          <div className="pixel-box-red p-16">
            <div className="label mb-12" style={{ color: 'var(--dim2)' }}>
              {t('target_label', lang)}
            </div>
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={myTargetPos}
              onChange={() => {}}
              disabled
              showTarget={myTargetPos}
            />
          </div>

          <div className="pixel-box p-16">
            <label className="label" style={{ color: 'var(--dim2)', display: 'block', marginBottom: 10 }}>
              {t('clue_label', lang)}
            </label>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              <input
                className="pixel-input"
                value={clue}
                onChange={e => setClue(e.target.value.replace(/\s/g, ''))}
                placeholder={t('clue_ph', lang)}
                maxLength={40}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ flex: 1, minWidth: 160 }}
                autoFocus
              />
              <button
                className="btn btn-green"
                onClick={() => { playClick(); handleSubmit(); }}
                disabled={!clue.trim()}
              >
                📡 {t('send_clue', lang)}
              </button>
            </div>
          </div>
        </>
      )}

      {isPsychic && myTargetPos === null && (
        <div className="pixel-box p-16 text-center">
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, color: 'var(--dim2)' }}>
            ⏳ {lang === 'pt' ? 'Recebendo posição secreta...' : 'Receiving secret position...'}
          </div>
        </div>
      )}

      {!isPsychic && (
        <div className="pixel-box p-16 text-center">
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, color: 'var(--dim2)', marginBottom: 6 }}>
            📡 {t('psychic_watch', lang)}
          </div>
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--dim2)' }}>
            {lang === 'pt'
              ? `Aguardando dica de ${psychicPlayer?.name}...`
              : `Waiting for ${psychicPlayer?.name}'s clue...`}
          </div>
        </div>
      )}
    </div>
  );
}
