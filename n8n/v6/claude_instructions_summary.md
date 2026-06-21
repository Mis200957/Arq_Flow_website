# ملخص التعديلات — bot template_updated.json

تطوير قالب البوت متعدد المستأجرين (n8n + Supabase + Evolution/WhatsApp) ليغطي كل أنواع الأعمال، مع **الحفاظ الكامل على كل العُقد والمنطق الحالي** — لم يُحذف أو يُعدَّل أي مسار قائم؛ كل التغييرات إما **إضافة** أو **تحسين وصف**.

---

## 1) المنهجية: استنتاج مبني على قاعدة البيانات الفعلية لا على الخيال

تم فحص مشروع Supabase الحي `zjathejcdkpxjyvululp — "Arq Flow databases"` مباشرة (`list_tables` + `information_schema`). النتيجة: قاعدة البيانات **مُصمّمة مسبقًا** لكل القطاعات، وكل أداة جديدة مبنية على جدول حقيقي وأعمدة حقيقية — لا توجد أي أداة من الخيال.

| القطاع | الجداول الحقيقية المستخدمة |
|---|---|
| تجارة/مطاعم (قائم) | `products`, `categories`, `coupons`, `promotions`, `delivery_zones`, `orders` |
| عيادات/طبي (قائم) | `doctors`, `medical_services`, `patients`, `appointments` |
| فنادق | `rooms`, `guests`, `reservations` |
| عقارات | `properties`, `agents`, `property_requests`, `property_visits` |
| تعليم | `courses`, `teachers`, `students`, `enrollments` |
| جيم | `trainers`, `classes`, `memberships`, `class_attendance` |
| صالونات/خدمات/صيانة | `services`, `staff`, `technicians`, `service_requests`, `work_orders` |
| محاماة | `cases`, `case_clients`, `case_documents` |
| استشارات (مشترك) | `consultation_requests`, `follow_ups` |
| مشترك لكل الأنشطة | `knowledge_base`, `links`, `customer_preferences`, `business_hours` |

> هذا يطابق مصفوفة `INDUSTRY_TEMPLATES` في `src/lib/modules/industries.ts` و`n8n/CAPABILITY_MATRIX.md` داخل مشروعك — أي أن التوسعة تتبع بنيتك المعتمدة بالحرف.

---

## 2) تحسين أوصاف الأدوات الحالية (عربي دقيق)

أُضيف/حُسِّن `toolDescription` (لعُقد supabaseTool) و`description` (لعُقد toolWorkflow) لكل الأدوات القائمة، مع تحديد **الوظيفة + متى تُستخدم + معلمات الـ JSON**:

`escalate` · `save_transaction` · `coupons` · `cancel_order` · `book_appointment` · `cancel_appointment` · `fitch_products` · `delivery_zones` · `promotions` · `order_track` · `customer_information` · `fitch_doctors` · `fitch_appointments`.

> **ملاحظة على `Calculator`**: عُقدة `toolCalculator` لا تدعم حقل وصف مخصص في n8n، لذا عُرِّفت وظيفتها داخل البرومبت الديناميكي بدلًا من ذلك.

---

## 3) إضافة 30 أداة جديدة (كلها supabaseTool — تعمل فورًا بدون workflows إضافية)

اختيار `supabaseTool` (قراءة/كتابة مباشرة) بدل `toolWorkflow` مقصود: عُقد `toolWorkflow` تتطلب IDs لـ sub-workflows على سيرفر n8n لديك (غير معروفة هنا)، أما `supabaseTool` فمكتفية ذاتيًا وتعمل لحظة الاستيراد. الربط القياسي:
`business_id ← $('TENANT_CONFIG1').item.json.business_id` · `customer_id ← $('MERGE_CUSTOMER_PATHS1').first().json.id` · القيم من العميل عبر `$fromAI('field','','type')`.

**أدوات مشتركة (مفقودة سابقًا رغم ذكرها في الكونفيج):** `send_link` (قراءة `links`) · `lookup_order_status` (حالة سريعة من `orders`) · `save_preference` (كتابة `customer_preferences`) · `search_knowledge_base` · `fetch_business_hours` · `fetch_categories` · `fetch_services` · `fetch_staff` · `fetch_medical_services`.

