"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Alert, type AlertTone } from "./Alert";

interface ToastInput {
  title: string;
  text?: ReactNode;
  tone?: AlertTone;
}

interface ToastItem extends Required<Pick<ToastInput, "title" | "tone">> {
  id: number;
  text?: ReactNode;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

/** Success and info toasts dismiss after 4s; warnings and errors stay until closed. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const dismiss = useCallback(
    (id: number) => setItems((all) => all.filter((t) => t.id !== id)),
    [],
  );

  const show = useCallback(
    ({ title, text, tone = "success" }: ToastInput) => {
      const id = ++next.current;
      setItems((all) => [...all.slice(-3), { id, title, text, tone }]);
      if (tone === "success" || tone === "info")
        setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-5 bottom-5 z-90 flex max-w-[calc(100vw-40px)] flex-col gap-2.5 max-md:bottom-[84px]"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in border-line bg-surface-raised relative w-[340px] max-w-full rounded-md border shadow-lg"
          >
            <Alert tone={t.tone} title={t.title} className="pr-10">
              {t.text}
            </Alert>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="text-ink-muted hover:bg-surface-sunken hover:text-ink absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-sm"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast({ title: "Profile saved", text: "Your details are up to date." }) */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}
