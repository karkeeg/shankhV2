"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = __importDefault(require("./routes/auth"));
const content_1 = __importDefault(require("./routes/content"));
const session_1 = __importDefault(require("./routes/session"));
const draft_1 = __importDefault(require("./routes/draft"));
const progress_1 = __importDefault(require("./routes/progress"));
const skill_1 = __importDefault(require("./routes/skill"));
const admin_1 = __importDefault(require("./routes/admin"));
const activity_1 = __importDefault(require("./routes/activity"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 4000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// Request logger to see incoming API calls
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// API routes — must come BEFORE the root catch-all
app.use("/api/v1/auth", auth_1.default);
app.use("/api/v1/content", content_1.default);
app.use("/api/v1/session", session_1.default);
app.use("/api/v1/draft", draft_1.default);
app.use("/api/v1/progress", progress_1.default);
app.use("/api/v1/skill", skill_1.default);
app.use("/api/v1/admin", admin_1.default);
app.use("/api/v1/activities", activity_1.default);
app.use("/api/v1/attempts", activity_1.default);
app.listen(port, () => {
    console.log(`Shankh backend listening at http://localhost:${port}`);
});
