/* ============================================================
   ArqFlow — Module Registry
   ------------------------------------------------------------
   Single source of truth for every dashboard module (core +
   industry). Pure data — no React. Safe to import anywhere.

   `available: true`  -> a real page exists today.
   `available: false` -> shown as a polished "Soon" item (never
                         navigates, never 404s). Ship the shell now,
                         the CRUD pages later, nothing breaks.
   ============================================================ */

import type { ModuleDef } from "./types";

/* ------------------------------------------------------------
   CORE MODULES — present for every business type.
   These map 1:1 to pages that already exist today, so existing
   businesses keep their full experience.
   ------------------------------------------------------------ */
export const CORE_MODULES: ModuleDef[] = [
  { key: "overview",       href: "/dashboard/overview",       icon: "LayoutDashboard", group: "core",    core: true, available: true,  label: { ar: "نظرة عامة",        en: "Overview" } },
  { key: "conversations",  href: "/dashboard/conversations",  icon: "MessageSquare",   group: "core",    core: true, available: true,  label: { ar: "المحادثات",        en: "Conversations" } },
  { key: "customers",      href: "/dashboard/customers",      icon: "Users",           group: "core",    core: true, available: true,  label: { ar: "العملاء",          en: "Customers" } },
  { key: "analytics",      href: "/dashboard/analytics",      icon: "BarChart3",       group: "core",    core: true, available: true,  label: { ar: "الإحصائيات",       en: "Analytics" } },
  { key: "usage",          href: "/dashboard/usage",          icon: "Gauge",           group: "core",    core: true, available: true,  label: { ar: "الاستهلاك",        en: "Usage" } },
  { key: "knowledge-base", href: "/dashboard/knowledge-base", icon: "BookOpen",        group: "core",    core: true, available: true,  label: { ar: "قاعدة المعرفة",    en: "Knowledge Base" } },
  { key: "broadcasts",     href: "/dashboard/broadcasts",     icon: "Send",            group: "core",    core: true, available: true,  requires: "broadcasts", label: { ar: "الإذاعة",          en: "Broadcasts" } },
  { key: "whatsapp",       href: "/dashboard/whatsapp",       icon: "Phone",           group: "core",    core: true, available: true,  label: { ar: "واتساب",           en: "WhatsApp" } },
  { key: "ai-settings",    href: "/dashboard/ai-settings",    icon: "Bot",             group: "core",    core: true, available: true,  label: { ar: "إعدادات الذكاء",   en: "AI Settings" } },
  { key: "notifications",  href: "/dashboard/notifications",  icon: "Bell",            group: "core",    core: true, available: true,  label: { ar: "الإشعارات",        en: "Notifications" } },
  { key: "automation",     href: "/dashboard/automation",     icon: "Activity",        group: "core",    core: true, available: true,  label: { ar: "حالة الأتمتة",     en: "Automation Health" } },
  { key: "invoices",       href: "/dashboard/invoices",       icon: "Receipt",         group: "billing", core: true, available: true,  label: { ar: "الفواتير",         en: "Invoices" } },
  { key: "subscription",   href: "/dashboard/subscription",   icon: "Crown",           group: "billing", core: true, available: true,  label: { ar: "الاشتراك",         en: "Subscription" } },
  { key: "files",          href: "/dashboard/files",          icon: "FolderOpen",      group: "system",  core: true, available: true,  label: { ar: "الملفات",          en: "Files" } },
  { key: "settings",       href: "/dashboard/settings",       icon: "Settings",        group: "system",  core: true, available: true,  label: { ar: "الإعدادات",        en: "Settings" } },
];

/* ------------------------------------------------------------
   INDUSTRY MODULES — attached per business type.
   `orders`, `products`, `services` already have pages today
   (available: true). The rest are scaffolded as "Soon" until
   their CRUD pages ship — backed by the new DB tables in
   supabase/migrations.
   ------------------------------------------------------------ */
