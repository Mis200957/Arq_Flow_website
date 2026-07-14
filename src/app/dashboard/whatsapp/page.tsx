import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WhatsAppClient from "./WhatsAppClient";

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id, instance_name").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: instance } = await supabase
    .from("instances")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  return (
    <WhatsAppClient
      businessId={business.id}
      initialInstance={instance}
    />
  );
}
