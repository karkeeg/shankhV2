import { financeData } from '@/data/financeData';
import { notFound } from 'next/navigation';
import { SplitLayout } from '@/components/layout/SplitLayout';
import { LessonPanel } from '@/components/lesson/LessonPanel';
import { ExercisePanel } from '@/components/exercise/ExercisePanel';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { category, slug } = await params;
  
  const lesson = financeData.find(
    (l) => l.category === category && l.slug === slug
  );

  if (!lesson) {
    notFound();
  }

  return (
    <SplitLayout
      header={
        <header className="h-10 flex items-center justify-between px-6 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium pr-4 border-r border-zinc-800"
            >
              <ChevronLeft size={16} />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                {lesson.categoryDisplay}
              </span>
              <span className="text-zinc-600 text-xs font-bold">/</span>
              <span className="text-zinc-100 text-sm font-bold tracking-tight">
                {lesson.title}
              </span>
            </div>
          </div>
        </header>
      }
      leftContent={
        <LessonPanel
          title={lesson.title}
          explanation={lesson.explanation}
          definitions={lesson.definitions}
          instructions={lesson.instructions}
        />
      }
      rightContent={<ExercisePanel exercise={lesson.exercise} />}
    />
  );
}
