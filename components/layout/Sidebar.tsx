"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  TrendingUp,
  LayoutGrid,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const StudyPlanIcon = ({ className, style, size }: { className?: string; style?: React.CSSProperties; size?: number }) => (
  <svg width={size || 18} height={size || 18} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path fillRule="evenodd" clipRule="evenodd" d="M9.1123 3.04133C9.84332 2.91864 10.532 3.08435 11.2666 3.39972C11.9858 3.70848 12.8348 4.19932 13.8906 4.8089L15.7637 5.89094H12.7637C11.8728 5.37811 11.2192 5.01139 10.6748 4.77765C10.0722 4.51897 9.69322 4.46424 9.36133 4.51984C9.21993 4.54357 9.08061 4.58102 8.94629 4.63117C8.631 4.74892 8.3301 4.98569 7.9375 5.51105C7.85078 5.62713 7.76256 5.75348 7.6709 5.89094H7C6.59038 5.89095 6.19267 5.94187 5.81348 6.03937C6.14515 5.48072 6.44385 5.00377 6.73535 4.61359C7.21386 3.97318 7.72749 3.48516 8.42188 3.2259C8.64557 3.14239 8.87684 3.08088 9.1123 3.04133Z" fill="currentColor" />
    <path d="M17 5.89087C19.5395 5.89087 21.6142 7.88371 21.7441 10.3909H21.75V16.8909H21.7441C21.6142 19.398 19.5395 21.3909 17 21.3909H7C4.37665 21.3909 2.25 19.2642 2.25 16.6409V10.6409C2.25 8.01752 4.37665 5.89087 7 5.89087H17ZM7 7.39087C5.20507 7.39087 3.75 8.84594 3.75 10.6409V16.6409C3.75 18.4358 5.20507 19.8909 7 19.8909H17C18.7108 19.8909 20.1116 18.5689 20.2393 16.8909H16.5205C14.7256 16.8909 13.2705 15.4358 13.2705 13.6409C13.2705 11.8459 14.7256 10.3909 16.5205 10.3909H20.2393C20.1116 8.7128 18.7108 7.39087 17 7.39087H7ZM16.5205 11.8909C15.554 11.8909 14.7705 12.6744 14.7705 13.6409C14.7705 14.6074 15.554 15.3909 16.5205 15.3909H20.25V11.8909H16.5205Z" fill="currentColor" />
    <circle cx="16.502" cy="13.6407" r="0.75" fill="currentColor" />
  </svg>
);

export const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", icon: LayoutGrid, href: "/" },
    { name: "Learning", icon: Calendar, href: "/learning" },
    { name: "Study Plan", icon: StudyPlanIcon, href: "/study-plan" },
    { name: "Contact", icon: Calendar, href: "/contact" },
  ];

  return (
    <aside className="w-64 flex flex-col h-screen shrink-0 sticky top-0 z-50"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-center gap-3 cursor-pointer">

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
          >
            <img src="/logo.svg" alt="Shankh Logo" className="w-full h-full object-contain" />
          </div>
          <span
            className="text-lg font-bold tracking-tight leading-none"
            style={{ color: "var(--sidebar-text)" }}
          >
            Shankh
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px" style={{ backgroundColor: "var(--sidebar-divider)" }} />

      {/* Section Label */}
      <div className="px-8 pt-5 pb-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--sidebar-label)" }}
        >
          Main
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 text-sm relative group",
              )}
              style={{
                backgroundColor: isActive ? "var(--sidebar-card)" : "transparent",
                color: isActive ? "var(--sidebar-text)" : "var(--sidebar-muted)",
              }}
            >
              <item.icon
                size={18}
                className="transition-colors"
                style={{
                  color: isActive ? "var(--sidebar-text)" : "var(--sidebar-muted)",
                }}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-6 h-px" style={{ backgroundColor: "var(--sidebar-divider)" }} />

      {/* Profile Card */}
      <div className="p-4 mt-auto">
        <div
          className="p-5 rounded-[22px] flex flex-col items-center gap-4"
          style={{ backgroundColor: "var(--sidebar-card)" }}
        >
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: "var(--sidebar-text)",
            }}
          >
            <User size={24} style={{ color: "var(--sidebar-card)" }} />
          </div>

          {/* Name & Plan */}
          <div className="text-center space-y-0.5">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--sidebar-text)" }}
            >
              Bibek karki
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--sidebar-text)", opacity: 0.7 }}
            >
              Free Plan
            </p>
          </div>

          {/* CTA Button */}
          <button
            className="w-full py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--sidebar-text)",
              color: "var(--sidebar-card)",
              boxShadow: "0 4px 24px var(--sidebar-glow)",
            }}
          >
            Your Profile
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
