// EMI calculator page: instalment, prepayment savings, yearly chart and amortisation schedule.
import { $, $$, num, radio, setRadio, money, plain, fillCurrencySelect, syncCurrencyAffixes, linkRange, copyText, download, shareButton, readHashState, escapeHtml } from './kit.js';
import { schedule, byYear, monthLabel } from './lib/emi.js';

const form = $('#emi-form');
const live = $('#emi-live');
const curSelect = $('#emi-cur');
let cur = fillCurrencySelect(curSelect);
const amountInput = $('#emi-amount'), rateInput = $('#emi-rate'), termInput = $('#emi-term');

// ---------- inputs and sliders ----------
const niceRound = v => { const mag = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.round(v / mag) * mag; };
const syncAmount = linkRange($('#emi-amount-range'), amountInput, { toRange: v => Math.log10(Math.max(v, 1)), fromRange: x => plain(niceRound(Math.pow(10, x)), 0, cur), onInput: () => update() });
const syncRate = linkRange($('#emi-rate-range'), rateInput, { onInput: () => update(), fromRange: v => plain(v, 2) });
const termRange = $('#emi-term-range');
const syncTerm = linkRange(termRange, termInput, { onInput: () => update() });
function setUnitRange() {
  const months = radio('unit') === 'months';
  termRange.min = '1'; termRange.max = months ? '360' : '30'; termRange.step = '1';
  syncTerm();
}
$$('input[name="unit"]').forEach(el => el.addEventListener('change', () => {
  const t = num(termInput.value);
  if (Number.isFinite(t)) termInput.value = radio('unit') === 'months' ? String(Math.round(t * 12)) : plain(t / 12, 2);
  setUnitRange();
  update();
}));

