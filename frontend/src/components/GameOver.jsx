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

  const ranked = [...players].sort((a,b) => (playerScores[b.id]||0) - (playerScores[a.id]||0));
  const topScore   = playerScores[ranked[0]?.id] || 0;
  const iAmWinner  = winnerIds?.includes(myId);
  const isTie      = (winnerIds?.length || 0) > 1;
  const pieces     = useConfetti(iAmWinner);
  const podium = ranked.slice(0, 3);

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
      Object.entries(r.votes||{}).forEach(([pid,vote]) => {
        const pos = votePosition(vote);
        if (pos === null) return;
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

      <div className="panel bevel glow-cyan" style={{ width:'100%', maxWidth:620, padding:'18px 16px 14px' }}>
        <div className="label mb-12" style={{ color:'var(--ink-dim)', textAlign:'center' }}>
          PODIUM
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:10, alignItems:'end' }}>
          {[podium[1], podium[0], podium[2]].map((p, slot) => {
            if (!p) return <div key={slot} />;
            const rank = ranked.findIndex((player) => player.id === p.id) + 1;
            const score = playerScores[p.id] || 0;
            const isWin = winnerIds?.includes(p.id);
            const height = rank === 1 ? 98 : rank === 2 ? 74 : 58;
            return (
              <div key={p.id} style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <ShipIcon
                  ship={p.ship || 'nova_01'}
                  color={p.shipColor || 'blue'}
                  accent={p.shipAccent || 'cyan'}
                  pixel={rank === 1 ? 6 : 5}
                  glow={isWin}
                />
                <div className="t-title" style={{ fontSize: rank === 1 ? 10 : 8, color: isWin ? 'var(--neon-mint)' : 'var(--ink)' }}>
                  {p.name}
                </div>
                <div
                  style={{
                    width:'100%',
                    minHeight:height,
                    border:'1px solid var(--metal-2)',
                    borderTop:`3px solid ${isWin ? 'var(--neon-mint)' : p.color}`,
                    background:isWin ? 'rgba(0,255,136,.07)' : 'rgba(255,255,255,.025)',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:3,
                  }}
                >
                  <div className="t-read" style={{ fontSize:28, color:isWin ? 'var(--neon-mint)' : p.color }}>
                    #{rank}
                  </div>
                  <div className="t-mono" style={{ fontSize:13, color:'var(--ink-dim)' }}>
                    {score} PTS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner or Tie */}
      {isTie ? (
        <div className="panel bevel glow-amber p-20 text-center">
          <div className="pixel-title glow-text-amber" style={{ fontSize:'clamp(11px,3vw,16px)' }}>
            {t('tie', lang)}
          </div>
          <div style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--ink-dim)', marginTop:8 }}>
            {winnerIds?.map(id=>players.find(p=>p.id===id)?.name).join(' · ')} — {topScore} pts
          </div>
        </div>
      ) : (
        <div className="panel bevel glow-mint p-20 text-center" style={{ animation:'theme-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div className="pixel-title" style={{ fontSize:10, color:'var(--neon-mint)', marginBottom:8 }}>
            {lang==='pt'?'VENCEDOR':'WINNER'}
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
        <div className="t-mono" style={{ color:'var(--ink-dim)', fontSize:12, marginBottom:10, textAlign:'center' }}>
          {lang === 'pt' ? 'Mais pontos vence. Empates são possíveis.' : 'Most points wins. Ties are possible.'}
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
                  #{i+1}
                </span>
                <div style={{ width:36, height:36, borderRadius:'50%', background:`${p.color}22`, border:`2px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-pixel)', fontSize:9, color:p.color, flexShrink:0 }}>
                  {p.name.slice(0,2).toUpperCase()}
                </div>
                <span style={{ flex:1, fontFamily:'var(--f-body)', fontWeight:800, fontSize:14, color: isMe ? p.color : 'var(--ink)' }}>
                  {p.name}
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
            {t('new_mission', lang)}
          </button>
          <button className="btn btn-ghost" onClick={() => { playClick(); send('back_to_lobby'); }}>
            {t('new_crew', lang)}
          </button>
        </div>
      ) : (
        <div style={{ fontFamily:'var(--f-body)', fontSize:14, color:'var(--ink-dim)' }}>
          {lang==='pt'?'Aguardando capitao...':'Waiting for captain...'}
        </div>
      )}
    </div>
  );
}
