import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AISettingsClient from "./AISettingsClient";

export default async function AISettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  return <AISettingsClient business={business} />;
}
