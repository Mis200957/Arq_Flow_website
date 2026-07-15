"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Modal, Field, EmptyState, Spinner, Badge } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ResourceDescriptor, FieldDef } from "@/lib/modules/resources";
import type { L10n } from "@/lib/modules";

type Row = Record<string, unknown>;
type RefData = Record<string, { id: string; label: string }[]>;

interface Props {
  businessId: string;
  title: L10n;
  descriptor: ResourceDescriptor;
  initialRows: Row[];
  refData: RefData;
}

const PAGE_SIZE = 10;

// Loosely-typed Supabase access for dynamically-named industry tables.
// (Existing typed pages keep full type-safety; only the generic engine opts out.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = { from: (t: string) => any };

function statusVariant(v: string): string {
  const s = v.toLowerCase();
  if (["cancelled", "lost", "expired", "no_show", "dropped"].includes(s)) return "danger";
  if (["completed", "done", "won", "active", "confirmed", "checked_out", "matched", "available"].includes(s)) return "success";
  if (["pending", "new", "waiting", "in_review", "scheduled", "open", "cleaning"].includes(s)) return "warning";
  return "accent";
}

export default function ResourceClient({ businessId, title, descriptor, initialRows, refData }: Props) {
  const { lang, dir } = useLang();
  const pick = (l: L10n) => (lang === "ar" ? l.ar : l.en);
  const supabase = useMemo(() => createClient() as unknown as AnyDb, []);

  const tr = {
    add: lang === "ar" ? "إضافة" : "Add",
    edit: lang === "ar" ? "تعديل" : "Edit",
    save: lang === "ar" ? "حفظ" : "Save",
    saving: lang === "ar" ? "جاري الحفظ..." : "Saving...",
    search: lang === "ar" ? "بحث..." : "Search...",
    all: lang === "ar" ? "الكل" : "All",
    empty: lang === "ar" ? "لا توجد عناصر بعد" : "No items yet",
    noMatch: lang === "ar" ? "لا نتائج مطابقة" : "No matching results",
    deleteConfirm: lang === "ar" ? "حذف هذا العنصر؟" : "Delete this item?",
    yes: lang === "ar" ? "نعم" : "Yes",
    no: lang === "ar" ? "لا" : "No",
    actions: lang === "ar" ? "إجراءات" : "Actions",
    of: lang === "ar" ? "من" : "of",
    page: lang === "ar" ? "صفحة" : "Page",
    required: lang === "ar" ? "حقل مطلوب" : "Required",
  };

  const listFields = descriptor.fields.filter((f) => f.list);
  const filterFields = descriptor.fields.filter((f) => f.filter);
  const searchFields = descriptor.fields.filter((f) => f.search).map((f) => f.key).concat(descriptor.titleField);
  const editableFields = descriptor.fields.filter((f) => !f.fixed);

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const refLabel = (fieldKey: string, id: unknown): string => {
    if (!id) return "—";
    const o = (refData[fieldKey] ?? []).find((r) => r.id === id);
    return o ? o.label : "—";
  };

  const display = (f: FieldDef, row: Row): ReactNode => {
    const v = row[f.key];
    if (v === null || v === undefined || v === "") return <span className="text-muted">—</span>;
    if (f.type === "ref") return refLabel(f.key, v);
    if (f.type === "money") return formatEGP(Number(v), lang);
    if (f.type === "boolean") return v ? tr.yes : tr.no;
    if (f.type === "tags") return Array.isArray(v) ? v.join("، ") : String(v);
    if (f.type === "datetime") return new Date(String(v)).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "short", timeStyle: "short" });
    if (f.type === "date") return new Date(String(v)).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");
    if (f.type === "select") {
      const o = f.options?.find((x) => x.value === String(v));
      const label = o ? pick(o.label) : String(v);
      if (f.key === "status") return <Badge variant={statusVariant(String(v))}>{label}</Badge>;
      return label;
    }
    return String(v);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (term) {
        const hit = searchFields.some((k) => String(row[k] ?? "").toLowerCase().includes(term));
        if (!hit) return false;
      }
      for (const [k, val] of Object.entries(filters)) {
        if (!val) continue;
        if (String(row[k] ?? "") !== val) return false;
      }
      return true;
    });
  }, [rows, q, filters, searchFields]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toInputValue = (f: FieldDef, v: unknown): string | boolean => {
    if (f.type === "boolean") return v === true;
    if (v === null || v === undefined) return "";
    if (f.type === "tags") return Array.isArray(v) ? v.join(", ") : String(v);
    if (f.type === "datetime") {
      const d = new Date(String(v));
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (f.type === "date") return String(v).slice(0, 10);
    return String(v);
  };

  const openAdd = () => {
    const init: Record<string, string | boolean> = {};
    editableFields.forEach((f) => { init[f.key] = f.type === "boolean" ? true : ""; });
    setForm(init); setErrors({}); setEditTarget(null); setModal("add");
  };
  const openEdit = (row: Row) => {
    const init: Record<string, string | boolean> = {};
    editableFields.forEach((f) => { init[f.key] = toInputValue(f, row[f.key]); });
    setForm(init); setErrors({}); setEditTarget(row); setModal("edit");
  };

  const buildPayload = (): Row => {
    const out: Row = { business_id: businessId };
    for (const f of descriptor.fields) {
      if (f.fixed !== undefined) { out[f.key] = f.fixed; continue; }
      const raw = form[f.key];
      if (f.type === "boolean") { out[f.key] = raw === true; continue; }
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s === "") { out[f.key] = null; continue; }
      if (f.type === "number") out[f.key] = parseInt(s, 10);
      else if (f.type === "money") out[f.key] = parseFloat(s);
      else if (f.type === "tags") out[f.key] = s.split(",").map((x) => x.trim()).filter(Boolean);
      else if (f.type === "datetime") out[f.key] = new Date(s).toISOString();
      else out[f.key] = s;
    }
    return out;
  };

  const validate = (): boolean => {
    const e: Record<string, boolean> = {};
    for (const f of editableFields) {
      if (f.required) {
        const v = form[f.key];
        if (f.type === "boolean") continue;
        if (typeof v !== "string" || !v.trim()) e[f.key] = true;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = buildPayload();
    try {
      if (modal === "add") {
        const { data } = await supabase.from(descriptor.table).insert(payload).select().single();
        if (data) setRows((prev) => [data as Row, ...prev]);
      } else if (editTarget) {
        const { data } = await supabase.from(descriptor.table).update(payload).eq("id", editTarget.id as string).select().single();
        if (data) setRows((prev) => prev.map((r) => (r.id === (data as Row).id ? (data as Row) : r)));
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(tr.deleteConfirm)) return;
    await supabase.from(descriptor.table).delete().eq("id", row.id as string);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const filterOptions = (f: FieldDef): { value: string; label: string }[] => {
    if (f.type === "boolean") return [{ value: "true", label: tr.yes }, { value: "false", label: tr.no }];
    if (f.type === "ref") return (refData[f.key] ?? []).map((o) => ({ value: o.id, label: o.label }));
    return (f.options ?? []).map((o) => ({ value: o.value, label: pick(o.label) }));
  };

  return (
    <div className="space-y-4" dir={dir}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
          <input
            className="input-base !ps-9"
            placeholder={tr.search}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        {filterFields.map((f) => (
          <select
            key={f.key}
            className="input-base !w-auto"
            value={filters[f.key] ?? ""}
            onChange={(e) => { setFilters((prev) => ({ ...prev, [f.key]: e.target.value })); setPage(0); }}
          >
            <option value="">{pick(f.label)}: {tr.all}</option>
            {filterOptions(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> {tr.add}
        </button>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <EmptyState icon={<Inbox className="w-12 h-12" />} title={tr.empty}
          action={<button onClick={openAdd} className="btn-primary">{tr.add}</button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-12 h-12" />} title={tr.noMatch} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-muted">
                {listFields.map((f) => (
                  <th key={f.key} className="text-start font-semibold px-4 py-3 whitespace-nowrap">{pick(f.label)}</th>
                ))}
                <th className="px-4 py-3 text-end font-semibold">{tr.actions}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={String(row.id)} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(44,76,69,0.04)]">
                  {listFields.map((f) => (
                    <td key={f.key} className="px-4 py-3 whitespace-nowrap">{display(f, row)}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(row)} className="btn-ghost !p-1.5" aria-label={tr.edit}><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(row)} className="btn-ghost !p-1.5 text-[var(--danger)]" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{filtered.length} {tr.of} {rows.length}</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost !p-2" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className={cn("w-4 h-4", dir === "rtl" && "rotate-180")} />
            </button>
            <span>{tr.page} {safePage + 1} / {pageCount}</span>
            <button className="btn-ghost !p-2" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              <ChevronRight className={cn("w-4 h-4", dir === "rtl" && "rotate-180")} />
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={`${modal === "add" ? tr.add : tr.edit} — ${pick(title)}`} wide>
        <div className="grid sm:grid-cols-2 gap-4">
          {editableFields.map((f) => {
            const val = form[f.key];
            const full = f.type === "textarea";
            return (
              <div key={f.key} className={cn(full && "sm:col-span-2")}>
                <Field label={pick(f.label)} required={f.required} error={errors[f.key] ? tr.required : undefined}>
                  {f.type === "textarea" ? (
                    <textarea className="input-base min-h-20" value={String(val ?? "")} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                  ) : f.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={val === true} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.checked }))} />
                      <span className="text-sm text-muted">{val === true ? tr.yes : tr.no}</span>
                    </label>
                  ) : f.type === "select" ? (
                    <select className="input-base" value={String(val ?? "")} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}>
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{pick(o.label)}</option>)}
                    </select>
                  ) : f.type === "ref" ? (
                    <select className="input-base" value={String(val ?? "")} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}>
                      <option value="">—</option>
                      {(refData[f.key] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      className="input-base"
                      type={f.type === "number" || f.type === "money" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text"}
                      value={String(val ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
            );
          })}
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full mt-5">
          {saving ? <><Spinner className="w-4 h-4" /> {tr.saving}</> : tr.save}
        </button>
      </Modal>
    </div>
  );
}
