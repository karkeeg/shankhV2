"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  BookOpen,
  Target,
  BarChart2,
  Tag,
  Bookmark,
  TrendingUp,
  Search,
  PieChart,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";

import logo from "@/public/ShankhFull.png";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
    router.push("/login");
  };

  const LogOutIcon = LogOut as LucideIcon;

  type SidebarItem = {
    name: string;
    href: string;
    icon?: LucideIcon;
  };

  type SidebarGroup = {
    label?: string;
    icon?: LucideIcon;
    items: SidebarItem[];
  };

  const menuGroups: SidebarGroup[] = [
    {
      items: [
        { name: "Dashboard", icon: LayoutGrid, href: "/" },
        ...(user?.role === "admin"
          ? [{ name: "Admin Panel", icon: Settings, href: "/admin" }]
          : []),
      ],
    },
    {
      label: "Learning",
      icon: BookOpen,
      items: [
        { name: "Finance", href: "/learning/finance" },
        { name: "Strategy", href: "/learning/strategy" },
        { name: "Operations", href: "/learning/operations" },
      ],
    },
    {
      label: "Skill building",
      icon: Target,
      items: [
        { name: "Case Simulations", href: "/skill-building/case-simulations" },
        { name: "Framework Drills", href: "/skill-building/framework-drills" },
        { name: "Quant Lab", href: "/skill-building/quant-lab" },
        { name: "MCQs", href: "/skill-building/mcqs" },
      ],
    },
    {
      label: "Performance",
      icon: BarChart2,
      items: [
        { name: "Review Center", href: "/performance/review-center" },
        { name: "Analytics", href: "/performance/analytics" },
        { name: "Bookmarks", href: "/performance/bookmarks" },
      ],
    },
    {
      items: [{ name: "Pricing", icon: Tag, href: "/pricing" }],
    },
  ];

  return (
    <aside className="w-64 flex flex-col h-screen shrink-0 sticky top-0 z-50 bg-[var(--sidebar-bg)]">
      {/* Brand Header */}
      <div className="py-8 flex items-center justify-center">
        <Image src={logo} alt="Shankh Logo" width={140} height={140} />
      </div>
      {/* Nav Content */}
      <div className="flex-1 px-3 space-y-4 overflow-y-auto pb-6 mb-4">
        {menuGroups.map((group, groupIdx) => {
          const isGrouped = !!group.label;
          return (
            <React.Fragment key={groupIdx}>
              <div
                className={cn(
                  "space-y-1",
                  isGrouped && "bg-[#F0EDE7] shadow-[inset_0px_4px_4px_0px_#00000014] rounded-3xl p-3 mb-2"
                )}
              >
                {group.label && (
                  <div className="flex items-center gap-2 px-2 py-1 mb-2">
                    {group.icon ? (
                      <group.icon size={16} className="text-[#01696F]/50" />
                    ) : null}
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                      {group.label}
                    </span>
                  </div>
                )}
                <div className={cn("space-y-1", !isGrouped && "px-1")}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-4 transition-all group",
                          isGrouped ? "py-2 rounded-2xl" : "py-3 rounded-xl text-sm font-medium",
                          isActive && isGrouped
                            ? "bg-white text-[#01696F] font-bold text-[15px] shadow-sm"
                            : isActive && !isGrouped
                              ? "bg-[var(--sidebar-card)] text-[var(--sidebar-active-text)]"
                              : isGrouped
                                ? "text-zinc-600 font-medium text-sm hover:text-[#1a1a1a] hover:bg-black/5"
                                : "text-zinc-600 hover:text-[#1a1a1a] hover:bg-zinc-50"
                        )}
                      >
                        {item.icon && (
                          <item.icon
                            size={18}
                            className={isActive ? "text-[var(--sidebar-active-text)]" : "text-zinc-400 group-hover:text-zinc-600"}
                          />
                        )}
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {groupIdx < menuGroups.length - 1 && (
                <div className="pt-2 px-2">
                  <div className="h-[2px] bg-zinc-500" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Profile Footer */}
      <div className="p-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#DFEAEA] shadow-[inset_0px_4px_4px_0px_#00000014]">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0">
            {/* Placeholder for avatar */}
            <div className="w-full h-full flex items-center justify-center text-[#01696F] font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] truncate">{user?.name || ""}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Free Plan</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
          >
            <LogOutIcon size={14} color="red" cursor="pointer" className="hover:scale-110" />
          </button>
        </div>
      </div>
    </aside>
  );
};

