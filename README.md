<div align="center">

# 💰 SaveTrack

**A privacy-first, offline savings tracker built for your desktop.**

Track your savings goals, monitor your progress, and visualize your financial journey — all without a single byte leaving your machine.

---

[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?style=flat-square&logo=tauri)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-stable-orange?style=flat-square&logo=rust)](https://www.rust-lang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=flat-square&logo=vite)](https://vitejs.dev)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-pink?style=flat-square&logo=chartdotjs)](https://www.chartjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## 🧭 Overview

SaveTrack is a **native Windows desktop application** built with [Tauri](https://tauri.app). It gives you a clean, fast, and fully offline interface to:

- Log your savings entries day by day
- Set monthly and weekly targets to stay disciplined
- Create and manage priority-based financial goals
- Visualize your savings history with interactive charts
- Keep your data 100% private — stored only on your device

> **Why SaveTrack?** Most personal finance apps require cloud accounts or subscriptions. SaveTrack flips that model: your data lives in a local JSON file on your machine, and the app runs as a native desktop shell. No internet, no accounts, no tracking.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | At-a-glance view of total saved, goal progress, growth trends, and targets |
| 📝 **Savings Log** | Add entries with a date and optional note; auto-assigns to your priority goal |
| 🎯 **Goals & Targets** | Create savings goals, set monthly/weekly targets, and track progress with bars |
| ⭐ **Priority Goal** | Star one goal to make it the primary driver of the dashboard progress display |
| 📈 **Analytics & History** | Interactive line charts for 7-day, 30-day, and all-time views with lifetime stats |
| 🗓️ **Calendar View** | Navigate and review your historical savings entries by date |
| 🔔 **Notifications** | In-app alerts and feedback for key actions |
| ⚙️ **Settings** | Currency selector, JSON export, and full data wipe with confirmation |
| 🔒 **Offline-First** | No cloud. All data is stored in a local `store.json` file via Tauri's file system API |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  Layer           Technology                              │
├─────────────────────────────────────────────────────────┤
│  Desktop Shell   Tauri v2 (Rust)                        │
│  Frontend UI     Vanilla HTML + JavaScript (ESM)        │
│  Styling         Tailwind CSS v3 (local build via Vite) │
│  Charts          Chart.js v4                            │
│  Fonts & Icons   Inter (fontsource) + Material Symbols  │
│  Bundler         Vite v5                                │
│  Storage         Local JSON (Tauri FS) → localStorage  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
SaveTrack/
├── index.html                  # Single-page app shell
├── src/
│   ├── main.js                 # App bootstrap, data load, routing
│   ├── styles.css              # Global styles + Tailwind entry point
│   ├── components/             # UI view modules
│   │   ├── dashboard.js        # Main dashboard view
│   │   ├── goals.js            # Goals & targets management
│   │   ├── log.js              # Savings entry form
│   │   ├── history.js          # Analytics & history charts
│   │   ├── calendar.js         # Calendar date picker view
│   │   ├── notifications.js    # In-app notification system
│   │   └── settings.js         # Settings panel
│   └── lib/                    # Shared utilities
│       ├── analytics.js        # Streak, weekly, and monthly calculations
│       ├── dates.js            # Timezone-safe local date helpers
│       ├── normalize.js        # Data normalization on load
│       ├── targets.js          # Target resolution logic
│       ├── goals.js            # Goal helper functions
│       └── dom.js              # DOM utility helpers
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs             # Tauri app entry point
│       └── lib.rs              # Tauri commands (read_data, write_data)
├── scripts/                    # Test and utility scripts
├── public/                     # Static assets
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## 📐 Data Model

All user data is persisted as a single `store.json` in the system's app data directory.

```json
{
  "entries": [
    {
      "id": "uuid-v4",
      "date": "2026-05-14",
      "amount": 500.00,
      "note": "Monthly savings deposit"
    }
  ],
  "targets": {
    "weekly": 1000,
    "monthly": 5000
  },
  "goals": [
    {
      "id": "uuid-v4",
      "name": "Emergency Fund",
      "amount": 50000,
      "saved": 12000,
      "deadline": "",
      "completed": false,
      "isPriority": true
    }
  ],
  "preferences": {
    "currency": "₹"
  }
}
```

> **Storage fallback:** If the Tauri file system plugin is unavailable (e.g., running in a browser preview), the app seamlessly falls back to `localStorage`.

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

| Dependency | Version | Link |
|---|---|---|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| Rust (stable) | latest | [rustup.rs](https://rustup.rs) |
| Tauri CLI prerequisites | v2 | [tauri.app/start](https://tauri.app/start/prerequisites/) |

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/savetrack.git
cd savetrack
```

**2. Install Node dependencies:**
```bash
npm install
```

**3. Start in development mode:**
```bash
npm run tauri dev
```
This launches Vite for hot module reloading and opens the native Tauri window.

### Building for Production

```bash
npm run tauri build
```

The installer and executable are output to `src-tauri/target/release/bundle/`.

---

## 🏗️ Architecture Notes

### Data Flow

```
User Action (UI)
    │
    ▼
Component (e.g., log.js)
    │  reads/writes appData
    ▼
main.js (appData state)
    │  calls write_data
    ▼
Tauri Command (Rust: lib.rs)
    │  writes to disk
    ▼
store.json (App Data Dir)
```

### Key Design Decisions

- **No framework:** Vanilla JS with ES Modules keeps the bundle minimal and avoids framework overhead for what is essentially a data-driven single-page app.
- **Immutable state updates:** `appData` is always replaced with a new object after mutations — never mutated in place.
- **Timezone-safe dates:** All date handling goes through `src/lib/dates.js` helpers (`toLocalDateKey`, `parseLocalDate`) to prevent timezone drift between what the user sees and what is stored.
- **Idempotent init:** Every view module's `init*()` function uses the clone-and-replace pattern to ensure event handlers are never attached more than once per render cycle.
- **Data normalization:** `normalizeAppData()` runs immediately on load to backfill any missing fields (e.g., `entries.source`, `goals.completed`), making the app robust against stale or partial data files.

---

## 🧪 Testing

Unit and integration tests live in `scripts/tests/` and are written as native ESM test scripts.

```bash
# Run all tests
node scripts/tests/<test-file>.test.mjs
```

Key test areas:
- `dates.js` — local date key parsing and formatting
- `normalize.js` — data normalization edge cases
- `analytics.js` — streak calculation, weekly totals

---

## 🛣️ Roadmap

- [x] Dashboard with goal progress and growth chart
- [x] Savings log with priority goal auto-allocation
- [x] Goals management (create, edit, fund, delete, star)
- [x] Analytics history charts (7d / 30d / all-time)
- [x] Calendar view for historical entries
- [x] Timezone-safe date utilities
- [x] Offline asset bundling (no CDN dependency)
- [ ] Daily streak tracking and reminder notifications
- [ ] Recurring target resets (weekly/monthly auto-reset)
- [ ] Goal deadline tracking in UI
- [ ] Dynamic "Recent Logs" list on dashboard
- [ ] `.exe` release distribution and auto-updater

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `git commit -m "feat: add streak notifications"`
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ using Tauri + Rust + Vanilla JS

</div>
