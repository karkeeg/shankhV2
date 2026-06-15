"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { frameworksApi } from "@/lib/api";
import { useToastStore } from "@/lib/toast-store";
import { FrameworkStructure } from "@/lib/canvasAdapter";
import { FrameworkBuilder, FrameworkBuilderSavePayload } from "@/components/admin/FrameworkBuilder";
import { Loader2 } from "lucide-react";

export default function FrameworkBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const showToast = useToastStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [fw, setFw] = useState<{ name: string; description: string; category: string; isActive: boolean; structure: FrameworkStructure } | null>(null);

  useEffect(() => {
    frameworksApi
      .adminGet<any>(id)
      .then((data) => {
        if (!data) return;
        setFw({
          name: data.name ?? "", description: data.description ?? "", category: data.category ?? "",
          isActive: data.isActive ?? true, structure: data.structure,
        });
      })
      .catch((e: any) => showToast(e?.message || "Failed to load framework", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (p: FrameworkBuilderSavePayload) => {
    await frameworksApi.adminUpdate(id, {
      name: p.name, description: p.description, category: p.category, isActive: p.isActive, structure: p.structure,
    });
  };

  if (loading || !fw) return (
    <div className="flex items-center justify-center h-screen bg-[#F0EDE7] text-[#01696F]">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>
  );

  return (
    <FrameworkBuilder
      key={id}
      initialStructure={fw.structure}
      initialMeta={{ name: fw.name, description: fw.description, category: fw.category, isActive: fw.isActive }}
      showActive
      requireName
      backLabel="Frameworks"
      onBack={() => router.push("/admin/frameworks")}
      onSave={handleSave}
    />
  );
}
