import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();

  const { data: payment } = await db
    .from("payments")
    .select("screenshot_path")
    .eq("id", id)
    .single();

  if (!payment?.screenshot_path) {
    return NextResponse.json({ error: "No screenshot available" }, { status: 404 });
  }

  const { data: signedData, error } = await db.storage
    .from("payment-screenshots")
    .createSignedUrl(payment.screenshot_path, 3600);

  if (error || !signedData) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ url: signedData.signedUrl });
}
