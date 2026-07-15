"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronUp, Tag, X } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Customer = Tables<"customers">;

interface Props {
  businessId: string;
  initialCustomers: Customer[];
}

function sentimentEmoji(score: number | null) {
  if (score === null || score === undefined) return "😐";
  if (score > 0.3) return "😊";
  if (score < -0.3) return "😞";
  return "😐";
}

export default function CustomersClient({ businessId, initialCustomers }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      search: "ابحث بالاسم أو الرقم...", name: "الاسم", phone: "الرقم",
      tags: "التاجات", sentiment: "المشاعر", orders: "الطلبات", spent: "الإنفاق",
      lastActive: "آخر نشاط", noCustomers: "لا يوجد عملاء", filterByTag: "تصفية بالتاج",
      convHistory: "سجل المحادثات", prefs: "التفضيلات",
    },
    en: {
      search: "Search by name or phone...", name: "Name", phone: "Phone",
      tags: "Tags", sentiment: "Sentiment", orders: "Orders", spent: "Spent",
      lastActive: "Last Active", noCustomers: "No customers yet", filterByTag: "Filter by tag",
      convHistory: "Conversation History", prefs: "Preferences",
    },
  });

  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const allTags = Array.from(new Set(customers.flatMap((c) => c.tags)));

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.phone.includes(q);
    const matchTag = !tagFilter || c.tags.includes(tagFilter);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-4">
      {/* Search + tag filter */}
      <div className="flex flex-wrap gap-3 items-start">
        <div className="relative flex-1 min-w-48">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none", lang === "ar" ? "right-3" : "left-3")} />
          <input
            className={cn("input-base text-sm", lang === "ar" ? "pr-9" : "pl-9")}
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-full bg-[rgba(0,229,163,0.15)] text-accent border border-[var(--accent)]"
            >
              <X className="w-3 h-3" /> {tagFilter}
            </button>
          )}
        </div>
      </div>

      {/* All tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted py-1.5">{t.filterByTag}:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                tagFilter === tag
                  ? "bg-[rgba(0,229,163,0.2)] text-accent border-[var(--accent)]"
                  : "text-muted border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Tag className="w-12 h-12" />} title={t.noCustomers} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {[t.name, t.phone, t.tags, t.sentiment, t.orders, t.spent, t.lastActive, ""].map((h) => (
                    <th key={h} className="text-start p-3 font-semibold text-muted text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border)] hover:bg-[rgba(44,76,69,0.04)] cursor-pointer"
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    >
                      <td className="p-3 font-medium">{c.name ?? "—"}</td>
                      <td className="p-3 text-muted text-xs">{c.phone}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="badge badge-accent text-[10px] !py-0.5 !px-2">{tag}</span>
                          ))}
                          {c.tags.length > 3 && <span className="text-xs text-muted">+{c.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-lg">{sentimentEmoji(c.sentiment)}</td>
                      <td className="p-3 text-center">{c.total_orders}</td>
                      <td className="p-3 font-semibold">{formatEGP(c.total_spent_egp, lang)}</td>
                      <td className="p-3 text-muted text-xs">
                        {c.last_interaction_at ? timeAgo(c.last_interaction_at, lang) : "—"}
                      </td>
                      <td className="p-3">
                        {expanded === c.id ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                      </td>
                    </tr>
                    {expanded === c.id && (
                      <tr key={c.id + "_exp"} className="border-b border-[var(--border)] bg-[rgba(17,39,66,0.3)]">
                        <td colSpan={8} className="p-4">
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-xs text-muted mb-2">{t.tags}</p>
                              <div className="flex flex-wrap gap-1">
                                {c.tags.map((tag) => (
                                  <span key={tag} className="badge badge-accent">{tag}</span>
                                ))}
                              </div>
                            </div>
                            {c.email && (
                              <div>
                                <p className="font-semibold text-xs text-muted mb-1">Email</p>
                                <p>{c.email}</p>
                              </div>
                            )}
                            {c.conversation_summary && (
                              <div>
                                <p className="font-semibold text-xs text-muted mb-1">Summary</p>
                                <p className="text-xs">{c.conversation_summary}</p>
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/dashboard/conversations?customer=${c.id}`}
                            className="mt-3 text-xs text-accent hover:underline"
                          >
                            {t.convHistory} →
                          </Link>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
