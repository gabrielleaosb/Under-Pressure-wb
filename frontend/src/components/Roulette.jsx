import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../gameData.js';
import { playRouletteSpin, playThemeReveal, playClick } from '../sounds.js';

const ATLAS_COLORS = [
  '#000d20',
  '#001128',
  '#001530',
  '#001938',
  '#001d40',
  '#002148',
  '#000618',
];

const buildAtlasGradient = () => {
  const step = 100 / THEMES.length;
  return THEMES.map((_, index) => {
    const color = ATLAS_COLORS[index % ATLAS_COLORS.length];
    return `${color} ${index * step}% ${(index + 1) * step}%`;
  }).join(', ');
};

export default function Roulette({ gameState, myId, lang, send, spinning, isHost }) {
  const psychicPlayer = gameState.players?.find(p => p.id === gameState.psychicId);
  const psychicIsBot = psychicPlayer?.isBot === true;
  const isPsychic = gameState.psychicId === myId || (psychicIsBot && isHost);
  const selectedTheme = gameState.currentTheme;

  const [angle, setAngle] = useState(0);
  const [revealVisible, setRevealVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasAnimated = useRef(false);
  const angleRef = useRef(0);

  useEffect(() => {
    if (!spinning || !selectedTheme || hasAnimated.current) return;
    hasAnimated.current = true;
    setIsAnimating(true);
    setRevealVisible(false);

    const N = THEMES.length;
    const segSize = 360 / N;
    const centerOfTarget = selectedTheme.id * segSize + segSize / 2;
    const addedRotation = 360 * 5 - centerOfTarget + (Math.random() - 0.5) * (segSize * 0.6);
    const newAngle = angleRef.current + addedRotation;
    angleRef.current = newAngle;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAngle(newAngle);
      });
    });

    playRouletteSpin();

    setTimeout(() => {
      setIsAnimating(false);
      setRevealVisible(true);
      playThemeReveal();
    }, 4400);
  }, [spinning, selectedTheme]);

  useEffect(() => {
    if (!spinning && !selectedTheme) {
      hasAnimated.current = false;
      setRevealVisible(false);
      setIsAnimating(false);
    }
  }, [spinning, selectedTheme]);

  const viewport = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
  const widthCap = viewport < 900 ? viewport - 40 : 420;
  const heightCap = viewportHeight < 760 ? viewportHeight - 230 : 420;
  const size = Math.max(240, Math.min(420, widthCap, heightCap));
  const segSize = 360 / THEMES.length;

  const themeName = (th) => lang === 'en' ? th.shortEN : th.shortPT;
  const fullName = (th) => lang === 'en' ? th.nameEN : th.namePT;
  const canSpin = isPsychic && !spinning && !isAnimating;

  const spin = () => {
    if (!canSpin) return;
    playClick();
    send('spin_roulette');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingBottom: 20, width: '100%' }}>
      <h2 className="t-title glow-text-cyan text-center" style={{ fontSize: 'clamp(10px,2.2vw,13px)' }}>
        {lang === 'pt' ? 'ROLETA DE TEMAS' : 'THEME ROULETTE'}
      </h2>

      <div style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--ink-dim)' }}>
        {lang === 'pt' ? 'NAVEGADOR:' : 'NAVIGATOR:'}
        {' '}<span style={{ color: 'var(--neon-amber)', fontWeight: 800 }}>{psychicPlayer?.name || '?'}</span>
      </div>

      <div
        className="game-roulette game-roulette--atlas"
        style={{
          '--wheel-size': `${size}px`,
          '--atlas-gradient': buildAtlasGradient(),
        }}
      >
        <div className="game-roulette__aura" />
        <div className="game-roulette__pointer" />

        <div
          className="game-roulette__disc"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: isAnimating ? 'transform 4s cubic-bezier(.18,.85,.25,1)' : 'none',
          }}
        >
          {THEMES.map((th, index) => (
            <span
              key={th.id}
              className="game-roulette__label"
              style={{
                '--label-angle': `${index * segSize + segSize / 2}deg`,
                '--label-radius': `${size * 0.34}px`,
              }}
            >
              {themeName(th)}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="game-roulette__hub"
          style={{ cursor: canSpin ? 'pointer' : 'default' }}
          onClick={spin}
          disabled={!canSpin}
          aria-label={lang === 'pt' ? 'Girar roleta' : 'Spin roulette'}
        >
          <span>{canSpin ? (lang === 'pt' ? 'GIRAR' : 'SPIN') : 'ATLAS'}</span>
        </button>
      </div>

      {revealVisible && selectedTheme && (
        <div className="theme-reveal panel bevel text-center" style={{
          padding: '16px 32px',
          maxWidth: 340,
          width: '100%',
          border: `2px solid ${selectedTheme.color}`,
          boxShadow: `0 0 30px ${selectedTheme.color}55`,
        }}>
          <div className="label mb-6" style={{ color: 'var(--ink-dim)' }}>
            {lang === 'pt' ? 'TEMA DA RODADA' : 'ROUND THEME'}
          </div>
          <div className="t-title" style={{
            fontSize: 'clamp(11px,3.5vw,16px)',
            color: selectedTheme.color,
            textShadow: `0 0 20px ${selectedTheme.color}`,
            lineHeight: 2,
          }}>
            {fullName(selectedTheme)}
          </div>
        </div>
      )}

      {!isPsychic && !isAnimating && !revealVisible && (
        <div style={{ fontFamily: 'var(--f-body)', fontSize: 14, color: 'var(--ink-dim)' }}>
          {lang === 'pt'
            ? `Aguardando ${psychicPlayer?.name} girar...`
            : `Waiting for ${psychicPlayer?.name} to spin...`}
        </div>
      )}

      {isAnimating && (
        <div style={{ fontFamily: 'var(--f-vt)', fontSize: 24, color: 'var(--neon-amber)', letterSpacing: 0, animation: 'blink-bar .4s infinite' }}>
          {lang === 'pt' ? 'GIRANDO...' : 'SPINNING...'}
        </div>
      )}
    </div>
  );
}
