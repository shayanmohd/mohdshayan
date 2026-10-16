// Reference figures were worked out separately with Python's datetime (standard library) before the JS was written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDate, isValidDate, toIso, todayParts, isLeapYear, daysInMonth, dayIndex, fromDayIndex, weekday, weekdayName,
  longDate, shortDate, ordinal, addDays, addMonths, shiftDate, weekendDays, difference, spanText, rangeText,
} from '../assets/tools/lib/days-between.js';
import { plain } from '../assets/tools/kit.js';

const D = (y, m, d) => ({ y, m, d });
const diff = (a, b, includeEnd = false) => difference(parseDate(a), parseDate(b), { includeEnd });

test('parseDate: real days only, in the years 1 to 9999', () => {
  assert.deepEqual(parseDate('2025-10-12'), D(2025, 10, 12));
  assert.deepEqual(parseDate('2024-02-29'), D(2024, 2, 29));
  assert.deepEqual(parseDate('0001-01-01'), D(1, 1, 1));
  for (const bad of ['2025-02-29', '2025-02-30', '2025-13-01', '2025-00-10', '2025-04-31', '0000-01-01', '2025-1-5', '12/10/2025', '', null, undefined]) {
    assert.equal(parseDate(bad), null, `${bad} should not parse`);
  }
  // Without a max attribute Chromium's picker hands back five- and six-digit years; they must not parse as dates
  for (const long of ['12026-03-02', '275760-03-02', '152026-01-01']) assert.equal(parseDate(long), null, `${long} should not parse`);
  assert.equal(isValidDate(D(2025, 2, 28.5)), false);
  assert.equal(isValidDate(D(10000, 1, 1)), false);
  assert.equal(toIso(D(1, 1, 1)), '0001-01-01');
  assert.equal(toIso(D(2025, 10, 12)), '2025-10-12');
});

test('leap years and month lengths', () => {
  assert.deepEqual([1900, 2000, 2024, 2025, 2100].map(isLeapYear), [false, true, true, false, false]);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2025, 2), 28);
  assert.deepEqual([1, 4, 6, 9, 11, 12].map(m => daysInMonth(2025, m)), [31, 30, 30, 30, 30, 31]);
});

test('day index: exact round trip across centuries, before 1970 and in the years 1 to 99', () => {
  assert.equal(dayIndex(D(1970, 1, 1)), 0);
  assert.equal(dayIndex(D(1969, 12, 31)), -1);
  for (const date of [D(1, 1, 1), D(44, 3, 15), D(99, 12, 31), D(100, 1, 1), D(1582, 10, 15), D(1900, 2, 28), D(1947, 8, 15), D(2000, 2, 29), D(2026, 10, 12), D(9999, 12, 31)]) {
    assert.deepEqual(fromDayIndex(dayIndex(date)), date, toIso(date));
  }
  assert.equal(dayIndex(D(9999, 12, 31)) - dayIndex(D(1, 1, 1)), 3652058);
});

test('weekdays: known anchors', () => {
  assert.equal(weekdayName(D(1970, 1, 1)), 'Thursday');
  assert.equal(weekdayName(D(2000, 1, 1)), 'Saturday');
  assert.equal(weekdayName(D(2026, 10, 12)), 'Monday');
  assert.equal(weekdayName(D(1947, 8, 15)), 'Friday');
  assert.equal(weekdayName(D(1, 1, 1)), 'Monday');
  assert.equal(weekday(D(2025, 10, 5)), 0);
  assert.equal(longDate(D(2025, 1, 1)), 'Wednesday, 1 January 2025');
  assert.equal(shortDate(D(2026, 2, 28)), '28 February 2026');
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st']);
});

test('FAQ: the end day is left out unless asked for', () => {
  assert.equal(diff('2025-01-01', '2025-01-02').days, 1);
  assert.equal(diff('2025-01-01', '2025-01-31').days, 30);
  const inc = diff('2025-01-01', '2025-01-31', true);
  assert.equal(inc.days, 31);
  assert.deepEqual(inc.weeks, { weeks: 4, days: 3 });
  assert.deepEqual(inc.months, { months: 1, days: 0 });
  assert.equal(inc.workingDays, 23);
  assert.equal(inc.weekendDays, 8);
  const year = diff('2025-01-01', '2025-12-31', true);
  assert.equal(year.days, 365);
  assert.deepEqual(year.calendar, { years: 1, months: 0, days: 0 });
});

test('FAQ: months are calendar months from the start date', () => {
  const a = diff('2025-03-15', '2025-04-10');
  assert.equal(a.days, 26);
  assert.deepEqual(a.months, { months: 0, days: 26 });
  const b = diff('2025-01-31', '2025-02-28');
  assert.equal(b.days, 28);
  assert.deepEqual(b.months, { months: 1, days: 0 });
  const c = diff('2025-01-31', '2025-03-01');
  assert.equal(c.days, 29);
  assert.deepEqual(c.months, { months: 1, days: 1 });
  assert.deepEqual(c.weeks, { weeks: 4, days: 1 });
});

