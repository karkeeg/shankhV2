/** Lesson activity, draft autosave, and legacy attempt endpoints. */
import { api } from "./client";

export const activitiesApi = {
  /** Fetch a lesson's activity steps. */
  get: <T = unknown>(lessonId: string) => api.get<T>(`/api/v1/activities/${lessonId}`),
};

export const draftApi = {
  /** Autosave an activity's in-progress draft state. */
  save: <T = unknown>(type: string, activityId: string, draftState: unknown) =>
    api.put<T>(`/api/v1/draft/me/activities/${type}/${activityId}/draft`, { draft_state: draftState }),
};

export const attemptsApi = {
  /** Legacy session-submit path (mcq/canvas/quantus). */
  session: <T = unknown>(type: string, body: unknown) => api.post<T>(`/api/v1/attempts/session/${type}`, body),
};
