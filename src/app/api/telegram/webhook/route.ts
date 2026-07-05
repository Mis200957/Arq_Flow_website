import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { approvePayment, rejectPayment } from "@/lib/payments";
import {
  answerCallbackQuery,
  editMessageCaption,
  editMessageText,
  sendMessage,
  isAdminChat,
} from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Provisioning runs in after() (post-response). Give it headroom for the
// n8n Bot Factory call (up to 15s) plus the surrounding DB writes.
export const maxDuration = 30;

/**
 * Telegram webhook — handles Approve / Reject inline button taps.
 *
 * DESIGN: "acknowledge fast, process later".
 * Telegram waits only a few seconds for answerCallbackQuery, then returns
 * BOT_RESPONSE_TIMEOUT to the tapping client. So we:
 *   1) answer the callback + return 200 immediately (no DB before this)
 *   2) run all provisioning work in after() (post-response, same invocation)
 *   3) report the final result by editing the original message
 *
 * Register once (replace <DOMAIN> and the secret):
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=https://<DOMAIN>/api/telegram/webhook" \
 *     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 */
export async function POST(req: Request) {
  // 1) verify the request really comes from Telegram
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || header !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const cq = update?.callback_query;
  if (!cq?.data || !cq.message) {
    return NextResponse.json({ ok: true }); // ignore non-button updates
  }

  // 2) only a configured admin chat may act
  if (!isAdminChat(cq.from?.id)) {
    await answerCallbackQuery(cq.id, "غير مصرّح");
    return NextResponse.json({ ok: true });
  }

  const chatId: number = cq.message.chat.id;
  const messageId: number = cq.message.message_id;
  const isPhoto = Array.isArray(cq.message.photo);
  const [action, paymentId] = String(cq.data).split(":");

  // 3) ACK FIRST — before any DB work — so Telegram never times out.
  await answerCallbackQuery(
    cq.id,
    action === "pay_reject" ? "جاري الرفض…" : "جاري التأكيد…"
  );

  // 4) Do all the heavy lifting AFTER the 200 has been sent to Telegram.
  after(async () => {
    const editResult = (text: string) =>
      isPhoto
        ? editMessageCaption(chatId, messageId, text)
        : editMessageText(chatId, messageId, text);

    try {
      const db = createAdminClient();

      // resolve an admin actor id for audit/reviewed_by
      const { data: adminProfile } = await db
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .single();
      const actorId = adminProfile?.id;
      if (!actorId) {
        await editResult("⚠️ لا يوجد حساب أدمن مهيّأ لتنفيذ العملية.");
        return;
      }

      // PRE-CHECK: was this payment already handled? (two recipients / double-tap)
      const { data: existing } = await db
        .from("payments")
        .select("status")
        .eq("id", paymentId)
        .single();
      if (!existing) {
        await editResult("⚠️ الدفعة غير موجودة.");
        return;
      }
      if (existing.status !== "pending") {
        const label =
          existing.status === "approved" ? "تم تأكيدها ✅" :
          existing.status === "rejected" ? "تم رفضها ❌" : existing.status;
        await editResult(`ℹ️ هذه الدفعة <b>${label}</b> بالفعل (من حساب آخر أو ضغطة سابقة).`);
        return;
      }

      if (action === "pay_approve") {
        const res = await approvePayment(paymentId, actorId);
        if (!res.ok) {
          await editResult(`⚠️ تعذّر التأكيد: ${res.error}`);
          return;
        }
        let msg = "✅ <b>تم تأكيد الدفعة</b> — جاري تجهيز البوت.";
        if (res.factory_error) msg += `\n⚠️ مصنع البوت: ${res.factory_error}`;
        if (res.client_notified) msg += "\n📲 اتبعتت بيانات الدخول للعميل على واتساب.";
        else if (res.client_notify_error) msg += `\n⚠️ واتساب العميل: ${res.client_notify_error}`;
        await editResult(msg);
        if (res.credentials) {
          await sendMessage(
            chatId,
            `🔑 <b>بيانات دخول العميل</b>\n\n` +
              `معرّف العميل: <code>${res.credentials.client_id}</code>\n` +
              `الإيميل: <code>${res.credentials.email}</code>\n` +
              `الباسوورد: <code>${res.credentials.password}</code>\n\n` +
              `ابعتها للعميل — مش هتظهر تاني.`
          );
        }
        return;
      }

      if (action === "pay_reject") {
        const res = await rejectPayment(paymentId, actorId, "Rejected via Telegram");
        await editResult(res.ok ? "❌ <b>تم رفض الدفعة.</b>" : `⚠️ تعذّر الرفض: ${res.error}`);
        return;
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : "unknown error";
      const editResult = (text: string) =>
        isPhoto
          ? editMessageCaption(chatId, messageId, text)
          : editMessageText(chatId, messageId, text);
      await editResult(`⚠️ خطأ غير متوقع أثناء المعالجة: ${err}`).catch(() => {});
    }
  });

  // 5) Return 200 immediately — Telegram is satisfied; work continues in after().
  return NextResponse.json({ ok: true });
}
