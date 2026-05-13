import React, { useState, useEffect, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { tCard } from '../i18n.js';
import { EMOJI_REACTIONS } from '../gameData.js';
import { playVoteSubmit, playTimerTick, playAlarmTick, playClick } from '../sounds.js';

function useCountdown(timerEnd) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!timerEnd) { setRemaining(0); return undefined; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerEnd]);
  return remaining;
}

export default function VotingPhase({ gameState, myId, lang, send, isHost }) {
  const [position, setPosition] = useState(50);
  const [confirmedOnce, setConfirmedOnce] = useState(false);
  const [lastVoted, setLastVoted] = useState(null);
  const [boost, setBoost] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const lastTickRef = useRef(null);

  const remaining = useCountdown(gameState.timerEnd);
  const total = gameState.settings?.voteTimer ?? 60;
  const pct = total > 0 ? remaining / total : 0;

  useEffect(() => {
    if (remaining <= 0 || lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const isPsychic = myId === gameState.psychicId;
  const canVote = !isPsychic;

  const submittedIds = gameState.submittedVotes || [];
  const nonPsychicVoters = gameState.players.filter(p => p.id !== gameState.psychicId && (p.isBot || p.connected !== false));
  const votedCount = submittedIds.filter(id => nonPsychicVoters.some(p => p.id === id)).length;

  useEffect(() => {
    const reactions = gameState.emojiReactions || [];
    if (!reactions.length) return;
    const latest = reactions[reactions.length - 1];
    setFloatingEmojis(prev => {
      if (prev.some(e => e.id === latest.id)) return prev;
      return [...prev.slice(-5), { ...latest, x: 10 + Math.random() * 80 }];
    });
  }, [gameState.emojiReactions]);

  useEffect(() => {
    const id = setInterval(() => {
      setFloatingEmojis(prev => prev.filter(e => Date.now() - e.ts < 2500));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const handleConfirm = () => {
    send('submit_vote', { position, boost });
    setLastVoted(position);
    setConfirmedOnce(true);
    playVoteSubmit();
  };

  const sendEmoji = (emoji) => {
    send('emoji_reaction', { emoji });
    playClick();
  };

  return (
    <div className="phase-shell phase-shell--voting">
      <div className="vote-clue-card panel bevel glow-cyan">
        <div className="vote-clue-card__theme t-title" style={{ color: gameState.currentTheme?.color }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="vote-clue-card__clue t-title glow-text-amber">
          "{gameState.clue || '...'}"
        </div>
        <div className="vote-clue-card__spectrum t-mono text-dim">
          {tCard(gameState.currentCard, 'left', lang)} &lt;- -&gt; {tCard(gameState.currentCard, 'right', lang)}
        </div>
      </div>

      {canVote && (
        <>
          <div className="vote-pressure-card panel bevel glow-cyan">
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={position}
              onChange={setPosition}
              disabled={false}
              readoutLabel={lang === 'pt' ? 'CALIBRAGEM' : 'CALIBRATION'}
            />
          </div>

          <div className="vote-action-panel panel bevel">
            <div className="vote-action-main">
              <button
                type="button"
                className={`boost-toggle${boost ? ' is-active' : ''}`}
                onClick={() => {
                  setBoost((value) => !value);
                  playClick();
                }}
              >
                <span className="boost-toggle__label">BOOST</span>
                <span className="boost-toggle__hint">
                  {lang === 'pt' ? 'Bonus se chegar perto. Penalidade se errar longe.' : 'Bonus if close. Penalty if far.'}
                </span>
              </button>

              <div className="vote-progress">
                <span>{lang === 'pt' ? 'VOTOS' : 'VOTES'}</span>
                <strong>{votedCount}/{nonPsychicVoters.length}</strong>
                <div className="vote-progress__bar">
                  <i style={{ width: `${nonPsychicVoters.length ? (votedCount / nonPsychicVoters.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="vote-status-list">
              {nonPsychicVoters.map(p => {
                const hasVoted = submittedIds.includes(p.id);
                return (
                  <div key={p.id} className={`vote-status${hasVoted ? ' is-ready' : ''}`}>
                    <span>{hasVoted ? 'OK' : '--'}</span>
                    <b>{p.name}</b>
                  </div>
                );
              })}
            </div>
          </div>

          {!confirmedOnce ? (
            <button className="btn btn-primary btn-lg vote-confirm-btn" onClick={handleConfirm}>
              {lang === 'pt' ? 'CONFIRMAR' : 'CONFIRM'} - {Math.round(position)}{boost ? ' - BOOST' : ''}
            </button>
          ) : (
            <div className="vote-confirmed-stack">
              <div className="vote-confirmed-card panel bevel glow-mint">
                <span className="t-title glow-text-mint">OK</span>
                <div className="t-read glow-text-amber">{lastVoted}{boost ? ' BOOST' : ''}</div>
              </div>
              {Math.round(position) !== lastVoted && (
                <button className="btn btn-yellow vote-adjust-btn" onClick={handleConfirm}>
                  {lang === 'pt' ? 'AJUSTAR' : 'ADJUST'} - {Math.round(position)}{boost ? ' - BOOST' : ''}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {isPsychic && (
        <div className="vote-wait-card panel bevel glow-cyan">
          <div className="t-title glow-text-cyan">{votedCount}/{nonPsychicVoters.length}</div>
        </div>
      )}

      <div className="vote-timer">
        <div className="vote-timer__head" style={{ color: pct < .25 ? 'var(--neon-coral)' : 'var(--ink-dim)' }}>
          <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span>
          <span>{remaining}s</span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < .25 ? ' danger' : pct < .5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      <div className="reaction-dock" aria-label={lang === 'pt' ? 'Reacoes' : 'Reactions'}>
        {EMOJI_REACTIONS.map(emoji => (
          <button key={emoji} className="reaction-button" onClick={() => { sendEmoji(emoji); }}>
            {emoji}
          </button>
        ))}
      </div>

      {floatingEmojis.map(e => (
        <div key={e.id} className="emoji-float" style={{ left: `${e.x}%`, bottom: '20%' }}>
          {e.emoji}
        </div>
      ))}
    </div>
  );
}
