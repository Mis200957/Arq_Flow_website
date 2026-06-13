import { createAdminClient } from "@/lib/supabase/admin";
import LogsClient from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const db = createAdminClient();

  const { data: logs } = await db
    .from("automation_logs")
    .select("id, level, workflow, event, created_at, payload, businesses(id, business_name)")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Automation Logs / سجلات الأتمتة</h2>
        <p className="text-muted text-sm mt-1">Real-time workflow execution logs</p>
      </div>
      <LogsClient logs={(logs ?? []) as Parameters<typeof LogsClient>[0]["logs"]} />
    </div>
  );
}
