// GST calculator page.
import { $, $$, num, radio, setRadio, money, plain, copyText, shareButton, readHashState } from './kit.js';
import { calculateGst, GST_PRESETS } from './lib/gst.js';

const form = $('#gst-form');
const live = $('#gst-live');
const presets = $('#gst-presets');
const custom = $('#gst-custom');
const inr = n => money(n, 'INR', 2);
let rate = 18;
let presetRate = 18; // the last preset chosen, used again when the custom field is cleared

presets.innerHTML = GST_PRESETS.map(r => `<button type="button" class="chip-btn" data-rate="${r}" aria-pressed="false">${r}%</button>`).join('');
const pressPresets = r => $$('[data-rate]', presets).forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.rate) === r)));
function choosePreset(r) { presetRate = rate = r; custom.value = ''; pressPresets(r); }
function chooseCustom(r) { rate = r; custom.value = plain(r, 3); pressPresets(NaN); }
presets.addEventListener('click', e => { const b = e.target.closest('[data-rate]'); if (b) { choosePreset(Number(b.dataset.rate)); update(); } });
custom.addEventListener('input', () => {
  const v = num(custom.value);
  if (custom.value.trim() && Number.isFinite(v) && v >= 0) { rate = v; pressPresets(NaN); }
  else { rate = presetRate; pressPresets(presetRate); }
  update();
});

let summary = '';
function update() {
  const mode = radio('mode');
  const inter = radio('supply') === 'inter';
  $('#gst-amount-label').textContent = mode === 'add' ? 'Amount before GST' : 'Amount including GST';
  $('#gst-supply-help').textContent = inter ? 'Inter-state, imports and exports: IGST at the full rate.' : 'Intra-state: CGST and SGST (or UTGST) at half the rate each.';
  const amount = num($('#gst-amount').value);
  const rows = $('#gst-rows');
  if (!Number.isFinite(amount) || amount < 0) {
    $('#gst-head').textContent = '–'; $('#gst-head-sub').textContent = 'Enter an amount.'; rows.innerHTML = ''; $('#gst-formula').textContent = ''; summary = '';
    return;
  }
  const g = calculateGst(amount, rate, { mode, interState: inter });
  const half = plain(rate / 2, 3);
  $('#gst-head-label').textContent = mode === 'add' ? 'Total with GST' : 'Price before GST';
  $('#gst-head').textContent = inr(mode === 'add' ? g.gross : g.net);
  $('#gst-head-sub').textContent = mode === 'add' ? `${inr(g.tax)} of GST at ${plain(rate, 3)}% on ${inr(g.net)}.` : `${inr(amount)} includes ${inr(g.tax)} of GST at ${plain(rate, 3)}%.`;
  const r = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;
  rows.innerHTML = [
    r('Taxable value', inr(g.net)),
    inter ? r(`IGST (${plain(rate, 3)}%)`, inr(g.igst)) : r(`CGST (${half}%)`, inr(g.cgst)) + r(`SGST / UTGST (${half}%)`, inr(g.sgst)),
    r('Total GST', inr(g.tax)),
    g.roundOff ? r('Round-off', inr(g.roundOff)) : '',
    r('Invoice total', inr(g.gross), 'total'),
  ].join('');
  $('#gst-formula').innerHTML = mode === 'add'
    ? `GST = ${inr(g.net)} × ${plain(rate, 3)}% = ${inr(g.tax)}<br>Total = ${inr(g.net)} + ${inr(g.tax)} = ${inr(g.gross)}`
    : `Before GST = ${inr(amount)} ÷ ${plain(1 + rate / 100, 5)} = ${inr(g.net)}<br>GST = ${inr(g.tax)}${g.roundOff ? `, round-off ${inr(g.roundOff)}` : ''}`;
  summary = [`Taxable value: ${inr(g.net)}`, inter ? `IGST @ ${plain(rate, 3)}%: ${inr(g.igst)}` : `CGST @ ${half}%: ${inr(g.cgst)}\nSGST @ ${half}%: ${inr(g.sgst)}`,
    `Total GST: ${inr(g.tax)}`, g.roundOff ? `Round-off: ${inr(g.roundOff)}` : '', `Invoice total: ${inr(g.gross)}`].filter(Boolean).join('\n');
}

// Reference table: ₹1,000 before tax at each preset rate
$('#gst-glance tbody').innerHTML = GST_PRESETS.map(p => {
  const a = calculateGst(1000, p, { mode: 'add' });
  const b = calculateGst(1000, p, { mode: 'add', interState: true });
  return `<tr><td>${p}%</td><td>${inr(a.cgst)}</td><td>${inr(a.sgst)}</td><td>${inr(b.igst)}</td><td>${inr(a.tax)}</td><td>${inr(a.gross)}</td></tr>`;
}).join('');

// State
const s = readHashState();
if (s) {
  if (s.m) setRadio('mode', s.m);
  if (s.sp) setRadio('supply', s.sp);
  if (s.a && Number.isFinite(Number(s.a))) $('#gst-amount').value = plain(Number(s.a), 2);
  const r = Number(s.r);
  if (s.r && Number.isFinite(r)) (GST_PRESETS.includes(r) ? choosePreset(r) : chooseCustom(r));
  else choosePreset(18);
} else choosePreset(18);

form.addEventListener('input', e => { if (e.target !== custom) update(); });
form.addEventListener('change', update);
$('#gst-amount').addEventListener('focusout', e => { const v = num(e.target.value); if (Number.isFinite(v)) e.target.value = plain(v, 2); });
$('#gst-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#gst-share'), () => ({ m: radio('mode'), a: num($('#gst-amount').value), r: rate, sp: radio('supply') }), live);
update();
