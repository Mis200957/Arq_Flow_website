"use client";

import { useEffect, useRef } from "react";

export default function InteractiveGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Grid spacing configurations
    const spacing = 48; // Space between grid dots (px)
    let cols = Math.ceil(width / spacing) + 1;
    let rows = Math.ceil(height / spacing) + 1;

    interface Point {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
    }

    let points: Point[] = [];

    const initGrid = () => {
      points = [];
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;
          points.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    initGrid();

    // Waves configuration
    interface Wave {
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      color: string;
      lineWidth: number;
      yOffset: number;
    }

    const waves: Wave[] = [
      {
        amplitude: 55,
        frequency: 0.0022,
        phase: 0,
        speed: 0.0035,
        color: "rgba(184, 144, 99, 0.065)", // soft bronze
        lineWidth: 1.5,
        yOffset: 0.45, // positioned around center-top
      },
      {
        amplitude: 35,
        frequency: 0.004,
        phase: 2,
        speed: 0.005,
        color: "rgba(184, 144, 99, 0.045)",
        lineWidth: 1.0,
        yOffset: 0.52,
      },
      {
        amplitude: 75,
        frequency: 0.0015,
        phase: 4,
        speed: 0.002,
        color: "rgba(184, 144, 99, 0.035)",
        lineWidth: 2.0,
        yOffset: 0.6,
      },
    ];

    // Event listeners
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    const onMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    const onResize = () => {
      initGrid();
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    // Animation Loop
    const render = () => {
      // Clear canvas with light warm cream
      ctx.fillStyle = "#f9f8f5";
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // 1. Draw Waving Flow Field Curves
      waves.forEach((w) => {
        w.phase += w.speed;
        
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.lineWidth;
        ctx.beginPath();

        const step = 8;
        const centerY = height * w.yOffset;

        for (let x = 0; x <= width; x += step) {
          // Calculate baseline sine wave
          let y = centerY + Math.sin(x * w.frequency + w.phase) * w.amplitude;

          // Apply mouse fluid warping: pull wave slightly toward mouse if close
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180 && dist > 0) {
            const force = (180 - dist) / 180;
            // Pull wave y coordinate toward mouse
            y += dy * force * 0.35;
          }

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 2. Draw Distorted Dot Grid
      const maxDistance = 160;
      const forceFactor = 22;

      points.forEach((pt) => {
        const dx = mouse.x - pt.baseX;
        const dy = mouse.y - pt.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = pt.baseX;
        let targetY = pt.baseY;

        if (dist < maxDistance && dist > 0) {
          const force = (maxDistance - dist) / maxDistance;
          targetX += (dx / dist) * force * forceFactor;
          targetY += (dy / dist) * force * forceFactor;
        }

        // Spring calculations
        pt.vx += (targetX - pt.x) * 0.15;
        pt.vy += (targetY - pt.y) * 0.15;
        pt.vx *= 0.78;
        pt.vy *= 0.78;
        pt.x += pt.vx;
        pt.y += pt.vy;

        const dotDist = Math.sqrt((mouse.x - pt.x) ** 2 + (mouse.y - pt.y) ** 2);
        const nearCursor = dotDist < 120;
        
        ctx.fillStyle = nearCursor 
          ? "rgba(184, 144, 99, 0.22)"  // warm bronze glow near cursor
          : "rgba(14, 32, 56, 0.035)";   // subtle navy baseline dot
        
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, nearCursor ? 2.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[-10] block w-full h-full"
    />
  );
}
