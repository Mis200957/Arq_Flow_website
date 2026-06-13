import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return <ServicesClient businessId={business.id} initialServices={services ?? []} />;
}
