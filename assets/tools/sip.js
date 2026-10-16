// SIP calculator page: monthly SIP with step-up and inflation, lump sum growth, and the monthly amount a goal needs.
import { $, $$, num, radio, setRadio, money, plain, pct, fillCurrencySelect, syncCurrencyAffixes, linkRange, copyText, shareButton, readHashState } from './kit.js';
import { monthlyRate, sipForGoal, todaysMoney, sipProjection, lumpSumProjection, referenceTable, REFERENCE } from './lib/sip.js';

const form = $('#sip-form');
const live = $('#sip-live');
const curSelect = $('#sip-cur');
let cur = fillCurrencySelect(curSelect);
const amountInput = $('#sip-amount'), lumpInput = $('#sip-lump'), goalInput = $('#sip-goal'), rateInput = $('#sip-rate'), termInput = $('#sip-term');
const stepUpInput = $('#sip-stepup'), inflationInput = $('#sip-inflation');
const NONE = money(NaN); // the kit's placeholder for "no value"
const m0 = n => money(n, cur, 0);

// ---------- inputs and sliders ----------
// Amount sliders run on a log scale so one slider reaches from a few hundred to crores
const niceRound = v => { const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / mag) * mag; };
const logRange = (range, input) => linkRange(range, input, { toRange: v => Math.log10(Math.max(v, 1)), fromRange: x => plain(niceRound(Math.pow(10, x)), 0, cur), onInput: () => update() });
const syncAmount = logRange($('#sip-amount-range'), amountInput);
const syncLump = logRange($('#sip-lump-range'), lumpInput);
const syncGoal = logRange($('#sip-goal-range'), goalInput);
const syncRate = linkRange($('#sip-rate-range'), rateInput, { onInput: () => update(), fromRange: v => plain(v, 2) });
const termRange = $('#sip-term-range');
const syncTerm = linkRange(termRange, termInput, { onInput: () => update() });
function setUnitRange() {
  termRange.max = radio('unit') === 'months' ? '600' : '50';
  syncTerm();
}
$$('input[name="unit"]').forEach(el => el.addEventListener('change', () => {
  const t = num(termInput.value);
  if (Number.isFinite(t)) termInput.value = radio('unit') === 'months' ? String(Math.round(t * 12)) : plain(t / 12, 2);
  setUnitRange();
  update();
}));

