"use client";

import { useState, useMemo } from "react";
import { User, Building2, Key, Webhook, Shield, Copy, CheckCircle, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Field, Modal, Badge, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Profile = Tables<"profiles">;
type Business = Tables<"businesses">;
type ApiKey = Pick<Tables<"api_keys">, "id" | "name" | "key_prefix" | "created_at" | "last_used_at" | "revoked">;
type WebhookEndpoint = Tables<"webhook_endpoints">;

interface Props {
  profile: Profile;
  business: Business;
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
}

const TABS = ["profile", "business", "apikeys", "webhooks", "security"] as const;
type Tab = typeof TABS[number];

const WEBHOOK_EVENTS = ["message.received", "order.created", "escalation.created", "conversation.closed"];

export default function SettingsClient({ profile, business, apiKeys: initKeys, webhooks: initWebhooks }: Props) {
  const { lang } = useLang();
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKeys, setApiKeys] = useState(initKeys);
  const [webhooks, setWebhooks] = useState(initWebhooks);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [newWebhookModal, setNewWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ url: "", events: [] as string[] });
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: profile.full_name ?? "", email: profile.email ?? "", phone: profile.phone ?? "" });
  const [businessForm, setBusinessForm] = useState({ business_name: business.business_name, description: business.description ?? "", address: business.address ?? "", website: business.website ?? "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });
  const supabase = useMemo(() => createClient(), []);

  const t = useT({
    ar: {
      profile: "الملف الشخصي", business: "معلومات النشاط", apikeys: "مفاتيح API",
      webhooks: "الـ Webhooks", security: "الأمان",
      fullName: "الاسم الكامل", email: "البريد الإلكتروني", phone: "الجوال",
      businessName: "اسم النشاط", description: "الوصف", address: "العنوان", website: "الموقع",
      save: "حفظ", saving: "جاري الحفظ...", saved: "تم الحفظ",
      newKey: "إنشاء مفتاح جديد", keyName: "اسم المفتاح", create: "إنشاء", creating: "جاري الإنشاء...",
      copyKey: "نسخ المفتاح", keyCopied: "تم النسخ!", keyWarning: "احفظ هذا المفتاح الآن، لن يظهر مرة أخرى",
      noKeys: "لا توجد مفاتيح API", revoke: "إلغاء", revokeConfirm: "إلغاء هذا المفتاح؟",
      newWebhook: "أضف Webhook", webhookUrl: "الرابط", events: "الأحداث",
      noWebhooks: "لا توجد Webhooks", add: "إضافة", adding: "جاري الإضافة...",
      changePassword: "تغيير كلمة المرور", newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور", passwordMismatch: "كلمتا المرور غير متطابقتين",
      updatePassword: "تحديث كلمة المرور", lastUsed: "آخر استخدام",
    },
    en: {
      profile: "Profile", business: "Business Info", apikeys: "API Keys",
      webhooks: "Webhooks", security: "Security",
      fullName: "Full name", email: "Email", phone: "Phone",
      businessName: "Business name", description: "Description", address: "Address", website: "Website",
      save: "Save", saving: "Saving...", saved: "Saved",
      newKey: "Create new key", keyName: "Key name", create: "Create", creating: "Creating...",
      copyKey: "Copy key", keyCopied: "Copied!", keyWarning: "Save this key now — it won't be shown again",
      noKeys: "No API keys", revoke: "Revoke", revokeConfirm: "Revoke this API key?",
      newWebhook: "Add Webhook", webhookUrl: "URL", events: "Events",
      noWebhooks: "No webhooks yet", add: "Add", adding: "Adding...",
      changePassword: "Change password", newPassword: "New password",
      confirmPassword: "Confirm password", passwordMismatch: "Passwords don't match",
      updatePassword: "Update password", lastUsed: "Last used",
    },
  });

  const tabIcons: Record<Tab, React.ReactNode> = {
    profile: <User className="w-4 h-4" />,
    business: <Building2 className="w-4 h-4" />,
    apikeys: <Key className="w-4 h-4" />,
    webhooks: <Webhook className="w-4 h-4" />,
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

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/dashboard/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newKeyName }) });
    const data = await res.json();
    if (data.key) {
      setCreatedKey(data.key);
      setApiKeys((prev) => [data.record, ...prev]);
    }
    setSaving(false);
  };

  const revokeKey = async (id: string) => {
    if (!confirm(t.revokeConfirm)) return;
    await supabase.from("api_keys").update({ revoked: true }).eq("id", id);
    setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, revoked: true } : k));
  };

  const addWebhook = async () => {
    if (!webhookForm.url.trim()) return;
    setSaving(true);
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
    const { data } = await supabase.from("webhook_endpoints").insert({ business_id: business.id, url: webhookForm.url, events: webhookForm.events, secret }).select().single();
    if (data) setWebhooks((prev) => [data, ...prev]);
    setSaving(false); setNewWebhookModal(false); setWebhookForm({ url: "", events: [] });
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
              tab === t_ ? "bg-[rgba(107,160,172,0.2)] text-accent" : "text-muted hover:text-app"
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

      {/* API Keys */}
      {tab === "apikeys" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-end">
            <button onClick={() => setNewKeyModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t.newKey}
            </button>
          </div>
          {apiKeys.length === 0 ? (
            <p className="text-muted text-sm">{t.noKeys}</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className={cn("card p-4 flex items-center gap-4", k.revoked && "opacity-50")}>
                  <Key className="w-4 h-4 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{k.name}</p>
                    <p className="text-xs text-muted font-mono">{k.key_prefix}...</p>
                    {k.last_used_at && <p className="text-xs text-muted">{t.lastUsed}: {new Date(k.last_used_at).toLocaleDateString()}</p>}
                  </div>
                  {k.revoked ? <Badge variant="danger">Revoked</Badge> : (
                    <button onClick={() => revokeKey(k.id)} className="btn-ghost text-[var(--danger)] text-xs flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> {t.revoke}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Webhooks */}
      {tab === "webhooks" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-end">
            <button onClick={() => setNewWebhookModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t.newWebhook}
            </button>
          </div>
          {webhooks.length === 0 ? (
            <p className="text-muted text-sm">{t.noWebhooks}</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w.id} className="card p-4">
                  <p className="text-sm font-mono text-accent truncate">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.events.map((ev) => <Badge key={ev} variant="neutral">{ev}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* New key modal */}
      <Modal open={newKeyModal} onClose={() => { setNewKeyModal(false); setCreatedKey(null); setNewKeyName(""); }} title={t.newKey}>
        {createdKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)]">
              <span className="text-sm">{t.keyWarning}</span>
            </div>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-[rgba(7,15,28,0.5)] px-3 py-2 rounded-lg text-accent break-all">{createdKey}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(createdKey); setKeyCopied(true); }}
                className="btn-outline !px-3"
              >
                {keyCopied ? <CheckCircle className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label={t.keyName} required>
              <input className="input-base" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            </Field>
            <button onClick={createApiKey} disabled={saving || !newKeyName.trim()} className="btn-primary w-full">
              {saving ? <><Spinner className="w-4 h-4" /> {t.creating}</> : t.create}
            </button>
          </div>
        )}
      </Modal>

      {/* New webhook modal */}
      <Modal open={newWebhookModal} onClose={() => setNewWebhookModal(false)} title={t.newWebhook}>
        <div className="space-y-4">
          <Field label={t.webhookUrl} required>
            <input className="input-base" placeholder="https://..." value={webhookForm.url} onChange={(e) => setWebhookForm((f) => ({ ...f, url: e.target.value }))} />
          </Field>
          <div>
            <p className="text-sm font-semibold mb-2">{t.events}</p>
            <div className="flex flex-wrap gap-1">
              {WEBHOOK_EVENTS.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setWebhookForm((f) => ({
                    ...f,
                    events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
                  }))}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-all",
                    webhookForm.events.includes(ev)
                      ? "bg-[rgba(107,160,172,0.2)] text-accent border-[var(--accent)]"
                      : "text-muted border-[var(--border)]"
                  )}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addWebhook} disabled={saving || !webhookForm.url.trim()} className="btn-primary w-full">
            {saving ? t.adding : t.add}
          </button>
        </div>
      </Modal>
    </div>
  );
}
