"use client";

import { useState } from "react";
import { Edit3, Users, Package } from "lucide-react";
import { Modal, Field, Badge } from "@/components/ui";
import { formatEGP } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Plan = {
  id: string;
  name: string;
  name_ar: string;
  setup_fee_egp: number;
  monthly_fee_egp: number;
  message_limit: number;
  ai_model: string;
  max_tokens: number;
  memory_window: number;
  features: unknown;
  features_ar: unknown;
  active: boolean;
  highlighted: boolean;
  tier_level: number;
  fallback_model: string;
};

interface Props {
  plans: Plan[];
  subscriberCounts: Record<string, number>;
}

export default function PlansClient({ plans: initial, subscriberCounts }: Props) {
  const [plans, setPlans] = useState(initial);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      setup_fee_egp: plan.setup_fee_egp,
      monthly_fee_egp: plan.monthly_fee_egp,
      message_limit: plan.message_limit,
      ai_model: plan.ai_model,
      max_tokens: plan.max_tokens,
      memory_window: plan.memory_window,
      features: plan.features,
      features_ar: plan.features_ar,
    });
  }

  async function save() {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const updated = { ...editingPlan, ...form } as Plan;
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
            className={`card p-6 space-y-4 relative ${plan.highlighted ? "border-accent/40" : ""}`}
          >
            {plan.highlighted && (
              <div className="absolute top-4 end-4">
                <Badge variant="accent">Highlighted</Badge>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-muted text-sm">{plan.name_ar}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[rgba(238,237,210,0.04)] rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Setup Fee</p>
                <p className="font-bold">{formatEGP(plan.setup_fee_egp, "en")}</p>
              </div>
              <div className="bg-[rgba(238,237,210,0.04)] rounded-xl p-3">
                <p className="text-xs text-muted mb-1">Monthly</p>
                <p className="font-bold">{formatEGP(plan.monthly_fee_egp, "en")}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Messages/month</span>
                <span className="font-semibold">{plan.message_limit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">AI Model</span>
                <span className="font-mono text-xs font-semibold">{plan.ai_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Max Tokens</span>
                <span className="font-semibold">{plan.max_tokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Memory Window</span>
                <span className="font-semibold">{plan.memory_window}</span>
              </div>
            </div>

            {/* Features */}
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

            {/* Subscribers */}
            <div className="flex items-center gap-2 text-sm border-t border-app pt-3">
              <Users className="w-4 h-4 text-muted" />
              <span className="text-muted">Subscribers:</span>
              <span className="font-bold text-accent">{subscriberCounts[plan.id] ?? 0}</span>
            </div>

            <button
              onClick={() => openEdit(plan)}
              className="btn-outline w-full text-sm"
            >
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
          <Field label="Setup Fee (EGP)" required>
            <input
              type="number"
              className="input-base"
              value={form.setup_fee_egp ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, setup_fee_egp: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Monthly Fee (EGP)" required>
            <input
              type="number"
              className="input-base"
              value={form.monthly_fee_egp ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, monthly_fee_egp: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Message Limit">
            <input
              type="number"
              className="input-base"
              value={form.message_limit ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, message_limit: Number(e.target.value) }))}
            />
          </Field>
          <Field label="AI Model">
            <input
              type="text"
              className="input-base"
              value={form.ai_model ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ai_model: e.target.value }))}
            />
          </Field>
          <Field label="Max Tokens">
            <input
              type="number"
              className="input-base"
              value={form.max_tokens ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_tokens: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Memory Window">
            <input
              type="number"
              className="input-base"
              value={form.memory_window ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, memory_window: Number(e.target.value) }))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Features (JSON array)" hint='e.g. ["Feature 1", "Feature 2"]'>
              <textarea
                className="input-base min-h-[100px] font-mono text-xs resize-y"
                value={typeof form.features === "string" ? form.features : JSON.stringify(form.features ?? [], null, 2)}
                onChange={(e) => {
                  try {
                    setForm((f) => ({ ...f, features: JSON.parse(e.target.value) }));
                  } catch {
                    setForm((f) => ({ ...f, features: e.target.value as unknown }));
                  }
                }}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Features Arabic (JSON array)">
              <textarea
                className="input-base min-h-[100px] font-mono text-xs resize-y"
                value={typeof form.features_ar === "string" ? form.features_ar : JSON.stringify(form.features_ar ?? [], null, 2)}
                onChange={(e) => {
                  try {
                    setForm((f) => ({ ...f, features_ar: JSON.parse(e.target.value) }));
                  } catch {
                    setForm((f) => ({ ...f, features_ar: e.target.value as unknown }));
                  }
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
