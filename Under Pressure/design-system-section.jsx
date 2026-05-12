// design-system-section.jsx — visual style guide artboards

const { useState: useDS } = React;

function DSSwatch({ name, hex, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        height: 56, background: hex,
        borderRadius: 4, border: '2px solid #000',
        boxShadow: `0 0 14px ${hex}55, inset 0 -3px 0 rgba(0,0,0,0.2)`,
      }} />
      <div className="t-title" style={{ fontSize: 7, color: hex, textShadow: `0 0 6px ${hex}` }}>{name}</div>
      <div className="t-mono text-dim" style={{ fontSize: 11 }}>{hex}</div>
      {label && <div className="t-body text-faded" style={{ fontSize: 10 }}>{label}</div>}
    </div>
  );
}

function DSColorsBoard() {
  return (
    <div style={bgScreen({ padding: 24 })}>
      <ScreenChrome scanlines="subtle">
        <div style={{ position: 'relative', height: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 13, marginBottom: 6 }}>
              ◢ PALETTE · ESPECTRO 7-NEON
            </div>
            <div className="t-body text-dim" style={{ fontSize: 12 }}>
              Deep space dark with six high-energy accents. Each accent has a defined role.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <DSSwatch name="SPACE-0" hex="#050510" label="canvas / hull void" />
            <DSSwatch name="PANEL"   hex="#0d0e22" label="instrument panels" />
            <DSSwatch name="METAL"   hex="#2b2f55" label="bezels / borders" />
            <DSSwatch name="INK"     hex="#d8e1ff" label="primary text" />
          </div>
          <div className="t-title text-dim" style={{ fontSize: 8, marginTop: 6 }}>▸ ACCENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            <DSSwatch name="CYAN"   hex="#00ffff" label="primary action" />
            <DSSwatch name="CORAL"  hex="#ff3355" label="team-0 / danger" />
            <DSSwatch name="BLUE"   hex="#00aaff" label="team-1 / info" />
            <DSSwatch name="AMBER"  hex="#ffe000" label="readouts / focus" />
            <DSSwatch name="MINT"   hex="#00ff88" label="success / target" />
            <DSSwatch name="VIOLET" hex="#b066ff" label="rare / wheel" />
          </div>

          <div className="t-title text-dim" style={{ fontSize: 8, marginTop: 6 }}>▸ TEAM TINTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="panel bevel glow-red" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Ship style="ftl" team={0} damage={0} pixel={3} />
              <div>
                <div className="t-title glow-text-coral" style={{ fontSize: 10 }}>TEAM 0 · CORAL</div>
                <div className="t-mono text-dim" style={{ fontSize: 11 }}>#FF3355</div>
              </div>
            </div>
            <div className="panel bevel glow-blue" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Ship style="ftl" team={1} damage={0} pixel={3} />
              <div>
                <div className="t-title glow-text-blue" style={{ fontSize: 10 }}>TEAM 1 · ELECTRIC</div>
                <div className="t-mono text-dim" style={{ fontSize: 11 }}>#00AAFF</div>
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

function DSTypeBoard() {
  return (
    <div style={bgScreen({ padding: 24 })}>
      <ScreenChrome scanlines="subtle">
        <div style={{ position: 'relative', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 13, marginBottom: 6 }}>
              ◢ TYPOGRAPHY · 3 FACES
            </div>
            <div className="t-body text-dim" style={{ fontSize: 12 }}>
              Press Start 2P for titles & UI labels. VT323 for readouts and numerics. Nunito for prose.
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 18 }}>
            <div className="t-mono text-dim" style={{ fontSize: 12, marginBottom: 4 }}>PRESS START 2P · titles · 8/10/12/18/28px</div>
            <div className="t-title" style={{ fontSize: 28, color: 'var(--ink)' }}>UNDER PRESSURE</div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 18, marginTop: 8 }}>SECTOR-7G</div>
            <div className="t-title text-dim" style={{ fontSize: 12, marginTop: 6 }}>▶ TRANSMITTER · CALIBRATE · WATCH</div>
            <div className="t-title text-dim" style={{ fontSize: 8, marginTop: 6 }}>ROOM CODE · ROUNDS · TIMER · DAMAGE</div>
          </div>

          <div className="panel bevel" style={{ padding: 18 }}>
            <div className="t-mono text-dim" style={{ fontSize: 12, marginBottom: 4 }}>VT323 · readouts · 14/16/22/28/40px</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
              <div className="t-read glow-text-amber" style={{ fontSize: 40 }}>73</div>
              <div className="t-read glow-text-cyan" style={{ fontSize: 28 }}>NX7-42K</div>
              <div className="t-read glow-text-mint" style={{ fontSize: 22 }}>+5 PTS</div>
              <div className="t-read text-dim" style={{ fontSize: 16 }}>03/07 · 45s</div>
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 18 }}>
            <div className="t-mono text-dim" style={{ fontSize: 12, marginBottom: 4 }}>NUNITO · body · 11/12/14/16px</div>
            <div className="t-body" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Calibre o painel antes que o casco ceda.
            </div>
            <div className="t-body text-dim" style={{ fontSize: 13 }}>
              Duas tripulações rivais. Um único painel de pressão instável. Você lê uma única palavra
              do transmissor e arrasta o ponteiro até onde a frequência cai.
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

