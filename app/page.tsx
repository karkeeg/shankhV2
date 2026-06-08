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
import { DashboardSkeleton } from "@/components/ui/Skeletons";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(false);
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
        } else {
          setDashboardError(true);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setDashboardError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mounted, token]);

  if (!mounted || loading) {
    return <DashboardSkeleton />;
  }

  if (dashboardError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-zinc-500">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="font-semibold text-zinc-700">Failed to load dashboard</p>
          <p className="text-xs text-zinc-400 text-center max-w-xs">Check your connection and try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#01696F] text-white text-sm font-bold rounded-xl hover:bg-[#01696F]/90 transition-all active:scale-95"
          >
            Retry
          </button>
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

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex items-center justify-center">
            <Heatmap completedDates={dashboardData.completedDates} />
          </div>
        </div>

        <CategoriesSection professions={dashboardData.professionsProgress || []} />
      </div>
    </MainLayout>
  );
}
