import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("last_interaction_at", { ascending: false })
    .limit(200);

  return <CustomersClient businessId={business.id} initialCustomers={customers ?? []} />;
}
