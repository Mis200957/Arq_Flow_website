import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("businesses").select("*").eq("owner_id", user.id).single(),
  ]);

  if (!profile || !business) redirect("/login");

  const [{ data: apiKeys }, { data: webhooks }] = await Promise.all([
    supabase.from("api_keys").select("id, name, key_prefix, created_at, last_used_at, revoked").eq("business_id", business.id),
    supabase.from("webhook_endpoints").select("*").eq("business_id", business.id),
  ]);

  return (
    <SettingsClient
      profile={profile}
      business={business}
      apiKeys={apiKeys ?? []}
      webhooks={webhooks ?? []}
    />
  );
}
