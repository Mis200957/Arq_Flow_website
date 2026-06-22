import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { guardModule } from "@/lib/dashboard-access";
import BroadcastsClient from "./BroadcastsClient";

export default async function BroadcastsPage() {
  await guardModule("broadcasts");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const [{ data: broadcasts }, { data: customers }] = await Promise.all([
    supabase
      .from("broadcasts")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("tags")
      .eq("business_id", business.id),
  ]);

  const allTags = Array.from(new Set((customers ?? []).flatMap((c) => c.tags)));

  return <BroadcastsClient businessId={business.id} initialBroadcasts={broadcasts ?? []} allTags={allTags} />;
}
