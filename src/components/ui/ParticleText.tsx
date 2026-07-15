"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─────────────── Types ─────────────── */

interface Particle {
  /** Current position */
  x: number;
  y: number;
  /** Target (letter shape) position */
  tx: number;
  ty: number;
  /** Scattered origin */
  ox: number;
  oy: number;
  /** Random stagger delay (0-1) normalised */
  delay: number;
  /** Radius */
  r: number;
  /** Colour */
  color: string;
  /** Pulse phase offset */
  pulseOffset: number;
}

/* ─────────────── Config ─────────────── */

const PARTICLE_GAP   = 4;        // sample every Nth pixel — controls density
const ANIM_DURATION  = 2200;     // ms total flight time
const STAGGER_RANGE  = 800;      // ms max stagger between particles
const SETTLE_PULSE   = 1200;     // ms glow/pulse after settling
const BASE_RADIUS    = 1.8;
const MAX_RADIUS     = 2.6;

// Colour ramp (left → right across the word)
const COLOR_STOPS: [number, string][] = [
  [0.0,  "#0C2340"],   // deep navy
  [0.3,  "#163a60"],   // mid navy
  [0.55, "#8a6d40"],   // warm transitional
  [0.8,  "#b89063"],   // champagne bronze
  [1.0,  "#d4a86a"],   // bright gold
];

function lerpColor(t: number): string {
  // Find surrounding stops
  let lo = COLOR_STOPS[0];
  let hi = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (t >= COLOR_STOPS[i][0] && t <= COLOR_STOPS[i + 1][0]) {
      lo = COLOR_STOPS[i];
      hi = COLOR_STOPS[i + 1];
      break;
    }
  }
  const f = (t - lo[0]) / (hi[0] - lo[0] || 1);
  return mixHex(lo[1], hi[1], f);
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/* easeOutCubic: fast start, gentle settle */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/* ─────────────── Component ─────────────── */

interface ParticleTextProps {
  text?: string;
  className?: string;
}

export default function ParticleText({
  text = "ARQFLOW",
  className = "",
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const particles    = useRef<Particle[]>([]);
  const animStart    = useRef<number | null>(null);
  const settled      = useRef(false);
  const triggered    = useRef(false);
  const rafId        = useRef<number>(0);

  /* ── Build particle positions from text bitmap ── */
  const buildParticles = useCallback((w: number, h: number) => {
    // Offscreen canvas to rasterise the text
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d")!;

    // Choose a font size that fills ~70% of width
    let fontSize = Math.floor(w * 0.17);
    if (fontSize < 40) fontSize = 40;
    if (fontSize > 180) fontSize = 180;

    octx.fillStyle = "#000";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `900 ${fontSize}px "Manrope", "Poppins", "Inter", system-ui, sans-serif`;
    octx.fillText(text, w / 2, h / 2);

    const imgData = octx.getImageData(0, 0, w, h).data;

    const pts: Particle[] = [];

    for (let y = 0; y < h; y += PARTICLE_GAP) {
      for (let x = 0; x < w; x += PARTICLE_GAP) {
        const idx = (y * w + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha > 128) {
          // normalised horizontal position (0-1) for colour gradient
          const normX = x / w;

          // Scattered origin: random point far away from target
          const angle = Math.random() * Math.PI * 2;
          const dist  = 300 + Math.random() * 500;

          pts.push({
            x:  x + Math.cos(angle) * dist,
            y:  y + Math.sin(angle) * dist,
            tx: x,
            ty: y,
            ox: x + Math.cos(angle) * dist,
            oy: y + Math.sin(angle) * dist,
            delay: Math.random(),
            r: BASE_RADIUS + Math.random() * (MAX_RADIUS - BASE_RADIUS),
            color: lerpColor(normX),
            pulseOffset: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    // Cap to ~700 particles for mobile perf
    if (pts.length > 700) {
      pts.sort(() => Math.random() - 0.5);
      pts.length = 700;
    }

    particles.current = pts;
  }, [text]);

  /* ── Animation loop ── */
  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (animStart.current === null) animStart.current = timestamp;
    const elapsed = timestamp - animStart.current;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const pts = particles.current;
    let allSettled = true;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      // Each particle has its own effective start time
      const particleDelay = p.delay * STAGGER_RANGE;
      const particleElapsed = elapsed - particleDelay;

      if (particleElapsed < 0) {
        // Not started yet — draw at scattered origin
        allSettled = false;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.ox, p.oy, p.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // Flight progress 0 → 1
      const rawT = Math.min(particleElapsed / ANIM_DURATION, 1);
      const t = easeOutCubic(rawT);

      // Interpolate position
      p.x = p.ox + (p.tx - p.ox) * t;
      p.y = p.oy + (p.ty - p.oy) * t;

      if (rawT < 1) allSettled = false;

      // Post-settle: subtle pulse glow
      let radius = p.r;
      let alpha = 0.35 + t * 0.65; // fade in from 35% to 100%

      if (rawT >= 1) {
        const pulseElapsed = elapsed - particleDelay - ANIM_DURATION;
        if (pulseElapsed < SETTLE_PULSE) {
          const pulseT = pulseElapsed / SETTLE_PULSE;
          // sin pulse: grows then shrinks
          const pulse = Math.sin(pulseT * Math.PI + p.pulseOffset) * 0.5;
          radius = p.r * (1 + pulse * 0.4);
          alpha = 1;
        } else {
          radius = p.r;
          alpha = 0.92;
        }
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Keep looping until everything has settled + pulse finished
    const totalDuration = ANIM_DURATION + STAGGER_RANGE + SETTLE_PULSE + 200;
    if (elapsed < totalDuration) {
      rafId.current = requestAnimationFrame(draw);
    } else {
      // Final still frame
      settled.current = true;
      drawStill(ctx, pts);
    }
  }, []);

  /* ── Static final frame (no ongoing RAF cost) ── */
  const drawStill = (ctx: CanvasRenderingContext2D, pts: Particle[]) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.92;

    for (const p of pts) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.tx, p.ty, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /* ── Trigger animation via IntersectionObserver ── */
  const startAnimation = useCallback(() => {
    if (triggered.current) return;
    triggered.current = true;
    animStart.current = null;
    settled.current = false;
    rafId.current = requestAnimationFrame(draw);
  }, [draw]);

  /* ── Resize handling ── */
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    buildParticles(w, h);

    // If already triggered, restart
    if (triggered.current) {
      triggered.current = false;
      cancelAnimationFrame(rafId.current);
      startAnimation();
    }
  }, [buildParticles, startAnimation]);

  /* ── Lifecycle ── */
  useEffect(() => {
    handleResize();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        }
      },
      { threshold: 0.15 }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    window.addEventListener("resize", handleResize);

    return () => {
      if (el) observer.unobserve(el);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleResize, startAnimation]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
