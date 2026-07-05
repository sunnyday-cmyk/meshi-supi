"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  labels: string[];
  colors: string[];
  /** 親がインクリメントするたびに新しいスピンが始まる */
  spinKey: number;
  targetIndex: number | null;
  onSpinComplete?: () => void;
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export default function RouletteWheel({ labels, colors, spinKey, targetIndex, onSpinComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);

  const n = Math.max(labels.length, 1);
  const segment = (2 * Math.PI) / n;

  const draw = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (let i = 0; i < n; i += 1) {
      const start = i * segment - Math.PI / 2;
      const end = start + segment;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "#1A1A2E";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + segment / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#1A1A2E";
      ctx.font = "bold 12px 'M PLUS Rounded 1c', sans-serif";
      const text = labels[i] ?? "";
      const short = text.length > 10 ? `${text.slice(0, 9)}…` : text;
      ctx.fillText(short, r * 0.65, 4);
      ctx.restore();
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.fillStyle = "#FFE135";
    ctx.fill();
    ctx.strokeStyle = "#1A1A2E";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎰", cx, cy);
  }, [labels, colors, n, segment]);

  useEffect(() => {
    draw(rotation);
  }, [draw, rotation]);

  useEffect(() => {
    if (spinKey <= 0 || targetIndex === null || labels.length === 0) {
      return;
    }

    const pointer = -Math.PI / 2;
    const localCenter = -Math.PI / 2 + targetIndex * segment + segment / 2;
    const startR = rotationRef.current;
    let delta = pointer - localCenter - startR;
    while (delta < 5 * 2 * Math.PI) {
      delta += 2 * Math.PI;
    }
    const endR = startR + delta;
    const durationMs = 4200;
    const t0 = performance.now();

    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = easeOutCubic(t);
      const r = startR + (endR - startR) * eased;
      rotationRef.current = r;
      setRotation(r);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onSpinComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinKey, targetIndex, labels.length, segment, onSpinComplete]);

  if (labels.length === 0) {
    return <p className="text-center text-slate-300">スピンする候補がありません</p>;
  }

  return (
    <div className="relative mx-auto w-[min(100%,320px)]">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-yellow drop-shadow" />
      </div>
      <canvas ref={canvasRef} width={320} height={320} className="mx-auto block" />
    </div>
  );
}
