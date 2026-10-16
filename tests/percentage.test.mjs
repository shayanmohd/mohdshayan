import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALCULATORS, percentOf, whatPercent, percentChange, adjustBy, reverse, digitsFor } from '../assets/tools/lib/percentage.js';

const close = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);

// ---------- what is x% of y ----------
test('percent of: FAQ example, 15% of 200 is 30', () => {
  assert.equal(percentOf(15, 200).result, 30);
  close(percentOf(18, 1000).result, 180);
});
test('percent of: decimals, negatives, zero and more than 100%', () => {
  close(percentOf(7.5, 1234.56).result, 92.592);
  assert.equal(percentOf(-15, 200).result, -30);
  assert.equal(percentOf(15, -200).result, -30);
  assert.equal(percentOf(0, 999).result, 0);
  assert.equal(percentOf(15, 0).result, 0);
  assert.equal(percentOf(250, 8).result, 20);
});

// ---------- x is what percent of y ----------
test('what percent: FAQ example, 30 is 15% of 200, and the order matters', () => {
  assert.equal(whatPercent(30, 200).result, 15);
  close(whatPercent(200, 30).result, 666.6666666667, 1e-9);
  close(whatPercent(1, 3).result, 33.3333333333, 1e-9);
});
test('what percent: negatives work, but nothing is a percentage of zero', () => {
  assert.equal(whatPercent(30, -200).result, -15);
  assert.equal(whatPercent(-30, -200).result, 15);
  assert.equal(whatPercent(0, 5).result, 0);
  assert.equal(whatPercent(30, 0), null);
  assert.equal(whatPercent(0, 0), null);
});

// ---------- percentage change ----------
test('change: FAQ examples, 200 to 250 is a 25% increase and 250 to 200 a 20% decrease', () => {
  const up = percentChange(200, 250);
  assert.deepEqual(up, { result: 25, difference: 50, base: 200, direction: 'increase' });
  const down = percentChange(250, 200);
  assert.deepEqual(down, { result: -20, difference: -50, base: 250, direction: 'decrease' });
  assert.equal(percentChange(4, 5).result, 25); // one percentage point, 25 percent
});
test('change: no change, a fall to zero, and starts below zero read the right way up', () => {
  assert.equal(percentChange(100, 100).direction, 'none');
  assert.equal(percentChange(100, 100).result, 0);
  assert.deepEqual([percentChange(5, 0).result, percentChange(5, 0).direction], [-100, 'decrease']);
  assert.deepEqual([percentChange(-50, -25).result, percentChange(-50, -25).direction], [50, 'increase']);
  assert.deepEqual([percentChange(-25, -50).result, percentChange(-25, -50).direction], [-100, 'decrease']); // the fall of 25 equals the starting size
  assert.deepEqual([percentChange(-200, -170).result, percentChange(-200, -170).direction], [15, 'increase']);
  close(percentChange(84.9, 112.35).result, 32.3321554770, 1e-9);
});
test('change: a change from zero has no percentage', () => {
  assert.equal(percentChange(0, 5), null);
  assert.equal(percentChange(0, 0), null);
  assert.equal(percentChange(0, -5), null);
});

// ---------- increase or decrease y by x% ----------
test('adjust: FAQ example, 200 by 15% is 230 and 170', () => {
  assert.deepEqual(adjustBy(200, 15), { base: 200, amount: 30, increased: 230, decreased: 170 });
  close(adjustBy(1180, 18).decreased, 967.6); // the wrong way to remove 18% tax, as the FAQ warns
});
test('adjust: zero, 100%, decimals and negative figures', () => {
  assert.deepEqual(adjustBy(200, 0), { base: 200, amount: 0, increased: 200, decreased: 200 });
  assert.deepEqual(adjustBy(200, 100), { base: 200, amount: 200, increased: 400, decreased: 0 });
  const r = adjustBy(349.99, 12.5);
  close(r.amount, 43.74875); close(r.increased, 393.73875); close(r.decreased, 306.24125);
  assert.deepEqual(adjustBy(-200, 15), { base: 200, amount: 30, increased: -170, decreased: -230 });
  assert.deepEqual(adjustBy(200, -15), { base: 200, amount: -30, increased: 170, decreased: 230 });
});
test('adjust and change agree: moving y up or down by x% reads back as an x% change', () => {
  for (const y of [200, 349.99, -200, 0.5, -0.004]) {
    for (const x of [15, 12.5, 100, 0.1, 250]) {
      const r = adjustBy(y, x);
      const up = percentChange(y, r.increased), down = percentChange(y, r.decreased);
      close(up.result, x, 1e-9, `${y} up ${x}%`); assert.equal(up.direction, 'increase');
      close(down.result, -x, 1e-9, `${y} down ${x}%`); assert.equal(down.direction, 'decrease');
    }
  }
});

