import React, { useMemo, useEffect, useRef, useState } from 'react';
import ShipDisplay from './ShipDisplay.jsx';
import { t } from '../i18n.js';
import { playWin, playLose, playExplosion, playClick } from '../sounds.js';

function useConfetti(active) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const colors = ['#ff4655','#00ffff','#ffff00','#00ff88','#ff00cc','#ff8800'];
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      dur: 3 + Math.random() * 3,
      rotate: Math.random() * 720,
    }));
    setPieces(p);
    return () => setPieces([]);
  }, [active]);
  return pieces;
}

export default function GameOver({ gameState, myId, lang, send, isHost }) {
  const { winner, teams, damage, scores, settings, roundHistory, players } = gameState;

  const isDraw = winner === -1;
  const isSurvival = winner !== -1;
  const winnerTeam = winner >= 0 ? teams[winner] : null;
  const loserTeam = winner >= 0 ? teams[winner === 0 ? 1 : 0] : null;
  const loserIdx = winner >= 0 ? (winner === 0 ? 1 : 0) : -1;

  const isWinnerTeam = winner >= 0 && players.find(p => p.id === myId)?.teamIndex === winner;

  const confettiActive = isSurvival && !isDraw;
  const pieces = useConfetti(confettiActive);

  // Game-over sounds
  const soundPlayed = useRef(false);
  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    const myTeam = gameState.players?.find(p => p.id === gameState.myId)?.teamIndex ?? -1;
    const explodedIdx = gameState.damage?.findIndex(d => d >= gameState.settings?.maxDamage) ?? -1;
    // Short explosion then win/lose
    if (explodedIdx !== -1) {
      playExplosion();
      setTimeout(() => {
        if (winner === -1) return;
        if (myTeam === winner) playWin(); else playLose();
      }, 1200);
    } else {
      setTimeout(() => { if (winner === -1) return; if (myTeam === winner) playWin(); else playLose(); }, 200);
    }
  }, []);

  // Easter egg: impossible case
  const easterEgg = damage.every(d => d === 0) && damage.some(d => d >= settings.maxDamage);

  // Stats
  const stats = useMemo(() => {
    if (!roundHistory || roundHistory.length === 0) return null;
    let best = roundHistory.reduce((a, b) => b.diff < a.diff ? b : a, roundHistory[0]);
    let worst = roundHistory.reduce((a, b) => b.diff > a.diff ? b : a, roundHistory[0]);

    // Best psychic: psychic with lowest avg diff in their rounds
    const psychicDiffs = {};
    roundHistory.forEach(r => {
      if (!psychicDiffs[r.psychicId]) psychicDiffs[r.psychicId] = { name: r.psychicName, diffs: [] };
      psychicDiffs[r.psychicId].diffs.push(r.diff);
    });
    let bestPsychicId = null, bestPsychicAvg = Infinity;
    Object.entries(psychicDiffs).forEach(([id, { name, diffs }]) => {
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avg < bestPsychicAvg) { bestPsychicAvg = avg; bestPsychicId = id; }
    });
    const bestPsychic = psychicDiffs[bestPsychicId] ? { name: psychicDiffs[bestPsychicId].name, avg: Math.round(bestPsychicAvg) } : null;

    return { best, worst, bestPsychic };
  }, [roundHistory]);

  // Exploded ship team
  const explodedTeamIdx = damage.findIndex(d => d >= settings.maxDamage);

  return (
    <div className="gameover-screen">
      {/* Confetti */}
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}

      {/* Easter egg */}
      {easterEgg && (
        <div className="pixel-box-red p-16 text-center" style={{ marginBottom: 16 }}>
          <div className="pixel-title" style={{ fontSize: 10, color: 'var(--red)' }}>
            ⚠ ERRO DO SISTEMA — SABOTAGEM DETECTADA 👾
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="pixel-title" style={{ fontSize: 'clamp(14px,5vw,24px)', color: 'var(--cyan)', textShadow: '0 0 20px var(--cyan)' }}>
        {t('gameover_title', lang)}
      </h1>

      {/* Result */}
      {isDraw ? (
        <div className="pixel-box-yellow p-20 text-center">
          <div className="pixel-title" style={{ fontSize: 'clamp(12px,4vw,20px)', color: 'var(--yellow)' }}>
            🤝 {t('tie', lang)}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', marginTop: 8 }}>
            {scores[0]} — {scores[1]}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 500 }}>
          {/* Winner */}
          <div className="pixel-box-green p-16 text-center">
            <div className="pixel-title mb-8" style={{ fontSize: 8, color: 'var(--green)' }}>🏆 {t('winners', lang)}</div>
            <ShipDisplay teamIndex={winner} damage={0} maxDamage={settings.maxDamage} size={64} animate />
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--green)', marginTop: 8 }}>
              {winnerTeam?.name}
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 30, color: 'var(--yellow)', textShadow: '0 0 10px var(--yellow)' }}>
              {scores[winner]}pts
            </div>
          </div>

          {/* Loser */}
          <div className="pixel-box-red p-16 text-center">
            <div className="pixel-title mb-8" style={{ fontSize: 8, color: 'var(--red)' }}>💥 {t('losers', lang)}</div>
            <ShipDisplay teamIndex={loserIdx} damage={settings.maxDamage} maxDamage={settings.maxDamage} size={64} animate={false} />
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--red)', marginTop: 8 }}>
              {loserTeam?.name}
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)' }}>
              {lang === 'pt' ? 'DESTRUÍDA' : 'DESTROYED'}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="pixel-box p-16" style={{ width: '100%', maxWidth: 500 }}>
          <div className="pixel-title mb-12 text-center" style={{ fontSize: 8, color: 'var(--dim)' }}>
            {t('stats_title', lang)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {stats.bestPsychic && (
              <div className="text-center">
                <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', marginBottom: 6 }}>{t('best_psychic', lang)}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--cyan)' }}>{stats.bestPsychic.name}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: 'var(--dim)' }}>~±{stats.bestPsychic.avg}</div>
              </div>
            )}
            {stats.best && (
              <div className="text-center">
                <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', marginBottom: 6 }}>{t('best_hit', lang)}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--green)' }}>±{Math.round(stats.best.diff)}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 16, color: 'var(--dim)' }}>{stats.best.clue}</div>
              </div>
            )}
            {stats.worst && (
              <div className="text-center">
                <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', marginBottom: 6 }}>{t('worst_miss', lang)}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--red)' }}>±{Math.round(stats.worst.diff)}</div>
                <div style={{ fontFamily: 'var(--f-vt)', fontSize: 16, color: 'var(--dim)' }}>{stats.worst.clue}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score comparison */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontFamily: 'var(--f-vt)', fontSize: 28 }}>
        <span style={{ color: teams[0].color }}>{teams[0].name}: {scores[0]}pts</span>
        <span style={{ color: 'var(--dim)' }}>VS</span>
        <span style={{ color: teams[1].color }}>{teams[1].name}: {scores[1]}pts</span>
      </div>

      {/* Buttons */}
      {isHost && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-green btn-lg" onClick={() => { playClick(); send('new_game'); }}>
            🚀 {t('new_mission', lang)}
          </button>
          <button className="btn btn-cyan" onClick={() => { playClick(); send('back_to_lobby'); }}>
            🏠 {t('new_crew', lang)}
          </button>
        </div>
      )}
      {!isHost && (
        <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', letterSpacing: 2 }}>
          📡 {lang === 'pt' ? 'Aguardando capitão...' : 'Waiting for captain...'}
        </div>
      )}
    </div>
  );
}