export const INDUSTRY_MODULES: ModuleDef[] = [
  /* ---- already live (commerce) ---- */
  { key: "orders",          href: "/dashboard/orders",          icon: "ShoppingCart", group: "industry", available: true,  label: { ar: "الطلبات",     en: "Orders" } },
  { key: "products",        href: "/dashboard/products",        icon: "Package",      group: "industry", available: true,  label: { ar: "المنتجات",    en: "Products" } },
  { key: "services",        href: "/dashboard/services",        icon: "Wrench",       group: "industry", available: true,  label: { ar: "الخدمات",     en: "Services" } },

  /* ---- commerce extensions (soon) ---- */
  { key: "categories",      href: "/dashboard/categories",      icon: "Tag",          group: "industry", available: true, label: { ar: "التصنيفات",   en: "Categories" } },
  { key: "inventory",       href: "/dashboard/inventory",       icon: "Boxes",        group: "industry", available: true, label: { ar: "المخزون",     en: "Inventory" } },
  { key: "delivery",        href: "/dashboard/delivery",        icon: "Truck",        group: "industry", available: true, label: { ar: "التوصيل",     en: "Delivery" } },
  { key: "promotions",      href: "/dashboard/promotions",      icon: "Percent",      group: "industry", available: true, label: { ar: "العروض",      en: "Promotions" } },
  { key: "coupons",         href: "/dashboard/coupons",         icon: "Ticket",       group: "industry", available: true, label: { ar: "الكوبونات",   en: "Coupons" } },

  /* ---- clinic / medical ---- */
  { key: "appointments",    href: "/dashboard/appointments",    icon: "CalendarDays", group: "industry", available: true, label: { ar: "المواعيد",            en: "Appointments" } },
  { key: "doctors",         href: "/dashboard/doctors",         icon: "Stethoscope",  group: "industry", available: true, label: { ar: "الأطباء",             en: "Doctors" } },
  { key: "patients",        href: "/dashboard/patients",        icon: "HeartPulse",   group: "industry", available: true, label: { ar: "المرضى",              en: "Patients" } },
  { key: "medical-services",href: "/dashboard/medical-services",icon: "ClipboardPlus",group: "industry", available: true, label: { ar: "الخدمات الطبية",      en: "Medical Services" } },
  { key: "consultations",   href: "/dashboard/consultations",   icon: "ClipboardList",group: "industry", available: true, label: { ar: "طلبات الاستشارة",     en: "Consultation Requests" } },
  { key: "waiting-queue",   href: "/dashboard/waiting-queue",   icon: "Clock",        group: "industry", available: true, label: { ar: "قائمة الانتظار",      en: "Waiting Queue" } },
  { key: "follow-ups",      href: "/dashboard/follow-ups",      icon: "CalendarCheck",group: "industry", available: true, label: { ar: "المتابعات",           en: "Follow-ups" } },

  /* ---- hotel ---- */
  { key: "rooms",           href: "/dashboard/rooms",           icon: "BedDouble",    group: "industry", available: true, label: { ar: "الغرف",         en: "Rooms" } },
  { key: "reservations",    href: "/dashboard/reservations",    icon: "CalendarDays", group: "industry", available: true, label: { ar: "الحجوزات",      en: "Reservations" } },
  { key: "guests",          href: "/dashboard/guests",          icon: "Users",        group: "industry", available: true, label: { ar: "النزلاء",       en: "Guests" } },
  { key: "room-status",     href: "/dashboard/room-status",     icon: "DoorOpen",     group: "industry", available: true, label: { ar: "حالة الغرف",    en: "Room Status" } },

  /* ---- gym ---- */
  { key: "memberships",     href: "/dashboard/memberships",     icon: "CreditCard",   group: "industry", available: true, label: { ar: "العضويات",      en: "Memberships" } },
  { key: "trainers",        href: "/dashboard/trainers",        icon: "Dumbbell",     group: "industry", available: true, label: { ar: "المدربون",      en: "Trainers" } },
  { key: "classes",         href: "/dashboard/classes",         icon: "CalendarDays", group: "industry", available: true, label: { ar: "الحصص",         en: "Classes" } },
  { key: "attendance",      href: "/dashboard/attendance",      icon: "ClipboardCheck",group:"industry", available: true, label: { ar: "الحضور",        en: "Attendance" } },

  /* ---- salon ---- */
  { key: "staff",           href: "/dashboard/staff",           icon: "UserCog",      group: "industry", available: true, label: { ar: "الفريق",        en: "Staff" } },
  { key: "working-hours",   href: "/dashboard/working-hours",   icon: "Clock",        group: "industry", available: true, label: { ar: "مواعيد العمل",  en: "Working Hours" } },

  /* ---- real estate ---- */
  { key: "properties",        href: "/dashboard/properties",        icon: "Building2", group: "industry", available: true, label: { ar: "العقارات",          en: "Properties" } },
  { key: "property-requests", href: "/dashboard/property-requests", icon: "ClipboardList", group: "industry", available: true, label: { ar: "طلبات العقارات",   en: "Property Requests" } },
  { key: "visits",            href: "/dashboard/visits",            icon: "MapPin",    group: "industry", available: true, label: { ar: "المعاينات",         en: "Visits" } },
  { key: "agents",            href: "/dashboard/agents",            icon: "UserCog",   group: "industry", available: true, label: { ar: "المندوبون",         en: "Agents" } },
  { key: "property-categories",href:"/dashboard/property-categories",icon: "Tag",      group: "industry", available: true, label: { ar: "تصنيفات العقارات",  en: "Property Categories" } },

  /* ---- educational center ---- */
  { key: "courses",         href: "/dashboard/courses",         icon: "GraduationCap",group: "industry", available: true, label: { ar: "الكورسات",      en: "Courses" } },
  { key: "students",        href: "/dashboard/students",        icon: "Users",        group: "industry", available: true, label: { ar: "الطلاب",        en: "Students" } },
  { key: "teachers",        href: "/dashboard/teachers",        icon: "UserCog",      group: "industry", available: true, label: { ar: "المدرسون",      en: "Teachers" } },

  /* ---- lawyer office ---- */
  { key: "cases",           href: "/dashboard/cases",           icon: "Scale",        group: "industry", available: true, label: { ar: "القضايا",       en: "Cases" } },
  { key: "clients",         href: "/dashboard/clients",         icon: "Briefcase",    group: "industry", available: true, label: { ar: "الموكلون",      en: "Clients" } },
  { key: "documents",       href: "/dashboard/documents",       icon: "FileText",     group: "industry", available: true, label: { ar: "المستندات",     en: "Documents" } },

  /* ---- service company / car service ---- */
  { key: "work-orders",     href: "/dashboard/work-orders",     icon: "ClipboardList",group: "industry", available: true, label: { ar: "أوامر الشغل",   en: "Work Orders" } },
  { key: "technicians",     href: "/dashboard/technicians",     icon: "Wrench",       group: "industry", available: true, label: { ar: "الفنيون",       en: "Technicians" } },
  { key: "scheduling",      href: "/dashboard/scheduling",      icon: "CalendarDays", group: "industry", available: true, label: { ar: "الجدولة",       en: "Scheduling" } },
  { key: "service-requests",href: "/dashboard/service-requests",icon: "ClipboardList",group: "industry", available: true, label: { ar: "طلبات الخدمة",   en: "Service Requests" } },
];

