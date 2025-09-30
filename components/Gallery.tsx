// components/Gallery.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function Gallery({
  images, auto = true, interval = 4000,
}: { images: string[]; auto?: boolean; interval?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!auto || images.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [auto, interval, images.length]);

  useEffect(() => {
    ref.current?.scrollTo({ left: idx * (ref.current?.clientWidth || 0), behavior: "smooth" });
  }, [idx]);

  return (
    <div className="relative">
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-2xl ring-1 ring-black/5">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`Gallery ${i + 1}`}
            className="snap-center shrink-0 w-full h-[360px] object-cover"
          />
        ))}
      </div>
      {/* 简易指示器 */}
      <div className="absolute inset-x-0 -bottom-3 flex justify-center gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-black" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}