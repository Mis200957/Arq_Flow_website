# Factory Template Injection + Pruner: Brainstorm / Discovery Notes
Date: 2026-06-20 · Goal: تصميم كود (JS/Python) ياخد قالب البوت الكامل + نوع النشاط + بيانات العميل، يشيل أدوات/عُقد القطاعات غير المطلوبة، ويحقن TENANT_CONFIG ببيانات العميل — ويطلع workflow جاهز للاستيراد والتفعيل.

## Summary / key decisions
- **اللغة**: n8n Code node (JS) — عقدة واحدة.
- **الإدخال** (مطابق Supabase): `{ template, business(صف businesses), plan(صف plans) }`.
- **الحقن**: placeholder `__TENANT_CONFIG_JSON__` (string-replace) — الكود يفرض الـplaceholder في عقدة TENANT_CONFIG1 ثم يستبدله.
- **الـPruning**: صارم بـkeep-set على مستوى أسماء العُقد لكل business_type + ALWAYS_KEEP(escalate, Calculator) + COMMON مشتركة.
- **النتيجة**: اتبنى الكود + اتأكد شغّال على القالب الموسّع عبر 7 أنواع نشاط.

## Synthesis (الحل النهائي)
ملف `n8n/v6/FACTORY_INJECT_AND_PRUNE.code.js`:
1. يطبّع business_type (مع المرادفات) → keep-set.
2. يبني `tenant_config` من أعمدة `businesses` + `plans` (مع fallbacks).
3. يفرض placeholder في TENANT_CONFIG1، يقصّ أدوات القطاعات غير المختارة + ستيكي نوتساتها، ينضّف الوصلات (source+target)، يستبدل كل الـplaceholders، ويضبط مسار الويبهوك واسم الـworkflow.
4. يرجّع `{ provision_ok, workflow_payload, tenant_config, kept_tools, removed_tools, removed_notes }`.

**النسخة النهائية**: `n8n/v6/FACTORY_INJECT_AND_PRUNE.code.js` (تبني TENANT_CONFIG1 مباشرة + تقفيل بالباقة).

**تحقق نهائي بالـnode عبر الباقات (مطعم):**
- Starter → نصوص فقط (شيلت 10 عُقد وسائط)، أدوات قراءة فقط [12]، شيل الكتابة (save_transaction/cancel_order/send_link/save_preference)، model=haiku، memory=8.
- Business → نصوص+صوت (شيل 4 عُقد صور)، +أدوات الكتابة +send_link +save_preference [16]، model=sonnet، memory=12.
- Enterprise → نصوص+صوت+صور (0 محذوف)، نفس أدوات Business [16]، memory=20، max_tokens=2048.
- كل الحالات: `dangling=0`، TENANT_CONFIG1.jsCode يُحلَّل JSON صح، عُقد الذاكرة/الموديل/الويبهوك مضبوطة من الباقة.
- عزل القطاعات @Business اتأكد: hotel/clinic/real_estate/educational_center/lawyer كل واحد بأدواته بس + المشتركة.

## Open flags (pending input)
- **شكل الإدخال المتداخل** `{template, business, plan}`: العقدة السابقة في الفاكتوري لازم توفّرهم (template من FETCH_TEMPLATE، business+plan من الويبهوك/Supabase). → تأكيد منك على مصدر كل واحد.
- **القالب المُستخدم لازم يكون الموسّع** `bot template_updated.json` (اللي فيه الـ30 أداة). لو القالب القديم، مفيش أدوات قطاعات تتقصّ.
- **COMMON صارمة؟** حاليًا بحتفظ بـ(save_preference, customer_information, search_knowledge_base, fetch_business_hours) لكل الأنشطة (send_link اتنقل لـBusiness). لو عايز قطاع معيّن من غيرها، نعدّل COMMON أو نستخدم industry_config.drop_tools.

### Q5 — تعديلات جديدة (بعد بناء النسخة الأولى)
- **حقن TENANT_CONFIG**: تغيّر القرار → الكود **يبني jsCode للعقدة مباشرة** (`return { json: {...} };`) بدل placeholder.
- **متوافق مع الباقات**: الكود يقرأ tier الباقة (starter/business/enterprise) ويقفّل:
  - **الوسائط**: starter=نصوص فقط · business=+صوت · enterprise=+صور. يقصّ عُقد الصوت/الصور غير المسموحة.
  - **الأدوات**: starter=أدوات قراءة/استعلام + escalate فقط · business=+أدوات الكتابة (طلبات/حجوزات/روابط ذكية/تفضيلات/صوت) · enterprise=كله+صور+ذاكرة أعمق.
  - **قيم التشغيل**: model/memory_window/max_tokens/message_limit/media_support من الباقة تتحقن في الكونفيج + تُربط في عُقد البوت (الذاكرة والموديل).
- مصدر المميزات (الصورة): Starter[نصوص ع/إ، تحويل بشري، تسجيل، لوحة تحكم] · Business[+صوت، طلبات/حجوزات تلقائية، روابط ذكية، ذاكرة تفضيلات] · Enterprise[+صور، ذاكرة أعمق، تحليلات، دعم أولوية].

