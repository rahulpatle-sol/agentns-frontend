"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, X } from "lucide-react";

type Tone = "pending" | "success" | "error" | "info";
export type ToastInput = { tone: Tone; title: string; message?: string; duration?: number };
type ToastItem = ToastInput & { id: number };

type ToastApi = {
  push: (t: ToastInput) => number;
  update: (id: number, t: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const tones = {
  pending: { Icon: Loader2, cls: "text-accent", spin: true },
  success: { Icon: CheckCircle2, cls: "text-ok", spin: false },
  error: { Icon: AlertCircle, cls: "text-bad", spin: false },
  info: { Icon: Info, cls: "text-accent-2", spin: false },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((cur) => cur.filter((i) => i.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, duration?: number) => {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      if (duration && duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const push = useCallback(
    (t: ToastInput) => {
      const id = nextId.current++;
      setItems((cur) => [...cur, { ...t, id }]);
      schedule(id, t.duration ?? 5000);
      return id;
    },
    [schedule],
  );

  const update = useCallback(
    (id: number, t: ToastInput) => {
      setItems((cur) => cur.map((i) => (i.id === id ? { ...t, id } : i)));
      schedule(id, t.duration ?? 5000);
    },
    [schedule],
  );

  const api = useMemo(() => ({ push, update, dismiss }), [push, update, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const { Icon, cls, spin } = tones[t.tone];
          return (
            <div key={t.id} className="glass pointer-events-auto flex gap-3 rounded-xl p-4 shadow-2xl">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls} ${spin ? "animate-spin" : ""}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.message && <p className="mt-0.5 break-words text-xs text-muted">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}
