"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import type { Plan } from "@/lib/plans";

/* ---------- Scroll reveal wrapper ---------- */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Direction-aware arrow ---------- */
export function DirArrow({ className }: { className?: string }) {
  const { dir } = useLang();
  const cls = className ?? "w-4 h-4";
  return dir === "rtl" ? <ArrowLeft className={cls} /> : <ArrowRight className={cls} />;
}

/* ---------- Section heading ---------- */
export function SectionHeading({
  badge,
  title,
  subtitle,
  center = true,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={cn("max-w-3xl", center && "mx-auto text-center")}>
      {badge && (
        <span className={cn("badge badge-accent label-caps mb-4", center && "mx-auto")}>
          {badge}
        </span>
      )}
      <h2 className="text-[1.75rem] leading-9 sm:text-4xl sm:leading-[1.2] font-extrabold">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted mt-4 text-base sm:text-lg leading-relaxed">{subtitle}</p>
      )}
    </Reveal>
  );
}

/* ---------- Accessible accordion ---------- */
export type AccordionItem = { q: string; a: string };

export function Accordion({
  items,
  idPrefix,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  idPrefix: string;
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={cn("card overflow-hidden", isOpen && "border-strong")}>
            <h3>
              <button
                type="button"
                className="group w-full flex items-center justify-between gap-4 p-4 sm:p-5 min-h-14 text-start font-semibold cursor-pointer hover:text-accent transition-all duration-200"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${i}`}
                id={`${idPrefix}-trigger-${i}`}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 shrink-0 text-accent transition-all duration-200 group-hover:scale-115 group-hover:translate-y-0.5",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${idPrefix}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${idPrefix}-trigger-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-4 sm:px-5 pb-5 text-muted text-sm leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Plan card (pricing preview + full pricing) ---------- */
export function PlanCard({
  plan,
  delay = 0,
  detailed = false,
}: {
  plan: Plan;
  delay?: number;
  detailed?: boolean;
}) {
  const { lang, pick } = useLang();
  const t = useT({
    ar: {
      setup: "رسوم تأسيس لمرة واحدة",
      monthly: "للباقة",
      subscribe: "اشترك الآن",
      popular: "الأكثر طلباً",
      msgs: "رصيد محادثات ذكية · صلاحية ٣٠ يوم",
    },
    en: {
      setup: "one-time setup fee",
      monthly: "/ package",
      subscribe: "Subscribe Now",
      popular: "Most Popular",
      msgs: "AI conversation credit · 30-day validity",
    },
  });

  return (
    <Reveal delay={delay} className="h-full">
      <div
        className={cn(
          "card card-hover h-full flex flex-col p-6 sm:p-7 relative",
          plan.highlighted &&
            "border-[rgba(27,27,30,0.45)] shadow-[0_0_48px_rgba(27,27,30,0.15)]"
        )}
      >
        {plan.highlighted && (
          <span className="badge badge-gold absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap shadow-lg">
            {t.popular}
          </span>
        )}
        <h3 className="text-xl font-extrabold">{pick(plan.name)}</h3>
        <p className="text-muted text-sm mt-2 leading-relaxed min-h-10">{pick(plan.tagline)}</p>
        <div className="mt-6">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold gradient-text font-display">
              {formatEGP(plan.monthlyFee, lang)}
            </span>
            <span className="text-muted text-sm">{t.monthly}</span>
          </div>
          <p className="text-muted text-xs mt-2">
            + {formatEGP(plan.setupFee, lang)} {t.setup}
          </p>
          <p className="text-accent text-xs mt-1 font-semibold">{t.msgs}</p>
        </div>
        <ul className={cn("mt-6 space-y-3 flex-1", !detailed && "mb-2")}>
          {pick(plan.features).map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden />
              <span className={detailed ? "" : "text-muted"}>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          href={`/onboarding?plan=${plan.id}`}
          className={cn("mt-7 w-full", plan.highlighted ? "btn-primary" : "btn-outline")}
        >
          {t.subscribe}
          <DirArrow />
        </Link>
      </div>
    </Reveal>
  );
}

/* ---------- Closing CTA banner ---------- */
export function CTABanner({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const t = useT({
    ar: {
      title: "جاهز توظّف أول موظف ذكاء اصطناعي في نشاطك؟",
      subtitle: "خلال دقائق من الاشتراك، عملاءك هيلاقوا حد بيرد عليهم — في أي وقت، بأي لغة.",
      start: "ابدأ الآن",
      demo: "احجز ديمو مجاني",
    },
    en: {
      title: "Ready to hire your first AI employee?",
      subtitle:
        "Minutes after subscribing, your customers get instant answers — any time, in any language.",
      start: "Get Started",
      demo: "Book a Free Demo",
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <Reveal>
        <div className="glass-strong relative overflow-hidden p-7 sm:p-12 lg:p-16 text-center">
          <div className="glow-orb w-72 h-72 bg-brand-teal -top-24 -start-24" aria-hidden />
          <div className="glow-orb w-72 h-72 bg-brand-sky -bottom-24 -end-24" aria-hidden />
          <div className="relative">
            <h2 className="text-[1.75rem] leading-9 sm:text-4xl sm:leading-[1.2] font-extrabold gradient-text pb-0.5">
              {title ?? t.title}
            </h2>
            <p className="text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
              {subtitle ?? t.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 mt-8 max-w-md sm:max-w-none mx-auto">
              <Link href="/pricing" className="btn-primary">
                {t.start}
                <DirArrow />
              </Link>
              <Link href="/book-demo" className="btn-outline">
                <MessageCircle className="w-4 h-4" aria-hidden />
                {t.demo}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Page hero (inner pages) ---------- */
export function PageHero({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="glow-orb w-96 h-96 bg-brand-teal -top-40 start-1/4" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {badge && <span className="badge badge-accent label-caps mb-5">{badge}</span>}
          <h1 className="text-[2rem] leading-10 sm:text-5xl sm:leading-[1.18] font-extrabold gradient-text max-w-3xl mx-auto pb-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted mt-5 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
