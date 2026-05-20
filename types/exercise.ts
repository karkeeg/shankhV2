export type ExerciseType = "excel" | "select" | "dropdown" | "canvas";

export interface DragItem {
  id: string;
  label: string;
  type: "shape" | "rectangle" | "ellipse" | "diamond" | "equation";
  content: string;
}

export interface DragCategory {
  category: string;
  items: DragItem[];
}

export interface ExerciseConfig {
  type: ExerciseType;
  question: string;
  table?: (string | number | null)[][];
  // tasks: For multi-step exercises (from backend)
  tasks?: {
    task: string;
    answer: string | number;
    inputs?: string;
    formula?: string;
    difficulty?: string;
  }[];
  coach?: {
    hint?: string;
    correct?: string;
    warning?: string;
    incorrect?: string;
  };
  caseContext?: string;
  // Structured context for admin panel
  overview?: string;
  learningGoals?: string[];
  keyConcepts?: { term: string; description: string }[];
  vocabulary?: string[];
  formulas?: string[];
  // tables: For 'excel' with multiple tables (tabs)
  tables?: {
    name: string;
    table: (string | number | null)[][];
    inputs?: {
      row: number;
      col: number;
      correctValue: string | number;
      type?: "number" | "text";
      placeholder?: string;
      formula?: string; // Formula hint on hover
    }[];
    dropdowns?: {
      row: number;
      col: number;
      options: string[];
      correctValue: string;
    }[];
  }[];
  // inputs: For 'excel', specifies which cells are editable and their correct values
  inputs?: {
    row: number;
    col: number;
    correctValue: string | number;
    type?: "number" | "text";
    placeholder?: string;
    formula?: string; // Formula hint on hover
  }[];
  // options: For 'select' (legacy single MCQ)
  options?: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  // questions: For 'select' (multi-question MCQ tests)
  questions?: {
    id: string;
    question: string;
    options: {
      id: string;
      label: string;
      isCorrect: boolean;
    }[];
    coach?: {
      correct?: string;
      incorrect?: string;
      hint?: string;
    };
  }[];
  // dropdowns: For 'dropdown', specifies options for specific cells
  dropdowns?: {
    row: number;
    col: number;
    options: string[];
    correctValue: string;
  }[];
  // canvas: For 'canvas' interactive maps
  canvasBackgroundText?: string;
  canvasSubtype?: "drag_drop" | "freeform";
  drawingPrompt?: string;
  canvasDraggableElements?: {
    category: string;
    items: {
      id: string;
      label: string;
      type: "shape" | "rectangle" | "ellipse" | "diamond" | "equation";
      content: string; // The text to display in the shape
    }[];
  }[];
  hints?: string[];
}
