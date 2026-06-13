"use client";

import { useState } from "react";
import { Check, X as XIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn, formatEGP, formatDateTime, STATUS_BADGE } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Payment = {
  id: string;
  amount_egp: number;
  method: string;
  status: string;
  transaction_ref: string;
  created_at: string;
  payment_type: string;
  businesses: { business_name: string; status: string } | null;
  plans: { name: string } | null;
};

interface Props {
  payments: Payment[];
}

export default function RecentPaymentsWidget({ payments: initial }: Props) {
  const [payments, setPayments] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error } = useToast();

  async function approve(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p))
      );
      success("Payment approved", "Business status updated");
    } catch (e) {
      error("Failed to approve", (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function reject(id: string) {
    const reason = prompt("Rejection reason / سبب الرفض:");
    if (!reason) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "rejected" } : p))
      );
      success("Payment rejected");
    } catch (e) {
      error("Failed to reject", (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-app flex items-center justify-between">
        <h3 className="font-bold">Recent Payments / أحدث المدفوعات</h3>
        <a href="/admin/payments" className="text-accent text-sm hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Business</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  <p className="font-medium text-sm">{p.businesses?.business_name ?? "—"}</p>
                  <p className="text-xs text-muted">{p.plans?.name ?? "—"}</p>
                </td>
                <td className="font-semibold">{formatEGP(p.amount_egp, "en")}</td>
                <td className="text-muted text-sm capitalize">{p.method.replace("_", " ")}</td>
                <td>
                  <Badge variant={STATUS_BADGE[p.status] ?? "neutral"}>
                    {p.status}
                  </Badge>
                </td>
                <td className="text-muted text-sm">{formatDateTime(p.created_at, "en")}</td>
                <td>
                  {p.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => approve(p.id)}
                        disabled={loading === p.id}
                        className={cn("btn-ghost !p-1.5 text-success hover:bg-success/10", loading === p.id && "opacity-50")}
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reject(p.id)}
                        disabled={loading === p.id}
                        className={cn("btn-ghost !p-1.5 text-danger hover:bg-danger/10", loading === p.id && "opacity-50")}
                        title="Reject"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-8">No recent payments</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
