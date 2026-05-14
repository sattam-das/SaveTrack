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
