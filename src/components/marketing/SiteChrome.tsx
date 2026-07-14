"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle, Globe } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SUPPORT_WHATSAPP } from "@/lib/plans";

const NAV = [
  { href: "/", label: { ar: "الرئيسية", en: "Home" } },
  { href: "/features", label: { ar: "المميزات", en: "Features" } },
  { href: "/how-it-works", label: { ar: "كيف يعمل", en: "How it Works" } },
  { href: "/pricing", label: { ar: "الأسعار", en: "Pricing" } },
  { href: "/about", label: { ar: "من نحن", en: "About" } },
  { href: "/faq", label: { ar: "الأسئلة الشائعة", en: "FAQ" } },
  { href: "/contact", label: { ar: "تواصل معنا", en: "Contact" } },
];

function BrandMark() {
  return (
    <>
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white shrink-0">
        <MessageCircle className="w-5 h-5" aria-hidden />
      </span>
      <span className="gradient-text font-display">ArqFlow</span>
    </>
  );
}

export function SiteHeader() {
  const { lang, setLang, pick } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT({
    ar: { login: "تسجيل الدخول", demo: "احجز ديمو", start: "ابدأ الآن", menu: "القائمة", close: "إغلاق" },
    en: { login: "Login", demo: "Book a Demo", start: "Get Started", menu: "Menu", close: "Close" },
  });

  // close the drawer whenever navigation happens
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // lock page scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40">
      <div className="glass-strong !rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto safe-x px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg" aria-label="ArqFlow">
            <BrandMark />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-app bg-[rgba(229,228,201,0.08)]"
                    : "text-muted hover:text-app"
                )}
              >
                {pick(item.label)}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="btn-ghost !px-3 text-sm"
              aria-label="Switch language"
            >
              <Globe className="w-4 h-4" aria-hidden />
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <Link href="/login" className="btn-ghost text-sm">{t.login}</Link>
            <Link href="/pricing" className="btn-primary !py-2.5 text-sm">{t.start}</Link>
          </div>

          <button
            className="lg:!hidden btn-ghost !p-2.5 -me-1.5"
            onClick={() => setOpen(!open)}
            aria-label={open ? t.close : t.menu}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label={t.close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="lg:hidden fixed inset-0 top-16 z-40 bg-[rgba(4,9,17,0.6)] backdrop-blur-sm cursor-default"
            />
            <motion.nav
              id="mobile-nav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="lg:hidden fixed inset-x-0 top-16 z-50 glass-strong !rounded-none !rounded-b-2xl border-x-0 border-t-0 px-4 pt-3 pb-5 safe-x safe-b flex flex-col gap-1 max-h-[calc(100dvh-4rem)] overflow-y-auto"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center min-h-12 px-4 rounded-xl text-base font-medium transition-colors",
                    pathname === item.href
                      ? "text-app bg-[rgba(229,228,201,0.08)] border border-app"
                      : "text-muted hover:text-app active:bg-[rgba(229,228,201,0.06)]"
                  )}
                >
                  {pick(item.label)}
                </Link>
              ))}
              <div className="section-divider my-3" />
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="btn-outline !py-3 flex-1 text-sm"
                >
                  <Globe className="w-4 h-4" aria-hidden />
                  {lang === "ar" ? "English" : "عربي"}
                </button>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline !py-3 flex-1 text-sm">
                  {t.login}
                </Link>
              </div>
              <Link href="/pricing" onClick={() => setOpen(false)} className="btn-primary !py-3.5 mt-2.5">
                {t.start}
              </Link>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  const { pick } = useLang();
  const t = useT({
    ar: {
      tagline: "وكلاء ذكاء اصطناعي يردّوا على عملاءك على الواتساب — ٢٤ ساعة، بالعربي والإنجليزي.",
      product: "المنتج",
      company: "الشركة",
      legal: "قانوني",
      rights: "جميع الحقوق محفوظة",
      whatsapp: "كلمنا واتساب",
    },
    en: {
      tagline: "AI agents that answer your customers on WhatsApp — 24/7, in Arabic & English.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      rights: "All rights reserved",
      whatsapp: "WhatsApp us",
    },
  });

  const cols = [
    {
      title: t.product,
      links: [
        { href: "/features", label: { ar: "المميزات", en: "Features" } },
        { href: "/how-it-works", label: { ar: "كيف يعمل", en: "How it Works" } },
        { href: "/pricing", label: { ar: "الأسعار", en: "Pricing" } },
        { href: "/why-arqflow", label: { ar: "ليه ArqFlow", en: "Why ArqFlow" } },
      ],
    },
    {
      title: t.company,
      links: [
        { href: "/about", label: { ar: "من نحن", en: "About" } },
        { href: "/testimonials", label: { ar: "آراء العملاء", en: "Testimonials" } },
        { href: "/contact", label: { ar: "تواصل معنا", en: "Contact" } },
        { href: "/book-demo", label: { ar: "احجز ديمو", en: "Book a Demo" } },
      ],
    },
    {
      title: t.legal,
      links: [
        { href: "/privacy", label: { ar: "سياسة الخصوصية", en: "Privacy Policy" } },
        { href: "/terms", label: { ar: "الشروط والأحكام", en: "Terms" } },
      ],
    },
  ];

  return (
    <footer className="mt-20 sm:mt-24 border-t border-app">
      <div className="max-w-7xl mx-auto safe-x px-4 sm:px-6 py-12 sm:py-14 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-10">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg" aria-label="ArqFlow">
            <BrandMark />
          </Link>
          <p className="text-muted text-sm mt-4 max-w-xs leading-relaxed">{t.tagline}</p>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline !py-2.5 text-sm mt-5 inline-flex"
          >
            <MessageCircle className="w-4 h-4" aria-hidden /> {t.whatsapp}
          </a>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="label-caps text-muted mb-4">{col.title}</p>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex items-center min-h-9 text-muted hover:text-app text-sm transition-colors"
                  >
                    {pick(l.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-app">
        <div className="max-w-7xl mx-auto safe-x px-4 sm:px-6 py-5 safe-b text-xs text-muted flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} ArqFlow. {t.rights}.</span>
          <span>Built with purpose. Designed to convert.</span>
        </div>
      </div>
    </footer>
  );
}
