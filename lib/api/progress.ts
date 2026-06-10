/** Progress / dashboard endpoints. */
import { api } from "./client";

export const progressApi = {
  dashboard: <T = unknown>() => api.get<T>("/api/v1/progress/me/dashboard"),
};
