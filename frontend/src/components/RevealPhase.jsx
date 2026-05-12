import React, { useEffect, useRef, useState } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme, tGrade } from '../i18n.js';
import { playRevealDrum, playPerfect, playGoodResult, playDamageHit, playClick } from '../sounds.js';

const LOCK_SECONDS = 5; // mandatory viewing time before anyone can advance

const GRADE_COLORS = {
  'PERFECT':    'var(--green)',
  'VERY CLOSE': 'var(--cyan)',
  'CLOSE':      'var(--yellow)',
  'REASONABLE': 'var(--orange)',
  'FAR':        'var(--red)',
};

export default function RevealPhase({ gameState, myId, lang, send, isHost }) {
  const result      = gameState.revealResult;
  const activeTeam  = gameState.teams[gameState.activeTeamIndex];
  const psychic     = gameState.players.find(p => p.id === gameState.psychicId);
  const revealed    = useRef(false);
  const [lockLeft,  setLockLeft]  = useState(LOCK_SECONDS);
  const [unlocked,  setUnlocked]  = useState(false);

  useEffect(() => {
    if (!result || revealed.current) return;
    revealed.current = true;
    playRevealDrum();
    setTimeout(() => {
      if (result.grade === 'PERFECT') playPerfect();
      else if (result.damage > 0) playDamageHit(result.damage >= 2);
      else playGoodResult();
    }, 350);

    // Countdown lock
    setLockLeft(LOCK_SECONDS);
    setUnlocked(false);
    const id = setInterval(() => {
      setLockLeft(prev => {
        if (prev <= 1) { clearInterval(id); setUnlocked(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [result]);

  if (!result) return null;

  const gradeColor = GRADE_COLORS[result.grade] || 'var(--white)';
  const allVotes   = gameState.votes || {};
  const activeTeamPlayers = gameState.players.filter(p => p.teamIndex === gameState.activeTeamIndex);

  return (
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Grade result */}
      <div className="text-center" style={{
        padding: '18px 24px',
        border: `2px solid ${gradeColor}`,
        borderRadius: 8,
        background: 'rgba(0,0,0,0.6)',
        boxShadow: `0 0 24px ${gradeColor}44`,
        animation: 'theme-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Grade label */}
        <div className="pixel-title" style={{ fontSize: 'clamp(13px,3.5vw,20px)', color: gradeColor, textShadow: `0 0 16px ${gradeColor}` }}>
          {tGrade(result, lang)}
        </div>

        {/* Key numbers in one row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 14, flexWrap: 'wrap' }}>
          <Stat label={lang === 'pt' ? 'ALVO' : 'TARGET'} value={result.target} color="var(--green)" />
          <Stat label={lang === 'pt' ? 'MÉDIA' : 'AVERAGE'} value={Math.round(result.avg)} color="var(--yellow)" />
          <Stat label={lang === 'pt' ? 'DIFF' : 'DIFF'} value={`±${Math.round(result.diff)}`} color={gradeColor} />
          {result.points > 0 && <Stat label={lang === 'pt' ? 'PONTOS' : 'POINTS'} value={`+${result.points}`} color="var(--cyan)" />}
          {result.damage > 0 && <Stat label={lang === 'pt' ? 'DANO' : 'DAMAGE'} value={`-${result.damage} 💥`} color="var(--red)" />}
        </div>
      </div>

      {/* Gauge: target (green) + average (yellow) + individual vote dots */}
      <PressurePanel
        card={gameState.currentCard}
        lang={lang}
        value={result.avg}
        onChange={() => {}}
        disabled
        showTarget={result.target}
        otherVotes={Object.entries(allVotes).map(([id, pos]) => ({ playerId: id, position: pos }))}
        players={gameState.players}
      />

      {/* Clue + votes — compact */}
      <div className="pixel-box p-16 flex-col gap-12">

        {/* Clue row */}
        <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
          <div style={{ fontFamily:'var(--f-body)', fontWeight:900, fontSize:12, color:gameState.currentTheme?.color, letterSpacing:2 }}>
            {lang === 'en' ? gameState.currentTheme?.shortEN : gameState.currentTheme?.shortPT}
          </div>
          <div>
            <div className="label" style={{ color: 'var(--dim2)', marginBottom: 4 }}>
              📡 {psychic?.name} · {lang === 'pt' ? 'transmissor' : 'transmitter'}
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 32, color: 'var(--yellow)', lineHeight: 1 }}>
              {gameState.clue}
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: '4px 0' }} />

        {/* Individual votes */}
        <div className="flex-col gap-6">
          {activeTeamPlayers.filter(p => p.id !== gameState.psychicId).map(p => {
            const v    = allVotes[p.id];
            const diff = v !== undefined ? Math.abs(v - result.target) : null;
            const col  = diff === null ? 'var(--dim2)' : diff <= 15 ? 'var(--green)' : diff <= 30 ? 'var(--yellow)' : 'var(--red)';
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--f-body)', fontSize: 13, flex: 1 }}>{p.name}</span>
                {v !== undefined ? (
                  <>
                    <span style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: 'var(--white)', minWidth: 36, textAlign: 'right' }}>{v}</span>
                    <span style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: col, minWidth: 44, textAlign: 'right' }}>±{Math.round(diff)}</span>
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim2)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next round — any player, after lock period */}
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {!unlocked ? (
          <>
            <div style={{ width: '100%', maxWidth: 280, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(lockLeft / LOCK_SECONDS) * 100}%`,
                background: 'var(--cyan)',
                borderRadius: 3,
                transition: 'width 0.9s linear',
              }}/>
            </div>
            <span style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--dim2)' }}>
              {lang === 'pt' ? `disponível em ${lockLeft}s...` : `available in ${lockLeft}s...`}
            </span>
          </>
        ) : (
          <button
            className="btn btn-cyan btn-lg"
            onClick={() => { playClick(); send('advance_round'); }}
            style={{ minWidth: 240, animation: 'theme-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            ▶ {lang === 'pt' ? 'PRÓXIMA RODADA' : 'NEXT ROUND'}
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="label mb-4" style={{ color: 'var(--dim2)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-vt)', fontSize: 34, color, lineHeight: 1, textShadow: `0 0 8px ${color}` }}>
        {value}
      </div>
    </div>
  );
}
