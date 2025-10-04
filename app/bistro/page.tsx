// app/bistro/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "281 Bistro",
  description:
    "Small plates, pasta, mains, and a relaxed bar — available at Rejuvenessence (281 Bistro).",
  alternates: { canonical: "/bistro" },
};

type Item = { name: string; desc?: string };

const smallPlates: Item[] = [
  { name: "Bruschetta Trio", desc: "Tomato basil · Roasted mushroom & feta · Grilled vegetable." },
  { name: "Hummus Platter", desc: "Pita & raw veggies." },
  { name: "Charcuterie Board", desc: "Cheeses, cured meats, berries, olives, grissini." },
  { name: "Tempura Shrimp", desc: "Light, crisp, house dip." },
  { name: "Lobster Mac & Cheese Bites", desc: "Rich & comforting." },
  { name: "Korean BBQ Chicken Satay", desc: "Sweet-savory glaze." },
];

const salads: Item[] = [
  { name: "Cucumber-Fenced Microgreens", desc: "Goat cheese & praline pecans." },
  { name: "Classic Caesar", desc: "Shaved parmesan & garlic crostini." },
  { name: "Boston Bibb", desc: "Walnuts & gorgonzola dressing." },
];

const pasta: Item[] = [
  { name: "Tortellini Pesto Alfredo" },
  { name: "Penne Tomato Basil" },
  { name: "Penne alla Vodka" },
];

const mains: Item[] = [
  { name: "Black Olive-Crusted Salmon", desc: "Microgreen salad, basil sushi rice-wine vinaigrette." },
  { name: "Beef Tenderloin & Portobello", desc: "Red-wine demi, market veg, saffron potatoes." },
  { name: "Pistachio-Dijon Rack of Lamb", desc: "Squash & root-veg risotto." },
];

const desserts: Item[] = [
  { name: "Cookie Platter" },
  { name: "Seasonal Pie" },
  { name: "Crème Brûlée", desc: "Vanilla · Pistachio Chocolate · Bourbon Caramel · Black Forest · Mandarin Orange." },
  { name: "Cheesecake Minis", desc: "Chocolate · Caramel · Fresh fruit compote." },
  { name: "Fresh Fruit Platter" },
];

const cocktails: Item[] = [
  { name: "Classic Spritz", desc: "Bright & bubbly aperitif." },
  { name: "Garden Gin & Tonic", desc: "Herb-forward, crisp." },
  { name: "Whisky Sour", desc: "Citrus balance, silky foam." },
];

const wine: Item[] = [
  { name: "Wine by the Glass", desc: "Rotating selection of red/white/rosé." },
  { name: "Sparkling", desc: "Celebrate with bubbles." },
];

const beerNA: Item[] = [
  { name: "Local & Imported Beer" },
  { name: "Zero-Proof", desc: "Sodas, iced teas, botanicals, espresso/tea." },
];

function Grid({ items }: { items: Item[] }) {
  return (
    <ul className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it.name} className="rounded-xl border bg-white p-4">
          <div className="font-semibold">{it.name}</div>
          {it.desc && <p className="mt-1 text-sm text-zinc-600">{it.desc}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function BistroPage() {
  return (
    <>
      <Section eyebrow="Bistro" title="281 Bistro">
        <p className="max-w-3xl text-lg text-zinc-600">
          Small plates, pasta, seasonal mains and a relaxed bar — right at our Keswick studio.
          Menus rotate with availability.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/booking" className="btn btn-primary">Reserve seating</Link>
          <Link href="/policies" className="btn btn-ghost">Policies</Link>
        </div>
      </Section>

      <Section eyebrow="Menu" title="Small Plates">
        <Grid items={smallPlates} />
      </Section>

      <Section title="Salads">
        <Grid items={salads} />
      </Section>

      <Section title="Pasta">
        <Grid items={pasta} />
      </Section>

      <Section title="Mains">
        <Grid items={mains} />
      </Section>

      <Section title="Desserts">
        <Grid items={desserts} />
      </Section>

      <Section eyebrow="Bar" title="Cocktails • Wine • Beer & Zero-Proof">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h4 className="font-semibold mb-2">Cocktails</h4>
            <Grid items={cocktails} />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Wine</h4>
            <Grid items={wine} />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Beer & Zero-Proof</h4>
            <Grid items={beerNA} />
          </div>
        </div>
        <p className="mt-6 text-sm text-zinc-500">
          Sample items shown. Offerings/pricing may change based on season and supply.
        </p>
      </Section>
    </>
  );
}