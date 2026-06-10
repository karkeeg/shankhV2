/** Skill-building (profession / test / session) endpoints. */
import { api } from "./client";

export const skillApi = {
  professions: <T = unknown>() => api.get<T>("/api/v1/skill/professions"),
  professionTests: <T = unknown>(professionId: string) => api.get<T>(`/api/v1/skill/professions/${professionId}/tests`),
  test: <T = unknown>(testId: string) => api.get<T>(`/api/v1/skill/tests/${testId}`),
  startSession: <T = unknown>(testId: string, body?: unknown) => api.post<T>(`/api/v1/skill/tests/${testId}/sessions`, body),
  session: <T = unknown>(sessionId: string) => api.get<T>(`/api/v1/skill/sessions/${sessionId}`),
  updateSession: <T = unknown>(sessionId: string, body: unknown) => api.patch<T>(`/api/v1/skill/sessions/${sessionId}`, body),
  testSession: <T = unknown>(testId: string, sessionId: string) => api.get<T>(`/api/v1/skill/tests/${testId}/sessions/${sessionId}`),
  submitSession: <T = unknown>(sessionId: string, body: unknown) => api.post<T>(`/api/v1/skill/sessions/${sessionId}/submit`, body),
  completeSession: <T = unknown>(sessionId: string, body?: unknown) => api.post<T>(`/api/v1/skill/sessions/${sessionId}/complete`, body),
};
