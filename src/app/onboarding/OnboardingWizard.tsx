"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  ImageIcon,
  MessageCircle,
  Music2,
  Facebook,
  Instagram,
  Plus,
  Trash2,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn, formatEGP, normalizeEgyptPhone } from "@/lib/utils";
import { PLANS, getPlan, planTotal, PAYMENT_ACCOUNTS, type PlanId, type PaymentChannel } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { Field, Spinner } from "@/components/ui";

/* ============================================================
   Minimal header (logo + language toggle) — shared with success
   ============================================================ */
export function OnboardingHeader() {
  const { lang, setLang } = useLang();
  return (
    <header className="sticky top-0 z-40">
      <div className="glass-strong !rounded-none border-x-0 border-t-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="gradient-text">ArqFlow</span>
          </Link>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="btn-ghost !px-3 text-sm"
            aria-label="Switch language"
          >
            <Globe className="w-4 h-4" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   Constants (bilingual option lists)
   ============================================================ */
type L = { ar: string; en: string };

// Business types drive the entire module-based platform (see src/lib/modules).
// Each value maps to an industry template that configures dashboard modules,
// the AI prompt, and the knowledge-base structure. Existing values are kept for
// backward compatibility; "other" intentionally has no template and falls back
// to the full default dashboard.
const BUSINESS_TYPES: { value: string; label: L }[] = [
  { value: "restaurant", label: { ar: "مطعم", en: "Restaurant" } },
  { value: "ecommerce", label: { ar: "متجر إلكتروني", en: "E-commerce" } },
  { value: "store", label: { ar: "محل تجاري", en: "Store" } },
  { value: "clinic", label: { ar: "عيادة", en: "Clinic" } },
  { value: "medical_center", label: { ar: "مركز طبي", en: "Medical Center" } },
  { value: "pharmacy", label: { ar: "صيدلية", en: "Pharmacy" } },
  { value: "hotel", label: { ar: "فندق", en: "Hotel" } },
  { value: "gym", label: { ar: "جيم / نادي رياضي", en: "Gym" } },
  { value: "salon", label: { ar: "صالون / مركز تجميل", en: "Salon" } },
  { value: "real_estate", label: { ar: "عقارات", en: "Real Estate" } },
  { value: "educational_center", label: { ar: "مركز تعليمي", en: "Educational Center" } },
  { value: "lawyer", label: { ar: "مكتب محاماة", en: "Lawyer Office" } },
  { value: "car_service", label: { ar: "خدمة سيارات", en: "Car Service" } },
  { value: "service_company", label: { ar: "شركة خدمات", en: "Service Company" } },
  { value: "company", label: { ar: "شركة / نشاط عام", en: "Company" } },
  { value: "other", label: { ar: "أخرى", en: "Other" } },
];

const BIZ_PAYMENT_METHODS: { value: string; label: L }[] = [
  { value: "cash", label: { ar: "كاش", en: "Cash" } },
  { value: "visa", label: { ar: "فيزا / بطاقات", en: "Visa / Cards" } },
  { value: "instapay", label: { ar: "إنستاباي", en: "InstaPay" } },
  { value: "vodafone_cash", label: { ar: "فودافون كاش", en: "Vodafone Cash" } },
  { value: "fawry", label: { ar: "فوري", en: "Fawry" } },
  { value: "bank", label: { ar: "تحويل بنكي", en: "Bank Transfer" } },
];

// Working-hours picker: ordered week (Egyptian week starts Saturday).
const WH_DAYS: { value: string; label: L }[] = [
  { value: "sat", label: { ar: "السبت", en: "Saturday" } },
  { value: "sun", label: { ar: "الأحد", en: "Sunday" } },
  { value: "mon", label: { ar: "الاثنين", en: "Monday" } },
  { value: "tue", label: { ar: "الثلاثاء", en: "Tuesday" } },
  { value: "wed", label: { ar: "الأربعاء", en: "Wednesday" } },
  { value: "thu", label: { ar: "الخميس", en: "Thursday" } },
  { value: "fri", label: { ar: "الجمعة", en: "Friday" } },
];
const WH_DEFAULT_DAYS = ["sat", "sun", "mon", "tue", "wed", "thu"];

function whDayName(value: string, lang: "ar" | "en"): string {
  const d = WH_DAYS.find((x) => x.value === value);
  return d ? d.label[lang] : value;
}

// "09:30" -> "9:30 ص" / "9:30 AM"
function whFormatTime(hhmm: string, lang: "ar" | "en"): string {
  const [hStr, mStr = "00"] = (hhmm || "").split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const am = h < 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = lang === "ar" ? (am ? "ص" : "م") : am ? "AM" : "PM";
  return `${h12}:${mStr.padStart(2, "0")} ${suffix}`;
}

// Build a clean, human-readable schedule string from the structured picker state.
// This is what gets stored in businesses.working_hours and sent to n8n unchanged.
function whSerialize(
  days: string[],
  open: string,
  close: string,
  always: boolean,
  lang: "ar" | "en"
): string {
  const order = WH_DAYS.map((d) => d.value);
  const sel = order.filter((v) => days.includes(v));
  if (sel.length === 0) return "";

  const sep = lang === "ar" ? "، " : ", ";
  const to = lang === "ar" ? "إلى" : "to";

  // group consecutive days into runs (e.g. Sat–Thu)
  const runs: string[][] = [];
  let run: string[] = [];
  let prev = -2;
  for (const v of sel) {
    const idx = order.indexOf(v);
    if (idx === prev + 1) run.push(v);
    else {
      if (run.length) runs.push(run);
      run = [v];
    }
    prev = idx;
  }
  if (run.length) runs.push(run);

  const daysStr = runs
    .map((r) =>
      r.length >= 3
        ? `${lang === "ar" ? "من " : ""}${whDayName(r[0], lang)} ${to} ${whDayName(r[r.length - 1], lang)}`
        : r.map((v) => whDayName(v, lang)).join(sep)
    )
    .join(sep);

  const timeStr = always
    ? lang === "ar"
      ? "24 ساعة"
      : "24 hours"
    : `${whFormatTime(open, lang)} – ${whFormatTime(close, lang)}`;

  const openPart = `${daysStr}: ${timeStr}`;
  const closed = order.filter((v) => !days.includes(v));
  if (closed.length === 0) return openPart;
  const closedLabel = lang === "ar" ? "مغلق" : "Closed";
  return `${openPart} — ${closedLabel}: ${closed.map((v) => whDayName(v, lang)).join(sep)}`;
}

const GOALS: { value: string; label: L }[] = [
  { value: "sales", label: { ar: "زيادة المبيعات", en: "Drive sales" } },
  { value: "support", label: { ar: "خدمة العملاء", en: "Customer support" } },
  { value: "booking", label: { ar: "الحجوزات والمواعيد", en: "Bookings & appointments" } },
  { value: "mixed", label: { ar: "كل ما سبق", en: "All of the above" } },
];

// Tone of voice. Internal value "egyptian" matches the backend zod enum
// (see /api/onboarding/route.ts) — the UI labels it "Colloquial Language":
// natural everyday conversational language, not overly casual or dialect-specific.
const TONES: { value: "formal" | "friendly" | "egyptian"; label: L; desc: L; example: L }[] = [
  {
    value: "formal",
    label: { ar: "رسمي", en: "Formal" },
    desc: { ar: "احترافي ومهذب، مناسب للشركات والعيادات", en: "Professional & polite — great for companies and clinics" },
    example: { ar: "«أهلاً وسهلاً بحضرتك، كيف يمكنني مساعدتك اليوم؟»", en: '"Welcome. How may I assist you today?"' },
  },
  {
    value: "friendly",
    label: { ar: "ودود", en: "Friendly" },
    desc: { ar: "دافئ وقريب من العميل، بدون تكلف", en: "Warm and approachable, without being stiff" },
    example: { ar: "«أهلاً بيك! 😊 إزاي أقدر أساعدك النهارده؟»", en: '"Hi there! 😊 How can I help you today?"' },
  },
  {
    value: "egyptian",
    label: { ar: "لغة دارجة", en: "Colloquial Language" },
    desc: {
      ar: "لغة يومية طبيعية ومريحة، سهلة الفهم بدون رسميات مبالغ فيها ولا لهجة محلية حادة.",
      en: "Natural, everyday conversational language — comfortable and easy to understand, without being slang-heavy or dialect-specific.",
    },
    example: {
      ar: "«أهلاً بيك، تحب نساعدك في إيه النهارده؟»",
      en: '"Hi there — how can we help you today?"',
    },
  },
];

/* ---------- Order-collection field catalog ----------
   The bot collects these fields from customers when taking an order.
   Customer Name + Address are always required and cannot be removed. */
const ORDER_FIELD_LOCKED: { id: string; label: L }[] = [
  { id: "customer_name", label: { ar: "اسم العميل", en: "Customer Name" } },
  { id: "address", label: { ar: "العنوان", en: "Address" } },
];

const ORDER_FIELD_PRESETS: { id: string; label: L }[] = [
  { id: "payment_method", label: { ar: "طريقة الدفع", en: "Payment Method" } },
  { id: "alt_phone", label: { ar: "رقم هاتف بديل", en: "Alternative Phone Number" } },
  { id: "email", label: { ar: "البريد الإلكتروني", en: "Email Address" } },
  { id: "order_details", label: { ar: "تفاصيل الطلب / المنتجات المطلوبة", en: "Order Details / Items" } },
  { id: "quantity", label: { ar: "الكمية", en: "Quantity" } },
  { id: "delivery_time", label: { ar: "موعد التسليم المفضل", en: "Preferred Delivery Time" } },
  { id: "landmark", label: { ar: "علامة مميزة قرب العنوان", en: "Nearby Landmark" } },
  { id: "notes", label: { ar: "ملاحظات إضافية", en: "Additional Notes" } },
];

type OrderFieldRow =
  | { kind: "preset"; id: string }
  | { kind: "custom"; id: string; label: string };

const MAX_IMAGE_MB = 5;
const MAX_KB_MB = 10;
const MAX_EXTRA_IMAGES = 4;

/* ============================================================
   Types
   ============================================================ */
type FaqRow = { question: string; answer: string };
type ItemRow = { name: string; price: string; description: string };

type UploadItem = {
  id: string;
  name: string;
  path: string | null;
  preview: string | null;
  status: "uploading" | "done" | "error";
};

type FormState = {
  plan_id: PlanId | null;
  business_name: string;
  business_type: string;
  description: string;
  website: string;
  social: { facebook: string; instagram: string; tiktok: string };
  languages: ("ar" | "en")[];
  owner_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  same_as_phone: boolean;
  working_hours: string;
  working_days: string[];
  working_open: string;
  working_close: string;
  working_24h: boolean;
  address: string;
  location: string;
  payment_methods: string[];
  delivery_info: string;
  return_policy: string;
  order_fields: OrderFieldRow[];
  order_instructions: string;
  primary_goal: string;
  tone_of_voice: "formal" | "friendly" | "egyptian";
  greeting_message: string;
  assistant_personality: string;
  knowledge_base_raw: string;
  faqs: FaqRow[];
  products: ItemRow[];
  services: ItemRow[];
  payment_method: PaymentChannel | null;
  transaction_ref: string;
};

/* ============================================================
   The single-page form
   ============================================================ */
export default function OnboardingWizard({ initialPlan }: { initialPlan: string | null }) {
  const router = useRouter();
  const { lang, pick } = useLang();
  const topRef = useRef<HTMLDivElement>(null);

  const validInitial = getPlan(initialPlan ?? undefined);

  /* ---------- session id for storage paths ---------- */
  const tempIdRef = useRef<string>("");
  if (!tempIdRef.current) {
    tempIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  /* ---------- state ---------- */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPlanCards, setShowPlanCards] = useState(!validInitial);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<FormState>({
    plan_id: validInitial?.id ?? null,
    business_name: "",
    business_type: "",
    description: "",
    website: "",
    social: { facebook: "", instagram: "", tiktok: "" },
    languages: ["ar"],
    owner_name: "",
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
    same_as_phone: false,
    working_days: WH_DEFAULT_DAYS,
    working_open: "10:00",
    working_close: "22:00",
    working_24h: false,
    working_hours: whSerialize(WH_DEFAULT_DAYS, "10:00", "22:00", false, lang),
    address: "",
    location: "",
    payment_methods: [],
    delivery_info: "",
    return_policy: "",
    order_fields: [
      { kind: "preset", id: "customer_name" },
      { kind: "preset", id: "address" },
    ],
    order_instructions: "",
    primary_goal: "mixed",
    tone_of_voice: "egyptian",
    greeting_message: "",
    assistant_personality: "",
    knowledge_base_raw: "",
    faqs: [],
    products: [],
    services: [],
    payment_method: null,
    transaction_ref: "",
  });

  const [logo, setLogo] = useState<UploadItem | null>(null);
  const [images, setImages] = useState<UploadItem[]>([]);
  const [kbFiles, setKbFiles] = useState<UploadItem[]>([]);
  const [screenshot, setScreenshot] = useState<UploadItem | null>(null);

  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("arqflow_onboarding_form");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm((f) => ({ ...f, ...parsed }));

          const savedAssets = localStorage.getItem("arqflow_onboarding_assets");
          if (savedAssets) {
            const assets = JSON.parse(savedAssets);
            if (assets.logo) setLogo(assets.logo);
            if (assets.images) setImages(assets.images);
            if (assets.kbFiles) setKbFiles(assets.kbFiles);
            if (assets.screenshot) setScreenshot(assets.screenshot);
          }
        } catch (e) {
          console.error("Failed to restore onboarding state", e);
        }
      }

      const importSuccess = localStorage.getItem("arqflow_import_success");
      if (importSuccess) {
        setImportedCount(parseInt(importSuccess, 10));
        localStorage.removeItem("arqflow_import_success");
      }
    }
  }, []);

  // Autosave state to localStorage whenever form or assets change
  useEffect(() => {
    if (typeof window !== "undefined" && form.business_name !== undefined) {
      localStorage.setItem("arqflow_onboarding_form", JSON.stringify(form));
      localStorage.setItem(
        "arqflow_onboarding_assets",
        JSON.stringify({ logo, images, kbFiles, screenshot })
      );
    }
  }, [form, logo, images, kbFiles, screenshot]);

  const handleImportRedirect = (type: "products" | "services") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arqflow_onboarding_form", JSON.stringify(form));
      localStorage.setItem(
        "arqflow_onboarding_assets",
        JSON.stringify({ logo, images, kbFiles, screenshot })
      );
      router.push(`/onboarding/import?type=${type}`);
    }
  };

  const anyUploading =
    logo?.status === "uploading" ||
    screenshot?.status === "uploading" ||
    images.some((i) => i.status === "uploading") ||
    kbFiles.some((f) => f.status === "uploading");

  /* ---------- dictionary ---------- */
  const t = useT({
    ar: {
      heroTitle: "جهّز مساعدك الذكي على واتساب",
      heroSub: "اعمل الحساب في صفحة واحدة سريعة — كل اللي محتاجه، بدون خطوات ولا انتظار.",
      noRefresh: "بياناتك محفوظة مؤقتاً في هذه الصفحة — من فضلك لا تقم بتحديث المتصفح قبل إتمام الطلب.",
      submit: "تأكيد وإرسال الطلب",
      submitting: "جارٍ الإرسال…",
      required: "هذا الحقل مطلوب",
      sectionPlan: "الخطة",
      sectionBiz: "بيانات النشاط",
      sectionContact: "بيانات التواصل",
      sectionOps: "تفاصيل التشغيل",
      sectionAI: "تدريب الذكاء",
      sectionPay: "الدفع",
      // plan
      planTitle: "اختر خطتك",
      planSub: "كل الخطط تشمل رسوم تأسيس لمرة واحدة + رصيد محادثات صالح ٣٠ يوم. تقدر تغيّر الخطة في أي وقت.",
      planSelected: "الخطة المختارة",
      changePlan: "تغيير الخطة",
      choose: "اختيار",
      chosen: "مختارة",
      setup: "رسوم التأسيس",
      monthly: "رصيد الباقة",
      planRequired: "اختر خطة للمتابعة",
      popular: "الأكثر طلباً",
      // business
      bizTitle: "عرّفنا على نشاطك",
      bizSub: "المساعد الذكي هيتكلم باسم نشاطك — كل تفصيلة بتفرق.",
      businessName: "اسم النشاط",
      businessNamePh: "مثال: مطعم الأصيل",
      businessType: "نوع النشاط",
      selectType: "اختر نوع النشاط…",
      descriptionL: "وصف مختصر للنشاط",
      descriptionPh: "إيه اللي بيميز نشاطك؟ بتقدم إيه ولمين؟",
      websiteL: "الموقع الإلكتروني (اختياري)",
      socialL: "حسابات السوشيال ميديا (اختياري)",
      languagesL: "لغات الرد",
      langAr: "العربية",
      langEn: "English",
      langRequired: "اختر لغة واحدة على الأقل",
      logoL: "شعار النشاط (اختياري)",
      logoHint: "صورة بحد أقصى 5 ميجابايت",
      imagesL: "صور إضافية (حتى 4 صور)",
      imagesHint: "منيو، المكان من الداخل، منتجات… أي صور تساعد المساعد يعرف نشاطك",
      uploadCta: "اضغط لرفع صورة",
      uploadFileCta: "اضغط لرفع ملف",
      fileTooBig: (mb: number) => `حجم الملف أكبر من ${mb} ميجابايت`,
      notImage: "الملف لازم يكون صورة",
      uploadFailed: "فشل رفع الملف — حاول مرة أخرى",
      stillUploading: "في ملفات لسه بترفع — استنى ثواني",
      // contact
      contactTitle: "بيانات التواصل",
      contactSub: "هنستخدم البيانات دي للتفعيل وإرسال بيانات الدخول.",
      ownerName: "اسم المسؤول",
      ownerNamePh: "الاسم بالكامل",
      email: "البريد الإلكتروني",
      emailInvalid: "أدخل بريد إلكتروني صحيح",
      phone: "رقم الموبايل",
      phoneHint: "بالصيغة المصرية: 01XXXXXXXXX",
      phoneInvalid: "أدخل رقم موبايل مصري صحيح (01XXXXXXXXX)",
      whatsapp: "رقم الواتساب الخاص بالبوت",
      whatsappHint: "الرقم اللي المساعد الذكي هيرد منه على عملائك",
      sameAsPhone: "نفس رقم الموبايل",
      // operations
      opsTitle: "تفاصيل التشغيل",
      opsSub: "عشان المساعد يجاوب صح على أسئلة زي «فاتحين لحد كام؟» و«بتوصلوا فين؟»",
      workingHours: "مواعيد العمل",
      whDays: "أيام العمل",
      whFrom: "من",
      whTo: "إلى",
      wh24: "مفتوح ٢٤ ساعة",
      whPickDays: "اختر يوم واحد على الأقل",
      addressL: "العنوان (اختياري)",
      addressPh: "مثال: 12 شارع التحرير، الدقي، الجيزة",
      locationL: "رابط جوجل ماب (اختياري)",
      bizPayments: "طرق الدفع المتاحة عند نشاطك",
      deliveryL: "معلومات التوصيل (اختياري)",
      deliveryPh: "مناطق التوصيل، الرسوم، مدة التوصيل…",
      returnL: "سياسة الاسترجاع (اختياري)",
      returnPh: "شروط الاسترجاع أو الاستبدال إن وجدت",
      // order collection
      orderCollectL: "البيانات اللي المساعد بياخدها مع الطلب",
      orderCollectSub: "اختار البيانات اللي المساعد لازم يجمعها من العميل قبل ما يتأكد الطلب. الاسم والعنوان مطلوبين دايماً.",
      orderCollectRequired: "إلزامي",
      orderCollectAdd: "إضافة بيانات أخرى",
      orderCollectCustom: "إضافة حقل خاص",
      orderCollectCustomPh: "اكتب اسم البيان (مثال: «رقم البطاقة الصحية»)",
      orderCollectCustomSave: "إضافة",
      orderCollectCustomCancel: "إلغاء",
      orderCollectAllAdded: "تم اختيار كل البيانات المتاحة — تقدر تضيف حقل خاص بدل كده.",
      // AI
      aiTitle: "درّب مساعدك الذكي",
      aiSub: "كل معلومة هنا بتخلي ردود المساعد أدق وأقرب لأسلوبك.",
      goalL: "الهدف الأساسي من المساعد",
      toneL: "أسلوب الكلام",
      greetingL: "رسالة الترحيب (اختياري)",
      greetingPh: "مثال: أهلاً بيك في {biz}! 👋 أنا خدمة العملاء — أقدر أساعدك في إيه النهارده؟",
      personalityL: "شخصية المساعد (اختياري)",
      personalityPh: "مثال: اسمه «سند»، مرح وسريع، بيحب يقترح الأطباق الأكثر مبيعاً",
      kbL: "قاعدة المعرفة",
      kbPh: "الصق هنا كل حاجة المساعد المفروض يعرفها: المنيو بالأسعار، الخدمات، السياسات، العروض الحالية، أسئلة العملاء المتكررة…",
      kbFilesL: "ملفات إضافية (PDF / Word / نصوص)",
      faqsL: "أسئلة شائعة وإجاباتها",
      faqQ: "السؤال",
      faqQPh: "مثال: هل عندكم توصيل؟",
      faqA: "الإجابة",
      faqAPh: "مثال: نعم، التوصيل متاح داخل القاهرة والجيزة خلال ٦٠ دقيقة",
      addFaq: "إضافة سؤال",
      productsL: "المنتجات",
      servicesL: "الخدمات",
      itemName: "الاسم",
      itemPrice: "السعر (ج.م)",
      itemDesc: "الوصف",
      addProduct: "إضافة منتج",
      addService: "إضافة خدمة",
      optionalSection: "اختياري لكن موصى به",
      // payment
      payTitle: "إتمام الدفع",
      paySub: "حوّل المبلغ على أي وسيلة من المتاحة، وبعدها سجّل رقم العملية وارفع صورة التحويل.",
      amountDue: "المبلغ المطلوب",
      payHow: "اختر وسيلة الدفع اللي حوّلت بيها",
      accountNumber: "رقم المحفظة / الحساب",
      copy: "نسخ",
      copiedMsg: "تم النسخ ✓",
      payInstructions: [
        "حوّل المبلغ كاملاً على الرقم الظاهر",
        "هتلاقي رقم عملية مكوّن من 12 رقم في رسالة التأكيد",
        "سجّل الرقم هنا وارفع صورة (سكرين شوت) للتحويل",
      ],
      txRefL: "رقم العملية (12 رقم)",
      txRefPh: "مثال: 123456789012",
      txRefInvalid: "رقم العملية لازم يكون 12 رقم بالظبط",
      txRefDigits: (n: number) => `${n} / 12 رقم`,
      screenshotL: "صورة إيصال التحويل",
      screenshotHint: "سكرين شوت من تطبيق المحفظة أو البنك — مطلوبة للمراجعة",
      screenshotRequired: "صورة التحويل مطلوبة",
      methodRequired: "اختر وسيلة الدفع",
      dupRef: "رقم العملية ده تم استخدامه قبل كده — راجع الرقم أو تواصل مع الدعم",
      validationErr: "في بيانات غير صحيحة — راجع الحقول أعلى الصفحة",
      genericErr: "حصل خطأ غير متوقع — حاول مرة أخرى أو تواصل مع الدعم",
      rateErr: "محاولات كتير متتالية — استنى دقيقة وحاول تاني",
      secureNote: "يتم مراجعة كل عملية دفع يدوياً خلال ساعات — هتوصلك بيانات الدخول على الواتساب والإيميل.",
      remove: "حذف",
      help: "كيف؟",
      helpClose: "إغلاق",
      // URL helps
      helpWebsite: {
        title: "إزاي تجيب رابط موقعك؟",
        body: "افتح موقعك في المتصفح، وانسخ العنوان كامل من شريط العنوان فوق (يبدأ بـ https://). مثال: https://example.com",
      },
      helpFacebook: {
        title: "إزاي تجيب رابط صفحة فيسبوك؟",
        body: "افتح صفحتك على فيسبوك من الكمبيوتر أو الموبايل، وانسخ الرابط من شريط العنوان. لو على الموبايل، اضغط على القائمة (•••) في الصفحة ثم «نسخ الرابط». مثال: https://facebook.com/yourpage",
      },
      helpInstagram: {
        title: "إزاي تجيب رابط حسابك على إنستجرام؟",
        body: "افتح بروفايلك على إنستجرام، اضغط على القائمة (•••) فوق الاسم ثم «نسخ رابط الملف الشخصي». أو من الكمبيوتر، انسخ الرابط من شريط العنوان. مثال: https://instagram.com/yourhandle",
      },
      helpTikTok: {
        title: "إزاي تجيب رابط حسابك على تيك توك؟",
        body: "افتح بروفايلك على تيك توك، اضغط على «مشاركة» (السهم) ثم «نسخ الرابط». مثال: https://tiktok.com/@yourhandle",
      },
      helpMaps: {
        title: "إزاي تجيب رابط موقعك على جوجل ماب؟",
        body: "افتح Google Maps، ابحث عن اسم نشاطك أو حدد الموقع على الخريطة، اضغط على «مشاركة Share» ثم «نسخ الرابط Copy link». مثال: https://maps.app.goo.gl/…",
      },
    },
    en: {
      heroTitle: "Set up your AI WhatsApp assistant",
      heroSub: "Everything you need on a single page — no steps, no waiting.",
      noRefresh: "Your progress lives on this page — please don't refresh the browser before submitting.",
      submit: "Confirm & Submit Order",
      submitting: "Submitting…",
      required: "This field is required",
      sectionPlan: "Plan",
      sectionBiz: "Business",
      sectionContact: "Contact",
      sectionOps: "Operations",
      sectionAI: "AI Training",
      sectionPay: "Payment",
      planTitle: "Choose your plan",
      planSub: "Every plan includes a one-time setup fee + a 30-day conversation balance. You can change plans anytime.",
      planSelected: "Selected plan",
      changePlan: "Change plan",
      choose: "Select",
      chosen: "Selected",
      setup: "Setup fee",
      monthly: "package balance",
      planRequired: "Pick a plan to continue",
      popular: "Most popular",
      bizTitle: "Tell us about your business",
      bizSub: "Your AI assistant speaks on behalf of your brand — every detail counts.",
      businessName: "Business name",
      businessNamePh: "e.g. Al Aseel Restaurant",
      businessType: "Business type",
      selectType: "Select business type…",
      descriptionL: "Short description",
      descriptionPh: "What makes your business special? What do you offer, and to whom?",
      websiteL: "Website (optional)",
      socialL: "Social media (optional)",
      languagesL: "Reply languages",
      langAr: "Arabic",
      langEn: "English",
      langRequired: "Pick at least one language",
      logoL: "Business logo (optional)",
      logoHint: "Image up to 5 MB",
      imagesL: "Extra images (up to 4)",
      imagesHint: "Menu, interior, products… anything that helps the assistant know your business",
      uploadCta: "Click to upload an image",
      uploadFileCta: "Click to upload a file",
      fileTooBig: (mb: number) => `File is larger than ${mb} MB`,
      notImage: "File must be an image",
      uploadFailed: "Upload failed — please try again",
      stillUploading: "Files are still uploading — give it a few seconds",
      contactTitle: "Contact details",
      contactSub: "We'll use these to activate your account and send your credentials.",
      ownerName: "Owner / manager name",
      ownerNamePh: "Full name",
      email: "Email address",
      emailInvalid: "Enter a valid email address",
      phone: "Mobile number",
      phoneHint: "Egyptian format: 01XXXXXXXXX",
      phoneInvalid: "Enter a valid Egyptian mobile number (01XXXXXXXXX)",
      whatsapp: "WhatsApp number for the bot",
      whatsappHint: "The number your AI assistant will reply from",
      sameAsPhone: "Same as mobile number",
      opsTitle: "Operations",
      opsSub: 'So the assistant answers questions like "until when are you open?" and "do you deliver to…?"',
      workingHours: "Working hours",
      whDays: "Working days",
      whFrom: "From",
      whTo: "To",
      wh24: "Open 24 hours",
      whPickDays: "Select at least one day",
      addressL: "Address (optional)",
      addressPh: "e.g. 12 Tahrir St., Dokki, Giza",
      locationL: "Google Maps link (optional)",
      bizPayments: "Payment methods your business accepts",
      deliveryL: "Delivery info (optional)",
      deliveryPh: "Delivery zones, fees, expected time…",
      returnL: "Return policy (optional)",
      returnPh: "Return / exchange conditions, if any",
      orderCollectL: "Information the assistant collects with each order",
      orderCollectSub: "Pick what the assistant should gather from the customer before confirming an order. Name and address are always required.",
      orderCollectRequired: "Required",
      orderCollectAdd: "Add another field",
      orderCollectCustom: "Add custom field",
      orderCollectCustomPh: "Type the field name (e.g. \"Health card number\")",
      orderCollectCustomSave: "Add",
      orderCollectCustomCancel: "Cancel",
      orderCollectAllAdded: "All preset fields are already selected — you can still add a custom one.",
      aiTitle: "Train your AI assistant",
      aiSub: "Everything you add here makes replies sharper and closer to your style.",
      goalL: "Primary goal of the assistant",
      toneL: "Tone of voice",
      greetingL: "Greeting message (optional)",
      greetingPh: "e.g. Welcome to {biz}! 👋 I'm the AI assistant — how can I help you today?",
      personalityL: "Assistant personality (optional)",
      personalityPh: 'e.g. Named "Sanad", cheerful and quick, loves suggesting best-sellers',
      kbL: "Knowledge base",
      kbPh: "Paste everything your assistant should know: menu with prices, services, policies, current offers, common customer questions…",
      kbFilesL: "Extra files (PDF / Word / text)",
      faqsL: "FAQs & answers",
      faqQ: "Question",
      faqQPh: "e.g. Do you deliver?",
      faqA: "Answer",
      faqAPh: "e.g. Yes — delivery within Cairo & Giza in 60 minutes",
      addFaq: "Add FAQ",
      productsL: "Products",
      servicesL: "Services",
      itemName: "Name",
      itemPrice: "Price (EGP)",
      itemDesc: "Description",
      addProduct: "Add product",
      addService: "Add service",
      optionalSection: "Optional but recommended",
      payTitle: "Complete your payment",
      paySub: "Transfer the amount via any method below, then enter the transaction reference and upload the receipt.",
      amountDue: "Amount due",
      payHow: "Pick the method you transferred with",
      accountNumber: "Wallet / account number",
      copy: "Copy",
      copiedMsg: "Copied ✓",
      payInstructions: [
        "Transfer the full amount to the number shown",
        "You'll find a 12-digit transaction reference in the confirmation SMS",
        "Enter the reference here and upload a screenshot of the transfer",
      ],
      txRefL: "Transaction reference (12 digits)",
      txRefPh: "e.g. 123456789012",
      txRefInvalid: "Transaction reference must be exactly 12 digits",
      txRefDigits: (n: number) => `${n} / 12 digits`,
      screenshotL: "Transfer screenshot",
      screenshotHint: "Screenshot from your wallet or bank app — required for review",
      screenshotRequired: "Transfer screenshot is required",
      methodRequired: "Pick a payment method",
      dupRef: "This transaction reference was already submitted — double-check it or contact support",
      validationErr: "Some details are invalid — please review the fields above",
      genericErr: "Something went wrong — try again or contact support",
      rateErr: "Too many attempts — wait a minute and try again",
      secureNote: "Every payment is reviewed manually within hours — your credentials arrive via WhatsApp & email.",
      remove: "Remove",
      help: "How?",
      helpClose: "Close",
      helpWebsite: {
        title: "How to get your website link",
        body: "Open your website in a browser, then copy the full address from the URL bar at the top (starts with https://). Example: https://example.com",
      },
      helpFacebook: {
        title: "How to get your Facebook page link",
        body: "Open your page on Facebook on desktop or mobile and copy the URL from the address bar. On the mobile app: open your page, tap the (•••) menu, and choose \"Copy link\". Example: https://facebook.com/yourpage",
      },
      helpInstagram: {
        title: "How to get your Instagram profile link",
        body: "Open your profile in the Instagram app, tap (•••) next to your name and choose \"Copy profile URL\". Or on desktop, copy the URL from the address bar. Example: https://instagram.com/yourhandle",
      },
      helpTikTok: {
        title: "How to get your TikTok profile link",
        body: "Open your TikTok profile, tap the share icon (arrow), and choose \"Copy link\". Example: https://tiktok.com/@yourhandle",
      },
      helpMaps: {
        title: "How to get your Google Maps location link",
        body: "Open Google Maps, search for your business name or drop a pin on your exact spot, tap \"Share\", then \"Copy link\". Example: https://maps.app.goo.gl/…",
      },
    },
  });

  const plan = form.plan_id ? getPlan(form.plan_id) : undefined;

  /* ---------- helpers ---------- */
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const { [key as string]: _gone, ...rest } = e;
      return rest;
    });
  };

  const clearError = (key: string) =>
    setErrors((e) => {
      if (!(key in e)) return e;
      const { [key]: _gone, ...rest } = e;
      return rest;
    });

  // Working-hours picker: merge a structured change AND recompute the
  // human-readable working_hours text in the same update (kept in sync so the
  // rest of the pipeline — validation, summary, submit, webhook — is untouched).
  const updateHours = (
    patch: Partial<Pick<FormState, "working_days" | "working_open" | "working_close" | "working_24h">>
  ) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      next.working_hours = whSerialize(
        next.working_days,
        next.working_open,
        next.working_close,
        next.working_24h,
        lang
      );
      return next;
    });
    clearError("working_hours");
  };

  /* ---------- order-collection helpers ---------- */
  const orderFieldLabel = (row: OrderFieldRow): string => {
    if (row.kind === "custom") return row.label;
    const locked = ORDER_FIELD_LOCKED.find((x) => x.id === row.id);
    if (locked) return pick(locked.label);
    const preset = ORDER_FIELD_PRESETS.find((x) => x.id === row.id);
    return preset ? pick(preset.label) : row.id;
  };

  const isLockedOrderField = (row: OrderFieldRow): boolean =>
    row.kind === "preset" && ORDER_FIELD_LOCKED.some((x) => x.id === row.id);

  const serializeOrderFields = (rows: OrderFieldRow[]): string => {
    const sep = lang === "ar" ? "، " : ", ";
    return rows.map(orderFieldLabel).filter(Boolean).join(sep);
  };

  // Keep order_instructions text in sync with the structured list so the
  // backend payload stays identical to the previous free-text version.
  useEffect(() => {
    setForm((f) => ({ ...f, order_instructions: serializeOrderFields(f.order_fields) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.order_fields, lang]);

  const validateAll = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.plan_id) e.plan_id = t.planRequired;
    if (form.business_name.trim().length < 2) e.business_name = t.required;
    if (!form.business_type) e.business_type = t.required;
    if (form.languages.length === 0) e.languages = t.langRequired;
    if (form.owner_name.trim().length < 2) e.owner_name = t.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) e.contact_email = t.emailInvalid;
    if (!normalizeEgyptPhone(form.contact_phone)) e.contact_phone = t.phoneInvalid;
    if (!normalizeEgyptPhone(form.whatsapp_number)) e.whatsapp_number = t.phoneInvalid;
    if (form.working_days.length === 0) e.working_hours = t.whPickDays;
    else if (!form.working_24h && (!form.working_open || !form.working_close)) e.working_hours = t.required;
    if (!form.payment_method) e.payment_method = t.methodRequired;
    if (!/^\d{12}$/.test(form.transaction_ref)) e.transaction_ref = t.txRefInvalid;
    if (!screenshot || screenshot.status !== "done" || !screenshot.path) e.screenshot = t.screenshotRequired;
    return e;
  };

  /* ---------- storage uploads ---------- */
  async function uploadToBucket(bucket: string, file: File): Promise<string> {
    const supabase = createClient();
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${tempIdRef.current}/${Date.now()}_${sanitized}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return path;
  }

  function makeItem(file: File, withPreview: boolean): UploadItem {
    return {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: file.name,
      path: null,
      preview: withPreview ? URL.createObjectURL(file) : null,
      status: "uploading",
    };
  }

  const validateFile = (file: File, image: boolean, errKey: string): boolean => {
    const maxMb = image ? MAX_IMAGE_MB : MAX_KB_MB;
    if (image && !file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, [errKey]: t.notImage }));
      return false;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setErrors((e) => ({ ...e, [errKey]: t.fileTooBig(maxMb) }));
      return false;
    }
    clearError(errKey);
    return true;
  };

  const handleSingleUpload = async (
    file: File,
    bucket: string,
    errKey: string,
    setter: (u: UploadItem | null) => void
  ) => {
    if (!validateFile(file, true, errKey)) return;
    const item = makeItem(file, true);
    setter(item);
    try {
      const path = await uploadToBucket(bucket, file);
      setter({ ...item, path, status: "done" });
    } catch {
      setter(null);
      setErrors((e) => ({ ...e, [errKey]: t.uploadFailed }));
    }
  };

  const handleImagesUpload = async (files: FileList) => {
    const room = MAX_EXTRA_IMAGES - images.length;
    const list = Array.from(files).slice(0, room);
    for (const file of list) {
      if (!validateFile(file, true, "images")) continue;
      const item = makeItem(file, true);
      setImages((prev) => [...prev, item]);
      try {
        const path = await uploadToBucket("business-assets", file);
        setImages((prev) => prev.map((i) => (i.id === item.id ? { ...i, path, status: "done" } : i)));
      } catch {
        setImages((prev) => prev.filter((i) => i.id !== item.id));
        setErrors((e) => ({ ...e, images: t.uploadFailed }));
      }
    }
  };

  const handleKbUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!validateFile(file, false, "kb_files")) continue;
      const item = makeItem(file, false);
      setKbFiles((prev) => [...prev, item]);
      try {
        const path = await uploadToBucket("kb-files", file);
        setKbFiles((prev) => prev.map((i) => (i.id === item.id ? { ...i, path, status: "done" } : i)));
      } catch {
        setKbFiles((prev) => prev.filter((i) => i.id !== item.id));
        setErrors((e) => ({ ...e, kb_files: t.uploadFailed }));
      }
    }
  };

  /* ---------- submit ---------- */
  const scrollToFirstError = (errKeys: string[]) => {
    if (typeof document === "undefined") return;
    for (const k of errKeys) {
      const el = document.querySelector<HTMLElement>(`[data-err="${k}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    const e = validateAll();
    if (Object.keys(e).length) {
      setErrors(e);
      scrollToFirstError(Object.keys(e));
      return;
    }
    if (anyUploading || submitting) {
      setErrors((prev) => ({ ...prev, _uploading: t.stillUploading }));
      return;
    }

    setSubmitting(true);
    setServerError(null);

    const trim = (s: string) => s.trim();
    const orderInstructions = serializeOrderFields(form.order_fields);
    const payload = {
      plan_id: form.plan_id,
      business_name: trim(form.business_name),
      business_type: form.business_type,
      description: trim(form.description),
      website: trim(form.website),
      social_media: Object.fromEntries(
        Object.entries(form.social)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v)
      ),
      languages: form.languages,
      owner_name: trim(form.owner_name),
      contact_email: trim(form.contact_email),
      contact_phone: normalizeEgyptPhone(form.contact_phone),
      whatsapp_number: normalizeEgyptPhone(form.whatsapp_number),
      working_hours: whSerialize(
        form.working_days,
        form.working_open,
        form.working_close,
        form.working_24h,
        lang
      ),
      working_hours_struct: {
        always: form.working_24h,
        open: form.working_24h ? "" : form.working_open,
        close: form.working_24h ? "" : form.working_close,
        days: form.working_days,
      },
      address: trim(form.address),
      location: trim(form.location),
      delivery_info: trim(form.delivery_info),
      return_policy: trim(form.return_policy),
      order_instructions: orderInstructions,
      payment_methods: form.payment_methods,
      primary_goal: form.primary_goal,
      tone_of_voice: form.tone_of_voice,
      greeting_message: trim(form.greeting_message),
      assistant_personality: trim(form.assistant_personality),
      knowledge_base_raw: trim(form.knowledge_base_raw),
      faqs: form.faqs
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question && f.answer),
      products: form.products
        .map((p) => ({ name: p.name.trim(), price: p.price.trim(), description: p.description.trim() }))
        .filter((p) => p.name),
      services: form.services
        .map((p) => ({ name: p.name.trim(), price: p.price.trim(), description: p.description.trim() }))
        .filter((p) => p.name),
      logo_path: logo?.path ?? null,
      image_paths: images.filter((i) => i.path).map((i) => i.path as string),
      kb_file_paths: kbFiles.filter((f) => f.path).map((f) => f.path as string),
      payment_method: form.payment_method,
      transaction_ref: form.transaction_ref,
      screenshot_path: screenshot?.path,
    };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.order_id) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("arqflow_onboarding_form");
          localStorage.removeItem("arqflow_onboarding_assets");
          localStorage.removeItem("arqflow_import_success");
        }
        router.push(`/onboarding/success?order=${encodeURIComponent(json.order_id)}`);
        return;
      }
      if (res.status === 409) setServerError(t.dupRef);
      else if (res.status === 422) setServerError(t.validationErr);
      else if (res.status === 429) setServerError(t.rateErr);
      else setServerError(t.genericErr);
    } catch {
      setServerError(t.genericErr);
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccount = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const inputCls = "input-base";
  const ltrInput = { dir: "ltr" as const, style: { textAlign: "start" as const, direction: "ltr" as const } };

  // Payment channels visible in the form. Vodafone Cash is intentionally hidden;
  // only InstaPay and WE Pay are offered to the customer here.
  const visiblePaymentChannels = (Object.keys(PAYMENT_ACCOUNTS) as PaymentChannel[]).filter(
    (ch) => ch !== "vodafone_cash"
  );

  /* ============================================================
     Render — single page (all sections shown at once)
     ============================================================ */
  return (
    <main ref={topRef} className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 scroll-mt-20">
      {importedCount !== null && (
        <div className="mb-6 rounded-xl border border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.08)] px-4 py-3 flex items-center justify-between gap-3 text-sm text-success animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <span>
              {lang === "ar"
                ? `تم استيراد ${importedCount} من العناصر بنجاح!`
                : `Successfully imported ${importedCount} items!`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setImportedCount(null)}
            className="btn-ghost !p-1 text-success hover:bg-[rgba(74,222,128,0.15)] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* hero */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t.heroTitle}</h1>
        <p className="text-muted text-sm mt-1.5 leading-relaxed">{t.heroSub}</p>
      </div>

      {/* don't-refresh notice */}
      <p className="text-xs text-muted mb-6 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-warning" />
        {t.noRefresh}
      </p>

      <div className="space-y-8">
        {/* ================= PLAN ================= */}
        <section data-err="plan_id" className="space-y-5">
          <SectionHeader icon={CreditCard} eyebrow={t.sectionPlan} title={t.planTitle} sub={t.planSub} />

          {!showPlanCards && plan ? (
            <div className="card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-[rgba(27,27,30,0.35)]">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white shrink-0">
                  <CreditCard className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-xs text-muted font-semibold">{t.planSelected}</p>
                  <p className="text-xl font-extrabold">{pick(plan.name)}</p>
                  <p className="text-sm text-muted">
                    {t.setup} {formatEGP(plan.setupFee, lang)} + {formatEGP(plan.monthlyFee, lang)} {t.monthly}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowPlanCards(true)} className="btn-outline !py-2 text-sm">
                {t.changePlan}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {PLANS.map((p) => {
                const selected = form.plan_id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      set("plan_id", p.id);
                      setShowPlanCards(false);
                    }}
                    className={cn(
                      "card card-hover p-5 text-start relative flex flex-col gap-3 transition-all",
                      selected && "border-accent shadow-[0_0_0_1px_var(--accent),0_12px_40px_rgba(27,27,30,0.25)]"
                    )}
                  >
                    {p.highlighted && (
                      <span className="badge badge-accent absolute -top-2.5 start-4">{t.popular}</span>
                    )}
                    <p className="font-extrabold text-lg">{pick(p.name)}</p>
                    <p className="text-xs text-muted leading-relaxed min-h-10">{pick(p.tagline)}</p>
                    <div>
                      <p className="text-2xl font-extrabold gradient-text" dir="ltr">
                        {formatEGP(p.monthlyFee, lang)}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {t.monthly} · {t.setup} {formatEGP(p.setupFee, lang)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold border",
                        selected
                          ? "bg-gradient-to-r from-brand-teal to-brand-sky text-white border-transparent"
                          : "border-strong text-muted"
                      )}
                    >
                      {selected && <Check className="w-4 h-4" />}
                      {selected ? t.chosen : t.choose}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.plan_id && <ErrorLine msg={errors.plan_id} />}
        </section>

        {/* ================= BUSINESS ================= */}
        <section className="space-y-5">
          <SectionHeader icon={Building2} eyebrow={t.sectionBiz} title={t.bizTitle} sub={t.bizSub} />
          <div className="card p-5 sm:p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div data-err="business_name">
                <Field label={t.businessName} required error={errors.business_name}>
                  <input
                    className={inputCls}
                    value={form.business_name}
                    onChange={(e) => set("business_name", e.target.value)}
                    placeholder={t.businessNamePh}
                    maxLength={200}
                  />
                </Field>
              </div>
              <div data-err="business_type">
                <Field label={t.businessType} required error={errors.business_type}>
                  <select
                    className={inputCls}
                    value={form.business_type}
                    onChange={(e) => set("business_type", e.target.value)}
                  >
                    <option value="">{t.selectType}</option>
                    {BUSINESS_TYPES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {pick(b.label)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <Field label={t.descriptionL}>
              <textarea
                className={cn(inputCls, "min-h-24 resize-y")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={t.descriptionPh}
                maxLength={2000}
              />
            </Field>

            <Field
              label={t.websiteL}
              help={<HelpTip label={t.help} title={t.helpWebsite.title} body={t.helpWebsite.body} />}
            >
              <input
                className={inputCls}
                {...ltrInput}
                type="url"
                inputMode="url"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
                maxLength={300}
              />
            </Field>

            {/* social */}
            <div>
              <span className="block text-sm font-semibold mb-1.5">{t.socialL}</span>
              <div className="grid sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      key: "facebook",
                      icon: Facebook,
                      ph: "facebook.com/…",
                      help: { title: t.helpFacebook.title, body: t.helpFacebook.body },
                    },
                    {
                      key: "instagram",
                      icon: Instagram,
                      ph: "instagram.com/…",
                      help: { title: t.helpInstagram.title, body: t.helpInstagram.body },
                    },
                    {
                      key: "tiktok",
                      icon: Music2,
                      ph: "tiktok.com/@…",
                      help: { title: t.helpTikTok.title, body: t.helpTikTok.body },
                    },
                  ] as const
                ).map(({ key, icon: Icon, ph, help }) => (
                  <div key={key} className="relative">
                    <Icon className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      className={cn(inputCls, "!ps-10 !pe-10")}
                      {...ltrInput}
                      aria-label={key}
                      value={form.social[key]}
                      onChange={(e) => set("social", { ...form.social, [key]: e.target.value })}
                      placeholder={ph}
                      maxLength={300}
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-2.5">
                      <HelpTip label={t.help} title={help.title} body={help.body} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* languages */}
            <div data-err="languages">
              <span className="block text-sm font-semibold mb-1.5">
                {t.languagesL}
                <span className="text-danger ms-1">*</span>
              </span>
              <div className="flex gap-3">
                {(["ar", "en"] as const).map((l) => {
                  const on = form.languages.includes(l);
                  return (
                    <label
                      key={l}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-2.5 cursor-pointer transition-all text-sm font-semibold select-none",
                        on
                          ? "border-accent bg-[rgba(27,27,30,0.12)] text-app"
                          : "border-app text-muted hover:border-strong"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() =>
                          set(
                            "languages",
                            on ? form.languages.filter((x) => x !== l) : [...form.languages, l]
                          )
                        }
                      />
                      <span
                        className={cn(
                          "w-4.5 h-4.5 rounded-md border flex items-center justify-center",
                          on ? "bg-accent border-accent text-brand-deep" : "border-strong"
                        )}
                      >
                        {on && <Check className="w-3 h-3" />}
                      </span>
                      {l === "ar" ? t.langAr : t.langEn}
                    </label>
                  );
                })}
              </div>
              {errors.languages && <ErrorLine msg={errors.languages} />}
            </div>

            {/* logo */}
            <div>
              <span className="block text-sm font-semibold mb-1.5">{t.logoL}</span>
              {logo ? (
                <UploadPreview item={logo} onRemove={() => setLogo(null)} removeLabel={t.remove} />
              ) : (
                <UploadDrop
                  cta={t.uploadCta}
                  hint={t.logoHint}
                  accept="image/*"
                  onFiles={(files) =>
                    files[0] && handleSingleUpload(files[0], "business-assets", "logo", setLogo)
                  }
                />
              )}
              {errors.logo && <ErrorLine msg={errors.logo} />}
            </div>

            {/* extra images */}
            <div>
              <span className="block text-sm font-semibold mb-1.5">{t.imagesL}</span>
              <p className="text-xs text-muted mb-2">{t.imagesHint}</p>
              <div className="flex flex-wrap gap-3">
                {images.map((img) => (
                  <UploadPreview
                    key={img.id}
                    item={img}
                    onRemove={() => setImages((prev) => prev.filter((i) => i.id !== img.id))}
                    removeLabel={t.remove}
                    compact
                  />
                ))}
                {images.length < MAX_EXTRA_IMAGES && (
                  <UploadDrop
                    cta={t.uploadCta}
                    hint={`${images.length}/${MAX_EXTRA_IMAGES}`}
                    accept="image/*"
                    multiple
                    compact
                    onFiles={(files) => handleImagesUpload(files)}
                  />
                )}
              </div>
              {errors.images && <ErrorLine msg={errors.images} />}
            </div>
          </div>
        </section>

        {/* ================= CONTACT ================= */}
        <section className="space-y-5">
          <SectionHeader icon={User} eyebrow={t.sectionContact} title={t.contactTitle} sub={t.contactSub} />
          <div className="card p-5 sm:p-6 space-y-5">
            <div data-err="owner_name">
              <Field label={t.ownerName} required error={errors.owner_name}>
                <input
                  className={inputCls}
                  value={form.owner_name}
                  onChange={(e) => set("owner_name", e.target.value)}
                  placeholder={t.ownerNamePh}
                  autoComplete="name"
                  maxLength={150}
                />
              </Field>
            </div>

            <div data-err="contact_email">
              <Field label={t.email} required error={errors.contact_email}>
                <input
                  className={inputCls}
                  {...ltrInput}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                  placeholder="you@example.com"
                  maxLength={200}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div data-err="contact_phone">
                <Field label={t.phone} required hint={t.phoneHint} error={errors.contact_phone}>
                  <input
                    className={inputCls}
                    {...ltrInput}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.contact_phone}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        contact_phone: v,
                        whatsapp_number: f.same_as_phone ? v : f.whatsapp_number,
                      }));
                      clearError("contact_phone");
                      if (form.same_as_phone) clearError("whatsapp_number");
                    }}
                    placeholder="01XXXXXXXXX"
                    maxLength={15}
                  />
                </Field>
              </div>

              <div data-err="whatsapp_number">
                <Field label={t.whatsapp} required hint={t.whatsappHint} error={errors.whatsapp_number}>
                  <input
                    className={inputCls}
                    {...ltrInput}
                    type="tel"
                    inputMode="tel"
                    value={form.whatsapp_number}
                    disabled={form.same_as_phone}
                    onChange={(e) => set("whatsapp_number", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={15}
                  />
                </Field>
                <label className="mt-2 flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.same_as_phone}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setForm((f) => ({
                        ...f,
                        same_as_phone: on,
                        whatsapp_number: on ? f.contact_phone : f.whatsapp_number,
                      }));
                      if (on) clearError("whatsapp_number");
                    }}
                  />
                  <span
                    className={cn(
                      "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0",
                      form.same_as_phone ? "bg-accent border-accent text-brand-deep" : "border-strong"
                    )}
                  >
                    {form.same_as_phone && <Check className="w-3 h-3" />}
                  </span>
                  {t.sameAsPhone}
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ================= OPERATIONS ================= */}
        <section className="space-y-5">
          <SectionHeader icon={Clock} eyebrow={t.sectionOps} title={t.opsTitle} sub={t.opsSub} />
          <div className="card p-5 sm:p-6 space-y-5">
            <div data-err="working_hours">
              <Field label={t.workingHours} required error={errors.working_hours}>
                <div className="space-y-4">
                  {/* working days */}
                  <div>
                    <span className="block text-xs font-semibold mb-2 text-muted">{t.whDays}</span>
                    <div className="flex flex-wrap gap-2">
                      {WH_DAYS.map((d) => {
                        const on = form.working_days.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              updateHours({
                                working_days: on
                                  ? form.working_days.filter((x) => x !== d.value)
                                  : [...form.working_days, d.value],
                              })
                            }
                            className={cn(
                              "rounded-full px-4 py-2 text-sm font-semibold border transition-all inline-flex items-center gap-1.5",
                              on
                                ? "border-accent bg-[rgba(27,27,30,0.15)] text-app"
                                : "border-app text-muted hover:border-strong"
                            )}
                          >
                            {on && <Check className="w-3.5 h-3.5 text-accent" />}
                            {pick(d.label)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 24-hour toggle */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm font-semibold">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.working_24h}
                      onChange={(e) => updateHours({ working_24h: e.target.checked })}
                    />
                    <span
                      className={cn(
                        "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0",
                        form.working_24h ? "bg-accent border-accent text-brand-deep" : "border-strong"
                      )}
                    >
                      {form.working_24h && <Check className="w-3 h-3" />}
                    </span>
                    {t.wh24}
                  </label>

                  {/* open / close time */}
                  {!form.working_24h && (
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <label className="block">
                        <span className="block text-xs font-semibold mb-1 text-muted">{t.whFrom}</span>
                        <input
                          type="time"
                          className={inputCls}
                          {...ltrInput}
                          value={form.working_open}
                          onChange={(e) => updateHours({ working_open: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-semibold mb-1 text-muted">{t.whTo}</span>
                        <input
                          type="time"
                          className={inputCls}
                          {...ltrInput}
                          value={form.working_close}
                          onChange={(e) => updateHours({ working_close: e.target.value })}
                        />
                      </label>
                    </div>
                  )}

                  {/* live summary */}
                  {form.working_hours && (
                    <div className="flex items-start gap-2 text-sm text-muted rounded-lg border border-app px-3 py-2 bg-[rgba(27,27,30,0.06)]">
                      <Clock className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                      <span dir="auto">{form.working_hours}</span>
                    </div>
                  )}
                </div>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label={t.addressL}>
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder={t.addressPh}
                  maxLength={500}
                />
              </Field>
              <Field
                label={t.locationL}
                help={<HelpTip label={t.help} title={t.helpMaps.title} body={t.helpMaps.body} />}
              >
                <input
                  className={inputCls}
                  {...ltrInput}
                  type="url"
                  inputMode="url"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="https://maps.app.goo.gl/…"
                  maxLength={500}
                />
              </Field>
            </div>

            {/* business payment methods chips */}
            <div>
              <span className="block text-sm font-semibold mb-2">{t.bizPayments}</span>
              <div className="flex flex-wrap gap-2">
                {BIZ_PAYMENT_METHODS.map((m) => {
                  const on = form.payment_methods.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        set(
                          "payment_methods",
                          on
                            ? form.payment_methods.filter((x) => x !== m.value)
                            : [...form.payment_methods, m.value]
                        )
                      }
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold border transition-all inline-flex items-center gap-1.5",
                        on
                          ? "border-accent bg-[rgba(27,27,30,0.15)] text-app"
                          : "border-app text-muted hover:border-strong"
                      )}
                    >
                      {on && <Check className="w-3.5 h-3.5 text-accent" />}
                      {pick(m.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={t.deliveryL}>
              <textarea
                className={cn(inputCls, "min-h-20 resize-y")}
                value={form.delivery_info}
                onChange={(e) => set("delivery_info", e.target.value)}
                placeholder={t.deliveryPh}
                maxLength={1000}
              />
            </Field>
            <Field label={t.returnL}>
              <textarea
                className={cn(inputCls, "min-h-20 resize-y")}
                value={form.return_policy}
                onChange={(e) => set("return_policy", e.target.value)}
                placeholder={t.returnPh}
                maxLength={1000}
              />
            </Field>

            {/* order collection — structured selectable list */}
            <OrderFieldsPicker
              t={t}
              rows={form.order_fields}
              labelOf={orderFieldLabel}
              isLocked={isLockedOrderField}
              presets={ORDER_FIELD_PRESETS}
              pick={pick}
              onChange={(rows) => set("order_fields", rows)}
            />
          </div>
        </section>

        {/* ================= AI TRAINING ================= */}
        <section className="space-y-5">
          <SectionHeader icon={Bot} eyebrow={t.sectionAI} title={t.aiTitle} sub={t.aiSub} />

          <div className="card p-5 sm:p-6 space-y-6">
            <Field label={t.goalL}>
              <select
                className={inputCls}
                value={form.primary_goal}
                onChange={(e) => set("primary_goal", e.target.value)}
              >
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {pick(g.label)}
                  </option>
                ))}
              </select>
            </Field>

            {/* tone radio cards */}
            <div role="radiogroup" aria-label={t.toneL}>
              <span className="block text-sm font-semibold mb-2">{t.toneL}</span>
              <div className="grid sm:grid-cols-3 gap-3">
                {TONES.map((tone) => {
                  const on = form.tone_of_voice === tone.value;
                  return (
                    <button
                      key={tone.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set("tone_of_voice", tone.value)}
                      className={cn(
                        "rounded-2xl border p-4 text-start transition-all flex flex-col gap-2",
                        on
                          ? "border-accent bg-[rgba(27,27,30,0.1)] shadow-[0_0_0_1px_var(--accent)]"
                          : "border-app hover:border-strong"
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-bold text-sm">{pick(tone.label)}</span>
                        <span
                          className={cn(
                            "w-4.5 h-4.5 rounded-full border flex items-center justify-center",
                            on ? "border-accent bg-accent" : "border-strong"
                          )}
                        >
                          {on && <span className="w-1.5 h-1.5 rounded-full bg-brand-deep" />}
                        </span>
                      </span>
                      <span className="text-xs text-muted leading-relaxed">{pick(tone.desc)}</span>
                      <span className="text-xs text-accent leading-relaxed mt-auto pt-1 border-t border-app">
                        {pick(tone.example)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={t.greetingL}>
              <textarea
                className={cn(inputCls, "min-h-20 resize-y")}
                value={form.greeting_message}
                onChange={(e) => set("greeting_message", e.target.value)}
                placeholder={t.greetingPh.replace("{biz}", form.business_name.trim() || (lang === "ar" ? "اسم نشاطك" : "your business"))}
                maxLength={500}
              />
            </Field>

            <Field label={t.personalityL}>
              <textarea
                className={cn(inputCls, "min-h-20 resize-y")}
                value={form.assistant_personality}
                onChange={(e) => set("assistant_personality", e.target.value)}
                placeholder={t.personalityPh}
                maxLength={1000}
              />
            </Field>

            <Field label={t.kbL}>
              <textarea
                className={cn(inputCls, "min-h-40 resize-y")}
                value={form.knowledge_base_raw}
                onChange={(e) => set("knowledge_base_raw", e.target.value)}
                placeholder={t.kbPh}
                maxLength={20000}
              />
            </Field>

            {/* kb file uploads */}
            <div>
              <span className="block text-sm font-semibold mb-2">{t.kbFilesL}</span>
              <div className="space-y-2">
                {kbFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl border border-app bg-[rgba(7,15,28,0.5)] px-3.5 py-2.5"
                  >
                    {f.status === "uploading" ? (
                      <Spinner className="w-4 h-4 text-accent" />
                    ) : (
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1" dir="ltr" style={{ textAlign: "start" }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      aria-label={t.remove}
                      onClick={() => setKbFiles((prev) => prev.filter((x) => x.id !== f.id))}
                      className="btn-ghost !p-1.5 text-danger"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <UploadDrop
                  cta={t.uploadFileCta}
                  hint="PDF / DOCX / TXT"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onFiles={(files) => handleKbUpload(files)}
                />
              </div>
              {errors.kb_files && <ErrorLine msg={errors.kb_files} />}
            </div>
          </div>

          {/* FAQs */}
          <DynamicSection
            title={t.faqsL}
            tag={t.optionalSection}
            addLabel={t.addFaq}
            onAdd={() => set("faqs", [...form.faqs, { question: "", answer: "" }])}
          >
            {form.faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-app p-4 space-y-3 relative">
                <RemoveRowBtn
                  label={t.remove}
                  onClick={() => set("faqs", form.faqs.filter((_, x) => x !== i))}
                />
                <Field label={`${t.faqQ} ${i + 1}`}>
                  <input
                    className={inputCls}
                    value={f.question}
                    onChange={(e) =>
                      set("faqs", form.faqs.map((row, x) => (x === i ? { ...row, question: e.target.value } : row)))
                    }
                    placeholder={t.faqQPh}
                    maxLength={500}
                  />
                </Field>
                <Field label={t.faqA}>
                  <textarea
                    className={cn(inputCls, "min-h-16 resize-y")}
                    value={f.answer}
                    onChange={(e) =>
                      set("faqs", form.faqs.map((row, x) => (x === i ? { ...row, answer: e.target.value } : row)))
                    }
                    placeholder={t.faqAPh}
                    maxLength={2000}
                  />
                </Field>
              </div>
            ))}
          </DynamicSection>

          {/* products */}
          <DynamicSection
            title={t.productsL}
            tag={t.optionalSection}
            addLabel={t.addProduct}
            importLabel={lang === "ar" ? "استيراد المنتجات" : "Import Products"}
            onImport={() => handleImportRedirect("products")}
            onAdd={() => set("products", [...form.products, { name: "", price: "", description: "" }])}
          >
            {form.products.map((p, i) => (
              <ItemRowEditor
                key={i}
                row={p}
                t={{ name: t.itemName, price: t.itemPrice, desc: t.itemDesc, remove: t.remove }}
                onChange={(row) => set("products", form.products.map((r, x) => (x === i ? row : r)))}
                onRemove={() => set("products", form.products.filter((_, x) => x !== i))}
              />
            ))}
          </DynamicSection>

          {/* services */}
          <DynamicSection
            title={t.servicesL}
            tag={t.optionalSection}
            addLabel={t.addService}
            importLabel={lang === "ar" ? "استيراد الخدمات" : "Import Services"}
            onImport={() => handleImportRedirect("services")}
            onAdd={() => set("services", [...form.services, { name: "", price: "", description: "" }])}
          >
            {form.services.map((p, i) => (
              <ItemRowEditor
                key={i}
                row={p}
                t={{ name: t.itemName, price: t.itemPrice, desc: t.itemDesc, remove: t.remove }}
                onChange={(row) => set("services", form.services.map((r, x) => (x === i ? row : r)))}
                onRemove={() => set("services", form.services.filter((_, x) => x !== i))}
              />
            ))}
          </DynamicSection>
        </section>

        {/* ================= PAYMENT ================= */}
        {plan && (
          <section className="space-y-5">
            <SectionHeader icon={Wallet} eyebrow={t.sectionPay} title={t.payTitle} sub={t.paySub} />

            {/* amount due */}
            <div className="glass-strong p-6 text-center relative overflow-hidden">
              <div className="glow-orb w-48 h-48 bg-brand-teal -top-16 -end-16 opacity-25" />
              <p className="text-sm text-muted font-semibold">{t.amountDue}</p>
              <p className="text-4xl sm:text-5xl font-extrabold gradient-text mt-2" dir="ltr">
                {formatEGP(planTotal(plan), lang)}
              </p>
              <p className="text-xs text-muted mt-2">
                {pick(plan.name)} — {t.setup} {formatEGP(plan.setupFee, lang)} + {formatEGP(plan.monthlyFee, lang)} {t.monthly}
              </p>
            </div>

            {/* method cards */}
            <div data-err="payment_method">
              <span className="block text-sm font-semibold mb-2">
                {t.payHow}
                <span className="text-danger ms-1">*</span>
              </span>
              <div className="grid sm:grid-cols-2 gap-3">
                {visiblePaymentChannels.map((ch) => {
                  const acc = PAYMENT_ACCOUNTS[ch];
                  const on = form.payment_method === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set("payment_method", ch)}
                      className={cn(
                        "rounded-2xl border p-4 text-start transition-all",
                        on
                          ? "border-accent bg-[rgba(27,27,30,0.1)] shadow-[0_0_0_1px_var(--accent)]"
                          : "border-app hover:border-strong"
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-2">
                          <Wallet className={cn("w-4 h-4", on ? "text-accent" : "text-muted")} />
                          {pick(acc.label)}
                        </span>
                        <span
                          className={cn(
                            "w-4.5 h-4.5 rounded-full border flex items-center justify-center",
                            on ? "border-accent bg-accent" : "border-strong"
                          )}
                        >
                          {on && <span className="w-1.5 h-1.5 rounded-full bg-brand-deep" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.payment_method && <ErrorLine msg={errors.payment_method} />}
            </div>

            {/* revealed account */}
            <AnimatePresence>
              {form.payment_method && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="card p-5">
                    <p className="text-xs text-muted font-semibold mb-1.5">{t.accountNumber}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <code
                        className="text-2xl font-extrabold tracking-[0.15em] text-accent"
                        dir="ltr"
                      >
                        {PAYMENT_ACCOUNTS[form.payment_method].number}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyAccount(PAYMENT_ACCOUNTS[form.payment_method!].number)}
                        className="btn-outline !py-1.5 !px-3 text-xs"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? t.copiedMsg : t.copy}
                      </button>
                    </div>
                    <ol className="mt-4 space-y-2">
                      {t.payInstructions.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                          <span className="w-5 h-5 rounded-full bg-[rgba(27,27,30,0.15)] text-accent text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {line}
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="card p-5 sm:p-6 space-y-5">
              {/* transaction ref */}
              <div data-err="transaction_ref">
                <Field
                  label={t.txRefL}
                  required
                  error={errors.transaction_ref}
                  hint={form.transaction_ref ? t.txRefDigits(form.transaction_ref.length) : undefined}
                >
                  <input
                    className={cn(
                      inputCls,
                      "font-mono tracking-[0.2em] text-lg",
                      form.transaction_ref.length === 12 && "border-[rgba(74,222,128,0.5)]"
                    )}
                    {...ltrInput}
                    inputMode="numeric"
                    maxLength={12}
                    value={form.transaction_ref}
                    onChange={(e) => set("transaction_ref", e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder={t.txRefPh}
                  />
                </Field>
              </div>

              {/* screenshot */}
              <div data-err="screenshot">
                <span className="block text-sm font-semibold mb-1.5">
                  {t.screenshotL}
                  <span className="text-danger ms-1">*</span>
                </span>
                <p className="text-xs text-muted mb-2">{t.screenshotHint}</p>
                {screenshot ? (
                  <UploadPreview
                    item={screenshot}
                    onRemove={() => setScreenshot(null)}
                    removeLabel={t.remove}
                  />
                ) : (
                  <UploadDrop
                    cta={t.uploadCta}
                    hint={t.logoHint}
                    accept="image/*"
                    onFiles={(files) =>
                      files[0] && handleSingleUpload(files[0], "payment-screenshots", "screenshot", setScreenshot)
                    }
                  />
                )}
                {errors.screenshot && <ErrorLine msg={errors.screenshot} />}
              </div>

              {serverError && (
                <div className="rounded-xl border border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.08)] px-4 py-3 flex items-start gap-2.5 text-sm text-danger">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  {serverError}
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={submitting || anyUploading}
                className="btn-primary w-full !py-4 text-base"
              >
                {submitting ? (
                  <>
                    <Spinner className="w-5 h-5" /> {t.submitting}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> {t.submit}
                  </>
                )}
              </button>
              <p className="text-xs text-muted text-center">{t.secureNote}</p>
            </div>
          </section>
        )}
      </div>

      {errors._uploading && <ErrorLine msg={errors._uploading} />}
    </main>
  );
}

/* ============================================================
   Small internal components
   ============================================================ */
function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  sub,
}: {
  icon: typeof Building2;
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-10 h-10 rounded-xl bg-[rgba(27,27,30,0.12)] text-accent flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wider uppercase text-accent">{eyebrow}</p>
        <h2 className="text-xl sm:text-2xl font-extrabold leading-tight">{title}</h2>
        <p className="text-muted text-sm mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

function ErrorLine({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-danger mt-2" role="alert">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
}

/* HelpTip — contextual help shown on hover (desktop) or tap (mobile). */
function HelpTip({ label, title, body }: { label: string; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-accent transition-colors rounded-full px-1.5 py-0.5 border border-transparent hover:border-app"
        aria-label={`${label} — ${title}`}
        aria-expanded={open}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 start-0 w-72 max-w-[80vw] rounded-xl border border-app bg-[rgba(7,15,28,0.97)] backdrop-blur-md p-3 shadow-2xl text-start cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="block text-xs font-bold text-accent mb-1">{title}</span>
            <span className="block text-xs text-muted leading-relaxed whitespace-pre-line" dir="auto">
              {body}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function UploadDrop({
  cta,
  hint,
  accept,
  multiple,
  compact,
  onFiles,
}: {
  cta: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  compact?: boolean;
  onFiles: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border border-dashed border-strong rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer bg-[rgba(7,15,28,0.4)]",
        compact ? "w-24 h-24 text-center px-1" : "w-full py-6 px-4"
      )}
    >
      {compact ? <ImageIcon className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
      <span className={cn("font-semibold", compact ? "text-[10px] leading-tight" : "text-sm")}>{cta}</span>
      {hint && <span className={cn(compact ? "text-[9px]" : "text-xs", "opacity-70")}>{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function UploadPreview({
  item,
  onRemove,
  removeLabel,
  compact,
}: {
  item: UploadItem;
  onRemove: () => void;
  removeLabel: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-app bg-[rgba(7,15,28,0.5)]",
        compact ? "w-24 h-24" : "w-36 h-36"
      )}
    >
      {item.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted">
          <FileText className="w-6 h-6" />
        </div>
      )}
      {item.status === "uploading" && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
          <Spinner className="w-6 h-6 text-accent" />
        </div>
      )}
      {item.status === "done" && (
        <span className="absolute bottom-1.5 start-1.5 w-5 h-5 rounded-full bg-[rgba(74,222,128,0.9)] text-brand-deep flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="absolute top-1.5 end-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[rgba(248,113,113,0.85)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DynamicSection({
  title,
  tag,
  addLabel,
  onAdd,
  importLabel,
  onImport,
  children,
}: {
  title: string;
  tag: string;
  addLabel: string;
  onAdd: () => void;
  importLabel?: string;
  onImport?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="font-bold flex items-center gap-2">
          {title}
          <span className="badge badge-neutral">{tag}</span>
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onAdd} className="btn-outline !py-1.5 !px-3 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </button>
          {onImport && importLabel && (
            <button
              type="button"
              onClick={onImport}
              className="btn-outline !py-1.5 !px-3 text-xs border-accent text-accent hover:bg-[rgba(27,27,30,0.1)] inline-flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              {importLabel}
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function RemoveRowBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute top-3 end-3 btn-ghost !p-1.5 text-danger"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function ItemRowEditor({
  row,
  t,
  onChange,
  onRemove,
}: {
  row: ItemRow;
  t: { name: string; price: string; desc: string; remove: string };
  onChange: (row: ItemRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-app p-4 relative">
      <RemoveRowBtn label={t.remove} onClick={onRemove} />
      <div className="grid sm:grid-cols-[2fr_1fr] gap-3 pe-8">
        <Field label={t.name}>
          <input
            className="input-base"
            value={row.name}
            onChange={(e) => onChange({ ...row, name: e.target.value })}
            maxLength={200}
          />
        </Field>
        <Field label={t.price}>
          <input
            className="input-base"
            dir="ltr"
            style={{ textAlign: "start", direction: "ltr" }}
            inputMode="decimal"
            value={row.price}
            onChange={(e) => onChange({ ...row, price: e.target.value.replace(/[^\d.]/g, "").slice(0, 50) })}
            placeholder="150"
            maxLength={50}
          />
        </Field>
      </div>
      <div className="mt-3">
        <Field label={t.desc}>
          <input
            className="input-base"
            value={row.description}
            onChange={(e) => onChange({ ...row, description: e.target.value })}
            maxLength={500}
          />
        </Field>
      </div>
    </div>
  );
}

/* ============================================================
   Order-fields picker — structured list for "what to collect with each order"
   ============================================================ */
type OrderPickerT = {
  orderCollectL: string;
  orderCollectSub: string;
  orderCollectRequired: string;
  orderCollectAdd: string;
  orderCollectCustom: string;
  orderCollectCustomPh: string;
  orderCollectCustomSave: string;
  orderCollectCustomCancel: string;
  orderCollectAllAdded: string;
  remove: string;
};

function OrderFieldsPicker({
  t,
  rows,
  labelOf,
  isLocked,
  presets,
  pick,
  onChange,
}: {
  t: OrderPickerT;
  rows: OrderFieldRow[];
  labelOf: (row: OrderFieldRow) => string;
  isLocked: (row: OrderFieldRow) => boolean;
  presets: { id: string; label: L }[];
  pick: <T,>(p: { ar: T; en: T }) => T;
  onChange: (rows: OrderFieldRow[]) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
        setCustomMode(false);
        setCustomValue("");
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [addOpen]);

  const presetSelectedIds = new Set(
    rows.filter((r): r is { kind: "preset"; id: string } => r.kind === "preset").map((r) => r.id)
  );
  const remainingPresets = presets.filter((p) => !presetSelectedIds.has(p.id));

  const addPreset = (id: string) => {
    onChange([...rows, { kind: "preset", id }]);
    setAddOpen(false);
  };

  const addCustom = () => {
    const value = customValue.trim();
    if (!value) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    onChange([...rows, { kind: "custom", id, label: value }]);
    setCustomValue("");
    setCustomMode(false);
    setAddOpen(false);
  };

  const removeAt = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <span className="block text-sm font-semibold mb-1.5">{t.orderCollectL}</span>
      <p className="text-xs text-muted mb-3">{t.orderCollectSub}</p>

      <div className="flex flex-wrap gap-2">
        {rows.map((row, i) => {
          const locked = isLocked(row);
          return (
            <span
              key={row.kind === "preset" ? `p_${row.id}` : `c_${row.id}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold border",
                locked
                  ? "border-accent bg-[rgba(27,27,30,0.2)] text-app"
                  : "border-app bg-[rgba(27,27,30,0.08)] text-app"
              )}
            >
              <Check className="w-3.5 h-3.5 text-accent" />
              <span>{labelOf(row)}</span>
              {locked ? (
                <span className="ms-1 text-[10px] font-bold uppercase tracking-wider text-accent opacity-80">
                  {t.orderCollectRequired}
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={t.remove}
                  onClick={() => removeAt(i)}
                  className="ms-1 -me-1 w-5 h-5 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-[rgba(248,113,113,0.12)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          );
        })}

        <div ref={addRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setAddOpen((o) => !o);
              setCustomMode(false);
              setCustomValue("");
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold border border-dashed border-strong text-muted hover:text-accent hover:border-accent transition-colors"
            aria-expanded={addOpen}
          >
            <Plus className="w-3.5 h-3.5" />
            {t.orderCollectAdd}
          </button>
          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute z-40 top-full mt-2 start-0 min-w-[260px] max-w-[90vw] rounded-xl border border-app bg-[rgba(7,15,28,0.97)] backdrop-blur-md p-2 shadow-2xl"
              >
                {!customMode && (
                  <>
                    {remainingPresets.length === 0 ? (
                      <p className="text-xs text-muted px-2 py-1.5">{t.orderCollectAllAdded}</p>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto">
                        {remainingPresets.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => addPreset(p.id)}
                              className="w-full text-start px-3 py-2 rounded-lg text-sm hover:bg-[rgba(27,27,30,0.1)] transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5 text-accent shrink-0" />
                              {pick(p.label)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t border-app mt-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setCustomMode(true)}
                        className="w-full text-start px-3 py-2 rounded-lg text-sm hover:bg-[rgba(27,27,30,0.1)] transition-colors flex items-center gap-2 text-accent font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        {t.orderCollectCustom}
                      </button>
                    </div>
                  </>
                )}
                {customMode && (
                  <div className="p-1.5 space-y-2 w-72 max-w-[80vw]">
                    <input
                      autoFocus
                      className="input-base text-sm"
                      placeholder={t.orderCollectCustomPh}
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value.slice(0, 80))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom();
                        }
                      }}
                      maxLength={80}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomMode(false);
                          setCustomValue("");
                        }}
                        className="btn-ghost !py-1.5 !px-3 text-xs"
                      >
                        {t.orderCollectCustomCancel}
                      </button>
                      <button
                        type="button"
                        onClick={addCustom}
                        disabled={!customValue.trim()}
                        className="btn-primary !py-1.5 !px-3 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t.orderCollectCustomSave}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
