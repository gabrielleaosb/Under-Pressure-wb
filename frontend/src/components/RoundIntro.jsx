import React, { useEffect, useRef, useState } from 'react';
import { ShipIcon } from './ShipRoster.jsx';

const DEFAULT_DURATION = 4600;

export default function RoundIntro({ gameState, myId, lang, onDone }) {
  const [closing, setClosing] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const until = Number(gameState.roundIntroUntil || 0);
    const remaining = until ? Math.max(0, until - Date.now()) : DEFAULT_DURATION;
    if (remaining <= 0) {
      onDoneRef.current?.();
      return undefined;
    }

    const closeTimer = setTimeout(() => setClosing(true), Math.max(0, remaining - 320));
    const doneTimer = setTimeout(() => onDoneRef.current?.(), remaining);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(doneTimer);
    };
  }, [gameState.roundIntroUntil]);

  const transmitter = gameState.players?.find((player) => player.id === gameState.psychicId);
  const isTransmitter = myId === gameState.psychicId;
  const round = String((gameState.round ?? 0) + 1).padStart(2, '0');
  const total = String(gameState.totalRounds ?? '?').padStart(2, '0');
  const cardMode = gameState.settings?.cardMode ?? 'themed';
  const missionStatus = isTransmitter
    ? (cardMode === 'livre'
        ? (lang === 'pt' ? 'Escolha a carta e transmita' : 'Pick a card and transmit')
        : (lang === 'pt' ? 'Controle da roleta liberado' : 'Roulette control granted'))
    : (cardMode === 'livre'
        ? (lang === 'pt' ? 'Aguardando o navegador' : 'Waiting for navigator')
        : (lang === 'pt' ? 'Aguardando giro do navegador' : 'Waiting for navigator spin'));

  return (
    <div
      className={`round-brief${closing ? ' round-brief--closing' : ''}`}
      aria-live="polite"
      style={{ '--round-brief-duration': `${DEFAULT_DURATION}ms` }}
    >
      <div className="round-brief__stars" />
      <div className="round-brief__scan" />
      <div className="round-brief__horizon" />
      <div className="round-brief__frame">
        <div className="round-brief__ship">
          <ShipIcon
            ship={transmitter?.ship || 'nova_01'}
            color={transmitter?.shipColor || 'amber'}
            accent={transmitter?.shipAccent || 'cyan'}
            pixel={6}
            glow
          />
        </div>

        <div className="round-brief__content">
          <div className="round-brief__kicker">
            {lang === 'pt' ? 'MISSAO INICIADA' : 'MISSION LAUNCH'}
          </div>
          <div className="round-brief__main">
            <span>RD {round}/{total}</span>
            <b>{transmitter?.name || '?'}</b>
          </div>
          <div className="round-brief__task">{missionStatus}</div>

          <div className="round-brief__launch-bar">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
