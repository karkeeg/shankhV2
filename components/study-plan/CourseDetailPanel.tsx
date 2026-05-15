"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconOne = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M19.2539 3.37783C19.2539 3.28824 19.2183 3.20232 19.1549 3.13897C19.0916 3.07563 19.0057 3.04004 18.9161 3.04004H9.45808C8.47263 3.04004 7.52754 3.43151 6.83072 4.12833C6.1339 4.82515 5.74243 5.77024 5.74243 6.75569V25.6717C5.74243 26.6572 6.1339 27.6023 6.83072 28.2991C7.52754 28.9959 8.47263 29.3874 9.45808 29.3874H22.9695C23.955 29.3874 24.9001 28.9959 25.5969 28.2991C26.2937 27.6023 26.6852 26.6572 26.6852 25.6717V12.3589C26.6852 12.2693 26.6496 12.1834 26.5862 12.12C26.5229 12.0567 26.437 12.0211 26.3474 12.0211H20.2672C19.9985 12.0211 19.7407 11.9143 19.5507 11.7243C19.3606 11.5343 19.2539 11.2765 19.2539 11.0077V3.37783ZM20.2672 16.5515C20.536 16.5515 20.7938 16.6583 20.9838 16.8483C21.1738 17.0383 21.2806 17.2961 21.2806 17.5648C21.2806 17.8336 21.1738 18.0914 20.9838 18.2814C20.7938 18.4714 20.536 18.5782 20.2672 18.5782H12.1604C11.8916 18.5782 11.6339 18.4714 11.4438 18.2814C11.2538 18.0914 11.147 17.8336 11.147 17.5648C11.147 17.2961 11.2538 17.0383 11.4438 16.8483C11.6339 16.6583 11.8916 16.5515 12.1604 16.5515H20.2672ZM20.2672 21.9561C20.536 21.9561 20.7938 22.0628 20.9838 22.2529C21.1738 22.4429 21.2806 22.7007 21.2806 22.9694C21.2806 23.2382 21.1738 23.4959 20.9838 23.686C20.7938 23.876 20.536 23.9828 20.2672 23.9828H12.1604C11.8916 23.9828 11.6339 23.876 11.4438 23.686C11.2538 23.4959 11.147 23.2382 11.147 22.9694C11.147 22.7007 11.2538 22.4429 11.4438 22.2529C11.6339 22.0628 11.8916 21.9561 12.1604 21.9561H20.2672Z" fill="currentColor"/>
    <path d="M21.2805 3.81559C21.2805 3.56697 21.5413 3.40889 21.7345 3.56427C21.8984 3.69668 22.0439 3.85072 22.1709 4.02636L26.2419 9.69712C26.3338 9.82683 26.2338 9.99437 26.0744 9.99437H21.6183C21.5287 9.99437 21.4428 9.95878 21.3795 9.89544C21.3161 9.83209 21.2805 9.74617 21.2805 9.65659V3.81559Z" fill="currentColor"/>
  </svg>
);

const IconTwo = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16.2138 2.70227C23.6762 2.70227 29.7253 8.75135 29.7253 16.2137C29.7253 23.6761 23.6762 29.7252 16.2138 29.7252C8.75147 29.7252 2.70239 23.6761 2.70239 16.2137C2.70239 8.75135 8.75147 2.70227 16.2138 2.70227ZM16.2138 8.10685C15.8555 8.10685 15.5118 8.2492 15.2584 8.50259C15.0051 8.75598 14.8627 9.09965 14.8627 9.458V16.2137C14.8628 16.572 15.0052 16.9157 15.2586 17.169L19.312 21.2224C19.5668 21.4685 19.9081 21.6047 20.2624 21.6016C20.6167 21.5986 20.9556 21.4565 21.2061 21.206C21.4566 20.9554 21.5987 20.6166 21.6018 20.2623C21.6048 19.908 21.4687 19.5667 21.2225 19.3119L17.565 15.6543V9.458C17.565 9.09965 17.4226 8.75598 17.1692 8.50259C16.9159 8.2492 16.5722 8.10685 16.2138 8.10685Z" fill="currentColor"/>
  </svg>
);

