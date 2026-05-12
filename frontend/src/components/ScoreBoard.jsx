import React from 'react';
import ShipDisplay from './ShipDisplay.jsx';
import { t } from '../i18n.js';

export default function ScoreBoard({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { teams, damage, scores, settings, round, totalRounds, activeTeamIndex } = gameState;

  return (
    <div className="scoreboard">
      {/* Team 0 */}
      <TeamPanel idx={0} team={teams[0]} damage={damage[0]}
        maxDamage={settings.maxDamage} score={scores[0]}
        active={activeTeamIndex === 0} side="left" />

      {/* Center */}
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span className="label" style={{ color:'var(--dim2)', fontSize:9 }}>{t('round_n', lang)}</span>
        <span style={{ fontFamily:'var(--f-vt)', fontSize:26, color:'var(--cyan)', textShadow:'0 0 8px var(--cyan)', lineHeight:1 }}>
          {round + 1}/{totalRounds}
        </span>
        {/* Settings button lives here — safe from overlap */}
        <button
          onClick={onSettings}
          title="Settings"
          style={{
            marginTop:4, background:'rgba(255,255,255,0.05)',
            border:'1px solid var(--dim)', color:'var(--dim2)',
            borderRadius:6, width:28, height:28, fontSize:14,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            transition:'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.color='var(--cyan)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--dim)';  e.currentTarget.style.color='var(--dim2)'; }}
        >⚙</button>
      </div>

      {/* Team 1 */}
      <TeamPanel idx={1} team={teams[1]} damage={damage[1]}
        maxDamage={settings.maxDamage} score={scores[1]}
        active={activeTeamIndex === 1} side="right" />
    </div>
  );
}

function TeamPanel({ idx, team, damage, maxDamage, score, active, side }) {
  const color = idx === 0 ? 'var(--team0)' : 'var(--team1)';
  const pct   = damage / maxDamage;

  return (
    <div style={{
      display:'flex',
      flexDirection: side === 'left' ? 'row' : 'row-reverse',
      alignItems:'center', gap:8,
    }}>
      <ShipDisplay teamIndex={idx} damage={damage} maxDamage={maxDamage} size={44} animate={!active} />
      <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems: side==='left'?'flex-start':'flex-end' }}>
        <span style={{
          fontFamily:'var(--f-body)', fontWeight:900, fontSize:11,
          color, letterSpacing:0.5,
          textShadow: active ? `0 0 8px ${color}` : 'none',
          maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {team.name}{active && <span style={{ color:'var(--yellow)', marginLeft:4 }}>▶</span>}
        </span>
        <span style={{ fontFamily:'var(--f-vt)', fontSize:20, color:'var(--white)', lineHeight:1 }}>
          {score}pts
        </span>
        {/* HP bar */}
        <div style={{ width:64, height:4, background:'rgba(0,0,0,0.5)', borderRadius:2, border:'1px solid var(--dim)', overflow:'hidden' }}>
          <div style={{
            width:`${Math.max(0,(1-pct)*100)}%`, height:'100%',
            background: pct>0.6?'var(--red)':pct>0.3?'var(--orange)':'var(--green)',
            borderRadius:2, transition:'width 0.5s, background 0.5s',
          }}/>
        </div>
      </div>
    </div>
  );
}
