import React, { useEffect, useRef, useState } from 'react';

const DURATION = 1900;

export default function RoundIntro({ gameState, myId, lang, onDone }) {
  const [closing, setClosing] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const closeTimer = setTimeout(() => setClosing(true), DURATION - 260);
    const doneTimer = setTimeout(() => onDoneRef.current?.(), DURATION);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const transmitter = gameState.players?.find((player) => player.id === gameState.psychicId);
  const isTransmitter = myId === gameState.psychicId;
  const round = String((gameState.round ?? 0) + 1).padStart(2, '0');
  const total = String(gameState.totalRounds ?? '?').padStart(2, '0');

  return (
    <div className={`round-brief${closing ? ' round-brief--closing' : ''}`} aria-live="polite">
      <div className="round-brief__scan" />
      <div className="round-brief__kicker">
        {lang === 'pt' ? 'NOVA JANELA DE SINAL' : 'NEW SIGNAL WINDOW'}
      </div>
      <div className="round-brief__main">
        <span>RD {round}/{total}</span>
        <b>{transmitter?.name || '?'}</b>
      </div>
      <div className="round-brief__task">
        {isTransmitter
          ? (lang === 'pt' ? 'Controle da roleta liberado' : 'Roulette control granted')
          : (lang === 'pt' ? 'Aguardando giro da roleta' : 'Waiting for wheel spin')}
      </div>
    </div>
  );
}
