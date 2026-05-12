import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick } from '../sounds.js';
import { ShipIcon, ShipPicker, SHIP_LABELS } from './ShipRoster.jsx';

function PlayerCard({ player, me, transmitterId, lang, onPickShip, isHost, send }) {
  const isTx = player.id === transmitterId;
  const isMe = player.id === me?.id;

  return (
    <div className={`panel ${isTx ? 'glow-cyan' : 'bevel'}`} style={{
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: isTx
        ? 'linear-gradient(180deg, rgba(255,224,0,.06), rgba(0,255,255,.03))'
        : 'rgba(255,255,255,.02)',
      borderColor: isTx ? 'var(--neon-amber)' : isMe ? 'var(--neon-cyan)' : undefined,
      boxShadow: isTx ? '0 0 16px rgba(255,224,0,.28)' : undefined,
    }}>
      <div
        style={{ position: 'relative', flex: '0 0 auto', cursor: isMe ? 'pointer' : 'default' }}
        onClick={isMe ? onPickShip : undefined}
      >
        <ShipIcon ship={player.ship || 'nova_01'} color={player.shipColor || 'blue'} pixel={2.7} glow={isTx || isMe} />
        {isMe && (
          <div style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: 2,
            background: 'var(--neon-cyan)',
            border: '2px solid var(--space-0)',
            color: '#00211f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontFamily: 'var(--f-title)',
          }}>+</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-title" style={{
          fontSize: 9,
          color: isTx ? 'var(--neon-amber)' : isMe ? 'var(--neon-cyan)' : 'var(--ink)',
          textShadow: isTx ? '0 0 8px var(--neon-amber)' : isMe ? '0 0 6px var(--neon-cyan)' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {player.name}
        </div>
        <div className="t-mono text-dim" style={{ fontSize: 11, marginTop: 2 }}>
          {SHIP_LABELS[lang]?.[player.ship || 'nova_01']} · {player.shipColor || 'blue'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        {isTx && (
          <span className="badge badge-captain">
            {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
          </span>
        )}
        {isMe && <span className="badge badge-you">{t('you', lang)}</span>}
        {player.isBot && <span className="badge badge-bot">BOT</span>}
        {isHost && !player.isBot && !isTx && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              playClick();
              send('set_transmitter', { playerId: player.id });
            }}
            style={{ minHeight: 28, fontSize: 7, padding: '4px 7px' }}
          >
            TX
          </button>
        )}
      </div>
    </div>
  );
}

function SettingRow({ label, options, value, onChange, suffix = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="t-title text-dim" style={{ fontSize: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((option) => (
          <button
            key={option}
            className={`btn btn-sm ${value === option ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => onChange(option)}
            style={{ flex: 1, fontSize: 8 }}
          >
            {option}{suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Lobby({ gameState, myId, lang, setLang, send, isHost, onSettings }) {
  const { code, players, settings } = gameState;
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const me = players.find((player) => player.id === myId);
  const transmitterId = gameState.transmitterId || gameState.hostId;
  const transmitter = players.find((player) => player.id === transmitterId) || players[0];
  const canStart = players.length >= 2;

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
        <div style={{
          position: 'relative',
          width: 'min(860px, 100%)',
          padding: '18px 14px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div className="panel bevel rivets" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            gap: 12,
          }}>
            <div>
              <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 2 }}>{t('room_code', lang)}</div>
              <div className="t-read glow-text-amber" style={{ fontSize: 26, letterSpacing: '.2em' }}>{code}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <button className={`btn btn-sm ${copied ? 'btn-green' : 'btn-yellow'}`} onClick={copyLink}>
                {copied ? t('copied', lang) : t('copy_link', lang)}
              </button>
              <button className="btn btn-ghost btn-icon" onClick={() => { playClick(); onSettings?.(); }} style={{ minHeight: 34, height: 34, width: 34 }}>
                ⚙
              </button>
            </div>
          </div>

          {transmitter && (
            <div className="panel glow-cyan" style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderColor: 'var(--neon-amber)',
              background: 'linear-gradient(180deg, rgba(255,224,0,.06), rgba(0,255,255,.03))',
            }}>
              <ShipIcon ship={transmitter.ship || 'nova_01'} color={transmitter.shipColor || 'amber'} pixel={3.2} glow />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-title text-dim" style={{ fontSize: 7, marginBottom: 4 }}>
                  ▸ {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
                </div>
                <div className="t-title glow-text-amber" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {transmitter.name}
                </div>
              </div>
              <div className="t-mono text-dim" style={{ fontSize: 12 }}>
                {lang === 'pt' ? 'MODO ◆ FFA' : 'MODE ◆ FFA'}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="t-title text-dim" style={{ fontSize: 7 }}>
              ▸ {lang === 'pt' ? 'PILOTOS' : 'PILOTS'} ({players.length})
            </div>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                me={me}
                transmitterId={transmitterId}
                lang={lang}
                isHost={isHost}
                send={send}
                onPickShip={() => setPickerOpen(true)}
              />
            ))}
            <div style={{
              padding: '8px 10px',
              border: '1.5px dashed rgba(255,255,255,.14)',
              borderRadius: 4,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--f-read)',
              fontSize: 14,
              textAlign: 'center',
            }}>
              + {lang === 'pt' ? 'aguardando piloto...' : 'awaiting pilot...'}
            </div>
          </div>

          {isHost && (
            <div className="panel bevel" style={{
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 10,
            }}>
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
          )}

          <div className="sticky-footer">
            {isHost ? (
              <button
                className={`btn ${canStart ? 'btn-primary btn-pulse' : 'btn-ghost'} btn-lg btn-full`}
                onClick={() => {
                  playClick();
                  send('start_game');
                }}
                disabled={!canStart}
                style={{ maxWidth: 360, opacity: canStart ? 1 : .35 }}
              >
                ▸ {t('start_mission', lang)}
              </button>
            ) : (
              <div className="t-body text-dim" style={{ fontSize: 15, padding: '10px 0' }}>
                {t('waiting_host', lang)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
