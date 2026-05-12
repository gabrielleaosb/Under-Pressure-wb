// screens.jsx — all 10 screen components for Under Pressure
// Loaded after components.jsx. Each screen accepts {viewport, lang, shipStyle, palette, scanlines}
// and renders inside an artboard. They maintain their own local interactive state.

const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

// ── shared helpers ────────────────────────────────────────────
function bgScreen(extra = {}) {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--space-0)',
    color: 'var(--ink)',
    fontFamily: 'var(--f-body)',
    ...extra,
  };
}

function ScreenChrome({ children, scanlines = 'subtle', noStars }) {
  return (
    <>
      {!noStars && <Starfield density={70} drift />}
      {children}
      {scanlines !== 'off' && (
        <div className={`scanlines ${scanlines === 'heavy' ? 'heavy' : ''}`} />
      )}
      {scanlines === 'heavy' && <div className="crt-glow" />}
    </>
  );
}

// Roles
const ROLE_TRANSMITTER = 'transmitter';
const ROLE_CALIBRATE   = 'calibrate';
const ROLE_WATCH       = 'watch';

// 7 sample players
const PLAYERS = {
  '0': [
    { id: 'r1', name: 'Nova Aldrin',   color: '#ff3355', captain: true,  you: false },
    { id: 'r2', name: 'Cleo Vega',     color: '#ff6a8a', captain: false, you: true  },
    { id: 'r3', name: 'Tito Marz',     color: '#ff9a4a', captain: false, you: false },
  ],
  '1': [
    { id: 'b1', name: 'Léo Orion',     color: '#00aaff', captain: true,  you: false },
    { id: 'b2', name: 'Mira Solis',    color: '#00e0ff', captain: false, you: false },
    { id: 'b3', name: 'Iri Zen',       color: '#7ec8ff', captain: false, you: false },
    { id: 'b4', name: 'Kai Plut',      color: '#a8d0ff', captain: false, you: false },
  ],
};

/* ============================================================
   01 · HOME SCREEN — variation A (mission-control)
   ============================================================ */
