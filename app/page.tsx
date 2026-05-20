"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { MainLayout } from "@/components/layout/MainLayout";

// Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AiAssistantSidebar } from "@/components/dashboard/AiAssistantSidebar";
import { ResumeLessonCard } from "@/components/dashboard/ResumeLessonCard";
import { ProgramInfoCard } from "@/components/dashboard/ProgramInfoCard";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { LearningPathOverview } from "@/components/dashboard/LearningPathOverview";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { CategoriesSection } from "@/components/dashboard/CategoriesSection";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || !token) return;

      try {
        // Mock data fetching while backend is rebuilt
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mounted, token]);

  if (!mounted || loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 flex border-[#01696F] border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const AiSidebar = <AiAssistantSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />;

  return (
    <MainLayout rightSidebar={AiSidebar}>
      <div className="p-6 max-w-full mx-auto space-y-6">
        <DashboardHeader isAiOpen={isAiOpen} onOpenAi={() => setIsAiOpen(true)} />

        <ResumeLessonCard />
        <ProgramInfoCard />
        <ProgressOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LearningPathOverview progressPercentage={74} />

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-center">
            <Heatmap />
          </div>
        </div>

        <CategoriesSection />
      </div>
    </MainLayout>
  );
}
