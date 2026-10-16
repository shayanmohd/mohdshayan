// Percentage maths for the five calculators on /tools/percentage/. Pure functions, no DOM.
// Inputs are plain numbers (numeric strings are accepted). Results keep full precision: the page rounds for display only.
// A question with no answer, such as a percentage of zero or figures too large to hold, returns null so the page can show a plain message instead of NaN or Infinity.

// The calculators in page order; also the values a share link may name in its c= field.
export const CALCULATORS = ['of', 'what', 'change', 'adjust', 'reverse'];

const finite = (...xs) => xs.every(x => Number.isFinite(x));
// Number('') and Number(null) are 0, which would turn an empty box into a zero; an empty value is not a number here
const toNumber = x => (x === null || x === undefined || String(x).trim() === '' ? NaN : Number(x));
// Every figure in a result is finite and never negative zero, which would print as "-0". A figure past the number range (Infinity) means there is no answer to show.
const done = r => { for (const k of Object.keys(r)) if (typeof r[k] === 'number') { if (!Number.isFinite(r[k])) return null; r[k] += 0; } return r; };

/** What is x percent of y. 15% of 200 is 30. */
export function percentOf(x, y) {
  const p = toNumber(x), n = toNumber(y);
  if (!finite(p, n)) return null;
  return done({ result: (n * p) / 100 });
}

/** x is what percent of y. 30 is 15% of 200. Null when y is zero: nothing can be a percentage of zero. */
export function whatPercent(x, y) {
  const part = toNumber(x), whole = toNumber(y);
  if (!finite(part, whole) || whole === 0) return null;
  return done({ result: (part / whole) * 100 });
}

/**
 * Percentage change from a to b. From 200 to 250 is a 25% increase; from 250 to 200 is a 20% decrease.
 * The change is measured against the size of the starting value (its absolute value), so a move from a negative start
 * still reads the right way up: from -50 to -25 is a 50% increase. Null when a is zero, since a change from nothing has no percentage.
 * Returns { result, difference, base, direction } with direction 'increase', 'decrease' or 'none'.
 */
export function percentChange(a, b) {
  const from = toNumber(a), to = toNumber(b);
  if (!finite(from, to) || from === 0) return null;
  const difference = to - from;
  const base = Math.abs(from);
  return done({ result: (difference / base) * 100, difference, base, direction: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'none' });
}

/**
 * y increased and decreased by x percent. 200 by 15% gives 230 and 170.
 * The amount is x percent of the size of y, the same convention as percentChange, so increasing always moves up the number line:
 * -200 increased by 15% is -170, and percentChange(-200, -170) reads back as a 15% increase.
 * Returns { base, amount, increased, decreased }, where base is the size of y that the amount was taken from.
 */
export function adjustBy(y, x) {
  const n = toNumber(y), p = toNumber(x);
  if (!finite(n, p)) return null;
  const base = Math.abs(n);
  const amount = (base * p) / 100;
  return done({ base, amount, increased: n + amount, decreased: n - amount });
}

/** y is x percent of what. 30 is 15% of 200. Null when x is zero: 0% of any number is 0, so there is nothing to find. */
export function reverse(y, x) {
  const part = toNumber(y), p = toNumber(x);
  if (!finite(part, p) || p === 0) return null;
  return done({ result: (part / p) * 100 });
}

/**
 * Decimal places to display a figure with: two, extended up to six so that a small non-zero figure such as 0.004 is never shown as 0.
 * Display only; the maths above is never rounded.
 */
export function digitsFor(n, min = 2, max = 6) {
  const v = Math.abs(Number(n));
  if (!Number.isFinite(v) || v === 0) return min;
  for (let d = min; d <= max; d++) if (Math.round(v * 10 ** d) >= 1) return d;
  return min;
}
