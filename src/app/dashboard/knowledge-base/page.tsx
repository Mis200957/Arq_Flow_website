import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KBClient from "./KBClient";

export default async function KBPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: entries } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return <KBClient businessId={business.id} initialEntries={entries ?? []} />;
}
