import "server-only";

/**
 * Telegram Bot helpers — used to notify the admin of new payments and to
 * handle inline Approve / Reject button presses.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN       — from @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID   — the chat id that receives notifications & may act
 *   TELEGRAM_WEBHOOK_SECRET  — shared secret verified on the webhook (see route)
 */

const TG_API = "https://api.telegram.org";

export type InlineButton = { text: string; callback_data: string };
export type InlineKeyboard = { inline_keyboard: InlineButton[][] };

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

/** Comma-separated list of chat ids that receive notifications & may approve/reject. */
export function adminChatIds(): string[] {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_IDS ?? process.env.TELEGRAM_ADMIN_CHAT_ID ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isAdminChat(id: string | number): boolean {
  return adminChatIds().includes(String(id));
}

export function isTelegramConfigured(): boolean {
  return !!token() && adminChatIds().length > 0;
}

async function call<T = unknown>(
  method: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; result?: T; error?: string }> {
  const t = token();
  if (!t) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const res = await fetch(`${TG_API}/bot${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.description ?? `Telegram ${method} → ${res.status}` };
    }
    return { ok: true, result: json.result as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Telegram unreachable" };
  }
}

export function sendMessage(chatId: string | number, text: string, keyboard?: InlineKeyboard) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  keyboard?: InlineKeyboard
) {
  return call("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

/** Dismiss the spinner on a tapped inline button (optional toast text). */
export function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return call("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

/** Replace the caption of the original notification (e.g. mark as approved). */
export function editMessageCaption(chatId: string | number, messageId: number, caption: string) {
  return call("editMessageCaption", {
    chat_id: chatId,
    message_id: messageId,
    caption,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: [] }, // remove the buttons
  });
}

/** Replace the text of a plain (non-photo) message. */
export function editMessageText(chatId: string | number, messageId: number, text: string) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [] },
  });
}

function esc(s: string | null | undefined): string {
  return String(s ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface NewPaymentNotice {
  paymentId: string;
  orderId: string;
  businessName: string;
  businessType?: string | null;
  planId: string;
  amountEgp: number;
  method?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  transactionRef?: string | null;
  screenshotUrl?: string | null; // signed URL, optional
}

/**
 * Notify the admin chat of a new pending payment with Approve / Reject buttons.
 * Sends the transfer screenshot as a photo when available, else a text message.
 */
export async function notifyNewPayment(n: NewPaymentNotice) {
  const chatIds = adminChatIds();
  if (chatIds.length === 0) return { ok: false, error: "TELEGRAM_ADMIN_CHAT_IDS not set" };

  const caption =
    `🔔 <b>دفعة جديدة في انتظار المراجعة</b>\n\n` +
    `🏢 <b>${esc(n.businessName)}</b>${n.businessType ? ` — ${esc(n.businessType)}` : ""}\n` +
    `📦 الباقة: <b>${esc(n.planId)}</b>\n` +
    `💰 المبلغ: <b>${n.amountEgp.toLocaleString("en")} ج.م</b>\n` +
    `💳 طريقة الدفع: ${esc(n.method)}\n` +
    `👤 ${esc(n.contactName)} — ${esc(n.contactPhone)}\n` +
    `🧾 مرجع التحويل: <code>${esc(n.transactionRef)}</code>\n` +
    `🆔 الطلب: <code>${esc(n.orderId)}</code>`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ أأكد", callback_data: `pay_approve:${n.paymentId}` },
        { text: "❌ أرفض", callback_data: `pay_reject:${n.paymentId}` },
      ],
    ],
  };

  let lastErr: string | undefined;
  for (const chatId of chatIds) {
    let sent = n.screenshotUrl
      ? await sendPhoto(chatId, n.screenshotUrl, caption, keyboard)
      : await sendMessage(chatId, caption, keyboard);
    // fall back to text if Telegram could not fetch the photo URL
    if (!sent.ok && n.screenshotUrl) sent = await sendMessage(chatId, caption, keyboard);
    if (!sent.ok) lastErr = sent.error;
  }
  return lastErr ? { ok: false, error: lastErr } : { ok: true };
}