function DSComponentsBoard() {
  const [val, setVal] = useDS(58);
  return (
    <div style={bgScreen({ padding: 24 })}>
      <ScreenChrome scanlines="subtle">
        <div style={{ position: 'relative', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 13, marginBottom: 6 }}>
              ◢ COMPONENT KIT · BUTTONS, INPUTS, BADGES
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 16 }}>
            <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 12 }}>▸ BUTTONS · min 48px touch</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button className="btn btn-primary">▶ PRIMARY</button>
              <button className="btn btn-primary btn-pulse">PULSE</button>
              <button className="btn btn-danger">DANGER</button>
              <button className="btn btn-team-0">TEAM 0</button>
              <button className="btn btn-team-1">TEAM 1</button>
              <button className="btn">GHOST</button>
              <button className="btn btn-ghost btn-icon">⚙</button>
              <button className="btn" disabled>DISABLED</button>
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 16 }}>
            <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 12 }}>▸ INPUTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="input" defaultValue="CLEO V." placeholder="NAME" />
              <input className="input" defaultValue="ÁTOMO" placeholder="CLUE" />
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 16 }}>
            <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 12 }}>▸ BADGES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-you">YOU</span>
              <span className="badge badge-captain">👑 CAPTAIN</span>
              <span className="badge badge-team-0">TEAM 0</span>
              <span className="badge badge-team-1">TEAM 1</span>
              <Avatar name="Nova Aldrin" color="#ff3355" size={36} ring />
              <Avatar name="Léo O" color="#00aaff" size={36} ring />
              <Avatar name="Cleo V" color="#ff6a8a" size={36} />
            </div>
          </div>

          <div className="panel bevel" style={{ padding: 16 }}>
            <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 12 }}>▸ HP BAR · SCANLINE PANEL · INTERACTIVE GAUGE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 180 }}>
                {[100, 75, 50, 25, 0].map(hp => (
                  <div key={hp}>
                    <div className="t-mono text-dim" style={{ fontSize: 11, marginBottom: 3 }}>HP {hp}/100</div>
                    <div className="hpbar" style={{ borderColor: 'var(--neon-coral)' }}>
                      <div className="hpbar-fill" style={{
                        width: hp + '%',
                        background: 'linear-gradient(90deg, var(--neon-coral), var(--neon-coral))',
                        boxShadow: '0 0 10px var(--neon-coral)',
                      }}>
                        <div className="hpbar-cells" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PressureGauge value={val} onChange={setVal} interactive size={260} label="DEMO" />
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

function DSShipBoard() {
  const states = [
    { dmg: 0, name: 'INTACT',   note: '100-80 HP' },
    { dmg: 1, name: 'SMOKING',  note: '80-50 HP' },
    { dmg: 2, name: 'ON FIRE',  note: '50-25 HP' },
    { dmg: 3, name: 'CRITICAL', note: '25-1 HP' },
    { dmg: 4, name: 'EXPLODED', note: '0 HP' },
  ];
  return (
    <div style={bgScreen({ padding: 24 })}>
      <ScreenChrome scanlines="subtle">
        <div style={{ position: 'relative', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 13, marginBottom: 6 }}>
              ◢ SHIP · 3 STYLES × 5 DAMAGE STATES
            </div>
            <div className="t-body text-dim" style={{ fontSize: 12 }}>
              Same sprite re-shaded with smoke, fire, hull-breach and explosion overlays. Drives every HP bar.
            </div>
          </div>
          {['ftl', 'rebel', 'cute'].map(style => (
            <div key={style} className="panel bevel" style={{ padding: 16 }}>
              <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 12 }}>
                ▸ STYLE · {style.toUpperCase()}
                {style === 'ftl' && ' · FTL CRUISER'}
                {style === 'rebel' && ' · REBEL FIGHTER'}
                {style === 'cute' && ' · PLANET EXPRESS'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {states.map(st => (
                  <div key={st.dmg} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ height: style === 'rebel' ? 80 : 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ship style={style} team={0} damage={st.dmg} pixel={4} />
                    </div>
                    <div className="t-title text-dim" style={{ fontSize: 6 }}>{st.name}</div>
                    <div className="t-mono text-faded" style={{ fontSize: 10 }}>{st.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScreenChrome>
    </div>
  );
}

function DSShipRosterBoard() {
  return (
    <div style={bgScreen({ padding: 24 })}>
      <ScreenChrome scanlines="subtle">
        <div style={{ position: 'relative', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          <div>
            <div className="t-title glow-text-cyan" style={{ fontSize: 13, marginBottom: 6 }}>
              ◢ SHIP ROSTER · 10 PIXEL HULLS
            </div>
            <div className="t-body text-dim" style={{ fontSize: 12 }}>
              Each player picks one ship + one color in the lobby. 16-bit sprites, 20×16 grid.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flex: 1 }}>
            {SHIP_IDS.map((s, i) => {
              const color = SHIP_COLORS[i % SHIP_COLORS.length];
              return (
                <div key={s} className="panel bevel" style={{
                  padding: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8, justifyContent: 'flex-end',
                  background: 'linear-gradient(180deg, #0c0e26, #060818)',
                }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
                    <ShipIcon ship={s} color={color} pixel={3} />
                  </div>
                  <div className="t-title glow-text-cyan" style={{ fontSize: 8 }}>{SHIP_LABELS.en[s]?.toUpperCase()}</div>
                  <div className="t-mono text-dim" style={{ fontSize: 10 }}>{color}</div>
                </div>
              );
            })}
          </div>
          <div className="panel bevel" style={{ padding: 14 }}>
            <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 10 }}>▸ DAMAGE STATES (per ship)</div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-around' }}>
              {[0,1,2,3,4].map(d => (
                <div key={d} style={{ textAlign: 'center' }}>
                  <ShipIcon ship="cruiser" color="red" damage={d} pixel={3} />
                  <div className="t-mono text-dim" style={{ fontSize: 10, marginTop: 6 }}>
                    {['INTACT','SMOKE','FIRE','CRIT','BOOM'][d]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScreenChrome>
    </div>
  );
}

Object.assign(window, { DSColorsBoard, DSTypeBoard, DSComponentsBoard, DSShipBoard, DSShipRosterBoard });
