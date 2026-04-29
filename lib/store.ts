import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserLessonState {
  completed: boolean;
  score?: number;
  lastCanvasElements?: any[];
}

interface AppState {
  xp: number;
  completedLessons: Record<string, UserLessonState>;
  markLessonComplete: (lessonId: string, payload?: Partial<UserLessonState>) => void;
  saveCanvasState: (lessonId: string, elements: any[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      xp: 0,
      completedLessons: {},
      
      markLessonComplete: (lessonId, payload) => set((state) => {
        const isPreviouslyCompleted = state.completedLessons[lessonId]?.completed;
        return {
          xp: isPreviouslyCompleted ? state.xp : state.xp + 100, // Grant 100 XP only on first completion
          completedLessons: {
            ...state.completedLessons,
            [lessonId]: {
              ...state.completedLessons[lessonId],
              ...payload,
              completed: true,
            }
          }
        };
      }),

      saveCanvasState: (lessonId, elements) => set((state) => ({
        completedLessons: {
          ...state.completedLessons,
          [lessonId]: {
            ...state.completedLessons[lessonId],
            lastCanvasElements: elements,
            completed: state.completedLessons[lessonId]?.completed || false
          }
        }
      }))
    }),
    {
      name: "shankhv2-progress-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
