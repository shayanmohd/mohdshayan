import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commissionFor, earnings, salesForTarget, normalizeTiers, encodeTiers, decodeTiers } from '../assets/tools/lib/commission.js';
import { calculateGst } from '../assets/tools/lib/gst.js';
import { emi, schedule, byYear, monthLabel } from '../assets/tools/lib/emi.js';
import { solve, marginToMarkup, markupToMargin } from '../assets/tools/lib/margin.js';

const close = (a, b, eps = 0.01, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);
const TIERS = [{ upTo: 500000, rate: 5 }, { upTo: 1000000, rate: 8 }, { upTo: Infinity, rate: 10 }];

// ---------- commission ----------
test('commission: flat rate (FAQ example)', () => {
  assert.equal(commissionFor(500000, { type: 'flat', rate: 8 }).gross, 40000);
});
test('commission: graduated tiers pay each band at its own rate', () => {
  const plan = { type: 'tiered', method: 'graduated', tiers: TIERS };
  assert.equal(commissionFor(400000, plan).gross, 20000);
  assert.equal(commissionFor(750000, plan).gross, 25000 + 20000);
  assert.equal(commissionFor(1200000, plan).gross, 25000 + 40000 + 20000);
  assert.equal(commissionFor(1200000, plan).bands.length, 3);
});
test('commission: retroactive tiers pay the whole amount at the reached rate', () => {
  const plan = { type: 'tiered', method: 'retroactive', tiers: TIERS };
  assert.equal(commissionFor(500000, plan).gross, 25000); // at the threshold: still the lower tier
  assert.equal(commissionFor(500001, plan).gross, 40000.08);
  assert.equal(commissionFor(1200000, plan).gross, 120000);
});
test('commission: share, base and effective rate', () => {
  const e = earnings(500000, { type: 'flat', rate: 8 }, { base: 30000, share: 50, quota: 400000 });
  assert.equal(e.yours, 20000);
  assert.equal(e.total, 50000);
  assert.equal(e.effectiveRate, 4);
  assert.equal(e.attainment, 125);
});
test('commission: target mode inverts every plan type', () => {
  const plans = [{ type: 'flat', rate: 8 }, { type: 'tiered', method: 'graduated', tiers: TIERS }, { type: 'tiered', method: 'retroactive', tiers: TIERS }];
  for (const plan of plans) {
    for (const target of [1000, 25000, 40000, 45000, 90000, 250000]) {
      for (const opts of [{}, { base: 10000, share: 50 }]) {
        const r = salesForTarget(target, plan, opts);
        assert.ok(r.reachable, `${plan.method || plan.type} ${target}`);
        const got = earnings(r.sales, plan, opts).total;
        assert.ok(got >= target - 1e-6, `${plan.method || plan.type} target ${target}: sales ${r.sales} pays ${got}`);
        if (r.sales > 0.01) assert.ok(earnings(r.sales - 0.01, plan, opts).total < target, `${plan.method || plan.type} ${target} is minimal`);
      }
    }
  }
});
test('commission: retroactive target just above a threshold is flagged', () => {
  const plan = { type: 'tiered', method: 'retroactive', tiers: TIERS };
  // 30,000 needs 6,00,000 at 5% (beyond the tier) but only 3,75,000 at 8%, which is below that tier's floor
  const r = salesForTarget(30000, plan);
  assert.equal(r.sales, 500000.01);
  assert.equal(r.atThreshold, true);
});
test('commission: unreachable and trivial targets', () => {
  assert.equal(salesForTarget(1000, { type: 'flat', rate: 0 }).reachable, false);
  assert.equal(salesForTarget(5000, { type: 'flat', rate: 5 }, { base: 10000 }).sales, 0);
});
test('commission: tier normalisation and share-link encoding', () => {
  const t = normalizeTiers([{ upTo: 1000000, rate: 8 }, { upTo: '', rate: 10 }, { upTo: 500000, rate: 5 }]);
  assert.deepEqual(t, TIERS);
  assert.deepEqual(decodeTiers(encodeTiers(TIERS)), TIERS);
});

