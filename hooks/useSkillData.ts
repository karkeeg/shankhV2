"use client";

import { SkillSection } from '@/lib/skillSections';
import { useAuthStore } from '@/lib/auth-store';
import Cookies from 'js-cookie';

export interface SkillSectionResponse extends SkillSection {}

export const toUrlSlug = (slug: string) => slug.replace(/_/g, '-');
export const toApiSlug = (slug: string) => slug.replace(/-/g, '_');

export default function useSkillData() {
  const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

  const getHeaders = (additionalHeaders: HeadersInit = {}): HeadersInit => {
    const token = useAuthStore.getState().token || Cookies.get('shankh-token');
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...additionalHeaders };
    if (token) (headers as any)['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // ─── Sections & Professions ────────────────────────────────────────────────

  const getSkillSections = async (headers: HeadersInit = {}): Promise<SkillSectionResponse[]> => {
    const res = await fetch(`${baseUrl}/skill/sections`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch skill sections: ${res.status}`);
    const data = await res.json();
    return data.data as SkillSectionResponse[];
  };

  /** @deprecated Use getSkillSectionTopics for the new topic-based page. */
  const getSkillSectionBundles = async (slug: string, professionSlug?: string, headers: HeadersInit = {}): Promise<any> => {
    const apiSlug = toApiSlug(slug);
    const qp = professionSlug ? `?profession=${encodeURIComponent(toApiSlug(professionSlug))}` : '';
    const res = await fetch(`${baseUrl}/skill/sections/${apiSlug}/bundles${qp}`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch bundles for "${slug}": ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  /**
   * NEW — Fetches the full topic-based page for a skill section.
   * Hits GET /skill/sections/:slug and returns:
   *   { section, tabs, profession_groups, modeling_fountains }
   */
  const getSkillSectionTopics = async (slug: string, headers: HeadersInit = {}): Promise<any> => {
    const apiSlug = toApiSlug(slug);
    const res = await fetch(`${baseUrl}/skill/sections/${apiSlug}`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch topics for section "${slug}": ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  const getProfessions = async (headers: HeadersInit = {}): Promise<any[]> => {
    const res = await fetch(`${baseUrl}/skill/professions`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch professions: ${res.status}`);
    const data = await res.json();
    return data.data as any[];
  };

  // ─── Bundles (legacy) ──────────────────────────────────────────────────────

  const getSingleBundle = async (bundleId: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/bundles/${bundleId}`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch bundle ${bundleId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  const startSkillBundle = async (bundleId: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/bundles/${bundleId}/start`, { method: 'POST', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to start bundle ${bundleId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  const startBundleItem = async (bundleId: string, itemId: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/bundles/${bundleId}/items/${itemId}/start`, { method: 'POST', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to start bundle item ${itemId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  const getSkillBundleProgress = async (bundleId: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/bundles/${bundleId}/progress`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch bundle progress for ${bundleId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  // ─── Topics (NEW) ─────────────────────────────────────────────────────────

  /**
   * NEW — Start or resume a skill topic.
   * Hits POST /skill/topics/:topicId/start with { activityType }.
   * Returns { topicId, activityType, isResume, allComplete, nextLesson, navigateTo }.
   */
  const startSkillTopic = async (topicId: string, activityType: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/topics/${topicId}/start`, {
      method:  'POST',
      headers: getHeaders(headers),
      body:    JSON.stringify({ activityType }),
    });
    if (!res.ok) throw new Error(`Failed to start topic ${topicId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  // ─── User progress ─────────────────────────────────────────────────────────

  /** @deprecated Use getRecentlyActiveTopic for the new topic-based banner. */
  const getRecentlyActive = async (headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/me/recently-active`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch recently active: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  /**
   * NEW — Returns the most recently accessed topic (powers resume banner).
   * Hits GET /skill/me/recently-active-topic
   */
  const getRecentlyActiveTopic = async (headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/me/recently-active-topic`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch recently active topic: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  const getMySkillProgress = async (headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/me/progress`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch my skill progress: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  // ─── Cross-promotion ───────────────────────────────────────────────────────

  const getLessonSkillContext = async (lessonId: string, headers: HeadersInit = {}): Promise<any> => {
    const res = await fetch(`${baseUrl}/skill/lessons/${lessonId}/skill-context`, { method: 'GET', headers: getHeaders(headers) });
    if (!res.ok) throw new Error(`Failed to fetch lesson skill context for ${lessonId}: ${res.status}`);
    const data = await res.json();
    return data.data;
  };

  return {
    toUrlSlug,
    toApiSlug,
    // sections
    getSkillSections,
    getSkillSectionTopics,      // ← NEW (primary)
    getSkillSectionBundles,     // legacy
    getProfessions,
    // bundles (legacy)
    getSingleBundle,
    startSkillBundle,
    startBundleItem,
    getSkillBundleProgress,
    // topics (NEW)
    startSkillTopic,            // ← NEW
    // progress
    getRecentlyActiveTopic,     // ← NEW (primary)
    getRecentlyActive,          // legacy
    getMySkillProgress,
    // cross-promotion
    getLessonSkillContext,
  };
}