export type PlanId = "starter" | "business" | "enterprise";

export type Plan = {
  id: PlanId;
  name: { ar: string; en: string };
  tagline: { ar: string; en: string };
  /** One-time setup fee (first payment only). */
  setupFee: number;
  /** Package price = the customer-facing wallet credit added each top-up. */
  monthlyFee: number;
  /** Wallet validity in days (bot stops when balance runs out OR this elapses). */
  validityDays: number;
  features: { ar: string[]; en: string[] };
  highlighted?: boolean;
};

/**
 * Static mirror of the `plans` table (single source of truth is Supabase).
 * Used for instant render on the pricing page & onboarding; dashboards read the DB.
 *
 * Billing model: token wallet. The customer pays the package price (monthlyFee),
 * which becomes a wallet of AI credit valid for `validityDays`. The bot consumes
 * the wallet by real token cost until it runs out or the validity elapses,
 * whichever comes first. Any unused balance rolls over on renewal/upgrade.
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
    validityDays: 30,
    features: {
      ar: [
        "رصيد محادثات ذكية بقيمة الباقة — صلاحية ٣٠ يوم",
        "الرصيد المتبقي بيتجمّع مع التجديد",
        "محادثات نصية بالعربي والإنجليزي",
        "تحويل ذكي لموظف بشري",
        "تسجيل كل المحادثات والطلبات",
        "لوحة تحكم خاصة بنشاطك",
      ],
      en: [
        "AI conversation credit equal to the package — 30-day validity",
        "Unused balance rolls over on renewal",
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
    monthlyFee: 1100,
    validityDays: 30,
    features: {
      ar: [
        "رصيد محادثات أكبر — صلاحية ٣٠ يوم والرصيد بيتجمّع",
        "موديل ذكاء أقوى (Sonnet)",
        "فهم الرسائل الصوتية",
        "استقبال الطلبات والحجوزات تلقائياً",
        "روابط ذكية (منيو، كتالوج، دفع)",
        "ذاكرة تفضيلات العملاء",
        "كل مميزات ستارتر",
      ],
      en: [
        "Bigger AI credit — 30-day validity, balance rolls over",
        "More capable model (Sonnet)",
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
    monthlyFee: 1500,
    validityDays: 30,
    features: {
      ar: [
        "أكبر رصيد محادثات — صلاحية ٣٠ يوم والرصيد بيتجمّع",
        "فهم وتحليل الصور",
        "أعمق ذاكرة محادثة",
        "تحليلات وتقارير متقدمة",
        "دعم ذو أولوية",
        "كل مميزات بيزنس",
      ],
      en: [
        "Largest AI credit — 30-day validity, balance rolls over",
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

/** First-payment total = one-time setup fee + the package wallet credit. */
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
