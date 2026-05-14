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
