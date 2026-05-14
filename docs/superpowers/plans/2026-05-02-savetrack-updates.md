# SaveTrack Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement phased fixes and features for SaveTrack with a user review checkpoint after each phase.

**Architecture:** Add a small analytics utility module for date and aggregation logic. UI components consume these pure functions. Data model updates remain backward compatible. No backend changes beyond config for packaging.

**Tech Stack:** Tauri, Vite, plain JavaScript (ESM), Chart.js, Tailwind (CDN), Node.js (assert) for tests.

---

## File Structure and Responsibilities

- Create: `src/lib/analytics.js` (pure functions: recent logs, monthly aggregates, streak, weekly totals, source breakdown)
- Create: `src/lib/targets.js` (target getters with 0 fallback)
- Create: `src/lib/goals.js` (deadline badge logic, completion helpers)
- Create: `scripts/tests/*.test.mjs` (node assert tests)
- Modify: `index.html` (UI placeholders and new inputs)
- Modify: `src/main.js` (add date prompt modal utilities)
- Modify: `src/components/dashboard.js` (recent logs, streak, weekly progress, reminder banner, growth chart)
- Modify: `src/components/log.js` (source tagging)
- Modify: `src/components/goals.js` (deadline display/edit, completion banner, archived list, target defaults)
- Modify: `src/components/history.js` (monthly breakdown table, source breakdown)
- Modify: `src-tauri/tauri.conf.json` (bundle metadata for packaging)

---

## Phase 1: Bugs to Fix First

### Task 1: Recent Logs (dynamic list) + Recent Log Utilities

