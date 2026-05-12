import React, { useMemo } from 'react';

export default function StarField({ density = 85 }) {
  const stars = useMemo(() => Array.from({ length: density }, (_, i) => ({
    id: i,
    left:  Math.random() * 110,   // slight overshoot for drift effect
    top:   Math.random() * 100,
    size:  Math.random() < .85 ? 1 + Math.random() * 1.2 : 2 + Math.random() * 1.5,
    op:    0.32 + Math.random() * 0.55,
    tw:    1.8 + Math.random() * 4.5,
    delay: Math.random() * 5,
  })), [density]);

  return (
    <div className="starfield">
      {/* Drifting star layer */}
      <div style={{ position:'absolute', inset:0, animation:'drift 60s linear infinite' }}>
        {stars.map(s => (
          <span key={s.id} className="star" style={{
            left:  s.left + '%',
            top:   s.top  + '%',
            width:  s.size + 'px',
            height: s.size + 'px',
            '--op': s.op,
            '--tw': s.tw + 's',
            opacity:        s.op,
            animationDelay: -s.delay + 's',
            boxShadow: s.size >= 2.5 ? `0 0 ${s.size*2}px rgba(255,255,255,.6)` : 'none',
          }}/>
        ))}
      </div>
    </div>
  );
}
