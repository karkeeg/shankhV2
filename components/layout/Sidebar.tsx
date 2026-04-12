"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "DASHBOARD", icon: Home, href: "/" },
    { name: "STUDY PLAN", icon: Calendar, href: "/study-plan" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen shrink-0 sticky top-0 z-50">
      {/* Sidebar Logo */}
      <div className="p-6 pb-8 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={22} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            ShankhV2
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.name === "LEARN" && pathname.startsWith("/finance")) ||
            (item.name === "STUDY PLAN" && pathname.startsWith("/study-plan"));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm",
                isActive
                  ? "bg-zinc-100 text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50",
              )}
            >
              <item.icon size={18} className="transition-colors" />
              <span className="tracking-wide uppercase text-[12px] font-bold">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer AI Assistant */}
    </aside>
  );
};
