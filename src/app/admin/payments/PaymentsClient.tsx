"use client";

import { useState, useMemo } from "react";
import { Check, X as XIcon, Image, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Modal, Field, EmptyState } from "@/components/ui";
import { cn, formatEGP, formatDateTime, STATUS_BADGE } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Payment = {
  id: string;
  amount_egp: number;
  method: string;
  status: string;
  transaction_ref: string;
  screenshot_path: string | null;
  created_at: string;
  payment_type: string;
  rejection_reason: string | null;
  businesses: { id: string; business_name: string; status: string } | null;
  plans: { name: string; name_ar: string } | null;
};

const PAGE_SIZE = 20;

export default function PaymentsClient({ payments: initial }: { payments: Payment[] }) {
  const [payments, setPayments] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const { success, error } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        p.businesses?.business_name.toLowerCase().includes(q) ||
        p.transaction_ref.toLowerCase().includes(q) ||
        p.plans?.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function approve(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "approved" } : p)));
      success("Payment approved");
    } catch (e) {
      error("Approval failed", (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function submitReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setLoading(rejectModal.id);
    try {
      const res = await fetch(`/api/admin/payments/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPayments((prev) =>
        prev.map((p) => (p.id === rejectModal.id ? { ...p, status: "rejected", rejection_reason: rejectReason } : p))
      );
      success("Payment rejected");
      setRejectModal(null);
      setRejectReason("");
    } catch (e) {
      error("Rejection failed", (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function viewScreenshot(id: string) {
    try {
      const res = await fetch(`/api/admin/screenshot/${id}`);
      if (!res.ok) throw new Error("Failed to get screenshot URL");
      const { url } = await res.json();
      setScreenshotUrl(url);
    } catch (e) {
      error("Screenshot unavailable", (e as Error).message);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search business, txn ref... / بحث..."
            className="input-base ps-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className={cn(
                "badge cursor-pointer transition-all",
                statusFilter === s
                  ? s === "all" ? "badge-accent" : STATUS_BADGE[s]
                  : "badge-neutral opacity-60 hover:opacity-100"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {paged.length === 0 ? (
            <EmptyState
              icon={<Search className="w-10 h-10" />}
              title="No payments found"
              body="Try adjusting your filters"
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Business / العمل</th>
                  <th>Plan / الخطة</th>
                  <th>Amount / المبلغ</th>
                  <th>Method / الطريقة</th>
                  <th>Txn Ref</th>
                  <th>Type</th>
                  <th>Status / الحالة</th>
                  <th>Date / التاريخ</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <p className="font-medium text-sm">{p.businesses?.business_name ?? "—"}</p>
                    </td>
                    <td className="text-muted text-sm">{p.plans?.name ?? "—"}</td>
                    <td className="font-semibold text-sm">{formatEGP(p.amount_egp, "en")}</td>
                    <td className="text-muted text-sm capitalize">{p.method.replace("_", " ")}</td>
                    <td className="font-mono text-xs text-muted">{p.transaction_ref}</td>
                    <td>
                      <span className="badge badge-neutral text-xs capitalize">{p.payment_type}</span>
                    </td>
                    <td>
                      <Badge variant={STATUS_BADGE[p.status] ?? "neutral"}>{p.status}</Badge>
                    </td>
                    <td className="text-muted text-sm whitespace-nowrap">{formatDateTime(p.created_at, "en")}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => approve(p.id)}
                              disabled={loading === p.id}
                              className="btn-ghost !p-1.5 text-success hover:bg-success/10"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: p.id, name: p.businesses?.business_name ?? p.id })}
                              disabled={loading === p.id}
                              className="btn-ghost !p-1.5 text-danger hover:bg-danger/10"
                              title="Reject"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {p.screenshot_path && (
                          <button
                            onClick={() => viewScreenshot(p.id)}
                            className="btn-ghost !p-1.5 text-accent"
                            title="View screenshot"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-app flex items-center justify-between text-sm">
            <span className="text-muted">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost !p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{page + 1} / {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="btn-ghost !p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(""); }}
        title={`Reject Payment — ${rejectModal?.name ?? ""}`}
      >
        <div className="space-y-4">
          <Field label="Rejection Reason / سبب الرفض" required>
            <textarea
              className="input-base min-h-[100px] resize-y"
              placeholder="Explain why this payment is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Field>
          <div className="flex gap-3">
            <button
              onClick={submitReject}
              disabled={!rejectReason.trim() || !!loading}
              className="btn-danger flex-1"
            >
              Reject Payment
            </button>
            <button
              onClick={() => { setRejectModal(null); setRejectReason(""); }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Screenshot Modal */}
      <Modal
        open={!!screenshotUrl}
        onClose={() => setScreenshotUrl(null)}
        title="Payment Screenshot / صورة الدفع"
        wide
      >
        {screenshotUrl && (
          <img
            src={screenshotUrl}
            alt="Payment screenshot"
            className="w-full rounded-xl object-contain max-h-[70vh]"
          />
        )}
      </Modal>
    </>
  );
}
