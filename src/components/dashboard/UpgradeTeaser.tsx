"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * Locked-feature upsell banner. Used to advertise a higher-tier feature
 * (e.g. advanced analytics) instead of hiding it — the "lock" half of the
 * mixed gating strategy.
 */
export default function UpgradeTeaser({
  title,
  description,
  upgradeKey,
}: {
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  /** Appended as ?upgrade= so the subscription page can highlight context. */
  upgradeKey?: string;
}) {
  const { lang } = useLang();
  const href = `/dashboard/subscription${upgradeKey ? `?upgrade=${upgradeKey}` : ""}`;
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-[rgba(212,175,55,0.25)]">
      <div className="w-11 h-11 rounded-xl bg-[rgba(212,175,55,0.14)] flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-[#d4af37]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{lang === "ar" ? title.ar : title.en}</p>
        <p className="text-sm text-muted mt-0.5">{lang === "ar" ? description.ar : description.en}</p>
      </div>
      <Link href={href} className="btn-primary text-sm shrink-0">
        {lang === "ar" ? "ترقية الباقة" : "Upgrade"}
        <ArrowRight className={lang === "ar" ? "w-4 h-4 rotate-180" : "w-4 h-4"} />
      </Link>
    </div>
  );
}
