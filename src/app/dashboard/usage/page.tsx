import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsageClient from "./UsageClient";

export default async function UsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_id, business_name")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  // Current usage counter (latest period) + monthly history
  const { data: counters } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("business_id", business.id)
    .order("period_start", { ascending: false })
    .limit(12);

  const { data: plan } = await supabase
    .from("plans")
    .select("id, name, name_ar, message_limit, monthly_fee_egp")
    .eq("id", business.plan_id)
    .single();

  // Last 30 days of messages for the daily activity chart
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: messages } = await supabase
    .from("messages")
    .select("created_at, cost_egp, direction")
    .eq("business_id", business.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20000);

  return (
    <UsageClient
      businessId={business.id}
      current={counters?.[0] ?? null}
      history={(counters ?? []).slice().reverse()}
      plan={plan ?? null}
      messages={messages ?? []}
    />
  );
}
