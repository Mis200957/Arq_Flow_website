"use client";

import { useState, useMemo, useRef } from "react";
import { Plus, Edit2, Trash2, Package, ImageIcon, Upload, X as XIcon } from "lucide-react";
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

const emptyForm = { name: "", price_egp: "", category: "", description: "", available: true, image_url: "" as string | null };

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB cap on the source file (Base64 is ~33% larger)

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProductsClient({ businessId, initialProducts }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      addProduct: "أضف منتجاً", editProduct: "تعديل المنتج", name: "الاسم*", price: "السعر (ج.م)",
      category: "الفئة", description: "الوصف", available: "متاح", save: "حفظ", saving: "جاري الحفظ...",
      delete: "حذف", deleteConfirm: "حذف هذا المنتج؟", noProducts: "لا توجد منتجات",
      image: "صورة المنتج", uploadImage: "اختر صورة", removeImage: "إزالة الصورة",
      imageTooBig: "حجم الصورة كبير جداً (الحد الأقصى 2 ميجابايت)",
      imageInvalid: "نوع الملف غير مدعوم",
    },
    en: {
      addProduct: "Add Product", editProduct: "Edit Product", name: "Name*", price: "Price (EGP)",
      category: "Category", description: "Description", available: "Available", save: "Save", saving: "Saving...",
      delete: "Delete", deleteConfirm: "Delete this product?", noProducts: "No products yet",
      image: "Product image", uploadImage: "Choose image", removeImage: "Remove image",
      imageTooBig: "Image too large (max 2 MB)",
      imageInvalid: "Unsupported file type",
    },
  });

  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const openAdd = () => { setForm(emptyForm); setEditTarget(null); setImageError(null); setModal("add"); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      price_egp: p.price_egp?.toString() ?? "",
      category: p.category ?? "",
      description: p.description ?? "",
      available: p.available,
      image_url: p.image_url ?? "",
    });
    setEditTarget(p);
    setImageError(null);
    setModal("edit");
  };

  const handleImageSelect = async (file: File | undefined) => {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImageError(t.imageInvalid); return; }
    if (file.size > MAX_IMAGE_BYTES) { setImageError(t.imageTooBig); return; }
    try {
      const base64 = await fileToBase64(file);
      setForm((f) => ({ ...f, image_url: base64 }));
    } catch {
      setImageError(t.imageInvalid);
    }
  };

  const clearImage = () => {
    setForm((f) => ({ ...f, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      image_url: form.image_url ? form.image_url : null,
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
              <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-[rgba(44,76,69,0.05)] flex items-center justify-center">
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
          <Field label={t.image}>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-[rgba(44,76,69,0.05)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                {form.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted" />
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline !px-3 !py-1.5 text-xs flex items-center gap-1.5 self-start"
                >
                  <Upload className="w-3.5 h-3.5" /> {t.uploadImage}
                </button>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="btn-ghost !px-2 !py-1 text-xs text-[var(--danger)] flex items-center gap-1.5 self-start"
                  >
                    <XIcon className="w-3 h-3" /> {t.removeImage}
                  </button>
                )}
                {imageError && <p className="text-xs text-[var(--danger)]">{imageError}</p>}
              </div>
            </div>
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
