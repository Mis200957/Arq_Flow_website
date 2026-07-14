import { createAdminClient } from "@/lib/supabase/admin";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const db = createAdminClient();

  const { data: payments } = await db
    .from("payments")
    .select(
      "id, amount_egp, method, status, transaction_ref, screenshot_path, created_at, payment_type, rejection_reason, businesses(id, business_name, status, plan_id), plans(name, name_ar)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Payments / المدفوعات</h2>
        <p className="text-muted text-sm mt-1">Review and manage all payment submissions</p>
      </div>
      <PaymentsClient payments={(payments ?? []) as Parameters<typeof PaymentsClient>[0]["payments"]} />
    </div>
  );
}
