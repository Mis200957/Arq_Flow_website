import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionClient from "./SubscriptionClient";
import UpgradeBanner from "@/components/dashboard/UpgradeBanner";
import { PAYMENT_ACCOUNTS, type PaymentChannel } from "@/lib/plans";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const { upgrade } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const [
    { data: subscription }, { data: plan }, { data: usage },
    { data: payments }, { data: invoices }, { data: plans }, { data: settings },
  ] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("plans").select("*").eq("id", business.plan_id).single(),
    supabase
      .from("usage_counters").select("*").eq("business_id", business.id)
      .order("period_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("payments").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("invoices").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("plans").select("*").eq("active", true).order("tier_level", { ascending: true }),
    supabase.from("app_settings").select("key, value").in("key", ["payment_accounts", "payment_instapay", "payment_vodafone", "payment_wepay"]),
  ]);

  // Resolve the payment receiving accounts (DB settings → static fallback).
  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const acctObj = (settingsMap["payment_accounts"] ?? {}) as Record<string, unknown>;
  const accounts: Record<PaymentChannel, string> = {
    instapay: String(acctObj.instapay ?? settingsMap["payment_instapay"] ?? PAYMENT_ACCOUNTS.instapay.number),
    vodafone_cash: String(acctObj.vodafone_cash ?? settingsMap["payment_vodafone"] ?? PAYMENT_ACCOUNTS.vodafone_cash.number),
    wepay: String(acctObj.wepay ?? settingsMap["payment_wepay"] ?? PAYMENT_ACCOUNTS.wepay.number),
  };

  return (
    <div className="space-y-6">
      {upgrade && <UpgradeBanner upgradeKey={upgrade} />}
      <SubscriptionClient
        business={business}
        subscription={subscription}
        plan={plan}
        usage={usage}
        payments={payments ?? []}
        invoices={invoices ?? []}
        plans={plans ?? []}
        accounts={accounts}
      />
    </div>
  );
}
