import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db, ref, push, update, onValue, onDisconnect } from './firebase.js';
import { genId, normalizeRoom } from './gameData.js';
import { generateRoomCode, createRoom, addPlayerToRoom, GameEngine } from './gameEngine.js';
import StarField from './components/StarField.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import Lobby from './components/Lobby.jsx';
import Roulette from './components/Roulette.jsx';
import PsychicPhase from './components/PsychicPhase.jsx';
import CardPicker from './components/CardPicker.jsx';
import VotingPhase from './components/VotingPhase.jsx';
import RevealPhase from './components/RevealPhase.jsx';
import GameOver from './components/GameOver.jsx';
import DevPanel from './components/DevPanel.jsx';
import Settings from './components/Settings.jsx';
import RoundIntro from './components/RoundIntro.jsx';
import ShipShowroom from './components/ShipShowroom.jsx';
import RouletteStyleLab from './components/RouletteStyleLab.jsx';
import RouletteStyleLab2 from './components/RouletteStyleLab2.jsx';
import GaugeLab from './components/GaugeLab.jsx';
import BackgroundLab from './components/BackgroundLab.jsx';
import { RankingSidebar, RankingTopBar } from './components/RankingSidebar.jsx';
import { t, tCard } from './i18n.js';
import { playPhaseChange, playVotingStart, playError as playSoundError } from './sounds.js';

const SEARCH_PARAMS = new URLSearchParams(window.location.search);
const DEV_MODE = SEARCH_PARAMS.has('dev');
const SHIPYARD_MODE = SEARCH_PARAMS.has('shipyard');
const ROULETTE_LAB_MODE = SEARCH_PARAMS.has('rouletteLab') || SEARCH_PARAMS.has('roletas');
const ROULETTE_LAB2_MODE = SEARCH_PARAMS.has('roletas2');
const GAUGE_LAB_MODE = SEARCH_PARAMS.has('gauge') || SEARCH_PARAMS.has('manometro');
const BACKGROUND_LAB_MODE = SEARCH_PARAMS.has('backgrounds') || SEARCH_PARAMS.has('fundos') || SEARCH_PARAMS.has('bg');
const SPECIAL_MODE = SHIPYARD_MODE || ROULETTE_LAB_MODE || ROULETTE_LAB2_MODE || GAUGE_LAB_MODE || BACKGROUND_LAB_MODE;

function normalizeRoomCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

const INVITE_ROOM = normalizeRoomCode(SEARCH_PARAMS.get('room'));

