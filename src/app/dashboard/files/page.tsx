import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FilesClient from "./FilesClient";

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: files } = await supabase
    .from("business_files")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return <FilesClient businessId={business.id} initialFiles={files ?? []} />;
}
