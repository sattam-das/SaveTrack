# SaveTrack Updates Design

**Date:** 2026-05-02
**Approach:** A (phased by list, minimal refactors)

## Goals
Ship fixes and features in four phases with review checkpoints between phases.

## Phase Plan

### Phase 1: Bugs to fix first
1. Recent logs list on dashboard should be dynamic (last 5 entries, sorted by date desc).
2. Growth analysis chart should use real monthly aggregates (YYYY-MM grouping).
3. Monthly target defaults must read from store and fall back to 0 (no hardcoded defaults).

### Phase 2: Incomplete features
1. Goal deadlines: show on goal cards, allow editing, add badge when within 30 days.
2. Completion flow: completion banner, archive completed goals, block adding funds.
3. History monthly breakdown: table with month total, avg/day, and vs-target.

### Phase 3: New features
1. Daily streak tracker (days with at least one entry amount > 0).
2. Weekly target resets (week starts Monday) with weekly progress display.
3. Side income source tagging with fixed list + optional custom text for Other; show analytics breakdown.
4. "Haven't logged today" banner in dev mode when no entry for today.

### Phase 4: Packaging
1. Run `npm run tauri build` and configure bundle metadata for .exe packaging.

## Data Model Changes
- `entries[]`: add `source` and optional `sourceCustom`.
- `goals[]`: retain `deadline` as ISO date string, add `archived` boolean.

## UI/UX Changes
- Dashboard: add streak card, weekly target progress, dev-mode reminder banner, dynamic recent logs.
- Goals: show deadline, edit deadline, add "days left" badge, completion banner, archived list.
- Analytics: monthly breakdown table + source breakdown visualization or list.

## Logic Details
- Recent logs: sort by date desc, tie-break by id, slice 5.
- Growth chart: group by YYYY-MM, display last 7 months.
- Monthly breakdown: per month total, avg/day, compare to targets.monthly.
- Weekly reset: compute weekly total derived from entries (Monday start), do not persist.
- Streak: consecutive days up to today with amount > 0 entries.
- Reminder banner: show in dev mode if today has no entry.

## Testing Strategy
- Manual smoke tests per phase.
- Verify data persistence (Tauri + localStorage fallback).
- Validate date logic for streak, weekly reset, monthly aggregates.

## Phase Review Checkpoints
- After each phase: pause, summarize changes, and request review/approval before continuing.
