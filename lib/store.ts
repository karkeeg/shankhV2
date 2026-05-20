import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./auth-store";

interface UserLessonState {
  completed: boolean;
  score?: number;
  checkCount?: number;
  hintsUsedCount?: number;
  lastCanvasElements?: unknown[];
  answers?: any[];
  cells?: Record<string, unknown>;
}

interface AppState {
  xp: number;
  mastery: number;
  independenceScore: number;
  skillRadar: { name: string; value: number }[];
  completedLessons: Record<string, UserLessonState>;
  currentStudyPlanId: string | null;
  setCurrentStudyPlanId: (id: string) => void;
  markLessonComplete: (lessonId: string, payload?: Partial<UserLessonState> & { studyPlanId?: string }) => Promise<void>;
  updateAttempt: (lessonId: string, payload: Partial<UserLessonState> & { studyPlanId?: string, status?: "in_progress" | "graded" | "submitted" }) => Promise<void>;
  saveCanvasState: (lessonId: string, elements: unknown[]) => void;
  logEvent: (event: string, payload?: unknown) => Promise<void>;
  syncProgress: (studyPlanId?: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      xp: 0,
      mastery: 0,
      independenceScore: 100,
      skillRadar: [],
      completedLessons: {},
      currentStudyPlanId: null,

      setCurrentStudyPlanId: (id) => set({ currentStudyPlanId: id }),
      
      markLessonComplete: async (lessonId, payload) => {
        await get().updateAttempt(lessonId, { ...payload, status: "graded" });
      },

      updateAttempt: async (lessonId, payload) => {
        const state = get();
        const token = useAuthStore.getState().token;
        const studyPlanId = payload?.studyPlanId || state.currentStudyPlanId;
        
        // Local update
        set((state) => ({
          completedLessons: {
            ...state.completedLessons,
            [lessonId]: {
              ...state.completedLessons[lessonId],
              ...payload,
              completed: payload.status === "graded" || state.completedLessons[lessonId]?.completed || false
            }
          }
        }));

        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;
          const createRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/attempts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ activityId: lessonId }),
          });
          const createJson = await createRes.json();
          const attemptId = createJson?.data?.attemptId;
          if (!createRes.ok || !attemptId) {
            throw new Error(createJson?.error || 'Unable to create attempt');
          }

          const submitRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              activityId: lessonId,
              answers: payload.answers || state.completedLessons[lessonId]?.answers || [],
              cells: payload.cells || {},
              canvasData: payload.lastCanvasElements || {},
              hintsUsed: payload?.hintsUsedCount ?? state.completedLessons[lessonId]?.hintsUsedCount ?? 0,
              status: payload.status || 'in_progress',
            }),
          });

          if (submitRes.ok) {
             const { data } = await submitRes.json();
             if (data) {
               set({
                 xp: data.progress?.totalXP || 0,
                 mastery: data.progress?.mastery || 0,
                 independenceScore: data.progress?.independenceScore || 0,
                 skillRadar: data.progress?.skillRadar || [],
               });
             }
          }
        } catch (err) {
          console.error("Failed to update progress:", err);
        }
      },

      syncProgress: async (studyPlanId) => {
        const token = useAuthStore.getState().token;
        const id = studyPlanId || get().currentStudyPlanId;
        const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/progress`);
        if (id) url.searchParams.append("studyPlanId", id);

        try {
          const res = await fetch(url.toString(), {
            headers: { 
              'Authorization': token ? `Bearer ${token}` : ""
            }
          });
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              set({
                xp: data.totalXP,
                mastery: data.mastery,
                independenceScore: data.independenceScore,
                skillRadar: data.skillRadar
              });
            }
          }
        } catch (err) {
          console.error("Sync progress failed:", err);
        }
      },

      saveCanvasState: (lessonId, elements) => {
        get().updateAttempt(lessonId, { 
          lastCanvasElements: elements,
          answers: [{ type: "canvas_elements", elements }] 
        });
      },


      logEvent: async (event, payload) => {
        const token = useAuthStore.getState().token;
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/telemetry`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ""
            },
            body: JSON.stringify({ event, payload })
          });
        } catch (err) {
          console.error("Telemetry failed:", err);
        }
      }
    }),
    {
      name: "shankhv2-progress-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
