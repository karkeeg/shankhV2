"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: '#0F1F2C' }}>
      {showSidebar && <Sidebar />}

      {/* Dark background wrapper with padding */}
      <div className={cn("flex-1 overflow-hidden", showSidebar ? "p-3" : "p-0")}>
        {/* White floating card */}
        <main 
          className={cn(
            "h-full overflow-y-auto bg-white shadow-2xl",
            showSidebar ? "rounded-2xl" : "rounded-none"
          )}
          style={{ boxShadow: '0px 4px 4px 0px #0000003D inset' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
