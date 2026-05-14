import assert from 'node:assert/strict';
import { applyGoalCompletion } from '../../src/lib/goals.js';

const goal = { id: 'g1', amount: 100, saved: 120, completed: false, archived: false };
const updated = applyGoalCompletion(goal);

assert.equal(updated.completed, true);
assert.equal(updated.archived, true);

console.log('goals-completion tests passed');
