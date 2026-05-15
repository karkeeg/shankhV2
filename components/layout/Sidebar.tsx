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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";

import logo from "@/public/logo.svg";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const menuGroups = [
    {
      items: [{ name: "Dashboard", icon: LayoutGrid, href: "/" }],
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
      <div className="px-6 py-8 flex items-center gap-2">
        <Image src={logo} alt="Shankh Logo" width={28} height={28} />
        <span className="text-xl font-bold text-[#1a1a1a]">Shankh</span>
      </div>

      {/* Nav Content */}
      <div className="flex-1 px-3 space-y-4 overflow-y-auto">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {group.label && (
              <div className="flex items-center gap-3 px-4 py-2 mb-1">
                <group.icon size={18} className="text-zinc-400" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-tight">
                  {group.label}
                </span>
              </div>
            )}
            <div className={cn("space-y-0.5", group.label && "pl-4 ml-4 border-l border-zinc-100")}>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all group",
                      isActive
                        ? "bg-[var(--sidebar-card)] text-[var(--sidebar-active-text)]"
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
        ))}
      </div>

      {/* Profile Footer */}
      <div className="p-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-50">
          <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0">
            {/* Placeholder for avatar */}
            <div className="w-full h-full flex items-center justify-center bg-zinc-300 text-zinc-500 font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{user?.name || "Andrew Smith"}</p>
            <p className="text-[10px] text-zinc-500 font-medium">Free Plan</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

