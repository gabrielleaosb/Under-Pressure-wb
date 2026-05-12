import React, { useMemo } from 'react';

export default function StarField() {
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x:  Math.random() * 100,
    y:  Math.random() * 100,
    size: Math.random() < .12 ? 3 : Math.random() < .35 ? 2 : 1,
    opacity: .25 + Math.random() * .65,
    dur:   2.5 + Math.random() * 4.5,
    delay: Math.random() * 6,
  })), []);

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: '#fff',
          '--opacity': s.opacity,
          '--dur':     `${s.dur}s`,
          '--delay':   `-${s.delay}s`,
          animation:   'twinkle var(--dur) var(--delay) infinite',
          opacity:     s.opacity,
          boxShadow:   s.size >= 3 ? '0 0 4px rgba(255,255,255,.8)' : 'none',
        }} />
      ))}
      {/* Nebula glow blobs */}
      <div style={{ position:'absolute', left:'8%',  top:'15%',  width:300, height:200, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(40,0,120,.1) 0%,transparent 70%)', filter:'blur(24px)' }} />
      <div style={{ position:'absolute', right:'6%', bottom:'20%', width:260, height:180, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,60,200,.1) 0%,transparent 70%)', filter:'blur(20px)' }} />
    </div>
  );
}
