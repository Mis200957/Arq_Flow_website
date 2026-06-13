"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  body?: string;
}

interface ToastContextValue {
  toast: (opts: { type: ToastType; title: string; body?: string }) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, body }: { type: ToastType; title: string; body?: string }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { id, type, title, body }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const success = useCallback((title: string, body?: string) => toast({ type: "success", title, body }), [toast]);
  const error = useCallback((title: string, body?: string) => toast({ type: "error", title, body }), [toast]);
  const info = useCallback((title: string, body?: string) => toast({ type: "info", title, body }), [toast]);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-success shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-danger shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-warning shrink-0" />,
    info: <Info className="w-4 h-4 text-accent shrink-0" />,
  };

  const borders: Record<ToastType, string> = {
    success: "border-success/30",
    error: "border-danger/30",
    warning: "border-warning/30",
    info: "border-accent/30",
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 end-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass-strong p-4 flex items-start gap-3 pointer-events-auto",
              "border",
              borders[t.type],
              "animate-in slide-in-from-bottom-2 duration-200"
            )}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              {t.body && <p className="text-xs text-muted mt-0.5">{t.body}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="btn-ghost !p-1 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
