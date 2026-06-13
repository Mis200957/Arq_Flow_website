"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Package, ImageIcon } from "lucide-react";
import { Modal, Field, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Product = Tables<"products">;

interface Props {
  businessId: string;
  initialProducts: Product[];
}

const emptyForm = { name: "", price_egp: "", category: "", description: "", available: true };

export default function ProductsClient({ businessId, initialProducts }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      addProduct: "أضف منتجاً", editProduct: "تعديل المنتج", name: "الاسم*", price: "السعر (ج.م)",
      category: "الفئة", description: "الوصف", available: "متاح", save: "حفظ", saving: "جاري الحفظ...",
      delete: "حذف", deleteConfirm: "حذف هذا المنتج؟", noProducts: "لا توجد منتجات",
      image: "رابط الصورة",
    },
    en: {
      addProduct: "Add Product", editProduct: "Edit Product", name: "Name*", price: "Price (EGP)",
      category: "Category", description: "Description", available: "Available", save: "Save", saving: "Saving...",
      delete: "Delete", deleteConfirm: "Delete this product?", noProducts: "No products yet",
      image: "Image URL",
    },
  });

  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const openAdd = () => { setForm(emptyForm); setEditTarget(null); setModal("add"); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, price_egp: p.price_egp?.toString() ?? "", category: p.category ?? "", description: p.description ?? "", available: p.available });
    setEditTarget(p);
    setModal("edit");
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      business_id: businessId,
      name: form.name.trim(),
      price_egp: form.price_egp ? parseFloat(form.price_egp) : null,
      category: form.category || null,
      description: form.description || null,
      available: form.available,
    };
    if (modal === "add") {
      const { data } = await supabase.from("products").insert({ ...payload, sort_order: products.length }).select().single();
      if (data) setProducts((prev) => [...prev, data]);
    } else if (editTarget) {
      const { data } = await supabase.from("products").update(payload).eq("id", editTarget.id).select().single();
      if (data) setProducts((prev) => prev.map((p) => p.id === data.id ? data : p));
    }
    setSaving(false);
    setModal(null);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleAvailable = async (product: Product) => {
    const { data } = await supabase.from("products").update({ available: !product.available }).eq("id", product.id).select().single();
    if (data) setProducts((prev) => prev.map((p) => p.id === data.id ? data : p));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.addProduct}
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<Package className="w-12 h-12" />} title={t.noProducts} action={
          <button onClick={openAdd} className="btn-primary">{t.addProduct}</button>
        } />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className={cn("card p-4 card-hover", !p.available && "opacity-60")}>
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-[rgba(238,237,210,0.05)] flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted" />
                )}
              </div>
              <p className="font-bold text-sm truncate">{p.name}</p>
              {p.category && <p className="text-xs text-muted mt-0.5">{p.category}</p>}
              {p.price_egp != null && <p className="text-accent font-semibold text-sm mt-1">{formatEGP(p.price_egp, lang)}</p>}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => toggleAvailable(p)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border transition-all",
                    p.available
                      ? "text-[var(--success)] border-[var(--success)] bg-[rgba(74,222,128,0.08)]"
                      : "text-muted border-[var(--border)]"
                  )}
                >
                  {p.available ? t.available : "—"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="btn-ghost !p-1.5"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteProduct(p.id)} className="btn-ghost !p-1.5 text-[var(--danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? t.addProduct : t.editProduct}>
        <div className="space-y-4">
          <Field label={t.name} required>
            <input className="input-base" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.price}>
              <input type="number" className="input-base" value={form.price_egp} onChange={(e) => setForm((f) => ({ ...f, price_egp: e.target.value }))} />
            </Field>
            <Field label={t.category}>
              <input className="input-base" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </Field>
          </div>
          <Field label={t.description}>
            <textarea className="input-base min-h-20" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">{t.available}</span>
          </label>
          <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? <><Spinner className="w-4 h-4" /> {t.saving}</> : t.save}
          </button>
        </div>
      </Modal>
    </div>
  );
}
