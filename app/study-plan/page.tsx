"use client";

import React, { useEffect, useState } from "react";

import { SplitLayout } from "@/components/layout/SplitLayout";
import { StudyIntroPage } from "@/components/study-plan/StudyIntroPage";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { MainLayout } from "@/components/layout/MainLayout";
import { WorkspaceSidebar } from "@/components/exercise/WorkspaceSidebar";
import { AICoachPanel } from "@/components/exercise/AICoachPanel";
import { WorkspaceSplitLayout } from "@/components/layout/WorkspaceSplitLayout";
import { ExerciseConfig } from "@/types/exercise";
import { useAppStore } from "@/lib/store";





import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  BackendActivityDetail,
  BackendStudyPlanTree,
  mapActivityTypeToTab,
  mapContentToExercise,
  mapDifficultyLabel,
} from "@/lib/backend-content";
// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "sheets" | "mcq" | "canvas";
type PhaseId = "easy" | "medium" | "hard";

type LessonDifficulty = "Easy" | "Medium" | "Hard";

interface SubItemLesson {
  id: string;
  title: string;
  difficulty: LessonDifficulty;
}

interface SubTopic {
  id: string;
  title: string;
  lessons: SubItemLesson[];
}

interface SubItem {
  id: string;
  title: string;
  subTopics: SubTopic[];
}

interface FountainModule {
  title: string;
  description: string;
  subItems: SubItem[];
}

interface FountainCard {
  id: string;
  title: string;
  subtitle: string;
  module: FountainModule;
  difficulty: string;
  duration: string;
  exercise?: ExerciseConfig;
  tab: TabId;
  prerequisites?: string[];
  numPractices?: number;
  /** Sheet tab label for canvas exercises (shown in bottom bar) */
  canvasSheetTab?: string;
}

interface FountainGroup {
  id: string;
  label: string;
  cards: FountainCard[];
}




// ─── Fountain Card ────────────────────────────────────────────────────────────

function FountainCardComponent({
  card,
  onStart,
}: {
  card: FountainCard;
  onStart: (card: FountainCard) => void;
  onSelectActivity: (card: FountainCard, activityId: string, difficulty: LessonDifficulty) => void;
}) {
  // Calculate overall module progress
  const { completedLessons } = useAppStore();
  const allLessonIds = card.module.subItems.flatMap(si => si.subTopics.flatMap(st => st.lessons.map(l => l.id)));
  const completedCount = allLessonIds.filter(id => completedLessons[id]?.completed).length;
  const progressPercent = allLessonIds.length > 0 ? Math.round((completedCount / allLessonIds.length) * 100) : 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#01696F]/5 hover:border-[#01696F]/20 group relative">
      {/* Completion Badge */}
      {progressPercent === 100 && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}

      {/* Card Header */}
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#1a1a1a] tracking-tight group-hover:text-[#01696F] transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">{card.module.description}</p>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 mt-6">
          {card.numPractices && (
            <div className="bg-[#E6F0F1] text-[#01696F] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {card.numPractices} Practices
            </div>
          )}
          <div className="bg-zinc-50 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {card.difficulty}
          </div>
          <div className="bg-zinc-50 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {card.duration}
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Mastery</span>
            <span className="text-xs font-bold text-[#1a1a1a]">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-700 ease-out", progressPercent === 100 ? "bg-emerald-500" : "bg-[#01696F]")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8">
          <button
            onClick={() => onStart(card)}
            className="w-full bg-[#01696F] text-white font-bold text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#01696F]/10 flex items-center justify-center gap-2"
          >
            <span>Resume Learning</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
  );
}


// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs: { id: TabId; label: string }[] = [
  { id: "sheets", label: "Quantus Sheets" },
  { id: "mcq", label: "Multiple Choice Questions" },
  { id: "canvas", label: "Canvas" },
];

