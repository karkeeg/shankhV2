"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";

/**
 * The case editor + live preview live on the `/preview` route, which is the single
 * canonical place to author a case (studies + activities with full create/edit/delete).
 * This route just forwards there so "Manage" and "Preview" never diverge.
 */
export default function AdminCaseRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) router.replace(`/admin/cases/${id}/preview`);
  }, [id, router]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#01696F]" />
      </div>
    </MainLayout>
  );
}
