import React, { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

function PixelLogo({ lang }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <ShipIcon ship="nova_03" color="red" pixel={5} glow damage={1} />
        <ShipIcon ship="nova_08" color="blue" pixel={5} glow damage={2} />
      </div>
      <div className="t-title glow-text-cyan flicker" style={{
        fontSize: 'clamp(26px, 7vw, 48px)',
        textAlign: 'center',
        lineHeight: 1.08,
        textShadow: '0 0 12px rgba(0,255,255,.6), 0 0 28px rgba(0,255,255,.35), 0 4px 0 #000',
      }}>
        UNDER<br />
        <span className="glow-text-amber">PRESSURE</span>
      </div>
      <div className="t-title text-dim" style={{ fontSize: 8, letterSpacing: '.18em' }}>SECTOR-7G</div>
    </div>
  );
}

export default function HomeScreen({ lang, setLang, onCreate, onJoin, inviteCode = '' }) {
  const [mode, setMode] = useState(() => (inviteCode ? 'join' : null));
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode);
  const [ship, setShip] = useState(() => localStorage.getItem('up_ship') || 'nova_01');
  const [shipColor, setShipColor] = useState(() => localStorage.getItem('up_ship_color') || 'blue');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!inviteCode) return;
    setCode(inviteCode);
    setMode((current) => current ?? 'join');
  }, [inviteCode]);

  const go = async () => {
    if (!name.trim()) {
      setErr(lang === 'pt' ? 'Digite seu nome.' : 'Enter your name.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      if (mode === 'create') {
        playJoin();
        await onCreate(name.trim(), { ship, shipColor });
      } else {
        if (code.length < 4) {
          setErr(lang === 'pt' ? 'Codigo invalido.' : 'Invalid code.');
          setBusy(false);
          return;
        }
        playJoin();
        await onJoin(code.trim(), name.trim(), { ship, shipColor });
      }
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  };

  return (
    <div className="screen" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {pickerOpen && (
        <ShipPicker
          currentShip={ship}
          currentColor={shipColor}
          lang={lang}
          onConfirm={(nextShip, nextColor) => {
            setShip(nextShip);
            setShipColor(nextColor);
            localStorage.setItem('up_ship', nextShip);
            localStorage.setItem('up_ship_color', nextColor);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,.055) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 78%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute',
        top: 14,
        left: 0,
        right: 0,
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        fontFamily: 'var(--f-read)',
        color: 'var(--ink-dim)',
        fontSize: 14,
      }}>
        <span className="glow-text-cyan">▌SECTOR-7G</span>
        <span>v1.0 // ONLINE</span>
        <span className="glow-text-mint">12 NAVES</span>
      </div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '64px 18px 24px',
      }}>
        <PixelLogo lang={lang} />

        <div className="panel bevel glow-cyan" style={{
          width: 'min(430px, 100%)',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          background: 'linear-gradient(180deg, rgba(13,15,40,.96), rgba(7,8,24,.96))',
        }}>
          {inviteCode && (
            <div className="t-mono glow-text-amber" style={{ fontSize: 14 }}>
              {inviteCode}
            </div>
          )}

          <div>
            <label className="t-title text-dim" style={{ display: 'block', fontSize: 8, marginBottom: 6 }}>
              PILOT ▸
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder={t('playerNamePh', lang)}
              maxLength={20}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode) go();
              }}
              autoFocus
            />
          </div>

          <button
            className="panel bevel"
            onClick={() => {
              playClick();
              setPickerOpen(true);
            }}
            style={{
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              textAlign: 'left',
              background: 'rgba(255,255,255,.025)',
              borderColor: 'var(--metal-2)',
            }}
          >
            <ShipIcon ship={ship} color={shipColor} pixel={3} glow />
            <div style={{ flex: 1 }}>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
                {lang === 'pt' ? 'SUA NAVE' : 'YOUR SHIP'}
              </div>
              <div className="t-title glow-text-cyan" style={{ fontSize: 9 }}>
                {lang === 'pt' ? 'MUDAR NAVE' : 'CHANGE SHIP'}
              </div>
            </div>
          </button>

          {mode === null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn btn-primary btn-pulse" onClick={() => { playClick(); setMode('create'); }}>
                {lang === 'pt' ? 'CRIAR' : 'CREATE'}
              </button>
              <button className="btn btn-yellow" onClick={() => { playClick(); setMode('join'); }}>
                {lang === 'pt' ? 'ENTRAR' : 'JOIN'}
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary btn-pulse" onClick={go} disabled={!name.trim() || busy}>
                {busy ? '...' : lang === 'pt' ? 'CRIAR SALA' : 'CREATE ROOM'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { playClick(); setMode(inviteCode ? 'join' : null); }}>
                {lang === 'pt' ? 'VOLTAR' : 'BACK'}
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="t-title text-dim" style={{ display: 'block', fontSize: 8, marginBottom: 6 }}>
                  ROOM ▸
                </label>
                <input
                  className="input code-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  placeholder="ABCD"
                  maxLength={4}
                  disabled={busy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') go();
                  }}
                />
              </div>
              <button className="btn btn-yellow" onClick={go} disabled={!name.trim() || code.length < 4 || busy}>
                {busy ? '...' : lang === 'pt' ? 'ENTRAR NA SALA' : 'JOIN ROOM'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                playClick();
                setMode(null);
              }}>
                {lang === 'pt' ? 'VOLTAR' : 'BACK'}
              </button>
            </div>
          )}

          {err && <div className="home-error">{err}</div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel" style={{ display: 'flex', padding: 3, gap: 2, borderRadius: 4 }}>
              {['pt', 'en'].map((languageCode) => (
                <button
                  key={languageCode}
                  className={`btn ${lang === languageCode ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    playClick();
                    setLang(languageCode);
                  }}
                  style={{ minHeight: 32, padding: '6px 12px', fontSize: 9, borderRadius: 2 }}
                >
                  {languageCode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
