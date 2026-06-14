import { NextResponse } from "next/server";
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

/**
 * Telegram webhook — handles Approve / Reject inline button taps.
 *
 * Register once (replace <DOMAIN> and the secret):
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=https://<DOMAIN>/api/telegram/webhook" \
 *     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
 *
 * Telegram sends the secret back in the X-Telegram-Bot-Api-Secret-Token header.
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
    // ignore everything except button presses
    return NextResponse.json({ ok: true });
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

  const editResult = (text: string) =>
    isPhoto ? editMessageCaption(chatId, messageId, text) : editMessageText(chatId, messageId, text);

  // 3) resolve an admin actor id for audit/reviewed_by
  const db = createAdminClient();
  const { data: adminProfile } = await db
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();
  const actorId = adminProfile?.id;
  if (!actorId) {
    await answerCallbackQuery(cq.id, "لا يوجد حساب أدمن");
    return NextResponse.json({ ok: true });
  }

  // 4) PRE-CHECK: was this payment already handled? (two recipients / double-tap)
  const { data: existing } = await db
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .single();
  if (!existing) {
    await answerCallbackQuery(cq.id, "الدفعة غير موجودة");
    await editResult("⚠️ الدفعة غير موجودة.");
    return NextResponse.json({ ok: true });
  }
  if (existing.status !== "pending") {
    const label =
      existing.status === "approved" ? "تم تأكيدها ✅" :
      existing.status === "rejected" ? "تم رفضها ❌" : existing.status;
    await answerCallbackQuery(cq.id, `الدفعة ${label} بالفعل`);
    await editResult(`ℹ️ هذه الدفعة <b>${label}</b> بالفعل (من حساب آخر أو ضغطة سابقة).`);
    return NextResponse.json({ ok: true });
  }

  if (action === "pay_approve") {
    await answerCallbackQuery(cq.id, "جاري التأكيد…");
    const res = await approvePayment(paymentId, actorId);
    if (!res.ok) {
      await editResult(`⚠️ تعذّر التأكيد: ${res.error}`);
      return NextResponse.json({ ok: true });
    }
    let msg = "✅ <b>تم تأكيد الدفعة</b> — جاري تجهيز البوت.";
    if (res.factory_error) msg += `\n⚠️ مصنع البوت: ${res.factory_error}`;
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
    return NextResponse.json({ ok: true });
  }

  if (action === "pay_reject") {
    await answerCallbackQuery(cq.id, "تم الرفض");
    const res = await rejectPayment(paymentId, actorId, "Rejected via Telegram");
    await editResult(res.ok ? "❌ <b>تم رفض الدفعة.</b>" : `⚠️ تعذّر الرفض: ${res.error}`);
    return NextResponse.json({ ok: true });
  }

  await answerCallbackQuery(cq.id);
  return NextResponse.json({ ok: true });
}
