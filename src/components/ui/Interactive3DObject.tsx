"use client";

import { useEffect, useRef } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

export default function Interactive3DObject() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth);
    let height = (canvas.height = 450);

    // Generate Trefoil Knot 3D path points
    const points: Point3D[] = [];
    const numPoints = 200; // dense points to draw a solid continuous tube

    for (let i = 0; i < numPoints; i++) {
      const t = (Math.PI * 2 * i) / numPoints;
      // Trefoil Knot parametric equations
      const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * 48;
      const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * 48;
      const z = -Math.sin(3 * t) * 48;

      points.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
      });
    }

    // Rotations state
    let angleX = 0.005;
    let angleY = 0.007;
    const rotSpeedX = 0.002;
    const rotSpeedY = 0.003;

    const fov = 500; // perspective depth

    // Event listeners
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.targetX = e.clientX - rect.left;
      mouse.current.targetY = e.clientY - rect.top;
      mouse.current.isHovering = true;
    };

    const onMouseEnter = () => {
      mouse.current.isHovering = true;
    };

    const onMouseLeave = () => {
      mouse.current.isHovering = false;
      mouse.current.targetX = width / 2;
      mouse.current.targetY = height / 2;
    };

    const onResize = () => {
      if (container) {
        width = canvas.width = container.clientWidth;
        height = canvas.height = 450;
      }
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    // Initial mouse center
    mouse.current.x = width / 2;
    mouse.current.y = height / 2;

    const rotateX = (p: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const y = p.y * cos - p.z * sin;
      const z = p.y * sin + p.z * cos;
      p.y = y;
      p.z = z;
    };

    const rotateY = (p: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = p.x * cos + p.z * sin;
      const z = -p.x * sin + p.z * cos;
      p.x = x;
      p.z = z;
    };

    // Rendering loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse coordinates translation
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.06;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.06;

      const mouseOffsetX = (mouse.current.x - width / 2) / (width / 2);
      const mouseOffsetY = (mouse.current.y - height / 2) / (height / 2);

      const currentAngleX = rotSpeedX + mouseOffsetY * 0.012;
      const currentAngleY = rotSpeedY + mouseOffsetX * 0.012;

      angleX += currentAngleX;
      angleY += currentAngleY;

      // Project and map points
      interface ProjectedPoint {
        x: number;
        y: number;
        z: number;
        scale: number;
        basePoint: Point3D;
      }

      let projected: ProjectedPoint[] = [];

      points.forEach((pt) => {
        let p = { x: pt.baseX, y: pt.baseY, z: pt.baseZ };

        // Apply mouse-warp distortion (gently pulling points if mouse is hovering)
        if (mouse.current.isHovering) {
          const cx = width / 2;
          const cy = height / 2;
          const mouseX3D = mouse.current.x - cx;
          const mouseY3D = mouse.current.y - cy;
          
          const dx = mouseX3D - p.x;
          const dy = mouseY3D - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180 && dist > 0) {
            const pullForce = (180 - dist) / 180 * 18;
            p.x += (dx / dist) * pullForce;
            p.y += (dy / dist) * pullForce;
          }
        }

        // Apply rotations
        rotateX(p, angleX);
        rotateY(p, angleY);

        // Perspective projection
        const depthOffset = 220;
        const scale = fov / (fov + p.z + depthOffset);
        const screenX = width / 2 + p.x * scale;
        const screenY = height / 2 + p.y * scale;

        projected.push({
          x: screenX,
          y: screenY,
          z: p.z,
          scale,
          basePoint: pt,
        });
      });

      // Painter's Algorithm: Sort by Z coordinate from back to front (farthest first)
      // This is crucial for solid overlapping cylinder projection!
      projected.sort((a, b) => a.z - b.z);

      // Tube radius settings
      const baseRadius = 26;

      // Render tubular slices
      projected.forEach((p) => {
        const r = baseRadius * p.scale;
        if (r <= 0) return;

        // Create volumetric radial gradient shading (simulates thick round 3D tube)
        // Highlight positioned slightly top-left of center
        const grad = ctx.createRadialGradient(
          p.x - r * 0.28,
          p.y - r * 0.28,
          r * 0.08, // inner circle (specular highlight)
          p.x,
          p.y,
          r // outer cylinder limit
        );

        // Warm light-gray luxury matte glass styling
        // Matches the 3D looping structure in the reference image
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");      // highlight
        grad.addColorStop(0.2, "rgba(215, 218, 218, 0.85)");   // lit surface
        grad.addColorStop(0.55, "rgba(168, 178, 178, 0.75)");   // body shade
        grad.addColorStop(0.85, "rgba(100, 114, 114, 0.65)");   // shadow core
        grad.addColorStop(1, "rgba(14, 32, 56, 0.15)");         // shadow edge blending

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Subtle bronze ring overlays to denote the consulting luxury color theme
        if (Math.floor(p.z) % 8 === 0) {
          ctx.strokeStyle = "rgba(184, 144, 99, 0.07)"; // thin bronze wireframe overlay
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] flex items-center justify-center overflow-hidden border border-[#b89063]/15 bg-[#faf9f6]/40 rounded-2xl cursor-none"
      style={{
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 20px 48px rgba(14, 32, 56, 0.03)",
        backdropFilter: "blur(4px)",
      }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      <div className="absolute top-4 start-4 font-mono text-[9px] text-[#0e2038]/40 uppercase tracking-widest pointer-events-none select-none">
        Sculpture: TREFOIL_LOOP_3D
      </div>
      <div className="absolute bottom-4 end-4 font-mono text-[9px] text-[#b89063]/60 uppercase tracking-widest pointer-events-none select-none">
        VIA WESTERN STYLE
      </div>
    </div>
  );
}
