// components/Split.tsx
import Link from "next/link";

export default function Split({
  image, title, desc, cta, flip = false,
}: {
  image: string; title: string; desc: string;
  cta?: { href: string; label: string }; flip?: boolean;
}) {
  return (
    <section className="px-4 py-14">
      <div className={`mx-auto max-w-6xl grid md:grid-cols-2 gap-10 items-center ${flip ? "md:[&>*:first-child]:order-2" : ""}`}>
        <div className="rounded-2xl overflow-hidden ring-1 ring-black/5">
          <img src={image} alt={title} className="w-full h-[320px] object-cover" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-3 text-gray-700">{desc}</p>
          {cta && (
            <Link href={cta.href} className="mt-5 inline-block rounded-xl border border-black px-5 py-3 hover:bg-black/5">
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}