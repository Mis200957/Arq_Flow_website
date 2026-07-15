"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Wrench, Clock } from "lucide-react";
import { Modal, Field, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Service = Tables<"services">;

interface Props {
  businessId: string;
  initialServices: Service[];
}

const emptyForm = { name: "", price_egp: "", category: "", description: "", duration_minutes: "", active: true };

export default function ServicesClient({ businessId, initialServices }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      addService: "أضف خدمة", editService: "تعديل الخدمة", name: "الاسم*", price: "السعر (ج.م)",
      category: "الفئة", description: "الوصف", duration: "المدة (دقائق)", active: "نشط",
      save: "حفظ", saving: "جاري الحفظ...", deleteConfirm: "حذف هذه الخدمة؟", noServices: "لا توجد خدمات",
      min: "دقيقة",
    },
    en: {
      addService: "Add Service", editService: "Edit Service", name: "Name*", price: "Price (EGP)",
      category: "Category", description: "Description", duration: "Duration (minutes)", active: "Active",
      save: "Save", saving: "Saving...", deleteConfirm: "Delete this service?", noServices: "No services yet",
      min: "min",
    },
  });

  const [services, setServices] = useState(initialServices);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const openAdd = () => { setForm(emptyForm); setEditTarget(null); setModal("add"); };
  const openEdit = (s: Service) => {
    setForm({
      name: s.name, price_egp: s.price_egp?.toString() ?? "", category: s.category ?? "",
      description: s.description ?? "", duration_minutes: s.duration_minutes?.toString() ?? "", active: s.active,
    });
    setEditTarget(s); setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      business_id: businessId, name: form.name.trim(),
      price_egp: form.price_egp ? parseFloat(form.price_egp) : null,
      category: form.category || null, description: form.description || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      active: form.active,
    };
    if (modal === "add") {
      const { data } = await supabase.from("services").insert(payload).select().single();
      if (data) setServices((prev) => [data, ...prev]);
    } else if (editTarget) {
      const { data } = await supabase.from("services").update(payload).eq("id", editTarget.id).select().single();
      if (data) setServices((prev) => prev.map((s) => s.id === data.id ? data : s));
    }
    setSaving(false); setModal(null);
  };

  const deleteService = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleActive = async (service: Service) => {
    const { data } = await supabase.from("services").update({ active: !service.active }).eq("id", service.id).select().single();
    if (data) setServices((prev) => prev.map((s) => s.id === data.id ? data : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.addService}
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={<Wrench className="w-12 h-12" />} title={t.noServices} action={
          <button onClick={openAdd} className="btn-primary">{t.addService}</button>
        } />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className={cn("card p-5 card-hover", !s.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(184,144,99,0.12)] flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-accent" />
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border",
                    s.active ? "text-[var(--success)] border-[var(--success)] bg-[rgba(74,222,128,0.08)]" : "text-muted border-[var(--border)]"
                  )}
                >
                  {s.active ? t.active : "—"}
                </button>
              </div>
              <p className="font-bold truncate">{s.name}</p>
              {s.category && <p className="text-xs text-muted mt-0.5">{s.category}</p>}
              {s.description && <p className="text-sm text-muted mt-1 line-clamp-2">{s.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  {s.price_egp != null && <span className="text-accent font-semibold text-sm">{formatEGP(s.price_egp, lang)}</span>}
                  {s.duration_minutes && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="w-3 h-3" />{s.duration_minutes} {t.min}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="btn-ghost !p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteService(s.id)} className="btn-ghost !p-1.5 text-[var(--danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? t.addService : t.editService}>
        <div className="space-y-4">
          <Field label={t.name} required>
            <input className="input-base" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.price}>
              <input type="number" className="input-base" value={form.price_egp} onChange={(e) => setForm((f) => ({ ...f, price_egp: e.target.value }))} />
            </Field>
            <Field label={t.duration}>
              <input type="number" className="input-base" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} />
            </Field>
          </div>
          <Field label={t.category}>
            <input className="input-base" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </Field>
          <Field label={t.description}>
            <textarea className="input-base min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">{t.active}</span>
          </label>
          <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? <><Spinner className="w-4 h-4" /> {t.saving}</> : t.save}
          </button>
        </div>
      </Modal>
    </div>
  );
}
