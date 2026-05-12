import React from 'react';
import { t } from '../i18n.js';

export default function ScoreBoard({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { players, playerScores, round, totalRounds, psychicId } = gameState;

  // Sort players by score descending
  const ranked = [...players].sort((a, b) => (playerScores[b.id]||0) - (playerScores[a.id]||0));
  // Show top 3 in scoreboard, condensed
  const top = ranked.slice(0, 4);

  return (
    <div className="scoreboard" style={{ gridTemplateColumns:'1fr auto', gap:12 }}>

      {/* Player score chips */}
      <div style={{ display:'flex', gap:6, alignItems:'center', overflow:'hidden', flexWrap:'nowrap' }}>
        {top.map((p, i) => {
          const score   = playerScores[p.id] || 0;
          const isTx    = p.id === psychicId;
          const isMe    = p.id === myId;
          return (
            <div key={p.id} style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'4px 8px', borderRadius:4,
              border:`1.5px solid ${p.color}`,
              background: isMe ? `${p.color}28` : isTx ? 'rgba(255,224,0,0.08)' : 'rgba(255,255,255,0.03)',
              flexShrink:0, maxWidth:120, minWidth:0,
            }}>
              {/* Rank */}
              <span style={{ fontFamily:'var(--f-vt)', fontSize:16, color:'var(--ink-dim)', lineHeight:1 }}>
                {i+1}.
              </span>
              {/* Avatar dot */}
              <div style={{ width:18, height:18, borderRadius:'50%', background:p.color, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-pixel)', fontSize:6, color:'#000' }}>
                {p.name[0]?.toUpperCase()}
              </div>
              {/* Name */}
              <span style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:11, color: isMe ? p.color : 'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {p.name}
                {isTx && <span style={{ color:'var(--neon-amber)', marginLeft:4 }}>TX</span>}
              </span>
              {/* Score */}
              <span style={{ fontFamily:'var(--f-vt)', fontSize:20, color:p.color, lineHeight:1, flexShrink:0 }}>
                {score}
              </span>
            </div>
          );
        })}
        {players.length > 4 && (
          <span style={{ fontFamily:'var(--f-vt)', fontSize:16, color:'var(--ink-dim)', flexShrink:0 }}>
            +{players.length - 4}
          </span>
        )}
      </div>

      {/* Center: round + settings */}
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 }}>
        <span className="label" style={{ color:'var(--ink-dim)', fontSize:8 }}>{t('round_n', lang)}</span>
        <span style={{ fontFamily:'var(--f-vt)', fontSize:24, color:'var(--neon-cyan)', textShadow:'0 0 8px var(--neon-cyan)', lineHeight:1 }}>
          {round+1}/{totalRounds}
        </span>
        <button onClick={onSettings} className="btn btn-ghost" style={{ fontSize:13, padding:'2px 6px', minHeight:26, height:26, marginTop:2 }}
          title="Settings">CONFIG</button>
      </div>
    </div>
  );
}
