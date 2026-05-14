# SaveTrack Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix log handler duplication, target=0 progress, timezone drift, history sorting, missing normalization, offline assets, and weekly target edit.

**Architecture:** Add small date and DOM utilities, normalize data on load, and update components to use local date keys consistently. Move Tailwind + fonts to local assets via Vite build.

**Tech Stack:** Vite, Tailwind, JS (ESM), Node assert tests, Tauri.

---

## Task 1: Date Utilities (Local Keys)

**Files:**
- Create: `scripts/tests/dates.test.mjs`
- Create: `src/lib/dates.js`

- [ ] **Step 1: Write failing test**

```js
// scripts/tests/dates.test.mjs
import assert from 'node:assert/strict';
import { toLocalDateKey, parseLocalDate, formatDateLabel } from '../../src/lib/dates.js';

const key = toLocalDateKey(new Date(2026, 4, 2));
assert.equal(key, '2026-05-02');

const parsed = parseLocalDate('2026-05-02');
assert.equal(parsed.getFullYear(), 2026);
assert.equal(parsed.getMonth(), 4);
assert.equal(parsed.getDate(), 2);

const label = formatDateLabel('2026-05-02', true);
assert.equal(label, 'May 2, 2026');

console.log('dates tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/dates.test.mjs`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement dates helper**

```js
// src/lib/dates.js
export function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(key, includeYear = false) {
  const date = parseLocalDate(key);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {})
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/dates.test.mjs`
Expected: PASS with `dates tests passed`

---

## Task 2: DOM Bind Once Helper (Fix Log Handler Duplication)

**Files:**
- Create: `scripts/tests/dom-bindonce.test.mjs`
- Create: `src/lib/dom.js`
- Modify: `src/components/log.js`

- [ ] **Step 1: Write failing test**

```js
// scripts/tests/dom-bindonce.test.mjs
import assert from 'node:assert/strict';
import { bindOnce } from '../../src/lib/dom.js';

let calls = 0;
const el = { dataset: {}, addEventListener: () => { calls += 1; } };

bindOnce(el, 'logSubmit', (node) => node.addEventListener('submit', () => {}));
bindOnce(el, 'logSubmit', (node) => node.addEventListener('submit', () => {}));

assert.equal(calls, 1);
console.log('dom-bindonce tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/dom-bindonce.test.mjs`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement helper**

```js
// src/lib/dom.js
export function bindOnce(element, key, binder) {
  if (!element) return;
  const attr = `bound${key}`;
  if (element.dataset && element.dataset[attr] === 'true') return;
  if (element.dataset) element.dataset[attr] = 'true';
  binder(element);
}
```

- [ ] **Step 4: Update log module to use bindOnce**

```js
// src/components/log.js (example usage)
import { bindOnce } from '../lib/dom.js';

bindOnce(openBtn, 'LogOpen', (node) => {
  node.addEventListener('click', () => { /* open modal */ });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/tests/dom-bindonce.test.mjs`
Expected: PASS with `dom-bindonce tests passed`

---

## Task 3: Normalize App Data on Load

**Files:**
- Create: `scripts/tests/normalize.test.mjs`
- Modify: `src/main.js`

- [ ] **Step 1: Write failing test**

```js
// scripts/tests/normalize.test.mjs
import assert from 'node:assert/strict';
import { normalizeAppData } from '../../src/main.js';

const raw = { entries: [{ id: '1', date: '2026-05-02', amount: 5 }], goals: [{ id: 'g', amount: 10, saved: 10 }] };
const data = normalizeAppData(raw);

assert.equal(data.targets.weekly, 0);
assert.equal(data.targets.monthly, 0);
assert.equal(data.preferences.currency, '$');
assert.equal(data.entries[0].source, '');
assert.equal(data.entries[0].sourceCustom, '');
assert.equal(data.goals[0].completed, true);
assert.equal(data.goals[0].archived, true);

console.log('normalize tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/normalize.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Implement normalizeAppData**

```js
// src/main.js
export function normalizeAppData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  data.entries = Array.isArray(data.entries) ? data.entries : [];
  data.targets = data.targets && typeof data.targets === 'object' ? data.targets : {};
  data.goals = Array.isArray(data.goals) ? data.goals : [];
  data.preferences = data.preferences && typeof data.preferences === 'object' ? data.preferences : {};

  data.targets.weekly = typeof data.targets.weekly === 'number' ? data.targets.weekly : 0;
  data.targets.monthly = typeof data.targets.monthly === 'number' ? data.targets.monthly : 0;
  data.preferences.currency = data.preferences.currency || '$';

  data.entries = data.entries.map(entry => ({
    source: '',
    sourceCustom: '',
    ...entry
  }));

  data.goals = data.goals.map(goal => {
    const completed = goal.saved >= goal.amount;
    return {
      completed: false,
      archived: false,
      ...goal,
      completed,
      archived: completed
    };
  });

  return data;
}
```

- [ ] **Step 4: Wire normalization into loadData**

```js
// src/main.js (inside loadData)
appData = normalizeAppData(JSON.parse(dataStr));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/tests/normalize.test.mjs`
Expected: PASS with `normalize tests passed`

---

## Task 4: Local Date Keys in Analytics + History Sorting

**Files:**
- Create: `scripts/tests/history-series.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `src/components/history.js`

- [ ] **Step 1: Write failing test**

