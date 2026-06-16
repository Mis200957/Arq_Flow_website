import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const [{ data: subscription }, { data: plan }, { data: usage }, { data: payments }, { data: invoices }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("plans").select("*").eq("id", business.plan_id).single(),
    supabase
      .from("usage_counters")
      .select("*")
      .eq("business_id", business.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("payments").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("invoices").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <SubscriptionClient
      business={business}
      subscription={subscription}
      plan={plan}
      usage={usage}
      payments={payments ?? []}
      invoices={invoices ?? []}
    />
  );
}
