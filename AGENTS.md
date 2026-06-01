<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shankh Platform - System Context for Agents

Welcome to Shankh. This document outlines the codebase architecture, data models, progress calculations, and critical path rules to help you get up to speed quickly.

---

## 1. Repository Architecture

Shankh is divided into a frontend (Next.js App Router) and a backend (Node/Express with TypeScript & Prisma).

- **Frontend**: Root directory (`/`). Core components are:
  - `app/`: Next.js pages/routes
  - `components/`: UI components (e.g. layout, exercise widgets, skill indicators)
  - `hooks/`: Frontend data hooks (e.g. `useSkillData`)
  - `lib/`: State stores (Zustand) and configurations
- **Backend**: `/backend/` directory. Core components are:
  - `backend/src/controllers/`: Route handlers and logic
  - `backend/src/routes/`: Route declarations and auth middleware mapping
  - `backend/src/services/`: Business logic, progress calculations, and metrics helpers
  - `backend/src/prisma/`: Database client and schema (shared schema source is `backend/prisma/schema.prisma`)

---

## 2. System Modes: Learning vs. Skill Building

The platform features two distinct user modes:

1. **Learning Mode**: 
   - Focused on structured curriculum hierarchy: **Module** → **Topic** → **Subtopic** → **Lesson**.
   - Lessons contain three types of exercises: MCQ Quiz, Drag-and-Drop Canvas Drill, and Quantus Spreadsheet Lab.
   - Progress cascades automatically up the hierarchy upon completion.
2. **Skill Building**: 
   - A task-oriented path organized by: **SkillSection** → **Profession** → **SkillBundle** → **SkillBundleItem**.
   - Focuses on job-specific roles (e.g. Chartered Accountant, Investment Banker).
   - Bundles group existing lessons' activities to target professional competencies.
   - Dual progress tracking ensures lesson activities update both curriculum progress and professional bundle progress.

---

## 3. Database Schema Overview

The core data models are declared in [schema.prisma](file:///d:/NxtWave/shankhV2/backend/prisma/schema.prisma). Key entities:

- **Curriculum**: `Module`, `Topic`, `Subtopic`, `Lesson`, `LessonActivity`
- **Activities**: `McqActivity`, `CanvasActivity`, `QuantusActivity`
- **Curriculum Progress**: `UserLessonProgress`, `UserSubtopicProgress`, `UserTopicProgress`, `UserModuleProgress` (tracks `conceptAccuracy`, `recallStrength`, and `applicationScore`)
- **Skill Structure**: `SkillSection`, `Profession`, `SkillBundle`, `SkillBundleProfession`, `SkillBundleItem`
- **Skill Progress**: `UserSkillBundleProgress` (cumulative bundle metrics), `UserSkillItemProgress` (best score tracking per bundle item)
- **Activity Submissions**: `UserMcqSession`, `UserCanvasSession`, `UserQuantusSession` (tracks specific attempts, scores, and draft states)

---

## 4. The Session Submit Cascade (8 Steps)

When a user submits an activity, the backend executes a precise cascade process. In `backend/src/controllers/sessionController.ts` and `backend/src/services/progressService.ts`, the sequence of operations is:

1. **Submit Answer**: Receive and persist the user's answers/inputs.
2. **Grade Session**: Calculate the attempt score and percentage accuracy.
3. **Save Session**: Save the graded attempt and update the user's current draft status.
4. **Determine Completion**: Assess whether the activity's performance satisfies completion requirements.
5. **Recalculate Lesson Progress**: Aggregate the best scores of all activities inside the lesson.
6. **Cascade Lesson Progress**: Cascade the new metrics to the parent Subtopic, Topic, and Module progress tables atomically using transactions.
7. **Return Lesson Progress**: Send the updated curriculum statistics back to the client.
8. **Bridge to Skill Progress**: Map the updated lesson activity to any linked `SkillBundleItem`s, upsert `UserSkillItemProgress` (preserving the highest score), and atomically recalculate `UserSkillBundleProgress`.

---

## 5. Known Gotchas & Dev Notes

- **Two Session Submission Paths**: 
  - Modern curriculum uses `POST /api/v1/session/mcq` (and `canvas`/`quantus`) handled by `sessionController.ts`.
  - Legacy attempts use `POST /api/v1/attempts/:id/submit` in `activity.ts`. 
  - *Both routes must execute the Step 8 Skill Bridge helper (`updateSkillProgress`).*
- **Authentication**: JWT authentication uses the cookie `shankh-token`. Frontend API hooks (such as `useSkillData`) automatically inject this cookie as a `Bearer` token inside the `Authorization` header.
- **Quantus Sheet Formulas**: Formulas constructed in the spreadsheet cells are verified on the backend by matching cell values vs. `expectedValue` and evaluating expressions mathematically.
