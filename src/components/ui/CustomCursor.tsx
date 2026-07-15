"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Position references
  const mouse = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });

  // Hover states
  const isHovered = useRef(false);

  useEffect(() => {
    // Only enable on desktop devices with fine pointer (mouse)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    if (!mediaQuery.matches) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        target.classList.contains("cursor-pointer")
      ) {
        isHovered.current = true;
        if (ringRef.current) ringRef.current.classList.add("hovered");
        if (dotRef.current) dotRef.current.classList.add("hovered");
      } else {
        isHovered.current = false;
        if (ringRef.current) ringRef.current.classList.remove("hovered");
        if (dotRef.current) dotRef.current.classList.remove("hovered");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    // Animation loop using requestAnimationFrame (snappy lerping for high response)
    const updatePosition = () => {
      // Snappy tracking (dot: 0.45, ring: 0.25)
      dot.current.x += (mouse.current.x - dot.current.x) * 0.45;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.45;

      ring.current.x += (mouse.current.x - ring.current.x) * 0.22;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.current.x - 4}px, ${dot.current.y - 4}px, 0)`;
      }

      if (ringRef.current) {
        const rSize = isHovered.current ? 26 : 18;
        ringRef.current.style.transform = `translate3d(${ring.current.x - rSize}px, ${ring.current.y - rSize}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(updatePosition);
    };

    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* SVG liquid goo filter */}
      <svg className="pointer-events-none fixed inset-0 z-[-1] opacity-0" aria-hidden="true">
        <defs>
          <filter id="cursor-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Cursor Elements Wrapper */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999] hidden sm:block"
        style={{ filter: "url(#cursor-goo)" }}
      >
        {/* Core Dot (Glowing Mint) */}
        <div
          ref={dotRef}
          className="fixed left-0 top-0 w-2 h-2 rounded-full bg-[#00e5a3] shadow-[0_0_8px_#00e5a3] transition-all duration-300 ease-out"
        />
        {/* Trailing Liquid Ring (Transparent Emerald Glow) */}
        <div
          ref={ringRef}
          className="fixed left-0 top-0 w-9 h-9 rounded-full bg-[#00e5a3]/45 shadow-[0_0_12px_rgba(0,229,163,0.3)] transition-all duration-300 ease-out"
          style={{
            transformOrigin: "center center",
          }}
        />
      </div>
    </>
  );
}
