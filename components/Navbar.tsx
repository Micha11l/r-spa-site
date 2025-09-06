"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <header className="border-b border-ink/10 sticky top-0 z-50 bg-paper/80 backdrop-blur">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <motion.img
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            src="/logo.jpg"
            alt="R Spa Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold tracking-wide">R Spa</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm uppercase tracking-wider">
          <Link href="/services">Services</Link>
          <Link href="/booking" className="btn btn-primary no-underline">Book Now</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/policies">Policies</Link>
        </nav>
      </div>
    </header>
  );
}
