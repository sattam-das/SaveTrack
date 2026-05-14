# SaveTrack (As-Built Overview)

## Summary
SaveTrack is a native Windows desktop app (Tauri) for tracking personal savings. The current build delivers a multi-tab dashboard UI with goals, analytics, and settings. Data is stored locally via Tauri commands with a localStorage fallback. The UI is built with HTML + Tailwind (CDN) and uses Chart.js for charts.

## Tech Stack
- Desktop Shell: Tauri
- Frontend: HTML, Tailwind (CDN), JavaScript
- Backend: Rust (Tauri commands for file storage)
- Charts: Chart.js
- Storage: Local JSON file (store.json in app data)

## Implemented Features

### 1) Dashboard
- Total saved amount (sum of all entries)
- Goal progress bar and % achieved
- Target display (monthly target or priority goal target)
- Growth analysis bar chart (Chart.js, currently using mock monthly data)
- Log savings CTA modal

### 2) Logging
- Add savings entry (amount + optional note)
- Auto-assigns entry amount to a priority goal if one is set
- Data persists locally (Tauri file storage or localStorage fallback)

### 3) Goals & Targets
- Monthly target display and edit modal
- Create goal (name + amount)
- Goal list with progress bars and completion state
- Add funds to a goal (modal prompt)
- Delete goal with confirmation
- Priority goal toggle (star icon) to drive dashboard target

### 4) Analytics & History
- Lifetime stats: total saved, average per day, best day
- History line chart (Chart.js) with 7/30/all timeframes
- Chart buckets ensure continuity for fixed timeframes

### 5) Settings
- Currency symbol selection (USD, EUR, GBP, JPY, INR)
- Export data to JSON file
- Wipe all data (confirmations + reset)

## Data Model (Current)
Saved locally as JSON:

```
{
  "entries": [
    { "id": "uuid", "date": "YYYY-MM-DD", "amount": 20.5, "note": "Optional" }
  ],
  "targets": {
    "weekly": 0,
    "monthly": 15000
  },
  "goals": [
    {
      "id": "uuid",
      "name": "New Phone",
      "amount": 500,
      "saved": 120,
      "deadline": "",
      "completed": false,
      "isPriority": true
    }
  ],
  "preferences": {
    "currency": "$"
  }
}
```

Notes:
- `deadline` exists but is not currently used in UI.
- `completed` is inferred by `saved >= amount` in UI.
- `isPriority` is used to drive dashboard progress target.

## App Structure (Actual)
```
SaveTrack/
├── index.html
├── src/
│   ├── main.js
│   └── components/
│       ├── dashboard.js
│       ├── goals.js
│       ├── log.js
│       ├── history.js
│       └── settings.js
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── lib.rs
└── package.json
```

## Tauri Storage Behavior
- `read_data` loads a `store.json` file from the app data directory.
- `write_data` overwrites the same file.
- If Tauri is unavailable, the app falls back to `localStorage`.

## Known Issues
- Dashboard “Recent Logs” list is static and not wired to saved entries.
- Growth analysis bar chart uses mock data, not real entry history.
- Goal `deadline` and `completed` fields exist but are not surfaced in UI.
- Weekly targets and streak logic are not implemented yet.
- `targets.monthly` defaults vary between modules (1000 vs 15000).

## Known Issues Workarounds
- Use the Analytics chart for actual history until Recent Logs is dynamic.
- Treat the Growth Analysis card as decorative until real data is wired.
- Track goal deadlines manually outside the app for now.
- Ignore weekly target/streak fields in stored data until implemented.
- Set monthly target explicitly to avoid default inconsistencies.

## What Is Not Yet Built (Planned)
- Recurring targets logic (weekly/monthly resets)
- Daily streak tracking and reminders
- Editable or dynamic “Recent Logs” list on the dashboard
- Goal deadlines in UI and completion flow
- History summary breakdown beyond lifetime stats
- Packaging to .exe / release distribution

## Build Phase Status (Updated)
1. Project scaffold + Tauri setup: Completed
2. Dark theme UI layout: Completed
3. Dashboard UI + charts: Completed (growth chart currently uses mock data)
4. Local JSON storage (Rust commands): Completed
5. Log form + entry list: Partially completed (form works, list is static)
6. Recurring targets logic: Not implemented
7. Goals management: Completed (create, edit target, add funds, delete, priority)
8. History views and stats: Completed
9. Packaging to .exe: Not started

## Success Criteria (Current State)
- Runs as a native Tauri app shell
- Logs and persists savings data locally
- Dashboard updates when data changes
- Goals and history views function end-to-end
- No cloud dependency
