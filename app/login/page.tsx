"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useToastStore } from "@/lib/toast-store";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/shankhLogo.svg"
import dashImage from "@/public/image.png"

function LoginForm() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const showToast = useToastStore((state) => state.showToast);
  const searchParams = useSearchParams();
  const hasShownRedirectToast = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show toast when user was redirected from a protected page
  useEffect(() => {
    if (mounted && searchParams.get("redirect") === "true" && !hasShownRedirectToast.current) {
      hasShownRedirectToast.current = true;
      showToast("Please login to continue your journey with us ✨", "info");
    }
  }, [mounted, searchParams, showToast]);

  if (!mounted) return <div className="min-h-screen bg-white" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="w-full max-w-[500px] mx-auto min-h-full flex flex-col p-8 md:p-12">
          <div className="my-auto py-12">
            <div className="flex items-center gap-2 mb-6 md:mb-10">
              <Image src={logo} alt="Shankh Logo" width={120} height={40} className="object-contain" />
            </div>

            <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Log In</h1>
            <p className="text-zinc-500 mb-6">Start learning with Shankh</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1a1a1a]">Enter Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1a1a1a]">Enter Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                  placeholder="************"
                />
              </div>

              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Or</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-medium text-[#1a1a1a]">Continue with Google</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-3 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <svg viewBox="0 0 384 512" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-22.2-84.6-21.9-42.9.3-81.2 24.7-103.3 63.9-43.5 77.2-11.1 190.2 30.1 249.4 20.3 29.1 44.5 61.4 75.1 60.3 29.2-1.1 40.2-18.8 75.3-18.8 35 0 45.1 18.8 75.9 18.2 31.4-.6 52.6-29.2 72.8-58.4 23.3-33.8 32.8-66.6 33.1-68.2-.7-.3-64.2-24.7-64.4-97.1zM232.2 110.1c15.7-19.1 26.2-45.7 23.3-72.3-22.9 1-50.6 15.3-67 34.4-14.7 17-27.6 44.2-24.1 70.3 25.4 2 52.1-13.3 67.8-32.4z" />
                  </svg>
                  <span className="text-sm font-medium text-[#1a1a1a]">Continue with Apple</span>
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-zinc-600 text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-semibold text-[#1a1a1a] hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#01696F] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#01696F]/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Promotion */}
      <div className="hidden lg:flex flex-1 bg-[#01696F] relative flex-col justify-center pt-24 pl-16 xl:pl-24 overflow-hidden">
        <div className="relative z-10 max-w-[600px] pr-12">
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">Build recruiter-grade judgment, not just notes.</h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-[500px]">Simulated learning across finance, strategy, and operations for consulting, private equity, and investment banking readiness.</p>
        </div>
        <div className="relative flex-1 w-full">
          <div className="absolute bottom-0 right-0 w-[130%] h-[90%]">
            <Image src={dashImage} alt="Dashboard Preview" fill className="object-contain object-right-bottom rounded-tl-[40px] shadow-2xl" priority />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}
