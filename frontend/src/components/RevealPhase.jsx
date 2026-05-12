import React, { useEffect, useRef, useState } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme } from '../i18n.js';
import { playRevealDrum, playPerfect, playGoodResult, playDamageHit, playClick } from '../sounds.js';

const LOCK_SECONDS = 5;

function gradeFromDiff(diff, lang) {
  if (diff <=  5) return { label: lang==='pt'?'PERFEITO!':'PERFECT!',     pts:5, color:'var(--neon-mint)'  };
  if (diff <= 15) return { label: lang==='pt'?'MUITO PERTO':'VERY CLOSE', pts:4, color:'var(--neon-cyan)'  };
  if (diff <= 25) return { label: lang==='pt'?'PERTO':'CLOSE',            pts:3, color:'var(--neon-amber)' };
  if (diff <= 40) return { label: lang==='pt'?'RAZOÁVEL':'REASONABLE',    pts:2, color:'var(--orange)'     };
  if (diff <= 60) return { label: lang==='pt'?'LONGE':'FAR',              pts:1, color:'var(--neon-coral)' };
  return            { label: lang==='pt'?'ERROU':'MISS',                  pts:0, color:'var(--ink-faint)'  };
}

export default function RevealPhase({ gameState, myId, lang, send }) {
  const result    = gameState.revealResult;
  const psychic   = gameState.players.find(p => p.id === gameState.psychicId);
  const revealed  = useRef(false);
  const [lockLeft, setLockLeft] = useState(LOCK_SECONDS);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!result || revealed.current) return;
    revealed.current = true;
    playRevealDrum();
    const votes = result.votes || {};
    const myVote = votes[myId];
    const myDiff = myVote !== undefined ? Math.abs(myVote - result.target) : null;
    setTimeout(() => {
      if (myDiff !== null && myDiff <= 5) playPerfect();
      else if (myDiff !== null && myDiff <= 25) playGoodResult();
      else if (myDiff !== null && myDiff > 40) playDamageHit(myDiff > 60);
    }, 350);

    setLockLeft(LOCK_SECONDS); setUnlocked(false);
    const id = setInterval(() => {
      setLockLeft(prev => { if (prev <= 1) { clearInterval(id); setUnlocked(true); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [result]);

  if (!result) return null;

  const allVotes     = result.votes || {};
  const roundScores  = result.roundScores || {};
  const txBonus      = result.transmitterBonus ?? 0;
  const voters       = gameState.players.filter(p => p.id !== gameState.psychicId);

  return (
    <div className="flex-col gap-16" style={{ paddingBottom:32 }}>

      {/* Target + clue summary */}
      <div className="panel bevel glow-amber p-16">
        <div className="flex items-center gap-12" style={{ flexWrap:'wrap' }}>
          <div style={{ fontFamily:'var(--f-body)', fontWeight:900, fontSize:13, color:gameState.currentTheme?.color, letterSpacing:2 }}>
            {lang==='en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
          </div>
          <div style={{ flex:1 }}>
            <div className="label mb-4" style={{ color:'var(--ink-dim)' }}>📡 {psychic?.name} · {lang==='pt'?'dica':'clue'}</div>
            <div style={{ fontFamily:'var(--f-vt)', fontSize:38, color:'var(--neon-amber)', lineHeight:1 }}>
              {gameState.clue}
            </div>
          </div>
          <div className="text-center">
            <div className="label mb-4" style={{ color:'var(--ink-dim)' }}>{lang==='pt'?'ALVO':'TARGET'}</div>
            <div style={{ fontFamily:'var(--f-vt)', fontSize:44, color:'var(--neon-mint)', textShadow:'0 0 14px var(--neon-mint)', lineHeight:1 }}>
              {result.target}
            </div>
          </div>
        </div>
      </div>

      {/* Gauge with target + all votes */}
      <PressurePanel
        card={gameState.currentCard}
        lang={lang}
        value={result.avgDiff !== undefined
          ? result.target /* show target position as reference */
          : 50}
        onChange={() => {}}
        disabled
        showTarget={result.target}
        otherVotes={Object.entries(allVotes).map(([id, pos]) => ({ playerId: id, position: pos }))}
        players={gameState.players}
      />

      {/* Individual results table */}
      <div className="panel bevel p-16">
        <div className="label mb-12" style={{ color:'var(--ink-dim)' }}>
          {lang==='pt' ? 'RESULTADOS DA RODADA' : 'ROUND RESULTS'}
        </div>
        <div className="flex-col gap-8">

          {/* Transmitter row */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:4, border:'1px solid rgba(255,224,0,0.3)', background:'rgba(255,224,0,0.05)' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`${psychic?.color}22`, border:`2px solid ${psychic?.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-pixel)', fontSize:8, color:psychic?.color }}>
              {psychic?.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:13 }}>{psychic?.name}</div>
              <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--ink-dim)' }}>
                📡 {lang==='pt'?'Transmissor':'Transmitter'} · {lang==='pt'?`bônus p/ precisão do grupo`:`group accuracy bonus`}
              </div>
            </div>
            <div style={{ fontFamily:'var(--f-vt)', fontSize:28, color:'var(--neon-amber)', lineHeight:1 }}>
              +{txBonus}
            </div>
          </div>

          {/* Voter rows */}
          {voters.map(p => {
            const vote = allVotes[p.id];
            const diff = vote !== undefined ? Math.abs(vote - result.target) : null;
            const grade = diff !== null ? gradeFromDiff(diff, lang) : null;
            const pts   = roundScores[p.id] ?? 0;
            const isMe  = p.id === myId;
            return (
              <div key={p.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 10px', borderRadius:4,
                border:`1px solid ${isMe ? p.color : 'rgba(255,255,255,0.06)'}`,
                background: isMe ? `${p.color}12` : 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:`${p.color}22`, border:`2px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-pixel)', fontSize:8, color:p.color }}>
                  {p.name.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:13 }}>
                    {p.name} {isMe && <span style={{ color:'var(--neon-amber)', fontSize:10 }}>← VOCÊ</span>}
                  </div>
                  {vote !== undefined && grade && (
                    <div style={{ fontFamily:'var(--f-vt)', fontSize:18, color:grade.color, lineHeight:1 }}>
                      {grade.label} · {lang==='pt'?'chutou':'guessed'} {vote} · ±{Math.round(diff)}
                    </div>
                  )}
                  {vote === undefined && (
                    <div style={{ fontFamily:'var(--f-body)', fontSize:11, color:'var(--ink-dim)' }}>
                      {lang==='pt'?'não votou':'did not vote'}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily:'var(--f-vt)', fontSize:30, color: pts > 0 ? grade?.color || 'var(--ink)' : 'var(--ink-faint)', lineHeight:1 }}>
                  +{pts}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next round button */}
      <div className="text-center flex-col items-center gap-8">
        {!unlocked ? (
          <>
            <div style={{ width:'100%', maxWidth:280, height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(lockLeft/LOCK_SECONDS)*100}%`, background:'var(--neon-cyan)', borderRadius:3, transition:'width 0.9s linear' }}/>
            </div>
            <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--ink-dim)' }}>
              {lang==='pt'?`disponível em ${lockLeft}s...`:`available in ${lockLeft}s...`}
            </span>
          </>
        ) : (
          <button className="btn btn-primary btn-lg" style={{ minWidth:240, animation:'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
            onClick={() => { playClick(); send('advance_round'); }}>
            ▶ {lang==='pt'?'PRÓXIMA RODADA':'NEXT ROUND'}
          </button>
        )}
      </div>
    </div>
  );
}
