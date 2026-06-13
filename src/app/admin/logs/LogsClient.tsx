"use client";

import { Fragment, useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Wifi } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Log = {
  id: string;
  level: string;
  workflow: string;
  event: string;
  created_at: string;
  payload: unknown;
  businesses: { id: string; business_name: string } | null;
};

const LEVEL_VARIANT: Record<string, string> = {
  info: "accent",
  warn: "warning",
  error: "danger",
  debug: "neutral",
};

interface Props {
  logs: Log[];
}

export default function LogsClient({ logs: initial }: Props) {
  const [logs, setLogs] = useState(initial);
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("automation_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "automation_logs" },
        (payload) => {
          const newLog = payload.new as Log;
          setLogs((prev) => [newLog, ...prev].slice(0, 500));
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchLevel = levelFilter === "all" || l.level === levelFilter;
      const matchSearch =
        !q ||
        l.workflow.toLowerCase().includes(q) ||
        l.event.toLowerCase().includes(q) ||
        (l.businesses?.business_name ?? "").toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [logs, levelFilter, search]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search workflow, event, business... / بحث..."
            className="input-base ps-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {["all", "info", "warn", "error", "debug"].map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={cn(
                "badge cursor-pointer transition-all text-xs",
                levelFilter === l
                  ? l === "all" ? "badge-accent" : (LEVEL_VARIANT[l] ? `badge-${LEVEL_VARIANT[l]}` : "badge-neutral")
                  : "badge-neutral opacity-60 hover:opacity-100"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
          <div className={cn("flex items-center gap-1.5 text-xs ms-2", realtimeConnected ? "text-success" : "text-muted")}>
            <Wifi className="w-3.5 h-3.5" />
            <span>{realtimeConnected ? "Live" : "Connecting..."}</span>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title="No logs found"
            body="Try adjusting your filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Workflow</th>
                  <th>Event</th>
                  <th>Business</th>
                  <th>Time</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const isExpanded = expanded === log.id;
                  return (
                    <Fragment key={log.id}>
                      <tr className={cn(log.level === "error" && "bg-danger/5")}>
                        <td>
                          <Badge variant={LEVEL_VARIANT[log.level] ?? "neutral"} className="text-[11px]">
                            {log.level.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="font-medium text-sm max-w-[160px] truncate">{log.workflow}</td>
                        <td className="text-muted text-sm max-w-[200px] truncate">{log.event}</td>
                        <td className="text-accent text-sm">{log.businesses?.business_name ?? "—"}</td>
                        <td className="text-muted text-sm whitespace-nowrap">{timeAgo(log.created_at, "en")}</td>
                        <td>
                          {log.payload && (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : log.id)}
                              className="btn-ghost !p-1.5 text-muted"
                              title="Toggle payload"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && log.payload && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <pre className="bg-[rgba(7,15,28,0.6)] p-4 text-xs font-mono text-muted overflow-x-auto max-h-48">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
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
        <div className="p-3 border-t border-app text-xs text-muted text-center">
          Showing {filtered.length} of {logs.length} logs
        </div>
      </div>
    </>
  );
}
