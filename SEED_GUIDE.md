# Shankh Seed Data Guide

## Overview
The `prisma/seed.ts` file contains the database seeding logic for the Shankh learning platform. It creates all modules, learning plans, topics, lessons, activities, and supporting data.

## Seed Data Structure

### What's Included (Current Sample)

**Modules:** 3
- Finance
- Strategy
- Operations

**Learning Plans:** 6
- Finance: Core Concepts, DCF Valuation
- Strategy: Strategic Frameworks, Case Interview Prep
- Operations: Supply Chain, Process Design

**Topics:** 1 (sample from Finance → Core Concepts)
- Financial Statements

**Lessons:** 3
1. **Lesson 1 (Easy):** Financial Statement Basics
   - Activity: MCQ (2 questions)
   - Topics: Three financial statements, accrual vs. cash accounting

2. **Lesson 2 (Medium):** Income Statement Deep Dive
   - Activities: MCQ + Canvas drag-drop
   - Topics: Income statement structure, EBITDA, margins

3. **Lesson 3 (Hard):** Balance Sheet & EV Bridge
   - Activities: MCQ + Canvas + Quantus spreadsheet
   - Topics: Financial statement relationships, EV bridge, modeling

**Activities:** 4 total
- 2 MCQ activities (with 2-3 questions each)
- 1 Canvas activity (drag-drop style)
- 1 Quantus activity (spreadsheet with formulas)

**Hints:** 11 total (3-4 per activity)

**Users:** 1 demo user
- Email: `demo@shankh.com`
- Plan: Pro
- Progress: All lessons at "not_started"

---

## How to Run Seed

### Prerequisites
1. Database must be running and DATABASE_URL set in `.env`
2. Prisma migrations must be applied: `npx prisma migrate deploy`

### Run the Seed
```bash
npm run seed
```

Or directly:
```bash
npx prisma db seed
```

### Expected Output
```
🌱 Starting seed...
✅ Modules created
✅ Learning Plans created (6 total)
✅ Topics & Lessons created for Plan 1.1
✅ MCQ Activity 1 created (Financial Statement Basics)
✅ Canvas Activity 1 created (Income Statement Mapping)
✅ Quantus Activity 1 created (Financial Statement Model)
✅ Demo user and progress records created
🎉 Seed completed successfully!
📊 Summary:
   - Modules: 3
   - Learning Plans: 6
   - Topics: 1 (sample)
   - Lessons: 3 (sample)
   - Activities: 4 (1 MCQ, 1 Canvas, 1 Quantus, + 1 more MCQ)
   - Demo User: 1
```

---

## Next Steps: Expand to Full Curriculum

The seed script is currently a **sample** demonstrating the structure. To expand to the full 54 lessons:

### Phase 2.2: Populate Remaining Topics & Lessons

**From context.txt, add the following:**

#### Module 1: Finance (9 lessons)
**Plan 1.1: Core Concepts**
- Topic 1: Financial Statements (3 lessons) ✅ DONE
  - Lesson 1: Basics (easy)
  - Lesson 2: Income Statement (medium)
  - Lesson 3: Balance Sheet & EV (hard)
- Topic 2: Capital Structure (3 lessons) ⏳ TODO
  - Lesson 4: Debt vs Equity (easy)
  - Lesson 5: Leverage Ratios (medium)
  - Lesson 6: WACC (hard)
- Topic 3: Share Count & Dilution (3 lessons) ⏳ TODO
  - Lesson 7: Basic Share Count (easy)
  - Lesson 8: Options & RSUs (medium)
  - Lesson 9: Dilution Calc (hard)

**Plan 1.2: DCF Valuation** (9 lessons) ⏳ TODO
- Topic 1: Free Cash Flow (3 lessons)
- Topic 2: Terminal Value (3 lessons)
- Topic 3: DCF Model (3 lessons)

#### Module 2: Strategy (9 lessons) ⏳ TODO
**Plan 2.1: Strategic Frameworks**
- Topic 1: Competitive Analysis (3 lessons)
- Topic 2: Business Strategy (3 lessons)
- Topic 3: Portfolio Strategy (3 lessons)

**Plan 2.2: Case Interview Prep**
- Topic 1: Case Foundations (3 lessons)
- Topic 2: Profitability Diagnosis (3 lessons)
- Topic 3: Case Execution (3 lessons)

#### Module 3: Operations (9 lessons) ⏳ TODO
**Plan 3.1: Supply Chain**
- Topic 1: Demand Planning (3 lessons)
- Topic 2: Procurement (3 lessons)
- Topic 3: Distribution (3 lessons)

