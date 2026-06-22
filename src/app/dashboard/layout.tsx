import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCapabilities } from "@/lib/capabilities";
import DashboardShell from "./DashboardShell";

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
