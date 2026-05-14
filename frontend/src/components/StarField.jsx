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

const HOME_SUN = {
  cx: -0.055,
  cy: 0.16,
  compactCx: -0.18,
  compactCy: 0.12,
  radius: 38,
};

const HOME_PLANETS = [
  {
    kind: 'gas',
    cx: 0.8,
    cy: 0.6,
    compactCx: 0.9,
    compactCy: 0.48,
    radius: 18,
    scale: 1.24,
    compactScale: 0.7,
    depth: 0.78,
    drift: 0.0042,
    ampX: 18,
    ampY: 10,
    off: 0.3,
    ring: true,
    ringTilt: 0.32,
    ringWidth: 2.55,
    palette: {
      light: [255, 236, 174],
      mid: [192, 122, 68],
      dark: [54, 34, 76],
      band: [112, 230, 238],
      storm: [255, 96, 78],
      cloud: [255, 242, 204],
      glow: 'rgba(255,190,80,.17)',
    },
    moons: [
      { radius: 31, size: 2, speed: 0.019, off: 0.4, tint: [190, 238, 255] },
      { radius: 45, size: 1, speed: -0.012, off: 2.5, tint: [255, 222, 142] },
    ],
  },
  {
    kind: 'ocean',
    cx: 0.25,
    cy: 0.52,
    compactCx: 0.12,
    compactCy: 0.34,
    radius: 11,
    scale: 1.02,
    compactScale: 0.74,
    depth: 0.52,
    drift: 0.0054,
    ampX: 12,
    ampY: 7,
    off: 1.9,
    ring: false,
    palette: {
      light: [168, 245, 255],
      mid: [22, 116, 190],
      dark: [8, 24, 84],
      land: [52, 198, 128],
      cloud: [230, 255, 255],
      glow: 'rgba(0,180,255,.12)',
    },
    moons: [
      { radius: 22, size: 1, speed: 0.023, off: 1.7, tint: [220, 238, 255] },
    ],
  },
  {
    kind: 'volcanic',
    cx: 0.2,
    cy: 0.2,
    compactCx: 0.2,
    compactCy: 0.7,
    radius: 8,
    scale: 0.82,
    compactScale: 0.58,
    depth: 0.34,
    drift: 0.0068,
    ampX: 9,
    ampY: 5,
    off: 3.6,
    ring: false,
    palette: {
      light: [255, 210, 116],
      mid: [190, 64, 54],
      dark: [58, 18, 44],
      lava: [255, 176, 34],
      glow: 'rgba(255,96,40,.14)',
    },
    moons: [],
  },
  {
    kind: 'crystal',
    cx: 0.9,
    cy: 0.84,
    compactCx: 0.82,
    compactCy: 0.82,
    radius: 8,
    scale: 0.96,
    compactScale: 0.62,
    depth: 0.42,
    drift: 0.0038,
    ampX: 7,
    ampY: 5,
    off: 5.2,
    ring: false,
    palette: {
      light: [216, 255, 248],
      mid: [154, 66, 238],
      dark: [28, 18, 108],
      shard: [0, 255, 210],
      cloud: [248, 236, 255],
      glow: 'rgba(190,80,255,.16)',
    },
    moons: [],
  },
];

