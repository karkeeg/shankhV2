"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  BookOpen,
  Target,
  BarChart2,
  Tag,
  LogOut,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";

import logo from "@/public/ShankhFull.png";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function useLearningModules() {
  const [modules, setModules] = useState<{ name: string; slug: string }[]>([]);
  useEffect(() => {
    fetch(`${API}/api/v1/content/modules`)
      .then((r) => r.json())
      .then((res) => {
        const list = res.data ?? [];
        setModules(list.map((m: any) => ({ name: m.name, slug: m.slug })));
      })
      .catch(() => {});
  }, []);
  return modules;
}

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

const SidebarNavContent = ({
  user,
  pathname,
  learningModules,
}: {
  user: any;
  pathname: string;
  learningModules: { name: string; slug: string }[];
}) => {
  const searchParams = useSearchParams();

  const moduleItems: SidebarItem[] =
    learningModules.length > 0
      ? learningModules.map((m) => ({ name: m.name, href: `/learning/${m.slug}` }))
      : [
          { name: "Finance", href: "/learning/finance" },
          { name: "Strategy", href: "/learning/strategy" },
          { name: "Operations", href: "/learning/operations" },
        ];

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
      items: moduleItems,
    },
    {
      label: "Skill building",
      icon: Target,
      items: [
        { name: "Case Simulations", href: "/skill?section=case_simulations" },
        { name: "Framework Drills", href: "/skill?section=framework_drills" },
        { name: "Quant Lab", href: "/skill?section=quant_lab" },
        { name: "MCQs", href: "/skill?section=mcqs" },
      ],
    },
    {
      label: "Performance",
      icon: BarChart2,
      items: [
        { name: "Review Center", href: "/performance/review-center" },
        { name: "Bookmarks", href: "/performance/bookmarks" },
      ],
    },
    {
      items: [{ name: "Pricing", icon: Tag, href: "/pricing" }],
    },
  ];

  return (
    <div className="flex-1 px-3 space-y-4 overflow-y-auto pb-6 mb-4">
      {menuGroups.map((group, groupIdx) => {
        const isGrouped = !!group.label;
        return (
          <React.Fragment key={groupIdx}>
            <div
              className={cn(
                "space-y-1",
                isGrouped &&
                "bg-[#F0EDE7] shadow-[inset_0px_4px_4px_0px_#00000014] rounded-3xl p-3 mb-2"
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
                  const isSkillItem = item.href.startsWith("/skill");
                  const isProfessionPage = pathname.startsWith("/skill/") && !pathname.startsWith("/skill/tests/");
                  let isActive = false;

                  let computedHref = item.href;
                  if (isSkillItem) {
                    const targetSection = item.href.split("=")[1];
                    if (isProfessionPage) {
                      computedHref = `${pathname}?section=${targetSection}`;
                    }

                    if (pathname === "/skill") {
                      const activeSection = searchParams.get("section") || "case_simulations";
                      isActive = activeSection === targetSection;
                    } else if (pathname.startsWith("/skill/tests/")) {
                      const parts = pathname.split("/");
                      const activityType = parts[4]; // /skill/tests/[testId]/[activityType]
                      if (activityType === "mcq" && targetSection === "mcqs") {
                        isActive = true;
                      } else if (activityType === "canvas" && targetSection === "framework_drills") {
                        isActive = true;
                      } else if (activityType === "quantus" && targetSection === "quant_lab") {
                        isActive = true;
                      }
                    } else if (pathname.startsWith("/skill/")) {
                      if (isProfessionPage) {
                        const activeSection = searchParams.get("section") || "case_simulations";
                        isActive = activeSection === targetSection;
                      } else {
                        if (targetSection === "case_simulations") {
                          isActive = true;
                        }
                      }
                    }
                  } else {
                    isActive = pathname === item.href;
                  }

                  return (
                    <Link
                      key={item.name}
                      href={computedHref}
                      className={cn(
                        "flex items-center gap-2 px-4 transition-all group",
                        isGrouped
                          ? "py-2 rounded-2xl"
                          : "py-3 rounded-xl text-sm font-medium",
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
                          className={
                            isActive
                              ? "text-[var(--sidebar-active-text)]"
                              : "text-zinc-400 group-hover:text-zinc-600"
                          }
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
  );
};

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const learningModules = useLearningModules();

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
    router.push("/login");
  };

  const LogOutIcon = LogOut as LucideIcon;

  return (
    <aside className="w-64 flex flex-col h-screen shrink-0 sticky top-0 z-50 bg-[var(--sidebar-bg)]">
      {/* Brand Header */}
      <div className="py-8 flex items-center justify-center">
        <Image src={logo} alt="Shankh Logo" width={140} height={140} />
      </div>

      {/* Nav Content */}
      <Suspense fallback={<div className="flex-1 px-3 space-y-4" />}>
        <SidebarNavContent user={user} pathname={pathname} learningModules={learningModules} />
      </Suspense>

      {/* Profile Footer */}
      <div className="p-4 border-t border-zinc-100">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-2xl bg-[#DFEAEA] shadow-[inset_0px_4px_4px_0px_#00000014] hover:bg-[#cee0e0] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center text-[#01696F] font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] truncate">
              {user?.name || ""}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              {user ? ((user as any).planType === 'pro' ? 'Pro Plan' : (user as any).planType === 'enterprise' ? 'Enterprise' : 'Free Plan') : 'Free Plan'}
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); handleLogout(); }}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
          >
            <LogOutIcon
              size={14}
              color="red"
              cursor="pointer"
              className="hover:scale-110"
            />
          </button>
        </Link>
      </div>
    </aside>
  );
};