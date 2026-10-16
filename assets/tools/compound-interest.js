// Compound interest calculator page: growth with regular contributions, year by year, against simple interest.
import { $, num, radio, setRadio, money, plain, pct, fillCurrencySelect, syncCurrencyAffixes, copyText, shareButton, readHashState, escapeHtml } from './kit.js';
import { compound, tidy, FREQUENCIES } from './lib/compound-interest.js';

const form = $('#ci-form');
const live = $('#ci-live');
const curSelect = $('#ci-cur');
let cur = fillCurrencySelect(curSelect);
const principalInput = $('#ci-principal'), rateInput = $('#ci-rate'), yearsInput = $('#ci-years'), monthsInput = $('#ci-months'), contribInput = $('#ci-contrib');

const m2 = n => money(tidy(n), cur, 2);
const rate3 = n => pct(tidy(n, 10), 3);
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
const freqWord = n => FREQUENCIES.find(f => f.n === n).label;
const row = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;

function readInputs() {
  const field = el => (el.value.trim() ? num(el.value) : 0); // blank means none; anything unreadable is NaN and caught below
  const years = field(yearsInput), extra = field(monthsInput);
  return {
    principal: field(principalInput), // blank means a contributions-only plan
    rate: num(rateInput.value),
    months: years >= 0 && extra >= 0 ? Math.round(years * 12 + extra) : NaN,
    n: Number(radio('freq')),
    contribution: field(contribInput),
    perYear: Number(radio('cfreq')),
    timing: radio('when'),
  };
}

// ---------- calculate and render ----------
let summary = '';
function update() {
  const i = readInputs();
  $('#ci-principal-words').textContent = words(i.principal);
  const problem = !(i.principal >= 0) ? 'Enter a starting amount, or leave it blank for contributions only.'
    : !(i.rate >= 0 && i.rate <= 100) ? 'Enter an interest rate between 0% and 100%.'
    : !(i.months >= 1 && i.months <= 1200) ? 'Enter a term between 1 month and 100 years.'
    : !(i.contribution >= 0) ? 'Enter a contribution amount, or leave it blank.'
    : i.principal === 0 && i.contribution === 0 ? 'Enter a starting amount or a regular contribution.' : '';
  $('#ci-error').textContent = problem && rateInput.value && (yearsInput.value || monthsInput.value) ? problem : '';
  const r = problem ? null : compound(i);
  if (!r) {
    $('#ci-head').textContent = m2(NaN); $('#ci-head-sub').textContent = problem || 'Check the figures.';
    $('#ci-rows').innerHTML = ''; $('#ci-legend').innerHTML = ''; $('#ci-formula').textContent = ''; $('#ci-table').innerHTML = ''; $('#ci-glance tbody').innerHTML = '';
    summary = '';
    return;
  }

  const c = i.contribution, n = i.n, t = i.months / 12, per = i.perYear === 12 ? 'month' : 'year';
  const paying = `${m2(c)} at the ${i.timing} of every ${per}`;
  const plan = r.principal > 0
    ? `${m2(r.principal)} at ${plain(i.rate, 3)}% for ${duration(i.months)}, compounded ${freqWord(n)}${c ? `, plus ${paying}` : ''}`
    : `${paying} for ${duration(i.months)} at ${plain(i.rate, 3)}%, compounded ${freqWord(n)}`;
  $('#ci-head').textContent = m2(r.final);
  $('#ci-head-sub').textContent = `${plan}.`;

  const names = ['Starting amount', 'Contributions', 'Interest'], colours = ['#4b89e6', '#22987a', '#b08a2e'];
  const shares = [r.principal, r.contributions, r.interest].map(v => (r.final > 0 ? (v / r.final) * 100 : 0));
  Array.from($('#ci-split').children).forEach((el, k) => { el.style.width = `${shares[k]}%`; el.style.display = shares[k] > 0 ? '' : 'none'; });
  $('#ci-split').setAttribute('aria-label', `Of the final amount, ${names.map((nm, k) => (shares[k] > 0 ? `${nm.toLowerCase()} is ${plain(shares[k], 1)}%` : '')).filter(Boolean).join(', ')}`);
  $('#ci-legend').innerHTML = names.map((nm, k) => (shares[k] > 0 ? `<span><i style="background:${colours[k]}"></i>${nm} ${plain(shares[k], 0)}%</span>` : '')).join('');

  const rows = [row('Starting amount', m2(r.principal))];
  if (c > 0) rows.push(row(`Contributions<span class="block text-xs">${plain(r.count, 0)} × ${m2(c)}</span>`, m2(r.contributions)));
  rows.push(row('Interest earned', m2(r.interest), 'good'), row('Final amount', m2(r.final), 'total'), row('Effective annual rate', rate3(r.effectiveRate)),
    row('At simple interest', m2(r.simpleFinal)), row('Compounding adds', m2(r.final - r.simpleFinal)));
  $('#ci-rows').innerHTML = rows.join('');

  // The formula with the visitor's numbers. The annuity form is exact only when the term is whole contribution periods.
  const rateTxt = `${plain(i.rate, 4)}%`;
  const lines = [];
  if (r.principal > 0) lines.push(`A = P × (1 + r ÷ n)^(n × t) = ${m2(r.principal)} × (1 + ${rateTxt} ÷ ${n})^(${n} × ${plain(t, 4)}) = ${m2(r.fromPrincipal)}`);
  if (c > 0) {
    const iTxt = `${plain(tidy(r.ratePerPeriod, 10), 4)}% a ${per}`;
    if (i.rate === 0) lines.push(`Contributions: ${plain(r.count, 0)} × ${m2(c)} = ${m2(r.fromContributions)}, with no interest at 0%`);
    else if (i.months % (12 / i.perYear) === 0) lines.push(`Contributions: ${m2(c)} × ((1 + i)^${r.count} − 1) ÷ i${i.timing === 'start' ? ' × (1 + i)' : ''} = ${m2(r.fromContributions)}, where i = (1 + ${rateTxt} ÷ ${n})^(${n} ÷ ${i.perYear}) − 1 = ${iTxt}`);
    else lines.push(`Contributions: each of the ${plain(r.count, 0)} payments of ${m2(c)} grows at i = ${iTxt} for the time left after it is paid = ${m2(r.fromContributions)}`);
    if (r.principal > 0) lines.push(`Final amount = ${m2(r.fromPrincipal)} + ${m2(r.fromContributions)} = ${m2(r.final)}`);
  }
  lines.push(`Effective annual rate = (1 + ${rateTxt} ÷ ${n})^${n} − 1 = ${rate3(r.effectiveRate)}`);
  const simpleParts = [];
  if (r.principal > 0) simpleParts.push(`${m2(r.principal)} × ${rateTxt} × ${plain(t, 4)}`);
  if (c > 0) simpleParts.push(`each contribution at ${rateTxt} for its time left`);
  lines.push(`Simple interest = ${simpleParts.join(', plus ')} = ${m2(r.simpleInterest)}`);
  $('#ci-formula').innerHTML = lines.map(escapeHtml).join('<br>');

  $('#ci-table').innerHTML = r.years.map(y => `<tr><td>Year ${y.year}${y.months < 12 ? `<span class="block hint">${y.months} month${y.months === 1 ? '' : 's'}</span>` : ''}</td><td>${m2(y.opening)}</td><td>${m2(y.contributions)}</td><td>${m2(y.interest)}</td><td>${m2(y.closing)}</td></tr>`).join('')
    + `<tr class="sum"><td>Total</td><td></td><td>${m2(r.contributions)}</td><td>${m2(r.interest)}</td><td>${m2(r.final)}</td></tr>`;

  $('#ci-glance tbody').innerHTML = FREQUENCIES.map(f => {
    const g = compound({ ...i, n: f.n });
    const label = f.label[0].toUpperCase() + f.label.slice(1);
    return `<tr><td>${label}${f.n === n ? ' <span class="hint">· chosen</span>' : ''}</td><td>${f.n}</td><td>${rate3(g.effectiveRate)}</td><td>${m2(g.interest)}</td><td>${m2(g.final)}</td></tr>`;
  }).join('');

  summary = `${plan}: final amount ${m2(r.final)}, of which ${m2(r.deposits)} was deposited and ${m2(r.interest)} is interest. Effective annual rate ${rate3(r.effectiveRate)}. Simple interest would have given ${m2(r.simpleFinal)}.`;
}

