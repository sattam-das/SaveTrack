import assert from 'node:assert/strict';
import { bindOnce } from '../../src/lib/dom.js';

let calls = 0;
const el = { dataset: {}, addEventListener: () => { calls += 1; } };

bindOnce(el, 'LogSubmit', (node) => node.addEventListener('submit', () => {}));
bindOnce(el, 'LogSubmit', (node) => node.addEventListener('submit', () => {}));

assert.equal(calls, 1);
console.log('dom-bindonce tests passed');
