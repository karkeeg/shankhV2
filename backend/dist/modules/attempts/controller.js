import { z } from "zod";
import { createPracticeAttempt, fetchAttempt, submitPracticeAttempt } from "./service.js";
const createAttemptSchema = z.object({
    activityId: z.string().min(1),
    userId: z.string().min(1),
});
const submitAttemptSchema = z.object({
    answers: z.record(z.union([z.string(), z.number()])),
});
export async function createAttempt(req, res) {
    const parsed = createAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.issues });
        return;
    }
    const attempt = await createPracticeAttempt(parsed.data);
    if (!attempt) {
        res.status(404).json({ errors: [{ message: "Activity or published version not found" }] });
        return;
    }
    res.status(201).json({ data: attempt });
}
export async function submitAttempt(req, res) {
    const parsed = submitAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.issues });
        return;
    }
    try {
        const result = await submitPracticeAttempt({
            attemptId: req.params.attemptId,
            answers: parsed.data.answers,
        });
        if (!result) {
            res.status(404).json({ errors: [{ message: "Attempt not found" }] });
            return;
        }
        res.json({ data: result });
    }
    catch (error) {
        res.status(400).json({ errors: [{ message: error.message }] });
    }
}
export async function getAttempt(req, res) {
    const attempt = await fetchAttempt(req.params.attemptId);
    if (!attempt) {
        res.status(404).json({ errors: [{ message: "Attempt not found" }] });
        return;
    }
    res.json({ data: attempt });
}
