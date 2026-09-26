// Commission calculator page.
import { $, $$, num, radio, setRadio, money, pct, plain, fillCurrencySelect, syncCurrencyAffixes, copyText, shareButton, readHashState, icon } from './kit.js';
import { earnings, salesForTarget, normalizeTiers, encodeTiers, decodeTiers } from './lib/commission.js';

const form = $('#cm-form');
const tierList = $('#cm-tiers');
const live = $('#cm-live');
const curSelect = $('#cm-cur');
let cur = fillCurrencySelect(curSelect);

const DEFAULT_TIERS = [{ upTo: 500000, rate: 5 }, { upTo: 1000000, rate: 8 }, { upTo: Infinity, rate: 10 }];
const fmtInput = n => (Number.isFinite(n) ? plain(n, 2, cur) : '');

// ---------- tiers editor ----------
function tierRow(t, i, count) {
  const last = i === count - 1;
  return `<li class="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_36px] sm:grid-cols-[7.5rem_minmax(0,1.3fr)_minmax(0,1fr)_36px] gap-x-3 items-center py-2.5 border-b border-hairline-soft" data-tier>
      <span class="hint hidden sm:block truncate" data-from></span>
      ${last
        ? `<span class="text-sm text-ink h-[44px] flex items-center" data-open>and above</span>`
        : `<span class="affix"><span class="affix-text pre" data-cur-symbol></span><input class="input" inputmode="decimal" data-upto aria-label="Tier ${i + 1}: sales up to" value="${fmtInput(t.upTo)}"></span>`}
      <span class="affix"><input class="input has-post" inputmode="decimal" data-rate aria-label="Tier ${i + 1}: rate in percent" value="${plain(t.rate, 3, cur)}"><span class="affix-text post">%</span></span>
      <button type="button" class="icon-btn" data-remove aria-label="Remove tier ${i + 1}"${count <= 1 ? ' disabled' : ''}>${icon('trash')}</button>
    </li>`;
}
function renderTiers(tiers) {
  tierList.innerHTML = tiers.map((t, i) => tierRow(t, i, tiers.length)).join('');
  syncCurrencyAffixes(cur, tierList);
  updateTierFloors();
}
function readTiers() {
  return $$('[data-tier]', tierList).map(li => {
    const up = li.querySelector('[data-upto]');
    return { upTo: up ? num(up.value) : Infinity, rate: num(li.querySelector('[data-rate]').value) };
  });
}
function updateTierFloors() {
  let prev = 0;
  $$('[data-tier]', tierList).forEach(li => {
    li.querySelector('[data-from]').textContent = `from ${money(prev, cur, 0)}`;
    const up = li.querySelector('[data-upto]');
    if (up && Number.isFinite(num(up.value))) prev = num(up.value);
  });
}
tierList.addEventListener('click', e => {
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  const tiers = readTiers();
  const idx = $$('[data-tier]', tierList).indexOf(btn.closest('[data-tier]'));
  tiers.splice(idx, 1);
  if (tiers.length) tiers[tiers.length - 1].upTo = Infinity;
  renderTiers(tiers);
  update();
  live.textContent = `Tier ${idx + 1} removed.`;
});
$('#cm-add-tier').addEventListener('click', () => {
  const tiers = readTiers();
  const finite = tiers.filter(t => Number.isFinite(t.upTo));
  const lastCap = finite.length ? finite[finite.length - 1].upTo : 0;
  const lastRate = tiers.length ? tiers[tiers.length - 1].rate : 5;
  // The open-ended tier gets a ceiling, and a new open-ended tier goes on top at a slightly higher rate
  const open = tiers.pop() || { rate: lastRate };
  tiers.push({ upTo: lastCap ? lastCap * 2 : 500000, rate: open.rate }, { upTo: Infinity, rate: +(open.rate + 2).toFixed(2) });
  renderTiers(tiers);
  update();
  const inputs = $$('[data-upto]', tierList);
  if (inputs.length) inputs[inputs.length - 1].focus();
});

