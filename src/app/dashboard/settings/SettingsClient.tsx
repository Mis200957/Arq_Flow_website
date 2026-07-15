"use client";

import { useState, useMemo } from "react";
import { User, Building2, Shield, Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Profile = Tables<"profiles">;
type Business = Tables<"businesses">;

interface Props {
  profile: Profile;
  business: Business;
}

const TABS = ["profile", "business", "security"] as const;
type Tab = typeof TABS[number];

export default function SettingsClient({ profile, business }: Props) {
  const { lang } = useLang();
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: profile.full_name ?? "", email: profile.email ?? "", phone: profile.phone ?? "" });
  const [businessForm, setBusinessForm] = useState({ business_name: business.business_name, description: business.description ?? "", address: business.address ?? "", website: business.website ?? "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const supabase = useMemo(() => createClient(), []);

  const t = useT({
    ar: {
      profile: "الملف الشخصي", business: "معلومات النشاط", security: "الأمان",
      fullName: "الاسم الكامل", email: "البريد الإلكتروني", phone: "الجوال",
      businessName: "اسم النشاط", description: "الوصف", address: "العنوان", website: "الموقع",
      save: "حفظ", saving: "جاري الحفظ...", saved: "تم الحفظ",
      changePassword: "تغيير كلمة المرور", newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور", passwordMismatch: "كلمتا المرور غير متطابقتين",
      updatePassword: "تحديث كلمة المرور",
    },
    en: {
      profile: "Profile", business: "Business Info", security: "Security",
      fullName: "Full name", email: "Email", phone: "Phone",
      businessName: "Business name", description: "Description", address: "Address", website: "Website",
      save: "Save", saving: "Saving...", saved: "Saved",
      changePassword: "Change password", newPassword: "New password",
      confirmPassword: "Confirm password", passwordMismatch: "Passwords don't match",
      updatePassword: "Update password",
    },
  });

  const tabIcons: Record<Tab, React.ReactNode> = {
    profile: <User className="w-4 h-4" />,
    business: <Building2 className="w-4 h-4" />,
    security: <Shield className="w-4 h-4" />,
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: profileForm.full_name, phone: profileForm.phone }).eq("id", profile.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveBusiness = async () => {
    setSaving(true);
    await fetch("/api/dashboard/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(businessForm) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updatePassword = async () => {
    if (passwordForm.password !== passwordForm.confirm) return;
    setSaving(true);
    await supabase.auth.updateUser({ password: passwordForm.password });
    setSaving(false); setSaved(true); setPasswordForm({ password: "", confirm: "" }); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 glass rounded-2xl w-fit">
        {TABS.map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
              tab === t_ ? "bg-[rgba(184,144,99,0.2)] text-accent" : "text-muted hover:text-app"
            )}
          >
            {tabIcons[t_]} {t[t_]}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <div className="card p-6 max-w-lg space-y-4">
          <Field label={t.fullName}>
            <input className="input-base" value={profileForm.full_name} onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))} />
          </Field>
          <Field label={t.email}>
            <input className="input-base" value={profileForm.email} disabled />
          </Field>
          <Field label={t.phone}>
            <input className="input-base" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saving ? t.saving : saved ? t.saved : t.save}
          </button>
        </div>
      )}

      {/* Business */}
      {tab === "business" && (
        <div className="card p-6 max-w-lg space-y-4">
          <Field label={t.businessName}>
            <input className="input-base" value={businessForm.business_name} onChange={(e) => setBusinessForm((f) => ({ ...f, business_name: e.target.value }))} />
          </Field>
          <Field label={t.description}>
            <textarea className="input-base min-h-24" value={businessForm.description} onChange={(e) => setBusinessForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label={t.address}>
            <input className="input-base" value={businessForm.address} onChange={(e) => setBusinessForm((f) => ({ ...f, address: e.target.value }))} />
          </Field>
          <Field label={t.website}>
            <input className="input-base" value={businessForm.website} onChange={(e) => setBusinessForm((f) => ({ ...f, website: e.target.value }))} />
          </Field>
          <button onClick={saveBusiness} disabled={saving} className="btn-primary">
            {saving ? t.saving : saved ? t.saved : t.save}
          </button>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="card p-6 max-w-lg space-y-4">
          <h3 className="font-bold">{t.changePassword}</h3>
          <Field label={t.newPassword}>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className="input-base pe-10" value={passwordForm.password} onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))} />
              <button className="absolute top-1/2 -translate-y-1/2 end-3 text-muted" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label={t.confirmPassword} error={passwordForm.confirm && passwordForm.password !== passwordForm.confirm ? t.passwordMismatch : undefined}>
            <input type="password" className="input-base" value={passwordForm.confirm} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} />
          </Field>
          <button onClick={updatePassword} disabled={saving || !passwordForm.password || passwordForm.password !== passwordForm.confirm} className="btn-primary">
            {saving ? t.saving : saved ? t.saved : t.updatePassword}
          </button>
        </div>
      )}
    </div>
  );
}
