-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('mcq', 'canvas', 'quantus');

-- CreateEnum
CREATE TYPE "CanvasSubtype" AS ENUM ('drag_drop', 'freeform');

-- CreateEnum
CREATE TYPE "AssemblyMode" AS ENUM ('sequence', 'graph');

-- CreateEnum
CREATE TYPE "ScoringMode" AS ENUM ('partial', 'exact');

-- CreateEnum
CREATE TYPE "CellType" AS ENUM ('editable', 'formula', 'prefilled', 'empty', 'header');

-- CreateEnum
CREATE TYPE "CellStyle" AS ENUM ('default', 'yellow', 'blue', 'bold', 'gray', 'green');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "TopicType" AS ENUM ('topic', 'drill');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "TestSessionStatus" AS ENUM ('in_progress', 'completed', 'expired');

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accentColor" TEXT NOT NULL,
    "iconKey" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "type" "TopicType" NOT NULL DEFAULT 'topic',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TopicType" NOT NULL DEFAULT 'topic',
    "thumbnailUrl" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'easy',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "estimatedMins" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT,
    "instructions" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McqActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqQuestion" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McqOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McqOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantusActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "context" TEXT,
    "referenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantusActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantusColumnGroup" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "colStart" INTEGER NOT NULL,
    "colEnd" INTEGER NOT NULL,
    "bgColor" TEXT NOT NULL DEFAULT '#e8e8ff',
    "textColor" TEXT NOT NULL DEFAULT '#333',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuantusColumnGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantusColumn" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "widthPx" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "QuantusColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantusCell" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "cellType" TEXT NOT NULL,
    "displayValue" TEXT,
    "expectedValue" TEXT,
    "formula" TEXT,
    "formatType" TEXT,
    "isEditable" BOOLEAN NOT NULL DEFAULT false,
    "tolerancePct" DOUBLE PRECISION,
    "hintText" TEXT,
    "rowSpan" INTEGER DEFAULT 1,
    "colSpan" INTEGER DEFAULT 1,

    CONSTRAINT "QuantusCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "context" TEXT,
    "assemblyMode" "AssemblyMode" NOT NULL DEFAULT 'graph',
    "scoringMode" "ScoringMode" NOT NULL DEFAULT 'partial',
    "penaltyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "passThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanvasActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasToken" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "displayText" TEXT NOT NULL,
    "tokenRole" TEXT NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'rect',
    "isDistractor" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CanvasToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasSolutionEdge" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "fromTokenId" TEXT NOT NULL,
    "toTokenId" TEXT NOT NULL,
    "operandSlot" TEXT,
    "isCommutative" BOOLEAN NOT NULL DEFAULT false,
    "edgeRole" TEXT NOT NULL,
    "edgeOrder" INTEGER,
    "edgeLabel" TEXT,

    CONSTRAINT "CanvasSolutionEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityHint" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "activityId" TEXT NOT NULL,
    "hintText" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityHint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'learner',
    "planType" "PlanTier" NOT NULL DEFAULT 'free',
    "avatarUrl" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonCompletionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mcqBestScore" DOUBLE PRECISION,
    "canvasBestScore" DOUBLE PRECISION,
    "quantusAttempted" BOOLEAN NOT NULL DEFAULT false,
    "status" "LessonStatus" NOT NULL DEFAULT 'not_started',
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubtopicProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "subtopicCompletionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recallStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conceptAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSubtopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTopicProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "topicCompletionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recallStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conceptAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
    "subtopicsCompleted" INTEGER NOT NULL DEFAULT 0,
    "subtopicsTotal" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModuleProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "moduleCompletionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recallStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conceptAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topicsStarted" INTEGER NOT NULL DEFAULT 0,
    "topicsTotal" INTEGER NOT NULL DEFAULT 0,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "lessonsTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLessonSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "currentActivityType" "ActivityType" NOT NULL,
    "activityOrder" JSONB,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "draftState" JSONB NOT NULL,
    "hintsRevealed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMcqSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "scorePct" DOUBLE PRECISION,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMcqSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMcqAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "UserMcqAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCanvasSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "score" INTEGER,
    "total" INTEGER,
    "scorePct" DOUBLE PRECISION,
    "canvasData" JSONB,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCanvasSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuantusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "scorePct" DOUBLE PRECISION,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuantusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHintUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "revealedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHintUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtopicProfessionTag" (
    "subtopicId" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,

    CONSTRAINT "SubtopicProfessionTag_pkey" PRIMARY KEY ("subtopicId","professionId")
);

