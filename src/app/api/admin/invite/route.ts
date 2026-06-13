import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const { email } = body as { email?: string };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const db = createAdminClient();

  // Create auth user with admin role
  const { data: newUser, error: createErr } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (createErr || !newUser.user) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create user" }, { status: 500 });
  }

  // Upsert profile with admin role
  await db.from("profiles").upsert({
    id: newUser.user.id,
    email,
    role: "admin",
  }, { onConflict: "id" });

  const admin = {
    id: newUser.user.id,
    full_name: null,
    email,
    created_at: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, admin });
}
