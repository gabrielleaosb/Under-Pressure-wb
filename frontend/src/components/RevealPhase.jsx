import React, { useEffect, useRef, useState, useMemo } from 'react';
import PressurePanel from './PressurePanel.jsx';
import Grid2D from './Grid2D.jsx';
import {
  playPerfect, playGoodResult, playDamageHit, playClick,
  playTensionBuild, playVoteReveal, playTargetLock, playScorePop,
} from '../sounds.js';

const LOCK_SECONDS = 5;

function gradeFromDiff(diff, lang) {
  if (diff <= 5)  return { label: lang === 'pt' ? 'PERFEITO'  : 'PERFECT',    color: 'var(--neon-mint)' };
  if (diff <= 15) return { label: lang === 'pt' ? 'MUITO PERTO' : 'VERY CLOSE', color: 'var(--neon-cyan)' };
  if (diff <= 25) return { label: lang === 'pt' ? 'PERTO'     : 'CLOSE',      color: 'var(--neon-amber)' };
  if (diff <= 40) return { label: lang === 'pt' ? 'RAZOAVEL'  : 'REASONABLE', color: 'var(--orange)' };
  if (diff <= 60) return { label: lang === 'pt' ? 'LONGE'     : 'FAR',        color: 'var(--neon-coral)' };
  return { label: lang === 'pt' ? 'ERROU' : 'MISS', color: 'var(--ink-faint)' };
}

function gradeFromDist(dist, lang) {
  if (dist <= 1)   return { label: lang === 'pt' ? 'PERFEITO'    : 'PERFECT',    color: 'var(--neon-mint)' };
  if (dist <= 2)   return { label: lang === 'pt' ? 'MUITO PERTO' : 'VERY CLOSE', color: 'var(--neon-cyan)' };
  if (dist <= 3.5) return { label: lang === 'pt' ? 'PERTO'       : 'CLOSE',      color: 'var(--neon-amber)' };
  if (dist <= 5)   return { label: lang === 'pt' ? 'RAZOAVEL'    : 'REASONABLE', color: 'var(--orange)' };
  if (dist <= 7)   return { label: lang === 'pt' ? 'LONGE'       : 'FAR',        color: 'var(--neon-coral)' };
  return { label: lang === 'pt' ? 'ERROU' : 'MISS', color: 'var(--ink-faint)' };
}

function votePosition(vote) {
  if (typeof vote === 'number') return vote;
  if (vote && Number.isFinite(Number(vote.position))) return Number(vote.position);
  return null;
}

function signed(n) { return `${n >= 0 ? '+' : ''}${n}`; }

function navigatorSummary(breakdown, lang) {
  if (!breakdown) return lang === 'pt' ? 'resultado da tripulacao' : 'crew result';
  const hitWord   = lang === 'pt' ? 'acertos' : 'hits';
  const strongWord = lang === 'pt' ? 'muito perto' : 'very close';
  const base = `${breakdown.hits || 0}/${breakdown.expected || 0} ${hitWord}`;
  return breakdown.strongHits > 0 ? `${base} · ${breakdown.strongHits} ${strongWord}` : base;
}

function boostLabel(diff, lang) {
  if (diff === null)  return 'BOOST';
  if (diff <= 25) return lang === 'pt' ? 'BOOST ACERTOU' : 'BOOST HIT';
  return lang === 'pt' ? 'BOOST FALHOU' : 'BOOST MISSED';
}

