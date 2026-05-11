import React, { useState, useEffect, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme, tCard } from '../i18n.js';
import { playTimerTick, playAlarmTick, playClick } from '../sounds.js';

function useCountdown(timerEnd) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!timerEnd) { setRemaining(0); return; }
    const tick = () => {
      const r = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setRemaining(r);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timerEnd]);
  return remaining;
}

export default function PsychicPhase({ gameState, myId, lang, send, myTargetPos }) {
  const [clue, setClue] = useState('');
  const isPsychic = gameState.psychicId === myId;
  const remaining = useCountdown(gameState.timerEnd);
  const total = gameState.settings.clueTimer;
  const pct = total > 0 ? remaining / total : 0;

  const lastTickRef = useRef(null);
  useEffect(() => {
    if (remaining <= 0) return;
    if (lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const activeTeam = gameState.teams[gameState.activeTeamIndex];
  const psychicPlayer = gameState.players.find(p => p.id === gameState.psychicId);

  const handleSubmit = () => {
    const trimmed = clue.trim().split(/\s+/)[0]; // only first word
    if (trimmed) send('submit_clue', { clue: trimmed });
  };

  return (
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Phase header */}
      <div className="flex items-center justify-between gap-12" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="pixel-title" style={{ fontSize: 8, color: 'var(--dim)', marginBottom: 4 }}>
            {t('round_n', lang)} {gameState.round + 1} {t('of', lang)} {gameState.totalRounds}
          </div>
          <div className="pixel-title" style={{ fontSize: 'clamp(9px,2.5vw,13px)', color: activeTeam.color, textShadow: `0 0 12px ${activeTeam.color}` }}>
            {activeTeam.name}
          </div>
        </div>
        <div className="pixel-box" style={{ padding: '8px 14px', textAlign: 'center' }}>
          <div className="pixel-title" style={{ fontSize: 7, color: 'var(--dim)', marginBottom: 4 }}>PSÍQUICO / PSYCHIC</div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--yellow)', textShadow: '0 0 8px var(--yellow)' }}>
            {psychicPlayer?.name}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div>
        <div className="flex justify-between mb-8" style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: 'var(--dim)' }}>
          <span>{isPsychic ? t('clue_label', lang) : t('psychic_watch', lang)}</span>
          <span style={{ color: pct < 0.25 ? 'var(--red)' : pct < 0.5 ? 'var(--orange)' : 'var(--cyan)' }}>
            {remaining}s
          </span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < 0.25 ? ' danger' : pct < 0.5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      {/* Theme & card */}
      <div className="pixel-box-yellow p-16 text-center">
        <div style={{ fontSize: 28, marginBottom: 8 }}>{gameState.currentTheme?.emoji}</div>
        <div className="pixel-title" style={{ fontSize: 8, color: 'var(--dim)', marginBottom: 4 }}>TEMA / THEME</div>
        <div className="pixel-title" style={{ fontSize: 'clamp(9px,3vw,14px)', color: 'var(--yellow)', textShadow: '0 0 12px var(--yellow)' }}>
          {tTheme(gameState.currentTheme, lang)}
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 8, color: '#88aaff' }}>
            ← {tCard(gameState.currentCard, 'left', lang)}
          </span>
          <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 8, color: '#ffaa88' }}>
            {tCard(gameState.currentCard, 'right', lang)} →
          </span>
        </div>
      </div>

      {/* Psychic view: target + panel + clue input */}
      {isPsychic && myTargetPos !== null && (
        <>
          <div className="pixel-box-red p-16">
            <div className="pixel-title mb-8" style={{ fontSize: 7, color: 'var(--dim)' }}>{t('target_label', lang)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'var(--f-vt)', fontSize: 48, color: 'var(--red)', textShadow: '0 0 16px var(--red)', lineHeight: 1 }}>
                {myTargetPos}
              </div>
              <div style={{ flex: 1 }}>
                <PressurePanel
                  card={gameState.currentCard}
                  lang={lang}
                  value={myTargetPos}
                  onChange={() => {}}
                  disabled
                  showTarget={myTargetPos}
                />
              </div>
            </div>
          </div>

          <div className="pixel-box p-16">
            <label className="pixel-title" style={{ fontSize: 7, color: 'var(--dim)', display: 'block', marginBottom: 10 }}>
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
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)', letterSpacing: 2 }}>
            ⏳ {lang === 'pt' ? 'Recebendo posição secreta...' : 'Receiving secret position...'}
          </div>
        </div>
      )}

      {!isPsychic && (
        <div className="pixel-box p-16 text-center">
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)', letterSpacing: 2 }}>
            📡 {t('psychic_watch', lang)}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: 'var(--dim)', marginTop: 8 }}>
            {lang === 'pt'
              ? `Aguardando dica de ${psychicPlayer?.name}...`
              : `Waiting for ${psychicPlayer?.name}'s clue...`}
          </div>
        </div>
      )}
    </div>
  );
}
