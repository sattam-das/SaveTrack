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