-- CreateTable
CREATE TABLE "SkillTest" (
    "id" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTestTypeConfig" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "timeLimitMins" INTEGER NOT NULL,

    CONSTRAINT "SkillTestTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTestItem" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "activityId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillTestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillTestSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "timeLimitMins" INTEGER NOT NULL,
    "timeSpentSecs" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "scorePct" DOUBLE PRECISION,
    "status" "TestSessionStatus" NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserSkillTestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkillTestResponse" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "testItemId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "mcqSessionId" TEXT,
    "canvasSessionId" TEXT,
    "quantusSessionId" TEXT,
    "scorePct" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSkillTestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_lesson_act" ON "LessonActivity"("lessonId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "McqActivity_lessonId_key" ON "McqActivity"("lessonId");

-- CreateIndex
CREATE INDEX "idx_mcq_options_question" ON "McqOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuantusActivity_lessonId_key" ON "QuantusActivity"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quantus_col_index" ON "QuantusColumn"("activityId", "colIndex");

-- CreateIndex
CREATE UNIQUE INDEX "uq_quantus_cell" ON "QuantusCell"("activityId", "rowIndex", "colIndex");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasActivity_lessonId_key" ON "CanvasActivity"("lessonId");

-- CreateIndex
CREATE INDEX "idx_canvas_edge_activity" ON "CanvasSolutionEdge"("activityId");

-- CreateIndex
CREATE INDEX "idx_activity_hint_activity" ON "ActivityHint"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_hint_order" ON "ActivityHint"("activityId", "activityType", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ulp" ON "UserLessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usp" ON "UserSubtopicProgress"("userId", "subtopicId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_utp" ON "UserTopicProgress"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ump" ON "UserModuleProgress"("userId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_lesson_session" ON "UserLessonSession"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_draft" ON "UserActivityDraft"("userId", "activityId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_streak_date" ON "UserStreak"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_slug_key" ON "Profession"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_name_key" ON "Profession"("name");

-- CreateIndex
CREATE INDEX "idx_spt_profession" ON "SubtopicProfessionTag"("professionId");

-- CreateIndex
CREATE INDEX "idx_spt_subtopic" ON "SubtopicProfessionTag"("subtopicId");

-- CreateIndex
CREATE INDEX "idx_skill_test_profession" ON "SkillTest"("professionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "uq_test_type_config" ON "SkillTestTypeConfig"("testId", "activityType");

-- CreateIndex
CREATE INDEX "idx_test_items_type" ON "SkillTestItem"("testId", "activityType", "orderIndex");

-- CreateIndex
CREATE INDEX "idx_test_item_lookup" ON "SkillTestItem"("activityId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "uq_test_item_activity" ON "SkillTestItem"("activityId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "uq_test_item_unique" ON "SkillTestItem"("testId", "activityId", "activityType");

-- CreateIndex
CREATE INDEX "idx_session_recent" ON "UserSkillTestSession"("userId", "lastActiveAt" DESC);

-- CreateIndex
CREATE INDEX "idx_session_test" ON "UserSkillTestSession"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_test_session" ON "UserSkillTestSession"("userId", "testId", "activityType");

-- CreateIndex
CREATE INDEX "idx_test_response_session" ON "UserSkillTestResponse"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_test_response" ON "UserSkillTestResponse"("sessionId", "testItemId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqActivity" ADD CONSTRAINT "McqActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqQuestion" ADD CONSTRAINT "McqQuestion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "McqActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McqOption" ADD CONSTRAINT "McqOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantusActivity" ADD CONSTRAINT "QuantusActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantusColumnGroup" ADD CONSTRAINT "QuantusColumnGroup_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "QuantusActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantusColumn" ADD CONSTRAINT "QuantusColumn_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "QuantusActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantusCell" ADD CONSTRAINT "QuantusCell_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "QuantusActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasActivity" ADD CONSTRAINT "CanvasActivity_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasToken" ADD CONSTRAINT "CanvasToken_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CanvasActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasSolutionEdge" ADD CONSTRAINT "CanvasSolutionEdge_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CanvasActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasSolutionEdge" ADD CONSTRAINT "CanvasSolutionEdge_fromTokenId_fkey" FOREIGN KEY ("fromTokenId") REFERENCES "CanvasToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasSolutionEdge" ADD CONSTRAINT "CanvasSolutionEdge_toTokenId_fkey" FOREIGN KEY ("toTokenId") REFERENCES "CanvasToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubtopicProgress" ADD CONSTRAINT "UserSubtopicProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubtopicProgress" ADD CONSTRAINT "UserSubtopicProgress_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopicProgress" ADD CONSTRAINT "UserTopicProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopicProgress" ADD CONSTRAINT "UserTopicProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleProgress" ADD CONSTRAINT "UserModuleProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleProgress" ADD CONSTRAINT "UserModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonSession" ADD CONSTRAINT "UserLessonSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonSession" ADD CONSTRAINT "UserLessonSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityDraft" ADD CONSTRAINT "UserActivityDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMcqSession" ADD CONSTRAINT "UserMcqSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMcqSession" ADD CONSTRAINT "UserMcqSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "McqActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMcqAnswer" ADD CONSTRAINT "UserMcqAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserMcqSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMcqAnswer" ADD CONSTRAINT "UserMcqAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "McqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMcqAnswer" ADD CONSTRAINT "UserMcqAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "McqOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCanvasSession" ADD CONSTRAINT "UserCanvasSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCanvasSession" ADD CONSTRAINT "UserCanvasSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "CanvasActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuantusSession" ADD CONSTRAINT "UserQuantusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuantusSession" ADD CONSTRAINT "UserQuantusSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "QuantusActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHintUsage" ADD CONSTRAINT "UserHintUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHintUsage" ADD CONSTRAINT "UserHintUsage_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "ActivityHint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtopicProfessionTag" ADD CONSTRAINT "SubtopicProfessionTag_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtopicProfessionTag" ADD CONSTRAINT "SubtopicProfessionTag_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTest" ADD CONSTRAINT "SkillTest_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestTypeConfig" ADD CONSTRAINT "SkillTestTypeConfig_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SkillTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestItem" ADD CONSTRAINT "SkillTestItem_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SkillTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTestItem" ADD CONSTRAINT "SkillTestItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestSession" ADD CONSTRAINT "UserSkillTestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestSession" ADD CONSTRAINT "UserSkillTestSession_testId_fkey" FOREIGN KEY ("testId") REFERENCES "SkillTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestResponse" ADD CONSTRAINT "UserSkillTestResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSkillTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestResponse" ADD CONSTRAINT "UserSkillTestResponse_testItemId_fkey" FOREIGN KEY ("testItemId") REFERENCES "SkillTestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestResponse" ADD CONSTRAINT "UserSkillTestResponse_mcqSessionId_fkey" FOREIGN KEY ("mcqSessionId") REFERENCES "UserMcqSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestResponse" ADD CONSTRAINT "UserSkillTestResponse_canvasSessionId_fkey" FOREIGN KEY ("canvasSessionId") REFERENCES "UserCanvasSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkillTestResponse" ADD CONSTRAINT "UserSkillTestResponse_quantusSessionId_fkey" FOREIGN KEY ("quantusSessionId") REFERENCES "UserQuantusSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
