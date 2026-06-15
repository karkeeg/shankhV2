/** Case-simulation endpoints (public play + admin authoring). */
import { api } from "./client";

export const casesApi = {
  // ── Public / learner ─────────────────────────────────────────────
  list: <T = unknown>() => api.get<T>("/api/v1/cases"),
  detail: <T = unknown>(id: string) => api.get<T>(`/api/v1/cases/${id}`),
  startSession: <T = unknown>(id: string) => api.post<T>(`/api/v1/cases/${id}/session`),
  markRead: <T = unknown>(id: string) => api.post<T>(`/api/v1/cases/${id}/session/mark-read`),
  submitActivity: <T = unknown>(id: string, activityId: string, body: unknown) =>
    api.post<T>(`/api/v1/cases/${id}/activities/${activityId}/submit`, body),
  saveDraft: <T = unknown>(id: string, activityId: string, body: unknown) =>
    api.post<T>(`/api/v1/cases/${id}/activities/${activityId}/draft`, body),

  // ── Admin authoring ──────────────────────────────────────────────
  adminList: <T = unknown>() => api.get<T>("/api/v1/cases/admin/list"),
  adminGet: <T = unknown>(id: string) => api.get<T>(`/api/v1/cases/admin/${id}`),
  adminCreate: <T = unknown>(body: unknown) => api.post<T>("/api/v1/cases/admin/create", body),
  adminUpdate: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/cases/admin/${id}`, body),
  adminDelete: <T = unknown>(id: string) => api.del<T>(`/api/v1/cases/admin/${id}`),

  adminCreateStudy: <T = unknown>(id: string, body: unknown) => api.post<T>(`/api/v1/cases/admin/${id}/studies`, body),
  adminUpdateStudy: <T = unknown>(id: string, studyId: string, body: unknown) =>
    api.put<T>(`/api/v1/cases/admin/${id}/studies/${studyId}`, body),
  adminDeleteStudy: <T = unknown>(id: string, studyId: string) =>
    api.del<T>(`/api/v1/cases/admin/${id}/studies/${studyId}`),

  adminCreateActivity: <T = unknown>(id: string, body: unknown) => api.post<T>(`/api/v1/cases/admin/${id}/activities`, body),
  adminUpdateActivity: <T = unknown>(id: string, activityId: string, body: unknown) =>
    api.put<T>(`/api/v1/cases/admin/${id}/activities/${activityId}`, body),
  adminDeleteActivity: <T = unknown>(id: string, activityId: string) =>
    api.del<T>(`/api/v1/cases/admin/${id}/activities/${activityId}`),
};
