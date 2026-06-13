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
      {badge && <span className="badge badge-accent mb-4">{badge}</span>}
      <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">{title}</h2>
      {subtitle && <p className="text-muted mt-4 text-base sm:text-lg leading-relaxed">{subtitle}</p>}
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
          <div key={i} className="card overflow-hidden">
            <h3>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 p-5 text-start font-semibold cursor-pointer hover:text-accent transition-colors"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${i}`}
                id={`${idPrefix}-trigger-${i}`}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 shrink-0 text-accent transition-transform duration-200",
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
                  <p className="px-5 pb-5 text-muted text-sm leading-relaxed">{item.a}</p>
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
      monthly: "شهرياً",
      subscribe: "اشترك الآن",
      popular: "الأكثر طلباً",
      msgs: "رسالة ذكية شهرياً",
    },
    en: {
      setup: "one-time setup fee",
      monthly: "/ month",
      subscribe: "Subscribe Now",
      popular: "Most Popular",
      msgs: "AI messages / month",
    },
  });

  return (
    <Reveal delay={delay} className="h-full">
      <div
        className={cn(
          "card card-hover h-full flex flex-col p-7 relative",
          plan.highlighted && "border-[var(--accent)] shadow-[0_0_48px_rgba(107,160,172,0.18)]"
        )}
      >
        {plan.highlighted && (
          <span className="badge badge-accent absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap">
            {t.popular}
          </span>
        )}
        <h3 className="text-xl font-extrabold">{pick(plan.name)}</h3>
        <p className="text-muted text-sm mt-2 leading-relaxed min-h-10">{pick(plan.tagline)}</p>
        <div className="mt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold gradient-text">
              {formatEGP(plan.monthlyFee, lang)}
            </span>
            <span className="text-muted text-sm">{t.monthly}</span>
          </div>
          <p className="text-muted text-xs mt-2">
            + {formatEGP(plan.setupFee, lang)} {t.setup}
          </p>
          <p className="text-accent text-xs mt-1 font-semibold">
            {new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG").format(plan.messageLimit)}{" "}
            {t.msgs}
          </p>
        </div>
        <ul className={cn("mt-6 space-y-3 flex-1", !detailed && "mb-2")}>
          {pick(plan.features).map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <Reveal>
        <div className="glass-strong relative overflow-hidden p-10 sm:p-16 text-center">
          <div className="glow-orb w-72 h-72 bg-brand-teal -top-24 -start-24" aria-hidden />
          <div className="glow-orb w-72 h-72 bg-brand-sky -bottom-24 -end-24" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold gradient-text leading-tight">
              {title ?? t.title}
            </h2>
            <p className="text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
              {subtitle ?? t.subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
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
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="glow-orb w-96 h-96 bg-brand-teal -top-40 start-1/4" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {badge && <span className="badge badge-accent mb-5">{badge}</span>}
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight gradient-text max-w-3xl mx-auto pb-1">
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
