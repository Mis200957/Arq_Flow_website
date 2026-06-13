import { createAdminClient } from "@/lib/supabase/admin";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = createAdminClient();

  const [{ data: settings }, { data: admins }] = await Promise.all([
    db.from("app_settings").select("*"),
    db.from("profiles").select("id, full_name, email, created_at").eq("role", "admin"),
  ]);

  const settingsMap: Record<string, unknown> = {};
  for (const s of settings ?? []) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Settings / الإعدادات</h2>
        <p className="text-muted text-sm mt-1">Configure platform-wide settings</p>
      </div>
      <SettingsClient
        settingsMap={settingsMap}
        admins={(admins ?? []) as Parameters<typeof SettingsClient>[0]["admins"]}
      />
    </div>
  );
}
