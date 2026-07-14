/** Legacy-compatible order id: CUST_DDMMYYSS */
export function generateOrderId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `CUST_${pad(d.getDate())}${pad(d.getMonth() + 1)}${String(
    d.getFullYear()
  ).slice(-2)}${pad(d.getSeconds())}`;
}

export function formatEGP(amount: number | string | null | undefined, lang: "ar" | "en" = "ar"): string {
  const n = Number(amount ?? 0);
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-EG").format(n);
  return lang === "ar" ? `${formatted} ج.م` : `${formatted} EGP`;
}

export function formatDate(date: string | Date | null | undefined, lang: "ar" | "en" = "ar"): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined, lang: "ar" | "en" = "ar"): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: string | Date, lang: "ar" | "en" = "ar"): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar" : "en", { numeric: "auto" });
  if (seconds < 60) return rtf.format(-seconds, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Strict E.164-ish Egyptian phone normalizer: returns 20XXXXXXXXXX or null */
export function normalizeEgyptPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  if (/^01[0125]\d{8}$/.test(digits)) return `2${digits}`;
  if (/^201[0125]\d{8}$/.test(digits)) return digits;
  if (/^\d{10,15}$/.test(digits)) return digits; // non-Egyptian international
  return null;
}

export function generatePassword(length = 14): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

export const STATUS_BADGE: Record<string, string> = {
  draft: "badge-neutral",
  pending_payment: "badge-warning",
  pending_approval: "badge-warning",
  provisioning: "badge-accent",
  active: "badge-success",
  suspended: "badge-danger",
  cancelled: "badge-neutral",
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
  open: "badge-accent",
  escalated: "badge-warning",
  closed: "badge-neutral",
  connected: "badge-success",
  disconnected: "badge-danger",
  qr_pending: "badge-warning",
};
