/**
 * RankingSidebar — shown during gameplay (roulette, psychic, voting, reveal).
 * Ported from the design's RankingPanel + FFATopBar.
 * Desktop: 240px right column. Mobile: compact top bar.
 */
import React from 'react';
import { ShipIcon } from './ShipRoster.jsx';

function PlayerRow({ p, rank, compact, lang, transmitterId }) {
  const isTx    = p.id === transmitterId;
  const labelColor = isTx ? 'var(--neon-amber)' : (p.isMe ? 'var(--neon-cyan)' : 'var(--ink)');

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:7,
      padding: compact ? '5px 7px' : '7px 10px',
      background: p.isMe ? 'rgba(0,255,255,0.08)' : 'rgba(255,255,255,0.02)',
      border:`1px solid ${p.isMe ? 'rgba(0,255,255,0.35)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:4,
    }}>
      {/* Rank / crown */}
      <div className="t-title" style={{
        fontSize: isTx ? 11 : 9,
        color: isTx ? 'var(--neon-amber)' : rank===1 ? 'var(--neon-amber)' : 'var(--ink-dim)',
        textShadow: (isTx||rank===1) ? '0 0 8px var(--neon-amber)' : 'none',
        minWidth:18, textAlign:'center',
      }}>
        {isTx ? '👑' : rank===1 ? '★' : `#${rank}`}
      </div>

      {/* Ship icon */}
      <div style={{ flex:'0 0 auto' }}>
        <ShipIcon ship={p.ship || 'nova_01'} color={p.shipColor || 'blue'} pixel={compact ? 1.5 : 2}/>
      </div>

      {/* Name + score bar */}
      <div style={{ flex:1, minWidth:0 }}>
        <div className="t-title" style={{
          fontSize: compact ? 7 : 8,
          color: labelColor,
          textShadow: p.isMe ? '0 0 6px var(--neon-cyan)' : 'none',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {p.name}{p.isMe ? ' ◀' : ''}
        </div>
        {!isTx && (
          <div className="hpbar" style={{ height:5, marginTop:3, borderColor:'rgba(255,255,255,0.1)' }}>
            <div className="hpbar-fill" style={{
              width:`${Math.min(100, Math.max(0, (p.score||0)/50*100))}%`,
              background:'linear-gradient(90deg,var(--neon-cyan),var(--neon-mint))',
              boxShadow:'none',
            }}/>
          </div>
        )}
        {isTx && (
          <div className="t-mono" style={{ fontSize:9, color:'var(--neon-amber)', marginTop:1 }}>
            {lang==='pt'?'TRANSMISSOR':'TRANSMITTER'}
          </div>
        )}
      </div>

      {/* Score */}
      {!isTx && (
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div className="t-read" style={{
            fontSize: compact ? 16 : 18,
            color: rank===1 ? 'var(--neon-amber)' : 'var(--ink)',
            textShadow: rank===1 ? '0 0 8px var(--neon-amber)' : 'none',
            lineHeight:1,
          }}>
            {p.score||0}
          </div>
          {p.lastDelta != null && (
            <div className="t-mono" style={{
              fontSize:9,
              color: p.lastDelta>0 ? 'var(--neon-mint)' : p.lastDelta<0 ? 'var(--neon-coral)' : 'var(--ink-faint)',
              marginTop:2,
            }}>
              {p.lastDelta>0?`+${p.lastDelta}`:p.lastDelta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Full sidebar (desktop) ─────────────────────────────────────────────────────
export function RankingSidebar({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { players, playerScores, round, totalRounds } = gameState;
  const transmitterId = gameState.psychicId || gameState.transmitterId;

  const transmitter = players.find(p => p.id === transmitterId);
  const voters      = players
    .filter(p => p.id !== transmitterId)
    .map(p => ({ ...p, score: playerScores?.[p.id]||0, isMe: p.id===myId }))
    .sort((a,b) => b.score - a.score);

  const txRow = transmitter ? { ...transmitter, isMe: transmitter.id===myId } : null;

  return (
    <div className="panel bevel" style={{
      width:240, flexShrink:0,
      padding:14, display:'flex', flexDirection:'column', gap:10,
      background:'linear-gradient(180deg,#0b0d24,#06071a)',
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div className="t-title text-dim" style={{ fontSize:7 }}>
            {lang==='pt'?'RODADA':'ROUND'}
          </div>
          <div className="t-read glow-text-cyan" style={{ fontSize:22, lineHeight:1 }}>
            {String(round+1).padStart(2,'0')}
            <span className="text-faded" style={{ fontSize:14 }}>
              /{String(totalRounds).padStart(2,'0')}
            </span>
          </div>
        </div>
        <button onClick={onSettings} className="btn btn-ghost btn-icon"
          style={{ minHeight:30, height:30, width:30, padding:0, fontSize:14 }}>⚙</button>
      </div>

      {/* Transmitter */}
      {txRow && (
        <div>
          <div className="t-title text-dim" style={{ fontSize:7, marginBottom:4 }}>
            ▸ {lang==='pt'?'TRANSMISSOR':'TRANSMITTER'}
          </div>
          <PlayerRow p={txRow} compact={false} lang={lang} transmitterId={transmitterId}/>
        </div>
      )}

      <div style={{ height:1, background:'var(--metal-2)', margin:'2px 0' }}/>

      <div className="t-title text-dim" style={{ fontSize:7 }}>
        ▸ {lang==='pt'?'CLASSIFICAÇÃO':'RANKINGS'}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, overflowY:'auto' }}>
        {voters.map((p,i) => (
          <PlayerRow key={p.id} p={p} rank={i+1} compact={false} lang={lang} transmitterId={transmitterId}/>
        ))}
      </div>
    </div>
  );
}

// ── Compact top bar (mobile) ───────────────────────────────────────────────────
export function RankingTopBar({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { players, playerScores, round, totalRounds } = gameState;
  const transmitterId = gameState.psychicId || gameState.transmitterId;

  const transmitter = players.find(p => p.id === transmitterId);
  const voters      = players
    .filter(p => p.id !== transmitterId)
    .map(p => ({ ...p, score: playerScores?.[p.id]||0, isMe: p.id===myId }))
    .sort((a,b) => b.score - a.score);

  return (
    <div className="panel bevel" style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'7px 12px',
      background:'linear-gradient(180deg,#0c0e26,#07081a)',
      flexWrap:'nowrap', overflowX:'auto',
    }}>
      {/* Round */}
      <div style={{ flexShrink:0 }}>
        <div className="t-title text-dim" style={{ fontSize:6 }}>{lang==='pt'?'RD':'RD'}</div>
        <div className="t-read glow-text-cyan" style={{ fontSize:18, lineHeight:1 }}>
          {round+1}<span className="text-faded" style={{ fontSize:12 }}>/{totalRounds}</span>
        </div>
      </div>

      <div style={{ width:1, height:24, background:'var(--metal-2)', flexShrink:0 }}/>

      {/* Transmitter chip */}
      {transmitter && (
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <span style={{ fontSize:12 }}>👑</span>
          <ShipIcon ship={transmitter.ship || 'nova_01'} color={transmitter.shipColor || 'blue'} pixel={1.5}/>
          <div className="t-title glow-text-amber" style={{ fontSize:7, maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {transmitter.name}
          </div>
        </div>
      )}

      <div style={{ width:1, height:24, background:'var(--metal-2)', flexShrink:0 }}/>

      {/* Top voters */}
      <div style={{ display:'flex', gap:6, flex:1, overflow:'hidden' }}>
        {voters.slice(0,4).map((p,i) => (
          <div key={p.id} style={{
            display:'flex', alignItems:'center', gap:4,
            padding:'3px 7px', borderRadius:3,
            border:`1px solid ${p.isMe?'rgba(0,255,255,0.4)':'rgba(255,255,255,0.06)'}`,
            background: p.isMe?'rgba(0,255,255,0.06)':'transparent',
            flexShrink:0,
          }}>
            <ShipIcon ship={p.ship || 'nova_01'} color={p.shipColor || 'blue'} pixel={1.2}/>
            <span className="t-read" style={{ fontSize:16, color: i===0?'var(--neon-amber)':'var(--ink)', lineHeight:1 }}>
              {p.score}
            </span>
          </div>
        ))}
      </div>

      <button onClick={onSettings} className="btn btn-ghost btn-icon"
        style={{ minHeight:28, height:28, width:28, padding:0, fontSize:13, flexShrink:0 }}>⚙</button>
    </div>
  );
}
