"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

interface Point {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  base: number;
  twinkle: number;
  phase: number;
  layer: 0 | 1 | 2;
  color: string;
  glint: boolean;
}

interface PlanetDef {
  orbit: number;
  size: number;
  rgb: RGB;
  speed: number;
  ring: boolean;
  ringTilt: number;
}

interface Planet extends PlanetDef {
  angle: number;
}

interface PlanetPos {
  x: number;
  y: number;
  depth: number;
  scale: number;
}

interface TechDefinition {
  name: string;
  xRatio: number;
  yRatio: number;
  mobile: boolean;
  hub?: boolean;
}

interface TechNode {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hub: boolean;
  phase: number;
}

interface Edge {
  a: Point;
  c: Point;
  b: Point;
}

interface Meteor {
  active: boolean;
  timer: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  life: number;
  maxLife: number;
  len: number;
}

interface MoonSurfaceSpot {
  xR: number;
  yR: number;
  rR: number;
  tone: "mare" | "crater";
}

interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface Config {
  mobile: boolean;
  tablet: boolean;
  moonRadius: number;
  planetScale: number;
  orbitBoost: number;
  labelFont: number;
}

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const TAU = Math.PI * 2;

// The agent-graph constellation. Positions are fixed ratios of the screen, so they never
// drift. Order matters: the signal travels through the nodes in this order, like a request
// flowing from the frontend through the API and the LangGraph pipeline into the data layer.
const TECH_NODES: TechDefinition[] = [
  { name: "React", xRatio: 0.09, yRatio: 0.17, mobile: false },
  { name: "Next.js", xRatio: 0.06, yRatio: 0.5, mobile: true },
  { name: "FastAPI", xRatio: 0.11, yRatio: 0.83, mobile: true },
  { name: "LangChain", xRatio: 0.31, yRatio: 0.93, mobile: false },
  { name: "LangGraph", xRatio: 0.5, yRatio: 0.95, mobile: true, hub: true },
  { name: "Pinecone", xRatio: 0.69, yRatio: 0.93, mobile: false },
  { name: "Supabase", xRatio: 0.88, yRatio: 0.8, mobile: true },
  { name: "Tavily", xRatio: 0.94, yRatio: 0.5, mobile: false }
];

const PLANET_DEFS: PlanetDef[] = [
  { orbit: 0.2, size: 10, rgb: [255, 107, 107], speed: 0.5, ring: true, ringTilt: -0.35 },
  { orbit: 0.3, size: 13, rgb: [78, 205, 196], speed: 0.38, ring: true, ringTilt: -0.5 },
  { orbit: 0.42, size: 9, rgb: [255, 230, 109], speed: 0.6, ring: true, ringTilt: -0.2 },
  { orbit: 0.56, size: 12, rgb: [255, 159, 243], speed: 0.28, ring: false, ringTilt: 0 }
];

const ORBIT_TILT = -0.18;
const ORBIT_FLATTEN = 0.3;

const STAR_COLORS: string[] = ["255,255,255", "200,220,255", "255,236,214", "215,205,255"];
const PARALLAX_DEPTH: number[] = [3, 9, 18];

// Moon surface: seas (maria) and craters, relative to the moon radius.
const MOON_SURFACE: MoonSurfaceSpot[] = [
  { xR: -0.35, yR: -0.42, rR: 0.24, tone: "mare" },
  { xR: 0.18, yR: -0.5, rR: 0.14, tone: "mare" },
  { xR: 0.38, yR: -0.05, rR: 0.3, tone: "mare" },
  { xR: -0.08, yR: 0.32, rR: 0.16, tone: "mare" },
  { xR: -0.5, yR: 0.12, rR: 0.11, tone: "crater" },
  { xR: 0.06, yR: 0.04, rR: 0.065, tone: "crater" },
  { xR: 0.32, yR: 0.42, rR: 0.08, tone: "crater" },
  { xR: -0.24, yR: -0.08, rR: 0.05, tone: "crater" },
  { xR: 0.52, yR: -0.34, rR: 0.07, tone: "crater" },
  { xR: -0.42, yR: 0.46, rR: 0.06, tone: "crater" },
  { xR: -0.18, yR: 0.55, rR: 0.045, tone: "crater" },
  { xR: 0.14, yR: -0.2, rR: 0.04, tone: "crater" }
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const rgba = (c: RGB, a: number): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const mix = (c: RGB, target: RGB, t: number): string => {
  const r = Math.round(c[0] + (target[0] - c[0]) * t);
  const g = Math.round(c[1] + (target[1] - c[1]) * t);
  const b = Math.round(c[2] + (target[2] - c[2]) * t);
  return `rgb(${r},${g},${b})`;
};

const quadPoint = (e: Edge, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * e.a.x + 2 * u * t * e.c.x + t * t * e.b.x,
    y: u * u * e.a.y + 2 * u * t * e.c.y + t * t * e.b.y
  };
};

