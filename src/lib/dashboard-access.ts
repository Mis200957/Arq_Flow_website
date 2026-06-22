/* ============================================================
   ArqFlow — Server-side dashboard access guard
   ------------------------------------------------------------
   Belt-and-braces gating: hiding a module in the sidebar is not
   enough — a Starter tenant could still deep-link to /dashboard/orders.
   Call `guardModule(key)` at the top of any plan-gated page's server
   component. If the active plan lacks the capability, the request is
   redirected to the subscription page with an `?upgrade=` hint.

   Returns the resolved Capabilities so the caller can do finer-grained
   gating inside the page if needed.
   ============================================================ */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCapabilities, type Capabilities } from "@/lib/capabilities";
import { getModule, requirementForModule } from "@/lib/modules";

/** Load the current tenant's plan capabilities (server-side). */
export async function getTenantCapabilities(): Promise<Capabilities> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("plan_id")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: plan } = await supabase
    .from("plans")
    .select("tier_level, capabilities")
    .eq("id", business.plan_id)
    .single();

  return resolveCapabilities(plan);
}

/**
 * Guard a plan-gated dashboard page. Redirects to the subscription
 * page (with an upgrade hint) when the active plan can't access the
 * given module. Returns the capabilities map on success.
 */
export async function guardModule(moduleKey: string): Promise<Capabilities> {
  const caps = await getTenantCapabilities();
  const mod = getModule(moduleKey);
  if (mod) {
    const req = requirementForModule(mod);
    if (req && !caps[req]) redirect(`/dashboard/subscription?upgrade=${moduleKey}`);
  }
  return caps;
}
