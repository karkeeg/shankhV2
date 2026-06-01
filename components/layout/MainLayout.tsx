"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { AuthGuard } from "./AuthGuard";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({
  children,
  sidebar,
  rightSidebar,
  showSidebar = true
}: MainLayoutProps) => {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden font-sans bg-[var(--sidebar-bg)]">
        {showSidebar && (sidebar || <Sidebar />)}

        {/* Content wrapper with consistent padding and radii */}
        <div className={cn("flex-1 flex overflow-y-auto gap-3", showSidebar ? "p-3" : "p-0")}>
          <main
            className={cn(
              "flex-1 overflow-y-auto bg-[#F0EDE7]",
              showSidebar ? "rounded-2xl shadow-[inset_0px_4px_4px_0px_#00000014]" : "rounded-none"
            )}
          >
            {children}
          </main>

          {rightSidebar && (
            <div
              className={cn(
                "h-full bg-[#F0EDE7] shrink-0 overflow-hidden",
                showSidebar ? "rounded-2xl shadow-[inset_0px_4px_4px_0px_#00000014]" : "rounded-none"
              )}
            >
              {rightSidebar}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

