import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthlyRate, sipFutureValue, sipForGoal, lumpSumFutureValue, todaysMoney, sipProjection, lumpSumProjection, referenceTable, REFERENCE } from '../assets/tools/lib/sip.js';

const close = (a, b, eps = 0.01, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);
// Expected figures were worked out separately with Python's Decimal at 40 significant digits.

test('sip: monthly rate', () => {
  assert.equal(monthlyRate(12), 0.01);
  assert.equal(monthlyRate(''), 0);
});

test('sip: FAQ example, 5,000 a month at 12% for 10 years', () => {
  close(sipFutureValue(5000, 12, 120), 1161695.38);
});

test('sip: a zero rate just adds the instalments up', () => {
  assert.equal(sipFutureValue(5000, 0, 36), 180000);
  assert.equal(sipProjection(5000, 0, 36).value, 180000);
});

test('sip: invalid input gives nothing rather than NaN', () => {
  assert.equal(sipFutureValue(0, 12, 120), 0);
  assert.equal(sipFutureValue(NaN, 12, 120), 0);
  assert.equal(sipFutureValue(5000, 12, 0), 0);
  assert.equal(sipFutureValue(-5000, 12, 120), 0);
  assert.deepEqual(sipProjection(NaN, 12, 120), { invested: 0, value: 0, returns: 0, years: [] });
  assert.deepEqual(lumpSumProjection(100000, 12, 0), { invested: 0, value: 0, returns: 0, years: [] });
});

test('sip: the month-by-month projection agrees with the closed form when there is no step-up', () => {
  for (const [P, r, n] of [[5000, 12, 120], [10000, 10, 180], [500, 8, 7], [25000, 15, 600], [1234.56, 0.5, 13]]) {
    const p = sipProjection(P, r, n);
    const fv = sipFutureValue(P, r, n);
    close(p.value, fv, fv * 1e-9, `${P} @${r} ${n}m`);
    close(p.invested, P * n, 1e-6);
    close(p.returns, fv - P * n, fv * 1e-9);
    assert.equal(p.years.length, Math.ceil(n / 12));
  }
  close(sipFutureValue(10000, 10, 180), 4179242.66);
});

test('sip: FAQ example with a 10% annual step-up', () => {
  const p = sipProjection(5000, 12, 120, 10);
  close(p.invested, 956245.48);
  close(p.value, 1687163.13);
  close(p.returns, 1687163.13 - 956245.48, 0.02);
  assert.equal(p.years.length, 10);
  assert.ok(p.years.every(y => y.months === 12));
  assert.equal(p.years[0].monthly, 5000);
  close(p.years[1].monthly, 5500, 1e-9);
  close(p.years[9].monthly, 11789.74);
});

test('sip: a partial final year is its own row', () => {
  const p = sipProjection(2000, 9, 30, 5);
  assert.deepEqual(p.years.map(y => [y.year, y.months]), [[1, 12], [2, 12], [3, 6]]);
  close(p.years[0].value, 25202.79);
  close(p.years[1].value, 54029.91);
  close(p.years[2].value, 70088.96);
  assert.deepEqual(p.years.map(y => y.invested), [24000, 49200, 62430]);
  assert.equal(p.invested, 62430);
  for (const y of p.years) close(y.returns, y.value - y.invested, 1e-9);
});

test('sip: goal mode, FAQ example of 1 crore in 20 years at 12%', () => {
  close(sipForGoal(10000000, 12, 240), 10008.53);
  close(sipForGoal(500000, 8, 60), 6759.80);
  assert.equal(sipForGoal(120000, 0, 12), 10000);
});

test('sip: the goal SIP grows to exactly the target', () => {
  for (const [T, r, n] of [[10000000, 12, 240], [500000, 8, 60], [100000, 0, 10], [2500000, 11.5, 90]]) {
    const P = sipForGoal(T, r, n);
    close(sipFutureValue(P, r, n), T, T * 1e-9, `${T} @${r} ${n}m`);
    close(sipProjection(P, r, n).value, T, T * 1e-9);
  }
  assert.equal(sipForGoal(0, 12, 240), 0);
  assert.equal(sipForGoal(10000000, 12, 0), 0);
});

test('lump sum: FAQ example, 1 lakh at 12% for 10 years, yearly and monthly compounding', () => {
  close(lumpSumFutureValue(100000, 12, 120), 310584.82);
  close(lumpSumFutureValue(100000, 12, 120, 'yearly'), 310584.82);
  close(lumpSumFutureValue(100000, 12, 120, 'monthly'), 330038.69);
});

test('lump sum: partial years, zero rate and invalid input', () => {
  close(lumpSumFutureValue(250000, 9.5, 42), 343470.49);
  close(lumpSumFutureValue(250000, 9.5, 42, 'monthly'), 348156.36);
  assert.equal(lumpSumFutureValue(250000, 0, 42), 250000);
  assert.equal(lumpSumFutureValue(250000, 9.5, 0), 250000);
  assert.equal(lumpSumFutureValue(0, 9.5, 42), 0);
  assert.equal(lumpSumFutureValue(250000, 9.5, NaN), 0);
});

test('lump sum: projection rows end each year and at maturity', () => {
  const p = lumpSumProjection(250000, 9.5, 30, 'monthly');
  assert.deepEqual(p.years.map(y => [y.year, y.months, y.invested, y.monthly]), [[1, 12, 250000, 0], [2, 12, 250000, 0], [3, 6, 250000, 0]]);
  close(p.years[0].value, lumpSumFutureValue(250000, 9.5, 12, 'monthly'), 1e-9);
  close(p.value, lumpSumFutureValue(250000, 9.5, 30, 'monthly'), 1e-9);
  close(p.returns, p.value - 250000, 1e-9);
  assert.equal(lumpSumProjection(100000, 12, 120).years.length, 10);
});

test("today's money: FAQ example at 6% inflation over 10 years", () => {
  close(todaysMoney(1161695.381759700849, 6, 120), 648684.63);
  assert.equal(todaysMoney(1161695.38, 0, 120), 1161695.38);
  assert.equal(todaysMoney(1161695.38, '', 120), 1161695.38);
});

test('reference table: 5,000 a month at 8% to 15% over 5 to 20 years', () => {
  const rows = referenceTable();
  assert.deepEqual(rows.map(r => r.years), REFERENCE.years);
  assert.deepEqual(rows.map(r => r.invested), [300000, 600000, 900000, 1200000]);
  close(rows[0].values[0], 369833.51);
  close(rows[1].values[2], 1161695.38);
  close(rows[3].values[3], 7579774.87);
  assert.ok(rows.every(r => r.values.every((v, i) => i === 0 || v > r.values[i - 1])), 'a higher rate always gives more');
});
