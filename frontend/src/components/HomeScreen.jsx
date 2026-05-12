import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';
import { ShipIcon } from './ShipRoster.jsx';

export default function HomeScreen({ lang, setLang, onCreate, onJoin }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  const go = async () => {
    if (!name.trim()) { setErr(lang === 'pt' ? 'Digite seu nome!' : 'Enter your name!'); return; }
    setBusy(true); setErr('');
    try {
      if (mode === 'create') { playJoin(); await onCreate(name.trim()); }
      else {
        if (code.length < 4) { setErr(lang === 'pt' ? 'Código inválido!' : 'Invalid code!'); setBusy(false); return; }
        playJoin(); await onJoin(code.trim(), name.trim());
      }
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Language toggle — top right */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 10 }}>
        {['pt', 'en'].map(l => (
          <button key={l} className={`btn btn-sm ${lang === l ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => { playClick(); setLang(l); }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Logo ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {/* Two ships side by side — exactly like the design */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
          <ShipIcon ship="cruiser" color="red"    pixel={4} />
          <ShipIcon ship="cruiser" color="blue"   pixel={4} />
        </div>

        <h1 className="t-title glow-text-cyan" style={{
          fontSize: 'clamp(16px,5vw,28px)',
          lineHeight: 1.3,
          animation: 'flicker 4s steps(8,end) infinite',
        }}>
          UNDER<br/>PRESSURE
        </h1>

        <div className="t-title text-dim" style={{ fontSize: 'clamp(7px,1.8vw,9px)', letterSpacing: '0.18em', marginTop: 12 }}>
          {lang === 'pt' ? 'PARTY GAME · ESPAÇO PROFUNDO' : 'PARTY GAME · DEEP SPACE'}
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="panel bevel" style={{
        width: '100%', maxWidth: 400,
        padding: 28,
        display: 'flex', flexDirection: 'column', gap: 20,
        background: 'linear-gradient(180deg,#0d0f28 0%,#08091c 100%)',
        borderColor: 'rgba(0,255,255,0.25)',
      }}>

        {/* Name */}
        <div>
          <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>{t('playerName', lang)}</div>
          <input
            className="pixel-input"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder={t('playerNamePh', lang)}
            maxLength={20}
            disabled={busy}
            onKeyDown={e => { if (e.key === 'Enter' && mode) go(); }}
            autoFocus
          />
        </div>

        {/* Mode select */}
        {mode === null && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-cyan btn-lg"
              onClick={() => { playClick(); setMode('create'); }}
              style={{ flex: 1, fontSize: 10 }}
            >
              🚀 {lang === 'pt' ? 'CRIAR' : 'CREATE'}
            </button>
            <button
              className="btn btn-yellow btn-lg"
              onClick={() => { playClick(); setMode('join'); }}
              style={{ flex: 1, fontSize: 10 }}
            >
              📡 {lang === 'pt' ? 'EMBARCAR' : 'JOIN'}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={go}
              disabled={!name.trim() || busy}
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              🚀 {busy ? '...' : (lang === 'pt' ? 'CRIAR SALA' : 'CREATE ROOM')}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => { playClick(); setMode(null); }}>
              ← {lang === 'pt' ? 'Voltar' : 'Back'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>{t('roomCode', lang)}</div>
              <input
                className="pixel-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                placeholder="ABCD"
                maxLength={4}
                disabled={busy}
                onKeyDown={e => { if (e.key === 'Enter') go(); }}
                style={{ textAlign: 'center', fontSize: 32, letterSpacing: 12, fontFamily: 'var(--f-vt)' }}
              />
            </div>
            <button
              className="btn btn-yellow btn-lg btn-full"
              onClick={go}
              disabled={!name.trim() || code.length < 4 || busy}
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              📡 {busy ? '...' : (lang === 'pt' ? 'EMBARCAR' : 'JOIN ROOM')}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => { playClick(); setMode(null); }}>
              ← {lang === 'pt' ? 'Voltar' : 'Back'}
            </button>
          </div>
        )}

        {err && (
          <div style={{
            fontFamily: 'var(--f-pixel)', fontSize: 8,
            color: 'var(--neon-coral)', textAlign: 'center',
            letterSpacing: 1, lineHeight: 2,
          }}>
            ⚠ {err}
          </div>
        )}
      </div>

      <p style={{
        marginTop: 28,
        fontFamily: 'var(--f-pixel)', fontSize: 6,
        color: 'var(--ink-faint)', letterSpacing: 2,
        textAlign: 'center', lineHeight: 2,
      }}>
        © 2025 UNDER PRESSURE
      </p>
    </div>
  );
}
