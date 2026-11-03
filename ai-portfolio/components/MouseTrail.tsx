"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

interface Pt {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  sprite: number;
  cross: boolean;
}

interface Ripple {
  x: number;
  y: number;
  life: number;
  max: number;
}

const TAU = Math.PI * 2;

const FOLLOW_DOT = 0.38;
const FOLLOW_RING = 0.14; // same smoothing as the previous version
const RING_BASE = 16;
const RING_HOVER = 30;
const RING_BASE_TOUCH = 28;
const RING_HOVER_TOUCH = 40;
const DOT_BASE = 3.5;
const TRAIL_MAX = 26;
const MAX_PARTICLES_DESKTOP = 140;
const MAX_PARTICLES_TOUCH = 70; // lighter on phones to protect battery and frame rate

const YELLOW: RGB = [253, 224, 71];
const FUCHSIA: RGB = [232, 121, 249];
const BLUE: RGB = [96, 165, 250];
const WHITE: RGB = [255, 248, 214];
const SPRITE_COLORS: RGB[] = [YELLOW, FUCHSIA, BLUE, WHITE];

const INTERACTIVE =
  'a, button, [role="button"], summary, label[for], select, [data-cursor="hover"]';
const TEXT_FIELD =
  'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable=""], [contenteditable="true"]';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const mixChannel = (a: number, b: number, t: number): number => Math.round(a + (b - a) * t);

const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  mixChannel(a[0], b[0], t),
  mixChannel(a[1], b[1], t),
  mixChannel(a[2], b[2], t)
];

