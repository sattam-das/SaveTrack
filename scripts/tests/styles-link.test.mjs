import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const htmlPath = join(__dirname, '..', '..', 'index.html');
const html = readFileSync(htmlPath, 'utf-8');

assert.ok(html.includes('rel="stylesheet" href="/src/styles.css"'), 'Missing styles.css link');

console.log('styles-link tests passed');
