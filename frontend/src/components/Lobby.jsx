import React, { useState } from 'react';
import { t } from '../i18n.js';
import { playClick } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

function PlayerCard({ player, me, transmitterId, lang, onPickShip, isHost, send }) {
  const isTx = player.id === transmitterId;
  const isMe = player.id === me?.id;

  return (
    <div className={`panel ${isTx ? 'glow-cyan' : 'bevel'}`} style={{
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
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
        <ShipIcon ship={player.ship || 'nova_01'} color={player.shipColor || 'blue'} pixel={3.4} glow={isTx || isMe} />
        {isMe && (
          <div style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: 2,
            background: 'var(--neon-cyan)',
            border: '2px solid var(--space-0)',
            color: '#00211f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontFamily: 'var(--f-title)',
          }}>+</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-title" style={{
          fontSize: 11,
          color: isTx ? 'var(--neon-amber)' : isMe ? 'var(--neon-cyan)' : 'var(--ink)',
          textShadow: isTx ? '0 0 8px var(--neon-amber)' : isMe ? '0 0 6px var(--neon-cyan)' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {player.name}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
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
            style={{ minHeight: 34, fontSize: 8, padding: '6px 10px' }}
          >
            TX
          </button>
        )}
      </div>
    </div>
  );
}

function SettingRow({ label, options, labels, value, onChange, suffix = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="t-title text-dim" style={{ fontSize: 9 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((option, i) => (
          <button
            key={option}
            className={`btn btn-sm ${value === option ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => onChange(option)}
            style={{ flex: 1, fontSize: 9, minHeight: 40 }}
          >
            {labels ? labels[i] : `${option}${suffix}`}
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
  const crew = players.filter((player) => player.id !== transmitterId);
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
          width: 'min(1060px, 100%)',
          padding: '24px 18px 96px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div className="panel bevel rivets" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div>
              <div className="t-title text-dim" style={{ fontSize: 8, marginBottom: 4 }}>ROOM</div>
              <div className="t-read glow-text-amber" style={{ fontSize: 40, letterSpacing: '.18em' }}>{code}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
              <button className="btn btn-ghost" onClick={() => { playClick(); onSettings?.(); }} style={{ minHeight: 38, padding: '8px 12px', fontSize: 9 }}>
                CONFIG
              </button>
            </div>
          </div>

          {transmitter && (
            <div className="panel glow-cyan" style={{
              padding: '22px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              borderColor: 'var(--neon-amber)',
              background: 'linear-gradient(180deg, rgba(255,224,0,.10), rgba(0,255,255,.035))',
              marginBottom: 10,
              boxShadow: '0 0 24px rgba(255,224,0,.20)',
              cursor: transmitter.id === myId ? 'pointer' : 'default',
            }}
              onClick={transmitter.id === myId ? () => setPickerOpen(true) : undefined}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div className="badge badge-captain">TX</div>
                <ShipIcon ship={transmitter.ship || 'nova_01'} color={transmitter.shipColor || 'amber'} pixel={5} glow />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 8 }}>
                  {lang === 'pt' ? 'TRANSMISSOR INICIAL' : 'STARTING TRANSMITTER'}
                </div>
                <div className="t-title glow-text-amber" style={{ fontSize: 'clamp(15px, 2.4vw, 22px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {transmitter.name}
                </div>
                <div className="t-mono text-dim" style={{ fontSize: 16, marginTop: 8 }}>
                  {lang === 'pt' ? 'A funcao gira a cada rodada' : 'Role rotates every round'}
                </div>
              </div>
            </div>
          )}

          <div className="t-title text-dim" style={{ fontSize: 9, marginTop: 4 }}>
            {lang === 'pt' ? 'TRIPULACAO' : 'CREW'} · {players.length}
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 10 }}>
            {crew.map((player) => (
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
            {crew.length === 0 && (
              <div className="panel bevel" style={{ padding: 22, textAlign: 'center', gridColumn: '1 / -1' }}>
                <div className="t-body text-dim" style={{ fontSize: 17 }}>
                  {lang === 'pt' ? 'Aguardando jogadores...' : 'Waiting for players...'}
                </div>
              </div>
            )}
          </div>

          {isHost && (
            <div className="panel bevel" style={{
              padding: '16px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 14,
            }}>
              <SettingRow
                label={t('rounds', lang)}
                options={[5, 7, 10, 15]}
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
              <SettingRow
                label={lang === 'pt' ? 'POSIÇÃO ALVO' : 'TARGET POSITION'}
                options={['random', 'choose']}
                labels={lang === 'pt' ? ['ALEATÓRIA', 'LIVRE'] : ['RANDOM', 'FREE']}
                value={settings.targetMode ?? 'random'}
                onChange={(value) => {
                  playClick();
                  send('update_settings', { ...settings, targetMode: value });
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
                style={{ maxWidth: 460, opacity: canStart ? 1 : .35, fontSize: 12, minHeight: 58 }}
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
