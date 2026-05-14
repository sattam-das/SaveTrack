# SaveTrack Current Status

**Date:** 2026-05-02

## Overview
SaveTrack is a native Windows desktop app (Tauri) that tracks savings locally. The UI is a multi-tab dashboard (Dashboard, Analytics, Goals, Settings) with Chart.js visualizations and local JSON persistence via Tauri commands (with localStorage fallback).

## Tech Stack
- Tauri (Rust backend + desktop shell)
- Frontend: HTML + Tailwind (CDN) + JavaScript (ESM)
- Charts: Chart.js
- Storage: local JSON file (store.json in app data) + localStorage fallback

## Features Implemented

### Dashboard
- Total saved amount (sum of entries)
- Monthly target progress with priority goal support
- Growth analysis chart using real monthly aggregates
- Recent logs list (dynamic, last 5 entries)
- Daily streak card (amount > 0 entries)
- Weekly target progress card (week starts Monday)
- Dev-mode banner if no entry logged today

### Logging
- Add savings entry (amount, note)
- Source tagging with fixed list and optional "Other" text
- Auto-allocate funds to priority goal

### Goals & Targets
- Monthly target edit
- Create goals with amount and optional deadline
- Deadline display + edit, "days left" badge when within 30 days
- Completion flow (archive completed goals)
- Add funds to active goals only
- Priority goal toggle

### Analytics & History
- Lifetime stats (total, avg/day, best day)
- History line chart with 7/30/all timeframes
- Monthly breakdown table (total, avg/day, vs target)
- Income source breakdown list

### Settings
- Currency symbol selection
- Export data to JSON
- Wipe data (resets entries/goals/targets)

## Data Model (Current)
```
{
  "entries": [
    {
      "id": "uuid",
      "date": "YYYY-MM-DD",
      "amount": 20.5,
      "note": "Optional",
      "source": "Tutoring",
      "sourceCustom": ""
    }
  ],
  "targets": {
    "weekly": 0,
    "monthly": 0
  },
  "goals": [
    {
      "id": "uuid",
      "name": "New Phone",
      "amount": 500,
      "saved": 120,
      "deadline": "2026-12-31",
      "completed": false,
      "archived": false,
      "isPriority": true
    }
  ],
  "preferences": {
    "currency": "$"
  }
}
```

## Bug Fixes Delivered (Phase 1)
- Recent Logs list is now dynamic from real entries.
- Growth analysis chart uses real monthly aggregates (YYYY-MM grouping).
- Monthly target default is now 0 when unset (no hardcoded values).

## Incomplete Features Completed (Phase 2)
- Goal deadlines displayed and editable, with 30-day badge.
- Completion flow with archive list; add-funds blocked on completed goals.
- Monthly breakdown table added to analytics.

## New Features Completed (Phase 3)
- Daily streak tracker and dev-mode reminder banner.
- Weekly target progress (Monday start).
- Side income source tagging + analytics breakdown.

## Build / Packaging Status (Phase 4)
- Bundle identifier updated to `com.savetrack.desktop`.
- Packaging build completed.
- MSI: `src-tauri/target/release/bundle/msi/SaveTrack_0.1.0_x64_en-US.msi`
- NSIS: `src-tauri/target/release/bundle/nsis/SaveTrack_0.1.0_x64-setup.exe`

## Tests Run (TDD)
- `node scripts/tests/recent-logs.test.mjs`
- `node scripts/tests/monthly-aggregates.test.mjs`
- `node scripts/tests/targets.test.mjs`
- `node scripts/tests/goals-deadline.test.mjs`
- `node scripts/tests/goals-completion.test.mjs`
- `node scripts/tests/monthly-breakdown.test.mjs`
- `node scripts/tests/streak.test.mjs`
- `node scripts/tests/weekly-target.test.mjs`
- `node scripts/tests/source-breakdown.test.mjs`

## Known Issues / Gaps
- No OS-level notification reminder yet (dev banner only).

## Key Files Updated
- `index.html`
- `src/main.js`
- `src/lib/analytics.js`
- `src/lib/targets.js`
- `src/lib/goals.js`
- `src/components/dashboard.js`
- `src/components/log.js`
- `src/components/goals.js`
- `src/components/history.js`
- `src/components/settings.js`
- `src-tauri/tauri.conf.json`
- `scripts/tests/*.test.mjs`

## Suggested Next Steps
1. Run a full manual UI pass for deadline editing, archived goals, and weekly target.
2. Add OS notifications after Tauri integration.
