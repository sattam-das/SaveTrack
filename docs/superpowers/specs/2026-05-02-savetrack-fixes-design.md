# SaveTrack Fixes Design

**Date:** 2026-05-02
**Approach:** A (targeted fixes + small utilities)

## Goals
Resolve engineering issues in the current codebase with minimal refactoring while improving offline reliability.

## Scope
Fix the following issues:
1. Duplicate event handlers in log module.
2. Target=0 progress showing 100%.
3. Date/timezone drift in date parsing and grouping.
4. History sorting bug across years.
5. Missing data normalization for new fields.
6. External CDN dependencies (Tailwind + fonts/icons) for offline use.
7. Weekly target edit UI in Goals.

## Design Overview

### 1) Event Handler Duplication
- Make `initLog()` idempotent using the existing clone/replace pattern used elsewhere.
- Ensure the submit handler only attaches once per render cycle.

### 2) Target=0 Progress Guard
- When target is 0, progress percent must be `0.0` and progress bar width `0%`.
- Apply the guard for both default monthly target and priority goal target.

### 3) Date Utilities (Local, Consistent)
Add `src/lib/dates.js` with:
- `toLocalDateKey(date)` → `YYYY-MM-DD` using local date parts.
- `parseLocalDate(key)` → `Date` object from local parts.
- `formatDateLabel(key, includeYear)` → user-facing labels.

Update all date logic to use these helpers:
- `log.js`: save dates using `toLocalDateKey(new Date())`.
- `history.js`: grouping, sorting, and labels based on local keys.
- `analytics.js`: streak, weekly totals, and monthly buckets use local keys.
- `dashboard.js`: recent logs and labels use local helper for display.

### 4) History Sorting Across Years
- For “All Time” charts, store real date keys and sort using `parseLocalDate`.
- Avoid constructing dates with the current year for past labels.

### 5) Data Normalization on Load
Add `normalizeAppData(raw)` in `src/main.js`:
- Ensure `entries`, `targets`, `goals`, `preferences` are present.
- Ensure `entries.source` and `entries.sourceCustom` exist (default empty).
- Ensure `goals.completed` and `goals.archived` are set based on `saved >= amount`.
- Ensure missing `targets.weekly/monthly` default to `0`.

Call `normalizeAppData()` immediately after loading data from Tauri or localStorage.

### 6) Offline Asset Bundling
- Remove Tailwind CDN and Google Font/Material Symbol links in `index.html`.
- Add local Tailwind build via Vite: `src/styles.css` imported from `src/main.js`.
- Use `@fontsource/inter` and `@fontsource/material-symbols-outlined` (or equivalent) in CSS.
- Preserve existing color tokens and font usage via Tailwind config.

### 7) Weekly Target Edit UI
- Add a weekly target input next to monthly target in the Goals view modal.
- Persist `targets.weekly` with save.

## Files Affected (Planned)
- Create: `src/lib/dates.js`
- Modify: `src/main.js`, `src/components/log.js`, `src/components/dashboard.js`, `src/components/history.js`, `src/components/goals.js`, `src/lib/analytics.js`, `index.html`
- Create: `src/styles.css`, `tailwind.config.js`, `postcss.config.js` (if needed)
- Update: `package.json` (Tailwind + font packages)

## Testing
- Add tests for date helpers and normalization.
- Update existing tests to use local date keys.
- Run all `scripts/tests/*.test.mjs` after changes.

## Review Checkpoints
- Verify log submission only fires once per submit.
- Validate date grouping and streaks across timezone boundaries.
- Confirm history all-time chart sorts across years correctly.
- Run offline by disconnecting network; UI still loads.
- Weekly target editable in Goals and reflected on Dashboard.