**فنادق:** `fetch_rooms` · `book_reservation` · `cancel_reservation`.
**عقارات:** `fetch_properties` · `fetch_agents` · `save_property_request` · `book_property_visit`.
**تعليم:** `fetch_courses` · `fetch_teachers` · `save_student` → `enroll_course` (خطوتان: إنشاء الطالب ثم الإلحاق، لأن `enrollments` يرتبط بـ `student_id`).
**جيم:** `fetch_classes` · `fetch_trainers` · `fetch_memberships` · `save_membership`.
**خدمات/صيانة:** `fetch_technicians` · `save_service_request` · `track_work_order`.
**محاماة واستشارات:** `fetch_cases` · `register_case_client` · `save_consultation_request`.

كل أداة جديدة موصولة بـ `MAIN_AI_AGENT` عبر `ai_tool`، ومجمّعة بصريًا تحت Sticky Notes ملوّنة حسب القطاع.

---

## 4) البرومبت الرئيسي أصبح ديناميكيًا بالكامل

استُبدل `systemMessage` الثابت بتعبير n8n (دالة IIFE) يبني البرومبت لحظيًا من `TENANT_CONFIG`:

- **خريطة Playbook** لكل نوع نشاط (الدور + الأدوات الموصى بها) تطابق `industries.ts`.
- **معالجة المرادفات** (`realestate→real_estate`, `school→educational_center`, `fitness→gym`, `cafe→restaurant`...).
- **أولوية الأدوات**: `enabled_tools` من الكونفيج إن وُجدت، وإلا أدوات الـ playbook الافتراضية، + أدوات مشتركة دائمًا.
- **توافق رجعي 100%**: لو الكونفيج فيه `system_prompt` جاهز، يُحفظ كما هو ويُضاف له قسم «توجيه الأدوات» المولّد تلقائيًا؛ ولو غير موجود، يُبنى برومبت كامل من `business_name` + `business_type` + `persona`.

**النتيجة:** أي مستأجر جديد يكفيه ضبط `business_type` و`business_name` ليحصل على برومبت صحيح ومحدّد الأدوات تلقائيًا — صفر كتابة يدوية.

---

## 5) التحقق (Validation)

- ✅ JSON صالح ويُحلَّل بنجاح — **95 عقدة** (كانت 41)، **30 أداة جديدة**.
- ✅ لا أسماء أو IDs مكرّرة.
- ✅ كل وصلات `connections` تشير لعُقد موجودة؛ كل الأدوات الـ44 موصولة بـ `MAIN_AI_AGENT`.
- ✅ تعبير البرومبت الديناميكي يُجمَّع ويعمل (`node`) عبر 4 سيناريوهات: قطاع باسم مباشر، مرادف، تجاوز `enabled_tools`، ومسار التوافق الرجعي.
- ✅ كل عُقد supabaseTool الجديدة تحمل `toolDescription`.

---

## 6) توصيات (لم تُطبَّق احترامًا لقاعدة «لا تعدّل القائم» — قرارك)

1. **تسريب بيانات في `fitch_appointments`**: فلتره فارغ (`conditions: []`) فيرجع مواعيد كل المستأجرين. يُنصح بإضافة شرط `business_id = TENANT_CONFIG1.business_id`. (تُرك دون تغيير لأنه تعديل على منطق قائم.)
2. **حِمل الأدوات على وكيل واحد**: 44 أداة موصولة بوكيل واحد ثقيلة على الـ LLM. القالب مصمم ليعمل كـ«ماستر» يُستنسخ، والبرومبت الديناميكي يحصر الاستخدام في أدوات القطاع — لكن للأداء الأمثل يُفضّل أن يقطع الـ Factory وصلات الأدوات غير المستخدمة لكل مستأجر (إبقاء أدوات قطاعه + المشتركة فقط).
3. **الكتابة عبر sub-workflows لاحقًا**: عندك بالفعل `SHARED_ROOM_RESERVATION_v1` و`SHARED_GET_AVAILABLE_SLOTS_v1` و`SHARED_SEND_REMINDER_v1`... يمكن لاحقًا تحويل أدوات الكتابة الحساسة (الحجوزات) من `supabaseTool` مباشر إلى `toolWorkflow` يستدعيها للتحقق من التعارض/الإتاحة قبل الإدراج.
