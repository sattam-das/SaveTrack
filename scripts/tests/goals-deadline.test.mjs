import assert from 'node:assert/strict';
import { getDaysLeftBadge } from '../../src/lib/goals.js';

const today = new Date('2026-05-01');

assert.equal(getDaysLeftBadge('2026-05-20', today), 19);
assert.equal(getDaysLeftBadge('2026-06-05', today), null);
assert.equal(getDaysLeftBadge('', today), null);

console.log('goals-deadline tests passed');