test('FAQ: working days are Monday to Friday', () => {
  const a = diff('2025-10-06', '2025-10-10');
  assert.equal(a.startWeekday, 'Monday');
  assert.equal(a.endWeekday, 'Friday');
  assert.equal(a.workingDays, 4);
  assert.equal(a.weekendDays, 0);
  const b = diff('2025-10-06', '2025-10-10', true);
  assert.equal(b.workingDays, 5);
  assert.equal(b.workingDays + b.weekendDays, b.days);
});

test('FAQ and spec: adding months clamps to the last day of the month', () => {
  assert.deepEqual(addMonths(D(2026, 1, 31), 1), { date: D(2026, 2, 28), clamped: true });
  assert.deepEqual(addMonths(D(2024, 1, 31), 1), { date: D(2024, 2, 29), clamped: true });
  assert.deepEqual(addMonths(D(2025, 3, 31), 1), { date: D(2025, 4, 30), clamped: true });
  assert.deepEqual(addMonths(D(2025, 1, 15), 1), { date: D(2025, 2, 15), clamped: false });
  assert.deepEqual(shiftDate(D(2024, 2, 29), 1, 'years'), { date: D(2025, 2, 28), clamped: true, days: 365 });
  assert.deepEqual(shiftDate(D(2026, 1, 31), 1, 'months'), { date: D(2026, 2, 28), clamped: true, days: 28 });
  assert.deepEqual(shiftDate(D(2024, 12, 31), 2, 'months'), { date: D(2025, 2, 28), clamped: true, days: 59 });
  assert.deepEqual(shiftDate(D(2025, 10, 12), -3, 'months'), { date: D(2025, 7, 12), clamped: false, days: -92 });
  assert.deepEqual(addMonths(D(2025, 1, 10), -13).date, D(2023, 12, 10)); // crossing a year backwards
});

test('shiftDate: days and weeks are exact, both ways', () => {
  assert.deepEqual(shiftDate(D(2025, 10, 12), -90, 'days'), { date: D(2025, 7, 14), clamped: false, days: -90 });
  assert.deepEqual(shiftDate(D(2026, 10, 12), 30, 'days').date, D(2026, 11, 11));
  assert.deepEqual(shiftDate(D(2026, 10, 12), 2, 'weeks'), { date: D(2026, 10, 26), clamped: false, days: 14 });
  assert.deepEqual(shiftDate(D(2026, 10, 12), 0, 'years'), { date: D(2026, 10, 12), clamped: false, days: 0 });
  assert.deepEqual(addDays(D(2025, 3, 1), -1), D(2025, 2, 28));
  assert.deepEqual(addDays(D(2024, 3, 1), -1), D(2024, 2, 29));
});

test('shiftDate: rejects fractions, non-numbers, unknown units and results outside the years 1 to 9999', () => {
  assert.equal(shiftDate(D(2026, 1, 1), 1.5, 'days'), null);
  assert.equal(shiftDate(D(2026, 1, 1), NaN, 'days'), null);
  assert.equal(shiftDate(D(2026, 1, 1), 1, 'fortnights'), null);
  assert.equal(shiftDate(D(9999, 12, 31), 1, 'days'), null);
  assert.equal(shiftDate(D(1, 1, 1), -1, 'days'), null);
  assert.equal(shiftDate(D(2026, 1, 1), 8000, 'years'), null);
  assert.equal(shiftDate(D(2026, 1, 1), 1e15, 'days'), null);
  assert.equal(shiftDate(null, 1, 'days'), null);
  assert.deepEqual(shiftDate(D(1, 1, 1), 1, 'days').date, D(1, 1, 2));
  assert.equal(difference(null, D(2026, 1, 1)), null);
  assert.equal(difference(D(2026, 1, 1), parseDate('2026-02-30')), null);
});

test('difference: the page default, 1 January 2025 to 12 October 2025', () => {
  const d = diff('2025-01-01', '2025-10-12');
  assert.equal(d.days, 284);
  assert.equal(d.reversed, false);
  assert.deepEqual(d.weeks, { weeks: 40, days: 4 });
  assert.deepEqual(d.months, { months: 9, days: 11 });
  assert.deepEqual(d.calendar, { years: 0, months: 9, days: 11 });
  assert.equal(d.workingDays, 203);
  assert.equal(d.weekendDays, 81);
  assert.equal(d.startWeekday, 'Wednesday');
  assert.equal(d.endWeekday, 'Sunday');
});

test('difference: a long span with the end day included', () => {
  const d = diff('1947-08-15', '2026-10-12', true);
  assert.equal(d.days, 28914);
  assert.deepEqual(d.weeks, { weeks: 4130, days: 4 });
  assert.deepEqual(d.months, { months: 949, days: 28 });
  assert.deepEqual(d.calendar, { years: 79, months: 1, days: 28 });
  assert.equal(d.workingDays, 20652);
  assert.equal(d.weekendDays, 8262);
  assert.equal(d.startWeekday, 'Friday');
  assert.equal(d.endWeekday, 'Monday');
});

