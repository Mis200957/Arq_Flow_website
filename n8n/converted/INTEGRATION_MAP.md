# ArqFlow — تكامل الـ Templates ↔ الـ 14 Sub-workflows (Supabase)

كل الربط بين أي template وأي sub-workflow بيتم عن طريق `CLIENT_CONFIG.wf_*` (الـ ID) +
الـ **input mapping** اللي في كل node. صلّحت الـ input mappings كلها تطابق عقد الـ Supabase v2.

## أنهي template بيستخدم أنهي sub-workflows

| Sub-workflow (ملف v2 في `../v6/`) | wf_* key | starter | business | enterprise |
|---|---|:--:|:--:|:--:|
| SHARED_SEND_PRESENCE_v2 | wf_send_presence | ✅ | ✅ | ✅ |
| SHARED_CALCULATE_COST_v2 | wf_calculate_cost | ✅ | ✅ | ✅ |
| SHARED_LOG_CONVERSATION_v2 | wf_log_conversation | ✅ | ✅ | ✅ |
| SHARED_SUMMARIZE_CONVERSATION_v2 | wf_summarize | ✅ | ✅ | ✅ |
| SHARED_AUTO_TAG_CUSTOMER_v2 | wf_auto_tag | ✅ | ✅ | ✅ |
| SHARED_ESCALATION_v2 | wf_escalation | ✅ | ✅ | ✅ |
| SHARED_SAVE_TRANSACTION_v2 | wf_save_transaction | ✅ | ✅ | ✅ |
| SHARED_SEND_LINK_v2 | wf_send_link | — | ✅ | ✅ |
| SHARED_ORDER_CANCEL_v2 🆕 | wf_order_cancel | — | — | ✅ |
| SHARED_ORDER_MODIFY_v2 🆕 | wf_order_modify | — | — | ✅ |
| SHARED_ORDER_TRACK_v2 🆕 | wf_order_track | — | — | ✅ |
| SHARED_PROMO_SEND_v2 🆕 | wf_promo_send | — | — | ✅ |
| SHARED_STOCK_CHECK_v2 🆕 | wf_stock_check | — | — | ✅ |
| SHARED_REVIEW_GET_v2 🆕 | wf_review_get | — | — | ✅ |

🆕 = sub-workflows جديدة بنيتها (كانت ناقصة خالص من الفولدر).

## عقود الإدخال (الـ input contracts) — اللي صلّحته

كل الـ calls كانت بتبعت الشكل القديم (`tenant:{sheets_id,...}`، `customer_id` نصّي، `plan_id`
بتاع Airtable). دلوقتي بتبعت الشكل الصح:

- **calculate_cost** ← `{ tenant:{business_id, plan_id:<tier>}, model, input_tokens, output_tokens }`
- **log_conversation** ← `{ tenant:{business_id}, customer:{phone,name}, customer_message, ai_response, intent, sentiment_score, escalated, input_tokens, output_tokens, cost_egp, model }`
- **escalation** ← `{ tenant:{business_id, instance_name, admin_whatsapp, business_name}, customer:{phone,name}, reason, customer_message, context_summary }`
- **save_transaction** ← `{ tenant:{business_id, instance_name, admin_whatsapp, tax_pct}, customer:{phone,name}, type, items, delivery_fee, payment_method, delivery_address, notes }`
- **send_link** ← `{ tenant:{business_id, instance_name}, customer_jid, category }`
- **send_presence** ← `{ instance_name, remote_jid, delay_ms }`
- **summarize** ← `{ tenant:{business_id}, customer:{phone}, fetch_limit }`
- **auto_tag** ← `{ tenant:{business_id}, customer:{phone}, history_limit }`
- **order_cancel / order_track** ← `{ tenant:{business_id}, order_number }`
- **order_modify** ← `{ tenant:{business_id}, order_number, items, notes }`
- **stock_check** ← `{ tenant:{business_id}, product_name }`
- **promo_send** ← `{ tenant:{business_id, instance_name}, customer_jid }`
- **review_get** ← `{ tenant:{business_id} }`

الحاجات اللي بيقررها الـ AI (reason, items, category, order_number...) بتتمرر من الـ agent
عن طريق `$fromAI(...)`؛ والثوابت (business_id, phone, instance) بتتقري من `CLIENT_CONFIG`/`BUILD_CUSTOMER`.

## مصدر المتغيرات داخل الـ template
- `business_id` ← `CLIENT_CONFIG.business_id` (الـ factory بيحقنه وقت الـ clone)
- `phone` ← `NORMALIZE_INPUT.sender_id` · `jid` ← `NORMALIZE_INPUT.remote_jid`
- `message` ← `NORMALIZE_INPUT.message_text` · `reply` ← `BUILD_FINAL_REPLY.final_reply`
- `name` ← `BUILD_CUSTOMER.customer_name` · `sentiment` ← `SENTIMENT_ANALYSIS.sentiment_score`
- `plan tier` ← `CLIENT_CONFIG.plan_tier` (مش `plan_id` اللي هو Airtable rec id)

## خطوة واحدة مطلوبة منك: اظبط الـ 14 ID
بعد ما تستورد الـ 14 sub-workflow من `../v6/`، حدّث الـ IDs في مكانين:
1. **factory → node `INJECTION_ENGINE` → `subWfIds`** (بيحقن الـ wf_* في كل بوت بيتعمل).
2. **كل template → `CLIENT_CONFIG`** القيم الافتراضية لـ `wf_*` (لو هتشغّل template يدوي للاختبار).

دلوقتي القيم دي لسه على الـ IDs القديمة — بدّلها بالـ IDs الجديدة بتاعت الـ v2.

## اتعمل عليه validation
JSON سليم · كل الـ connections (main + ai) · كل `$('Node')` refs · `node --check` على كل
code node في الـ factory والـ 3 templates · كل insert/enum/RPC على الـ DB الحقيقي بـ rollback.
