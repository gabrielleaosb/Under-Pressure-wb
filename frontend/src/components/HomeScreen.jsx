import React, { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';
import { ShipIcon } from './ShipRoster.jsx';

const FEATURE_COPY = {
  pt: [
    'Crie uma sala em segundos',
    'Compartilhe um codigo curto',
    'Jogue no celular ou desktop',
  ],
  en: [
    'Create a room in seconds',
    'Share a short invite code',
    'Play on mobile or desktop',
  ],
};

export default function HomeScreen({ lang, setLang, onCreate, onJoin, inviteCode = '' }) {
  const [mode, setMode] = useState(() => (inviteCode ? 'join' : null));
  const [name, setName] = useState('');
  const [code, setCode] = useState(inviteCode);
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
        await onCreate(name.trim());
      } else {
        if (code.length < 4) {
          setErr(lang === 'pt' ? 'Codigo invalido.' : 'Invalid code.');
          setBusy(false);
          return;
        }
        playJoin();
        await onJoin(code.trim(), name.trim());
      }
    } catch (e) {
      setErr(e.message);
    }

    setBusy(false);
  };

  return (
    <div className="home-shell">
      <div className="home-radar home-radar--left" />
      <div className="home-radar home-radar--right" />
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 10 }}>
        {['pt', 'en'].map((languageCode) => (
          <button
            key={languageCode}
            className={`btn btn-sm ${lang === languageCode ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => {
              playClick();
              setLang(languageCode);
            }}
          >
            {languageCode.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="home-grid">
        <section className="home-hero">
          <div className="home-statusbar">
            <span className="glow-text-cyan">SECTOR-7G</span>
            <span>UPLINK OK</span>
            <span className="glow-text-mint">42 NAVES</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 6 }}>
            <ShipIcon ship="nova_03" color="red" pixel={4} glow />
            <ShipIcon ship="nova_18" color="blue" pixel={4} glow />
          </div>

          <div className="home-eyebrow">
            {lang === 'pt' ? 'WAVELENGTH EM TEMPO REAL' : 'REAL-TIME WAVELENGTH'}
          </div>

          <h1 className="t-title glow-text-cyan" style={{ fontSize: 'clamp(18px,5vw,32px)', lineHeight: 1.25 }}>
            UNDER
            <br />
            PRESSURE
          </h1>

          <p className="home-subtitle">
            {lang === 'pt'
              ? 'Duas tripulacoes, um painel instavel e zero margem para ler mal seus amigos. A interface agora segue a ponte CRT do conceito original.'
              : 'Two crews, one unstable gauge, and no room to misread your friends. The bridge UI now leans into the original CRT concept.'}
          </p>

          <div className="home-pill-list">
            {FEATURE_COPY[lang].map((item) => (
              <span key={item} className="home-pill">
                {item}
              </span>
            ))}
          </div>

          <div className="panel bevel home-brief">
            <div className="t-title glow-text-cyan" style={{ fontSize: 8, marginBottom: 8 }}>
              {lang === 'pt' ? 'TRANSMISSAO RECEBIDA' : 'TRANSMISSION RECEIVED'}
            </div>
            <p className="home-helper" style={{ margin: 0 }}>
              {lang === 'pt'
                ? 'Crie a sala, compartilhe o codigo e entre no fluxo sem instalar nada. Tudo roda no navegador.'
                : 'Create the room, share the code, and jump straight in. Everything runs in the browser.'}
            </p>
          </div>
        </section>

        <section className="home-panel panel bevel">
          {inviteCode && (
            <div className="invite-chip">
              {lang === 'pt' ? `Convite detectado: ${inviteCode}` : `Invite detected: ${inviteCode}`}
            </div>
          )}

          <div>
            <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>
              {t('playerName', lang)}
            </div>
            <input
              className="pixel-input"
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

          {mode === null && (
            <div className="home-mode-grid">
              <button
                className="btn btn-cyan btn-lg btn-full"
                onClick={() => {
                  playClick();
                  setMode('create');
                }}
              >
                {lang === 'pt' ? 'Criar sala' : 'Create room'}
              </button>
              <button
                className="btn btn-yellow btn-lg btn-full"
                onClick={() => {
                  playClick();
                  setMode('join');
                }}
              >
                {lang === 'pt' ? 'Entrar na sala' : 'Join room'}
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="stack gap-12">
              <div className="panel bevel" style={{ padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>
                  {lang === 'pt' ? 'Fluxo rapido' : 'Quick flow'}
                </div>
                <p className="home-helper">
                  {lang === 'pt'
                    ? 'Voce cria a sala, recebe um codigo curto e ja pode chamar a galera.'
                    : 'Create a room, get a short code, and bring everyone in immediately.'}
                </p>
              </div>

              <button
                className="btn btn-cyan btn-lg btn-full"
                onClick={go}
                disabled={!name.trim() || busy}
              >
                {busy ? '...' : lang === 'pt' ? 'Criar sala' : 'Create room'}
              </button>

              <button
                className="btn btn-ghost btn-sm btn-full"
                onClick={() => {
                  playClick();
                  setMode(inviteCode ? 'join' : null);
                }}
              >
                {lang === 'pt' ? 'Voltar' : 'Back'}
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="stack gap-12">
              <div>
                <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>
                  {t('roomCode', lang)}
                </div>
                <input
                  className="pixel-input code-input"
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

              <button
                className="btn btn-yellow btn-lg btn-full"
                onClick={go}
                disabled={!name.trim() || code.length < 4 || busy}
              >
                {busy ? '...' : lang === 'pt' ? 'Entrar agora' : 'Join now'}
              </button>

              <button
                className="btn btn-ghost btn-sm btn-full"
                onClick={() => {
                  playClick();
                  setMode(inviteCode ? 'join' : null);
                  if (!inviteCode) setCode('');
                }}
              >
                {lang === 'pt' ? 'Voltar' : 'Back'}
              </button>
            </div>
          )}

          {err && (
            <div className="home-error">
              {err}
            </div>
          )}
        </section>
      </div>

      <p className="home-footer">
        {lang === 'pt' ? 'Multiplayer direto no navegador' : 'Browser-native multiplayer'}
      </p>
    </div>
  );
}
