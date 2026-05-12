// ffa.jsx — Free-For-All mode: lobby, ranking sidebar, ship picker, in-game wrappers.

const { useState: ufS, useEffect: ufE, useMemo: ufM } = React;

// Sample 7 players for FFA — captain at top
const FFA_PLAYERS = [
  { id: 'p1', name: 'NOVA ALDRIN', captain: true,  ship: 'cruiser',     color: 'amber',   score: 0, alive: true  },
  { id: 'p2', name: 'CLEO V.',     captain: false, ship: 'interceptor', color: 'red',     score: 0, alive: true, you: true },
  { id: 'p3', name: 'TITO MARZ',   captain: false, ship: 'shark',       color: 'cyan',    score: 0, alive: true  },
  { id: 'p4', name: 'LÉO ORION',   captain: false, ship: 'orb',         color: 'violet',  score: 0, alive: true  },
  { id: 'p5', name: 'MIRA SOLIS',  captain: false, ship: 'saucer',      color: 'emerald', score: 0, alive: true  },
  { id: 'p6', name: 'IRI ZEN',     captain: false, ship: 'biplane',     color: 'pink',    score: 0, alive: true  },
  { id: 'p7', name: 'KAI PLUT',    captain: false, ship: 'spade',       color: 'toxic',   score: 0, alive: true  },
];

// In-game ranking sample with scores set
const FFA_RANK = FFA_PLAYERS.map((p, i) => ({
  ...p,
  score: p.captain ? null : [22, 19, 15, 12, 8, 4][i - 1] ?? 0,
  hp: p.captain ? 100 : [82, 60, 71, 44, 22, 5][i - 1] ?? 100,
  lastDelta: p.captain ? null : [+5, +3, +2, +1, 0, -7][i - 1] ?? 0,
}));

