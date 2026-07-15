"use client";

import { useState, useMemo } from "react";
import { Plus, Send, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Modal, Field, Badge, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatDateTime, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Broadcast = Tables<"broadcasts">;

interface Props {
  businessId: string;
  initialBroadcasts: Broadcast[];
  allTags: string[];
}

const emptyForm = { title: "", content: "", audience_tags: [] as string[], schedule: "immediate", scheduled_at: "" };

function StatusIcon({ status }: { status: string }) {
  if (status === "sent") return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />;
  if (status === "failed") return <XCircle className="w-4 h-4 text-[var(--danger)]" />;
  if (status === "sending") return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
  return <Clock className="w-4 h-4 text-muted" />;
}

export default function BroadcastsClient({ businessId, initialBroadcasts, allTags }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      newBroadcast: "رسالة إذاعية جديدة", title: "العنوان*", content: "المحتوى*",
      audience: "الجمهور (تاجات)", schedule: "الجدول", immediate: "فوري", scheduled: "مجدول",
      scheduledAt: "وقت الإرسال", send: "إرسال / جدولة", sending: "جاري الإرسال...",
      noBroadcasts: "لا توجد رسائل إذاعية", sent: "مُرسل", failed: "فشل", queued: "في الانتظار",
      draft: "مسودة", sending2: "جاري الإرسال",
      sentCount: "مُرسل", failedCount: "فشل",
    },
    en: {
      newBroadcast: "New Broadcast", title: "Title*", content: "Content*",
      audience: "Audience (tags)", schedule: "Schedule", immediate: "Immediate", scheduled: "Scheduled",
      scheduledAt: "Send at", send: "Send / Schedule", sending: "Sending...",
      noBroadcasts: "No broadcasts yet", sent: "Sent", failed: "Failed", queued: "Queued",
      draft: "Draft", sending2: "Sending",
      sentCount: "Sent", failedCount: "Failed",
    },
  });

  const [broadcasts, setBroadcasts] = useState(initialBroadcasts);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      audience_tags: f.audience_tags.includes(tag)
        ? f.audience_tags.filter((t) => t !== tag)
        : [...f.audience_tags, tag],
    }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("broadcasts")
      .insert({
        business_id: businessId,
        title: form.title.trim(),
        content: form.content.trim(),
        audience_tags: form.audience_tags,
        scheduled_at: form.schedule === "scheduled" && form.scheduled_at ? form.scheduled_at : null,
        status: "queued",
      })
      .select()
      .single();
    if (data) setBroadcasts((prev) => [data, ...prev]);
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.newBroadcast}
        </button>
      </div>

      {broadcasts.length === 0 ? (
        <EmptyState icon={<Send className="w-12 h-12" />} title={t.noBroadcasts} action={
          <button onClick={() => setModal(true)} className="btn-primary">{t.newBroadcast}</button>
        } />
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start gap-3">
                <StatusIcon status={b.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{b.title}</p>
                    <Badge variant={STATUS_BADGE[b.status] ?? "neutral"}>{b.status}</Badge>
                  </div>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{b.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted flex-wrap">
                    <span>{formatDateTime(b.created_at, lang)}</span>
                    {b.status === "sent" && (
                      <>
                        <span className="text-[var(--success)]">{t.sentCount}: {b.sent_count}</span>
                        {b.failed_count > 0 && <span className="text-[var(--danger)]">{t.failedCount}: {b.failed_count}</span>}
                      </>
                    )}
                    {b.audience_tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {b.audience_tags.map((tag) => <Badge key={tag} variant="accent">{tag}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t.newBroadcast} wide>
        <div className="space-y-4">
          <Field label={t.title} required>
            <input className="input-base" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label={t.content} required>
            <textarea className="input-base min-h-28" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
          </Field>
          {allTags.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">{t.audience}</p>
              <div className="flex flex-wrap gap-1">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-all",
                      form.audience_tags.includes(tag)
                        ? "bg-[rgba(27,27,30,0.2)] text-accent border-[var(--accent)]"
                        : "text-muted border-[var(--border)]"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold mb-2">{t.schedule}</p>
            <div className="flex gap-2">
              {["immediate", "scheduled"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setForm((f) => ({ ...f, schedule: opt }))}
                  className={cn(
                    "text-sm px-4 py-2 rounded-xl border transition-all",
                    form.schedule === opt
                      ? "bg-[rgba(27,27,30,0.2)] text-accent border-[var(--accent)]"
                      : "text-muted border-[var(--border)]"
                  )}
                >
                  {opt === "immediate" ? t.immediate : t.scheduled}
                </button>
              ))}
            </div>
          </div>
          {form.schedule === "scheduled" && (
            <Field label={t.scheduledAt}>
              <input type="datetime-local" className="input-base" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} />
            </Field>
          )}
          <button onClick={submit} disabled={saving || !form.title.trim() || !form.content.trim()} className="btn-primary w-full">
            {saving ? <><Spinner className="w-4 h-4" /> {t.sending}</> : <><Send className="w-4 h-4" /> {t.send}</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
