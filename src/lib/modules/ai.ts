/* ============================================================
   ArqFlow — Industry AI Context Builder
   ------------------------------------------------------------
   Produces the industry-specific scaffold that n8n's
   AI_PROMPT_BUILDER injects when composing each tenant's system
   prompt. Pure data — safe to import from API routes and the
   onboarding / n8n payload builders.

   The platform does NOT replace n8n's prompt builder; it feeds it
   a structured, industry-aware skeleton (focus areas, intents,
   agent tools, knowledge-base structure, defaults) so the bot is
   tailored to the business type. n8n keeps ROUTE_BY_PLAN for model
   selection and layers this industry context on top.
   ============================================================ */

import { getIndustryTemplate, normalizeBusinessType, resolveModules } from "./index";
import { ALL_CAPABILITY_KEYS, type Capabilities } from "../capabilities";

export interface IndustryPromptContext {
  business_type: string;
  matched: boolean;
  industry_label_en: string;
  industry_label_ar: string;
  /** What the assistant does for this industry (en/ar). */
  summary_en: string;
  summary_ar: string;
  /** Customer intents the bot must handle. */
  intents: string[];
  /** Agent tool/function names the workflow should expose. */
  tools: string[];
  /** Knowledge-base category names (en) to structure content around. */
  kb_categories: string[];
  /** Enabled dashboard module keys (informational for n8n). */
  enabled_modules: string[];
  /** Capability keys the active plan unlocks (informational for n8n). */
  enabled_capabilities: string[];
  /** Default conversational settings for the industry. */
  defaults: {
    tone_of_voice?: string;
    fallback_behavior?: string;
    primary_goal?: string;
  };
}

/**
 * Build the structured industry AI context for a business type.
 * Falls back to a safe generic context for unknown/legacy types.
 *
 * Pass `caps` (the tenant's plan capabilities) to make the context
 * plan-aware: gated modules are dropped from `enabled_modules` and the
 * unlocked capability keys are listed in `enabled_capabilities`. Omit it
 * for the full, ungated context (backward compatible).
 */
export function buildIndustryPromptContext(
  rawBusinessType: string | null | undefined,
  caps?: Capabilities | null
): IndustryPromptContext {
  const business_type = normalizeBusinessType(rawBusinessType);
  const template = getIndustryTemplate(rawBusinessType);
  const { nav } = resolveModules(rawBusinessType, caps);
  // Locked (showcase) modules are visible but not active for the bot.
  const enabled_modules = nav.filter((m) => !m.locked).map((m) => m.key);
  const enabled_capabilities = caps
    ? ALL_CAPABILITY_KEYS.filter((k) => caps[k])
    : [...ALL_CAPABILITY_KEYS];

  if (!template) {
    return {
      business_type: business_type || "general",
      matched: false,
      industry_label_en: "General Business",
      industry_label_ar: "نشاط عام",
      summary_en: "A helpful assistant that answers customer inquiries and supports the business.",
      summary_ar: "مساعد ذكي يجاوب على استفسارات العملاء ويدعم النشاط.",
      intents: ["general_inquiry", "pricing", "contact", "working_hours", "location"],
      tools: [],
      kb_categories: ["General", "FAQs", "Contact & Location"],
      enabled_modules,
      enabled_capabilities,
      defaults: {},
    };
  }

  return {
    business_type,
    matched: true,
    industry_label_en: template.label.en,
    industry_label_ar: template.label.ar,
    summary_en: template.ai.summary.en,
    summary_ar: template.ai.summary.ar,
    intents: template.ai.intents,
    tools: template.ai.tools,
    kb_categories: template.ai.kbCategories.map((c) => c.en),
    enabled_modules,
    enabled_capabilities,
    defaults: template.defaults ?? {},
  };
}

/**
 * Render the industry context as a plain-text block that can be
 * dropped directly into a system-prompt template by n8n. Bilingual
 * (Arabic-first, matching the platform) and concise.
 */
export function renderIndustryPromptScaffold(
  rawBusinessType: string | null | undefined
): string {
  const c = buildIndustryPromptContext(rawBusinessType);
  return [
    `## Industry: ${c.industry_label_en} (${c.industry_label_ar})`,
    ``,
    `Role: ${c.summary_en}`,
    `الدور: ${c.summary_ar}`,
    ``,
    `Primary intents to handle: ${c.intents.join(", ")}`,
    `Agent tools available: ${c.tools.length ? c.tools.join(", ") : "(none configured)"}`,
    `Knowledge-base structure: ${c.kb_categories.join(" | ")}`,
    c.defaults.tone_of_voice ? `Default tone: ${c.defaults.tone_of_voice}` : ``,
    c.defaults.primary_goal ? `Primary goal: ${c.defaults.primary_goal}` : ``,
  ]
    .filter(Boolean)
    .join("\n");
}
