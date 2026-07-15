"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useCapabilities } from "@/lib/capabilities-context";
import { CAPABILITY_META, type CapabilityKey } from "@/lib/capabilities";

/**
 * Shows which plan capabilities are active vs locked for the current
 * tenant. Surfaces the per-package feature distribution inside the
 * dashboard. Pass `only` to show a relevant subset (e.g. AI media flags).
 */
export default function CapabilitiesCard({
  title,
  only,
}: {
  title?: { ar: string; en: string };
  only?: CapabilityKey[];
}) {
  const { lang } = useLang();
  const caps = useCapabilities();
  const items = only
    ? CAPABILITY_META.filter((c) => only.includes(c.key))
    : CAPABILITY_META;
  const hasLocked = items.some((c) => !caps[c.key]);

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          {title ? (lang === "ar" ? title.ar : title.en) : lang === "ar" ? "مميزات باقتك" : "Your plan features"}
        </h3>
        {hasLocked && (
          <Link href="/dashboard/subscription" className="text-xs text-accent hover:underline shrink-0">
            {lang === "ar" ? "ترقية" : "Upgrade"}
          </Link>
        )}
      </div>

      <ul className="space-y-2.5">
        {items.map((c) => {
          const on = caps[c.key];
          return (
            <li key={c.key} className="flex items-start gap-3">
              <span
                className={
                  "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 " +
                  (on
                    ? "bg-[rgba(74,222,128,0.15)] text-[var(--success)]"
                    : "bg-[rgba(44,76,69,0.06)] text-muted")
                }
              >
                {on ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </span>
              <div className="min-w-0">
                <p className={"text-sm font-medium " + (on ? "text-app" : "text-muted")}>
                  {lang === "ar" ? c.label.ar : c.label.en}
                </p>
                <p className="text-xs text-muted">{lang === "ar" ? c.hint.ar : c.hint.en}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
