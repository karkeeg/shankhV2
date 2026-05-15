import { describe, expect, it } from "vitest";
import { validateCanvasAttempt, validateSpreadsheetAttempt } from "./validators.js";
describe("validateSpreadsheetAttempt", () => {
    it("returns full score when all inputs match", () => {
        const result = validateSpreadsheetAttempt({
            "3-1": "60000",
            "5-1": "40000",
        }, {
            type: "spreadsheet",
            inputs: [
                { row: 3, col: 1, correctValue: 60000 },
                { row: 5, col: 1, correctValue: 40000 },
            ],
        });
        expect(result.validationSummary.scorePercent).toBe(100);
        expect(result.validationSummary.correctCount).toBe(2);
    });
    it("handles commas and whitespace", () => {
        const result = validateSpreadsheetAttempt({
            "3-1": " 60,000 ",
        }, {
            type: "spreadsheet",
            inputs: [{ row: 3, col: 1, correctValue: 60000 }],
        });
        expect(result.validationSummary.scorePercent).toBe(100);
    });
});
describe("validateCanvasAttempt", () => {
    it("passes when all required nodes are present", () => {
        const result = validateCanvasAttempt({ nodeIds: ["rev", "cogs", "gp"] }, { type: "canvas", requiredNodeIds: ["rev", "cogs", "gp"] });
        expect(result.validationSummary.scorePercent).toBe(100);
        expect(result.validationSummary.passed).toBe(true);
    });
    it("fails when required nodes are missing", () => {
        const result = validateCanvasAttempt({ nodeIds: ["rev"] }, { type: "canvas", requiredNodeIds: ["rev", "cogs"] });
        expect(result.validationSummary.correctCount).toBe(1);
        expect(result.validationSummary.totalCount).toBe(2);
        expect(result.validationSummary.scorePercent).toBe(50);
    });
});
