export function validateSpreadsheetAttempt(answers, rules) {
    const fieldFeedback = rules.inputs.map((rule) => {
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
