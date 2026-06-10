/** Admin curriculum + profession management endpoints (require admin auth). */
import { api } from "./client";

export type CurriculumEntity = "module" | "topic" | "subtopic" | "lesson";

export const adminApi = {
  // ── Learning tree ──────────────────────────────────────────────────────────
  learningTree: <T = unknown>() => api.get<T>("/api/v1/admin/learning-tree"),
  lessonDetail: <T = unknown>(id: string) => api.get<T>(`/api/v1/admin/lessons/${id}`),

  // ── Modules ────────────────────────────────────────────────────────────────
  createModule: <T = unknown>(body: unknown) => api.post<T>("/api/v1/admin/modules", body),
  updateModule: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/admin/modules/${id}`, body),
  deleteModule: (id: string) => api.del(`/api/v1/admin/modules/${id}`),

  // ── Topics ─────────────────────────────────────────────────────────────────
  createTopic: <T = unknown>(body: unknown) => api.post<T>("/api/v1/admin/topics", body),
  updateTopic: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/admin/topics/${id}`, body),
  deleteTopic: (id: string) => api.del(`/api/v1/admin/topics/${id}`),

  // ── Subtopics ──────────────────────────────────────────────────────────────
  createSubtopic: <T = unknown>(body: unknown) => api.post<T>("/api/v1/admin/subtopics", body),
  updateSubtopic: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/admin/subtopics/${id}`, body),
  deleteSubtopic: (id: string) => api.del(`/api/v1/admin/subtopics/${id}`),

  // ── Lessons ────────────────────────────────────────────────────────────────
  createLesson: <T = unknown>(body: unknown) => api.post<T>("/api/v1/admin/lessons", body),
  updateLesson: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/admin/lessons/${id}`, body),
  deleteLesson: (id: string) => api.del(`/api/v1/admin/lessons/${id}`),

  // ── Reorder (siblings) ─────────────────────────────────────────────────────
  reorder: (entity: CurriculumEntity, orderedIds: string[]) =>
    api.post("/api/v1/admin/curriculum/reorder", { entity, orderedIds }),

  // ── Professions ────────────────────────────────────────────────────────────
  professions: <T = unknown>() => api.get<T>("/api/v1/admin/professions"),
  createProfession: <T = unknown>(body: unknown) => api.post<T>("/api/v1/admin/professions", body),
  updateProfession: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/admin/professions/${id}`, body),
  deleteProfession: (id: string) => api.del(`/api/v1/admin/professions/${id}`),
};
