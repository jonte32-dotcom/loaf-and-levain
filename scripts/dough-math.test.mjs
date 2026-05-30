import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bulkHours, starterPrep, ddtWaterC, totalHydration } from './dough-math.mjs';

const near = (a, b, eps = 0.05) => Math.abs(a - b) <= eps;

test('bulkHours: reference point 24°C / 20% levain = 5.0 h', () => {
  assert.ok(near(bulkHours(24, 20), 5.0), `got ${bulkHours(24, 20)}`);
});

test('bulkHours: Q10 ~2.2 per 8°C colder roughly doubles the time', () => {
  assert.ok(near(bulkHours(16, 20), 11.0, 0.1), `16°C got ${bulkHours(16, 20)}`);
  assert.ok(near(bulkHours(32, 20), 2.27, 0.05), `32°C got ${bulkHours(32, 20)}`);
});

test('bulkHours: double the inoculation, halve the time', () => {
  assert.ok(near(bulkHours(24, 40), 2.5), `got ${bulkHours(24, 40)}`);
});

test('starterPrep: active=0, recent@22=6, cold@22=12', () => {
  assert.equal(starterPrep('active', 24), 0);
  assert.equal(starterPrep('recent', 22), 6);
  assert.equal(starterPrep('cold', 22), 12);
});

test('ddtWaterC: 3-factor formula gives sane water temps', () => {
  assert.equal(ddtWaterC(25, 18, 18, 3), 36); // cold kitchen → warm water
  assert.equal(ddtWaterC(25, 27, 27, 3), 18); // hot kitchen → cool water
  assert.equal(ddtWaterC(25, 27, 27, 6), 15); // stand mixer → colder
});

test('totalHydration: includes the levain flour & water', () => {
  // 500 g flour, 75% added water, 20% levain @100% → real total 77.3%
  assert.equal(totalHydration(500, 75, 20), 77.3);
  // no levain → equals the nominal figure
  assert.equal(totalHydration(500, 75, 0), 75);
});

// Drift guard: the calculator ships an INLINE copy of bulkHours in sourdough-schedule.html.
// Extract that live source and prove it still matches this module, so the two can't silently
// diverge. If this fails, update BOTH the HTML and dough-math.mjs together.
test('HTML drift guard: inline bulkHours matches the module', () => {
  const html = readFileSync(new URL('../sourdough-schedule.html', import.meta.url), 'utf8');
  const m = html.match(/function bulkHours\([^)]*\)\s*\{[\s\S]*?\n {2}\}/);
  assert.ok(m, 'could not find bulkHours() in sourdough-schedule.html');
  const inlineBulkHours = new Function(`${m[0]}; return bulkHours;`)();
  for (const [t, i] of [[24, 20], [16, 20], [32, 20], [24, 40], [27, 15]]) {
    assert.ok(near(inlineBulkHours(t, i), bulkHours(t, i), 1e-9), `mismatch at ${t}°C/${i}%`);
  }
});

test('HTML drift guard: DDT formula in the HTML is the 3-factor form', () => {
  const html = readFileSync(new URL('../sourdough-schedule.html', import.meta.url), 'utf8');
  assert.ok(
    html.includes('ddt.target * 3 - ddt.flour - ddt.room - ddt.friction'),
    'DDT formula in sourdough-schedule.html is not the expected 3-factor form (target × 3 − flour − room − friction)'
  );
});
