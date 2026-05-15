import { ExerciseConfig } from "@/types/exercise";


export type WorkspaceTab = "sheets" | "mcq" | "canvas";
export type PhaseId = "easy" | "medium" | "hard";

export interface BackendTreeActivity {
  id: string;
  slug: string;
  title: string;
  type: "mcq" | "spreadsheet" | "canvas" | "decision" | "lesson" | "aiPack" | "basic_input";
  instructions?: string | null;
}

export interface BackendTreeLevel {
  id: string;
  title: string;
  difficulty: PhaseId;
  activities: BackendTreeActivity[];
}

export interface BackendTreeTopic {
  id: string;
  title: string;
  description: string | null;
  levels: BackendTreeLevel[];
}

export interface BackendTreeModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  stage: "foundation" | "applied" | "integrated";
  topics: BackendTreeTopic[];
}

export interface BackendStudyPlanTree {
  id: string;
  slug: string;
  title: string;
  modules: BackendTreeModule[];
}

export interface BackendActivityDetail {
  id: string;
  slug: string;
  title: string;
  type: "mcq" | "spreadsheet" | "canvas" | "decision" | "lesson" | "aiPack" | "basic_input";
  instructions: string | null;
  content: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
  taxonomy?: {
    moduleTitle?: string;
    moduleLearningObjective?: string;
    moduleCaseContext?: string;
  };
}

export function mapActivityTypeToTab(type: BackendTreeActivity["type"]): WorkspaceTab {
  if (type === "canvas") return "canvas";
  if (type === "mcq" || type === "decision" || type === "basic_input" || type === "lesson") return "mcq";
  return "sheets";
}

export function mapDifficultyLabel(difficulty: PhaseId): "Easy" | "Medium" | "Hard" {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  return "Hard";
}

export function mapContentToExercise(detail: BackendActivityDetail): ExerciseConfig {
  const content = detail.content || {};
  
  const coach = content.coach as ExerciseConfig["coach"];
  const caseContext = (content.caseContext as string) || detail.taxonomy?.moduleCaseContext || "";

  // Handle MCQ
  if (detail.type === "mcq") {
    // Check if it has a 'questions' array (new format)
    if (Array.isArray(content.questions)) {
      return {
        type: "select",
        question: "Knowledge Check", // Generic title if multiple
        caseContext,
        coach,
        questions: content.questions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          question: q.prompt || "",
          options: (Array.isArray(q.options) ? q.options : []).map((opt: string, i: number) => ({
            id: String.fromCharCode(65 + i),
            label: opt,
            isCorrect: String.fromCharCode(65 + i) === q.correctAnswer,
          })),
          coach: { correct: q.rationale, hint: q.rationale },
        })),
      };
    }

    // Legacy format
    return {
      type: "select",
      question: asString(content.prompt) || detail.title,
      coach,
      caseContext,
      options: (Array.isArray(content.options) ? content.options : []).map((opt: string, i: number) => ({
        id: String.fromCharCode(65 + i),
        label: opt,
        isCorrect: String.fromCharCode(65 + i) === content.correctAnswer,
      })),
    };
  }

  // Handle Decision
  if (detail.type === "decision") {
    const decisionCoach = coach || {
      correct: asString(content.scoring) || "Choice recorded.",
      incorrect: "Please make a selection.",
      hint: "Select the option that best fits the scenario."
    };

    return {
      type: "select",
      question: asString(content.prompt) || detail.title,
      coach: decisionCoach,
      caseContext,
      options: (Array.isArray(content.options) ? content.options : []).map((opt: string, i: number) => ({
        id: String.fromCharCode(65 + i),
        label: opt,
        isCorrect: true, // Decisions are subjective; any selection is considered a valid "completion"
      })),
    };
  }

  // Handle Canvas
  if (detail.type === "canvas") {
    return {
      type: "canvas",
      question: asString(content.prompt) || detail.title,
      tasks: [
        {
          task: asString(content.prompt) || detail.title,
          answer: asString(content.expectedStructure) || "",
          inputs: "",
          formula: "",
          difficulty: "medium"
        }
      ],
      coach,
      caseContext,
      canvasBackgroundText:
        asString(content.canvasBackgroundText) || "Build your structure on canvas and submit.",
      canvasDraggableElements: [
        {
          category: "Components",
          items: [
            {
              id: "item-1",
              label: "Structure Node",
              type: "rectangle" as const,
              content: "New Node",
            }
          ],
        },
      ],
    };
  }

  // Handle Lesson
  if (detail.type === "lesson") {
    return {
      type: "select", // Lessons can be simple read-only or minimal interaction
      question: asString(content.learningObjective) || detail.title,
      coach,
      caseContext,
      options: [],
    };
  }

  // Quantus / Spreadsheet (Excel)
  // Multi-tab spreadsheet (tables array with name+table objects)
  if (Array.isArray(content.tables) && content.tables.length > 0 && (content.tables as any[])[0]?.name) {
    const tables = content.tables as any[];
    return {
      type: "excel",
      question: asString(content.prompt) || detail.title,
      table: tables[0].table,
      tables: tables,
      coach,
      caseContext,
      overview: asString(content.overview),
      learningGoals: Array.isArray(content.learningGoals) ? content.learningGoals : undefined,
      keyConcepts: Array.isArray(content.keyConcepts) ? content.keyConcepts : undefined,
      vocabulary: Array.isArray(content.vocabulary) ? content.vocabulary : undefined,
      formulas: Array.isArray(content.formulas) ? content.formulas : undefined,
    };
  }

  // Single comprehensive sheet (direct table + inputs arrays)
  if (Array.isArray(content.table) && content.table.length > 0) {
    return {
      type: "excel",
      question: asString(content.prompt) || detail.title,
      table: content.table as any,
      inputs: Array.isArray(content.inputs) ? content.inputs as any : undefined,
      coach,
      caseContext,
      overview: asString(content.overview),
      learningGoals: Array.isArray(content.learningGoals) ? content.learningGoals : undefined,
      keyConcepts: Array.isArray(content.keyConcepts) ? content.keyConcepts : undefined,
      vocabulary: Array.isArray(content.vocabulary) ? content.vocabulary : undefined,
      formulas: Array.isArray(content.formulas) ? content.formulas : undefined,
    };
  }

  // Legacy task-based format (inputs as string "Key₹Value;...")
  return {
    type: "excel",
    question: asString(content.prompt) || detail.title,
    tasks: [
      {
        task: asString(content.prompt) || detail.title,
        answer: asString(content.expectedAnswer) || "",
        inputs: asString(content.inputs) || "",
        formula: asString(content.expectedFormula) || "",
        difficulty: (content.difficulty as any) || "easy"
      }
    ],
    coach,
    caseContext,
    overview: asString(content.overview),
    learningGoals: Array.isArray(content.learningGoals) ? content.learningGoals : undefined,
    keyConcepts: Array.isArray(content.keyConcepts) ? content.keyConcepts : undefined,
    vocabulary: Array.isArray(content.vocabulary) ? content.vocabulary : undefined,
    formulas: Array.isArray(content.formulas) ? content.formulas : undefined,
  };
}



function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
