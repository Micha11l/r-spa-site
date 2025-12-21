"use client";

import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import Link from "next/link";

export default function ChristmasOfferBadge() {
  return (
    <Link href="/giftcard/purchase?offer=christmas">
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-green-600 text-white px-4 py-3 rounded-full shadow-lg"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={{
              rotate: [0, -15, 15, -15, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <Gift className="h-6 w-6" />
          </motion.div>
          <span className="font-semibold text-sm whitespace-nowrap">
            Christmas Offer
          </span>
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-400 to-green-400 rounded-full blur-xl -z-10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </Link>
  );
}
