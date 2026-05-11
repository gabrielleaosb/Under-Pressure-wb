import React from 'react';
import ShipDisplay from './ShipDisplay.jsx';
import { t } from '../i18n.js';

export default function ScoreBoard({ gameState, myId, lang }) {
  if (!gameState) return null;
  const { teams, damage, scores, settings, round, totalRounds, activeTeamIndex } = gameState;

  return (
    <div className="scoreboard">
      {/* Team 0 */}
      <TeamPanel
        teamIdx={0}
        team={teams[0]}
        damage={damage[0]}
        maxDamage={settings.maxDamage}
        score={scores[0]}
        active={activeTeamIndex === 0}
        lang={lang}
        side="left"
      />

      {/* Center: round info */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: 'var(--dim)' }}>
          {t('round_n', lang)}
        </span>
        <span style={{ fontFamily: 'var(--f-vt)', fontSize: 28, color: 'var(--cyan)', textShadow: '0 0 8px var(--cyan)' }}>
          {round + 1}/{totalRounds}
        </span>
      </div>

      {/* Team 1 */}
      <TeamPanel
        teamIdx={1}
        team={teams[1]}
        damage={damage[1]}
        maxDamage={settings.maxDamage}
        score={scores[1]}
        active={activeTeamIndex === 1}
        lang={lang}
        side="right"
      />
    </div>
  );
}

function TeamPanel({ teamIdx, team, damage, maxDamage, score, active, lang, side }) {
  const color = teamIdx === 0 ? 'var(--team0)' : 'var(--team1)';
  const pct = damage / maxDamage;

  return (
    <div style={{
      display: 'flex',
      flexDirection: side === 'left' ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 8,
    }}>
      <ShipDisplay teamIndex={teamIdx} damage={damage} maxDamage={maxDamage} size={44} animate={!active} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: side === 'left' ? 'flex-start' : 'flex-end' }}>
        <span style={{
          fontFamily: 'var(--f-pixel)', fontSize: 7,
          color, letterSpacing: 1,
          textShadow: active ? `0 0 8px ${color}` : 'none',
          maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team.name}
          {active && <span style={{ color: 'var(--yellow)', marginLeft: 4 }}>▶</span>}
        </span>
        <span style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--white)' }}>
          {score}pts
        </span>
        {/* HP bar */}
        <div style={{ width: 70, height: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 2, border: '1px solid var(--dim)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.max(0, (1 - pct) * 100)}%`,
            height: '100%',
            background: pct > 0.6 ? 'var(--red)' : pct > 0.3 ? 'var(--orange)' : 'var(--green)',
            borderRadius: 2,
            transition: 'width 0.5s, background 0.5s',
          }} />
        </div>
      </div>
    </div>
  );
}