/* ────────── PLAYER ROW (in ranking sidebar) ────────── */
function PlayerRow({ p, rank, compact, lang }) {
  const damageLevel =
    p.hp === 0 ? 4 :
    p.hp <= 25 ? 3 :
    p.hp <= 50 ? 2 :
    p.hp <= 80 ? 1 : 0;

  const isCap = p.captain;
  const labelColor = isCap ? 'var(--neon-amber)' : (p.you ? 'var(--neon-cyan)' : 'var(--ink)');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: compact ? '6px 8px' : '8px 10px',
      background: p.you ? 'rgba(0,255,255,0.08)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${p.you ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 4,
      opacity: !isCap && p.hp === 0 ? 0.45 : 1,
    }}>
      {/* rank number */}
      {!isCap && (
        <div className="t-title" style={{
          fontSize: 9, color: rank === 1 ? 'var(--neon-amber)' : 'var(--ink-dim)',
          minWidth: 16, textAlign: 'center',
          textShadow: rank === 1 ? '0 0 8px var(--neon-amber)' : 'none',
        }}>
          {rank === 1 ? '★' : `#${rank}`}
        </div>
      )}
      {isCap && (
        <div className="t-title" style={{
          fontSize: 11, color: 'var(--neon-amber)',
          textShadow: '0 0 8px var(--neon-amber)',
        }}>👑</div>
      )}

      {/* ship icon */}
      <div style={{ flex: '0 0 auto' }}>
        <ShipIcon ship={p.ship} color={p.color} damage={damageLevel} pixel={compact ? 1.5 : 2} />
      </div>

      {/* name + hp */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-title" style={{
          fontSize: compact ? 7 : 8,
          color: labelColor,
          textShadow: p.you ? '0 0 6px var(--neon-cyan)' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '0.04em',
        }}>
          {p.name}{p.you ? ' ◀' : ''}
        </div>
        {!isCap && (
          <div className="hpbar" style={{ borderColor: 'rgba(255,255,255,0.1)', height: 6, marginTop: 4 }}>
            <div className="hpbar-fill" style={{
              width: p.hp + '%',
              background: p.hp > 50
                ? 'linear-gradient(90deg, var(--neon-mint), var(--neon-cyan))'
                : p.hp > 25
                  ? 'linear-gradient(90deg, var(--neon-amber), #ffb84d)'
                  : 'linear-gradient(90deg, var(--neon-coral), #ff1a3a)',
              boxShadow: p.hp <= 25 ? '0 0 8px var(--neon-coral)' : 'none',
            }} />
          </div>
        )}
        {isCap && (
          <div className="t-mono" style={{ fontSize: 10, color: 'var(--neon-amber)', marginTop: 2 }}>
            {lang === 'pt' ? 'MESTRE · CAPITÃ' : 'GAME MASTER'}
          </div>
        )}
      </div>

      {/* score */}
      {!isCap && (
        <div style={{ textAlign: 'right' }}>
          <div className="t-read" style={{
            fontSize: compact ? 16 : 18, color: rank === 1 ? 'var(--neon-amber)' : 'var(--ink)',
            textShadow: rank === 1 ? '0 0 8px var(--neon-amber)' : 'none',
            lineHeight: 1,
          }}>
            {p.score}
          </div>
          {p.lastDelta !== null && p.lastDelta !== undefined && (
            <div className="t-mono" style={{
              fontSize: 9,
              color: p.lastDelta > 0 ? 'var(--neon-mint)' : p.lastDelta < 0 ? 'var(--neon-coral)' : 'var(--ink-faint)',
              marginTop: 2,
            }}>
              {p.lastDelta > 0 ? `+${p.lastDelta}` : p.lastDelta}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────── RANKING SIDEBAR ────────── */
function RankingPanel({ players = FFA_RANK, lang = 'pt', round = 3, totalRounds = 7, compact = false, onSettings }) {
  const captain = players.find(p => p.captain);
  const racers = players.filter(p => !p.captain).sort((a, b) => b.score - a.score);
  return (
    <div className="panel bevel" style={{
      width: '100%', height: '100%',
      padding: compact ? 10 : 14,
      display: 'flex', flexDirection: 'column',
      gap: 10, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0b0d24 0%, #06071a 100%)',
    }}>
      {/* header: round + settings */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div className="t-title text-dim" style={{ fontSize: 7 }}>{lang === 'pt' ? 'RODADA' : 'ROUND'}</div>
          <div className="t-read glow-text-cyan" style={{ fontSize: 22, lineHeight: 1 }}>
            {String(round).padStart(2, '0')}<span className="text-faded" style={{ fontSize: 14 }}>/{String(totalRounds).padStart(2, '0')}</span>
          </div>
        </div>
        <button onClick={onSettings} className="btn btn-ghost btn-icon" title="Settings"
          style={{ minHeight: 30, height: 30, width: 30 }}>⚙</button>
      </div>

      {/* captain card */}
      {captain && (
        <div style={{ padding: 0 }}>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
            ▸ {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
          </div>
          <PlayerRow p={captain} compact={compact} lang={lang} />
        </div>
      )}

      <div style={{ height: 1, background: 'var(--metal-2)', margin: '4px 0' }} />

      <div className="t-title text-dim" style={{ fontSize: 7 }}>
        ▸ {lang === 'pt' ? 'CLASSIFICAÇÃO' : 'RANKINGS'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
        {racers.map((p, i) => (
          <PlayerRow key={p.id} p={p} rank={i + 1} compact={compact} lang={lang} />
        ))}
      </div>
    </div>
  );
}

/* ────────── TOP BAR (compact) — for narrow mobile use ────────── */
function FFATopBar({ round, totalRounds, captain, lang, onSettings }) {
  return (
    <div className="panel bevel" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      background: 'linear-gradient(180deg, #0c0e26, #07081a)',
    }}>
      <div>
        <div className="t-title text-dim" style={{ fontSize: 7 }}>{lang === 'pt' ? 'RODADA' : 'ROUND'}</div>
        <div className="t-read glow-text-cyan" style={{ fontSize: 18, lineHeight: 1 }}>
          {String(round).padStart(2,'0')}<span className="text-faded" style={{ fontSize: 12 }}>/{String(totalRounds).padStart(2,'0')}</span>
        </div>
      </div>
      <div style={{ width: 1, height: 28, background: 'var(--metal-2)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14 }}>👑</span>
        <ShipIcon ship={captain.ship} color={captain.color} pixel={1.5} />
        <div className="t-title glow-text-amber" style={{
          fontSize: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{captain.name}</div>
      </div>
      <button onClick={onSettings} className="btn btn-ghost btn-icon" style={{ minHeight: 30, height: 30, width: 30 }}>⚙</button>
    </div>
  );
}

/* ────────── SHIP PICKER MODAL ────────── */
function ShipPickerScreen({ viewport, lang, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [ship, setShip] = ufS('interceptor');
  const [color, setColor] = ufS('red');

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          padding: mobile ? 16 : 26, gap: mobile ? 12 : 16,
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div className="t-title glow-text-cyan" style={{ fontSize: mobile ? 10 : 13 }}>
              ◢ {lang === 'pt' ? 'ESCOLHA SUA NAVE' : 'CHOOSE YOUR SHIP'}
            </div>
            <div className="t-body text-dim" style={{ fontSize: 12, marginTop: 6 }}>
              {lang === 'pt' ? 'Esse será seu ícone durante toda a missão.' : 'This will be your icon for the whole mission.'}
            </div>
          </div>

          {/* Preview */}
          <div className="panel bevel glow-cyan" style={{
            padding: mobile ? 16 : 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: mobile ? 160 : 200,
            position: 'relative',
          }}>
            <div className="scan-sweep" style={{ position: 'absolute', inset: 0 }} />
            <ShipIcon ship={ship} color={color} pixel={mobile ? 7 : 10} glow />
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
              <div className="t-title glow-text-amber" style={{ fontSize: mobile ? 10 : 12 }}>
                {SHIP_LABELS[lang][ship]?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Ship grid */}
          <div>
            <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 6 }}>
              ▸ {lang === 'pt' ? 'MODELO' : 'MODEL'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 6,
            }}>
              {SHIP_IDS.map(s => (
                <button key={s} onClick={() => setShip(s)}
                  style={{
                    aspectRatio: '1',
                    background: s === ship ? 'rgba(0,255,255,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${s === ship ? 'var(--neon-cyan)' : 'var(--metal-2)'}`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 6,
                    boxShadow: s === ship ? '0 0 14px rgba(0,255,255,0.4), inset 0 0 12px rgba(0,255,255,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  <ShipIcon ship={s} color={color} pixel={mobile ? 2 : 2.5} />
                </button>
              ))}
            </div>
          </div>

          {/* Color row */}
          <div>
            <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 6 }}>
              ▸ {lang === 'pt' ? 'CORES' : 'COLORS'}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SHIP_COLORS.map(c => {
                const swatch = SHIP_PALETTES[c]['0'];
                return (
                  <button key={c} onClick={() => setColor(c)}
                    style={{
                      width: 36, height: 36,
                      background: swatch,
                      border: `2.5px solid ${c === color ? 'var(--neon-cyan)' : '#000'}`,
                      boxShadow: c === color
                        ? `0 0 14px ${swatch}, 0 0 0 2px var(--neon-cyan)`
                        : `0 0 8px ${swatch}66`,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }} />
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button className="btn btn-primary btn-pulse" style={{ fontSize: 12, marginTop: 'auto' }}>
            ▶ {lang === 'pt' ? 'EMBARCAR' : 'BOARD SHIP'}
          </button>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ────────── FFA LOBBY ────────── */
function FFALobbyScreen({ viewport, lang, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [rounds, setRounds] = ufS(7);
  const [dmg, setDmg] = ufS(100);
  const [timer, setTimer] = ufS(45);

  const PlayerCard = ({ p }) => {
    const isCap = p.captain;
    return (
      <div className={`panel ${isCap ? 'glow-cyan' : 'bevel'}`} style={{
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: isCap ? 'linear-gradient(180deg, rgba(255,224,0,0.06), rgba(0,255,255,0.03))' : undefined,
        borderColor: isCap ? 'var(--neon-amber)' : undefined,
        boxShadow: isCap ? '0 0 16px rgba(255,224,0,0.3)' : undefined,
      }}>
        <ShipIcon ship={p.ship} color={p.color} pixel={mobile ? 2 : 2.5} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-title" style={{
            fontSize: 9, color: isCap ? 'var(--neon-amber)' : p.you ? 'var(--neon-cyan)' : 'var(--ink)',
            textShadow: isCap ? '0 0 8px var(--neon-amber)' : p.you ? '0 0 6px var(--neon-cyan)' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{p.name}</div>
          <div className="t-mono text-dim" style={{ fontSize: 11, marginTop: 2 }}>
            {SHIP_LABELS[lang][p.ship]} · {p.color}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
          {isCap && <span className="badge badge-captain"><span style={{ fontSize: 9 }}>👑</span> {S.captain}</span>}
          {p.you && <span className="badge badge-you">{S.you}</span>}
        </div>
      </div>
    );
  };

  const SettingRow = ({ label, value, suffix, onMinus, onPlus }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div className="t-title text-dim" style={{ fontSize: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn btn-ghost btn-icon" onClick={onMinus} style={{ minHeight: 30, height: 30, width: 30, fontSize: 14 }}>−</button>
        <div className="t-read glow-text-cyan" style={{
          fontSize: 20, minWidth: 56, textAlign: 'center',
          background: 'var(--space-1)', borderRadius: 4, padding: '3px 8px',
          border: '1px solid var(--metal-2)',
        }}>
          {value}{suffix || ''}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onPlus} style={{ minHeight: 30, height: 30, width: 30, fontSize: 14 }}>+</button>
      </div>
    </div>
  );

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{
          position: 'relative', height: '100%',
          padding: mobile ? 14 : 22,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Top: room code */}
          <div className="panel bevel rivets" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
          }}>
            <div>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 2 }}>{S.room}</div>
              <div className="t-read glow-text-amber" style={{ fontSize: 24, letterSpacing: '0.2em' }}>NX7-42K</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="t-title glow-text-cyan" style={{ fontSize: 9, marginBottom: 2 }}>
                {lang === 'pt' ? 'MODO ◆ FFA' : 'MODE ◆ FFA'}
              </div>
              <div className="t-mono text-dim" style={{ fontSize: 11 }}>
                {lang === 'pt' ? 'todos contra o mestre' : 'all vs. the master'}
              </div>
            </div>
          </div>

          {/* Captain spotlight */}
          <PlayerCard p={FFA_PLAYERS[0]} />

          {/* Other players list */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
            <div className="t-title text-dim" style={{ fontSize: 7 }}>
              ▸ {lang === 'pt' ? 'PILOTOS' : 'PILOTS'} ({FFA_PLAYERS.length - 1})
            </div>
            {FFA_PLAYERS.slice(1).map(p => <PlayerCard key={p.id} p={p} />)}
            <div style={{
              padding: '8px 10px',
              border: '1.5px dashed rgba(255,255,255,0.14)',
              borderRadius: 4,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--f-read)',
              fontSize: 14, textAlign: 'center',
            }}>
              + {lang === 'pt' ? 'aguardando piloto…' : 'awaiting pilot…'}
            </div>
          </div>

          {/* Settings */}
          <div className="panel bevel" style={{
            padding: '10px 12px',
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr',
            gap: 10,
          }}>
            <SettingRow label={S.rounds} value={rounds}
              onMinus={() => setRounds(r => Math.max(3, r-1))}
              onPlus={() => setRounds(r => Math.min(15, r+1))} />
            <SettingRow label={S.damage_limit} value={dmg} suffix=" HP"
              onMinus={() => setDmg(r => Math.max(60, r-20))}
              onPlus={() => setDmg(r => Math.min(200, r+20))} />
            <SettingRow label={S.timer} value={timer} suffix="s"
              onMinus={() => setTimer(r => Math.max(15, r-15))}
              onPlus={() => setTimer(r => Math.min(120, r+15))} />
          </div>

          <button className="btn btn-primary btn-pulse" style={{ padding: 14, fontSize: mobile ? 12 : 13 }}>
            ▶ {S.start_mission}
          </button>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ────────── IN-GAME FFA SCREEN with ranking sidebar (desktop) ────────── */
function FFAGameplayScreen({ viewport, lang, scanlines, phase = 'calibrate' }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [val, setVal] = ufS(58);
  const target = 73;

  const Center = () => {
    if (phase === 'transmit') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 12 : 18 }}>
          <div className="panel bevel" style={{ padding: 20, textAlign: 'center', maxWidth: 380 }}>
            <ShipIcon ship={FFA_PLAYERS[0].ship} color={FFA_PLAYERS[0].color} pixel={6} glow />
            <div className="t-title glow-text-amber" style={{ fontSize: 12, marginTop: 12 }}>NOVA ALDRIN</div>
            <div className="t-mono text-dim" style={{ fontSize: 14, marginTop: 6 }}>{S.thinking}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 8, height: 8, background: 'var(--neon-cyan)', borderRadius: '50%',
                  boxShadow: '0 0 6px var(--neon-cyan)',
                  animation: `flicker 1.4s steps(4) ${i*0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
          <div className="t-title text-dim" style={{ fontSize: 8 }}>
            ◢ TEMA · CIÊNCIA · {lang === 'pt' ? 'AGUARDE A PALAVRA' : 'AWAIT THE CLUE'} ◣
          </div>
        </div>
      );
    }
    if (phase === 'reveal') {
      const votes = FFA_RANK.filter(p => !p.captain).map((p, i) => ({
        value: [71, 78, 65, 50, 44, 22][i] ?? 50,
        color: SHIP_PALETTES[p.color]['0'],
        name: p.name.split(' ')[0],
      }));
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 12 : 16 }}>
          <Confetti count={40} />
          <PressureGauge
            value={target}
            target={target}
            showTarget
            votes={votes}
            size={mobile ? 260 : 320}
            label={lang === 'pt' ? 'REVELAÇÃO' : 'REVEAL'}
          />
          <div className="panel bevel glow-cyan" style={{ padding: '12px 22px', textAlign: 'center' }}>
            <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>{S.target}</div>
            <div className="t-read glow-text-mint" style={{ fontSize: 24 }}>{target} kPa</div>
            <div className="t-title glow-text-amber" style={{ fontSize: 11, marginTop: 6 }}>
              {lang === 'pt' ? 'CLEO V. · +5 PTS' : 'CLEO V. · +5 PTS'}
            </div>
          </div>
        </div>
      );
    }
    // calibrate (default)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 10 : 16 }}>
        <div className="panel bevel glow-cyan" style={{ padding: '10px 18px', textAlign: 'center' }}>
          <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
            ▸ NOVA ALDRIN · 📡 CIÊNCIA
          </div>
          <div className="t-title glow-text-amber" style={{ fontSize: mobile ? 16 : 22 }}>"ÁTOMO"</div>
        </div>
        <PressureGauge value={val} onChange={setVal} interactive
          size={mobile ? 260 : 320}
          label={lang === 'pt' ? 'CALIBRAGEM' : 'CALIBRATION'} />
        <button className="btn btn-primary" style={{ minWidth: 220, fontSize: 12 }}>
          ▶ {S.confirm} · {String(val).padStart(2, '0')}
        </button>
      </div>
    );
  };

  if (mobile) {
    // mobile: top bar + center + ranking drawer at bottom
    return (
      <div style={bgScreen()}>
        <ScreenChrome scanlines={scanlines}>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', padding: 10, gap: 10,
          }}>
            <FFATopBar round={3} totalRounds={7} captain={FFA_PLAYERS[0]} lang={lang} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
              <Center />
            </div>
            {/* compact ranking strip */}
            <div className="panel bevel" style={{ padding: 8, display: 'flex', gap: 4, overflow: 'auto' }}>
              {FFA_RANK.filter(p => !p.captain).sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} style={{
                  flex: '0 0 auto',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '4px 6px',
                  background: p.you ? 'rgba(0,255,255,0.08)' : 'transparent',
                  border: `1px solid ${p.you ? 'rgba(0,255,255,0.4)' : 'transparent'}`,
                  borderRadius: 3,
                  minWidth: 50,
                }}>
                  <div className="t-title" style={{
                    fontSize: 6, color: i === 0 ? 'var(--neon-amber)' : 'var(--ink-dim)',
                  }}>{i === 0 ? '★' : `#${i+1}`}</div>
                  <ShipIcon ship={p.ship} color={p.color} pixel={1.5}
                    damage={p.hp <= 25 ? 3 : p.hp <= 50 ? 2 : p.hp <= 80 ? 1 : 0} />
                  <div className="t-read" style={{ fontSize: 13, color: i === 0 ? 'var(--neon-amber)' : 'var(--ink)', lineHeight: 1 }}>
                    {p.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScreenChrome>
      </div>
    );
  }

  // desktop: ranking sidebar + center stage
  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 12, padding: 14,
        }}>
          <RankingPanel players={FFA_RANK} lang={lang} round={3} totalRounds={7} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Center />
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

Object.assign(window, {
  FFALobbyScreen, ShipPickerScreen, FFAGameplayScreen,
  RankingPanel, FFATopBar, FFA_PLAYERS, FFA_RANK,
});
