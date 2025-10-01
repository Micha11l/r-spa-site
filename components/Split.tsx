// components/Split.tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  image: string;
  title: string;
  desc: string;
  cta?: { href: string; label: string };
  flip?: boolean;
};

export default function Split({ image, title, desc, cta, flip }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 items-center">
      <div className={flip ? "md:order-2" : ""}>
        <div className="relative aspect-[4/3] sm:aspect-[3/2] lg:aspect-[21/12] w-full overflow-hidden rounded-xl">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 600px"
          />
        </div>
      </div>
      <div className={flip ? "md:order-1" : ""}>
        <h3 className="font-serif text-2xl sm:text-3xl">{title}</h3>
        <p className="mt-3 text-zinc-600 text-base sm:text-lg">{desc}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-4 inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}