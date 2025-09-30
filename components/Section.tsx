// components/Section.tsx
export default function Section({
    eyebrow, title, desc, children,
  }: {
    eyebrow?: string; title?: string; desc?: string; children: React.ReactNode;
  }) {
    return (
      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          {eyebrow && <p className="mb-2 text-xs tracking-widest text-gray-500 uppercase">{eyebrow}</p>}
          {title && <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>}
          {desc && <p className="mt-2 max-w-3xl text-gray-600">{desc}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </section>
    );
  }