import { createAdminClient } from "@/lib/supabase/admin";
import PlansClient from "./PlansClient";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const db = createAdminClient();

  const [{ data: plans }, { data: businesses }] = await Promise.all([
    db.from("plans").select("*").order("tier_level"),
    db.from("businesses").select("plan_id"),
  ]);

  const subscriberCounts: Record<string, number> = {};
  for (const b of businesses ?? []) {
    subscriberCounts[b.plan_id] = (subscriberCounts[b.plan_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Plans / الخطط</h2>
        <p className="text-muted text-sm mt-1">Manage subscription plan details</p>
      </div>
      <PlansClient
        plans={(plans ?? []) as Parameters<typeof PlansClient>[0]["plans"]}
        subscriberCounts={subscriberCounts}
      />
    </div>
  );
}
