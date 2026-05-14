import assert from 'node:assert/strict';
import { normalizeAppData } from '../../src/lib/normalize.js';

const raw = {
  entries: [{ id: '1', date: '2026-05-02', amount: 5 }],
  goals: [{ id: 'g', amount: 10, saved: 10 }]
};

const data = normalizeAppData(raw);

assert.equal(data.targets.weekly, 0);
assert.equal(data.targets.monthly, 0);
assert.equal(data.preferences.currency, '$');
assert.equal(data.entries[0].source, '');
assert.equal(data.entries[0].sourceCustom, '');
assert.equal(data.goals[0].completed, true);
assert.equal(data.goals[0].archived, true);

console.log('normalize tests passed');
