import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick, playJoin } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

export default function Lobby({ gameState, myId, lang, setLang, send, isHost, onSettings }) {
  const { code, players, settings } = gameState;
  const [copied, setCopied] = useState(false);

  const me            = players.find(p => p.id === myId);
  const transmitterId = gameState.transmitterId || gameState.hostId;
  const [pickerOpen, setPickerOpen] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${code}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000); playClick();
  };

  const canStart = () => players.length >= 2;

  return (
    <>
    {pickerOpen && (
      <ShipPicker
        currentShip={me?.ship||'cruiser'}
        currentColor={me?.shipColor||'blue'}
        lang={lang}
        onConfirm={(ship, color) => {
          send('set_ship', { playerId: myId, ship, color });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    )}

    <div className="screen" style={{ minHeight:'100vh' }}>
      <div className="container" style={{ paddingTop:16, paddingBottom:80 }}>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-16" style={{ flexWrap:'wrap', gap:8 }}>
          <h1 className="pixel-title glow-text-cyan" style={{ fontSize:'clamp(11px,3vw,15px)' }}>
            UNDER PRESSURE
          </h1>
          <div className="flex gap-8 items-center">
            {['pt','en'].map(l => (
              <button key={l} className={`btn btn-sm ${lang===l?'btn-cyan':'btn-ghost'}`}
                onClick={() => { playClick(); setLang(l); }}>{l.toUpperCase()}</button>
            ))}
            <button onClick={() => { playClick(); onSettings?.(); }}
              className="btn btn-ghost btn-icon" style={{ width:36, height:36, minWidth:36 }}>⚙</button>
          </div>
        </div>

        {/* Room code */}
        <div className="panel bevel glow-amber p-16 mb-16" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div className="label mb-4" style={{ color:'var(--ink-dim)' }}>{t('room_code', lang)}</div>
            <div className="t-title glow-text-amber" style={{ fontSize:'clamp(20px,6vw,32px)', letterSpacing:8 }}>
              {code}
            </div>
          </div>
          <button className={`btn ${copied?'btn-green':'btn-yellow'}`} onClick={copyLink}>
            {copied ? '✓ ' + t('copied', lang) : '🔗 ' + t('copy_link', lang)}
          </button>
        </div>

        {/* Players */}
        <div className="panel bevel p-16 mb-16">
          <div className="label mb-12" style={{ color:'var(--ink-dim)' }}>
            {lang === 'pt' ? 'TRIPULAÇÃO' : 'CREW'} ({players.length})
          </div>
          <div className="flex-col gap-8">
            {players.map(p => {
              const isTx = p.id === transmitterId;
              return (
              <div key={p.id} className="player-row" style={{
                borderColor: isTx ? 'var(--neon-amber)' : p.id === myId ? p.color : undefined,
                background:  isTx ? 'rgba(255,224,0,0.06)' : undefined,
              }}>
                {/* Ship icon */}
                <div style={{ position:'relative', flexShrink:0, cursor: p.id===myId ? 'pointer' : 'default' }}
                  onClick={p.id===myId ? () => setPickerOpen(true) : undefined}
                  title={p.id===myId ? (lang==='pt'?'Trocar nave':'Change ship') : undefined}>
                  <ShipIcon ship={p.ship||'cruiser'} color={p.shipColor||'blue'} pixel={3}/>
                  {p.id===myId && (
                    <div style={{ position:'absolute', bottom:-4, right:-4, background:'var(--neon-cyan)', borderRadius:2, width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>✏</div>
                  )}
                  {!p.connected && !p.isBot && <span style={{ position:'absolute', top:-5, right:-5, fontSize:10 }}>💤</span>}
                </div>

                {/* Name + badges */}
                <div style={{ flex:1, overflow:'hidden' }}>
                  <div style={{ fontFamily:'var(--f-body)', fontWeight:800, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' }}>
                    {p.id === myId && <span className="badge badge-you">👤 {t('you', lang)}</span>}
                    {p.isHost      && <span className="badge badge-captain">👑 {lang==='pt'?'CAPITÃO':'CAPTAIN'}</span>}
                    {p.isBot       && <span className="badge badge-bot">BOT</span>}
                    {isTx          && <span className="badge" style={{ background:'rgba(255,224,0,0.15)', color:'var(--neon-amber)', border:'1px solid var(--neon-amber)' }}>📡 {lang==='pt'?'TRANSMISSOR':'TRANSMITTER'}</span>}
                  </div>
                </div>

                {/* Host: tap to set as transmitter */}
                {isHost && !p.isBot && p.id !== transmitterId && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize:8, whiteSpace:'nowrap' }}
                    onClick={() => { playClick(); send('set_transmitter', { playerId: p.id }); }}
                  >
                    📡 {lang==='pt'?'Transmissor':'Set TX'}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Transmitter info for non-hosts */}
        {!isHost && (
          <div style={{ padding:'10px 14px', borderRadius:6, border:'1px solid rgba(255,224,0,0.3)', background:'rgba(255,224,0,0.04)', marginBottom:8, fontFamily:'var(--f-body)', fontSize:13, color:'var(--ink-dim)' }}>
            📡 {lang==='pt'?`Transmissor desta partida: `:'Transmitter for this match: '}
            <span style={{ color:'var(--neon-amber)', fontWeight:800 }}>
              {players.find(p=>p.id===transmitterId)?.name || '?'}
            </span>
          </div>
        )}

        {/* Settings — host only */}
        {isHost && (
          <div className="panel bevel p-16 mb-16">
            <div className="label mb-14" style={{ color:'var(--ink-dim)' }}>{t('settings', lang)}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <SettingRow label={t('rounds', lang)} options={[5,10,15,20]} value={settings.rounds}
                onChange={v => { playClick(); send('update_settings', { ...settings, rounds:v }); }}/>
              <SettingRow label={t('clue_timer', lang)} options={[30,60,90]} value={settings.clueTimer} suffix="s"
                onChange={v => { playClick(); send('update_settings', { ...settings, clueTimer:v }); }}/>
              <SettingRow label={t('vote_timer', lang)} options={[30,60,90]} value={settings.voteTimer} suffix="s"
                onChange={v => { playClick(); send('update_settings', { ...settings, voteTimer:v }); }}/>
            </div>
          </div>
        )}

        {/* Start — sticky bottom */}
        <div style={{
          position:'sticky', bottom:0,
          background:'linear-gradient(0deg,rgba(5,5,16,1) 70%,transparent 100%)',
          padding:'16px 0 8px', textAlign:'center',
        }}>
          {isHost ? (
            <div className="flex-col items-center gap-8">
              <button
                className={`btn ${canStart()?'btn-primary btn-pulse':'btn-ghost'} btn-lg btn-full`}
                onClick={() => { playClick(); send('start_game'); }}
                disabled={!canStart()}
                style={{ maxWidth:360, opacity: canStart()?1:.35 }}
              >
                🚀 {t('start_mission', lang)}
              </button>
              {!canStart() && (
                <span style={{ fontFamily:'var(--f-body)', fontSize:12, color:'var(--ink-dim)' }}>
                  {lang==='pt' ? 'Mín. 2 jogadores' : 'Min. 2 players'}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontFamily:'var(--f-body)', fontSize:15, color:'var(--ink-dim)', padding:'10px 0' }}>
              📡 {t('waiting_host', lang)}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function SettingRow({ label, options, value, onChange, suffix='' }) {
  return (
    <div>
      <div className="label mb-8" style={{ color:'var(--ink-dim)' }}>{label}</div>
      <div className="flex gap-4">
        {options.map(o => (
          <button key={o} className={`btn btn-sm ${value===o?'btn-cyan':'btn-ghost'}`}
            onClick={() => onChange(o)} style={{ flex:1, fontSize:8 }}>
            {o}{suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
