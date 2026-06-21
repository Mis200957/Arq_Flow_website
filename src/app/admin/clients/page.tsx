import { createAdminClient } from "@/lib/supabase/admin";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const db = createAdminClient();

  const [{ data: businesses }, { data: usageData }] = await Promise.all([
    db
      .from("businesses")
      .select(
        "id, business_name, business_type, contact_email, contact_phone, status, created_at, order_id, plan_id, plans(id, name, name_ar), owner_name, instance_name, knowledge_base_raw, whatsapp_number, address, description"
      )
      .order("created_at", { ascending: false }),
    db
      .from("usage_counters")
      .select("business_id, messages_used, balance_egp, cost_egp, wallet_egp, period_end")
      .order("period_start", { ascending: false }),
  ]);

  // Build usage map: latest wallet per business (customer-facing remaining + days left)
  const usageMap: Record<
    string,
    { remaining_egp: number; wallet_egp: number; used_pct: number; days_left: number | null; messages_used: number }
  > = {};
  for (const u of usageData ?? []) {
    if (usageMap[u.business_id]) continue;
    const bal = Number(u.balance_egp ?? 0);
    const cst = Number(u.cost_egp ?? 0);
    const wal = Number(u.wallet_egp ?? 0);
    const remaining = bal > 0 ? Math.max(0, wal * (1 - cst / bal)) : 0;
    const daysLeft = u.period_end ? Math.ceil((new Date(u.period_end).getTime() - Date.now()) / 86400000) : null;
    usageMap[u.business_id] = {
      remaining_egp: remaining,
      wallet_egp: wal,
      used_pct: bal > 0 ? Math.min(100, Math.round((cst / bal) * 100)) : 0,
      days_left: daysLeft,
      messages_used: u.messages_used,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Clients / العملاء</h2>
        <p className="text-muted text-sm mt-1">Manage all registered businesses</p>
      </div>
      <ClientsClient
        businesses={(businesses ?? []) as Parameters<typeof ClientsClient>[0]["businesses"]}
        usageMap={usageMap}
      />
    </div>
  );
}
