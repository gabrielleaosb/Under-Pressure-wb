import React, { useState, useRef } from 'react';
import { t } from '../i18n.js';
import { playClick } from '../sounds.js';
import { ShipIcon, ShipPicker } from './ShipRoster.jsx';
import { useCooldown } from '../useCooldown.js';
import GearIcon from './GearIcon.jsx';

function TeamCard({ team, players, me, lang, send, onPickShip }) {
  const teamPlayers = players.filter(p => p.teamId === team.id);
  const myPlayer = teamPlayers.find(p => p.id === me?.id);
  const myTeam = !!myPlayer;
  const isNav = myPlayer?.teamRole === 'navigator';

  return (
    <div className={`tcard${myTeam ? ' tcard--mine' : ''}`} style={{ '--tc': team.color }}>
      <div className="tcard__header">
        <span className="tcard__name t-title">{team.name}</span>
        <span className="tcard__count t-mono text-dim">{teamPlayers.length}P</span>
      </div>

      <div className="tcard__roster">
        {teamPlayers.length === 0
          ? <span className="tcard__empty t-mono text-dim">—</span>
          : teamPlayers.map(p => {
              const isMe = p.id === me?.id;
              const nav = p.teamRole === 'navigator';
              return (
                <div key={p.id} className={`tcard__pilot${isMe ? ' tcard__pilot--me' : ''}`}>
                  <button className="tcard__ship" onClick={isMe ? onPickShip : undefined} disabled={!isMe}>
                    <ShipIcon ship={p.ship||'nova_01'} color={p.shipColor||'blue'} accent={p.shipAccent||'cyan'} pixel={2} glow={nav} />
                  </button>
                  <span className="tcard__pname">{p.name}</span>
                  {nav && <span className="tcard__nav-dot" style={{ background: team.color }} />}
                  {p.isBot && <span className="badge badge-bot" style={{ fontSize: 6 }}>BOT</span>}
                  {isMe && (
                    <button className="tcard__role" onClick={() => { playClick(); send('join_team', { teamId: team.id, role: isNav ? 'calibrator' : 'navigator' }); }}>
                      {isNav ? '→CAL' : '→NAV'}
                    </button>
                  )}
                </div>
              );
            })
        }
      </div>

      <div className="tcard__footer">
        {myTeam
          ? <button className="tcard__btn tcard__btn--out" onClick={() => { playClick(); send('leave_team'); }}>{lang === 'pt' ? 'SAIR' : 'LEAVE'}</button>
          : <button className="tcard__btn tcard__btn--in" onClick={() => { playClick(); send('join_team', { teamId: team.id, role: 'calibrator' }); }}>{lang === 'pt' ? 'ENTRAR' : 'JOIN'}</button>
        }
      </div>
    </div>
  );
}

