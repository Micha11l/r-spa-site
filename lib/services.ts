// lib/supabase.ts (server)
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE!;

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});
// —— 服务清单 ——
// Therapies
export const THERAPIES = [
    "Seqex Session (27m)",
    "Seqex Session – Double (58m)",
    "Seqex Personalized Test (80m)",
    "Personalized Test & Card (80m)",
    "ICR Treatment (12m)",
    "Amygdala Flush (custom)",
    "Special Treatment (custom)",
    "RX1 Seat (20m)",
    "Vitamin D UVB (4m)",
    "LifeForce (60m)",
  ] as const;
  
  // Spa
  export const SPA = [
    "Spa – Head (45m)",
    "Spa – Back & Shoulders (60m)",
    "Spa – Full Body (90m)",
    "Spa – Hot Stone (75m)",
  ] as const;
  
  // 其他 / 仅咨询
  export const OTHER = ["Private Event / Party (inquiry only)"] as const;
  
  // 合并
  export const SERVICES = [...THERAPIES, ...SPA, ...OTHER] as const;
  
  // 方便做类型标注
  export type ServiceName = (typeof SERVICES)[number];
  
  // —— 每个服务时长（分钟） ——
  // 注意：键必须完全匹配上面的文案
  export const DURATIONS: Record<ServiceName, number> = {
    // Therapies
    "Seqex Session (27m)": 27,
    "Seqex Session – Double (58m)": 58,
    "Seqex Personalized Test (80m)": 80,
    "Personalized Test & Card (80m)": 80,
    "ICR Treatment (12m)": 12,
    "Amygdala Flush (custom)": 60,
    "Special Treatment (custom)": 60,
    "RX1 Seat (20m)": 20,
    "Vitamin D UVB (4m)": 4,
    "LifeForce (60m)": 60,
  
    // Spa
    "Spa – Head (45m)": 45,
    "Spa – Back & Shoulders (60m)": 60,
    "Spa – Full Body (90m)": 90,
    "Spa – Hot Stone (75m)": 75,
  
    // Other（占位时长，不用于计费）
    "Private Event / Party (inquiry only)": 120,
  };