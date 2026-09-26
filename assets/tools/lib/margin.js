// Margin and markup maths. Pure functions, no DOM. Percentages in, percentages out.
// Margin = profit ÷ price. Markup = profit ÷ cost.

const result = (cost, price) => {
  const profit = price - cost;
  return {
    cost,
    price,
    profit,
    margin: price !== 0 ? (profit / price) * 100 : NaN,
    markup: cost !== 0 ? (profit / cost) * 100 : NaN,
  };
};

/** mode: 'cost-price' | 'cost-margin' | 'cost-markup' | 'price-margin'. Returns null when the inputs cannot produce a price. */
export function solve(mode, a, b) {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  switch (mode) {
    case 'cost-price': return result(x, y);
    case 'cost-margin': return y < 100 ? result(x, x / (1 - y / 100)) : null;
    case 'cost-markup': return y > -100 ? result(x, x * (1 + y / 100)) : null;
    case 'price-margin': return y <= 100 ? result(x * (1 - y / 100), x) : null;
    default: return null;
  }
}

export const marginToMarkup = m => (m < 100 ? (m / (100 - m)) * 100 : Infinity);
export const markupToMargin = k => (k > -100 ? (k / (100 + k)) * 100 : NaN);
