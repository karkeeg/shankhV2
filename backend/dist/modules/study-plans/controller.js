import { fetchStudyPlanTree, listStudyPlans } from "./service.js";
export async function getStudyPlans(_req, res) {
    const plans = await listStudyPlans();
    res.json({ data: plans });
}
export async function getStudyPlanTree(req, res) {
    const tree = await fetchStudyPlanTree(req.params.planId);
    if (!tree) {
        res.status(404).json({ errors: [{ message: "Study plan not found" }] });
        return;
    }
    res.json({ data: tree });
}
