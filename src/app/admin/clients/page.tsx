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
      .select("business_id, messages_used, message_limit")
      .order("updated_at", { ascending: false }),
  ]);

  // Build usage map: latest usage per business
  const usageMap: Record<string, { messages_used: number; message_limit: number }> = {};
  for (const u of usageData ?? []) {
    if (!usageMap[u.business_id]) {
      usageMap[u.business_id] = { messages_used: u.messages_used, message_limit: u.message_limit };
    }
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
