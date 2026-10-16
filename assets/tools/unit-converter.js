// Unit converter page: live conversion both ways through the lib's exact factors, the working beside the result,
// a table of every unit in the category, and a share link.
import { $, $$, num, radio, setRadio, plain, copyText, shareButton, readHashState, escapeHtml } from './kit.js';
import { CATEGORIES, UNITS, PRECISIONS, DEFAULT_PRECISION, convert, convertAll, toBase, toSignificant, decimalsFor, usesExponent } from './lib/unit-converter.js';

const form = $('#uc-form');
const live = $('#uc-live');
const fromSel = $('#uc-from'), toSel = $('#uc-to');
const fromBox = $('#uc-from-value'), toBox = $('#uc-to-value');
let sf = DEFAULT_PRECISION;
let source = 'from'; // the box the visitor typed in last; the other box is filled from it
let summary = '';

// plain() takes its locale from a currency code, and any code but INR means the visitor's own locale. Units have no currency.
const group = (n, digits) => plain(n, digits, 'USD');
const none = '…'; // a figure that does not exist yet; not the kit's en dash, which the site's copy rules keep out of every page
/** A figure rounded to the chosen significant figures and grouped, or as a power of ten when the lib says it is too large or too small to write out. */
function fmt(n, figures = sf) {
  if (!Number.isFinite(n)) return none;
  const r = toSignificant(n, figures);
  if (usesExponent(r, figures)) {
    const [m, e] = r.toExponential(figures - 1).split('e');
    return `${group(Number(m), figures - 1)} × 10^${Number(e)}`;
  }
  return group(r, decimalsFor(r, figures));
}
/**
 * The same figure for a value box: grouped when that parses back to the same number, else as bare digits. A figure the readout
 * shows as a power of ten goes in as 3.048e+31, which the box reads back, rather than as a row of thirty digits cut off at its edge.
 */
function boxText(n) {
  const r = toSignificant(n, sf);
  if (usesExponent(r, sf)) return String(r);
  const pretty = group(r, decimalsFor(r, sf));
  return num(pretty) === r ? pretty : String(r);
}
/** Groups the digits of a typed number without changing its value; leaves it alone when grouping would, or when it is shown as a power of ten. */
function tidy(box) {
  const v = num(box.value);
  if (!Number.isFinite(v) || usesExponent(v, sf)) return;
  const pretty = group(v, 15);
  if (num(pretty) === v) box.value = pretty;
}
const factorText = u => u.fraction || group(u.factor, 15);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const category = () => CATEGORIES.find(c => c.id === radio('category'));

$('#uc-categories').innerHTML = CATEGORIES.map(c => `<label><input type="radio" name="category" value="${c.id}"><span>${escapeHtml(c.name)}</span></label>`).join('');
$('#uc-precision').innerHTML = PRECISIONS.map(p => `<label><input type="radio" name="sf" value="${p}"><span>${p}</span></label>`).join('');

