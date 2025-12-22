// lib/services.catalog.ts
// 客户端安全的服务目录 - 无环境变量、无 Supabase 依赖
// 可以被客户端组件和服务器端代码导入

// 服务目录项类型
export type ServiceCatalogItem = {
  name: string;
  category:
    | "therapy"
    | "head"
    | "back-shoulders"
    | "foot"
    | "full-body"
    | "lymphatic"
    | "other";
  minutes: number;
  priceCents: number;
  available: boolean;
  description?: string;
};

// 分类显示名称映射
export const CATEGORY_LABELS: Record<string, string> = {
  therapy: "Therapy Services",
  head: "Head Massage",
  "back-shoulders": "Back & Shoulders Massage",
  foot: "Foot Massage",
  "full-body": "Full Body Massage",
  lymphatic: "Lymphatic Drainage Massage",
  other: "Other Services",
};

// —— 单一真实来源：服务目录 ——
export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  // Therapies
  {
    name: "Seqex Session (27m)",
    category: "therapy",
    minutes: 27,
    priceCents: 5000,
    available: true,
  },
  {
    name: "Seqex Session – Double (58m)",
    category: "therapy",
    minutes: 58,
    priceCents: 9500,
    available: true,
  },
  {
    name: "Seqex Personalized Test (80m)",
    category: "therapy",
    minutes: 80,
    priceCents: 12000,
    available: true,
  },
  {
    name: "Personalized Test & Card (80m)",
    category: "therapy",
    minutes: 80,
    priceCents: 12000,
    available: true,
  },
  {
    name: "ICR Treatment (12m)",
    category: "therapy",
    minutes: 12,
    priceCents: 3000,
    available: true,
  },
  {
    name: "Amygdala Flush (custom)",
    category: "therapy",
    minutes: 60,
    priceCents: 8000,
    available: true,
  },
  {
    name: "Special Treatment (custom)",
    category: "therapy",
    minutes: 60,
    priceCents: 8000,
    available: true,
  },
  {
    name: "RX1 Seat (20m)",
    category: "therapy",
    minutes: 20,
    priceCents: 4000,
    available: true,
  },
  {
    name: "Vitamin D UVB (4m)",
    category: "therapy",
    minutes: 4,
    priceCents: 2000,
    available: true,
  },
  {
    name: "LifeForce (60m)",
    category: "therapy",
    minutes: 60,
    priceCents: 10000,
    available: true,
  },

  // Massage - Head (标准价格)
  {
    name: "Head Massage (45m)",
    category: "head",
    minutes: 45,
    priceCents: 7500,
    available: true,
    description: "Scalp-focused session with neck relief",
  },
  {
    name: "Head Massage (60m)",
    category: "head",
    minutes: 60,
    priceCents: 10000,
    available: true,
    description: "Scalp-focused session with neck relief",
  },
  {
    name: "Head Massage (90m)",
    category: "head",
    minutes: 90,
    priceCents: 15000,
    available: true,
    description: "Scalp-focused session with neck relief",
  },

  // Massage - Back & Shoulders (标准价格)
  {
    name: "Back & Shoulders Massage (45m)",
    category: "back-shoulders",
    minutes: 45,
    priceCents: 7500,
    available: true,
    description: "Back tension relief, posture-friendly",
  },
  {
    name: "Back & Shoulders Massage (60m)",
    category: "back-shoulders",
    minutes: 60,
    priceCents: 10000,
    available: true,
    description: "Back tension relief, posture-friendly",
  },
  {
    name: "Back & Shoulders Massage (90m)",
    category: "back-shoulders",
    minutes: 90,
    priceCents: 15000,
    available: true,
    description: "Back tension relief, posture-friendly",
  },

  // Massage - Foot (标准价格)
  {
    name: "Foot Massage (45m)",
    category: "foot",
    minutes: 45,
    priceCents: 7500,
    available: true,
    description: "Focused foot and lower leg relaxation",
  },
  {
    name: "Foot Massage (60m)",
    category: "foot",
    minutes: 60,
    priceCents: 10000,
    available: true,
    description: "Focused foot and lower leg relaxation",
  },
  {
    name: "Foot Massage (90m)",
    category: "foot",
    minutes: 90,
    priceCents: 15000,
    available: true,
    description: "Focused foot and lower leg relaxation",
  },

  // Massage - Full Body (标准价格)
  {
    name: "Full Body Massage (45m)",
    category: "full-body",
    minutes: 45,
    priceCents: 7500,
    available: true,
    description: "Slow, balanced flow for full relaxation",
  },
  {
    name: "Full Body Massage (60m)",
    category: "full-body",
    minutes: 60,
    priceCents: 10000,
    available: true,
    description: "Slow, balanced flow for full relaxation",
  },
  {
    name: "Full Body Massage (90m)",
    category: "full-body",
    minutes: 90,
    priceCents: 15000,
    available: true,
    description: "Slow, balanced flow for full relaxation",
  },

  // Lymphatic Drainage (特殊价格)
  {
    name: "Lymphatic Drainage Massage (60m)",
    category: "lymphatic",
    minutes: 60,
    priceCents: 13000,
    available: true,
    description: "Gentle massage to support natural detoxification",
  },
  {
    name: "Lymphatic Drainage Massage (90m)",
    category: "lymphatic",
    minutes: 90,
    priceCents: 16000,
    available: true,
    description: "Gentle massage to support natural detoxification",
  },

  // Other
  {
    name: "Private Event / Party (inquiry only)",
    category: "other",
    minutes: 120,
    priceCents: 0,
    available: true,
  },
];

// —— 派生导出（仅可用服务） ——

// 所有可用服务名称的数组
const availableServiceNames = SERVICE_CATALOG.filter((s) => s.available).map(
  (s) => s.name
);

export const SERVICES = availableServiceNames as unknown as readonly [
  string,
  ...string[]
];

// 服务名称类型
export type ServiceName = (typeof SERVICES)[number];

// 时长映射（分钟）
export const DURATIONS: Record<string, number> = SERVICE_CATALOG.filter(
  (s) => s.available
).reduce(
  (acc, s) => {
    acc[s.name] = s.minutes;
    return acc;
  },
  {} as Record<string, number>
);

// 价格映射（加元，从 cents 转换）
export const PRICES: Record<string, number> = SERVICE_CATALOG.filter(
  (s) => s.available
).reduce(
  (acc, s) => {
    acc[s.name] = s.priceCents / 100;
    return acc;
  },
  {} as Record<string, number>
);

// 所有服务（包括不可用的，供管理员使用）
export const ALL_SERVICES = SERVICE_CATALOG.map((s) => s.name);

// 按分类分组的服务（仅可用）
export const SERVICES_BY_CATEGORY = SERVICE_CATALOG.filter(
  (s) => s.available
).reduce(
  (acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  },
  {} as Record<string, ServiceCatalogItem[]>
);

// 按摩服务分类（用于UI）
export const MASSAGE_CATEGORIES = [
  "head",
  "back-shoulders",
  "foot",
  "full-body",
  "lymphatic",
] as const;

// 辅助函数：根据名称获取服务
export function getServiceByName(name: string): ServiceCatalogItem | undefined {
  return SERVICE_CATALOG.find((s) => s.name === name);
}

// 辅助函数：检查服务是否可用
export function isServiceAvailable(name: string): boolean {
  const service = getServiceByName(name);
  return service?.available ?? false;
}
