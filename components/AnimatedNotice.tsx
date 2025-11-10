// app/components/AnimatedNotice.tsx
"use client";

import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";

export default function AnimatedNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`rounded-xl border-2 border-amber-300 bg-amber-50/90 p-4 shadow-lg ring-2 ring-amber-200/50 ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}