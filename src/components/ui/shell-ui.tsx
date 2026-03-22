"use client";

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

export function toneClass(tone: "info" | "success" | "error") {
  if (tone === "success") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "error") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

export function statusClass(status: string) {
  if (status === "success") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (status === "error") {
    return "bg-rose-500/20 text-rose-200";
  }

  if (status === "syncing") {
    return "bg-sky-500/20 text-sky-200";
  }

  if (status === "reset") {
    return "bg-amber-500/20 text-amber-100";
  }

  if (status === "unsynced") {
    return "bg-orange-500/20 text-orange-100";
  }

  return "bg-zinc-800 text-zinc-200";
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
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">{value}</p>
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
    <section className="rounded-[28px] border border-white/10 bg-[rgba(18,18,24,0.92)] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-zinc-50">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-400">{subtitle}</p> : null}
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
    <div className="rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-6 text-center">
      <p className="font-bold text-zinc-200">{title}</p>
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-500/12 p-3 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-50">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "min-h-12 flex-1 rounded-2xl px-4 text-sm font-bold text-white",
              confirmTone === "danger" ? "bg-rose-600" : "bg-zinc-100 text-zinc-950",
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.14),_transparent_30%),linear-gradient(180deg,_#14141d_0%,_#08080c_70%)] p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-28 animate-pulse rounded-[28px] bg-white/8" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 animate-pulse rounded-[28px] bg-white/8" />
          <div className="h-28 animate-pulse rounded-[28px] bg-white/8" />
        </div>
        <div className="h-[60vh] animate-pulse rounded-[32px] bg-white/8" />
      </div>
    </div>
  );
}
