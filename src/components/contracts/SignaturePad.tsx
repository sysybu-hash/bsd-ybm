'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  onChange: (dataUrlPng: string | null) => void;
  className?: string;
};

const W = 640;
const H = 220;

export default function SignaturePad({ onChange, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#001A4D';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    if ('touches' in e && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * sx,
        y: (e.touches[0].clientY - rect.top) * sy,
      };
    }
    const me = e as React.MouseEvent;
    return {
      x: (me.clientX - rect.left) * sx,
      y: (me.clientY - rect.top) * sy,
    };
  };

  const emit = () => {
    const c = canvasRef.current;
    if (c) onChange(c.toDataURL('image/png'));
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setEmpty(false);
    emit();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className={`flex w-full max-w-md flex-col items-center justify-center gap-4 ${className}`}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="h-auto w-full max-w-full touch-none rounded-[32px] border-2 border-dashed border-[#001A4D]/35 bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button
        type="button"
        onClick={clear}
        className="rounded-[32px] border border-gray-200 px-6 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
      >
        ניקוי חתימה
      </button>
      {empty ? <span className="text-xs text-gray-400">חתמו באצבע או בעכבר</span> : null}
    </div>
  );
}