**Files:**
- Create: `scripts/tests/recent-logs.test.mjs`
- Create: `src/lib/analytics.js`
- Modify: `index.html`
- Modify: `src/components/dashboard.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/recent-logs.test.mjs
import assert from 'node:assert/strict';
import { getRecentEntries } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-05-01', amount: 10 },
  { id: 'b', date: '2026-05-03', amount: 5 },
  { id: 'c', date: '2026-05-02', amount: 7 }
];

const recent = getRecentEntries(entries, 2);
assert.equal(recent.length, 2);
assert.equal(recent[0].id, 'b');
assert.equal(recent[1].id, 'c');

console.log('recent-logs tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/recent-logs.test.mjs`
Expected: FAIL (module not found or missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
export function sortEntriesByDateDesc(entries) {
  return [...entries].sort((a, b) => {
    const diff = new Date(b.date) - new Date(a.date);
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  });
}

export function getRecentEntries(entries, count = 5) {
  return sortEntriesByDateDesc(entries).slice(0, count);
}
```

Update `index.html` to replace the static Recent Logs list with a container:

```html
<!-- Replace the static Recent Logs items with this container -->
<div id="recent-logs-list" class="overflow-y-auto space-y-4 pr-2"></div>
```

Update `src/components/dashboard.js` to render the list:

```js
import { formatCurrency } from '../main.js';
import { getRecentEntries } from '../lib/analytics.js';

function renderRecentLogs(entries) {
  const list = document.getElementById('recent-logs-list');
  if (!list) return;

  const recent = getRecentEntries(entries, 5);
  if (recent.length === 0) {
    list.innerHTML = '<p class="text-on-surface-variant font-body-md">No logs yet. Add your first entry.</p>';
    return;
  }

  list.innerHTML = recent.map(entry => {
    const dateLabel = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <div class="flex items-center justify-between p-4 rounded-lg bg-surface-container-high border border-transparent hover:border-outline-variant transition-colors group">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary-container">savings</span>
          </div>
          <div>
            <p class="font-label-md text-label-md text-on-surface">${entry.note || 'Savings Entry'}</p>
            <p class="font-label-sm text-label-sm text-on-surface-variant">${dateLabel}</p>
          </div>
        </div>
        <p class="font-numeric-data text-numeric-data text-primary-container">+${formatCurrency(entry.amount)}</p>
      </div>
    `;
  }).join('');
}
```

Call `renderRecentLogs(data.entries)` inside `initDashboard` after totals are computed.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/recent-logs.test.mjs`
Expected: PASS with `recent-logs tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/recent-logs.test.mjs src/lib/analytics.js index.html src/components/dashboard.js
git commit -m "fix: render recent logs from saved entries"
```

---

### Task 2: Growth Chart Monthly Aggregates

**Files:**
- Create: `scripts/tests/monthly-aggregates.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `src/components/dashboard.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/monthly-aggregates.test.mjs
import assert from 'node:assert/strict';
import { getMonthlySeries } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-03-01', amount: 10 },
  { id: 'b', date: '2026-03-12', amount: 5 },
  { id: 'c', date: '2026-04-02', amount: 7 },
  { id: 'd', date: '2026-05-05', amount: 20 }
];

const { keys, values } = getMonthlySeries(entries, 3, new Date('2026-05-15'));
assert.deepEqual(keys, ['2026-03', '2026-04', '2026-05']);
assert.deepEqual(values, [15, 7, 20]);

console.log('monthly-aggregates tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/monthly-aggregates.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
function toMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthlyTotals(entries) {
  const totals = new Map();
  entries.forEach(entry => {
    const key = toMonthKey(new Date(entry.date));
    totals.set(key, (totals.get(key) || 0) + entry.amount);
  });
  return totals;
}

export function getMonthlySeries(entries, monthsCount = 7, endDate = new Date()) {
  const totals = getMonthlyTotals(entries);
  const keys = [];
  const labels = [];
  for (let i = monthsCount - 1; i >= 0; i -= 1) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const key = toMonthKey(d);
    keys.push(key);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
  }
  const values = keys.map(key => totals.get(key) || 0);
  return { keys, labels, values };
}
```

Update `src/components/dashboard.js` chart data to use `getMonthlySeries` instead of mock data:

```js
import { getMonthlySeries } from '../lib/analytics.js';

function renderChart(entries) {
  const ctx = document.getElementById('growthChart');
  if (!ctx) return;

  if (growthChartInstance) growthChartInstance.destroy();

  const { labels, values } = getMonthlySeries(entries, 7, new Date());

  growthChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: values.map((_, i) => (i === values.length - 1 ? '#BB734B' : '#523c30')),
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    // options unchanged
  });
}
```

Call `renderChart(data.entries)` from `initDashboard`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/monthly-aggregates.test.mjs`
Expected: PASS with `monthly-aggregates tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/monthly-aggregates.test.mjs src/lib/analytics.js src/components/dashboard.js
git commit -m "fix: use real monthly aggregates in growth chart"
```

---

### Task 3: Monthly Target Default Consistency

**Files:**
- Create: `scripts/tests/targets.test.mjs`
- Create: `src/lib/targets.js`
- Modify: `src/components/dashboard.js`
- Modify: `src/components/goals.js`
- Modify: `src/components/settings.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/targets.test.mjs
import assert from 'node:assert/strict';
import { getMonthlyTarget } from '../../src/lib/targets.js';

assert.equal(getMonthlyTarget(undefined), 0);
assert.equal(getMonthlyTarget({}), 0);
assert.equal(getMonthlyTarget({ monthly: 250 }), 250);

console.log('targets tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/targets.test.mjs`
Expected: FAIL (missing module)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/targets.js
export function getMonthlyTarget(targets) {
  if (!targets || typeof targets.monthly !== 'number') return 0;
  return targets.monthly;
}

export function getWeeklyTarget(targets) {
  if (!targets || typeof targets.weekly !== 'number') return 0;
  return targets.weekly;
}
```

Update `src/components/dashboard.js` and `src/components/goals.js` to use `getMonthlyTarget` and remove hardcoded defaults. Update `src/components/settings.js` wipe to set monthly target to 0:

```js
// settings.js wipe action
appData.targets = { weekly: 0, monthly: 0 };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/targets.test.mjs`
Expected: PASS with `targets tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/targets.test.mjs src/lib/targets.js src/components/dashboard.js src/components/goals.js src/components/settings.js
git commit -m "fix: normalize monthly target defaults"
```

---

### Phase 1 Checkpoint
- [ ] Run `npm run dev` and confirm:
  - Recent Logs show last 5 entries.
  - Growth chart uses real monthly totals.
  - Monthly target displays 0 when unset.
- [ ] Notify user to review Phase 1 before continuing.

---

## Phase 2: Incomplete Features

### Task 4: Goal Deadlines (display + edit + badge)

**Files:**
- Create: `scripts/tests/goals-deadline.test.mjs`
- Create: `src/lib/goals.js`
- Modify: `index.html`
- Modify: `src/main.js`
- Modify: `src/components/goals.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/goals-deadline.test.mjs
import assert from 'node:assert/strict';
import { getDaysLeftBadge } from '../../src/lib/goals.js';

const today = new Date('2026-05-01');

assert.equal(getDaysLeftBadge('2026-05-20', today), 19);
assert.equal(getDaysLeftBadge('2026-06-05', today), null);
assert.equal(getDaysLeftBadge('', today), null);

console.log('goals-deadline tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/goals-deadline.test.mjs`
Expected: FAIL (missing module)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/goals.js
export function getDaysLeftBadge(deadline, today = new Date()) {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  const diffDays = Math.round((end - start) / 86400000);
  if (diffDays < 0 || diffDays > 30) return null;
  return diffDays;
}
```

Update `index.html` create-goal modal to include a deadline input:

```html
<div>
  <label class="block font-label-md text-on-surface-variant mb-1">Deadline (Optional)</label>
  <input type="date" id="new-goal-deadline" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface">
</div>
```

Add a date prompt modal utility in `src/main.js`:

```js
export function showDatePrompt(title, message, defaultValue = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    overlay.innerHTML = `
      <div class="bg-surface border border-outline-variant rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
        <h3 class="font-headline-sm text-on-surface mb-2">${title}</h3>
        <p class="font-body-md text-on-surface-variant mb-4">${message}</p>
        <input type="date" id="modal-date-input" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 mb-6 text-on-surface" value="${defaultValue}" />
        <div class="flex justify-end gap-3">
          <button id="modal-cancel-btn" class="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md">Cancel</button>
          <button id="modal-confirm-btn" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.classList.remove('opacity-0'); overlay.querySelector('div').classList.remove('scale-95'); }, 10);

    const close = (result) => {
      overlay.classList.add('opacity-0');
      overlay.querySelector('div').classList.add('scale-95');
      setTimeout(() => { if (document.body.contains(overlay)) document.body.removeChild(overlay); resolve(result); }, 300);
    };

    overlay.querySelector('#modal-cancel-btn').addEventListener('click', () => close(null));
    overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => close(overlay.querySelector('#modal-date-input').value));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
  });
}
```

Update `src/components/goals.js` to store `deadline` on create and show/edit on cards using `showDatePrompt` and `getDaysLeftBadge`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/goals-deadline.test.mjs`
Expected: PASS with `goals-deadline tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/goals-deadline.test.mjs src/lib/goals.js src/main.js src/components/goals.js index.html
git commit -m "feat: add goal deadlines with badges"
```

---

### Task 5: Goal Completion Flow + Archived Goals

**Files:**
- Create: `scripts/tests/goals-completion.test.mjs`
- Modify: `src/lib/goals.js`
- Modify: `index.html`
- Modify: `src/components/goals.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/goals-completion.test.mjs
import assert from 'node:assert/strict';
import { applyGoalCompletion } from '../../src/lib/goals.js';

const goal = { id: 'g1', amount: 100, saved: 120, completed: false, archived: false };
const updated = applyGoalCompletion(goal);

assert.equal(updated.completed, true);
assert.equal(updated.archived, true);

console.log('goals-completion tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/goals-completion.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/goals.js
export function applyGoalCompletion(goal) {
  const isComplete = goal.saved >= goal.amount;
  if (!isComplete) return goal;
  return { ...goal, completed: true, archived: true };
}
```

Update `index.html` goals view to include an archived section:

```html
<section id="archived-goals-section" class="mt-10">
  <div class="flex justify-between items-end mb-4">
    <h2 class="font-headline-md text-headline-md text-on-surface">Archived Goals</h2>
  </div>
  <div id="archived-goals-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
</section>
```

Update `src/components/goals.js` to:
- Split active vs archived lists.
- Show a completion banner for completed goals.
- Block add-funds actions for completed goals.
- Apply `applyGoalCompletion` when a goal crosses its target.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/goals-completion.test.mjs`
Expected: PASS with `goals-completion tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/goals-completion.test.mjs src/lib/goals.js src/components/goals.js index.html
git commit -m "feat: add goal completion banner and archive list"
```

---

### Task 6: Monthly Breakdown Table

**Files:**
- Create: `scripts/tests/monthly-breakdown.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `index.html`
- Modify: `src/components/history.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/monthly-breakdown.test.mjs
import assert from 'node:assert/strict';
import { getMonthlyBreakdown } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-03-01', amount: 10 },
  { id: 'b', date: '2026-03-02', amount: 20 },
  { id: 'c', date: '2026-04-01', amount: 5 }
];

const breakdown = getMonthlyBreakdown(entries, 30);
assert.equal(breakdown.length, 2);
assert.equal(breakdown[0].monthKey, '2026-03');
assert.equal(breakdown[0].total, 30);
assert.equal(breakdown[0].avgPerDay, 15);
assert.equal(breakdown[0].vsTarget, 0);

console.log('monthly-breakdown tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/monthly-breakdown.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
export function getMonthlyBreakdown(entries, monthlyTarget = 0) {
  const buckets = new Map();
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets.has(key)) buckets.set(key, { total: 0, days: new Set() });
    const bucket = buckets.get(key);
    bucket.total += entry.amount;
    bucket.days.add(date.toISOString().split('T')[0]);
  });

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const daysLogged = data.days.size || 1;
      const avgPerDay = data.total / daysLogged;
      return {
        monthKey,
        total: data.total,
        avgPerDay,
        vsTarget: data.total - monthlyTarget
      };
    });
}
```

Update `index.html` analytics section to include a table container:

```html
<section class="bg-surface-container border border-outline-variant rounded-xl p-6 shadow-lg mt-6">
  <div class="flex justify-between items-center mb-4">
    <h2 class="font-headline-md text-headline-md text-on-surface">Monthly Breakdown</h2>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead class="text-on-surface-variant">
        <tr>
          <th class="py-2">Month</th>
          <th class="py-2">Total</th>
          <th class="py-2">Avg / Day</th>
          <th class="py-2">Vs Target</th>
        </tr>
      </thead>
      <tbody id="monthly-breakdown-body"></tbody>
    </table>
  </div>
</section>
```

Update `src/components/history.js` to render rows using `getMonthlyBreakdown`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/monthly-breakdown.test.mjs`
Expected: PASS with `monthly-breakdown tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/monthly-breakdown.test.mjs src/lib/analytics.js src/components/history.js index.html
git commit -m "feat: add monthly breakdown table"
```

---

### Phase 2 Checkpoint
- [ ] Run `npm run dev` and confirm deadlines display and edit, completed goals appear archived, and breakdown table renders.
- [ ] Notify user to review Phase 2 before continuing.

---

## Phase 3: New Features

### Task 7: Daily Streak + Log Reminder Banner

**Files:**
- Create: `scripts/tests/streak.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `index.html`
- Modify: `src/components/dashboard.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/streak.test.mjs
import assert from 'node:assert/strict';
import { getStreak, hasEntryForDate } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-05-01', amount: 5 },
  { id: 'b', date: '2026-05-02', amount: 3 },
  { id: 'c', date: '2026-05-04', amount: 2 }
];

assert.equal(getStreak(entries, new Date('2026-05-02')), 2);
assert.equal(getStreak(entries, new Date('2026-05-04')), 1);
assert.equal(hasEntryForDate(entries, new Date('2026-05-03')), false);

console.log('streak tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/streak.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
export function toISODate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.toISOString().split('T')[0];
}

export function hasEntryForDate(entries, date) {
  const key = toISODate(date);
  return entries.some(e => e.amount > 0 && e.date === key);
}

export function getStreak(entries, today = new Date()) {
  const entryDays = new Set(entries.filter(e => e.amount > 0).map(e => e.date));
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (entryDays.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
```

Update `index.html` to add a streak card and reminder banner container in the dashboard grid:

```html
<div id="log-reminder-banner" class="hidden md:col-span-12 bg-surface-container-low border border-outline-variant rounded-xl p-4 text-on-surface-variant">
  You have not logged today. Add a quick entry to keep your streak alive.
</div>

<div class="md:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-lg">
  <p class="font-label-md text-on-surface-variant uppercase tracking-widest mb-2">Daily Streak</p>
  <h3 id="daily-streak-value" class="font-display-md text-primary-container">0 days</h3>
</div>
```

Update `src/components/dashboard.js` to set streak text and toggle banner in dev mode:

```js
import { getStreak, hasEntryForDate } from '../lib/analytics.js';

const streakDisplay = document.getElementById('daily-streak-value');
if (streakDisplay) streakDisplay.innerText = `${getStreak(data.entries)} days`;

const banner = document.getElementById('log-reminder-banner');
if (banner && import.meta.env.DEV) {
  const hasToday = hasEntryForDate(data.entries, new Date());
  banner.classList.toggle('hidden', hasToday);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/streak.test.mjs`
Expected: PASS with `streak tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/streak.test.mjs src/lib/analytics.js src/components/dashboard.js index.html
git commit -m "feat: add daily streak and dev reminder banner"
```

---

### Task 8: Weekly Target Progress (Monday start)

**Files:**
- Create: `scripts/tests/weekly-target.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `index.html`
- Modify: `src/components/dashboard.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/weekly-target.test.mjs
import assert from 'node:assert/strict';
import { getWeeklyTotal } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-05-04', amount: 10 }, // Monday
  { id: 'b', date: '2026-05-05', amount: 5 },
  { id: 'c', date: '2026-05-11', amount: 7 } // next Monday
];

const total = getWeeklyTotal(entries, new Date('2026-05-06'));
assert.equal(total, 15);

console.log('weekly-target tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/weekly-target.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
export function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeeklyTotal(entries, today = new Date()) {
  const start = getWeekStart(today);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return entries.reduce((sum, entry) => {
    const d = new Date(entry.date);
    if (d >= start && d < end) return sum + entry.amount;
    return sum;
  }, 0);
}
```

Add a weekly progress card to `index.html`:

```html
<div class="md:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-lg">
  <p class="font-label-md text-on-surface-variant uppercase tracking-widest mb-2">Weekly Target</p>
  <div class="flex justify-between items-center mb-2">
    <span id="weekly-progress-value" class="font-headline-md text-on-surface">$0.00</span>
    <span id="weekly-target-value" class="font-label-sm text-on-surface-variant">$0.00</span>
  </div>
  <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
    <div id="weekly-progress-bar" class="h-full bg-primary-container transition-all"></div>
  </div>
</div>
```

Update `src/components/dashboard.js` to compute and render weekly progress using `getWeeklyTotal` and `getWeeklyTarget`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/weekly-target.test.mjs`
Expected: PASS with `weekly-target tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/weekly-target.test.mjs src/lib/analytics.js src/components/dashboard.js index.html
git commit -m "feat: add weekly target progress"
```

---

### Task 9: Side Income Source Tagging + Analytics Breakdown

**Files:**
- Create: `scripts/tests/source-breakdown.test.mjs`
- Modify: `src/lib/analytics.js`
- Modify: `index.html`
- Modify: `src/components/log.js`
- Modify: `src/components/dashboard.js`
- Modify: `src/components/history.js`

- [ ] **Step 1: Write the failing test**

```js
// scripts/tests/source-breakdown.test.mjs
import assert from 'node:assert/strict';
import { getSourceBreakdown } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-05-01', amount: 5, source: 'Tutoring' },
  { id: 'b', date: '2026-05-02', amount: 10, source: 'Tutoring' },
  { id: 'c', date: '2026-05-02', amount: 7, source: 'Other', sourceCustom: 'Gigs' }
];

const breakdown = getSourceBreakdown(entries);
assert.equal(breakdown.Tutoring, 15);
assert.equal(breakdown['Other: Gigs'], 7);

console.log('source-breakdown tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/tests/source-breakdown.test.mjs`
Expected: FAIL (missing export)

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/analytics.js
export function getSourceBreakdown(entries) {
  return entries.reduce((acc, entry) => {
    const label = entry.source === 'Other' && entry.sourceCustom
      ? `Other: ${entry.sourceCustom}`
      : (entry.source || 'Uncategorized');
    acc[label] = (acc[label] || 0) + entry.amount;
    return acc;
  }, {});
}
```

Update `index.html` log modal to include a source selector and optional custom input:

```html
<div>
  <label class="block font-label-md text-on-surface-variant mb-1">Source</label>
  <select id="log-source" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface">
    <option>Data labeling</option>
    <option>Tutoring</option>
    <option>Freelance</option>
    <option>Other</option>
  </select>
</div>
<div id="log-source-custom-wrap" class="hidden">
  <label class="block font-label-md text-on-surface-variant mb-1">Other Source</label>
  <input type="text" id="log-source-custom" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 text-on-surface">
</div>
```

Update `src/components/log.js` to store `source` and `sourceCustom`, and toggle the custom input when `Other` is selected.

Update `src/components/history.js` to render a simple source breakdown list under the chart using `getSourceBreakdown`.

Update `src/components/dashboard.js` recent logs rendering to include source label when present.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/tests/source-breakdown.test.mjs`
Expected: PASS with `source-breakdown tests passed`

- [ ] **Step 5: Commit**

```bash
git add scripts/tests/source-breakdown.test.mjs src/lib/analytics.js src/components/log.js src/components/history.js src/components/dashboard.js index.html
git commit -m "feat: add source tagging and analytics breakdown"
```

---

### Phase 3 Checkpoint
- [ ] Run `npm run dev` and confirm streak/weekly cards render, reminder banner works in dev, tagging appears in logs and analytics.
- [ ] Notify user to review Phase 3 before continuing.

---

## Phase 4: Packaging

### Task 10: Tauri Packaging Setup and Build

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Update bundle metadata**

```json
// src-tauri/tauri.conf.json
"identifier": "com.savetrack.app"
```

- [ ] **Step 2: Run build**

Run: `npm run tauri build`
Expected: Build succeeds and `.exe` appears under `src-tauri/target/release/bundle/`.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: configure bundle metadata for packaging"
```

---

## Final Phase Checkpoint
- [ ] Notify user to review packaging results and confirm next steps.

---

## Coverage Self-Review Checklist
- Phase 1: recent logs, monthly chart, target defaults are covered.
- Phase 2: deadlines, completion/archival, monthly breakdown are covered.
- Phase 3: streak, weekly target, source tagging, reminder banner are covered.
- Phase 4: packaging steps are covered.
