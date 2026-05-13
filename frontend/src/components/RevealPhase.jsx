import React, { useEffect, useRef, useState } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { playRevealDrum, playPerfect, playGoodResult, playDamageHit, playClick } from '../sounds.js';

const LOCK_SECONDS = 5;

function gradeFromDiff(diff, lang) {
  if (diff <= 5) return { label: lang === 'pt' ? 'PERFEITO' : 'PERFECT', color: 'var(--neon-mint)' };
  if (diff <= 15) return { label: lang === 'pt' ? 'MUITO PERTO' : 'VERY CLOSE', color: 'var(--neon-cyan)' };
  if (diff <= 25) return { label: lang === 'pt' ? 'PERTO' : 'CLOSE', color: 'var(--neon-amber)' };
  if (diff <= 40) return { label: lang === 'pt' ? 'RAZOAVEL' : 'REASONABLE', color: 'var(--orange)' };
  if (diff <= 60) return { label: lang === 'pt' ? 'LONGE' : 'FAR', color: 'var(--neon-coral)' };
  return { label: lang === 'pt' ? 'ERROU' : 'MISS', color: 'var(--ink-faint)' };
}

function votePosition(vote) {
  if (typeof vote === 'number') return vote;
  if (vote && Number.isFinite(Number(vote.position))) return Number(vote.position);
  return null;
}

function signed(points) {
  return `${points >= 0 ? '+' : ''}${points}`;
}

function navigatorSummary(breakdown, lang) {
  if (!breakdown) return lang === 'pt' ? 'resultado da tripulacao' : 'crew result';
  const hitWord = lang === 'pt' ? 'acertos' : 'hits';
  const strongWord = lang === 'pt' ? 'muito perto' : 'very close';
  const base = `${breakdown.hits || 0}/${breakdown.expected || 0} ${hitWord}`;
  return breakdown.strongHits > 0 ? `${base} · ${breakdown.strongHits} ${strongWord}` : base;
}

function boostLabel(diff, lang) {
  if (diff === null) return 'BOOST';
  if (diff <= 25) return lang === 'pt' ? 'BOOST ACERTOU' : 'BOOST HIT';
  return lang === 'pt' ? 'BOOST FALHOU' : 'BOOST MISSED';
}

