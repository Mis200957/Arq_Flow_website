/* ============================================================================
 * FACTORY_INJECT_AND_PRUNE  —  n8n Code node (JavaScript)
 * ----------------------------------------------------------------------------
 * ياخد قالب البوت الكامل + صف businesses + صف plans ويطلع workflow جاهز:
 *   1) Pruning حسب نوع النشاط (strict keep-set per business_type).
 *   2) Pruning حسب الباقة tier: الأدوات والوسائط [صوت/صور] المسموحة فقط.
 *   3) يبني عقدة TENANT_CONFIG1 مباشرة [jsCode = return json] مش placeholder.
 *   4) يربط قيم الباقة في عُقد البوت [الموديل + نافذة الذاكرة] + مسار الويبهوك + اسم الـworkflow.
 * المدخلات: { template, business, plan }   (شكل مطابق لـSupabase)
 * المخرجات: { provision_ok, workflow_payload, tenant_config, tier, kept_tools, removed_tools, ... }
 * ========================================================================== */

var ALIASES = {
  medical: "medical_center", hospital: "medical_center",
  restaurant_cafe: "restaurant", cafe: "restaurant",
  realestate: "real_estate", "real-estate": "real_estate",
  education: "educational_center", educational: "educational_center", school: "educational_center",
  law_firm: "lawyer", lawyer_office: "lawyer", law: "lawyer",
  beauty: "salon", spa: "salon", fitness: "gym",
  services: "service_company", service: "service_company",
  online_store: "ecommerce", shop: "ecommerce", store_online: "ecommerce"
};

var ALWAYS_KEEP = ["escalate", "Calculator"];                                  // لا تُحذف أبدًا
var COMMON = ["customer_information", "search_knowledge_base", "fetch_business_hours", "send_link", "save_preference"]; // قراءة/معلومات لكل الباقات

var VERTICAL_TOOLS = {
  restaurant:         ["fitch_products", "fetch_categories", "delivery_zones", "promotions", "coupons", "order_track", "lookup_order_status", "save_transaction", "cancel_order", "send_product_photo"],
  ecommerce:          ["fitch_products", "fetch_categories", "coupons", "promotions", "delivery_zones", "order_track", "lookup_order_status", "save_transaction", "cancel_order", "send_product_photo"],
  store:              ["fitch_products", "fetch_categories", "order_track", "lookup_order_status", "save_transaction", "send_product_photo"],
  pharmacy:           ["fitch_products", "order_track", "lookup_order_status", "save_transaction", "save_consultation_request", "send_product_photo"],
  clinic:             ["fitch_doctors", "fetch_medical_services", "fitch_appointments", "book_appointment", "cancel_appointment", "save_consultation_request"],
  medical_center:     ["fitch_doctors", "fetch_medical_services", "fitch_appointments", "book_appointment", "cancel_appointment", "save_consultation_request"],
  hotel:              ["fetch_rooms", "book_reservation", "cancel_reservation"],
  gym:                ["fetch_memberships", "fetch_classes", "fetch_trainers", "save_membership", "book_appointment", "cancel_appointment"],
  salon:              ["fetch_services", "fetch_staff", "book_appointment", "cancel_appointment"],
  real_estate:        ["fetch_properties", "fetch_agents", "save_property_request", "book_property_visit"],
  educational_center: ["fetch_courses", "fetch_teachers", "save_student", "enroll_course"],
  lawyer:             ["fetch_cases", "register_case_client", "save_consultation_request", "book_appointment", "cancel_appointment"],
  car_service:        ["fetch_services", "fetch_technicians", "save_service_request", "track_work_order", "book_appointment"],
  service_company:    ["fetch_services", "fetch_technicians", "save_service_request", "track_work_order", "book_appointment"],
  company:            ["fetch_services"]
};

// أدوات الكتابة [إجراءات] => باقة Business فأعلى. أي أداة مش هنا = قراءة => متاحة من Starter.
var WRITE_TOOLS = new Set([
  "save_transaction", "cancel_order", "book_appointment", "cancel_appointment",
  "book_reservation", "cancel_reservation", "save_property_request", "book_property_visit",
  "save_student", "enroll_course", "save_membership", "save_service_request",
  "register_case_client", "save_consultation_request", "save_preference", "send_link"
]);

