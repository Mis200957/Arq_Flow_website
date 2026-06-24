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

/* ================= Animated WhatsApp chat mock ================= */

type ChatMsg = { from: "customer" | "bot"; text: string };

const SCRIPT: ChatMsg[] = [
  { from: "customer", text: "مساء الخير، عندكم توصيل لمدينة نصر؟" },
  { from: "bot", text: "مساء النور 🌟 أيوه طبعاً، بنوصّل مدينة نصر خلال ٤٥ دقيقة. تحب أبعتلك المنيو؟" },
  { from: "customer", text: "عايز ٢ فراخ مشوية وواحد رز بسمتي" },
  { from: "bot", text: "تمام ✅ طلبك: ٢ فراخ مشوية + رز بسمتي = ٣٢٠ ج.م شامل التوصيل. أأكّد الطلب؟" },
  { from: "customer", text: "أيوه أكّد" },
  { from: "bot", text: "اتسجّل طلبك 🎉 رقم الأوردر ‎#1042 وهيوصلك خلال ٤٥ دقيقة. بالهنا والشفا!" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-sky"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function ChatMock() {
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [cycle, setCycle] = useState(0);
  const t = useT({
    ar: { bot: "مطعم الذوق — ArqFlow AI", online: "متصل الآن", replies: "بيرد في أقل من ٥ ثواني" },
    en: { bot: "El Zoo' Restaurant — ArqFlow AI", online: "Online now", replies: "Replies in under 5 seconds" },
  });

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    let time = 700;
    SCRIPT.forEach((m, i) => {
      if (m.from === "bot") {
        at(() => setTyping(true), time);
        time += 1100;
      }
      at(() => {
        setTyping(false);
        setCount(i + 1);
      }, time);
      time += m.from === "customer" ? 1100 : 1700;
    });
    // pause on the finished conversation, then restart
    at(() => {
      setCount(0);
      setTyping(false);
      setCycle((c) => c + 1);
    }, time + 3500);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [cycle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      className="relative"
      aria-label={t.bot}
    >
      <div className="glass-strong overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        {/* chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-app bg-[rgba(7,15,28,0.45)]">
          <span className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white shrink-0">
            <MessageCircle className="w-5 h-5" aria-hidden />
            <span className="absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-brand-deep" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{t.bot}</p>
            <p className="text-xs text-success">{t.online}</p>
          </div>
          <span className="badge badge-accent ms-auto hidden sm:inline-flex text-[10px]">
            <Zap className="w-3 h-3" aria-hidden /> {t.replies}
          </span>
        </div>

        {/* messages — conversation is in Egyptian Arabic by design */}
        <div dir="rtl" className="h-[380px] sm:h-[420px] p-4 sm:p-5 flex flex-col justify-end gap-2.5 grid-bg">
          <AnimatePresence>
            {SCRIPT.slice(0, count).map((m, i) => (
              <motion.div
                key={`${cycle}-${i}`}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.from === "customer"
                    ? "self-start bg-[rgba(238,237,210,0.1)] border border-app rounded-ss-md"
                    : "self-end bg-gradient-to-br from-brand-teal to-brand-sky text-white rounded-se-md shadow-[0_8px_24px_rgba(42,96,114,0.35)]"
                )}
              >
                {m.text}
                {m.from === "bot" && (
                  <span className="block text-[10px] opacity-70 mt-1 text-start">ArqFlow AI ✓✓</span>
                )}
              </motion.div>
            ))}
            {typing && (
              <motion.div
                key={`typing-${cycle}-${count}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="self-end glass rounded-2xl rounded-se-md"
              >
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* floating accent chips */}
      <div className="absolute -top-5 -start-4 sm:-start-8 animate-float" aria-hidden>
        <span className="badge badge-success shadow-lg">
          <CheckCircle2 className="w-3.5 h-3.5" /> 24/7
        </span>
      </div>
      <div className="absolute -bottom-4 -end-3 sm:-end-6 animate-float [animation-delay:1.5s]" aria-hidden>
        <span className="badge badge-accent shadow-lg">
          <Mic className="w-3.5 h-3.5" /> Voice ✓
        </span>
      </div>
    </motion.div>
  );
}

/* ================= Hero ================= */

function Hero() {
  const t = useT({
    ar: {
      badge: "وكلاء ذكاء اصطناعي للواتساب",
      h1a: "موظف ذكاء اصطناعي",
      h1b: "يرد على عملاءك ٢٤ ساعة",
      sub: "ArqFlow بيركّب لنشاطك وكيل ذكاء اصطناعي خاص على واتساب — يرد فوراً، ياخد الطلبات، يحجز المواعيد، ويفهم المصري والعربي والإنجليزي. من غير إجازات ومن غير «هرد عليك بعدين».",
      cta1: "ابدأ الآن",
      cta2: "احجز ديمو مجاني",
      note: "إعداد خلال دقائق · أسعار بالجنيه المصري · إلغاء في أي وقت",
    },
    en: {
      badge: "AI agents for WhatsApp",
      h1a: "An AI employee that",
      h1b: "answers your customers 24/7",
      sub: "ArqFlow gives your business its own private AI agent on WhatsApp — instant replies, order taking, appointment booking, in Egyptian Arabic and English. No days off, no “I'll get back to you”.",
      cta1: "Get Started",
      cta2: "Book a Free Demo",
      note: "Set up in minutes · Priced in EGP · Cancel anytime",
    },
  });

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <div className="glow-orb w-[28rem] h-[28rem] bg-brand-teal -top-40 -start-32" aria-hidden />
      <div className="glow-orb w-[26rem] h-[26rem] bg-brand-sky top-32 -end-32" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge badge-accent mb-6">
              <Zap className="w-3.5 h-3.5" aria-hidden /> {t.badge}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15]">
              <span className="gradient-text">{t.h1a}</span>
              <br />
              <span>{t.h1b}</span>
            </h1>
            <p className="text-muted mt-6 text-base sm:text-lg leading-relaxed max-w-xl">{t.sub}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center gap-3 mt-9"
          >
            <Link href="/pricing" className="btn-primary text-base !px-7 !py-3.5">
              {t.cta1}
              <DirArrow />
            </Link>
            <Link href="/book-demo" className="btn-outline text-base !px-7 !py-3.5">
              <MessageCircle className="w-4 h-4" aria-hidden />
              {t.cta2}
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-muted text-xs mt-6"
          >
            {t.note}
          </motion.p>
        </div>

        <ChatMock />
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
        {t.items.map((f, i) => (
          <Reveal key={f.h} delay={i * 0.07}>
            <div className="card card-hover p-6 h-full">
              <span className="w-11 h-11 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" aria-hidden />
              </span>
              <h3 className="font-bold text-lg">{f.h}</h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">{f.p}</p>
            </div>
          </Reveal>
        ))}
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
    <section className="relative py-20 overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-brand-teal top-10 -end-40" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {t.steps.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.1}>
              <div className="card card-hover p-6 h-full relative">
                <span className="text-5xl font-extrabold gradient-text opacity-80">{i + 1}</span>
                <h3 className="font-bold text-lg mt-3">{s.h}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{s.p}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-10">
          <Link href="/how-it-works" className="btn-ghost text-accent">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <SectionHeading badge={t.badge} title={t.title} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 mt-12">
        {t.items.map((it, i) => (
          <Reveal key={it.l} delay={i * 0.05}>
            <div className="card card-hover p-4 text-center h-full flex flex-col items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-[rgba(107,160,172,0.14)] text-accent flex items-center justify-center">
                <it.icon className="w-5 h-5" aria-hidden />
              </span>
              <p className="text-xs font-semibold leading-snug">{it.l}</p>
            </div>
          </Reveal>
        ))}
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
    <section className="relative py-20 overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-brand-sky -bottom-32 -start-32" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.sub} />
        <div className="grid lg:grid-cols-3 gap-6 mt-14 items-stretch">
          {PLANS.map((p, i) => (
            <PlanCard key={p.id} plan={p} delay={i * 0.1} />
          ))}
        </div>
        <Reveal className="text-center mt-10">
          <Link href="/pricing" className="btn-ghost text-accent">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
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
                    i === index ? "bg-[var(--accent)]" : "bg-[rgba(238,237,210,0.2)]"
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <SectionHeading badge={t.badge} title={t.title} />
      <Reveal className="max-w-3xl mx-auto mt-12">
        <Accordion items={t.items} idPrefix="home-faq" />
        <div className="text-center mt-8">
          <Link href="/faq" className="btn-ghost text-accent">
            {t.all}
            <DirArrow />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ================= Page ================= */

export default function HomeClient() {
  return (
    <>
      <Hero />
      <Features />
      <div className="section-divider max-w-7xl mx-auto" />
      <HowItWorks />
      <Industries />
      <div className="section-divider max-w-7xl mx-auto" />
      <PricingPreview />
      <HomeFaq />
      <CTABanner />
    </>
  );
}
