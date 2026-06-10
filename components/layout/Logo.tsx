import React from "react";
import Image from "next/image";

import mark from "@/public/shankhLogoFull.svg";
import full from "@/public/shankhLogo.svg";

type LogoVariant = "full" | "mark";

interface LogoProps {
  /** "full" → horizontal wordmark (in-app); "mark" → compact glyph (auth pages). */
  variant?: LogoVariant;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  alt?: string;
}

const DEFAULTS: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 140, height: 140 },
  mark: { width: 120, height: 40 },
};

/** Single source of truth for the Shankh logo across the app. */
export const Logo = ({
  variant = "full",
  width,
  height,
  className,
  style,
  priority,
  alt = "Shankh",
}: LogoProps) => {
  const d = DEFAULTS[variant];
  return (
    <Image
      src={variant === "mark" ? mark : full}
      alt={alt}
      width={width ?? d.width}
      height={height ?? d.height}
      className={className}
      style={style}
      priority={priority}
    />
  );
};

export default Logo;
