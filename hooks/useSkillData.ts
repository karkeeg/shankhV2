"use client";

import { useCallback } from "react";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function useSkillData() {
  const getProfessions = useCallback(async (headers: HeadersInit) => {
    const res = await fetch(`${BASE}/api/v1/skill/professions`, { headers });
    if (!res.ok) throw new Error("Failed to fetch professions");
    const json = await res.json();
    return json.data ?? [];
  }, []);

  const getProfessionTests = useCallback(
    async (slug: string, headers: HeadersInit) => {
      const res = await fetch(
        `${BASE}/api/v1/skill/professions/${slug}/tests`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch tests");
      const json = await res.json();
      return json.data ?? [];
    },
    []
  );

  const getSingleTest = useCallback(
    async (testId: string, headers: HeadersInit) => {
      const res = await fetch(`${BASE}/api/v1/skill/tests/${testId}`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch test");
      const json = await res.json();
      return json.data;
    },
    []
  );

  const getSession = useCallback(
    async (testId: string, activityType: string, headers: HeadersInit) => {
      const res = await fetch(
        `${BASE}/api/v1/skill/tests/${testId}/sessions/${activityType}`,
        { headers }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch session");
      const json = await res.json();
      return json.data;
    },
    []
  );

  const startSession = useCallback(
    async (testId: string, activityType: string, headers: HeadersInit) => {
      const res = await fetch(
        `${BASE}/api/v1/skill/tests/${testId}/sessions`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ activityType }),
        }
      );
      if (!res.ok) throw new Error("Failed to start session");
      const json = await res.json();
      return json.data;
    },
    []
  );

  const pauseSession = useCallback(
    async (
      sessionId: string,
      timeSpentSecs: number,
      headers: HeadersInit
    ) => {
      await fetch(`${BASE}/api/v1/skill/sessions/${sessionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ timeSpentSecs }),
      });
    },
    []
  );

  const submitActivity = useCallback(
    async (
      sessionId: string,
      payload: {
        testItemId: string;
        activityType: string;
        existingSessionId: string;
        scorePct: number;
      },
      headers: HeadersInit
    ) => {
      const res = await fetch(
        `${BASE}/api/v1/skill/sessions/${sessionId}/submit`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to submit activity");
      const json = await res.json();
      return json.data;
    },
    []
  );

  const completeSession = useCallback(
    async (
      sessionId: string,
      timeSpentSecs: number,
      headers: HeadersInit
    ) => {
      const res = await fetch(
        `${BASE}/api/v1/skill/sessions/${sessionId}/complete`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ timeSpentSecs }),
        }
      );
      if (!res.ok) throw new Error("Failed to complete session");
      const json = await res.json();
      return json.data;
    },
    []
  );

  const getRecentlyActive = useCallback(async (headers: HeadersInit) => {
    const res = await fetch(`${BASE}/api/v1/skill/me/recently-active`, {
      headers,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  }, []);

  return {
    getProfessions,
    getProfessionTests,
    getSingleTest,
    getSession,
    startSession,
    pauseSession,
    submitActivity,
    completeSession,
    getRecentlyActive,
  };
}