import React from 'react';
import { TEAM_INITIAL_HP } from '../gameRules.mjs';
import { ShipIcon } from './ShipRoster.jsx';

function HpBar({ hp, color }) {
  const pct = Math.max(0, Math.min(100, (hp / TEAM_INITIAL_HP) * 100));
  const critical = pct <= 25;
  const warning  = pct <= 50 && pct > 25;
  return (
    <div className="team-hud-bar-track">
      <div
        className={`team-hud-bar-fill${critical ? ' team-hud-bar-fill--critical' : warning ? ' team-hud-bar-fill--warning' : ''}`}
        style={{ width: `${pct}%`, background: critical ? 'var(--red)' : warning ? 'var(--yellow)' : color }}
      />
    </div>
  );
}

export default function TeamHUD({ gameState, myId }) {
  const teams = gameState?.teams;
  if (!teams || teams.length === 0) return null;

  return (
    <div className="team-hud">
      {teams.map(team => {
        const myTeam = myId && gameState?.players?.find(p => p.id === myId)?.teamId === team.id;
        const navId  = gameState?.teamState?.[team.id]?.navigatorId;
        const nav    = gameState?.players?.find(p => p.id === navId);

        return (
          <div
            key={team.id}
            className={`team-hud-card panel bevel${myTeam ? ' team-hud-card--mine' : ''}${team.eliminated ? ' team-hud-card--dead' : ''}`}
            style={{ '--team-color': team.color }}
          >
            {nav && (
              <ShipIcon
                ship={nav.ship || 'nova_01'}
                color={nav.shipColor || 'blue'}
                accent={nav.shipAccent || 'cyan'}
                pixel={2}
                glow={myTeam && !team.eliminated}
                damage={team.eliminated ? 3 : team.hp < 40 ? 2 : team.hp < 70 ? 1 : 0}
              />
            )}
            <div className="team-hud-info">
              <div className="team-hud-name t-title" style={{ color: team.eliminated ? 'var(--ink-dim)' : team.color }}>
                {team.name}
                {team.eliminated && <span className="team-hud-dead-tag"> ✗</span>}
              </div>
              <HpBar hp={team.hp} color={team.color} />
              <div className="team-hud-hp t-mono text-dim">{team.eliminated ? 'DESTRUÍDA' : `${team.hp} HP`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
