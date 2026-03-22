"use client";

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export function toneClass(tone: "info" | "success" | "error") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function statusClass(status: string) {
  if (status === "success") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "error") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "syncing") {
    return "bg-sky-100 text-sky-700";
  }

  if (status === "reset") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "unsynced") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export function StatusPill({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        statusClass(status),
      )}
    >
      {label}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
      <p className="font-bold text-zinc-700">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmTone = "danger",
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/40 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "min-h-12 flex-1 rounded-2xl px-4 text-sm font-bold text-white",
              confirmTone === "danger" ? "bg-rose-600" : "bg-zinc-900",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoadingShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_55%)] p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-28 animate-pulse rounded-[28px] bg-white/80" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 animate-pulse rounded-[28px] bg-white/80" />
          <div className="h-28 animate-pulse rounded-[28px] bg-white/80" />
        </div>
        <div className="h-[60vh] animate-pulse rounded-[32px] bg-white/80" />
      </div>
    </div>
  );
}