const stageTabs: { id: string; label: string }[] = [
  { id: "foundation", label: "Foundation Modules" },
  { id: "applied", label: "Applied Analysis" },
  { id: "integrated", label: "Integrated Cases" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

import { useAuthStore } from "@/lib/auth-store";

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewStep = "list" | "intro" | "exercise";

export default function StudyPlanPage() {
  const token = useAuthStore((state) => state.token);
  const [coachMessage, setCoachMessage] = useState<{
    type: 'hint' | 'correct' | 'incorrect' | 'warning' | 'info';
    content: string;
  } | undefined>();
  const [coachNotes, setCoachNotes] = useState<string | undefined>();

  const handleCoachUpdate = (message?: { type: any, content: string }, notes?: string) => {
    if (message) setCoachMessage(message);
    if (notes) setCoachNotes(notes);
  };

  const [activeStage, setActiveStage] = useState<string>("foundation");
  const [step, setStep] = useState<ViewStep>("list");
  const [selectedCard, setSelectedCard] = useState<FountainCard | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<BackendActivityDetail | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PhaseId>("easy");
  const [previousStep, setPreviousStep] = useState<ViewStep>("list");
  const [runtimeGroups, setRuntimeGroups] = useState<FountainGroup[]>([]);
  const [isLoadingStudyPlan, setIsLoadingStudyPlan] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { setCurrentStudyPlanId, syncProgress, currentStudyPlanId } = useAppStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl || !token || !mounted) return;

    const fetchTree = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        setIsLoadingStudyPlan(true);
        const plansRes = await fetch(`${backendUrl}/api/v1/study-plans`, { headers });
        if (!plansRes.ok) return setRuntimeGroups([]);
        const plansJson = await plansRes.json();
        const plans = (plansJson?.data || []) as any[];
        const targetPlan = plans.find((p: any) => p.slug === "shankh-finance-strategy") || plans[0];
        const targetPlanId = targetPlan?.id as string | undefined;
        if (!targetPlanId) return setRuntimeGroups([]);

        setCurrentStudyPlanId(targetPlanId);
        syncProgress(targetPlanId);

        const treeRes = await fetch(`${backendUrl}/api/v1/study-plans/${targetPlanId}/tree`, { headers });
        if (!treeRes.ok) return setRuntimeGroups([]);
        const treeJson = await treeRes.json();
        const tree = treeJson?.data as BackendStudyPlanTree | undefined;
        if (!tree) return setRuntimeGroups([]);

        const foundationCards: FountainCard[] = [];
        const appliedCards: FountainCard[] = [];
        const integratedCards: FountainCard[] = [];

        tree.modules.forEach((mod) => {
          // 1. Group all activities in the module by Type (sheets, mcq, canvas)
          const typeGroups: Record<TabId, Record<string, SubTopic>> = {
            sheets: {},
            mcq: {},
            canvas: {},
          };

          mod.topics.forEach(topic => {
            topic.levels.forEach(level => {
              level.activities.forEach(activity => {
                const tab = mapActivityTypeToTab(activity.type);

                // Create sub-topic (Level) if it doesn't exist for this tab
                if (!typeGroups[tab][level.id]) {
                  typeGroups[tab][level.id] = {
                    id: level.id,
                    title: level.title,
                    lessons: []
                  };
                }

                typeGroups[tab][level.id].lessons.push({
                  id: activity.id,
                  title: activity.title,
                  difficulty: mapDifficultyLabel(level.difficulty) as any,
                  type: activity.type
                });
              });
            });
          });

          // 2. Convert typeGroups to subItems format
          const subItems: CourseSubItem[] = [];
          if (Object.keys(typeGroups.sheets).length > 0) {
            subItems.push({
              id: "sheets",
              title: "Quantus Sheets",
              subTopics: Object.values(typeGroups.sheets)
            });
          }
          if (Object.keys(typeGroups.mcq).length > 0) {
            subItems.push({
              id: "mcq",
              title: "Multiple Choice Questions",
              subTopics: Object.values(typeGroups.mcq)
            });
          }
          if (Object.keys(typeGroups.canvas).length > 0) {
            subItems.push({
              id: "canvas",
              title: "Canvas",
              subTopics: Object.values(typeGroups.canvas)
            });
          }

          const moduleCard: FountainCard = {
            id: mod.id,
            title: mod.title,
            subtitle: "Module",
            module: {
              title: mod.title,
              description: mod.description || mod.caseContext || "Master this module.",
              subItems: subItems,
            },
            difficulty: "Mixed",
            duration: "Varies",
            numPractices: mod.topics.reduce((acc, t) =>
              acc + t.levels.reduce((a, l) =>
                a + l.activities.filter(act => act.type !== 'lesson').length, 0), 0),
            prerequisites: mod.skillTags,
            tab: subItems[0]?.id || "sheets",
          };

          if (mod.stage === "foundation") foundationCards.push(moduleCard);
          else if (mod.stage === "applied") appliedCards.push(moduleCard);
          else if (mod.stage === "integrated") integratedCards.push(moduleCard);
        });

        const groups: FountainGroup[] = [];
        if (foundationCards.length > 0) {
          groups.push({ id: "foundation", label: "Foundation Modules", cards: foundationCards });
        }
        if (appliedCards.length > 0) {
          groups.push({ id: "applied", label: "Applied Analysis", cards: appliedCards });
        }
        if (integratedCards.length > 0) {
          groups.push({ id: "integrated", label: "Integrated Cases", cards: integratedCards });
        }

        setRuntimeGroups(groups);
      } catch (err) {
        console.error("Failed to process study plan tree:", err);
        setRuntimeGroups([]);
      } finally {
        setIsLoadingStudyPlan(false);
      }
    };

    fetchTree();
  }, [mounted, token]);

  const fetchSelectedActivity = async (activityId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl || !token) return null;
    const res = await fetch(`${backendUrl}/api/v1/activities/${activityId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as BackendActivityDetail) || null;
  };

  // ── handlers ──
  const handleCardStart = (card: FountainCard) => {
    setSelectedCard(card);
    setPreviousStep("list");
    setStep("intro");
  };

  const handleGoToExercise = async (activityId: string, difficulty: LessonDifficulty) => {
    const activity = await fetchSelectedActivity(activityId);
    if (!activity) return;
    setSelectedActivity(activity);
    setSelectedPhase(difficulty.toLowerCase() as PhaseId);
    setPreviousStep(prev => step === "exercise" ? prev : step);
    setStep("exercise");
  };

  const handleDirectSelectActivity = async (card: FountainCard, activityId: string, difficulty: LessonDifficulty) => {
    const activity = await fetchSelectedActivity(activityId);
    if (!activity) return;
    setSelectedCard(card);
    setSelectedActivity(activity);
    setSelectedPhase(difficulty.toLowerCase() as PhaseId);
    setPreviousStep("list");
    setStep("exercise");
  };

  const handleBack = () => {
    if (step === "exercise") {
      setStep(previousStep);
      if (previousStep === "list") {
        setSelectedCard(null);
        setSelectedActivity(null);
      }
    } else if (step === "intro") {
      setStep("list");
      setSelectedCard(null);
      setSelectedActivity(null);
    } else {
      setStep("list");
      setSelectedCard(null);
      setSelectedActivity(null);
    }
  };

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  // ── Step 1: Intro ──
  if (step === "intro" && selectedCard) {
    return (
      <MainLayout>
        <StudyIntroPage
          card={{
            title: selectedCard.title,
            subtitle: selectedCard.subtitle,
            difficulty: selectedCard.difficulty,
            duration: selectedCard.duration,
            module: selectedCard.module,
            prerequisites: selectedCard.prerequisites,
            numPractices: selectedCard.numPractices,
          }}
          onBack={handleBack}
          onNext={() => {
            // Start the first activity if possible
            const firstSubItem = selectedCard.module.subItems[0];
            const firstSubTopic = firstSubItem?.subTopics[0];
            const firstLesson = firstSubTopic?.lessons[0];
            if (firstLesson) {
              handleGoToExercise(firstLesson.id, firstLesson.difficulty);
            }
          }}
          onSelectActivity={(activityId, difficulty) => handleGoToExercise(activityId, difficulty)}
        />
      </MainLayout>
    );
  }

  const handleNextActivity = () => {
    if (!selectedCard || !selectedActivity) return;

    // Flatten all activities in current module to find the next one
    const allActivities = selectedCard.module.subItems.flatMap(si =>
      si.subTopics.flatMap(st => st.lessons)
    );

    const currentIndex = allActivities.findIndex(a => a.id === selectedActivity.id);
    const nextActivity = allActivities[currentIndex + 1];

    if (nextActivity) {
      handleGoToExercise(nextActivity.id, nextActivity.difficulty);
    } else {
      // Done with entire module!
      handleBack();
    }
  };

  const isLastInTopic = () => {
    if (!selectedCard || !selectedActivity) return false;
    const activeSubItem = selectedCard.module.subItems.find(si =>
      si.subTopics.some(st => st.lessons.some(l => l.id === selectedActivity.id))
    );
    const activeSubTopic = activeSubItem?.subTopics.find(st =>
      st.lessons.some(l => l.id === selectedActivity.id)
    );
    if (!activeSubTopic) return false;
    const lastLesson = activeSubTopic.lessons[activeSubTopic.lessons.length - 1];
    return lastLesson.id === selectedActivity.id;
  };

  // ── Step 3: Exercise ──
  if (step === "exercise" && selectedCard && selectedActivity) {
    const backendExercise = mapContentToExercise(selectedActivity);
    // Exercise Workspace View (Sheets, MCQ, Canvas)
    return (
      <MainLayout
        sidebar={
          <WorkspaceSidebar
            onBack={handleBack}
            title={selectedActivity.title}
            explanation={typeof backendExercise.question === 'string' ? backendExercise.question : ""}
            instructions={selectedActivity.instructions || ""}
            caseContext={backendExercise.caseContext}
            difficulty={mapDifficultyLabel(selectedPhase)}
            toolkitElements={backendExercise.canvasDraggableElements}
            activityType={selectedActivity.type}
            lessonId={selectedActivity.id}
            totalSteps={Math.max(backendExercise.tasks?.length || 0, backendExercise.questions?.length || 0, 1)}
            vocabulary={backendExercise.vocabulary}
            formulas={backendExercise.formulas}
            overview={backendExercise.overview}
            learningGoals={backendExercise.learningGoals}
            keyConcepts={backendExercise.keyConcepts}
          />

        }


      >
        <WorkspaceSplitLayout
          mainContent={
            <ExercisePanel
              lessonId={selectedActivity.id}
              exercise={backendExercise}
              studyPlanId={currentStudyPlanId || undefined}
              onCoachUpdate={handleCoachUpdate}
              onNextActivity={handleNextActivity}
              onBackToPlan={handleBack}
              isLastInTopic={isLastInTopic()}
              onGoToMCQ={(() => {
                const item = selectedCard.module.subItems.find(si => si.id === 'mcq');
                const first = item?.subTopics[0]?.lessons[0];
                return first ? () => handleGoToExercise(first.id, first.difficulty) : undefined;
              })()}
              onGoToSheets={(() => {
                const item = selectedCard.module.subItems.find(si => si.id === 'sheets');
                const first = item?.subTopics[0]?.lessons[0];
                return first ? () => handleGoToExercise(first.id, first.difficulty) : undefined;
              })()}
              onGoToCanvas={(() => {
                const item = selectedCard.module.subItems.find(si => si.id === 'canvas');
                const first = item?.subTopics[0]?.lessons[0];
                return first ? () => handleGoToExercise(first.id, first.difficulty) : undefined;
              })()}
            />
          }
          rightSidebarContent={
            <AICoachPanel
              message={coachMessage}
              notes={coachNotes || (typeof backendExercise.caseContext === 'string' ? backendExercise.caseContext : undefined)}
              activityType={selectedActivity.type}
            />
          }
          onBack={handleBack}
          title={selectedActivity.title}
        />


      </MainLayout>
    );
  }



  // Study Plan list view
  return (
    <MainLayout>
      {/* Page title */}
      <div className="px-8 pt-10 pb-6">
        <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight">
          Study Plan
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Choose a path to start building your modeling skills.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="px-8 pb-8">
        <div className="inline-flex items-center bg-white rounded-2xl p-1.5 gap-1 shadow-sm border border-zinc-100">
          {stageTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStage(tab.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                activeStage === tab.id
                  ? "bg-[#01696F] text-white shadow-lg shadow-[#01696F]/20"
                  : "text-zinc-500 hover:text-[#1a1a1a] hover:bg-zinc-50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fountain Groups */}
      <div className="px-8 pb-12 space-y-8">
        {isLoadingStudyPlan && (
          <div className="flex items-center gap-3 text-sm font-bold text-zinc-400">
            <div className="w-4 h-4 border-2 border-[#01696F] border-t-transparent rounded-full animate-spin" />
            Loading study plan...
          </div>
        )}
        {!isLoadingStudyPlan && runtimeGroups.length === 0 && (
          <div className="rounded-3xl border border-amber-100 bg-amber-50 px-6 py-4 text-sm text-amber-900 font-medium">
            Backend study plan is empty or unavailable. Seed/publish content in backend to render this page.
          </div>
        )}
        {(() => {
          if (isLoadingStudyPlan || runtimeGroups.length === 0) return null;

          const activeGroup = runtimeGroups.find(g => g.id === activeStage);
          if (!activeGroup) return <div className="text-sm font-bold text-zinc-400">No modules found for this stage.</div>;

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeGroup.cards.map((card) => (
                <FountainCardComponent
                  key={card.id}
                  card={card}
                  onStart={handleCardStart}
                  onSelectActivity={handleDirectSelectActivity}
                />
              ))}
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
}

