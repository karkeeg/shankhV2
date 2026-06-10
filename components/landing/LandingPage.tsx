"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Play, CheckCircle2, ArrowRight, Shield, Award, Users, 
  ChevronRight, Sparkles, BookOpen, BarChart3, HelpCircle,
  Table, Bot, Compass, Sliders, TrendingUp, Lightbulb,
  Sparkle, MessageSquare, Zap, ChevronDown, ChevronUp,
  LineChart, FileText, Landmark
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

// FAQ type definition
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function LandingPage() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: "Do I need Excel or any other software installed?",
      answer: "No! Shankh has a fully integrated, native spreadsheet editor built directly into your browser. You can build models, write formulas, and get instant feedback without downloading anything.",
      icon: <Sparkle size={16} />
    },
    {
      id: 2,
      question: "How long does it take to become job-ready?",
      answer: "Most students who practice for 30-45 minutes a day become highly competent and interview-ready within 4-6 weeks.",
      icon: <HelpCircle size={16} />
    },
    {
      id: 3,
      question: "I'm a complete beginner. Is this too advanced for me?",
      answer: "Not at all! Our curriculum starts from absolute foundation level (reading financial statements) and guides you step-by-step to complex LBO and M&A modeling.",
      icon: <MessageSquare size={16} />
    },
    {
      id: 4,
      question: "Can I use this to prepare for investment banking interviews?",
      answer: "Yes! Many of our drills are modeled directly after real investment banking and private equity modeling tests used by top-tier global firms.",
      icon: <Zap size={16} />
    },
    {
      id: 5,
      question: "What makes the AI tutor different from ChatGPT?",
      answer: "Unlike ChatGPT which just gives you the final formula or solution, our AI tutor acts as a guide. It points out mistakes in your cell formulas, explains the finance theory, and helps you figure out the correct answer yourself.",
      icon: <Sparkles size={16} />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF2F3] via-[#EFF5F5] to-[#F0EDE7] text-zinc-800 font-sans select-none overflow-x-hidden">
      
      {/* ── Navbar ── */}
<header className="sticky top-0 z-50 backdrop-blur-md bg-[#EBF2F3]/70 border-b-2 border-[#01696F]/40 transition-all">
  <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-12">
    {/* Logo */}
    <div
      className="flex items-center gap-2 cursor-pointer shrink-0"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <Logo variant="full" width={130} height={45} />
    </div>

    {/* Navigation */}
    <nav className="hidden md:flex flex-1 items-center justify-end gap-8 text-sm font-bold text-zinc-600">
      <a
        href="#platform"
        className="hover:text-[#01696F] transition-colors"
      >
        Features
      </a>
      <a
        href="#pillars"
        className="hover:text-[#01696F] transition-colors"
      >
        Topics
      </a>
      <a
        href="#pricing"
        className="hover:text-[#01696F] transition-colors"
      >
        Pricing
      </a>
    </nav>

    {/* Right Side Actions */}
    <div className="flex items-center gap-4 ml-auto shrink-0">
      {/* <button
        onClick={() => router.push("/login")}
        className="text-sm font-bold text-[#01696F] hover:text-[#014f54] transition-all px-4 py-2"
      >
        Sign In
      </button> */}

      <button
        onClick={() => router.push("/signup")}
        className="bg-[#01696F] text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#014f54] transition-all shadow-sm hover:shadow active:scale-95"
      >
        Start Free
      </button>
    </div>
  </div>
</header>

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto px-6 pt-4 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6 animate-fade-in">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#F2EFE9] border border-[#01696F]/20 text-[#01696F] text-[14px] font-black tracking-wider px-3 py-1 rounded-[14px]  ">
            
            Now in beta - FREE ACCESS
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-[52px] font-extrabold text-zinc-900 tracking-tight leading-[1.1]">
            Master Financial <br />
            Modeling by <span className="text-[#01696F] relative">Doing</span>
          </h1>

          {/* Subtext */}
          <p className="text-sm md:text-base text-zinc-600 font-medium leading-relaxed max-w-md">
            Master complex financial modeling with our comprehensive library. Over 360+ models built by industry experts, ready to transform your workflow.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => router.push("/signup")}
              className="w-full sm:w-auto bg-[#01696F] text-white text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-2xl hover:bg-[#014f54] transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Start Practicing Free <ArrowRight size={14} />
            </button>
            <a 
              href="#platform"
              className="w-full sm:w-auto text-center border border-[#01696F]/30 hover:border-[#01696F]/60 text-[#01696F] text-xs font-black uppercase tracking-wider px-8 py-3.5 rounded-2xl bg-white/40 backdrop-blur hover:bg-white/60 transition-all active:scale-95"
            >
              See how it works
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 pt-4 border-t border-zinc-200/50 w-full">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-1 border-white bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-[10px] font-black text-white">
                JD
              </div>
              <div className="w-10 h-10 rounded-full border-1 border-white bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-black text-white">
                MK
              </div>
              <div className="w-10 h-10 rounded-full border-1 border-white bg-gradient-to-tr from-violet-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white">
                SL
              </div>
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 leading-tight">25K+ Users</p>
              <p className="text-[12px] text-zinc-500 font-semibold">Trusted by professionals worldwide</p>
            </div>
          </div>

        </div>

        {/* Right Column (Dashboard Image Mockup) */}
        <div className="lg:col-span-6 w-full flex justify-center animate-slide-up">
          <div className="relative w-full max-w-[900px] aspect-[4/3] rounded-2xl transition-all duration-500">
            <Image 
              src="/heroImage.svg" 
              alt="Shankh Dashboard Preview" 
              fill 
              priority
              className="object-cover object-left-top"
            />
          </div>
        </div>

      </section>

      {/* ── Stats / Trust Banner ── */}
      <section className=" backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
          <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
            <span className="text-2xl font-black text-zinc-900">120+ Companies</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">Trusted by Experts</span>
          </div>
          <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
            <span className="text-2xl font-black text-zinc-900">4.8★ Rating</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">Avg Customer Review</span>
          </div>
          <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
            <span className="text-2xl font-black text-zinc-900">100K+ Downloads</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">And Growing</span>
          </div>
          <div className="flex flex-col items-center md:items-start md:px-6 pt-4 md:pt-0">
            <span className="text-2xl font-black text-zinc-900">4 Free Plans</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mt-1">Test All Models</span>
          </div>
        </div>
      </section>

      {/* ── Section 1: The Platform (Features Grid) ── */}
      <section id="platform" className="bg-[#01696F] text-white py-24 border-t border-[#01696F]/10">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-[14px] font-black uppercase tracking-widest text-[#DFEAEA]">The Platform</span>
              <h2 className="text-3xl md:text-[40px] text-[#DFEAEA] mt-6 font-extrabold tracking-tight leading-none">
                Built for real learning, <br />not just watching.
              </h2>
            </div>
            <div className="max-w-md text-left">
              <p className="text-md text-emerald-100/80 font-medium leading-relaxed">
                Shankh gives you the tools, structure, and feedback to go from zero to job-ready in financial modeling.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Table size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">In Browser Spreadsheet</h4>
                <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                  Practice in a native spreadsheet environment — no Excel needed. Build models directly in Shankh with real formula logic.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">AI Tutor</h4>
                <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                  Stuck on a step? Our AI tutor explains the underlying concept, guides your thinking, and never just hands you the answer.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Compass size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">Guided Study Paths</h4>
                <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                  Follow curated learning paths from Financial Statement basics to advanced LBO modeling — always know what&apos;s next.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Sliders size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">Difficulty Levels</h4>
                <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                  Easy, Medium, Hard. Whether you&apos;re a first-year student or a seasoned analyst, Shankh scales to your level.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <TrendingUp size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">Progress Dashboard</h4>
                <p className="text-sm text-zinc-500 font-semibold leading-relaxed">
                  Track your accuracy, streak, and skill growth across every topic. See exactly where to focus next.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-[#EAEFEB] text-zinc-800 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="w-12 h-12 bg-[#01696F] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Lightbulb size={22} />
              </div>
              <div className="space-y-2 text-left">
                <h4 className="text-base font-extrabold text-zinc-900">Step-by-Step Hints</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Each problem has layered hints that explain the formula derivation — not just the answer, but the thinking behind it.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section 2: Four Pillars of Financial Modeling ── */}
      <section id="pillars" className="bg-[#EAEFEB] py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-[14px] font-black uppercase tracking-widest text-[#01696F]">What You&apos;ll Learn</span>
              <h2 className="text-3xl md:text-[40px] font-extrabold text-zinc-900 mt-4 tracking-tight leading-none">
                Four pillars of <br /> <span className="text-[#01696F]">financial modeling</span>.
              </h2>
            </div>
            <div className="max-w-sm text-left">
              <p className="text-md text-zinc-500 leading-relaxed">
                From reading financial statements to building full valuation models used by investment banks.
              </p>
            </div>
          </div>

          {/* Pillars Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              {/* Top Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-1.5 shrink-0">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#01696F]">
                  <LineChart size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-emerald-200 tracking-widest">01</span>
              </div>
              {/* Middle Body */}
              <div className="bg-[#F8F6F2] px-6 py-8 flex-1 flex flex-col items-center text-center justify-center min-h-[190px] gap-2.5 border-y border-zinc-100">
                <h4 className="text-sm font-extrabold text-zinc-900">3-Statement Model</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Link the Income Statement, Balance Sheet, and Cash Flow Statement into a fully integrated financial model.
                </p>
              </div>
              {/* Bottom Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-2 shrink-0">
                <span className="text-[11px] font-black text-white tracking-wide">3-Statement Model</span>
                <span className="bg-white text-[#01696F] text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-100">
                  Foundation
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              {/* Top Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-1.5 shrink-0">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#01696F]">
                  <FileText size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-emerald-200 tracking-widest">02</span>
              </div>
              {/* Middle Body */}
              <div className="bg-[#F8F6F2] px-6 py-8 flex-1 flex flex-col items-center text-center justify-center min-h-[190px] gap-2.5 border-y border-zinc-100">
                <h4 className="text-sm font-extrabold text-zinc-900">DCF Valuation</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Project free cash flows and discount them back to intrinsic value. Master WACC, terminal value, and sensitivity analysis.
                </p>
              </div>
              {/* Bottom Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-2 shrink-0">
                <span className="text-[11px] font-black text-white tracking-wide">DCF Valuation</span>
                <span className="bg-white text-[#01696F] text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-100">
                  Valuation
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              {/* Top Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-1.5 shrink-0">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#01696F]">
                  <Landmark size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-emerald-200 tracking-widest">03</span>
              </div>
              {/* Middle Body */}
              <div className="bg-[#F8F6F2] px-6 py-8 flex-1 flex flex-col items-center text-center justify-center min-h-[190px] gap-2.5 border-y border-zinc-100">
                <h4 className="text-sm font-extrabold text-zinc-900">LBO Modeling</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Build leveraged buyout models from the ground up — debt schedules, returns analysis, and exit assumptions.
                </p>
              </div>
              {/* Bottom Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-2 shrink-0">
                <span className="text-[11px] font-black text-white tracking-wide">LBO Modelling</span>
                <span className="bg-white text-[#01696F] text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-100">
                  Advanced
                </span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
              {/* Top Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-1.5 shrink-0">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#01696F]">
                  <Shield size={20} className="stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-emerald-200 tracking-widest">04</span>
              </div>
              {/* Middle Body */}
              <div className="bg-[#F8F6F2] px-6 py-8 flex-1 flex flex-col items-center text-center justify-center min-h-[190px] gap-2.5 border-y border-zinc-100">
                <h4 className="text-sm font-extrabold text-zinc-900">M&A Analysis</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Learn accretion/dilution modeling, purchase price allocation, and merger consequence analysis.
                </p>
              </div>
              {/* Bottom Cap */}
              <div className="bg-[#01696F] py-5 flex flex-col items-center justify-center gap-2 shrink-0">
                <span className="text-[11px] font-black text-white tracking-wide">M&A Analysis</span>
                <span className="bg-white text-[#01696F] text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-100">
                  Advanced
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section 3: FAQ Accordion ── */}
      <section className="bg-[#01696F] text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-[16px] font-black uppercase tracking-widest text-white">FAQ</span>
              <h2 className="text-3xl mt-6 md:text-[40px] font-bold tracking-tight leading-none">
                Everything you need to <br />know.
              </h2>
            </div>
            <div className="max-w-sm text-left">
              <p className="text-md text-gray-300 font-medium leading-relaxed">
                Click on any question to learn more about how Shankh works.
              </p>
            </div>
          </div>

          {/* Accordion Rows */}
          <div className="max-w-7xl mx-auto space-y-4">
            {faqData.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-[#EAEFEB] text-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left font-bold"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-[#01696F] shrink-0">
                        {faq.icon}
                      </div>
                      <span className="text-xs md:text-sm font-extrabold text-zinc-800">{faq.question}</span>
                    </div>
                    <div className="text-zinc-500 shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-zinc-200/40 text-left">
                      <p className="text-xs md:text-sm text-zinc-500 font-semibold leading-relaxed pl-14">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── Section 4: Pricing Grid ── */}
      <section id="pricing" className="bg-[#EAEFEB] py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-[16px] font-black uppercase tracking-widest text-[#01696F]">Pricing</span>
              <h2 className="text-3xl md:text-[40px] mt-6 font-extrabold text-zinc-900 tracking-tight leading-none">
                Simple,  <br /> transparent pricing.
              </h2>
            </div>
            <div className="max-w-md text-left">
              <p className="text-md text-zinc-500 font-semibold leading-relaxed">
                Start free, upgrade when you&apos;re ready. No credit card required.
              </p>
            </div>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            
            {/* Card 1: Basic Plan */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
              {/* Upper Section */}
              <div className="p-8 pb-6 border-b border-zinc-100 flex flex-col items-center text-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">For one person</span>
                <div className="w-12 h-12 bg-[#E6F0F1] rounded-2xl flex items-center justify-center text-[#01696F] shadow-sm">
                  <Zap size={20} className="stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-black text-zinc-800 tracking-wider">BASIC PLAN</h4>
                <div className="pt-2">
                  <span className="text-3xl font-black text-zinc-900">₹299</span>
                  <span className="text-xs text-zinc-400 font-semibold"> / Month</span>
                </div>
              </div>
              {/* Features & Action */}
              <div className="p-8 pt-6 flex-1 flex flex-col justify-between gap-8">
                <div className="space-y-4 text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Features you&apos;ll get:</p>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Easy drag & drop editor
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of professionally designed templates.
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      1000+ design types
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of stock photos & graphics
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      10 GB of cloud storage
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => router.push("/signup")}
                    className="w-full py-3.5 bg-[#01696F] hover:bg-[#014f54] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Contact Us
                  </button>
                  <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors mx-auto">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Enterprise Plan (Highlighted) */}
            <div className="bg-[#01696F] text-white border-2 border-[#01696F] rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative scale-[1.03] z-10">
              {/* Popular tag */}
              <div className="absolute top-0 inset-x-0 mx-auto w-max bg-[#014f54] text-emerald-300 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl border-x border-b border-emerald-300/10">
                Most Popular
              </div>
              {/* Upper Section */}
              <div className="p-8 pt-10 pb-6 border-b border-white/10 flex flex-col items-center text-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200/70">For your organization</span>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-300 shadow-sm border border-white/10">
                  <Zap size={20} className="stroke-[2.5] fill-emerald-300 text-emerald-300" />
                </div>
                <h4 className="text-sm font-black text-white tracking-wider">ENTERPRISE PLAN</h4>
                <div className="pt-2">
                  <span className="text-3xl font-black text-white">LET&apos;S TALK</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-200/80 leading-none">Get in touch to customize your plan.</span>
              </div>
              {/* Features & Action */}
              <div className="bg-white text-zinc-800 p-8 pt-6 flex-1 flex flex-col justify-between gap-8">
                <div className="space-y-4 text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Features you&apos;ll get:</p>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Easy drag & drop editor
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of professionally designed templates.
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      1000+ design types
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of stock photos & graphics
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      10 GB of cloud storage
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => router.push("/signup")}
                    className="w-full py-3.5 bg-[#01696F] hover:bg-[#014f54] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Contact Us
                  </button>
                  <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors mx-auto">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Team Plan */}
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
              {/* Upper Section */}
              <div className="p-8 pb-6 border-b border-zinc-100 flex flex-col items-center text-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">For your team</span>
                <div className="w-12 h-12 bg-[#E6F0F1] rounded-2xl flex items-center justify-center text-[#01696F] shadow-sm">
                  <Users size={20} className="stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-black text-zinc-800 tracking-wider">TEAM PLAN</h4>
                <div className="pt-2">
                  <span className="text-3xl font-black text-zinc-900">₹699</span>
                  <span className="text-xs text-zinc-400 font-semibold"> / Month</span>
                </div>
              </div>
              {/* Features & Action */}
              <div className="p-8 pt-6 flex-1 flex flex-col justify-between gap-8">
                <div className="space-y-4 text-left">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Features you&apos;ll get:</p>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Easy drag & drop editor
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of professionally designed templates.
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      1000+ design types
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      Large library of stock photos & graphics
                    </li>
                    <li className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600">
                      <CheckCircle2 size={16} className="text-[#01696F] fill-white shrink-0 mt-0.5" />
                      10 GB of cloud storage
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => router.push("/signup")}
                    className="w-full py-3.5 bg-[#01696F] hover:bg-[#014f54] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Start Free Trial
                  </button>
                  <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors mx-auto">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Section 5: Get Started CTA Banner ── */}
      <section className="bg-[#01696F] text-white py-24 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <span className="text-[14px] font-black uppercase tracking-widest text-[#DFEAEA]">Get Started Today</span>
          <h2 className="text-3xl md:text-5xl mt-4 text-[#DFEAEA] font-extrabold tracking-tight">
            Your finance career starts <br />
            with <span className="underline decoration-emerald-300 decoration-4 underline-offset-8">practice.</span>
          </h2>
          <p className="text-sm md:text-lg text-[#DFEAEA] font-medium max-w-md mx-auto leading-relaxed pt-2">
            Join thousands of learners building real financial modeling skills on Shankh — the platform built for doers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <button 
              onClick={() => router.push("/signup")}
              className="bg-zinc-950 text-[#DFEAEA] hover:bg-zinc-900 text-md font-black  tracking-wider px-7 py-3 rounded-2xl transition-all shadow-md active:scale-95"
            >
              Start Practicing Free
            </button>
            <a 
              href="#platform"
              className="bg-white text-[#01696F] hover:bg-zinc-50 text-md font-black tracking-wider px-7 py-3 rounded-2xl transition-all shadow-md active:scale-95 border border-zinc-100"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Section: Contact Support ── */}
      <section id="contact" className="bg-[#EAEFEB] py-24 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl text-left">
              <span className="text-[14px] font-black uppercase tracking-widest text-[#01696F]">Got Questions?</span>
              <h2 className="text-3xl md:text-[40px] mt-4 font-extrabold text-zinc-900 tracking-tight leading-none">
                We&apos;re here to <span className="text-[#01696F]"><br/>help</span>
              </h2>
            </div>
            <div className="max-w-lg text-left">
              <p className="text-lg text-zinc-500 leading-relaxed">
                Reach out to us for any questions or support. We&apos;ll get back to you soon.
              </p>
            </div>
          </div>

          {/* Cards container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-7xl mx-auto">
            {/* Left Card: Still have questions? */}
            <div className="bg-[#01696F] text-white p-8 rounded-3xl flex flex-col justify-between gap-8 text-left shadow-sm">
              <div className="space-y-6 mt-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#01696F] shadow-sm">
                  <MessageSquare size={30} className="stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold">Still have questions?</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Our team is here to help you succeed. Get in touch and we&apos;ll answer any questions you have.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-10">
                <button className="bg-zinc-950 text-white hover:bg-zinc-900 text-md font-black tracking-wider px-10 py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm">
                  Contact Support
                </button>
                <button className="bg-[#F8F6F2] text-[#01696F] hover:bg-[#F0EDE7] text-md font-black tracking-wider px-10 py-3.5 rounded-2xl transition-all active:scale-95 shadow-sm">
                  Browse Docs
                </button>
              </div>
            </div>

            {/* Right Card: Contact Form */}
            <form onSubmit={(e) => { e.preventDefault(); alert("Message submitted successfully! We will get back to you soon."); }} className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col gap-5 shadow-sm text-left">
              <h3 className="text-xl font-extrabold text-[#01696F]">Contact Form</h3>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  className="w-full bg-[#DFEAEA] placeholder:text-[#01696F] border-0 outline-none px-4 py-3.5 rounded-2xl text-md  focus:ring-2 focus:ring-[#01696F]/20 transition-all text-[#01696F]" 
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  className="w-full bg-[#DFEAEA] placeholder:text-[#01696F] border-0 outline-none px-4 py-3.5 rounded-2xl text-md focus:ring-2 focus:ring-[#01696F]/20 transition-all text-[#01696F]" 
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={4}
                  required
                  className="w-full bg-[#DFEAEA] placeholder:text-[#01696F] border-0 outline-none px-4 py-3.5 rounded-2xl text-md focus:ring-2 focus:ring-[#01696F]/20 transition-all text-[#01696F] resize-none" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-[#01696F] hover:bg-[#014f54] text-white rounded-2xl text-md font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>


      {/* ── Footer Section ── */}
      <footer className="bg-[#01696F] text-white pt-16 pb-8 border-t border-white/10 text-left select-none animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <Logo variant="full" width={110} height={30} className="brightness-0 invert" />
            </div>
            <p className="text-[11px] text-emerald-100/70 font-semibold leading-relaxed max-w-xs">
              A hands-on platform for learning financial modeling, DCF, and real-world finance skills.
            </p>
          </div>

          {/* Column 2: Navigations */}
          <div className="md:col-span-3 space-y-3.5">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Navigations</h5>
            <ul className="space-y-2.5 text-xs font-bold text-emerald-100/80">
              <li><a href="#platform" className="hover:text-white transition-colors">Platform</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Learning</a></li>
              <li><a href="#platform" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy policy</a></li>
            </ul>
          </div>

          {/* Column 3: Products */}
          <div className="md:col-span-3 space-y-3.5">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Products</h5>
            <ul className="space-y-2.5 text-xs font-bold text-emerald-100/80">
              <li><a href="#" className="hover:text-white transition-colors">Spell Wizards</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Yugya health</a></li>
            </ul>
          </div>

          {/* Column 4: Socials */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Socials</h5>
            <ul className="space-y-2.5 text-xs font-bold text-emerald-100/80">
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter (x)</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10 my-8" />

        {/* Lower Row */}
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-semibold text-emerald-200/60">
            © 2026 Sankh. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] font-bold text-emerald-200/60">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">YouTube</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
