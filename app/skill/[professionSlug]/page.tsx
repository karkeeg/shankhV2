"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { TestCard } from "@/components/skill/TestCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { skillApi } from "@/lib/api";

// ─── TopicSection Component ──────────────────────────────────────────────────

function TopicSection({
  topic,
  tests,
  activeActivityType,
}: {
  topic: { id: string; name: string; description: string | null };
  tests: any[];
  activeActivityType: string | null;
}) {
  const [expanded, setExpanded] = useState(true); // Default open on dedicated page
  
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-300">
      {/* Topic header */}
      <div
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between px-6 py-4 bg-zinc-50/50 hover:bg-zinc-50 border-b border-zinc-100 cursor-pointer transition-colors select-none"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-sm text-zinc-800 tracking-tight leading-snug">
            {topic.name}
          </h3>
          {topic.description && (
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 leading-snug">{topic.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {tests.length} {tests.length === 1 ? "test" : "tests"}
          </span>
          {expanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </div>
      </div>

      {/* Tests list */}
      {expanded && (
        <div className="p-6 flex flex-col gap-6">
          {tests.map((test) => (
            <TestCard 
              key={test.id} 
              test={test} 
              activeActivityType={activeActivityType} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Content Component ────────────────────────────────────────────────────────

function ProfessionTestsPageContent() {
  const router = useRouter();
  const params = useParams();
  const professionSlug = params?.professionSlug as string;
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "case_simulations";

  // Map section from query parameters to activity type
  let activeActivityType: string | null = null;
  if (section === "mcqs") activeActivityType = "mcq";
  else if (section === "framework_drills") activeActivityType = "canvas";
  else if (section === "quant_lab") activeActivityType = "quantus";

  const [topics, setTopics] = useState<any[]>([]);
  const [professionName, setProfessionName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!professionSlug) return;
    setLoading(true);
    try {
      // Fetch profession tests
      const data = await skillApi.professionTests<{ topics?: any[]; profession?: { name?: string } }>(professionSlug);
      setTopics(data?.topics ?? []);
      setProfessionName(data?.profession?.name ?? professionSlug.toUpperCase().replace(/-/g, " "));
    } catch (e) {
      console.error("Failed to load profession tests", e);
    } finally {
      setLoading(false);
    }
  }, [professionSlug]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold">Loading profession tests...</span>
      </div>
    );
  }

  // ── Filter topics and tests by activeActivityType ───────────────────────
  const filteredTopics = topics.map((t) => {
    const filteredTests = t.tests.filter((test: any) => {
      if (!activeActivityType) return true;
      return (test.itemCounts?.[activeActivityType] || 0) > 0;
    });

    return {
      ...t,
      tests: filteredTests,
    };
  }).filter((t) => t.tests.length > 0);

  const totalTestsCount = filteredTopics.flatMap((t) => t.tests).length;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-hidden p-6 gap-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/skill")}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-95 text-[#01696F]"
            title="Back to professions"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-[#01696F] tracking-tight">
              {professionName} Tests
            </h2>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Select an activity type within a test to start or resume your session.
            </p>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors relative shadow-sm active:scale-95">
          <Bell size={18} className="text-[#01696F]" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
        </button>
      </header>

      {/* Topics & Tests list */}
      <div className="flex flex-col gap-6 overflow-auto pb-6">
        {filteredTopics.map((topicData) => (
          <TopicSection 
            key={topicData.topic.id} 
            topic={topicData.topic} 
            tests={topicData.tests} 
            activeActivityType={activeActivityType}
          />
        ))}
        {totalTestsCount === 0 && (
          <div className="py-20 text-center text-zinc-400 font-semibold text-sm">
            No active {activeActivityType ? activeActivityType.toUpperCase() : ""} tests available for this profession yet. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main exported Page component (Suspense Wrapper) ─────────────────────────

export default function ProfessionTestsPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#01696F]">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-sm font-semibold">Loading profession tests...</span>
          </div>
        }
      >
        <ProfessionTestsPageContent />
      </Suspense>
    </MainLayout>
  );
}
