import "server-only";

/**
 * Evolution API helper — sends WhatsApp messages from an agency-owned instance.
 * Used to deliver client onboarding (login credentials + QR-linking steps) the
 * moment a setup payment is approved.
 *
 * Required env vars:
 *   EVOLUTION_API_URL              — base URL of the Evolution API server
 *   EVOLUTION_API_KEY              — global/instance API key (sent as `apikey`)
 *   EVOLUTION_ONBOARDING_INSTANCE  — instance used to send (default: "Arq Flow")
 *
 * Targets Evolution API v2 (`POST /message/sendText/{instance}` → { number, text }).
 */

const base = () => process.env.EVOLUTION_API_URL?.replace(/\/+$/, "") ?? null;
const apiKey = () => process.env.EVOLUTION_API_KEY ?? null;
const onboardingInstance = () => process.env.EVOLUTION_ONBOARDING_INSTANCE ?? "Arq Flow";

export function isEvolutionConfigured(): boolean {
  return !!base() && !!apiKey();
}

/**
 * Normalize a phone number to Evolution's expected international, digits-only
 * MSISDN. Tuned for Egypt but leaves already-international numbers untouched.
 *   01090362926        → 201090362926
 *   +20 109 036 2926   → 201090362926
 *   00201090362926     → 201090362926
 *   201090362926       → 201090362926 (unchanged)
 */
export function normalizeMsisdn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2); // drop intl access prefix
  if (d.startsWith("0") && d.length === 11) d = "20" + d.slice(1); // local 01XXXXXXXXX
  else if (d.startsWith("1") && d.length === 10) d = "20" + d; // bare 1XXXXXXXXX
  return d;
}

/** Send a plain-text WhatsApp message via Evolution API. */
export async function sendWhatsAppText(
  number: string,
  text: string,
  instance?: string
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const b = base();
  const k = apiKey();
  if (!b || !k) return { ok: false, error: "EVOLUTION_API_URL / EVOLUTION_API_KEY not set" };

  const inst = instance ?? onboardingInstance();
  const url = `${b}/message/sendText/${encodeURIComponent(inst)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: k },
      body: JSON.stringify({ number, text }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        (json?.response?.message && JSON.stringify(json.response.message)) ||
        json?.message ||
        json?.error ||
        `Evolution sendText → ${res.status}`;
      return { ok: false, error: String(detail) };
    }
    return { ok: true, id: json?.key?.id ?? json?.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Evolution unreachable" };
  }
}

/**
 * Build the "bot is ready" WhatsApp message — sent to the client the moment the
 * n8n Bot Factory workflow finishes successfully (login details + QR-linking).
 */
export function botReadyMessage(p: {
  clientId: string;
  email: string;
  password: string;
  loginUrl: string;
}): string {
  return (
    `مرحبًا 👋\n` +
    `يسعدنا إبلاغك بأنه تم إنشاء البوت الخاص بك بنجاح وهو الآن جاهز للتفعيل. 🎉\n` +
    `يرجى الاحتفاظ ببيانات تسجيل الدخول التالية، لأنها لن تظهر مرة أخرى:\n` +
    `🔑 بيانات الدخول\n\n` +
    `• معرّف العميل: ${p.clientId}\n` +
    `• الإيميل: ${p.email}\n` +
    `• كلمة المرور: ${p.password}\n\n` +
    `لتفعيل البوت، اتبع الخطوات التالية:\n\n` +
    `1. سجّل الدخول إلى المنصة من خلال الرابط: ${p.loginUrl}\n` +
    `2. بعد تسجيل الدخول، سيظهر لك QR Code.\n` +
    `3. افتح تطبيق WhatsApp على هاتفك، ثم انتقل إلى الأجهزة المرتبطة (Linked Devices) واضغط ربط جهاز، ثم امسح الـQR Code الظاهر في المنصة.\n\n` +
    `بمجرد إتمام الربط، سيتم تفعيل البوت وربطه بحساب الواتساب الخاص بك، وسيصبح جاهزًا للعمل.\n` +
    `إذا واجهت أي مشكلة أثناء تسجيل الدخول أو ربط الواتساب، تواصل معنا وسنساعدك بكل سرور. 🌹`
  );
}
