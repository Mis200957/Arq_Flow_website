import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCapabilities } from "@/lib/capabilities";
import DashboardShell from "./DashboardShell";
import SuspendedScreen from "./SuspendedScreen";
import ProvisioningScreen from "./ProvisioningScreen";
import { PAYMENT_ACCOUNTS, type PaymentChannel } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "client") redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  // Provisioning flow: after payment approval the client doesn't land in the
  // dashboard — they get the staged provisioning experience (creating bot →
  // WhatsApp QR linking → internal review) until the admin's final activation
  // flips the row to 'active'. Realtime + polling inside the screen advance
  // it automatically.
  if (
    ["provisioning", "qr_pending", "under_review", "provision_failed"].includes(
      business.status ?? ""
    )
  ) {
    return <ProvisioningScreen business={business} />;
  }

  // Suspended businesses can't access ANY part of the dashboard. We hard-block
  // here (server-side) and render a renewal screen instead. Once the admin
  // approves the renewal payment, applySubscriptionPayment flips the row back
  // to active (and tops up usage_counters); a realtime listener in the
  // SuspendedScreen refreshes the page automatically.
  if (business.status === "suspended") {
    const planQ = supabase.from("plans").select("*").eq("id", business.plan_id).single();
    const usageQ = supabase
      .from("usage_counters")
      .select("*")
      .eq("business_id", business.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    const settingsQ = supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["payment_accounts", "payment_instapay", "payment_vodafone", "payment_wepay"]);

    const [{ data: planFull }, { data: usage }, { data: settings }] = await Promise.all([
      planQ,
      usageQ,
      settingsQ,
    ]);

    // Resolve receiving accounts (DB -> static fallback).
    const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
    const acctObj = (settingsMap["payment_accounts"] ?? {}) as Record<string, unknown>;
    const accounts: Record<PaymentChannel, string> = {
      instapay: String(
        acctObj.instapay ?? settingsMap["payment_instapay"] ?? PAYMENT_ACCOUNTS.instapay.number
      ),
      vodafone_cash: String(
        acctObj.vodafone_cash ?? settingsMap["payment_vodafone"] ?? PAYMENT_ACCOUNTS.vodafone_cash.number
      ),
      wepay: String(
        acctObj.wepay ?? settingsMap["payment_wepay"] ?? PAYMENT_ACCOUNTS.wepay.number
      ),
    };

    return (
      <SuspendedScreen
        business={business}
        plan={planFull}
        usage={usage}
        accounts={accounts}
      />
    );
  }

  // Plan capabilities drive which modules/features this tenant can use.
  const { data: plan } = await supabase
    .from("plans")
    .select("tier_level, capabilities")
    .eq("id", business.plan_id)
    .single();

  const capabilities = resolveCapabilities(plan);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, read")
    .eq("user_id", user.id)
    .eq("read", false)
    .limit(99);

  return (
    <DashboardShell
      profile={profile}
      business={business}
      capabilities={capabilities}
      unreadCount={notifications?.length ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
