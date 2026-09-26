// Commission maths. Pure functions, no DOM.
// A plan is { type: 'flat', rate } or { type: 'tiered', method: 'graduated' | 'retroactive', tiers: [{ upTo, rate }] }.
// Rates are percentages. Tier i covers sales above the previous tier's upTo, up to and including its own upTo;
// the last tier's upTo is Infinity ("and above").

/** Sorts tiers, drops blanks, and makes sure the last one is open-ended. */
export function normalizeTiers(tiers) {
  const rows = tiers
    .map(t => ({ upTo: t.upTo === '' || t.upTo == null || !Number.isFinite(Number(t.upTo)) ? Infinity : Number(t.upTo), rate: Number(t.rate) || 0 }))
    .filter(t => t.upTo > 0);
  rows.sort((a, b) => a.upTo - b.upTo);
  const out = [];
  for (const t of rows) if (!out.length || t.upTo > out[out.length - 1].upTo) out.push(t);
  if (!out.length) return [{ upTo: Infinity, rate: 0 }];
  out[out.length - 1] = { ...out[out.length - 1], upTo: Infinity };
  return out;
}

const bounds = tiers => tiers.map((t, i) => ({ from: i ? tiers[i - 1].upTo : 0, to: t.upTo, rate: t.rate }));

/** Gross commission on `sales` and the per-band breakdown. */
export function commissionFor(sales, plan) {
  const s = Math.max(0, Number(sales) || 0);
  if (plan.type === 'flat') {
    const commission = (s * plan.rate) / 100;
    return { gross: commission, rate: plan.rate, bands: s ? [{ from: 0, to: s, amount: s, rate: plan.rate, commission }] : [] };
  }
  const tiers = bounds(normalizeTiers(plan.tiers));
  if (plan.method === 'retroactive') {
    const tier = tiers.find(t => s <= t.to) || tiers[tiers.length - 1];
    const commission = (s * tier.rate) / 100;
    return { gross: commission, rate: tier.rate, reached: tiers.indexOf(tier), bands: s ? [{ from: 0, to: s, amount: s, rate: tier.rate, commission }] : [] };
  }
  let gross = 0;
  const bands = [];
  tiers.forEach((t, i) => {
    const amount = Math.max(0, Math.min(s, t.to) - t.from);
    if (amount > 0) {
      const commission = (amount * t.rate) / 100;
      gross += commission;
      bands.push({ tier: i, from: t.from, to: Math.min(s, t.to), amount, rate: t.rate, commission });
    }
  });
  return { gross, rate: s ? (gross / s) * 100 : 0, bands };
}

/** Full picture for a sales figure: gross commission, your share, base pay, total and effective rate. */
export function earnings(sales, plan, { base = 0, share = 100, quota = 0 } = {}) {
  const c = commissionFor(sales, plan);
  const yours = (c.gross * share) / 100;
  return {
    ...c,
    sales,
    yours,
    base,
    total: base + yours,
    effectiveRate: sales > 0 ? (yours / sales) * 100 : 0,
    attainment: quota > 0 ? (sales / quota) * 100 : null,
  };
}

const ceilCents = n => Math.ceil(n * 100 - 1e-7) / 100;

/**
 * Smallest sales figure whose total earnings (base + your share of commission) reach `target`.
 * Returns { sales, reachable, atThreshold } where atThreshold marks a retroactive plan whose answer
 * is the first amount above a tier boundary.
 */
export function salesForTarget(target, plan, { base = 0, share = 100 } = {}) {
  const need = share > 0 ? ((target - base) * 100) / share : Infinity;
  if (!(need > 0)) return { sales: 0, reachable: true, atThreshold: false, commissionNeeded: 0 };
  if (!Number.isFinite(need)) return { sales: NaN, reachable: false, atThreshold: false, commissionNeeded: need };
  if (plan.type === 'flat') {
    if (!(plan.rate > 0)) return { sales: NaN, reachable: false, atThreshold: false, commissionNeeded: need };
    return { sales: ceilCents((need * 100) / plan.rate), reachable: true, atThreshold: false, commissionNeeded: need };
  }
  const tiers = bounds(normalizeTiers(plan.tiers));
  if (plan.method === 'retroactive') {
    for (const t of tiers) {
      if (!(t.rate > 0)) continue;
      const s = (need * 100) / t.rate;
      if (s <= t.to) {
        // Inside this tier's range the whole amount earns t.rate, so the answer is s,
        // unless s sits at or below the tier's floor: then the first cent above the floor already qualifies.
        if (s > t.from) return { sales: ceilCents(s), reachable: true, atThreshold: false, commissionNeeded: need };
        return { sales: Math.round(t.from * 100 + 1) / 100, reachable: true, atThreshold: true, commissionNeeded: need };
      }
    }
    return { sales: NaN, reachable: false, atThreshold: false, commissionNeeded: need };
  }
  let earned = 0;
  for (const t of tiers) {
    const span = t.to - t.from;
    const bandMax = (span * t.rate) / 100;
    if (t.rate > 0 && earned + bandMax >= need) {
      return { sales: ceilCents(t.from + ((need - earned) * 100) / t.rate), reachable: true, atThreshold: false, commissionNeeded: need };
    }
    earned += bandMax;
  }
  return { sales: NaN, reachable: false, atThreshold: false, commissionNeeded: need };
}

/** Compact text form for share links: "500000:5,1000000:8,:10". */
export const encodeTiers = tiers => tiers.map(t => `${Number.isFinite(t.upTo) ? t.upTo : ''}:${t.rate}`).join(',');
export const decodeTiers = s => String(s || '').split(',').filter(Boolean).map(p => { const [u, r] = p.split(':'); return { upTo: u === '' ? Infinity : Number(u), rate: Number(r) }; });
