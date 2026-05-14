import assert from 'node:assert/strict';
import { getMonthlyTarget } from '../../src/lib/targets.js';

assert.equal(getMonthlyTarget(undefined), 0);
assert.equal(getMonthlyTarget({}), 0);
assert.equal(getMonthlyTarget({ monthly: 250 }), 250);

console.log('targets tests passed');
