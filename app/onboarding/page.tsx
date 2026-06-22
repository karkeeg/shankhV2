"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/layout/Logo";
import dashImage from "@/public/image.png";

const pathOptions = [
  { value: "Finance", label: "Finance" },
  { value: "Strategy", label: "Strategy" },
  { value: "Operations", label: "Operations" },
  { value: "Founder / Entrepreneur", label: "Founder / Entrepreneur" },
  { value: "General management", label: "General management" },
  { value: "Still Exploring", label: "Still Exploring" },
];

const professionOptions = [
  { value: "Student", label: "Student" },
  { value: "Working professional", label: "Working professional" },
  { value: "Founder / entrepreneur", label: "Founder / entrepreneur" },
  { value: "Career switcher", label: "Career switcher" },
  { value: "Other", label: "Other" },
];

const levelOptions = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Placement-ready / interview-ready", label: "Placement-ready / interview-ready" },
];

const guidanceOptions = [
  { value: "Focus deeply on one path first", label: "Focus deeply on one path first" },
  { value: "Build strength across multiple business paths", label: "Build strength across multiple business paths" },
  { value: "Explore first, then specialize later", label: "Explore first, then specialize later" },
];

type ChoiceOption = { value: string; label: string };
type PathFlow = {
  help: { title: string; options: ChoiceOption[] };
  topics: { title: string; options: ChoiceOption[] };
  roles: { title: string; options: ChoiceOption[] };
};

// Shared flow used by both "General management" and "Founder / Entrepreneur"
const generalManagementFlow: PathFlow = {
  help: {
    title: "What do you want help with right now?",
    options: [
      { value: "Build business fundamentals", label: "Build business fundamentals" },
      { value: "Improve structured thinking", label: "Improve structured thinking" },
      { value: "Prepare for placements", label: "Prepare for placements" },
      { value: "Become job-ready across business roles", label: "Become job-ready across business roles" },
      { value: "Strengthen problem solving across functions", label: "Strengthen problem solving across functions" },
    ],
  },
  topics: {
    title: "Which topics would you like to explore first?",
    options: [
      { value: "Finance basics", label: "Finance basics" },
      { value: "Strategy basics", label: "Strategy basics" },
      { value: "Operations basics", label: "Operations basics" },
      { value: "Structured problem solving", label: "Structured problem solving" },
      { value: "Business communication", label: "Business communication" },
      { value: "Interview preparation", label: "Interview preparation" },
    ],
  },
  roles: {
    title: "Which roles are you most interested in exploring?",
    options: [
      { value: "Finance roles", label: "Finance roles" },
      { value: "Strategy / consulting roles", label: "Strategy / consulting roles" },
      { value: "Operations roles", label: "Operations roles" },
      { value: "General management roles", label: "General management roles" },
      { value: "Still deciding", label: "Still deciding" },
    ],
  },
};