// ---------- read, calculate, render ----------
function plan() {
  if (radio('plan') === 'flat') return { type: 'flat', rate: num($('#cm-rate').value) || 0 };
  return { type: 'tiered', method: radio('method'), tiers: normalizeTiers(readTiers()) };
}
const opts = () => ({ base: num($('#cm-base').value) || 0, share: Number.isFinite(num($('#cm-share').value)) ? num($('#cm-share').value) : 100, quota: num($('#cm-quota').value) || 0 });
const row = (dt, dd, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${dt}</dt><dd>${dd}</dd></div>`;

let summary = '';
function update() {
  const mode = radio('mode');
  const p = plan();
  const o = opts();
  $$('[data-mode]', form).forEach(el => { el.hidden = el.dataset.mode !== mode; });
  $$('[data-plan]', form).forEach(el => { el.hidden = el.dataset.plan !== p.type; });
  $('#cm-method-help').textContent = radio('method') === 'retroactive'
    ? 'The whole amount earns the rate of the highest tier reached, so crossing a threshold lifts every sale.'
    : "Each slice of sales earns its own tier's rate, like tax brackets.";
  updateTierFloors();

  const err = $('#cm-error');
  err.textContent = '';
  if (o.share < 0 || o.share > 100) err.textContent = 'Your share should be between 0% and 100%.';

  let e;
  const label = $('#cm-headline-label'), head = $('#cm-headline'), sub = $('#cm-headline-sub');
  const rows = [];
  const planName = p.type === 'flat' ? `${plain(p.rate, 3)}% flat` : `${p.method === 'retroactive' ? 'retroactive' : 'graduated'} tiers`;

  if (mode === 'target') {
    const target = num($('#cm-target').value);
    if (!Number.isFinite(target)) { head.textContent = '–'; sub.textContent = 'Enter the earnings you want.'; $('#cm-rows').innerHTML = ''; $('#cm-bands-panel').hidden = true; summary = ''; return; }
    const r = salesForTarget(target, p, o);
    label.textContent = 'Sales needed';
    if (!r.reachable) {
      head.textContent = 'Not reachable';
      sub.textContent = o.share <= 0 ? 'With a 0% share, no amount of sales pays commission.' : 'The plan never pays that much. Check that the rates are above zero.';
      $('#cm-rows').innerHTML = '';
      $('#cm-bands-panel').hidden = true;
      summary = '';
      return;
    }
    e = earnings(r.sales, p, o);
    head.textContent = money(r.sales, cur);
    sub.textContent = r.sales === 0 ? 'Your base pay already covers this target.'
      : r.atThreshold ? `Just over the ${money(r.sales - 0.01, cur)} threshold, where the retroactive rate steps up to ${plain(e.rate, 3)}% on everything.`
      : `to earn ${money(target, cur)} on ${planName}.`;
    rows.push(row('Commission needed', money(r.commissionNeeded, cur)));
    if (o.share !== 100) rows.push(row(`Your share (${plain(o.share, 2)}%)`, money(e.yours, cur)));
    if (o.base) rows.push(row('Base pay', money(o.base, cur)));
    rows.push(row('Total earnings', money(e.total, cur), 'total'));
    if (r.sales > 0) rows.push(row('Effective rate', pct(e.effectiveRate)));
    if (e.attainment !== null) rows.push(row('Quota attainment', pct(e.attainment, 1)));
    summary = `Commission target (${planName}): sales of ${money(r.sales, cur)} earn ${money(e.total, cur)} (target ${money(target, cur)}).`;
  } else {
    const sales = num($('#cm-sales').value);
    if (!Number.isFinite(sales)) { head.textContent = '–'; sub.textContent = 'Enter a sales amount.'; $('#cm-rows').innerHTML = ''; $('#cm-bands-panel').hidden = true; summary = ''; return; }
    e = earnings(sales, p, o);
    const showTotal = o.base > 0;
    label.textContent = showTotal ? 'Total earnings' : 'Your commission';
    head.textContent = money(showTotal ? e.total : e.yours, cur);
    sub.textContent = sales > 0 ? `${pct(e.effectiveRate)} effective rate on ${money(sales, cur)} of sales.` : 'No sales, no commission.';
    rows.push(row(o.share !== 100 ? 'Commission on the deal' : 'Commission', money(e.gross, cur)));
    if (o.share !== 100) rows.push(row(`Your share (${plain(o.share, 2)}%)`, money(e.yours, cur)));
    if (showTotal) { rows.push(row('Base pay', money(o.base, cur))); rows.push(row('Total earnings', money(e.total, cur), 'total')); }
    if (p.type === 'tiered' && p.method === 'retroactive' && sales > 0) rows.push(row('Tier reached', `${e.reached + 1} of ${p.tiers.length} · ${plain(e.rate, 3)}%`));
    if (e.attainment !== null) rows.push(row('Quota attainment', pct(e.attainment, 1)));
    summary = `Commission (${planName}): ${money(sales, cur)} of sales pays ${money(e.yours, cur)}${o.base ? `, ${money(e.total, cur)} with base pay` : ''} (effective rate ${pct(e.effectiveRate)}).`;
  }
  $('#cm-rows').innerHTML = rows.join('');

  // Breakdown by band
  const bands = e.bands || [];
  $('#cm-bands-panel').hidden = !bands.length;
  const bandName = b => (p.type === 'flat' ? 'All sales'
    : p.method === 'retroactive' ? `Tier ${e.reached + 1}<span class="block hint">whole amount</span>`
    : `Tier ${b.tier + 1}<span class="block hint">from ${money(b.from, cur, 0)}</span>`);
  const short = n => money(n, cur, Math.abs(n) >= 1000 ? 0 : 2); // whole units keep the narrow sidebar table readable
  $('#cm-bands').innerHTML = bands.map(b => `<tr><td>${bandName(b)}</td><td>${short(b.amount)}</td><td>${plain(b.rate, 3)}%</td><td>${short(b.commission)}</td></tr>`).join('')
    + (bands.length > 1 ? `<tr class="sum"><td>Total</td><td>${short(e.sales)}</td><td>${pct(e.rate)}</td><td>${short(e.gross)}</td></tr>` : '');
  $('#cm-bands-note').textContent = p.type === 'tiered' && p.method === 'retroactive' ? 'Retroactive plans pay the reached rate on every sale in the period.' : o.share !== 100 ? 'Before your share is applied.' : '';
}

// ---------- state: defaults, share links, currency ----------
function getState() {
  return { m: radio('mode'), c: cur, s: num($('#cm-sales').value), t: num($('#cm-target').value), p: radio('plan'), r: num($('#cm-rate').value),
    k: radio('method'), tiers: encodeTiers(normalizeTiers(readTiers())), b: num($('#cm-base').value), sh: num($('#cm-share').value), q: num($('#cm-quota').value) };
}
function applyState(s) {
  if (s.c) { curSelect.value = s.c; cur = curSelect.value; }
  if (s.m) setRadio('mode', s.m);
  if (s.p) setRadio('plan', s.p);
  if (s.k) setRadio('method', s.k);
  const set = (id, v) => { if (v !== undefined && v !== 'NaN') $(id).value = fmtInput(Number(v)); };
  set('#cm-sales', s.s); set('#cm-target', s.t); set('#cm-rate', s.r); set('#cm-base', s.b); set('#cm-share', s.sh); set('#cm-quota', s.q);
  renderTiers(s.tiers ? normalizeTiers(decodeTiers(s.tiers)) : DEFAULT_TIERS);
}

const state = readHashState();
if (state) applyState(state);
else { $('#cm-sales').value = fmtInput(750000); $('#cm-target').value = fmtInput(60000); renderTiers(DEFAULT_TIERS); }
syncCurrencyAffixes(cur);

form.addEventListener('input', update);
form.addEventListener('change', update);
curSelect.addEventListener('change', () => { cur = curSelect.value; syncCurrencyAffixes(cur); update(); });
// Reformat typed numbers with grouping separators once the visitor leaves the field
form.addEventListener('focusout', e => {
  const el = e.target;
  if (!el.matches('input[inputmode="decimal"]')) return;
  const v = num(el.value);
  if (Number.isFinite(v)) el.value = fmtInput(v);
});
$('#cm-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#cm-share-link'), getState, live);
update();
