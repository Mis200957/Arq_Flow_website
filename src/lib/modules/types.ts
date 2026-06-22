/* ============================================================
   ArqFlow — Module System Types
   ------------------------------------------------------------
   The module system turns ArqFlow from a single fixed dashboard
   into a module-based, multi-industry SaaS platform.

   Design rules (do NOT break):
   - Pure data only. No React / lucide imports here so this file
     is safe to import from server components, API routes, and the
     n8n payload builders — not just client components.
   - Icons are referenced by string key; the UI maps them to lucide
     components in `src/lib/modules/icons.ts`.
   - Everything is additive. Unknown / legacy business types fall
     back to the full current navigation (100% backward compatible).
   ============================================================ */

import type { CapabilityKey } from "../capabilities";

export type Locale = "ar" | "en";

/** Bilingual label used everywhere in the platform. */
export type L10n = { ar: string; en: string };

/**
 * A module is one navigable area of the dashboard.
 * Core modules exist for every business; dynamic modules are
 * attached per industry.
 */
export type ModuleGroup = "core" | "industry" | "billing" | "system";

export interface ModuleDef {
  /** Stable key, also used in URLs and as the override key. */
  key: string;
  /** Route under /dashboard. e.g. "/dashboard/appointments". */
  href: string;
  /** Icon key resolved by src/lib/modules/icons.ts. */
  icon: string;
  /** Bilingual sidebar / page-title label. */
  label: L10n;
  /** Logical grouping (for ordering + section headers if needed). */
  group: ModuleGroup;
  /**
   * Whether a working page exists today.
   * false  -> rendered as a polished "Soon" item that never 404s.
   * Lets us ship the dynamic shell now and the CRUD pages later
   * without ever breaking navigation.
   */
  available: boolean;
  /** Core modules are shown for every business type. */
  core?: boolean;
  /**
   * Plan capability this module requires. When the active plan lacks it,
   * the module is gated: `group === "industry"` modules are hidden, while
   * modules tagged here with a "lock" capability render locked + upsell.
   * Industry-group modules are implicitly gated by `operational_modules`
   * and do NOT need to set this.
   */
  requires?: CapabilityKey;
  /**
   * Runtime-only flag set by the resolver: the active plan lacks the
   * required capability but the module is shown LOCKED (with upgrade CTA)
   * instead of being hidden. Never set this in the static registry.
   */
  locked?: boolean;
}

/** AI configuration scaffold attached to an industry. */
export interface IndustryAITemplate {
  /** One-line description of what the assistant does for this industry. */
  summary: L10n;
  /** Primary customer intents the bot must handle. */
  intents: string[];
  /** Agent tool/function names the workflow should expose. */
  tools: string[];
  /** Knowledge-base categories to seed / structure around. */
  kbCategories: L10n[];
}

/** Per-business-type configuration ("industry template"). */
export interface IndustryTemplate {
  /** Business type key, matches businesses.business_type. */
  type: string;
  /** Bilingual display name of the industry. */
  label: L10n;
  /** Icon key for the industry itself. */
  icon: string;
  /**
   * Ordered industry module keys inserted into the sidebar right
   * after "conversations". Core modules wrap around these.
   */
  modules: string[];
  /** Optional per-industry relabeling of any module (e.g. products -> "Menu"). */
  labelOverrides?: Record<string, L10n>;
  /** Module keys explicitly hidden for this industry (e.g. clinic hides orders). */
  hidden?: string[];
  /** Quick-action module keys surfaced on the overview screen. */
  quickActions: string[];
  /** AI prompt + knowledge-base scaffold. */
  ai: IndustryAITemplate;
  /** Default business settings applied at onboarding (all optional, additive). */
  defaults?: {
    tone_of_voice?: "formal" | "friendly" | "egyptian";
    fallback_behavior?: "handover" | "collect" | "apologize";
    primary_goal?: string;
  };
}

/** Result of resolving a business type into a concrete dashboard config. */
export interface ResolvedModules {
  /** True when a real industry template matched (vs legacy fallback). */
  matched: boolean;
  /** The matched template, if any. */
  template: IndustryTemplate | null;
  /** Ordered module definitions for the sidebar (labels already overridden). */
  nav: ModuleDef[];
  /** Quick-action module definitions for the overview screen. */
  quickActions: ModuleDef[];
}