### Open flag إضافي
- **تصنيف الأدوات لكل tier**: افترضت starter=قراءة فقط (يعرض/يجاوب بدون أدوات كتابة)، business=+كتابة، enterprise=نفس business+صور. لو عايز starter = FAQ بحت (من غير أدوات قراءة منتجات) قولّي — قابل للتعديل من خريطة واحدة أعلى الكود.

## السياق المكتشف من الكود الحالي (Bot_Factory_v6_Supabase.json)
الفاكتوري **بالفعل** يحتوي على خط أنابيب الحقن — المطلوب ترقيته لا بناؤه من الصفر:
- **SELECT_TEMPLATE** (Code): يختار template_id حسب الـplan tier، يطبّع `business_type` عبر `INDUSTRY_CAPS` + `ALIASES`، ويخرج `capabilities` / `enabled_tools` / `persona` / `intents`.
- **BUILD_SYSTEM_PROMPT** (Code): يبني الـsystem_prompt من `business` + `content` (products, services, faqs, hours, location, payment, delivery, return_policy, knowledge_base...) + طبقة الصناعة.
- **INJECTION_ENGINE** (Code): يبني `tenant_config` + خريطة `replacements` فيها `__TENANT_CONFIG_JSON__ = JSON.stringify(tenant_config)` و`__SYSTEM_PROMPT__` ...إلخ.
- **FETCH_TEMPLATE** (HTTP GET) → يجيب الـtemplate من n8n API.
- **APPLY_REPLACEMENTS** (Code): يعمل string-replace للـplaceholders، **ثم pruning محدود**: يشيل فقط عُقد `toolWorkflow` ضمن مجموعة OPTIONAL صغيرة (book_appointment, cancel_appointment, reschedule_appointment, get_available_slots, room_reservation, send_reminder, human_handoff) لو مش في enabled_tools. ثم CREATE_WORKFLOW (POST) → ACTIVATE.

### الفجوات (الـpruning الحالي قاصر بعد توسعة القالب)
1. **لا يشيل أدوات الـsupabaseTool الجديدة** للقطاعات (fetch_rooms, fetch_properties, fetch_courses, fetch_doctors... ~30 أداة). يعني مطعم هيستلم أدوات الفنادق والعقارات والعيادات.
2. **enabled_tools في INDUSTRY_CAPS لا تحتوي أدوات القراءة** (مثلاً restaurant enabled_tools = [escalate, save_transaction, send_link] فقط — مفيهاش fitch_products/delivery_zones)، فالـpruning المدفوع بـenabled_tools لوحده هيشيل أدوات أساسية للقطاع.
3. **لا يشيل الـSticky Notes** الخاصة بالقطاعات المحذوفة.
4. القالب المرفوع (TENANT_CONFIG1) فيه JSON ثابت لـ"متجر مهدي" بدل placeholder `__TENANT_CONFIG_JSON__`.

→ المطلوب فعليًا: **خريطة KEEP على مستوى أسماء العُقد لكل business_type** + pruning شامل (أدوات + وصلات + ستيكي نوتس) + حقن TENANT_CONFIG.

## Q&A log

### توجيه من المستخدم — لا تعتمد على الشغل السابق
- "ملكش دعوة باللي كان شغال قبل كده" → نبني الكود **مستقل من الصفر**، مش كترقيع للفاكتوري القديم. (السياق المكتشف يبقى للاستئناس بأسماء العُقد فقط، مش كقيد.)

### Q1 — اللغة/التشغيل
- القرار: **n8n Code node (JS)**. الكود عبارة عن Code node واحد جوا الفاكتوري ياخد القالب الكامل + payload العميل ويطلع workflow مقصوص+محقون.

### Q2 — شكل بيانات الإدخال
- القرار: **مطابق لجداول Supabase**. الإدخال = صف `businesses` (+ المحتوى المرتبط من جداول مثل knowledge_base/products/services حسب الحاجة). لازم أجيب أعمدة `businesses` الفعلية.

### Q3 — طريقة حقن TENANT_CONFIG
- القرار: **استبدال placeholder** `__TENANT_CONFIG_JSON__` (string-replace). يعني القالب لازم تكون عقدة TENANT_CONFIG1 فيها jsCode = `return { json: __TENANT_CONFIG_JSON__ };` (أجهّز نسخة من القالب فيها الـplaceholder).

### Q4 — الأدوات المشتركة عند الـpruning
- القرار: **pruning صارم** — أي أداة مش في keep-set القطاع تتشال (حتى المشتركة). 
- التبعة: keep-set لكل business_type لازم يذكر صراحةً كل أداة عايزها تفضل. أحتفظ بـ`escalate` + `Calculator` كـALWAYS_KEEP للأمان/البنية فقط، والباقي صريح لكل قطاع.

## Open flags (pending input)
- (لا شيء بعد)