/* NOTE: every industry module below is backed either by a static page
   (orders/products/services) or by a resource descriptor in
   src/lib/modules/resources.ts (rendered via /dashboard/[module]).
   So all modules are `available: true` — no "Soon" placeholders remain. */

/** All modules, indexed by key. */
export const ALL_MODULES: ModuleDef[] = [...CORE_MODULES, ...INDUSTRY_MODULES];

const MODULE_INDEX: Record<string, ModuleDef> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.key, m])
);

export function getModule(key: string): ModuleDef | undefined {
  return MODULE_INDEX[key];
}

/**
 * LEGACY full navigation — the exact order shown today.
 * Returned for any business type that has no industry template,
 * guaranteeing 100% backward compatibility for existing businesses.
 */
export const LEGACY_NAV_KEYS: string[] = [
  "overview",
  "conversations",
  "orders",
  "customers",
  "analytics",
  "usage",
  "knowledge-base",
  "products",
  "services",
  "broadcasts",
  "whatsapp",
  "ai-settings",
  "notifications",
  "automation",
  "invoices",
  "subscription",
  "files",
  "settings",
];

/**
 * Core tail order — core modules that always render AFTER the
 * industry-specific modules in the sidebar.
 */
export const CORE_TAIL_KEYS: string[] = [
  "customers",
  "analytics",
  "usage",
  "knowledge-base",
  "broadcasts",
  "whatsapp",
  "ai-settings",
  "notifications",
  "automation",
  "invoices",
  "subscription",
  "files",
  "settings",
];

/** Core head order — always render BEFORE the industry modules. */
export const CORE_HEAD_KEYS: string[] = ["overview", "conversations"];
