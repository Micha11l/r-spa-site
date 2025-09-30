// components/Hero.tsx
"use client";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-[92vh] w-full overflow-hidden">
      {/* 背景大图：放到 /public/hero.jpg，先用一张临时图占位 */}
      <Image
        src="/hero.jpg"
        alt="Rejuvenessence Hero"
        fill
        priority
        className="object-cover"
      />
      {/* 暗化遮罩 */}
      <div className="absolute inset-0 bg-black/45" />

      {/* 居中品牌名 + 文案 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-[Playfair] text-white/95 tracking-wide text-5xl md:text-6xl lg:text-7xl drop-shadow">
          Rejuvenessence
        </h1>
        <p className="mt-4 text-white/80 text-base md:text-lg">
          Spa in Keswick / Toronto
        </p>
        {/* 需要按钮可解开 */}
        {/* <a href="#licenses" className="mt-8 inline-flex items-center rounded-full bg-white/90 px-5 py-2 text-sm font-medium hover:bg-white transition">
          Explore
        </a> */}
      </div>
    </section>
  );
}