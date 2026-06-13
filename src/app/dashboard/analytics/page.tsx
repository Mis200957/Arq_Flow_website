import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: messages }, { data: orders }, { data: escalations }] = await Promise.all([
    supabase
      .from("messages")
      .select("created_at, cost_egp, direction, intent")
      .eq("business_id", business.id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("orders")
      .select("created_at, total_egp, status")
      .eq("business_id", business.id)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("escalations")
      .select("created_at, resolved")
      .eq("business_id", business.id)
      .gte("created_at", thirtyDaysAgo),
  ]);

  return (
    <AnalyticsClient
      businessId={business.id}
      messages={messages ?? []}
      orders={orders ?? []}
      escalations={escalations ?? []}
    />
  );
}
