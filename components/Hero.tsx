// components/Hero.tsx
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative min-h-[70svh] md:min-h-[85svh] lg:min-h-[92svh]">
        <Image
          src="/hero.jpg"
          alt="Rejuvenessence"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/35 md:bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white">
              Rejuvenessence
            </h1>
            <p className="mt-4 text-white/90 text-base sm:text-lg md:text-xl">
              Med, Spa, &amp; Wellness studio located in Keswick / Toronto
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}