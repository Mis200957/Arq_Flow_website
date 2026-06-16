import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/dashboard/ai/upload
 * Registers a file the client already uploaded to Supabase Storage as a
 * knowledge-base source, then queues background processing in n8n
 * (PDF text extraction, embedding generation, KB rebuild).
 */
const schema = z.object({
  path: z.string().min(1).max(500),
  file_name: z.string().min(1).max(300),
  bucket: z.string().min(1).max(100).default("kb-files"),
  kind: z.enum(["kb_doc", "image", "pdf"]).default("kb_doc"),
  mime_type: z.string().max(200).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const d = parsed.data;

  const { data: business } = await supabase
    .from("businesses").select("id, owner_id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: fileRow, error } = await supabase.from("business_files").insert({
    business_id: business.id,
    kind: d.kind,
    bucket: d.bucket,
    storage_path: d.path,
    file_name: d.file_name,
    mime_type: d.mime_type ?? null,
    size_bytes: d.size_bytes ?? null,
    uploaded_by: user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: "Could not register file" }, { status: 500 });

  // Queue background processing (PDF extract / embeddings / KB rebuild) for n8n.
  const admin = createAdminClient();
  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "kb_file_process",
    event: "uploaded",
    level: "info",
    payload: { file_id: fileRow.id, path: d.path, bucket: d.bucket, kind: d.kind, mime_type: d.mime_type ?? null } as never,
  });

  return NextResponse.json({ ok: true, file: fileRow });
}

// DELETE /api/dashboard/ai/upload?id=<business_files.id>
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("business_files").delete().eq("id", id).eq("business_id", business.id);
  return NextResponse.json({ ok: true });
}
