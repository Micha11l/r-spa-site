// app/bistro/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "281 Bistro",
  description:
    "Small plates, pasta, mains, and a relaxed bar — available at Rejuvenessence (281 Bistro).",
  alternates: { canonical: "/bistro" },
};

type Item = {
  name: string;
  desc?: string;
  img: string;              // 放在 /public/bistro/ 下的图片
  priceFrom?: number;       // 价格（起）
  unit?: string;            // pp / per pc 等自由文案
};

// —— 菜单数据（示例价格来自你发的图；之后改这里即可） —— //
const smallPlates: Item[] = [
  { name: "Bruschetta Trio", desc: "Tomato basil · Roasted mushroom & feta · Grilled vegetable.", img: "/bistro/bruschetta.jpg", priceFrom: 10, unit: "pp" },
  { name: "Hummus Platter", desc: "Pita & raw veggies.", img: "/bistro/hummus.jpg", priceFrom: 5, unit: "pp" },
  { name: "Charcuterie Board", desc: "Cheeses, cured meats, berries, olives, grissini.", img: "/bistro/charcuterie.jpg", priceFrom: 20, unit: "pp" },
  { name: "Tempura Shrimp", desc: "Light, crisp, house dip.", img: "/bistro/tempura-shrimp.jpg", priceFrom: 5, unit: "per pc" },
  { name: "Lobster Mac & Cheese Bites", desc: "Rich & comforting.", img: "/bistro/lobster-mac-bites.jpg", priceFrom: 5, unit: "per pc" },
  { name: "Korean BBQ Chicken Satay", desc: "Sweet-savory glaze.", img: "/bistro/chicken-satay.jpg", priceFrom: 5, unit: "per pc" },
];

const salads: Item[] = [
  { name: "Cucumber-Fenced Microgreens", desc: "Goat cheese & praline pecans.", img: "/bistro/microgreens.jpg", priceFrom: 17, unit: "pp" },
  { name: "Classic Caesar", desc: "Shaved parmesan & garlic crostini.", img: "/bistro/caesar.jpg", priceFrom: 14, unit: "pp" },
  { name: "Boston Bibb", desc: "Walnuts & gorgonzola dressing.", img: "/bistro/bibb.jpg", priceFrom: 12, unit: "pp" },
];

const pasta: Item[] = [
  { name: "Tortellini Pesto Alfredo", img: "/bistro/tortellini.jpg", priceFrom: 17, unit: "pp" },
  { name: "Penne Tomato Basil", img: "/bistro/penne-tomato.jpg", priceFrom: 15, unit: "pp" },
  { name: "Penne alla Vodka", img: "/bistro/penne-vodka.jpg", priceFrom: 17, unit: "pp" },
];

const mains: Item[] = [
  { name: "Black Olive-Crusted Salmon", desc: "Microgreen salad, basil sushi rice-wine vinaigrette.", img: "/bistro/salmon.jpg", priceFrom: 53, unit: "pp" },
  { name: "Beef Tenderloin & Portobello", desc: "Red-wine demi, market veg, saffron potatoes.", img: "/bistro/beef-portobello.jpg", priceFrom: 73, unit: "pp" },
  { name: "Pistachio-Dijon Rack of Lamb", desc: "Squash & root-veg risotto.", img: "/bistro/rack-of-lamb.jpg", priceFrom: 73, unit: "pp" },
];

const desserts: Item[] = [
  { name: "Cookie Platter", img: "/bistro/cookies.jpg", priceFrom: 11, unit: "pp" },
  { name: "Seasonal Pie", img: "/bistro/seasonal-pie.jpg", priceFrom: 15, unit: "pp" },
  { name: "Crème Brûlée", desc: "Vanilla · Pistachio Chocolate · Bourbon Caramel · Black Forest · Mandarin Orange.", img: "/bistro/creme-brulee.jpg", priceFrom: 15, unit: "pp" },
  { name: "Cheesecake Minis", desc: "Chocolate · Caramel · Fresh fruit compote.", img: "/bistro/cheesecake-minis.jpg", priceFrom: 15, unit: "pp" },
  { name: "Fresh Fruit Platter", img: "/bistro/fruit-platter.jpg", priceFrom: 13, unit: "pp" },
];

// —— Drinks（可后续加图与价） —— //
type SimpleItem = { name: string; desc?: string };
const cocktails: SimpleItem[] = [
  { name: "Classic Spritz", desc: "Bright & bubbly aperitif." },
  { name: "Garden Gin & Tonic", desc: "Herb-forward, crisp." },
  { name: "Whisky Sour", desc: "Citrus balance, silky foam." },
];
const wine: SimpleItem[] = [
  { name: "Wine by the Glass", desc: "Rotating selection of red/white/rosé." },
  { name: "Sparkling", desc: "Celebrate with bubbles." },
];
const beerNA: SimpleItem[] = [
  { name: "Local & Imported Beer" },
  { name: "Zero-Proof", desc: "Sodas, iced teas, botanicals, espresso/tea." },
];

// —— UI —— //
function formatPrice(it: Item) {
  if (it.priceFrom == null) return "";
  return `From $${it.priceFrom}${it.unit ? (it.unit.startsWith("per") ? ` ${it.unit}` : it.unit) : ""}`;
}

function FoodGrid({ items }: { items: Item[] }) {
  return (
    <ul className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it.name} className="overflow-hidden rounded-xl border bg-white">
          <div className="relative aspect-[4/3] bg-zinc-100">
            <Image
              src={it.img}
              alt={it.name}
              fill
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold">{it.name}</h4>
              <span className="shrink-0 text-sm text-zinc-700">{formatPrice(it)}</span>
            </div>
            {it.desc && <p className="mt-1 text-sm text-zinc-600">{it.desc}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SimpleGrid({ items }: { items: SimpleItem[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
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
        <FoodGrid items={smallPlates} />
      </Section>

      <Section title="Salads">
        <FoodGrid items={salads} />
      </Section>

      <Section title="Pasta">
        <FoodGrid items={pasta} />
      </Section>

      <Section title="Mains">
        <FoodGrid items={mains} />
      </Section>

      <Section title="Desserts">
        <FoodGrid items={desserts} />
      </Section>

      <Section eyebrow="Bar" title="Cocktails • Wine • Beer & Zero-Proof">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h4 className="mb-2 font-semibold">Cocktails</h4>
            <SimpleGrid items={cocktails} />
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Wine</h4>
            <SimpleGrid items={wine} />
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Beer & Zero-Proof</h4>
            <SimpleGrid items={beerNA} />
          </div>
        </div>
        <p className="mt-6 text-sm text-zinc-500">
          Sample items shown. Offerings/pricing may change based on season and supply.
        </p>
      </Section>
    </>
  );
}