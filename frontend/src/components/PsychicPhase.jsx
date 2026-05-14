import React, { useEffect, useRef, useState } from 'react';
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
  const [chosenPos, setChosenPos] = useState(50);
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const isPsychic = gameState.psychicId === myId;
  const chooseMode = gameState.settings?.targetMode === 'choose';
  const remaining = useCountdown(gameState.timerEnd);
  const total = gameState.settings.clueTimer;
  const pct = total > 0 ? remaining / total : 0;
  const roleLabel = lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR';

  const lastTickRef = useRef(null);
  useEffect(() => {
    if (remaining <= 0 || lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const handleSubmit = () => {
    const trimmed = clue.trim();
    if (!trimmed) return;
    if (chooseMode) send('submit_clue', { clue: trimmed, position: chosenPos });
    else send('submit_clue', { clue: trimmed });
  };

  const spectrumLabel = `${tCard(gameState.currentCard, 'left', lang)} <- -> ${tCard(gameState.currentCard, 'right', lang)}`;

  return (
    <div className="phase-shell">
      <div className="phase-card panel bevel glow-amber text-center">
        <div className="phase-kicker t-title text-dim">
          {psychicPlayer?.name || '?'} / {roleLabel}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(18px, 3vw, 28px)' }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 16, marginTop: 8 }}>
          {spectrumLabel}
        </div>
      </div>

      {isPsychic && chooseMode && (
        <>
          <div className="phase-card panel bevel glow-cyan">
            <div className="phase-kicker t-title text-dim">
              {lang === 'pt' ? 'ESCOLHA A POSICAO ALVO' : 'CHOOSE THE TARGET POSITION'}
            </div>
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={chosenPos}
              onChange={setChosenPos}
              disabled={false}
              readoutLabel={lang === 'pt' ? 'POSICAO ALVO' : 'TARGET POSITION'}
            />
          </div>
          <ClueEntry
            lang={lang}
            clue={clue}
            setClue={setClue}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {isPsychic && myTargetPos !== null && !chooseMode && (
        <>
          <div className="phase-card panel bevel glow-cyan">
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

          <ClueEntry
            lang={lang}
            clue={clue}
            setClue={setClue}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {isPsychic && myTargetPos === null && !chooseMode && (
        <div className="phase-card panel bevel glow-cyan text-center">
          <div className="t-title glow-text-cyan" style={{ fontSize: 13 }}>
            ...
          </div>
        </div>
      )}

      {!isPsychic && (
        <div className="phase-card panel bevel glow-cyan phase-waiting">
          <div className="t-title glow-text-amber" style={{ fontSize: 16 }}>{psychicPlayer?.name || '?'}</div>
          <div className="phase-waiting__dots">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ animationDelay: `${i * .2}s` }} />
            ))}
          </div>
        </div>
      )}

      <PhaseTimer lang={lang} remaining={remaining} pct={pct} />
    </div>
  );
}

function ClueEntry({ lang, clue, setClue, onSubmit }) {
  return (
    <div className="phase-card panel bevel">
      <label className="phase-kicker t-title text-dim">
        {lang === 'pt' ? 'SUA DICA' : 'YOUR CLUE'}
      </label>
      <div className="phase-input-row">
        <input
          className="input"
          value={clue}
          onChange={e => setClue(e.target.value)}
          placeholder={t('clue_ph', lang)}
          maxLength={40}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          autoFocus
        />
        <button className="btn btn-primary" onClick={() => { playClick(); onSubmit(); }} disabled={!clue.trim()}>
          {t('send_clue', lang)}
        </button>
      </div>
    </div>
  );
}

function PhaseTimer({ lang, remaining, pct }) {
  const danger = pct < .25;
  const warn = pct < .5;
  return (
    <div className="phase-timer">
      <div className="phase-timer__label" style={{ color: danger ? 'var(--neon-coral)' : 'var(--ink-dim)' }}>
        <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span>
        <span>{remaining}s</span>
      </div>
      <div className="timer-bar-outer">
        <div className={`timer-bar-inner${danger ? ' danger' : warn ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}
