import React, { useRef, useCallback, useEffect } from 'react';
import { tCard } from '../i18n.js';

const DEFAULT_SIZE = 320;

export default function PressurePanel({
  card,
  lang,
  value = 50,
  onChange,
  disabled = false,
  showNeedle = false,
  showTarget = null,
  showAverage = null,
  showMyVote = null,
  readoutLabel,
  otherVotes = [],
  players = [],
  size: sizeProp,
}) {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const idBase = useRef(null);
  if (!idBase.current) {
    idBase.current = `combat-mfd-${Math.random().toString(36).slice(2)}`;
  }

  const size = sizeProp || DEFAULT_SIZE;
  const radius = size / 2;
  const trackR = radius * 0.76;
  const arcStart = Math.PI;
  const arcEnd = 2 * Math.PI;
  const glowId = `${idBase.current}-glow`;
  const softId = `${idBase.current}-soft`;

  const polar = (angle, length) => ({
    x: radius + Math.cos(angle) * length,
    y: radius + Math.sin(angle) * length,
  });

  const valToAngle = (nextValue) =>
    arcStart + Math.max(0, Math.min(100, nextValue)) / 100 * (arcEnd - arcStart);

  const arcPath = (startAngle, endAngle, length) => {
    const p1 = polar(startAngle, length);
    const p2 = polar(endAngle, length);
    const large = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${length} ${length} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };

  const updateFromEvent = useCallback((clientX, clientY) => {
    if (!svgRef.current || !onChange) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * size;
    const py = ((clientY - rect.top) / rect.height) * (size / 2);
    const dx = px - radius;
    const dy = py - radius;

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    if (angle < Math.PI) angle = angle < Math.PI / 2 ? 2 * Math.PI : Math.PI;

    const ratio = (angle - Math.PI) / Math.PI;
    onChange(Math.max(0, Math.min(100, Math.round(ratio * 100))));
  }, [onChange, radius, size]);

  const onDown = useCallback((event) => {
    if (disabled) return;
    event.preventDefault();
    dragging.current = true;
    const touch = event.touches ? event.touches[0] : event;
    updateFromEvent(touch.clientX, touch.clientY);
  }, [disabled, updateFromEvent]);

  const onMove = useCallback((event) => {
    if (!dragging.current || disabled) return;
    event.preventDefault();
    const touch = event.touches ? event.touches[0] : event;
    updateFromEvent(touch.clientX, touch.clientY);
  }, [disabled, updateFromEvent]);

  const onUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    if (disabled) return undefined;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [disabled, onMove, onUp]);

  const zoneLeft = arcPath(valToAngle(0), valToAngle(33), trackR);
  const zoneMid = arcPath(valToAngle(33), valToAngle(66), trackR);
  const zoneRight = arcPath(valToAngle(66), valToAngle(100), trackR);

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const angle = valToAngle(i);
    const major = i % 25 === 0;
    const start = polar(angle, trackR + 15);
    const end = polar(angle, trackR + 15 + (major ? 11 : 5));
    ticks.push(
      <line
        key={i}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={major ? '#4488ff' : '#1a3866'}
        strokeWidth={major ? 2.2 : 1}
        strokeLinecap="square"
      />
    );
  }

  const tickLabels = [0, 25, 50, 75, 100].map((labelValue) => {
    const angle = valToAngle(labelValue);
    const point = polar(angle, trackR + 39);
    return (
      <text
        key={labelValue}
        x={point.x}
        y={point.y + 4}
        textAnchor="middle"
        style={{ fontFamily: 'var(--f-read)', fontSize: 17, fill: '#3377ee' }}
      >
        {labelValue}
      </text>
    );
  });

  const needleAngle = valToAngle(value);
  const needleTip = polar(needleAngle, trackR - 7);
  const needleBaseA = polar(needleAngle + Math.PI / 2, 8);
  const needleBaseB = polar(needleAngle - Math.PI / 2, 8);
  const tipLabel = polar(needleAngle, trackR + 12);

  const separatorAngles = [33, 66].map((pointValue) => {
    const angle = valToAngle(pointValue);
    const start = polar(angle, trackR - 14);
    const end = polar(angle, trackR + 16);
    return (
      <line
        key={pointValue}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#61a0ff"
        strokeWidth={1.8}
        opacity={0.9}
      />
    );
  });

  let targetMarker = null;
  if (showTarget !== null) {
    const angle = valToAngle(showTarget);
    const start = polar(angle, trackR - 18);
    const end = polar(angle, trackR + 18);
    targetMarker = (
      <g style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.85))' }}>
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--neon-mint)" strokeWidth={3} />
        <circle cx={start.x} cy={start.y} r={4} fill="var(--neon-mint)" />
      </g>
    );
  }

  let avgMarker = null;
  if (showAverage !== null) {
    const angle = valToAngle(showAverage);
    const tip = polar(angle, trackR - 6);
    const baseA = polar(angle + Math.PI / 2, 7);
    const baseB = polar(angle - Math.PI / 2, 7);
    avgMarker = (
      <g style={{ filter: 'drop-shadow(0 0 6px rgba(255,224,0,0.85))' }}>
        <polygon
          points={`${tip.x},${tip.y} ${baseA.x},${baseA.y} ${baseB.x},${baseB.y}`}
          fill="var(--neon-amber)"
          stroke="#3a2a00"
          strokeWidth={1}
        />
      </g>
    );
  }

  const voteDots = otherVotes.map(({ playerId, position }) => {
    const player = players.find((entry) => entry.id === playerId);
    if (!player) return null;
    const angle = valToAngle(position);
    const point = polar(angle, trackR - 22);
    const rank = player.rank != null ? `#${player.rank}` : null;
    return (
      <g key={playerId} style={{ filter: `drop-shadow(0 0 5px ${player.color})` }}>
        <circle cx={point.x} cy={point.y} r={rank ? 10 : 5} fill={player.color} stroke="#000" strokeWidth={1.5} opacity={0.95} />
        {rank && (
          <text x={point.x} y={point.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--f-read)', fontSize: 9, fill: '#000', fontWeight: 700, pointerEvents: 'none' }}>
            {rank}
          </text>
        )}
      </g>
    );
  });

  let myVoteMarker = null;
  if (showMyVote !== null) {
    const angle = valToAngle(showMyVote);
    const start = polar(angle, trackR - 18);
    const end = polar(angle, trackR + 18);
    myVoteMarker = (
      <g style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,255,0.85))' }}>
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--neon-cyan)" strokeWidth={3} strokeDasharray="4 3" />
        <circle cx={end.x} cy={end.y} r={4} fill="var(--neon-cyan)" />
      </g>
    );
  }

  const leftLabel = tCard(card, 'left', lang);
  const rightLabel = tCard(card, 'right', lang);
  const svgHeight = size / 2 + 54;
  const viewBox = `0 -12 ${size} ${size / 2 + 64}`;
  const showPointer = !disabled || showNeedle;

  return (
    <div
      className="pressure-panel pressure-panel--combat"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: size,
        margin: '0 auto',
      }}
    >
      <div className="pressure-axis-labels">
        <span title={leftLabel}>{`◀ ${leftLabel}`}</span>
        <span title={rightLabel}>{`${rightLabel} ▶`}</span>
      </div>

      <div
        className="pressure-gauge-wrap"
        style={{ '--pressure-readout-top': `${(radius / (svgHeight + 10)) * 100}%` }}
      >
        <div className="pressure-readout pressure-readout--combat">
          <div className="pressure-readout__label">
            {readoutLabel || (lang === 'pt' ? 'PRESSAO' : 'PRESSURE')}
          </div>
          <div className="pressure-readout__value">
            {String(Math.round(value)).padStart(2, '0')}
          </div>
        </div>

        <svg
          ref={svgRef}
          width="100%"
          height={svgHeight}
          viewBox={viewBox}
          className="gauge-svg gauge-svg--combat"
          onMouseDown={onDown}
          onTouchStart={onDown}
          style={{ cursor: disabled ? 'default' : 'grab', userSelect: 'none', touchAction: 'none', display: 'block' }}
        >
          <defs>
            <filter id={glowId} x="-40%" y="-80%" width="180%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={softId} x="-30%" y="-70%" width="160%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          <path d={arcPath(arcStart, arcEnd, trackR + 32)} fill="none" stroke="#071738" strokeWidth={20} opacity={0.92} />
          <path d={arcPath(arcStart, arcEnd, trackR + 31)} fill="none" stroke="#123878" strokeWidth={2.2} filter={`url(#${glowId})`} />
          <path d={arcPath(arcStart, arcEnd, trackR + 18)} fill="none" stroke="#05102a" strokeWidth={14} />
          <path d={arcPath(arcStart, arcEnd, trackR + 3)} fill="none" stroke="#07132f" strokeWidth={26} />

          <path d={zoneLeft} fill="none" stroke="#0c2255" strokeWidth={18} strokeLinecap="butt" filter={`url(#${softId})`} />
          <path d={zoneMid} fill="none" stroke="#0e2a66" strokeWidth={18} strokeLinecap="butt" filter={`url(#${softId})`} />
          <path d={zoneRight} fill="none" stroke="#0a1e55" strokeWidth={18} strokeLinecap="butt" filter={`url(#${softId})`} />
          <path d={arcPath(arcStart, arcEnd, trackR)} fill="none" stroke="#2255cc" strokeWidth={2} filter={`url(#${glowId})`} />
          <path d={arcPath(arcStart, arcEnd, trackR - 19)} fill="none" stroke="#173364" strokeWidth={1.2} strokeDasharray="5 7" opacity={0.75} />

          {separatorAngles}
          {ticks}
          {tickLabels}

          {targetMarker}
          {myVoteMarker}
          {voteDots}
          {avgMarker}

          {showPointer && (
            <g className="needle-glow-cyan" style={{ transition: dragging.current ? 'none' : 'transform 0.2s cubic-bezier(.4,1.6,.5,1)' }}>
              <polygon
                points={`${needleTip.x},${needleTip.y} ${needleBaseA.x},${needleBaseA.y} ${needleBaseB.x},${needleBaseB.y}`}
                fill="#4488ff"
                stroke="#00081a"
                strokeWidth={1.2}
              />
              <circle cx={radius} cy={radius} r={13} fill="#030816" stroke="#1f56c4" strokeWidth={2} />
              <circle cx={radius} cy={radius} r={7} fill="none" stroke="#61a0ff" strokeWidth={1.4} />
              <line x1={radius - 14} y1={radius} x2={radius + 14} y2={radius} stroke="#3377ee" strokeWidth={1} />
              <line x1={radius} y1={radius - 14} x2={radius} y2={radius + 14} stroke="#3377ee" strokeWidth={1} />
            </g>
          )}

          {showPointer && (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tipLabel.x - 20} y={tipLabel.y - 11} width={40} height={20} rx={2} fill="#030816" stroke="#3377ee" strokeWidth={1.3} opacity={0.95} />
              <path d={`M ${tipLabel.x - 25} ${tipLabel.y - 11} h 6 M ${tipLabel.x - 25} ${tipLabel.y + 9} h 6 M ${tipLabel.x + 25} ${tipLabel.y - 11} h -6 M ${tipLabel.x + 25} ${tipLabel.y + 9} h -6`} stroke="#61a0ff" strokeWidth={1.1} />
              <text x={tipLabel.x} y={tipLabel.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--f-read)', fontSize: 16, fill: '#61a0ff' }}>
                {Math.round(value)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