const IconThree = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M27.0228 18.5782C27.0228 18.3095 26.9161 18.0517 26.726 17.8617C26.536 17.6716 26.2782 17.5649 26.0095 17.5649H21.956C21.6873 17.5649 21.4295 17.6716 21.2395 17.8617C21.0494 18.0517 20.9427 18.3095 20.9427 18.5782V27.6985H18.916V5.74235C18.916 4.75871 18.9133 4.12097 18.8511 3.65348C18.7917 3.21435 18.6957 3.07654 18.6187 2.99952C18.5417 2.92251 18.4039 2.82658 17.9648 2.76713C17.4959 2.70497 16.8595 2.70227 15.8759 2.70227C14.8923 2.70227 14.2545 2.70497 13.787 2.76713C13.3479 2.82658 13.2101 2.92251 13.1331 2.99952C13.056 3.07654 12.9601 3.21435 12.9007 3.65348C12.8385 4.12232 12.8358 4.75871 12.8358 5.74235V27.6985H10.8091V11.8225C10.8091 11.5537 10.7023 11.296 10.5123 11.1059C10.3222 10.9159 10.0645 10.8091 9.79573 10.8091H5.7423C5.47354 10.8091 5.21578 10.9159 5.02574 11.1059C4.8357 11.296 4.72894 11.5537 4.72894 11.8225V27.6985H2.36443C2.09567 27.6985 1.83792 27.8052 1.64788 27.9953C1.45784 28.1853 1.35107 28.4431 1.35107 28.7118C1.35107 28.9806 1.45784 29.2383 1.64788 29.4284C1.83792 29.6184 2.09567 29.7252 2.36443 29.7252H29.3873C29.6561 29.7252 29.9138 29.6184 30.1039 29.4284C30.2939 29.2383 30.4007 28.9806 30.4007 28.7118C30.4007 28.4431 30.2939 28.1853 30.1039 27.9953C29.9138 27.8052 29.6561 27.6985 29.3873 27.6985H27.0228V18.5782Z" fill="currentColor"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabId = "sheets" | "mcq" | "canvas";
export type LessonDifficulty = "Easy" | "Medium" | "Hard";

export interface SubItemLesson {
  id: string;
  title: string;
  difficulty: LessonDifficulty;
  type: "mcq" | "spreadsheet" | "canvas" | "decision" | "lesson" | "aiPack" | "basic_input";
}

export interface SubTopic {
  id: string;
  title: string;
  lessons: SubItemLesson[];
}

export interface CourseSubItem {
  id: string; // Type ID (sheets, mcq, canvas)
  title: string;
  subTopics: SubTopic[];
}

export interface CourseDetailCardProps {
  title: string;
  subtitle: string;
  difficulty: string;
  duration: string;
  module: {
    title: string;
    description: string;
    subItems: CourseSubItem[];
  };
  prerequisites?: string[];
  numPractices?: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "sheets", label: "Quantus Sheets" },
  { id: "mcq", label: "Multiple Choice Questions" },
  { id: "canvas", label: "Canvas" },
];

// ─── Sub-Topic Section (Expandable) ───────────────────────────────────────────

