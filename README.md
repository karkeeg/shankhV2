# Interactive Financial Practice Platform

Production-oriented fullstack platform for interactive accounting and finance practice.

## Overview

This repository contains:

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- Backend: Express + Prisma + TypeScript
- Database: PostgreSQL
- Activity engine: Spreadsheet and Canvas validation with backend-side grading

The current implementation keeps UI design parity while moving scoring and validation authority to backend APIs.

## Repository Structure

- `app/` - Next.js routes and pages
- `components/` - UI and exercise components
- `data/` - legacy local content structures (fallback path)
- `lib/` - shared client helpers/store
- `backend/src/` - Express API modules
- `backend/prisma/` - Prisma schema and seed
- `tests/visual/` - Playwright visual parity tests
- `.github/workflows/` - CI pipelines

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Environment Setup

### Frontend env

Copy root env template:

```bash
copy .env.example .env.local
```

Variables in `.env.local`:

- `NEXT_PUBLIC_BACKEND_URL` - backend API base URL (default `http://localhost:4000`)
- `NEXT_PUBLIC_USE_BACKEND_STUDY_PLAN` - use backend study plan tree (`true`/`false`)
- `NEXT_PUBLIC_BACKEND_ACTIVITY_ID` - optional explicit activity ID for grading route override
- `PLAYWRIGHT_BASE_URL` - base URL for visual parity tests (default `http://localhost:3000`)

### Backend env

Copy backend env template:

```bash
copy backend\\.env.example backend\\.env
```

Required variables in `backend/.env`:

- `DATABASE_URL`
- `PORT`

Optional placeholders (not required for current MVP runtime):

- `REDIS_URL`
- `AUTH_JWT_SECRET`

## Install Dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
cd ..
```

## Database Setup

From `backend/`:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Run the Stack

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
npm run dev
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Backend health: `http://localhost:4000/health`

## Backend API Contracts

Base prefix: `/api/v1`

Study plan:

- `GET /study-plans`
- `GET /study-plans/:planId/tree`
- `GET /activities/:activityId`

Attempts:

- `POST /attempts`
- `POST /attempts/:attemptId/submit`
- `GET /attempts/:attemptId`

Response envelope:

- `data`
- `errors` (on failure)
- validation payload contains `validationSummary` and `fieldFeedback`

## Validation and Scoring Flow

Spreadsheet/canvas grading flow:

1. Frontend creates attempt (`POST /attempts`)
2. Frontend submits answer payload (`POST /attempts/:attemptId/submit`)
3. Backend validates with activity version rules
4. Backend stores `AttemptAnswer` + `AttemptResult`
5. Frontend renders feedback and score

Fallback behavior:

- If backend is not reachable or disabled by env flags, UI falls back to local validation for continuity.

## Feature Flags

- `NEXT_PUBLIC_USE_BACKEND_STUDY_PLAN=true` enables backend study plan tree on study plan page.
- Without this flag, study plan uses local in-file content.

## Quality and Test Commands

Frontend:

```bash
npm run lint
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
npm run build
npm run test
```

Visual parity:

```bash
npm run ui:parity:update
npm run ui:parity
```

## Troubleshooting

Database connection error:

- Verify PostgreSQL is running
- Verify `backend/.env` `DATABASE_URL`
- Re-run `npm run prisma:migrate` in `backend/`

Backend not used by frontend:

- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Confirm backend is running on that URL
- For study plan API mode, set `NEXT_PUBLIC_USE_BACKEND_STUDY_PLAN=true`

Attempt creation fails:

- Ensure seed has run (`npm run prisma:seed` in `backend/`)
- If using explicit override, confirm `NEXT_PUBLIC_BACKEND_ACTIVITY_ID` exists in DB

Visual test failures:

- Regenerate approved snapshots with `npm run ui:parity:update`
- Re-run `npm run ui:parity`

## CI

CI is configured in `.github/workflows/ci.yml`:

- Frontend lint/typecheck/build
- Backend build/test
- Visual parity checks on pull requests
