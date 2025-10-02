// components/Gallery.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  /** 自动播放 */
  auto?: boolean;
  /** 自动播放间隔 ms */
  interval?: number;
  /** 宽高比，默认 16/9。示例：1（正方形）、4/3、3/2… */
  aspect?: number;
  className?: string;
};

export default function Gallery({
  images,
  auto = true,
  interval = 5000,
  aspect = 16 / 9,
  className = "",
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // 自动播放
  useEffect(() => {
    if (!auto || images.length <= 1) return;
    const id = setInterval(() => goTo(index + 1), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, auto, interval, images.length]);

  // 根据 scroll 位置更新索引
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onScroll = () => {
      const i = Math.round(vp.scrollLeft / vp.clientWidth);
      setIndex(i);
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const n = images.length;
    const idx = (i + n) % n;
    const child = vp.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(idx);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={viewportRef}
        className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory rounded-2xl border bg-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/40"
        style={{ scrollbarWidth: "none" }} // Firefox 隐藏滚动条
      >
        {/* WebKit 隐藏滚动条 */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {images.map((src, i) => (
          <div
            key={src + i}
            className="relative w-full shrink-0 snap-start"
            style={{ aspectRatio: String(aspect) }}
          >
            <Image
              src={src}
              alt={`Gallery image ${i + 1}`}
              fill
              priority={i < 1} // 首屏只优先加载第一张
              sizes="100vw"     // 桌面/移动都按容器全宽响应式裁剪
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* 左右箭头（键盘与鼠标可用） */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xl leading-none shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xl leading-none shadow hover:bg-white"
          >
            ›
          </button>
        </>
      )}

      {/* 指示条（可点击跳转） */}
      {images.length > 1 && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 w-6 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}