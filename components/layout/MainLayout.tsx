"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
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
    <div className="flex h-screen overflow-hidden font-sans bg-[var(--sidebar-bg)]">
      {showSidebar && (sidebar || <Sidebar />)}

      {/* Content wrapper with consistent padding and radii */}
      <div className={cn("flex-1 flex overflow-hidden", showSidebar ? "p-3 pr-0" : "p-0")}>
        <main 
          className={cn(
            "flex-1 overflow-y-auto bg-[var(--background)]",
            showSidebar ? "rounded-3xl border border-black/5" : "rounded-none"
          )}
        >
          {children}
        </main>
        
        {rightSidebar && (
          <div className="h-full">
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  );
};

