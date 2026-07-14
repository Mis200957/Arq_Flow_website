"use client";

import { useState } from "react";
import { Save, AlertTriangle, UserPlus, Trash2 } from "lucide-react";
import { Field } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Admin = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

interface Props {
  settingsMap: Record<string, unknown>;
  admins: Admin[];
}

export default function SettingsClient({ settingsMap, admins: initialAdmins }: Props) {
  const { success, error } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  // Payment settings — stored as a single `payment_accounts` jsonb object
  const acct = (settingsMap["payment_accounts"] ?? {}) as Record<string, unknown>;
  const [instapay, setInstapay] = useState(String(acct.instapay ?? settingsMap["payment_instapay"] ?? ""));
  const [vodafone, setVodafone] = useState(String(acct.vodafone_cash ?? settingsMap["payment_vodafone"] ?? ""));
  const [wepay, setWepay] = useState(String(acct.wepay ?? settingsMap["payment_wepay"] ?? ""));

  // General settings
  const [n8nWebhook, setN8nWebhook] = useState(String(settingsMap["n8n_factory_webhook"] ?? ""));
  const [supportWhatsapp, setSupportWhatsapp] = useState(String(settingsMap["support_whatsapp"] ?? ""));
  const [taxRate, setTaxRate] = useState(String(settingsMap["tax_rate"] ?? "0.14"));
  const [usdRate, setUsdRate] = useState(String(settingsMap["usd_to_egp"] ?? "50"));
  const [maintenanceMode, setMaintenanceMode] = useState(settingsMap["maintenance_mode"] === true);

  // Admin management
  const [admins, setAdmins] = useState(initialAdmins);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  async function saveSetting(key: string, value: unknown, label: string) {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      success(`${label} saved`);
    } catch (e) {
      error("Save failed", (e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function savePaymentSettings() {
    setSaving("payments");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "payment_accounts",
          value: { instapay, vodafone_cash: vodafone, wepay },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      success("Payment accounts saved");
    } catch (e) {
      error("Save failed", (e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  async function inviteAdmin() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const { admin } = await res.json();
      setAdmins((prev) => [...prev, admin]);
      setInviteEmail("");
      success("Admin invited", inviteEmail);
    } catch (e) {
      error("Invite failed", (e as Error).message);
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Payment Accounts */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-lg">Payment Accounts / حسابات الدفع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="InstaPay Number">
            <input
              type="text"
              className="input-base"
              value={instapay}
              onChange={(e) => setInstapay(e.target.value)}
              placeholder="e.g. 01012345678"
            />
          </Field>
          <Field label="Vodafone Cash Number">
            <input
              type="text"
              className="input-base"
              value={vodafone}
              onChange={(e) => setVodafone(e.target.value)}
              placeholder="e.g. 01012345678"
            />
          </Field>
          <Field label="WePay Number">
            <input
              type="text"
              className="input-base"
              value={wepay}
              onChange={(e) => setWepay(e.target.value)}
              placeholder="e.g. 01012345678"
            />
          </Field>
        </div>
        <button
          onClick={savePaymentSettings}
          disabled={saving === "payments"}
          className="btn-primary text-sm"
        >
          <Save className="w-4 h-4" />
          {saving === "payments" ? "Saving..." : "Save Payment Accounts"}
        </button>
      </div>

      {/* General Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-lg">General Settings / الإعدادات العامة</h3>
        <Field label="n8n Factory Webhook URL">
          <div className="flex gap-2">
            <input
              type="url"
              className="input-base"
              value={n8nWebhook}
              onChange={(e) => setN8nWebhook(e.target.value)}
              placeholder="https://n8n.example.com/webhook/..."
            />
            <button
              onClick={() => saveSetting("n8n_factory_webhook", n8nWebhook, "n8n Webhook")}
              disabled={saving === "n8n_factory_webhook"}
              className="btn-outline shrink-0"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </Field>
        <Field label="Support WhatsApp Number">
          <div className="flex gap-2">
            <input
              type="text"
              className="input-base"
              value={supportWhatsapp}
              onChange={(e) => setSupportWhatsapp(e.target.value)}
              placeholder="e.g. 201012345678"
            />
            <button
              onClick={() => saveSetting("support_whatsapp", supportWhatsapp, "Support WhatsApp")}
              disabled={saving === "support_whatsapp"}
              className="btn-outline shrink-0"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tax Rate" hint="e.g. 0.14 for 14%">
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                className="input-base"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <button
                onClick={() => saveSetting("tax_rate", Number(taxRate), "Tax Rate")}
                disabled={saving === "tax_rate"}
                className="btn-outline shrink-0"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </Field>
          <Field label="USD → EGP Rate">
            <div className="flex gap-2">
              <input
                type="number"
                className="input-base"
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value)}
              />
              <button
                onClick={() => saveSetting("usd_to_egp", Number(usdRate), "USD Rate")}
                disabled={saving === "usd_to_egp"}
                className="btn-outline shrink-0"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </Field>
        </div>
      </div>

      {/* Admin Management */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-lg">Admin Users / المديرون</h3>
        <div className="divide-y divide-app">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{a.full_name ?? "—"}</p>
                <p className="text-muted text-xs">{a.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{formatDate(a.created_at, "en")}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-app pt-4">
          <p className="text-sm font-semibold mb-2">Invite New Admin / دعوة مدير جديد</p>
          <div className="flex gap-2">
            <input
              type="email"
              className="input-base flex-1"
              placeholder="admin@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && inviteAdmin()}
            />
            <button
              onClick={inviteAdmin}
              disabled={inviteLoading || !inviteEmail.trim()}
              className="btn-primary shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              {inviteLoading ? "Inviting..." : "Invite"}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 space-y-4 border-danger/30">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-lg">Danger Zone / منطقة الخطر</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-danger/5 rounded-xl border border-danger/20">
          <div>
            <p className="font-semibold text-sm">Maintenance Mode / وضع الصيانة</p>
            <p className="text-muted text-xs mt-0.5">Disable public access to the platform</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={async (e) => {
                const newVal = e.target.checked;
                setMaintenanceMode(newVal);
                await saveSetting("maintenance_mode", newVal, "Maintenance Mode");
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[rgba(238,237,210,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger" />
          </label>
        </div>
      </div>
    </div>
  );
}
