import React, { useEffect, useRef } from 'react';
import PressurePanel from './PressurePanel.jsx';
import { t, tTheme, tGrade } from '../i18n.js';
import { playRevealDrum, playPerfect, playGoodResult, playDamageHit, playClick } from '../sounds.js';

const GRADE_COLORS = {
  'PERFECT':    'var(--green)',
  'VERY CLOSE': 'var(--cyan)',
  'CLOSE':      'var(--yellow)',
  'REASONABLE': 'var(--orange)',
  'FAR':        'var(--red)',
};

export default function RevealPhase({ gameState, myId, lang, send, isHost }) {
  const result = gameState.revealResult;
  const activeTeam = gameState.teams[gameState.activeTeamIndex];
  const psychicPlayer = gameState.players.find(p => p.id === gameState.psychicId);
  const revealed = useRef(false);

  useEffect(() => {
    if (!result || revealed.current) return;
    revealed.current = true;
    // Reveal drum roll, then result sound
    playRevealDrum();
    setTimeout(() => {
      if (result.grade === 'PERFECT') playPerfect();
      else if (result.damage > 0) playDamageHit(result.damage >= 2);
      else playGoodResult();
    }, 350);
  }, [result]);

  if (!result) return null;

  const gradeColor = GRADE_COLORS[result.grade] || 'var(--white)';
  const didDamage = result.damage > 0;
  const isMyTeamActive = gameState.players.find(p => p.id === myId)?.teamIndex === gameState.activeTeamIndex;

  // Build vote list
  const allVotes = gameState.votes || {};
  const activeTeamPlayers = gameState.players.filter(p => p.teamIndex === gameState.activeTeamIndex);

  return (
    <div className="flex-col gap-16" style={{ paddingBottom: 32 }}>

      {/* Header */}
      <div className="text-center">
        <h2 className="pixel-title" style={{ fontSize: 'clamp(8px,2.5vw,12px)', color: 'var(--cyan)', marginBottom: 8 }}>
          {t('reveal_title', lang)}
        </h2>
        <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: activeTeam.color, letterSpacing: 2 }}>
          {activeTeam.name} — {t('round_n', lang)} {gameState.round + 1}
        </div>
      </div>

      {/* Grade result — big */}
      <div className="text-center" style={{
        padding: '20px',
        border: `3px solid ${gradeColor}`,
        borderRadius: 8,
        background: `rgba(0,0,0,0.7)`,
        boxShadow: `0 0 20px ${gradeColor}44, 0 0 60px ${gradeColor}22`,
        animation: 'theme-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div className="pixel-title" style={{ fontSize: 'clamp(12px,4vw,22px)', color: gradeColor, textShadow: `0 0 20px ${gradeColor}` }}>
          {tGrade(result, lang)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
          <StatBubble label={t('target_was', lang)} value={result.target} color="var(--green)" />
          <StatBubble label={t('team_avg', lang)} value={Math.round(result.avg)} color="var(--cyan)" />
          <StatBubble label={t('diff_label', lang)} value={`±${Math.round(result.diff)}`} color={gradeColor} />
          <StatBubble label={t('points_label', lang)} value={`+${result.points}`} color="var(--yellow)" />
          {result.damage > 0 && <StatBubble label={t('damage_label', lang)} value={`-${result.damage} 💥`} color="var(--red)" />}
        </div>
      </div>

      {/* Spectrum with target + votes */}
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

      {/* Clue recap */}
      <div className="pixel-box-yellow p-16">
        <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="pixel-title mb-4" style={{ fontSize: 7, color: 'var(--dim)' }}>
              {lang === 'pt' ? 'PSÍQUICO' : 'PSYCHIC'}: {psychicPlayer?.name}
            </div>
            <div className="pixel-title mb-4" style={{ fontSize: 7, color: 'var(--dim)' }}>
              {lang === 'pt' ? 'DICA' : 'CLUE'}:
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 36, color: 'var(--yellow)', textShadow: '0 0 12px var(--yellow)' }}>
              {gameState.clue}
            </div>
          </div>
          <div>
            <div className="pixel-title mb-4" style={{ fontSize: 7, color: 'var(--dim)' }}>
              TEMA / THEME:
            </div>
            <div style={{ fontFamily: 'var(--f-vt)', fontSize: 26, color: gameState.currentTheme?.color || 'var(--white)' }}>
              {gameState.currentTheme?.emoji} {tTheme(gameState.currentTheme, lang)}
            </div>
          </div>
        </div>
      </div>

      {/* Individual votes */}
      <div className="pixel-box p-16">
        <div className="pixel-title mb-12" style={{ fontSize: 7, color: 'var(--dim)' }}>
          {lang === 'pt' ? 'VOTOS DA EQUIPE' : 'TEAM VOTES'}
        </div>
        <div className="flex-col gap-8">
          {activeTeamPlayers.filter(p => p.id !== gameState.psychicId).map(p => {
            const voteVal = allVotes[p.id];
            const diff = voteVal !== undefined ? Math.abs(voteVal - result.target) : null;
            return (
              <div key={p.id} className="player-row">
                <div className="avatar" style={{ color: p.color, background: `${p.color}22`, width: 36, height: 36 }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontFamily: 'var(--f-body)', fontSize: 13 }}>{p.name}</span>
                {voteVal !== undefined ? (
                  <>
                    <span style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: p.color }}>{voteVal}</span>
                    <span style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: diff <= 15 ? 'var(--green)' : diff <= 30 ? 'var(--yellow)' : 'var(--red)' }}>
                      ±{Math.round(diff)}
                    </span>
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--f-vt)', fontSize: 18, color: 'var(--dim)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Damage notification */}
      {didDamage && (
        <div className="pixel-box-red p-16 text-center" style={{ animation: 'theme-pop 0.4s ease' }}>
          <div className="pixel-title" style={{ fontSize: 'clamp(8px,2.5vw,12px)', color: 'var(--red)' }}>
            💥 {lang === 'pt'
              ? `NAVE SOFREU ${result.damage} DANO${result.damage > 1 ? 'S' : ''}!`
              : `SHIP TOOK ${result.damage} DAMAGE!`}
          </div>
          <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', marginTop: 8 }}>
            {lang === 'pt'
              ? `${gameState.damage[gameState.activeTeamIndex]}/${gameState.settings.maxDamage} danos acumulados`
              : `${gameState.damage[gameState.activeTeamIndex]}/${gameState.settings.maxDamage} damage accumulated`}
          </div>
        </div>
      )}

      {!didDamage && (
        <div className="pixel-box-green p-16 text-center" style={{ animation: 'theme-pop 0.4s ease' }}>
          <div className="pixel-title" style={{ fontSize: 'clamp(8px,2.5vw,12px)', color: 'var(--green)' }}>
            🛡 {lang === 'pt' ? 'NAVE PROTEGIDA!' : 'SHIP PROTECTED!'}
          </div>
        </div>
      )}

      {/* Next round button — host only */}
      {isHost && (
        <div className="text-center">
          <button className="btn btn-cyan btn-lg" onClick={() => { playClick(); send('advance_round'); }}>
            ▶ {t('next_round', lang)}
          </button>
        </div>
      )}
      {!isHost && (
        <div style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--dim)', textAlign: 'center', letterSpacing: 2 }}>
          📡 {lang === 'pt' ? 'Aguardando capitão...' : 'Waiting for captain...'}
        </div>
      )}
    </div>
  );
}

function StatBubble({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-vt)', fontSize: 36, color, textShadow: `0 0 10px ${color}` }}>
        {value}
      </div>
    </div>
  );
}
