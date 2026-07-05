/* ============================================================
   ArqFlow — Resource descriptors (generic CRUD engine)
   ------------------------------------------------------------
   Each industry module is described as data: which table it maps
   to, its fields (type/label/validation), what's searchable,
   filterable, and shown in the list. The generic ResourceClient
   renders full CRUD + search + filter + pagination from this.

   Pure data — no React. Safe to import from server + client.
   New module = one entry here (no new page needed).
   ============================================================ */

import type { L10n } from "./types";

export type FieldType =
  | "text" | "textarea" | "number" | "money" | "boolean"
  | "date" | "datetime" | "select" | "ref" | "tags";

export interface FieldOption { value: string; label: L10n }

export interface FieldDef {
  key: string;
  label: L10n;
  type: FieldType;
  required?: boolean;
  list?: boolean;      // show as a column in the list
  search?: boolean;    // included in text search
  filter?: boolean;    // expose as the filter dropdown (select/boolean)
  options?: FieldOption[];
  ref?: { table: string; labelField: string };
  fixed?: string;      // auto-set on insert (e.g. categories.kind = 'property')
}

export interface BaseFilter {
  column: string;
  op: "eq" | "in" | "gte" | "lt";
  value: string | string[];   // tokens: $todayStart, $tomorrowStart
}

export interface ResourceDescriptor {
  table: string;
  titleField: string;
  orderBy: { column: string; ascending: boolean };
  fields: FieldDef[];
  baseFilter?: BaseFilter[];
}

/* ---------- helpers ---------- */
const L = (ar: string, en: string): L10n => ({ ar, en });
const opt = (value: string, ar: string, en: string): FieldOption => ({ value, label: L(ar, en) });

/* ---------- shared status option sets ---------- */
const APPT_STATUS: FieldOption[] = [
  opt("scheduled", "محجوز", "Scheduled"), opt("confirmed", "مؤكد", "Confirmed"),
  opt("waiting", "في الانتظار", "Waiting"), opt("in_progress", "جارٍ", "In progress"),
  opt("completed", "مكتمل", "Completed"), opt("cancelled", "ملغي", "Cancelled"),
  opt("no_show", "لم يحضر", "No-show"),
];
const RES_STATUS: FieldOption[] = [
  opt("pending", "بانتظار التأكيد", "Pending"), opt("confirmed", "مؤكد", "Confirmed"),
  opt("checked_in", "تم الوصول", "Checked-in"), opt("checked_out", "تمت المغادرة", "Checked-out"),
  opt("cancelled", "ملغي", "Cancelled"),
];
const ROOM_STATUS: FieldOption[] = [
  opt("available", "متاحة", "Available"), opt("occupied", "مشغولة", "Occupied"),
  opt("cleaning", "تنظيف", "Cleaning"), opt("maintenance", "صيانة", "Maintenance"),
];
const MEMBER_STATUS: FieldOption[] = [
  opt("active", "نشطة", "Active"), opt("frozen", "مجمّدة", "Frozen"),
  opt("expired", "منتهية", "Expired"), opt("cancelled", "ملغاة", "Cancelled"),
];
const PROP_STATUS: FieldOption[] = [
  opt("available", "متاح", "Available"), opt("reserved", "محجوز", "Reserved"),
  opt("sold", "تم البيع", "Sold"), opt("rented", "مؤجّر", "Rented"),
];
const PROP_PURPOSE: FieldOption[] = [opt("sale", "بيع", "Sale"), opt("rent", "إيجار", "Rent")];
const REQ_STATUS: FieldOption[] = [
  opt("new", "جديد", "New"), opt("in_progress", "قيد المعالجة", "In progress"),
  opt("matched", "تم التوفيق", "Matched"), opt("closed", "مغلق", "Closed"),
];
const VISIT_STATUS: FieldOption[] = [
  opt("scheduled", "مجدولة", "Scheduled"), opt("completed", "تمت", "Completed"), opt("cancelled", "ملغاة", "Cancelled"),
];
const CONSULT_STATUS: FieldOption[] = [
  opt("new", "جديد", "New"), opt("in_review", "قيد المراجعة", "In review"),
  opt("scheduled", "محجوز", "Scheduled"), opt("closed", "مغلق", "Closed"),
];
const FOLLOW_STATUS: FieldOption[] = [
  opt("pending", "معلّقة", "Pending"), opt("done", "تمت", "Done"), opt("cancelled", "ملغاة", "Cancelled"),
];
const CASE_STATUS: FieldOption[] = [
  opt("open", "مفتوحة", "Open"), opt("in_progress", "قيد النظر", "In progress"),
  opt("won", "كسبت", "Won"), opt("lost", "خسرت", "Lost"), opt("closed", "مغلقة", "Closed"),
];
const SREQ_STATUS: FieldOption[] = [
  opt("new", "جديد", "New"), opt("scheduled", "مجدول", "Scheduled"),
  opt("in_progress", "جارٍ", "In progress"), opt("done", "تم", "Done"), opt("cancelled", "ملغي", "Cancelled"),
];
const WO_STATUS: FieldOption[] = [
  opt("open", "مفتوح", "Open"), opt("assigned", "مُسند", "Assigned"),
  opt("in_progress", "جارٍ", "In progress"), opt("completed", "مكتمل", "Completed"), opt("cancelled", "ملغي", "Cancelled"),
];
const ENROLL_STATUS: FieldOption[] = [
  opt("active", "نشط", "Active"), opt("completed", "مكتمل", "Completed"), opt("dropped", "منسحب", "Dropped"),
];

