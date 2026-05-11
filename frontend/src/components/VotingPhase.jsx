import React, { useState, useEffect, useCallback, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme } from '../i18n.js';
import { EMOJI_REACTIONS } from '../gameData.js';
import { playVoteSubmit, playTimerTick, playAlarmTick, playClick } from '../sounds.js';

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

export default function VotingPhase({ gameState, myId, lang, send }) {
  const [position, setPosition] = useState(50);
  const [voted, setVoted] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const lastTickRef = useRef(null);

  const remaining = useCountdown(gameState.timerEnd);
  const total = gameState.settings.voteTimer;
  const pct = total > 0 ? remaining / total : 0;

  // Timer tick sounds
  useEffect(() => {
    if (remaining <= 0) return;
    if (lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  const activeTeam = gameState.teams[gameState.activeTeamIndex];
  const myTeam = gameState.players.find(p => p.id === myId)?.teamIndex;
  const isActiveTeam = myTeam === gameState.activeTeamIndex;
  const isPsychic = myId === gameState.psychicId;
  const isObserver = !isActiveTeam || isPsychic;

  const submittedIds = gameState.submittedVotes || [];
  const alreadyVoted = submittedIds.includes(myId);

  // Emoji reactions feed
  useEffect(() => {
    const newReactions = (gameState.emojiReactions || []);
    if (newReactions.length === 0) return;
    const latest = newReactions[newReactions.length - 1];
    setFloatingEmojis(prev => {
      if (prev.some(e => e.id === latest.id)) return prev;
      const x = 10 + Math.random() * 80;
      const newEmoji = { ...latest, x, y: 80 };
      return [...prev.slice(-5), newEmoji];
    });
  }, [gameState.emojiReactions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFloatingEmojis(prev => prev.filter(e => Date.now() - e.ts < 2500));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleVote = () => {
    if (voted || alreadyVoted) return;
    send('submit_vote', { position });
    setVoted(true);
    playVoteSubmit();
  };

  const sendEmoji = (emoji) => {
    send('emoji_reaction', { emoji });
    playClick();
  };

  // Other voters for the panel (only show positions if we already voted)
  const otherVotes = (alreadyVoted || voted)
    ? submittedIds.filter(id => id !== myId).map(id => ({ playerId: id, position: 50 }))
    : [];

  const activeTeamPlayers = gameState.players.filter(p => p.teamIndex === gameState.activeTeamIndex);
  const voterCount = activeTeamPlayers.filter(p => p.id !== gameState.psychicId).length;
  const votedCount = submittedIds.filter(id => activeTeamPlayers.some(p => p.id === id && p.id !== gameState.psychicId)).length;

  return (
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Phase header */}
      <div>
        <h2 className="pixel-title text-center" style={{ fontSize: 'clamp(8px,2.5vw,12px)', color: 'var(--cyan)', marginBottom: 8 }}>
          {t('voting_title', lang)}
        </h2>
        <div className="text-center" style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: activeTeam.color, letterSpacing: 2 }}>
          {activeTeam.name}
        </div>
      </div>

      {/* Timer */}
      <div>
        <div className="flex justify-between mb-8" style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: 'var(--dim)' }}>
          <span>{lang === 'pt' ? 'TEMPO RESTANTE' : 'TIME REMAINING'}</span>
          <span style={{ color: pct < 0.25 ? 'var(--red)' : pct < 0.5 ? 'var(--orange)' : 'var(--cyan)' }}>
            {remaining}s
          </span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < 0.25 ? ' danger' : pct < 0.5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      {/* Theme + clue */}
      <div className="pixel-box-yellow p-16">
        <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28 }}>{gameState.currentTheme?.emoji}</div>
          <div>
            <div className="pixel-title" style={{ fontSize: 7, color: 'var(--dim)', marginBottom: 4 }}>
              {tTheme(gameState.currentTheme, lang)}
            </div>
            <div className="pixel-title mb-4" style={{ fontSize: 7, color: 'var(--dim)' }}>
              {t('psychic_clue', lang)}:
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 36, color: 'var(--yellow)', textShadow: '0 0 16px var(--yellow)', letterSpacing: 4 }}>
              {gameState.clue || '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Active team: voting panel */}
      {isActiveTeam && !isPsychic && (
        <>
          <PressurePanel
            card={gameState.currentCard}
            lang={lang}
            value={position}
            onChange={setPosition}
            disabled={alreadyVoted || voted}
          />

          {(!alreadyVoted && !voted) ? (
            <div className="text-center">
              <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 8, color: 'var(--dim)', marginBottom: 10 }}>
                {t('drag_needle', lang)}
              </div>
              <button className="btn btn-cyan btn-lg" onClick={handleVote}>
                ✓ {t('confirm_vote', lang)}: {Math.round(position)}
              </button>
            </div>
          ) : (
            <div className="pixel-box-green p-16 text-center">
              <div className="pixel-title" style={{ fontSize: 10, color: 'var(--green)' }}>
                ✓ {t('voted', lang)}
              </div>
              <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', marginTop: 6 }}>
                {t('waiting_votes', lang)} ({votedCount}/{voterCount})
              </div>
            </div>
          )}
        </>
      )}

      {/* Psychic waits */}
      {isActiveTeam && isPsychic && (
        <div className="pixel-box p-16 text-center">
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)', letterSpacing: 2 }}>
            📡 {t('waiting_votes', lang)}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', marginTop: 8 }}>
            {votedCount}/{voterCount} {t('voted_count', lang)}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {activeTeamPlayers.filter(p => p.id !== gameState.psychicId).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', border: `1px solid ${submittedIds.includes(p.id) ? 'var(--green)' : 'var(--dim)'}`,
                borderRadius: 4, fontFamily: 'var(--f-body)', fontSize: 13,
                color: submittedIds.includes(p.id) ? 'var(--green)' : 'var(--dim)',
              }}>
                {submittedIds.includes(p.id) ? '✓' : '○'} {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observers: emoji reactions */}
      {!isActiveTeam && (
        <div className="pixel-box p-16">
          <div className="pixel-title mb-12" style={{ fontSize: 7, color: 'var(--dim)', textAlign: 'center' }}>
            {t('observer_msg', lang)}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {EMOJI_REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                style={{
                  fontSize: 28, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--dim)', borderRadius: 8,
                  padding: '6px 10px', cursor: 'pointer', transition: 'transform 0.1s',
                  minWidth: 48, minHeight: 48,
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.85)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', textAlign: 'center', marginTop: 12 }}>
            {votedCount}/{voterCount} {t('voted_count', lang)}
          </div>
        </div>
      )}

      {/* Floating emoji reactions */}
      {floatingEmojis.map(e => (
        <div
          key={e.id}
          className="emoji-float"
          style={{ left: `${e.x}%`, bottom: '20%' }}
          title={e.playerName}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  );
}