// ---------- state ----------
function defaults() {
  principalInput.value = plain(cur === 'INR' ? 100000 : 10000, 0, cur);
}
const st = readHashState();
if (st) {
  if (st.c) { curSelect.value = st.c; if (!curSelect.value) curSelect.value = cur; cur = curSelect.value; } // an unknown code in the link keeps the guessed currency
  const set = (el, key, digits) => { if (key in st && Number.isFinite(Number(st[key]))) el.value = plain(Number(st[key]), digits, cur); };
  if ('p' in st) set(principalInput, 'p', 2); else defaults();
  set(rateInput, 'r', 4); set(yearsInput, 'y', 2); set(monthsInput, 'mo', 2); set(contribInput, 'a', 2);
  if (st.n) setRadio('freq', st.n);
  if (st.f) setRadio('cfreq', st.f);
  if (st.w) setRadio('when', st.w);
} else defaults();
syncCurrencyAffixes(cur);

form.addEventListener('input', update);
form.addEventListener('change', update);
curSelect.addEventListener('change', () => { cur = curSelect.value; syncCurrencyAffixes(cur); update(); });
// Reformat money fields with grouping separators once the visitor leaves them
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.matches('#ci-principal, #ci-contrib')) return;
  const v = num(el.value);
  if (Number.isFinite(v)) el.value = plain(v, 2, cur);
});
$('#ci-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#ci-share'), () => {
  const i = readInputs();
  return { c: cur, p: i.principal, r: num(rateInput.value), y: num(yearsInput.value), mo: num(monthsInput.value), n: i.n, a: i.contribution || '', f: i.perYear, w: i.timing };
}, live);
update();