// Trail colour: old end is blue, the middle is fuchsia, the head is yellow.
const trailRGB = (t: number): RGB =>
  t < 0.55 ? mixRGB(BLUE, FUCHSIA, t / 0.55) : mixRGB(FUCHSIA, YELLOW, (t - 0.55) / 0.45);

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const makeGlowSprite = (rgb: RGB): HTMLCanvasElement => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  const c = size / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.18, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.85)`);
  grad.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.22)`);
  grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return canvas;
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Works with mouse, pen, and touch. Only users who ask for reduced motion get no effect.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let last = 0;
    let seen = false;

    // State driven by events
    let visible = false;
    let hidden = false; // over a text field: stay out of the way of the text caret
    let hovering = false;
    let pressed = false;
    let touchMode = false;
    let maxParticles = MAX_PARTICLES_DESKTOP;

    // Smoothed animation values (0..1)
    let presence = 0;
    let hover = 0;
    let press = 0;

    const mouse: Pt = { x: -200, y: -200 };
    const dot: Pt = { x: -200, y: -200 };
    const ring: Pt = { x: -200, y: -200 };
    const prevDot: Pt = { x: -200, y: -200 };

    const trail: Pt[] = [];
    const particles: Particle[] = [];
    const ripples: Ripple[] = [];

    const sprites: HTMLCanvasElement[] = SPRITE_COLORS.map(makeGlowSprite);

    /* ---------------- sizing ---------------- */

    const resize = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* ---------------- particles ---------------- */

    const spawn = (
      x: number,
      y: number,
      angle: number,
      speedMin: number,
      speedMax: number
    ): void => {
      if (particles.length >= maxParticles) return;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 0.5 + Math.random() * 0.6,
        size: 7 + Math.random() * 11,
        sprite: Math.floor(Math.random() * sprites.length),
        cross: Math.random() < 0.15
      });
    };

    const burst = (x: number, y: number, count: number): void => {
      for (let i = 0; i < count; i++) {
        spawn(x, y, Math.random() * TAU, 120, 340);
      }
    };

    /* ---------------- frame ---------------- */

    const tick = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Frame-rate independent smoothing
      const kDot = 1 - Math.pow(1 - FOLLOW_DOT, dt * 60);
      const kRing = 1 - Math.pow(1 - FOLLOW_RING, dt * 60);
      prevDot.x = dot.x;
      prevDot.y = dot.y;
      dot.x += (mouse.x - dot.x) * kDot;
      dot.y += (mouse.y - dot.y) * kDot;
      ring.x += (mouse.x - ring.x) * kRing;
      ring.y += (mouse.y - ring.y) * kRing;

      const presenceTarget = visible && !hidden ? 1 : 0;
      const hoverTarget = hovering && !hidden ? 1 : 0;
      const pressTarget = pressed ? 1 : 0;
      presence += (presenceTarget - presence) * Math.min(1, dt * 10);
      hover += (hoverTarget - hover) * Math.min(1, dt * 12);
      press += (pressTarget - press) * Math.min(1, dt * 18);

      const vx = (dot.x - prevDot.x) / Math.max(dt, 0.001);
      const vy = (dot.y - prevDot.y) / Math.max(dt, 0.001);
      const speed = Math.hypot(vx, vy);

      // Trail: grows while moving, retracts when still
      if (presence > 0.02 && speed > 60) {
        trail.push({ x: dot.x, y: dot.y });
        while (trail.length > TRAIL_MAX) trail.shift();
      } else if (trail.length > 0) {
        trail.shift();
        if (trail.length > 1) trail.shift();
      }

      // Sparks fly off the head, opposite to the direction of travel
      if (presence > 0.5 && speed > 300) {
        const n = speed > 1400 ? 3 : speed > 800 ? 2 : 1;
        const back = Math.atan2(-vy, -vx);
        for (let i = 0; i < n; i++) {
          spawn(dot.x, dot.y, back + (Math.random() - 0.5) * 1.8, 30, 130);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        const drag = Math.max(0, 1 - dt * 2.4);
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].life += dt;
        if (ripples[i].life >= ripples[i].max) ripples.splice(i, 1);
      }

      /* ---------- draw ---------- */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Comet ribbon (a wide soft underlay plus a crisp core)
      if (trail.length > 1 && presence > 0.01) {
        for (let i = 1; i < trail.length; i++) {
          const t = i / (trail.length - 1);
          const c = trailRGB(t);
          const a = t * 0.6 * presence;
          const width = (1 + t * 5) * (0.6 + 0.4 * presence);

          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * 0.28})`;
          ctx.lineWidth = width * 2.8;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();

          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      // Sparks
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const k = 1 - p.life / p.max;
        const alpha = Math.pow(k, 1.3);
        const size = p.size * (0.4 + 0.6 * k);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[p.sprite], p.x - size / 2, p.y - size / 2, size, size);
        if (p.cross) {
          const c = SPRITE_COLORS[p.sprite];
          const len = size * 0.9;
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha * 0.9})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - len, p.y);
          ctx.lineTo(p.x + len, p.y);
          ctx.moveTo(p.x, p.y - len);
          ctx.lineTo(p.x, p.y + len);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Click ripples
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i];
        const p = r.life / r.max;
        const radius = 8 + easeOutCubic(p) * 74;
        ctx.strokeStyle = `rgba(${YELLOW[0]},${YELLOW[1]},${YELLOW[2]},${(1 - p) * 0.7})`;
        ctx.lineWidth = 0.5 + (1 - p) * 2.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, TAU);
        ctx.stroke();
      }

      // Ring + dot
      if (presence > 0.01) {
        ctx.globalCompositeOperation = "lighter";
        const baseR = touchMode ? RING_BASE_TOUCH : RING_BASE;
        const hoverR = touchMode ? RING_HOVER_TOUCH : RING_HOVER;
        const ringRadius = (baseR + (hoverR - baseR) * hover) * (1 - 0.28 * press);

        // Ambient glow behind the ring, stronger on interactive elements
        const glowSize = ringRadius * 4.4;
        ctx.globalAlpha = (0.22 + hover * 0.4) * presence;
        ctx.drawImage(sprites[0], ring.x - glowSize / 2, ring.y - glowSize / 2, glowSize, glowSize);
        ctx.globalAlpha = 1;

        ctx.globalCompositeOperation = "source-over";

        // Soft fill when hovering something clickable
        if (hover > 0.01) {
          ctx.fillStyle = `rgba(${YELLOW[0]},${YELLOW[1]},${YELLOW[2]},${hover * 0.14 * presence})`;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ringRadius, 0, TAU);
          ctx.fill();
        }

        const ringColor = mixRGB([255, 255, 255], YELLOW, hover);
        ctx.strokeStyle = `rgba(${ringColor[0]},${ringColor[1]},${ringColor[2]},${(0.5 + hover * 0.45) * presence})`;
        ctx.lineWidth = 1.5 + hover * 0.6;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ringRadius, 0, TAU);
        ctx.stroke();

        // Dot: shrinks over clickable things, swells when pressed
        const dotRadius = DOT_BASE * (1 - 0.45 * hover) * (1 + 0.5 * press);
        ctx.globalCompositeOperation = "lighter";
        const dotGlow = dotRadius * 7;
        ctx.globalAlpha = 0.8 * presence;
        ctx.drawImage(sprites[0], dot.x - dotGlow / 2, dot.y - dotGlow / 2, dotGlow, dotGlow);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,250,225,${presence})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, TAU);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      // Stop the loop completely once everything has settled (saves CPU and battery)
      const settled =
        Math.abs(mouse.x - dot.x) < 0.1 &&
        Math.abs(mouse.y - dot.y) < 0.1 &&
        Math.abs(mouse.x - ring.x) < 0.1 &&
        Math.abs(mouse.y - ring.y) < 0.1 &&
        Math.abs(presenceTarget - presence) < 0.01 &&
        Math.abs(hoverTarget - hover) < 0.01 &&
        Math.abs(pressTarget - press) < 0.01 &&
        trail.length <= 1 &&
        particles.length === 0 &&
        ripples.length === 0;

      if (settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = (): void => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    /* ---------------- events ---------------- */

    const teleport = (x: number, y: number): void => {
      // Jump to a new position with no streak (first move, or a new finger touch)
      mouse.x = x;
      mouse.y = y;
      dot.x = ring.x = prevDot.x = x;
      dot.y = ring.y = prevDot.y = y;
      trail.length = 0;
      seen = true;
    };

    /* ----- mouse and pen (touch pointers are handled by the touch handlers below) ----- */

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === "touch") return;
      touchMode = false;
      maxParticles = MAX_PARTICLES_DESKTOP;
      if (!seen) teleport(e.clientX, e.clientY);
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      visible = true;
      wake();
    };

    const onOver = (e: PointerEvent): void => {
      if (e.pointerType === "touch") return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      hidden = Boolean(target.closest(TEXT_FIELD));
      hovering =
        !hidden &&
        (Boolean(target.closest(INTERACTIVE)) || window.getComputedStyle(target).cursor === "pointer");
      wake();
    };

    const onDown = (e: PointerEvent): void => {
      if (e.pointerType === "touch" || e.button !== 0 || hidden) return;
      pressed = true;
      ripples.push({ x: e.clientX, y: e.clientY, life: 0, max: 0.7 });
      burst(e.clientX, e.clientY, 16);
      wake();
    };

    const onUp = (e: PointerEvent): void => {
      if (e.pointerType === "touch") return;
      pressed = false;
      wake();
    };

    const onLeave = (): void => {
      visible = false;
      pressed = false;
      wake();
    };

    /* ----- touch: the effect lives only while a finger is down ----- */

    const onTouchStart = (e: TouchEvent): void => {
      const touch = e.touches[0];
      if (!touch) return;
      touchMode = true;
      maxParticles = MAX_PARTICLES_TOUCH;
      teleport(touch.clientX, touch.clientY);

      const target = e.target;
      const isElement = target instanceof Element;
      hidden = isElement && Boolean(target.closest(TEXT_FIELD));
      hovering = isElement && !hidden && Boolean(target.closest(INTERACTIVE));
      visible = true;
      pressed = true;

      if (!hidden) {
        ripples.push({ x: touch.clientX, y: touch.clientY, life: 0, max: 0.7 });
        burst(touch.clientX, touch.clientY, 10);
      }
      wake();
    };

    const onTouchMove = (e: TouchEvent): void => {
      const touch = e.touches[0];
      if (!touch) return;
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      visible = true;
      wake();
    };

    const onTouchEnd = (): void => {
      visible = false;
      pressed = false;
      hovering = false;
      wake();
    };

    const onBlur = (): void => {
      visible = false;
      pressed = false;
      wake();
    };

    const onVisibility = (): void => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}
