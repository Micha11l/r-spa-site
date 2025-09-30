// components/Navbar.tsx （只展示需要新增的片段）
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="px-4 py-4 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <Link href="/" className="font-semibold">Rejuvenessence</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/seqex">Therapies</Link>
          <Link href="/spa">Spa</Link>
          <Link href="/amenities">Sauna & Hot Tub</Link>
          <Link href="/events">Events</Link>
          <Link href="/booking" className="rounded-lg bg-black px-3 py-2 text-white">Book</Link>
        </nav>
      </div>
    </header>
  );
}