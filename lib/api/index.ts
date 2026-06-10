/** Barrel for the shared API client. Import from "@/lib/api". */
export { api, ApiError, API_BASE } from "./client";
export type { RequestOptions } from "./client";
export { contentApi } from "./content";
export { skillApi } from "./skill";
export { bookmarksApi, reactionsApi } from "./bookmarks";
export { progressApi } from "./progress";
export { casesApi } from "./cases";
export { activitiesApi, draftApi, attemptsApi } from "./activity";
export { adminApi } from "./admin";
export type { CurriculumEntity } from "./admin";
