// components/Section.tsx
import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title?: string;
  children?: ReactNode;
  /** 让上下 padding 更紧凑（py-6 sm:py-8） */
  compact?: boolean;
  /** 覆盖标题与内容块之间的间距（默认 mt-8 sm:mt-10） */
  contentClassName?: string;
  /** 外层额外 class */
  className?: string;
};

export default function Section({
  eyebrow,
  title,
  children,
  compact = false,
  contentClassName,
  className = "",
}: Props) {
  const pad = compact ? "py-6 sm:py-8" : "py-12 sm:py-16";
  const gap = contentClassName ?? "mt-8 sm:mt-10";

  return (
    <section className={`mx-auto max-w-6xl px-4 ${pad} ${className}`}>
      {(eyebrow || title) && (
        <header>
          {eyebrow && (
            <div className="mb-2 text-xs font-semibold tracking-widest text-zinc-500">
              {eyebrow.toUpperCase()}
            </div>
          )}
          {title && (
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h2>
          )}
        </header>
      )}

      {children && <div className={gap}>{children}</div>}
    </section>
  );
}