function SubTopicSection({
  topic,
  onSelectActivity,
  activeTab,
}: {
  topic: SubTopic;
  onSelectActivity: (activityId: string, difficulty: LessonDifficulty) => void;
  activeTab: TabId;
}) {
  const [open, setOpen] = useState(true);
  const { completedLessons } = useAppStore();

  const lessons = topic.lessons.filter(l => l.type !== "lesson");
  const isTopicDone = lessons.length > 0 && lessons.every(l => completedLessons[l.id]?.completed);

  return (
    <div className={cn(
      "bg-white rounded-xl border overflow-hidden shadow-sm transition-all",
      isTopicDone ? "border-emerald-200" : "border-zinc-200"
    )}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          isTopicDone ? "bg-emerald-50/50 hover:bg-emerald-100/50" : "bg-zinc-50/50 hover:bg-zinc-100/50"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isTopicDone ? "bg-emerald-500" : "bg-zinc-400"
          )} />
          <span className="font-bold text-sm text-zinc-900 tracking-tight flex items-center gap-2">
            {activeTab === 'mcq' && topic.title === 'Core Practice' ? 'Module Foundation' : topic.title}
            {isTopicDone && (
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md ml-1">
                Completed
              </span>
            )}
          </span>
        </div>
        <ChevronUp
          size={14}
          className={cn(
            "text-zinc-400 transition-transform duration-300",
            open ? "rotate-0" : "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="p-2 flex flex-col gap-1 bg-white">
          {topic.lessons.filter(l => l.type !== "lesson").map((lesson) => {
            const isLessonDone = completedLessons[lesson.id]?.completed;
            return (
              <button
                key={lesson.id}
                onClick={() => onSelectActivity(lesson.id, lesson.difficulty)}
                className={cn(
                  "w-full flex items-center justify-between transition-all px-3 py-3 rounded-lg text-left group",
                  isLessonDone ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "hover:bg-zinc-50 active:scale-[0.99]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors border",
                    isLessonDone 
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-zinc-100 text-zinc-500 border-zinc-200 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900"
                  )}>
                    {isLessonDone ? "✓" : (lesson.type === "lesson" ? "📖" : lesson.title.slice(0, 1))}
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors",
                    isLessonDone ? "text-emerald-700" : "text-zinc-700 group-hover:text-zinc-900"
                  )}>
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.type === 'lesson' && (
                    <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 border border-blue-100">
                      Lesson
                    </span>
                  )}
                  {lesson.type !== "lesson" && !isLessonDone && (
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 border",
                        lesson.difficulty === "Easy" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        lesson.difficulty === "Medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                      )}
                    >
                      {lesson.difficulty}
                    </span>
                  )}
                  {isLessonDone && (
                    <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Done
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseDetailPanel({
  card,
  onStart,
  onSelectActivity,
}: {
  card: CourseDetailCardProps;
  onStart?: () => void;
  onSelectActivity?: (activityId: string, difficulty: LessonDifficulty) => void;
}) {
  const { completedLessons } = useAppStore();

  const availableTabs = TABS.filter(t => 
    card.module.subItems.some(si => si.id === t.id)
  );

  const [activeTab, setActiveTab] = useState<TabId>(
    availableTabs.length > 0 ? availableTabs[0].id : "sheets"
  );

  const activeSubItem = card.module.subItems.find(si => si.id === activeTab);

  const allLessons = card.module.subItems.flatMap((s) => s.subTopics.flatMap(st => st.lessons));
  const practiceLessons = allLessons.filter(l => l.type !== "lesson");
  
  const totalLessons = card.numPractices ?? practiceLessons.length;
  const completedCount = practiceLessons.filter(
    (l) => completedLessons[l.id]?.completed,
  ).length;
  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto px-8 py-8 space-y-8 bg-[var(--background)]">
      {/* ── Header ── */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#1a1a1a] leading-tight tracking-tight">
          {card.title}
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed font-medium">
          {card.module.description}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="bg-white rounded-3xl border border-zinc-100 px-6 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E6F0F1] rounded-xl flex items-center justify-center shrink-0">
            <IconThree className="text-[#01696F]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Skill Level</p>
            <p className="text-sm font-bold text-[#1a1a1a]">{card.difficulty}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-zinc-100 mx-4" />

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E6F0F1] rounded-xl flex items-center justify-center shrink-0">
            <IconTwo className="text-[#01696F]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Time</p>
            <p className="text-sm font-bold text-[#1a1a1a]">{card.duration}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-zinc-100 mx-4" />

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E6F0F1] rounded-xl flex items-center justify-center shrink-0">
            <IconOne className="text-[#01696F]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{activeTab === "mcq" ? "Knowledge Units" : "Practices"}</p>
            <p className="text-sm font-bold text-[#1a1a1a]">{totalLessons}</p>
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">{activeTab === "mcq" ? "Knowledge Progress" : "Module Progress"}</span>
          <span className="text-xs font-bold text-zinc-500">{completedCount}/{totalLessons} Complete</span>
        </div>
        <div className="w-full bg-white border border-zinc-100 rounded-full h-8 relative overflow-hidden shadow-sm">
          <div
            className="h-full bg-[#01696F] rounded-full flex items-center justify-center transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(progressPct, 15)}%` }}
          >
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {progressPct}% {activeTab === "mcq" ? "Complete" : "Mastered"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Practice Tree View ── */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-xl shadow-[#01696F]/5">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">{activeTab === "mcq" ? "Knowledge Hierarchy" : "Practice Hierarchy"}</h2>
            <p className="text-sm text-zinc-400 font-medium">Toggle by type to view sub-topics and levels.</p>
          </div>
          <button
            onClick={onStart}
            className="shrink-0 bg-[#01696F] text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#01696F]/20"
          >
            RESUME
          </button>
        </div>

        <div className="space-y-8">
          {availableTabs.length > 1 && (
            <div className="flex p-1.5 bg-zinc-50 rounded-2xl gap-1">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                    activeTab === tab.id
                      ? "bg-white text-[#01696F] shadow-sm border border-zinc-100"
                      : "text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-6">
            {activeSubItem?.subTopics
              .filter(st => st.lessons.some(l => l.type !== "lesson"))
              .map((subTopic) => (
              <SubTopicSection
                key={subTopic.id}
                topic={subTopic}
                activeTab={activeTab}
                onSelectActivity={onSelectActivity || (() => { })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
