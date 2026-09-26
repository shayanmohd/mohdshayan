// GST maths, computed the way an invoice is: each tax line on the taxable value at its own rate, to the paisa.
// Pure functions, no DOM.

export const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * mode 'add': amount is the taxable value (price before GST).
 * mode 'remove': amount already includes GST.
 * interState: IGST at the full rate; otherwise CGST and SGST at half the rate each.
 * Returns { net, cgst, sgst, igst, tax, gross, roundOff }; roundOff is only non-zero when removing GST
 * and the rounded lines need a paisa to add back up to the amount entered.
 */
export function calculateGst(amount, rate, { mode = 'add', interState = false } = {}) {
  const a = Number(amount) || 0;
  const r = Number(rate) || 0;
  const net = mode === 'remove' ? round2(a / (1 + r / 100)) : round2(a);
  const igst = interState ? round2((net * r) / 100) : 0;
  const cgst = interState ? 0 : round2((net * r) / 200);
  const sgst = cgst;
  const tax = round2(igst + cgst + sgst);
  const lines = round2(net + tax);
  const gross = mode === 'remove' ? round2(a) : lines;
  return { net, cgst, sgst, igst, tax, gross, roundOff: round2(gross - lines), rate: r };
}

// Main slabs after the rate rationalisation effective 22 September 2025; any other rate goes in Custom.
export const GST_PRESETS = [3, 5, 18, 40];
