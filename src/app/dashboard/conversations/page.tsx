import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConversationsClient from "./ConversationsClient";

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) redirect("/onboarding");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, customers(id, name, phone, tags, sentiment)")
    .eq("business_id", business.id)
    .order("last_message_at", { ascending: false })
    .limit(100);

  return (
    <ConversationsClient
      businessId={business.id}
      initialConversations={conversations ?? []}
    />
  );
}
