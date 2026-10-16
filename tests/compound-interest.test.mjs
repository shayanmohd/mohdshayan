import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compound, effectiveAnnualRate, tidy, FREQUENCIES } from '../assets/tools/lib/compound-interest.js';

const close = (a, b, eps = 0.005, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);
const run = o => compound({ principal: 100000, rate: 8, months: 120, n: 1, ...o });

// ---------- FAQ worked examples ----------
test('FAQ: ₹1,00,000 at 8% for 10 years, compounded yearly, becomes ₹2,15,892.50', () => {
  const r = run();
  close(r.final, 215892.50);
  close(r.fromPrincipal, r.final, 1e-9);
  assert.equal(r.contributions, 0);
  assert.equal(r.count, 0);
  close(r.interest, 115892.50);
  assert.equal(r.periods, 10);
});
test('FAQ: the same deposit at each compounding frequency', () => {
  close(run({ n: 2 }).final, 219112.31);
  close(run({ n: 4 }).final, 220803.97);
  close(run({ n: 12 }).final, 221964.02);
  close(run({ n: 365 }).final, 222534.58);
  assert.equal(run({ n: 12 }).periods, 120);
  assert.equal(run({ n: 365 }).periods, 3650);
});
test('FAQ: effective annual rate for 8% nominal', () => {
  close(effectiveAnnualRate(8, 1), 8, 1e-9);
  close(effectiveAnnualRate(8, 2), 8.16, 1e-9);
  close(effectiveAnnualRate(8, 4), 8.2432, 1e-4);
  close(effectiveAnnualRate(8, 12), 8.3000, 1e-4);
  close(effectiveAnnualRate(8, 365), 8.3278, 1e-4);
  close(run({ n: 365 }).effectiveRate, effectiveAnnualRate(8, 365), 1e-12);
});
test('FAQ: ₹5,000 a month at 12% for 10 years, compounded monthly', () => {
  const end = compound({ principal: 0, rate: 12, months: 120, n: 12, contribution: 5000, perYear: 12, timing: 'end' });
  close(end.final, 1150193.45);
  assert.equal(end.contributions, 600000);
  assert.equal(end.count, 120);
  close(end.interest, 550193.45);
  close(end.fromPrincipal, 0, 1e-9);
  close(end.ratePerPeriod, 1, 1e-12);
  const start = compound({ principal: 0, rate: 12, months: 120, n: 12, contribution: 5000, perYear: 12, timing: 'start' });
  close(start.final, 1161695.38);
});
test('FAQ: simple interest on the same deposit, and the rule of 72', () => {
  const r = run();
  close(r.simpleInterest, 80000, 1e-9);
  close(r.simpleFinal, 180000, 1e-9);
  close(r.final - r.simpleFinal, 35892.50);
  close(run({ months: 108 }).final, 199900.46); // 72 ÷ 8 = 9 years is just short of doubling
  assert.ok(run({ months: 109 }).final > 200000);
});

// ---------- closed forms, computed here independently of the month-by-month loop ----------
test('contributions at the start are worth (1 + i) times those at the end', () => {
  for (const n of [1, 4, 12, 365]) {
    const end = compound({ principal: 0, rate: 9, months: 60, n, contribution: 2500, perYear: 12, timing: 'end' });
    const start = compound({ principal: 0, rate: 9, months: 60, n, contribution: 2500, perYear: 12, timing: 'start' });
    close(start.final, end.final * (1 + end.ratePerPeriod / 100), 1e-6, `n=${n}`);
  }
});
test('yearly contributions with monthly compounding follow the annuity formula at the equivalent yearly rate', () => {
  const P = 50000, rate = 7.5, years = 7, c = 12000;
  const r = compound({ principal: P, rate, months: years * 12, n: 12, contribution: c, perYear: 1, timing: 'end' });
  const i = Math.pow(1 + rate / 1200, 12) - 1;
  const expected = P * Math.pow(1 + i, years) + (c * (Math.pow(1 + i, years) - 1)) / i;
  close(r.final, expected, 1e-6);
  close(r.ratePerPeriod, i * 100, 1e-12);
  assert.equal(r.count, years);
  close(r.fromContributions, (c * (Math.pow(1 + i, years) - 1)) / i, 1e-6);
});
test('daily compounding with monthly contributions uses the equivalent monthly rate', () => {
  const P = 20000, rate = 6, T = 36, c = 1000;
  const r = compound({ principal: P, rate, months: T, n: 365, contribution: c, perYear: 12, timing: 'end' });
  const i = Math.pow(1 + rate / 36500, 365 / 12) - 1;
  const expected = P * Math.pow(1 + i, T) + (c * (Math.pow(1 + i, T) - 1)) / i;
  close(r.final, expected, 1e-6);
  close(r.fromPrincipal, P * Math.pow(1 + rate / 36500, 365 * 3), 1e-6);
});
test('simple interest counts each deposit for the time it is invested', () => {
  // End-of-month deposits of c for T months earn c × r/12 × (0 + 1 + ... + (T - 1))
  const r = compound({ principal: 10000, rate: 12, months: 12, n: 12, contribution: 1000, perYear: 12, timing: 'end' });
  close(r.simpleInterest, 10000 * 0.12 + 1000 * 0.01 * 66, 1e-9);
  const s = compound({ principal: 10000, rate: 12, months: 12, n: 12, contribution: 1000, perYear: 12, timing: 'start' });
  close(s.simpleInterest, 10000 * 0.12 + 1000 * 0.01 * 78, 1e-9);
  close(r.simpleFinal, r.deposits + r.simpleInterest, 1e-9);
});

