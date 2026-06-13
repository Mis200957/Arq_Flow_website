export type PlanId = "starter" | "business" | "enterprise";

export type Plan = {
  id: PlanId;
  name: { ar: string; en: string };
  tagline: { ar: string; en: string };
  setupFee: number;
  monthlyFee: number;
  messageLimit: number;
  features: { ar: string[]; en: string[] };
  highlighted?: boolean;
};

/**
 * Static mirror of the `plans` table (single source of truth is Supabase).
 * Used for instant render on the pricing page; dashboards read the DB.
 */
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: { ar: "ستارتر", en: "Starter" },
    tagline: {
      ar: "للمحلات والعيادات اللي محتاجة رد ذكي سريع ومحترم",
      en: "For shops & clinics that need fast, polite AI replies",
    },
    setupFee: 2500,
    monthlyFee: 500,
    messageLimit: 5000,
    features: {
      ar: [
        "٥٠٠٠ رسالة ذكية شهرياً",
        "محادثات نصية بالعربي والإنجليزي",
        "تحويل ذكي لموظف بشري",
        "تسجيل كل المحادثات والطلبات",
        "لوحة تحكم خاصة بنشاطك",
      ],
      en: [
        "5,000 AI messages / month",
        "Text conversations in Arabic & English",
        "Smart human handover",
        "Every conversation & order logged",
        "Your own client dashboard",
      ],
    },
  },
  {
    id: "business",
    name: { ar: "بيزنس", en: "Business" },
    tagline: {
      ar: "للمطاعم والمحلات اللي عايزة نظام يبيع ويحجز ويتابع لوحده",
      en: "For restaurants & stores that want a system that sells, books & follows up",
    },
    setupFee: 4000,
    monthlyFee: 750,
    messageLimit: 11000,
    features: {
      ar: [
        "١١٠٠٠ رسالة ذكية شهرياً",
        "فهم الرسائل الصوتية",
        "استقبال الطلبات والحجوزات تلقائياً",
        "روابط ذكية (منيو، كتالوج، دفع)",
        "ذاكرة تفضيلات العملاء",
        "كل مميزات ستارتر",
      ],
      en: [
        "11,000 AI messages / month",
        "Voice message understanding",
        "Automatic orders & bookings",
        "Smart links (menu, catalog, payment)",
        "Customer preference memory",
        "Everything in Starter",
      ],
    },
    highlighted: true,
  },
  {
    id: "enterprise",
    name: { ar: "إنتربرايز", en: "Enterprise" },
    tagline: {
      ar: "للشركات اللي محتاجة أقوى ذكاء وأعمق ذاكرة وتحليلات متقدمة",
      en: "For companies that need the deepest intelligence & analytics",
    },
    setupFee: 7000,
    monthlyFee: 1200,
    messageLimit: 20000,
    features: {
      ar: [
        "٢٠٠٠٠ رسالة ذكية شهرياً",
        "فهم وتحليل الصور",
        "أعمق ذاكرة محادثة",
        "تحليلات وتقارير متقدمة",
        "دعم ذو أولوية",
        "كل مميزات بيزنس",
      ],
      en: [
        "20,000 AI messages / month",
        "Image understanding & analysis",
        "Deepest conversation memory",
        "Advanced analytics & reports",
        "Priority support",
        "Everything in Business",
      ],
    },
  },
];

export const getPlan = (id: string | null | undefined): Plan | undefined =>
  PLANS.find((p) => p.id === id);

export const planTotal = (p: Plan): number => p.setupFee + p.monthlyFee;

export type PaymentChannel = "instapay" | "vodafone_cash" | "wepay";

export const PAYMENT_ACCOUNTS: Record<
  PaymentChannel,
  { label: { ar: string; en: string }; number: string }
> = {
  instapay: { label: { ar: "إنستاباي", en: "InstaPay" }, number: "01029168056" },
  vodafone_cash: { label: { ar: "فودافون كاش", en: "Vodafone Cash" }, number: "01029168056" },
  wepay: { label: { ar: "وي باي", en: "WE Pay" }, number: "01559041894" },
};

export const SUPPORT_WHATSAPP = "201029168056";
