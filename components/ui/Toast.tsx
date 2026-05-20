"use client";

import React, { useEffect, useState } from "react";
import { useToastStore, Toast as ToastType } from "@/lib/toast-store";
import { X, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap = {
  info: {
    bg: "rgba(1, 105, 111, 0.12)",
    border: "rgba(1, 105, 111, 0.3)",
    icon: "#01696F",
    progress: "#01696F",
    text: "#014f54",
  },
  success: {
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
    icon: "#10b981",
    progress: "#10b981",
    text: "#065f46",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    icon: "#f59e0b",
    progress: "#f59e0b",
    text: "#92400e",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.3)",
    icon: "#ef4444",
    progress: "#ef4444",
    text: "#991b1b",
  },
};

function ToastItem({ toast }: { toast: ToastType }) {
  const dismiss = useToastStore((s) => s.dismissToast);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Trigger exit animation before auto-dismiss
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 400);

    return () => clearTimeout(exitTimer);
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => dismiss(toast.id), 350);
  };

  return (
    <div
      style={{
        transform: isVisible && !isExiting
          ? "translateX(0) scale(1)"
          : "translateX(100%) scale(0.95)",
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "0",
        minWidth: "360px",
        maxWidth: "420px",
        boxShadow: `
          0 20px 60px -15px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.5) inset,
          0 1px 2px rgba(0, 0, 0, 0.05)
        `,
        overflow: "hidden",
        pointerEvents: "auto" as const,
      }}
    >
      {/* Accent bar at top */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${colors.icon}, ${colors.icon}88)`,
          borderRadius: "16px 16px 0 0",
        }}
      />

      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Icon */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={colors.icon} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text,
              textTransform: "capitalize",
              margin: "0 0 2px 0",
              letterSpacing: "0.01em",
            }}
          >
            {toast.type}
          </p>
          <p
            style={{
              fontSize: "13.5px",
              lineHeight: "1.5",
              color: "#4a5568",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {toast.message}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a0aec0",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.05)";
            e.currentTarget.style.color = "#4a5568";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#a0aec0";
          }}
          aria-label="Dismiss toast"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "rgba(0,0,0,0.04)" }}>
        <div
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${colors.progress}, ${colors.progress}66)`,
            borderRadius: "0 0 0 16px",
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
}
