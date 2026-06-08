"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import logo from "@/public/shankhLogo.svg";
import dashImage from "@/public/image.png";

const professionOptions = [
  { value: "Student", label: "Student" },
  { value: "Finance Professional", label: "Finance Professional" },
  { value: "Investor", label: "Investor" },
  { value: "Founder / Entrepreneur", label: "Founder / Entrepreneur" },
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Career Switcher", label: "Career Switcher" },
  { value: "Other", label: "Other" },
];

const levelOptions = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Professional", label: "Professional" },
];

const goalOptions = [
  { value: "Break into Investment Banking", label: "Break into Investment Banking" },
  { value: "Break into Private Equity", label: "Break into Private Equity" },
  { value: "Improve Valuation Skills", label: "Improve Valuation Skills" },
  { value: "Prepare for Interviews", label: "Prepare for Interviews" },
  { value: "Advance My Career", label: "Advance My Career" },
  { value: "Personal Investing", label: "Personal Investing" },
  { value: "Academic Learning", label: "Academic Learning" },
];

const topicOptions = [
  { value: "Financial Statements", label: "Financial Statements" },
  { value: "Financial Analysis", label: "Financial Analysis" },
  { value: "DCF Valuation", label: "DCF Valuation" },
  { value: "M&A Modeling", label: "M&A Modeling" },
  { value: "LBO Modeling", label: "LBO Modeling" },
  { value: "Excel & Modeling Fundamentals", label: "Excel & Modeling Fundamentals" },
];

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form values
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [firstTopic, setFirstTopic] = useState("");
  
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

  // Step 6 Setup effect
  useEffect(() => {
    if (step === 6) {
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
            goal: goal || "Academic Learning",
            firstTopic: firstTopic || "Excel & Modeling Fundamentals",
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
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <Image src={logo} alt="Shankh Logo" width={120} height={40} className="object-contain" />
            
            {step < 6 && (
              <span className="bg-[#EAE8E2] text-zinc-700 font-semibold px-3 py-1.5 rounded-full text-xs transition-all animate-fade-in">
                Step {step} of 6
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
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#1a1a1a]">Enter Unique Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full bg-[#F3F1ED] border-none rounded-xl p-3.5 text-[#1a1a1a] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#01696F] outline-none transition-all"
                      placeholder="johndoe_123"
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
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Your Profession</h1>
                  <p className="text-zinc-500 mb-6">Select your primary role or path</p>
                </div>

                <div className="space-y-3">
                  {professionOptions.map((opt, i) => {
                    const isSelected = profession === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setProfession, 3)}
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
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Your Current Level</h1>
                  <p className="text-zinc-500 mb-6">Rate your general finance & modeling expertise</p>
                </div>

                <div className="space-y-3">
                  {levelOptions.map((opt, i) => {
                    const isSelected = level === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setLevel, 4)}
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
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Your Current Level</h1>
                  <p className="text-zinc-500 mb-6">Select your primary goal on the platform</p>
                </div>

                <div className="space-y-3">
                  {goalOptions.map((opt, i) => {
                    const isSelected = goal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setGoal, 5)}
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
                  <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">What topic would you like to master first?</h1>
                  <p className="text-zinc-500 mb-6">Choose a starting point for your customized track</p>
                </div>

                <div className="space-y-3">
                  {topicOptions.map((opt, i) => {
                    const isSelected = firstTopic === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value, setFirstTopic, 6)}
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
                    onClick={() => setStep(6)}
                    className="w-full bg-[#211E1A] text-white py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Customizing loading screen */}
            {step === 6 && (
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
