// Loan EMI and amortisation on a reducing balance with monthly compounding. Pure functions, no DOM.
// Figures are kept unrounded; the page rounds only for display.

/** Monthly instalment for principal P at an annual rate (percent) over n months. */
export function emi(P, annualRate, n) {
  if (!(P > 0) || !(n > 0)) return 0;
  const r = annualRate / 1200;
  if (r === 0) return P / n;
  const f = Math.pow(1 + r, n);
  return (P * r * f) / (f - 1);
}

/**
 * Month-by-month schedule. `extra` is paid towards principal every month on top of the EMI, which shortens the loan.
 * Returns { emi, rows, months, totalInterest, totalPaid, totalExtra }.
 * Each row: { month, principal, interest, extra, payment, balance }.
 */
export function schedule(P, annualRate, n, extra = 0) {
  const E = emi(P, annualRate, n);
  const r = annualRate / 1200;
  const rows = [];
  let balance = P;
  let totalInterest = 0, totalPaid = 0, totalExtra = 0;
  for (let month = 1; balance > 0.005 && month <= n; month++) {
    const interest = balance * r;
    const principal = Math.min(E - interest, balance);
    const x = Math.max(0, Math.min(extra, balance - principal));
    balance = Math.max(0, balance - principal - x);
    if (month === n) balance = 0; // absorb floating-point dust on the final instalment
    const payment = principal + interest + x;
    rows.push({ month, principal: principal + x, interest, extra: x, payment, balance });
    totalInterest += interest;
    totalPaid += payment;
    totalExtra += x;
  }
  return { emi: E, rows, months: rows.length, totalInterest, totalPaid, totalExtra };
}

/**
 * Groups monthly rows into years. With a start month ("YYYY-MM") the groups are calendar years,
 * otherwise loan years (months 1 to 12 are Year 1).
 */
export function byYear(rows, start) {
  const m = /^(\d{4})-(\d{2})$/.exec(start || '');
  const groups = new Map();
  for (const row of rows) {
    let key, label;
    if (m) {
      const idx = Number(m[2]) - 1 + row.month - 1;
      const year = Number(m[1]) + Math.floor(idx / 12);
      key = year; label = String(year);
    } else {
      key = Math.ceil(row.month / 12); label = `Year ${key}`;
    }
    const g = groups.get(key) || { label, principal: 0, interest: 0, payment: 0, balance: 0, months: 0 };
    g.principal += row.principal; g.interest += row.interest; g.payment += row.payment; g.balance = row.balance; g.months += 1;
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** "Oct 2026" style label for month number `k` (1-based) from a "YYYY-MM" start. */
export function monthLabel(start, k) {
  const m = /^(\d{4})-(\d{2})$/.exec(start || '');
  if (!m) return `Month ${k}`;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1 + k - 1, 1));
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
