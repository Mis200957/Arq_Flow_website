"use client";

import { Fragment, useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, formatDateTime, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Order = Tables<"orders"> & {
  customers: Pick<Tables<"customers">, "name" | "phone"> | null;
};

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled", "refunded"] as const;

interface Props {
  businessId: string;
  initialOrders: Order[];
}

export default function OrdersClient({ businessId, initialOrders }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      orderNum: "رقم الطلب", customer: "العميل", type: "النوع", total: "الإجمالي",
      status: "الحالة", date: "التاريخ", all: "الكل", noOrders: "لا توجد طلبات",
      address: "عنوان التوصيل", notes: "ملاحظات", items: "المنتجات", export: "تصدير CSV",
      updating: "جاري التحديث...",
    },
    en: {
      orderNum: "Order #", customer: "Customer", type: "Type", total: "Total",
      status: "Status", date: "Date", all: "All", noOrders: "No orders yet",
      address: "Delivery address", notes: "Notes", items: "Items", export: "Export CSV",
      updating: "Updating...",
    },
  });

  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as Tables<"orders">["status"] })
      .eq("id", orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Tables<"orders">["status"] } : o)
      );
    }
    setUpdating(null);
  };

  const exportCSV = () => {
    const headers = ["Order #", "Customer", "Phone", "Type", "Total (EGP)", "Status", "Date"];
    const rows = filtered.map((o) => [
      o.id,
      o.customers?.name ?? "",
      o.customers?.phone ?? "",
      o.type,
      o.total_egp,
      o.status,
      o.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 flex-1">
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-semibold border transition-all",
                filterStatus === s
                  ? "bg-[rgba(27,27,30,0.2)] text-accent border-[var(--accent)]"
                  : "text-muted border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              {s === "all" ? t.all : s}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="btn-outline !px-3 !py-1.5 text-xs flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" />
          {t.export}
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Download className="w-12 h-12" />} title={t.noOrders} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[t.orderNum, t.customer, t.type, t.total, t.status, t.date, ""].map((h) => (
                    <th key={h} className="text-start p-3 font-semibold text-muted text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr
                      className="border-b border-[var(--border)] hover:bg-[rgba(27,27,30,0.04)] cursor-pointer"
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    >
                      <td className="p-3 font-mono text-xs text-accent">{o.id}</td>
                      <td className="p-3">
                        <p className="font-medium">{o.customers?.name ?? "—"}</p>
                        <p className="text-xs text-muted">{o.customers?.phone}</p>
                      </td>
                      <td className="p-3 text-muted">{o.type}</td>
                      <td className="p-3 font-semibold">{formatEGP(o.total_egp, lang)}</td>
                      <td className="p-3">
                        <Badge variant={STATUS_BADGE[o.status] ?? "neutral"}>{o.status}</Badge>
                      </td>
                      <td className="p-3 text-muted text-xs">{formatDateTime(o.created_at, lang)}</td>
                      <td className="p-3">
                        {expanded === o.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr className="border-b border-[var(--border)] bg-[rgba(17,39,66,0.3)]">
                        <td colSpan={7} className="p-4">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-xs text-muted mb-2">{t.items}</p>
                              <pre className="text-xs bg-[rgba(7,15,28,0.5)] rounded-lg p-3 overflow-x-auto">
                                {JSON.stringify(o.items, null, 2)}
                              </pre>
                            </div>
                            <div className="space-y-3">
                              {o.delivery_address && (
                                <div>
                                  <p className="font-semibold text-xs text-muted mb-1">{t.address}</p>
                                  <p>{o.delivery_address}</p>
                                </div>
                              )}
                              {o.notes && (
                                <div>
                                  <p className="font-semibold text-xs text-muted mb-1">{t.notes}</p>
                                  <p>{o.notes}</p>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-xs text-muted mb-2">{t.status}</p>
                                <select
                                  className="input-base text-sm"
                                  value={o.status}
                                  onChange={(e) => updateStatus(o.id, e.target.value)}
                                  disabled={updating === o.id}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                {updating === o.id && <p className="text-xs text-muted mt-1">{t.updating}</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
