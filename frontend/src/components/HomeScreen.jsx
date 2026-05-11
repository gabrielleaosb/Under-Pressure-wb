import React, { useState } from 'react';
import { t } from '../i18n.js';

export default function HomeScreen({ lang, setLang, send, connStatus }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    send('create_room', { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || code.length < 4) return;
    send('join_room', { playerName: name.trim(), roomCode: code.trim().toUpperCase() });
  };

  const isConnected = connStatus === 'connected';

  return (
    <div className="screen" style={{ justifyContent: 'center', minHeight: '100vh', padding: '20px 16px', gap: 0 }}>

      {/* Language toggle */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
        {['pt', 'en'].map(l => (
          <button
            key={l}
            className={`btn btn-sm ${lang === l ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => setLang(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Logo */}
      <div className="text-center" style={{ marginBottom: 32 }}>
        {/* Pixel art ship logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <PixelShipLogo />
        </div>
        <h1
          className="pixel-title"
          style={{ fontSize: 'clamp(12px, 4vw, 22px)', color: 'var(--cyan)', textShadow: '0 0 20px var(--cyan), 0 0 40px var(--cyan)' }}
        >
          {t('title', lang)}
        </h1>
        <p style={{
          fontFamily: 'var(--f-vt)', fontSize: 22, color: 'var(--dim)',
          letterSpacing: 3, marginTop: 8,
        }}>
          {t('subtitle', lang)}
        </p>
      </div>

      {/* Main panel */}
      <div className="pixel-box" style={{ width: '100%', maxWidth: 480, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Name input — always visible */}
        <div>
          <label className="pixel-title" style={{ fontSize: 8, color: 'var(--dim)', display: 'block', marginBottom: 8 }}>
            {t('playerName', lang)}
          </label>
          <input
            className="pixel-input"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder={t('playerNamePh', lang)}
            maxLength={20}
            onKeyDown={e => { if (e.key === 'Enter' && mode) { mode === 'create' ? handleCreate() : handleJoin(); } }}
          />
        </div>

        {mode === null && (
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={() => setMode('create')}
              disabled={!isConnected}
            >
              🚀 {t('create', lang)}
            </button>
            <button
              className="btn btn-magenta btn-lg btn-full"
              onClick={() => setMode('join')}
              disabled={!isConnected}
            >
              📡 {t('join', lang)}
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={handleCreate}
              disabled={!name.trim() || !isConnected}
            >
              🚀 {t('create', lang)}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => setMode(null)}>
              ← {lang === 'pt' ? 'Voltar' : 'Back'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="pixel-title" style={{ fontSize: 8, color: 'var(--dim)', display: 'block', marginBottom: 8 }}>
                {t('roomCode', lang)}
              </label>
              <input
                className="pixel-input code-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                placeholder={t('roomCodePh', lang)}
                maxLength={4}
                onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
              />
            </div>
            <button
              className="btn btn-magenta btn-lg btn-full"
              onClick={handleJoin}
              disabled={!name.trim() || code.length < 4 || !isConnected}
            >
              📡 {t('join', lang)}
            </button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => setMode(null)}>
              ← {lang === 'pt' ? 'Voltar' : 'Back'}
            </button>
          </div>
        )}

        {!isConnected && (
          <p style={{ fontFamily: 'var(--f-vt)', fontSize: 20, color: 'var(--orange)', textAlign: 'center', letterSpacing: 2 }}>
            ⚡ {t('connecting', lang)}
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={{ marginTop: 28, fontFamily: 'var(--f-pixel)', fontSize: 6, color: 'var(--dim)', letterSpacing: 2, textAlign: 'center' }}>
        © 2025 SPACE PRESSURE — ALL HUMANS, NO AI
      </p>
    </div>
  );
}

function PixelShipLogo() {
  return (
    <svg width="80" height="80" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      {/* Ship body */}
      <rect x="7" y="1" width="2" height="2" fill="#00ffff" />
      <rect x="6" y="3" width="4" height="2" fill="#00ffff" />
      <rect x="5" y="5" width="6" height="3" fill="#00ccff" />
      <rect x="4" y="8" width="8" height="2" fill="#0099ff" />
      {/* Wings */}
      <rect x="2" y="7" width="3" height="2" fill="#0066cc" />
      <rect x="11" y="7" width="3" height="2" fill="#0066cc" />
      <rect x="1" y="9" width="2" height="1" fill="#004499" />
      <rect x="13" y="9" width="2" height="1" fill="#004499" />
      {/* Cockpit */}
      <rect x="7" y="3" width="2" height="2" fill="#88ffff" />
      {/* Engine glow */}
      <rect x="6" y="10" width="4" height="2" fill="#ff8800" />
      <rect x="7" y="12" width="2" height="2" fill="#ffff00" />
      <rect x="7" y="14" width="2" height="1" fill="#ff4400" opacity="0.7" />
      {/* Accent lines */}
      <rect x="5" y="6" width="1" height="1" fill="#ffffff" opacity="0.5" />
      <rect x="10" y="6" width="1" height="1" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
