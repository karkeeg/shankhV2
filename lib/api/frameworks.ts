/** Framework library endpoints (admin authoring of reusable canvas diagrams). */
import { api } from "./client";

export const frameworksApi = {
  adminList: <T = unknown>() => api.get<T>("/api/v1/frameworks/admin/list"),
  adminGet: <T = unknown>(id: string) => api.get<T>(`/api/v1/frameworks/admin/${id}`),
  adminCreate: <T = unknown>(body: unknown) => api.post<T>("/api/v1/frameworks/admin/create", body),
  adminUpdate: <T = unknown>(id: string, body: unknown) => api.put<T>(`/api/v1/frameworks/admin/${id}`, body),
  adminDelete: <T = unknown>(id: string) => api.del<T>(`/api/v1/frameworks/admin/${id}`),
};
