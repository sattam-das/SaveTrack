import assert from 'node:assert/strict';
import { updateTargets } from '../../src/lib/targets.js';

const result = updateTargets({ monthly: 10, weekly: 5 }, 20, 7);
assert.equal(result.monthly, 20);
assert.equal(result.weekly, 7);

console.log('targets-update tests passed');
