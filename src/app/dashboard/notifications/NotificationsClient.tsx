"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, CreditCard, Bot, BookOpen, Send, AlertTriangle, Gauge, Sparkles, Inbox,
} from "lucide-react";
import { EmptyState, Badge } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Notif = Tables<"notifications">;

function iconFor(type: string) {
  if (type.startsWith("payment")) return CreditCard;
  if (type.startsWith("usage")) return Gauge;
  if (type.startsWith("provision") || type.includes("ai")) return Bot;
  if (type.includes("knowledge") || type.includes("kb")) return BookOpen;
  if (type.includes("broadcast")) return Send;
  if (type.includes("fail") || type.includes("error")) return AlertTriangle;
  return Sparkles;
}

export default function NotificationsClient({ userId, initial }: { userId: string; initial: Notif[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const t = useT({
    ar: { title: "مركز الإشعارات", all: "الكل", unread: "غير المقروءة", markAll: "تعليم الكل كمقروء",
      empty: "لا توجد إشعارات", emptyUnread: "لا توجد إشعارات غير مقروءة", filterType: "النوع" },
    en: { title: "Notification Center", all: "All", unread: "Unread", markAll: "Mark all read",
      empty: "No notifications", emptyUnread: "No unread notifications", filterType: "Type" },
  });

  const [items, setItems] = useState<Notif[]>(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const ch = supabase
      .channel("notif-center:" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (p) => setItems((prev) => [p.new as Notif, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, supabase]);

  const types = useMemo(() => Array.from(new Set(items.map((n) => n.type))).sort(), [items]);
  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = items.filter((n) => {
    if (tab === "unread" && n.read) return false;
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const markRead = async (n: Notif) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[rgba(27,27,30,0.05)]">
          {(["all", "unread"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", tab === k ? "bg-[rgba(27,27,30,0.18)] text-accent" : "text-muted hover:text-app")}>
              {k === "all" ? t.all : t.unread}{k === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
        {types.length > 1 && (
          <select className="input-base !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{t.filterType}: {t.all}</option>
            {types.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
          </select>
        )}
        <div className="flex-1" />
        {unreadCount > 0 && (
          <button onClick={markAll} className="btn-ghost text-sm flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> {t.markAll}</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Inbox className="w-12 h-12" />} title={tab === "unread" ? t.emptyUnread : t.empty} />
      ) : (
        <div className="card divide-y divide-[var(--border)]">
          {filtered.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <button key={n.id} onClick={() => markRead(n)}
                className={cn("w-full text-start flex items-start gap-3 p-4 hover:bg-[rgba(27,27,30,0.04)] transition-colors", !n.read && "bg-[rgba(27,27,30,0.06)]")}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", !n.read ? "bg-[rgba(27,27,30,0.18)] text-accent" : "bg-[rgba(27,27,30,0.06)] text-muted")}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                  </div>
                  {n.body && <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="neutral" className="!text-[10px]">{n.type}</Badge>
                    <span className="text-xs text-muted">{timeAgo(n.created_at, lang)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
