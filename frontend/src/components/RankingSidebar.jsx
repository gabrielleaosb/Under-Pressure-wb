/**
 * RankingSidebar — shown during gameplay (roulette, psychic, voting, reveal).
 * Desktop: 240px right column. Mobile: compact top bar.
 */
import React from 'react';
import { ShipIcon } from './ShipRoster.jsx';

function PlayerRow({ p, rank, compact, lang, transmitterId, maxDamage = 6 }) {
  const isTx = p.id === transmitterId;
  const nameColor = isTx ? 'var(--neon-amber)' : (p.isMe ? 'var(--neon-cyan)' : 'var(--ink)');
  const damagePct = Math.min(100, Math.max(0, ((p.damage || 0) / maxDamage) * 100));

  return (
    <div style={{
      border:`1px solid ${p.isMe ? 'rgba(0,255,255,0.35)' : isTx ? 'rgba(255,224,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:4,
      overflow:'hidden',
      background: p.isMe ? 'rgba(0,255,255,0.08)' : isTx ? 'rgba(255,224,0,0.05)' : 'rgba(255,255,255,0.02)',
    }}>
      {isTx && (
        <div style={{
          padding: compact ? '3px 10px' : '4px 14px',
          background:'rgba(255,224,0,0.10)',
          borderBottom:'1px solid rgba(255,224,0,0.2)',
          fontFamily:'var(--f-title)',
          fontSize: compact ? 7 : 8,
          color:'var(--neon-amber)',
          letterSpacing:'0.1em',
        }}>
          {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
        </div>
      )}
      <div style={{
        display:'flex', alignItems:'center', gap: compact ? 8 : 12,
        padding: compact ? '8px 10px' : '12px 14px',
      }}>
      {/* Rank */}
      <div className="t-title" style={{
        fontSize: compact ? 8 : 10,
        color: rank === 1 ? 'var(--neon-amber)' : 'var(--ink-dim)',
        textShadow: rank === 1 ? '0 0 8px var(--neon-amber)' : 'none',
        minWidth: compact ? 22 : 30, textAlign:'center',
      }}>
        {`#${rank}`}
      </div>

      {/* Ship icon */}
      <div style={{ flex:'0 0 auto' }}>
        <ShipIcon ship={p.ship || 'nova_01'} color={p.shipColor || 'blue'} pixel={compact ? 1.8 : 2.8} damage={p.damage || 0}/>
      </div>

      {/* Name + indicator + damage bar */}
      <div style={{ flex:1, minWidth:0 }}>
        <div className="t-title" style={{
          fontSize: compact ? 8 : 10,
          color: nameColor,
          textShadow: p.isMe ? '0 0 6px var(--neon-cyan)' : 'none',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {p.name}{p.isMe ? ' ◀' : ''}
        </div>
        <div className="hpbar" style={{ height:7, marginTop:6, borderColor:'rgba(255,255,255,0.1)' }}>
          <div className="hpbar-fill" style={{
            width:`${damagePct}%`,
            background:'linear-gradient(90deg,var(--neon-amber),var(--neon-coral))',
            boxShadow:'none',
          }}/>
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div className="t-read" style={{
          fontSize: compact ? 20 : 28,
          color: rank === 1 ? 'var(--neon-amber)' : 'var(--ink)',
          textShadow: rank === 1 ? '0 0 8px var(--neon-amber)' : 'none',
          lineHeight:1,
        }}>
          {p.score || 0}
        </div>
        {(p.damage || 0) > 0 && (
          <div className="t-mono" style={{ fontSize:11, color:'var(--neon-coral)', marginTop:3 }}>
            DMG {p.damage}/{maxDamage}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── Full sidebar (desktop) ─────────────────────────────────────────────────────
export function RankingSidebar({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { players, playerScores, playerDamage = {}, round, totalRounds, maxDamage } = gameState;
  const transmitterId = gameState.psychicId || gameState.transmitterId;

  const sorted = players
    .filter(p => p.isBot || p.connected !== false)
    .map(p => ({ ...p, score: playerScores?.[p.id] || 0, damage: playerDamage?.[p.id] || 0, isMe: p.id === myId }))
    .sort((a, b) => (b.score - a.score) || (a.damage - b.damage));

  return (
    <div className="panel bevel" style={{
      width:320, flexShrink:0,
      padding:18, display:'flex', flexDirection:'column', gap:14,
      background:'linear-gradient(180deg,#0b0d24,#06071a)',
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div className="t-title text-dim" style={{ fontSize:9 }}>
            {lang === 'pt' ? 'RODADA' : 'ROUND'}
          </div>
          <div className="t-read glow-text-cyan" style={{ fontSize:36, lineHeight:1 }}>
            {String(round + 1).padStart(2, '0')}
            <span className="text-faded" style={{ fontSize:14 }}>
              /{String(totalRounds).padStart(2, '0')}
            </span>
          </div>
        </div>
        <button onClick={onSettings} className="btn btn-ghost btn-icon"
          style={{ minHeight:38, height:38, width:72, padding:0, fontSize:8 }}>CONFIG</button>
      </div>

      <div className="t-title text-dim" style={{ fontSize:9 }}>
        ▸ {lang === 'pt' ? 'CLASSIFICAÇÃO' : 'RANKINGS'}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, overflowY:'auto' }}>
        {sorted.map((p, i) => (
          <PlayerRow key={p.id} p={p} rank={i + 1} compact={false} lang={lang} transmitterId={transmitterId} maxDamage={maxDamage} />
        ))}
      </div>
    </div>
  );
}

// ── Compact top bar (mobile) ───────────────────────────────────────────────────
export function RankingTopBar({ gameState, myId, lang, onSettings }) {
  if (!gameState) return null;
  const { players, playerScores, playerDamage = {}, round, totalRounds } = gameState;
  const transmitterId = gameState.psychicId || gameState.transmitterId;

  const sorted = players
    .filter(p => p.isBot || p.connected !== false)
    .map(p => ({ ...p, score: playerScores?.[p.id] || 0, damage: playerDamage?.[p.id] || 0, isMe: p.id === myId }))
    .sort((a, b) => (b.score - a.score) || (a.damage - b.damage));

  return (
    <div className="panel bevel" style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'10px 14px',
      background:'linear-gradient(180deg,#0c0e26,#07081a)',
      flexWrap:'nowrap', overflowX:'auto',
    }}>
      {/* Round */}
      <div style={{ flexShrink:0 }}>
        <div className="t-title text-dim" style={{ fontSize:7 }}>{lang === 'pt' ? 'RD' : 'RD'}</div>
        <div className="t-read glow-text-cyan" style={{ fontSize:24, lineHeight:1 }}>
          {round + 1}<span className="text-faded" style={{ fontSize:12 }}>/{totalRounds}</span>
        </div>
      </div>

      <div style={{ width:1, height:24, background:'var(--metal-2)', flexShrink:0 }}/>

      {/* All players */}
      <div style={{ display:'flex', gap:6, flex:1, overflow:'hidden' }}>
        {sorted.slice(0, 5).map((p) => {
          const isTx = p.id === transmitterId;
          return (
            <div key={p.id} style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'5px 9px', borderRadius:3,
              border:`1px solid ${p.isMe ? 'rgba(0,255,255,0.4)' : isTx ? 'rgba(255,224,0,0.45)' : 'rgba(255,255,255,0.06)'}`,
              background: p.isMe ? 'rgba(0,255,255,0.06)' : isTx ? 'rgba(255,224,0,0.06)' : 'transparent',
              flexShrink:0,
            }}>
              <ShipIcon ship={p.ship || 'nova_01'} color={p.shipColor || 'blue'} pixel={1.6} damage={p.damage} />
              <span className="t-read" style={{ fontSize:22, color: isTx ? 'var(--neon-amber)' : 'var(--ink)', lineHeight:1 }}>
                {p.score}
              </span>
            </div>
          );
        })}
      </div>

      <button onClick={onSettings} className="btn btn-ghost btn-icon"
        style={{ minHeight:34, height:34, width:66, padding:0, fontSize:7, flexShrink:0 }}>CONFIG</button>
    </div>
  );
}
