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
    let height = (canvas.height = 450); // fixed hero size

    // Generate 3D sphere points
    const points: Point3D[] = [];
    const radius = 130;
    const rings = 14;   // latitude lines
    const sectors = 18; // longitude lines

    for (let i = 0; i <= rings; i++) {
      const lat = (Math.PI * i) / rings;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);

      for (let j = 0; j < sectors; j++) {
        const lon = (Math.PI * 2 * j) / sectors;
        const sinLon = Math.sin(lon);
        const cosLon = Math.cos(lon);

        const x = radius * sinLat * cosLon;
        const y = radius * sinLat * sinLon;
        const z = radius * cosLat;

        points.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          baseZ: z,
        });
      }
    }

    // Rotations state
    let angleX = 0.006;
    let angleY = 0.008;
    const rotSpeedX = 0.003;
    const rotSpeedY = 0.004;

    const fov = 400; // Field of View (camera perspective)

    // Event listeners
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // relative coordinates inside the canvas
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

    // Helper functions for 3D rotations
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

      // Smooth mouse coordinates interpolation
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

      // Adjust rotation angles based on mouse offset from center (mouse tilt effect)
      const mouseOffsetX = (mouse.current.x - width / 2) / (width / 2);
      const mouseOffsetY = (mouse.current.y - height / 2) / (height / 2);

      const currentAngleX = rotSpeedX + mouseOffsetY * 0.015;
      const currentAngleY = rotSpeedY + mouseOffsetX * 0.015;

      angleX += currentAngleX;
      angleY += currentAngleY;

      // Projection and translation mapping
      const projected: { x: number; y: number; depth: number; zIndex: number }[] = [];

      points.forEach((pt) => {
        // Copy original coords
        let p = { x: pt.baseX, y: pt.baseY, z: pt.baseZ };

        // Apply interactive mouse warping if close
        if (mouse.current.isHovering) {
          // Find distance from cursor to 3D center of sphere
          const rect = canvas.getBoundingClientRect();
          const cx = width / 2;
          const cy = height / 2;
          
          // Warp calculations
          const warpRadius = 150;
          const mouseX3D = mouse.current.x - cx;
          const mouseY3D = mouse.current.y - cy;
          
          // distance on the 2D plane
          const dx = mouseX3D - p.x;
          const dy = mouseY3D - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < warpRadius && dist > 0) {
            const pullForce = (warpRadius - dist) / warpRadius * 15;
            p.x += (dx / dist) * pullForce;
            p.y += (dy / dist) * pullForce;
          }
        }

        // Apply continuous 3D rotations
        rotateX(p, angleX);
        rotateY(p, angleY);

        // Project onto 2D screen (Perspective projection)
        const depth = 200; // camera depth offset
        const scale = fov / (fov + p.z + depth);
        const screenX = width / 2 + p.x * scale;
        const screenY = height / 2 + p.y * scale;

        projected.push({
          x: screenX,
          y: screenY,
          depth: scale,
          zIndex: p.z, // higher zIndex = closer to camera
        });
      });

      // Draw wireframe grid lines
      ctx.lineWidth = 1;
      
      // Connect rings (latitude rows)
      for (let i = 0; i <= rings; i++) {
        for (let j = 0; j < sectors; j++) {
          const idx1 = i * sectors + j;
          const idx2 = i * sectors + ((j + 1) % sectors);
          
          const p1 = projected[idx1];
          const p2 = projected[idx2];
          
          if (p1 && p2) {
            // Depth shading: lines closer to screen are brighter emerald, back lines are faded slate
            const avgZ = (p1.zIndex + p2.zIndex) / 2;
            const alpha = Math.max(0.04, Math.min(0.4, (avgZ + radius) / (radius * 2) * 0.35));
            
            ctx.strokeStyle = `rgba(0, 229, 163, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Connect columns (longitude arcs)
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < sectors; j++) {
          const idx1 = i * sectors + j;
          const idx2 = (i + 1) * sectors + j;
          
          const p1 = projected[idx1];
          const p2 = projected[idx2];
          
          if (p1 && p2) {
            const avgZ = (p1.zIndex + p2.zIndex) / 2;
            const alpha = Math.max(0.04, Math.min(0.35, (avgZ + radius) / (radius * 2) * 0.3));
            
            ctx.strokeStyle = `rgba(0, 229, 163, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing vertices (dots)
      projected.forEach((p) => {
        // Points closer to camera are larger and brighter
        const radiusFactor = (p.zIndex + radius) / (radius * 2); // 0 to 1
        const size = Math.max(1, 1.2 + radiusFactor * 2.5);
        const alpha = Math.max(0.1, Math.min(0.95, radiusFactor * 0.9));
        
        ctx.fillStyle = `rgba(0, 229, 163, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw soft glow on nearest points
        if (radiusFactor > 0.8) {
          ctx.fillStyle = `rgba(0, 229, 163, ${alpha * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2);
          ctx.fill();
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
      className="relative w-full h-[450px] flex items-center justify-center overflow-hidden border border-[#263f39]/30 bg-[#121d1b]/40 rounded-2xl cursor-none"
      style={{
        boxShadow: "inset 0 1px 0 rgba(0, 229, 163, 0.05), 0 20px 50px rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Subtle architectural overlay guides */}
      <div className="absolute top-4 start-4 font-mono text-[9px] text-[#00e5a3]/50 uppercase tracking-widest pointer-events-none select-none">
        Mesh Object: SPHERE_01
      </div>
      <div className="absolute bottom-4 end-4 font-mono text-[9px] text-[#00e5a3]/50 uppercase tracking-widest pointer-events-none select-none">
        Projection: 3D_PERSPECTIVE
      </div>
    </div>
  );
}
