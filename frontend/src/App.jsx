import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, ref, set, push, update, onValue, onDisconnect } from './firebase.js';
import { genId, normalizeRoom } from './gameData.js';
import { generateRoomCode, createRoom, addPlayerToRoom, GameEngine } from './gameEngine.js';
import StarField    from './components/StarField.jsx';
import HomeScreen   from './components/HomeScreen.jsx';
import Lobby        from './components/Lobby.jsx';
import Roulette     from './components/Roulette.jsx';
import PsychicPhase from './components/PsychicPhase.jsx';
import VotingPhase  from './components/VotingPhase.jsx';
import RevealPhase  from './components/RevealPhase.jsx';
import GameOver     from './components/GameOver.jsx';
import ScoreBoard   from './components/ScoreBoard.jsx';
import DevPanel     from './components/DevPanel.jsx';
import Settings     from './components/Settings.jsx';
import RoundIntro   from './components/RoundIntro.jsx';
import { t } from './i18n.js';
import { playPhaseChange, playVotingStart, playError as playSoundError } from './sounds.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

// Persist player ID across sessions
function getOrCreatePlayerId() {
  let id = sessionStorage.getItem('up_pid');
  if (!id) { id = genId(); sessionStorage.setItem('up_pid', id); }
  return id;
}

export default function App() {
  const [lang,        setLang]        = useState(() => localStorage.getItem('up_lang') || 'pt');
  const [screen,      setScreen]      = useState('home'); // home | lobby | game
  const [rawRoom,     setRawRoom]     = useState(null);   // raw Firebase snapshot
  const [myId]                        = useState(getOrCreatePlayerId);
  const [roomCode,    setRoomCode]    = useState(() => sessionStorage.getItem('up_room'));
  const [myTargetPos, setMyTargetPos] = useState(null);
  const [error,        setError]       = useState(null);
  const [scanFlash,    setScanFlash]   = useState(false);
  const [dmgFlash,     setDmgFlash]    = useState(false);
  const [status,       setStatus]      = useState('idle');
  const [showSettings,   setShowSettings]   = useState(false);
  const [showRoundIntro, setShowRoundIntro] = useState(false); // idle | connecting | connected | error

  const engineRef  = useRef(null);
  const prevPhase  = useRef(null);
  const presenceUnsub = useRef(null);

  // ── Derived state ─────────────────────────────────────────────────────────
  const gameState = rawRoom ? normalizeRoom(rawRoom) : null;
  const me        = gameState?.players?.find(p => p.id === myId);
  const isHost    = rawRoom?.hostId === myId;

  // ── Lang persistence ──────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('up_lang', lang); }, [lang]);

  // ── Error toast ───────────────────────────────────────────────────────────
  const showError = useCallback((msg) => {
    setError(msg); playSoundError();
    setTimeout(() => setError(null), 3500);
  }, []);

  const flash = useCallback((withDamage = false) => {
    setScanFlash(true); setTimeout(() => setScanFlash(false), 500);
    if (withDamage) { setDmgFlash(true); setTimeout(() => setDmgFlash(false), 2500); }
  }, []);

  // ── Subscribe to room in Firebase ─────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    setStatus('connecting');
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, snap => {
      const raw = snap.val();
      if (!raw) { setStatus('error'); showError(t('err_room_not_found', lang)); return; }
      setStatus('connected');
      setRawRoom(raw);

      // Screen routing
      if (raw.phase === 'lobby') setScreen('lobby');
      else setScreen('game');

      // Phase change effects
      if (prevPhase.current && prevPhase.current !== raw.phase) {
        const prev = prevPhase.current;
        const hadDamage = raw.damage0 > (rawRoom?.damage0 ?? 0) || raw.damage1 > (rawRoom?.damage1 ?? 0);
        flash(hadDamage);
        if (raw.phase === 'roulette') { playPhaseChange(); setShowRoundIntro(true); }
        if (raw.phase === 'spinning') setShowRoundIntro(false);
        if (raw.phase === 'voting')   playVotingStart();
        if (raw.phase === 'psychic')  playPhaseChange();
      }
      prevPhase.current = raw.phase;

      // Secret target — only visible to psychic
      if (raw.psychicId === myId && raw.psychicSecret?.targetPosition !== undefined) {
        setMyTargetPos(raw.psychicSecret.targetPosition);
      }
      if (!['psychic','voting','reveal'].includes(raw.phase)) setMyTargetPos(null);
    });

    // Player presence (Firebase onDisconnect marks offline)
    const playerRef = ref(db, `rooms/${roomCode}/players/${myId}`);
    const infoRef   = ref(db, '.info/connected');
    const presUnsub = onValue(infoRef, snap => {
      if (!snap.val()) return;
      update(playerRef, { connected: true });
      onDisconnect(playerRef).update({ connected: false });
    });
    presenceUnsub.current = presUnsub;

    return () => { unsub(); presUnsub(); };
  }, [roomCode]);

  // ── Run game engine when I'm the host ─────────────────────────────────────
  useEffect(() => {
    if (!isHost || !roomCode) return;
    const engine = new GameEngine(roomCode, myId);
    engine.start();
    engineRef.current = engine;
    return () => { engine.stop(); engineRef.current = null; };
  }, [isHost, roomCode]);

  // ── Action sender ─────────────────────────────────────────────────────────
  const send = useCallback((type, data = {}) => {
    if (!roomCode) return;
    push(ref(db, `rooms/${roomCode}/actions`), { type, ...data, by: myId, ts: Date.now() })
      .catch(err => showError(err.message));
  }, [roomCode, myId, showError]);

  // ── Create room ───────────────────────────────────────────────────────────
  const handleCreate = async (playerName) => {
    try {
      const code = await generateRoomCode();
      await createRoom(code, myId, playerName);
      sessionStorage.setItem('up_room', code);
      setRoomCode(code);
    } catch (e) { showError(e.message); }
  };

  // ── Join room ─────────────────────────────────────────────────────────────
  const handleJoin = async (code, playerName) => {
    const upper = code.toUpperCase();
    const result = await addPlayerToRoom(upper, myId, playerName);
    if (result.error) { showError(t(`err_${result.error}`, lang)); return; }
    if (result.rejoin) {
      // Rejoin with existing ID
      sessionStorage.setItem('up_pid', result.playerId);
    }
    sessionStorage.setItem('up_room', upper);
    setRoomCode(upper);
  };

  const sharedProps = { gameState, myId, lang, send, isHost, me };

  const hideIntro = useCallback(() => setShowRoundIntro(false), []);

  const leaveRoom = () => {
    sessionStorage.removeItem('up_room');
    sessionStorage.removeItem('up_pid');
    setRoomCode(null);
    setRawRoom(null);
    setScreen('home');
    setShowSettings(false);
  };

  return (
    <>
      <StarField />
      {scanFlash && <div className="scanflash" />}
      {dmgFlash  && <div className="damage-overlay" />}

      {/* Error toast */}
      {error && (
        <div style={{
          position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
          zIndex:9995, padding:'10px 20px',
          border:'2px solid var(--red)', background:'rgba(12,0,4,.96)',
          color:'var(--red)', fontFamily:'var(--f-pixel)', fontSize:'9px',
          letterSpacing:'1px', borderRadius:'4px', boxShadow:'var(--glow-r)',
          maxWidth:'90vw', textAlign:'center',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Dev panel */}
      {DEV_MODE && <DevPanel gameState={gameState} myId={myId} send={send} isHost={isHost} />}

      {/* Round intro overlay */}
      {showRoundIntro && gameState && (
        <RoundIntro
          gameState={gameState}
          myId={myId}
          lang={lang}
          onDone={hideIntro}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <Settings
          lang={lang}
          setLang={setLang}
          onLeaveRoom={screen !== 'home' ? leaveRoom : null}
          onClose={() => setShowSettings(false)}
          inGame={screen !== 'home'}
        />
      )}

      {screen === 'home' && (
        <HomeScreen lang={lang} setLang={setLang} onCreate={handleCreate} onJoin={handleJoin} />
      )}

      {screen === 'lobby' && gameState && (
        <Lobby {...sharedProps} lang={lang} setLang={setLang} onSettings={() => setShowSettings(true)} />
      )}

      {screen === 'game' && gameState && (
        <div className="screen">
          <ScoreBoard {...sharedProps} onSettings={() => setShowSettings(true)} />
          <div className="container" style={{ paddingTop:16 }}>
            {(gameState.phase==='roulette'||gameState.phase==='spinning') && (
              <Roulette {...sharedProps} spinning={gameState.phase==='spinning'} />
            )}
            {gameState.phase==='psychic' && (
              <PsychicPhase {...sharedProps} myTargetPos={myTargetPos} />
            )}
            {gameState.phase==='voting' && <VotingPhase {...sharedProps} />}
            {gameState.phase==='reveal' && <RevealPhase {...sharedProps} />}
            {gameState.phase==='gameover' && <GameOver {...sharedProps} />}
          </div>
        </div>
      )}
    </>
  );
}
