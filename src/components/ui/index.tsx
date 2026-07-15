"use client";

import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className ?? "w-5 h-5")} />;
}

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: "neutral" | "success" | "warning" | "danger" | "accent" | string;
  children: ReactNode;
  className?: string;
}) {
  const v = variant.startsWith("badge-") ? variant : `badge-${variant}`;
  return <span className={cn("badge", v, className)}>{children}</span>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1.5 truncate">{value}</p>
          {hint && <div className="text-muted text-xs mt-1.5">{hint}</div>}
        </div>
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[rgba(0,229,163,0.12)] text-accent flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn("glass-strong w-full max-h-[90vh] overflow-y-auto p-6", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          <button onClick={onClose} className="btn-ghost !p-2" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  help,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {help ? (
        <span className="text-sm font-semibold mb-1.5 flex items-center gap-1 flex-wrap">
          <span>
            {label}
            {required && <span className="text-danger ms-1">*</span>}
          </span>
          {help}
        </span>
      ) : (
        <span className="block text-sm font-semibold mb-1.5">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-10 text-center flex flex-col items-center gap-3">
      {icon && <div className="text-muted opacity-60">{icon}</div>}
      <p className="font-bold text-lg">{title}</p>
      {body && <p className="text-muted text-sm max-w-md">{body}</p>}
      {action}
    </div>
  );
}
