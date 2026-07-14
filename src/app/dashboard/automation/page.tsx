import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AutomationClient from "./AutomationClient";

export default async function AutomationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  return <AutomationClient />;
}
