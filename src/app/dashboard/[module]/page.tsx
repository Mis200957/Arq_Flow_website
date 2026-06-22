import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { resolveModules } from "@/lib/modules";
import { guardModule } from "@/lib/dashboard-access";
import { getResource, type FieldDef } from "@/lib/modules/resources";
import ResourceClient from "@/components/dashboard/ResourceClient";

/**
 * Generic industry-module route. Renders full CRUD for any module that
 * has a resource descriptor AND is enabled for this business's industry.
 * Static routes (orders, products, services, ...) take precedence over
 * this dynamic segment, so existing pages are never affected.
 */
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;

  // Plan gate: industry/operational modules require the operational
  // capability. Redirects to the upgrade page if the plan lacks it.
  await guardModule(module);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, business_type")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const descriptor = getResource(module);
  if (!descriptor) notFound();

  // Purpose-built: only expose modules that belong to this industry.
  const { nav } = resolveModules(business.business_type);
  const navItem = nav.find((m) => m.key === module);
  if (!navItem) notFound();

  // Loosely-typed access for dynamically-named industry tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // --- fetch rows (apply base filter for view-style modules) ---
  const resolveToken = (v: string): string => {
    const now = new Date();
    if (v === "$todayStart") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    if (v === "$tomorrowStart") return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    return v;
  };

  let query = db.from(descriptor.table).select("*").eq("business_id", business.id);
  for (const bf of descriptor.baseFilter ?? []) {
    if (bf.op === "in" && Array.isArray(bf.value)) query = query.in(bf.column, bf.value);
    else if (bf.op === "eq") query = query.eq(bf.column, resolveToken(String(bf.value)));
    else if (bf.op === "gte") query = query.gte(bf.column, resolveToken(String(bf.value)));
    else if (bf.op === "lt") query = query.lt(bf.column, resolveToken(String(bf.value)));
  }
  query = query.order(descriptor.orderBy.column, { ascending: descriptor.orderBy.ascending });
  const { data: rows } = await query;

  // --- fetch reference options for ref fields ---
  const refData: Record<string, { id: string; label: string }[]> = {};
  const refFields = descriptor.fields.filter((f: FieldDef) => f.type === "ref" && f.ref);
  await Promise.all(
    refFields.map(async (f: FieldDef) => {
      const { data } = await db
        .from(f.ref!.table)
        .select(`id, ${f.ref!.labelField}`)
        .eq("business_id", business.id);
      refData[f.key] = (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        label: String(r[f.ref!.labelField] ?? "—"),
      }));
    })
  );

  return (
    <ResourceClient
      businessId={business.id}
      title={navItem.label}
      descriptor={descriptor}
      initialRows={(rows ?? []) as Record<string, unknown>[]}
      refData={refData}
    />
  );
}