function HomeA({ viewport, lang, shipStyle, palette, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [name, setName] = uS('CLEO V.');
  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: mobile ? 18 : 26, padding: mobile ? '24px 18px' : '40px 60px',
        }}>
          {/* HUD top */}
          <div style={{
            position: 'absolute', top: mobile ? 14 : 22, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', padding: mobile ? '0 14px' : '0 28px',
            fontFamily: 'var(--f-read)', color: 'var(--ink-dim)',
            fontSize: mobile ? 13 : 15,
          }}>
            <span className="glow-text-cyan">▌SECTOR-7G</span>
            <span>v0.9.4 // ONLINE</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="glow-text-mint" style={{ animation: 'flicker 1.4s steps(2) infinite' }}>●</span>
              42 NAVES
            </span>
          </div>

          {/* Logo */}
          <PixelLogo
            shipStyle={shipStyle}
            size={mobile ? 'md' : 'lg'}
            tagline={lang === 'pt' ? 'PARTY GAME · ESPAÇO PROFUNDO' : 'PARTY GAME · DEEP SPACE'}
          />

          {/* Quick mission brief */}
          <div className="panel bevel" style={{
            padding: mobile ? '12px 14px' : '14px 22px',
            maxWidth: mobile ? 320 : 520,
            borderColor: 'rgba(0,255,255,0.25)',
          }}>
            <div className="t-title glow-text-cyan" style={{ fontSize: mobile ? 7 : 8, marginBottom: 6 }}>
              ▶ {lang === 'pt' ? 'TRANSMISSÃO RECEBIDA' : 'TRANSMISSION RECEIVED'}
            </div>
            <div className="t-body text-dim" style={{ fontSize: mobile ? 11 : 13, lineHeight: 1.5 }}>
              {lang === 'pt'
                ? 'Duas tripulações rivais. Um painel de pressão instável. Calibre antes que o casco ceda.'
                : 'Two rival crews. One unstable pressure panel. Calibrate before the hull gives.'}
            </div>
          </div>

          {/* Name input */}
          <div style={{ width: '100%', maxWidth: mobile ? 280 : 360 }}>
            <label className="t-title" style={{
              display: 'block', fontSize: 8, color: 'var(--ink-dim)',
              marginBottom: 6,
            }}>
              {S.name_placeholder} ▸
            </label>
            <input className="input" value={name} onChange={e => setName(e.target.value)}
              placeholder={S.name_placeholder} />
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex', gap: 10,
            flexDirection: mobile ? 'column' : 'row',
            width: '100%', maxWidth: mobile ? 280 : 480,
          }}>
            <button className="btn btn-primary btn-pulse" style={{ flex: 1 }}>
              {S.create}
            </button>
            <button className="btn" style={{ flex: 1, borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}>
              {S.board}
            </button>
          </div>

          {/* Lang toggle + sound */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="panel" style={{ display: 'flex', padding: 3, gap: 2, borderRadius: 4 }}>
              <button className={`btn ${lang === 'pt' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minHeight: 32, padding: '6px 12px', fontSize: 9, borderRadius: 2 }}>
                PT
              </button>
              <button className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minHeight: 32, padding: '6px 12px', fontSize: 9, borderRadius: 2 }}>
                EN
              </button>
            </div>
            <button className="btn btn-ghost btn-icon" style={{ minHeight: 32, height: 32, width: 32 }}>
              <SoundIcon on size={16} />
            </button>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   01b · HOME SCREEN — variation B (full-bleed cinematic)
   ============================================================ */
function HomeB({ viewport, lang, shipStyle, palette, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        {/* Giant warning grid bg */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }} />

        {/* Big rotating ship in background */}
        <div style={{
          position: 'absolute',
          top: mobile ? '14%' : '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.95,
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Ship style={shipStyle} team={0} damage={2} pixel={mobile ? 6 : 9} glow />
            <Ship style={shipStyle} team={1} damage={1} pixel={mobile ? 6 : 9} glow />
          </div>
        </div>

        {/* Bottom panel UI */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: mobile ? '0 16px 18px' : '0 40px 32px',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 10 : 14,
            background: 'linear-gradient(180deg, transparent, rgba(5,5,16,0.96) 28%)',
            paddingTop: mobile ? 60 : 100,
          }}>
            <div className="t-title glow-text-coral" style={{
              fontSize: mobile ? 8 : 11,
              letterSpacing: '0.3em',
              animation: 'flicker 2s steps(4) infinite',
            }}>
              ◣◣  ALERTA DE PROXIMIDADE  ◢◢
            </div>
            <div className="t-title" style={{
              fontSize: mobile ? 30 : 56,
              textAlign: 'center',
              color: 'var(--neon-cyan)',
              textShadow: '0 0 12px rgba(0,255,255,0.6), 0 0 28px rgba(0,255,255,0.35), 0 4px 0 #000',
              lineHeight: 1.05,
            }}>
              UNDER<br/>
              <span style={{ color: 'var(--neon-amber)', textShadow: '0 0 12px rgba(255,224,0,0.7), 0 4px 0 #000' }}>
                PRESSURE
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="input"
                style={{ maxWidth: mobile ? 180 : 220, fontSize: 18 }}
                defaultValue="CLEO V."
                placeholder={S.name_placeholder} />
              <button className="btn btn-primary btn-pulse"
                style={{ minHeight: 48, padding: '10px 14px', fontSize: mobile ? 9 : 10 }}>
                ▶ {S.create}
              </button>
            </div>
            <div className="t-mono text-dim" style={{ fontSize: 13 }}>
              {lang === 'pt' ? 'ou' : 'or'} <span style={{ color: 'var(--neon-amber)', textDecoration: 'underline', cursor: 'pointer' }}>{S.board}</span>
              <span style={{ margin: '0 10px' }}>·</span>
              <span style={{ cursor: 'pointer' }}>{lang === 'pt' ? 'EN' : 'PT'}</span>
              <span style={{ margin: '0 10px' }}>·</span>
              <SoundIcon on size={14} />
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   02 · LOBBY
   ============================================================ */
function LobbyScreen({ viewport, lang, shipStyle, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [rounds, setRounds] = uS(7);
  const [dmg, setDmg] = uS(100);
  const [timer, setTimer] = uS(45);

  const Team = ({ idx }) => {
    const list = PLAYERS[idx];
    const tColor = idx === 0 ? 'var(--team-0)' : 'var(--team-1)';
    return (
      <div className={`panel bevel ${idx === 0 ? 'glow-red' : 'glow-blue'}`} style={{
        padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: mobile ? 220 : 320,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="t-title" style={{
            fontSize: 11, color: tColor, textShadow: `0 0 8px ${tColor}`,
          }}>
            {idx === 0 ? (lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0') : (lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1')}
          </div>
          <Ship style={shipStyle} team={idx} damage={0} pixel={2} />
        </div>
        {list.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
          }}>
            <Avatar name={p.name} color={p.color} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-body" style={{
                fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {p.name}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                {p.captain && (
                  <span className="badge badge-captain">
                    <span style={{ fontSize: 9 }}>👑</span> {S.captain}
                  </span>
                )}
                {p.you && <span className="badge badge-you">{S.you}</span>}
              </div>
            </div>
          </div>
        ))}
        {/* slot for new player */}
        <div style={{
          padding: '8px 10px',
          border: '1.5px dashed rgba(255,255,255,0.12)',
          borderRadius: 4,
          color: 'var(--ink-faint)',
          fontFamily: 'var(--f-read)',
          fontSize: 14,
          textAlign: 'center',
        }}>
          + {lang === 'pt' ? 'aguardando…' : 'awaiting…'}
        </div>
      </div>
    );
  };

  const SettingRow = ({ label, value, onMinus, onPlus, suffix = '' }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div className="t-title text-dim" style={{ fontSize: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn btn-ghost btn-icon" onClick={onMinus}
          style={{ minHeight: 32, height: 32, width: 32, fontSize: 14 }}>−</button>
        <div className="t-read glow-text-cyan" style={{
          fontSize: 22, minWidth: 56, textAlign: 'center',
          background: 'var(--space-1)', borderRadius: 4, padding: '4px 8px',
          border: '1px solid var(--metal-2)',
        }}>
          {value}{suffix}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onPlus}
          style={{ minHeight: 32, height: 32, width: 32, fontSize: 14 }}>+</button>
      </div>
    </div>
  );

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{
          position: 'relative', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: mobile ? 14 : 22, gap: mobile ? 12 : 16,
        }}>
          {/* Top bar: room code + settings */}
          <div className="panel bevel rivets" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
          }}>
            <div>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 2 }}>{S.room}</div>
              <div className="t-read glow-text-amber" style={{ fontSize: 26, letterSpacing: '0.2em' }}>
                NX7-42K
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn btn-ghost btn-icon" title="Copy" style={{ minHeight: 36, height: 36, width: 36 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="9" height="10" rx="1"/>
                  <path d="M3 11V3a1 1 0 011-1h7"/>
                </svg>
              </button>
              <button className="btn btn-ghost btn-icon" title="Settings" style={{ minHeight: 36, height: 36, width: 36 }}>⚙</button>
            </div>
          </div>

          {/* Teams */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
            gap: mobile ? 10 : 14, flex: 1, minHeight: 0,
          }}>
            <Team idx={0} />
            <Team idx={1} />
          </div>

          {/* Settings panel */}
          <div className="panel bevel" style={{
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr',
            gap: mobile ? 10 : 16,
          }}>
            <SettingRow label={S.rounds} value={rounds}
              onMinus={() => setRounds(r => Math.max(3, r - 1))}
              onPlus={() => setRounds(r => Math.min(15, r + 1))} />
            <SettingRow label={S.damage_limit} value={dmg} suffix=" HP"
              onMinus={() => setDmg(r => Math.max(60, r - 20))}
              onPlus={() => setDmg(r => Math.min(200, r + 20))} />
            <SettingRow label={S.timer} value={timer} suffix="s"
              onMinus={() => setTimer(r => Math.max(15, r - 15))}
              onPlus={() => setTimer(r => Math.min(120, r + 15))} />
          </div>

          {/* Sticky start */}
          <button className="btn btn-primary btn-pulse" style={{
            padding: '16px', fontSize: mobile ? 13 : 14,
          }}>
            ▶ {S.start_mission}
          </button>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   03 · ROUND INTRO OVERLAY
   ============================================================ */
function RoundIntroScreen({ viewport, lang, shipStyle, scanlines, role = ROLE_TRANSMITTER }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const teams = [
    { idx: 0, name: lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0', hp: 80, maxHp: 100, score: 12, shipStyle },
    { idx: 1, name: lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1', hp: 60, maxHp: 100, score: 18, shipStyle },
  ];

  // Animated countdown bar (6s)
  const [progress, setProgress] = uS(0);
  uE(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 6000);
      setProgress(t);
      if (t >= 1) { clearInterval(id); }
    }, 30);
    return () => clearInterval(id);
  }, []);

  const roleConfig = {
    transmitter: { label: S.role_transmitter, color: 'var(--neon-amber)', hint: lang === 'pt' ? 'envie UMA palavra à sua tripulação' : 'send ONE word to your crew' },
    calibrate:   { label: S.role_calibrate,   color: 'var(--neon-cyan)',  hint: lang === 'pt' ? 'gire o ponteiro até a posição' : 'drag the needle to the target' },
    watch:       { label: S.role_watch,       color: 'var(--ink-dim)',    hint: lang === 'pt' ? 'a outra tripulação está agindo' : 'the other crew is playing' },
  }[role];

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines="heavy">
        {/* In-game scoreboard visible underneath */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14, opacity: 0.55 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>

        {/* Glassmorphism over */}
        <div className="overlay-blur" />

        {/* Center modal */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: mobile ? 18 : 30,
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 16 : 22,
            maxWidth: mobile ? '100%' : 580,
          }}>
            {/* Round indicator */}
            <div className="t-title glow-text-cyan" style={{
              fontSize: mobile ? 9 : 11,
              letterSpacing: '0.3em',
              animation: 'flicker 1.5s steps(3) infinite',
            }}>
              ◀ {lang === 'pt' ? 'RODADA 03 DE 07' : 'ROUND 03 OF 07'} ▶
            </div>

            {/* Active team name */}
            <div className="t-title" style={{
              fontSize: mobile ? 22 : 38,
              color: 'var(--neon-coral)',
              textShadow: '0 0 12px rgba(255,51,85,0.7), 0 4px 0 #000',
              textAlign: 'center', lineHeight: 1.15,
            }}>
              TRIPULAÇÃO 0
              <div className="t-body text-dim" style={{
                fontSize: mobile ? 11 : 13, marginTop: 8, fontWeight: 400, letterSpacing: '0.06em',
                color: 'var(--ink-dim)', textShadow: 'none',
              }}>
                {lang === 'pt' ? '◣ TRANSMITINDO ◢' : '◣ TRANSMITTING ◢'}
              </div>
            </div>

            {/* Transmitter avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name="Nova Aldrin" color="#ff3355" size={mobile ? 56 : 72} ring />
              <div>
                <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 4 }}>
                  📡 {lang === 'pt' ? 'TRANSMITINDO' : 'TRANSMITTING'}
                </div>
                <div className="t-title" style={{ fontSize: mobile ? 13 : 17, color: '#fff' }}>
                  NOVA ALDRIN
                </div>
              </div>
            </div>

            {/* Your role card */}
            <div className="panel bevel" style={{
              width: '100%',
              padding: mobile ? '14px 16px' : '18px 24px',
              textAlign: 'center',
              borderColor: roleConfig.color,
              boxShadow: `0 0 22px ${roleConfig.color}55, inset 0 0 16px ${roleConfig.color}11`,
            }}>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 8 }}>
                ▸ {lang === 'pt' ? 'SEU PAPEL' : 'YOUR ROLE'}
              </div>
              <div className="t-title" style={{
                fontSize: mobile ? 14 : 18,
                color: roleConfig.color,
                textShadow: `0 0 10px ${roleConfig.color}`,
                marginBottom: 6,
              }}>
                {roleConfig.label}
              </div>
              <div className="t-body text-dim" style={{ fontSize: mobile ? 11 : 13 }}>
                {roleConfig.hint}
              </div>
            </div>

            {/* Countdown progress */}
            <div style={{ width: '100%' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--f-read)', fontSize: 13,
                color: 'var(--ink-dim)', marginBottom: 4,
              }}>
                <span>{lang === 'pt' ? 'INICIANDO MISSÃO' : 'STARTING MISSION'}</span>
                <span>{Math.max(0, Math.ceil((1 - progress) * 6))}s</span>
              </div>
              <div className="slider-track" style={{ height: 6 }}>
                <div className="slider-fill" style={{ width: (progress * 100) + '%' }} />
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   04 · ROULETTE / THEME WHEEL
   ============================================================ */
function RouletteScreen({ viewport, lang, shipStyle, scanlines }) {
  const S = STRINGS[lang];
  const themes = lang === 'pt' ? THEMES_PT : THEMES_EN;
  const mobile = viewport === 'mobile';
  const [spinning, setSpinning] = uS(false);
  const [done, setDone] = uS(false);
  const [target, setTarget] = uS(2); // CIÊNCIA
  const teams = [
    { idx: 0, name: lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0', hp: 80, maxHp: 100, score: 12, shipStyle },
    { idx: 1, name: lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1', hp: 60, maxHp: 100, score: 18, shipStyle },
  ];

  const spin = () => {
    setTarget(Math.floor(Math.random() * themes.length));
    setSpinning(true);
    setDone(false);
  };
  const size = mobile ? 280 : 380;

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>
        <div style={{
          position: 'absolute', inset: mobile ? '120px 16px 16px' : '140px 30px 30px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 16 : 22,
          justifyContent: 'center',
        }}>
          <div className="t-title glow-text-cyan" style={{ fontSize: mobile ? 10 : 13, textAlign: 'center' }}>
            ▸ {lang === 'pt' ? 'SELECIONAR FREQUÊNCIA' : 'SELECT FREQUENCY'}
          </div>
          <div className="t-body text-dim" style={{ fontSize: mobile ? 12 : 14, textAlign: 'center', maxWidth: 380 }}>
            {lang === 'pt'
              ? 'NOVA ALDRIN, gire a roleta para revelar o tema desta rodada.'
              : 'NOVA ALDRIN, spin the wheel to reveal this round\'s theme.'}
          </div>

          <RouletteWheel
            themes={themes}
            size={size}
            spinning={spinning}
            targetIndex={target}
            onSpinEnd={() => { setSpinning(false); setDone(true); }}
          />

          {!done ? (
            <button className="btn btn-primary btn-pulse" disabled={spinning}
              onClick={spin}
              style={{ minWidth: 200, fontSize: 13 }}>
              {spinning
                ? (lang === 'pt' ? '◢ GIRANDO… ◣' : '◢ SPINNING… ◣')
                : `▶ ${S.spin}`}
            </button>
          ) : (
            <div className="panel bevel glow-cyan" style={{ padding: '12px 22px', textAlign: 'center' }}>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 6 }}>
                ▸ {lang === 'pt' ? 'FREQUÊNCIA TRAVADA' : 'FREQUENCY LOCKED'}
              </div>
              <div className="t-title glow-text-amber" style={{ fontSize: mobile ? 16 : 22 }}>
                {themes[target].label}
              </div>
            </div>
          )}
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   05 · TRANSMITTER PHASE
   ============================================================ */
function TransmitterScreen({ viewport, lang, shipStyle, scanlines, asTransmitter = true }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [clue, setClue] = uS('');
  const target = 73; // example secret target
  const [time, setTime] = uS(38);
  uE(() => {
    const id = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const teams = [
    { idx: 0, name: lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0', hp: 80, maxHp: 100, score: 12, shipStyle },
    { idx: 1, name: lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1', hp: 60, maxHp: 100, score: 18, shipStyle },
  ];

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>
        <div style={{
          position: 'absolute', inset: mobile ? '120px 16px 16px' : '140px 40px 30px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: mobile ? 12 : 18, justifyContent: 'center',
        }}>
          {/* Theme reminder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-team-0">📡 {lang === 'pt' ? 'VOCÊ TRANSMITE' : 'YOU TRANSMIT'}</span>
            <span className="t-title text-dim" style={{ fontSize: 9 }}>· TEMA ·</span>
            <span className="t-title glow-text-amber" style={{ fontSize: 11 }}>CIÊNCIA</span>
          </div>

          {asTransmitter ? (
            <>
              {/* Gauge with secret target visible */}
              <div style={{ position: 'relative' }}>
                <PressureGauge
                  value={target}
                  target={target}
                  showTarget
                  size={mobile ? 280 : 360}
                  interactive={false}
                  label={lang === 'pt' ? 'ALVO SECRETO' : 'SECRET TARGET'}
                />
                <div style={{
                  position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--neon-mint)', color: '#001a0d',
                  padding: '4px 10px', borderRadius: 2,
                  fontFamily: 'var(--f-title)', fontSize: 9,
                  boxShadow: '0 0 14px rgba(0,255,136,0.8)',
                }}>
                  {lang === 'pt' ? 'SÓ VOCÊ VÊ' : 'ONLY YOU SEE'}
                </div>
              </div>

              {/* Clue input */}
              <div className="panel bevel glow-cyan" style={{
                padding: mobile ? '12px 14px' : '16px 22px',
                width: '100%', maxWidth: mobile ? '100%' : 480,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="t-title glow-text-cyan" style={{ fontSize: 9 }}>{S.your_clue} ▸</div>
                  <div className="t-mono text-dim" style={{ fontSize: 12 }}>{S.one_word}</div>
                </div>
                <input className="input" value={clue}
                  onChange={e => setClue(e.target.value.replace(/\s+/g, '').toUpperCase().slice(0, 18))}
                  placeholder={lang === 'pt' ? 'EX: ÁTOMO' : 'EX: ATOM'} />
                {/* Timer bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-read)', fontSize: 13, color: time < 10 ? 'var(--neon-coral)' : 'var(--ink-dim)', marginBottom: 4 }}>
                    <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span><span>{time}s</span>
                  </div>
                  <div className="slider-track">
                    <div className="slider-fill" style={{
                      width: (time / 45 * 100) + '%',
                      background: time < 10
                        ? 'linear-gradient(90deg, var(--neon-coral), var(--neon-amber))'
                        : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-amber))',
                    }} />
                  </div>
                </div>
              </div>
              <button className="btn btn-primary"
                disabled={clue.length < 2}
                style={{ minWidth: 200, fontSize: 12 }}>
                ▶ {lang === 'pt' ? 'TRANSMITIR PISTA' : 'SEND CLUE'}
              </button>
            </>
          ) : (
            <>
              {/* Other player view - clue hidden */}
              <div className="panel bevel" style={{
                padding: 22, width: '100%', maxWidth: 380,
                textAlign: 'center', position: 'relative',
              }}>
                <Avatar name="Nova Aldrin" color="#ff3355" size={56} ring />
                <div className="t-title" style={{ fontSize: 12, color: '#fff', marginTop: 12 }}>NOVA ALDRIN</div>
                <div className="t-mono text-dim" style={{ fontSize: 14, marginTop: 6 }}>
                  {S.thinking}
                </div>
                {/* animated dots */}
                <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 8, height: 8, background: 'var(--neon-cyan)',
                      borderRadius: '50%', boxShadow: '0 0 6px var(--neon-cyan)',
                      animation: `flicker 1.4s steps(4) ${i*0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   06 · CALIBRATION / VOTING PHASE
   variant: 'classic' (semicircular) | 'horizon' (vertical bar) | 'pill' (compact)
   ============================================================ */
function CalibrationScreen({ viewport, lang, shipStyle, scanlines, variant = 'classic' }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [val, setVal] = uS(58);
  const [confirmed, setConfirmed] = uS(false);
  const [time, setTime] = uS(28);
  uE(() => {
    const id = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const teams = [
    { idx: 0, name: lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0', hp: 80, maxHp: 100, score: 12, shipStyle },
    { idx: 1, name: lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1', hp: 60, maxHp: 100, score: 18, shipStyle },
  ];
  // who-has-voted dots
  const voters = [
    { name: 'Nova', color: '#ff3355', voted: true },
    { name: 'Cleo', color: '#ff6a8a', voted: confirmed }, // you
    { name: 'Tito', color: '#ff9a4a', voted: false },
  ];

  // gauge variant rendering
  const Gauge = () => {
    if (variant === 'horizon') {
      return <HorizonGauge value={val} onChange={setVal} size={mobile ? 280 : 360} interactive lang={lang} />;
    }
    if (variant === 'pill') {
      return <PillGauge value={val} onChange={setVal} width={mobile ? 320 : 480} interactive lang={lang} />;
    }
    return (
      <PressureGauge value={val} onChange={setVal} interactive
        size={mobile ? 300 : 380}
        label={lang === 'pt' ? 'CALIBRAGEM' : 'CALIBRATION'} />
    );
  };

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>
        <div style={{
          position: 'absolute', inset: mobile ? '120px 16px 16px' : '140px 40px 30px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: mobile ? 12 : 18, justifyContent: 'center',
        }}>
          {/* Clue banner */}
          <div className="panel bevel glow-cyan" style={{
            padding: mobile ? '10px 18px' : '14px 28px',
            textAlign: 'center',
            minWidth: mobile ? 260 : 360,
          }}>
            <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
              ▸ {lang === 'pt' ? 'TRANSMISSÃO DE NOVA ALDRIN · CIÊNCIA' : 'NOVA ALDRIN TRANSMITS · SCIENCE'}
            </div>
            <div className="t-title glow-text-amber" style={{ fontSize: mobile ? 16 : 22 }}>
              "ÁTOMO"
            </div>
          </div>

          <Gauge />

          {/* Voters */}
          <div style={{ display: 'flex', gap: 8 }}>
            {voters.map((v, i) => (
              <div key={i} style={{ position: 'relative', textAlign: 'center' }}>
                <Avatar name={v.name} color={v.color} size={36} ring={v.voted} />
                {v.voted && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--neon-mint)',
                    border: '2px solid var(--space-0)',
                    boxShadow: '0 0 8px var(--neon-mint)',
                    fontSize: 9, color: '#002a14', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--f-title)',
                  }}>✓</div>
                )}
                <div className="t-mono" style={{ fontSize: 11, color: v.voted ? 'var(--neon-mint)' : 'var(--ink-dim)', marginTop: 4 }}>
                  {v.name}
                </div>
              </div>
            ))}
          </div>

          {/* Confirm */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            <button
              className={confirmed ? 'btn' : 'btn btn-primary'}
              onClick={() => setConfirmed(c => !c)}
              style={{ minWidth: 220, fontSize: 12 }}>
              {confirmed
                ? `▸ ${S.revote} · ${String(val).padStart(2, '0')}`
                : `▶ ${S.confirm} · ${String(val).padStart(2, '0')}`}
            </button>
          </div>

          {/* Timer */}
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--f-read)', fontSize: 13,
              color: time < 10 ? 'var(--neon-coral)' : 'var(--ink-dim)', marginBottom: 4,
            }}>
              <span>{lang === 'pt' ? 'TEMPO' : 'TIME'}</span><span>{time}s</span>
            </div>
            <div className="slider-track">
              <div className="slider-fill" style={{
                width: (time / 45 * 100) + '%',
                background: time < 10
                  ? 'linear-gradient(90deg, var(--neon-coral), var(--neon-amber))'
                  : 'linear-gradient(90deg, var(--neon-cyan), var(--neon-amber))',
              }} />
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ── HorizonGauge — alt variant: horizontal bar w/ moving notch ── */
function HorizonGauge({ value, onChange, size = 360, interactive, lang }) {
  const ref = uR(null);
  const drag = uR(false);
  const w = size;
  const onMove = (clientX) => {
    if (!ref.current || !onChange) return;
    const r = ref.current.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    onChange(Math.max(0, Math.min(100, Math.round(pct))));
  };
  uE(() => {
    if (!interactive) return;
    const mm = (e) => { if (drag.current) onMove((e.touches?e.touches[0]:e).clientX); };
    const mu = () => { drag.current = false; };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', mm);
    window.addEventListener('touchend', mu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', mm);
      window.removeEventListener('touchend', mu);
    };
  }, [interactive]);
  return (
    <div style={{ width: w, padding: 20 }}>
      <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 10, textAlign: 'center' }}>
        ◀ {lang === 'pt' ? 'HORIZONTE DE PRESSÃO' : 'PRESSURE HORIZON'} ▶
      </div>
      <div
        ref={ref}
        onMouseDown={(e) => { if (interactive) { drag.current = true; onMove(e.clientX); } }}
        onTouchStart={(e) => { if (interactive) { drag.current = true; onMove(e.touches[0].clientX); } }}
        style={{
          position: 'relative', height: 60, cursor: interactive ? 'ew-resize' : 'default',
          touchAction: 'none',
        }}>
        {/* zones */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 22, height: 16, borderRadius: 2,
          background: 'linear-gradient(90deg, var(--neon-blue) 0% 40%, var(--neon-mint) 40% 60%, var(--neon-coral) 60% 100%)',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6), 0 0 14px rgba(0,255,255,0.2)',
          border: '1px solid #000',
        }} />
        {/* ticks */}
        {[0,25,50,75,100].map(t => (
          <div key={t} style={{
            position: 'absolute', left: t + '%', top: 0, bottom: 0,
            width: 1, background: 'var(--ink-dim)',
            transform: 'translateX(-0.5px)',
          }}>
            <div style={{
              position: 'absolute', top: -16, left: 0, transform: 'translateX(-50%)',
              fontFamily: 'var(--f-read)', fontSize: 12, color: 'var(--ink-dim)',
            }}>{t}</div>
          </div>
        ))}
        {/* needle */}
        <div style={{
          position: 'absolute', left: value + '%', top: -2, bottom: -2,
          transform: 'translateX(-50%)',
        }}>
          <div className="needle-glow-yellow" style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 4, background: 'var(--neon-amber)',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 12px var(--neon-amber)',
          }} />
          <div style={{
            position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--space-0)', border: '1.5px solid var(--neon-amber)',
            color: 'var(--neon-amber)', fontFamily: 'var(--f-read)', fontSize: 16,
            padding: '2px 8px', borderRadius: 2,
            boxShadow: '0 0 12px rgba(255,224,0,0.5)',
          }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ── PillGauge — compact pill variant ── */
