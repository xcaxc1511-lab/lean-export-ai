import { useEffect, useRef, type RefObject } from "react";

/**
 * Animated dotted sphere for the Voice AI widget. `level` (0–1) makes it swell
 * and spin faster while someone is talking. Colours come from the Leandigi
 * tokens so the orb follows the brand palette.
 */
export function VoiceOrb({
  level,
  active,
  size = 260,
}: {
  /** Ref so the animation loop reads the live audio level without re-rendering. */
  level: RefObject<number>;
  active: boolean;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const navy = css.getPropertyValue("--ld-navy").trim() || "navy";
    const gold = css.getPropertyValue("--ld-gold").trim() || "gold";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Points spread evenly over a sphere (Fibonacci lattice).
    const N = 460;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, accent: i % 9 === 0 };
    });

    let angle = 0;
    let smooth = 0;
    let frame = 0;
    const tilt = 0.35;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    const draw = () => {
      const target = activeRef.current ? (level.current ?? 0) : 0;
      smooth += (target - smooth) * 0.18;
      const t = performance.now() / 1000;
      const breathe = reduceMotion ? 0 : Math.sin(t * 1.6) * 0.015;
      const radius = size * 0.38 * (1 + breathe + smooth * 0.14);
      angle += reduceMotion ? 0.001 : 0.004 + smooth * 0.03;

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (const p of pts) {
        // Rotate around Y, then tilt around X.
        const x1 = p.x * cosA + p.z * sinA;
        const z1 = -p.x * sinA + p.z * cosA;
        const y2 = p.y * cosT - z1 * sinT;
        const z2 = p.y * sinT + z1 * cosT;
        const depth = (z2 + 1) / 2; // 0 back … 1 front
        const wobble = smooth * 0.06 * Math.sin(t * 6 + p.y * 8);
        const px = cx + x1 * radius * (1 + wobble);
        const py = cy + y2 * radius * (1 + wobble);
        const dot = 0.6 + depth * 1.9;
        ctx.globalAlpha = 0.12 + depth * 0.78;
        ctx.fillStyle = p.accent && depth > 0.45 ? gold : navy;
        ctx.beginPath();
        ctx.arc(px, py, p.accent ? dot * 1.25 : dot, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [level, size]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="pointer-events-none select-none"
    />
  );
}
