import assert from 'node:assert/strict';
import studio from '../.runtime-check/api/studio.js';
const response=await studio.fetch(new Request('https://portfolio.test/api/session'));
assert.equal(response.status,200);
assert.deepEqual(await response.json(),{authenticated:false});
console.log('PASS: compiled Vercel entry loads under native Node ESM and returns JSON.');
