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
