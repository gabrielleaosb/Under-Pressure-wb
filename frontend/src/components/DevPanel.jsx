import React, { useState } from 'react';

const PHASE_LABELS = {
  lobby: 'Lobby',
  roulette: 'Roleta',
  spinning: 'Girando',
  psychic: 'Transmissao',
  voting: 'Votacao',
  reveal: 'Reveal',
  gameover: 'Final',
};

export default function DevPanel({ gameState, myId, send, isHost }) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 9000,
          background: 'rgba(0,0,0,0.9)',
          border: '2px solid #ff00cc',
          color: '#ff00cc',
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          padding: '6px 10px',
          borderRadius: 4,
          boxShadow: '0 0 10px rgba(255,0,204,.5)',
        }}
      >
        DEV
      </button>
    );
  }

  const phase = gameState?.phase || 'lobby';
  const players = gameState?.players || [];
  const round = (gameState?.round ?? 0) + 1;
  const totalRounds = gameState?.totalRounds ?? 0;
  const activeTransmitterId = gameState?.psychicId || gameState?.transmitterId;
  const activeTransmitter = players.find((player) => player.id === activeTransmitterId);
  const hasBots = players.some((player) => player.isBot);
  const isMeTransmitter = activeTransmitterId === myId;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.95)',
        border: '2px solid #ff00cc',
        boxShadow: '0 0 16px rgba(255,0,204,.5)',
        borderRadius: 8,
        padding: 14,
        minWidth: 248,
        maxWidth: 278,
        fontFamily: 'var(--f-body)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: '#ff00cc' }}>DEV FLOW</span>
        <button onClick={() => setOpen(false)} style={{ color: 'var(--dim2)', fontSize: 16, background: 'none', border: 'none' }}>
          X
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--white)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4, borderBottom: '1px solid var(--dim)', paddingBottom: 10 }}>
        <div><span style={{ color: 'var(--dim2)' }}>Fase: </span><b style={{ color: 'var(--yellow)' }}>{PHASE_LABELS[phase] || phase}</b></div>
        <div><span style={{ color: 'var(--dim2)' }}>Rodada: </span>{round}/{totalRounds}</div>
        <div><span style={{ color: 'var(--dim2)' }}>Players: </span>{players.length}</div>
        <div><span style={{ color: 'var(--dim2)' }}>Transmissor: </span>{activeTransmitter?.name || '-'}</div>
        {phase !== 'lobby' && (
          <div><span style={{ color: 'var(--dim2)' }}>Modo local: </span>{isMeTransmitter ? 'escrevendo' : 'adivinhando'}</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {isHost && phase === 'lobby' && !hasBots && (
          <Btn color="#ff00cc" onClick={() => send('dev_add_bots')}>
            1. Adicionar bots
          </Btn>
        )}

        {isHost && phase === 'lobby' && (
          <>
            <Btn color="#00ffff" onClick={() => send('dev_setup_transmitter_test')}>
              2. Testar transmissor
            </Btn>
            <Btn color="#00ff88" onClick={() => send('dev_setup_voter_test')}>
              3. Testar adivinhacao
            </Btn>
          </>
        )}

        {isHost && phase !== 'lobby' && phase !== 'gameover' && (
          <Btn color="#00ffff" onClick={() => send('dev_skip_phase')}>
            Avancar fase
          </Btn>
        )}

        {isHost && phase !== 'lobby' && (
          <Btn color="#ffaa00" onClick={() => send('back_to_lobby')}>
            Voltar pro lobby
          </Btn>
        )}

        <div style={{ fontSize: 10, color: 'var(--dim2)', lineHeight: 1.55, borderTop: '1px solid var(--dim)', paddingTop: 8, marginTop: 2 }}>
          <b style={{ color: 'var(--white)' }}>Fluxo rapido:</b><br />
          transmissor = voce escreve dica<br />
          adivinhacao = bot transmite, voce vota
        </div>
      </div>
    </div>
  );
}

function Btn({ color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}18`,
        border: `1.5px solid ${color}`,
        color,
        fontFamily: 'var(--f-body)',
        fontWeight: 800,
        fontSize: 12,
        padding: '7px 10px',
        borderRadius: 5,
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = `${color}30`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = `${color}18`;
      }}
    >
      {children}
    </button>
  );
}
