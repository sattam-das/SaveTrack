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
