/* ============================================================
   ArqFlow — Plan Capabilities
   ------------------------------------------------------------
   Single source of truth for what each subscription plan unlocks
   in the dashboard. Pure data — no React / lucide — so it is safe
   to import from server components, API routes, middleware, and
   n8n payload builders.

   SOURCE OF TRUTH
   ---------------
   Capabilities live on the `plans.capabilities` JSONB column and
   are editable from /admin/plans. When a plan has no (or partial)
   flags, we fall back to tier_level defaults below, so the platform
   keeps working before/without any admin edits (backward compatible).

   GATING STYLE ("mixed")
   ----------------------
   - Operational/industry modules are HIDDEN when not in the plan
     (a Starter restaurant simply doesn't see Orders/Menu).
   - Showcase upsell features (broadcasts, advanced analytics) are
     shown LOCKED with an upgrade CTA — they advertise the value of
     the higher tier instead of disappearing.
   ============================================================ */

export type CapabilityKey =
  | "operational_modules" // orders/products/services + every industry module
  | "broadcasts"          // broadcast / bulk messaging
  | "advanced_analytics"  // advanced reports & export
  | "voice"               // voice-message understanding
  | "image"               // image understanding
  | "customer_memory"     // customer-preference memory
  | "priority_support";   // priority support routing / badge

export type Capabilities = Record<CapabilityKey, boolean>;

/** Display style when a gated capability is missing from the plan. */
export type LockStyle = "hide" | "lock";

export interface CapabilityMeta {
  key: CapabilityKey;
  label: { ar: string; en: string };
  /** Short admin-facing hint about what the flag controls. */
  hint: { ar: string; en: string };
  /** How a module gated by this capability renders when missing. */
  lockStyle: LockStyle;
}

/** Ordered metadata — drives the admin editor + any UI listing. */
export const CAPABILITY_META: CapabilityMeta[] = [
  {
    key: "operational_modules",
    label: { ar: "الموديولات التشغيلية", en: "Operational modules" },
    hint: {
      ar: "الطلبات والمنتجات والخدمات وكل موديولات الصناعة (مواعيد، غرف، عضويات…).",
      en: "Orders, products, services & all industry modules (appointments, rooms, memberships…).",
    },
    lockStyle: "hide",
  },
  {
    key: "broadcasts",
    label: { ar: "الإذاعة", en: "Broadcasts" },
    hint: {
      ar: "إرسال رسائل جماعية / حملات للعملاء.",
      en: "Bulk / campaign messaging to customers.",
    },
    lockStyle: "lock",
  },
  {
    key: "advanced_analytics",
    label: { ar: "تحليلات متقدمة", en: "Advanced analytics" },
    hint: {
      ar: "تقارير متقدمة وتصدير البيانات (التحليلات الأساسية متاحة للجميع).",
      en: "Advanced reports & data export (basic analytics is always on).",
    },
    lockStyle: "lock",
  },
  {
    key: "voice",
    label: { ar: "فهم الرسائل الصوتية", en: "Voice understanding" },
    hint: {
      ar: "البوت يفهم ويرد على الرسائل الصوتية.",
      en: "Bot understands & replies to voice notes.",
    },
    lockStyle: "lock",
  },
  {
    key: "image",
    label: { ar: "فهم الصور", en: "Image understanding" },
    hint: {
      ar: "البوت يحلل الصور المرسلة من العملاء.",
      en: "Bot analyses images sent by customers.",
    },
    lockStyle: "lock",
  },
  {
    key: "customer_memory",
    label: { ar: "ذاكرة تفضيلات العميل", en: "Customer memory" },
    hint: {
      ar: "تذكّر تفضيلات وسجل كل عميل عبر المحادثات.",
      en: "Remembers each customer's preferences & history across chats.",
    },
    lockStyle: "lock",
  },
  {
    key: "priority_support",
    label: { ar: "دعم ذو أولوية", en: "Priority support" },
    hint: {
      ar: "أولوية في الرد والدعم الفني.",
      en: "Priority response & technical support.",
    },
    lockStyle: "lock",
  },
];

export const ALL_CAPABILITY_KEYS: CapabilityKey[] = CAPABILITY_META.map((c) => c.key);

const LOCK_STYLE: Record<CapabilityKey, LockStyle> = Object.fromEntries(
  CAPABILITY_META.map((c) => [c.key, c.lockStyle])
) as Record<CapabilityKey, LockStyle>;

export const lockStyleFor = (key: CapabilityKey): LockStyle => LOCK_STYLE[key];

/* ------------------------------------------------------------
   Tier defaults — the safety net when plans.capabilities is empty
   or only partially set. Mirrors the medium-tiering matrix.
   ------------------------------------------------------------ */
const NONE: Capabilities = {
  operational_modules: false,
  broadcasts: false,
  advanced_analytics: false,
  voice: false,
  image: false,
  customer_memory: false,
  priority_support: false,
};

export const DEFAULT_CAPABILITIES_BY_TIER: Record<number, Capabilities> = {
  1: { ...NONE },
  2: {
    ...NONE,
    operational_modules: true,
    broadcasts: true,
    voice: true,
    customer_memory: true,
  },
  3: {
    operational_modules: true,
    broadcasts: true,
    advanced_analytics: true,
    voice: true,
    image: true,
    customer_memory: true,
    priority_support: true,
  },
};

/** Defaults for a tier level (>=3 inherits the top tier; <1 gets nothing). */
export function defaultCapabilitiesForTier(tier: number | null | undefined): Capabilities {
  const t = Number(tier ?? 1);
  if (t >= 3) return { ...DEFAULT_CAPABILITIES_BY_TIER[3] };
  if (t === 2) return { ...DEFAULT_CAPABILITIES_BY_TIER[2] };
  return { ...DEFAULT_CAPABILITIES_BY_TIER[1] };
}

/**
 * Resolve a plan row into a complete, typed capabilities map.
 * Stored flags win; any key the admin hasn't set falls back to the
 * tier default. Accepts loosely-typed plan rows (capabilities is Json).
 */
export function resolveCapabilities(
  plan: { capabilities?: unknown; tier_level?: number | null } | null | undefined
): Capabilities {
  const base = defaultCapabilitiesForTier(plan?.tier_level);
  const raw = plan?.capabilities;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const stored = raw as Record<string, unknown>;
    for (const key of ALL_CAPABILITY_KEYS) {
      if (typeof stored[key] === "boolean") base[key] = stored[key] as boolean;
    }
  }
  return base;
}

/** Coerce an arbitrary object into a clean boolean capabilities map. */
export function normalizeCapabilities(input: unknown): Capabilities {
  const out: Capabilities = { ...NONE };
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    for (const key of ALL_CAPABILITY_KEYS) out[key] = Boolean(obj[key]);
  }
  return out;
}
