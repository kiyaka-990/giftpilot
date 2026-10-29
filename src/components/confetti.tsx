"use client";

import { useEffect, useRef } from "react";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
};

const COLORS = ["#e9b949", "#f7dc9a", "#d7263d", "#ff5f77", "#f6f2e9", "#0e7a5f"];

/**
 * One-shot celebration burst used on the payment success screen.
 * Runs a fixed number of seconds, then stops — no perpetual animation loop.
 */
export default function Confetti({ run }: { run: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pieces: Piece[] = Array.from({ length: 140 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? width * 0.12 : width * 0.88;
      const angle = fromLeft
        ? (-Math.PI / 3) - Math.random() * 0.7
        : (-Math.PI * 2) / 3 + Math.random() * 0.7;
      const power = 9 + Math.random() * 11;
      return {
        x: originX,
        y: height * 0.62,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      for (const p of pieces) {
        p.vy += 0.28;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        const fade = Math.max(0, 1 - elapsed / 4200);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      }

      if (elapsed < 4400) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
