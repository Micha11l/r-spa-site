import type { Metadata } from "next";
import TherapiesContent from "@/components/TherapiesContent";

export const metadata: Metadata = {
  title: "Therapies",
  description:
    "Seqex PEMF, Plasma Light (RX1/RX6) and Ondamed biofeedback — how they work, benefits, and what to expect.",
  alternates: { canonical: "/therapies" },
};

export default function TherapiesPage() {
  return <TherapiesContent />;
}
