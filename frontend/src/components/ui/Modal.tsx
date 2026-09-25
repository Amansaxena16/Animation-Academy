"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

import { Button, type ButtonVariant } from "./Button";

interface ConfirmModalProps {
  open: boolean;
  /** Names the object: "Remove Aarav Mehta?" */
  title: ReactNode;
  /** Names the consequence. */
  text: ReactNode;
  /** Repeats the object: "Remove student". */
  confirmLabel: string;
  cancelLabel?: string;
  /** danger for destructive actions (the default), primary or accent otherwise. */
  tone?: Extract<ButtonVariant, "danger" | "primary" | "accent">;
  icon?: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Required before every destructive action. Cancel is focused on open; Esc and the
 *  overlay cancel; focus stays inside the dialog and returns to the trigger on close. */
export function ConfirmModal({
  open,
  title,
  text,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const textId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
      if (e.key !== "Tab" || !dialog.current) return;
      const focusable = dialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-80 grid place-items-center bg-[rgba(15,23,42,0.55)] p-5"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !loading && onCancel()
      }
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="animate-pop bg-surface-raised w-full max-w-[440px] rounded-lg p-6 shadow-lg"
      >
        <div
          className={cn(
            "mb-4 grid size-12 place-items-center rounded-full [&_svg]:size-6",
            tone === "danger"
              ? "bg-danger-soft text-danger-ink"
              : "bg-brand-soft text-brand-ink",
          )}
        >
          {icon ?? <TriangleAlert />}
        </div>
        <h2
          id={titleId}
          className="font-display m-0 mb-1.5 text-[19px] leading-[26px] font-semibold"
        >
          {title}
        </h2>
        <div id={textId} className="text-ink-muted m-0 text-sm leading-[22px]">
          {text}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <Button
            ref={cancel}
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
