// Age calculator page: exact age on any date, the totals in months, weeks, days and hours, the birth weekday and the next birthday.
import { $, radio, plain, copyText, shareButton, readHashState } from './kit.js';
import { parseIso, toIso, parseTypedDate, todayLocal, daysBetween, ageBetween, nextBirthday, birthdaysAhead, formatLong, formatWithWeekday, weekdayName } from './lib/age.js';

const form = $('#age-form');
const live = $('#age-live');
const dobPick = $('#age-dob'), dobText = $('#age-dob-text'), typedBlock = $('#age-typed'), onInput = $('#age-on');
const count = n => plain(n, 0, 'USD'); // counts in the visitor's own digit grouping (13,361 days, or 3,20,664 hours on an Indian English browser), not the kit's rupee grouping for everyone
const unit = (n, word) => `${count(n)} ${word}${n === 1 ? '' : 's'}`;
const row = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
const ymd = a => `${unit(a.years, 'year')}, ${unit(a.months, 'month')} and ${unit(a.days, 'day')}`;

// ---------- date of birth: calendar picker or typed text ----------
const typed = () => radio('entry') === 'type';
function readBirth() {
  const raw = typed() ? dobText.value : dobPick.value;
  return { date: typed() ? parseTypedDate(raw) : parseIso(raw), empty: !raw.trim() };
}
// Carry the date across when the entry mode changes, so switching never loses it
function switchEntry() {
  const t = typed();
  if (t) { const d = parseIso(dobPick.value); if (d) dobText.value = formatLong(d); }
  else { const d = parseTypedDate(dobText.value); if (d) dobPick.value = toIso(d); }
  dobPick.hidden = t;
  typedBlock.hidden = !t;
  $('#age-dob-label').htmlFor = t ? 'age-dob-text' : 'age-dob'; // the label follows the visible box, so clicking it focuses the right one
}

// ---------- calculate and render ----------
let summary = '';
function clear(msg) {
  $('#age-head-label').textContent = 'Age';
  $('#age-head').textContent = ''; // no placeholder glyph: the kit's is an en dash
  $('#age-head-sub').textContent = msg;
  $('#age-rows').innerHTML = '';
  $('#age-next').textContent = '';
  $('#age-next-sub').textContent = '';
  $('#age-ahead tbody').innerHTML = `<tr><td colspan="3" class="!whitespace-normal">${msg}</td></tr>`;
  summary = '';
}
function update() {
  const { date: birth, empty } = readBirth();
  const on = parseIso(onInput.value);
  // A typed date that cannot be read is only called out once the visitor has left the field
  const unread = typed() && !empty && !birth && document.activeElement !== dobText;
  dobText.setAttribute('aria-invalid', String(unread));
  $('#age-dob-error').textContent = unread ? 'That date was not understood. Try 14 March 1990 or 14/03/1990, with a four-digit year.' : '';
  const late = Boolean(birth && on && daysBetween(birth, on) < 0);
  $('#age-error').textContent = late ? 'The date of birth is after the date to count to. Pick a later date to count to, or an earlier date of birth.' : '';
  if (!birth) return clear(empty ? 'Enter a date of birth.' : unread ? 'That date was not understood.' : 'Type a full date, such as 14 March 1990.');
  if (!on) return clear('Enter the date to count to.');
  if (late) return clear('The date of birth is after the date to count to.');

  const a = ageBetween(birth, on);
  const n = nextBirthday(birth, on);
  const today = toIso(on) === toIso(todayLocal());
  $('#age-head-label').textContent = today ? 'Age today' : `Age on ${formatLong(on)}`;
  $('#age-head').textContent = a.years ? unit(a.years, 'year') : a.months ? unit(a.months, 'month') : unit(a.days, 'day');
  $('#age-head-sub').textContent = `${ymd(a)}, from ${formatLong(birth)} to ${formatLong(on)}.`;
  $('#age-rows').innerHTML = [
    row('Born on a', weekdayName(birth)),
    row('In months', `${unit(a.totalMonths, 'month')}, ${unit(a.days, 'day')}`),
    row('In weeks', `${unit(a.totalWeeks, 'week')}, ${unit(a.weekDays, 'day')}`),
    row('In days', unit(a.totalDays, 'day')),
    row('In hours', unit(a.totalHours, 'hour')),
  ].join('');

  const when = formatWithWeekday(n.date);
  const leapNote = birth.m === 2 && birth.d === 29 && n.date.d === 28 ? ' A 29 February birthday falls on 28 February in a common year.' : '';
  if (n.daysToGo === 0) {
    $('#age-next').textContent = today ? 'Today' : 'That day';
    $('#age-next-sub').textContent = n.turning ? `${when}: turning ${n.turning}.${leapNote}` : `${when} is the date of birth.`;
  } else {
    $('#age-next').textContent = `${unit(n.daysToGo, 'day')} to go`;
    $('#age-next-sub').textContent = `${when}, turning ${n.turning}.${leapNote}`;
  }
  // Weekday and date share a cell that may wrap, so the table fits a 360px phone without scrolling sideways
  $('#age-ahead tbody').innerHTML = birthdaysAhead(birth, on, 10).map(b => `<tr><td class="!whitespace-normal">${formatWithWeekday(b.date)}</td><td>${b.turning}</td><td>${count(b.daysToGo)}</td></tr>`).join('');
  summary = [
    `Born: ${formatWithWeekday(birth)}`,
    `Age on ${formatWithWeekday(on)}: ${ymd(a)}`,
    `In months: ${unit(a.totalMonths, 'month')}, ${unit(a.days, 'day')}`,
    `In weeks: ${unit(a.totalWeeks, 'week')}, ${unit(a.weekDays, 'day')}`,
    `In days: ${unit(a.totalDays, 'day')}`,
    `In hours: ${unit(a.totalHours, 'hour')}`,
    `Next birthday: ${when}${n.daysToGo ? `, ${unit(n.daysToGo, 'day')} to go` : ' (that day)'}, turning ${n.turning}`,
  ].join('\n');
}

// ---------- state ----------
const s = readHashState();
const shared = s && parseIso(s.b);
if (shared) dobPick.value = toIso(shared);
onInput.value = toIso((s && parseIso(s.o)) || todayLocal());

form.addEventListener('input', update);
form.addEventListener('change', e => { if (e.target.name === 'entry') switchEntry(); update(); });
dobText.addEventListener('focusout', () => { const d = parseTypedDate(dobText.value); if (d) dobText.value = formatLong(d); update(); });
$('#age-today').addEventListener('click', () => { onInput.value = toIso(todayLocal()); update(); live.textContent = 'Counting to today.'; });
$('#age-copy').addEventListener('click', e => { if (summary) copyText(summary, e.currentTarget, live); });
shareButton($('#age-share'), () => { const b = readBirth().date; return { b: b ? toIso(b) : '', o: onInput.value }; }, live);
update();
