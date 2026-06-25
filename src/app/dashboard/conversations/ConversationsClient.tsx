"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, CheckCircle, RotateCcw, Mic, Image, MapPin } from "lucide-react";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, timeAgo, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Conversation = Tables<"conversations"> & {
  customers: Pick<Tables<"customers">, "id" | "name" | "phone" | "tags" | "sentiment"> | null;
};
type Message = Tables<"messages">;

interface Props {
  businessId: string;
  initialConversations: Conversation[];
}

const FILTERS = ["all", "open", "escalated", "closed"] as const;
type Filter = typeof FILTERS[number];

export default function ConversationsClient({ businessId, initialConversations }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      search: "ابحث بالاسم أو الرقم...",
      all: "الكل", open: "مفتوح", escalated: "مصعد", closed: "مغلق",
      noConvs: "لا توجد محادثات", selectConv: "اختر محادثة لعرض الرسائل",
      close: "إغلاق المحادثة", closing: "جاري الإغلاق...", closed2: "مغلقة",
      reopen: "إعادة فتح المحادثة", reopening: "جاري إعادة الفتح...",
      unknown: "مجهول", audio: "[صوتي]", image: "[صورة]", location: "[موقع]",
    },
    en: {
      search: "Search by name or phone...",
      all: "All", open: "Open", escalated: "Escalated", closed: "Closed",
      noConvs: "No conversations", selectConv: "Select a conversation to view messages",
      close: "Close conversation", closing: "Closing...", closed2: "Closed",
      reopen: "Reopen conversation", reopening: "Reopening...",
      unknown: "Unknown", audio: "[Audio]", image: "[Image]", location: "[Location]",
    },
  });

  const [convs, setConvs] = useState(initialConversations);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("convs:" + businessId)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `business_id=eq.${businessId}` }, async () => {
        const { data } = await supabase
          .from("conversations")
          .select("*, customers(id, name, phone, tags, sentiment)")
          .eq("business_id", businessId)
          .order("last_message_at", { ascending: false })
          .limit(100);
        if (data) setConvs(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, supabase]);

  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selected.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoadingMsgs(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });

    const channel = supabase
      .channel("msgs:" + selected.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selected.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected?.id, supabase]);

  const filtered = convs.filter((c) => {
    const matchFilter = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.customers?.name?.toLowerCase().includes(q) || c.customers?.phone?.includes(q);
    return matchFilter && matchSearch;
  });

  const closeConv = async () => {
    if (!selected) return;
    setClosing(true);
    await supabase.from("conversations").update({ status: "closed" }).eq("id", selected.id);
    setSelected((prev) => prev ? { ...prev, status: "closed" } : prev);
    setConvs((prev) => prev.map((c) => (c.id === selected.id ? { ...c, status: "closed" } : c)));
    setClosing(false);
  };

  const reopenConv = async () => {
    if (!selected) return;
    setReopening(true);
    await supabase.from("conversations").update({ status: "open" }).eq("id", selected.id);
    setSelected((prev) => prev ? { ...prev, status: "open" } : prev);
    setConvs((prev) => prev.map((c) => (c.id === selected.id ? { ...c, status: "open" } : c)));
    setReopening(false);
  };

  const mediaIcon = (mt: string) => {
    if (mt === "audio") return <Mic className="w-3 h-3" />;
    if (mt === "image") return <Image className="w-3 h-3" />;
    if (mt === "location") return <MapPin className="w-3 h-3" />;
    return null;
  };

  const mediaLabel = (mt: string) => {
    const map: Record<string, string> = { audio: t.audio, image: t.image, location: t.location };
    return map[mt] ?? null;
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Left: list */}
      <div className={cn("flex flex-col gap-3 w-full lg:w-80 shrink-0", selected ? "hidden lg:flex" : "flex")}>
        {/* Search */}
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none", lang === "ar" ? "right-3" : "left-3")} />
          <input
            className={cn("input-base text-sm", lang === "ar" ? "pr-9" : "pl-9")}
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-semibold border transition-all",
                filter === f
                  ? "bg-[rgba(107,160,172,0.2)] text-accent border-[var(--accent)]"
                  : "text-muted border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              {t[f]}
            </button>
          ))}
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">{t.noConvs}</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full text-start p-3 rounded-xl transition-all hover:bg-[rgba(238,237,210,0.06)] border",
                  selected?.id === c.id
                    ? "bg-[rgba(107,160,172,0.12)] border-[var(--accent)]"
                    : "border-[var(--border)]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{c.customers?.name ?? t.unknown}</span>
                  <Badge variant={STATUS_BADGE[c.status] ?? "neutral"}>{c.status}</Badge>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">{c.customers?.phone}</p>
                {c.last_message_at && (
                  <p className="text-xs text-muted mt-1">{timeAgo(c.last_message_at, lang)}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: thread */}
      <div className={cn("flex-1 card flex flex-col overflow-hidden", !selected ? "hidden lg:flex items-center justify-center" : "flex")}>
        {!selected ? (
          <EmptyState icon={<Search className="w-12 h-12" />} title={t.selectConv} />
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] shrink-0">
              <button className="btn-ghost !p-1.5 lg:hidden" onClick={() => setSelected(null)}>
                <X className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{selected.customers?.name ?? t.unknown}</p>
                <p className="text-xs text-muted">{selected.customers?.phone}</p>
              </div>
              <Badge variant={STATUS_BADGE[selected.status] ?? "neutral"}>{selected.status}</Badge>
              {selected.status !== "closed" ? (
                <button
                  onClick={closeConv}
                  disabled={closing}
                  className="btn-outline !px-3 !py-1.5 text-xs flex items-center gap-1.5"
                >
                  {closing ? <Spinner className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {closing ? t.closing : t.close}
                </button>
              ) : (
                <button
                  onClick={reopenConv}
                  disabled={reopening}
                  className="btn-outline !px-3 !py-1.5 text-xs flex items-center gap-1.5"
                >
                  {reopening ? <Spinner className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                  {reopening ? t.reopening : t.reopen}
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center pt-8"><Spinner /></div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.direction === "inbound" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                        m.direction === "inbound"
                          ? "bg-[#25d366] text-white rounded-br-sm"
                          : "bg-[rgba(42,96,114,0.4)] text-app rounded-bl-sm"
                      )}
                    >
                      {m.media_type !== "text" && (
                        <span className="flex items-center gap-1 text-xs opacity-80 mb-1">
                          {mediaIcon(m.media_type)}
                          {mediaLabel(m.media_type)}
                        </span>
                      )}
                      <p>{m.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">{timeAgo(m.created_at, lang)}</p>
                      {m.sentiment_score !== null && m.sentiment_score !== undefined && (
                        <span className="text-[10px] opacity-60">
                          {m.sentiment_score > 0.3 ? "😊" : m.sentiment_score < -0.3 ? "😞" : "😐"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