var PLAN_TIERS = {
  starter:    { media: ["text"],                   memory_window: 8,  max_tokens: 1024, allow_write: false, label: "Starter" },
  business:   { media: ["text", "audio"],          memory_window: 12, max_tokens: 1024, allow_write: true,  label: "Business" },
  enterprise: { media: ["text", "audio", "image"], memory_window: 20, max_tokens: 2048, allow_write: true,  label: "Enterprise" }
};
var TIER_ALIASES = {
  starter: "starter", basic: "starter", start: "starter", free: "starter",
  business: "business", pro: "business", growth: "business", standard: "business",
  enterprise: "enterprise", premium: "enterprise", advanced: "enterprise", ultimate: "enterprise"
};

var MEDIA_NODES = {
  audio: ["GET_MEDIA_BASE1", "CONVERT_TO_BINARY1", "TRANSCRIBE_AUDIO1", "EXTRACT_TRANSCRIPTION", "IS_AUDIO_UNCLEAR1", "SEND_UNCLEAR_AUDIO_MSG1"],
  image: ["GET_MEDIA_BASE_IMAGE", "CONVERT_TO_BINARY_IMAGE", "ANALYZE_IMAGE", "BUILD_IMAGE_TEXT"]
};

var PERSONA = {
  restaurant:         { role_ar: "مساعد مطعم: تعرض المنيو والأصناف، تأخذ الطلب، تحسب التوصيل، وتتابع حالة الأوردر.", role_en: "Restaurant assistant" },
  ecommerce:          { role_ar: "مساعد متجر إلكتروني: تبحث في المنتجات، تتحقق من التوافر، تطبّق الكوبونات، وتُنهي الشراء وتتابع الطلب.", role_en: "E-commerce assistant" },
  store:              { role_ar: "مساعد محل تجاري: تعرض المنتجات المتاحة وتستقبل الطلبات.", role_en: "Store assistant" },
  pharmacy:           { role_ar: "مساعد صيدلية: تتحقق من توافر الأدوية والمنتجات وتستقبل الطلبات.", role_en: "Pharmacy assistant" },
  clinic:             { role_ar: "مساعد عيادة: تعرض الأطباء والخدمات الطبية وتتولّى الحجز والإلغاء.", role_en: "Clinic assistant" },
  medical_center:     { role_ar: "مساعد مركز طبي متعدد التخصصات للحجز وإدارة المواعيد والاستفسارات الطبية.", role_en: "Medical center assistant" },
  hotel:              { role_ar: "مساعد فندق: تعرض أنواع الغرف وأسعارها وتتولّى الحجوزات والإلغاء.", role_en: "Hotel assistant" },
  gym:                { role_ar: "مساعد جيم: تشرح باقات العضوية والحصص والمدربين وتتولّى الاشتراك.", role_en: "Gym assistant" },
  salon:              { role_ar: "مساعد صالون: تعرض الخدمات والأسعار وتحجز المواعيد مع الفريق.", role_en: "Salon assistant" },
  real_estate:        { role_ar: "مساعد عقارات: تبحث عن العقارات المناسبة وتسجّل طلبات العملاء وتحجز المعاينات.", role_en: "Real estate assistant" },
  educational_center: { role_ar: "مساعد مركز تعليمي: تعرض الكورسات والمدرّسين وتتولّى تسجيل الطلاب.", role_en: "Educational center assistant" },
  lawyer:             { role_ar: "مساعد مكتب محاماة: تستقبل طلبات الاستشارة وتستعلم عن حالة القضايا وتسجّل بيانات الموكلين.", role_en: "Law office assistant" },
  car_service:        { role_ar: "مساعد صيانة سيارات: تعرض الخدمات وتستقبل طلبات الصيانة وتتابع أوامر الشغل.", role_en: "Car service assistant" },
  service_company:    { role_ar: "مساعد شركة خدمات: تعرض الخدمات وتستقبل الطلبات وتتابع أوامر الشغل.", role_en: "Service company assistant" },
  company:            { role_ar: "مساعد أعمال عام: تجاوب على استفسارات العملاء وتعرّف بالخدمات.", role_en: "General business assistant" }
};

