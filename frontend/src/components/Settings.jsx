import React, { useEffect, useRef, useState } from 'react';
import { getVolume, setVolume, playClick } from '../sounds.js';

export default function Settings({ lang, setLang, onLeaveRoom, onClose, inGame }) {
  const [vol, setVol] = useState(() => Math.round(getVolume() * 100));
  const rafRef = useRef(null);

  const handleVol = (value) => {
    const next = Math.max(0, Math.min(100, value));
    setVolume(next / 100);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setVol(next);
      rafRef.current = null;
    });
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [onClose]);

  return (
    <div className="settings-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="settings-backdrop" />

      <div className="settings-panel panel bevel">
        <div className="settings-panel__header">
          <div>
            <h2 className="t-title glow-text-cyan" style={{ fontSize: 'clamp(10px,2.4vw,13px)' }}>
              CONFIG
            </h2>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ width: 38, minWidth: 38, height: 38, minHeight: 38, padding: 0, fontSize: 16 }}
          >
            X
          </button>
        </div>

        <div className="settings-section">
          <div className="label" style={{ color: 'var(--dim2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>VOL</span>
            <span style={{ fontFamily: 'var(--f-vt)', fontSize: 32, color: 'var(--cyan)' }}>{vol}%</span>
          </div>

          <div className="settings-slider-row">
            <input
              type="range"
              min="0"
              max="100"
              value={vol}
              onInput={(event) => handleVol(Number(event.target.value))}
              onChange={(event) => handleVol(Number(event.target.value))}
              className="settings-slider"
              style={{ '--vol': `${vol}%` }}
            />
          </div>

          <div className="settings-quick-grid">
            {[0, 50, 100].map((value) => (
              <button
                key={value}
                className={`btn btn-sm ${vol === value ? 'btn-cyan' : 'btn-ghost'}`}
                onClick={() => {
                  handleVol(value);
                  playClick();
                }}
              >
                {value === 0 ? '0%' : `${value}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <div className="label" style={{ color: 'var(--dim2)', marginBottom: 10 }}>
            LANG
          </div>
          <div className="settings-quick-grid">
            {[
              ['pt', 'Português'],
              ['en', 'English'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`btn ${lang === value ? 'btn-cyan' : 'btn-ghost'}`}
                onClick={() => {
                  playClick();
                  setLang(value);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {inGame && onLeaveRoom && (
          <button
            className="btn btn-red btn-full"
            onClick={() => {
              playClick();
              onLeaveRoom();
            }}
          >
            EXIT
          </button>
        )}

        <button className="btn btn-ghost btn-full" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
