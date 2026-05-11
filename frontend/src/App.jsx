import React, { useState, useEffect, useRef, useCallback } from 'react';
import StarField from './components/StarField.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import Lobby from './components/Lobby.jsx';
import Roulette from './components/Roulette.jsx';
import PsychicPhase from './components/PsychicPhase.jsx';
import VotingPhase from './components/VotingPhase.jsx';
import RevealPhase from './components/RevealPhase.jsx';
import GameOver from './components/GameOver.jsx';
import ScoreBoard from './components/ScoreBoard.jsx';
import { t } from './i18n.js';
import { playPhaseChange, playVotingStart, playError as playSoundError } from './sounds.js';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('sp_lang') || 'pt');
  const [screen, setScreen] = useState('home'); // home | lobby | game
  const [gameState, setGameState] = useState(null);
  const [myId, setMyId] = useState(() => sessionStorage.getItem('sp_pid') || null);
  const [myRoomCode, setMyRoomCode] = useState(() => sessionStorage.getItem('sp_room') || null);
  const [myTargetPos, setMyTargetPos] = useState(null);
  const [connStatus, setConnStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const prevDamage = useRef([0, 0]);
  const prevPhase  = useRef(null);
  const soundReady = useRef(false);

  const showError = useCallback((msg) => {
    setError(msg);
    playSoundError();
    setTimeout(() => setError(null), 3500);
  }, []);

  const flash = useCallback((withDamage = false) => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 500);
    if (withDamage) {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 2500);
    }
  }, []);

  const send = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const handleMessage = useCallback((raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'room_state') {
      const state = msg.state;
      setGameState(prev => {
        if (prev && prev.phase !== state.phase) {
          const hadDamage = state.damage.some((d, i) => d > (prev?.damage?.[i] ?? 0));
          flash(hadDamage);
          // Phase-specific sounds
          if (state.phase === 'roulette') playPhaseChange();
          if (state.phase === 'voting')   playVotingStart();
          if (state.phase === 'psychic')  playPhaseChange();
        }
        prevPhase.current = state.phase;
        return state;
      });
      if (state.phase === 'lobby') setScreen('lobby');
      else setScreen('game');
      sessionStorage.setItem('sp_room', state.code);
      setMyRoomCode(state.code);
    } else if (msg.type === 'joined' || msg.type === 'reconnected') {
      setMyId(msg.playerId);
      sessionStorage.setItem('sp_pid', msg.playerId);
    } else if (msg.type === 'psychic_target') {
      setMyTargetPos(msg.targetPosition);
    } else if (msg.type === 'error') {
      const errKey = `err_${msg.message}`;
      showError(t(errKey, lang) !== errKey ? t(errKey, lang) : msg.message);
    }
  }, [lang, flash, showError]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
    }
    setConnStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnStatus('connected');
      clearTimeout(reconnectTimer.current);
      // Try to reconnect to existing session
      const pid = sessionStorage.getItem('sp_pid');
      const room = sessionStorage.getItem('sp_room');
      if (pid && room) {
        ws.send(JSON.stringify({ type: 'reconnect', playerId: pid, roomCode: room }));
      }
    };

    ws.onmessage = (e) => handleMessage(e.data);

    ws.onclose = () => {
      setConnStatus('disconnected');
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => { try { ws.close(); } catch {} };
  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('sp_lang', lang);
  }, [lang]);

  // Reset target when leaving psychic/voting
  useEffect(() => {
    if (gameState && !['psychic', 'voting', 'reveal'].includes(gameState.phase)) {
      setMyTargetPos(null);
    }
  }, [gameState?.phase]);

  const me = gameState?.players?.find(p => p.id === myId);
  const isHost = me?.id === gameState?.hostId;

  const sharedProps = { gameState, myId, lang, send, isHost, me };

  return (
    <>
      <StarField />
      {scanFlash && <div className="scanflash" />}
      {damageFlash && <div className="damage-overlay" />}

      {/* Error toast */}
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9995, padding: '10px 20px',
          border: '2px solid var(--red)', background: 'rgba(12,0,4,0.96)',
          color: 'var(--red)', fontFamily: 'var(--f-pixel)', fontSize: '8px',
          letterSpacing: '1px', borderRadius: '4px',
          boxShadow: 'var(--glow-r)', maxWidth: '90vw', textAlign: 'center',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Connection status indicator */}
      {connStatus !== 'connected' && (
        <div style={{
          position: 'fixed', bottom: 8, right: 8, zIndex: 9990,
          padding: '6px 10px', border: '1px solid var(--orange)',
          background: 'rgba(0,0,0,0.9)', color: 'var(--orange)',
          fontFamily: 'var(--f-pixel)', fontSize: '6px', borderRadius: '3px',
          letterSpacing: '1px',
        }}>
          {connStatus === 'disconnected' ? '● ' + t('reconnecting', lang) : '● ' + t('connecting', lang)}
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          {...sharedProps}
          lang={lang}
          setLang={setLang}
          connStatus={connStatus}
        />
      )}

      {screen === 'lobby' && gameState && (
        <Lobby
          {...sharedProps}
          lang={lang}
          setLang={setLang}
        />
      )}

      {screen === 'game' && gameState && (
        <div className="screen">
          <ScoreBoard {...sharedProps} />
          <div className="container" style={{ paddingTop: 16 }}>
            {gameState.phase === 'roulette' && (
              <Roulette {...sharedProps} myTargetPos={myTargetPos} />
            )}
            {gameState.phase === 'spinning' && (
              <Roulette {...sharedProps} myTargetPos={myTargetPos} spinning />
            )}
            {gameState.phase === 'psychic' && (
              <PsychicPhase {...sharedProps} myTargetPos={myTargetPos} />
            )}
            {gameState.phase === 'voting' && (
              <VotingPhase {...sharedProps} />
            )}
            {gameState.phase === 'reveal' && (
              <RevealPhase {...sharedProps} />
            )}
            {gameState.phase === 'gameover' && (
              <GameOver {...sharedProps} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
