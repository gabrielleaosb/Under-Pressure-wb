import React, { useState, useRef } from 'react';
import { t } from '../i18n.js';
import { playClick } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';

function PlayerCard({ player, me, transmitterId, lang, onPickShip, isHost, send }) {
  const isNavigator = player.id === transmitterId;
  const isMe = player.id === me?.id;

  return (
    <article className={`lobby-crew-card panel bevel${isNavigator ? ' is-navigator' : ''}${isMe ? ' is-me' : ''}`}>
      <button
        type="button"
        className="lobby-ship-port"
        onClick={isMe ? onPickShip : undefined}
        disabled={!isMe}
        aria-label={isMe ? (lang === 'pt' ? 'Trocar nave' : 'Change ship') : player.name}
      >
        <ShipIcon
          ship={player.ship || 'nova_01'}
          color={player.shipColor || 'blue'}
          accent={player.shipAccent || 'cyan'}
          pixel={3.5}
          glow={isNavigator || isMe}
        />
        {isMe && <span className="lobby-ship-port__edit">+</span>}
      </button>

      <div className="lobby-crew-card__body">
        <div className="lobby-crew-card__name">{player.name}</div>
        {isNavigator && (
          <div className="lobby-crew-card__nav-tag">
            {lang === 'pt' ? 'Navegador inicial' : 'Starting navigator'}
          </div>
        )}
      </div>

      <div className="lobby-crew-card__badges">
        {isNavigator && <span className="badge badge-captain">{lang === 'pt' ? 'NAV' : 'NAV'}</span>}
        {isMe && <span className="badge badge-you">{t('you', lang)}</span>}
        {player.isBot && <span className="badge badge-bot">BOT</span>}
        {isHost && !player.isBot && !isNavigator && (
          <button
            className="btn btn-ghost btn-sm lobby-promote-btn"
            onClick={() => {
              playClick();
              send('set_transmitter', { playerId: player.id });
            }}
          >
            NAV
          </button>
        )}
      </div>
    </article>
  );
}

