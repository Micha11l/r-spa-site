// app/learn-more/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Learn more",
  description: "Learn more about our therapies and equipment.",
};

export default function LearnMorePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      {/* 你后面把内容填这里即可 */}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Learn more</h1>
      <p className="mt-3 text-zinc-600">
        This page is a placeholder. Send me your copy/images and I’ll build it out.
      </p>

      {/* 先放一个跳转到 Therapies 的按钮 */}
      <div className="mt-8">
        <Link
          href="/seqex"
          className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
        >
          View Therapies
        </Link>
      </div>
    </section>
  );
}