```js
// scripts/tests/history-series.test.mjs
import assert from 'node:assert/strict';
import { getHistorySeries } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2025-12-31', amount: 5 },
  { id: 'b', date: '2026-01-02', amount: 3 },
  { id: 'c', date: '2026-01-01', amount: 2 }
];

const series = getHistorySeries(entries, 'all');
assert.deepEqual(series.labels, ['Dec 31, 2025', 'Jan 1, 2026', 'Jan 2, 2026']);
assert.deepEqual(series.data, [5, 2, 3]);

console.log('history-series tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/history-series.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Implement helper using local date keys**

```js
// src/lib/analytics.js
import { toLocalDateKey, parseLocalDate, formatDateLabel } from './dates.js';

export function getHistorySeries(entries, timeframe, now = new Date()) {
  const dateGroups = new Map();
  entries.forEach(entry => {
    const key = entry.date;
    dateGroups.set(key, (dateGroups.get(key) || 0) + entry.amount);
  });

  if (timeframe === 'all') {
    const keys = [...dateGroups.keys()].sort((a, b) => parseLocalDate(a) - parseLocalDate(b));
    return {
      labels: keys.map(key => formatDateLabel(key, true)),
      data: keys.map(key => dateGroups.get(key) || 0)
    };
  }

  const days = parseInt(timeframe, 10);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const labels = [];
  const data = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const key = toLocalDateKey(d);
    labels.push(formatDateLabel(key, false));
    data.push(dateGroups.get(key) || 0);
  }

  return { labels, data };
}
```

- [ ] **Step 4: Update history chart to use getHistorySeries**

```js
// src/components/history.js
const { labels, data } = getHistorySeries(entries, timeframe);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/tests/history-series.test.mjs`
Expected: PASS with `history-series tests passed`

---

## Task 5: Update Date Usage Everywhere

**Files:**
- Modify: `src/components/log.js`
- Modify: `src/components/dashboard.js`
- Modify: `src/lib/analytics.js`

- [ ] **Step 1: Update log date to local key**

```js
import { toLocalDateKey } from '../lib/dates.js';
const date = toLocalDateKey(new Date());
```

- [ ] **Step 2: Update analytics to use local keys**

```js
// getStreak, getWeeklyTotal, monthly buckets use entry.date directly
```

- [ ] **Step 3: Update dashboard labels using formatDateLabel**

```js
import { formatDateLabel } from '../lib/dates.js';
const dateLabel = formatDateLabel(entry.date, true);
```

---

## Task 6: Weekly Target Edit in Goals

**Files:**
- Create: `scripts/tests/targets-update.test.mjs`
- Modify: `src/lib/targets.js`
- Modify: `index.html`
- Modify: `src/components/goals.js`

- [ ] **Step 1: Write failing test**

```js
// scripts/tests/targets-update.test.mjs
import assert from 'node:assert/strict';
import { updateTargets } from '../../src/lib/targets.js';

const result = updateTargets({ monthly: 10, weekly: 5 }, 20, 7);
assert.equal(result.monthly, 20);
assert.equal(result.weekly, 7);

console.log('targets-update tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/targets-update.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Implement updateTargets**

```js
// src/lib/targets.js
export function updateTargets(targets, monthlyValue, weeklyValue) {
  return {
    monthly: typeof monthlyValue === 'number' && monthlyValue > 0 ? monthlyValue : 0,
    weekly: typeof weeklyValue === 'number' && weeklyValue > 0 ? weeklyValue : 0
  };
}
```

- [ ] **Step 4: Add weekly input to Goals modal and wire save**

```html
<!-- index.html in edit-target-modal -->
<input type="number" id="new-weekly-amount" step="1" min="1" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface mb-4">
```

```js
// src/components/goals.js
const weeklyInput = document.getElementById('new-weekly-amount');
const updated = updateTargets(appData.targets, val, parseFloat(weeklyInput.value));
appData.targets = updated;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/tests/targets-update.test.mjs`
Expected: PASS with `targets-update tests passed`

---

## Task 7: Offline Assets (Tailwind + Fonts)

**Files:**
- Create: `src/styles.css`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `package.json`

- [ ] **Step 1: Add Tailwind + fonts dependencies**

Run:
```
npm install -D tailwindcss postcss autoprefixer @tailwindcss/container-queries
npm install @fontsource/inter @fontsource/material-symbols-outlined
```

- [ ] **Step 2: Create Tailwind config**

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts}"] ,
  darkMode: 'class',
  theme: {
    extend: {
      colors: { /* copy existing palette from index.html */ },
      borderRadius: { /* copy existing values */ },
      spacing: { /* copy existing values */ },
      fontFamily: { /* copy existing values */ }
    }
  },
  plugins: [require('@tailwindcss/container-queries')]
};
```

- [ ] **Step 3: Create PostCSS config**

```js
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 4: Create styles.css and import fonts**

```css
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/inter/800.css";
@import "@fontsource/material-symbols-outlined";

@tailwind base;
@tailwind components;
@tailwind utilities;

body { background-color: #3D2C22; color: #e3e2e2; }
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #1f2020; }
::-webkit-scrollbar-thumb { background: #343535; border-radius: 10px; }
```

- [ ] **Step 5: Update main.js to import styles**

```js
import './styles.css';
```

- [ ] **Step 6: Remove CDN scripts/links from index.html**

Remove:
- `<script src="https://cdn.tailwindcss.com?...">`
- `<link href="https://fonts.googleapis.com/...">`
- Inline `tailwind.config` script

- [ ] **Step 7: Run build/dev offline check**

Run: `npm run dev` and ensure UI loads with no network.

---

## Task 8: Full Test Run

- [ ] Run all tests:

```
node scripts/tests/*.test.mjs
```

Expected: all tests pass.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-savetrack-fixes.md`.
Two execution options:

1. Subagent-Driven (recommended) — dispatch a fresh subagent per task
2. Inline Execution — execute tasks in this session

Which approach?
