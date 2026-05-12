import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';

export default function HomeScreen({ lang, setLang, onCreate, onJoin }) {
  const [mode, setMode]   = useState(null); // null | 'create' | 'join'
  const [name, setName]   = useState('');
  const [code, setCode]   = useState('');
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState('');

  const go = async () => {
    if (!name.trim()) { setErr(lang==='pt'?'Digite seu nome!':'Enter your name!'); return; }
    setBusy(true); setErr('');
    try {
      if (mode === 'create') { playJoin(); await onCreate(name.trim()); }
      else {
        if (code.length < 4) { setErr(lang==='pt'?'Código inválido!':'Invalid code!'); setBusy(false); return; }
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
      padding: '24px 16px', gap: 0,
    }}>

      {/* Language toggle */}
      <div style={{ position:'fixed', top:16, right:16, display:'flex', gap:6, zIndex:10 }}>
        {['pt','en'].map(l => (
          <button key={l} className={`btn btn-sm ${lang===l?'btn-cyan':'btn-ghost'}`}
            onClick={() => { playClick(); setLang(l); }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* Hero */}
      <div style={{ textAlign:'center', marginBottom:36 }}>
        {/* Two ships flanking logo */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          gap: 24, marginBottom: 20,
        }}>
          <ShipLeft />
          <LogoMark />
          <ShipRight />
        </div>

        <h1 style={{
          fontFamily:'var(--f-pixel)', fontSize:'clamp(15px,4vw,22px)',
          letterSpacing: '0.12em', lineHeight: 1.6,
          color:'var(--neon-cyan)',
          textShadow:'0 0 16px rgba(0,255,255,.7), 0 0 48px rgba(0,255,255,.3)',
        }}>
          UNDER<br/>PRESSURE
        </h1>

        <div style={{
          fontFamily:'var(--f-vt)', fontSize: 20,
          color:'var(--ink-dim)', letterSpacing: 4, marginTop: 10,
        }}>
          {t('subtitle', lang)}
        </div>
      </div>

      {/* Card */}
      <div className="panel bevel" style={{
        width:'100%', maxWidth:440,
        padding: 28,
        display:'flex', flexDirection:'column', gap: 20,
        background:'linear-gradient(180deg,#0d0f28 0%,#08091c 100%)',
      }}>

        {/* Name input */}
        <div>
          <div className="label mb-8" style={{ color:'var(--ink-dim)' }}>{t('playerName', lang)}</div>
          <input
            className="pixel-input"
            value={name}
            onChange={e => setName(e.target.value.slice(0,20))}
            placeholder={t('playerNamePh', lang)}
            maxLength={20}
            disabled={busy}
            onKeyDown={e => { if(e.key==='Enter' && mode) go(); }}
            autoFocus
            style={{ fontSize: 16 }}
          />
        </div>

        {/* Mode selector */}
        {mode === null && (
          <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={() => { playClick(); setMode('create'); }}
              style={{ fontSize:11, letterSpacing:2 }}
            >
              🚀 {t('create', lang)}
            </button>
            <button
              className="btn btn-magenta btn-lg btn-full"
              onClick={() => { playClick(); setMode('join'); }}
              style={{ fontSize:11, letterSpacing:2 }}
            >
              📡 {t('join', lang)}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={go}
              disabled={!name.trim()||busy}
              style={{ fontSize:11, letterSpacing:2 }}
            >
              🚀 {busy ? '...' : t('create', lang)}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => { playClick(); setMode(null); }}>
              ← {lang==='pt'?'Voltar':'Back'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div className="label mb-8" style={{ color:'var(--ink-dim)' }}>{t('roomCode', lang)}</div>
              <input
                className="pixel-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))}
                placeholder="ABCD"
                maxLength={4}
                disabled={busy}
                onKeyDown={e => { if(e.key==='Enter') go(); }}
                style={{ textAlign:'center', fontSize:28, letterSpacing:10, fontFamily:'var(--f-vt)' }}
              />
            </div>
            <button
              className="btn btn-magenta btn-lg btn-full"
              onClick={go}
              disabled={!name.trim()||code.length<4||busy}
              style={{ fontSize:11, letterSpacing:2 }}
            >
              📡 {busy ? '...' : t('join', lang)}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => { playClick(); setMode(null); }}>
              ← {lang==='pt'?'Voltar':'Back'}
            </button>
          </div>
        )}

        {err && (
          <div style={{
            fontFamily:'var(--f-pixel)', fontSize:8, color:'var(--neon-coral)',
            textAlign:'center', letterSpacing:1, lineHeight:2,
          }}>
            ⚠ {err}
          </div>
        )}
      </div>

      <p style={{
        marginTop: 32,
        fontFamily:'var(--f-pixel)', fontSize:6,
        color:'var(--ink-faint)', letterSpacing:2,
        textAlign:'center', lineHeight:2,
      }}>
        © 2025 UNDER PRESSURE — TODOS OS HUMANOS
      </p>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 20 20" style={{ imageRendering:'pixelated', filter:'drop-shadow(0 0 8px rgba(0,255,255,.7))' }}>
      {/* Pressure gauge icon */}
      <rect x="3" y="9" width="14" height="8" rx="1" fill="#0d0f28" stroke="#00ffff" strokeWidth="1"/>
      <rect x="1" y="9" width="2" height="8" fill="#003a3a"/>
      <rect x="17" y="9" width="2" height="8" fill="#003a3a"/>
      {/* Zone arcs top */}
      <rect x="4" y="8" width="3" height="2" fill="#ff3355"/>
      <rect x="7" y="7" width="3" height="2" fill="#ffe000"/>
      <rect x="10" y="7" width="3" height="2" fill="#00ff88"/>
      <rect x="13" y="8" width="3" height="2" fill="#00ffff"/>
      {/* Needle */}
      <rect x="10" y="9" width="1" height="5" fill="#ffffff"/>
      <rect x="10" y="14" width="1" height="1" fill="#ffe000"/>
      {/* Ship silhouette above */}
      <rect x="9" y="2" width="2" height="2" fill="#00ffff"/>
      <rect x="8" y="4" width="4" height="2" fill="#00ccff"/>
      <rect x="7" y="6" width="6" height="2" fill="#0099ff"/>
      <rect x="6" y="7" width="2" height="1" fill="#0066cc"/>
      <rect x="12" y="7" width="2" height="1" fill="#0066cc"/>
    </svg>
  );
}

function ShipLeft() {
  return (
    <svg width="44" height="36" viewBox="0 0 16 12" style={{ imageRendering:'pixelated', transform:'scaleX(-1)', filter:'drop-shadow(0 0 6px rgba(0,170,255,.6))' }}>
      <rect x="7" y="0" width="2" height="1" fill="#7ed0ff"/>
      <rect x="6" y="1" width="4" height="2" fill="#2a82d4"/>
      <rect x="5" y="3" width="6" height="2" fill="#2a82d4"/>
      <rect x="4" y="5" width="8" height="2" fill="#0e3a6e"/>
      <rect x="2" y="4" width="3" height="2" fill="#0e3a6e"/>
      <rect x="11" y="4" width="3" height="2" fill="#0e3a6e"/>
      <rect x="1" y="6" width="2" height="1" fill="#04101c"/>
      <rect x="13" y="6" width="2" height="1" fill="#04101c"/>
      <rect x="6" y="7" width="4" height="2" fill="#ffd54a"/>
      <rect x="7" y="9" width="2" height="2" fill="#ffd54a"/>
      <rect x="7" y="11" width="2" height="1" fill="#ff8800" opacity="0.7"/>
    </svg>
  );
}

function ShipRight() {
  return (
    <svg width="44" height="36" viewBox="0 0 16 12" style={{ imageRendering:'pixelated', filter:'drop-shadow(0 0 6px rgba(176,102,255,.6))' }}>
      <rect x="7" y="0" width="2" height="1" fill="#dca8ff"/>
      <rect x="6" y="1" width="4" height="2" fill="#a64aff"/>
      <rect x="5" y="3" width="6" height="2" fill="#a64aff"/>
      <rect x="4" y="5" width="8" height="2" fill="#5a1c9a"/>
      <rect x="2" y="4" width="3" height="2" fill="#5a1c9a"/>
      <rect x="11" y="4" width="3" height="2" fill="#5a1c9a"/>
      <rect x="1" y="6" width="2" height="1" fill="#150826"/>
      <rect x="13" y="6" width="2" height="1" fill="#150826"/>
      <rect x="6" y="7" width="4" height="2" fill="#00e5ff"/>
      <rect x="7" y="9" width="2" height="2" fill="#00e5ff"/>
      <rect x="7" y="11" width="2" height="1" fill="#ff66cc" opacity="0.7"/>
    </svg>
  );
}
