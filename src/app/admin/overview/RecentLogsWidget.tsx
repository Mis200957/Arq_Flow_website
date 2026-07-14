"use client";

import { Badge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Log = {
  id: string;
  level: string;
  workflow: string;
  event: string;
  created_at: string;
  businesses: { business_name: string } | null;
};

const LEVEL_VARIANT: Record<string, string> = {
  info: "accent",
  warn: "warning",
  error: "danger",
};

export default function RecentLogsWidget({ logs }: { logs: Log[] }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-app flex items-center justify-between">
        <h3 className="font-bold">Recent Logs / أحدث السجلات</h3>
        <a href="/admin/logs" className="text-accent text-sm hover:underline flex items-center gap-1">
          View all <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="divide-y divide-app">
        {logs.map((log) => (
          <div key={log.id} className="p-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={LEVEL_VARIANT[log.level] ?? "neutral"} className="text-[11px]">
                {log.level.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted">{timeAgo(log.created_at, "en")}</span>
            </div>
            <p className="text-sm font-medium truncate">{log.workflow}</p>
            <p className="text-xs text-muted truncate">{log.event}</p>
            {log.businesses && (
              <p className="text-xs text-accent truncate">{log.businesses.business_name}</p>
            )}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-6 text-center text-muted text-sm">No recent logs</div>
        )}
      </div>
    </div>
  );
}