// ---------- year-by-year table ----------
test('year rows chain together and add up to the totals', () => {
  const r = compound({ principal: 250000, rate: 8.5, months: 42, n: 4, contribution: 3000, perYear: 12, timing: 'start' });
  assert.deepEqual(r.years.map(y => [y.year, y.months]), [[1, 12], [2, 12], [3, 12], [4, 6]]);
  close(r.years[0].opening, 250000, 1e-9);
  for (let i = 1; i < r.years.length; i++) close(r.years[i].opening, r.years[i - 1].closing, 1e-9);
  close(r.years.reduce((a, y) => a + y.contributions, 0), r.contributions, 1e-9);
  close(r.years.reduce((a, y) => a + y.interest, 0), r.interest, 1e-6);
  close(r.years[r.years.length - 1].closing, r.final, 1e-9);
  assert.equal(r.count, 42);
});
test('a yearly contribution in a partial final year is paid at the start but not at the end', () => {
  const start = compound({ principal: 1000, rate: 5, months: 30, n: 1, contribution: 500, perYear: 1, timing: 'start' });
  const end = compound({ principal: 1000, rate: 5, months: 30, n: 1, contribution: 500, perYear: 1, timing: 'end' });
  assert.equal(start.count, 3);
  assert.equal(end.count, 2);
  assert.deepEqual(start.years.map(y => y.contributions), [500, 500, 500]);
  assert.deepEqual(end.years.map(y => y.contributions), [500, 500, 0]);
  close(end.fromPrincipal, 1000 * Math.pow(1.05, 2.5), 1e-9);
});

// ---------- precision ----------
test('a tiny daily rate keeps its precision over a long term', () => {
  // ₹10,00,00,00,00,000 at 9.99% compounded daily for 40 years 11 months, with ₹99,99,999 at the start of each month;
  // the figures come from decimal arithmetic, and (1 + r/365) alone lands ₹51 away from them
  const r = compound({ principal: 1e12, rate: 9.99, months: 491, n: 365, contribution: 9999999, perYear: 12, timing: 'start' });
  close(r.fromPrincipal, 59561876907654.11, 0.5);
  close(r.final, 59632524339247.77, 0.5);
  close(effectiveAnnualRate(8, 365), 8.327757179280697, 1e-12);
});
test('tidy lets an exact half round up on display instead of a hair below it', () => {
  // ₹1,000 at 5% compounded half-yearly earns exactly ₹50.625 in a year, and the effective rate is exactly 5.0625%
  const r = compound({ principal: 1000, rate: 5, months: 12, n: 2 });
  assert.equal(tidy(r.interest), 50.625);
  assert.equal(tidy(r.years[0].interest), 50.625);
  assert.equal(tidy(r.effectiveRate, 10), 5.0625);
  assert.equal(tidy(effectiveAnnualRate(9, 2), 10), 9.2025);
  assert.equal(tidy(effectiveAnnualRate(3, 2), 10), 3.0225);
  assert.equal(tidy(215892.49972727805), 215892.499727); // ordinary figures only lose the noise
});

// ---------- boundaries and invalid input ----------
test('zero rate: no interest, everything simply adds up', () => {
  const r = compound({ principal: 1000, rate: 0, months: 24, n: 12, contribution: 100, perYear: 12, timing: 'end' });
  assert.equal(r.final, 3400);
  assert.equal(r.interest, 0);
  assert.equal(r.effectiveRate, 0);
  assert.equal(r.simpleInterest, 0);
  assert.equal(r.ratePerPeriod, 0);
  assert.ok(r.years.every(y => y.interest === 0));
});
test('shortest and longest terms', () => {
  const one = compound({ principal: 1000, rate: 12, months: 1, n: 12 });
  close(one.final, 1010, 1e-9);
  assert.deepEqual(one.years.map(y => [y.year, y.months]), [[1, 1]]);
  const century = compound({ principal: 1000, rate: 10, months: 1200, n: 365, contribution: 10, perYear: 12, timing: 'end' });
  assert.ok(Number.isFinite(century.final) && century.final > 0);
  assert.equal(century.years.length, 100);
  assert.equal(century.count, 1200);
});
test('more frequent compounding always earns more, and never less than simple interest', () => {
  const finals = FREQUENCIES.map(f => run({ n: f.n, contribution: 2000 }).final);
  for (let i = 1; i < finals.length; i++) assert.ok(finals[i - 1] > finals[i], `${FREQUENCIES[i - 1].label} > ${FREQUENCIES[i].label}`);
  for (const f of FREQUENCIES) {
    const r = run({ n: f.n, contribution: 2000 });
    assert.ok(r.final >= r.simpleFinal, f.label);
    close(r.fromPrincipal + r.fromContributions, r.final, 1e-9);
  }
});
test('a contribution-only plan works with no starting amount', () => {
  const r = compound({ principal: 0, rate: 7, months: 24, n: 4, contribution: 1500, perYear: 12, timing: 'end' });
  assert.equal(r.principal, 0);
  assert.equal(r.deposits, 36000);
  assert.ok(r.final > 36000);
});
test('invalid input returns null', () => {
  assert.equal(compound({ principal: -1, rate: 8, months: 12, n: 12 }), null);
  assert.equal(compound({ principal: 100, rate: -8, months: 12, n: 12 }), null);
  assert.equal(compound({ principal: 100, rate: NaN, months: 12, n: 12 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 0, n: 12 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 2.5, n: 12 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 12, n: 7 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 12, n: 12, contribution: -5 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 12, n: 12, contribution: 5, perYear: 4 }), null);
  assert.equal(compound({ principal: 100, rate: 8, months: 12, n: 12, contribution: 5, timing: 'middle' }), null);
  assert.equal(compound({ principal: 0, rate: 8, months: 12, n: 12, contribution: 0 }), null);
  assert.equal(compound({ principal: '', rate: '', months: '' }), null);
});
