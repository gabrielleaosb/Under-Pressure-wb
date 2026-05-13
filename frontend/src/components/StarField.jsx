import React, { memo, useEffect, useRef } from 'react';

const PX = 3;
const FPS = 30;
const BG_SPEED = 1.65;
const STAR_COUNT = 230;
const DUST_COUNT = 86;
const NEBULA_RING_COUNT = 130;
const GALAXY_SPRITE_COUNT = 520;
const GALAXY_DUST_LANE_COUNT = 120;
const GALAXY_HALO_COUNT = 160;
const ACCRETION_SPRITE_COUNT = 360;
const LENSING_STAR_COUNT = 76;

const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

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
    const blackHole = { baseCx: 0.13, baseCy: 0.78, cx: 0.13, cy: 0.78, rot: 0, scale: 1 };
    const bhRadius = 7;
    const bhDisc = 14;

    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: irnd(0, 100),
      y: irnd(0, 100),
      size: Math.random() < 0.1 ? 2 : 1,
      br: rnd(0.28, 1),
      spd: rnd(0.02, 0.07),
      off: rnd(0, Math.PI * 2),
      type: irnd(0, 3),
      pulse: rnd(0.35, 0.95),
    }));

    const dust = Array.from({ length: DUST_COUNT }, () => ({
      x: irnd(0, 100),
      y: irnd(0, 100),
      br: rnd(0.04, 0.18),
      spd: rnd(0.01, 0.033),
      off: rnd(0, Math.PI * 2),
      hue: Math.random() < 0.5 ? 'purple' : 'teal',
    }));

    const galaxySprite = Array.from({ length: GALAXY_SPRITE_COUNT }, () => {
      const arm = irnd(0, 4);
      const radius = Math.random() < 0.18
        ? rnd(0, 5.2)
        : 5 + (Math.random() ** 0.62) * 29;
      const spread = 1 - Math.min(radius / 36, 0.95);
      const angle = arm * (Math.PI / 2) + radius * 0.285 + rnd(-0.34, 0.34) * (0.7 + spread);
      const haze = rnd(-1.9, 1.9) * (0.4 + spread);
      const dx = Math.cos(angle) * radius * 1.78 + haze;
      const dy = Math.sin(angle) * radius * 0.58 + rnd(-1.1, 1.1);
      const hotCore = radius < 5.4;
      const youngStar = !hotCore && Math.random() < 0.34;
      const amber = !hotCore && !youngStar && Math.random() < 0.2;
      const br = rnd(0.46, 1.08) * (1 - radius / 52);

      let r = 116;
      let g = 128;
      let b = 255;
      if (hotCore) {
        r = 255; g = rnd(212, 248); b = rnd(142, 202);
      } else if (youngStar) {
        r = rnd(120, 178); g = rnd(168, 218); b = 255;
      } else if (amber) {
        r = rnd(220, 255); g = rnd(128, 184); b = rnd(70, 128);
      } else {
        r = rnd(95, 176); g = rnd(72, 126); b = rnd(205, 255);
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
      const radius = rnd(7, 31);
      const angle = radius * 0.31 + lane * 0.45 + rnd(-0.16, 0.16);
      return {
        dx: Math.cos(angle) * radius * 1.7,
        dy: Math.sin(angle) * radius * 0.56 + lane * rnd(1.6, 3.2),
        radius,
        off: rnd(0, Math.PI * 2),
        alpha: rnd(0.08, 0.24),
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
        speed: (0.023 + heat * 0.043) * (Math.random() < 0.18 ? -0.55 : 1),
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
          orbSpd: rnd(0.007, 0.02) * (Math.random() < 0.5 ? 1 : -1),
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
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / PX);
      rows = Math.ceil(height / PX);
      ctx.imageSmoothingEnabled = false;

      const compact = width < 760;
      galaxy.baseCx = compact ? 0.9 : 0.86;
      galaxy.baseCy = compact ? 0.14 : 0.18;
      galaxy.scale = compact ? 0.72 : 1.08;
      blackHole.baseCx = compact ? 0.1 : 0.13;
      blackHole.baseCy = compact ? 0.88 : 0.78;
      blackHole.scale = compact ? 0.72 : 1.08;
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
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      for (const stop of colors) gradient.addColorStop(stop[0], stop[1]);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
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
      if (document.hidden || now - lastTime < 1000 / FPS) return;
      lastTime = now;
      frame += BG_SPEED;

      ctx.fillStyle = '#00000a';
      ctx.fillRect(0, 0, width, height);

      galaxy.cx = galaxy.baseCx + Math.sin(frame * 0.0065) * 0.012;
      galaxy.cy = galaxy.baseCy + Math.cos(frame * 0.0045) * 0.01;
      blackHole.cx = blackHole.baseCx + Math.sin(frame * 0.0048 + 1.8) * 0.01;
      blackHole.cy = blackHole.baseCy + Math.cos(frame * 0.0058 + 0.7) * 0.012;
      galaxy.rot += 0.0048 * BG_SPEED;
      blackHole.rot += 0.0068 * BG_SPEED;

      const galaxyX = galaxy.cx * width;
      const galaxyY = galaxy.cy * height;
      const bhX = blackHole.cx * width;
      const bhY = blackHole.cy * height;

      glow(galaxyX, galaxyY, Math.min(width, height) * 0.24, [
        [0, 'rgba(245,236,180,.13)'],
        [0.22, 'rgba(125,86,255,.16)'],
        [0.72, 'rgba(0,255,255,.035)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.86);
      glow(bhX, bhY, Math.min(width, height) * 0.27, [
        [0, 'rgba(0,0,0,.9)'],
        [0.22, 'rgba(255,80,0,.13)'],
        [0.48, 'rgba(176,40,255,.11)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.95);

      for (const item of dust) {
        const tw = 0.4 + 0.6 * Math.sin(frame * item.spd + item.off);
        const gx = ((item.x / 100) * cols) | 0;
        const gy = ((item.y / 100) * rows) | 0;
        const br = item.br * tw;
        if (item.hue === 'purple') px(gx, gy, 60 * br, 10 * br, 120 * br);
        else px(gx, gy, 0, 80 * br, 100 * br);
      }

      for (const star of stars) {
        const wave = 0.5 + 0.5 * Math.sin(frame * star.spd + star.off);
        const blink = 0.1 + 0.9 * (wave ** 1.8);
        const flare = Math.sin(frame * star.spd * star.pulse + star.off * 2.3) > 0.965 ? 1.65 : 1;
        const v = clamp((25 + blink * 245) * star.br * flare, 0, 255);
        const gx = ((star.x / 100) * cols) | 0;
        const gy = ((star.y / 100) * rows) | 0;
        let r = v;
        let g = v;
        let b = v;
        if (star.type === 1) b = Math.min(255, v + 60);
        else if (star.type === 2) { g = Math.min(255, v + 30); b = Math.max(0, v - 40); }
        for (let sy = 0; sy < star.size; sy += 1) {
          for (let sx = 0; sx < star.size; sx += 1) px(gx + sx, gy + sy, r, g, b);
        }
      }

      for (const point of nebulaRing) {
        const tw = 0.3 + 0.7 * Math.sin(frame * point.tSpd + point.tOff);
        const br = point.br * tw;
        const swirl = blackHole.rot * 0.55 + point.tOff * 0.04;
        const cosS = Math.cos(swirl);
        const sinS = Math.sin(swirl);
        const dx = point.dx * cosS - point.dy * sinS;
        const dy = point.dx * sinS + point.dy * cosS;
        drawScaledPx(bhX, bhY, blackHole.scale, dx, dy, (40 + 30 * tw) * br, (5 + 5 * tw) * br, (100 + 60 * tw) * br);
      }

      for (const star of lensedStars) {
        const angle = star.angle + blackHole.rot * 0.16;
        const flicker = 0.42 + 0.58 * Math.sin(frame * 0.036 + star.phase);
        const baseDx = Math.cos(angle) * star.radius * 2.1;
        const baseDy = Math.sin(angle) * star.radius * 0.82;
        const tanX = -Math.sin(angle);
        const tanY = Math.cos(angle) * 0.42;
        const warm = star.tint === 'amber';
        for (let i = 0; i < star.length; i += 1) {
          const fade = (1 - i / star.length) * flicker;
          drawSpritePx(
            bhX,
            bhY,
            blackHole.scale,
            baseDx + tanX * i * 1.55,
            baseDy + tanY * i * 1.55,
            warm ? 255 * fade : 165 * fade,
            warm ? 180 * fade : 210 * fade,
            warm ? 90 * fade : 255 * fade,
            0.54,
          );
        }
      }

      for (const point of accretionSprite) {
        const orbit = point.angle + frame * point.speed + point.phase * 0.06;
        const pulse = Math.sin(frame * 0.052 + point.phase) * 0.55;
        const radius = point.radius + pulse;
        const dx = Math.cos(orbit) * radius * 2.15;
        const dy = Math.sin(orbit) * radius * point.tilt + Math.sin(frame * 0.035 + point.phase) * 0.8;
        const heat = clamp(point.heat + Math.sin(frame * 0.028 + point.phase) * 0.12, 0, 1);
        const br = (0.48 + heat * 0.72) * point.front * point.doppler;
        const r = clamp(118 + heat * 176, 0, 255);
        const g = clamp(28 + heat * 182, 0, 255);
        const b = clamp(12 + (1 - heat) * 120 + Math.max(0, point.doppler - 1) * 80, 0, 255);
        drawSpritePx(bhX, bhY, blackHole.scale, dx, dy, r * br, g * br, b * br, 0.88, point.width);
      }

      for (const point of discPixels) {
        const orb = blackHole.rot + frame * point.orbSpd + point.orbOff;
        const cosO = Math.cos(orb);
        const sinO = Math.sin(orb);
        const rx = (point.dx * cosO - point.dy * sinO) | 0;
        const ry = (point.dx * sinO + point.dy * cosO) | 0;
        const tw = 0.45 + 0.55 * Math.sin(frame * point.tSpd + point.tOff);
        drawScaledPx(bhX, bhY, blackHole.scale, rx, ry, clamp(point.r * tw, 0, 255), clamp(point.g * tw, 0, 255), clamp(point.b * tw, 0, 255));
      }

      for (const arc of lensArcs) {
        const phase = 0.5 + 0.5 * Math.sin(frame * 0.04 + arc.a * 3);
        const pulse = 1 + Math.sin(frame * 0.025 + arc.a) * 0.08;
        drawScaledPx(bhX, bhY, blackHole.scale * pulse, arc.dx, arc.dy, 160 * phase, 80 * phase, 255 * phase);
      }

      for (const point of photonRing) {
        const angle = point.angle + blackHole.rot * 0.34;
        const flicker = 0.48 + 0.52 * Math.sin(frame * 0.07 + point.off);
        const radius = bhRadius + 1.4 + point.wobble * flicker;
        drawSpritePx(
          bhX,
          bhY,
          blackHole.scale,
          Math.cos(angle) * radius * 2.25,
          Math.sin(angle) * radius * 0.86,
          255 * flicker,
          172 * flicker,
          78 * flicker,
          0.82,
        );
      }

      for (let dy = -bhRadius; dy <= bhRadius; dy += 1) {
        for (let dx = -(bhRadius * 2 + 2); dx <= bhRadius * 2 + 2; dx += 1) {
          if (Math.sqrt((dx / 2.1) ** 2 + dy ** 2) <= bhRadius) drawScaledPx(bhX, bhY, blackHole.scale, dx, dy, 0, 0, 0);
        }
      }

      for (let a = 0; a < Math.PI * 2; a += 0.14) {
        const shim = 0.3 + 0.7 * Math.sin(frame * 0.06 + a * 5);
        drawScaledPx(
          bhX,
          bhY,
          blackHole.scale,
          Math.round(Math.cos(a + blackHole.rot * 0.45) * (bhRadius * 2.15)),
          Math.round(Math.sin(a + blackHole.rot * 0.45) * bhRadius),
          90 * shim,
          0,
          200 * shim,
        );
      }

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

      shotTimer -= 1;
      if (shotTimer <= 0) {
        spawnShot();
        shotTimer = irnd(210, 500);
      }
      for (let i = shots.length - 1; i >= 0; i -= 1) {
        const shot = shots[i];
        shot.x += shot.vx;
        shot.y += shot.vy;
        shot.life += 1;
        const alpha = 1 - shot.life / shot.maxLife;
        for (let j = 0; j < shot.len; j += 1) {
          const a2 = alpha * (1 - j / shot.len);
          px((shot.x - shot.vx * j) | 0, (shot.y - shot.vy * j) | 0, 255, 255, 180 + j * 5, a2);
        }
        if (shot.life >= shot.maxLife) shots.splice(i, 1);
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
  }, []);

  return <canvas ref={canvasRef} className="space-canvas-bg" aria-hidden="true" />;
}

export default memo(StarField);
