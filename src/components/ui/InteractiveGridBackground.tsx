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
      // Clear with warm alabaster/cream background
      ctx.fillStyle = "#f9f8f5";
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse coordinates translation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Draw distorted grid points
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
          // Magnetic pull toward cursor
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
          ? "rgba(184, 144, 99, 0.2)"   // warm bronze near cursor
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
