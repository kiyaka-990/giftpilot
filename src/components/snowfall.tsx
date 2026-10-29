"use client";

import { useEffect, useRef } from "react";

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
};

/**
 * Lightweight full-screen snowfall. Canvas based, GPU friendly, pauses when the
 * tab is hidden and renders a single static frame for reduced-motion users.
 */
export default function Snowfall({ density = 80 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let raf = 0;

    const seed = () => {
      flakes = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 2.2,
        speed: 0.18 + Math.random() * 0.55,
        drift: (Math.random() - 0.5) * 0.35,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.18 + Math.random() * 0.55,
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (flakes.length === 0) seed();
    };

    const draw = (advance: boolean) => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        if (advance) {
          f.y += f.speed;
          f.phase += 0.012;
          f.x += Math.sin(f.phase) * 0.5 + f.drift;
          if (f.y > height + 6) {
            f.y = -6;
            f.x = Math.random() * width;
          }
          if (f.x < -10) f.x = width + 10;
          if (f.x > width + 10) f.x = -10;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.fill();
      }
    };

    resize();
    seed();

    if (reduceMotion) {
      draw(false);
      return;
    }

    const loop = () => {
      draw(true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      resize();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
    />
  );
}
