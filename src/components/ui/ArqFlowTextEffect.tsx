"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function ArqFlowTextEffect({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [mouse, setMouse] = useState({ x: -1000, y: -1000, active: false });

  // 1. Water Rise Animation Loop
  useEffect(() => {
    const startTime = Date.now();
    const duration = 3200; // 3.2 seconds fill duration
    let animId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // easeInOutCubic easing
      const easedP = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      setProgress(easedP);
      setPhase((prev) => prev + 0.06);

      if (t < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        // Continue loop to animate wave phase indefinitely
        const keepWaving = () => {
          setPhase((prev) => prev + 0.03); // slower waves when full
          animId = requestAnimationFrame(keepWaving);
        };
        animId = requestAnimationFrame(keepWaving);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Mouse Position Mapping inside SVG ViewBox
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    
    // Map client coordinates to 900x180 viewBox space
    const x = ((e.clientX - rect.left) / rect.width) * 900;
    const y = ((e.clientY - rect.top) / rect.height) * 180;
    setMouse({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMouse({ x: -1000, y: -1000, active: false });
  };

  // 3. Dynamic Wave Path calculation
  // y moves from 180 (bottom) to 0 (top)
  const waveY = 180 - progress * 180;
  // Reduce wave amplitude as text fills up to prevent top spillover
  const waveAmp = (1 - progress) * 14 + 1.5;

  const p1y = waveY + Math.sin(phase) * waveAmp;
  const p2y = waveY + Math.sin(phase + 1.5) * waveAmp;
  const p3y = waveY + Math.sin(phase + 3.0) * waveAmp;
  const p4y = waveY + Math.sin(phase + 4.5) * waveAmp;

  const wavePath = `
    M 0 ${p1y} 
    Q 225 ${waveY + Math.cos(phase) * waveAmp * 1.5}, 450 ${p2y} 
    T 900 ${p4y} 
    L 900 180 
    L 0 180 
    Z
  `;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 900 180"
      className={cn("w-full select-none overflow-visible", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        {/* Wave Water Clip Path */}
        <clipPath id="water-fill-clip">
          <path d={wavePath} />
        </clipPath>

        {/* Hover Spot Light Clip Path */}
        <clipPath id="hover-spot-clip">
          <circle cx={mouse.x} cy={mouse.y} r={80} className="transition-all duration-75" />
        </clipPath>

        {/* Organic Liquid Warp Filter */}
        <filter id="liquid-turbulence">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {/* Layer 1: Hollow Outline (Always rendered) */}
      <text
        x="50%"
        y="65%"
        textAnchor="middle"
        className="font-display font-black tracking-widest"
        style={{
          fontSize: "120px",
          fill: "none",
          stroke: "rgba(184, 144, 99, 0.25)",
          strokeWidth: "1.5px",
        }}
      >
        ARQFLOW
      </text>

      {/* Layer 2: Rising Navy Water Fill */}
      <text
        x="50%"
        y="65%"
        textAnchor="middle"
        clipPath="url(#water-fill-clip)"
        className="font-display font-black tracking-widest transition-all duration-300"
        style={{
          fontSize: "120px",
          fill: "#0e2038",
        }}
      >
        ARQFLOW
      </text>

      {/* Layer 3: Interactive Bronze Liquid Hover Wave (Follows cursor) */}
      {mouse.active && (
        <g filter="url(#liquid-turbulence)">
          <text
            x="50%"
            y="65%"
            textAnchor="middle"
            clipPath="url(#hover-spot-clip)"
            className="font-display font-black tracking-widest"
            style={{
              fontSize: "120px",
              fill: "#b89063",
              textShadow: "0 0 16px rgba(184, 144, 99, 0.45)",
            }}
          >
            ARQFLOW
          </text>
        </g>
      )}
    </svg>
  );
}