export default function RevealPhase({ gameState, myId, lang, send }) {
  const result = gameState.revealResult;
  const psychic = gameState.players.find((player) => player.id === gameState.psychicId);
  const revealed = useRef(false);
  const [lockLeft, setLockLeft] = useState(LOCK_SECONDS);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!result || revealed.current) return;

    revealed.current = true;
    playRevealDrum();

    const votes = result.votes || {};
    const myVote = votePosition(votes[myId]);
    const myDiff = myVote !== null ? Math.abs(myVote - result.target) : null;

    setTimeout(() => {
      if (myDiff !== null && myDiff <= 5) playPerfect();
      else if (myDiff !== null && myDiff <= 25) playGoodResult();
      else if (myDiff !== null && myDiff > 40) playDamageHit(myDiff > 60);
    }, 350);

    setLockLeft(LOCK_SECONDS);
    setUnlocked(false);

    const timerId = setInterval(() => {
      setLockLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerId);
          setUnlocked(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [result, myId]);

  useEffect(() => {
    if (!result) revealed.current = false;
  }, [result]);

  if (!result) return null;

  const allVotes = result.votes || {};
  const roundScores = result.roundScores || {};
  const txScore = result.transmitterScore ?? 0;
  const txBreakdown = result.transmitterScoreBreakdown;
  const averageVote = result.averageVote ?? result.target;
  const isPsychic = gameState.psychicId === myId;
  const voters = gameState.players.filter((player) => player.id !== gameState.psychicId);

  const sortedVoters = [...voters].sort((a, b) => (roundScores[b.id] ?? 0) - (roundScores[a.id] ?? 0));
  const rankMap = {};
  sortedVoters.forEach((p, i) => { rankMap[p.id] = i + 1; });
  const rankedPlayers = gameState.players.map(p => ({ ...p, rank: rankMap[p.id] ?? null }));

  const myVote = votePosition(allVotes[myId]);
  const myDiff = myVote !== null ? Math.abs(myVote - result.target) : Math.abs(averageVote - result.target);
  const headline = gradeFromDiff(isPsychic ? Math.abs(averageVote - result.target) : myDiff, lang);

  return (
    <div className="phase-shell phase-shell--reveal">
      <div className="panel bevel glow-amber" style={{ padding: '10px 18px', textAlign: 'center', width: 'min(560px, 100%)' }}>
        <div className="t-title" style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', color: gameState.currentTheme?.color, marginBottom: 6 }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(17px, 4vw, 26px)' }}>
          "{gameState.clue}"
        </div>
        <div className="t-title text-dim" style={{ fontSize: 9, marginTop: 6 }}>
          {psychic?.name || '?'} - {lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'}
        </div>
      </div>

      <div className="panel bevel glow-cyan" style={{ width: 'min(560px, 100%)', padding: 12 }}>
        <PressurePanel
          card={gameState.currentCard}
          lang={lang}
          value={isPsychic ? averageVote : (myVote ?? averageVote)}
          onChange={() => {}}
          disabled
          showTarget={result.target}
          showNeedle={!isPsychic && myVote !== null}
          showMyVote={!isPsychic && myVote !== null ? myVote : null}
          readoutLabel={isPsychic ? (lang === 'pt' ? 'MEDIA' : 'AVERAGE') : (lang === 'pt' ? 'SEU PALPITE' : 'YOUR GUESS')}
          otherVotes={Object.entries(allVotes).map(([id, vote]) => ({ playerId: id, position: votePosition(vote) })).filter(v => v.position !== null)}
          players={rankedPlayers}
        />
      </div>

      <div className="panel bevel" style={{
        padding: '9px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        borderColor: headline.color,
        boxShadow: `0 0 24px ${headline.color}55`,
        width: 'min(560px, 100%)',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 6 }}>
            {isPsychic ? (lang === 'pt' ? 'MEDIA / ALVO' : 'AVG / TARGET') : (lang === 'pt' ? 'PALPITE / ALVO' : 'GUESS / TARGET')}
          </div>
          <div className="t-read glow-text-mint" style={{ fontSize: 34 }}>
            {isPsychic ? averageVote : (myVote ?? '--')} / {result.target}
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: 'var(--metal-2)' }} />
        <div style={{ textAlign: 'center' }}>
          <div className="t-title" style={{ fontSize: 17, color: headline.color, textShadow: `0 0 10px ${headline.color}` }}>
            {headline.label}
          </div>
          <div className="t-mono" style={{ fontSize: 17, marginTop: 6, color: headline.color }}>
            ±{Math.round(myDiff)} · {(roundScores[myId] ?? 0) >= 0 ? '+' : ''}{roundScores[myId] ?? 0}
          </div>
        </div>
      </div>

      <div className="panel bevel reveal-score-sheet" style={{ width: 'min(560px, 100%)', padding: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="reveal-score-row reveal-score-row--navigator">
            <div className="reveal-score-main">
              <div className="reveal-score-name reveal-score-name--navigator">{psychic?.name || '?'}</div>
              <div className="reveal-score-detail">
                {lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'} · {navigatorSummary(txBreakdown, lang)}
              </div>
              {txBreakdown?.cleanSweep && (
                <div className="reveal-score-tag reveal-score-tag--sync">
                  {lang === 'pt' ? 'SINCRONIA TOTAL' : 'FULL SYNC'}
                </div>
              )}
            </div>
            <div className="reveal-score-points reveal-score-points--navigator">
              {signed(txScore)}
            </div>
          </div>
          {sortedVoters.map((player) => {
            const rawVote = allVotes[player.id];
            const vote = votePosition(rawVote);
            const diff = vote !== null ? Math.abs(vote - result.target) : null;
            const points = roundScores[player.id] ?? 0;
            const usedSurge = rawVote?.boost;
            const isMe = player.id === myId;
            const scoreTone = points > 0 ? 'good' : points < 0 ? 'bad' : 'neutral';
            return (
              <div
                key={player.id}
                className={`reveal-score-row reveal-score-row--${scoreTone}${isMe ? ' is-me' : ''}`}
                style={{ '--player-color': player.color }}
              >
                <div className="reveal-score-main">
                  <div className="reveal-score-name">{player.name}</div>
                  <div className="reveal-score-detail">
                    {vote !== null
                      ? `${lang === 'pt' ? 'palpite' : 'guess'} ${vote} · ${lang === 'pt' ? 'alvo' : 'target'} ${result.target}`
                      : (lang === 'pt' ? 'sem voto' : 'no vote')}
                  </div>
                  {usedSurge && (
                    <div className={`reveal-score-tag${diff !== null && diff > 25 ? ' reveal-score-tag--danger' : ''}`}>
                      {boostLabel(diff, lang)}
                    </div>
                  )}
                </div>
                <div className="reveal-score-points">
                  {signed(points)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center flex-col items-center gap-8">
        {!unlocked ? (
          <>
            <div style={{ width: '100%', maxWidth: 280, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(lockLeft / LOCK_SECONDS) * 100}%`,
                  background: 'var(--neon-cyan)',
                  borderRadius: 3,
                  transition: 'width 0.9s linear',
                }}
              />
            </div>
            <span className="t-read text-dim" style={{ fontSize: 24 }}>{lockLeft}</span>
          </>
        ) : (
          <button
            className="btn btn-primary btn-lg"
            style={{ minWidth: 320, minHeight: 58, fontSize: 12, animation: 'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
            onClick={() => {
              playClick();
              send('advance_round');
            }}
          >
            {lang === 'pt' ? 'PROXIMA' : 'NEXT'}
          </button>
        )}
      </div>
    </div>
  );
}