function StarField({ variant = 'menu' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const isGame = variant === 'game';
    const isHome = variant === 'home';

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
          radius = (Math.random() ** 0.78) * 22 * config.radiusScale;
          const arm = Math.random() < 0.5 ? 0 : Math.PI;
          const angle = arm + radius * 0.24 + rnd(-0.12, 0.12);
          const bar = Math.random() < 0.42;
          dx = bar ? rnd(-15, 15) : Math.cos(angle) * radius * 1.55;
          dy = bar ? rnd(-1.35, 1.35) : Math.sin(angle) * radius * 0.5;
        } else if (config.kind === 'irregular') {
          radius = (Math.random() ** 0.48) * 18 * config.radiusScale;
          const angle = rnd(0, Math.PI * 2);
          dx = Math.cos(angle) * radius * rnd(0.65, 1.9) + rnd(-4, 4);
          dy = Math.sin(angle) * radius * rnd(0.48, 1.1) + rnd(-3, 3);
        } else {
          radius = (Math.random() ** 0.74) * 22 * config.radiusScale;
          const arm = irnd(0, 2) * Math.PI;
          const angle = arm + radius * 0.29 + rnd(-0.13, 0.13);
          dx = Math.cos(angle) * radius * 1.72;
          dy = Math.sin(angle) * radius * 0.52;
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
          alpha: core
            ? rnd(0.72, 0.96)
            : ['barred', 'spiral'].includes(config.kind)
              ? rnd(0.26, 0.64)
              : rnd(0.14, 0.46),
          size: 1,
          off: rnd(0, Math.PI * 2),
          twinkle: rnd(0.008, 0.026),
          orbitSpeed: ['barred', 'spiral'].includes(config.kind)
            ? rnd(0.00002, 0.00018) * (core ? 0.18 : 1) * config.twist
            : rnd(0.00022, 0.00175) * (core ? 0.28 : 1) * config.twist * (Math.random() < 0.5 ? -1 : 1),
          orbitPhase: rnd(0, Math.PI * 2),
        };
      });

      const dustLanes = Array.from({ length: Math.round(config.count * 0.2) }, () => {
        const isCoherentGalaxy = config.kind === 'barred' || config.kind === 'spiral';
        const radius = rnd(5.5, 22 * config.radiusScale);
        const arm = config.kind === 'spiral'
          ? irnd(0, 2) * Math.PI
          : Math.random() < 0.5 ? 0 : Math.PI;
        const angle = arm + radius * (config.kind === 'barred' ? 0.23 : 0.29) + rnd(-0.08, 0.08);
        const lane = Math.random() < 0.5 ? 1 : -1;
        return {
          dx: Math.cos(angle) * radius * rnd(1.46, isCoherentGalaxy ? 1.72 : 2.02),
          dy: Math.sin(angle) * radius * rnd(0.38, isCoherentGalaxy ? 0.5 : 0.62) + lane * rnd(0.55, 1.45),
          radius,
          alpha: rnd(0.08, isCoherentGalaxy ? 0.17 : 0.24) * config.brightness,
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
      const roll = Math.random();
      let radius;
      let angle;
      let dx;
      let dy;
      let r;
      let g;
      let b;
      let alpha = 0.72;
      let size = 1;

      if (roll < 0.24) {
        radius = (Math.random() ** 0.72) * 7.4;
        angle = rnd(0, Math.PI * 2);
        dx = Math.cos(angle) * radius * 1.28 + rnd(-0.9, 0.9);
        dy = Math.sin(angle) * radius * 0.5 + rnd(-0.55, 0.55);
        const heat = 1 - radius / 8;
        r = 255;
        g = 218 + heat * 36;
        b = 150 + heat * 92;
        alpha = 0.9 + heat * 0.1;
        size = Math.random() < 0.55 ? 2 : 1;
      } else if (roll < 0.76) {
        radius = 5.5 + (Math.random() ** 0.72) * 38;
        const arm = irnd(0, 2) * Math.PI;
        angle = arm + radius * 0.265 + rnd(-0.18, 0.18);
        const normal = angle + Math.PI / 2;
        const thickness = rnd(-2.2, 2.2) * (0.75 + radius / 46);
        dx = Math.cos(angle) * radius * 1.66 + Math.cos(normal) * thickness;
        dy = Math.sin(angle) * radius * 0.54 + Math.sin(normal) * thickness * 0.42;
        const inner = Math.max(0, 1 - radius / 22);
        const outer = Math.max(0, (radius - 20) / 24);
        if (radius < 17) {
          r = 255;
          g = 176 + inner * 64;
          b = 82 + inner * 86;
        } else if (radius < 29) {
          r = 190;
          g = 128 + inner * 52;
          b = 92 + outer * 72;
        } else {
          r = 72 + outer * 32;
          g = 122 + outer * 58;
          b = 205 + outer * 50;
          alpha = 0.58;
        }
        size = Math.random() < (radius < 13 ? 0.22 : 0.06) ? 2 : 1;
      } else {
        radius = (Math.random() ** 0.54) * 42;
        angle = rnd(0, Math.PI * 2);
        const fade = Math.max(0.12, 1 - radius / 48);
        dx = Math.cos(angle) * radius * 1.62 + rnd(-1.8, 1.8) * fade;
        dy = Math.sin(angle) * radius * 0.54 + rnd(-1.1, 1.1) * fade;
        const rim = Math.max(0, (radius - 27) / 16);
        r = 82 + rim * 46;
        g = 92 + rim * 72;
        b = 162 + rim * 90;
        alpha = 0.2 + fade * 0.34;
      }

      const br = rnd(0.76, 1.18) * Math.max(0.22, 1 - radius / 68);
      return {
        dx,
        dy,
        radius,
        r: r * br,
        g: g * br,
        b: b * br,
        alpha,
        size,
        twinkle: rnd(0.012, 0.045),
        off: rnd(0, Math.PI * 2),
      };
    });

    const galaxyDustLanes = Array.from({ length: GALAXY_DUST_LANE_COUNT }, () => {
      const lane = Math.random() < 0.5 ? 1 : -1;
      const radius = rnd(6, 38);
      const arm = Math.random() < 0.56 ? 0 : Math.PI;
      const angle = arm + radius * 0.265 + lane * 0.3 + rnd(-0.12, 0.12);
      return {
        dx: Math.cos(angle) * radius * 1.64,
        dy: Math.sin(angle) * radius * 0.52 + lane * rnd(1.3, 3.6),
        radius,
        off: rnd(0, Math.PI * 2),
        alpha: rnd(0.1, 0.28),
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
        alpha: rnd(0.035, 0.13),
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
        const lane = 0.52 + 0.48 * Math.sin(Math.atan2(dy, dx) * 3 + dist * 0.72);
        const density = (1 - ratio) * 0.58 + lane * 0.14;
        if (Math.random() > density) continue;

        let r;
        let g;
        let b;
        if (ratio < 0.24) {
          r = 214; g = 255; b = 220 + ratio * 90;
        } else if (ratio < 0.56) {
          r = 46; g = 236; b = 184;
        } else {
          r = 14; g = 118; b = 106;
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
      galaxy.scale = compact ? 0.82 : 1.24;
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

    const drawHomeSun = () => {
      const compact = width < 760;
      const sunX = (compact ? HOME_SUN.compactCx : HOME_SUN.cx) * width
        + Math.sin(frame * 0.0028) * 8;
      const sunY = (compact ? HOME_SUN.compactCy : HOME_SUN.cy) * height
        + Math.cos(frame * 0.0036) * 7;
      const sunScale = compact ? 0.72 : 1;
      const unit = Math.max(2, Math.round(PX * sunScale));
      const radius = HOME_SUN.radius;
      const flare = 0.78 + 0.22 * Math.sin(frame * 0.026);

      glow(sunX, sunY, unit * radius * 5.2, [
        [0, 'rgba(255,244,174,.36)'],
        [0.18, 'rgba(255,168,56,.18)'],
        [0.48, 'rgba(255,96,40,.06)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.78);
      glow(sunX, sunY, unit * radius * 2.1, [
        [0, 'rgba(255,255,214,.62)'],
        [0.38, 'rgba(255,206,70,.22)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.72);

      for (let loop = 0; loop < 5; loop += 1) {
        const base = loop * 1.19 + frame * 0.006;
        const loopRadius = radius + 10 + loop * 2.6;
        const lean = Math.sin(frame * 0.012 + loop) * 0.28;
        for (let step = 0; step <= 1; step += 0.035) {
          const a = base + step * Math.PI * 0.86;
          const lift = Math.sin(step * Math.PI);
          const x = Math.cos(a) * (loopRadius + lift * 9);
          const y = Math.sin(a + lean) * (loopRadius * 0.72 + lift * 7);
          const alpha = lift * (0.14 + 0.075 * Math.sin(frame * 0.035 + loop));
          canvasPx(
            sunX + x * unit,
            sunY + y * unit,
            255,
            174 + 52 * lift,
            58,
            alpha,
            unit,
          );
        }
      }

      for (let a = 0; a < Math.PI * 2; a += 0.12) {
        const ray = radius + 7 + Math.sin(a * 7 + frame * 0.044) * 6;
        const alpha = 0.1 + 0.16 * Math.max(0, Math.sin(a * 3 + frame * 0.031));
        canvasPx(
          sunX + Math.cos(a) * ray * unit,
          sunY + Math.sin(a) * ray * unit,
          255,
          198 + 38 * flare,
          72,
          alpha,
          unit * (Math.sin(a * 11 + frame * 0.05) > 0.62 ? 2 : 1),
        );
      }

      for (let py = -radius; py <= radius; py += 1) {
        for (let px2 = -radius; px2 <= radius; px2 += 1) {
          const dist = Math.sqrt(px2 ** 2 + py ** 2);
          if (dist > radius) continue;
          const core = 1 - dist / radius;
          const grain = 0.82 + 0.18 * Math.sin(px2 * 0.8 + py * 1.2 + frame * 0.045);
          const ribbon = Math.sin(py * 0.34 + Math.sin(px2 * 0.18 + frame * 0.022) * 2.1) > 0.58;
          const spot = Math.sin(px2 * 0.42 - py * 0.56 + frame * 0.018) > 0.72 && core < 0.72;
          canvasPx(
            sunX + px2 * unit,
            sunY + py * unit,
            255,
            spot ? 132 : ribbon ? 172 + core * 52 : 208 + core * 42,
            spot ? 42 : ribbon ? 46 + core * 86 : 72 + core * 118,
            clamp((0.72 + core * 0.28) * grain, 0, 1),
            unit,
          );
        }
      }

      return { x: sunX, y: sunY, unit, radius };
    };

    const drawHomePlanet = (planet, index, sun) => {
      const compact = width < 760;
      const scale = compact ? planet.compactScale : planet.scale;
      const cx = (compact ? planet.compactCx : planet.cx) * width
        + Math.sin(frame * planet.drift + planet.off) * planet.ampX * scale * (0.7 + planet.depth);
      const cy = (compact ? planet.compactCy : planet.cy) * height
        + Math.cos(frame * planet.drift * 0.82 + planet.off) * planet.ampY * scale * (0.7 + planet.depth);
      const unit = Math.max(2, Math.round(PX * scale));
      const radius = planet.radius;
      const wobble = Math.sin(frame * 0.006 + planet.off) * 0.07;
      const ringTilt = planet.ringTilt ?? 0.34;
      const ringRx = radius * (2.05 + wobble);
      const ringRy = radius * ringTilt;
      const spin = frame * (0.007 + index * 0.0016) + planet.off;
      const sunDx = (sun.x - cx) / Math.max(1, unit * radius);
      const sunDy = (sun.y - cy) / Math.max(1, unit * radius);
      const sunDist = Math.sqrt(sunDx ** 2 + sunDy ** 2 + 1.15 ** 2);
      const lightX = sunDx / sunDist;
      const lightY = sunDy / sunDist;
      const lightZ = 1.15 / sunDist;
      const nightTint = planet.kind === 'volcanic' ? [40, 10, 24] : [2, 6, 20];

      glow(cx, cy, unit * radius * 3.6, [
        [0, planet.palette.glow],
        [0.35, 'rgba(0,255,255,.045)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.72);

      if (planet.ring) {
        for (let a = Math.PI; a < Math.PI * 2; a += 0.05) {
          const grit = 0.58 + 0.42 * Math.sin(a * 19 + frame * 0.05 + planet.off);
          const x = Math.cos(a + wobble) * ringRx;
          const y = Math.sin(a) * ringRy;
          const shade = clamp(0.5 + ((x / ringRx) * lightX + (y / Math.max(1, ringRy)) * lightY) * 0.4, 0.22, 1);
          drawSpritePx(cx, cy, scale, x, y, planet.palette.band[0] * grit * shade, planet.palette.band[1] * grit * shade, planet.palette.band[2] * grit * shade, 0.28 * grit, planet.ringWidth);
        }
      }

      for (let py = -radius; py <= radius; py += 1) {
        for (let px2 = -radius; px2 <= radius; px2 += 1) {
          const ellipse = (px2 / radius) ** 2 + (py / (radius * 0.96)) ** 2;
          if (ellipse > 1) continue;
          const edge = 1 - ellipse;
          const nx = px2 / radius;
          const ny = py / (radius * 0.96);
          const nz = Math.sqrt(Math.max(0, 1 - nx ** 2 - ny ** 2));
          const lambert = clamp(nx * lightX + ny * lightY + nz * lightZ, 0, 1);
          const terminator = lambert ** 0.72;
          const rim = clamp((1 - nz) * 0.68, 0, 0.55);
          let base = planet.palette.mid;
          let detail = 1;

          if (planet.kind === 'gas') {
            const bandWave = Math.sin(py * 0.78 + Math.sin(px2 * 0.24 + spin) * 2.2 + spin);
            const storm = ((px2 + radius * 0.25) / 4.8) ** 2 + ((py - radius * 0.08) / 2.2) ** 2 < 1;
            base = storm ? planet.palette.storm : bandWave > 0.54 ? planet.palette.band : bandWave < -0.42 ? planet.palette.dark : planet.palette.mid;
            detail = 0.82 + 0.18 * Math.sin(px2 * 0.8 + py * 1.6 + spin * 1.8);
          } else if (planet.kind === 'ocean') {
            const continent = Math.sin(px2 * 0.62 + Math.sin(py * 0.55 + spin) * 1.8) + Math.cos(py * 0.7 - spin * 0.8) > 0.74;
            const cloud = Math.sin(px2 * 0.46 - py * 0.38 + spin * 1.7) > 0.82 && edge > 0.18;
            base = cloud ? planet.palette.cloud : continent ? planet.palette.land : planet.palette.mid;
            detail = cloud ? 1.12 : 0.86 + 0.14 * Math.sin(px2 * 1.4 + py * 0.6);
          } else if (planet.kind === 'volcanic') {
            const crack = Math.abs(Math.sin(px2 * 0.9 + py * 1.25 + spin * 0.5)) > 0.94;
            const ember = crack && Math.sin(px2 * 2.1 - py * 1.2 + frame * 0.07) > 0;
            base = ember ? planet.palette.lava : crack ? planet.palette.light : planet.palette.mid;
            detail = ember ? 1.28 : 0.74 + 0.26 * Math.sin(px2 * 0.74 + py * 1.9);
          } else if (planet.kind === 'crystal') {
            const facet = Math.sin((px2 + py) * 0.82 + spin) > 0.35;
            const seam = Math.abs(Math.sin(px2 * 1.35 - py * 0.65 + spin * 0.7)) > 0.9;
            base = seam ? planet.palette.shard : facet ? planet.palette.light : planet.palette.mid;
            detail = seam ? 1.24 : 0.74 + 0.26 * Math.sin(px2 * 1.6 + py * 1.1 + spin);
          } else {
            const iceLine = Math.abs(Math.sin(px2 * 0.5 + py * 1.05 + spin)) > 0.76;
            base = iceLine ? planet.palette.cloud : Math.sin(py * 0.9 + spin) > 0.42 ? planet.palette.band : planet.palette.mid;
            detail = 0.82 + 0.18 * Math.sin(px2 * 1.2 - py * 0.8);
          }

          const day = clamp(0.2 + terminator * 0.94 + rim * 0.2, 0, 1.18);
          const night = 1 - terminator;
          const edgeShade = edge < 0.14 ? 0.42 + edge * 3.3 : 1;
          drawSpritePx(
            cx,
            cy,
            scale,
            px2,
            py,
            clamp((base[0] * day * detail + nightTint[0] * night * 0.8 + planet.palette.light[0] * rim * 0.35) * edgeShade, 0, 255),
            clamp((base[1] * day * detail + nightTint[1] * night * 0.8 + planet.palette.light[1] * rim * 0.28) * edgeShade, 0, 255),
            clamp((base[2] * day * detail + nightTint[2] * night * 0.8 + planet.palette.light[2] * rim * 0.25) * edgeShade, 0, 255),
            clamp(0.78 + edge * 0.22, 0, 1),
          );
        }
      }

      for (let a = -1.25; a <= 1.25; a += 0.12) {
        const x = Math.cos(a) * radius * 0.86 - lightX * radius * 0.18;
        const y = Math.sin(a) * radius * 0.5 - radius * 0.2 - lightY * radius * 0.14;
        const highlight = clamp(0.08 + lightZ * 0.08, 0, 0.16);
        drawSpritePx(cx, cy, scale, x, y, 255, 255, 255, highlight, 0.75);
      }

      if (planet.kind === 'crystal') {
        for (let a = 0; a < Math.PI * 2; a += 0.28) {
          const pulse = 0.45 + 0.55 * Math.sin(frame * 0.045 + a * 3 + planet.off);
          const x = Math.cos(a) * radius * (1.45 + pulse * 0.12);
          const y = Math.sin(a) * radius * (0.62 + pulse * 0.1);
          drawSpritePx(cx, cy, scale, x, y, planet.palette.shard[0], planet.palette.shard[1], planet.palette.shard[2], 0.22 * pulse, 0.8);
        }
      }

      if (planet.ring) {
        for (let a = 0; a < Math.PI; a += 0.045) {
          const grit = 0.68 + 0.32 * Math.sin(a * 23 + frame * 0.055 + planet.off);
          const x = Math.cos(a + wobble) * ringRx;
          const y = Math.sin(a) * ringRy;
          const shade = clamp(0.58 + ((x / ringRx) * lightX + (y / Math.max(1, ringRy)) * lightY) * 0.34, 0.28, 1.1);
          drawSpritePx(cx, cy, scale, x, y, planet.palette.band[0] * grit * shade, planet.palette.band[1] * grit * shade, planet.palette.band[2] * grit * shade, 0.44 * grit, planet.ringWidth);
        }
      }

      for (const moon of planet.moons) {
        const orbit = frame * moon.speed + moon.off;
        const mx = cx + Math.cos(orbit) * moon.radius * unit * 0.62;
        const my = cy + Math.sin(orbit) * moon.radius * unit * 0.22;
        const front = Math.sin(orbit) > 0;
        const moonLight = clamp(((sun.x - mx) / Math.max(1, unit * moon.radius)) * 0.15 + 0.74, 0.36, 1);
        canvasPx(mx, my, moon.tint[0] * moonLight, moon.tint[1] * moonLight, moon.tint[2] * moonLight, front ? 0.86 : 0.42, unit * moon.size);
        canvasPx(mx + unit, my, moon.tint[0] * 0.34, moon.tint[1] * 0.34, moon.tint[2] * 0.38, front ? 0.62 : 0.3, unit);
      }
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
      blackHole.rot += 0.00125 * activeSpeed * frameStep;
      blackHole.axis += 0.00045 * activeSpeed * frameStep;

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
      glow(bhX, bhY, Math.min(width, height) * 0.25, [
        [0, 'rgba(0,0,0,1)'],
        [0.16, 'rgba(0,0,0,.78)'],
        [0.31, 'rgba(66,255,205,.14)'],
        [0.54, 'rgba(16,126,112,.105)'],
        [1, 'rgba(0,0,0,0)'],
      ], 0.9);

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

        const coherentGalaxy = distant.kind === 'barred' || distant.kind === 'spiral';
        if (coherentGalaxy) {
          const bodySpin = distant.rot * (distant.kind === 'spiral' ? 0.72 : 0.58);
          const bodyCos = Math.cos(bodySpin);
          const bodySin = Math.sin(bodySpin);
          const bodyRx = (distant.kind === 'spiral' ? 39 : 30) * distant.radiusScale;
          const bodyRy = (distant.kind === 'spiral' ? 13 : 9) * distant.radiusScale;
          for (let by = -bodyRy; by <= bodyRy; by += 2) {
            for (let bx = -bodyRx; bx <= bodyRx; bx += 2) {
              const ellipse = (bx / bodyRx) ** 2 + (by / bodyRy) ** 2;
              if (ellipse > 1) continue;
              const edge = 1 - ellipse;
              const grain = 0.72 + 0.28 * Math.sin(bx * 1.7 + by * 2.9 + distant.off);
              const laneShadow = 0.78 + 0.22 * Math.sin(bx * 0.28 - by * 0.65 + bodySpin * 2.6);
              const rx = bx * bodyCos - by * bodySin;
              const ry = bx * bodySin + by * bodyCos;
              const warm = edge > 0.48;
              canvasPx(
                originX + rx * PX * depthScale,
                originY + ry * PX * depthScale,
                warm ? 210 * edge : 62 + 72 * edge,
                warm ? 190 * edge : 112 + 92 * edge,
                warm ? 132 + 80 * edge : 155 + 88 * edge,
                clamp((0.035 + edge * 0.11) * grain * laneShadow * distant.brightness, 0, 0.18),
                Math.max(1, Math.round(PX * 0.95 * depthScale)),
              );
            }
          }

          const armCount = distant.kind === 'spiral' ? 3 : 2;
          const armSpin = distant.rot * (distant.kind === 'spiral' ? 0.92 : 0.72);
          for (let arm = 0; arm < armCount; arm += 1) {
            const base = arm * ((Math.PI * 2) / armCount);
            for (let step = 5; step < 24 * distant.radiusScale; step += 2.4) {
              const angle = base + armSpin + step * (distant.kind === 'spiral' ? 0.28 : 0.2);
              const fade = 1 - step / (27 * distant.radiusScale);
              const armX = Math.cos(angle) * step * (distant.kind === 'spiral' ? 1.7 : 1.5);
              const armY = Math.sin(angle) * step * (distant.kind === 'spiral' ? 0.52 : 0.42);
              const normalX = -Math.sin(angle);
              const normalY = Math.cos(angle) * 0.42;
              const warm = step < 11;
              for (let band = -1; band <= 1; band += 1) {
                const bandFade = band === 0 ? 1 : 0.58;
                const rx = armX + normalX * band * 1.25;
                const ry = armY + normalY * band * 1.25;
                canvasPx(
                  originX + rx * PX * depthScale,
                  originY + ry * PX * depthScale,
                  warm ? 255 * fade : 90 * fade,
                  warm ? 212 * fade : 172 * fade,
                  warm ? 142 * fade : 255 * fade,
                  clamp(0.18 * fade * bandFade * distant.brightness, 0, 0.34),
                  Math.max(1, Math.round(PX * 0.9 * depthScale)),
                );
              }
            }
          }
        }

        for (const lane of distant.dustLanes) {
          const localSpin = coherentGalaxy
            ? distant.rot * (distant.kind === 'spiral' ? 0.82 : 0.64)
            : distant.rot * (distant.twist - lane.radius / 66)
              + Math.sin(frame * 0.0024 + lane.off) * 0.035;
          const cosR = Math.cos(localSpin);
          const sinR = Math.sin(localSpin);
          const rx = lane.dx * cosR - lane.dy * sinR;
          const ry = lane.dx * sinR + lane.dy * cosR;
          const alpha = lane.alpha * (0.72 + 0.28 * Math.sin(frame * 0.012 + lane.off));
          canvasPx(
            originX + rx * PX * depthScale,
            originY + ry * PX * depthScale,
            3,
            2,
            12,
            clamp(alpha, 0, 0.34),
            Math.max(1, Math.round(PX * 1.15 * depthScale)),
          );
        }

        for (const point of distant.points) {
          const localSpin = coherentGalaxy
            ? distant.rot * (distant.kind === 'spiral' ? 0.88 : 0.7)
            : distant.rot * (distant.twist - point.radius / 68)
              + frame * point.orbitSpeed
              + Math.sin(frame * 0.003 + point.orbitPhase) * 0.035 * distant.twist;
          const cosR = Math.cos(localSpin);
          const sinR = Math.sin(localSpin);
          const breath = coherentGalaxy
            ? 1 + Math.sin(frame * 0.004 + point.off) * 0.008
            : 1 + Math.sin(frame * 0.008 + point.off + point.radius * 0.08) * 0.045 * distant.twist;
          const rx = point.dx * cosR - point.dy * sinR;
          const ry = point.dx * sinR + point.dy * cosR;
          const tw = 0.66 + 0.34 * Math.sin(frame * point.twinkle * 1.8 + point.off);
          const edgeFade = distant.kind === 'irregular' ? 0.92 : 1 - Math.min(point.radius / (coherentGalaxy ? 50 : 42), 0.66);
          const light = point.core ? distant.brightness * 2.85 : distant.brightness;
          const alphaBoost = point.core ? 1.72 : coherentGalaxy ? 1.08 + distant.brightness * 0.12 : 0.84 + distant.brightness * 0.1;
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
        const corePulse = 0.78 + 0.22 * Math.sin(frame * 0.028 + distant.off);
        canvasPx(originX, originY, 255 * corePulse, 242 * corePulse, 190 * corePulse, clamp(0.36 + distant.brightness * 0.22, 0.38, 0.72), Math.max(1, Math.round(PX * 0.75 * depthScale)));
        if (coherentGalaxy) {
          const coreSpin = distant.rot * 0.36;
          const coreCos = Math.cos(coreSpin);
          const coreSin = Math.sin(coreSpin);
          for (let cy = -2; cy <= 2; cy += 1) {
            for (let cx = -3; cx <= 3; cx += 1) {
              const coreEllipse = (cx / 3.5) ** 2 + (cy / 2.15) ** 2;
              if (coreEllipse > 1) continue;
              const coreEdge = 1 - coreEllipse;
              const rx = cx * coreCos - cy * coreSin;
              const ry = cx * coreSin + cy * coreCos;
              canvasPx(
                originX + rx * PX * depthScale,
                originY + ry * PX * depthScale,
                255,
                232 + coreEdge * 23,
                176 + coreEdge * 58,
                clamp((0.18 + coreEdge * 0.38) * distant.brightness, 0, 0.86),
                Math.max(1, Math.round(PX * 0.92 * depthScale)),
              );
            }
          }
        }
      }

      }

      if (isHome) {
        const homeSun = drawHomeSun();
        const planetOrder = HOME_PLANETS
          .map((planet, index) => ({ planet, index }))
          .sort((a, b) => a.planet.depth - b.planet.depth);
        for (const item of planetOrder) drawHomePlanet(item.planet, item.index, homeSun);
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
        drawBhScaledPx(ringX(dx, 0.72), ringY(dy, 0.72), (18 + 24 * tw) * br, (92 + 80 * tw) * br, (74 + 74 * tw) * br);
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
        const baseDx = Math.cos(angle) * star.radius * 2.18;
        const baseDy = Math.sin(angle) * star.radius * 0.78;
        const tanX = -Math.sin(angle);
        const tanY = Math.cos(angle) * 0.36;
        const warm = star.tint === 'amber';
        for (let i = 0; i < star.length; i += 1) {
          const fade = (1 - i / star.length) * flicker;
          drawBhPx(ringX(baseDx + tanX * i * 1.75, 0.58), ringY(baseDy + tanY * i * 1.75, 0.58), warm ? 255 * fade : 176 * fade, warm ? 200 * fade : 226 * fade, warm ? 112 * fade : 255 * fade, 0.62);
        }
      }

      for (const point of accretionSprite) {
        const orbit = point.angle + frame * point.speed + point.phase * 0.06;
        const pulse = Math.sin(frame * 0.052 + point.phase) * 0.55;
        const radius = point.radius + pulse;
        const dx = ringX(Math.cos(orbit) * radius * 2.15, 0.95);
        const dy = ringY(Math.sin(orbit) * radius * (point.tilt + bhTopView * 0.4) + Math.sin(frame * 0.035 + point.phase) * 0.8, 0.95);
        const heat = clamp(point.heat + Math.sin(frame * 0.028 + point.phase) * 0.12, 0, 1);
        const br = (0.38 + heat * 0.78) * point.front * (point.doppler ** 1.12);
        const r = clamp(28 + heat * 118, 0, 255);
        const g = clamp(120 + heat * 132, 0, 255);
        const b = clamp(92 + heat * 96 + Math.max(0, point.doppler - 1) * 76, 0, 255);
        drawBhPx(dx, dy, r * br, g * br, b * br, 0.88, point.width);
      }

      for (const point of discPixels) {
        const orb = blackHole.rot + frame * point.orbSpd + point.orbOff;
        const cosO = Math.cos(orb);
        const sinO = Math.sin(orb);
        const rx = (point.dx * cosO - point.dy * sinO) | 0;
        const ry = (point.dx * sinO + point.dy * cosO) | 0;
        const tw = 0.48 + 0.52 * Math.sin(frame * point.tSpd + point.tOff);
        const innerLift = Math.abs(point.dx) < bhRadius + 4 ? 1.22 : 0.92;
        drawBhScaledPx(ringX(rx, 0.92), ringY(ry, 0.92), clamp(point.r * tw * innerLift, 0, 255), clamp(point.g * tw * innerLift, 0, 255), clamp(point.b * tw, 0, 255));
      }

      for (const arc of lensArcs) {
        const phase = 0.5 + 0.5 * Math.sin(frame * 0.04 + arc.a * 3);
        const pulse = 1 + Math.sin(frame * 0.025 + arc.a) * 0.08;
        drawBhScaledPx(ringX(arc.dx, 0.82), ringY(arc.dy, 0.82), 180 * phase, 255 * phase, 220 * phase, 0.86, blackHole.scale * pulse);
      }

      for (const point of photonRing) {
        const angle = point.angle + blackHole.rot * 0.22;
        const flicker = 0.48 + 0.52 * Math.sin(frame * 0.07 + point.off);
        const radius = bhRadius + 1.4 + point.wobble * flicker;
        drawBhPx(ringX(Math.cos(angle) * radius * 2.25, 1), ringY(Math.sin(angle) * radius * 0.86, 1), 210 * flicker, 255 * flicker, 224 * flicker, 0.86);
      }

      const orbitalBands = [
        { radius: bhRadius + 4.2, spin: 0.045, tint: [186, 255, 220], alpha: 0.32, tilt: 0.92 },
        { radius: bhRadius + 7.4, spin: -0.034, tint: [42, 230, 184], alpha: 0.24, tilt: 0.68 },
        { radius: bhRadius + 10.8, spin: 0.02, tint: [20, 120, 110], alpha: 0.18, tilt: 0.5 },
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

      const horizonRadius = bhRadius + 0.85;
      for (let dy = -horizonRadius; dy <= horizonRadius; dy += 1) {
        for (let dx = -horizonRadius; dx <= horizonRadius; dx += 1) {
          const dist = Math.sqrt((dx * 0.96) ** 2 + (dy * 1.05) ** 2);
          if (dist <= horizonRadius) {
            drawSpritePx(bhX, bhY, blackHole.scale, dx, dy, 0, 0, 0, 1);
          }
        }
      }

      for (let a = 0; a < Math.PI * 2; a += 0.14) {
        const shim = 0.3 + 0.7 * Math.sin(frame * 0.06 + a * 5);
        drawBhScaledPx(
          ringX(Math.round(Math.cos(a + blackHole.rot * 0.28) * (bhRadius * 2.05)), 0.72),
          ringY(Math.round(Math.sin(a + blackHole.rot * 0.28) * (bhRadius * 0.94)), 0.72),
          104 * shim,
          255 * shim,
          210 * shim,
        );
      }
      }

      if (!isGame) {
      const galaxyView = 0.5 + 0.5 * Math.sin(frame * 0.0022 + 0.6);
      const galaxySideView = galaxyView * galaxyView * (3 - 2 * galaxyView);
      const galaxyTilt = 1 - galaxySideView * 0.52;
      const galaxySkew = Math.sin(frame * 0.0024 + 1.1) * (0.04 + galaxySideView * 0.16);
      const galaxyWidthLift = 1 + galaxySideView * 0.08;
      const galaxyPerspective = (dx, dy) => ({
        x: dx * galaxyWidthLift + dy * galaxySkew,
        y: dy * galaxyTilt,
      });
      const drawGalaxySpritePx = (dx, dy, r, g, b, a = 1, size = 1) => {
        const p = galaxyPerspective(dx, dy);
        drawSpritePx(galaxyX, galaxyY, galaxy.scale, p.x, p.y, r, g, b, a, size);
      };
      const drawGalaxyScaledPx = (dx, dy, r, g, b, a = 1) => {
        const p = galaxyPerspective(dx, dy);
        drawScaledPx(galaxyX, galaxyY, galaxy.scale, p.x, p.y, r, g, b, a);
      };

      for (const point of galaxyHalo) {
        const spin = galaxy.rot * (0.42 - point.radius / 180);
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = point.dx * cosS - point.dy * sinS;
        const ry = point.dx * sinS + point.dy * cosS;
        const tw = 0.7 + 0.3 * Math.sin(frame * 0.015 + point.off);
        drawGalaxySpritePx(
          rx,
          ry,
          point.r * tw,
          point.g * tw,
          point.b * tw,
          point.alpha,
        );
      }

      for (let arm = 0; arm < 2; arm += 1) {
        const armOffset = arm * Math.PI;
        for (let step = 5; step < 42; step += 2.2) {
          const angle = galaxy.rot * 0.2 + armOffset + step * 0.265;
          const fade = 1 - step / 46;
          const dx = Math.cos(angle) * step * 1.64;
          const dy = Math.sin(angle) * step * 0.54;
          if (step < 18) {
            drawGalaxyScaledPx(dx, dy, 255 * fade, 190 * fade, 96 * fade, 0.34);
          } else if (step < 31) {
            drawGalaxyScaledPx(dx, dy, 172 * fade, 118 * fade, 88 * fade, 0.26);
          } else {
            drawGalaxyScaledPx(dx, dy, 70 * fade, 128 * fade, 235 * fade, 0.3);
          }
        }
      }

      for (const lane of galaxyDustLanes) {
        const spin = galaxy.rot * 0.2;
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = lane.dx * cosS - lane.dy * sinS;
        const ry = lane.dx * sinS + lane.dy * cosS;
        const alpha = lane.alpha * (0.76 + 0.24 * Math.sin(frame * 0.018 + lane.off));
        drawGalaxySpritePx(rx, ry, 1, 1, 8, alpha, lane.radius < 15 ? 2 : 1.35);
      }

      for (const point of galaxySprite) {
        const spin = galaxy.rot * 0.2;
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = point.dx * cosS - point.dy * sinS;
        const ry = point.dx * sinS + point.dy * cosS;
        const tw = 0.82 + 0.18 * Math.sin(frame * point.twinkle + point.off);
        const coreLift = point.radius < 6 ? 1.28 : point.radius < 12 ? 1.08 : 1;
        drawGalaxySpritePx(
          rx,
          ry,
          clamp(point.r * tw * coreLift, 0, 255),
          clamp(point.g * tw * coreLift, 0, 255),
          clamp(point.b * tw * coreLift, 0, 255),
          clamp((point.alpha ?? 0.7) * (point.radius < 8 ? 1.08 : 1), 0, 1),
          point.size,
        );
      }

      for (const point of galaxyPixels) {
        const tw = point.twinkle ? 0.55 + 0.45 * Math.sin(frame * point.tSpd + point.tOff) : 1;
        const dist = Math.sqrt(point.dx ** 2 + point.dy ** 2);
        const spin = galaxy.rot * 0.2;
        const cosS = Math.cos(spin);
        const sinS = Math.sin(spin);
        const rx = (point.dx * cosS - point.dy * sinS) | 0;
        const ry = (point.dx * sinS + point.dy * cosS) | 0;
        drawGalaxyScaledPx(rx, ry, clamp(point.r * tw, 0, 255), clamp(point.g * tw, 0, 255), clamp(point.b * tw, 0, 255));
      }
      const mainCorePulse = 0.82 + 0.18 * Math.sin(frame * 0.024 + 0.4);
      drawGalaxySpritePx(0, 0, 255 * mainCorePulse, 250 * mainCorePulse, 218 * mainCorePulse, 1, 3);
      drawGalaxySpritePx(1, 0, 255 * mainCorePulse, 224 * mainCorePulse, 154 * mainCorePulse, 0.72, 2);
      drawGalaxySpritePx(-1, 0, 255 * mainCorePulse, 224 * mainCorePulse, 154 * mainCorePulse, 0.72, 2);
      drawGalaxySpritePx(0, 1, 255 * mainCorePulse, 196 * mainCorePulse, 108 * mainCorePulse, 0.46, 1);
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
