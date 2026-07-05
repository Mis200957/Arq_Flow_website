/* ============================================================
   ArqFlow — Industry Templates
   ------------------------------------------------------------
   One template per business type. Selecting a type configures:
     • dashboard modules + sidebar order
     • quick actions on the overview
     • AI prompt scaffold (intents, tools, KB structure)
     • default business settings

   Keys MUST match businesses.business_type values produced by
   the onboarding wizard. Any type WITHOUT a template falls back
   to the full legacy navigation (see ./index.ts) — so existing
   businesses are never affected.
   ============================================================ */

import type { IndustryTemplate } from "./types";

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  /* =========================================================
     RESTAURANT  (live today)
     ========================================================= */
  restaurant: {
    type: "restaurant",
    label: { ar: "مطعم", en: "Restaurant" },
    icon: "UtensilsCrossed",
    modules: ["orders", "products", "delivery-areas", "promotions"],
    labelOverrides: { products: { ar: "المنيو", en: "Menu" } },
    quickActions: ["products", "orders", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "egyptian", fallback_behavior: "handover", primary_goal: "sales" },
    ai: {
      summary: {
        ar: "مساعد مطعم يعرض المنيو، يستقبل الطلبات، ويتابع التوصيل.",
        en: "Restaurant assistant that shows the menu, takes orders, and tracks delivery.",
      },
      intents: ["browse_menu", "place_order", "track_order", "delivery_info", "promotions", "working_hours"],
      tools: ["get_menu", "place_order", "track_order", "get_promotions", "get_delivery_zones"],
      kbCategories: [
        { ar: "المنيو والأسعار", en: "Menu & Prices" },
        { ar: "مناطق ورسوم التوصيل", en: "Delivery Zones & Fees" },
        { ar: "العروض الحالية", en: "Current Offers" },
        { ar: "مواعيد العمل", en: "Working Hours" },
      ],
    },
  },

  /* =========================================================
     E-COMMERCE  (live today)
     ========================================================= */
  ecommerce: {
    type: "ecommerce",
    label: { ar: "متجر إلكتروني", en: "E-commerce" },
    icon: "ShoppingBag",
    modules: ["products", "orders", "inventory", "delivery-areas", "coupons"],
    hidden: ["services"],
    quickActions: ["products", "orders", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "handover", primary_goal: "sales" },
    ai: {
      summary: {
        ar: "مساعد متجر يبحث في المنتجات، يتحقق من المخزون، وينهي عملية الشراء.",
        en: "Store assistant that searches products, checks stock, and completes purchases.",
      },
      intents: ["search_products", "product_details", "check_stock", "place_order", "track_order", "apply_coupon", "returns"],
      tools: ["search_products", "check_stock", "place_order", "track_order", "apply_coupon"],
      kbCategories: [
        { ar: "كتالوج المنتجات", en: "Product Catalog" },
        { ar: "الشحن والتوصيل", en: "Shipping & Delivery" },
        { ar: "سياسة الاسترجاع", en: "Return Policy" },
        { ar: "الكوبونات والعروض", en: "Coupons & Offers" },
      ],
    },
  },

  /* General retail store — commerce-like */
  store: {
    type: "store",
    label: { ar: "محل تجاري", en: "Store" },
    icon: "Store",
    modules: ["products", "orders", "inventory", "delivery-areas"],
    hidden: ["services"],
    quickActions: ["products", "orders", "knowledge-base"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "handover", primary_goal: "sales" },
    ai: {
      summary: {
        ar: "مساعد محل يعرض المنتجات المتاحة ويستقبل الطلبات.",
        en: "Store assistant that shows available products and takes orders.",
      },
      intents: ["browse_products", "check_stock", "place_order", "working_hours", "location"],
      tools: ["search_products", "check_stock", "place_order"],
      kbCategories: [
        { ar: "المنتجات والأسعار", en: "Products & Prices" },
        { ar: "العنوان والفروع", en: "Location & Branches" },
        { ar: "مواعيد العمل", en: "Working Hours" },
      ],
    },
  },

  /* =========================================================
     CLINIC  (priority — live today)
     ========================================================= */
  clinic: {
    type: "clinic",
    label: { ar: "عيادة", en: "Clinic" },
    icon: "Stethoscope",
    modules: ["appointments", "doctors", "patients", "medical-services", "consultations", "waiting-queue", "follow-ups"],
    hidden: ["orders", "products", "inventory", "services"],
    quickActions: ["appointments", "knowledge-base", "conversations", "customers"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد عيادة يعرض الأطباء والمواعيد المتاحة، ويتولّى الحجز والإلغاء والاستفسار عن الخدمات الطبية.",
        en: "Clinic assistant that lists doctors and open slots, and handles booking, cancellation, and medical-service inquiries.",
      },
      intents: ["list_doctors", "available_slots", "book_appointment", "reschedule", "cancel_appointment", "medical_services", "prices", "location", "insurance"],
      tools: ["list_doctors", "get_available_slots", "book_appointment", "cancel_appointment", "list_medical_services"],
      kbCategories: [
        { ar: "الأطباء والتخصصات", en: "Doctors & Specialties" },
        { ar: "الخدمات الطبية والأسعار", en: "Medical Services & Prices" },
        { ar: "مواعيد العمل والحجز", en: "Working Hours & Booking" },
        { ar: "التأمين والدفع", en: "Insurance & Payment" },
        { ar: "العنوان والوصول", en: "Location & Directions" },
      ],
    },
  },

  /* Medical center — same shape as clinic, different label */
  medical_center: {
    type: "medical_center",
    label: { ar: "مركز طبي", en: "Medical Center" },
    icon: "Hospital",
    modules: ["appointments", "doctors", "patients", "medical-services", "consultations", "waiting-queue", "follow-ups"],
    hidden: ["orders", "products", "inventory", "services"],
    quickActions: ["appointments", "knowledge-base", "conversations", "customers"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد مركز طبي متعدد التخصصات للحجز وإدارة المواعيد والاستفسارات الطبية.",
        en: "Multi-specialty medical-center assistant for booking, appointment management, and medical inquiries.",
      },
      intents: ["list_doctors", "available_slots", "book_appointment", "reschedule", "cancel_appointment", "medical_services", "departments", "prices", "insurance"],
      tools: ["list_doctors", "get_available_slots", "book_appointment", "cancel_appointment", "list_medical_services"],
      kbCategories: [
        { ar: "الأقسام والتخصصات", en: "Departments & Specialties" },
        { ar: "الأطباء", en: "Doctors" },
        { ar: "الخدمات والأسعار", en: "Services & Prices" },
        { ar: "التأمين والدفع", en: "Insurance & Payment" },
      ],
    },
  },

  /* Pharmacy — product-led with consultations */
  pharmacy: {
    type: "pharmacy",
    label: { ar: "صيدلية", en: "Pharmacy" },
    icon: "Pill",
    modules: ["products", "orders", "inventory", "consultations"],
    hidden: ["services"],
    labelOverrides: { products: { ar: "الأدوية والمنتجات", en: "Medicines & Products" } },
    quickActions: ["products", "orders", "knowledge-base"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "sales" },
    ai: {
      summary: {
        ar: "مساعد صيدلية يتحقق من توافر الأدوية والمنتجات ويستقبل الطلبات.",
        en: "Pharmacy assistant that checks medicine/product availability and takes orders.",
      },
      intents: ["search_medicine", "check_stock", "place_order", "track_order", "ask_pharmacist"],
      tools: ["search_products", "check_stock", "place_order", "track_order"],
      kbCategories: [
        { ar: "الأدوية والمنتجات", en: "Medicines & Products" },
        { ar: "التوصيل", en: "Delivery" },
        { ar: "مواعيد العمل", en: "Working Hours" },
      ],
    },
  },

  /* =========================================================
     HOTEL
     ========================================================= */
  hotel: {
    type: "hotel",
    label: { ar: "فندق", en: "Hotel" },
    icon: "Hotel",
    modules: ["rooms", "reservations", "guests", "room-status"],
    hidden: ["orders", "products", "services", "inventory"],
    quickActions: ["reservations", "rooms", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد فندق يعرض أنواع الغرف وأسعارها، ويتولّى الحجوزات والاستفسار عن تسجيل الدخول والخروج.",
        en: "Hotel assistant that shows room types and rates, and handles reservations and check-in/out inquiries.",
      },
      intents: ["room_availability", "room_types", "make_reservation", "modify_reservation", "cancel_reservation", "checkin_info", "amenities", "prices"],
      tools: ["check_room_availability", "get_room_types", "make_reservation", "cancel_reservation"],
      kbCategories: [
        { ar: "أنواع الغرف والأسعار", en: "Room Types & Rates" },
        { ar: "تسجيل الدخول والخروج", en: "Check-in & Check-out" },
        { ar: "المرافق والخدمات", en: "Amenities & Services" },
        { ar: "سياسة الحجز والإلغاء", en: "Booking & Cancellation Policy" },
      ],
    },
  },

  /* =========================================================
     GYM
     ========================================================= */
  gym: {
    type: "gym",
    label: { ar: "جيم / نادي رياضي", en: "Gym" },
    icon: "Dumbbell",
    modules: ["memberships", "trainers", "classes", "attendance"],
    hidden: ["orders", "products", "inventory"],
    quickActions: ["memberships", "classes", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "collect", primary_goal: "sales" },
    ai: {
      summary: {
        ar: "مساعد جيم يشرح باقات العضوية والحصص والمدربين ويتولّى الاشتراك.",
        en: "Gym assistant that explains membership plans, classes, and trainers, and handles sign-ups.",
      },
      intents: ["membership_plans", "class_schedule", "trainers", "subscribe", "freeze_membership", "prices", "working_hours"],
      tools: ["get_membership_plans", "get_class_schedule", "list_trainers", "create_membership"],
      kbCategories: [
        { ar: "باقات العضوية والأسعار", en: "Membership Plans & Prices" },
        { ar: "جدول الحصص", en: "Class Schedule" },
        { ar: "المدربون", en: "Trainers" },
        { ar: "مواعيد العمل", en: "Working Hours" },
      ],
    },
  },

  /* =========================================================
     SALON  (Services page is live today)
     ========================================================= */
  salon: {
    type: "salon",
    label: { ar: "صالون / مركز تجميل", en: "Salon" },
    icon: "Scissors",
    modules: ["appointments", "services", "staff", "working-hours"],
    hidden: ["orders", "products", "inventory"],
    quickActions: ["services", "appointments", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد صالون يعرض الخدمات والأسعار ويتولّى حجز المواعيد مع الفريق.",
        en: "Salon assistant that shows services and prices, and books appointments with staff.",
      },
      intents: ["list_services", "available_slots", "book_appointment", "cancel_appointment", "staff", "prices", "working_hours"],
      tools: ["list_services", "get_available_slots", "book_appointment", "cancel_appointment", "list_staff"],
      kbCategories: [
        { ar: "الخدمات والأسعار", en: "Services & Prices" },
        { ar: "الفريق", en: "Staff" },
        { ar: "مواعيد العمل والحجز", en: "Working Hours & Booking" },
      ],
    },
  },

  /* =========================================================
     REAL ESTATE  (priority list)
     ========================================================= */
  real_estate: {
    type: "real_estate",
    label: { ar: "عقارات", en: "Real Estate" },
    icon: "Building2",
    modules: ["properties", "property-requests", "visits", "agents", "property-categories"],
    hidden: ["orders", "products", "services", "inventory"],
    quickActions: ["properties", "knowledge-base", "conversations", "customers"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "support" },
    ai: {
      summary: {
        ar: "مساعد عقارات يبحث عن العقارات المناسبة، يحجز المعاينات، ويوجّه العميل للمندوب المناسب.",
        en: "Real-estate assistant that finds matching properties, books visits, and routes leads to the right agent.",
      },
      intents: ["search_properties", "property_details", "book_visit", "request_callback", "pricing", "financing", "assign_agent"],
      tools: ["search_properties", "get_property_details", "book_visit", "assign_agent"],
      kbCategories: [
        { ar: "العقارات المتاحة", en: "Available Properties" },
        { ar: "المناطق والتصنيفات", en: "Areas & Categories" },
        { ar: "الأسعار والتمويل", en: "Pricing & Financing" },
        { ar: "المعاينات", en: "Visits" },
      ],
    },
  },

  /* =========================================================
     EDUCATIONAL CENTER
     ========================================================= */
  educational_center: {
    type: "educational_center",
    label: { ar: "مركز تعليمي", en: "Educational Center" },
    icon: "GraduationCap",
    modules: ["courses", "students", "teachers", "classes", "attendance"],
    hidden: ["orders", "products", "inventory"],
    quickActions: ["courses", "knowledge-base", "conversations", "customers"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد مركز تعليمي يعرض الكورسات والمواعيد ويتولّى التسجيل والاستفسارات.",
        en: "Educational-center assistant that lists courses and schedules, and handles enrollment and inquiries.",
      },
      intents: ["list_courses", "course_details", "schedule", "enroll", "prices", "teachers", "location"],
      tools: ["list_courses", "get_course_schedule", "enroll_student"],
      kbCategories: [
        { ar: "الكورسات والمواعيد", en: "Courses & Schedules" },
        { ar: "الأسعار والخصومات", en: "Prices & Discounts" },
        { ar: "المدرسون", en: "Teachers" },
        { ar: "التسجيل", en: "Enrollment" },
      ],
    },
  },

  /* =========================================================
     LAWYER OFFICE
     ========================================================= */
  lawyer: {
    type: "lawyer",
    label: { ar: "مكتب محاماة", en: "Lawyer Office" },
    icon: "Scale",
    modules: ["cases", "clients", "consultations", "appointments", "documents"],
    hidden: ["orders", "products", "services", "inventory"],
    quickActions: ["consultations", "appointments", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد مكتب محاماة يستقبل طلبات الاستشارة، يحجز المواعيد، ويستفسر عن حالة القضايا.",
        en: "Law-office assistant that intakes consultation requests, books appointments, and answers case-status inquiries.",
      },
      intents: ["request_consultation", "book_appointment", "case_status", "practice_areas", "fees", "documents_needed"],
      tools: ["create_consultation", "book_appointment", "get_case_status"],
      kbCategories: [
        { ar: "مجالات الممارسة", en: "Practice Areas" },
        { ar: "الأتعاب والاستشارات", en: "Fees & Consultations" },
        { ar: "المستندات المطلوبة", en: "Required Documents" },
      ],
    },
  },

  /* =========================================================
     CAR SERVICE
     ========================================================= */
  car_service: {
    type: "car_service",
    label: { ar: "خدمة سيارات", en: "Car Service" },
    icon: "Car",
    modules: ["services", "work-orders", "technicians", "scheduling", "service-requests"],
    hidden: ["products", "inventory"],
    quickActions: ["services", "work-orders", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "friendly", fallback_behavior: "collect", primary_goal: "booking" },
    ai: {
      summary: {
        ar: "مساعد مركز صيانة سيارات يستقبل طلبات الخدمة، يحدد المواعيد، ويتابع حالة أمر الشغل.",
        en: "Car-service assistant that intakes service requests, schedules appointments, and tracks work-order status.",
      },
      intents: ["service_request", "book_slot", "work_order_status", "service_catalog", "prices", "location"],
      tools: ["list_services", "create_service_request", "get_available_slots", "get_work_order_status"],
      kbCategories: [
        { ar: "الخدمات والأسعار", en: "Services & Prices" },
        { ar: "المواعيد", en: "Scheduling" },
        { ar: "العنوان والوصول", en: "Location & Directions" },
      ],
    },
  },

  /* =========================================================
     SERVICE COMPANY
     ========================================================= */
  service_company: {
    type: "service_company",
    label: { ar: "شركة خدمات", en: "Service Company" },
    icon: "Briefcase",
    modules: ["services", "work-orders", "technicians", "scheduling", "service-requests"],
    hidden: ["products", "inventory"],
    quickActions: ["services", "work-orders", "knowledge-base", "conversations"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "collect", primary_goal: "support" },
    ai: {
      summary: {
        ar: "مساعد شركة خدمات يستقبل طلبات الخدمة، يحدد المواعيد، ويوزّع الفنيين.",
        en: "Service-company assistant that intakes requests, schedules jobs, and dispatches technicians.",
      },
      intents: ["service_request", "book_slot", "work_order_status", "service_catalog", "quote", "coverage_area"],
      tools: ["list_services", "create_service_request", "get_available_slots", "get_work_order_status"],
      kbCategories: [
        { ar: "الخدمات والباقات", en: "Services & Packages" },
        { ar: "مناطق التغطية", en: "Coverage Areas" },
        { ar: "الأسعار وعروض الأسعار", en: "Pricing & Quotes" },
      ],
    },
  },

  /* =========================================================
     GENERAL COMPANY / BUSINESS
     ========================================================= */
  company: {
    type: "company",
    label: { ar: "شركة / نشاط عام", en: "Company" },
    icon: "Briefcase",
    modules: ["services"],
    hidden: ["orders", "products", "inventory"],
    quickActions: ["services", "knowledge-base", "conversations", "customers"],
    defaults: { tone_of_voice: "formal", fallback_behavior: "handover", primary_goal: "support" },
    ai: {
      summary: {
        ar: "مساعد أعمال عام يجاوب على استفسارات العملاء ويعرّف بالخدمات.",
        en: "General business assistant that answers customer inquiries and presents services.",
      },
      intents: ["general_inquiry", "services", "pricing", "contact", "working_hours", "location"],
      tools: ["list_services"],
      kbCategories: [
        { ar: "الخدمات", en: "Services" },
        { ar: "الأسئلة الشائعة", en: "FAQs" },
        { ar: "التواصل والعنوان", en: "Contact & Location" },
      ],
    },
  },
};

/** Aliases: alternate business_type strings that map to a canonical template. */
export const INDUSTRY_ALIASES: Record<string, string> = {
  medical: "medical_center",
  hospital: "medical_center",
  restaurant_cafe: "restaurant",
  cafe: "restaurant",
  realestate: "real_estate",
  "real-estate": "real_estate",
  education: "educational_center",
  educational: "educational_center",
  school: "educational_center",
  law_firm: "lawyer",
  lawyer_office: "lawyer",
  law: "lawyer",
  beauty: "salon",
  spa: "salon",
  fitness: "gym",
  services: "service_company",
  service: "service_company",
};
