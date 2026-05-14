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