function getOrCreatePlayerId() {
  let id = sessionStorage.getItem('up_pid');
  if (!id) {
    id = genId();
    sessionStorage.setItem('up_pid', id);
  }
  return id;
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('up_lang') || 'pt');
  const [screen, setScreen] = useState('home');
  const [rawRoom, setRawRoom] = useState(null);
  const [myId, setMyId] = useState(getOrCreatePlayerId);
  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem('up_room'));
  const [myTargetPos, setMyTargetPos] = useState(null);
  const [error, setError] = useState(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [, setStatus] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showRoundIntro, setShowRoundIntro] = useState(false);

  const engineRef = useRef(null);
  const prevPhase = useRef(null);
  const prevRoom = useRef(null);

  const gameState = useMemo(() => (rawRoom ? normalizeRoom(rawRoom) : null), [rawRoom]);
  const me = gameState?.players?.find((player) => player.id === myId);
  const isHost = rawRoom?.hostId === myId;
  const activeTransmitterId = gameState?.psychicId || gameState?.transmitterId;
  const activeTransmitter = gameState?.players?.find((player) => player.id === activeTransmitterId);
  const phaseLabel = gameState
    ? ({
        roulette: lang === 'pt' ? 'Roleta' : 'Roulette',
        spinning: lang === 'pt' ? 'Girando' : 'Spinning',
        pick_card: lang === 'pt' ? 'Escolha' : 'Pick',
        psychic: lang === 'pt' ? 'Transmissao' : 'Transmission',
        voting: lang === 'pt' ? 'Votacao' : 'Voting',
        reveal: lang === 'pt' ? 'Resultado' : 'Results',
        gameover: lang === 'pt' ? 'Final' : 'Final',
      }[gameState.phase] || gameState.phase)
    : '';
  const currentPhase = gameState?.phase;
  const roundNumber = (gameState?.round ?? 0) + 1;
  const totalRounds = gameState?.totalRounds ?? '?';
  const totalRoundsNumber = Number(gameState?.totalRounds || 1);
  const isTransmitter = activeTransmitterId === myId;
  const canRevealRoundPayload = !!gameState && !['roulette', 'spinning'].includes(currentPhase);
  const publicTheme = canRevealRoundPayload ? gameState.currentTheme : null;
  const publicCard = canRevealRoundPayload ? gameState.currentCard : null;
  const publicClue = ['voting', 'reveal'].includes(currentPhase) ? gameState?.clue : null;
  const phaseActionLabel = gameState
    ? ({
        roulette: isTransmitter
          ? (lang === 'pt' ? 'Gire a roleta' : 'Spin the wheel')
          : (lang === 'pt' ? 'Aguardando giro' : 'Waiting for spin'),
        spinning: lang === 'pt' ? 'Sinal selado' : 'Signal sealed',
        psychic: isTransmitter
          ? (lang === 'pt' ? 'Envie a dica' : 'Send the clue')
          : (lang === 'pt' ? 'Aguardando dica' : 'Waiting for clue'),
        voting: isTransmitter
          ? (lang === 'pt' ? 'Equipe calibrando' : 'Crew calibrating')
          : (lang === 'pt' ? 'Calibre o gauge' : 'Calibrate gauge'),
        reveal: lang === 'pt' ? 'Resultado aberto' : 'Results open',
      }[currentPhase] || phaseLabel)
    : '';
  const backgroundVariant = !SPECIAL_MODE && screen === 'game'
    ? 'game'
    : !SPECIAL_MODE && screen === 'home'
      ? 'home'
      : 'menu';

  useEffect(() => {
    localStorage.setItem('up_lang', lang);
  }, [lang]);

  const showError = useCallback((message) => {
    setError(message);
    playSoundError();
    setTimeout(() => setError(null), 3500);
  }, []);

  const flash = useCallback(() => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 500);
  }, []);

  const clearActiveRoom = useCallback(() => {
    sessionStorage.removeItem('up_room');
    setRoomCode(null);
    setRawRoom(null);
    setScreen('home');
    setShowSettings(false);
    setShowRoundIntro(false);
    setMyTargetPos(null);
    prevPhase.current = null;
    prevRoom.current = null;
  }, []);

  useEffect(() => {
    if (!roomCode) return undefined;

    setStatus('connecting');
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      const raw = snap.val();
      if (!raw) {
        setStatus('error');
        clearActiveRoom();
        showError(t('err_room_not_found', lang));
        return;
      }

      setStatus('connected');
      setRawRoom(raw);
      setScreen(raw.phase === 'lobby' ? 'lobby' : 'game');
      const roundIntroUntil = Number(raw.roundIntroUntil || 0);
      const shouldShowRoundIntro = (raw.phase === 'roulette' || raw.phase === 'pick_card') && roundIntroUntil > Date.now();

      if (prevPhase.current && prevPhase.current !== raw.phase) {
        flash();
        if (raw.phase === 'roulette' || raw.phase === 'pick_card') {
          playPhaseChange();
        }
        if (raw.phase === 'voting') playVotingStart();
        if (raw.phase === 'psychic') playPhaseChange();
      }
      setShowRoundIntro(shouldShowRoundIntro);

      prevPhase.current = raw.phase;
      prevRoom.current = raw;

      if (raw.psychicId === myId && raw.psychicSecret?.targetPosition !== undefined) {
        setMyTargetPos(raw.psychicSecret.targetPosition);
      }
      if (!['psychic', 'voting', 'reveal'].includes(raw.phase)) {
        setMyTargetPos(null);
      }
    });

    const playerRef = ref(db, `rooms/${roomCode}/players/${myId}`);
    const infoRef = ref(db, '.info/connected');
    const presUnsub = onValue(infoRef, (snap) => {
      if (!snap.val()) return;
      update(playerRef, { connected: true });
      onDisconnect(playerRef).update({ connected: false, disconnectedAt: Date.now() });
    });

    const markOffline = () => {
      update(playerRef, { connected: false, disconnectedAt: Date.now() }).catch(() => {});
    };
    window.addEventListener('pagehide', markOffline);
    window.addEventListener('beforeunload', markOffline);

    return () => {
      unsub();
      presUnsub();
      window.removeEventListener('pagehide', markOffline);
      window.removeEventListener('beforeunload', markOffline);
    };
  }, [roomCode, myId, lang, showError, flash, clearActiveRoom]);

  useEffect(() => {
    if (!rawRoom || !roomCode) return;
    const players = Object.values(rawRoom.players || {});
    const connectedHumans = players
      .filter((player) => !player.isBot && player.connected !== false)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const nextHost = connectedHumans[0];
    const currentHost = rawRoom.players?.[rawRoom.hostId];

    if (!nextHost || nextHost.id !== myId || currentHost?.connected !== false) return;

    const roomUpdates = {
      [`rooms/${roomCode}/hostId`]: nextHost.id,
      [`rooms/${roomCode}/players/${nextHost.id}/isHost`]: true,
    };

    if (rawRoom.hostId) {
      roomUpdates[`rooms/${roomCode}/players/${rawRoom.hostId}/isHost`] = false;
    }
    if (rawRoom.phase === 'lobby' && rawRoom.transmitterId === rawRoom.hostId) {
      roomUpdates[`rooms/${roomCode}/transmitterId`] = nextHost.id;
    }

    update(ref(db), roomUpdates).catch(() => {});
  }, [rawRoom, roomCode, myId]);

  useEffect(() => {
    if (!isHost || !roomCode) return undefined;
    const engine = new GameEngine(roomCode, myId);
    engine.start();
    engineRef.current = engine;
    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [isHost, roomCode, myId]);

  const send = useCallback((type, data = {}) => {
    if (!roomCode) return;
    push(ref(db, `rooms/${roomCode}/actions`), { type, ...data, by: myId, ts: Date.now() })
      .catch((err) => showError(err.message));
  }, [roomCode, myId, showError]);

  const handleCreate = async (playerName, loadout = {}) => {
    try {
      sessionStorage.setItem('up_pid', myId);
      const code = await generateRoomCode();
      await createRoom(code, myId, playerName, loadout);
      sessionStorage.setItem('up_room', code);
      setRoomCode(code);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleJoin = async (code, playerName, loadout = {}) => {
    const upper = normalizeRoomCode(code);
    const result = await addPlayerToRoom(upper, myId, playerName, loadout);
    if (result.error) {
      showError(t(`err_${result.error}`, lang));
      return;
    }
    if (result.rejoin) {
      sessionStorage.setItem('up_pid', result.playerId);
      setMyId(result.playerId);
    } else {
      sessionStorage.setItem('up_pid', myId);
    }
    sessionStorage.setItem('up_room', upper);
    setRoomCode(upper);
  };

  const sharedProps = { gameState, myId, lang, send, isHost, me };

  const hideIntro = useCallback(() => setShowRoundIntro(false), []);

  const leaveRoom = async () => {
    if (roomCode && rawRoom?.players?.[myId]) {
      const players = Object.values(rawRoom.players || {});
      const nextHost = isHost
        ? players.find((player) => player.id !== myId && player.connected) ||
          players.find((player) => player.id !== myId)
        : null;
      const roomUpdates = {
        [`rooms/${roomCode}/players/${myId}/connected`]: false,
        [`rooms/${roomCode}/players/${myId}/isHost`]: false,
      };

      if (nextHost) {
        roomUpdates[`rooms/${roomCode}/hostId`] = nextHost.id;
        roomUpdates[`rooms/${roomCode}/players/${nextHost.id}/isHost`] = true;
        if (rawRoom.transmitterId === myId) {
          roomUpdates[`rooms/${roomCode}/transmitterId`] = nextHost.id;
        }
      }

      await update(ref(db), roomUpdates).catch(() => {});
    }

    clearActiveRoom();
  };

  return (
    <>
      <StarField variant={backgroundVariant} />
      {scanFlash && <div className="scanflash" />}


      {error && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9995,
            padding: '10px 20px',
            border: '2px solid var(--red)',
            background: 'rgba(12,0,4,.96)',
            color: 'var(--red)',
            fontFamily: 'var(--f-pixel)',
            fontSize: '9px',
            letterSpacing: '1px',
            borderRadius: '4px',
            boxShadow: 'var(--glow-r)',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          ! {error}
        </div>
      )}

      {DEV_MODE && <DevPanel gameState={gameState} myId={myId} send={send} isHost={isHost} />}

      {showRoundIntro && gameState && (
        <RoundIntro
          gameState={gameState}
          myId={myId}
          lang={lang}
          onDone={hideIntro}
        />
      )}

      {showSettings && (
        <Settings
          lang={lang}
          setLang={setLang}
          onLeaveRoom={screen !== 'home' ? leaveRoom : null}
          onClose={() => setShowSettings(false)}
          inGame={screen !== 'home'}
        />
      )}

      {SHIPYARD_MODE && <ShipShowroom />}
      {ROULETTE_LAB_MODE && <RouletteStyleLab />}
      {ROULETTE_LAB2_MODE && <RouletteStyleLab2 />}
      {GAUGE_LAB_MODE && <GaugeLab />}
      {BACKGROUND_LAB_MODE && <BackgroundLab />}

      {!SPECIAL_MODE && screen === 'home' && (
        <HomeScreen
          lang={lang}
          setLang={setLang}
          onCreate={handleCreate}
          onJoin={handleJoin}
          inviteCode={INVITE_ROOM}
        />
      )}

      {!SPECIAL_MODE && screen === 'lobby' && gameState && (
        <Lobby {...sharedProps} lang={lang} setLang={setLang} onSettings={() => setShowSettings(true)} />
      )}

      {!SPECIAL_MODE && screen === 'game' && gameState && (
        <div className="game-shell">
          {gameState.phase === 'gameover' ? (
            <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
              <GameOver {...sharedProps} onLeave={leaveRoom} />
            </div>
          ) : (
            <>
              <div className="game-mobile-topbar">
                <RankingTopBar {...sharedProps} onSettings={() => setShowSettings(true)} />
              </div>

              <div className="game-frame">
                <aside className="game-rail">
                  <div className="game-rail-card game-rail-card--status panel bevel glow-cyan">
                    <div className="game-rail-row">
                      <span className="t-title text-dim">{lang === 'pt' ? 'SALA' : 'ROOM'}</span>
                      <strong className="t-read glow-text-cyan">{gameState.code}</strong>
                    </div>
                    <div className="game-rail-progress" aria-label={lang === 'pt' ? 'Progresso da partida' : 'Match progress'}>
                      <span style={{ width: `${Math.max(6, Math.min(100, (roundNumber / totalRoundsNumber) * 100))}%` }} />
                    </div>
                    <div className="game-rail-meta game-rail-meta--inline">
                      <span>{lang === 'pt' ? 'Rodada' : 'Round'} {roundNumber}/{totalRounds}</span>
                      <span>{phaseLabel}</span>
                    </div>
                  </div>

                  <div className="game-rail-card game-rail-card--signal panel bevel glow-amber">
                    <div className="t-title text-dim" style={{ fontSize: 7 }}>
                      {lang === 'pt' ? 'COMANDO' : 'COMMAND'}
                    </div>
                    <div className="game-rail-transmitter">{activeTransmitter?.name || '?'}</div>
                    <div className="game-rail-action">{phaseActionLabel}</div>
                  </div>

                  <div className={`game-rail-card game-rail-card--intel panel bevel${publicTheme ? ' glow-cyan' : ''}`}>
                    <div className="t-title text-dim" style={{ fontSize: 7 }}>
                      {lang === 'pt' ? 'DADOS DA RODADA' : 'ROUND DATA'}
                    </div>
                    {publicTheme ? (
                      <>
                        <div className="game-rail-theme" style={{ color: publicTheme.color }}>
                          {lang === 'en' ? publicTheme.shortEN : publicTheme.shortPT}
                        </div>
                        <div className="game-rail-theme-name">
                          {lang === 'en' ? publicTheme.nameEN : publicTheme.namePT}
                        </div>
                      </>
                    ) : (
                      <div className="game-rail-sealed">
                        <b>{lang === 'pt' ? 'SINAL SELADO' : 'SIGNAL SEALED'}</b>
                        <span>{lang === 'pt' ? 'Tema oculto ate a roleta travar.' : 'Theme hidden until the wheel locks.'}</span>
                      </div>
                    )}
                  </div>

                  {publicCard && (
                    <div className="game-rail-card game-rail-card--spectrum panel bevel">
                      <div className="t-title text-dim" style={{ fontSize: 7 }}>
                        {lang === 'pt' ? 'ESPECTRO' : 'SPECTRUM'}
                      </div>
                      <div className="game-rail-spectrum">
                        <span>{publicCard[lang === 'en' ? 'lE' : 'lP']}</span>
                        <i />
                        <span>{publicCard[lang === 'en' ? 'rE' : 'rP']}</span>
                      </div>
                    </div>
                  )}

                  {publicClue && (
                    <div className="game-rail-card game-rail-card--clue panel bevel glow-mint">
                      <div className="t-title text-dim" style={{ fontSize: 7 }}>
                        {lang === 'pt' ? 'DICA TRANSMITIDA' : 'TRANSMITTED CLUE'}
                      </div>
                      <div className="game-rail-clue">{publicClue}</div>
                    </div>
                  )}
                </aside>

                <main className="game-main">
                  <div className="game-stage">
                    {!showRoundIntro && gameState.phase === 'pick_card' && (
                      <CardPicker {...sharedProps} />
                    )}
                    {!showRoundIntro && (gameState.phase === 'roulette' || gameState.phase === 'spinning') && gameState.settings?.cardMode !== 'livre' && (
                      <Roulette {...sharedProps} spinning={gameState.phase === 'spinning'} />
                    )}
                    {gameState.phase === 'spinning' && gameState.settings?.cardMode === 'livre' && gameState.currentCard && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 20, width: '100%' }}>
                        <div className="panel bevel glow-cyan" style={{
                          padding: '20px 28px', textAlign: 'center', width: 'min(520px, 100%)',
                          animation: 'theme-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                        }}>
                          <div className="t-title text-dim" style={{ fontSize: 9, marginBottom: 12 }}>
                            {lang === 'pt' ? 'CARTA SELECIONADA' : 'CARD SELECTED'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 15, color: 'rgba(0,170,255,0.9)' }}>
                              ◀ {tCard(gameState.currentCard, 'left', lang)}
                            </span>
                            <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>────</span>
                            <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 15, color: 'rgba(255,51,85,0.9)', textAlign: 'right' }}>
                              {tCard(gameState.currentCard, 'right', lang)} ▶
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {!showRoundIntro && gameState.phase === 'psychic' && (
                      <PsychicPhase {...sharedProps} myTargetPos={myTargetPos} />
                    )}
                    {!showRoundIntro && gameState.phase === 'voting' && <VotingPhase {...sharedProps} />}
                    {!showRoundIntro && gameState.phase === 'reveal' && <RevealPhase {...sharedProps} />}
                  </div>
                </main>

                <div className="game-sidebar-wrap">
                  <RankingSidebar {...sharedProps} onSettings={() => setShowSettings(true)} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
