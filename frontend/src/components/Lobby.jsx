import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

export default function Lobby({ gameState, myId, lang, setLang, send, isHost, onSettings }) {
  const { code, players, settings } = gameState;
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const me = players.find((player) => player.id === myId);
  const transmitterId = gameState.transmitterId || gameState.hostId;

  const copyLink = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playClick();
    } catch {
      setCopied(false);
    }
  };

  const canStart = players.length >= 2;

  return (
    <>
      {pickerOpen && (
        <ShipPicker
          currentShip={me?.ship || 'nova_01'}
          currentColor={me?.shipColor || 'blue'}
          lang={lang}
          onConfirm={(ship, color) => {
            send('set_ship', { playerId: myId, ship, color });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="screen lobby-shell" style={{ minHeight: '100vh' }}>
        <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>
          <div className="flex items-center justify-between mb-16" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 className="pixel-title glow-text-cyan" style={{ fontSize: 'clamp(11px,3vw,15px)' }}>
                UNDER PRESSURE
              </h1>
              <div className="t-mono text-dim" style={{ fontSize: 13, marginTop: 6 }}>
                {lang === 'pt' ? 'PONTE TATICA // LOBBY' : 'TACTICAL BRIDGE // LOBBY'}
              </div>
            </div>

            <div className="flex gap-8 items-center">
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
              <button
                onClick={() => {
                  playClick();
                  onSettings?.();
                }}
                className="btn btn-ghost btn-icon"
                style={{ width: 36, height: 36, minWidth: 36 }}
              >
                ⚙
              </button>
            </div>
          </div>

          <div className="panel bevel glow-amber p-16 mb-16 lobby-room-card">
            <div>
              <div className="label mb-4" style={{ color: 'var(--ink-dim)' }}>{t('room_code', lang)}</div>
              <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(20px,6vw,32px)', letterSpacing: 8 }}>
                {code}
              </div>
              <div className="t-mono text-dim" style={{ fontSize: 13, marginTop: 8 }}>
                {lang === 'pt' ? 'Convite curto para toda a tripulacao' : 'Short invite for the whole crew'}
              </div>
            </div>
            <button className={`btn ${copied ? 'btn-green' : 'btn-yellow'}`} onClick={copyLink}>
              {copied ? `✓ ${t('copied', lang)}` : `LINK ${t('copy_link', lang)}`}
            </button>
          </div>

          <div className="panel bevel glow-cyan p-16 mb-16">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div className="label" style={{ color: 'var(--ink-dim)' }}>
                {lang === 'pt' ? 'TRIPULACAO' : 'CREW'} ({players.length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShipIcon ship={me?.ship || 'nova_01'} color={me?.shipColor || 'blue'} pixel={3} glow />
                <button className="btn btn-ghost btn-sm" onClick={() => setPickerOpen(true)}>
                  {lang === 'pt' ? 'Trocar nave' : 'Change ship'}
                </button>
              </div>
            </div>

            <div className="flex-col gap-8">
              {players.map((player) => {
                const isTx = player.id === transmitterId;
                return (
                  <div
                    key={player.id}
                    className="player-row"
                    style={{
                      borderColor: isTx ? 'var(--neon-amber)' : player.id === myId ? player.color : undefined,
                      background: isTx ? 'rgba(255,224,0,0.06)' : undefined,
                    }}
                  >
                    <div
                      style={{ position: 'relative', flexShrink: 0, cursor: player.id === myId ? 'pointer' : 'default' }}
                      onClick={player.id === myId ? () => setPickerOpen(true) : undefined}
                      title={player.id === myId ? (lang === 'pt' ? 'Trocar nave' : 'Change ship') : undefined}
                    >
                      <ShipIcon ship={player.ship || 'nova_01'} color={player.shipColor || 'blue'} pixel={3} glow={isTx} />
                      {player.id === myId && (
                        <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--neon-cyan)', borderRadius: 2, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
                          ✎
                        </div>
                      )}
                      {!player.connected && !player.isBot && <span style={{ position: 'absolute', top: -5, right: -5, fontSize: 10 }}>Z</span>}
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {player.id === myId && <span className="badge badge-you">{t('you', lang)}</span>}
                        {player.isHost && <span className="badge badge-captain">{lang === 'pt' ? 'CAPITAO' : 'CAPTAIN'}</span>}
                        {player.isBot && <span className="badge badge-bot">BOT</span>}
                        {isTx && (
                          <span className="badge" style={{ background: 'rgba(255,224,0,0.15)', color: 'var(--neon-amber)', border: '1px solid var(--neon-amber)' }}>
                            {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
                          </span>
                        )}
                      </div>
                    </div>

                    {isHost && !player.isBot && player.id !== transmitterId && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 8, whiteSpace: 'nowrap' }}
                        onClick={() => {
                          playClick();
                          send('set_transmitter', { playerId: player.id });
                        }}
                      >
                        {lang === 'pt' ? 'Definir TX' : 'Set TX'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isHost && (
            <div style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,224,0,0.3)', background: 'rgba(255,224,0,0.04)', marginBottom: 8, fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--ink-dim)' }}>
              {lang === 'pt' ? 'Transmissor desta partida:' : 'Transmitter for this match:'}{' '}
              <span style={{ color: 'var(--neon-amber)', fontWeight: 800 }}>
                {players.find((player) => player.id === transmitterId)?.name || '?'}
              </span>
            </div>
          )}

          {isHost && (
            <div className="panel bevel p-16 mb-16">
              <div className="label mb-14" style={{ color: 'var(--ink-dim)' }}>{t('settings', lang)}</div>
              <div className="auto-grid-3">
                <SettingRow
                  label={t('rounds', lang)}
                  options={[5, 10, 15, 20]}
                  value={settings.rounds}
                  onChange={(value) => {
                    playClick();
                    send('update_settings', { ...settings, rounds: value });
                  }}
                />
                <SettingRow
                  label={t('clue_timer', lang)}
                  options={[30, 60, 90]}
                  value={settings.clueTimer}
                  suffix="s"
                  onChange={(value) => {
                    playClick();
                    send('update_settings', { ...settings, clueTimer: value });
                  }}
                />
                <SettingRow
                  label={t('vote_timer', lang)}
                  options={[30, 60, 90]}
                  value={settings.voteTimer}
                  suffix="s"
                  onChange={(value) => {
                    playClick();
                    send('update_settings', { ...settings, voteTimer: value });
                  }}
                />
              </div>
            </div>
          )}

          <div className="sticky-footer">
            {isHost ? (
              <div className="flex-col items-center gap-8">
                <button
                  className={`btn ${canStart ? 'btn-primary btn-pulse' : 'btn-ghost'} btn-lg btn-full`}
                  onClick={() => {
                    playClick();
                    send('start_game');
                  }}
                  disabled={!canStart}
                  style={{ maxWidth: 360, opacity: canStart ? 1 : 0.35 }}
                >
                  {t('start_mission', lang)}
                </button>
                {!canStart && (
                  <span style={{ fontFamily: 'var(--f-body)', fontSize: 12, color: 'var(--ink-dim)' }}>
                    {lang === 'pt' ? 'Min. 2 jogadores' : 'Min. 2 players'}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--f-body)', fontSize: 15, color: 'var(--ink-dim)', padding: '10px 0' }}>
                {t('waiting_host', lang)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SettingRow({ label, options, value, onChange, suffix = '' }) {
  return (
    <div>
      <div className="label mb-8" style={{ color: 'var(--ink-dim)' }}>{label}</div>
      <div className="flex gap-4">
        {options.map((option) => (
          <button
            key={option}
            className={`btn btn-sm ${value === option ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => onChange(option)}
            style={{ flex: 1, fontSize: 8 }}
          >
            {option}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
