// components/Gallery.tsx
"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  auto?: boolean;
  interval?: number; // ms
  /** 纵横比，传入 16/9、4/3、1 等数字即可 */
  aspect?: number;
};

export default function Gallery({
  images,
  auto = true,
  interval = 4000,
  aspect = 16 / 9,
}: Props) {
  const [index, setIndex] = useState(0);
  const n = images.length;
  const timer = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playing = useRef(true);

  // 只有在视口内才自动播放，避免造成“页面被拉过去”的感觉
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      playing.current = entry.isIntersecting;
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 自动播放（不改 hash、不聚焦）
  useEffect(() => {
    if (!auto || n <= 1) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (playing.current) setIndex((i) => (i + 1) % n);
    }, interval);
    return () => timer.current && clearInterval(timer.current);
  }, [auto, interval, n]);

  const go = (i: number) => setIndex(((i % n) + n) % n);

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-2xl bg-white"
      aria-roledescription="carousel"
      aria-label="Gallery"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live="off"
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative w-full shrink-0"
            style={{ aspectRatio: aspect }}
          >
            <Image
              src={src}
              alt={`Photo ${i + 1}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* 左右切换（button，不用 a[href]） */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-2">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/60"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/60"
        >
          ›
        </button>
      </div>

      {/* 圆点 */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full ${index === i ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}