// Path-specific onboarding steps (6, 7, 8) keyed by the path chosen in step 2.
const pathFlows: Record<string, PathFlow> = {
  Finance: {
    help: {
      title: "What do you want help with in finance right now?",
      options: [
        { value: "Break into finance roles", label: "Break into finance roles" },
        { value: "Prepare for finance interviews", label: "Prepare for finance interviews" },
        { value: "Build valuation and modeling skill", label: "Build valuation and modeling skill" },
        { value: "Strengthen accounting and corporate finance basics", label: "Strengthen accounting and corporate finance basics" },
        { value: "Improve investment judgment", label: "Improve investment judgment" },
        { value: "Prepare for finance placements", label: "Prepare for finance placements" },
      ],
    },
    topics: {
      title: "Which finance topics would you like to master first?",
      options: [
        { value: "Financial statements", label: "Financial statements" },
        { value: "Corporate finance basics", label: "Corporate finance basics" },
        { value: "DCF valuation", label: "DCF valuation" },
        { value: "Trading comps and transaction comps", label: "Trading comps and transaction comps" },
        { value: "Financial modeling", label: "Financial modeling" },
        { value: "M&A and LBO basics", label: "M&A and LBO basics" },
        { value: "Investment memo thinking", label: "Investment memo thinking" },
      ],
    },
    roles: {
      title: "Which finance roles are you targeting?",
      options: [
        { value: "Financial analyst", label: "Financial analyst" },
        { value: "Investment banking", label: "Investment banking" },
        { value: "Private equity / venture capital", label: "Private equity / venture capital" },
        { value: "Equity research", label: "Equity research" },
        { value: "Corporate finance", label: "Corporate finance" },
        { value: "FP&A / controllership", label: "FP&A / controllership" },
        { value: "CFO track", label: "CFO track" },
        { value: "Other finance roles", label: "Other finance roles" },
      ],
    },
  },
  Strategy: {
    help: {
      title: "What do you want help with in strategy right now?",
      options: [
        { value: "Break into consulting", label: "Break into consulting" },
        { value: "Prepare for case interviews", label: "Prepare for case interviews" },
        { value: "Improve structured problem solving", label: "Improve structured problem solving" },
        { value: "Learn market entry and growth strategy", label: "Learn market entry and growth strategy" },
        { value: "Improve business judgment for strategy roles", label: "Improve business judgment for strategy roles" },
        { value: "Prepare for strategy placements", label: "Prepare for strategy placements" },
      ],
    },
    topics: {
      title: "Which strategy topics would you like to master first?",
      options: [
        { value: "Market entry", label: "Market entry" },
        { value: "Growth strategy", label: "Growth strategy" },
        { value: "Profitability analysis", label: "Profitability analysis" },
        { value: "Pricing strategy", label: "Pricing strategy" },
        { value: "Competitive strategy", label: "Competitive strategy" },
        { value: "GTM and expansion strategy", label: "GTM and expansion strategy" },
        { value: "Case structuring and issue trees", label: "Case structuring and issue trees" },
      ],
    },
    roles: {
      title: "Which strategy roles are you targeting?",
      options: [
        { value: "Management consulting", label: "Management consulting" },
        { value: "Corporate strategy", label: "Corporate strategy" },
        { value: "Business analyst", label: "Business analyst" },
        { value: "Founder's office", label: "Founder's office" },
        { value: "Growth strategy", label: "Growth strategy" },
        { value: "Category strategy", label: "Category strategy" },
        { value: "CEO office / special projects", label: "CEO office / special projects" },
        { value: "Other strategy roles", label: "Other strategy roles" },
      ],
    },
  },
  Operations: {
    help: {
      title: "What do you want help with in operations right now?",
      options: [
        { value: "Break into operations roles", label: "Break into operations roles" },
        { value: "Prepare for operations interviews", label: "Prepare for operations interviews" },
        { value: "Learn supply chain and process improvement", label: "Learn supply chain and process improvement" },
        { value: "Improve analytical problem solving for operations", label: "Improve analytical problem solving for operations" },
        { value: "Prepare for operations placements", label: "Prepare for operations placements" },
        { value: "Build execution and process judgment", label: "Build execution and process judgment" },
      ],
    },
    topics: {
      title: "Which operations topics would you like to master first?",
      options: [
        { value: "Supply chain strategy", label: "Supply chain strategy" },
        { value: "Process improvement", label: "Process improvement" },
        { value: "Capacity and throughput", label: "Capacity and throughput" },
        { value: "Inventory management", label: "Inventory management" },
        { value: "Network design", label: "Network design" },
        { value: "Procurement and sourcing", label: "Procurement and sourcing" },
        { value: "Service operations", label: "Service operations" },
      ],
    },
    roles: {
      title: "Which operations roles are you targeting?",
      options: [
        { value: "Supply chain manager", label: "Supply chain manager" },
        { value: "Operations manager", label: "Operations manager" },
        { value: "Procurement / sourcing", label: "Procurement / sourcing" },
        { value: "Logistics and distribution", label: "Logistics and distribution" },
        { value: "Manufacturing operations", label: "Manufacturing operations" },
        { value: "Program / process excellence", label: "Program / process excellence" },
        { value: "Business operations", label: "Business operations" },
        { value: "Other operations roles", label: "Other operations roles" },
      ],
    },
  },
  // Founder / Entrepreneur shares the General management flow (see generalManagementFlow below)
  "General management": generalManagementFlow,
  "Founder / Entrepreneur": generalManagementFlow,
  "Still Exploring": {
    help: {
      title: "What would you like to figure out first?",
      options: [
        { value: "Which business path fits me best", label: "Which business path fits me best" },
        { value: "Which roles match my strengths", label: "Which roles match my strengths" },
        { value: "Build core business skills first", label: "Build core business skills first" },
        { value: "Prepare for placements broadly", label: "Prepare for placements broadly" },
        { value: "Explore finance, strategy, and operations", label: "Explore finance, strategy, and operations" },
      ],
    },
    topics: {
      title: "Which areas sound most interesting right now?",
      options: [
        { value: "Finance", label: "Finance" },
        { value: "Strategy", label: "Strategy" },
        { value: "Operations", label: "Operations" },
        { value: "General management", label: "General management" },
        { value: "Problem solving and cases", label: "Problem solving and cases" },
      ],
    },
    roles: {
      title: "Which roles are you curious about?",
      options: [
        { value: "Consulting", label: "Consulting" },
        { value: "Finance", label: "Finance" },
        { value: "Operations", label: "Operations" },
        { value: "Corporate strategy", label: "Corporate strategy" },
        { value: "General management", label: "General management" },
        { value: "Not sure yet", label: "Not sure yet" },
      ],
    },
  },
};

