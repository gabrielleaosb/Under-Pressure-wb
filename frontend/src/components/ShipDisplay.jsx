import React from 'react';

const SHIP_DESIGNS = {
  0: ({ damage, maxDamage }) => {
    const pct = damage / maxDamage;
    const exploding = pct >= 1;
    const critical = pct >= 0.7;
    const damaged = pct >= 0.4;
    const light = pct >= 0.2;

    return (
      <g>
        {/* Team 0 — Fighter */}
        <rect x="7" y="1" width="2" height="2" fill="#ff4655" />
        <rect x="6" y="3" width="4" height="2" fill="#ff4655" />
        <rect x="5" y="5" width="6" height="4" fill="#cc2233" />
        <rect x="4" y="9" width="8" height="2" fill="#aa1122" />
        {/* Wings */}
        <rect x="2" y="7" width="3" height="3" fill="#880011" />
        <rect x="11" y="7" width="3" height="3" fill="#880011" />
        <rect x="1" y="10" width="2" height="1" fill="#660000" />
        <rect x="13" y="10" width="2" height="1" fill="#660000" />
        {/* Cockpit */}
        <rect x="7" y="3" width="2" height="2" fill="#ffaaaa" />
        {/* Stripe */}
        <rect x="5" y="6" width="6" height="1" fill="#ff8899" opacity="0.5" />
        {/* Engine */}
        <rect x="6" y="11" width="4" height="2" fill="#ff6600" />
        <rect x="7" y="13" width="2" height="2" fill="#ffff00" />

        {/* Damage: smoke */}
        {light && <rect x="6" y="2" width="1" height="1" fill="#aaaaaa" opacity="0.6" style={{ animation: 'smoke-drift 1s infinite alternate' }} />}
        {damaged && <rect x="10" y="5" width="1" height="1" fill="#888888" opacity="0.5" />}
        {/* Damage: fire */}
        {damaged && <rect x="4" y="8" width="2" height="2" fill="#ff4400" style={{ animation: 'fire-flicker 0.3s infinite alternate' }} />}
        {critical && <rect x="10" y="8" width="2" height="2" fill="#ff6600" style={{ animation: 'fire-flicker 0.4s infinite alternate' }} />}
        {critical && <rect x="7" y="4" width="1" height="1" fill="#ffaa00" />}
        {/* Crack lines */}
        {damaged && <line x1="6" y1="5" x2="8" y2="9" stroke="#550000" strokeWidth="0.5" />}
        {critical && <line x1="10" y1="6" x2="11" y2="10" stroke="#330000" strokeWidth="0.5" />}
      </g>
    );
  },
  1: ({ damage, maxDamage }) => {
    const pct = damage / maxDamage;
    const damaged = pct >= 0.4;
    const light = pct >= 0.2;
    const critical = pct >= 0.7;

    return (
      <g>
        {/* Team 1 — Cruiser, wider */}
        <rect x="6" y="2" width="4" height="1" fill="#00c2ff" />
        <rect x="5" y="3" width="6" height="2" fill="#00c2ff" />
        <rect x="4" y="5" width="8" height="4" fill="#0099cc" />
        <rect x="3" y="9" width="10" height="2" fill="#007799" />
        {/* Side pods */}
        <rect x="1" y="6" width="3" height="4" fill="#005577" />
        <rect x="12" y="6" width="3" height="4" fill="#005577" />
        <rect x="0" y="7" width="2" height="2" fill="#003344" />
        <rect x="14" y="7" width="2" height="2" fill="#003344" />
        {/* Cockpit dome */}
        <rect x="7" y="3" width="2" height="2" fill="#aaeeff" />
        {/* Detail lines */}
        <rect x="4" y="7" width="8" height="1" fill="#00eeff" opacity="0.3" />
        {/* Engines (dual) */}
        <rect x="5" y="11" width="2" height="2" fill="#00aaff" />
        <rect x="9" y="11" width="2" height="2" fill="#00aaff" />
        <rect x="5" y="13" width="2" height="1" fill="#ffffff" />
        <rect x="9" y="13" width="2" height="1" fill="#ffffff" />

        {light && <rect x="3" y="6" width="1" height="1" fill="#bbbbbb" opacity="0.5" />}
        {damaged && <rect x="4" y="5" width="2" height="2" fill="#ff4400" style={{ animation: 'fire-flicker 0.35s infinite alternate' }} />}
        {critical && <rect x="12" y="5" width="2" height="2" fill="#ff6600" style={{ animation: 'fire-flicker 0.4s infinite alternate' }} />}
        {damaged && <line x1="6" y1="5" x2="8" y2="9" stroke="#002244" strokeWidth="0.5" />}
      </g>
    );
  },
};

export default function ShipDisplay({ teamIndex, damage, maxDamage, size = 80, label, animate = true }) {
  const pct = Math.min(damage / maxDamage, 1);
  const exploding = pct >= 1;
  const critical = pct >= 0.7;
  const ShipFn = SHIP_DESIGNS[teamIndex] || SHIP_DESIGNS[0];

  const animStyle = exploding
    ? { animation: 'ship-explode 1.5s ease forwards' }
    : critical
      ? { animation: 'ship-shake 0.6s infinite' }
      : animate
        ? { animation: `ship-float ${3 + teamIndex * 0.7}s ease-in-out infinite` }
        : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {label && (
        <span style={{ fontFamily: 'var(--f-pixel)', fontSize: 7, color: teamIndex === 0 ? 'var(--team0)' : 'var(--team1)', letterSpacing: 1 }}>
          {label}
        </span>
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        style={{ imageRendering: 'pixelated', ...animStyle }}
      >
        <ShipFn damage={damage} maxDamage={maxDamage} />
        {/* Critical warning flash */}
        {critical && !exploding && (
          <rect x="0" y="0" width="16" height="16" fill="red" opacity="0" style={{ animation: 'blink-bar 0.5s infinite' }} />
        )}
      </svg>

      {/* Damage pips */}
      <div className="damage-pips" style={{ justifyContent: 'center' }}>
        {Array.from({ length: maxDamage }, (_, i) => (
          <div
            key={i}
            className={`pip ${i < damage ? 'filled' : ''}`}
            style={{ color: teamIndex === 0 ? 'var(--team0)' : 'var(--team1)' }}
          />
        ))}
      </div>
    </div>
  );
}