/* ---------- reusable field fragments ---------- */
const fActive: FieldDef = { key: "active", label: L("نشط", "Active"), type: "boolean", list: true, filter: true };
const fNotes: FieldDef = { key: "notes", label: L("ملاحظات", "Notes"), type: "textarea" };
const fPhone: FieldDef = { key: "phone", label: L("الهاتف", "Phone"), type: "text", list: true, search: true };
const fEmail: FieldDef = { key: "email", label: L("البريد الإلكتروني", "Email"), type: "text", search: true };

/* ============================================================
   RESOURCES — keyed by dashboard module key (matches registry)
   ============================================================ */
export const RESOURCES: Record<string, ResourceDescriptor> = {
  /* ---------------- Clinic / Medical / Salon ---------------- */
  doctors: {
    table: "doctors", titleField: "name", orderBy: { column: "sort_order", ascending: true },
    fields: [
      { key: "name", label: L("اسم الطبيب", "Doctor name"), type: "text", required: true, list: true, search: true },
      { key: "specialty", label: L("التخصص", "Specialty"), type: "text", list: true, search: true },
      fPhone, { key: "bio", label: L("نبذة", "Bio"), type: "textarea" },
      { key: "photo_url", label: L("رابط الصورة", "Photo URL"), type: "text" },
      fActive,
    ],
  },
  "medical-services": {
    table: "medical_services", titleField: "name", orderBy: { column: "sort_order", ascending: true },
    fields: [
      { key: "name", label: L("اسم الخدمة", "Service name"), type: "text", required: true, list: true, search: true },
      { key: "category", label: L("الفئة", "Category"), type: "text", list: true, search: true, filter: true },
      { key: "price_egp", label: L("السعر (ج.م)", "Price (EGP)"), type: "money", list: true },
      { key: "duration_minutes", label: L("المدة (دقيقة)", "Duration (min)"), type: "number" },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      fActive,
    ],
  },
  patients: {
    table: "patients", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم المريض", "Patient name"), type: "text", required: true, list: true, search: true },
      fPhone, fEmail,
      { key: "date_of_birth", label: L("تاريخ الميلاد", "Date of birth"), type: "date" },
      { key: "gender", label: L("النوع", "Gender"), type: "select", list: true, filter: true,
        options: [opt("male", "ذكر", "Male"), opt("female", "أنثى", "Female")] },
      { key: "medical_notes", label: L("ملاحظات طبية", "Medical notes"), type: "textarea" },
      { key: "tags", label: L("الوسوم", "Tags"), type: "tags" },
    ],
  },
  appointments: {
    table: "appointments", titleField: "starts_at", orderBy: { column: "starts_at", ascending: false },
    fields: [
      { key: "starts_at", label: L("موعد البداية", "Starts at"), type: "datetime", required: true, list: true },
      { key: "doctor_id", label: L("الطبيب", "Doctor"), type: "ref", list: true, filter: true, ref: { table: "doctors", labelField: "name" } },
      { key: "patient_id", label: L("المريض", "Patient"), type: "ref", list: true, ref: { table: "patients", labelField: "name" } },
      { key: "service_id", label: L("الخدمة", "Service"), type: "ref", ref: { table: "medical_services", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: APPT_STATUS },
      { key: "ends_at", label: L("موعد الانتهاء", "Ends at"), type: "datetime" },
      fNotes,
    ],
  },
  "waiting-queue": {
    table: "appointments", titleField: "starts_at", orderBy: { column: "starts_at", ascending: true },
    baseFilter: [{ column: "status", op: "in", value: ["scheduled", "confirmed", "waiting", "in_progress"] }],
    fields: [
      { key: "starts_at", label: L("الموعد", "Time"), type: "datetime", required: true, list: true },
      { key: "patient_id", label: L("المريض", "Patient"), type: "ref", list: true, ref: { table: "patients", labelField: "name" } },
      { key: "doctor_id", label: L("الطبيب", "Doctor"), type: "ref", list: true, filter: true, ref: { table: "doctors", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: APPT_STATUS },
      fNotes,
    ],
  },
  "follow-ups": {
    table: "follow_ups", titleField: "due_date", orderBy: { column: "due_date", ascending: true },
    fields: [
      { key: "due_date", label: L("تاريخ المتابعة", "Due date"), type: "date", required: true, list: true },
      { key: "patient_id", label: L("المريض", "Patient"), type: "ref", list: true, ref: { table: "patients", labelField: "name" } },
      { key: "doctor_id", label: L("الطبيب", "Doctor"), type: "ref", filter: true, ref: { table: "doctors", labelField: "name" } },
      { key: "reason", label: L("السبب", "Reason"), type: "text", list: true, search: true },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: FOLLOW_STATUS },
      fNotes,
    ],
  },
  consultations: {
    table: "consultation_requests", titleField: "subject", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم العميل", "Name"), type: "text", list: true, search: true },
      fPhone,
      { key: "subject", label: L("الموضوع", "Subject"), type: "text", list: true, search: true },
      { key: "details", label: L("التفاصيل", "Details"), type: "textarea" },
      { key: "preferred_at", label: L("الموعد المفضّل", "Preferred time"), type: "datetime" },
      { key: "doctor_id", label: L("الطبيب", "Doctor"), type: "ref", ref: { table: "doctors", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: CONSULT_STATUS },
    ],
  },

  /* ---------------- Hotel ---------------- */
  rooms: {
    table: "rooms", titleField: "room_number", orderBy: { column: "room_number", ascending: true },
    fields: [
      { key: "room_number", label: L("رقم الغرفة", "Room number"), type: "text", required: true, list: true, search: true },
      { key: "room_type", label: L("نوع الغرفة", "Room type"), type: "text", list: true, search: true, filter: true },
      { key: "capacity", label: L("السعة", "Capacity"), type: "number" },
      { key: "rate_egp", label: L("السعر/الليلة (ج.م)", "Rate/night (EGP)"), type: "money", list: true },
      { key: "floor", label: L("الطابق", "Floor"), type: "text" },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: ROOM_STATUS },
      { key: "amenities", label: L("المرافق", "Amenities"), type: "tags" },
      fActive,
    ],
  },
  "room-status": {
    table: "rooms", titleField: "room_number", orderBy: { column: "room_number", ascending: true },
    fields: [
      { key: "room_number", label: L("رقم الغرفة", "Room number"), type: "text", required: true, list: true, search: true },
      { key: "room_type", label: L("النوع", "Type"), type: "text", list: true, filter: true },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: ROOM_STATUS },
    ],
  },
  guests: {
    table: "guests", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم النزيل", "Guest name"), type: "text", required: true, list: true, search: true },
      fPhone, fEmail,
      { key: "id_number", label: L("رقم الهوية", "ID number"), type: "text", search: true },
      { key: "nationality", label: L("الجنسية", "Nationality"), type: "text", list: true, filter: true },
      fNotes,
    ],
  },
  reservations: {
    table: "reservations", titleField: "check_in", orderBy: { column: "check_in", ascending: false },
    fields: [
      { key: "check_in", label: L("تاريخ الوصول", "Check-in"), type: "date", required: true, list: true },
      { key: "check_out", label: L("تاريخ المغادرة", "Check-out"), type: "date", required: true, list: true },
      { key: "room_id", label: L("الغرفة", "Room"), type: "ref", list: true, ref: { table: "rooms", labelField: "room_number" } },
      { key: "guest_id", label: L("النزيل", "Guest"), type: "ref", list: true, ref: { table: "guests", labelField: "name" } },
      { key: "guests_count", label: L("عدد النزلاء", "Guests"), type: "number" },
      { key: "total_egp", label: L("الإجمالي (ج.م)", "Total (EGP)"), type: "money" },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: RES_STATUS },
      fNotes,
    ],
  },

  /* ---------------- Gym ---------------- */
  trainers: {
    table: "trainers", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم المدرب", "Trainer name"), type: "text", required: true, list: true, search: true },
      { key: "specialty", label: L("التخصص", "Specialty"), type: "text", list: true, search: true, filter: true },
      fPhone, { key: "bio", label: L("نبذة", "Bio"), type: "textarea" }, fActive,
    ],
  },
  memberships: {
    table: "memberships", titleField: "member_name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "member_name", label: L("اسم العضو", "Member name"), type: "text", required: true, list: true, search: true },
      fPhone,
      { key: "plan_name", label: L("الباقة", "Plan"), type: "text", list: true, search: true, filter: true },
      { key: "price_egp", label: L("السعر (ج.م)", "Price (EGP)"), type: "money" },
      { key: "starts_on", label: L("تاريخ البداية", "Starts on"), type: "date", list: true },
      { key: "ends_on", label: L("تاريخ الانتهاء", "Ends on"), type: "date", list: true },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: MEMBER_STATUS },
      fNotes,
    ],
  },
  classes: {
    table: "classes", titleField: "name", orderBy: { column: "starts_at", ascending: true },
    fields: [
      { key: "name", label: L("اسم الحصة", "Class name"), type: "text", required: true, list: true, search: true },
      { key: "trainer_id", label: L("المدرب", "Trainer"), type: "ref", list: true, filter: true, ref: { table: "trainers", labelField: "name" } },
      { key: "starts_at", label: L("الموعد", "Starts at"), type: "datetime", list: true },
      { key: "capacity", label: L("السعة", "Capacity"), type: "number" },
      { key: "recurring", label: L("التكرار", "Recurring"), type: "text" },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      fActive,
    ],
  },
  attendance: {
    table: "class_attendance", titleField: "member_name", orderBy: { column: "checked_in_at", ascending: false },
    fields: [
      { key: "member_name", label: L("اسم العضو", "Member"), type: "text", list: true, search: true },
      { key: "class_id", label: L("الحصة", "Class"), type: "ref", list: true, filter: true, ref: { table: "classes", labelField: "name" } },
      { key: "checked_in_at", label: L("وقت الحضور", "Checked in at"), type: "datetime", list: true },
      fNotes,
    ],
  },

  /* ---------------- Salon (shared appointments/services) ---------------- */
  staff: {
    table: "staff", titleField: "name", orderBy: { column: "sort_order", ascending: true },
    fields: [
      { key: "name", label: L("اسم الموظف", "Staff name"), type: "text", required: true, list: true, search: true },
      { key: "role", label: L("الدور", "Role"), type: "text", list: true, search: true, filter: true },
      fPhone, fEmail, fActive,
    ],
  },
  "working-hours": {
    table: "business_hours", titleField: "day_of_week", orderBy: { column: "day_of_week", ascending: true },
    fields: [
      { key: "day_of_week", label: L("اليوم", "Day"), type: "select", required: true, list: true, filter: true, options: [
        opt("0", "الأحد", "Sunday"), opt("1", "الإثنين", "Monday"), opt("2", "الثلاثاء", "Tuesday"),
        opt("3", "الأربعاء", "Wednesday"), opt("4", "الخميس", "Thursday"), opt("5", "الجمعة", "Friday"), opt("6", "السبت", "Saturday") ] },
      { key: "opens", label: L("يفتح", "Opens"), type: "text", list: true },
      { key: "closes", label: L("يغلق", "Closes"), type: "text", list: true },
      { key: "closed", label: L("مغلق", "Closed"), type: "boolean", list: true, filter: true },
      fNotes,
    ],
  },

  /* ---------------- Real Estate ---------------- */
  agents: {
    table: "agents", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم المندوب", "Agent name"), type: "text", required: true, list: true, search: true },
      fPhone, fEmail, fActive,
    ],
  },
  properties: {
    table: "properties", titleField: "title", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "title", label: L("عنوان العقار", "Title"), type: "text", required: true, list: true, search: true },
      { key: "category", label: L("النوع", "Category"), type: "text", list: true, search: true, filter: true },
      { key: "purpose", label: L("الغرض", "Purpose"), type: "select", list: true, filter: true, options: PROP_PURPOSE },
      { key: "price_egp", label: L("السعر (ج.م)", "Price (EGP)"), type: "money", list: true },
      { key: "area_sqm", label: L("المساحة (م²)", "Area (m²)"), type: "number" },
      { key: "bedrooms", label: L("غرف النوم", "Bedrooms"), type: "number" },
      { key: "bathrooms", label: L("الحمامات", "Bathrooms"), type: "number" },
      { key: "location", label: L("المنطقة", "Location"), type: "text", search: true },
      { key: "address", label: L("العنوان", "Address"), type: "text" },
      { key: "agent_id", label: L("المندوب", "Agent"), type: "ref", ref: { table: "agents", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: PROP_STATUS },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      fActive,
    ],
  },
  "property-requests": {
    table: "property_requests", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم العميل", "Name"), type: "text", list: true, search: true },
      fPhone,
      { key: "request_type", label: L("النوع", "Type"), type: "select", list: true, filter: true, options: PROP_PURPOSE },
      { key: "budget_egp", label: L("الميزانية (ج.م)", "Budget (EGP)"), type: "money", list: true },
      { key: "preferred_location", label: L("المنطقة المفضّلة", "Preferred area"), type: "text", search: true },
      { key: "assigned_agent_id", label: L("المندوب المسؤول", "Assigned agent"), type: "ref", ref: { table: "agents", labelField: "name" } },
      { key: "details", label: L("التفاصيل", "Details"), type: "textarea" },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: REQ_STATUS },
    ],
  },
  visits: {
    table: "property_visits", titleField: "scheduled_at", orderBy: { column: "scheduled_at", ascending: false },
    fields: [
      { key: "scheduled_at", label: L("موعد المعاينة", "Scheduled at"), type: "datetime", required: true, list: true },
      { key: "property_id", label: L("العقار", "Property"), type: "ref", list: true, ref: { table: "properties", labelField: "title" } },
      { key: "agent_id", label: L("المندوب", "Agent"), type: "ref", list: true, filter: true, ref: { table: "agents", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: VISIT_STATUS },
      fNotes,
    ],
  },
  "property-categories": {
    table: "categories", titleField: "name", orderBy: { column: "sort_order", ascending: true },
    baseFilter: [{ column: "kind", op: "eq", value: "property" }],
    fields: [
      { key: "name", label: L("اسم التصنيف", "Category name"), type: "text", required: true, list: true, search: true },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      { key: "kind", label: L("النوع", "Kind"), type: "text", fixed: "property" },
      fActive,
    ],
  },

  /* ---------------- Educational Center ---------------- */
  teachers: {
    table: "teachers", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم المدرس", "Teacher name"), type: "text", required: true, list: true, search: true },
      { key: "subject", label: L("المادة", "Subject"), type: "text", list: true, search: true, filter: true },
      fPhone, { key: "bio", label: L("نبذة", "Bio"), type: "textarea" }, fActive,
    ],
  },
  courses: {
    table: "courses", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم الكورس", "Course name"), type: "text", required: true, list: true, search: true },
      { key: "teacher_id", label: L("المدرس", "Teacher"), type: "ref", list: true, filter: true, ref: { table: "teachers", labelField: "name" } },
      { key: "level", label: L("المستوى", "Level"), type: "text", list: true, filter: true },
      { key: "price_egp", label: L("السعر (ج.م)", "Price (EGP)"), type: "money", list: true },
      { key: "capacity", label: L("السعة", "Capacity"), type: "number" },
      { key: "schedule", label: L("المواعيد", "Schedule"), type: "text" },
      { key: "starts_on", label: L("تاريخ البدء", "Starts on"), type: "date" },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      fActive,
    ],
  },
  students: {
    table: "students", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم الطالب", "Student name"), type: "text", required: true, list: true, search: true },
      fPhone, fEmail,
      { key: "parent_name", label: L("اسم ولي الأمر", "Parent name"), type: "text", search: true },
      { key: "parent_phone", label: L("هاتف ولي الأمر", "Parent phone"), type: "text" },
      fNotes,
    ],
  },

  /* ---------------- Law Firm ---------------- */
  clients: {
    table: "case_clients", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم الموكّل", "Client name"), type: "text", required: true, list: true, search: true },
      fPhone, fEmail,
      { key: "national_id", label: L("الرقم القومي", "National ID"), type: "text", search: true },
      fNotes,
    ],
  },
  cases: {
    table: "cases", titleField: "title", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "title", label: L("عنوان القضية", "Case title"), type: "text", required: true, list: true, search: true },
      { key: "case_number", label: L("رقم القضية", "Case number"), type: "text", list: true, search: true },
      { key: "client_id", label: L("الموكّل", "Client"), type: "ref", list: true, ref: { table: "case_clients", labelField: "name" } },
      { key: "practice_area", label: L("مجال الممارسة", "Practice area"), type: "text", list: true, filter: true },
      { key: "court", label: L("المحكمة", "Court"), type: "text" },
      { key: "next_hearing", label: L("الجلسة القادمة", "Next hearing"), type: "datetime", list: true },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: CASE_STATUS },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
    ],
  },
  documents: {
    table: "case_documents", titleField: "title", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "title", label: L("عنوان المستند", "Document title"), type: "text", required: true, list: true, search: true },
      { key: "case_id", label: L("القضية", "Case"), type: "ref", list: true, filter: true, ref: { table: "cases", labelField: "title" } },
      { key: "storage_path", label: L("مسار الملف", "File path / URL"), type: "text" },
      fNotes,
    ],
  },

  /* ---------------- Service Company / Car Service ---------------- */
  technicians: {
    table: "technicians", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم الفني", "Technician name"), type: "text", required: true, list: true, search: true },
      { key: "skill", label: L("التخصص", "Skill"), type: "text", list: true, search: true, filter: true },
      fPhone, fActive,
    ],
  },
  "service-requests": {
    table: "service_requests", titleField: "name", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "name", label: L("اسم العميل", "Name"), type: "text", list: true, search: true },
      fPhone,
      { key: "details", label: L("تفاصيل الطلب", "Details"), type: "textarea" },
      { key: "preferred_at", label: L("الموعد المفضّل", "Preferred time"), type: "datetime" },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: SREQ_STATUS },
    ],
  },
  "work-orders": {
    table: "work_orders", titleField: "title", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "title", label: L("عنوان أمر الشغل", "Title"), type: "text", required: true, list: true, search: true },
      { key: "order_number", label: L("رقم الأمر", "Order #"), type: "text", list: true, search: true },
      { key: "technician_id", label: L("الفني", "Technician"), type: "ref", list: true, filter: true, ref: { table: "technicians", labelField: "name" } },
      { key: "scheduled_at", label: L("الموعد", "Scheduled at"), type: "datetime", list: true },
      { key: "total_egp", label: L("الإجمالي (ج.م)", "Total (EGP)"), type: "money" },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: WO_STATUS },
      fNotes,
    ],
  },
  scheduling: {
    table: "work_orders", titleField: "title", orderBy: { column: "scheduled_at", ascending: true },
    fields: [
      { key: "title", label: L("المهمة", "Job"), type: "text", required: true, list: true, search: true },
      { key: "scheduled_at", label: L("الموعد", "Scheduled at"), type: "datetime", list: true },
      { key: "technician_id", label: L("الفني", "Technician"), type: "ref", list: true, filter: true, ref: { table: "technicians", labelField: "name" } },
      { key: "status", label: L("الحالة", "Status"), type: "select", required: true, list: true, filter: true, options: WO_STATUS },
      fNotes,
    ],
  },

  /* ---------------- Commerce extensions ---------------- */
  "delivery-areas": {
    table: "delivery_zones", titleField: "name", orderBy: { column: "name", ascending: true },
    fields: [
      { key: "name", label: L("اسم المنطقة", "Area name"), type: "text", required: true, list: true, search: true },
      { key: "fee_egp", label: L("رسوم التوصيل (ج.م)", "Fee (EGP)"), type: "money", list: true },
      { key: "eta_text", label: L("مدة التوصيل", "ETA"), type: "text", list: true },
      fActive,
    ],
  },
  inventory: {
    table: "products", titleField: "name", orderBy: { column: "name", ascending: true },
    fields: [
      { key: "name", label: L("المنتج", "Product"), type: "text", required: true, list: true, search: true },
      { key: "category", label: L("الفئة", "Category"), type: "text", list: true, filter: true },
      { key: "stock_qty", label: L("الكمية بالمخزون", "Stock qty"), type: "number", list: true },
      { key: "price_egp", label: L("السعر (ج.م)", "Price (EGP)"), type: "money", list: true },
      { key: "available", label: L("متاح", "Available"), type: "boolean", list: true, filter: true },
    ],
  },
  promotions: {
    table: "promotions", titleField: "title", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "title", label: L("عنوان العرض", "Title"), type: "text", required: true, list: true, search: true },
      { key: "discount_text", label: L("الخصم", "Discount"), type: "text", list: true },
      { key: "starts_on", label: L("يبدأ", "Starts"), type: "date", list: true },
      { key: "ends_on", label: L("ينتهي", "Ends"), type: "date", list: true },
      { key: "description", label: L("الوصف", "Description"), type: "textarea" },
      fActive,
    ],
  },
  coupons: {
    table: "coupons", titleField: "code", orderBy: { column: "created_at", ascending: false },
    fields: [
      { key: "code", label: L("الكود", "Code"), type: "text", required: true, list: true, search: true },
      { key: "discount_type", label: L("نوع الخصم", "Type"), type: "select", list: true, filter: true,
        options: [opt("percent", "نسبة %", "Percent %"), opt("fixed", "مبلغ ثابت", "Fixed")] },
      { key: "discount_value", label: L("قيمة الخصم", "Value"), type: "number", list: true },
      { key: "expires_at", label: L("ينتهي في", "Expires at"), type: "date", list: true },
      { key: "usage_limit", label: L("حد الاستخدام", "Usage limit"), type: "number" },
      fActive,
    ],
  },
};

/** Module keys served by the generic engine (have a descriptor). */
export const RESOURCE_KEYS = Object.keys(RESOURCES);

export function getResource(moduleKey: string): ResourceDescriptor | null {
  return RESOURCES[moduleKey] ?? null;
}
