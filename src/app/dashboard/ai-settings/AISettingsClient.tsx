"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, RefreshCw, ChevronDown, ChevronUp, Save, CheckCircle2, Clock } from "lucide-react";
import { Field, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";

type Business = Tables<"businesses">;

interface Props { business: Business; }

const TONES = [
  { value: "professional", ar: "احترافي", en: "Professional" },
  { value: "friendly", ar: "ودود", en: "Friendly" },
  { value: "casual", ar: "غير رسمي", en: "Casual" },
];
const FALLBACKS = [
  { value: "human_handoff", ar: "تحويل لموظف", en: "Hand off to human" },
  { value: "ask_contact", ar: "طلب التواصل", en: "Ask for contact info" },
  { value: "apologize", ar: "اعتذار", en: "Apologize and retry" },
];

/** Saving hands the fresh settings to n8n (automation_logs → AUTOMATION_ROUTER
 *  → SHARED_GENERATE_PROMPT); the router drains the queue every minute, so a
 *  sync normally lands within ~90s. */
type SyncState = "idle" | "syncing" | "synced" | "queued";
interface AiJob { id: string; workflow: string; processed_at: string | null }
const POLL_MS = 5000;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

export default function AISettingsClient({ business }: Props) {
  const router = useRouter();
  const { lang } = useLang();
  const t = useT({
    ar: {
      tone: "نبرة الصوت", fallback: "سلوك الاحتياط", greeting: "رسالة الترحيب",
      personality: "شخصية المساعد", goal: "الهدف الأساسي", languages: "اللغات المدعومة",
      systemPrompt: "الـ System Prompt (للمطلعين)", save: "حفظ التغييرات", saving: "جاري الحفظ...",
      saved: "تم الحفظ", regenerate: "إعادة توليد الـ Prompt", regenerating: "جاري التوليد...",
      showPrompt: "عرض الـ System Prompt", hidePrompt: "إخفاء الـ System Prompt",
      syncing: "جاري مزامنة الإعدادات مع البوت عبر n8n...",
      synced: "تمت مزامنة البوت بالإعدادات الجديدة",
      syncQueued: "في قائمة الانتظار — هيتم تحديث البوت خلال دقائق",
    },
    en: {
      tone: "Tone of voice", fallback: "Fallback behavior", greeting: "Greeting message",
      personality: "Assistant personality", goal: "Primary goal", languages: "Supported languages",
      systemPrompt: "System Prompt (advanced)", save: "Save changes", saving: "Saving...",
      saved: "Saved", regenerate: "Regenerate Prompt", regenerating: "Regenerating...",
      showPrompt: "Show System Prompt", hidePrompt: "Hide System Prompt",
      syncing: "Syncing settings to your bot via n8n...",
      synced: "Bot synced with the new settings",
      syncQueued: "Queued — the bot will update within a few minutes",
    },
  });

  const [form, setForm] = useState({
    tone_of_voice: business.tone_of_voice ?? "professional",
    fallback_behavior: business.fallback_behavior ?? "human_handoff",
    greeting_message: business.greeting_message ?? "",
    assistant_personality: business.assistant_personality ?? "",
    primary_goal: business.primary_goal ?? "",
    languages: business.languages ?? ["ar"],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  // Poll the n8n job queue until the prompt rebuild is processed, then pull
  // the regenerated system prompt into the page via router.refresh().
  const watchSync = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    setSyncState("syncing");
    const startedAt = Date.now();
    const tick = async () => {
      try {
        const res = await fetch("/api/dashboard/ai", { cache: "no-store" });
        if (res.ok) {
          const { jobs } = (await res.json()) as { jobs: AiJob[] };
          const busy = jobs.some((j) => j.workflow === "regenerate_system_prompt" && !j.processed_at);
          if (!busy) {
            setSyncState("synced");
            router.refresh();
            pollRef.current = setTimeout(() => setSyncState("idle"), 6000);
            return;
          }
        }
      } catch { /* transient — keep polling */ }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) { setSyncState("queued"); return; }
      pollRef.current = setTimeout(tick, POLL_MS);
    };
    pollRef.current = setTimeout(tick, POLL_MS);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/dashboard/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_profile", ...form }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      const json = await res.json().catch(() => null);
      if (json?.synced) watchSync();
    }
  };

  const regeneratePrompt = async () => {
    setRegenerating(true);
    const res = await fetch("/api/dashboard/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate_prompt" }),
    });
    setRegenerating(false);
    if (res.ok) watchSync();
  };

  const toggleLang = (l: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(l)
        ? f.languages.filter((x) => x !== l)
        : [...f.languages, l],
    }));
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Two-up: Tone + Fallback side-by-side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      {/* Tone */}
      <div className="card p-6">
        <h3 className="font-bold mb-4">{t.tone}</h3>
        <div className="grid grid-cols-3 gap-3">
          {TONES.map(({ value, ar, en }) => (
            <button
              key={value}
              onClick={() => setForm((f) => ({ ...f, tone_of_voice: value }))}
              className={cn(
                "p-4 rounded-xl border text-center text-sm font-semibold transition-all",
                form.tone_of_voice === value
                  ? "bg-[rgba(27,27,30,0.2)] border-[var(--accent)] text-accent"
                  : "border-[var(--border)] text-muted hover:border-[var(--border-strong)]"
              )}
            >
              {lang === "ar" ? ar : en}
            </button>
          ))}
        </div>
      </div>

      {/* Fallback */}
      <div className="card p-6">
        <h3 className="font-bold mb-4">{t.fallback}</h3>
        <div className="space-y-2">
          {FALLBACKS.map(({ value, ar, en }) => (
            <button
              key={value}
              onClick={() => setForm((f) => ({ ...f, fallback_behavior: value }))}
              className={cn(
                "w-full p-3 rounded-xl border text-start text-sm font-semibold transition-all",
                form.fallback_behavior === value
                  ? "bg-[rgba(27,27,30,0.2)] border-[var(--accent)] text-accent"
                  : "border-[var(--border)] text-muted hover:border-[var(--border-strong)]"
              )}
            >
              {lang === "ar" ? ar : en}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Text fields */}
      <div className="card p-6 space-y-4">
        <Field label={t.greeting}>
          <textarea
            className="input-base min-h-20"
            value={form.greeting_message}
            onChange={(e) => setForm((f) => ({ ...f, greeting_message: e.target.value }))}
          />
        </Field>
        <Field label={t.personality}>
          <textarea
            className="input-base min-h-20"
            value={form.assistant_personality}
            onChange={(e) => setForm((f) => ({ ...f, assistant_personality: e.target.value }))}
          />
        </Field>
        <Field label={t.goal}>
          <input
            className="input-base"
            value={form.primary_goal}
            onChange={(e) => setForm((f) => ({ ...f, primary_goal: e.target.value }))}
          />
        </Field>
        <div>
          <p className="text-sm font-semibold mb-2">{t.languages}</p>
          <div className="flex gap-2">
            {["ar", "en"].map((l) => (
              <button
                key={l}
                onClick={() => toggleLang(l)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                  form.languages.includes(l)
                    ? "bg-[rgba(27,27,30,0.2)] border-[var(--accent)] text-accent"
                    : "border-[var(--border)] text-muted"
                )}
              >
                {l === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System prompt */}
      <div className="card p-5">
        <button
          onClick={() => setShowPrompt((s) => !s)}
          className="w-full flex items-center justify-between font-semibold"
        >
          <span>{showPrompt ? t.hidePrompt : t.showPrompt}</span>
          {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showPrompt && business.system_prompt && (
          <pre className="mt-4 text-xs bg-[rgba(7,15,28,0.5)] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap text-muted">
            {business.system_prompt}
          </pre>
        )}
        <button
          onClick={regeneratePrompt}
          disabled={regenerating}
          className="btn-outline mt-4 flex items-center gap-2 text-sm"
        >
          {regenerating ? <Spinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          {regenerating ? t.regenerating : t.regenerate}
        </button>
      </div>

      {/* n8n bot-sync status */}
      {syncState !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold",
            syncState === "synced"
              ? "border-[var(--success)] text-[var(--success)] bg-[rgba(74,222,128,0.08)]"
              : "border-[var(--accent)] text-accent bg-[rgba(107,160,172,0.08)]"
          )}
        >
          {syncState === "syncing" && <Spinner className="w-4 h-4 shrink-0" />}
          {syncState === "synced" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {syncState === "queued" && <Clock className="w-4 h-4 shrink-0" />}
          <span>{syncState === "syncing" ? t.syncing : syncState === "synced" ? t.synced : t.syncQueued}</span>
        </div>
      )}

      {/* Save */}
      <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <><Spinner className="w-4 h-4" /> {t.saving}</> : saved ? <><Bot className="w-4 h-4" /> {t.saved}</> : <><Save className="w-4 h-4" /> {t.save}</>}
      </button>
    </div>
  );
}
