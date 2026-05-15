import React from "react";
import Image from "next/image";
import Link from "next/link";

interface SidebarBrandProps {
  href?: string;
  className?: string;
}

export const SidebarBrand = ({ href = "/", className }: SidebarBrandProps) => {
  return (
    <Link href={href} className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
        <Image src="/logo.svg" alt="Shankh Logo" width={40} height={40} className="w-full h-full object-contain" />
      </div>
      <span className="text-xl font-black tracking-tight leading-none text-[var(--sidebar-text)]">
        Shankh
      </span>
    </Link>
  );
};
