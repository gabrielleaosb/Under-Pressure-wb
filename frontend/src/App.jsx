import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db, ref, push, update, onValue, onDisconnect } from './firebase.js';
import { genId, normalizeRoom } from './gameData.js';
import { generateRoomCode, createRoom, addPlayerToRoom, GameEngine } from './gameEngine.js';
import StarField from './components/StarField.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import Lobby from './components/Lobby.jsx';
import Roulette from './components/Roulette.jsx';
import PsychicPhase from './components/PsychicPhase.jsx';
import VotingPhase from './components/VotingPhase.jsx';
import RevealPhase from './components/RevealPhase.jsx';
import GameOver from './components/GameOver.jsx';
import DevPanel from './components/DevPanel.jsx';
import Settings from './components/Settings.jsx';
import RoundIntro from './components/RoundIntro.jsx';
import ShipShowroom from './components/ShipShowroom.jsx';
import { RankingSidebar, RankingTopBar } from './components/RankingSidebar.jsx';
import { t } from './i18n.js';
import { playPhaseChange, playVotingStart, playError as playSoundError } from './sounds.js';

const SEARCH_PARAMS = new URLSearchParams(window.location.search);
const DEV_MODE = SEARCH_PARAMS.has('dev');
const SHIPYARD_MODE = SEARCH_PARAMS.has('shipyard');

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
  const [dmgFlash, setDmgFlash] = useState(false);
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
        psychic: lang === 'pt' ? 'Transmissao' : 'Transmission',
        voting: lang === 'pt' ? 'Votacao' : 'Voting',
        reveal: lang === 'pt' ? 'Resultado' : 'Results',
        gameover: lang === 'pt' ? 'Final' : 'Final',
      }[gameState.phase] || gameState.phase)
    : '';

  useEffect(() => {
    localStorage.setItem('up_lang', lang);
  }, [lang]);

  const showError = useCallback((message) => {
    setError(message);
    playSoundError();
    setTimeout(() => setError(null), 3500);
  }, []);

  const flash = useCallback((withDamage = false) => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 500);
    if (withDamage) {
      setDmgFlash(true);
      setTimeout(() => setDmgFlash(false), 2500);
    }
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

      if (prevPhase.current && prevPhase.current !== raw.phase) {
        const previousRoom = prevRoom.current;
        const hadDamage =
          (raw.damage0 ?? 0) > (previousRoom?.damage0 ?? 0) ||
          (raw.damage1 ?? 0) > (previousRoom?.damage1 ?? 0);
        flash(hadDamage);
        if (raw.phase === 'roulette') {
          playPhaseChange();
          setShowRoundIntro(true);
        }
        if (raw.phase === 'spinning') setShowRoundIntro(false);
        if (raw.phase === 'voting') playVotingStart();
        if (raw.phase === 'psychic') playPhaseChange();
      }

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
      onDisconnect(playerRef).update({ connected: false });
    });

    return () => {
      unsub();
      presUnsub();
    };
  }, [roomCode, myId, lang, showError, flash, clearActiveRoom]);

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

  const handleCreate = async (playerName) => {
    try {
      sessionStorage.setItem('up_pid', myId);
      const code = await generateRoomCode();
      await createRoom(code, myId, playerName);
      sessionStorage.setItem('up_room', code);
      setRoomCode(code);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleJoin = async (code, playerName) => {
    const upper = normalizeRoomCode(code);
    const result = await addPlayerToRoom(upper, myId, playerName);
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
      <StarField />
      {scanFlash && <div className="scanflash" />}
      {dmgFlash && <div className="damage-overlay" />}

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

      {!SHIPYARD_MODE && screen === 'home' && (
        <HomeScreen
          lang={lang}
          setLang={setLang}
          onCreate={handleCreate}
          onJoin={handleJoin}
          inviteCode={INVITE_ROOM}
        />
      )}

      {!SHIPYARD_MODE && screen === 'lobby' && gameState && (
        <Lobby {...sharedProps} lang={lang} setLang={setLang} onSettings={() => setShowSettings(true)} />
      )}

      {!SHIPYARD_MODE && screen === 'game' && gameState && (
        <div className="game-shell">
          {gameState.phase === 'gameover' ? (
            <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
              <GameOver {...sharedProps} />
            </div>
          ) : (
            <>
              <div className="game-mobile-topbar">
                <RankingTopBar {...sharedProps} onSettings={() => setShowSettings(true)} />
              </div>

              <div className="game-frame">
                <aside className="game-rail">
                  <div className="game-rail-card panel bevel glow-cyan">
                    <div className="t-title text-dim" style={{ fontSize: 7 }}>
                      {lang === 'pt' ? 'SALA' : 'ROOM'}
                    </div>
                    <div className="t-read glow-text-cyan" style={{ fontSize: 28, lineHeight: 1, marginTop: 6 }}>
                      {gameState.code}
                    </div>
                    <div className="game-rail-meta">
                      <span>{lang === 'pt' ? 'Rodada' : 'Round'} {(gameState.round ?? 0) + 1}/{gameState.totalRounds}</span>
                      <span>{lang === 'pt' ? 'Fase' : 'Phase'} {phaseLabel}</span>
                    </div>
                  </div>

                  <div className="game-rail-card panel bevel glow-amber">
                    <div className="t-title text-dim" style={{ fontSize: 7 }}>
                      {lang === 'pt' ? 'TRANSMISSOR' : 'TRANSMITTER'}
                    </div>
                    <div className="t-read glow-text-amber" style={{ fontSize: 26, lineHeight: 1, marginTop: 8 }}>
                      {activeTransmitter?.name || '?'}
                    </div>
                    <div className="game-rail-meta">
                      <span>
                        {gameState.phase === 'psychic' && activeTransmitterId === myId
                          ? (lang === 'pt' ? 'Sua vez' : 'Your turn')
                          : (lang === 'pt' ? 'Canal ativo' : 'Active channel')}
                      </span>
                    </div>
                  </div>

                  {gameState.currentTheme && (
                    <div className="game-rail-card panel bevel">
                      <div className="t-title text-dim" style={{ fontSize: 7 }}>
                        {lang === 'pt' ? 'TEMA' : 'THEME'}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--f-body)',
                          fontSize: 13,
                          fontWeight: 900,
                          color: gameState.currentTheme.color,
                          marginTop: 10,
                          letterSpacing: 1.5,
                        }}
                      >
                        {lang === 'en' ? gameState.currentTheme.shortEN : gameState.currentTheme.shortPT}
                      </div>
                      <div className="t-title" style={{ fontSize: 8, color: 'var(--ink)', marginTop: 10 }}>
                        {lang === 'en' ? gameState.currentTheme.nameEN : gameState.currentTheme.namePT}
                      </div>
                    </div>
                  )}

                  {gameState.currentCard && (
                    <div className="game-rail-card panel bevel">
                      <div className="t-title text-dim" style={{ fontSize: 7 }}>
                        {lang === 'pt' ? 'ESPECTRO' : 'SPECTRUM'}
                      </div>
                      <div className="game-rail-meta" style={{ marginTop: 12 }}>
                        <span>{gameState.currentCard[lang === 'en' ? 'lE' : 'lP']}</span>
                        <span>{gameState.currentCard[lang === 'en' ? 'rE' : 'rP']}</span>
                      </div>
                    </div>
                  )}

                  {gameState.clue && (
                    <div className="game-rail-card panel bevel glow-mint">
                      <div className="t-title text-dim" style={{ fontSize: 7 }}>
                        {lang === 'pt' ? 'DICA' : 'CLUE'}
                      </div>
                      <div className="game-rail-clue">{gameState.clue}</div>
                    </div>
                  )}
                </aside>

                <main className="game-main">
                  <div className="game-stage">
                    {(gameState.phase === 'roulette' || gameState.phase === 'spinning') && (
                      <Roulette {...sharedProps} spinning={gameState.phase === 'spinning'} />
                    )}
                    {gameState.phase === 'psychic' && (
                      <PsychicPhase {...sharedProps} myTargetPos={myTargetPos} />
                    )}
                    {gameState.phase === 'voting' && <VotingPhase {...sharedProps} />}
                    {gameState.phase === 'reveal' && <RevealPhase {...sharedProps} />}
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