function PillGauge({ value, onChange, width = 380, interactive, lang }) {
  return (
    <div className="panel bevel glow-cyan" style={{ width, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="t-title text-dim" style={{ fontSize: 8 }}>P-CAL ▾</div>
        <div className="t-read glow-text-amber" style={{ fontSize: 18 }}>{String(value).padStart(2,'0')}</div>
      </div>
      <HorizonGauge value={value} onChange={onChange} size={width - 36} interactive={interactive} lang={lang} />
    </div>
  );
}

/* ============================================================
   07 · REVEAL PHASE
   ============================================================ */
function RevealScreen({ viewport, lang, shipStyle, scanlines, grade = 'vc' }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const teams = [
    { idx: 0, name: lang === 'pt' ? 'TRIPULAÇÃO 0' : 'CREW 0', hp: 80, maxHp: 100, score: 12 + (grade==='perfect'?5:grade==='vc'?3:grade==='c'?2:grade==='r'?1:0), shipStyle },
    { idx: 1, name: lang === 'pt' ? 'TRIPULAÇÃO 1' : 'CREW 1', hp: 60 - (grade==='f'?10:grade==='r'?4:0), maxHp: 100, score: 18, shipStyle },
  ];
  const target = 73;
  const votes = [
    { name: 'Nova', color: '#ff3355', value: 68 },
    { name: 'Cleo', color: '#ff6a8a', value: 78 },
    { name: 'Tito', color: '#ff9a4a', value: 65 },
  ];
  const avg = Math.round(votes.reduce((a,b) => a + b.value, 0) / votes.length);

  const [locked, setLocked] = uS(true);
  uE(() => {
    const t = setTimeout(() => setLocked(false), 4500);
    return () => clearTimeout(t);
  }, []);

  const gradeConfig = {
    perfect: { label: S.grade.perfect, color: 'var(--neon-mint)',  pts: '+5 PTS', dmg: '0',  damageColor: 'var(--neon-mint)' },
    vc:      { label: S.grade.vc,      color: 'var(--neon-cyan)',  pts: '+3 PTS', dmg: '0',  damageColor: 'var(--neon-cyan)' },
    c:       { label: S.grade.c,       color: 'var(--neon-amber)', pts: '+2 PTS', dmg: '-4 HP', damageColor: 'var(--neon-amber)' },
    r:       { label: S.grade.r,       color: '#ff9a4a',           pts: '+1 PT',  dmg: '-7 HP', damageColor: '#ff9a4a' },
    f:       { label: S.grade.f,       color: 'var(--neon-coral)', pts: '0',      dmg: '-12 HP', damageColor: 'var(--neon-coral)' },
  }[grade];

  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        {grade === 'perfect' && <Confetti count={80} />}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>
        <div style={{
          position: 'absolute', inset: mobile ? '120px 16px 16px' : '140px 40px 30px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: mobile ? 10 : 16, justifyContent: 'center',
        }}>
          <PressureGauge
            value={avg}
            target={target}
            showTarget
            average={avg}
            votes={votes.map(v => ({ value: v.value, color: v.color, name: v.name }))}
            size={mobile ? 280 : 360}
            label={lang === 'pt' ? 'REVELAÇÃO' : 'REVEAL'}
          />

          {/* Result card */}
          <div className="panel bevel" style={{
            padding: mobile ? '12px 18px' : '16px 28px',
            display: 'flex', alignItems: 'center', gap: mobile ? 14 : 22,
            borderColor: gradeConfig.color,
            boxShadow: `0 0 24px ${gradeConfig.color}55`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>{S.target} / {S.average}</div>
              <div className="t-read glow-text-mint" style={{ fontSize: 22 }}>{target} / {avg}</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--metal-2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div className="t-title" style={{
                fontSize: mobile ? 14 : 18,
                color: gradeConfig.color,
                textShadow: `0 0 10px ${gradeConfig.color}`,
              }}>
                {gradeConfig.label}
              </div>
              <div className="t-mono" style={{ fontSize: 13, marginTop: 4, color: gradeConfig.color }}>
                {gradeConfig.pts} · {gradeConfig.dmg}
              </div>
            </div>
          </div>

          {locked ? (
            <div className="t-title text-dim" style={{ fontSize: 9, animation: 'flicker 1s steps(4) infinite' }}>
              ◁ {lang === 'pt' ? 'ANALISANDO TELEMETRIA' : 'ANALYZING TELEMETRY'} ▷
            </div>
          ) : (
            <button className="btn btn-primary btn-pulse" style={{ minWidth: 240, fontSize: 12 }}>
              ▶ {S.next_round}
            </button>
          )}
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   09 · GAME OVER
   ============================================================ */
function GameOverScreen({ viewport, lang, shipStyle, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        <Confetti count={100} colors={['#00aaff', '#00ffff', '#a8d0ff', '#ffe000', '#fff']} duration={4} />

        {/* Twin ship outcome */}
        <div style={{
          position: 'absolute', top: mobile ? 60 : 80, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: mobile ? 20 : 60,
        }}>
          {/* Loser */}
          <div style={{ textAlign: 'center' }}>
            <div className="t-title glow-text-coral" style={{ fontSize: mobile ? 8 : 10, marginBottom: 10 }}>
              ☠ {S.crew_destroyed}
            </div>
            <div style={{ filter: 'grayscale(0.4)' }}>
              <Ship style={shipStyle} team={0} damage={4} pixel={mobile ? 5 : 8} shake />
            </div>
            <div className="t-title text-dim" style={{ fontSize: 8, marginTop: 14 }}>TRIPULAÇÃO 0</div>
            <div className="t-read text-dim" style={{ fontSize: 18 }}>22 PTS</div>
          </div>
          {/* Winner */}
          <div style={{ textAlign: 'center' }}>
            <div className="t-title glow-text-mint" style={{ fontSize: mobile ? 8 : 10, marginBottom: 10, animation: 'flicker 2s steps(4) infinite' }}>
              ★ {S.crew_survived}
            </div>
            <Ship style={shipStyle} team={1} damage={1} pixel={mobile ? 5 : 8} glow />
            <div className="t-title glow-text-blue" style={{ fontSize: mobile ? 9 : 11, marginTop: 14 }}>TRIPULAÇÃO 1</div>
            <div className="t-read glow-text-amber" style={{ fontSize: 22 }}>34 PTS</div>
          </div>
        </div>

        {/* Center title */}
        <div style={{
          position: 'absolute',
          top: mobile ? '38%' : '46%',
          left: 0, right: 0, textAlign: 'center',
        }}>
          <div className="t-title glow-text-cyan" style={{
            fontSize: mobile ? 20 : 36,
            textShadow: '0 0 12px rgba(0,255,255,0.7), 0 4px 0 #000',
            letterSpacing: '0.1em',
          }}>
            MISSÃO COMPLETA
          </div>
        </div>

        {/* Stats panel */}
        <div style={{
          position: 'absolute', bottom: mobile ? 80 : 100, left: 14, right: 14,
          display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr',
          gap: mobile ? 8 : 14, maxWidth: 720, margin: '0 auto',
        }}>
          {[
            { label: S.best_transmitter, val: 'MIRA SOLIS', sub: lang === 'pt' ? '5 acertos perfeitos' : '5 perfect hits', color: 'var(--neon-cyan)' },
            { label: S.best_hit, val: '∆ 1 kPa', sub: 'CLEO V. · "ÁTOMO"', color: 'var(--neon-mint)' },
            { label: S.worst_miss, val: '∆ 47 kPa', sub: 'TITO M. · "BANANA"', color: 'var(--neon-coral)' },
          ].map((s, i) => (
            <div key={i} className="panel bevel" style={{
              padding: '10px 14px', borderColor: s.color,
              boxShadow: `0 0 12px ${s.color}33`,
            }}>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>{s.label}</div>
              <div className="t-title" style={{ fontSize: mobile ? 13 : 14, color: s.color, textShadow: `0 0 8px ${s.color}` }}>{s.val}</div>
              <div className="t-body text-dim" style={{ fontSize: 11, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{
          position: 'absolute', bottom: mobile ? 14 : 22, left: 14, right: 14,
          display: 'flex', gap: 10, justifyContent: 'center',
          flexDirection: mobile ? 'column' : 'row',
        }}>
          <button className="btn btn-primary" style={{ minWidth: 200, fontSize: 12 }}>▶ {S.new_mission}</button>
          <button className="btn" style={{ minWidth: 200, fontSize: 12, borderColor: 'var(--neon-amber)', color: 'var(--neon-amber)' }}>
            {S.new_crew}
          </button>
        </div>
      </ScreenChrome>
    </div>
  );
}

/* ============================================================
   10 · SETTINGS MODAL (over any screen)
   ============================================================ */
function SettingsScreen({ viewport, lang, shipStyle, scanlines }) {
  const S = STRINGS[lang];
  const mobile = viewport === 'mobile';
  const [vol, setVol] = uS(70);
  const teams = [
    { idx: 0, name: 'TRIPULAÇÃO 0', hp: 80, maxHp: 100, score: 12, shipStyle },
    { idx: 1, name: 'TRIPULAÇÃO 1', hp: 60, maxHp: 100, score: 18, shipStyle },
  ];
  return (
    <div style={bgScreen()}>
      <ScreenChrome scanlines={scanlines}>
        {/* Background screen (faded) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: mobile ? 10 : 14, opacity: 0.5 }}>
          <ScoreBar teams={teams} round={3} totalRounds={7} compact />
        </div>
        <div style={{ position: 'absolute', inset: mobile ? '110px 20px 16px' : '120px 30px 30px', opacity: 0.35, pointerEvents: 'none' }}>
          {/* faded mock gauge */}
          <div style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)' }}>
            <PressureGauge value={45} size={mobile ? 220 : 300} />
          </div>
        </div>

        <div className="overlay-blur" />

        {/* Modal */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: mobile ? 'calc(100% - 28px)' : 460,
          maxWidth: '95%',
        }}>
          <div className="panel bevel glow-cyan" style={{
            padding: mobile ? '16px 16px 18px' : '22px 24px 24px',
            background: 'linear-gradient(180deg, #0f1230, #07081a)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div className="t-title glow-text-cyan" style={{ fontSize: 13 }}>⚙ {S.settings}</div>
              <button className="btn btn-ghost btn-icon" style={{ minHeight: 36, height: 36, width: 36 }}>
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path d="M3 3l10 10 M13 3l-10 10" stroke="currentColor" strokeWidth="1.8"/>
                </svg>
              </button>
            </div>

            {/* Volume */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="t-title text-dim" style={{ fontSize: 8 }}><SoundIcon on size={14}/> {S.volume}</div>
                <div className="t-read glow-text-amber" style={{ fontSize: 18 }}>{vol}</div>
              </div>
              <input type="range" min="0" max="100" value={vol}
                onChange={e => setVol(Number(e.target.value))}
                style={{ width: '100%' }} />
            </div>

            {/* Language */}
            <div style={{ marginBottom: 18 }}>
              <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 8 }}>🌐 {S.language}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`btn ${lang === 'pt' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, minHeight: 40 }}>
                  PT-BR
                </button>
                <button className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1, minHeight: 40 }}>
                  EN
                </button>
              </div>
            </div>

            {/* Help text */}
            <div className="t-body text-dim" style={{ fontSize: 11, marginBottom: 18, padding: '8px 10px', background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.12)', borderRadius: 3 }}>
              <span className="glow-text-cyan">▸ </span>
              {lang === 'pt'
                ? 'Pressione H durante o jogo para abrir o painel de comandos. Pressione M para silenciar.'
                : 'Press H in-game to open the command panel. Press M to mute.'}
            </div>

            {/* Leave */}
            <button className="btn btn-danger" style={{ width: '100%', fontSize: 12 }}>
              ⏏ {S.leave}
            </button>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

Object.assign(window, {
  HomeA, HomeB, LobbyScreen, RoundIntroScreen, RouletteScreen,
  TransmitterScreen, CalibrationScreen, RevealScreen, GameOverScreen, SettingsScreen,
  PLAYERS,
});
