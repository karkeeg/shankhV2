# UI Parity Checklist

Use this checklist whenever backend logic is migrated behind existing UI.

## Core Rules

- Keep existing component structure and class names stable unless a bug fix requires change.
- Do not change typography scale, spacing, or color tokens during backend integration tasks.
- Keep current interaction patterns (tabs, cards, exercise panel actions, navigation flow).
- Ensure local fallback behavior remains available when backend flags are disabled.

## Page Checks

- Dashboard (`/`)
- Study Plan list (`/study-plan`)
- Exercise workspace (`/finance/[category]/[slug]`)
- Canvas exercise view

## Verification Steps

1. Run `npm run lint`.
2. Run `npm run typecheck`.
3. Run visual regression snapshots:
   - Start app with `npm run dev`.
   - Run `npm run ui:parity`.
4. Confirm screenshot diffs are intentional before merging.
