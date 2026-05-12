import React, { useState, useEffect, useRef, useCallback } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme, tCard } from '../i18n.js';
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
  const nonPsychicVoters = gameState.players.filter(p => p.id !== gameState.psychicId);
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
    send('submit_vote', { position });
    setLastVoted(position);
    setConfirmedOnce(true);
    playVoteSubmit();
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 28 }}>
      <div className="panel bevel glow-cyan" style={{ padding: '10px 18px', textAlign: 'center', width: 'min(420px, 100%)' }}>
        <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
          ▸ {tTheme(gameState.currentTheme, lang)} · {t('psychic_clue', lang)}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(17px, 4vw, 26px)' }}>
          "{gameState.clue || '...'}"
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 13, marginTop: 6 }}>
          {tCard(gameState.currentCard, 'left', lang)} ← → {tCard(gameState.currentCard, 'right', lang)}
        </div>
      </div>

      {canVote && (
        <>
          <div className="panel bevel glow-cyan" style={{ width: 'min(420px, 100%)', padding: 14 }}>
            <PressurePanel
              card={gameState.currentCard}
              lang={lang}
              value={position}
              onChange={setPosition}
              disabled={false}
              readoutLabel={lang === 'pt' ? 'CALIBRAGEM' : 'CALIBRATION'}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', width: 'min(420px, 100%)' }}>
            <span className="t-title text-dim" style={{ fontSize: 7, alignSelf: 'center' }}>
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
                  fontSize: 13,
                }}>
                  {hasVoted ? 'OK' : '--'} · {p.name}
                </div>
              );
            })}
          </div>

          {!confirmedOnce ? (
            <button className="btn btn-primary btn-lg" onClick={handleConfirm} style={{ minWidth: 260, fontSize: 12 }}>
              ▸ {lang === 'pt' ? 'CONFIRMAR' : 'CONFIRM'} · {Math.round(position)}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: 'min(320px, 100%)' }}>
              <div className="panel bevel glow-mint" style={{ padding: '10px 18px', textAlign: 'center', width: '100%' }}>
                <span className="t-title glow-text-mint" style={{ fontSize: 9 }}>
                  {lang === 'pt' ? 'VOTO ENVIADO' : 'VOTE SENT'}
                </span>
                <div className="t-read glow-text-amber" style={{ fontSize: 34, marginTop: 4 }}>{lastVoted}</div>
              </div>
              {Math.round(position) !== lastVoted && (
                <button className="btn btn-yellow" onClick={handleConfirm} style={{ width: '100%', fontSize: 11 }}>
                  {lang === 'pt' ? 'AJUSTAR' : 'ADJUST'} · {Math.round(position)}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {isPsychic && (
        <div className="panel bevel glow-cyan" style={{ width: 'min(420px, 100%)', padding: 18, textAlign: 'center' }}>
          <div className="t-title glow-text-cyan" style={{ fontSize: 10 }}>{t('waiting_votes', lang)}</div>
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

      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {EMOJI_REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => { sendEmoji(emoji); }}
            style={{ fontSize: 19, background: 'rgba(255,255,255,.04)', border: '1px solid var(--metal-2)', borderRadius: 4, padding: '5px 7px', cursor: 'pointer', minWidth: 36, minHeight: 36 }}>
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
