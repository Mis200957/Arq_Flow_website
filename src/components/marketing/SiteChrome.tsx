"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

export function SiteHeader() {
  const { lang, setLang, pick } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT({
    ar: { login: "تسجيل الدخول", demo: "احجز ديمو", start: "ابدأ الآن" },
    en: { login: "Login", demo: "Book a Demo", start: "Get Started" },
  });

  return (
    <header className="sticky top-0 z-40">
      <div className="glass-strong !rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="gradient-text">ArqFlow</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-app bg-[rgba(238,237,210,0.08)]"
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
              <Globe className="w-4 h-4" />
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <Link href="/login" className="btn-ghost text-sm">{t.login}</Link>
            <Link href="/pricing" className="btn-primary !py-2.5 text-sm">{t.start}</Link>
          </div>

          <button className="lg:hidden btn-ghost !p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden glass-strong !rounded-none border-x-0 px-4 py-4 flex flex-col gap-1"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-app"
              >
                {pick(item.label)}
              </Link>
            ))}
            <div className="section-divider my-2" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="btn-outline !py-2 flex-1 text-sm"
              >
                {lang === "ar" ? "English" : "عربي"}
              </button>
              <Link href="/login" onClick={() => setOpen(false)} className="btn-outline !py-2 flex-1 text-sm">
                {t.login}
              </Link>
            </div>
            <Link href="/pricing" onClick={() => setOpen(false)} className="btn-primary mt-2">
              {t.start}
            </Link>
          </motion.div>
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
    <footer className="mt-24 border-t border-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-white">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="gradient-text">ArqFlow</span>
          </Link>
          <p className="text-muted text-sm mt-4 max-w-xs leading-relaxed">{t.tagline}</p>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline !py-2 text-sm mt-5 inline-flex"
          >
            <MessageCircle className="w-4 h-4" /> {t.whatsapp}
          </a>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <p className="font-bold text-sm mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted hover:text-app text-sm transition-colors">
                    {pick(l.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-app">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-xs text-muted flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} ArqFlow. {t.rights}.</span>
          <span>Built with purpose. Designed to convert.</span>
        </div>
      </div>
    </footer>
  );
}
