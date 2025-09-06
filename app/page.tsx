"use client";
import Container from "@/components/Container";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <>
      <section className="section border-b border-ink/10">
        <Container>
          <motion.div initial={{opacity:0, y:8}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
            <div className="text-xs uppercase tracking-widest text-ash">First Session Free*</div>
            <h1 className="h1 mt-2">R Spa · Seqex & Plasma Light Wellness</h1>
            <p className="mt-4 max-w-2xl text-ash">
              A private, appointment-only studio focused on modern relaxation and recovery.
              Non-medical wellness sessions using advanced electromagnetic and light technologies.
            </p>
            <div className="mt-6 flex gap-3">
              <Link className="btn btn-primary" href="/booking">Book Now</Link>
              <Link className="btn" href="/services">View Services</Link>
            </div>
            <div className="mt-4 text-xs text-ash">* Your choice of Seqex and Light Therapies (excluding RX6 and alternative services).</div>
          </motion.div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="h3">Seqex® Electromagnetic Session</div>
              <p className="mt-2 text-ash">
                Gentle pulsed electromagnetic fields designed to support cellular balance, micro-circulation, and deep relaxation.
              </p>
              <div className="mt-4">
                <a href="/services#seqex" className="btn">Explore Seqex</a>
              </div>
            </div>
            <div className="card">
              <div className="h3">Plasma Light Therapy</div>
              <p className="mt-2 text-ash">
                Near-infrared and blue-light sessions supporting natural recovery, skin wellness, and a calm mind.
              </p>
              <div className="mt-4">
                <a href="/services#plasma" className="btn">Explore Plasma</a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
