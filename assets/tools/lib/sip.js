// SIP, lump sum and goal maths with monthly compounding. Pure functions, no DOM.
// Figures are kept unrounded; the page rounds only for display. Every term is a whole number of months.

/** Monthly rate as a fraction from an annual percentage: i = r / 12 / 100. */
export const monthlyRate = annualRate => (Number(annualRate) || 0) / 1200;

/**
 * Maturity value of a monthly SIP with every instalment invested at the start of its month (an annuity due):
 * FV = P * ((1 + i)^n - 1) / i * (1 + i), where i is the monthly rate and n the number of months.
 * At a zero rate it is simply P * n.
 */
export function sipFutureValue(P, annualRate, n) {
  if (!(P > 0) || !(n > 0)) return 0;
  const i = monthlyRate(annualRate);
  if (i === 0) return P * n;
  return P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
}

/**
 * Monthly SIP that grows to `target` in n months: the maturity formula solved for P,
 * P = FV * i / (((1 + i)^n - 1) * (1 + i)). At a zero rate it is FV / n.
 */
export function sipForGoal(target, annualRate, n) {
  if (!(target > 0) || !(n > 0)) return 0;
  const i = monthlyRate(annualRate);
  if (i === 0) return target / n;
  return (target * i) / ((Math.pow(1 + i, n) - 1) * (1 + i));
}

/**
 * A one-time investment A after n months. 'yearly' compounds once a year, A * (1 + r)^(n / 12), the way fund
 * returns (CAGR) are quoted. 'monthly' compounds every month, A * (1 + r / 12)^n, which gives a little more at the same rate.
 */
export function lumpSumFutureValue(A, annualRate, n, compounding = 'yearly') {
  if (!(A > 0) || !(n >= 0)) return 0;
  const r = (Number(annualRate) || 0) / 100;
  return compounding === 'monthly' ? A * Math.pow(1 + r / 12, n) : A * Math.pow(1 + r, n / 12);
}

/** What a future amount is worth in today's money: discounted by annual inflation, compounded yearly, over n months. */
export function todaysMoney(value, inflationRate, n) {
  return value / Math.pow(1 + (Number(inflationRate) || 0) / 100, n / 12);
}

/**
 * Month-by-month projection of a SIP. The instalment rises by `stepUp` percent after every 12 months.
 * Returns { invested, value, returns, years }; each year is { year, months, monthly, invested, value, returns }
 * as at the end of that year. The last entry may cover only part of a year.
 */
export function sipProjection(P, annualRate, n, stepUp = 0) {
  const years = [];
  if (!(P > 0) || !(n > 0)) return { invested: 0, value: 0, returns: 0, years };
  const i = monthlyRate(annualRate);
  const rise = 1 + (Number(stepUp) || 0) / 100;
  let monthly = P, invested = 0, value = 0;
  for (let m = 1; m <= n; m++) {
    if (m > 1 && (m - 1) % 12 === 0) monthly *= rise; // a new year starts: the instalment steps up
    invested += monthly;
    value = (value + monthly) * (1 + i); // paid in at the start of the month, then a month of growth
    if (m % 12 === 0 || m === n) years.push({ year: years.length + 1, months: m - years.length * 12, monthly, invested, value, returns: value - invested });
  }
  return { invested, value, returns: value - invested, years };
}

/** Year-end rows for a one-time investment, in the same shape as sipProjection (monthly is 0). */
export function lumpSumProjection(A, annualRate, n, compounding = 'yearly') {
  const years = [];
  if (!(A > 0) || !(n > 0)) return { invested: 0, value: 0, returns: 0, years };
  for (let m = 1; m <= n; m++) {
    if (m % 12 !== 0 && m !== n) continue;
    const value = lumpSumFutureValue(A, annualRate, m, compounding);
    years.push({ year: years.length + 1, months: m - years.length * 12, monthly: 0, invested: A, value, returns: value - A });
  }
  const last = years[years.length - 1];
  return { invested: A, value: last.value, returns: last.returns, years };
}

/** Reference grid on the page: what a fixed monthly SIP becomes, with no step-up, at each rate over each term. */
export const REFERENCE = { monthly: 5000, rates: [8, 10, 12, 15], years: [5, 10, 15, 20] };
export function referenceTable({ monthly, rates, years } = REFERENCE) {
  return years.map(y => ({ years: y, invested: monthly * 12 * y, values: rates.map(r => sipFutureValue(monthly, r, y * 12)) }));
}
