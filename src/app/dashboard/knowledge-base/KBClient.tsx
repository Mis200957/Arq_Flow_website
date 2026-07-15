"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Modal, Field, EmptyState, Badge, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type KBEntry = Tables<"knowledge_base">;
type KBKind = "faq" | "doc" | "policy" | "menu";

const KINDS: KBKind[] = ["faq", "doc", "policy", "menu"];

interface Props {
  businessId: string;
  initialEntries: KBEntry[];
}

const emptyForm = {
  kind: "faq" as KBKind,
  category: "",
  question: "",
  answer: "",
  language: "ar",
  tags: "",
};

export default function KBClient({ businessId, initialEntries }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      addEntry: "أضف إدخالاً", editEntry: "تعديل الإدخال", deleteConfirm: "حذف هذا الإدخال؟",
      kind: "النوع", category: "الفئة", question: "السؤال", answer: "الإجابة / المحتوى",
      language: "اللغة", tags: "التاجات (مفصولة بفاصلة)", save: "حفظ", saving: "جاري الحفظ...",
      noEntries: "لا توجد إدخالات", faq: "أسئلة شائعة", doc: "وثيقة", policy: "سياسة", menu: "قائمة",
      active: "نشط", inactive: "معطل",
    },
    en: {
      addEntry: "Add Entry", editEntry: "Edit Entry", deleteConfirm: "Delete this entry?",
      kind: "Kind", category: "Category", question: "Question", answer: "Answer / Content",
      language: "Language", tags: "Tags (comma separated)", save: "Save", saving: "Saving...",
      noEntries: "No entries yet", faq: "FAQ", doc: "Document", policy: "Policy", menu: "Menu",
      active: "Active", inactive: "Inactive",
    },
  });

  const [entries, setEntries] = useState(initialEntries);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<KBEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const grouped = KINDS.reduce((acc, k) => {
    acc[k] = entries.filter((e) => e.kind === k);
    return acc;
  }, {} as Record<KBKind, KBEntry[]>);

  const openAdd = () => {
    setForm(emptyForm);
    setEditTarget(null);
    setModal("add");
  };

  const openEdit = (entry: KBEntry) => {
    setForm({
      kind: entry.kind as KBKind,
      category: entry.category ?? "",
      question: entry.question ?? "",
      answer: entry.answer,
      language: entry.language,
      tags: entry.tags.join(", "),
    });
    setEditTarget(entry);
    setModal("edit");
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      business_id: businessId,
      kind: form.kind,
      category: form.category || null,
      question: form.question || null,
      answer: form.answer,
      language: form.language,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    if (modal === "add") {
      const { data, error } = await supabase.from("knowledge_base").insert(payload).select().single();
      if (!error && data) setEntries((prev) => [data, ...prev]);
    } else if (editTarget) {
      const { data, error } = await supabase
        .from("knowledge_base").update(payload).eq("id", editTarget.id).select().single();
      if (!error && data) setEntries((prev) => prev.map((e) => e.id === data.id ? data : e));
    }
    setSaving(false);
    setModal(null);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("knowledge_base").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleActive = async (entry: KBEntry) => {
    const { data } = await supabase
      .from("knowledge_base").update({ active: !entry.active }).eq("id", entry.id).select().single();
    if (data) setEntries((prev) => prev.map((e) => e.id === data.id ? data : e));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.addEntry}
        </button>
      </div>

      {entries.length === 0 && (
        <EmptyState icon={<BookOpen className="w-12 h-12" />} title={t.noEntries} action={
          <button onClick={openAdd} className="btn-primary">{t.addEntry}</button>
        } />
      )}

      {KINDS.map((kind) => {
        const kindEntries = grouped[kind];
        if (kindEntries.length === 0) return null;
        const kindLabel = t[kind];
        return (
          <div key={kind} className="card p-5">
            <h3 className="font-bold mb-4 capitalize">{kindLabel} ({kindEntries.length})</h3>
            <div className="space-y-2">
              {kindEntries.map((entry) => (
                <div key={entry.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 hover:bg-[rgba(27,27,30,0.04)] cursor-pointer"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.question ?? entry.category ?? entry.kind}</p>
                      {entry.category && <p className="text-xs text-muted">{entry.category}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleActive(entry); }}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          entry.active
                            ? "text-[var(--success)] border-[var(--success)] bg-[rgba(74,222,128,0.08)]"
                            : "text-muted border-[var(--border)]"
                        )}
                      >
                        {entry.active ? t.active : t.inactive}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(entry); }} className="btn-ghost !p-1.5">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="btn-ghost !p-1.5 text-[var(--danger)]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expanded === entry.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </div>
                  {expanded === entry.id && (
                    <div className="border-t border-[var(--border)] p-3 bg-[rgba(17,39,66,0.2)]">
                      <p className="text-sm text-muted whitespace-pre-wrap">{entry.answer}</p>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {entry.tags.map((tag) => <Badge key={tag} variant="accent">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? t.addEntry : t.editEntry} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.kind} required>
              <select className="input-base" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as KBKind }))}>
                {KINDS.map((k) => <option key={k} value={k}>{t[k]}</option>)}
              </select>
            </Field>
            <Field label={t.language}>
              <select className="input-base" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="both">Both</option>
              </select>
            </Field>
          </div>
          <Field label={t.category}>
            <input className="input-base" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          {form.kind === "faq" && (
            <Field label={t.question} required>
              <input className="input-base" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
            </Field>
          )}
          <Field label={t.answer} required>
            <textarea className="input-base min-h-28" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
          </Field>
          <Field label={t.tags}>
            <input className="input-base" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
          </Field>
          <button onClick={save} disabled={saving || !form.answer} className="btn-primary w-full">
            {saving ? <><Spinner className="w-4 h-4" /> {t.saving}</> : t.save}
          </button>
        </div>
      </Modal>
    </div>
  );
}
