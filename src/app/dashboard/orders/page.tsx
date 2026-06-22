import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { guardModule } from "@/lib/dashboard-access";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  await guardModule("orders");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name, phone)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return <OrdersClient businessId={business.id} initialOrders={orders ?? []} />;
}
