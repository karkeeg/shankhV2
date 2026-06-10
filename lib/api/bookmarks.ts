/** Bookmark + reaction endpoints. */
import { api } from "./client";

export const bookmarksApi = {
  mine: <T = unknown>() => api.get<T>("/api/v1/bookmarks/me"),
  myIds: <T = unknown>() => api.get<T>("/api/v1/bookmarks/me/ids"),
  toggleSubtopic: <T = unknown>(subtopicId: string, body?: unknown) => api.post<T>(`/api/v1/bookmarks/subtopics/${subtopicId}`, body),
  removeSubtopic: <T = unknown>(subtopicId: string) => api.del<T>(`/api/v1/bookmarks/subtopics/${subtopicId}`),
};

export const reactionsApi = {
  myLessons: <T = unknown>() => api.get<T>("/api/v1/reactions/me/lessons"),
  lesson: <T = unknown>(lessonId: string) => api.get<T>(`/api/v1/reactions/lessons/${lessonId}`),
  react: <T = unknown>(lessonId: string, body: unknown) => api.post<T>(`/api/v1/reactions/lessons/${lessonId}`, body),
};
