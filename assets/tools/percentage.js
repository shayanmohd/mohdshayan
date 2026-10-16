// Percentage calculator page: five independent calculators, each with its own inputs, readout, copy button and share link.
import { $, $$, num, plain, pct, copyText, shareButton, readHashState } from './kit.js';
import { CALCULATORS, percentOf, whatPercent, percentChange, adjustBy, reverse, digitsFor } from './lib/percentage.js';

const form = $('#pc-form');
const live = $('#pc-live');
// plain() and pct() take the locale from a currency code, and any code but INR means the visitor's own locale. This tool has no currency.
// A result is rounded to digitsFor places, and one that rounds to nothing shows as 0, never "-0". A typed figure is shown as typed.
const shown = n => { const d = digitsFor(n); return [Math.abs(n) < 0.5 / 10 ** d ? 0 : n, d]; };
const f = n => { const [v, d] = shown(n); return plain(v, d, 'USD'); };
const p = n => { const [v, d] = shown(n); return pct(v, d); };
const fi = n => plain(n, 10, 'USD');
const pi = n => pct(n, 10);
const term = (n, fmt = fi) => (n < 0 ? `(${fmt(n)})` : fmt(n)); // a negative figure goes in brackets so a formula such as 200 × (-15) reads cleanly
// A typed figure. A percent sign after the number is accepted, since the percentage boxes already show one
const val = el => num(el.value.replace(/%\s*$/, ''));
// Groups the digits of a typed or shared number for the input box, but never changes its value
function fmtInput(v) {
  const pretty = plain(v, 10, 'USD');
  return num(pretty) === v ? pretty : String(v);
}

// What each calculator shows. a and b are its two inputs in page order; r is the result from the library.
// `empty` is the readout label when there is no result yet. `divisor` names the input that cannot be 0, and `zero` is the message when it is.
const TOO_BIG = 'Those numbers are too large to work out.';
const CALCS = {
  of: {
    run: percentOf, empty: 'Percentage of a number',
    view: (a, b, r) => ({ label: `${pi(a)} of ${fi(b)}`, head: f(r.result), sub: `${term(b)} × ${term(a)} ÷ 100 = ${f(r.result)}`, copy: `${pi(a)} of ${fi(b)} = ${f(r.result)}` }),
  },
  what: {
    run: whatPercent, empty: 'As a percentage', divisor: 'b', zero: 'Nothing can be a percentage of zero. Enter a number other than 0 to compare with.',
    view: (a, b, r) => ({ label: `${fi(a)} as a percentage of ${fi(b)}`, head: p(r.result), sub: `${term(a)} ÷ ${term(b)} × 100 = ${f(r.result)}`, copy: `${fi(a)} is ${p(r.result)} of ${fi(b)}` }),
  },
  change: {
    run: percentChange, empty: 'Percentage change', divisor: 'a', zero: 'A change from zero has no percentage: any amount is infinitely more than nothing. Enter a starting value other than 0.',
    view: (a, b, r) => {
      const words = r.direction === 'none' ? 'No change' : `${p(Math.abs(r.result))} ${r.direction}`;
      return { label: `Change from ${fi(a)} to ${fi(b)}`, head: words, sub: `(${term(b)} − ${term(a)}) ÷ ${fi(r.base)} × 100 = ${f(r.result)}`, copy: `From ${fi(a)} to ${fi(b)}: ${words.toLowerCase()}` };
    },
  },
  adjust: {
    run: adjustBy, empty: 'Increased', empty2: 'Decreased',
    view: (a, b, r) => ({
      label: `${fi(a)} increased by ${pi(b)}`, head: f(r.increased), label2: `${fi(a)} decreased by ${pi(b)}`, head2: f(r.decreased),
      sub: `${pi(b)} of ${fi(r.base)} = ${f(r.amount)} · ${term(a)} + ${term(r.amount, f)} = ${f(r.increased)} · ${term(a)} − ${term(r.amount, f)} = ${f(r.decreased)}`,
      copy: `${fi(a)} increased by ${pi(b)} = ${f(r.increased)}; decreased by ${pi(b)} = ${f(r.decreased)}`,
    }),
  },
  reverse: {
    run: reverse, empty: 'The whole', divisor: 'b', zero: '0% of any number is 0, so there is no number to find. Enter a percentage other than 0.',
    view: (a, b, r) => ({ label: `${fi(a)} is ${pi(b)} of`, head: f(r.result), sub: `${term(a)} ÷ ${term(b)} × 100 = ${f(r.result)}`, copy: `${fi(a)} is ${pi(b)} of ${f(r.result)}` }),
  },
};

const copies = {}; // copy-result text per calculator, empty while it has no result
function update(panel) {
  const id = panel.dataset.calc;
  const c = CALCS[id];
  const a = val($('[data-a]', panel)), b = val($('[data-b]', panel));
  const set = (sel, text) => { const el = $(sel, panel); if (el) el.textContent = text; };
  const sub = $('[data-sub]', panel);
  const r = Number.isFinite(a) && Number.isFinite(b) ? c.run(a, b) : undefined; // undefined: a box is empty; null: no answer exists
  if (!r) {
    set('[data-head-label]', c.empty); set('[data-head]', '…'); set('[data-head-label2]', c.empty2); set('[data-head2]', '…');
    sub.textContent = r === undefined ? 'Enter both numbers.' : c.divisor && (c.divisor === 'a' ? a : b) === 0 ? c.zero : TOO_BIG;
    sub.classList.remove('font-mono');
    copies[id] = '';
    return;
  }
  const v = c.view(a, b, r);
  set('[data-head-label]', v.label); set('[data-head]', v.head); set('[data-head-label2]', v.label2); set('[data-head2]', v.head2);
  sub.textContent = v.sub;
  sub.classList.add('font-mono');
  copies[id] = v.copy;
}
const panels = $$('[data-calc]', form);

// Reference table: the common fractions, each worked out as "top is what percent of bottom"; a percentage of 1 is its decimal form
$('#pc-fractions tbody').innerHTML = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [1, 6], [1, 8], [3, 8], [1, 10], [1, 12], [1, 16], [1, 20]].map(([top, bottom]) => {
  const r = whatPercent(top, bottom).result;
  return `<tr><td>${top}/${bottom}</td><td>${p(r)}</td><td>${plain(percentOf(r, 1).result, 4, 'USD')}</td></tr>`;
}).join('');

// State: a shared link names one calculator and its two inputs
const s = readHashState();
const linked = s && CALCULATORS.includes(s.c) ? $(`[data-calc="${s.c}"]`, form) : null;
if (linked) {
  for (const [key, sel] of [['a', '[data-a]'], ['b', '[data-b]']]) {
    const v = Number(s[key]);
    if (s[key] !== undefined && s[key] !== '' && Number.isFinite(v)) $(sel, linked).value = fmtInput(v);
  }
}

form.addEventListener('input', e => { const panel = e.target.closest('[data-calc]'); if (panel) update(panel); });
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.matches('input[inputmode="decimal"]')) return;
  const v = val(el);
  if (Number.isFinite(v)) el.value = fmtInput(v);
});
form.addEventListener('click', e => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const id = btn.closest('[data-calc]').dataset.calc;
  if (copies[id]) copyText(copies[id], btn, live);
});
panels.forEach(panel => {
  shareButton($('[data-link]', panel), () => ({ c: panel.dataset.calc, a: val($('[data-a]', panel)), b: val($('[data-b]', panel)) }), live);
  update(panel);
});
if (linked) linked.scrollIntoView({ block: 'start' });