// Step where the customizing/loading screen runs. Path-specific steps (6-8) sit before it.
const LOADING_STEP = 9;

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form values
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [path, setPath] = useState("");
  const [profession, setProfession] = useState("");
  const [level, setLevel] = useState("");
  const [guidance, setGuidance] = useState("");
  // Path-specific answers (steps 6-8), driven by the path chosen in step 2
  const [helpGoal, setHelpGoal] = useState("");
  const [topicFocus, setTopicFocus] = useState("");
  const [targetRole, setTargetRole] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Step 6 animations state
  const [setupProgress, setSetupProgress] = useState(0);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const onboard = useAuthStore((state) => state.onboard);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard for SSR/client mismatch
    setMounted(true);
  }, []);

  useEffect(() => {
    // Prefill name from the persisted auth store once it hydrates
    if (user?.name && !name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from async store
      setName(user.name);
    }
  }, [user, name]);

  // Handle auto-progression on choice selection
  const handleSelectOption = (value: string, setter: (val: string) => void, nextStep: number) => {
    setter(value);
    setTimeout(() => {
      setStep(nextStep);
    }, 250);
  };

  // Loading/setup step effect
  useEffect(() => {
    if (step === LOADING_STEP) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset status when entering the submission step
      setError("");
      setLoading(true);
      
      // Progress simulation
      const interval = setInterval(() => {
        setSetupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      // Checklist item timing
      const timeout1 = setTimeout(() => setCheckedItems((prev) => [...prev, 0]), 500);
      const timeout2 = setTimeout(() => setCheckedItems((prev) => [...prev, 1]), 1100);
      const timeout3 = setTimeout(() => setCheckedItems((prev) => [...prev, 2]), 1700);
      const timeout4 = setTimeout(() => setCheckedItems((prev) => [...prev, 3]), 2300);

      const submitTimeout = setTimeout(async () => {
        try {
          await onboard({
            name: name || user?.name || "Learner",
            username: username || `user_${Math.random().toString(36).substr(2, 9)}`,
            phone: phone || undefined,
            profession: profession || "Other",
            level: level || "Beginner",
            goal: guidance || "Explore first, then specialize later",
            firstTopic: path || "Still Exploring",
          });
          router.push("/");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Onboarding failed. Please review your details.");
          setLoading(false);
          setStep(1); // Go back to details to let user fix username/details
        }
      }, 2700);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        clearTimeout(submitTimeout);
      };
    }
  }, [step]);

  if (!mounted) return <div className="min-h-screen bg-white" />;

  const getLetter = (index: number) => String.fromCharCode(65 + index);

  // The path chosen in step 2 decides whether the tailored steps 6-8 are shown
  const currentFlow = pathFlows[path];
  const hasExtraSteps = !!currentFlow;
  const afterGuidanceStep = hasExtraSteps ? 6 : LOADING_STEP;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (username.trim() && username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSkipStep1 = () => {
    setError("");
    setStep(2);
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Left Column: Flow Content */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="w-full max-w-[500px] mx-auto min-h-full flex flex-col p-8 md:p-12">
          
          {/* Top Header Logo */}
          <div className="flex items-center justify-between">
            <Logo variant="full" width={180} height={40} className="object-contain" />
            
            {step !== LOADING_STEP && (
              <span className="bg-[#EAE8E2] text-zinc-700 font-semibold px-3 py-1.5 rounded-full text-xs transition-all animate-fade-in">
                Step {step}
              </span>
            )}
          </div>

          <div className="my-auto py-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 mb-6 transition-all">
                {error}
              </div>
            )}

            {/* STEP 1: Details */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Your Details</h1>
                  <p className="text-zinc-500 mb-6">Let us get to know you better</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#1a1a1a]">Enter Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                      placeholder="Shankh world"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#1a1a1a]">Enter Unique Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                      placeholder="shankh_world "
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#1a1a1a]">Contact Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    type="submit"
                    className="w-full bg-[#01696F] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipStep1}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Profession */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-4"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Which path best matches what you want to build expertise in right now?</h1>
                  <p className="text-zinc-500 mb-6">Pick the area you&apos;re most drawn to</p>
                </div>

                <div className="space-y-3">
                  {pathOptions.map((opt, i) => {
                    const isSelected = path === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setPath, 3)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-semibold border-none transition-all active:scale-[0.99] ${
                          isSelected
                            ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/10"
                            : "bg-[#F3F1ED] text-[#1a1a1a] hover:bg-[#eae8e2]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected ? "bg-white text-[#01696F]" : "bg-white text-zinc-500"
                            }`}
                          >
                            {getLetter(i)}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} className="text-[#01696F] stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Current Level */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-4"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">What best describes you today?</h1>
                  <p className="text-zinc-500 mb-6">Select the option that fits you best</p>
                </div>

                <div className="space-y-3">
                  {professionOptions.map((opt, i) => {
                    const isSelected = profession === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setProfession, 4)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-semibold border-none transition-all active:scale-[0.99] ${
                          isSelected
                            ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/10"
                            : "bg-[#F3F1ED] text-[#1a1a1a] hover:bg-[#eae8e2]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected ? "bg-white text-[#01696F]" : "bg-white text-zinc-500"
                            }`}
                          >
                            {getLetter(i)}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} className="text-[#01696F] stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(4)}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Goals */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-4"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">What is your current level?</h1>
                  <p className="text-zinc-500 mb-6">Rate your general finance & modeling expertise</p>
                </div>

                <div className="space-y-3">
                  {levelOptions.map((opt, i) => {
                    const isSelected = level === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setLevel, 5)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-semibold border-none transition-all active:scale-[0.99] ${
                          isSelected
                            ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/10"
                            : "bg-[#F3F1ED] text-[#1a1a1a] hover:bg-[#eae8e2]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected ? "bg-white text-[#01696F]" : "bg-white text-zinc-500"
                            }`}
                          >
                            {getLetter(i)}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} className="text-[#01696F] stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(5)}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Target Topic */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-4"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">How would you like Shankh to guide your learning?</h1>
                  <p className="text-zinc-500 mb-6">Choose the approach that suits you best</p>
                </div>

                <div className="space-y-3">
                  {guidanceOptions.map((opt, i) => {
                    const isSelected = guidance === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setGuidance, afterGuidanceStep)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-semibold border-none transition-all active:scale-[0.99] ${
                          isSelected
                            ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/10"
                            : "bg-[#F3F1ED] text-[#1a1a1a] hover:bg-[#eae8e2]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isSelected ? "bg-white text-[#01696F]" : "bg-white text-zinc-500"
                            }`}
                          >
                            {getLetter(i)}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check size={14} className="text-[#01696F] stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setStep(afterGuidanceStep)}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STEPS 6-8: Path-specific questions (Finance / Strategy / ...) */}
            {hasExtraSteps && (step === 6 || step === 7 || step === 8) && (() => {
              const config =
                step === 6 ? currentFlow.help : step === 7 ? currentFlow.topics : currentFlow.roles;
              const selected =
                step === 6 ? helpGoal : step === 7 ? topicFocus : targetRole;
              const setSelected =
                step === 6 ? setHelpGoal : step === 7 ? setTopicFocus : setTargetRole;
              const backStep = step - 1;
              const nextStep = step === 8 ? LOADING_STEP : step + 1;
              return (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <button
                      onClick={() => setStep(backStep)}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-800 text-sm font-medium mb-4"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">{config.title}</h1>
                  </div>

                  <div className="space-y-3">
                    {config.options.map((opt, i) => {
                      const isSelected = selected === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelectOption(opt.value, setSelected, nextStep)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-semibold border-none transition-all active:scale-[0.99] ${
                            isSelected
                              ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/10"
                              : "bg-[#F3F1ED] text-[#1a1a1a] hover:bg-[#eae8e2]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isSelected ? "bg-white text-[#01696F]" : "bg-white text-zinc-500"
                              }`}
                            >
                              {getLetter(i)}
                            </span>
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                              <Check size={14} className="text-[#01696F] stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setStep(nextStep)}
                      className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* LOADING: Customizing loading screen */}
            {step === LOADING_STEP && (
              <div className="space-y-8 py-8 animate-fade-in">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-2">Preparing your customized path...</h1>
                  <p className="text-zinc-500">Optimizing core modules and curriculum configurations</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 pt-4">
                  <div className="h-2 w-full bg-[#F3F1ED] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#01696F] rounded-full transition-all duration-150"
                      style={{ width: `${setupProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-500">
                    <span>Configuring Workspace</span>
                    <span>{setupProgress}%</span>
                  </div>
                </div>

                {/* Steps Checklist */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  {[
                    "Saving your professional profile...",
                    "Curating specific industry drills...",
                    "Analyzing your experience level...",
                    "Almost ready! Preparing dashboard...",
                  ].map((text, index) => {
                    const isChecked = checkedItems.includes(index);
                    const isCurrent = checkedItems.length === index;
                    return (
                      <div
                        key={text}
                        className={`flex items-center gap-3 transition-all duration-300 ${
                          isChecked
                            ? "text-[#01696F] font-semibold"
                            : isCurrent
                            ? "text-zinc-800 font-semibold"
                            : "text-zinc-400"
                        }`}
                      >
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-full bg-[#01696F] flex items-center justify-center shrink-0">
                            <Check size={12} className="text-white stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <Loader2 size={20} className="text-[#01696F] animate-spin shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-zinc-200 shrink-0" />
                        )}
                        <span className="text-sm">{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Right Column: Promotional panel */}
      <div className="hidden lg:flex flex-1 bg-[#01696F] relative flex-col justify-center pt-24 pl-16 xl:pl-24 overflow-hidden">
        <div className="relative z-10 max-w-[600px] pr-12">
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">Build recruiter-grade judgment, not just notes.</h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-[500px]">
            Simulated learning across finance, strategy, and operations for consulting, private equity, and investment banking readiness.
          </p>
        </div>
        <div className="relative flex-1 w-full">
          <div className="absolute bottom-0 right-0 w-[130%] h-[90%]">
            <Image
              src={dashImage}
              alt="Dashboard Preview"
              fill
              className="object-contain object-right-bottom rounded-tl-[40px] shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
