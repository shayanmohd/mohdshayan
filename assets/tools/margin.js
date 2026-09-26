// Margin and markup calculator page.
import { $, num, radio, setRadio, money, pct, plain, fillCurrencySelect, syncCurrencyAffixes, copyText, shareButton, readHashState } from './kit.js';
import { solve, marginToMarkup } from './lib/margin.js';

const form = $('#mg-form');
const live = $('#mg-live');
const curSelect = $('#mg-cur');
let cur = fillCurrencySelect(curSelect);
const a = $('#mg-a'), b = $('#mg-b');

const MODES = {
  'cost-price': { a: 'Cost per unit', b: 'Selling price', bPct: false, head: 'Gross margin' },
  'cost-margin': { a: 'Cost per unit', b: 'Target margin', bPct: true, head: 'Selling price' },
  'cost-markup': { a: 'Cost per unit', b: 'Markup', bPct: true, head: 'Selling price' },
  'price-margin': { a: 'Selling price', b: 'Target margin', bPct: true, head: 'Most you can pay' },
};

let prevMode = 'cost-price';
function setMode(mode, keep = false) {
  const m = MODES[mode];
  $('#mg-a-label').textContent = m.a;
  $('#mg-b-label').textContent = m.b;
  $('#mg-b-pre').hidden = m.bPct;
  $('#mg-b-post').hidden = !m.bPct;
  b.classList.toggle('has-post', m.bPct);
  syncCurrencyAffixes(cur);
  if (m.bPct) b.style.paddingLeft = ''; // no currency prefix on a percentage
  if (!keep) {
    // Keep the same product in view: re-express the current figures in the new mode's terms
    const r = solve(prevMode, num(a.value), num(b.value)) || solve('cost-price', 100, 150);
    const two = n => plain(n, 2, cur);
    const pairs = { 'cost-price': [r.cost, r.price], 'cost-margin': [r.cost, r.margin], 'cost-markup': [r.cost, r.markup], 'price-margin': [r.price, r.margin] };
    const [va, vb] = pairs[mode];
    a.value = two(va);
    b.value = Number.isFinite(vb) ? (m.bPct ? plain(vb, 4) : two(vb)) : ''; // 4 places so 33.3333% still prices at exactly 150
  }
  prevMode = mode;
}

let summary = '';
function update() {
  const mode = radio('mode');
  const x = num(a.value), y = num(b.value);
  const units = Math.max(1, Math.round(num($('#mg-units').value) || 1));
  const err = $('#mg-error');
  err.textContent = '';
  const clear = msg => { $('#mg-head').textContent = '–'; $('#mg-head-sub').textContent = msg; $('#mg-rows').innerHTML = ''; $('#mg-legend').innerHTML = ''; summary = ''; };
  if (!Number.isFinite(x) || !Number.isFinite(y)) return clear('Fill in both figures.');
  if (mode === 'cost-margin' && y >= 100) { err.textContent = 'A margin must be below 100%: profit can never be the whole price.'; return clear('Margin must be below 100%.'); }
  const r = solve(mode, x, y);
  if (!r) return clear('Those figures do not give a price.');

  const loss = r.profit < 0;
  const m0 = n => money(n, cur);
  $('#mg-head-label').textContent = MODES[mode].head;
  $('#mg-head').textContent = mode === 'cost-price' ? pct(r.margin, 1) : mode === 'price-margin' ? m0(r.cost) : m0(r.price);
  $('#mg-head-sub').textContent = loss ? `Selling at a loss of ${m0(-r.profit)} a unit.`
    : mode === 'cost-price' ? `${m0(r.profit)} profit on every ${m0(r.price)} sale.`
    : mode === 'price-margin' ? `Keep the cost at or below this to earn ${pct(r.margin, 1)} at ${m0(r.price)}.`
    : `${pct(r.margin, 1)} margin, ${pct(r.markup, 1)} markup on a cost of ${m0(r.cost)}.`;

  const profitShare = r.price > 0 ? Math.min(100, Math.max(0, (r.profit / r.price) * 100)) : 0;
  const [cBar, pBar] = $('#mg-split').children;
  cBar.style.width = `${100 - profitShare}%`;
  pBar.style.width = `${profitShare}%`;
  $('#mg-split').setAttribute('aria-label', `Of the price, cost is ${plain(100 - profitShare, 1)}% and profit is ${plain(profitShare, 1)}%`);
  $('#mg-legend').innerHTML = `<span><i style="background:#4b89e6"></i>Cost ${plain(100 - profitShare, 0)}%</span><span><i style="background:#b08a2e"></i>Profit ${plain(profitShare, 0)}%</span>`;

  const row = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const rows = [row('Cost', m0(r.cost)), row('Price', m0(r.price)), row('Profit per unit', m0(r.profit), loss ? '' : 'good'), row('Gross margin', pct(r.margin, 2)), row('Markup', pct(r.markup, 2))];
  if (units > 1) rows.push(row(`Revenue (${plain(units, 0)} units)`, m0(r.price * units)), row('Total profit', m0(r.profit * units), 'total'));
  $('#mg-rows').innerHTML = rows.join('');
  summary = `Cost ${m0(r.cost)}, price ${m0(r.price)}: profit ${m0(r.profit)} a unit, margin ${pct(r.margin, 2)}, markup ${pct(r.markup, 2)}.${units > 1 ? ` On ${plain(units, 0)} units: revenue ${m0(r.price * units)}, profit ${m0(r.profit * units)}.` : ''}`;
}

// Reference table
$('#mg-table tbody').innerHTML = [10, 15, 20, 25, 30, 35, 40, 50, 60, 75].map(m => {
  const k = marginToMarkup(m);
  return `<tr><td>${m}%</td><td>${pct(k, 1)}</td><td>${plain(100 * (1 + k / 100), 2)}</td><td>${plain(100 * (k / 100), 2)}</td></tr>`;
}).join('');

// State
const st = readHashState();
if (st && MODES[st.m]) {
  if (st.c) { curSelect.value = st.c; cur = curSelect.value; }
  setRadio('mode', st.m);
  prevMode = st.m;
  setMode(st.m, true);
  if (st.a) a.value = plain(Number(st.a), 4, cur);
  if (st.b) b.value = plain(Number(st.b), 4, cur);
  if (st.u) $('#mg-units').value = st.u;
} else {
  a.value = plain(100, 2, cur);
  b.value = plain(150, 2, cur);
  setMode('cost-price', true);
}
syncCurrencyAffixes(cur);

form.addEventListener('input', update);
form.addEventListener('change', e => { if (e.target.name === 'mode') setMode(radio('mode')); update(); });
curSelect.addEventListener('change', () => { cur = curSelect.value; setMode(radio('mode'), true); update(); });
$('#mg-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#mg-share'), () => ({ m: radio('mode'), c: cur, a: num(a.value), b: num(b.value), u: num($('#mg-units').value) || '' }), live);
update();
