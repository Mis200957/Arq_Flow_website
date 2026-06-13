import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Generate a random API key: arq_<prefix>_<random>
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const prefix = `arq_${crypto.randomBytes(4).toString("hex")}`;
  const fullKey = `${prefix}_${randomBytes}`;
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  const { data: record, error } = await supabase
    .from("api_keys")
    .insert({
      business_id: business.id,
      name: name.trim(),
      key_prefix: prefix,
      key_hash: keyHash,
    })
    .select("id, name, key_prefix, created_at, last_used_at, revoked")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Return the full key once (not stored)
  return NextResponse.json({ key: fullKey, record });
}
