"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackLink {
  label: string;
  href: string;
}

interface AdminPageHeaderProps {
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional breadcrumb back-link rendered above the header. */
  back?: BackLink;
  /** Right-aligned actions (buttons). */
  actions?: React.ReactNode;
}

/**
 * Standard admin page header: optional back-link, eyebrow, title, subtitle, and an
 * actions slot. Replaces the bespoke header block rebuilt on every admin page.
 */
export function AdminPageHeader({ eyebrow, title, subtitle, back, actions }: AdminPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 shrink-0">
      {back && (
        <button
          onClick={() => router.push(back.href)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#01696F]/70 hover:text-[#01696F] w-fit group transition-colors"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          {back.label}
        </button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#01696F]/10 pb-5">
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">{eyebrow}</span>
          )}
          <h1 className="text-2xl font-black text-[#01696F] tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