// ---------- y is x% of what ----------
test('reverse: FAQ examples, 30 is 15% of 200 and 1,180 is 118% of 1,000', () => {
  assert.equal(reverse(30, 15).result, 200);
  close(reverse(1180, 118).result, 1000);
  close(reverse(456.78, 23).result, 1986);
});
test('reverse: negatives work, 0 is 0% of anything, and 0% has no answer', () => {
  assert.equal(reverse(30, -15).result, -200);
  assert.equal(reverse(-30, 15).result, -200);
  assert.equal(reverse(0, 15).result, 0);
  assert.equal(reverse(30, 0), null);
  assert.equal(reverse(0, 0), null);
});

// ---------- invalid input and finiteness ----------
test('invalid input gives null, never NaN; numeric strings are accepted', () => {
  const fns = [percentOf, whatPercent, percentChange, adjustBy, reverse];
  for (const fn of fns) {
    for (const bad of [NaN, undefined, null, '', 'abc', Infinity, -Infinity]) {
      assert.equal(fn(bad, 5), null, `${fn.name}(${bad}, 5)`);
      assert.equal(fn(5, bad), null, `${fn.name}(5, ${bad})`);
    }
  }
  assert.equal(percentOf('15', '200').result, 30);
  assert.equal(reverse('30', '15').result, 200);
});
test('every figure returned is finite across a grid of inputs, including zero and negatives', () => {
  const values = [-1e9, -200, -0.5, -0.004, 0, 0.004, 1, 15, 200, 1e9];
  for (const fn of [percentOf, whatPercent, percentChange, adjustBy, reverse]) {
    for (const a of values) {
      for (const b of values) {
        const r = fn(a, b);
        if (r === null) continue;
        for (const [k, v] of Object.entries(r)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${fn.name}(${a}, ${b}).${k} = ${v}`);
      }
    }
  }
});

test('results are never negative zero, which would print as "-0"', () => {
  const figures = [percentOf(0, -200).result, percentOf(-15, 0).result, whatPercent(0, -5).result, adjustBy(0, -15).amount, reverse(0, -15).result, percentChange(-5, -5).result];
  for (const v of figures) assert.ok(Object.is(v, 0), `${Object.is(v, -0) ? '-0' : v} should be 0`);
});
test('figures past the number range give null, never Infinity', () => {
  assert.equal(percentOf(1e308, 1e308), null);
  assert.equal(whatPercent(1e308, 1e-10), null);
  assert.equal(percentChange(1e308, -1e308), null);
  assert.equal(percentChange(-1e308, 1e308), null);
  assert.equal(adjustBy(1e308, 1e308), null);
  assert.equal(reverse(1e308, 1e-10), null);
  assert.ok(Number.isFinite(percentOf(1e300, 1e3).result)); // large, but still within range
});

// ---------- display helpers ----------
test('digitsFor: two places unless a small figure would show as zero, up to six', () => {
  assert.equal(digitsFor(30), 2);
  assert.equal(digitsFor(92.592), 2);
  assert.equal(digitsFor(0.005), 2); // shows as 0.01
  assert.equal(digitsFor(0.004), 3);
  assert.equal(digitsFor(-0.004), 3);
  assert.equal(digitsFor(0.00004), 5);
  assert.equal(digitsFor(0.0000004), 2); // too small to show in six places, so it is 0
  assert.equal(digitsFor(0), 2);
  assert.equal(digitsFor(NaN), 2);
});
test('CALCULATORS lists the five calculators in page order', () => {
  assert.deepEqual(CALCULATORS, ['of', 'what', 'change', 'adjust', 'reverse']);
});