// ---------- GST ----------
test('gst: add 18% within a state (FAQ example)', () => {
  const g = calculateGst(1000, 18, { mode: 'add' });
  assert.deepEqual([g.net, g.cgst, g.sgst, g.igst, g.tax, g.gross, g.roundOff], [1000, 90, 90, 0, 180, 1180, 0]);
});
test('gst: remove 18% from an inclusive amount (FAQ example)', () => {
  const g = calculateGst(1180, 18, { mode: 'remove', interState: true });
  assert.deepEqual([g.net, g.igst, g.tax, g.gross, g.roundOff], [1000, 180, 180, 1180, 0]);
});
test('gst: lines always add up to the gross, with any paisa in round-off', () => {
  for (const amount of [1, 99.99, 100, 333.33, 1234.56, 99999]) {
    for (const rate of [0.25, 3, 5, 12, 18, 28, 40]) {
      for (const interState of [false, true]) {
        for (const mode of ['add', 'remove']) {
          const g = calculateGst(amount, rate, { mode, interState });
          close(g.net + g.cgst + g.sgst + g.igst + g.roundOff, g.gross, 1e-9, `${mode} ${amount} @${rate}`);
          assert.ok(Math.abs(g.roundOff) <= 0.02, `roundOff ${g.roundOff}`);
          if (mode === 'remove') assert.equal(g.gross, amount);
        }
      }
    }
  }
});

// ---------- EMI ----------
test('emi: FAQ example, ₹30 lakh at 8.5% for 20 years', () => {
  close(emi(3000000, 8.5, 240), 26034.65, 0.5);
});
test('emi: zero interest and schedule totals', () => {
  assert.equal(emi(120000, 0, 12), 10000);
  const s = schedule(1000000, 9, 120);
  close(s.rows.reduce((a, r) => a + r.principal, 0), 1000000, 0.01);
  close(s.totalPaid, s.emi * 120, 0.05);
  assert.equal(s.months, 120);
  assert.equal(s.rows[s.rows.length - 1].balance, 0);
});
test('emi: extra payments shorten the loan and save interest', () => {
  const base = schedule(3000000, 8.5, 240);
  const pre = schedule(3000000, 8.5, 240, 5000);
  assert.ok(pre.months < base.months);
  assert.ok(pre.totalInterest < base.totalInterest);
  close(pre.rows.reduce((a, r) => a + r.principal, 0), 3000000, 0.01);
});
test('emi: yearly grouping and month labels', () => {
  const s = schedule(100000, 10, 18);
  const loanYears = byYear(s.rows);
  assert.deepEqual(loanYears.map(g => [g.label, g.months]), [['Year 1', 12], ['Year 2', 6]]);
  const cal = byYear(s.rows, '2026-10');
  assert.deepEqual(cal.map(g => [g.label, g.months]), [['2026', 3], ['2027', 12], ['2028', 3]]);
  assert.equal(monthLabel('2026-10', 4), 'Jan 2027');
});

// ---------- margin ----------
test('margin: FAQ examples', () => {
  const a = solve('cost-price', 100, 150);
  close(a.margin, 33.333, 0.001); assert.equal(a.markup, 50); assert.equal(a.profit, 50);
  close(solve('cost-margin', 60, 40).price, 100, 1e-9);
  close(solve('cost-price', 60, 84).margin, 28.571, 0.001);
  close(solve('cost-price', 10, 50).markup, 400, 1e-9);
  close(solve('cost-price', 10, 50).margin, 80, 1e-9);
});
test('margin: other modes and conversions', () => {
  close(solve('cost-markup', 80, 25).price, 100, 1e-9);
  close(solve('price-margin', 200, 30).cost, 140, 1e-9);
  assert.equal(solve('cost-margin', 50, 100), null);
  close(marginToMarkup(20), 25, 1e-9);
  close(markupToMargin(25), 20, 1e-9);
});
