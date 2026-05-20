import { ExerciseConfig } from "@/types/exercise";

export type BackendActivityType =
  | "mcq"
  | "canvas"
  | "quantus"
  | "dropdown"
  | "select"
  | "excel"
  | "lesson"
  | string;

export type BackendDifficulty = "easy" | "medium" | "hard" | "foundation" | string;

export interface BackendActivityOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface BackendActivityQuestion {
  id: string;
  question: string;
  options: BackendActivityOption[];
  coach?: {
    hint?: string;
    correct?: string;
    incorrect?: string;
    warning?: string;
  };
}

export interface BackendTableInput {
  row: number;
  col: number;
  correctValue: string | number;
  type?: "number" | "text";
  placeholder?: string;
  formula?: string;
}

export interface BackendTableDropdown {
  row: number;
  col: number;
  options: string[];
  correctValue: string;
}

export interface BackendTable {
  name: string;
  table: (string | number | null)[][];
  inputs?: BackendTableInput[];
  dropdowns?: BackendTableDropdown[];
}

export interface BackendCanvasDraggableItem {
  id: string;
  label: string;
  type: "shape" | "rectangle" | "ellipse" | "diamond" | "equation";
  content: string;
}

export interface BackendCanvasDraggableCategory {
  category: string;
  items: BackendCanvasDraggableItem[];
}

export interface BackendActivityDetail {
  id: string;
  slug: string;
  title: string;
  type: BackendActivityType;
  difficulty?: BackendDifficulty;
  instructions?: string;
  question?: string;
  caseContext?: string;
  overview?: string;
  learningGoals?: string[];
  keyConcepts?: { term: string; description: string }[];
  vocabulary?: string[];
  formulas?: string[];
  tasks?: {
    task: string;
    answer: string | number;
    inputs?: string;
    formula?: string;
    difficulty?: string;
  }[];
  questions?: BackendActivityQuestion[];
  options?: BackendActivityOption[];
  table?: (string | number | null)[][];
  inputs?: BackendTableInput[];
  dropdowns?: BackendTableDropdown[];
  tables?: BackendTable[];
  canvasBackgroundText?: string;
  canvasDraggableElements?: BackendCanvasDraggableCategory[];
  canvasSubtype?: "drag_drop" | "freeform";
  drawingPrompt?: string;
  coach?: {
    hint?: string;
    correct?: string;
    incorrect?: string;
    warning?: string;
  };
}

export interface BackendLevel {
  id: string;
  title: string;
  difficulty?: BackendDifficulty;
  activities: BackendActivityDetail[];
}

export interface BackendTopic {
  id: string;
  title: string;
  levels: BackendLevel[];
}

export interface BackendTreeModule {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  caseContext?: string;
  stage?: "foundation" | "applied" | "integrated";
  skillTags?: string[];
  topics: BackendTopic[];
}

export interface BackendStudyPlanTree {
  modules: BackendTreeModule[];
}

export const mapDifficultyLabel = (level?: string): "Easy" | "Medium" | "Hard" => {
  if (!level) return "Medium";
  switch (level.toLowerCase()) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "foundation":
      return "Easy";
    default:
      return "Medium";
  }
};

export const mapActivityTypeToTab = (type?: string): "sheets" | "mcq" | "canvas" => {
  switch (type?.toLowerCase()) {
    case "quantus":
    case "excel":
      return "sheets";
    case "mcq":
    case "select":
    case "dropdown":
      return "mcq";
    case "canvas":
      return "canvas";
    default:
      return "mcq";
  }
};

export const mapBackendTypeToExerciseType = (type?: string): ExerciseConfig["type"] => {
  switch (type?.toLowerCase()) {
    case "quantus":
    case "excel":
      return "excel";
    case "canvas":
      return "canvas";
    case "dropdown":
      return "dropdown";
    case "select":
    case "mcq":
      return "select";
    default:
      return "select";
  }
};

export const mapContentToExercise = (activity: BackendActivityDetail): ExerciseConfig => {
  const exerciseType = mapBackendTypeToExerciseType(activity.type);
  const exercise: ExerciseConfig = {
    type: exerciseType,
    question: activity.question || activity.title || "",
    table: activity.table,
    inputs: activity.inputs,
    dropdowns: activity.dropdowns,
    tables: activity.tables,
    options: activity.options,
    questions: activity.questions,
    tasks: activity.tasks,
    coach: activity.coach,
    caseContext: activity.caseContext,
    overview: activity.overview,
    learningGoals: activity.learningGoals,
    keyConcepts: activity.keyConcepts,
    vocabulary: activity.vocabulary,
    formulas: activity.formulas,
    canvasBackgroundText: activity.canvasBackgroundText,
    canvasDraggableElements: activity.canvasDraggableElements,
  };

  if (activity.canvasSubtype) {
    exercise.canvasSubtype = activity.canvasSubtype;
  }
  if (activity.drawingPrompt) {
    exercise.drawingPrompt = activity.drawingPrompt;
  }

  return exercise;
};
