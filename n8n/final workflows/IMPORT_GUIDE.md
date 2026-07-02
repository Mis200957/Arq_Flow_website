# n8n Import & Deployment Guide — July 2026 fixes

هذا الدليل يغطي نشر التعديلات الجديدة على n8n (`bc1b1373.kube-ops.com`).
الملفات في هذا المجلد هي **المصدر الوحيد للحقيقة** — أي تعديل على n8n لازم يتصدّر هنا.

---

## 1) متغيرات البيئة المطلوبة في n8n

أضِف/تأكد من وجود الآتي في n8n (Settings → Variables أو env للحاوية):

| Variable | Value | جديد؟ |
|---|---|---|
| `ARQFLOW_HMAC_SECRET` | نفس قيمة `N8N_WEBHOOK_SECRET` في Vercel/.env.local | موجود |
| `ARQFLOW_CALLBACK_URL` | `https://<production-domain>/api/n8n/callback` | ✅ جديد |
| `SUPABASE_URL` | `https://zjathejcdkpxjyvululp.supabase.co` | موجود |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | موجود |
| `EVOLUTION_API_URL` | `https://evo.mis.rooyai.com` | ✅ جديد |
| `EVOLUTION_API_KEY` | Evolution global API key | ✅ جديد |
| `N8N_BASE_URL` | `https://bc1b1373.kube-ops.com` | موجود |
| `N8N_API_KEY` | n8n API key | موجود |

**مهم جداً:** عُقد الـ Code الجديدة تستخدم `require('crypto')` لحساب HMAC.
في env الحاوية بتاعة n8n أضِف:

```
NODE_FUNCTION_ALLOW_BUILTIN=crypto
```

بدونها كل عُقد VALIDATE_HMAC/BUILD_*_CALLBACK هترمي خطأ.

---

## 2) الملفات المعدَّلة (أعد استيرادها فوق النسخ الحالية)

### `Factory 🏭.json`
- **VALIDATE_HMAC** بعد الويبهوك مباشرة — يرفض أي طلب بدون توقيع صحيح.
- **PROVISION_OK?** بعد كود الحقن — لو فشل الحقن يبعت `provision_failed` للمنصة.
- **BUILD_SUCCESS_CALLBACK → CALLBACK_SUCCESS** بعد تحديث صف businesses — يبعت
  `provision_complete` للمنصة (المنصة تحوّل الحالة لـ `qr_pending` وشاشة العميل تتقدم).
- Evolution instance webhook بقى يستقبل `CONNECTION_UPDATE` بالإضافة لـ `MESSAGES_UPSERT`.
- مسار الويبهوك كما هو: `arqflow_factory_webhook_fw` — تم تصحيح `.env.local`/Vercel ليطابقه.

### `bot template.json`
- **IS_CONNECTION_UPDATE1** بعد WEBHOOK_TRIGGER1: أحداث `connection.update` تتحول
  إلى callback `instance_status` للمنصة (BUILD_STATUS_CALLBACK1 → SEND_STATUS_CALLBACK1)
  بدل ما تدخل مسار الرسائل. أول اتصال ناجح = المنصة تنقل العميل لمرحلة "الفحص".
- `__BUSINESS_ID__` بيتحقن تلقائياً من الـ Factory (موجود في replacements أصلاً).

### `send notification to admin.json`
- `active: true` — **فعّله بعد الاستيراد** (الاستيراد لا يفعّل تلقائياً). هذا هو حارس
  الاستهلاك: تنبيهات 75/90/100% + الإيقاف التلقائي عبر `stop bots`.

---

## 3) الملفات الجديدة (استوردها وفعّلها)

| ملف | التريجر | الوظيفة |
|---|---|---|
| `publish bot after renew.json` | webhook `publish_bot_after_renew` | يعيد نشر workflow البوت + يوقظ instance بعد تجديد اشتراك معلَّق (المنصة بتنده عليه أصلاً من `payments.ts`) |
| `provisioning watchdog.json` | كل 10 دقائق | أي بزنس عالق في `provisioning` أكثر من 15 دقيقة → `provision_failed` callback → تنبيه أدمن + شاشة فشل للعميل |
| `broadcast sender.json` | كل دقيقة | يسحب `broadcasts` بحالة `queued` (الفوري + المجدول)، يفلتر العملاء بالتاجات، يبعت واتساب عبر Evolution برسالة/4 ثواني، ويحدّث `sent_count/failed_count/status` |
| `automation router.json` | كل 5 دقائق | (اختياري) موجّه أحداث `automation_logs` — افتح عقدة CONFIG وحط IDs الـ sub-workflows بعد استيرادها من v6 |

---

## 4) خطوات يدوية لازمة (لا يمكن عملها من الريبو)

1. **صدّر الـ 3 sub-workflows الناقصة** من n8n إلى هذا المجلد (غير موجودة في الريبو):
   - `SHARED_FITCH_COUPONS`
   - `GET AVAILABLE PRODUCTS`
   - **`My workflow 15`** ← أعد تسميته لاسم واضح (مثلاً `SHARED_LOOKUP_ORDER_STATUS`) ثم صدّره.
2. تأكد أن IDs الـ sub-workflows في `bot template.json` لسه مطابقة للـ instance
   (لو أي workflow اتحذف/اتعمل import جديد الـ ID بيتغير والأداة بتفشل بصمت).
3. فعّل بعد الاستيراد: `Factory 🏭`, `send notification to admin`,
   `publish bot after renew`, `provisioning watchdog`, `broadcast sender`.
4. في Supabase Dashboard → Authentication → Settings: فعّل
   **Leaked password protection** (مش متاح عبر SQL).
5. **بدّل مفاتيح `.env.local`** لو الريبو اتشارك مع أي حد (Telegram token,
   HMAC secret, service role) — كلها ظاهرة في الملف حالياً.

---

## 5) اختبار الدورة كاملة (End-to-End)

1. أنشئ onboarding تجريبي + ادفع → وافق من التليجرام/الأدمن.
2. العميل يسجّل دخول → يشوف "جاري إنشاء البوت..." (status=`provisioning`).
3. الـ Factory يخلص → callback → الشاشة تتحول لتعليمات الربط (`qr_pending`).
4. اضغط "أنا جاهز" → QR يظهر (من `/api/dashboard/provisioning/qr`) → امسحه.
5. Evolution يبعت `connection.update` → البوت template يبعت `instance_status`
   → الحالة `under_review` + رسالة تليجرام للأدمن.
6. من `/admin/clients` اضغط ✓ (Run checks & activate) → الحالة `active`
   → شاشة العميل تتحدث تلقائياً وتدخله الداشبورد.
7. جرّب فشل متعمد (عطّل Evolution مؤقتاً) وتأكد أن الـ watchdog يقلب الحالة
   `provision_failed` خلال ~15-25 دقيقة.