**Plan 3.2: Process Design**
- Topic 1: Lean Principles (3 lessons)
- Topic 2: Process Mapping (3 lessons)
- Topic 3: Continuous Improvement (3 lessons)

---

### How to Extend

1. **Extract from context.txt:** Copy lesson details, questions, hints, and activity specifications
2. **Follow the pattern:** The sample shows the structure for MCQ, Canvas, and Quantus
3. **Add to seed.ts:** Insert new `prisma.lesson.create()`, `prisma.mcqActivity.create()`, etc. blocks
4. **Re-run seed:** `npm run seed` will create all new records

**Key Points:**
- Each **easy** lesson has 1 activity (MCQ)
- Each **medium** lesson has 2 activities (MCQ + Canvas)
- Each **hard** lesson has 3 activities (MCQ + Canvas + Quantus)
- Total: 18 (easy) + 36 (medium) + 54 (hard) = **108 activities**

---

## Database Schema

The seed uses these main models:
- `Module` — Container for learning plans
- `LearningPlan` — Container for topics
- `Topic` — Container for lessons
- `Lesson` — Contains lesson metadata and activity linkages
- `LessonActivity` — Junction table linking activities to lessons
- `McqActivity`, `CanvasActivity`, `QuantusActivity` — Activity-specific data
- `ActivityHint` — Progressive hints for learners
- `User` — Learner profile
- `UserModuleProgress`, `UserPlanProgress`, `UserTopicProgress`, `UserLessonProgress` — Progress tracking

---

## Quick Reference: Activity Types

### MCQ (Multiple Choice Questions)
- **Model:** `McqActivity` + `McqQuestion` + `McqOption`
- **Features:** Questions, 4-5 options per question, exactly 1 correct per question
- **Scoring:** % correct
- **Required fields in seed:**
  - `title`: Activity title
  - `instructions`: What learner must do
  - `context`: Background reading
  - Questions with 4-5 options (exactly 1 marked `isCorrect: true`)
  - Hints (3-5 per activity)

### Canvas (Drag-Drop or Freeform)
- **Model:** `CanvasActivity` + `CanvasZone` + `CanvasItem`
- **Subtypes:**
  - `drag_drop`: Drag items into labeled zones
  - `freeform`: Draw on whiteboard (Excalidraw)
- **Features:** Zones, draggable items, AI evaluation for freeform
- **Required fields in seed:**
  - `title`: Activity title
  - `instructions`: What learner must do
  - `context`: Background reading
  - `subtype`: 'drag_drop' or 'freeform'
  - Zones (for drag-drop)
  - Items + correct zone mappings
  - Hints (3-5 per activity)

### Quantus (Spreadsheet)
- **Model:** `QuantusActivity` + `QuantusColumn` + `QuantusSection` + `QuantusRow` + `QuantusCell`
- **Features:** Multi-section table, editable cells (yellow), formula cells, prefilled cells (blue)
- **Scoring:** % of correct cell values
- **Required fields in seed:**
  - `title`: Activity title
  - `instructions`: What learner must do
  - `context`: Background reading + formula explanations
  - Column groups (visual grouping)
  - Columns (year/metric headers)
  - Sections (logical grouping of rows)
  - Rows (with row_key for unique identification)
  - Cells with:
    - `cellType`: 'editable', 'formula', 'prefilled', 'empty'
    - `styleClass`: 'yellow' (editable), 'blue' (prefilled)
    - `formulaExpression`: Formula (for formula cells)
    - `defaultValue`: Pre-filled value (for prefilled cells)
    - `expectedValue`: Expected answer (for scoring)
  - Hints (3-5 per activity)

---

## Testing the Seed

After running `npm run seed`:

```bash
# Check that modules were created
npx prisma studio  # Opens Prisma Studio at localhost:5555

# Verify in studio:
# - Module: 3 records
# - LearningPlan: 6 records
# - Topic: 1 record
# - Lesson: 3 records
# - McqActivity: 2 records
# - CanvasActivity: 1 record
# - QuantusActivity: 1 record
# - ActivityHint: 11 records
# - User: 1 record
```

---

## Important Notes

1. **seed.ts is TypeScript:** Ensure `tsx` is installed (auto-run by prisma)
2. **Database must exist:** Create your PostgreSQL database first
3. **Migrations first:** Run `npx prisma migrate deploy` before seeding
4. **Idempotency:** The current seed will fail if run twice (no upserts). For development, use:
   ```bash
   npx prisma migrate reset  # Wipes DB and re-seeds
   ```
5. **Production warning:** Never seed with sensitive data in production; use this for development only

---

## Questions?

Refer to context.txt for the complete lesson specifications (lines ~600 onwards).
