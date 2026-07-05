"use client";

import { useState } from "react";
import { Edit3, Users, Star } from "lucide-react";
import { Modal, Field, Badge } from "@/components/ui";
import { formatEGP } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  CAPABILITY_META,
  resolveCapabilities,
  type Capabilities,
  type CapabilityKey,
} from "@/lib/capabilities";

type Plan = {
  id: string;
  name: string;
  name_ar: string;
  setup_fee_egp: number;
  monthly_fee_egp: number;
  margin_egp: number;
  validity_days: number;
  token_budget_egp: number;
  ai_model: string;
  fallback_model: string;
  max_tokens: number;
  memory_window: number;
  features: unknown;
  features_ar: unknown;
  active: boolean;
  highlighted: boolean;
  tier_level: number;
  capabilities?: unknown;
};

interface Props {
  plans: Plan[];
  subscriberCounts: Record<string, number>;
}

const num = (v: unknown) => (v === "" || v === undefined || v === null ? 0 : Number(v));

export default function PlansClient({ plans: initial, subscriberCounts }: Props) {
  const [plans, setPlans] = useState(initial);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({ ...plan });
  }

  // Effective capabilities for the open form (stored flags merged over
  // tier defaults). Toggling writes the full, explicit map back to the form.
  const formCaps: Capabilities = resolveCapabilities({
    capabilities: form.capabilities,
    tier_level: form.tier_level,
  });
  const toggleCap = (key: CapabilityKey, value: boolean) =>
    setForm((f) => ({
      ...f,
      capabilities: {
        ...resolveCapabilities({ capabilities: f.capabilities, tier_level: f.tier_level }),
        [key]: value,
      },
    }));

  const budgetPreview = Math.max(0, num(form.monthly_fee_egp) - num(form.margin_egp));

  async function save() {
    if (!editingPlan) return;
    if (num(form.margin_egp) > num(form.monthly_fee_egp)) {
      error("Margin cannot exceed the package price");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const updated = { ...editingPlan, ...form, token_budget_egp: budgetPreview } as Plan;
      setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
      success("Plan updated");
      setEditingPlan(null);
    } catch (e) {
      error("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 space-y-4 relative ${plan.highlighted ? "border-accent/40" : ""} ${!plan.active ? "opacity-60" : ""}`}
          >
            <div className="absolute top-4 end-4 flex gap-1.5">
              {plan.highlighted && <Badge variant="accent">Highlighted</Badge>}
              {!plan.active && <Badge variant="danger">Inactive</Badge>}
            </div>

            <div>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-muted text-sm">{plan.name_ar}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[rgba(238,237,210,0.04)] rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Package Price</p>
                <p className="font-bold">{formatEGP(plan.monthly_fee_egp, "en")}</p>
              </div>
              <div className="bg-[rgba(238,237,210,0.04)] rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Setup Fee</p>
                <p className="font-bold">{formatEGP(plan.setup_fee_egp, "en")}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Your margin</span>
                <span className="font-semibold text-[var(--success)]">{formatEGP(plan.margin_egp, "en")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Token budget</span>
                <span className="font-semibold">{formatEGP(plan.token_budget_egp, "en")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Renewal</span>
                <span className="font-semibold">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">AI Model</span>
                <span className="font-mono text-xs font-semibold">{plan.ai_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Max Tokens / Memory</span>
                <span className="font-semibold">{plan.max_tokens.toLocaleString()} / {plan.memory_window}</span>
              </div>
            </div>

            {Array.isArray(plan.features) && (plan.features as string[]).length > 0 && (
              <div>
                <p className="text-xs text-muted uppercase font-semibold mb-2">Features</p>
                <ul className="space-y-1">
                  {(plan.features as string[]).slice(0, 4).map((f, i) => (
                    <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span> {f}
                    </li>
                  ))}
                  {(plan.features as string[]).length > 4 && (
                    <li className="text-xs text-muted">+{(plan.features as string[]).length - 4} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm border-t border-app pt-3">
              <Users className="w-4 h-4 text-muted" />
              <span className="text-muted">Subscribers:</span>
              <span className="font-bold text-accent">{subscriberCounts[plan.id] ?? 0}</span>
            </div>

            <button onClick={() => openEdit(plan)} className="btn-outline w-full text-sm">
              <Edit3 className="w-4 h-4" />
              Edit Plan
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title={`Edit Plan: ${editingPlan?.name ?? ""}`}
        wide
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name (EN)">
            <input className="input-base" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Name (AR)">
            <input className="input-base" value={form.name_ar ?? ""} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
          </Field>

          <Field label="Package Price (EGP)" required hint="What the customer pays each top-up">
            <input type="number" className="input-base" value={form.monthly_fee_egp ?? ""} onChange={(e) => setForm((f) => ({ ...f, monthly_fee_egp: Number(e.target.value) }))} />
          </Field>
          <Field label="Your Margin (EGP)" required hint="Your profit per package">
            <input type="number" className="input-base" value={form.margin_egp ?? ""} onChange={(e) => setForm((f) => ({ ...f, margin_egp: Number(e.target.value) }))} />
          </Field>

          <div className="sm:col-span-2 rounded-xl bg-[rgba(153,207,220,0.08)] border border-[var(--accent)]/30 p-3 flex items-center justify-between text-sm">
            <span className="text-muted">Token budget (consumed by the bot) = Price − Margin</span>
            <span className="font-bold text-accent">{formatEGP(budgetPreview, "en")}</span>
          </div>

          <Field label="Setup Fee (EGP)" hint="One-time, first payment only">
            <input type="number" className="input-base" value={form.setup_fee_egp ?? ""} onChange={(e) => setForm((f) => ({ ...f, setup_fee_egp: Number(e.target.value) }))} />
          </Field>
          <div className="rounded-xl bg-[rgba(238,237,210,0.04)] p-3 text-xs text-muted flex items-center">
            Renewal: monthly (same day next calendar month)
          </div>

          <Field label="AI Model">
            <input className="input-base" value={form.ai_model ?? ""} onChange={(e) => setForm((f) => ({ ...f, ai_model: e.target.value }))} />
          </Field>
          <Field label="Fallback Model">
            <input className="input-base" value={form.fallback_model ?? ""} onChange={(e) => setForm((f) => ({ ...f, fallback_model: e.target.value }))} />
          </Field>

          <Field label="Max Tokens">
            <input type="number" className="input-base" value={form.max_tokens ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_tokens: Number(e.target.value) }))} />
          </Field>
          <Field label="Memory Window">
            <input type="number" className="input-base" value={form.memory_window ?? ""} onChange={(e) => setForm((f) => ({ ...f, memory_window: Number(e.target.value) }))} />
          </Field>

          <Field label="Tier Level" hint="Order (1=lowest)">
            <input type="number" className="input-base" value={form.tier_level ?? ""} onChange={(e) => setForm((f) => ({ ...f, tier_level: Number(e.target.value) }))} />
          </Field>

          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
              Active (shown to customers)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.highlighted} onChange={(e) => setForm((f) => ({ ...f, highlighted: e.target.checked }))} />
              <Star className="w-3.5 h-3.5 text-accent" /> Highlighted
            </label>
          </div>

          {/* ---- Dashboard capabilities (drive module/feature gating) ---- */}
          <div className="sm:col-span-2">
            <p className="text-xs text-muted uppercase font-semibold mb-1">Dashboard capabilities</p>
            <p className="text-xs text-muted mb-3">
              Controls which modules &amp; features this plan unlocks in the client dashboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CAPABILITY_META.map((c) => (
                <label
                  key={c.key}
                  className="flex items-start gap-2.5 text-sm cursor-pointer rounded-xl bg-[rgba(238,237,210,0.04)] p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={formCaps[c.key]}
                    onChange={(e) => toggleCap(c.key, e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium block">{c.label.en}</span>
                    <span className="text-xs text-muted block">{c.hint.en}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Field label="Features (JSON array, EN)" hint='e.g. ["Feature 1", "Feature 2"]'>
              <textarea
                className="input-base min-h-[90px] font-mono text-xs resize-y"
                value={typeof form.features === "string" ? form.features : JSON.stringify(form.features ?? [], null, 2)}
                onChange={(e) => {
                  try { setForm((f) => ({ ...f, features: JSON.parse(e.target.value) })); }
                  catch { setForm((f) => ({ ...f, features: e.target.value as unknown })); }
                }}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Features (JSON array, AR)">
              <textarea
                className="input-base min-h-[90px] font-mono text-xs resize-y"
                value={typeof form.features_ar === "string" ? form.features_ar : JSON.stringify(form.features_ar ?? [], null, 2)}
                onChange={(e) => {
                  try { setForm((f) => ({ ...f, features_ar: JSON.parse(e.target.value) })); }
                  catch { setForm((f) => ({ ...f, features_ar: e.target.value as unknown })); }
                }}
              />
            </Field>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={() => setEditingPlan(null)} className="btn-outline">Cancel</button>
        </div>
      </Modal>
    </>
  );
}
