"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Plus, Minus, Target, Lightbulb, Map,
  Compass, Brain, TrendingUp, CheckCircle2, Zap, Users, BadgeCheck, MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

// Shared palette (matches the design mockups)
const TEAL = "#01696F";
const LIGHT = "#DCEAE7"; // pale mint background for light sections
const CREAM = "#F1ECE0"; // warm cream cards on teal

interface TrackItem {
  id: number;
  title: string;
  tag: string;
  detail: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [openTrack, setOpenTrack] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tracks: TrackItem[] = [
    { id: 1, title: "Finance track", tag: "CORE", detail: "Financial statements, valuation, modeling, and investment judgment — built around real finance roles." },
    { id: 2, title: "Strategy track", tag: "CORE", detail: "Market entry, growth, profitability, and case structuring for consulting and corporate strategy roles." },
    { id: 3, title: "Operations track", tag: "CORE", detail: "Supply chain, process improvement, and execution judgment for operations and program roles." },
    { id: 4, title: "Business athlete track", tag: "CORE", detail: "Cross-functional readiness across finance, strategy, and operations for broad business roles." },
  ];

  return (
    <div className="min-h-screen text-zinc-800 font-sans select-none overflow-x-hidden" style={{ backgroundColor: LIGHT }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: "rgba(220,234,231,0.8)", borderColor: "rgba(1,105,111,0.15)" }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-12">
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Logo variant="full" width={130} height={45} />
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-end gap-8 text-[15px] font-medium text-zinc-700">
            <a href="#tracks" className="hover:text-[#01696F] transition-colors">Tracks</a>
            <a href="#how" className="hover:text-[#01696F] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#01696F] transition-colors">Pricing</a>
            <a href="#experience" className="hover:text-[#01696F] transition-colors">Sample cases</a>
            <a href="#foundation" className="hover:text-[#01696F] transition-colors">About</a>
            <button onClick={() => router.push("/login")} className="hover:text-[#01696F] transition-colors">Signin</button>
          </nav>

          <div className="flex items-center gap-4 ml-auto md:ml-0 shrink-0">
            <button
              onClick={() => router.push("/signup")}
              className="bg-[#01696F] text-white text-[15px] font-semibold px-6 py-3 rounded-xl hover:bg-[#014f54] transition-all shadow-sm hover:shadow active:scale-95"
            >
              Start your path
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">

        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-7 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 bg-[#F2EFE9] text-[#01696F] text-[15px] font-bold tracking-wide px-4 py-2 rounded-xl">
            Now in beta - FREE ACCESS
          </div>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-[1.05]">
            Build sharper <br />
            <span className="text-[#01696F]">decision </span> making
          </h1>

          <p className="text-lg text-zinc-600 leading-relaxed max-w-lg">
            Shankh helps ambitious candidates build stronger decision making through interactive cases, structured frameworks, and guided practice across finance, strategy, and operations.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => router.push("/signup")}
              className="bg-[#01696F] text-white text-base font-semibold px-8 py-4 rounded-2xl hover:bg-[#014f54] transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Start your learning path
            </button>
            <a
              href="#how"
              className="text-center border border-[#01696F]/40 hover:border-[#01696F] text-[#01696F] text-base font-semibold px-8 py-4 rounded-2xl bg-white/40 hover:bg-white/70 transition-all active:scale-95"
            >
              See how it works
            </a>
          </div>

          <p className="text-base text-zinc-600">
            Practice live cases. Think more clearly. Improve with every session.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-3">
              <div className="w-11 h-11 rounded-full border-2 border-white bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-[10px] font-black text-white">JD</div>
              <div className="w-11 h-11 rounded-full border-2 border-white bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-black text-white">MK</div>
              <div className="w-11 h-11 rounded-full border-2 border-white bg-gradient-to-tr from-violet-400 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white">SL</div>
            </div>
            <div>
              <p className="text-base font-bold text-zinc-900 leading-tight">25K+ Users</p>
              <p className="text-sm text-zinc-500">Trusted by professionals worldwide</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 w-full flex justify-center animate-slide-up">
          <div className="relative w-full max-w-[900px] aspect-[4/3] rounded-2xl">
            <Image
              src="/heroImage.svg"
              alt="Shankh Dashboard Preview"
              fill
              priority
              className="object-contain object-center"
            />
          </div>
        </div>
      </section>

      {/* Hero supporting cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Built for serious candidates preparing for competitive business roles.",
            "Practice across finance, strategy, and operations in one guided platform.",
            "Designed to improve problem solving, structure, and decision making.",
          ].map((text) => (
            <div key={text} className="bg-white rounded-2xl px-4 py-6 shadow-sm flex items-center justify-center text-center">
              <p className="text-[#01696F] text-md uppercase tracking-wide leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: The Solution */}
      <section className="text-white py-24" style={{ backgroundColor: TEAL }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-white/70">The Solution</span>
              <h2 className="font-serif text-4xl md:text-5xl font-medium mt-6 leading-tight text-[#E8F0EF]">
                What problem does <br /> Shankh solve?
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-[#D6E5E3]">
              <p>Most candidates do not struggle because they lack content. They struggle because they cannot consistently turn knowledge into clear decisions under pressure.</p>
              <p><span className="font-bold text-white">Shankh</span> solves that gap by giving learners <span className="font-bold text-white">structured, interactive practice</span> that builds problem solving, reasoning, and execution confidence.</p>
            </div>
          </div>

          <div className="border-2 border-white rounded-3xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {[
                { icon: <Target size={24} />, label: "From theory to application", title: "From theory to Application", detail: "Move beyond notes and frameworks into real decision practice." },
                { icon: <Lightbulb size={24} />, label: "From passive prep to active thinking", title: "From passive prep to Active thinking", detail: "Stop memorizing passively and start reasoning through every problem actively." },
                { icon: <Map size={24} />, label: "From scattered prep to visible progress", title: "From scattered prep to Visible progress", detail: "Replace random study with a clear path that shows measurable progress." },
              ].map((item) => (
                <div
                  key={item.label}
                  className="group relative flex flex-col items-center justify-center gap-6 rounded-2xl px-6 py-12 min-h-[280px] overflow-hidden transition-all duration-300 ease-out hover:bg-[#E0EAE8] hover:items-start hover:justify-start hover:shadow-md"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-[#01696F] transition-colors duration-300 group-hover:bg-[#01696F] group-hover:text-white"
                    style={{ backgroundColor: "#CFE0DE" }}
                  >
                    {item.icon}
                  </div>

                  <div className="relative w-full min-h-[130px]">
                    <p className="absolute inset-x-0 top-0 text-center text-base font-bold uppercase tracking-wide text-white transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-x-8">
                      {item.label}
                    </p>

                    <div className="absolute inset-x-0 top-0 flex flex-col gap-4 text-left opacity-0 translate-x-8 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
                      <h4 className="text-lg font-bold text-zinc-900">{item.title}</h4>
                      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#01696F] to-transparent" />
                      <p className="text-base leading-relaxed text-zinc-600">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section: Why we're different */}
      <section className="py-24" style={{ backgroundColor: LIGHT }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-[#01696F]">Why we&apos;re different</span>
              <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-6 leading-tight">
                Why Shankh <br /> <span className="font-serif italic text-[#01696F]">is different</span>
              </h2>
            </div>
            <div className="flex lg:items-end">
              <p className="text-lg leading-relaxed text-zinc-700">
                <span className="font-bold text-zinc-900">Shankh</span> is an active environment — not a content library. Every feature is designed to build decision-making under pressure.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-300/60">
            {[
              { n: "01", title: "Live case room", desc: "An immersive environment that puts you inside a case, not beside it. Make decisions, defend your logic, and get coached in real time — not after the fact." },
              { n: "02", title: "Guided AI nudges", desc: "Intelligent prompts that advance your thinking without replacing it. Every nudge builds the habit of structured reasoning, not the habit of waiting for answers." },
              { n: "03", title: "Cross-functional learning", desc: "Finance, strategy, and operations woven together as they are in real business — not siloed subjects you study in sequence and forget in parallel." },
            ].map((row) => (
              <div key={row.n} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center py-10 border-b border-zinc-300/60">
                <div className="md:col-span-2">
                  <span className="font-serif text-6xl md:text-7xl font-bold text-[#01696F]">{row.n}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-2xl font-bold text-zinc-900">{row.title}</h3>
                </div>
                <div className="md:col-span-6">
                  <p className="text-lg leading-relaxed text-zinc-600">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Our Foundation */}
      <section id="foundation" className="text-white py-24" style={{ backgroundColor: TEAL }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-white/70">Our Foundation</span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mt-6 leading-tight text-[#E8F0EF]">
              A perspective shaped by real business-school experience
            </h2>
            <p className="text-lg leading-relaxed text-[#D6E5E3] mt-8">
              <span className="font-bold text-white">Shankh</span> is being built with a deep understanding of what ambitious MBA candidates go through: case interviews, placement pressure, structured problem solving, and the need to perform clearly under uncertainty. The product reflects that mindset and is designed for learners who want a serious preparation experience, not a generic study app.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { title: "Built by business-school graduates" },
              { title: "Placement-aware design" },
              { title: "Serious and premium" },
            ].map((card) => (
              <div key={card.title} className="group rounded-3xl p-8 bg-[#F1ECE0] hover:bg-zinc-950 transition-colors duration-300 cursor-default">
                <h3 className="text-xl font-bold text-zinc-900 group-hover:text-white mb-3 transition-colors duration-300">{card.title}</h3>
                <p className="text-base leading-relaxed text-zinc-600 group-hover:text-zinc-300 transition-colors duration-300">
                  Every feature shaped around the way candidates prepare for high-stakes roles, not passive content consumption.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    
    <section id="how" className="py-24" style={{ backgroundColor: LIGHT }}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Grid: Aligned to the top items-start */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-start">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#0D686B]">
              What you&apos;ll learn
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-zinc-900 mt-4 leading-tight">
              How Shankh helps you <br /> 
              <span className="font-serif italic text-[#0D686B] font-normal">level up</span>
            </h2>
          </div>
          <div className="lg:pt-10">
            <p className="text-lg leading-relaxed text-zinc-700 max-w-xl">
              Build structured thinking through guided practice, real-world scenarios, and targeted drills. 
              Get precise feedback that shows your strengths, gaps, and how to improve step by step.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "01", icon: <Compass size={24} />, title: "Choose your path", desc: "Start with your direction, whether you want to focus on finance, strategy, operations, or broad business readiness.", tag: "DISCOVER" },
            { n: "02", icon: <Target size={24} />, title: "Practice with structure", desc: "Work through cases, frameworks, drills, and guided exercises that help you move from theory to application.", tag: "TRAIN" },
            { n: "03", icon: <Brain size={24} />, title: "Receive focused feedback", desc: "Understand where your thinking is strong, where it is weak, and how to improve with more precision than generic prep.", tag: "REFINE" },
            { n: "04", icon: <TrendingUp size={24} />, title: "See visible progress", desc: "Follow a personalized learning path that adapts to your goals, strengths, and practice behavior.", tag: "ADVANCED" },
          ].map((card) => (
            <div 
              key={card.n} 
              className="relative flex flex-col rounded-[24px] overflow-hidden pt-6 pb-5 px-4 text-center group transition-all duration-300 hover:scale-[1.01]"
              style={{ backgroundColor: TEAL }}
            >
              {/* Top Section (Icon & Number) */}
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="w-12 h-12 rounded-xl border border-white/30 flex items-center justify-center text-white bg-white/5 backdrop-blur-sm">
                  {card.icon}
                </div>
                <span className="text-sm font-bold text-white/90 tracking-widest">{card.n}</span>
              </div>
              
              {/* Body Section: The white card floating on top of the Teal container */}
              <div className="flex-1 bg-[#F3EFE6] rounded-[18px] px-5 py-10 flex flex-col items-center gap-4 shadow-inner">
                <h4 className="text-xl font-bold text-zinc-900 leading-snug">{card.title}</h4>
                <p className="text-sm leading-relaxed text-zinc-600 font-medium">{card.desc}</p>
              </div>
              
              {/* Bottom Section (Pill Tag) */}
              <div className="mt-5 flex justify-center">
                <span className="bg-[#EAEFEF] text-zinc-800 text-[11px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-sm">
                  {card.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>


      {/* Section: Learning paths */}
      <section id="tracks" className="text-white py-24" style={{ backgroundColor: TEAL }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-white/70">Learning Paths</span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mt-6 leading-tight text-[#E8F0EF]">
              Built for the paths candidates care about
            </h2>
            <p className="text-lg leading-relaxed text-[#D6E5E3] mt-8 max-w-sm">
              Every track is structured around real roles. Choose one or combine them into your own path.
            </p>
          </div>

          <div>
            {tracks.map((track) => {
              const isOpen = openTrack === track.id;
              return (
                <div key={track.id} className="border-b border-white/20">
                  <button
                    onClick={() => setOpenTrack(isOpen ? null : track.id)}
                    className="w-full flex items-center justify-between gap-4 py-6 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-white">{track.title}</span>
                      <span className="bg-white text-zinc-800 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">{track.tag}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white shrink-0">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </div>
                  </button>
                  {isOpen && (
                    <p className="text-base leading-relaxed text-[#D6E5E3] pb-6 pr-12 -mt-1">{track.detail}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section: Pricing Grid ── */}
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
            {[
              { tagline: "For one person", name: "BASIC PLAN", price: "₹299", note: "/Month", cta: "Contact Us", icon: <Zap size={44} className="stroke-[1.5]" />, highlight: false },
              { tagline: "For your organization", name: "ENTERPRISE PLAN", price: "Let's Talk", note: "", cta: "Contact Us", icon: <Zap size={44} className="stroke-[1.5]" />, highlight: true },
              { tagline: "For your team", name: "TEAM PLAN", price: "₹699", note: "/Month", cta: "Start Free Trial", icon: <Users size={44} className="stroke-[1.5]" />, highlight: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${plan.highlight ? "border-2 border-[#01696F] shadow-lg md:scale-[1.02] z-10" : "border border-[#01696F]/50 shadow-sm hover:shadow-md"}`}
              >
                {/* Header strip */}
                <div className="py-5 text-center border-b border-[#01696F]/30">
                  <span className="text-lg font-bold text-zinc-900">{plan.tagline}</span>
                </div>

                {/* Hero block */}
                <div className="bg-[#DCEAE7] px-8 py-12 flex flex-col items-center text-center gap-6 border-b border-[#01696F]/30">
                  <div className="text-[#01696F]">{plan.icon}</div>
                  <h4 className="text-2xl font-extrabold text-[#01696F] tracking-wide">{plan.name}</h4>
                  <div className="text-4xl font-extrabold text-[#01696F]">
                    {plan.price}<span className="text-3xl">{plan.note}</span>
                  </div>
                </div>

                {/* Features & Action */}
                <div className="px-8 py-8 flex-1 flex flex-col gap-6">
                  <p className="text-base font-bold text-zinc-900">Features you&apos;ll get:</p>
                  <ul className="space-y-4 flex-1">
                    {[
                      "Easy drag & drop editor",
                      "Large library of professionally designed templates.",
                      "1000+ design types",
                      "Large library of stock photos & graphics",
                      "10 GB of cloud storage",
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-3 text-base text-zinc-500">
                        <BadgeCheck size={22} className="text-white fill-[#01696F] shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => router.push("/signup")}
                      className="w-full py-4 bg-[#01696F] hover:bg-[#014f54] text-white rounded-2xl text-base font-bold transition-all shadow-sm active:scale-95"
                    >
                      {plan.cta}
                    </button>
                    <button className="text-base font-bold text-zinc-900 hover:text-zinc-600 transition-colors mx-auto">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
      {/* Section: The Experience */}
      <section id="experience" className="text-white py-24" style={{ backgroundColor: TEAL }}>
        <div className="max-w-5xl mx-auto px-6 text-center mb-16">
          <span className="text-sm font-bold uppercase tracking-widest text-white/70">The Experience</span>
          <h2 className="font-serif text-4xl md:text-5xl font-medium mt-6 leading-tight text-[#E8F0EF]">
            A more engaging <br /> way to prepare
          </h2>
          <p className="text-lg leading-relaxed text-[#D6E5E3] mt-8 max-w-2xl mx-auto">
            The experience is designed to feel focused, premium, and alive. Learners do not move through a static content library — they enter guided problem-solving environments that make progress feel earned and relevant to real outcomes.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-3xl p-10 text-zinc-800" style={{ backgroundColor: CREAM }}>
            <h3 className="text-2xl font-bold text-zinc-900 mb-6">What candidates build with Shankh</h3>
            <ul className="space-y-4">
              {[
                "Stronger problem solving.",
                "Better decision making.",
                "Greater confidence across business topics.",
                "Clearer understanding of where to improve.",
                "A more credible path from learning to performance.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-lg text-zinc-700">
                  <span className="w-2 h-2 rounded-full bg-[#01696F] mt-2.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl p-10 border border-white/25">
            <h3 className="text-2xl font-bold text-white mb-6">What the experience feels like</h3>
            <p className="text-lg leading-relaxed text-[#D6E5E3]">
              It feels interactive, premium, and structured. Each case gives the learner a sense of movement, challenge, and clarity, so the platform feels like a serious practice environment rather than a content library.
            </p>
          </div>
        </div>
      </section>

      {/* Ambitious Goals CTA Banner */}
      <section className="py-12 px-6" style={{ backgroundColor: LIGHT }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] overflow-hidden shadow-lg">
            {/* Left Column (Dark Side) */}
            <div className="lg:col-span-8 bg-[#0F0F0F] p-8 md:p-16 flex flex-col justify-between text-left min-h-[380px]">
              <div>
                <span className="text-[13px] font-extrabold uppercase tracking-widest text-[#DCEAE7] block mb-6">
                  START TODAY
                </span>
                <h2 className="font-serif text-3xl md:text-5xl lg:text-[54px] font-normal leading-[1.15] text-white max-w-2xl">
                  Your preparation should feel as <span className="font-bold">ambitious</span> as your goals.
                </h2>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-zinc-400 max-w-xl mt-8">
                Shankh helps candidates practice with clarity, structure, and momentum across finance, strategy, and operations.
              </p>
            </div>

            {/* Right Column (Teal Side) */}
            <div className="lg:col-span-4 bg-[#01696F] p-8 md:p-16 flex flex-col justify-center items-center gap-5">
              <button
                onClick={() => router.push("/signup")}
                className="w-full max-w-[260px] py-4 bg-[#F1ECE0] hover:bg-white text-zinc-900 rounded-2xl text-base font-bold transition-all shadow-sm active:scale-95 text-center"
              >
                Explore the platform
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="w-full max-w-[260px] py-4 border border-white/60 hover:border-white text-white rounded-2xl text-base font-bold transition-all active:scale-95 text-center"
              >
                Start your path
              </button>
              <span className="text-xs text-white/70 mt-1">
                Free access during beta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="text-white py-24" style={{ backgroundColor: TEAL }}>
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-end">
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-white/60">FAQ</span>
              <h2 className="font-serif text-4xl md:text-5xl font-medium mt-4 leading-tight text-white">
                Everything you need to <br /> know about{" "}
                <span className="font-bold">Shankh</span>.
              </h2>
            </div>
            <div className="lg:text-center">
              <p className="text-base leading-relaxed text-[#D6E5E3] max-w-sm mx-auto">
                Everything you need to know about getting started, learning effectively, and making the most of your Shankh experience.
              </p>
            </div>
          </div>

          {/* Accordion Items */}
          <div className="space-y-4">
            {[
              {
                id: 1,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L13.09 8.26L19 6L15.45 11.09L22 12L15.45 12.91L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.91L2 12L8.55 11.09L5 6L10.91 8.26L12 2Z" />
                  </svg>
                ),
                question: "What makes the AI tutor different from ChatGPT?",
                answer: "Unlike ChatGPT which is a general-purpose assistant, Shankh's AI tutor is purpose-built for business case preparation. It guides you through structured problem-solving frameworks, evaluates your reasoning quality, and gives targeted feedback — all calibrated around finance, strategy, and operations domains."
              },
              {
                id: 2,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
                question: "Can I use this to prepare for investment banking interviews?",
                answer: "Absolutely. Shankh covers financial modeling, valuation, and case structuring that are directly relevant to investment banking and corporate finance interview preparation. The Finance track is specifically designed for roles in IB, PE, and related fields."
              },
              {
                id: 3,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                question: "I'm a complete beginner. Is this too advanced for me?",
                answer: "Not at all. Shankh is designed for ambitious learners at all levels. Each track starts with foundational concepts and progressively builds toward more complex decision-making scenarios. You can start anywhere and move at your own pace."
              },
              {
                id: 4,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L13.09 8.26L19 6L15.45 11.09L22 12L15.45 12.91L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.91L2 12L8.55 11.09L5 6L10.91 8.26L12 2Z" />
                  </svg>
                ),
                question: "Do I need Excel or any other software installed?",
                answer: "No. Shankh is entirely browser-based. Our Quantus spreadsheet environment runs natively in the platform, so you can practice financial modeling and analysis without any external software installation."
              },
              {
                id: 5,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ),
                question: "How long does it take to become job-ready?",
                answer: "It depends on your starting point and target role. Most learners see meaningful improvement in 4–8 weeks of consistent practice. Shankh tracks your progress and adapts to show you exactly what to focus on to hit your goals faster."
              },
            ].map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: CREAM }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#CFE0DE", color: TEAL }}
                      >
                        {faq.icon}
                      </div>
                      <span className="text-base font-semibold text-zinc-800">{faq.question}</span>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      style={{ backgroundColor: "#B8CECE", color: TEAL }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pl-20">
                      <p className="text-base leading-relaxed text-zinc-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
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
              <Logo variant="mark" width={40} height={40} className="" /> 
              <span className="text-3xl font-semibold" >Shankh</span>
            </div>
            <p className="text-[16px] text-gray-200/80 font-medium leading-relaxed max-w-xs">
              A hands-on platform for learning financial modeling, DCF, and real-world finance skills.
            </p>
          </div>

          {/* Column 2: Navigations */}
          <div className="md:col-span-3 space-y-3.5">
            <h5 className="text-[15px] font-black  tracking-wider text-gray-100">Navigations</h5>
            <ul className="space-y-2.5 text-md text-gray-100/80">
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
            <h5 className="text-[15px] font-black  tracking-wider text-gray-100">Products</h5>
            <ul className="space-y-2.5 text-md text-gray-100/80">
              <li><a href="#" className="hover:text-white transition-colors">Spell Wizards</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Yugya health</a></li>
            </ul>
          </div>

          {/* Column 4: Socials */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[15px] font-black tracking-wider text-gray-100">Socials</h5>
            <ul className="space-y-2.5 text-md text-gray-100/80">
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter (x)</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10 my-8" />

        {/* Lower Row */}
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[15px] text-gray-200/70 font-medium">
            © 2026 Shankh. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[15px] font-bold text-emerald-200/60">
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