var NOTE_VERTICALS = [
  ["Restaurants & Online Stores", ["restaurant", "ecommerce", "store", "pharmacy"]],
  ["الفنادق", ["hotel"]], ["Hotels", ["hotel"]],
  ["العقارات", ["real_estate"]], ["Real Estate", ["real_estate"]],
  ["التعليم", ["educational_center"]], ["Education", ["educational_center"]],
  ["الجيم", ["gym"]], ["Gym", ["gym"]],
  ["الخدمات والصيانة", ["car_service", "service_company", "salon"]], ["Services", ["car_service", "service_company", "salon"]],
  ["المحاماة والاستشارات", ["lawyer"]], ["Legal", ["lawyer"]],
  ["Clinics", ["clinic", "medical_center"]], ["العيادات", ["clinic", "medical_center"]]
];

var TOOL_TYPES = new Set([
  "n8n-nodes-base.supabaseTool",
  "@n8n/n8n-nodes-langchain.toolWorkflow",
  "@n8n/n8n-nodes-langchain.toolCalculator"
]);

function digits(v) { return String(v == null ? "" : v).replace(/[^0-9]/g, ""); }
function arr(x) { return Array.isArray(x) ? x : []; }
function sanitizeSettings(s) {
  s = s || {};
  // n8n public API يقبل مفاتيح settings دي فقط؛ أي مفتاح تاني (زي binaryMode) بيرفضه
  var ALLOWED = ["executionOrder","saveDataErrorExecution","saveDataSuccessExecution","saveManualExecutions","saveExecutionProgress","executionTimeout","errorWorkflow","timezone"];
  var out = { executionOrder: s.executionOrder || "v1" };
  for (var i = 0; i < ALLOWED.length; i++) { var k = ALLOWED[i]; if (s[k] !== undefined && k !== "executionOrder") out[k] = s[k]; }
  return out;
}
function canonType(t) { var bt = String(t || "").trim().toLowerCase(); return ALIASES[bt] || bt; }
function jesc(v) {
  return String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    .replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
function resolveTier(plan) {
  var raw = String((plan && (plan.tier || plan.id || plan.name || plan.plan_id)) || "").trim().toLowerCase();
  if (TIER_ALIASES[raw]) return TIER_ALIASES[raw];
  for (var k in TIER_ALIASES) { if (raw.indexOf(k) !== -1) return TIER_ALIASES[k]; }
  var lvl = plan && plan.tier_level;
  if (lvl === 1) return "starter";
  if (lvl === 2) return "business";
  if (lvl >= 3) return "enterprise";
  return "starter";
}

function injectAndPrune(template, business, plan, options) {
  options = options || {};
  if (!template || !Array.isArray(template.nodes)) {
    return { provision_ok: false, error: "template غير صالح (مفيش nodes[])" };
  }
  var b = business || {}, p = plan || {};
  var bt = canonType(b.business_type);
  var matched = !!VERTICAL_TOOLS[bt];
  var icfg = b.industry_config || {};

  // (أ) الباقة
  var tier = resolveTier((p.id || p.tier || p.tier_level || p.name) ? p : { id: b.plan_id });
  var T = PLAN_TIERS[tier] || PLAN_TIERS.starter;
  var media_support = arr(p.media_support).length ? p.media_support.slice() : T.media.slice();
  var memory_window = p.memory_window || T.memory_window;
  var max_tokens = p.max_tokens || T.max_tokens;
  var message_limit = p.message_limit || 5000;
  var model = p.ai_model || b.model || "openai/gpt-4o-mini";
  var fallback_model = p.fallback_model || "openai/gpt-4o-mini";

  // (ب) keep-set: قطاع + مشتركة + أساسية، ثم تقفيل حسب الباقة
  var keep = new Set([].concat(ALWAYS_KEEP, COMMON, VERTICAL_TOOLS[bt] || []));
  if (!T.allow_write) { Array.from(keep).forEach(function (t) { if (WRITE_TOOLS.has(t)) keep.delete(t); }); }
  if (Array.isArray(icfg.keep_tools)) icfg.keep_tools.forEach(function (t) { keep.add(t); });
  if (Array.isArray(icfg.drop_tools)) icfg.drop_tools.forEach(function (t) { keep.delete(t); });

  var enabled_tools = Array.from(keep).filter(function (t) { return t !== "Calculator"; });

  // (ج) tenant_config (مطابق businesses + plans)
  var tenant_config = {
    business_id: b.id || b.business_id || "",
    order_id: b.order_id || "",
    plan_id: b.plan_id || p.id || tier,
    tier: tier, plan_label: T.label,
    business_name: b.business_name || "",
    bot_name: b.bot_name || b.business_name || "",
    currency: b.currency || "ج.م",
    escalation_message: b.escalation_message || "تمام، بحوّلك لأحد أعضاء الفريق وهيرد عليك في أقرب وقت 🙏",
    rules: b.rules || "",
    min_order_value: (b.min_order_value != null ? b.min_order_value : null),
    delivery_fee: (b.delivery_fee != null ? b.delivery_fee : null),
    business_type: bt || null,
    industry_matched: matched,
    instance_name: b.instance_name || ("arq-" + String(b.order_id || "").toLowerCase()),
    webhook_path: b.webhook_path || ("bot-" + String(b.order_id || "").toLowerCase()),
    admin_whatsapp: digits(b.whatsapp_number || b.contact_phone),
    model: model, fallback_model: fallback_model, max_tokens: max_tokens,
    memory_window: memory_window, message_limit: message_limit, media_support: media_support,
    tools: p.tools || [],
    languages: arr(b.languages).length ? b.languages : ["ar"],
    tone_of_voice: b.tone_of_voice || "ودود ومحترف",
    fallback_behavior: b.fallback_behavior || "handover",
    greeting_message: b.greeting_message || "",
    assistant_personality: b.assistant_personality || "",
    description: b.description || "",
    working_hours: b.working_hours || "",
    location: b.location || b.address || "",
    payment_methods: arr(b.payment_methods),
    delivery_info: b.delivery_info || "",
    return_policy: b.return_policy || "",
    order_instructions: b.order_instructions || "",
    policy: b.policy || "",
    knowledge_base: b.knowledge_base_raw || b.knowledge_base || "",
    capabilities: icfg.capabilities || {},
    persona: icfg.persona || PERSONA[bt] || null,
    enabled_tools: enabled_tools,
    system_prompt: b.system_prompt || ""
  };

  // (د) clone عميق + اسم الـworkflow
  var wf = JSON.parse(JSON.stringify({
    name: "🤖 Arq | " + (b.business_name || "") + " (" + (b.order_id || "") + ")",
    nodes: template.nodes,
    connections: template.connections || {},
    settings: sanitizeSettings(template.settings)
  }));

  // (هـ) قصّ عُقد الوسائط غير المدعومة بالباقة
  var dropMedia = new Set();
  if (media_support.indexOf("audio") === -1) MEDIA_NODES.audio.forEach(function (n) { dropMedia.add(n); });
  if (media_support.indexOf("image") === -1) MEDIA_NODES.image.forEach(function (n) { dropMedia.add(n); });
  if (options.pruneMedia === false) dropMedia.clear();

  // (و) قصّ الأدوات [قطاعات تانية + مقفولة بالباقة] + عُقد الوسائط
  var removed_tools = [], kept_tools = [], removed_media = [];
  wf.nodes = wf.nodes.filter(function (n) {
    if (!n) return false;
    if (dropMedia.has(n.name)) { removed_media.push(n.name); return false; }
    if (TOOL_TYPES.has(n.type)) {
      if (keep.has(n.name)) { kept_tools.push(n.name); return true; }
      removed_tools.push(n.name); return false;
    }
    return true;
  });

  // (ز) قصّ Sticky Notes الخاصة بقطاعات تانية
  var removed_notes = [];
  wf.nodes = wf.nodes.filter(function (n) {
    if (n && n.type === "n8n-nodes-base.stickyNote") {
      var content = (n.parameters && n.parameters.content) || "";
      for (var i = 0; i < NOTE_VERTICALS.length; i++) {
        var kw = NOTE_VERTICALS[i][0], verts = NOTE_VERTICALS[i][1];
        if (content.indexOf(kw) !== -1 && verts.indexOf(bt) === -1) { removed_notes.push(content.split("\n")[0]); return false; }
      }
    }
    return true;
  });

  // (ح) بناء TENANT_CONFIG1 مباشرة + ربط قيم الباقة في عُقد البوت + مسار الويبهوك
  wf.nodes.forEach(function (n) {
    if (!n || !n.parameters) return;
    if (/^TENANT_CONFIG/i.test(n.name || "")) {
      n.parameters.jsCode = "return { json: " + JSON.stringify(tenant_config) + " };";
    }
    if ((n.type || "").indexOf("memoryBufferWindow") !== -1) { n.parameters.contextWindowLength = memory_window; }
    if ((n.type || "").indexOf("lmChatOpenRouter") !== -1) { n.parameters.model = model; }
    if (n.type === "n8n-nodes-base.webhook") { n.parameters.path = tenant_config.webhook_path; }
  });

  // (ط) استبدال أي placeholders قديمة لو موجودة (آمن)
  var replacements = {
    "__BUSINESS_ID__": tenant_config.business_id, "__ORDER_ID__": tenant_config.order_id,
    "__PLAN_ID__": tenant_config.plan_id, "__BUSINESS_NAME__": tenant_config.business_name,
    "__INSTANCE_NAME__": tenant_config.instance_name, "__WEBHOOK_PATH__": tenant_config.webhook_path,
    "__ADMIN_WHATSAPP__": tenant_config.admin_whatsapp, "__MODEL__": model, "__FALLBACK_MODEL__": fallback_model,
    "__MAX_TOKENS__": String(max_tokens), "__MEMORY_WINDOW__": String(memory_window),
    "__MESSAGE_LIMIT__": String(message_limit), "__SYSTEM_PROMPT__": tenant_config.system_prompt
  };
  var str = JSON.stringify(wf), ks = Object.keys(replacements);
  for (var j = 0; j < ks.length; j++) { str = str.split(ks[j]).join(jesc(replacements[ks[j]])); }
  try { wf = JSON.parse(str); }
  catch (e) { return { provision_ok: false, error: "الاستبدال أنتج JSON غير صالح: " + e.message }; }

  // (ي) تنظيف الوصلات من أي عقدة اتشالت (كمصدر أو هدف)
  var names = new Set();
  for (var ni = 0; ni < wf.nodes.length; ni++) { if (wf.nodes[ni]) names.add(wf.nodes[ni].name); }
  var connKeys = Object.keys(wf.connections);
  for (var ci = 0; ci < connKeys.length; ci++) {
    var ck = connKeys[ci];
    if (!names.has(ck)) { delete wf.connections[ck]; continue; }
    var conn = wf.connections[ck];
    var kinds = Object.keys(conn);
    for (var ki = 0; ki < kinds.length; ki++) {
      var groups = conn[kinds[ki]];
      for (var gi = 0; gi < groups.length; gi++) {
        groups[gi] = arr(groups[gi]).filter(function (c) { return c && names.has(c.node); });
      }
    }
  }

  return {
    provision_ok: true, business_type: bt, industry_matched: matched, tier: tier, plan_label: T.label,
    kept_tools: kept_tools.sort(), removed_tools: removed_tools.sort(),
    removed_media: removed_media.sort(), removed_notes: removed_notes,
    media_support: media_support, memory_window: memory_window, model: model,
    tenant_config: tenant_config, workflow_payload: wf
  };
}

/* ============================================================================
 * استخدام داخل n8n Code node:
 *   const src = $input.first().json;
 *   return [{ json: injectAndPrune(src.template, src.business || src.businesses || src, src.plan || src.plans || {}) }];
 * العقدة السابقة بتوفّر: template (القالب الكامل من FETCH_TEMPLATE) + business (صف businesses) + plan (صف plans).
 * ========================================================================== */
if (typeof $input !== "undefined") {
  var src = $input.first().json;
  return [{ json: injectAndPrune(src.template, src.business || src.businesses || src, src.plan || src.plans || {}) }];
}
if (typeof module !== "undefined") { module.exports = { injectAndPrune: injectAndPrune, canonType: canonType, resolveTier: resolveTier, VERTICAL_TOOLS: VERTICAL_TOOLS, WRITE_TOOLS: WRITE_TOOLS, PLAN_TIERS: PLAN_TIERS }; }
