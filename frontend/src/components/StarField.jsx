import React, { memo, useEffect, useRef } from 'react';

const PX = 3;
const FPS = 30;
const MAX_CANVAS_WIDTH = 1600;
const MAX_CANVAS_HEIGHT = 950;
const MAX_CANVAS_AREA = 1350000;
const BG_SPEED = 1.65;
const GRAVITY_PULSE_PERIOD = 220;
const STAR_COUNT = 230;
const DUST_COUNT = 86;
const NEBULA_STREAM_COUNT = 170;
const NEBULA_RING_COUNT = 130;
const GALAXY_SPRITE_COUNT = 660;
const GALAXY_DUST_LANE_COUNT = 175;
const GALAXY_HALO_COUNT = 160;
const ACCRETION_SPRITE_COUNT = 360;
const LENSING_STAR_COUNT = 76;

const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function StarField({ variant = 'menu' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const isGame = variant === 'game';

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let frame = 0;
    let raf = 0;
    let lastTime = 0;
    let shotTimer = irnd(130, 320);
    const shots = [];
    const galaxy = { baseCx: 0.86, baseCy: 0.18, cx: 0.86, cy: 0.18, rot: 0, scale: 1 };
    const blackHole = { baseCx: 0.13, baseCy: 0.78, cx: 0.13, cy: 0.78, rot: 0, axis: 0, scale: 1 };
    const station = { baseCx: 0.12, baseCy: 0.22, cx: 0.12, cy: 0.22, scale: 1 };
    const bhRadius = 7;
    const bhDisc = 14;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rnd(0, 100),
      y: rnd(0, 100),
      size: Math.random() < 0.1 ? 2 : 1,
      br: rnd(0.28, 1),
      spd: rnd(0.02, 0.07),
      off: rnd(0, Math.PI * 2),
      type: irnd(0, 3),
      pulse: rnd(0.35, 0.95),
      depth: rnd(0.18, 1),
      drift: rnd(0.0015, 0.009),
    }));

    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: rnd(0, 100),
      y: rnd(0, 100),
      br: rnd(0.04, 0.18),
      spd: rnd(0.01, 0.033),
      off: rnd(0, Math.PI * 2),
      hue: Math.random() < 0.5 ? 'purple' : 'teal',
      depth: rnd(0.12, 0.62),
      drift: rnd(0.0008, 0.0045),
    }));

    const stationHull = [
      [-8, 0], [-7, 0], [-6, 0], [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0],
      [-5, -1], [-4, -1], [-3, -1], [-2, -1], [-1, -1],
      [-6, 1], [-5, 1], [-4, 1], [-3, 1], [-2, 1], [-1, 1],
      [-2, -2], [-1, -2], [0, -2], [1, -2],
      [-2, 2], [-1, 2], [0, 2],
      [1, -1], [2, -1], [3, -1],
      [1, 1], [2, 1],
      [4, -2], [5, -2], [6, -2],
      [4, 2], [5, 2],
      [7, -1], [8, -1],
      [7, 1], [8, 1],
      [-10, -1], [-11, -1], [-12, -1],
      [-10, 1], [-11, 1], [-12, 1],
    ];
    const stationShadow = [[-7, 2], [-6, 2], [-5, 2], [-4, 2], [-3, 2], [1, 2], [2, 2], [5, 3]];
    const stationLights = [
      { x: -3, y: -1, color: [0, 255, 255], speed: 0.075, off: 0.2 },
      { x: 2, y: -1, color: [255, 224, 0], speed: 0.052, off: 1.8 },
      { x: 8, y: 1, color: [255, 70, 105], speed: 0.09, off: 3.1 },
    ];

    const nebulaStream = Array.from({ length: NEBULA_STREAM_COUNT }, () => {
      const t = Math.random();
      const curve = Math.sin(t * Math.PI) * rnd(-0.16, 0.16);
      const side = Math.random() < 0.5 ? -1 : 1;
      const hue = Math.random();
      return {
        t,
        side,
        curve,
        drift: rnd(-0.018, 0.018),
        width: rnd(0.015, 0.07) * side,
        size: Math.random() > 0.84 ? 2 : 1,
        alpha: rnd(0.025, 0.12),
        pulse: rnd(0.008, 0.024),
        off: rnd(0, Math.PI * 2),
        color: hue < 0.42 ? 'violet' : hue < 0.78 ? 'cyan' : 'amber',
      };
    });

    const distantGalaxyConfigs = [
      {
        kind: 'elliptical',
        cx: 0.42,
        cy: 0.1,
        scale: 0.24,
        brightness: 0.42,
        glow: 0.08,
        radiusScale: 0.82,
        count: 96,
        spin: 0.00055,
        twist: 0.46,
        drift: 0.00065,
        palette: [[255, 226, 166], [184, 136, 255], [110, 120, 205]],
      },
      {
        kind: 'barred',
        cx: 0.94,
        cy: 0.56,
        scale: 0.72,
        brightness: 0.9,
        glow: 0.12,
        radiusScale: 1.08,
        count: 190,
        spin: -0.00185,
        twist: 1.18,
        drift: 0.0015,
        palette: [[126, 242, 255], [80, 150, 230], [255, 170, 80]],
      },
      {
        kind: 'irregular',
        cx: 0.08,
        cy: 0.48,
        scale: 0.46,
        brightness: 0.68,
        glow: 0.1,
        radiusScale: 0.95,
        count: 145,
        spin: 0.001,
        twist: 0.78,
        drift: 0.00105,
        palette: [[255, 110, 150], [145, 88, 255], [90, 210, 220]],
      },
      {
        kind: 'spiral',
        cx: 0.76,
        cy: 0.91,
        scale: 0.92,
        brightness: 1.02,
        glow: 0.14,
        radiusScale: 1.24,
        count: 255,
        spin: 0.0022,
        twist: 1.36,
        drift: 0.00185,
        palette: [[180, 230, 255], [92, 120, 255], [255, 210, 120]],
      },
    ];

    const distantGalaxies = distantGalaxyConfigs.map((config) => {
      const points = Array.from({ length: config.count }, () => {
        const palette = config.palette[irnd(0, config.palette.length)];
        let dx;
        let dy;
        let radius;
        if (config.kind === 'elliptical') {
          radius = (Math.random() ** 0.62) * 20 * config.radiusScale;
          const angle = rnd(0, Math.PI * 2);
          dx = Math.cos(angle) * radius * rnd(1.4, 2.2);
          dy = Math.sin(angle) * radius * rnd(0.42, 0.74);
        } else if (config.kind === 'barred') {
          radius = (Math.random() ** 0.7) * 23 * config.radiusScale;
          const arm = Math.random() < 0.5 ? 0 : Math.PI;
          const angle = arm + radius * 0.31 + rnd(-0.32, 0.32);
          const bar = Math.random() < 0.24;
          dx = bar ? rnd(-16, 16) : Math.cos(angle) * radius * 1.65;
          dy = bar ? rnd(-2.2, 2.2) : Math.sin(angle) * radius * 0.56;
        } else if (config.kind === 'irregular') {
          radius = (Math.random() ** 0.48) * 18 * config.radiusScale;
          const angle = rnd(0, Math.PI * 2);
          dx = Math.cos(angle) * radius * rnd(0.65, 1.9) + rnd(-4, 4);
          dy = Math.sin(angle) * radius * rnd(0.48, 1.1) + rnd(-3, 3);
        } else {
          radius = (Math.random() ** 0.65) * 22 * config.radiusScale;
          const arm = irnd(0, 3) * ((Math.PI * 2) / 3);
          const angle = arm + radius * 0.34 + rnd(-0.28, 0.28);
          dx = Math.cos(angle) * radius * 1.8;
          dy = Math.sin(angle) * radius * 0.62;
        }

        const core = radius < 5.2;
        const br = rnd(0.5, 1.18) * Math.max(0.22, 1 - radius / 52);
        return {
          dx,
          dy,
          radius,
          core,
          r: palette[0] * br,
          g: palette[1] * br,
          b: palette[2] * br,
          alpha: core ? rnd(0.62, 0.92) : rnd(0.14, 0.46),
          size: 1,
          off: rnd(0, Math.PI * 2),
          twinkle: rnd(0.008, 0.026),
          orbitSpeed: rnd(0.00022, 0.00175) * (core ? 0.28 : 1) * config.twist * (Math.random() < 0.5 ? -1 : 1),
          orbitPhase: rnd(0, Math.PI * 2),
        };
      });

      const dustLanes = Array.from({ length: Math.round(config.count * 0.2) }, () => {
        const radius = rnd(5.5, 22 * config.radiusScale);
        const arm = config.kind === 'spiral'
          ? irnd(0, 3) * ((Math.PI * 2) / 3)
          : Math.random() < 0.5 ? 0 : Math.PI;
        const angle = arm + radius * (config.kind === 'barred' ? 0.27 : 0.34) + rnd(-0.18, 0.18);
        const lane = Math.random() < 0.5 ? 1 : -1;
        return {
          dx: Math.cos(angle) * radius * rnd(1.45, 1.95),
          dy: Math.sin(angle) * radius * rnd(0.48, 0.68) + lane * rnd(0.6, 1.8),
          radius,
          alpha: rnd(0.08, 0.2) * config.brightness,
          off: rnd(0, Math.PI * 2),
        };
      });

      return {
        ...config,
        points,
        dustLanes,
        rot: rnd(0, Math.PI * 2),
        off: rnd(0, Math.PI * 2),
      };
    });

    const galaxySprite = Array.from({ length: GALAXY_SPRITE_COUNT }, () => {
      const arm = Math.random() < 0.62 ? irnd(0, 2) * 2 : irnd(0, 4);
      const radius = Math.random() < 0.18
        ? rnd(0, 6.2)
        : 5 + (Math.random() ** 0.6) * 32;
      const spread = 1 - Math.min(radius / 36, 0.95);
      const angle = arm * (Math.PI / 2) + radius * 0.285 + rnd(-0.34, 0.34) * (0.7 + spread);
      const haze = rnd(-1.9, 1.9) * (0.4 + spread);
      const barredCore = radius < 10.5 && Math.random() < 0.42;
      let dx;
      let dy;
      if (barredCore) {
        const barAngle = -0.38;
        const barLen = rnd(-11, 11) * (1 - radius / 34);
        const barThick = rnd(-2.1, 2.1) * (1 - radius / 18);
        dx = Math.cos(barAngle) * barLen - Math.sin(barAngle) * barThick + haze * 0.5;
        dy = Math.sin(barAngle) * barLen + Math.cos(barAngle) * barThick + rnd(-0.7, 0.7);
      } else {
        dx = Math.cos(angle) * radius * 1.86 + haze;
        dy = Math.sin(angle) * radius * 0.55 + rnd(-1.05, 1.05);
      }
      const hotCore = radius < 6.2;
      const youngStar = !hotCore && Math.random() < 0.4;
      const amber = !hotCore && !youngStar && Math.random() < 0.24;
      const br = rnd(0.5, 1.18) * Math.max(0.14, 1 - radius / 58);

      let r = 116;
      let g = 128;
      let b = 255;
      if (hotCore) {
        r = 255; g = rnd(226, 255); b = rnd(176, 226);
      } else if (youngStar) {
        r = rnd(142, 205); g = rnd(188, 235); b = 255;
      } else if (amber) {
        r = rnd(220, 255); g = rnd(152, 210); b = rnd(92, 150);
      } else {
        r = rnd(92, 168); g = rnd(88, 142); b = rnd(205, 255);
      }

      return {
        dx,
        dy,
        radius,
        r: r * br,
        g: g * br,
        b: b * br,
        size: hotCore || Math.random() > 0.92 ? 2 : 1,
        twinkle: rnd(0.02, 0.076),
        off: rnd(0, Math.PI * 2),
      };
    });

    const galaxyDustLanes = Array.from({ length: GALAXY_DUST_LANE_COUNT }, () => {
      const lane = Math.random() < 0.5 ? 1 : -1;
      const radius = rnd(6, 34);
      const arm = Math.random() < 0.58 ? 0 : Math.PI;
      const angle = arm + radius * 0.28 + lane * 0.38 + rnd(-0.18, 0.18);
      return {
        dx: Math.cos(angle) * radius * 1.8,
        dy: Math.sin(angle) * radius * 0.52 + lane * rnd(1.2, 3),
        radius,
        off: rnd(0, Math.PI * 2),
        alpha: rnd(0.1, 0.3),
      };
    });

    const galaxyHalo = Array.from({ length: GALAXY_HALO_COUNT }, () => {
      const radius = rnd(18, 48);
      const angle = rnd(0, Math.PI * 2);
      const flatten = rnd(0.48, 0.7);
      return {
        dx: Math.cos(angle) * radius * rnd(1.05, 1.75),
        dy: Math.sin(angle) * radius * flatten,
        radius,
        r: rnd(70, 150),
        g: rnd(80, 150),
        b: rnd(150, 255),
        alpha: rnd(0.045, 0.16),
        off: rnd(0, Math.PI * 2),
      };
    });

    const accretionSprite = Array.from({ length: ACCRETION_SPRITE_COUNT }, () => {
      const radius = 6.8 + (Math.random() ** 0.72) * 20;
      const angle = rnd(0, Math.PI * 2);
      const tilt = 0.42 + Math.random() * 0.12;
      const turbulence = rnd(-1.35, 1.35);
      const heat = 1 - (radius - 6.8) / 22;
      const front = Math.sin(angle) > -0.08 ? 1 : 0.52;
      const doppler = Math.cos(angle - 0.45) > 0 ? 1.18 : 0.82;

      return {
        radius,
        angle,
        tilt,
        dx: Math.cos(angle) * radius * 2.12,
        dy: Math.sin(angle) * radius * tilt + turbulence,
        speed: (0.006 + heat * 0.012) * (Math.random() < 0.18 ? -0.45 : 1),
        phase: rnd(0, Math.PI * 2),
        front,
        doppler,
        heat,
        width: Math.random() > 0.88 ? 2 : 1,
      };
    });

    const photonRing = Array.from({ length: 96 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      return {
        angle,
        wobble: rnd(-0.45, 0.45),
        off: rnd(0, Math.PI * 2),
      };
    });

    const lensedStars = Array.from({ length: LENSING_STAR_COUNT }, () => {
      const angle = rnd(0, Math.PI * 2);
      const radius = rnd(12, 29);
      return {
        angle,
        radius,
        length: irnd(2, 5),
        phase: rnd(0, Math.PI * 2),
        tint: Math.random() < 0.6 ? 'blue' : 'amber',
      };
    });

    const galaxyPixels = [];
    for (let dy = -18; dy <= 18; dy += 1) {
      for (let dx = -28; dx <= 28; dx += 1) {
        const dist = Math.sqrt((dx / 1.65) ** 2 + dy ** 2);
        if (dist > 18) continue;
        const angle = Math.atan2(dy, dx);
        const arm = Math.max(
          Math.sin(angle * 2 + dist * 0.55),
          Math.cos(angle * 2 + dist * 0.55),
        );
        const prob = (1 - dist / 18) * 0.54 + arm * 0.16;
        if (Math.random() > prob) continue;

        let r;
        let g;
        let b;
        if (dist < 3) {
          r = 255; g = 245; b = 200;
        } else if (dist < 7) {
          r = 210; g = 175; b = 255;
        } else if (dist < 12) {
          r = 120; g = 95; b = 230;
        } else {
          r = 48; g = 42; b = 150;
        }

        const br = 0.4 + Math.random() * 0.6;
        galaxyPixels.push({
          dx,
          dy,
          r: r * br,
          g: g * br,
          b: b * br,
          twinkle: Math.random() < 0.28,
          tSpd: rnd(0.033, 0.09),
          tOff: rnd(0, Math.PI * 2),
        });
      }
    }

    const discPixels = [];
    for (let dy = -bhDisc - 4; dy <= bhDisc + 4; dy += 1) {
      for (let dx = -(bhDisc + 7); dx <= bhDisc + 7; dx += 1) {
        const dist = Math.sqrt((dx / 1.55) ** 2 + dy ** 2);
        if (dist < bhRadius + 0.5 || dist > bhDisc + 4) continue;
        const ratio = (dist - bhRadius) / (bhDisc - bhRadius + 4);
        if (Math.random() > (1 - ratio) * 0.5) continue;

        let r;
        let g;
        let b;
        if (ratio < 0.3) {
          r = 255; g = 158 + ratio * 170; b = 0;
        } else if (ratio < 0.62) {
          r = 245; g = 58; b = 18;
        } else {
          r = 145; g = 18; b = 95;
        }

        discPixels.push({
          dx,
          dy,
          r,
          g,
          b,
          orbSpd: rnd(0.0018, 0.0052) * (Math.random() < 0.5 ? 1 : -1),
          orbOff: rnd(0, Math.PI * 2),
          tSpd: rnd(0.05, 0.115),
          tOff: rnd(0, Math.PI * 2),
        });
      }
    }

    const lensArcs = [];
    for (let a = 0; a < Math.PI * 2; a += 0.11) {
      const radius = bhRadius + 1.1 + Math.sin(a * 4) * 0.6;
      lensArcs.push({
        dx: Math.round(Math.cos(a) * radius * 1.65),
        dy: Math.round(Math.sin(a) * radius),
        a,
      });
    }

    const nebulaRing = Array.from({ length: NEBULA_RING_COUNT }, () => {
      const angle = rnd(0, Math.PI * 2);
      const dist = rnd(bhDisc + 1, bhDisc + 15);
      return {
        dx: Math.round(Math.cos(angle) * dist * 1.35),
        dy: Math.round(Math.sin(angle) * dist),
        br: rnd(0.035, 0.2),
        tSpd: rnd(0.02, 0.05),
        tOff: rnd(0, Math.PI * 2),
      };
    });

    const resize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const renderScale = Math.min(
        1,
        MAX_CANVAS_WIDTH / viewportWidth,
        MAX_CANVAS_HEIGHT / viewportHeight,
        Math.sqrt(MAX_CANVAS_AREA / (viewportWidth * viewportHeight)),
      );

      width = canvas.width = Math.max(1, Math.round(viewportWidth * renderScale));
      height = canvas.height = Math.max(1, Math.round(viewportHeight * renderScale));
      cols = Math.ceil(width / PX);
      rows = Math.ceil(height / PX);
      ctx.imageSmoothingEnabled = false;

      const compact = viewportWidth < 760;
      galaxy.baseCx = compact ? 0.9 : 0.86;
      galaxy.baseCy = compact ? 0.14 : 0.18;
      galaxy.scale = compact ? 0.72 : 1.08;
      blackHole.baseCx = compact ? 0.1 : 0.13;
      blackHole.baseCy = compact ? 0.88 : 0.78;
      blackHole.scale = compact ? 0.72 : 1.08;
      station.baseCx = compact ? 0.16 : 0.12;
      station.baseCy = compact ? 0.17 : 0.22;
      station.scale = compact ? 0.72 : 1;
    };

    const px = (gx, gy, r, g, b, a = 1) => {
      if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) return;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`;
      ctx.fillRect(gx * PX, gy * PX, PX, PX);
    };

    const canvasPx = (x, y, r, g, b, a = 1, size = PX) => {
      if (x < -size || y < -size || x >= width || y >= height) return;
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`;
      ctx.fillRect(x, y, size, size);
    };

    const drawScaledPx = (originX, originY, scale, dx, dy, r, g, b, a = 1) => {
      const block = Math.max(2, Math.round(PX * Math.max(0.72, scale)));
      canvasPx(originX + dx * PX * scale, originY + dy * PX * scale, r, g, b, a, block);
    };

    const drawSpritePx = (originX, originY, scale, dx, dy, r, g, b, a = 1, size = 1) => {
      const block = Math.max(2, Math.round(PX * size * Math.max(0.72, scale)));
      canvasPx(originX + dx * PX * scale, originY + dy * PX * scale, r, g, b, a, block);
    };

    const glow = (x, y, radius, colors, alpha = 1) => {
      if (radius <= 0 || x + radius < 0 || y + radius < 0 || x - radius > width || y - radius > height) return;
      const left = Math.max(0, x - radius);
      const top = Math.max(0, y - radius);
      const right = Math.min(width, x + radius);
      const bottom = Math.min(height, y + radius);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      for (const stop of colors) gradient.addColorStop(stop[0], stop[1]);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.restore();
    };

    const spawnShot = () => {
      const fromLeft = Math.random() < 0.5;
      shots.push({
        x: fromLeft ? 0 : cols,
        y: irnd(2, rows * 0.45),
        vx: fromLeft ? rnd(1.1, 1.8) : rnd(-1.8, -1.1),
        vy: rnd(0.35, 0.72),
        len: irnd(6, 11),
        life: 0,
        maxLife: irnd(28, 48),
      });
    };

    const draw = (now = 0) => {
      if (!reduceMotion) raf = requestAnimationFrame(draw);
      const elapsed = lastTime ? now - lastTime : 1000 / FPS;
      if (document.hidden || elapsed < 1000 / FPS) return;
      const frameStep = clamp(elapsed / (1000 / FPS), 0.75, 2.5);
      lastTime = now;
      const activeSpeed = isGame ? 0.72 : BG_SPEED;
      frame += activeSpeed * frameStep;

      ctx.fillStyle = isGame ? '#000008' : '#00000a';
      ctx.fillRect(0, 0, width, height);

      if (isGame) {
        ctx.fillStyle = 'rgba(0,255,255,0.025)';
        const gridY = Math.round((frame * 0.18) % 58);
        for (let y = gridY; y < height; y += 58) ctx.fillRect(0, y, width, 1);
        ctx.fillStyle = 'rgba(80,130,255,0.018)';
        const gridX = Math.round((frame * 0.12) % 86);
        for (let x = gridX; x < width; x += 86) ctx.fillRect(x, 0, 1, height);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, width, Math.max(1, Math.round(height * 0.08)));
        ctx.fillRect(0, Math.round(height * 0.92), width, Math.max(1, Math.round(height * 0.08)));
      }

      galaxy.cx = galaxy.baseCx + Math.sin(frame * 0.0065) * 0.012;
      galaxy.cy = galaxy.baseCy + Math.cos(frame * 0.0045) * 0.01;
      blackHole.cx = blackHole.baseCx + Math.sin(frame * 0.0048 + 1.8) * 0.01;
      blackHole.cy = blackHole.baseCy + Math.cos(frame * 0.0058 + 0.7) * 0.012;
      station.cx = station.baseCx + Math.sin(frame * 0.0026 + 2.4) * 0.004;
      station.cy = station.baseCy + Math.cos(frame * 0.0032 + 0.8) * 0.004;
      galaxy.rot += 0.0048 * activeSpeed * frameStep;
      blackHole.rot += 0.0022 * activeSpeed * frameStep;
      blackHole.axis += 0.001 * activeSpeed * frameStep;

      const galaxyX = galaxy.cx * width;
      const galaxyY = galaxy.cy * height;
      const bhX = blackHole.cx * width;
      const bhY = blackHole.cy * height;
      const stationX = station.cx * width;
      const stationY = station.cy * height;
      const bhAxis = blackHole.axis + Math.sin(frame * 0.006) * 0.08;
      const bhCos = Math.cos(bhAxis);
      const bhSin = Math.sin(bhAxis);
      const bhTiltPhase = 0.5 + 0.5 * Math.sin(frame * 0.0065 + 0.9);
      const bhTopView = bhTiltPhase * bhTiltPhase * (3 - 2 * bhTiltPhase);
      const bhPoint = (dx, dy) => ({
        x: dx * bhCos - dy * bhSin,
        y: dx * bhSin + dy * bhCos,
      });
      const ringX = (value, strength = 1) => value * (1 - bhTopView * 0.42 * strength);
      const ringY = (value, strength = 1) => value * (1 + bhTopView * 0.62 * strength);
      const drawBhPx = (dx, dy, r, g, b, a = 1, size = 1, scale = blackHole.scale) => {
        const p = bhPoint(dx, dy);
        drawSpritePx(bhX, bhY, scale, p.x, p.y, r, g, b, a, size);
      };
      const drawBhScaledPx = (dx, dy, r, g, b, a = 1, scale = blackHole.scale) => {
        const p = bhPoint(dx, dy);
        drawScaledPx(bhX, bhY, scale, p.x, p.y, r, g, b, a);
      };

      if (!isGame) {
      glow(galaxyX, galaxyY, Math.min(width, height) * 0.24, [
        [0, 'rgba(255,244,205,.17)'],
        [0.2, 'rgba(210,190,255,.14)'],
        [0.58, 'rgba(80,145,255,.052)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.86);
      glow(bhX, bhY, Math.min(width, height) * 0.27, [
        [0, 'rgba(0,0,0,.9)'],
        [0.22, 'rgba(255,80,0,.13)'],
        [0.48, 'rgba(176,40,255,.11)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.95);

      for (const cloud of nebulaStream) {
        const flow = (cloud.t + Math.sin(frame * 0.003 + cloud.off) * 0.018 + cloud.drift) % 1;
        const inv = 1 - flow;
        const wave = Math.sin(flow * Math.PI);
        const x = (galaxy.cx * flow + blackHole.cx * inv + cloud.width * wave + cloud.curve) * width;
        const y = (galaxy.cy * flow + blackHole.cy * inv + Math.cos(flow * Math.PI * 1.2 + cloud.off) * 0.035 * wave) * height;
        const inUiLane = x > width * 0.28 && x < width * 0.72 && y > height * 0.12 && y < height * 0.88;
        const tw = 0.65 + 0.35 * Math.sin(frame * cloud.pulse + cloud.off);
        const alpha = cloud.alpha * tw * wave * (inUiLane ? 0.28 : 1);
        const block = PX * cloud.size;
        if (cloud.color === 'violet') canvasPx(x, y, 92, 48, 180, alpha, block);
        else if (cloud.color === 'cyan') canvasPx(x, y, 18, 158, 184, alpha, block);
        else canvasPx(x, y, 210, 132, 48, alpha * 0.74, block);
      }

      for (const distant of distantGalaxies) {
        distant.rot += distant.spin * BG_SPEED * frameStep;
        const depthScale = (width < 760 ? 0.72 : 1) * distant.scale;
        const originX = distant.cx * width + Math.sin(frame * distant.drift + distant.off) * 12 * depthScale;
        const originY = distant.cy * height + Math.cos(frame * distant.drift * 0.8 + distant.off) * 8 * depthScale;
        const glowPulse = 0.72 + 0.28 * Math.sin(frame * distant.drift * 7 + distant.off);
        glow(originX, originY, Math.min(width, height) * 0.052 * distant.scale, [
          [0, `rgba(245,230,190,${distant.glow * glowPulse})`],
          [0.42, `rgba(92,130,255,${distant.glow * 0.55 * glowPulse})`],
          [1, 'rgba(0,0,0,0)'],
        ], 0.45);
        glow(originX, originY, Math.min(width, height) * 0.018 * distant.scale, [
          [0, `rgba(255,242,190,${0.16 * distant.brightness * glowPulse})`],
          [0.55, `rgba(190,150,255,${0.08 * distant.brightness * glowPulse})`],
          [1, 'rgba(0,0,0,0)'],
        ], 0.72);

        for (const lane of distant.dustLanes) {
          const localSpin = distant.rot * (distant.twist - lane.radius / 66)
            + Math.sin(frame * 0.0024 + lane.off) * 0.035;
          const cosR = Math.cos(localSpin);
          const sinR = Math.sin(localSpin);
          const rx = lane.dx * cosR - lane.dy * sinR;
          const ry = lane.dx * sinR + lane.dy * cosR;
          const alpha = lane.alpha * (0.68 + 0.32 * Math.sin(frame * 0.012 + lane.off));
          canvasPx(
            originX + rx * PX * depthScale,
            originY + ry * PX * depthScale,
            5,
            4,
            18,
            clamp(alpha, 0, 0.28),
            Math.max(1, Math.round(PX * depthScale)),
          );
        }

        for (const point of distant.points) {
          const localSpin = distant.rot * (distant.twist - point.radius / 68)
            + frame * point.orbitSpeed
            + Math.sin(frame * 0.003 + point.orbitPhase) * 0.035 * distant.twist;
          const cosR = Math.cos(localSpin);
          const sinR = Math.sin(localSpin);
          const breath = 1 + Math.sin(frame * 0.008 + point.off + point.radius * 0.08) * 0.045 * distant.twist;
          const rx = point.dx * cosR - point.dy * sinR;
          const ry = point.dx * sinR + point.dy * cosR;
          const tw = 0.66 + 0.34 * Math.sin(frame * point.twinkle * 1.8 + point.off);
          const edgeFade = distant.kind === 'irregular' ? 0.92 : 1 - Math.min(point.radius / 40, 0.62);
          const light = point.core ? distant.brightness * 2.45 : distant.brightness;
          const alphaBoost = point.core ? 1.55 : 0.88 + distant.brightness * 0.12;
          canvasPx(
            originX + rx * breath * PX * depthScale,
            originY + ry * breath * PX * depthScale,
            clamp(point.r * tw * light, 0, 255),
            clamp(point.g * tw * light, 0, 255),
            clamp(point.b * tw * light, 0, 255),
            clamp(point.alpha * edgeFade * alphaBoost, 0, 0.9),
            Math.max(1, Math.round(PX * point.size * depthScale)),
          );
        }
        const corePulse = 0.72 + 0.28 * Math.sin(frame * 0.028 + distant.off);
        canvasPx(originX, originY, 255 * corePulse, 238 * corePulse, 185 * corePulse, clamp(0.28 + distant.brightness * 0.18, 0.32, 0.6), 1);
      }
      }

      for (const item of dust) {
        const tw = 0.4 + 0.6 * Math.sin(frame * item.spd + item.off);
        const driftX = Math.sin(frame * item.drift + item.off) * item.depth * 1.45;
        const driftY = Math.cos(frame * item.drift * 0.72 + item.off) * item.depth * 0.82;
        const x = ((((item.x + driftX) % 100 + 100) % 100) / 100) * width;
        const y = ((((item.y + driftY) % 100 + 100) % 100) / 100) * height;
        const br = item.br * tw * (isGame ? 0.42 : 1);
        if (item.hue === 'purple') canvasPx(x, y, 60 * br, 10 * br, 120 * br, 1, PX);
        else canvasPx(x, y, 0, 80 * br, 100 * br, 1, PX);
      }

      for (const star of stars) {
        const wave = 0.5 + 0.5 * Math.sin(frame * star.spd + star.off);
        const blink = 0.1 + 0.9 * (wave ** 1.8);
        const flare = Math.sin(frame * star.spd * star.pulse + star.off * 2.3) > 0.965 ? 1.65 : 1;
        const v = clamp((25 + blink * 245) * star.br * flare * (isGame ? 0.52 : 1), 0, 255);
        const driftX = Math.sin(frame * star.drift + star.off) * star.depth * 1.18;
        const driftY = Math.cos(frame * star.drift * 0.8 + star.off) * star.depth * 0.64;
        const x = ((((star.x + driftX) % 100 + 100) % 100) / 100) * width;
        const y = ((((star.y + driftY) % 100 + 100) % 100) / 100) * height;
        let r = v;
        let g = v;
        let b = v;
        if (star.type === 1) b = Math.min(255, v + 60);
        else if (star.type === 2) { g = Math.min(255, v + 30); b = Math.max(0, v - 40); }
        canvasPx(x, y, r, g, b, isGame ? 0.72 : 1, PX * (isGame ? 1 : star.size));
      }

      if (!isGame) {
      for (const [dx, dy] of stationShadow) {
        drawSpritePx(stationX, stationY, station.scale, dx, dy, 6, 7, 20, 0.58);
      }
      for (const [dx, dy] of stationHull) {
        const topLit = dy < 0 ? 1.25 : 0.78;
        drawSpritePx(
          stationX,
          stationY,
          station.scale,
          dx,
          dy,
          54 * topLit,
          74 * topLit,
          104 * topLit,
          0.64,
        );
      }
      for (const light of stationLights) {
        const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(frame * light.speed + light.off));
        drawSpritePx(
          stationX,
          stationY,
          station.scale,
          light.x,
          light.y,
          light.color[0] * pulse,
          light.color[1] * pulse,
          light.color[2] * pulse,
          0.92,
        );
      }
      }

      if (!isGame) {
      for (const point of nebulaRing) {
        const tw = 0.3 + 0.7 * Math.sin(frame * point.tSpd + point.tOff);
        const br = point.br * tw;
        const swirl = blackHole.rot * 0.36 + point.tOff * 0.04;
        const cosS = Math.cos(swirl);
        const sinS = Math.sin(swirl);
        const dx = point.dx * cosS - point.dy * sinS;
        const dy = point.dx * sinS + point.dy * cosS;
        drawBhScaledPx(ringX(dx, 0.72), ringY(dy, 0.72), (40 + 30 * tw) * br, (5 + 5 * tw) * br, (100 + 60 * tw) * br);
      }

      for (let pulseIndex = 0; pulseIndex < 2; pulseIndex += 1) {
        const progress = ((frame + pulseIndex * GRAVITY_PULSE_PERIOD * 0.5) % GRAVITY_PULSE_PERIOD) / GRAVITY_PULSE_PERIOD;
        const radius = 14 + progress * 42;
        const alpha = Math.sin(progress * Math.PI) * (1 - progress * 0.45) * 0.22;
        const warp = 1 + Math.sin(frame * 0.018 + pulseIndex) * 0.04;
        for (let a = 0; a < Math.PI * 2; a += 0.18) {
          if (((a * 10 + frame * 0.04) | 0) % 7 === 0) continue;
          const shimmer = 0.72 + 0.28 * Math.sin(frame * 0.05 + a * 5 + pulseIndex);
          drawBhPx(ringX(Math.cos(a) * radius * 2.05 * warp, 0.82), ringY(Math.sin(a) * radius * 0.84 / warp, 0.82), 92 * shimmer, 48 * shimmer, 210 * shimmer, alpha);
        }
      }

      for (const star of lensedStars) {
        const angle = star.angle + blackHole.rot * 0.1;
        const flicker = 0.42 + 0.58 * Math.sin(frame * 0.036 + star.phase);
        const baseDx = Math.cos(angle) * star.radius * 2.1;
        const baseDy = Math.sin(angle) * star.radius * 0.82;
        const tanX = -Math.sin(angle);
        const tanY = Math.cos(angle) * 0.42;
        const warm = star.tint === 'amber';
        for (let i = 0; i < star.length; i += 1) {
          const fade = (1 - i / star.length) * flicker;
          drawBhPx(ringX(baseDx + tanX * i * 1.55, 0.58), ringY(baseDy + tanY * i * 1.55, 0.58), warm ? 255 * fade : 165 * fade, warm ? 180 * fade : 210 * fade, warm ? 90 * fade : 255 * fade, 0.54);
        }
      }

      for (const point of accretionSprite) {
        const orbit = point.angle + frame * point.speed + point.phase * 0.06;
        const pulse = Math.sin(frame * 0.052 + point.phase) * 0.55;
        const radius = point.radius + pulse;
        const dx = ringX(Math.cos(orbit) * radius * 2.15, 0.95);
        const dy = ringY(Math.sin(orbit) * radius * (point.tilt + bhTopView * 0.4) + Math.sin(frame * 0.035 + point.phase) * 0.8, 0.95);
        const heat = clamp(point.heat + Math.sin(frame * 0.028 + point.phase) * 0.12, 0, 1);
        const br = (0.48 + heat * 0.72) * point.front * point.doppler;
        const r = clamp(118 + heat * 176, 0, 255);
        const g = clamp(28 + heat * 182, 0, 255);
        const b = clamp(12 + (1 - heat) * 120 + Math.max(0, point.doppler - 1) * 80, 0, 255);
        drawBhPx(dx, dy, r * br, g * br, b * br, 0.88, point.width);
      }

      for (const point of discPixels) {
        const orb = blackHole.rot + frame * point.orbSpd + point.orbOff;
        const cosO = Math.cos(orb);
        const sinO = Math.sin(orb);
        const rx = (point.dx * cosO - point.dy * sinO) | 0;
        const ry = (point.dx * sinO + point.dy * cosO) | 0;
        const tw = 0.45 + 0.55 * Math.sin(frame * point.tSpd + point.tOff);
        drawBhScaledPx(ringX(rx, 0.92), ringY(ry, 0.92), clamp(point.r * tw, 0, 255), clamp(point.g * tw, 0, 255), clamp(point.b * tw, 0, 255));
      }

      for (const arc of lensArcs) {
        const phase = 0.5 + 0.5 * Math.sin(frame * 0.04 + arc.a * 3);
        const pulse = 1 + Math.sin(frame * 0.025 + arc.a) * 0.08;
        drawBhScaledPx(ringX(arc.dx, 0.82), ringY(arc.dy, 0.82), 160 * phase, 80 * phase, 255 * phase, 1, blackHole.scale * pulse);
      }

      for (const point of photonRing) {
        const angle = point.angle + blackHole.rot * 0.22;
        const flicker = 0.48 + 0.52 * Math.sin(frame * 0.07 + point.off);
        const radius = bhRadius + 1.4 + point.wobble * flicker;
        drawBhPx(ringX(Math.cos(angle) * radius * 2.25, 1), ringY(Math.sin(angle) * radius * 0.86, 1), 255 * flicker, 172 * flicker, 78 * flicker, 0.82);
      }

      const orbitalBands = [
        { radius: bhRadius + 4.2, spin: 0.08, tint: [255, 132, 42], alpha: 0.32, tilt: 0.92 },
        { radius: bhRadius + 7.4, spin: -0.06, tint: [178, 84, 255], alpha: 0.24, tilt: 0.68 },
        { radius: bhRadius + 10.8, spin: 0.035, tint: [88, 210, 255], alpha: 0.18, tilt: 0.5 },
      ];
      for (const band of orbitalBands) {
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          if (((a * 9 + frame * 0.035) | 0) % 5 === 0) continue;
          const angle = a + blackHole.rot * band.spin;
          const shimmer = 0.62 + 0.38 * Math.sin(frame * 0.052 + a * 4 + band.radius);
          drawBhPx(
            ringX(Math.cos(angle) * band.radius * 2.15, band.tilt),
            ringY(Math.sin(angle) * band.radius * 0.86, band.tilt),
            band.tint[0] * shimmer,
            band.tint[1] * shimmer,
            band.tint[2] * shimmer,
            band.alpha * shimmer,
          );
        }
      }

      for (let dy = -bhRadius; dy <= bhRadius; dy += 1) {
        for (let dx = -bhRadius; dx <= bhRadius; dx += 1) {
          if (Math.sqrt(dx ** 2 + dy ** 2) <= bhRadius) {
            drawSpritePx(bhX, bhY, blackHole.scale, dx, dy, 0, 0, 0, 1);
          }
        }
      }

      for (let a = 0; a < Math.PI * 2; a += 0.14) {
        const shim = 0.3 + 0.7 * Math.sin(frame * 0.06 + a * 5);
        drawBhScaledPx(
          ringX(Math.round(Math.cos(a + blackHole.rot * 0.28) * (bhRadius * 2.15)), 0.72),
          ringY(Math.round(Math.sin(a + blackHole.rot * 0.28) * bhRadius), 0.72),
          90 * shim,
          0,
          200 * shim,
        );
      }
      }

      if (!isGame) {
      for (const point of galaxyHalo) {
        const spin = galaxy.rot * (0.42 - point.radius / 180);
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = point.dx * cosS - point.dy * sinS;
        const ry = point.dx * sinS + point.dy * cosS;
        const tw = 0.7 + 0.3 * Math.sin(frame * 0.015 + point.off);
        drawSpritePx(
          galaxyX,
          galaxyY,
          galaxy.scale,
          rx,
          ry,
          point.r * tw,
          point.g * tw,
          point.b * tw,
          point.alpha,
        );
      }

      for (let arm = 0; arm < 3; arm += 1) {
        const armOffset = arm * ((Math.PI * 2) / 3);
        for (let step = 4; step < 31; step += 2) {
          const angle = galaxy.rot * 1.8 + armOffset + step * 0.29;
          const sway = Math.sin(frame * 0.018 + step * 0.31 + arm) * 0.8;
          const dx = Math.cos(angle) * step * 1.62;
          const dy = Math.sin(angle) * (step * 0.72 + sway);
          const fade = 1 - step / 34;
          drawScaledPx(galaxyX, galaxyY, galaxy.scale, dx, dy, 90 * fade, 120 * fade, 255 * fade, 0.65);
        }
      }

      for (const lane of galaxyDustLanes) {
        const spin = galaxy.rot * (1.05 - lane.radius / 38);
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = lane.dx * cosS - lane.dy * sinS;
        const ry = lane.dx * sinS + lane.dy * cosS;
        const alpha = lane.alpha * (0.72 + 0.28 * Math.sin(frame * 0.018 + lane.off));
        drawSpritePx(galaxyX, galaxyY, galaxy.scale, rx, ry, 2, 1, 12, alpha, 2);
      }

      for (const point of galaxySprite) {
        const spin = galaxy.rot * (1.16 - point.radius / 42);
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = point.dx * cosS - point.dy * sinS;
        const ry = point.dx * sinS + point.dy * cosS;
        const tw = 0.62 + 0.38 * Math.sin(frame * point.twinkle + point.off);
        const coreLift = point.radius < 5.4 ? 1.18 : 1;
        drawSpritePx(
          galaxyX,
          galaxyY,
          galaxy.scale,
          rx,
          ry,
          clamp(point.r * tw * coreLift, 0, 255),
          clamp(point.g * tw * coreLift, 0, 255),
          clamp(point.b * tw * coreLift, 0, 255),
          point.radius < 8 ? 0.92 : 0.72,
          point.size,
        );
      }

      for (const point of galaxyPixels) {
        const tw = point.twinkle ? 0.55 + 0.45 * Math.sin(frame * point.tSpd + point.tOff) : 1;
        const dist = Math.sqrt(point.dx ** 2 + point.dy ** 2);
        const spin = galaxy.rot * (1.1 - dist / 24);
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = (point.dx * cosS - point.dy * sinS) | 0;
        const ry = (point.dx * sinS + point.dy * cosS) | 0;
        drawScaledPx(galaxyX, galaxyY, galaxy.scale, rx, ry, clamp(point.r * tw, 0, 255), clamp(point.g * tw, 0, 255), clamp(point.b * tw, 0, 255));
      }
      }

      if (!isGame) {
        shotTimer -= frameStep;
        if (shotTimer <= 0) {
          spawnShot();
          shotTimer = irnd(210, 500);
        }
        for (let i = shots.length - 1; i >= 0; i -= 1) {
          const shot = shots[i];
          shot.x += shot.vx * frameStep;
          shot.y += shot.vy * frameStep;
          shot.life += frameStep;
          const alpha = 1 - shot.life / shot.maxLife;
          for (let j = 0; j < shot.len; j += 1) {
            const a2 = alpha * (1 - j / shot.len);
            px((shot.x - shot.vx * j) | 0, (shot.y - shot.vy * j) | 0, 255, 255, 180 + j * 5, a2);
          }
          if (shot.life >= shot.maxLife) shots.splice(i, 1);
        }
      }

    };

    resize();
    window.addEventListener('resize', resize);
    if (reduceMotion) draw(1000 / FPS);
    else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={`space-canvas-bg space-canvas-bg--${variant}`} aria-hidden="true" />;
}

export default memo(StarField);