test('difference: leap day to the clamped anniversary is exactly one year', () => {
  const d = diff('2024-02-29', '2025-02-28');
  assert.equal(d.days, 365);
  assert.deepEqual(d.calendar, { years: 1, months: 0, days: 0 });
  assert.deepEqual(d.months, { months: 12, days: 0 });
  assert.equal(d.workingDays, 261);
  assert.equal(d.weekendDays, 104);
  assert.equal(diff('2000-02-28', '2000-03-01').days, 2); // 2000 is a leap year
  assert.equal(diff('1900-02-28', '1900-03-01').days, 1); // 1900 is not
});

test('difference: same day, reversed dates and the far boundaries', () => {
  const same = diff('2026-10-12', '2026-10-12');
  assert.equal(same.days, 0);
  assert.deepEqual(same.calendar, { years: 0, months: 0, days: 0 });
  assert.equal(same.workingDays, 0);
  assert.equal(diff('2026-10-12', '2026-10-12', true).days, 1);
  const back = diff('2025-10-12', '2025-01-01');
  assert.equal(back.reversed, true);
  assert.equal(back.days, 284);
  assert.equal(back.workingDays, 203);
  assert.equal(back.startWeekday, 'Sunday');
  assert.equal(back.endWeekday, 'Wednesday');
  const all = diff('0001-01-01', '9999-12-31');
  assert.equal(all.days, 3652058);
  assert.deepEqual(all.calendar, { years: 9998, months: 11, days: 30 });
  assert.equal(all.workingDays, 2608614);
  assert.equal(diff('0001-01-01', '9999-12-31', true).days, 3652059); // the day after 9999-12-31 is still countable
});

test('weekendDays: the closed form matches counting day by day', () => {
  const brute = (start, days) => {
    let n = 0;
    for (let i = 0; i < days; i++) { const w = weekday(addDays(start, i)); if (w === 0 || w === 6) n++; }
    return n;
  };
  for (let offset = 0; offset < 7; offset++) {
    const start = addDays(D(2025, 10, 5), offset);
    for (const days of [0, 1, 2, 5, 6, 7, 8, 13, 14, 15, 30, 31, 100, 365, 366, 1000]) {
      assert.equal(weekendDays(start, days), brute(start, days), `${toIso(start)} for ${days} days`);
    }
  }
  assert.equal(weekendDays(D(2025, 10, 6), -5), 0);
});

test('spanText: singulars, zeros and a formatter', () => {
  assert.equal(spanText({ weeks: 40, days: 4 }), '40 weeks and 4 days');
  assert.equal(spanText({ years: 1, months: 0, days: 1 }), '1 year, 0 months and 1 day');
  assert.equal(spanText({ days: 0 }), '0 days');
  assert.equal(spanText({ weeks: 4130, days: 4 }, n => n.toLocaleString('en-IN')), '4,130 weeks and 4 days');
});

test('rangeText: says which day is left out, and names the swap when the end date comes first', () => {
  const s = D(2026, 1, 1), e = D(2026, 10, 12);
  assert.equal(rangeText(s, e, difference(s, e)), 'From Thursday, 1 January 2026 to Monday, 12 October 2026, not counting the end day.');
  assert.equal(rangeText(s, e, difference(s, e, { includeEnd: true })), 'From Thursday, 1 January 2026 to Monday, 12 October 2026, counting the end day.');
  // Reversed: the count runs from 1 January up to 12 October, so the day left out is 12 October, the entered start, not the entered end
  const back = difference(e, s);
  assert.equal(back.reversed, true);
  assert.equal(rangeText(e, s, back), 'Counted the other way round, since the end date comes first: from Thursday, 1 January 2026 to Monday, 12 October 2026, not counting the later day.');
  assert.equal(rangeText(e, s, difference(e, s, { includeEnd: true })), 'Counted the other way round, since the end date comes first: from Thursday, 1 January 2026 to Monday, 12 October 2026, counting the later day.');
  // and the figures behind that sentence: Monday 19 October back to Sunday 18 October counts the Sunday, not the Monday
  const weekend = difference(D(2026, 10, 19), D(2026, 10, 18));
  assert.deepEqual([weekend.days, weekend.workingDays, weekend.weekendDays], [1, 0, 1]);
  assert.match(rangeText(D(2026, 10, 19), D(2026, 10, 18), weekend), /not counting the later day\.$/);
});

test('counts on the page group in thousands, like the age tool, not in lakhs', () => {
  assert.equal(plain(3652058, 0, 'USD'), '3,652,058');
  assert.equal(plain(100000, 0, 'USD'), '100,000');
  assert.equal(plain(28914, 0, 'USD'), '28,914');
});

test('todayParts: reads the local calendar date, whatever the time of day', () => {
  assert.deepEqual(todayParts(new Date(2026, 9, 12, 23, 59, 59)), D(2026, 10, 12));
  assert.deepEqual(todayParts(new Date(2026, 0, 1, 0, 0, 1)), D(2026, 1, 1));
});
