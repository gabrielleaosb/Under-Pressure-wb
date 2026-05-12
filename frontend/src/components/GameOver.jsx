import React, { useMemo, useEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { playWin, playLose, playClick } from '../sounds.js';
import { ShipIcon } from './ShipRoster.jsx';

function useConfetti(active) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const colors = ['#00ffff','#ff3355','#ffe000','#00ff88','#b066ff','#ff8800'];
    setPieces(Array.from({length:60}, (_,i) => ({
      id:i, x:Math.random()*100,
      color:colors[i%colors.length],
      delay:Math.random()*3,
      dur:3+Math.random()*3,
    })));
    return () => setPieces([]);
  }, [active]);
  return pieces;
}

export default function GameOver({ gameState, myId, lang, send, isHost }) {
  const { players, playerScores, winner, winnerIds, settings } = gameState;
  const soundPlayed = useRef(false);

  // Sort by score
  const ranked = [...players].sort((a,b) => (playerScores[b.id]||0) - (playerScores[a.id]||0));
  const topScore   = playerScores[ranked[0]?.id] || 0;
  const iAmWinner  = winnerIds?.includes(myId);
  const isTie      = (winnerIds?.length || 0) > 1;
  const pieces     = useConfetti(iAmWinner);
  const winningPlayer = players.find(p => p.id === winner);
  const runnerUp = ranked.find(p => p.id !== winner);

  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    setTimeout(() => { iAmWinner ? playWin() : playLose(); }, 300);
  }, []);

  // Stats from roundHistory
  const stats = useMemo(() => {
    const hist = gameState.roundHistory || [];
    if (!hist.length) return null;

    // Best transmitter: avg diff of group when they transmitted
    const txDiffs = {};
    hist.forEach(r => {
      if (!r.transmitterId) return;
      if (!txDiffs[r.transmitterId]) txDiffs[r.transmitterId] = { name:r.transmitterName, diffs:[] };
      if (r.avgDiff !== undefined) txDiffs[r.transmitterId].diffs.push(r.avgDiff);
    });
    let bestTxId=null, bestTxAvg=Infinity;
    Object.entries(txDiffs).forEach(([id,{diffs}]) => {
      const avg = diffs.reduce((a,b)=>a+b,0)/diffs.length;
      if (avg < bestTxAvg) { bestTxAvg=avg; bestTxId=id; }
    });

    // Best single vote (closest to target)
    let bestVote=null, bestDiff=Infinity;
    hist.forEach(r => {
      Object.entries(r.votes||{}).forEach(([pid,pos]) => {
        const d = Math.abs(pos - r.target);
        if (d < bestDiff && r.transmitterId !== pid) {
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

  return (
    <div className="gameover-screen">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left:`${p.x}%`, top:'-10px', background:p.color,
          animationDuration:`${p.dur}s`, animationDelay:`${p.delay}s`,
        }}/>
      ))}

      {/* Title */}
      <h1 className="pixel-title glow-text-cyan" style={{ fontSize:'clamp(14px,5vw,22px)' }}>
        {t('gameover_title', lang)}
      </h1>

      <div style={{ display: 'flex', gap: 34, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
        {runnerUp && (
          <div className="text-center">
            <div className="t-title glow-text-coral" style={{ fontSize: 8, marginBottom: 10 }}>
              {lang === 'pt' ? 'NAVE AVARIADA' : 'SHIP DAMAGED'}
            </div>
            <ShipIcon ship={runnerUp.ship || 'nova_01'} color={runnerUp.shipColor || 'red'} damage={3} pixel={6} shake />
            <div className="t-mono text-dim" style={{ fontSize: 14, marginTop: 10 }}>{runnerUp.name}</div>
          </div>
        )}
        {winningPlayer && (
          <div className="text-center">
            <div className="t-title glow-text-mint" style={{ fontSize: 8, marginBottom: 10 }}>
              {lang === 'pt' ? 'NAVE SOBREVIVEU' : 'SHIP SURVIVED'}
            </div>
            <ShipIcon ship={winningPlayer.ship || 'nova_01'} color={winningPlayer.shipColor || 'blue'} damage={0} pixel={7} glow />
            <div className="t-mono glow-text-amber" style={{ fontSize: 16, marginTop: 10 }}>{winningPlayer.name}</div>
          </div>
        )}
      </div>

      {/* Winner or Tie */}
      {isTie ? (
        <div className="panel bevel glow-amber p-20 text-center">
          <div className="pixel-title glow-text-amber" style={{ fontSize:'clamp(11px,3vw,16px)' }}>
            🤝 {t('tie', lang)}
          </div>
          <div style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--ink-dim)', marginTop:8 }}>
            {winnerIds?.map(id=>players.find(p=>p.id===id)?.name).join(' · ')} — {topScore} pts
          </div>
        </div>
      ) : (
        <div className="panel bevel glow-mint p-20 text-center" style={{ animation:'theme-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="pixel-title" style={{ fontSize:10, color:'var(--neon-mint)', marginBottom:8 }}>
            🏆 {lang==='pt'?'VENCEDOR':'WINNER'}
          </div>
          <div style={{ fontFamily:'var(--f-vt)', fontSize:40, color:'var(--neon-mint)', textShadow:'0 0 16px var(--neon-mint)', lineHeight:1 }}>
            {players.find(p=>p.id===winner)?.name ?? '?'}
          </div>
          <div style={{ fontFamily:'var(--f-vt)', fontSize:28, color:'var(--neon-amber)', marginTop:8 }}>
            {topScore} pts
          </div>
        </div>
      )}

      {/* Full leaderboard */}
      <div className="panel bevel p-16" style={{ width:'100%', maxWidth:460 }}>
        <div className="label mb-12" style={{ color:'var(--ink-dim)' }}>
          {lang==='pt'?'PLACAR FINAL':'FINAL SCORE'}
        </div>
        <div className="flex-col gap-6">
          {ranked.map((p, i) => {
            const score  = playerScores[p.id] || 0;
            const isWin  = winnerIds?.includes(p.id);
            const isMe   = p.id === myId;
            return (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 12px', borderRadius:4,
                border:`1.5px solid ${isWin ? 'var(--neon-mint)' : isMe ? p.color : 'rgba(255,255,255,0.07)'}`,
                background: isWin ? 'rgba(0,255,136,0.07)' : isMe ? `${p.color}12` : 'transparent',
              }}>
                <span style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--ink-dim)', minWidth:28 }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}
                </span>
                <div style={{ width:36, height:36, borderRadius:'50%', background:`${p.color}22`, border:`2px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-pixel)', fontSize:9, color:p.color, flexShrink:0 }}>
                  {p.name.slice(0,2).toUpperCase()}
                </div>
                <span style={{ flex:1, fontFamily:'var(--f-body)', fontWeight:800, fontSize:14, color: isMe ? p.color : 'var(--ink)' }}>
                  {p.name}{isMe && <span style={{ fontSize:10, color:'var(--neon-amber)', marginLeft:6 }}>← você</span>}
                </span>
                <span style={{ fontFamily:'var(--f-vt)', fontSize:28, color:isWin?'var(--neon-mint)':p.color, lineHeight:1 }}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="panel bevel p-16" style={{ width:'100%', maxWidth:460 }}>
          <div className="label mb-12" style={{ color:'var(--ink-dim)' }}>
            {lang==='pt'?'DESTAQUES':'HIGHLIGHTS'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {stats.bestTx && (
              <div className="text-center">
                <div className="label mb-6" style={{ color:'var(--ink-dim)' }}>{t('best_psychic', lang)}</div>
                <div style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--neon-cyan)' }}>{stats.bestTx.name}</div>
                <div style={{ fontFamily:'var(--f-vt)', fontSize:18, color:'var(--ink-dim)' }}>~±{stats.bestTx.avg}</div>
              </div>
            )}
            {stats.bestVote && (
              <div className="text-center">
                <div className="label mb-6" style={{ color:'var(--ink-dim)' }}>{t('best_hit', lang)}</div>
                <div style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--neon-mint)' }}>{stats.bestVote.name}</div>
                <div style={{ fontFamily:'var(--f-vt)', fontSize:18, color:'var(--ink-dim)' }}>±{stats.bestVote.diff} · "{stats.bestVote.clue}"</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buttons */}
      {isHost ? (
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => { playClick(); send('new_game'); }}>
            🚀 {t('new_mission', lang)}
          </button>
          <button className="btn btn-ghost" onClick={() => { playClick(); send('back_to_lobby'); }}>
            🏠 {t('new_crew', lang)}
          </button>
        </div>
      ) : (
        <div style={{ fontFamily:'var(--f-body)', fontSize:14, color:'var(--ink-dim)' }}>
          📡 {lang==='pt'?'Aguardando capitão...':'Waiting for captain...'}
        </div>
      )}
    </div>
  );
}
