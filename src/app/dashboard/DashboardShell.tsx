"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  Lock,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { useLang, useT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import type { Capabilities } from "@/lib/capabilities";
import { CapabilitiesProvider } from "@/lib/capabilities-context";
import { ToastProvider } from "@/components/ui/Toast";
import { resolveModules, getModuleByPath } from "@/lib/modules";
import { getIcon } from "@/lib/modules/icons";

type Profile = Tables<"profiles">;
type Business = Tables<"businesses">;

interface Props {
  profile: Profile;
  business: Business;
  capabilities: Capabilities;
  unreadCount: number;
  children: React.ReactNode;
}

function ProvisioningPlaceholder({ business, lang }: { business: Business; lang: "ar" | "en" }) {
  const t = {
    ar: {
      title: "بوتك قيد الإعداد",
      subtitle: "فريقنا يعمل على تجهيز مساعدك الذكي الآن",
      step1: "استلام طلبك",
      step2: "إعداد البوت",
      step3: "ربط واتساب",
      step4: "اختبار النظام",
      step5: "التشغيل",
      eta: "متوقع خلال ٢٤-٤٨ ساعة عمل",
      support: "للاستفسار تواصل معنا عبر واتساب",
    },
    en: {
      title: "Your bot is being set up",
      subtitle: "Our team is configuring your AI assistant right now",
      step1: "Request received",
      step2: "Bot configuration",
      step3: "WhatsApp connection",
      step4: "System testing",
      step5: "Go live",
      eta: "Expected within 24-48 business hours",
      support: "For inquiries contact us via WhatsApp",
    },
  }[lang];

  const steps = [t.step1, t.step2, t.step3, t.step4, t.step5];
  const activeStep = business.status === "pending_approval" ? 0 : 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="glass-strong max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(153,207,220,0.12)] flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted mb-8">{t.subtitle}</p>
        <div className="space-y-3 text-start mb-8">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  i < activeStep
                    ? "bg-[rgba(74,222,128,0.15)] text-[var(--success)]"
                    : i === activeStep
                    ? "bg-[rgba(153,207,220,0.2)] text-accent animate-pulse"
                    : "bg-[rgba(238,237,210,0.06)] text-muted"
                )}
              >
                {i < activeStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(i <= activeStep ? "text-app" : "text-muted")}>{step}</span>
            </div>
          ))}
        </div>
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="w-4 h-4 shrink-0" />
            <span>{t.eta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({ profile, business, capabilities, unreadCount: initialUnread, children }: Props) {
  const { lang, dir, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  // 'provisioning' and later stages are handled by ProvisioningScreen in the
  // layout; this placeholder now only covers the pre-approval waiting state.
  const isProvisioning = business.status === "pending_approval";

  // Dynamic, industry-aware navigation. Unknown/legacy business types
  // fall back to the full current navigation (100% backward compatible).
  const { nav } = useMemo(
    () => resolveModules(business.business_type, capabilities),
    [business.business_type, capabilities]
  );

  const activeModule = getModuleByPath(pathname, business.business_type);
  const pageTitle = activeModule?.label ?? { ar: "لوحة التحكم", en: "Dashboard" };

  // bilingual "Soon" pill for modules whose page hasn't shipped yet
  const soonLabel = lang === "ar" ? "قريباً" : "Soon";
  // bilingual "Upgrade" pill for plan-locked (showcase) modules
  const upgradeLabel = lang === "ar" ? "ترقية" : "Upgrade";

  // Stable supabase instance — must not be recreated on every render
  const supabase = useMemo(() => createClient(), []);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnread(data.filter((n) => !n.read).length);
    }
  }, [profile.id, supabase]);

  useEffect(() => {
    loadNotifications();
    const channel = supabase
      .channel("notifications:" + profile.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => loadNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadNotifications, profile.id, supabase]);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", profile.id)
      .eq("read", false);
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isProvisioning) {
    return <ProvisioningPlaceholder business={business} lang={lang} />;
  }

  return (
    <ToastProvider>
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }} dir={dir}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 w-64 glass-strong flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto",
          dir === "rtl"
            ? sidebarOpen ? "translate-x-0 right-0" : "translate-x-full right-0"
            : sidebarOpen ? "translate-x-0 left-0" : "-translate-x-full left-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <Link href="/dashboard/overview" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2a6072] to-[#6ba0ac] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">ArqFlow</span>
          </Link>
          <button className="btn-ghost !p-1.5 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((mod) => {
            const Icon = getIcon(mod.icon);
            const label = lang === "ar" ? mod.label.ar : mod.label.en;

            // Modules whose page hasn't shipped yet render as a polished,
            // non-navigating "Soon" item — so the sidebar never 404s.
            if (!mod.available) {
              return (
                <div
                  key={mod.key}
                  aria-disabled="true"
                  title={soonLabel}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted/60 cursor-default select-none"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  <span className="ms-auto shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[rgba(238,237,210,0.07)] text-muted">
                    {soonLabel}
                  </span>
                </div>
              );
            }

            // Plan-locked showcase module: visible but gated. Clicking
            // routes to the subscription page with an upgrade hint, so the
            // feature advertises the higher tier instead of disappearing.
            if (mod.locked) {
              return (
                <Link
                  key={mod.key}
                  href={`/dashboard/subscription?upgrade=${mod.key}`}
                  onClick={() => setSidebarOpen(false)}
                  title={upgradeLabel}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted/70 hover:bg-[rgba(238,237,210,0.06)] hover:text-app transition-all"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  <span className="ms-auto shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-[rgba(212,175,55,0.14)] text-[#d4af37]">
                    <Lock className="w-2.5 h-2.5" />
                    {upgradeLabel}
                  </span>
                </Link>
              );
            }

            const active = pathname === mod.href || pathname.startsWith(mod.href + "/");
            return (
              <Link
                key={mod.key}
                href={mod.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[rgba(153,207,220,0.18)] text-accent"
                    : "text-muted hover:bg-[rgba(238,237,210,0.06)] hover:text-app"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {active && (
                  <ChevronRight
                    className={cn("w-3 h-3 ms-auto shrink-0", dir === "rtl" ? "rotate-180" : "")}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[rgba(153,207,220,0.2)] flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {(profile.full_name ?? profile.email ?? "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{profile.full_name ?? profile.email}</p>
              <p className="text-xs text-muted truncate">{business.business_name}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="btn-ghost w-full justify-start mt-1 text-sm"
          >
            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span>{lang === "ar" ? "تسجيل الخروج" : "Sign out"}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 shrink-0 glass border-b border-[var(--border)] flex items-center gap-4 px-4 lg:px-6">
          <button className="btn-ghost !p-2 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="font-bold text-lg flex-1 truncate">
            {lang === "ar" ? pageTitle.ar : pageTitle.en}
          </h1>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="btn-ghost !px-3 !py-1.5 text-sm font-bold"
            >
              {lang === "ar" ? "EN" : "عر"}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="btn-ghost !p-2 relative"
                onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) loadNotifications(); }}
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={cn(
                      "absolute top-full mt-2 w-80 glass-strong rounded-2xl shadow-2xl z-50",
                      dir === "rtl" ? "left-0" : "right-0"
                    )}
                  >
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                      <h3 className="font-bold">{lang === "ar" ? "الإشعارات" : "Notifications"}</h3>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                          {lang === "ar" ? "قراءة الكل" : "Mark all read"}
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-muted text-sm text-center p-6">
                          {lang === "ar" ? "لا توجد إشعارات" : "No notifications"}
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "p-4 border-b border-[var(--border)] last:border-0 hover:bg-[rgba(238,237,210,0.04)] cursor-pointer",
                              !n.read && "bg-[rgba(153,207,220,0.06)]"
                            )}
                            onClick={() => {
                              if (n.link) router.push(n.link);
                              setNotifOpen(false);
                            }}
                          >
                            <p className="text-sm font-semibold">{n.title}</p>
                            {n.body && <p className="text-xs text-muted mt-0.5">{n.body}</p>}
                            <p className="text-xs text-muted mt-1">{timeAgo(n.created_at, lang)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <CapabilitiesProvider value={capabilities}>
            {children}
          </CapabilitiesProvider>
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
