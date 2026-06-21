"use client";

import { Fragment, useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { cn, formatDate, formatEGP, STATUS_BADGE } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Business = {
  id: string;
  business_name: string;
  business_type: string;
  contact_email: string | null;
  contact_phone: string;
  status: string;
  created_at: string;
  order_id: string;
  plan_id: string;
  plans: { id: string; name: string; name_ar: string } | null;
  owner_name: string | null;
  instance_name: string | null;
  knowledge_base_raw: string | null;
  whatsapp_number: string | null;
  address: string | null;
  description: string | null;
};

const STATUS_FILTERS = ["all", "active", "pending_approval", "provisioning", "suspended", "draft", "cancelled"];

interface Props {
  businesses: Business[];
  usageMap: Record<
    string,
    { remaining_egp: number; wallet_egp: number; used_pct: number; days_left: number | null; messages_used: number }
  >;
}

export default function ClientsClient({ businesses: initial, usageMap }: Props) {
  const [businesses, setBusinesses] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"business_name" | "created_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error } = useToast();

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return businesses
      .filter((b) => {
        const matchSearch =
          !q ||
          b.business_name.toLowerCase().includes(q) ||
          b.order_id.toLowerCase().includes(q) ||
          (b.contact_email ?? "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [businesses, search, statusFilter, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function changeStatus(id: string, status: "active" | "suspended") {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/clients/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      success(`Business ${status === "active" ? "activated" : "suspended"}`);
    } catch (e) {
      error("Action failed", (e as Error).message);
    } finally {
      setLoading(null);
    }
  }

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
    ) : null;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name, order ID, email... / بحث..."
            className="input-base ps-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "badge cursor-pointer transition-all text-xs",
                statusFilter === s
                  ? s === "all" ? "badge-accent" : (STATUS_BADGE[s] ?? "badge-neutral")
                  : "badge-neutral opacity-60 hover:opacity-100"
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title="No clients found"
            body="Adjust your search or filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>
                    <button className="flex items-center gap-1" onClick={() => toggleSort("business_name")}>
                      Business <SortIcon k="business_name" />
                    </button>
                  </th>
                  <th>Type / النوع</th>
                  <th>Plan / الخطة</th>
                  <th>Status / الحالة</th>
                  <th>Balance / الرصيد</th>
                  <th>
                    <button className="flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                      Registered <SortIcon k="created_at" />
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => {
                  const usage = usageMap[b.id];
                  const isExpanded = expanded === b.id;
                  return (
                    <Fragment key={b.id}>
                      <tr
                        className="cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : b.id)}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={cn("w-3.5 h-3.5 text-muted transition-transform shrink-0", isExpanded && "rotate-180")}
                            />
                            <div>
                              <p className="font-medium text-sm">{b.business_name}</p>
                              <p className="text-xs text-muted">{b.order_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted text-sm capitalize">{b.business_type}</td>
                        <td className="text-muted text-sm">{b.plans?.name ?? "—"}</td>
                        <td>
                          <Badge variant={STATUS_BADGE[b.status] ?? "neutral"}>{b.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="text-sm">
                          {usage ? (
                            <span>
                              {formatEGP(usage.remaining_egp, "en")}
                              <span className="text-muted"> · {usage.used_pct}%</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="text-muted text-sm">{formatDate(b.created_at, "en")}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {b.status !== "active" && b.status !== "draft" && (
                              <button
                                onClick={() => changeStatus(b.id, "active")}
                                disabled={loading === b.id}
                                className="btn-ghost !p-1.5 text-success hover:bg-success/10"
                                title="Activate"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                            {b.status === "active" && (
                              <button
                                onClick={() => changeStatus(b.id, "suspended")}
                                disabled={loading === b.id}
                                className="btn-ghost !p-1.5 text-warning hover:bg-warning/10"
                                title="Suspend"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            )}
                            <a
                              href={`/dashboard`}
                              className="btn-ghost !p-1.5 text-accent"
                              title="View dashboard"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-[rgba(7,15,28,0.4)] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Contact</p>
                                <p>{b.owner_name ?? "—"}</p>
                                <p className="text-muted">{b.contact_email ?? "—"}</p>
                                <p className="text-muted">{b.contact_phone}</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Instance</p>
                                <p className="font-mono text-xs">{b.instance_name ?? "Not provisioned"}</p>
                                <p className="text-muted mt-1">WhatsApp: {b.whatsapp_number ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Description</p>
                                <p className="text-muted line-clamp-3">{b.description ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Knowledge Base</p>
                                <p className="text-muted line-clamp-2 text-xs">
                                  {b.knowledge_base_raw
                                    ? `${b.knowledge_base_raw.length} chars loaded`
                                    : "No raw knowledge base"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Location</p>
                                <p className="text-muted">{b.address ?? "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted text-xs uppercase font-semibold mb-2">Plan</p>
                                <p>{b.plans?.name ?? "—"}</p>
                                {usage && (
                                  <p className="text-muted text-xs mt-1">
                                    {formatEGP(usage.remaining_egp, "en")} left · {usage.used_pct}% used
                                    {usage.days_left != null && ` · ${usage.days_left}d`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
