import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Header */}
      <div className="text-center">
        <h2 className="pixel-title glow-text-cyan" style={{ fontSize:'clamp(13px,2.5vw,16px)', marginBottom:6 }}>
          {t('voting_title', lang)}
        </h2>
        <div style={{ fontFamily:'var(--f-body)', fontSize:13, color:'var(--ink-dim)' }}>
          {votedCount}/{nonPsychicVoters.length} {lang==='pt'?'já votaram':'have voted'}
        </div>
      </div>

      {/* Timer */}
      <div>
        <div className="flex justify-between mb-8">
          <span className="label" style={{ color: 'var(--dim2)' }}>
            {lang === 'pt' ? 'TEMPO RESTANTE' : 'TIME REMAINING'}
          </span>
          <span style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: pct < .25 ? 'var(--red)' : pct < .5 ? 'var(--orange)' : 'var(--cyan)' }}>
            {remaining}s
          </span>
        </div>
        <div className="timer-bar-outer">
          <div className={`timer-bar-inner${pct < .25 ? ' danger' : pct < .5 ? ' warn' : ''}`} style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      {/* Theme + clue */}
      <div className="pixel-box-yellow p-16">
        <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
          <div style={{ fontFamily:'var(--f-body)', fontWeight:900, fontSize:13, color:gameState.currentTheme?.color, letterSpacing:2, flexShrink:0 }}>
            {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
          </div>
          <div style={{ flex: 1 }}>
            <div className="label mb-4" style={{ color: 'var(--dim2)' }}>
              {tTheme(gameState.currentTheme, lang)}
            </div>
            <div className="label mb-4" style={{ color: 'var(--dim2)' }}>
              {t('psychic_clue', lang)}
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 38, color: 'var(--yellow)', textShadow: '0 0 14px var(--yellow)', lineHeight: 1 }}>
              {gameState.clue || '...'}
            </div>
          </div>
        </div>
      </div>

      {/* ─── VOTER PANEL ─── */}
      {canVote && (
        <div className="flex-col gap-12">

          {/* Progress: who has voted */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="label" style={{ color: 'var(--dim2)' }}>
              {votedCount}/{nonPsychicVoters.length} {lang === 'pt' ? 'votaram' : 'voted'}
            </span>
            {nonPsychicVoters.map(p => {
              const hasVoted = submittedIds.includes(p.id);
              const isMe     = p.id === myId;
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  border: `1.5px solid ${hasVoted ? p.color : 'var(--dim)'}`,
                  background: hasVoted ? `${p.color}22` : 'transparent',
                  fontFamily: 'var(--f-body)', fontSize: 12, fontWeight: 700,
                  color: hasVoted ? p.color : 'var(--dim2)',
                  transition: 'all 0.3s',
                }}>
                  <span>{hasVoted ? '✓' : '○'}</span>
                  <span>{p.name}{isMe ? (lang === 'pt' ? ' (você)' : ' (you)') : ''}</span>
                </div>
              );
            })}
          </div>

          {/* The panel */}
          <PressurePanel
            card={gameState.currentCard}
            lang={lang}
            value={position}
            onChange={setPosition}
            disabled={false}
          />

          {/* Confirm button — big and clear */}
          <div className="text-center" style={{ marginTop: 4 }}>
            {!confirmedOnce ? (
              /* First vote */
              <button
                className="btn btn-green btn-lg btn-full"
                onClick={handleConfirm}
                style={{ fontSize: 14, letterSpacing: 1 }}
              >
                ✓ {lang === 'pt' ? 'CONFIRMAR POSIÇÃO' : 'CONFIRM POSITION'} — {Math.round(position)}
              </button>
            ) : (
              /* Already voted — show confirmed + option to change */
              <div className="flex-col gap-8" style={{ alignItems: 'center' }}>
                <div style={{
                  padding: '10px 20px', borderRadius: 8,
                  border: '2px solid var(--green)', background: 'rgba(0,255,136,0.08)',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 14, color: 'var(--green)' }}>
                    ✓ {lang === 'pt' ? 'Voto enviado:' : 'Vote sent:'}
                  </span>
                  <span style={{ fontFamily: 'var(--f-vt)', fontSize: 32, color: 'var(--yellow)', lineHeight: 1 }}>
                    {lastVoted}
                  </span>
                </div>
                {/* Re-vote with new position */}
                {Math.round(position) !== lastVoted && (
                  <button
                    className="btn btn-yellow btn-full"
                    onClick={handleConfirm}
                    style={{ fontSize: 13 }}
                  >
                    ↺ {lang === 'pt' ? 'MUDAR PARA' : 'CHANGE TO'} {Math.round(position)}
                  </button>
                )}
                {Math.round(position) === lastVoted && (
                  <p style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--dim2)' }}>
                    {lang === 'pt' ? 'Mova a agulha para mudar o voto' : 'Move the needle to change your vote'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PSYCHIC: waiting ─── */}
      {isPsychic && (
        <div className="pixel-box p-16 text-center">
          <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, color: 'var(--dim2)', marginBottom: 12 }}>
            📡 {t('waiting_votes', lang)}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {nonPsychicVoters.map(p => (
              <div key={p.id} style={{
                padding: '5px 14px', borderRadius: 20,
                border: `1.5px solid ${submittedIds.includes(p.id) ? 'var(--green)' : 'var(--dim)'}`,
                color: submittedIds.includes(p.id) ? 'var(--green)' : 'var(--dim2)',
                fontFamily: 'var(--f-body)', fontSize: 13, fontWeight: 700,
              }}>
                {submittedIds.includes(p.id) ? '✓' : '○'} {p.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji reactions — shown at bottom for everyone */}
      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
        {EMOJI_REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => { sendEmoji(emoji); }}
            style={{ fontSize:22, background:'rgba(255,255,255,0.04)', border:'1px solid var(--metal-2)', borderRadius:6, padding:'6px 8px', cursor:'pointer', minWidth:42, minHeight:42 }}
            onPointerDown={e => e.currentTarget.style.transform='scale(0.85)'}
            onPointerUp={e => e.currentTarget.style.transform='scale(1)'}>
            {emoji}
          </button>
        ))}
      </div>

      {/* Floating emojis */}
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
