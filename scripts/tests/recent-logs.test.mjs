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