const activeAmount = mode => (mode === 'sip' ? amountInput : mode === 'lump' ? lumpInput : goalInput);
const optional = el => (el.value.trim() === '' ? 0 : num(el.value)); // blank means none; "10%" is caught below rather than ignored
function read() {
  const mode = radio('mode');
  const t = num(termInput.value);
  return {
    mode, amount: num(activeAmount(mode).value), rate: num(rateInput.value),
    months: Math.round(radio('unit') === 'months' ? t : t * 12),
    stepUp: optional(stepUpInput), inflation: optional(inflationInput), compounding: radio('compounding'),
  };
}
// Amount in words beside the field: lakh and crore for rupees, since ICU's en-IN long form stops at "million"
const words = n => {
  if (!(n >= 1000)) return '';
  if (cur === 'INR') {
    const [div, unit] = n >= 1e7 ? [1e7, 'crore'] : n >= 1e5 ? [1e5, 'lakh'] : [1e3, 'thousand'];
    return `${plain(n / div, 2)} ${unit}`;
  }
  return new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 2 }).format(n);
};
const duration = m => { const y = Math.floor(m / 12), r = m % 12; return [y ? `${y} year${y === 1 ? '' : 's'}` : '', r ? `${r} month${r === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ') || '0 months'; };
const row = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;

// ---------- calculate and render ----------
let summary = '';
function clear(msg) {
  $('#sip-head').textContent = NONE; $('#sip-head-sub').textContent = msg; $('#sip-rows').innerHTML = ''; $('#sip-legend').innerHTML = '';
  $('#sip-formula').textContent = ''; $('#sip-table').innerHTML = ''; summary = '';
}
function update() {
  const { mode, amount, rate, months: n, stepUp, inflation, compounding } = read();
  $$('[data-mode]', form).forEach(el => { el.hidden = !el.dataset.mode.split(' ').includes(mode); });
  $('#sip-optional-label').textContent = mode === 'sip' ? 'Step-up and inflation' : 'Inflation';
  $('#sip-compounding-help').textContent = compounding === 'monthly'
    ? 'Compounds every month at a twelfth of the rate, which gives a little more than yearly.'
    : 'Compounds once a year, the way fund returns (CAGR) are quoted.';
  for (const [input, hint] of [[amountInput, '#sip-amount-words'], [lumpInput, '#sip-lump-words'], [goalInput, '#sip-goal-words']]) $(hint).textContent = words(num(input.value));

  const err = $('#sip-error');
  const problem = !(amount > 0) ? (mode === 'goal' ? 'Enter a target amount.' : 'Enter an amount to invest.')
    : !(rate >= 0 && rate <= 50) ? 'Enter an expected return between 0% and 50%.'
    : !(n >= 1 && n <= 600) ? 'Enter a duration between 1 month and 50 years.'
    : mode === 'sip' && !(stepUp >= 0 && stepUp <= 100) ? 'Enter a step-up between 0% and 100%.'
    : mode !== 'goal' && !(inflation >= 0 && inflation <= 50) ? 'Enter an inflation rate between 0% and 50%.' : '';
  err.textContent = problem && activeAmount(mode).value && rateInput.value && termInput.value ? problem : '';
  if (problem) return clear(problem);

  const i = monthlyRate(rate);
  const iStr = plain(i, 6, 'USD');
  const monthly = mode === 'goal' ? sipForGoal(amount, rate, n) : amount;
  const p = mode === 'lump' ? lumpSumProjection(amount, rate, n, compounding) : sipProjection(monthly, rate, n, mode === 'sip' ? stepUp : 0);
  const years = n / 12;
  const todays = mode !== 'goal' && inflation > 0 ? todaysMoney(p.value, inflation, n) : null;

  $('#sip-head-label').textContent = mode === 'goal' ? 'Monthly SIP needed' : 'Maturity value';
  $('#sip-head').textContent = mode === 'goal' ? money(monthly, cur) : m0(p.value);
  $('#sip-head-sub').textContent = mode === 'sip' ? `${m0(amount)} a month for ${duration(n)} at ${pct(rate)} a year${stepUp > 0 ? `, rising ${pct(stepUp)} every year` : ''}.`
    : mode === 'lump' ? `${m0(amount)} invested once for ${duration(n)} at ${pct(rate)} a year, compounded ${compounding}.`
    : `to reach ${m0(amount)} in ${duration(n)} at ${pct(rate)} a year.`;

  const investedShare = p.value > 0 ? Math.min(100, (p.invested / p.value) * 100) : 0;
  const [iBar, rBar] = $$('#sip-split span');
  iBar.style.width = `${investedShare}%`;
  rBar.style.width = `${100 - investedShare}%`;
  $('#sip-split').setAttribute('aria-label', `Invested ${plain(investedShare, 1)}% and returns ${plain(100 - investedShare, 1)}% of the maturity value`);
  $('#sip-legend').innerHTML = `<span><i style="background:#4b89e6"></i>Invested ${plain(investedShare, 0)}%</span><span><i style="background:#b08a2e"></i>Returns ${plain(100 - investedShare, 0)}%</span>`;

  const rows = [row('Total invested', m0(p.invested)), row('Estimated returns', m0(p.returns), 'good'), row(mode === 'goal' ? 'Target reached' : 'Maturity value', m0(p.value), 'total')];
  if (todays !== null) rows.push(row("In today's money", m0(todays))); // the rate is in the formula below; a longer label squeezes the figure on phones
  $('#sip-rows').innerHTML = rows.join('');

  // The formula with the visitor's own numbers
  const rateLine = `i = ${pct(rate)} ÷ 12 = ${iStr}`;
  let formula;
  if (mode === 'lump') {
    formula = compounding === 'monthly' ? `${rateLine}<br>FV = ${m0(amount)} × (1 + ${iStr})^${n} = ${m0(p.value)}`
      : `FV = ${m0(amount)} × (1 + ${plain(rate / 100, 4, 'USD')})^${plain(years, 2, 'USD')} = ${m0(p.value)}`;
  } else if (mode === 'goal') {
    formula = i === 0 ? `P = ${m0(amount)} ÷ ${n} = ${money(monthly, cur)}`
      : `${rateLine}<br>P = ${m0(amount)} × ${iStr} ÷ (((1 + ${iStr})^${n} − 1) × (1 + ${iStr})) = ${money(monthly, cur)}`;
  } else if (stepUp > 0) {
    const last = p.years[p.years.length - 1];
    formula = `${rateLine}<br>Year 1: ${m0(amount)} a month, then ${pct(stepUp)} more each year (year ${last.year}: ${m0(last.monthly)}).`
      + `<br>Each instalment grows by (1 + ${iStr}) for every month it stays invested: FV = Σ instalment × (1 + ${iStr})^(months left) = ${m0(p.value)}`;
  } else {
    formula = i === 0 ? `FV = ${m0(amount)} × ${n} = ${m0(p.value)}`
      : `${rateLine}<br>FV = ${m0(amount)} × ((1 + ${iStr})^${n} − 1) ÷ ${iStr} × (1 + ${iStr}) = ${m0(p.value)}`;
  }
  if (todays !== null) formula += `<br>In today's money = ${m0(p.value)} ÷ (1 + ${plain(inflation / 100, 4, 'USD')})^${plain(years, 2, 'USD')} = ${m0(todays)}`;
  $('#sip-formula').innerHTML = formula;

  $('#sip-table-sub').textContent = mode === 'lump' ? 'What the one-time investment is worth at the end of each year.'
    : mode === 'goal' ? `Investing ${money(monthly, cur)} every month: what has gone in so far and what it is worth at the end of each year.`
    : 'What has gone in so far and what it is worth at the end of each year.';
  $('#sip-table').innerHTML = p.years.map(y => `<tr><td>Year ${y.year}${y.months < 12 ? `<span class="block hint">${y.months} month${y.months === 1 ? '' : 's'}</span>` : ''}${mode === 'sip' && stepUp > 0 ? `<span class="block hint">${m0(y.monthly)} a month</span>` : ''}</td><td>${m0(y.invested)}</td><td>${m0(y.returns)}</td><td>${m0(y.value)}</td></tr>`).join('');

  summary = mode === 'sip' ? `SIP: ${m0(amount)} a month for ${duration(n)} at ${pct(rate)}${stepUp > 0 ? `, stepping up ${pct(stepUp)} a year,` : ''} grows to ${m0(p.value)}: ${m0(p.invested)} invested, ${m0(p.returns)} of returns.`
    : mode === 'lump' ? `Lump sum: ${m0(amount)} invested once for ${duration(n)} at ${pct(rate)} (compounded ${compounding}) grows to ${m0(p.value)}, a return of ${m0(p.returns)}.`
    : `Goal: ${money(monthly, cur)} a month for ${duration(n)} at ${pct(rate)} reaches ${m0(amount)}, with ${m0(p.invested)} invested and ${m0(p.returns)} of returns.`;
  if (todays !== null) summary += ` Worth ${m0(todays)} in today's money at ${pct(inflation)} inflation.`;
}

// Reference table: a fixed monthly SIP at each rate over each term
function renderReference() {
  $('#sip-ref-title').textContent = `What ${m0(REFERENCE.monthly)} a month becomes`;
  $('#sip-ref tbody').innerHTML = referenceTable().map(r => `<tr><td>${r.years} years</td><td>${m0(r.invested)}</td>${r.values.map(v => `<td>${m0(v)}</td>`).join('')}</tr>`).join('');
}

// ---------- state ----------
function defaults() {
  amountInput.value = plain(cur === 'INR' ? 5000 : 500, 0, cur);
  lumpInput.value = plain(cur === 'INR' ? 100000 : 10000, 0, cur);
  goalInput.value = plain(cur === 'INR' ? 10000000 : 1000000, 0, cur);
}
const st = readHashState();
if (st && st.c) { curSelect.value = st.c; cur = curSelect.value || cur; curSelect.value = cur; }
defaults();
if (st) {
  if (st.m) setRadio('mode', st.m);
  if (st.u) setRadio('unit', st.u);
  if (st.k) setRadio('compounding', st.k);
  const set = (el, v, digits = 2) => { if (v !== undefined && Number.isFinite(Number(v))) el.value = plain(Number(v), digits, cur); };
  set(amountInput, st.a); set(lumpInput, st.l); set(goalInput, st.g); set(rateInput, st.r, 3); set(termInput, st.t); set(stepUpInput, st.s, 3); set(inflationInput, st.f, 3);
}
syncCurrencyAffixes(cur);
setUnitRange();
syncAmount();
syncLump();
syncGoal();
syncRate();
renderReference();

form.addEventListener('input', e => { if (!e.target.matches('.range') && e.target.name !== 'unit') update(); });
form.addEventListener('change', e => { if (e.target.name !== 'unit') update(); });
curSelect.addEventListener('change', () => { cur = curSelect.value; syncCurrencyAffixes(cur); renderReference(); update(); });
// Reformat typed amounts with grouping separators once the visitor leaves the field
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.matches('#sip-amount, #sip-lump, #sip-goal')) return;
  const v = num(el.value);
  if (Number.isFinite(v)) el.value = plain(v, 2, cur);
});
$('#sip-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#sip-share'), () => ({ m: radio('mode'), c: cur, a: num(amountInput.value), l: num(lumpInput.value), g: num(goalInput.value), r: num(rateInput.value), t: num(termInput.value), u: radio('unit'), s: num(stepUpInput.value), f: num(inflationInput.value), k: radio('compounding') }), live);
update();