function MissionDock({ teams, players, me, lang, isHost, send, onPickShip, settings }) {
  const isSurvival = settings?.gameMode === 'survival';
  const numTeams = settings?.numTeams ?? 2;
  const fireRandomize = useCooldown(500);

  if (!isHost) return null;

  return (
    <div className="mdock panel bevel">

      {isHost && (
        <div className="mdock__settings">
          <span className="mdock__col-label t-title text-dim">{lang === 'pt' ? 'CONFIG' : 'CONFIG'}</span>
          <SettingRow
            label={lang === 'pt' ? 'PARTIDA' : 'MATCH'}
            options={['ffa', 'survival']}
            labels={['FFA', lang === 'pt' ? 'NAVES' : 'SHIPS']}
            value={settings.gameMode ?? 'ffa'}
            onChange={(v) => { playClick(); send('update_settings', { ...settings, gameMode: v }); }}
          />
          {!isSurvival && (
            <SettingRow
              label={t('rounds', lang)}
              options={[5, 7, 10]}
              value={settings.rounds}
              custom={{ min: 3, max: 30 }}
              onChange={(v) => { playClick(); send('update_settings', { ...settings, rounds: v }); }}
            />
          )}
          {isSurvival && (
            <>
              <SettingRow
                label={lang === 'pt' ? 'EQUIPES' : 'TEAMS'}
                options={[2, 3, 4]}
                value={numTeams}
                onChange={(v) => { playClick(); send('update_settings', { ...settings, numTeams: v }); }}
              />
              <SettingRow
                label={lang === 'pt' ? 'NAVEGADOR' : 'NAVIGATOR'}
                options={['fixed', 'rotating']}
                labels={lang === 'pt' ? ['FIXO', 'ROTATIVO'] : ['FIXED', 'ROTATING']}
                value={settings.navigatorMode ?? 'fixed'}
                onChange={(v) => { playClick(); send('update_settings', { ...settings, navigatorMode: v }); }}
              />
            </>
          )}
          <SettingRow
            label={t('clue_timer', lang)}
            options={[30, 60, 90]}
            value={settings.clueTimer}
            suffix="s"
            custom={{ min: 15, max: 120 }}
            onChange={(v) => { playClick(); send('update_settings', { ...settings, clueTimer: v }); }}
          />
          <SettingRow
            label={t('vote_timer', lang)}
            options={[30, 60, 90]}
            value={settings.voteTimer}
            suffix="s"
            custom={{ min: 15, max: 120 }}
            onChange={(v) => { playClick(); send('update_settings', { ...settings, voteTimer: v }); }}
          />
          <SettingRow
            label={lang === 'pt' ? 'BAROMETRO' : 'BAROMETER'}
            options={['random', 'choose']}
            labels={lang === 'pt' ? ['ALEATORIO', 'LIVRE'] : ['RANDOM', 'FREE']}
            value={settings.targetMode ?? 'random'}
            onChange={(v) => { playClick(); send('update_settings', { ...settings, targetMode: v }); }}
          />
          <SettingRow
            label={lang === 'pt' ? 'OPÇÕES' : 'OPTIONS'}
            options={[1, 3, 5]}
            value={settings.cardOptions ?? 3}
            onChange={(v) => { playClick(); send('update_settings', { ...settings, cardOptions: v }); }}
          />
        </div>
      )}

      {isSurvival && isHost && (
        <div className="mdock__randomize-row">
          <button className="mdock__rnd-btn" onClick={() => fireRandomize(() => { playClick(); send('randomize_teams'); })}>
            {lang === 'pt' ? 'ALEATORIZAR EQUIPES' : 'RANDOMIZE TEAMS'}
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player, me, transmitterId, lang, onPickShip, isHost, send, teams, isSurvival }) {
  const isNavigator = !isSurvival && player.id === transmitterId;
  const isMe = player.id === me?.id;
  const myTeam = isSurvival ? teams?.find(t => t.id === player.teamId) : null;
  const isTeamNav = player.teamRole === 'navigator';

  return (
    <article
      className={`lobby-crew-card panel bevel${isNavigator ? ' is-navigator' : ''}${isMe ? ' is-me' : ''}`}
      style={myTeam ? { '--team-color': myTeam.color, borderColor: myTeam.color } : {}}
    >
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
          glow={isNavigator || isMe || isTeamNav}
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
        {isSurvival && myTeam && (
          <div className="lobby-crew-card__team-tag" style={{ color: myTeam.color }}>
            {myTeam.name}{isTeamNav ? ' · NAV' : ' · CAL'}
          </div>
        )}
        {isSurvival && !myTeam && isMe && (
          <div className="lobby-crew-card__team-join">
            {teams?.map(t => (
              <button
                key={t.id}
                className="lobby-crew-card__join-btn"
                style={{ '--tc': t.color }}
                onClick={() => { playClick(); send('join_team', { teamId: t.id, role: 'calibrator' }); }}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lobby-crew-card__badges">
        {isNavigator && <span className="badge badge-captain">NAV</span>}
        {isMe && <span className="badge badge-you">{t('you', lang)}</span>}
        {player.isBot && <span className="badge badge-bot">BOT</span>}
        {!isSurvival && isHost && !player.isBot && !isNavigator && (
          <button
            className="btn btn-ghost btn-sm lobby-promote-btn"
            onClick={() => { playClick(); send('set_transmitter', { playerId: player.id }); }}
          >
            NAV
          </button>
        )}
        {isSurvival && isMe && myTeam && (
          <div className="lobby-crew-card__team-controls">
            <button
              className="lobby-crew-card__role-btn"
              onClick={() => { playClick(); send('join_team', { teamId: myTeam.id, role: isTeamNav ? 'calibrator' : 'navigator' }); }}
            >
              {isTeamNav ? '→CAL' : '→NAV'}
            </button>
            <button
              className="lobby-crew-card__leave-btn"
              onClick={() => { playClick(); send('leave_team'); }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function SettingRow({ label, options, labels, value, onChange, suffix = '', custom }) {
  const inputRef = useRef(null);
  const isCustomActive = custom && !options.includes(value);

  const commitCustom = (e) => {
    const num = parseInt(e.target.value, 10);
    if (!Number.isFinite(num)) { e.target.value = value; return; }
    const clamped = Math.max(custom.min, Math.min(custom.max, num));
    e.target.value = clamped;
    onChange(clamped);
  };

  return (
    <div className="srow">
      <span className="srow__label t-title">{label}</span>
      <div className="srow__strip">
        {options.map((option, i) => (
          <button
            key={option}
            className={`srow__opt${value === option ? ' srow__opt--on' : ''}`}
            onClick={() => {
              onChange(option);
              if (inputRef.current) inputRef.current.value = option;
            }}
          >
            {labels ? labels[i] : `${option}${suffix}`}
          </button>
        ))}
        {custom && (
          <label className={`srow__custom${isCustomActive ? ' srow__custom--on' : ''}`}>
            <input
              ref={inputRef}
              type="number"
              min={custom.min}
              max={custom.max}
              defaultValue={value}
              key={value}
              onBlur={commitCustom}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              onFocus={(e) => e.target.select()}
              title={`${custom.min}–${custom.max}${suffix}`}
            />
            {suffix && <span className="srow__custom-suffix">{suffix}</span>}
          </label>
        )}
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
  const isSurvival = settings?.gameMode === 'survival';
  const teams = gameState.teams || [];

  const canStart = isSurvival
    ? players.length >= 2 && teams.length >= 2 && teams.every(t => players.some(p => p.teamId === t.id))
    : players.length >= 2;
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
              <button className="btn btn-ghost btn-icon-only" onClick={() => { playClick(); onSettings?.(); }} title={lang === 'pt' ? 'Ajustes' : 'Settings'} aria-label={lang === 'pt' ? 'Ajustes' : 'Settings'}>
                <GearIcon size={15} />
              </button>
            </div>
          </section>

          <section className="lobby-brief-bar panel bevel">
            <div className="lobby-brief-bar__status">
              <span className="t-title text-dim" style={{ fontSize: 7 }}>{lang === 'pt' ? 'BRIEFING' : 'BRIEFING'}</span>
              <span className={`lobby-brief-bar__ready t-title${canStart ? ' glow-text-mint' : ' glow-text-amber'}`}>
                {missionReadyLabel}
              </span>
            </div>
            <div className="lobby-brief-bar__chips">
              <span className="lobby-brief-chip">
                <span className="t-title text-dim">{lang === 'pt' ? 'TRIPULAÇÃO' : 'CREW'}</span>
                <strong className="t-read">{players.length}</strong>
              </span>
              {!isSurvival && (
                <span className="lobby-brief-chip">
                  <span className="t-title text-dim">{t('rounds', lang)}</span>
                  <strong className="t-read">{settings.rounds}</strong>
                </span>
              )}
              {isSurvival && (
                <span className="lobby-brief-chip">
                  <span className="t-title text-dim">{lang === 'pt' ? 'EQUIPES' : 'TEAMS'}</span>
                  <strong className="t-read">{teams.length}</strong>
                </span>
              )}
              <span className="lobby-brief-chip">
                <span className="t-title text-dim">{lang === 'pt' ? 'MODO' : 'MODE'}</span>
                <strong className="t-read">{settings.cardMode === 'livre' ? (lang === 'pt' ? 'Livre' : 'Free') : (lang === 'pt' ? 'Tema' : 'Theme')}</strong>
              </span>
              <span className="lobby-brief-chip">
                <span className="t-title text-dim">{lang === 'pt' ? 'DICA' : 'CLUE'}</span>
                <strong className="t-read">{settings.clueTimer}s</strong>
              </span>
              <span className="lobby-brief-chip">
                <span className="t-title text-dim">{lang === 'pt' ? 'VOTO' : 'VOTE'}</span>
                <strong className="t-read">{settings.voteTimer}s</strong>
              </span>
              {!isSurvival && (
                <span className="lobby-brief-chip">
                  <span className="t-title text-dim">{lang === 'pt' ? 'NAV' : 'NAV'}</span>
                  <strong className="t-read" style={{ fontSize: 13 }}>{transmitter?.name || '?'}</strong>
                </span>
              )}
            </div>
            {me && (
              <button
                className="lobby-brief-bar__ship"
                onClick={() => { playClick(); setPickerOpen(true); }}
                title={lang === 'pt' ? 'Trocar nave' : 'Change ship'}
              >
                <ShipIcon ship={me.ship || 'nova_01'} color={me.shipColor || 'blue'} accent={me.shipAccent || 'cyan'} pixel={3} glow />
              </button>
            )}
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
                teams={teams}
                isSurvival={isSurvival}
              />
            ))}
          </section>
          {players.length < 2 && (
            <div className="lobby-waiting panel bevel">
              <div className="t-title glow-text-cyan">{lang === 'pt' ? 'AGUARDANDO MAIS UM PILOTO' : 'WAITING FOR ONE MORE PILOT'}</div>
              <div className="t-mono text-dim">{lang === 'pt' ? 'Compartilhe o codigo ou o link da sala.' : 'Share the room code or invite link.'}</div>
            </div>
          )}

          <MissionDock
            teams={teams}
            players={players}
            me={me}
            lang={lang}
            isHost={isHost}
            send={send}
            onPickShip={() => setPickerOpen(true)}
            settings={settings}
          />

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
