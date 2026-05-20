"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useToastStore } from "@/lib/toast-store";
import Cookies from "js-cookie";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

const loadingMessages = [
  "Verifying your credentials...",
  "Checking your session...",
  "Hang tight, validating your details...",
  "Almost there, confirming access...",
];

// Module-level cache to skip backend pings on SPA navigations
let hasVerifiedThisSession = false;

const VERIFY_TIMEOUT_MS = 6000;

/** Hard navigation to login — triggers middleware on the server, avoids client-router loops */
function redirectToLogin(showToastFn: (msg: string, type: "info") => void) {
  showToastFn("Please login to continue your journey with us ✨", "info");
  // Small delay so toast renders before page unloads
  setTimeout(() => {
    window.location.replace("/login?clear_auth=true");
  }, 200);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);

  // Synchronously determine if we can bypass the loading screen
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (typeof window === "undefined") return "checking";
    const cookieToken = Cookies.get("shankh-token");
    // If verified this session or we have both local state and cookie, immediately trust
    if ((hasVerifiedThisSession || (user && token)) && cookieToken) {
      return "authenticated";
    }
    return "checking";
  });

  const [messageIdx, setMessageIdx] = useState(0);

  // Cycle loading messages
  useEffect(() => {
    if (status !== "checking") return;
    const interval = setInterval(() => {
      setMessageIdx((i) => (i + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const cookieToken = Cookies.get("shankh-token");
    const activeToken = token || cookieToken;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    const url = `${backendUrl}/api/v1/auth/me`;

    // 1. Skip backend check if already verified in this browser session
    if (hasVerifiedThisSession && user && activeToken) {
      setStatus("authenticated");
      return;
    }


    // No token anywhere → schedule redirect (with cleanup so Zustand hydration can cancel it)
    if (!activeToken) {
      const redirectTimeoutId = setTimeout(() => {
        redirectToLogin(showToast);
      }, 600);
      return () => {
        clearTimeout(redirectTimeoutId);
      };
    }

    const controller = new AbortController();
    let didTimeout = false;

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      console.warn(`[AuthGuard] ⏱ Timeout after ${VERIFY_TIMEOUT_MS}ms`);
      controller.abort();
    }, VERIFY_TIMEOUT_MS);

    const verifyAuth = async () => {
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          hasVerifiedThisSession = true;
          setStatus("authenticated");
        } else {
          const errData = await res.json().catch(() => ({}));
          clearLocalAuth();
          redirectToLogin(showToast);
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (controller.signal.aborted) {
          if (didTimeout) {
            hasVerifiedThisSession = true;
            setStatus("authenticated");
          }
        } else if (err instanceof TypeError) {
          hasVerifiedThisSession = true;
          setStatus("authenticated");
        } else {
          console.error("[AuthGuard] ❌ Unexpected error:", err);
          clearLocalAuth();
          redirectToLogin(showToast);
        }
      }
    };

    verifyAuth();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, user, showToast]);

  if (status === "authenticated") return <>{children}</>;

  return (
    <AuthLoadingScreen
      message={loadingMessages[messageIdx]}
    />
  );
}

function clearLocalAuth() {
  hasVerifiedThisSession = false;
  Cookies.remove("shankh-token", { path: "/" });
  Cookies.remove("shankh-token"); // fallback
  try {
    localStorage.removeItem("shankh-auth-storage");
  } catch {
    /* SSR — ignore */
  }
}

function AuthLoadingScreen({ message }: { message: string }) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((d) => (d + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(145deg, #F0EDE7 0%, #E8E4DC 50%, #F4F1EB 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        zIndex: 50000,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(1,105,111,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "15%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(1,105,111,0.04) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      {/* Spinner */}
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid rgba(1,105,111,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#01696F",
            borderRightColor: "rgba(1,105,111,0.4)",
            animation: "auth-spin 1s cubic-bezier(0.4,0,0.2,1) infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: "#01696F",
            animation: "auth-pulse 2s ease-in-out infinite",
            boxShadow: "0 0 20px rgba(1,105,111,0.35)",
          }}
        />
      </div>

      {/* Brand + message */}
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#1a1a1a",
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
          }}
        >
          Shankh
        </h2>
        <p
          key={message}
          style={{
            fontSize: "14px",
            color: "#71717a",
            margin: 0,
            fontWeight: 400,
            animation: "auth-fade-text 0.4s ease-out",
            minHeight: "21px",
          }}
        >
          {message}
        </p>
      </div>

      {/* Dot progress */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: i < dotCount ? "#01696F" : "rgba(1,105,111,0.15)",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes auth-pulse {
          0%,100% { opacity:1; transform:translate(-50%,-50%) scale(1); }
          50% { opacity:0.45; transform:translate(-50%,-50%) scale(0.65); }
        }
        @keyframes auth-fade-text {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
