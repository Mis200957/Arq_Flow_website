/* ============================================================
   ArqFlow — Module Resolver  (public entry point)
   ------------------------------------------------------------
   Turns a business_type string into a concrete dashboard config:
   ordered sidebar modules, quick actions, and the matched
   industry template.

   BACKWARD COMPATIBILITY GUARANTEE
   --------------------------------
   Any business_type with no template (legacy values like "other",
   unrecognised free text, empty) resolves to the FULL legacy
   navigation in the exact order shown today. Existing businesses
   therefore see precisely what they saw before — nothing is hidden
   or removed.
   ============================================================ */

import type { IndustryTemplate, ModuleDef, ResolvedModules, L10n } from "./types";
import {
  getModule,
  LEGACY_NAV_KEYS,
  CORE_HEAD_KEYS,
  CORE_TAIL_KEYS,
} from "./registry";
import { INDUSTRY_TEMPLATES, INDUSTRY_ALIASES } from "./industries";
import type { Capabilities, CapabilityKey } from "../capabilities";
import { lockStyleFor } from "../capabilities";

export * from "./types";
export * from "./registry";
export { INDUSTRY_TEMPLATES, INDUSTRY_ALIASES } from "./industries";

/**
 * Which plan capability a module requires, or null if it is always on.
 * Explicit `requires` wins; otherwise every industry-group module is
 * implicitly gated behind `operational_modules`.
 */
export function requirementForModule(mod: ModuleDef): CapabilityKey | null {
  if (mod.requires) return mod.requires;
  if (mod.group === "industry") return "operational_modules";
  return null;
}

/** True when the plan's capabilities grant access to this module. */
export function moduleAllowed(mod: ModuleDef, caps: Capabilities | null | undefined): boolean {
  if (!caps) return true; // no plan context -> ungated (backward compatible)
  const req = requirementForModule(mod);
  return req ? caps[req] === true : true;
}

/**
 * Apply plan gating to an ordered module list (mixed style):
 *   - missing capability with lockStyle "hide" -> removed
 *   - missing capability with lockStyle "lock" -> kept, flagged `locked`
 * When `caps` is undefined, the list is returned unchanged.
 */
function gateNav(mods: ModuleDef[], caps: Capabilities | null | undefined): ModuleDef[] {
  if (!caps) return mods;
  const out: ModuleDef[] = [];
  for (const m of mods) {
    const req = requirementForModule(m);
    if (!req || caps[req]) {
      out.push(m);
      continue;
    }
    if (lockStyleFor(req) === "lock") out.push({ ...m, locked: true });
    // else: hidden
  }
  return out;
}

/** Normalise a raw business_type into a canonical template key. */
export function normalizeBusinessType(raw: string | null | undefined): string {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return "";
  if (INDUSTRY_TEMPLATES[t]) return t;
  if (INDUSTRY_ALIASES[t]) return INDUSTRY_ALIASES[t];
  return t; // unknown — handled by the legacy fallback downstream
}

/** Get the industry template for a business type, or null if none. */
export function getIndustryTemplate(raw: string | null | undefined): IndustryTemplate | null {
  const key = normalizeBusinessType(raw);
  return INDUSTRY_TEMPLATES[key] ?? null;
}

/** True when this business type has a dedicated industry template. */
export function hasIndustryTemplate(raw: string | null | undefined): boolean {
  return getIndustryTemplate(raw) !== null;
}

/** De-duplicate a key list, preserving first-seen order. */
function dedupe(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

/** Apply an industry label override to a module definition (immutably). */
function withOverride(mod: ModuleDef, overrides?: Record<string, L10n>): ModuleDef {
  const o = overrides?.[mod.key];
  return o ? { ...mod, label: o } : mod;
}

/**
 * Resolve a business type into the ordered sidebar nav + quick actions.
 * This is the function the dashboard shell and overview consume.
 *
 * Pass `caps` (the active plan's capabilities) to gate the result by plan:
 *   - operational/industry modules the plan lacks are HIDDEN,
 *   - showcase modules (e.g. broadcasts) the plan lacks are kept LOCKED.
 * Omit `caps` (or pass null) for the full, ungated navigation — keeping
 * every existing caller 100% backward compatible.
 */
export function resolveModules(
  raw: string | null | undefined,
  caps?: Capabilities | null
): ResolvedModules {
  const template = getIndustryTemplate(raw);

  // ---- Legacy / unknown: return the full current navigation ----
  if (!template) {
    const nav = gateNav(
      LEGACY_NAV_KEYS.map(getModule).filter((m): m is ModuleDef => Boolean(m)),
      caps
    );
    const quickActions = ["knowledge-base", "products", "conversations"]
      .map(getModule)
      .filter((m): m is ModuleDef => Boolean(m))
      .filter((m) => moduleAllowed(m, caps));
    return { matched: false, template: null, nav, quickActions };
  }

  // ---- Industry template: head + industry modules + tail ----
  const hidden = new Set(template.hidden ?? []);
  const orderedKeys = dedupe([
    ...CORE_HEAD_KEYS,
    ...template.modules,
    ...CORE_TAIL_KEYS,
  ]).filter((k) => !hidden.has(k));

  const nav = gateNav(
    orderedKeys
      .map(getModule)
      .filter((m): m is ModuleDef => Boolean(m))
      .map((m) => withOverride(m, template.labelOverrides)),
    caps
  );

  const quickActions = template.quickActions
    .map(getModule)
    .filter((m): m is ModuleDef => Boolean(m))
    .map((m) => withOverride(m, template.labelOverrides))
    .filter((m) => moduleAllowed(m, caps));

  return { matched: true, template, nav, quickActions };
}

/**
 * Find the module matching a dashboard pathname (longest-prefix match),
 * with the industry label override applied. Used for page titles.
 */
export function getModuleByPath(
  pathname: string,
  raw: string | null | undefined
): ModuleDef | null {
  const { nav } = resolveModules(raw);
  // exact match first, then longest href prefix
  let best: ModuleDef | null = null;
  for (const m of nav) {
    if (pathname === m.href) return m;
    if (pathname.startsWith(m.href + "/")) {
      if (!best || m.href.length > best.href.length) best = m;
    }
  }
  return best;
}