function readLoan() {
  const P = num(amountInput.value), rate = num(rateInput.value), t = num(termInput.value);
  const months = Math.round(radio('unit') === 'months' ? t : t * 12);
  return { P, rate, months, extra: Math.max(0, num($('#emi-extra').value) || 0), start: $('#emi-start').value };
}
const words = n => {
  if (!(n >= 1000)) return '';
  const f = new Intl.NumberFormat(cur === 'INR' ? 'en-IN' : 'en', { notation: 'compact', compactDisplay: 'long', maximumFractionDigits: 2 });
  return f.format(n);
};
const duration = m => { const y = Math.floor(m / 12), r = m % 12; return [y ? `${y} year${y === 1 ? '' : 's'}` : '', r ? `${r} month${r === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ') || '0 months'; };

// ---------- chart ----------
// Axis ticks: K / M for most currencies; rupees use K, L (lakh) and Cr (crore), since en-IN's own compact form writes "T" for thousand
function compact(v) {
  if (cur === 'INR') {
    const [div, unit] = v >= 1e7 ? [1e7, 'Cr'] : v >= 1e5 ? [1e5, 'L'] : v >= 1e3 ? [1e3, 'K'] : [1, ''];
    return `₹${plain(v / div, 1)}${unit}`;
  }
  return new Intl.NumberFormat(undefined, { notation: 'compact', style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(v);
}
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
// Column with a 4px rounded data-end at the top and a square foot on the baseline
const topRounded = (x, y, w, h, r) => {
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};
let lastYears = [];
function renderChart(years) {
  lastYears = years;
  const el = $('#emi-chart');
  if (!years.length) { el.innerHTML = ''; return; }
  const W = Math.max(280, el.clientWidth), H = W < 520 ? 220 : 260;
  const m = { top: 10, right: 4, bottom: 26, left: 58 };
  const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
  const max = Math.max(...years.map(y => y.principal + y.interest));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const Y = v => m.top + ih - (v / top) * ih;
  const slot = iw / years.length;
  const bw = Math.max(3, Math.min(24, slot - 2)); // capped at 24px; slots narrower than 26px keep a 2px gap between bars
  const every = Math.max(1, Math.ceil(years.length / Math.floor(iw / 40)));
  let grid = '', cols = '';
  for (let v = 0; v <= top + step / 2; v += step) {
    grid += `<line class="viz-grid" x1="${m.left}" x2="${W - m.right}" y1="${Y(v)}" y2="${Y(v)}"/><text class="viz-tick" x="${m.left - 8}" y="${Y(v) + 4}" text-anchor="end">${escapeHtml(compact(v))}</text>`;
  }
  years.forEach((g, i) => {
    const x = m.left + slot * i + (slot - bw) / 2;
    const yP = Y(g.principal), yT = Y(g.principal + g.interest), base = Y(0);
    const hasInterest = g.interest > 0 && yP - yT > 2.5;
    const principal = hasInterest ? `<rect class="viz-f2" x="${x}" y="${yP}" width="${bw}" height="${Math.max(0, base - yP)}"/>` : `<path class="viz-f2" d="${topRounded(x, yP, bw, Math.max(0, base - yP), 4)}"/>`;
    const interest = hasInterest ? `<path class="viz-f1" d="${topRounded(x, yT, bw, yP - yT - 2, 4)}"/>` : '';
    const label = i % every === 0 || i === years.length - 1 ? `<text class="viz-tick" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${escapeHtml(g.short)}</text>` : '';
    cols += `<g class="col" data-i="${i}">${principal}${interest}</g>${label}<rect class="hit" data-i="${i}" x="${m.left + slot * i}" y="${m.top}" width="${slot}" height="${ih}" tabindex="0" role="img" aria-label="${escapeHtml(`${g.label}: principal ${money(g.principal, cur, 0)}, interest ${money(g.interest, cur, 0)}, balance ${money(g.balance, cur, 0)}`)}"/>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="Principal and interest paid each year">${grid}<line class="viz-axis" x1="${m.left}" x2="${W - m.right}" y1="${Y(0)}" y2="${Y(0)}"/>${cols}</svg><div class="chart-tip" role="presentation"></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.chart-tip');
  const show = i => {
    const g = years[i];
    svg.classList.add('hovering');
    $$('.col', svg).forEach(c => c.classList.toggle('on', Number(c.dataset.i) === i));
    tip.innerHTML = `<p class="tip-title"></p>
      <p class="tip-row"><span><i class="tip-key" style="background:var(--viz-2)"></i>Principal</span><b data-v="p"></b></p>
      <p class="tip-row"><span><i class="tip-key" style="background:var(--viz-1)"></i>Interest</span><b data-v="i"></b></p>
      <p class="tip-row mt-1 pt-1 border-t border-hairline"><span>Balance after</span><b data-v="b"></b></p>`;
    tip.querySelector('.tip-title').textContent = `${g.label}${g.months < 12 ? ` (${g.months} month${g.months === 1 ? '' : 's'})` : ''}`;
    tip.querySelector('[data-v="p"]').textContent = money(g.principal, cur, 0);
    tip.querySelector('[data-v="i"]').textContent = money(g.interest, cur, 0);
    tip.querySelector('[data-v="b"]').textContent = money(g.balance, cur, 0);
    const cx = m.left + slot * i + slot / 2;
    const tw = tip.offsetWidth || 190;
    tip.style.left = `${Math.min(Math.max(0, cx - tw / 2), W - tw)}px`;
    tip.style.top = `${Math.max(0, Y(g.principal + g.interest) - (tip.offsetHeight || 110) - 10)}px`;
    tip.classList.add('on');
  };
  const hide = () => { svg.classList.remove('hovering'); $$('.col', svg).forEach(c => c.classList.remove('on')); tip.classList.remove('on'); };
  $$('.hit', svg).forEach(h => {
    const i = Number(h.dataset.i);
    h.addEventListener('pointerenter', () => show(i));
    h.addEventListener('focus', () => show(i));
    h.addEventListener('pointerleave', hide);
    h.addEventListener('blur', hide);
  });
}
if ('ResizeObserver' in window) {
  let w = 0;
  new ResizeObserver(entries => { const nw = Math.round(entries[0].contentRect.width); if (nw !== w) { w = nw; renderChart(lastYears); } }).observe($('#emi-chart'));
}

// ---------- calculate and render ----------
let current = null;
let summary = '';
function update() {
  const { P, rate, months, extra, start } = readLoan();
  $('#emi-amount-words').textContent = words(P);
  const err = $('#emi-error');
  const problem = !(P > 0) ? 'Enter a loan amount.' : !(rate >= 0 && rate <= 60) ? 'Enter an interest rate between 0% and 60%.' : !(months >= 1 && months <= 600) ? 'Enter a term between 1 month and 50 years.' : '';
  err.textContent = problem && amountInput.value && rateInput.value && termInput.value ? problem : '';
  if (problem) { $('#emi-head').textContent = '–'; $('#emi-head-sub').textContent = problem; $('#emi-rows').innerHTML = ''; renderChart([]); $('#emi-table').innerHTML = ''; current = null; summary = ''; return; }

  const plain0 = schedule(P, rate, months, 0);
  const s = extra > 0 ? schedule(P, rate, months, extra) : plain0;
  current = { s, start, P, rate, months, extra };
  $('#emi-head').textContent = money(plain0.emi, cur, 0);
  $('#emi-head-sub').textContent = `${money(P, cur, 0)} at ${plain(rate, 2)}% for ${duration(months)}${extra ? `, plus ${money(extra, cur, 0)} extra a month` : ''}.`;

  const interestShare = s.totalPaid > 0 ? (s.totalInterest / s.totalPaid) * 100 : 0;
  const [pBar, iBar] = $$('#emi-split span');
  pBar.style.width = `${100 - interestShare}%`;
  iBar.style.width = `${interestShare}%`;
  $('#emi-split').setAttribute('aria-label', `Principal ${plain(100 - interestShare, 1)}% and interest ${plain(interestShare, 1)}% of everything paid`);
  $('#emi-legend').innerHTML = `<span><i style="background:#4b89e6"></i>Principal ${plain(100 - interestShare, 0)}%</span><span><i style="background:#b08a2e"></i>Interest ${plain(interestShare, 0)}%</span>`;

  const row = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const rows = [row('Principal', money(P, cur, 0)), row('Total interest', money(s.totalInterest, cur, 0)), row('Total of payments', money(s.totalPaid, cur, 0), 'total')];
  if (extra > 0) {
    rows.push(row('Paid off in', duration(s.months)));
    rows.push(row('Interest saved', money(plain0.totalInterest - s.totalInterest, cur, 0), 'good'));
    rows.push(row('Time saved', duration(plain0.months - s.months), 'good'));
  }
  if (start) rows.push(row('Last EMI', monthLabel(start, s.months)));
  $('#emi-rows').innerHTML = rows.join('');

  const years = byYear(s.rows, start).map((g, i) => ({ ...g, short: start ? g.label : String(i + 1) }));
  $('#emi-chart-sub').textContent = `Principal repaid and interest paid in each ${start ? 'calendar year' : 'year of the loan'}. Hover or focus a column for figures.`;
  renderChart(years);
  renderTable();
  summary = `EMI: ${money(plain0.emi, cur, 0)} a month for ${duration(months)} on ${money(P, cur, 0)} at ${plain(rate, 2)}%. Total interest ${money(s.totalInterest, cur, 0)}, total paid ${money(s.totalPaid, cur, 0)}.`
    + (extra > 0 ? ` Paying ${money(extra, cur, 0)} extra a month clears it in ${duration(s.months)} and saves ${money(plain0.totalInterest - s.totalInterest, cur, 0)} of interest.` : '');
}

function renderTable() {
  if (!current) return;
  const { s, start } = current;
  const monthly = radio('group') === 'month';
  $('#emi-col-period').textContent = monthly ? 'Month' : 'Year';
  const list = monthly ? s.rows.map(r => ({ label: monthLabel(start, r.month), principal: r.principal, interest: r.interest, payment: r.payment, balance: r.balance })) : byYear(s.rows, start);
  const m0 = n => money(n, cur, 0);
  $('#emi-table').innerHTML = list.map(r => `<tr><td>${escapeHtml(r.label)}</td><td>${m0(r.principal)}</td><td>${m0(r.interest)}</td><td>${m0(r.payment)}</td><td>${m0(r.balance)}</td></tr>`).join('')
    + `<tr class="sum"><td>Total</td><td>${m0(current.P)}</td><td>${m0(s.totalInterest)}</td><td>${m0(s.totalPaid)}</td><td></td></tr>`;
}

$('#emi-csv').addEventListener('click', () => {
  if (!current) return;
  const { s, start } = current;
  const f = n => n.toFixed(2);
  const lines = [['Month', 'Date', 'EMI principal', 'Extra payment', 'Interest', 'Total paid', 'Balance'].join(',')]
    .concat(s.rows.map(r => [r.month, start ? monthLabel(start, r.month) : '', f(r.principal - r.extra), f(r.extra), f(r.interest), f(r.payment), f(r.balance)].join(',')));
  download(lines.join('\n') + '\n', 'emi-schedule.csv', 'text/csv');
});

// ---------- state ----------
function defaults() {
  amountInput.value = plain(cur === 'INR' ? 3000000 : 300000, 0, cur);
}
const st = readHashState();
if (st) {
  if (st.c) { curSelect.value = st.c; cur = curSelect.value; }
  if (st.u) setRadio('unit', st.u);
  if (st.p) amountInput.value = plain(Number(st.p), 2, cur); else defaults();
  if (st.r) rateInput.value = plain(Number(st.r), 3);
  if (st.t) termInput.value = plain(Number(st.t), 2);
  if (st.x) $('#emi-extra').value = plain(Number(st.x), 2, cur);
  if (st.s && /^\d{4}-\d{2}$/.test(st.s)) $('#emi-start').value = st.s;
} else defaults();
syncCurrencyAffixes(cur);
setUnitRange();
syncAmount();
syncRate();

form.addEventListener('input', e => { if (!e.target.matches('.range')) update(); });
form.addEventListener('change', e => { if (e.target.name !== 'unit') update(); });
$$('input[name="group"]').forEach(el => el.addEventListener('change', renderTable));
curSelect.addEventListener('change', () => { cur = curSelect.value; syncCurrencyAffixes(cur); update(); });
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.matches('#emi-amount, #emi-extra')) return;
  const v = num(el.value);
  if (Number.isFinite(v)) el.value = plain(v, 2, cur);
});
$('#emi-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#emi-share'), () => { const l = readLoan(); return { c: cur, p: l.P, r: num(rateInput.value), t: num(termInput.value), u: radio('unit'), x: l.extra || '', s: l.start }; }, live);
update();
