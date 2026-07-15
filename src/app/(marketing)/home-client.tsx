"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ShoppingCart,
  Mic,
  Users,
  BarChart3,
  Languages,
  MessageCircle,
  UtensilsCrossed,
  Stethoscope,
  ShoppingBag,
  Dumbbell,
  Building2,
  Hotel,
  Scissors,
  GraduationCap,
  Pill,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import {
  Reveal,
  SectionHeading,
  Accordion,
  PlanCard,
  CTABanner,
  DirArrow,
} from "@/components/marketing/Shared";
import ParticleText from "@/components/ui/ParticleText";

/* ================= Hero ================= */

function Hero() {
  const { dir } = useLang();
  const t = useT({
    ar: {
      h1a: "موظف ذكاء اصطناعي متكامل",
      h1b: "يرد على عملاءك ٢٤ ساعة",
      sub: "حلول ذكية متكاملة للرد الفوري، استقبال الطلبات، وحجز المواعيد على الواتساب على مدار الساعة.",
      cta1: "ابدأ الآن",
      cta2: "احجز ديمو مجاني",
    },
    en: {
      h1a: "Integrated AI Employee",
      h1b: "Answering Your Customers 24/7",
      sub: "Integrated smart solutions for instant replies, order taking, and appointment booking on WhatsApp 24/7.",
      cta1: "Get Started",
      cta2: "Book a Free Demo",
    },
  });

  return (
    <section className="relative overflow-hidden flex items-center justify-center bg-transparent py-12 sm:py-20 md:py-28 md:min-h-[640px]">
      {/* ── Desktop: Particle ARQFLOW positioned absolutely on the opposite side ── */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 pointer-events-none select-none z-0 w-[55%] h-[320px] hidden md:block",
          dir === "rtl"
            ? "left-[2%] lg:left-[6%]"
            : "right-[2%] lg:right-[6%]"
        )}
      >
        <ParticleText text="ARQFLOW" className="w-full h-full" />
      </div>

      <div className="absolute inset-0 grid-bg opacity-30 z-0 pointer-events-none" aria-hidden />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 z-10">
        {/* ── Mobile: Particle ARQFLOW on top, centered ── */}
        <div className="md:hidden w-full h-[140px] mb-6">
          <ParticleText text="ARQFLOW" className="w-full h-full" />
        </div>

        <div
          className={cn(
            "w-full flex flex-col transition-all duration-300",
            // Mobile: centered
            "items-center text-center",
            // Desktop: side-aligned
            dir === "rtl"
              ? "md:items-start md:text-right md:max-w-lg md:mr-[6%] lg:mr-[10%] md:ml-auto"
              : "md:items-start md:text-left md:max-w-lg md:ml-[6%] lg:ml-[10%] md:mr-auto"
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "flex flex-col items-center text-center",
              dir === "rtl" ? "md:items-start md:text-right" : "md:items-start md:text-left"
            )}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-extrabold text-[#0e2038] max-w-md">
              <span className="gradient-text">{t.h1a}</span>
              <br />
              <span>{t.h1b}</span>
            </h1>
            <p className="text-muted mt-5 sm:mt-8 text-xs sm:text-sm tracking-wide max-w-sm md:max-w-md leading-relaxed">
              {t.sub}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-7 sm:mt-10 w-full max-w-sm sm:max-w-md justify-center md:justify-start"
          >
            <Link href="/pricing" className="btn-primary text-sm !px-8 !py-3.5 w-full sm:w-auto">
              {t.cta1}
              <DirArrow />
            </Link>
            <Link href="/book-demo" className="btn-outline text-sm !px-8 !py-3.5 w-full sm:w-auto">
              <MessageCircle className="w-4 h-4" aria-hidden />
              {t.cta2}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================= Stats bar ================= 

function Stats() {
  const t = useT({
    ar: {
      stats: [
        { v: "٢٤/٧", l: "شغّال من غير توقف" },
        { v: "< ٥ ثواني", l: "متوسط سرعة الرد" },
        { v: "+٩ مجالات", l: "مطاعم، عيادات، محلات وأكتر" },
        { v: "دقايق", l: "من الدفع لتشغيل البوت" },
      ],
    },
    en: {
      stats: [
        { v: "24/7", l: "Always on, never offline" },
        { v: "< 5s", l: "Average reply speed" },
        { v: "9+ industries", l: "Restaurants, clinics, stores & more" },
        { v: "Minutes", l: "From payment to live bot" },
      ],
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6">
      <Reveal>
        <div className="glass grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x rtl:divide-x-reverse divide-[var(--border)] overflow-hidden">
          {t.stats.map((s) => (
            <div key={s.l} className="p-6 sm:p-8 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold gradient-text">{s.v}</p>
              <p className="text-muted text-xs sm:text-sm mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
*/
/* ================= Features grid ================= */

function Features() {
  const t = useT({
    ar: {
      badge: "المميزات",
      title: "كل اللي موظف خدمة العملاء المثالي يعمله — وأسرع",
      sub: "وكيل ذكاء اصطناعي مدرّب على نشاطك أنت بالذات: منتجاتك، أسعارك، مواعيدك، وطريقة كلامك.",
      items: [
        { icon: Zap, h: "ردود فورية ٢٤ ساعة", p: "عميلك يسأل الساعة ٣ الفجر؟ يلاقي رد كامل ومحترم في ثواني — مش رسالة آلية مقفولة." },
        { icon: ShoppingCart, h: "استقبال الطلبات والحجوزات", p: "البوت ياخد الأوردر بالتفاصيل، يأكّد السعر والعنوان، ويسجّل كل حاجة في لوحة التحكم بتاعتك." },
        { icon: Mic, h: "فهم الرسائل الصوتية", p: "عملاءك بيحبوا الفويس؟ مفيش مشكلة. البوت بيسمع، بيفهم المصري، وبيرد كأنه سمعك بودنه." },
        { icon: Users, h: "تحويل ذكي لموظف بشري", p: "لو السؤال محتاج بني آدم، البوت بيحوّل المحادثة لفريقك في ثانية مع ملخص كامل للموقف." },
        { icon: BarChart3, h: "تحليلات وتقارير", p: "اعرف أكتر الأسئلة تكراراً، أوقات الذروة، وعدد الطلبات — أرقام حقيقية تبني عليها قرارات." },
        { icon: Languages, h: "عربي + إنجليزي + مصري", p: "بيرد بنفس لغة العميل تلقائياً، ومتدرّب على اللهجة المصرية مش بس الفصحى." },
      ],
    },
    en: {
      badge: "Features",
      title: "Everything the perfect support employee does — but faster",
      sub: "An AI agent trained on your business specifically: your products, prices, schedule, and tone of voice.",
      items: [
        { icon: Zap, h: "Instant replies, 24/7", p: "A customer asks at 3 AM? They get a complete, polite answer in seconds — not a canned auto-reply." },
        { icon: ShoppingCart, h: "Orders & bookings", p: "The bot takes the full order, confirms price and address, and logs everything in your dashboard." },
        { icon: Mic, h: "Voice message understanding", p: "Your customers love voice notes? No problem. The bot listens, understands Egyptian Arabic, and replies naturally." },
        { icon: Users, h: "Smart human escalation", p: "When a question needs a human, the bot hands the chat to your team instantly — with a full summary." },
        { icon: BarChart3, h: "Analytics & reports", p: "Know your most-asked questions, peak hours, and order counts — real numbers for real decisions." },
        { icon: Languages, h: "Arabic + English + Masry", p: "Automatically replies in the customer's language, trained on the Egyptian dialect — not just formal Arabic." },
      ],
    },
  });

  return (
    <section className="w-full bg-[#f9f8f5] text-[#0e2038] py-12 sm:py-16 md:py-24 border-b border-[#0e2038]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-8 sm:mt-12">
          {t.items.map((f, i) => (
            <Reveal key={f.h} delay={i * 0.07}>
              <div className="card card-hover p-4 sm:p-6 h-full bg-white shadow-[0_4px_20px_rgba(14,32,56,0.02)] border border-[#0e2038]/5">
                <span className="w-11 h-11 icon-chip mb-4">
                  <f.icon className="w-5 h-5" aria-hidden />
                </span>
                <h3 className="font-bold text-lg">{f.h}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{f.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= How it works ================= */

function HowItWorks() {
  const t = useT({
    ar: {
      badge: "كيف يعمل",
      title: "من الاشتراك للتشغيل في ٤ خطوات",
      sub: "مفيش اجتماعات ولا أسابيع انتظار. النظام مبني عشان يشتغل بسرعة.",
      steps: [
        { h: "اختار باقتك", p: "ستارتر، بيزنس، أو إنتربرايز — كل باقة واضحة بالجنيه المصري." },
        { h: "املا بيانات نشاطك", p: "اسم النشاط، المنيو أو الخدمات، أسئلة عملاءك المعتادة — في فورم واحد بسيط." },
        { h: "ادفع بالطريقة اللي تريحك", p: "إنستاباي، فودافون كاش، أو وي باي — وارفع إثبات الدفع." },
        { h: "البوت يشتغل في دقايق", p: "بنجهّز وكيلك الخاص ونوصّله بواتساب نشاطك — وعملاءك يبدأوا ياخدوا ردود فوراً." },
      ],
      more: "اعرف التفاصيل الكاملة",
    },
    en: {
      badge: "How it works",
      title: "From subscription to live bot in 4 steps",
      sub: "No meetings, no weeks of waiting. The system is built for speed.",
      steps: [
        { h: "Choose your plan", p: "Starter, Business, or Enterprise — every plan clearly priced in EGP." },
        { h: "Fill the onboarding form", p: "Your business name, menu or services, and your customers' usual questions — one simple form." },
        { h: "Pay your way", p: "InstaPay, Vodafone Cash, or WE Pay — then upload your payment proof." },
        { h: "Your bot goes live in minutes", p: "We provision your private agent and connect it to your WhatsApp — customers start getting instant answers." },
      ],
      more: "See the full details",
    },
  });

  return (
    <section className="w-full bg-[#f9f8f5] text-[#0e2038] py-12 sm:py-16 md:py-24 border-b border-[#0e2038]/5 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-12">
          {t.steps.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.1}>
              <div className="card card-hover p-4 sm:p-6 h-full relative bg-white shadow-[0_4px_20px_rgba(14,32,56,0.02)] border border-[#0e2038]/5">
                <span className="text-4xl sm:text-5xl font-extrabold gradient-text opacity-80">{i + 1}</span>
                <h3 className="font-bold text-lg mt-3 text-[#0e2038]">{s.h}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-10">
          <Link href="/how-it-works" className="btn-ghost text-accent hover:bg-[#0e2038]/5">
            {t.more}
            <DirArrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Industries strip ================= */

function Industries() {
  const t = useT({
    ar: {
      badge: "المجالات",
      title: "مبني لكل بيزنس مصري بيرد على واتساب",
      items: [
        { icon: UtensilsCrossed, l: "مطاعم وكافيهات" },
        { icon: Stethoscope, l: "عيادات ومراكز طبية" },
        { icon: ShoppingBag, l: "محلات وأونلاين ستورز" },
        { icon: Dumbbell, l: "جيمات ولياقة" },
        { icon: Building2, l: "عقارات" },
        { icon: Hotel, l: "فنادق وشاليهات" },
        { icon: Scissors, l: "صالونات وبيوتي" },
        { icon: GraduationCap, l: "كورسات وتعليم" },
        { icon: Pill, l: "صيدليات" },
      ],
    },
    en: {
      badge: "Industries",
      title: "Built for every Egyptian business that lives on WhatsApp",
      items: [
        { icon: UtensilsCrossed, l: "Restaurants & cafés" },
        { icon: Stethoscope, l: "Clinics & medical centers" },
        { icon: ShoppingBag, l: "Stores & online shops" },
        { icon: Dumbbell, l: "Gyms & fitness" },
        { icon: Building2, l: "Real estate" },
        { icon: Hotel, l: "Hotels & rentals" },
        { icon: Scissors, l: "Salons & beauty" },
        { icon: GraduationCap, l: "Courses & education" },
        { icon: Pill, l: "Pharmacies" },
      ],
    },
  });

  return (
    <section className="w-full bg-[#f9f8f5] text-[#0e2038] py-12 sm:py-16 md:py-24 border-b border-[#0e2038]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} />
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-3 mt-8 sm:mt-12">
          {t.items.map((it, i) => (
            <Reveal key={it.l} delay={i * 0.05}>
              <div className="card card-hover p-3 sm:p-4 text-center h-full flex flex-col items-center gap-1.5 sm:gap-2.5 bg-white shadow-[0_4px_20px_rgba(14,32,56,0.02)] border border-[#0e2038]/5">
                <span className="w-10 h-10 icon-chip">
                  <it.icon className="w-5 h-5" aria-hidden />
                </span>
                <p className="text-xs font-semibold leading-snug text-[#0e2038]">{it.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= Pricing preview ================= */

function PricingPreview() {
  const t = useT({
    ar: {
      badge: "الأسعار",
      title: "أسعار واضحة بالجنيه المصري",
      sub: "رسوم تأسيس لمرة واحدة + اشتراك شهري. من غير مفاجآت ومن غير عقود طويلة.",
      full: "شوف تفاصيل الباقات كاملة",
    },
    en: {
      badge: "Pricing",
      title: "Clear pricing, in Egyptian pounds",
      sub: "A one-time setup fee + a monthly subscription. No surprises, no long contracts.",
      full: "See full plan details",
    },
  });

  return (
    <section className="w-full bg-[#f9f8f5] text-[#0e2038] py-12 sm:py-16 md:py-24 border-b border-[#0e2038]/5 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 mt-10 sm:mt-14 items-stretch">
          {PLANS.map((p, i) => (
            <PlanCard key={p.id} plan={p} delay={i * 0.1} />
          ))}
        </div>
        <Reveal className="text-center mt-10">
          <Link href="/pricing" className="btn-ghost text-accent hover:bg-[#0e2038]/5">
            {t.full}
            <DirArrow />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Testimonials carousel ================= 

function Testimonials() {
  const { dir } = useLang();
  const t = useT({
    ar: {
      badge: "آراء العملاء",
      title: "أصحاب بيزنس جرّبوا ArqFlow",
      prev: "السابق",
      next: "التالي",
      goto: "اذهب إلى الرأي رقم",
      items: [
        {
          quote: "كنا بنخسر طلبات كتير بالليل عشان محدش بيرد. دلوقتي البوت بياخد الأوردرات وإحنا نايمين — أول شهر زادت الطلبات ٤٠٪.",
          name: "أحمد س.",
          role: "صاحب مطعم — مدينة نصر",
        },
        {
          quote: "المرضى بيسألوا نفس الأسئلة كل يوم: المواعيد، الأسعار، العنوان. البوت بيرد عليهم كلهم والسكرتيرة بقت متفرغة للحاجات المهمة.",
          name: "د. مريم ع.",
          role: "مديرة عيادة أسنان — المعادي",
        },
        {
          quote: "أكتر حاجة عجبتني إنه بيفهم الفويسات بالمصري. عملائي كلهم بيبعتوا صوتيات، وكان ده أكبر صداع قبل ArqFlow.",
          name: "كريم م.",
          role: "صاحب متجر إلكترونيات — الإسكندرية",
        },
      ],
    },
    en: {
      badge: "Testimonials",
      title: "Business owners who tried ArqFlow",
      prev: "Previous",
      next: "Next",
      goto: "Go to testimonial",
      items: [
        {
          quote: "We were losing orders every night because nobody replied. Now the bot takes orders while we sleep — orders grew 40% in the first month.",
          name: "Ahmed S.",
          role: "Restaurant owner — Nasr City",
        },
        {
          quote: "Patients ask the same questions daily: appointments, prices, address. The bot answers them all, and our receptionist finally focuses on what matters.",
          name: "Dr. Mariam A.",
          role: "Dental clinic manager — Maadi",
        },
        {
          quote: "What impressed me most is that it understands Egyptian voice notes. All my customers send voice messages — that was my biggest headache before ArqFlow.",
          name: "Karim M.",
          role: "Electronics store owner — Alexandria",
        },
      ],
    },
  });

  const [index, setIndex] = useState(0);
  const total = t.items.length;
  const go = (d: number) => setIndex((i) => (i + d + total) % total);

  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;
  const item = t.items[index];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
      <SectionHeading badge={t.badge} title={t.title} />
      <Reveal className="mt-12">
        <div
          className="glass-strong relative p-8 sm:p-12 max-w-3xl mx-auto text-center"
          role="group"
          aria-roledescription="carousel"
          aria-label={t.title}
        >
          <div className="flex justify-center gap-1 mb-6" aria-hidden>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-warning fill-current" />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <blockquote className="text-lg sm:text-xl leading-relaxed font-medium">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-bold text-accent">{item.name}</p>
                <p className="text-muted text-sm mt-1">{item.role}</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={() => go(-1)} className="btn-outline !p-2.5" aria-label={t.prev}>
              <Prev className="w-4 h-4" aria-hidden />
            </button>
            <div className="flex gap-2" role="tablist">
              {t.items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${t.goto} ${i + 1}`}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    i === index ? "bg-[var(--accent)]" : "bg-[rgba(184,144,99,0.2)]"
                  )}
                />
              ))}
            </div>
            <button onClick={() => go(1)} className="btn-outline !p-2.5" aria-label={t.next}>
              <Next className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
*/
/* ================= FAQ ================= */

function HomeFaq() {
  const t = useT({
    ar: {
      badge: "أسئلة شائعة",
      title: "أكيد عندك أسئلة — عندنا إجابات",
      all: "كل الأسئلة الشائعة",
      items: [
        { q: "هل البوت بيشتغل على رقم الواتساب بتاعي الحالي؟", a: "أيوه. بنوصّل وكيل الذكاء الاصطناعي برقم واتساب نشاطك الموجود فعلاً — عملاءك مش هيحسوا بأي فرق في الرقم، بس هيلاحظوا إن الرد بقى فوري." },
        { q: "البوت هيعرف يرد عن نشاطي أنا بالذات إزاي؟", a: "في خطوة الأونبوردنج بتدّينا كل تفاصيل نشاطك: المنيو أو الخدمات، الأسعار، المواعيد، وسياساتك. بنبني للبوت قاعدة معرفة خاصة بيك لوحدك — مش نموذج عام." },
        { q: "لو العميل سأل سؤال صعب والبوت معرفش يرد؟", a: "البوت بيحوّل المحادثة تلقائياً لموظف بشري من فريقك مع ملخص كامل للمحادثة. عمره ما هيخترع إجابة غلط في موضوع حساس." },
        { q: "هل في عقد أو التزام طويل؟", a: "لأ. في رسوم تأسيس لمرة واحدة، وبعدها اشتراك شهري تقدر تلغيه في أي وقت. رسوم التأسيس فقط غير قابلة للاسترداد بعد تجهيز البوت." },
        { q: "الإعداد بياخد قد إيه فعلاً؟", a: "بعد تأكيد الدفع، تجهيز الوكيل الخاص بيك وربطه بالواتساب بياخد دقايق في أغلب الحالات — مش أيام ولا أسابيع." },
      ],
    },
    en: {
      badge: "FAQ",
      title: "You have questions — we have answers",
      all: "See all FAQs",
      items: [
        { q: "Does the bot work on my current WhatsApp number?", a: "Yes. We connect the AI agent to your existing business WhatsApp number — your customers won't notice any difference in the number, just that replies are now instant." },
        { q: "How will the bot know how to answer for my specific business?", a: "During onboarding you give us your business details: menu or services, prices, schedule, and policies. We build a private knowledge base just for you — not a generic model." },
        { q: "What if a customer asks something the bot can't answer?", a: "The bot automatically hands the conversation to a human on your team, with a full summary. It will never invent a wrong answer on a sensitive topic." },
        { q: "Is there a contract or long commitment?", a: "No. There's a one-time setup fee, then a monthly subscription you can cancel anytime. Only the setup fee is non-refundable after your bot is provisioned." },
        { q: "How long does setup really take?", a: "After payment confirmation, provisioning your private agent and connecting it to WhatsApp takes minutes in most cases — not days or weeks." },
      ],
    },
  });

  return (
    <section className="w-full bg-[#f9f8f5] text-[#0e2038] py-12 sm:py-16 md:py-24 border-b border-[#0e2038]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} />
        <Reveal className="max-w-3xl mx-auto mt-12">
          <Accordion items={t.items} idPrefix="home-faq" />
          <div className="text-center mt-8">
            <Link href="/faq" className="btn-ghost text-accent hover:bg-[#0e2038]/5">
              {t.all}
              <DirArrow />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= Page ================= */

export default function HomeClient() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Industries />
      <PricingPreview />
      <HomeFaq />
      <CTABanner />
    </>
  );
}
