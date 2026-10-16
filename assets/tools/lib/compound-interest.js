// Compound interest with optional regular contributions, worked month by month. Pure functions, no DOM.
// Figures are kept unrounded; the page rounds only for display, after tidy() below.

/** Compounding frequencies: periods a year, with the word used in copy. */
export const FREQUENCIES = [
  { n: 365, label: 'daily' },
  { n: 12, label: 'monthly' },
  { n: 4, label: 'quarterly' },
  { n: 2, label: 'half-yearly' },
  { n: 1, label: 'yearly' },
];

/** Effective annual rate in percent for a nominal annual `rate` (percent) compounded n times a year. */
export function effectiveAnnualRate(rate, n) {
  return Math.expm1(n * Math.log1p(rate / 100 / n)) * 100; // log1p keeps the precision of a tiny daily rate that 1 + x would drop
}

/**
 * Rounds away floating-point noise below 10^-places before a figure is formatted, so that an exact half rounds up the way
 * it does on paper: ₹1,000 at 5% half-yearly earns exactly ₹50.625 in a year, which must show as ₹50.63, not ₹50.62.
 */
export function tidy(x, places = 6) {
  const k = Math.pow(10, places);
  return Math.round(x * k) / k;
}

/**
 * Growth of `principal` over `months` at an annual `rate` (percent), compounded `n` times a year,
 * with an optional `contribution` paid every month (perYear 12) or every year (perYear 1), at the
 * 'start' or 'end' of each of those periods. A start-of-year contribution is paid for every year that
 * begins inside the term; an end-of-year one only for years that complete.
 *
 * Between compounding dates the balance grows at the equivalent monthly rate, (1 + r/n)^(n/12) - 1, so
 * the principal always follows P × (1 + r/n)^(n×t) exactly, and contributions compound at the equivalent
 * rate for their own period, which is the textbook annuity formula whenever the term is a whole number
 * of contribution periods.
 *
 * Returns null for inputs that make no sense (negative figures, no term, nothing deposited), otherwise
 * { final, principal, contributions, count, deposits, interest, fromPrincipal, fromContributions,
 *   effectiveRate, ratePerPeriod, periods, simpleInterest, simpleFinal,
 *   years: [{ year, months, opening, contributions, interest, closing }] }.
 * ratePerPeriod is the rate per contribution period in percent; periods is how many times interest compounds.
 * simpleInterest is what the same deposits would earn without compounding: each one at `rate` for the time left.
 */
export function compound({ principal = 0, rate, months, n = 1, contribution = 0, perYear = 12, timing = 'end' } = {}) {
  const P = Number(principal), r = Number(rate), T = Number(months), c = Number(contribution) || 0;
  if (![P, r, T, c].every(Number.isFinite) || P < 0 || r < 0 || c < 0 || T < 1 || T !== Math.floor(T)) return null;
  if (!FREQUENCIES.some(f => f.n === n) || (perYear !== 12 && perYear !== 1) || (timing !== 'start' && timing !== 'end')) return null;
  if (P === 0 && c === 0) return null;

  const g = Math.exp((Math.log1p(r / 100 / n) * n) / 12); // growth factor for one month, (1 + r/n)^(n/12) without losing the rate's precision
  const every = 12 / perYear; // months between contributions
  const years = [];
  let balance = P, contributions = 0, count = 0;
  let weight = P * T; // sum of amount × months invested, for the simple-interest comparison
  let y = null;
  const pay = (k, row) => { balance += c; contributions += c; count++; weight += c * (T - k); row.contributions += c; };
  for (let k = 1; k <= T; k++) {
    if ((k - 1) % 12 === 0) { y = { year: years.length + 1, months: 0, opening: balance, contributions: 0, interest: 0, closing: balance }; years.push(y); }
    if (c > 0 && timing === 'start' && (k - 1) % every === 0) pay(k - 1, y);
    balance *= g;
    if (c > 0 && timing === 'end' && k % every === 0) pay(k, y);
    y.months++;
    y.closing = balance;
  }
  for (const row of years) row.interest = row.closing - row.opening - row.contributions;

  const fromPrincipal = P * Math.pow(g, T);
  const deposits = P + contributions;
  const simpleInterest = ((r / 100) * weight) / 12;
  return {
    final: balance, principal: P, contributions, count, deposits, interest: balance - deposits,
    fromPrincipal, fromContributions: balance - fromPrincipal,
    effectiveRate: effectiveAnnualRate(r, n), ratePerPeriod: (Math.pow(g, every) - 1) * 100, periods: (n * T) / 12,
    simpleInterest, simpleFinal: deposits + simpleInterest, years,
  };
}
