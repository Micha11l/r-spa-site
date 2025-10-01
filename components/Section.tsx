// components/Section.tsx
type Props = {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
};

export default function Section({ eyebrow, title, children }: Props) {
  return (
    <section className="py-10 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {(eyebrow || title) && (
          <header className="mb-6 sm:mb-8">
            {eyebrow && (
              <div className="text-xs tracking-widest text-zinc-500 uppercase">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl md:text-4xl">
                {title}
              </h2>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}