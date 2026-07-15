"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Package,
  BarChart3,
  Terminal,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ToastProvider } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";

const NAV = [
  { href: "/admin/overview", icon: LayoutDashboard, label: { ar: "نظرة عامة", en: "Overview" } },
  { href: "/admin/payments", icon: CreditCard, label: { ar: "المدفوعات", en: "Payments" } },
  { href: "/admin/clients", icon: Users, label: { ar: "العملاء", en: "Clients" } },
  { href: "/admin/plans", icon: Package, label: { ar: "الخطط", en: "Plans" } },
  { href: "/admin/analytics", icon: BarChart3, label: { ar: "التحليلات", en: "Analytics" } },
  { href: "/admin/logs", icon: Terminal, label: { ar: "سجلات الأتمتة", en: "Automation Logs" } },
  { href: "/admin/settings", icon: Settings, label: { ar: "الإعدادات", en: "Settings" } },
];

interface Props {
  profile: { id: string; full_name: string | null; email: string | null; avatar_url: string | null; role: string };
  unreadCount: number;
  children: React.ReactNode;
}

export default function AdminShell({ profile, unreadCount, children }: Props) {
  const t = useT({ ar: "لوحة الإدارة", en: "Admin Panel" });
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = (profile.full_name ?? profile.email ?? "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-app">
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 start-0 z-40 w-64 flex flex-col glass-strong border-e border-app",
            "transition-transform duration-300 ease-in-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-app shrink-0">
            <Link href="/admin/overview" className="gradient-text font-bold text-xl tracking-tight">
              ArqFlow
            </Link>
            <button
              className="btn-ghost !p-2 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                    active
                      ? "bg-[rgba(27,27,30,0.18)] text-accent"
                      : "text-muted hover:bg-[rgba(27,27,30,0.06)] hover:text-app"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-accent" : "text-muted group-hover:text-app")} />
                  <span className="flex-1">{label.ar} / {label.en}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-accent" />}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="px-4 pb-4 pt-2 border-t border-app shrink-0">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[rgba(27,27,30,0.06)] transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile.full_name ?? "Admin"}</p>
                <p className="text-xs text-muted truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col lg:ms-64 min-w-0">
          {/* Top bar */}
          <header className="h-16 glass border-b border-app flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 rounded-none">
            <div className="flex items-center gap-3">
              <button
                className="btn-ghost !p-2 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg gradient-text hidden sm:block">{t}</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Link href="/admin/overview" className="relative btn-ghost !p-2">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 btn-ghost !px-2 !py-1.5"
                  onClick={() => setUserMenuOpen((p) => !p)}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute end-0 top-full mt-2 w-44 glass-strong rounded-xl overflow-hidden py-1 z-50">
                    <div className="px-3 py-2 border-b border-app">
                      <p className="text-xs text-muted truncate">{profile.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-[rgba(248,113,113,0.08)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout / تسجيل خروج</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
