import React, { useState, useEffect } from 'react';
import { getVolume, setVolume, playClick } from '../sounds.js';

export default function Settings({ lang, setLang, onLeaveRoom, onClose, inGame }) {
  const [vol, setVol] = useState(() => Math.round(getVolume() * 100));

  const handleVol = (v) => {
    setVol(v);
    setVolume(v / 100);
  };

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 8000, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 8001,
        width: '90%', maxWidth: 400,
        background: 'rgba(6,8,24,0.98)',
        border: '2px solid var(--cyan)',
        boxShadow: 'var(--glow-c), 0 24px 80px rgba(0,0,0,0.8)',
        borderRadius: 10,
        padding: 28,
        display: 'flex', flexDirection: 'column', gap: 24,
        animation: 'theme-pop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="pixel-title" style={{ fontSize: 14, color: 'var(--cyan)' }}>
            ⚙ {lang === 'pt' ? 'CONFIGURAÇÕES' : 'SETTINGS'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dim2)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Volume */}
        <div>
          <div className="label mb-12" style={{ color: 'var(--dim2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔊 {lang === 'pt' ? 'VOLUME' : 'VOLUME'}</span>
            <span style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: 'var(--cyan)' }}>{vol}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--dim2)', fontSize: 18 }}>🔈</span>
            <input
              type="range" min="0" max="100" value={vol}
              onChange={e => handleVol(Number(e.target.value))}
              style={{
                flex: 1, height: 6, cursor: 'pointer',
                accentColor: 'var(--cyan)',
                WebkitAppearance: 'none',
                background: `linear-gradient(90deg, var(--cyan) ${vol}%, var(--dim) ${vol}%)`,
                borderRadius: 4, outline: 'none', border: 'none',
              }}
            />
            <span style={{ color: 'var(--dim2)', fontSize: 18 }}>🔊</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[0, 50, 100].map(v => (
              <button key={v} className={`btn btn-sm ${vol === v ? 'btn-cyan' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: 9 }}
                onClick={() => { handleVol(v); playClick(); }}>
                {v === 0 ? '🔇' : v === 50 ? '50%' : '🔊'}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <div className="label mb-10" style={{ color: 'var(--dim2)' }}>
            🌐 {lang === 'pt' ? 'IDIOMA' : 'LANGUAGE'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['pt','🇧🇷 Português'], ['en','🇺🇸 English']].map(([l, label]) => (
              <button key={l}
                className={`btn ${lang === l ? 'btn-cyan' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => { playClick(); setLang(l); }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="divider" style={{ margin: 0 }} />

        {/* Leave room / quit */}
        {inGame && onLeaveRoom && (
          <button
            className="btn btn-red btn-full"
            onClick={() => { playClick(); onLeaveRoom(); }}
            style={{ fontSize: 11 }}
          >
            🚪 {lang === 'pt' ? 'SAIR DA SALA' : 'LEAVE ROOM'}
          </button>
        )}

        <button
          className="btn btn-ghost btn-full"
          onClick={onClose}
          style={{ fontSize: 11 }}
        >
          ← {lang === 'pt' ? 'FECHAR' : 'CLOSE'}
        </button>
      </div>
    </>
  );
}
