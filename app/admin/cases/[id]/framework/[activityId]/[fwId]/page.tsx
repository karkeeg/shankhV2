"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { casesApi } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import { FrameworkStructure } from "@/lib/canvasAdapter";
import { FrameworkBuilder, FrameworkBuilderSavePayload } from "@/components/admin/FrameworkBuilder";
import { Loader2 } from "lucide-react";

// Full-screen builder for a case's OWN copy of one framework. Edits the snapshot
// stored at `activityData.frameworkSnapshots[fwId]` — the master library is never
// touched. Reuses the exact same FrameworkBuilder as the library page.
export default function CaseFrameworkBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.id as string;
  const activityId = params?.activityId as string;
  const fwId = params?.fwId as string;
  const showToast = useToastStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<{ name: string; description: string; category: string; structure: FrameworkStructure } | null>(null);

  useEffect(() => {
    casesApi
      .adminGet<any>(caseId)
      .then((data) => {
        const act = (data?.caseActivities ?? []).find((a: any) => a.id === activityId);
        const s = act?.activityData?.frameworkSnapshots?.[fwId];
        if (!s) {
          showToast("Framework copy not found for this case. Save the activity first.", "error");
          return;
        }
        setSnap({ name: s.name ?? "", description: s.description ?? "", category: s.category ?? "", structure: s.structure });
      })
      .catch((e: any) => showToast(e?.message || "Failed to load case framework", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, activityId, fwId]);

  // Re-fetch fresh, merge just this framework's snapshot back, and persist — so a
  // concurrent edit to the rest of the activity isn't clobbered.
  const handleSave = async (p: FrameworkBuilderSavePayload) => {
    const data = await casesApi.adminGet<any>(caseId);
    const act = (data?.caseActivities ?? []).find((a: any) => a.id === activityId);
    if (!act) throw new Error("Activity no longer exists.");
    const ad = { ...(act.activityData ?? {}) };
    const prev = ad.frameworkSnapshots?.[fwId] ?? {};
    ad.frameworkSnapshots = {
      ...(ad.frameworkSnapshots ?? {}),
      [fwId]: { ...prev, id: fwId, name: p.name, category: p.category, description: p.description, structure: p.structure },
    };
    await casesApi.adminUpdateActivity(caseId, activityId, { activityData: ad, orderIndex: act.orderIndex });
  };

  if (loading || !snap) return (
    <div className="flex items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F]">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  return (
    <FrameworkBuilder
      key={`${activityId}-${fwId}`}
      initialStructure={snap.structure}
      initialMeta={{ name: snap.name, description: snap.description, category: snap.category }}
      requireName={false}
      backLabel="Back to case"
      scopeNote="This case's copy"
      onBack={() => router.push(`/admin/cases/${caseId}/preview`)}
      onSave={handleSave}
    />
  );
}
