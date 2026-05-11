import React, { useMemo } from 'react';

export default function StarField() {
  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() < 0.08 ? 4 : Math.random() < 0.25 ? 2.5 : 1.5,
    opacity: 0.25 + Math.random() * 0.65,
    dur: 3 + Math.random() * 5,
    delay: Math.random() * 6,
    color: Math.random() < 0.15 ? '#aacfff' : Math.random() < 0.08 ? '#ffddaa' : '#ffffff',
  })), []);

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: s.color,
          '--opacity': s.opacity,
          '--dur': `${s.dur}s`,
          '--delay': `-${s.delay}s`,
          animation: 'twinkle var(--dur) var(--delay) infinite',
          opacity: s.opacity,
          boxShadow: s.size >= 3 ? `0 0 ${s.size * 3}px ${s.color}` : 'none',
        }} />
      ))}

      {/* Cartoon planet — upper right */}
      <div style={{
        position: 'absolute', right: '8%', top: '12%',
        width: 90, height: 90, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #3a1a6e 0%, #1a0840 60%, #0a0420 100%)',
        boxShadow: '0 0 30px rgba(120,60,220,0.4), 0 0 80px rgba(80,30,160,0.2)',
        animation: 'float-slow 8s ease-in-out infinite',
        opacity: 0.6,
      }}>
        {/* Planet ring */}
        <div style={{
          position: 'absolute', top: '40%', left: '-30%',
          width: '160%', height: '20%',
          borderRadius: '50%',
          border: '4px solid rgba(180,120,255,0.35)',
          transform: 'rotateX(70deg)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Cartoon distant planet — lower left */}
      <div style={{
        position: 'absolute', left: '5%', bottom: '20%',
        width: 55, height: 55, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 35%, #0a3a5a 0%, #051d30 70%)',
        boxShadow: '0 0 20px rgba(0,120,200,0.35)',
        animation: 'float-slow 11s ease-in-out infinite',
        animationDelay: '-4s',
        opacity: 0.5,
      }} />

      {/* Large soft nebula blobs */}
      <div style={{
        position: 'absolute', left: '0%', top: '5%',
        width: 500, height: 350, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,20,180,0.12) 0%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: '0%', bottom: '10%',
        width: 420, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,80,200,0.12) 0%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', left: '40%', top: '45%',
        width: 300, height: 250, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,160,120,0.07) 0%, transparent 70%)',
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />
    </div>
  );
}
