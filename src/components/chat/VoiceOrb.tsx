import { useEffect, useRef, type RefObject } from "react";

/**
 * Animated globe for the Voice AI widget: dots laid out on latitude rings
 * (denser towards the poles), faint meridians, light from the upper right and
 * out-of-focus dots at the back. `level` (0–1) makes it swell, ripple and spin
 * faster while someone is talking. Colours come from the Leandigi tokens.
 */
export function VoiceOrb({
  level,
  active,
  size = 300,
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
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const navy = token("--ld-navy", "navy");
    const tones = [navy, token("--ld-gold-deep", "gold"), token("--ld-gold-dark", "goldenrod")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // One pre-rendered dot per tone, sharp and out of focus, drawn scaled each frame.
    const SPRITE = 32;
    const sprite = (colour: string, blur: boolean) => {
      const c = document.createElement("canvas");
      c.width = c.height = SPRITE;
      const g = c.getContext("2d")!;
      const r = SPRITE / 2;
      if (blur) {
        const grad = g.createRadialGradient(r, r, 0, r, r, r);
        grad.addColorStop(0, colour);
        grad.addColorStop(0.45, colour);
        grad.addColorStop(1, "transparent");
        g.fillStyle = grad;
        g.globalAlpha = 0.9;
        g.fillRect(0, 0, SPRITE, SPRITE);
      } else {
        g.fillStyle = colour;
        g.beginPath();
        g.arc(r, r, r * 0.92, 0, Math.PI * 2);
        g.fill();
      }
      return c;
    };
    const sharp = tones.map((c) => sprite(c, false));
    const soft = tones.map((c) => sprite(c, true));

    // Latitude rings: more rings than meridian spacing, so the poles read as tight spirals.
    type Dot = { lat: number; lon: number; ring: number };
    const dots: Dot[] = [];
    const RINGS = 22;
    for (let i = 1; i < RINGS; i++) {
      const lat = -Math.PI / 2 + (i / RINGS) * Math.PI;
      const count = Math.max(8, Math.round(58 * Math.cos(lat)));
      const phase = (i % 2) * 0.5;
      for (let j = 0; j < count; j++)
        dots.push({ lat, lon: ((j + phase) / count) * Math.PI * 2, ring: i });
    }
    const MERIDIANS = 18;

    // Light from the upper right, slightly in front.
    const L = (() => {
      const v = [0.62, -0.42, 0.66];
      const n = Math.hypot(v[0]!, v[1]!, v[2]!);
      return v.map((x) => x / n) as [number, number, number];
    })();
    const tilt = 0.42; // shows the top pole, like a globe on a desk
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    let spin = 0;
    let smooth = 0;
    let frame = 0;
    let last = performance.now();

    const project = (lat: number, lon: number, cosA: number, sinA: number, R: number) => {
      const cl = Math.cos(lat);
      const x0 = cl * Math.cos(lon);
      const y0 = -Math.sin(lat);
      const z0 = cl * Math.sin(lon);
      const x1 = x0 * cosA + z0 * sinA;
      const z1 = -x0 * sinA + z0 * cosA;
      const y2 = y0 * cosT - z1 * sinT;
      const z2 = y0 * sinT + z1 * cosT;
      const persp = 1 / (1 - z2 * 0.18);
      return { x: x1, y: y2, z: z2, sx: x1 * R * persp, sy: y2 * R * persp, persp };
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = activeRef.current ? (level.current ?? 0) : 0;
      smooth += (target - smooth) * 0.16;
      const t = now / 1000;
      spin += reduceMotion ? 0 : dt * (0.16 + smooth * 1.1);
      const breathe = reduceMotion ? 0 : Math.sin(t * 1.3) * 0.012;
      const R = size * 0.42 * (1 + breathe + smooth * 0.08);
      const cx = size / 2;
      const cy = size / 2;
      const cosA = Math.cos(spin);
      const sinA = Math.sin(spin);

      ctx.clearRect(0, 0, size, size);

      // Faint meridians on the front half: the "wireframe" under the dots.
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = navy;
      for (let m = 0; m < MERIDIANS; m++) {
        const lon = (m / MERIDIANS) * Math.PI * 2;
        ctx.beginPath();
        let drawing = false;
        for (let k = 0; k <= 40; k++) {
          const lat = -Math.PI / 2 + (k / 40) * Math.PI;
          const p = project(lat, lon, cosA, sinA, R);
          if (p.z < 0.05) {
            drawing = false;
            continue;
          }
          if (drawing) ctx.lineTo(cx + p.sx, cy + p.sy);
          else ctx.moveTo(cx + p.sx, cy + p.sy);
          drawing = true;
        }
        ctx.globalAlpha = 0.13;
        ctx.stroke();
      }
      // Outline ring, slightly inset, as on the reference globe.
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(cx - R * 0.06, cy + R * 0.02, R * 0.86, 0, Math.PI * 2);
      ctx.stroke();

      // Back to front so the near dots sit on top.
      const projected = dots.map((d) => {
        const ripple = smooth * 0.07 * Math.sin(t * 7 - d.ring * 0.7);
        const p = project(d.lat, d.lon, cosA, sinA, R * (1 + ripple));
        return { d, p };
      });
      projected.sort((a, b) => a.p.z - b.p.z);

      for (const { p } of projected) {
        const lambert = Math.max(0, p.x * L[0] + p.y * L[1] + p.z * L[2]);
        const lit = Math.min(1, lambert * (1 + smooth * 0.6));
        const depth = (p.z + 1) / 2; // 0 back … 1 front
        const back = p.z < -0.15;
        const tone = lit > 0.62 ? 2 : lit > 0.32 ? 1 : 0;
        const img = back ? soft[tone]! : sharp[tone]!;
        const r = (back ? 2.6 + (1 - depth) * 1.6 : 0.8 + depth * 1.4 + lit * 0.8) * p.persp;
        ctx.globalAlpha = back
          ? 0.06 + depth * 0.22
          : Math.min(1, (0.16 + lit * 0.84) * (0.45 + depth * 0.55));
        ctx.drawImage(img, cx + p.sx - r, cy + p.sy - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    // Pause when off screen or in a background tab.
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry?.isIntersecting) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
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
