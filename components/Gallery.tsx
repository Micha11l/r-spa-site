// components/Gallery.tsx
"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  auto?: boolean;
  interval?: number; // ms
};

export default function Gallery({ images, auto = true, interval = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const n = images.length;
  const timer = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playing = useRef(true); // 只有轮播在视口内时才自动切

  // 暂停：当轮播不在视口内时不自动切，避免“感觉像被拉过去”
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        playing.current = entry.isIntersecting;
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 自动播放（不改变 hash、不聚焦任何元素）
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
        aria-live="off" // 不要让读屏器把变化当“重要”从而移动焦点
      >
        {images.map((src, i) => (
          <div key={src} className="relative w-full shrink-0 aspect-[16/9] md:aspect-[21/9]">
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

      {/* 左右切换 —— 用 button，不用 a[href="#..."] */}
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

      {/* 圆点导航 —— 也用 button */}
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