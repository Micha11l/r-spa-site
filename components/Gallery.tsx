// components/Gallery.tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  images: string[];
  auto?: boolean;
  interval?: number;
};

export default function Gallery({ images, auto, interval = 4000 }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((v) => (v + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [auto, interval, images.length]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-[21/9]">
        {images.map((src, idx) => (
          <Image
            key={src}
            src={src}
            alt={`Gallery ${idx + 1}`}
            fill
            className={`object-cover transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 90vw, 1100px"
            priority={idx === 0}
          />
        ))}

        <button
          aria-label="Prev"
          onClick={() => setI((v) => (v - 1 + images.length) % images.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full px-3 py-1 text-sm"
        >
          ‹
        </button>
        <button
          aria-label="Next"
          onClick={() => setI((v) => (v + 1) % images.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full px-3 py-1 text-sm"
        >
          ›
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 sm:gap-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 w-1.5 rounded-full ${idx === i ? "bg-white" : "bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}