import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { guardModule } from "@/lib/dashboard-access";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  await guardModule("products");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  return <ProductsClient businessId={business.id} initialProducts={products ?? []} />;
}
