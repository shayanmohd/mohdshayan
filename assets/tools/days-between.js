// Days between dates page: the span between two dates, or a date moved by days, weeks, months or years.
import { $, num, radio, setRadio, plain, copyText, shareButton, readHashState } from './kit.js';
import { parseDate, toIso, todayParts, difference, shiftDate, rangeText, longDate, shortDate, weekdayName, daysInMonth, ordinal, spanText, MONTHS, UNITS } from './lib/days-between.js';

const form = $('#db-form');
const live = $('#db-live');
const start = $('#db-start'), end = $('#db-end'), from = $('#db-from'), amount = $('#db-amount');
const today = todayParts();
const n0 = n => plain(n, 0, 'USD'); // counts group in thousands (28,914 days) rather than the rupee lakh grouping, as the age tool does
const EMPTY = plain(NaN); // the kit's glyph for no value, the same one the other tools show
const span = parts => spanText(parts, n0);
const row = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;

// A date input hands back '' until a whole, real date has been typed, so the weekday hint doubles as the validity check
function dayHint(input, hint) {
  const d = parseDate(input.value);
  hint.textContent = d ? weekdayName(d) : '';
  return d;
}
// validity.badInput tells an unfinished or impossible date (31 February) from an empty field. It is only called out once
// the visitor has left the field, so nothing flashes while a date is still being typed.
const badDate = input => !input.value && input.validity.badInput && document.activeElement !== input;
const BAD_DATE = which => `The ${which} date is unfinished or not a real day, like 31 February. Check the day, month and year.`;

let summary = '';
function update() {
  const mode = radio('mode');
  $('#db-diff').hidden = mode !== 'diff';
  $('#db-shift').hidden = mode !== 'shift';
  const err = $('#db-error'), note = $('#db-note');
  err.textContent = '';
  note.hidden = true;
  const clear = msg => { $('#db-head').textContent = EMPTY; $('#db-head-sub').textContent = msg; $('#db-rows').innerHTML = ''; summary = ''; };
  for (const input of [start, end, from]) input.setAttribute('aria-invalid', String(badDate(input)));

  if (mode === 'diff') {
    const s = dayHint(start, $('#db-start-day')), e = dayHint(end, $('#db-end-day'));
    $('#db-head-label').textContent = 'Total days';
    const bad = [[start, 'start'], [end, 'end']].filter(([input]) => badDate(input)).map(([, which]) => which);
    if (bad.length === 2) { err.textContent = 'Both dates are unfinished or not real days, like 31 February. Check the day, month and year of each.'; return clear('Check both dates.'); }
    if (bad.length) { err.textContent = BAD_DATE(bad[0]); return clear(`Check the ${bad[0]} date.`); }
    if (!s || !e) return clear(!s && !e ? 'Enter a start and an end date.' : !s ? 'Enter a start date.' : 'Enter an end date.');
    const inc = $('#db-include').checked;
    const d = difference(s, e, { includeEnd: inc });
    const head = `${n0(d.days)} ${d.days === 1 ? 'day' : 'days'}`;
    const range = rangeText(s, e, d);
    $('#db-head').textContent = head;
    $('#db-head-sub').textContent = range;
    const lines = [
      ['Weeks and days', span({ weeks: d.weeks.weeks, days: d.weeks.days })],
      ['Months and days', span({ months: d.months.months, days: d.months.days })],
      ['Years, months and days', span(d.calendar)],
      ['Working days (Mon to Fri)', n0(d.workingDays)],
      ['Weekend days', n0(d.weekendDays)],
      ['Start falls on', d.startWeekday],
      ['End falls on', d.endWeekday],
    ];
    $('#db-rows').innerHTML = lines.map(([k, v]) => row(k, v)).join('');
    summary = [range, `Total: ${head}`, ...lines.map(([k, v]) => `${k}: ${v}`)].join('\n');
  } else {
    const s = dayHint(from, $('#db-from-day'));
    const unit = radio('unit');
    const back = radio('op') === 'subtract';
    $('#db-head-label').textContent = back ? 'Earlier date' : 'Later date';
    if (!s) { if (badDate(from)) err.textContent = BAD_DATE('start'); return clear(badDate(from) ? 'Check the start date.' : 'Enter a start date.'); }
    const n = num(amount.value);
    if (!Number.isInteger(n) || n < 0) { err.textContent = `Enter a whole number of ${unit}.`; return clear(`Enter how many ${unit} to ${back ? 'subtract' : 'add'}.`); }
    const r = shiftDate(s, back ? -n : n, unit);
    if (!r) { err.textContent = 'That lands outside the years 1 to 9999.'; return clear('Out of range.'); }
    const move = `${n0(n)} ${n === 1 ? unit.replace(/s$/, '') : unit}`;
    $('#db-head').textContent = shortDate(r.date);
    $('#db-head-sub').textContent = `A ${weekdayName(r.date)}, ${move} ${back ? 'before' : 'after'} ${longDate(s)}.`;
    const lines = [['Falls on', weekdayName(r.date)], ['Days moved', n0(Math.abs(r.days))], ['ISO date', toIso(r.date)]];
    $('#db-rows').innerHTML = lines.map(([k, v]) => row(k, v)).join('');
    if (r.clamped) {
      note.textContent = `${MONTHS[r.date.m - 1]} ${r.date.y} has ${daysInMonth(r.date.y, r.date.m)} days, so the result stops at the last day of the month rather than the ${ordinal(s.d)}.`;
      note.hidden = false;
    }
    summary = [`${longDate(s)} ${back ? 'minus' : 'plus'} ${move}`, `${longDate(r.date)} (${toIso(r.date)})`, r.clamped ? note.textContent : ''].filter(Boolean).join('\n');
  }
}

