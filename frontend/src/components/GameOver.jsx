import React, { useMemo, useEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { playWin, playLose, playClick } from '../sounds.js';
import { ShipIcon } from './ShipRoster.jsx';

function votePosition(vote) {
  if (typeof vote === 'number') return vote;
  if (vote && Number.isFinite(Number(vote.position))) return Number(vote.position);
  return null;
}

function useConfetti(active) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const colors = ['#00ffff','#ff3355','#ffe000','#00ff88','#b066ff','#ff8800'];
    setPieces(Array.from({length:48}, (_,i) => ({
      id:i, x:Math.random()*100,
      color:colors[i%colors.length],
      delay:Math.random()*2.4,
      dur:2.8+Math.random()*2.4,
    })));
    return () => setPieces([]);
  }, [active]);
  return pieces;
}

export default function GameOver({ gameState, myId, lang, send, isHost, onLeave }) {
  const { players, playerScores, winner, winnerIds } = gameState;
  const soundPlayed = useRef(false);

  const ranked = [...players].sort((a,b) => (playerScores[b.id]||0) - (playerScores[a.id]||0));
  const iAmWinner = winnerIds?.includes(myId);
  const isTie     = (winnerIds?.length || 0) > 1;
  const pieces    = useConfetti(iAmWinner);
  const podium    = ranked.slice(0, 3);
  const hostName  = players.find(p => p.isHost)?.name;

  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    setTimeout(() => { iAmWinner ? playWin() : playLose(); }, 300);
  }, []);

  const stats = useMemo(() => {
    const hist = gameState.roundHistory || [];
    if (!hist.length) return null;
    const txDiffs = {};
    hist.forEach(r => {
      if (!r.transmitterId) return;
      if (!txDiffs[r.transmitterId]) txDiffs[r.transmitterId] = { name:r.transmitterName, diffs:[] };
      const avgDiff = r.avgDiff ?? (
        Number.isFinite(Number(r.averageVote)) && Number.isFinite(Number(r.target))
          ? Math.abs(Number(r.averageVote) - Number(r.target)) : null
      );
      if (avgDiff !== null) txDiffs[r.transmitterId].diffs.push(avgDiff);
    });
    let bestTxId=null, bestTxAvg=Infinity;
    Object.entries(txDiffs).forEach(([id,{diffs}]) => {
      if (!diffs.length) return;
      const avg = diffs.reduce((a,b)=>a+b,0)/diffs.length;
      if (avg < bestTxAvg) { bestTxAvg=avg; bestTxId=id; }
    });
    let bestVote=null, bestDiff=Infinity;
    hist.forEach(r => {
      Object.entries(r.votes||{}).forEach(([pid,vote]) => {
        const pos = votePosition(vote);
        if (pos === null) return;
        const d = Math.abs(pos - r.target);
        if (Number.isFinite(Number(r.target)) && d < bestDiff && r.transmitterId !== pid) {
          bestDiff = d;
          bestVote = { name: players.find(p=>p.id===pid)?.name || '?', diff:d, clue:r.clue };
        }
      });
    });
    return {
      bestTx: bestTxId ? { name: txDiffs[bestTxId].name, avg: Math.round(bestTxAvg) } : null,
      bestVote,
    };
  }, [gameState.roundHistory]);

  const podiumOrder = [podium[1], podium[0], podium[2]];
  const podiumHeights = [70, 100, 54];

  return (
    <div className="go-screen">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.x}%`, top:'-10px', background:p.color,
          animationDuration:`${p.dur}s`, animationDelay:`${p.delay}s`,
        }}/>
      ))}

      <div className="go-header">
        <h1 className="go-title pixel-title glow-text-cyan">
          {t('gameover_title', lang)}
        </h1>
        {isTie && (
          <span className="go-title-sub t-mono glow-text-amber">
            {t('tie', lang)} — {winnerIds?.map(id => players.find(p=>p.id===id)?.name).join(' · ')}
          </span>
        )}
      </div>

      <div className="go-body">
        {/* ── Left: Podium + Highlights ── */}
        <div className="go-left">
          <div className="panel bevel glow-cyan go-podium-panel">
            <div className="go-section-label t-title text-dim">
              {lang==='pt' ? 'PÓDIO' : 'PODIUM'}
            </div>
            <div className="go-podium">
              {podiumOrder.map((p, slot) => {
                if (!p) return <div key={slot} className="go-podium__slot" />;
                const rank = ranked.findIndex(pl => pl.id === p.id) + 1;
                const score = playerScores[p.id] || 0;
                const isWin = winnerIds?.includes(p.id);
                const isMe  = p.id === myId;
                const h = podiumHeights[slot];
                return (
                  <div key={p.id} className="go-podium__slot">
                    <ShipIcon
                      ship={p.ship || 'nova_01'}
                      color={p.shipColor || 'blue'}
                      accent={p.shipAccent || 'cyan'}
                      pixel={rank === 1 ? 5 : 4}
                      glow={isWin}
                    />
                    <div className="go-podium__name t-title" style={{
                      fontSize: rank === 1 ? 9 : 7,
                      color: isWin ? 'var(--neon-mint)' : isMe ? 'var(--neon-cyan)' : 'var(--ink)',
                      maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </div>
                    <div className="go-podium__block" style={{
                      height: h,
                      borderTop: `3px solid ${isWin ? 'var(--neon-mint)' : p.color}`,
                      background: isWin ? 'rgba(0,255,136,.08)' : `${p.color}18`,
                    }}>
                      <span className="t-read go-podium__rank" style={{
                        fontSize: rank === 1 ? 32 : 24,
                        color: isWin ? 'var(--neon-mint)' : p.color,
                      }}>#{rank}</span>
                      <span className="t-mono go-podium__pts">{score}<small> pts</small></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {stats && (stats.bestTx || stats.bestVote) && (
            <div className="panel bevel go-highlights">
              <div className="go-section-label t-title text-dim">
                {lang==='pt' ? 'DESTAQUES' : 'HIGHLIGHTS'}
              </div>
              <div className="go-highlights__grid">
                {stats.bestTx && (
                  <div className="go-highlight-card">
                    <span className="go-highlight-card__label t-title text-dim">{t('best_psychic', lang)}</span>
                    <span className="go-highlight-card__name t-read glow-text-cyan">{stats.bestTx.name}</span>
                    <span className="t-mono text-dim" style={{ fontSize:12 }}>~±{stats.bestTx.avg}</span>
                  </div>
                )}
                {stats.bestVote && (
                  <div className="go-highlight-card">
                    <span className="go-highlight-card__label t-title text-dim">{t('best_hit', lang)}</span>
                    <span className="go-highlight-card__name t-read glow-text-mint">{stats.bestVote.name}</span>
                    <span className="t-mono text-dim" style={{ fontSize:12 }}>±{stats.bestVote.diff} · "{stats.bestVote.clue}"</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Leaderboard + Actions ── */}
        <div className="go-right">
          <div className="panel bevel go-leaderboard">
            <div className="go-section-label t-title text-dim">
              {lang==='pt' ? 'PLACAR FINAL' : 'FINAL SCORE'}
            </div>
            <div className="go-lb-list">
              {ranked.map((p, i) => {
                const score = playerScores[p.id] || 0;
                const isWin = winnerIds?.includes(p.id);
                const isMe  = p.id === myId;
                return (
                  <div key={p.id} className={`go-lb-row${isWin ? ' go-lb-row--win' : ''}${isMe ? ' go-lb-row--me' : ''}`}
                    style={{ '--pc': p.color }}>
                    <span className="go-lb-rank t-mono text-dim">#{i+1}</span>
                    <ShipIcon ship={p.ship||'nova_01'} color={p.shipColor||'blue'} accent={p.shipAccent||'cyan'} pixel={2.5} />
                    <span className="go-lb-name">{p.name}</span>
                    {isMe && <span className="badge badge-you" style={{ fontSize:6 }}>{t('you', lang)}</span>}
                    <span className="go-lb-score t-read">{score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="go-actions">
            {isHost ? (
              <>
                <button className="btn btn-primary" onClick={() => { playClick(); send('new_game'); }}>
                  {t('new_mission', lang)}
                </button>
                <button className="btn btn-ghost" onClick={() => { playClick(); send('back_to_lobby'); }}>
                  {t('new_crew', lang)}
                </button>
              </>
            ) : (
              <div className="go-waiting panel bevel">
                <span className="go-waiting__icon">⏳</span>
                <div className="go-waiting__text">
                  <span className="t-title" style={{ fontSize:8, color:'var(--ink-dim)' }}>
                    {lang==='pt' ? 'AGUARDANDO ANFITRIÃO' : 'WAITING FOR HOST'}
                  </span>
                  {hostName && (
                    <span className="t-mono" style={{ fontSize:13 }}>
                      {lang==='pt' ? `${hostName} decide o próximo passo` : `${hostName} decides what's next`}
                    </span>
                  )}
                </div>
              </div>
            )}
            {onLeave && (
              <button className="btn btn-ghost" onClick={() => { playClick(); onLeave(); }}>
                {lang === 'pt' ? 'SAIR DA SALA' : 'LEAVE ROOM'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
