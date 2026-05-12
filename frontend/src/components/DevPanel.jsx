import React, { useState } from 'react';

const PHASE_PT = {
  lobby:    '🏠 Lobby',
  roulette: '🎡 Roleta',
  spinning: '⚡ Girando',
  psychic:  '📡 Transmissor',
  voting:   '🗳 Votação',
  reveal:   '🔍 Revelação',
  gameover: '💥 Fim de Jogo',
};

const SKIP_LABEL_PT = {
  lobby:    'Iniciar Jogo',
  roulette: 'Girar + Avançar',
  spinning: 'Girar + Avançar',
  psychic:  'Enviar Dica Auto',
  voting:   'Auto-votar + Revelar',
  reveal:   'Próxima Rodada',
  gameover: 'Nova Partida',
};

export default function DevPanel({ gameState, myId, send, isHost }) {
  const [open,    setOpen]    = useState(true);
  const [dmgTeam, setDmgTeam] = useState(0);
  const [dmgVal,  setDmgVal]  = useState(0);

  const phase   = gameState?.phase;
  const hasBots = gameState?.players?.some(p => p.name?.startsWith('Bot-'));
  const psychic = gameState?.players?.find(p => p.id === gameState?.psychicId);
  const isBot   = psychic?.isBot;

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      position:'fixed', bottom:12, left:12, zIndex:9000,
      background:'rgba(0,0,0,0.9)', border:'2px solid #ff00cc',
      color:'#ff00cc', fontFamily:"'Press Start 2P',monospace",
      fontSize:7, padding:'6px 10px', cursor:'pointer', borderRadius:4,
      boxShadow:'0 0 10px rgba(255,0,204,.5)',
    }}>DEV</button>
  );

  return (
    <div style={{
      position:'fixed', bottom:12, left:12, zIndex:9000,
      background:'rgba(0,0,0,0.95)', border:'2px solid #ff00cc',
      boxShadow:'0 0 16px rgba(255,0,204,.5)', borderRadius:8,
      padding:14, minWidth:220, maxWidth:260,
      fontFamily:'var(--f-body)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:'#ff00cc' }}>⚡ DEV</span>
        <button onClick={() => setOpen(false)} style={{ color:'var(--dim2)', fontSize:16, background:'none', cursor:'pointer', border:'none' }}>✕</button>
      </div>

      {/* Status */}
      <div style={{ fontSize:12, color:'var(--white)', marginBottom:10, display:'flex', flexDirection:'column', gap:3, borderBottom:'1px solid var(--dim)', paddingBottom:10 }}>
        <div><span style={{color:'var(--dim2)'}}>Fase: </span>
          <b style={{color:'var(--yellow)'}}>{PHASE_PT[phase] ?? phase}</b>
        </div>
        {gameState && <>
          <div><span style={{color:'var(--dim2)'}}>Rodada: </span>{(gameState.round??0)+1}/{gameState.totalRounds}</div>
          <div><span style={{color:'var(--dim2)'}}>Time ativo: </span>{gameState.teams?.[gameState.activeTeamIndex]?.name}</div>
          {psychic && <div><span style={{color:'var(--dim2)'}}>Transmissor: </span>
            <span style={{color: isBot ? 'var(--dim2)' : 'var(--cyan)'}}>{psychic.name}{isBot?' 🤖':' 👤'}</span>
          </div>}
          <div>
            <span style={{color:'#ff3355'}}>🔴 {gameState.damage?.[0]}dmg</span>
            {' · '}
            <span style={{color:'#00aaff'}}>🔵 {gameState.damage?.[1]}dmg</span>
            {' / max '}{gameState.settings?.maxDamage}
          </div>
        </>}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>

        {/* STEP 1: Add bots (lobby only) */}
        {phase === 'lobby' && isHost && (
          <Btn color="#ff00cc" onClick={() => send('dev_add_bots')}>
            🤖 1. Add Bots (4)
          </Btn>
        )}

        {/* STEP 2: Skip / advance phase */}
        {isHost && phase && (
          <Btn color="#00ffff" onClick={() => send('dev_skip_phase')}>
            ⏭ {phase === 'lobby' ? '2. Iniciar Jogo' : SKIP_LABEL_PT[phase] ?? 'Avançar'}
          </Btn>
        )}

        {/* STEP 3: Skip my turn as psychic (become voter) */}
        {isHost && phase && !['lobby','gameover'].includes(phase) && !isBot && (
          <Btn color="#cc44ff" onClick={() => send('dev_next_psychic')}>
            🔄 Ser votante (pular minha vez)
          </Btn>
        )}

        {/* Manual damage */}
        {isHost && phase && !['lobby','gameover'].includes(phase) && (
          <div style={{ borderTop:'1px solid var(--dim)', paddingTop:8 }}>
            <div style={{ fontSize:10, color:'var(--dim2)', marginBottom:5 }}>Definir dano:</div>
            <div style={{ display:'flex', gap:5 }}>
              <select value={dmgTeam} onChange={e=>setDmgTeam(+e.target.value)}
                style={{ flex:1, background:'rgba(0,0,0,.7)', border:'1px solid var(--dim)', color:'var(--white)', borderRadius:4, padding:'3px 6px', fontSize:11 }}>
                <option value={0}>🔴 T0</option>
                <option value={1}>🔵 T1</option>
              </select>
              <input type="number" min="0" max="7" value={dmgVal}
                onChange={e=>setDmgVal(+e.target.value)}
                style={{ width:42, background:'rgba(0,0,0,.7)', border:'1px solid var(--dim)', color:'var(--white)', borderRadius:4, padding:'3px 6px', fontSize:11, textAlign:'center' }}
              />
              <Btn color="#ff8800" onClick={() => send('dev_damage',{team:dmgTeam,damage:dmgVal})}>✓</Btn>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ fontSize:10, color:'var(--dim2)', lineHeight:1.6, borderTop:'1px solid var(--dim)', paddingTop:8, marginTop:2 }}>
          <b style={{color:'var(--white)'}}>Fluxo p/ testar votação:</b><br/>
          1. Add Bots → Iniciar Jogo<br/>
          2. Ser votante → bot auto-age<br/>
          3. Arraste agulha → Confirmar
        </div>
      </div>
    </div>
  );
}

function Btn({ color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background:`${color}18`, border:`1.5px solid ${color}`,
      color, fontFamily:'var(--f-body)', fontWeight:800,
      fontSize:12, padding:'7px 10px', borderRadius:5,
      cursor:'pointer', textAlign:'left', width:'100%',
      transition:'background .1s',
    }}
    onMouseEnter={e=>e.currentTarget.style.background=`${color}30`}
    onMouseLeave={e=>e.currentTarget.style.background=`${color}18`}
    >
      {children}
    </button>
  );
}
