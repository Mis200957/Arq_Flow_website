import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AISettingsClient from "./AISettingsClient";
import AIManagementPanel from "./AIManagementPanel";

export default async function AISettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: files } = await supabase
    .from("business_files")
    .select("*")
    .eq("business_id", business.id)
    .in("kind", ["kb_doc", "pdf", "image"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <AISettingsClient business={business} />
      <AIManagementPanel businessId={business.id} systemPrompt={business.system_prompt} initialFiles={files ?? []} />
    </div>
  );
}
