#!/usr/bin/env node
// Sanity-checks data/sentences.json before it ships. No dependencies, so it
// can run in CI or before any deploy without a Python environment.
//
// Usage: node scripts/validate-sentences.mjs [path/to/sentences.json]

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || path.join(here, '..', 'data', 'sentences.json');

const raw = readFileSync(file, 'utf-8');
const data = JSON.parse(raw);

const errors = [];
const seenIds = new Set();

if (!Array.isArray(data) || data.length === 0) {
  console.error(`${file} is not a non-empty array`);
  process.exit(1);
}

data.forEach((entry, idx) => {
  const where = `row ${idx} (id ${entry && entry.i})`;

  if (typeof entry.i !== 'number' || !Number.isInteger(entry.i)) {
    errors.push(`${where}: "i" must be an integer`);
  } else if (seenIds.has(entry.i)) {
    errors.push(`${where}: duplicate id ${entry.i}`);
  } else {
    seenIds.add(entry.i);
  }

  if (typeof entry.e !== 'string' || entry.e.trim() === '') {
    errors.push(`${where}: "e" (English) is empty`);
  }
  if (typeof entry.t !== 'string' || entry.t.trim() === '') {
    errors.push(`${where}: "t" (Indonesian) is empty`);
  }
  if (!Array.isArray(entry.k) || entry.k.length === 0) {
    errors.push(`${where}: "k" (tokens) is empty`);
  } else {
    if (entry.k.some(tok => typeof tok !== 'string' || tok.trim() === '')) {
      errors.push(`${where}: "k" contains an empty token`);
    }
    // The joined tokens (ignoring a stripped trailing terminator) should
    // reproduce the English sentence, catching typos in manual edits.
    const joined = entry.k.join(' ');
    const eWithoutTerminator = entry.e.replace(/[.!?]+$/, '').trim();
    if (joined !== eWithoutTerminator) {
      errors.push(`${where}: "k" (${JSON.stringify(entry.k)}) doesn't match "e" ("${entry.e}")`);
    }
  }
});

if (errors.length > 0) {
  console.error(`${errors.length} problem(s) found in ${file}:`);
  errors.slice(0, 50).forEach(e => console.error(`  - ${e}`));
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
  process.exit(1);
}

console.log(`OK — ${data.length} sentences in ${file}, no issues found.`);