const createLayer = (width: number, height: number): Layer | null => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return { canvas, ctx };
};

const roundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let time = 0;
    let raf = 0;
    let lastFrame = 0;
    let resizeTimer: number | undefined;
    let lastBuiltW = 0;
    let lastBuiltH = 0;

    let cfg: Config = {
      mobile: false,
      tablet: false,
      moonRadius: 88,
      planetScale: 1,
      orbitBoost: 1,
      labelFont: 14
    };

    let stars: Star[] = [];
    let nodes: TechNode[] = [];
    let edges: Edge[] = [];
    let bgLayer: Layer | null = null;
    let moonLayer: Layer | null = null;
    let haloLayer: Layer | null = null;

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const meteor: Meteor = {
      active: false,
      timer: 4 + Math.random() * 4,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 1,
      life: 0,
      maxLife: 1,
      len: 120
    };

    // Planets are created once, so a resize never makes them jump.
    const planets: Planet[] = PLANET_DEFS.map((def) => ({
      ...def,
      angle: Math.random() * TAU
    }));

    /* ---------------- configuration ---------------- */

    const getConfig = (): Config => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      return {
        mobile,
        tablet,
        moonRadius: mobile ? 40 : tablet ? 62 : 88,
        planetScale: mobile ? 0.6 : tablet ? 0.8 : 1,
        orbitBoost: mobile ? 1.15 : 1,
        labelFont: mobile ? 11 : tablet ? 12.5 : 14
      };
    };

    /* ---------------- static layers (built once per resize) ---------------- */

    const buildBackground = (): Layer | null => {
      const layer = createLayer(w * dpr, h * dpr);
      if (!layer) return null;
      const { ctx: x } = layer;
      x.scale(dpr, dpr);

      const sky = x.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#03030f");
      sky.addColorStop(0.55, "#120a3a");
      sky.addColorStop(1, "#2d1b69");
      x.fillStyle = sky;
      x.fillRect(0, 0, w, h);

      const big = Math.max(w, h);

      // Nebula clouds
      x.globalCompositeOperation = "lighter";
      const blobs: { x: number; y: number; r: number; c: RGB; a: number }[] = [
        { x: 0.18, y: 0.25, r: 0.55, c: [110, 70, 210], a: 0.2 },
        { x: 0.82, y: 0.3, r: 0.5, c: [40, 90, 220], a: 0.15 },
        { x: 0.5, y: 0.88, r: 0.6, c: [200, 60, 170], a: 0.09 },
        { x: 0.78, y: 0.76, r: 0.4, c: [30, 170, 200], a: 0.07 }
      ];
      blobs.forEach((b) => {
        const g = x.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * big);
        g.addColorStop(0, rgba(b.c, b.a));
        g.addColorStop(0.5, rgba(b.c, b.a * 0.4));
        g.addColorStop(1, rgba(b.c, 0));
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
      });

      // Milky Way band
      const bandAngle = -0.55;
      x.save();
      x.translate(w * 0.5, h * 0.5);
      x.rotate(bandAngle);
      x.scale(1, 0.16);
      const band = x.createRadialGradient(0, 0, 0, 0, 0, big * 0.9);
      band.addColorStop(0, "rgba(190,170,255,0.13)");
      band.addColorStop(0.5, "rgba(150,130,240,0.06)");
      band.addColorStop(1, "rgba(120,100,220,0)");
      x.fillStyle = band;
      x.beginPath();
      x.arc(0, 0, big * 0.9, 0, TAU);
      x.fill();
      x.restore();

      // Dust specks along the band
      const cos = Math.cos(bandAngle);
      const sin = Math.sin(bandAngle);
      for (let i = 0; i < 520; i++) {
        const u = (Math.random() - 0.5) * 2 * big * 0.8;
        const v = (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.1;
        const px = w * 0.5 + u * cos - v * sin;
        const py = h * 0.5 + u * sin + v * cos;
        const size = 0.5 + Math.random() * 0.8;
        x.fillStyle = `rgba(220,210,255,${Math.random() * 0.35})`;
        x.fillRect(px, py, size, size);
      }
      x.globalCompositeOperation = "source-over";

      // Vignette
      const vig = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, big * 0.8);
      vig.addColorStop(0, "rgba(2,2,12,0)");
      vig.addColorStop(1, "rgba(2,2,12,0.45)");
      x.fillStyle = vig;
      x.fillRect(0, 0, w, h);

      return layer;
    };

    const buildMoon = (): Layer | null => {
      const r = cfg.moonRadius;
      const size = Math.ceil(r * 3.4);
      const layer = createLayer(size * dpr, size * dpr);
      if (!layer) return null;
      const { ctx: m } = layer;
      m.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const lightX = cx - r * 0.42;
      const lightY = cy - r * 0.42;

      // Soft rim between the moon edge and the halo
      const rim = m.createRadialGradient(cx, cy, r * 0.82, cx, cy, r * 1.6);
      rim.addColorStop(0, "rgba(255,255,255,0.16)");
      rim.addColorStop(1, "rgba(255,255,255,0)");
      m.fillStyle = rim;
      m.beginPath();
      m.arc(cx, cy, r * 1.6, 0, TAU);
      m.fill();

      // Body with directional lighting
      const body = m.createRadialGradient(lightX, lightY, r * 0.05, cx, cy, r);
      body.addColorStop(0, "#ffffff");
      body.addColorStop(0.22, "#f2f2f9");
      body.addColorStop(0.48, "#d7d7ec");
      body.addColorStop(0.7, "#aaa9cb");
      body.addColorStop(0.87, "#726f9e");
      body.addColorStop(1, "#42406f");
      m.fillStyle = body;
      m.beginPath();
      m.arc(cx, cy, r, 0, TAU);
      m.fill();

      // Surface texture clipped to the moon disk
      m.save();
      m.beginPath();
      m.arc(cx, cy, r, 0, TAU);
      m.clip();

      MOON_SURFACE.forEach((spot) => {
        const sx = cx + spot.xR * r;
        const sy = cy + spot.yR * r;
        const sr = spot.rR * r;

        if (spot.tone === "mare") {
          const g = m.createRadialGradient(sx, sy, 0, sx, sy, sr);
          g.addColorStop(0, "rgba(88,86,128,0.32)");
          g.addColorStop(1, "rgba(88,86,128,0)");
          m.fillStyle = g;
          m.beginPath();
          m.arc(sx, sy, sr, 0, TAU);
          m.fill();
        } else {
          const g = m.createRadialGradient(sx + sr * 0.15, sy + sr * 0.15, 0, sx, sy, sr);
          g.addColorStop(0, "rgba(58,56,92,0.4)");
          g.addColorStop(0.7, "rgba(58,56,92,0.16)");
          g.addColorStop(1, "rgba(58,56,92,0)");
          m.fillStyle = g;
          m.beginPath();
          m.arc(sx, sy, sr, 0, TAU);
          m.fill();

          m.strokeStyle = "rgba(255,255,255,0.16)";
          m.lineWidth = Math.max(0.4, sr * 0.12);
          m.beginPath();
          m.arc(sx - sr * 0.12, sy - sr * 0.12, sr * 0.88, Math.PI * 0.9, Math.PI * 1.6);
          m.stroke();
        }
      });

      // Shade on the side facing away from the light
      const shade = m.createRadialGradient(
        cx + r * 0.32,
        cy + r * 0.32,
        r * 0.15,
        cx + r * 0.32,
        cy + r * 0.32,
        r * 1.15
      );
      shade.addColorStop(0, "rgba(28,20,58,0)");
      shade.addColorStop(1, "rgba(28,20,58,0.28)");
      m.fillStyle = shade;
      m.beginPath();
      m.arc(cx, cy, r, 0, TAU);
      m.fill();
      m.restore();

      return layer;
    };

    // The halo is smooth, so it is rendered at low resolution and scaled up (cheap and clean).
    const buildHalo = (): Layer | null => {
      const size = Math.max(64, Math.ceil(cfg.moonRadius * 9 * 2 * 0.3));
      const layer = createLayer(size, size);
      if (!layer) return null;
      const { ctx: hc } = layer;
      const c = size / 2;
      const g = hc.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, "rgba(238,238,255,0.34)");
      g.addColorStop(0.05, "rgba(214,214,255,0.21)");
      g.addColorStop(0.14, "rgba(178,176,244,0.12)");
      g.addColorStop(0.3, "rgba(130,118,210,0.06)");
      g.addColorStop(0.55, "rgba(80,68,160,0.022)");
      g.addColorStop(1, "rgba(40,32,100,0)");
      hc.fillStyle = g;
      hc.fillRect(0, 0, size, size);
      return layer;
    };

    /* ---------------- stars ---------------- */

    const buildStars = (): void => {
      const count = clamp(Math.round((w * h) / 5200), 70, 380);
      stars = [];
      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const layer: 0 | 1 | 2 = roll < 0.55 ? 0 : roll < 0.88 ? 1 : 2;
        const r =
          layer === 0
            ? 0.4 + Math.random() * 0.5
            : layer === 1
              ? 0.7 + Math.random() * 0.6
              : 1.1 + Math.random() * 0.8;
        const drift = layer === 0 ? 0.05 : layer === 1 ? 0.1 : 0.16;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          vx: (Math.random() - 0.5) * drift,
          vy: (Math.random() - 0.5) * drift,
          base: 0.35 + Math.random() * 0.6,
          twinkle: 0.6 + Math.random() * 1.6,
          phase: Math.random() * TAU,
          layer,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          glint: layer === 2 && Math.random() < 0.45
        });
      }
    };

    /* ---------------- tech constellation layout ---------------- */

    const buildNodes = (): void => {
      ctx.font = `600 ${cfg.labelFont}px 'Segoe UI', 'Inter', system-ui, sans-serif`;
      const padX = 14;
      const dotGap = 16;
      const visible = TECH_NODES.filter((t) => (cfg.mobile ? t.mobile : true));

      nodes = visible.map((t, i) => {
        const textW = ctx.measureText(t.name).width;
        const nw = textW + padX * 2 + dotGap;
        const nh = cfg.labelFont + 16;
        return {
          name: t.name,
          x: clamp(t.xRatio * w, nw / 2 + 10, w - nw / 2 - 10),
          y: clamp(t.yRatio * h, nh / 2 + 10, h - nh / 2 - 10),
          w: nw,
          h: nh,
          hub: Boolean(t.hub),
          phase: i * 1.3
        };
      });

      // Edges bow outward (away from the screen centre) so they hug the screen border.
      edges = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = { x: nodes[i].x, y: nodes[i].y };
        const b = { x: nodes[i + 1].x, y: nodes[i + 1].y };
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        let ox = mx - w / 2;
        let oy = my - h / 2;
        const ol = Math.hypot(ox, oy) || 1;
        ox /= ol;
        oy /= ol;
        edges.push({ a, b, c: { x: mx + ox * len * 0.18, y: my + oy * len * 0.18 } });
      }
    };

    /* ---------------- build / resize ---------------- */

    const build = (): void => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      lastBuiltW = w;
      lastBuiltH = h;

      cfg = getConfig();
      bgLayer = buildBackground();
      moonLayer = buildMoon();
      haloLayer = buildHalo();
      buildStars();
      buildNodes();
    };

    /* ---------------- drawing ---------------- */

    const drawStars = (dt: number): void => {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!reducedMotion) {
          s.x = (s.x + s.vx * dt * 60 + w) % w;
          s.y = (s.y + s.vy * dt * 60 + h) % h;
        }
        const depth = PARALLAX_DEPTH[s.layer];
        const px = (((s.x - mouse.x * depth) % w) + w) % w;
        const py = (((s.y - mouse.y * depth) % h) + h) % h;
        const tw = reducedMotion ? 1 : 0.65 + 0.35 * Math.sin(time * s.twinkle + s.phase);
        const a = s.base * tw;

        ctx.fillStyle = `rgba(${s.color},${a})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, TAU);
        ctx.fill();

        if (s.glint) {
          const len = s.r * 5 * (0.7 + 0.3 * tw);
          ctx.strokeStyle = `rgba(${s.color},${a * 0.45})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(px - len, py);
          ctx.lineTo(px + len, py);
          ctx.moveTo(px, py - len);
          ctx.lineTo(px, py + len);
          ctx.stroke();
        }
      }
    };

    const updateAndDrawMeteor = (dt: number): void => {
      if (reducedMotion) return;

      if (!meteor.active) {
        meteor.timer -= dt;
        if (meteor.timer <= 0) {
          const angle = ((15 + Math.random() * 25) * Math.PI) / 180;
          const dir = Math.random() < 0.5 ? 1 : -1;
          meteor.speed = 800 + Math.random() * 400;
          meteor.x = w * 0.1 + Math.random() * w * 0.8;
          meteor.y = Math.random() * h * 0.35;
          meteor.vx = Math.cos(angle) * dir * meteor.speed;
          meteor.vy = Math.sin(angle) * meteor.speed;
          meteor.life = 0;
          meteor.maxLife = 0.7 + Math.random() * 0.4;
          meteor.len = 120 + Math.random() * 80;
          meteor.active = true;
        }
        return;
      }

      meteor.life += dt;
      meteor.x += meteor.vx * dt;
      meteor.y += meteor.vy * dt;
      if (meteor.life >= meteor.maxLife) {
        meteor.active = false;
        meteor.timer = 5 + Math.random() * 8;
        return;
      }

      const alpha = Math.sin((Math.PI * meteor.life) / meteor.maxLife);
      const tx = meteor.x - (meteor.vx / meteor.speed) * meteor.len;
      const ty = meteor.y - (meteor.vy / meteor.speed) * meteor.len;
      const g = ctx.createLinearGradient(tx, ty, meteor.x, meteor.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(255,255,255,${0.85 * alpha})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(meteor.x, meteor.y);
      ctx.stroke();
      ctx.lineCap = "butt";
    };

    // Signal positions measured in "edge units": position p means edge floor(p), progress p - floor(p).
    const getSignals = (): number[] => {
      if (reducedMotion || edges.length === 0) return [];
      const cycle = edges.length + 1.6;
      const speed = 0.5;
      const result: number[] = [];
      for (let i = 0; i < 2; i++) {
        const p = (time * speed + (i * cycle) / 2) % cycle;
        if (p < edges.length) result.push(p);
      }
      return result;
    };

    const drawEdgesAndPulses = (signals: number[]): void => {
      // Base dashed links
      ctx.setLineDash([2, 8]);
      ctx.strokeStyle = "rgba(180,160,255,0.16)";
      ctx.lineWidth = 1;
      edges.forEach((e) => {
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.quadraticCurveTo(e.c.x, e.c.y, e.b.x, e.b.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Travelling signals (comet with a fading tail)
      signals.forEach((p) => {
        const index = Math.floor(p);
        const t = p - index;
        const edge = edges[index];
        if (!edge) return;

        const tail = 0.22;
        const steps = 14;
        for (let i = steps; i >= 1; i--) {
          const k = i / steps;
          const tt = t - k * tail;
          if (tt < 0) continue;
          const pt = quadPoint(edge, tt);
          ctx.fillStyle = `rgba(253,230,138,${(1 - k) * 0.8})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (1 - k) * 3 + 0.6, 0, TAU);
          ctx.fill();
        }

        const head = quadPoint(edge, t);
        const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
        glow.addColorStop(0, "rgba(255,244,190,0.7)");
        glow.addColorStop(1, "rgba(255,244,190,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 16, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,252,230,0.95)";
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.4, 0, TAU);
        ctx.fill();
      });
    };

    const drawRing = (x: number, y: number, r: number, tilt: number, back: boolean): void => {
      const start = back ? Math.PI : 0;
      const end = back ? TAU : Math.PI;
      ctx.strokeStyle = "rgba(255,255,255,0.34)";
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2.1, r * 0.6, tilt, start, end);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = Math.max(0.8, r * 0.07);
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.6, r * 0.45, tilt, start, end);
      ctx.stroke();
    };

    const drawPlanet = (p: Planet, pos: PlanetPos, cx: number, cy: number): void => {
      const r = p.size * pos.scale * cfg.planetScale;
      ctx.save();
      ctx.globalAlpha = pos.depth >= 0 ? 1 : 0.8;

      // Atmosphere glow
      const glow = ctx.createRadialGradient(pos.x, pos.y, r * 0.8, pos.x, pos.y, r * 3);
      glow.addColorStop(0, rgba(p.rgb, 0.22));
      glow.addColorStop(1, rgba(p.rgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 3, 0, TAU);
      ctx.fill();

      if (p.ring) drawRing(pos.x, pos.y, r, p.ringTilt, true);

      // Sphere lit from the direction of the moon
      const dx = cx - pos.x;
      const dy = cy - pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const hx = pos.x + (dx / len) * r * 0.5;
      const hy = pos.y + (dy / len) * r * 0.5;
      const body = ctx.createRadialGradient(hx, hy, r * 0.05, pos.x, pos.y, r * 1.2);
      body.addColorStop(0, mix(p.rgb, [255, 255, 255], 0.65));
      body.addColorStop(0.45, mix(p.rgb, [0, 0, 0], 0));
      body.addColorStop(1, mix(p.rgb, [10, 6, 30], 0.78));
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, TAU);
      ctx.fill();

      if (p.ring) drawRing(pos.x, pos.y, r, p.ringTilt, false);

      ctx.restore();
    };

    const drawSystem = (dt: number): void => {
      const cx = w / 2 + mouse.x * 6;
      const cy = h / 2 + mouse.y * 4;
      const r = cfg.moonRadius;

      // Halo
      if (haloLayer) {
        const hr = r * 9;
        ctx.globalAlpha = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(time * 0.5);
        ctx.drawImage(haloLayer.canvas, cx - hr, cy - hr, hr * 2, hr * 2);
        ctx.globalAlpha = 1;
      }

      // Planet positions on tilted, flattened orbits
      const cosT = Math.cos(ORBIT_TILT);
      const sinT = Math.sin(ORBIT_TILT);
      const positions: PlanetPos[] = planets.map((p) => {
        if (!reducedMotion) p.angle += p.speed * 0.3 * dt;
        const rx = Math.min(p.orbit * Math.min(w, h) * cfg.orbitBoost, w * 0.47);
        const ry = rx * ORBIT_FLATTEN;
        const ex = Math.cos(p.angle) * rx;
        const ey = Math.sin(p.angle) * ry;
        const depth = Math.sin(p.angle);
        return {
          x: cx + ex * cosT - ey * sinT,
          y: cy + ex * sinT + ey * cosT,
          depth,
          scale: 0.88 + 0.12 * depth
        };
      });

      // Orbit lines
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      planets.forEach((p) => {
        const rx = Math.min(p.orbit * Math.min(w, h) * cfg.orbitBoost, w * 0.47);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, rx * ORBIT_FLATTEN, ORBIT_TILT, 0, TAU);
        ctx.stroke();
      });

      // Planets behind the moon
      planets.forEach((p, i) => {
        if (positions[i].depth < 0) drawPlanet(p, positions[i], cx, cy);
      });

      // Moon
      if (moonLayer) {
        const size = moonLayer.canvas.width / dpr;
        ctx.drawImage(moonLayer.canvas, cx - size / 2, cy - size / 2, size, size);
      }

      // Planets in front of the moon
      planets.forEach((p, i) => {
        if (positions[i].depth >= 0) drawPlanet(p, positions[i], cx, cy);
      });
    };

    const drawNodes = (signals: number[]): void => {
      ctx.save();
      ctx.font = `600 ${cfg.labelFont}px 'Segoe UI', 'Inter', system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      nodes.forEach((n, i) => {
        // A node lights up when a signal passes through it
        let flare = 0;
        signals.forEach((p) => {
          flare = Math.max(flare, 1 - Math.abs(p - i) * 2.2);
        });
        flare = clamp(flare, 0, 1);

        const breathe = reducedMotion ? 0 : Math.sin(time * 0.6 + n.phase) * 0.05;
        const a = clamp(0.3 + breathe + flare * 0.55, 0, 1);
        const bx = n.x - n.w / 2;
        const by = n.y - n.h / 2;

        // Dark backing so the link underneath never shows through the pill
        roundedRectPath(ctx, bx, by, n.w, n.h, 9);
        ctx.fillStyle = "rgba(8,6,30,0.7)";
        ctx.fill();

        if (flare > 0) {
          ctx.shadowColor = n.hub ? "rgba(253,224,71,0.9)" : "rgba(180,160,255,0.9)";
          ctx.shadowBlur = 20 * flare;
        }
        roundedRectPath(ctx, bx, by, n.w, n.h, 9);
        ctx.fillStyle = n.hub ? `rgba(253,224,71,${a * 0.16})` : `rgba(125,81,183,${a * 0.3})`;
        ctx.fill();
        ctx.strokeStyle = n.hub ? `rgba(253,224,71,${a * 0.85})` : `rgba(200,190,255,${a * 0.75})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Status dot
        ctx.fillStyle = n.hub ? `rgba(253,224,71,${a + 0.4})` : `rgba(190,175,255,${a + 0.35})`;
        ctx.beginPath();
        ctx.arc(bx + 14 + 2, n.y, 3, 0, TAU);
        ctx.fill();

        // Label
        ctx.shadowColor = "rgba(180,160,255,0.5)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(238,233,255,${clamp(a + 0.4, 0, 1)})`;
        ctx.fillText(n.name, bx + 14 + 16, n.y + 0.5);
        ctx.shadowBlur = 0;
      });

      ctx.restore();
    };

    const render = (dt: number): void => {
      time += dt;

      const follow = Math.min(1, dt * 3);
      mouse.x += (mouse.tx - mouse.x) * follow;
      mouse.y += (mouse.ty - mouse.y) * follow;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bgLayer) {
        ctx.drawImage(bgLayer.canvas, 0, 0, w, h);
      } else {
        ctx.fillStyle = "#0a0624";
        ctx.fillRect(0, 0, w, h);
      }

      const signals = getSignals();
      drawStars(dt);
      updateAndDrawMeteor(dt);
      drawEdgesAndPulses(signals);
      drawSystem(dt);
      drawNodes(signals);
    };

    /* ---------------- loop control ---------------- */

    const loop = (now: number): void => {
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      render(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = (): void => {
      cancelAnimationFrame(raf);
      lastFrame = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const stop = (): void => {
      cancelAnimationFrame(raf);
    };

    /* ---------------- events ---------------- */

    const onResize = (): void => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const nw = window.innerWidth;
        const nh = window.innerHeight;
        // Ignore tiny height changes (mobile URL bar) so stars do not reshuffle while scrolling.
        if (nw === lastBuiltW && Math.abs(nh - lastBuiltH) < 150) return;
        build();
        if (reducedMotion) render(0);
      }, 120);
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (e.pointerType !== "mouse") return;
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onVisibility = (): void => {
      if (document.hidden) stop();
      else if (!reducedMotion) start();
    };

    /* ---------------- init ---------------- */

    build();
    window.addEventListener("resize", onResize);

    if (reducedMotion) {
      render(0);
    } else {
      if (finePointer) window.addEventListener("pointermove", onPointerMove);
      document.addEventListener("visibilitychange", onVisibility);
      start();
    }

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