function fillUnits(cat, from, to) {
  const options = cat.units.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`).join('');
  fromSel.innerHTML = options; toSel.innerHTML = options;
  fromSel.value = from; toSel.value = to;
  // The decimal keypad on iOS has no minus sign, and temperatures go below zero
  fromBox.inputMode = toBox.inputMode = cat.id === 'temperature' ? 'text' : 'decimal';
}

// The route through the base unit, as text: "5 ft × 0.3048 = 1.524 m", then "1.524 m ÷ 0.01 = 152.4 cm"
function working(v, a, b, base, result, baseUnit) {
  if (a === b) return `${fmt(v)} ${a.symbol} = ${fmt(result)} ${b.symbol}`;
  const lines = [];
  if (a !== baseUnit) {
    let x = a.offset ? `${fmt(v)} + ${group(a.offset, 2)}` : `${fmt(v)} ${a.symbol}`;
    if (a.factor !== 1) x = `${a.offset ? `(${x})` : x} × ${factorText(a)}`;
    lines.push(`${x} = ${fmt(base)} ${baseUnit.symbol}`);
  }
  if (b !== baseUnit) {
    let y = `${fmt(base)} ${baseUnit.symbol}`;
    if (b.factor !== 1) y += ` ÷ ${factorText(b)}`;
    if (b.offset) y += ` − ${group(b.offset, 2)}`;
    lines.push(`${y} = ${fmt(result)} ${b.symbol}`);
  }
  return lines.map(escapeHtml).join('<br>');
}

function renderExample(el) {
  const [v, from, to] = el.dataset.eg.split('|');
  const figures = el.hasAttribute('data-live') ? sf : 12; // the definitions are shown in full; the rounding example follows the setting
  el.textContent = `${fmt(Number(v), figures)} ${UNITS[from].symbol} = ${fmt(convert(v, from, to), figures)} ${UNITS[to].symbol}`;
}

function update() {
  const cat = category();
  const a = UNITS[fromSel.value], b = UNITS[toSel.value];
  const [src, dst, srcBox, dstBox] = source === 'from' ? [a, b, fromBox, toBox] : [b, a, toBox, fromBox];
  const v = num(srcBox.value);
  const rows = $('#uc-rows');
  const noun = `${cat.name.toLowerCase()} unit`;
  $('#uc-head-label').textContent = `${cap(src.plural)} to ${dst.plural}`;
  $('#uc-table-title').textContent = Number.isFinite(v) ? `${fmt(v)} ${src.symbol} in every ${noun}` : `Every ${noun}`;
  $('#uc-table tbody').innerHTML = convertAll(v, src).map(r =>
    `<tr><td>${escapeHtml(r.unit.name)}</td><td>${fmt(r.value)}${Number.isFinite(r.value) ? ` ${escapeHtml(r.unit.symbol)}` : ''}</td></tr>`).join('');
  if (!Number.isFinite(v)) {
    dstBox.value = '';
    $('#uc-head').textContent = none; $('#uc-head-sub').textContent = 'Enter a value in either box.';
    rows.innerHTML = ''; rows.hidden = true; $('#uc-formula').textContent = ''; summary = '';
    return;
  }
  const result = convert(v, src, dst);
  dstBox.value = boxText(result);
  $('#uc-head').textContent = `${fmt(result)} ${dst.symbol}`;
  $('#uc-head-sub').textContent = `${fmt(v)} ${src.symbol} = ${fmt(result)} ${dst.symbol}`;
  // One of each unit in the other, for scale. Not for temperatures: their scales start at different points, so "1 °C in °F" means nothing.
  const r = (dt, dd) => `<div><dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd></div>`;
  rows.hidden = cat.id === 'temperature';
  rows.innerHTML = rows.hidden ? '' : r(`1 ${src.symbol}`, `${fmt(convert(1, src, dst))} ${dst.symbol}`) + r(`1 ${dst.symbol}`, `${fmt(convert(1, dst, src))} ${src.symbol}`);
  $('#uc-formula').innerHTML = working(v, src, dst, toBase(v, src), result, UNITS[cat.base]);
  summary = `${fmt(v)} ${src.symbol} = ${fmt(result)} ${dst.symbol}`;
  $$('[data-eg][data-live]').forEach(renderExample);
}

// State: a shared link names the category, both units, the value, the precision, and which box the value was typed in
const s = readHashState() || {};
const start = CATEGORIES.find(c => c.id === s.c) || CATEGORIES[0];
setRadio('category', start.id);
const inStart = id => UNITS[id] && UNITS[id].category === start.id;
fillUnits(start, inStart(s.f) ? s.f : start.defaults[0], inStart(s.t) ? s.t : start.defaults[1]);
if (PRECISIONS.includes(Number(s.p))) sf = Number(s.p);
setRadio('sf', sf);
if (s.v !== undefined && s.v !== '' && Number.isFinite(Number(s.v))) {
  source = s.s === 'to' ? 'to' : 'from';
  const box = source === 'from' ? fromBox : toBox;
  box.value = String(Number(s.v));
  tidy(box);
}

fromBox.addEventListener('input', () => { source = 'from'; update(); });
toBox.addEventListener('input', () => { source = 'to'; update(); });
form.addEventListener('change', e => {
  if (e.target.name === 'category') { const cat = category(); fillUnits(cat, ...cat.defaults); }
  if (e.target.name === 'sf') sf = Number(e.target.value);
  update();
});
form.addEventListener('focusout', e => { if (e.target === fromBox || e.target === toBox) tidy(e.target); });
$('#uc-swap').addEventListener('click', () => {
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  [fromBox.value, toBox.value] = [toBox.value, fromBox.value];
  source = source === 'from' ? 'to' : 'from'; // the typed value moved boxes along with its unit, so it stays the source
  update();
  live.textContent = `Swapped: now ${UNITS[fromSel.value].plural} to ${UNITS[toSel.value].plural}.`;
});
$('#uc-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#uc-share'), () => ({
  c: category().id, f: fromSel.value, t: toSel.value, v: num(source === 'from' ? fromBox.value : toBox.value), p: sf, s: source === 'to' ? 'to' : '',
}), live);
$$('[data-eg]').forEach(renderExample);
update();
