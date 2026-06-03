"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { Zap, Shield, Loader2 } from "lucide-react";

type BillingCycle = "monthly" | "annually";

const plans = [
  {
    id: "basic",
    topLabel: "For one person",
    name: "BASIC PLAN",
    price: {
      monthly: "₹299/Month",
      annually: "₹239/Month",
    },
    subtext: {
      monthly: null,
      annually: "Billed annually (₹2,868/year)",
    },
    features: [
      "Easy drag & drop editor",
      "Large library of professionally designed templates.",
      "1000+ design types",
      "Large library of stock photos & graphics",
      "10 GB of cloud storage",
    ],
    isDarkHeader: false,
    isActive: true,
  },
  {
    id: "team",
    topLabel: "For your team",
    name: "TEAM PLAN",
    price: {
      monthly: "₹699/Month",
      annually: "₹559/Month",
    },
    subtext: {
      monthly: null,
      annually: "Billed annually (₹6,708/year)",
    },
    features: [
      "Easy drag & drop editor",
      "Large library of professionally designed templates.",
      "1000+ design types",
      "Large library of stock photos & graphics",
      "10 GB of cloud storage",
    ],
    isDarkHeader: false,
    isActive: false,
  },
  {
    id: "enterprise",
    topLabel: "For your organization",
    name: "ENTERPRISE PLAN",
    price: {
      monthly: "LET'S TALK",
      annually: "LET'S TALK",
    },
    subtext: {
      monthly: "Get in touch to customize your plan.",
      annually: "Get in touch to customize your plan.",
    },
    features: [
      "Easy drag & drop editor",
      "Large library of professionally designed templates.",
      "1000+ design types",
      "Large library of stock photos & graphics",
      "10 TB of cloud storage",
    ],
    isDarkHeader: true,
    isActive: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, planId: string) => {
    setLoadingPlan(planId);
    if (planId === "enterprise") {
      window.location.href = "mailto:sales@shankh.com?subject=Enterprise Plan Inquiry";
      setLoadingPlan(null);
      return;
    }
    // Simulate API request delay
    await new Promise((r) => setTimeout(r, 1200));
    setLoadingPlan(null);
    router.push(`/checkout?plan=${planId}&billing=${billingCycle}`);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-6 gap-8 animate-fade-in">
        
        {/* Header Block */}
        <header className="flex flex-col gap-1 border-b border-[#01696F]/10 pb-5 shrink-0">
          <span className="text-[14px] font-black uppercase tracking-widest text-[#01696F]/60">
            Plans & Billing
          </span>
          <h1 className="text-3xl font-extrabold text-[#01696F] tracking-tight">
            Choose your plan
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Unlock the full power of Shankh. Upgrade or downgrade anytime.
          </p>
        </header>

        {/* --- Interactive Monthly/Annually Toggle Switch --- */}
        <div className="flex justify-center items-center gap-3 my-2">
          <span className={cn(
            "text-sm font-semibold transition-colors",
            billingCycle === "monthly" ? "text-zinc-900" : "text-zinc-400"
          )}>
            Monthly
          </span>
          
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly")}
            className="w-14 h-8 bg-[#e7f1f2] border border-[#01696F]/20 rounded-full p-1 transition-colors duration-300 relative focus:outline-none"
            aria-label="Toggle billing cycle"
          >
            <div
              className={cn(
                "w-6 h-6 bg-[#01696F] rounded-full transition-transform duration-300 shadow-sm",
                billingCycle === "annually" ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-sm font-semibold transition-colors",
              billingCycle === "annually" ? "text-zinc-900" : "text-zinc-400"
            )}>
              Annually
            </span>
            <span className="bg-[#01696F]/10 text-[#01696F] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 20%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-6xl mx-auto w-full">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-[24px] border border-zinc-200 bg-white shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg",
                  plan.isActive ? "ring-2 ring-[#01696F] pb-14" : "pb-0"
                )}
              >
                {/* 1. Category Top Label Block */}
                <div className="w-full bg-white py-3.5 text-center border-b border-zinc-100">
                  <span className="text-sm font-bold text-zinc-800 tracking-wide">
                    {plan.topLabel}
                  </span>
                </div>

                {/* 2. Highlighted Header Section */}
                <div
                  className={cn(
                    "flex flex-col items-center justify-center p-8 text-center min-h-[220px] transition-colors duration-300",
                    plan.isDarkHeader 
                      ? "bg-[#01696F] text-white" 
                      : "bg-[#e7f1f2] text-[#01696F]"
                  )}
                >
                  {/* Styled Badge Lightning Bolt Icon */}
                  <div className="relative mb-3 flex items-center justify-center">
                    <span className={cn("absolute -top-1.5 -left-4 text-[10px] font-bold", plan.isDarkHeader ? "text-white/80" : "text-[#01696F]/80")}>✦</span>
                    <span className={cn("absolute -top-2.5 right-1 text-[11px] font-bold", plan.isDarkHeader ? "text-white/80" : "text-[#01696F]/80")}>✦</span>
                    <span className={cn("absolute bottom-2 -right-3 text-[9px] font-bold", plan.isDarkHeader ? "text-white/80" : "text-[#01696F]/80")}>✦</span>
                    
                    <Zap className={cn("h-11 w-11 stroke-[1.5]", plan.isDarkHeader ? "text-white fill-none" : "text-[#01696F] fill-none")} />
                  </div>

                  <h3 className="text-base font-extrabold tracking-wider mb-2">
                    {plan.name}
                  </h3>

                  <div className="flex flex-col items-center justify-center min-h-[64px]">
                    <span className="text-3xl font-black tracking-tight animate-fade-in">
                      {plan.price[billingCycle]}
                    </span>
                    {plan.subtext[billingCycle] && (
                      <p className="text-[11px] font-normal opacity-90 mt-1.5 max-w-[220px] leading-snug">
                        {plan.subtext[billingCycle]}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Card Body & Feature Breakdown */}
                <div className="flex flex-col p-6 flex-1 bg-white">
                  <p className="text-sm font-bold text-zinc-900 mb-5">Features you'll get:</p>
                  
                  <ul className="flex flex-col gap-4.5 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3.5">
                        {/* Custom Scalloped Checkmark Badge Pattern Matching Image */}
                        <div className="shrink-0 text-[#01696F] mt-0.5">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                          </svg>
                        </div>
                        <span className="text-sm text-zinc-600 font-medium leading-tight">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Dynamic CTA Footer Section */}
                  <div className="flex flex-col gap-2.5 mt-auto pt-4">
                    {plan.id === "basic" && (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl font-bold bg-[#f1ece6] text-zinc-700 text-sm border border-zinc-200 cursor-default text-center"
                      >
                        Your Plan
                      </button>
                    )}

                    {plan.id === "team" && (
                      <button
                        onClick={() => handleSubscribe(plan.name, plan.id)}
                        disabled={loadingPlan !== null}
                        className="w-full py-3 px-4 rounded-xl font-bold bg-[#01696F] text-white text-sm transition-all hover:bg-[#01575c] flex items-center justify-center gap-2 shadow-sm"
                      >
                        {loadingPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Start Free Trial"
                        )}
                      </button>
                    )}

                    {plan.id === "enterprise" && (
                      <div className="flex flex-col gap-2 w-full items-center">
                        <button
                          onClick={() => handleSubscribe(plan.name, plan.id)}
                          disabled={loadingPlan !== null}
                          className="w-full py-3 px-4 rounded-xl font-bold bg-[#01696F] text-white text-sm transition-all hover:bg-[#01575c] flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loadingPlan === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Contact Us"
                          )}
                        </button>
                        <button
                          onClick={() => window.location.href = "mailto:sales@shankh.com?subject=Enterprise Plan Inquiry"}
                          className="w-full py-2 text-zinc-800 font-bold text-sm tracking-wide hover:underline text-center"
                        >
                          Learn More
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Anchor Strip for Active State */}
                {plan.isActive && (
                  <div className="absolute bottom-0 left-0 right-0 bg-[#01696F] text-white text-center py-3.5 font-bold text-sm tracking-wide">
                    Your Active Plan
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info breakdown */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 pb-8 text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#01696F]" />
            <span>256-bit SSL encrypted payments</span>
          </div>
          <span className="hidden sm:inline text-zinc-300">|</span>
          <span>Cancel anytime. No hidden fees.</span>
          <span className="hidden sm:inline text-zinc-300">|</span>
          <span>Billed monthly or annually</span>
        </div>
      </div>
    </MainLayout>
  );
}