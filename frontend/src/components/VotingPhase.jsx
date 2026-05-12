import React, { useState, useEffect, useRef, useCallback } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { tCard } from '../i18n.js';
import { EMOJI_REACTIONS } from '../gameData.js';
import { playVoteSubmit, playTimerTick, playAlarmTick, playClick } from '../sounds.js';

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

export default function VotingPhase({ gameState, myId, lang, send, isHost }) {
  const [position,       setPosition]       = useState(50);
  const [confirmedOnce,  setConfirmedOnce]  = useState(false);
  const [lastVoted,      setLastVoted]      = useState(null);
  const [overdrive,      setOverdrive]      = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const lastTickRef = useRef(null);

  const remaining = useCountdown(gameState.timerEnd);
  const total     = gameState.settings?.voteTimer ?? 60;
  const pct       = total > 0 ? remaining / total : 0;

  // Timer tick sounds
  useEffect(() => {
    if (remaining <= 0 || lastTickRef.current === remaining) return;
    lastTickRef.current = remaining;
    if (remaining <= 5) playAlarmTick();
    else if (remaining <= 10) playTimerTick();
  }, [remaining]);

  // FFA: everyone votes except the transmitter
  const isPsychic = myId === gameState.psychicId;
  const canVote   = !isPsychic;

  const submittedIds     = gameState.submittedVotes || [];
  const nonPsychicVoters = gameState.players.filter(p => p.id !== gameState.psychicId && (p.isBot || p.connected !== false));
  const votedCount       = submittedIds.filter(id => nonPsychicVoters.some(p => p.id === id)).length;

  // Emoji reactions
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

  // Submit / re-submit vote
  const handleConfirm = () => {
    send('submit_vote', { position, overdrive });
    setLastVoted(position);
    setConfirmedOnce(true);
    playVoteSubmit();
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 28 }}>
      <div className="panel bevel glow-cyan" style={{ padding: '14px 22px', textAlign: 'center', width: 'min(560px, 100%)' }}>
        <div className="t-title" style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', color: gameState.currentTheme?.color, marginBottom: 6 }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(17px, 4vw, 26px)' }}>
          "{gameState.clue || '...'}"
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 16, marginTop: 8 }}>
          {tCard(gameState.currentCard, 'left', lang)} ← → {tCard(gameState.currentCard, 'right', lang)}
        </div>
      </div>

      {canVote && (
        <>
          <div className="panel bevel glow-cyan" style={{ width: 'min(560px, 100%)', padding: 18 }}>
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={position}
              onChange={setPosition}
              disabled={false}
              readoutLabel={lang === 'pt' ? 'CALIBRAGEM' : 'CALIBRATION'}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', width: 'min(560px, 100%)' }}>
            <button
              className={`btn btn-sm ${overdrive ? 'btn-yellow' : 'btn-ghost'}`}
              onClick={() => {
                setOverdrive((value) => !value);
                playClick();
              }}
              style={{ fontSize: 9, minWidth: 132, minHeight: 40 }}
            >
              OVR x2 / DMG
            </button>
            <span className="t-title text-dim" style={{ fontSize: 9, alignSelf: 'center' }}>
              {votedCount}/{nonPsychicVoters.length}
            </span>
            {nonPsychicVoters.map(p => {
              const hasVoted = submittedIds.includes(p.id);
              return (
                <div key={p.id} className="panel" style={{
                  padding: '5px 8px',
                  borderColor: hasVoted ? 'var(--neon-mint)' : 'var(--metal-2)',
                  color: hasVoted ? 'var(--neon-mint)' : 'var(--ink-dim)',
                  fontFamily: 'var(--f-read)',
                  fontSize: 15,
                }}>
                  {hasVoted ? 'OK' : '--'} · {p.name}
                </div>
              );
            })}
          </div>

          {!confirmedOnce ? (
            <button className="btn btn-primary btn-lg" onClick={handleConfirm} style={{ minWidth: 340, fontSize: 13, minHeight: 60 }}>
              {lang === 'pt' ? 'CONFIRMAR' : 'CONFIRM'} · {Math.round(position)}{overdrive ? ' · OVR' : ''}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: 'min(460px, 100%)' }}>
              <div className="panel bevel glow-mint" style={{ padding: '10px 18px', textAlign: 'center', width: '100%' }}>
                <span className="t-title glow-text-mint" style={{ fontSize: 10 }}>
                  OK
                </span>
                <div className="t-read glow-text-amber" style={{ fontSize: 44, marginTop: 4 }}>{lastVoted}{overdrive ? ' OVR' : ''}</div>
              </div>
              {Math.round(position) !== lastVoted && (
                <button className="btn btn-yellow" onClick={handleConfirm} style={{ width: '100%', fontSize: 12, minHeight: 52 }}>
                  {lang === 'pt' ? 'AJUSTAR' : 'ADJUST'} · {Math.round(position)}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {isPsychic && (
        <div className="panel bevel glow-cyan" style={{ width: 'min(560px, 100%)', padding: 24, textAlign: 'center' }}>
          <div className="t-title glow-text-cyan" style={{ fontSize: 13 }}>{votedCount}/{nonPsychicVoters.length}</div>
        </div>
      )}

      <div style={{ width: 'min(500px, 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-read)', fontSize: 16, color: pct < .25 ? 'var(--neon-coral)' : 'var(--ink-dim)', marginBottom: 6 }}>
          <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span>
          <span>{remaining}s</span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < .25 ? ' danger' : pct < .5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {EMOJI_REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => { sendEmoji(emoji); }}
            style={{ fontSize: 18, background: 'rgba(255,255,255,.04)', border: '1px solid var(--metal-2)', borderRadius: 4, padding: '7px 10px', cursor: 'pointer', minWidth: 44, minHeight: 40 }}>
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

  function sendEmoji(emoji) {
    send('emoji_reaction', { emoji });
    playClick();
  }
}
