"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Offer = {
  id: string;
  title: string;
  description: string;
  type: "addon" | "giftcard" | "referral" | "packages";
  actionLabel?: string;
};

const OFFERS: Offer[] = [
  {
    id: "hydro-upgrade",
    title: "Hydro Upgrade +15min",
    description: "Add 15 extra minutes of relaxing hydrotherapy to any service",
    type: "addon",
    actionLabel: "Apply Add-on",
  },
  {
    id: "giftcard-bonus",
    title: "Buy $200 Gift Card → Get $25 Bonus",
    description: "Purchase a $200 gift card and receive an extra $25 value",
    type: "giftcard",
    actionLabel: "Apply Offer",
  },
  {
    id: "refer-friend",
    title: "Refer a Friend → Both Get +15min Hot Tub",
    description:
      "Share the wellness! You and your friend both enjoy 15 minutes extra",
    type: "referral",
    actionLabel: "Apply Referral",
  },
  {
    id: "holiday-packages",
    title: "Holiday Packages",
    description: "Exclusive seasonal wellness packages for the perfect gift",
    type: "packages",
    actionLabel: "View Packages",
  },
];

export default function ChristmasOfferFloating() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [modalOpen]);

  function handleOfferAction(offer: Offer) {
    if (offer.type === "packages") {
      router.push("/holiday-packages");
      setModalOpen(false);
      return;
    }

    // Save to localStorage
    try {
      localStorage.setItem("christmas_offer_selected", offer.id);
      toast.success(`${offer.title} applied! 🎄`, {
        duration: 3000,
        icon: "🎁",
      });
      setModalOpen(false);
    } catch (e) {
      toast.error("Failed to apply offer");
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 group"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-green-600 text-white px-4 py-3 rounded-full shadow-lg"
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={{
              rotate: [0, -12, 12, -12, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <Gift className="h-5 w-5 md:h-6 md:w-6" />
          </motion.div>
          <span className="font-semibold text-sm md:text-base whitespace-nowrap hidden sm:inline">
            Holiday Offers
          </span>
          <Sparkles className="h-4 w-4 hidden md:inline" />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-400 to-green-400 rounded-full blur-xl -z-10 opacity-50"
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
      </motion.button>

      {/* Offer Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Panel */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-red-600 to-green-600 text-white px-6 py-4 rounded-t-3xl md:rounded-t-2xl flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-bold">
                      Holiday Special Offers
                    </h2>
                    <p className="text-sm text-white/90">
                      Limited time only - Choose your perfect gift 🎄
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Offers Grid */}
              <div className="p-6 grid gap-4 md:grid-cols-2">
                {OFFERS.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative border-2 border-zinc-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-lg transition-all group bg-gradient-to-br from-white to-zinc-50"
                  >
                    {/* Sparkle decoration */}
                    <div className="absolute top-2 right-2 text-yellow-500 opacity-0 group-hover:opacity-100 transition">
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <h3 className="font-bold text-lg mb-2 text-zinc-900 pr-8">
                      {offer.title}
                    </h3>
                    <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
                      {offer.description}
                    </p>

                    <button
                      onClick={() => handleOfferAction(offer)}
                      className={`w-full px-4 py-2.5 rounded-lg font-medium transition-all ${
                        offer.type === "packages"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {offer.actionLabel || "Apply"}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 text-center text-sm text-zinc-500">
                <p className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  These offers are available for a limited time only
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
