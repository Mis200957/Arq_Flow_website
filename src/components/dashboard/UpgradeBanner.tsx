"use client";

import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { getModule } from "@/lib/modules";
import { CAPABILITY_META, type CapabilityKey } from "@/lib/capabilities";

/**
 * Contextual banner shown on the subscription page when the tenant arrived
 * from a locked feature (?upgrade=<key>). Resolves the key to a module or
 * capability label so the message names exactly what they were after.
 */
export default function UpgradeBanner({ upgradeKey }: { upgradeKey: string }) {
  const { lang } = useLang();

  const cap = CAPABILITY_META.find((c) => c.key === (upgradeKey as CapabilityKey));
  const mod = getModule(upgradeKey);
  const label = cap
    ? cap.label
    : mod
    ? mod.label
    : { ar: "هذه الميزة", en: "this feature" };

  const name = lang === "ar" ? label.ar : label.en;

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-[rgba(212,175,55,0.3)]">
      <div className="w-11 h-11 rounded-xl bg-[rgba(212,175,55,0.14)] flex items-center justify-center shrink-0">
        <Sparkles className="w-5 h-5 text-[#d4af37]" />
      </div>
      <div className="min-w-0">
        <p className="font-bold">
          {lang === "ar" ? `«${name}» متاحة في باقة أعلى` : `"${name}" is available on a higher plan`}
        </p>
        <p className="text-sm text-muted mt-0.5">
          {lang === "ar"
            ? "اختر الباقة المناسبة بالأسفل لفتح هذه الميزة وغيرها."
            : "Pick the right plan below to unlock this and more."}
        </p>
      </div>
    </div>
  );
}
