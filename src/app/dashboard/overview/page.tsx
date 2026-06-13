import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { data: usage } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("business_id", business.id)
    .gte("period_start", startOfMonth)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [
    { count: ordersToday },
    { count: totalCustomers },
    { count: escalations },
    { data: recentMessages },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", startOfDay),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
    supabase
      .from("escalations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("resolved", false),
    supabase
      .from("messages")
      .select("id, content, direction, created_at, media_type, customer_id")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select("id, order_number, total_egp, status, created_at, customer_id")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Fetch daily messages for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: weekMessages } = await supabase
    .from("messages")
    .select("created_at")
    .eq("business_id", business.id)
    .gte("created_at", sevenDaysAgo);

  return (
    <OverviewClient
      business={business}
      usage={usage}
      ordersToday={ordersToday ?? 0}
      totalCustomers={totalCustomers ?? 0}
      escalations={escalations ?? 0}
      recentMessages={recentMessages ?? []}
      recentOrders={recentOrders ?? []}
      weekMessages={weekMessages ?? []}
    />
  );
}
