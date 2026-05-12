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

  const size = sizeProp || DEFAULT_SIZE;
  const radius = size / 2;
  const trackR = radius * 0.82;
  const arcStart = Math.PI;
  const arcEnd = 2 * Math.PI;

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
  }, [onMove, onUp]);

  const zoneBlue = arcPath(valToAngle(0), valToAngle(40), trackR);
  const zoneGreen = arcPath(valToAngle(40), valToAngle(60), trackR);
  const zoneRed = arcPath(valToAngle(60), valToAngle(100), trackR);

  const ticks = [];
  for (let i = 0; i <= 100; i += 5) {
    const angle = valToAngle(i);
    const major = i % 25 === 0;
    const start = polar(angle, trackR + 14);
    const end = polar(angle, trackR + 14 + (major ? 10 : 5));
    ticks.push(
      <line
        key={i}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={major ? 'var(--ink)' : 'var(--ink-dim)'}
        strokeWidth={major ? 2 : 1}
      />
    );
  }

  const tickLabels = [0, 25, 50, 75, 100].map((labelValue) => {
    const angle = valToAngle(labelValue);
    const point = polar(angle, trackR + 36);
    return (
      <text
        key={labelValue}
        x={point.x}
        y={point.y + 4}
        textAnchor="middle"
        style={{ fontFamily: 'var(--f-read)', fontSize: 16, fill: 'var(--ink-dim)' }}
      >
        {labelValue}
      </text>
    );
  });

  const needleAngle = valToAngle(value);
  const needleTip = polar(needleAngle, trackR - 6);
  const needleBaseA = polar(needleAngle + Math.PI / 2, 8);
  const needleBaseB = polar(needleAngle - Math.PI / 2, 8);
  const tipLabel = polar(needleAngle, trackR + 12);

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
  const svgHeight = size / 2 + 50;
  const viewBox = `0 -10 ${size} ${size / 2 + 60}`;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: size, margin: '0 auto' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${(radius / (svgHeight + 10)) * 100}%`,
          transform: 'translate(-50%, 0)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <div className="t-title text-dim" style={{ fontSize: 9 }}>
          {readoutLabel || (lang === 'pt' ? 'PRESSAO' : 'PRESSURE')}
        </div>
        <div
          className="t-read glow-text-amber"
          style={{
            fontSize: size * 0.16,
            marginTop: 4,
            filter: 'drop-shadow(0 0 8px rgba(255,224,0,0.6))',
          }}
        >
          {String(Math.round(value)).padStart(2, '0')}
        </div>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={svgHeight}
        viewBox={viewBox}
        className="gauge-svg"
        onMouseDown={onDown}
        onTouchStart={onDown}
        style={{ cursor: disabled ? 'default' : 'grab', userSelect: 'none', touchAction: 'none', display: 'block' }}
      >
        <path d={arcPath(arcStart, arcEnd, trackR + 28)} fill="none" stroke="var(--metal-2)" strokeWidth={2} />
        <path d={arcPath(arcStart, arcEnd, trackR)} fill="none" stroke="var(--space-1)" strokeWidth={22} strokeLinecap="butt" />

        <path
          d={zoneBlue}
          fill="none"
          stroke="var(--neon-blue)"
          strokeWidth={18}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,170,255,0.7))' }}
        />
        <path
          d={zoneGreen}
          fill="none"
          stroke="var(--neon-mint)"
          strokeWidth={18}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.7))' }}
        />
        <path
          d={zoneRed}
          fill="none"
          stroke="var(--neon-coral)"
          strokeWidth={18}
          strokeLinecap="butt"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,51,85,0.7))' }}
        />

        {ticks}
        {tickLabels}
        {targetMarker}
        {myVoteMarker}
        {voteDots}
        {avgMarker}

        {(!disabled || showNeedle) && (
          <g className="needle-glow-yellow" style={{ transition: dragging.current ? 'none' : 'transform 0.2s cubic-bezier(.4,1.6,.5,1)' }}>
            <polygon
              points={`${needleTip.x},${needleTip.y} ${needleBaseA.x},${needleBaseA.y} ${needleBaseB.x},${needleBaseB.y}`}
              fill="var(--neon-amber)"
              stroke="#3a2a00"
              strokeWidth={1.2}
            />
            <circle cx={radius} cy={radius} r={6} fill="#000" stroke="var(--neon-amber)" strokeWidth={2} />
          </g>
        )}

        {(!disabled || showNeedle) && (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tipLabel.x - 18} y={tipLabel.y - 11} width={36} height={20} rx={3} fill="var(--space-0)" stroke="var(--neon-amber)" strokeWidth={1.5} />
            <text x={tipLabel.x} y={tipLabel.y + 4} textAnchor="middle" style={{ fontFamily: 'var(--f-read)', fontSize: 16, fill: 'var(--neon-amber)' }}>
              {Math.round(value)}
            </text>
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: 4, gap: 8 }}>
        <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 12, color: 'rgba(0,170,255,0.8)', maxWidth: '44%', wordBreak: 'break-word' }}>
          {`<- ${leftLabel}`}
        </span>
        <span style={{ fontFamily: 'var(--f-body)', fontWeight: 800, fontSize: 12, color: 'rgba(255,51,85,0.8)', maxWidth: '44%', wordBreak: 'break-word', textAlign: 'right' }}>
          {`${rightLabel} ->`}
        </span>
      </div>

    </div>
  );
}