function SettingRow({ label, options, labels, value, onChange, suffix = '', custom }) {
  const inputRef = useRef(null);

  const commitCustom = (e) => {
    const raw = e.target.value;
    const num = parseInt(raw, 10);
    if (!Number.isFinite(num)) { e.target.value = value; return; }
    const clamped = Math.max(custom.min, Math.min(custom.max, num));
    e.target.value = clamped;
    onChange(clamped);
  };

  return (
    <div className="lobby-setting-row">
      <div className="t-title text-dim lobby-setting-row__label">{label}</div>
      <div className="lobby-setting-row__options">
        {options.map((option, i) => (
          <button
            key={option}
            className={`btn btn-sm ${value === option ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => { onChange(option); if (inputRef.current) inputRef.current.value = option; }}
          >
            {labels ? labels[i] : `${option}${suffix}`}
          </button>
        ))}
        {custom && (
          <input
            ref={inputRef}
            type="number"
            min={custom.min}
            max={custom.max}
            defaultValue={value}
            key={value}
            onBlur={commitCustom}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            className="input lobby-custom-input"
            title={`${custom.min}–${custom.max}${suffix}`}
          />
        )}
      </div>
    </div>
  );
}

function MissionStat({ label, value }) {
  return (
    <div className="lobby-mission-stat">
      <span className="t-title text-dim">{label}</span>
      <strong className="t-read">{value}</strong>
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
  const missionReadyLabel = canStart
    ? (lang === 'pt' ? 'Pronta' : 'Ready')
    : (lang === 'pt' ? 'Aguardando' : 'Waiting');

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
          currentAccent={me?.shipAccent || 'cyan'}
          lang={lang}
          onConfirm={(ship, color, accent) => {
            localStorage.setItem('up_ship', ship);
            localStorage.setItem('up_ship_color', color);
            localStorage.setItem('up_ship_accent', accent);
            send('set_ship', { playerId: myId, ship, color, accent });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div className="screen lobby-shell">
        <main className="lobby-hangar">
          <section className="lobby-command-bar panel bevel glow-cyan">
            <button
              type="button"
              className={`lobby-room-readout lobby-room-readout--btn${copied ? ' is-copied' : ''}`}
              onClick={copyLink}
              title={lang === 'pt' ? 'Copiar código' : 'Copy code'}
            >
              <span className="t-title text-dim">{lang === 'pt' ? 'SALA' : 'ROOM'}</span>
              <strong className="t-read glow-text-amber">{code}</strong>
              <span className="lobby-room-copy-hint">
                {copied ? (lang === 'pt' ? 'COPIADO!' : 'COPIED!') : (lang === 'pt' ? 'COPIAR' : 'COPY')}
              </span>
            </button>

            <div className="lobby-command-actions">
              <div className="lobby-lang-switch panel">
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
              <button className={`btn btn-sm ${copied ? 'btn-green' : 'btn-yellow'}`} onClick={copyLink}>
                {copied ? t('copied', lang) : t('copy_link', lang)}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { playClick(); onSettings?.(); }}>
                {lang === 'pt' ? 'AJUSTES' : 'SETTINGS'}
              </button>
            </div>
          </section>

          <section className="lobby-brief-grid">
            <article className="lobby-nav-bay panel bevel glow-amber">
              <button
                type="button"
                className="lobby-nav-bay__ship"
                onClick={transmitter?.id === myId ? () => setPickerOpen(true) : undefined}
                disabled={transmitter?.id !== myId}
                aria-label={lang === 'pt' ? 'Trocar nave' : 'Change ship'}
              >
                <ShipIcon
                  ship={transmitter?.ship || 'nova_01'}
                  color={transmitter?.shipColor || 'amber'}
                  accent={transmitter?.shipAccent || 'cyan'}
                  pixel={6}
                  glow
                />
              </button>
              <div className="lobby-nav-bay__copy">
                <span className="t-title text-dim">{lang === 'pt' ? 'NAVEGADOR INICIAL' : 'STARTING NAVIGATOR'}</span>
                <strong className="t-title glow-text-amber">{transmitter?.name || '?'}</strong>
                <p className="t-mono text-dim">
                  {lang === 'pt' ? 'O controle muda a cada rodada.' : 'Control rotates every round.'}
                </p>
              </div>
            </article>

            <aside className="lobby-mission-panel panel bevel">
              <div className="lobby-mission-panel__head">
                <span className="t-title text-dim">{lang === 'pt' ? 'BRIEFING' : 'BRIEFING'}</span>
                <b className={canStart ? 'glow-text-mint' : 'glow-text-amber'}>{missionReadyLabel}</b>
              </div>
              <div className="lobby-mission-stats">
                <MissionStat label={lang === 'pt' ? 'Tripulacao' : 'Crew'} value={players.length} />
                <MissionStat label={t('rounds', lang)} value={settings.rounds} />
                <MissionStat
                  label={lang === 'pt' ? 'Modo' : 'Mode'}
                  value={settings.cardMode === 'livre' ? (lang === 'pt' ? 'Livre' : 'Free') : (lang === 'pt' ? 'Tematico' : 'Themed')}
                />
                <MissionStat
                  label={lang === 'pt' ? 'Barometro' : 'Barometer'}
                  value={settings.targetMode === 'choose' ? (lang === 'pt' ? 'Livre' : 'Free') : (lang === 'pt' ? 'Aleatorio' : 'Random')}
                />
                <MissionStat label={lang === 'pt' ? 'Dica' : 'Clue'} value={`${settings.clueTimer}s`} />
                <MissionStat label={lang === 'pt' ? 'Voto' : 'Vote'} value={`${settings.voteTimer}s`} />
              </div>
            </aside>
          </section>

          <section className="lobby-section-head">
            <div>
              <span className="t-title text-dim">{lang === 'pt' ? 'HANGAR' : 'HANGAR'}</span>
              <strong className="t-title">{lang === 'pt' ? 'Tripulacao' : 'Crew'}</strong>
            </div>
            <span className="t-mono text-dim">{players.length}/8</span>
          </section>

          <section className="lobby-crew-grid">
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
          </section>

          {players.length < 2 && (
            <div className="lobby-waiting panel bevel">
              <div className="t-title glow-text-cyan">{lang === 'pt' ? 'AGUARDANDO MAIS UM PILOTO' : 'WAITING FOR ONE MORE PILOT'}</div>
              <div className="t-mono text-dim">{lang === 'pt' ? 'Compartilhe o codigo ou o link da sala.' : 'Share the room code or invite link.'}</div>
            </div>
          )}

          {isHost && (
            <section className="lobby-settings panel bevel">
              <SettingRow
                label={t('rounds', lang)}
                options={[5, 7, 10]}
                value={settings.rounds}
                custom={{ min: 3, max: 30 }}
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
                custom={{ min: 15, max: 120 }}
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
                custom={{ min: 15, max: 120 }}
                onChange={(value) => {
                  playClick();
                  send('update_settings', { ...settings, voteTimer: value });
                }}
              />
              <SettingRow
                label={lang === 'pt' ? 'BAROMETRO' : 'BAROMETER'}
                options={['random', 'choose']}
                labels={lang === 'pt' ? ['ALEATORIO', 'LIVRE'] : ['RANDOM', 'FREE']}
                value={settings.targetMode ?? 'random'}
                onChange={(value) => {
                  playClick();
                  send('update_settings', { ...settings, targetMode: value });
                }}
              />
              <SettingRow
                label={lang === 'pt' ? 'MODO DE JOGO' : 'GAME MODE'}
                options={['themed', 'livre']}
                labels={lang === 'pt' ? ['TEMATICO', 'LIVRE'] : ['THEMED', 'FREE']}
                value={settings.cardMode ?? 'themed'}
                onChange={(value) => {
                  playClick();
                  send('update_settings', { ...settings, cardMode: value });
                }}
              />
              {(settings.cardMode ?? 'themed') === 'livre' && (
                <SettingRow
                  label={lang === 'pt' ? 'OPCOES DE CARTA' : 'CARD OPTIONS'}
                  options={[1, 3, 5]}
                  value={settings.cardOptions ?? 3}
                  onChange={(value) => {
                    playClick();
                    send('update_settings', { ...settings, cardOptions: value });
                  }}
                />
              )}
            </section>
          )}

          <div className="lobby-launch-dock">
            {isHost ? (
              <button
                className={`btn ${canStart ? 'btn-primary' : 'btn-ghost'} btn-lg btn-full`}
                onClick={() => {
                  playClick();
                  send('start_game');
                }}
                disabled={!canStart}
              >
                {t('start_mission', lang)}
              </button>
            ) : (
              <div className="lobby-client-wait panel bevel">
                {t('waiting_host', lang)}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
