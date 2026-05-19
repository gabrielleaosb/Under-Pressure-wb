import React, { useRef, useCallback } from 'react';

const GRID_SIZE = 10;

function clampGrid(val) {
  return Math.max(0, Math.min(GRID_SIZE, Math.round(Number(val) || 0)));
}

function toPercent(val) {
  return `${(val / GRID_SIZE) * 100}%`;
}

function toPctY(val) {
  return `${(1 - val / GRID_SIZE) * 100}%`;
}

export default function Grid2D({
  cardX,
  cardY,
  lang,
  value,
  onChange,
  disabled,
  showTarget,
  targetX,
  targetY,
  otherVotes,
  players,
}) {
  const fieldRef = useRef(null);
  const isDragging = useRef(false);

  const getCoords = useCallback((clientX, clientY) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = clampGrid(((clientX - rect.left) / rect.width) * GRID_SIZE);
    const y = clampGrid((1 - (clientY - rect.top) / rect.height) * GRID_SIZE);
    return { x, y };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (disabled || !onChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    const c = getCoords(e.clientX, e.clientY);
    if (c) onChange(c.x, c.y);
  }, [disabled, onChange, getCoords]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || disabled || !onChange) return;
    const c = getCoords(e.clientX, e.clientY);
    if (c) onChange(c.x, c.y);
  }, [disabled, onChange, getCoords]);

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

  const lX = (s) => cardX ? (lang === 'en' ? (s === 'l' ? cardX.lE : cardX.rE) : (s === 'l' ? cardX.lP : cardX.rP)) : '';
  const lY = (s) => cardY ? (lang === 'en' ? (s === 'b' ? cardY.lE : cardY.rE) : (s === 'b' ? cardY.lP : cardY.rP)) : '';

  return (
    <div className="grid2d-wrap">

      {/* Y high label (top) */}
      <div className="grid2d-pole grid2d-pole--y">
        <span className="grid2d-pole__arrow">▲</span>
        <span className="grid2d-pole__text">{lY('t')}</span>
      </div>

      {/* Middle row: X-left | field | X-right */}
      <div className="grid2d-body">
        <div className="grid2d-pole grid2d-pole--x grid2d-pole--x-left">
          <span className="grid2d-pole__arrow">◀</span>
          <span className="grid2d-pole__text">{lX('l')}</span>
        </div>

        <div
          ref={fieldRef}
          className={`grid2d-field${disabled ? '' : ' grid2d-field--interactive'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
            <React.Fragment key={i}>
              <div className={`grid2d-line grid2d-line--v${i === 5 ? ' grid2d-line--mid' : ''}`} style={{ left: toPercent(i) }} />
              <div className={`grid2d-line grid2d-line--h${i === 5 ? ' grid2d-line--mid' : ''}`} style={{ top: toPctY(i) }} />
            </React.Fragment>
          ))}

          {/* X axis ticks — bottom edge, kept inside safe area */}
          <span className="grid2d-tick" style={{ bottom: 4, left: 4 }}>0</span>
          <span className="grid2d-tick" style={{ bottom: 4, left: '50%', transform: 'translateX(-50%)' }}>5</span>
          <span className="grid2d-tick" style={{ bottom: 4, right: 4 }}>10</span>
          {/* Y axis ticks — left edge (skip 0 to avoid corner overlap with X's 0) */}
          <span className="grid2d-tick" style={{ top: '50%', left: 4, transform: 'translateY(-50%)' }}>5</span>
          <span className="grid2d-tick" style={{ top: 4, left: 4 }}>10</span>

          {showTarget && targetX != null && targetY != null && (
            <div className="grid2d-target" style={{ left: toPercent(targetX), top: toPctY(targetY) }}>
              <div className="grid2d-target__ring" />
              <div className="grid2d-target__cross grid2d-target__cross--h" />
              <div className="grid2d-target__cross grid2d-target__cross--v" />
              <div className="grid2d-target__dot" />
            </div>
          )}

          {otherVotes?.map(v => {
            const color = players?.find(p => p.id === v.playerId)?.color || 'var(--ink-dim)';
            return (
              <div
                key={v.playerId}
                className="grid2d-vote-dot"
                style={{ left: toPercent(v.x), top: toPctY(v.y), '--dot-color': color }}
              />
            );
          })}

          {value && (
            <div className="grid2d-cursor" style={{ left: toPercent(value.x), top: toPctY(value.y) }} />
          )}
        </div>

        <div className="grid2d-pole grid2d-pole--x grid2d-pole--x-right">
          <span className="grid2d-pole__text">{lX('r')}</span>
          <span className="grid2d-pole__arrow">▶</span>
        </div>
      </div>

      {/* Y low label (bottom) */}
      <div className="grid2d-pole grid2d-pole--y">
        <span className="grid2d-pole__text">{lY('b')}</span>
        <span className="grid2d-pole__arrow">▼</span>
      </div>

    </div>
  );
}
