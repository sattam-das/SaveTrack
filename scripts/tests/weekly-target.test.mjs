import assert from 'node:assert/strict';
import { getWeeklyTotal } from '../../src/lib/analytics.js';

const entries = [
  { id: 'a', date: '2026-05-04', amount: 10 },
  { id: 'b', date: '2026-05-05', amount: 5 },
  { id: 'c', date: '2026-05-11', amount: 7 }
];

const total = getWeeklyTotal(entries, new Date('2026-05-06'));
assert.equal(total, 15);

console.log('weekly-target tests passed');
