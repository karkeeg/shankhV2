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

  const [dashboardData, setDashboardData] = useState<any>({
    streak: 0,
    simulations: 0,
    completedDates: [],
    modulesProgress: [],
    overallProgressPct: 0,
    resumeLesson: null,
  });
  const [resumeLessonTarget, setResumeLessonTarget] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!mounted || !token) return;

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/progress/me/dashboard`, { headers });
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setDashboardData(data);

            // Determine resume target based on sessionStorage vs fallback to Today's Lessons (resumeLesson from DB)
            const sessionLast = sessionStorage.getItem("shankh:lastLesson");
            if (sessionLast) {
              setResumeLessonTarget(JSON.parse(sessionLast));
            } else {
              const sessionToday = sessionStorage.getItem("shankh:todaysLesson");
              if (sessionToday) {
                setResumeLessonTarget(JSON.parse(sessionToday));
              } else if (data.resumeLesson) {
                sessionStorage.setItem("shankh:todaysLesson", JSON.stringify(data.resumeLesson));
                setResumeLessonTarget(data.resumeLesson);
              }
            }
          }
        }
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

        <ResumeLessonCard lesson={resumeLessonTarget} />
        {/* <ProgramInfoCard /> */}
        <ProgressOverview modules={dashboardData.modulesProgress} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <LearningPathOverview 
            progressPercentage={dashboardData.overallProgressPct} 
            streak={dashboardData.streak} 
            simulations={dashboardData.simulations} 
          />

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center justify-center">
            <Heatmap completedDates={dashboardData.completedDates} />
          </div>
        </div>

        <CategoriesSection />
      </div>
    </MainLayout>
  );
}
