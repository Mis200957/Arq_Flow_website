/* ============================================================
   ArqFlow — Notification helper (server-side)
   ------------------------------------------------------------
   Single entry point for raising a notification. It:
     1. inserts a dashboard notification (in-app center + bell), and
     2. logs an automation event so n8n can fan it out to the
        requested channels (WhatsApp via SHARED_SEND_REMINDER,
        email via SHARED_SEND_EMAIL).

   Pass an admin Supabase client (service role) so inserts bypass RLS.
   Reused by usage thresholds, subscription events, AI/KB jobs, etc.
   ============================================================ */

import type { Json } from "@/lib/database.types";

export type NotifyChannel = "dashboard" | "whatsapp" | "email";

export interface NotifyInput {
  user_id?: string | null;
  business_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  /** Defaults to dashboard only. */
  channels?: NotifyChannel[];
  whatsapp?: string | null;
  email?: string | null;
}

// Loosely typed: callers pass createAdminClient(); avoids tight coupling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

export async function notify(admin: AdminClient, input: NotifyInput): Promise<void> {
  const channels = input.channels ?? ["dashboard"];

  // 1) Dashboard notification (always recorded so it appears in the center).
  if (input.user_id) {
    await admin.from("notifications").insert({
      user_id: input.user_id,
      business_id: input.business_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  }

  // 2) Off-platform channels → hand to n8n via automation_logs.
  const external = channels.filter((c) => c !== "dashboard");
  if (external.length) {
    await admin.from("automation_logs").insert({
      business_id: input.business_id,
      workflow: "notify",
      event: input.type,
      level: "info",
      payload: {
        channels: external,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        whatsapp: input.whatsapp ?? null,
        email: input.email ?? null,
      } as unknown as Json,
    });
  }
}