// Reference table: where common spans from today land
const SPANS = [['Tomorrow', 1, 'days'], ['In 1 week', 7, 'days'], ['In 2 weeks', 14, 'days'], ['In 30 days', 30, 'days'], ['In 45 days', 45, 'days'],
  ['In 60 days', 60, 'days'], ['In 90 days', 90, 'days'], ['In 180 days', 180, 'days'], ['In 6 months', 6, 'months'], ['In 1 year', 1, 'years']];
$('#db-glance tbody').innerHTML = SPANS.map(([label, n, unit]) => {
  const r = shiftDate(today, n, unit);
  return `<tr><td>${label}</td><td class="!whitespace-normal">${longDate(r.date)}</td></tr>`; // wraps on phones instead of scrolling
}).join('');
$('#db-glance-sub').textContent = `Counted from today, ${longDate(today)}. The day rows are exact; the month and year rows step through the calendar.`;

// State
const iso = toIso(today);
start.value = `${iso.slice(0, 4)}-01-01`;
end.value = iso;
from.value = iso;
const st = readHashState();
if (st) {
  if (st.m === 'shift') setRadio('mode', 'shift');
  if (parseDate(st.s)) start.value = st.s;
  if (parseDate(st.e)) end.value = st.e;
  if (parseDate(st.f)) from.value = st.f;
  if (st.i === '1') $('#db-include').checked = true;
  if (st.op === 'subtract') setRadio('op', 'subtract');
  if (UNITS.includes(st.u)) setRadio('unit', st.u);
  if (st.n && Number.isInteger(Number(st.n)) && Number(st.n) >= 0) amount.value = n0(Number(st.n));
}

form.addEventListener('input', update);
form.addEventListener('change', update);
form.addEventListener('focusout', update); // a bad date is called out only after the visitor leaves the field
$('#db-end-today').addEventListener('click', () => { end.value = iso; update(); });
$('#db-from-today').addEventListener('click', () => { from.value = iso; update(); });
$('#db-swap').addEventListener('click', () => { [start.value, end.value] = [end.value, start.value]; update(); });
amount.addEventListener('focusout', e => { const v = num(e.target.value); if (Number.isInteger(v)) e.target.value = n0(v); });
$('#db-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#db-share'), () => (radio('mode') === 'diff'
  ? { m: 'diff', s: start.value, e: end.value, i: $('#db-include').checked ? 1 : '' }
  : { m: 'shift', f: from.value, op: radio('op'), n: num(amount.value), u: radio('unit') }), live);
update();
