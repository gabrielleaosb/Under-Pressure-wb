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
    <div className="screen" style={{ justifyContent:'center', minHeight:'100vh', padding:'20px 16px', gap:0 }}>

      {/* Language toggle */}
      <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:6 }}>
        {['pt','en'].map(l => (
          <button key={l} className={`btn btn-sm ${lang===l?'btn-cyan':'btn-ghost'}`}
            onClick={() => { playClick(); setLang(l); }}>{l.toUpperCase()}</button>
        ))}
      </div>

      {/* Logo */}
      <div className="text-center" style={{ marginBottom:32 }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <PixelShip />
        </div>
        <h1 className="pixel-title" style={{
          fontSize:'clamp(14px,5vw,26px)',
          color:'var(--cyan)',
          textShadow:'0 0 20px var(--cyan), 0 0 50px var(--cyan)',
          lineHeight:2,
        }}>
          UNDER<br/>PRESSURE
        </h1>
        <p style={{ fontFamily:'var(--f-vt)', fontSize:22, color:'var(--dim2)', letterSpacing:3, marginTop:8 }}>
          {t('subtitle', lang)}
        </p>
      </div>

      {/* Panel */}
      <div className="pixel-box" style={{ width:'100%', maxWidth:460, padding:28, display:'flex', flexDirection:'column', gap:20 }}>

        {/* Name input */}
        <div>
          <div className="label mb-8" style={{ color:'var(--dim2)' }}>{t('playerName', lang)}</div>
          <input
            className="pixel-input"
            value={name}
            onChange={e => setName(e.target.value.slice(0,20))}
            placeholder={t('playerNamePh', lang)}
            maxLength={20}
            disabled={busy}
            onKeyDown={e => { if(e.key==='Enter' && mode) go(); }}
            autoFocus
          />
        </div>

        {/* Mode selector */}
        {mode === null && (
          <div style={{ display:'flex', gap:12, flexDirection:'column' }}>
            <button className="btn btn-cyan btn-lg btn-full" onClick={() => { playClick(); setMode('create'); }}>
              🚀 {t('create', lang)}
            </button>
            <button className="btn btn-magenta btn-lg btn-full" onClick={() => { playClick(); setMode('join'); }}>
              📡 {t('join', lang)}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <button className="btn btn-cyan btn-lg btn-full" onClick={go} disabled={!name.trim()||busy}>
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
              <div className="label mb-8" style={{ color:'var(--dim2)' }}>{t('roomCode', lang)}</div>
              <input
                className="pixel-input code-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4))}
                placeholder="ABCD"
                maxLength={4}
                disabled={busy}
                onKeyDown={e => { if(e.key==='Enter') go(); }}
              />
            </div>
            <button className="btn btn-magenta btn-lg btn-full" onClick={go} disabled={!name.trim()||code.length<4||busy}>
              📡 {busy ? '...' : t('join', lang)}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => { playClick(); setMode(null); }}>
              ← {lang==='pt'?'Voltar':'Back'}
            </button>
          </div>
        )}

        {err && (
          <div style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--red)', textAlign:'center', fontWeight:700 }}>
            {err}
          </div>
        )}
      </div>

      <p style={{ marginTop:28, fontFamily:'var(--f-pixel)', fontSize:6, color:'var(--dim)', letterSpacing:2, textAlign:'center', lineHeight:2 }}>
        © 2025 UNDER PRESSURE — ALL HUMANS
      </p>
    </div>
  );
}

function PixelShip() {
  return (
    <svg width="80" height="80" viewBox="0 0 16 16" style={{ imageRendering:'pixelated' }}>
      <rect x="7" y="1" width="2" height="2" fill="#00ffff"/>
      <rect x="6" y="3" width="4" height="2" fill="#00ffff"/>
      <rect x="5" y="5" width="6" height="3" fill="#00ccff"/>
      <rect x="4" y="8" width="8" height="2" fill="#0099ff"/>
      <rect x="2" y="7" width="3" height="2" fill="#0066cc"/>
      <rect x="11" y="7" width="3" height="2" fill="#0066cc"/>
      <rect x="1" y="9" width="2" height="1" fill="#004499"/>
      <rect x="13" y="9" width="2" height="1" fill="#004499"/>
      <rect x="7" y="3" width="2" height="2" fill="#88ffff"/>
      <rect x="6" y="10" width="4" height="2" fill="#ff8800"/>
      <rect x="7" y="12" width="2" height="2" fill="#ffff00"/>
      <rect x="7" y="14" width="2" height="1" fill="#ff4400" opacity="0.7"/>
    </svg>
  );
}