export default function RevealPhase({ gameState, myId, lang, send }) {
  const result   = gameState.revealResult;
  const isGrid   = result?.isGrid;
  const psychic  = gameState.players.find(p => p.id === gameState.psychicId);

  const [cascadePhase, setCascadePhase]           = useState('idle');
  const [revealedVoteCount, setRevealedVoteCount] = useState(0);
  const [revealedScoreCount, setRevealedScoreCount] = useState(0);
  const [showTargetOnGauge, setShowTargetOnGauge] = useState(false);
  const [lockLeft, setLockLeft]                   = useState(LOCK_SECONDS);
  const [unlocked, setUnlocked]                   = useState(false);

  const activeRevealKeyRef = useRef(null);
  const startedAtRef       = useRef(null);

  const revealKey = result
    ? isGrid
      ? `${gameState.round}:${gameState.psychicId}:${result.targetX},${result.targetY}`
      : `${gameState.round}:${gameState.psychicId}:${result.target}:${result.averageVote}`
    : null;

  const allVotes    = result?.votes       || {};
  const roundScores = result?.roundScores || {};
  const txScore     = result?.transmitterScore ?? 0;
  const txBreakdown = result?.transmitterScoreBreakdown;
  const isPsychic   = gameState.psychicId === myId;
  const myVote      = isGrid ? allVotes[myId] : votePosition(allVotes[myId]);
  const averageVote = isGrid ? null : (result?.averageVote ?? result?.target ?? 50);
  const myDist      = isGrid && myVote
    ? Math.round(Math.sqrt((myVote.x - result.targetX) ** 2 + (myVote.y - result.targetY) ** 2) * 10) / 10
    : null;

  const voters = useMemo(
    () => gameState.players.filter(p => p.id !== gameState.psychicId),
    [gameState.players, gameState.psychicId],
  );

  // Vote reveal order: by position for FFA, by x for grid
  const voteOrder = useMemo(
    () => isGrid
      ? [...voters].sort((a, b) => ((allVotes[a.id]?.x ?? 5) + (allVotes[a.id]?.y ?? 5)) - ((allVotes[b.id]?.x ?? 5) + (allVotes[b.id]?.y ?? 5)))
      : [...voters].sort((a, b) => (votePosition(allVotes[a.id]) ?? 50) - (votePosition(allVotes[b.id]) ?? 50)),
    [voters, allVotes, isGrid],
  );

  // Score reveal order: worst → best (all players, navigator included)
  const scoreRevealOrder = useMemo(() => {
    if (!result) return [];
    return [...gameState.players].sort((a, b) => {
      const sa = a.id === gameState.psychicId ? txScore : (roundScores[a.id] ?? 0);
      const sb = b.id === gameState.psychicId ? txScore : (roundScores[b.id] ?? 0);
      return sa - sb;
    });
  }, [result, gameState.players, gameState.psychicId, txScore, roundScores]);

  // Votes shown as dots during cascade
  const visibleVoteDots = useMemo(
    () => voteOrder.slice(0, revealedVoteCount).map(p => {
      if (isGrid) {
        const v = allVotes[p.id];
        return v ? { playerId: p.id, x: v.x, y: v.y } : null;
      }
      return { playerId: p.id, position: votePosition(allVotes[p.id]) ?? 50 };
    }).filter(Boolean),
    [voteOrder, revealedVoteCount, allVotes, isGrid],
  );

  // All votes after target reveal
  const allVotesDots = useMemo(
    () => Object.entries(allVotes).map(([id, v]) => {
      if (isGrid) return v ? { playerId: id, x: v.x, y: v.y } : null;
      const pos = votePosition(v);
      return pos !== null ? { playerId: id, position: pos } : null;
    }).filter(Boolean),
    [allVotes, isGrid],
  );

  // Rank map (only relevant after target reveal)
  const rankedPlayers = useMemo(() => {
    const sorted = [...voters].sort((a, b) => (roundScores[b.id] ?? 0) - (roundScores[a.id] ?? 0));
    const rankMap = {};
    sorted.forEach((p, i) => { rankMap[p.id] = i + 1; });
    return gameState.players.map(p => ({ ...p, rank: rankMap[p.id] ?? null }));
  }, [voters, roundScores, gameState.players]);

  const isPostTarget = ['target', 'scores', 'done'].includes(cascadePhase);

  // ── Main cascade sequence ──────────────────────────────────────────────────
  useEffect(() => {
    if (!result || !revealKey) { activeRevealKeyRef.current = null; return undefined; }
    if (activeRevealKeyRef.current === revealKey) return undefined;
    activeRevealKeyRef.current = revealKey;

    const ids = [];
    const at = (fn, ms) => ids.push(setTimeout(fn, ms));

    setCascadePhase('intro');
    setRevealedVoteCount(0);
    setRevealedScoreCount(0);
    setShowTargetOnGauge(false);
    setUnlocked(false);
    setLockLeft(LOCK_SECONDS);
    startedAtRef.current = null;

    playTensionBuild();

    const INTRO_DUR         = 1100;
    const VOTE_INTERVAL     = 580;
    const TARGET_PAUSE      = 700;
    const SCORE_START_PAUSE = 480;
    const SCORE_INTERVAL    = 310;

    const numVoters = voteOrder.length;

    // Start vote phase
    at(() => setCascadePhase('votes'), INTRO_DUR);

    // Reveal each vote one by one
    voteOrder.forEach((_, i) => {
      at(() => {
        setRevealedVoteCount(i + 1);
        playVoteReveal(i);
      }, INTRO_DUR + (i + 1) * VOTE_INTERVAL);
    });

    const afterVotesAt = INTRO_DUR + numVoters * VOTE_INTERVAL;

    // Target lock: THE moment
    at(() => {
      setCascadePhase('target');
      setShowTargetOnGauge(true);
      playTargetLock();
      // Personal result sound after impact
      if (result.isGrid) {
        const mv = result.votes?.[myId];
        if (mv) {
          const d = Math.sqrt((mv.x - result.targetX) ** 2 + (mv.y - result.targetY) ** 2);
          setTimeout(() => {
            if (d <= 1)   playPerfect();
            else if (d <= 3.5) playGoodResult();
            else if (d > 7)    playDamageHit(d > 11);
          }, 430);
        }
      } else {
        const myV = votePosition(result.votes?.[myId]);
        if (myV !== null) {
          const d = Math.abs(myV - result.target);
          setTimeout(() => {
            if (d <= 5)       playPerfect();
            else if (d <= 25) playGoodResult();
            else if (d > 40)  playDamageHit(d > 60);
          }, 430);
        }
      }
    }, afterVotesAt + TARGET_PAUSE);

    // Scores phase
    const scoresAt = afterVotesAt + TARGET_PAUSE + SCORE_START_PAUSE;
    at(() => setCascadePhase('scores'), scoresAt);

    scoreRevealOrder.forEach((p, i) => {
      at(() => {
        setRevealedScoreCount(i + 1);
        const pts = p.id === gameState.psychicId ? txScore : (roundScores[p.id] ?? 0);
        playScorePop(pts >= 0);
      }, scoresAt + (i + 1) * SCORE_INTERVAL);
    });

    // Done → start lock timer
    const doneAt = scoresAt + (scoreRevealOrder.length + 1) * SCORE_INTERVAL + 180;
    at(() => {
      setCascadePhase('done');
      startedAtRef.current = Date.now();
    }, doneAt);

    return () => ids.forEach(clearTimeout);
  }, [revealKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lock timer (runs only in done phase) ──────────────────────────────────
  useEffect(() => {
    if (cascadePhase !== 'done' || !startedAtRef.current) return undefined;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const next = Math.max(0, LOCK_SECONDS - elapsed);
      setLockLeft(next);
      if (next === 0) setUnlocked(true);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [cascadePhase]);

  if (!result) return null;

  const myDiff = !isGrid
    ? (myVote !== null ? Math.abs(myVote - result.target) : Math.abs(averageVote - result.target))
    : null;
  const effectiveDist = isGrid
    ? (isPsychic ? result.avgDist : (myDist ?? result.avgDist))
    : null;
  const headline = isGrid
    ? gradeFromDist(effectiveDist ?? 0, lang)
    : gradeFromDiff(isPsychic ? Math.abs(averageVote - result.target) : myDiff, lang);

  // Gauge/grid props (change per phase)
  const gaugeValue       = !isGrid ? (isPsychic ? averageVote : (myVote ?? averageVote)) : null;
  const gaugeOtherVotes  = isPostTarget ? allVotesDots : visibleVoteDots;
  const gaugePlayers     = isPostTarget ? rankedPlayers : [];
  const gaugeShowTarget  = !isGrid && showTargetOnGauge ? result.target : null;
  const gaugeShowNeedle  = !isGrid && isPostTarget && !isPsychic && myVote !== null;
  const gaugeShowMyVote  = !isGrid && isPostTarget && !isPsychic && myVote !== null ? myVote : null;

  return (
    <div className="phase-shell phase-shell--reveal">

      {/* ── Clue card ── */}
      <div className="panel bevel glow-amber" style={{ padding: '10px 18px', textAlign: 'center', width: 'min(560px, 100%)' }}>
        <div className="t-title" style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', color: gameState.currentTheme?.color, marginBottom: 6 }}>
          {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
        </div>
        <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(17px, 4vw, 26px)' }}>
          "{gameState.clue}"
        </div>
        <div className="t-title text-dim" style={{ fontSize: 9, marginTop: 6 }}>
          {psychic?.name || '?'} — {lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'}
        </div>
      </div>

      {/* ── Gauge / Grid ── */}
      <div className={`reveal-gauge-panel panel bevel glow-cyan${cascadePhase === 'target' ? ' reveal-gauge-panel--locked' : ''}`}>
        {cascadePhase === 'intro' && (
          <div className="cascade-scan-overlay">
            <div className="cascade-scan-line" />
            <span className="cascade-scan-text">
              {lang === 'pt' ? 'ABRINDO ARQUIVO...' : 'OPENING FILE...'}
            </span>
            <div className="cascade-scan-bar">
              <div className="cascade-scan-bar-fill" />
            </div>
          </div>
        )}
        {isGrid ? (
          <Grid2D
            cardX={gameState.currentCardX}
            cardY={gameState.currentCardY}
            lang={lang}
            showTarget={showTargetOnGauge}
            targetX={result.targetX}
            targetY={result.targetY}
            otherVotes={gaugeOtherVotes}
            players={gaugePlayers.length ? gaugePlayers : gameState.players}
            disabled
          />
        ) : (
          <PressurePanel
            card={gameState.currentCard}
            lang={lang}
            value={gaugeValue}
            onChange={() => {}}
            disabled
            showTarget={gaugeShowTarget}
            showNeedle={gaugeShowNeedle}
            showMyVote={gaugeShowMyVote}
            readoutLabel={isPsychic
              ? (lang === 'pt' ? 'MEDIA' : 'AVERAGE')
              : (lang === 'pt' ? 'SEU PALPITE' : 'YOUR GUESS')}
            otherVotes={gaugeOtherVotes}
            players={gaugePlayers}
          />
        )}
        {cascadePhase === 'target' && <div className="cascade-target-flash" />}
      </div>

      {/* ── Vote progress dots (votes phase) ── */}
      {cascadePhase === 'votes' && (
        <div className="cascade-vote-progress">
          <span className="t-title text-dim" style={{ fontSize: 8, letterSpacing: 2 }}>
            {lang === 'pt' ? 'DETECTANDO SINAIS' : 'DETECTING SIGNALS'}
          </span>
          <div className="cascade-vote-dots">
            {voteOrder.map((p, i) => (
              <div
                key={p.id}
                className={[
                  'cascade-vote-dot',
                  i < revealedVoteCount
                    ? (i === revealedVoteCount - 1 ? 'is-live' : 'is-revealed')
                    : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Target confirmed banner (target phase) ── */}
      {cascadePhase === 'target' && (
        <div className="cascade-target-banner panel bevel glow-mint">
          <div style={{ textAlign: 'center' }}>
            <div className="t-title" style={{ fontSize: 9, color: 'var(--neon-mint)', letterSpacing: 2, marginBottom: 4 }}>
              {lang === 'pt' ? '▣  ALVO CONFIRMADO' : '▣  TARGET CONFIRMED'}
            </div>
            <div className="t-read" style={{ color: 'var(--neon-mint)', fontSize: 48, textShadow: '0 0 22px rgba(0,255,136,0.85)', lineHeight: 1 }}>
              {isGrid ? `(${result.targetX}, ${result.targetY})` : result.target}
            </div>
          </div>
        </div>
      )}

      {/* ── My result headline (after target) ── */}
      {isPostTarget && (
        <div
          className="panel bevel"
          style={{
            padding: '9px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            borderColor: headline.color,
            boxShadow: `0 0 24px ${headline.color}55`,
            width: 'min(560px, 100%)',
            justifyContent: 'center',
            animation: cascadePhase === 'target' ? 'cascade-slide-in 0.4s ease-out 0.4s both' : 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 6 }}>
              {isPsychic
                ? (lang === 'pt' ? 'MEDIA / ALVO' : 'AVG / TARGET')
                : (lang === 'pt' ? 'PALPITE / ALVO' : 'GUESS / TARGET')}
            </div>
            <div className="t-read glow-text-mint" style={{ fontSize: isGrid ? 22 : 34 }}>
              {isGrid
                ? isPsychic
                  ? `avg ±${result.avgDist}`
                  : myVote
                    ? `(${myVote.x},${myVote.y}) / (${result.targetX},${result.targetY})`
                    : '--'
                : `${isPsychic ? averageVote : (myVote ?? '--')} / ${result.target}`
              }
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--metal-2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div className="t-title" style={{ fontSize: 17, color: headline.color, textShadow: `0 0 10px ${headline.color}` }}>
              {headline.label}
            </div>
            <div className="t-mono" style={{ fontSize: 17, marginTop: 6, color: headline.color }}>
              {isGrid ? `±${effectiveDist}` : `±${Math.round(myDiff)}`} · {signed(isPsychic ? txScore : (roundScores[myId] ?? 0))}
            </div>
          </div>
        </div>
      )}

      {/* ── Score list (scores / done phase) ── */}
      {(cascadePhase === 'scores' || cascadePhase === 'done') && (
        <div className="panel bevel reveal-score-sheet" style={{ width: 'min(560px, 100%)', padding: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {scoreRevealOrder.slice(0, revealedScoreCount).map((player) => {
              const isNavigator = player.id === gameState.psychicId;
              const rawVote     = allVotes[player.id];
              const vote        = isNavigator ? null : isGrid ? rawVote : votePosition(rawVote);
              const diff        = !isGrid && vote !== null ? Math.abs(vote - result.target) : null;
              const dist2d      = isGrid && vote ? Math.round(Math.sqrt((vote.x - result.targetX) ** 2 + (vote.y - result.targetY) ** 2) * 10) / 10 : null;
              const points      = isNavigator ? txScore : (roundScores[player.id] ?? 0);
              const usedBoost   = rawVote?.boost;
              const isMe        = player.id === myId;
              const scoreTone   = points > 0 ? 'good' : points < 0 ? 'bad' : 'neutral';
              return (
                <div
                  key={player.id}
                  className={[
                    'reveal-score-row',
                    isNavigator ? 'reveal-score-row--navigator' : `reveal-score-row--${scoreTone}`,
                    isMe ? 'is-me' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--player-color': player.color,
                    animation: 'cascade-slide-in 0.28s ease-out, cascade-score-burst 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <div className="reveal-score-main">
                    <div className={`reveal-score-name${isNavigator ? ' reveal-score-name--navigator' : ''}`}>
                      {player.name}
                    </div>
                    <div className="reveal-score-detail">
                      {isNavigator
                        ? `${lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'} · ${navigatorSummary(txBreakdown, lang)}`
                        : vote !== null
                          ? isGrid
                            ? `(${vote.x},${vote.y}) · ±${dist2d}`
                            : `${lang === 'pt' ? 'palpite' : 'guess'} ${vote} · ±${diff}`
                          : (lang === 'pt' ? 'sem voto' : 'no vote')}
                    </div>
                    {isNavigator && txBreakdown?.cleanSweep && (
                      <div className="reveal-score-tag reveal-score-tag--sync">
                        {lang === 'pt' ? 'SINCRONIA TOTAL' : 'FULL SYNC'}
                      </div>
                    )}
                    {!isNavigator && usedBoost && (
                      <div className={`reveal-score-tag${isGrid ? (dist2d !== null && dist2d > 3.5 ? ' reveal-score-tag--danger' : '') : (diff !== null && diff > 25 ? ' reveal-score-tag--danger' : '')}`}>
                        {boostLabel(diff, lang)}
                      </div>
                    )}
                  </div>
                  <div className={`reveal-score-points${isNavigator ? ' reveal-score-points--navigator' : ''}`}>
                    {signed(points)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lock timer / Next button ── */}
      {cascadePhase === 'done' && (
        <div className="text-center flex-col items-center gap-8">
          {!unlocked ? (
            <>
              <div style={{ width: '100%', maxWidth: 280, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(lockLeft / LOCK_SECONDS) * 100}%`,
                  background: 'var(--neon-cyan)',
                  borderRadius: 3,
                  transition: 'width 0.9s linear',
                }} />
              </div>
              <span className="t-read text-dim" style={{ fontSize: 24 }}>{lockLeft}</span>
            </>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              style={{ minWidth: 320, minHeight: 58, fontSize: 12, animation: 'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
              onClick={() => { playClick(); send('advance_round'); }}
            >
              {lang === 'pt' ? 'PROXIMA' : 'NEXT'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
