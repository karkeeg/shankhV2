export interface FieldFeedbackItem {
  key: string;
  isCorrect: boolean;
  expected?: string | number;
  received?: string | number;
}

export interface ValidationResult {
  validationSummary: {
    correctCount: number;
    totalCount: number;
    scorePercent: number;
    passed: boolean;
  };
  fieldFeedback: FieldFeedbackItem[];
}

interface SpreadsheetRuleInput {
  row: number;
  col: number;
  correctValue: string | number;
  mode?: "exact";
}

interface SpreadsheetRules {
  type: "spreadsheet";
  inputs: SpreadsheetRuleInput[];
}

export function validateSpreadsheetAttempt(
  answers: Record<string, string | number>,
  rules: SpreadsheetRules
): ValidationResult {
  const fieldFeedback: FieldFeedbackItem[] = rules.inputs.map((rule) => {
    const key = `${rule.row}-${rule.col}`;
    const received = answers[key] ?? "";
    const isCorrect = String(received).replace(/,/g, "").trim() === String(rule.correctValue).replace(/,/g, "").trim();
    return {
      key,
      isCorrect,
      expected: rule.correctValue,
      received,
    };
  });

  const correctCount = fieldFeedback.filter((item) => item.isCorrect).length;
  const totalCount = fieldFeedback.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  return {
    validationSummary: {
      correctCount,
      totalCount,
      scorePercent,
      passed: scorePercent >= 70,
    },
    fieldFeedback,
  };
}

interface CanvasRules {
  type: "canvas";
  requiredNodeIds: string[];
  requiredEdges?: Array<{ from: string; to: string }>;
}

interface CanvasSubmission {
  nodeIds: string[];
  edges?: Array<{ from: string; to: string }>;
}

export function validateCanvasAttempt(
  submission: CanvasSubmission,
  rules: CanvasRules
): ValidationResult {
  const presentNodes = new Set(submission.nodeIds);
  const fieldFeedback: FieldFeedbackItem[] = rules.requiredNodeIds.map((id) => ({
    key: `node:${id}`,
    isCorrect: presentNodes.has(id),
    expected: id,
    received: presentNodes.has(id) ? id : "",
  }));

  const submittedEdges = new Set((submission.edges ?? []).map((edge) => `${edge.from}->${edge.to}`));
  const requiredEdges = rules.requiredEdges ?? [];
  requiredEdges.forEach((edge) => {
    const key = `${edge.from}->${edge.to}`;
    fieldFeedback.push({
      key: `edge:${key}`,
      isCorrect: submittedEdges.has(key),
      expected: key,
      received: submittedEdges.has(key) ? key : "",
    });
  });

  const correctCount = fieldFeedback.filter((item) => item.isCorrect).length;
  const totalCount = fieldFeedback.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  return {
    validationSummary: {
      correctCount,
      totalCount,
      scorePercent,
      passed: scorePercent >= 70,
    },
    fieldFeedback,
  };
}
