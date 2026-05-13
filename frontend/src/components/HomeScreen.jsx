import React, { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

function PixelLogo() {
  return (
    <div className="home-logo">
      <div className="home-logo__ships">
        <ShipIcon ship="nova_03" color="red" pixel={5} glow damage={1} />
        <ShipIcon ship="nova_08" color="blue" pixel={5} glow damage={2} />
      </div>
      <div className="home-logo__title t-title glow-text-cyan flicker">
        UNDER
        <br />
        <span className="glow-text-amber">PRESSURE</span>
      </div>
    </div>
  );
}

export default function HomeScreen({ lang, setLang, onCreate, onJoin, inviteCode = '' }) {
  const [mode, setMode] = useState(() => (inviteCode ? 'join' : null));
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode);
  const [ship, setShip] = useState(() => localStorage.getItem('up_ship') || 'nova_01');
  const [shipColor, setShipColor] = useState(() => localStorage.getItem('up_ship_color') || 'blue');
  const [shipAccent, setShipAccent] = useState(() => localStorage.getItem('up_ship_accent') || 'cyan');
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
        await onCreate(name.trim(), { ship, shipColor, shipAccent });
      } else {
        if (code.length < 4) {
          setErr(lang === 'pt' ? 'Codigo invalido.' : 'Invalid code.');
          setBusy(false);
          return;
        }
        playJoin();
        await onJoin(code.trim(), name.trim(), { ship, shipColor, shipAccent });
      }
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  };

  return (
    <div className="screen home-screen">
      {pickerOpen && (
        <ShipPicker
          currentShip={ship}
          currentColor={shipColor}
          currentAccent={shipAccent}
          lang={lang}
          onConfirm={(nextShip, nextColor, nextAccent) => {
            setShip(nextShip);
            setShipColor(nextColor);
            setShipAccent(nextAccent);
            localStorage.setItem('up_ship', nextShip);
            localStorage.setItem('up_ship_color', nextColor);
            localStorage.setItem('up_ship_accent', nextAccent);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="home-grid-overlay" />

      <div className="home-center">
        <div className="home-main-stack">
          <PixelLogo />

          <div className="home-card panel bevel glow-cyan">
            {inviteCode && (
              <div className="t-mono glow-text-amber" style={{ fontSize: 14 }}>
                {inviteCode}
              </div>
            )}

            <div>
              <label className="home-field-label t-title text-dim">
                {lang === 'pt' ? 'PILOTO' : 'PILOT'}
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
              className="home-ship-trigger panel bevel"
              onClick={() => {
                playClick();
                setPickerOpen(true);
              }}
            >
              <ShipIcon ship={ship} color={shipColor} accent={shipAccent} pixel={3} glow />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="home-mini-label t-title text-dim">
                  {lang === 'pt' ? 'SUA NAVE' : 'YOUR SHIP'}
                </div>
                <div className="home-ship-trigger__action t-title glow-text-cyan">
                  {lang === 'pt' ? 'MUDAR NAVE' : 'CHANGE SHIP'}
                </div>
              </div>
            </button>

            {mode === null && (
              <div className="home-action-grid">
                <button className="btn btn-primary" onClick={() => { playClick(); setMode('create'); }}>
                  {lang === 'pt' ? 'CRIAR' : 'CREATE'}
                </button>
                <button className="btn btn-yellow" onClick={() => { playClick(); setMode('join'); }}>
                  {lang === 'pt' ? 'ENTRAR' : 'JOIN'}
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="home-action-stack">
                <button className="btn btn-primary" onClick={go} disabled={!name.trim() || busy}>
                  {busy ? '...' : lang === 'pt' ? 'CRIAR SALA' : 'CREATE ROOM'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => { playClick(); setMode(inviteCode ? 'join' : null); }}>
                  {lang === 'pt' ? 'VOLTAR' : 'BACK'}
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div className="home-action-stack">
                <div>
                  <label className="home-field-label t-title text-dim">
                    {lang === 'pt' ? 'SALA' : 'ROOM'}
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

            <div className="home-language-wrap">
              <div className="home-language-switcher panel">
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

          <div className="home-top-status">
            <span>v1.0 // ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
