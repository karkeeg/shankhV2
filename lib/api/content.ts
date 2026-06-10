/** Learning-curriculum content endpoints (public reads). */
import { api } from "./client";

export const contentApi = {
  modules: <T = unknown>() => api.get<T>("/api/v1/content/modules"),
  moduleBySlug: <T = unknown>(slug: string) => api.get<T>(`/api/v1/content/modules/slug/${slug}`),
  moduleTopics: <T = unknown>(moduleId: string) => api.get<T>(`/api/v1/content/modules/${moduleId}/topics`),
  topicSubtopics: <T = unknown>(topicId: string) => api.get<T>(`/api/v1/content/topics/${topicId}/subtopics`),
  subtopic: <T = unknown>(subtopicId: string) => api.get<T>(`/api/v1/content/subtopics/${subtopicId}`),
};
