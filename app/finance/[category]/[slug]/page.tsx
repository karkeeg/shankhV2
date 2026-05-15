import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { WorkspaceSidebar } from '@/components/exercise/WorkspaceSidebar';
import { AICoachPanel } from '@/components/exercise/AICoachPanel';
import { ExercisePanel } from '@/components/exercise/ExercisePanel';
import { mapContentToExercise } from '@/lib/backend-content';

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { category, slug } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get('shankh-token')?.value;

  const activityRes = await fetch(`${backendUrl}/api/v1/activities/by-slug/${slug}`, {
    cache: "no-store",
    headers: {
      'Authorization': token ? `Bearer ${token}` : ""
    }
  });
  if (!activityRes.ok) notFound();

  const activityJson = await activityRes.json();
  const activity = activityJson?.data as {
    id: string;
    slug: string;
    title: string;
    type: "spreadsheet" | "canvas" | "basic_input";
    instructions: string | null;
    content: Record<string, unknown>;
    validationRules?: Record<string, unknown>;
    taxonomy?: { topicTitle?: string; moduleTitle?: string };
  } | undefined;

  if (!activity) {
    notFound();
  }
  const lessonExercise = mapContentToExercise(activity);
  const explanation = (activity.content?.explanation as string | undefined) ?? `Practice path: ${activity.taxonomy?.moduleTitle ?? category}`;
  const instructions = activity.instructions ?? "Complete the activity and submit your answer.";

  return (
    <SplitLayout
      header={null} // Design doesn't show the dark generic header, WorkspaceSidebar has its own header
      leftClassName="p-0 border-r border-white/10" // Remove padding to let WorkspaceSidebar fill
      leftContent={
        <WorkspaceSidebar
          title={activity.title}
          explanation={explanation}
          instructions={instructions}
          toolkitElements={lessonExercise.type === "canvas" ? lessonExercise.canvasDraggableElements : undefined}
          lessonId={activity.id}
          totalSteps={Math.max(lessonExercise.tasks?.length || 0, lessonExercise.questions?.length || 0, 1)}
        />

      }
      rightContent={
        <ExercisePanel 
          lessonId={activity.id} 
          exercise={lessonExercise} 
          studyPlanId={activity.taxonomy?.studyPlanId}
        />
      }

      rightSidebarClassName="p-0"
      rightSidebarContent={<AICoachPanel />}
    />
  );
}

