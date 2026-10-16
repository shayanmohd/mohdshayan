import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isLeapYear, daysInMonth, isValidDate, dayNumber, daysBetween, weekday, weekdayName, addMonths, birthdayIn, ageBetween, nextBirthday, birthdaysAhead,
  parseIso, toIso, parseTypedDate, todayLocal, formatLong, formatWithWeekday } from '../assets/tools/lib/age.js';

const D = (y, m, d) => ({ y, m, d });
const ymd = a => [a.years, a.months, a.days];
function* eachDay(from, to) {
  let { y, m, d } = from;
  while (daysBetween({ y, m, d }, to) >= 0) {
    yield { y, m, d };
    d += 1;
    if (d > daysInMonth(y, m)) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }
  }
}

test('calendar: leap years, month lengths and real dates', () => {
  assert.deepEqual([1900, 2000, 2023, 2024, 2100].map(isLeapYear), [false, true, false, true, false]);
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2025, 2), 28);
  assert.deepEqual([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => daysInMonth(2025, m)), [31, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  assert.equal(isValidDate(D(2024, 2, 29)), true);
  assert.equal(isValidDate(D(2023, 2, 29)), false);
  assert.equal(isValidDate(D(2025, 4, 31)), false);
  assert.equal(isValidDate(D(0, 1, 1)), false);
  assert.equal(isValidDate(D(10000, 1, 1)), false);
  assert.equal(isValidDate(D(2025, 1.5, 1)), false);
  assert.equal(isValidDate(null), false);
});

test('calendar: day numbers and weekdays agree with Date.UTC across eight centuries', () => {
  assert.equal(dayNumber(D(1970, 1, 1)), 0);
  assert.equal(weekdayName(D(1970, 1, 1)), 'Thursday');
  for (let y = 1600; y <= 2400; y += 3) {
    for (const [m, d] of [[1, 1], [2, 28], [2, 29], [3, 1], [6, 30], [10, 12], [12, 31]]) {
      if (!isValidDate(D(y, m, d))) continue;
      const utc = Date.UTC(y, m - 1, d);
      assert.equal(dayNumber(D(y, m, d)), utc / 86400000, `${y}-${m}-${d}`);
      assert.equal(weekday(D(y, m, d)), new Date(utc).getUTCDay(), `${y}-${m}-${d}`);
    }
  }
  assert.equal(weekdayName(D(1990, 3, 14)), 'Wednesday');
  assert.equal(weekdayName(D(2026, 10, 12)), 'Monday');
  assert.equal(weekdayName(D(2000, 2, 29)), 'Tuesday');
  assert.equal(weekdayName(D(1947, 8, 15)), 'Friday');
});

test('calendar: addMonths holds to the end of a shorter month and crosses years', () => {
  assert.deepEqual(addMonths(D(2025, 1, 31), 1), D(2025, 2, 28));
  assert.deepEqual(addMonths(D(2024, 1, 31), 1), D(2024, 2, 29));
  assert.deepEqual(addMonths(D(2025, 1, 31), 2), D(2025, 3, 31));
  assert.deepEqual(addMonths(D(2025, 11, 30), 3), D(2026, 2, 28));
  assert.deepEqual(addMonths(D(2024, 2, 29), 12), D(2025, 2, 28));
  assert.deepEqual(addMonths(D(2025, 3, 15), -3), D(2024, 12, 15));
  assert.deepEqual(birthdayIn(D(2000, 2, 29), 2026), D(2026, 2, 28));
  assert.deepEqual(birthdayIn(D(2000, 2, 29), 2028), D(2028, 2, 29));
});

test('age: FAQ example, born 14 March 1990, on 12 October 2026', () => {
  const a = ageBetween(D(1990, 3, 14), D(2026, 10, 12));
  assert.deepEqual(ymd(a), [36, 6, 28]);
  assert.equal(a.totalMonths, 438);
  assert.deepEqual([a.totalWeeks, a.weekDays], [1908, 5]);
  assert.equal(a.totalDays, 13361);
  assert.equal(a.totalHours, 320664);
  assert.deepEqual(nextBirthday(D(1990, 3, 14), D(2026, 10, 12)), { date: D(2027, 3, 14), weekday: 'Sunday', daysToGo: 153, turning: 37 });
});

test('age: born 29 February (FAQ example)', () => {
  const b = D(2000, 2, 29);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 2, 27))), [25, 11, 29]);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 2, 28))), [26, 0, 0]);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 3, 1))), [26, 0, 1]);
  assert.deepEqual(ymd(ageBetween(b, D(2028, 2, 28))), [27, 11, 30]);
  assert.deepEqual(ymd(ageBetween(b, D(2028, 2, 29))), [28, 0, 0]);
  assert.deepEqual(nextBirthday(b, D(2026, 2, 28)), { date: D(2026, 2, 28), weekday: 'Saturday', daysToGo: 0, turning: 26 });
  assert.deepEqual(nextBirthday(b, D(2026, 3, 1)), { date: D(2027, 2, 28), weekday: 'Sunday', daysToGo: 364, turning: 27 });
  assert.deepEqual(nextBirthday(b, D(2027, 3, 1)), { date: D(2028, 2, 29), weekday: 'Tuesday', daysToGo: 365, turning: 28 });
});

test('age: a month-end birthday is counted on the last day of a shorter month (FAQ example)', () => {
  assert.deepEqual(ymd(ageBetween(D(2025, 1, 31), D(2025, 2, 28))), [0, 1, 0]);
  assert.deepEqual(ymd(ageBetween(D(2025, 1, 31), D(2025, 3, 1))), [0, 1, 1]);
  assert.deepEqual(ymd(ageBetween(D(2024, 1, 31), D(2024, 2, 29))), [0, 1, 0]);
  assert.deepEqual(ymd(ageBetween(D(2024, 1, 31), D(2024, 3, 1))), [0, 1, 1]);
  assert.deepEqual(ymd(ageBetween(D(2024, 5, 31), D(2024, 7, 1))), [0, 1, 1]);
  assert.deepEqual(ymd(ageBetween(D(2025, 1, 31), D(2025, 3, 31))), [0, 2, 0]);
  const a = ageBetween(D(2025, 1, 31), D(2025, 3, 1));
  assert.deepEqual([a.totalMonths, a.totalDays, a.totalWeeks, a.weekDays, a.totalHours], [1, 29, 4, 1, 696]);
});

test('age: the day before, on and after a birthday', () => {
  const b = D(1990, 3, 14);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 3, 13))), [35, 11, 27]);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 3, 14))), [36, 0, 0]);
  assert.deepEqual(ymd(ageBetween(b, D(2026, 3, 15))), [36, 0, 1]);
  assert.equal(nextBirthday(b, D(2026, 3, 13)).daysToGo, 1);
  assert.equal(nextBirthday(b, D(2026, 3, 14)).daysToGo, 0);
  assert.equal(nextBirthday(b, D(2026, 3, 15)).daysToGo, 364);
});

test('age: the same day is zero everywhere, and a birth after the date is refused', () => {
  const a = ageBetween(D(2026, 10, 12), D(2026, 10, 12));
  assert.deepEqual([a.years, a.months, a.days, a.totalMonths, a.totalWeeks, a.weekDays, a.totalDays, a.totalHours], [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(nextBirthday(D(2026, 10, 12), D(2026, 10, 12)), { date: D(2026, 10, 12), weekday: 'Monday', daysToGo: 0, turning: 0 });
  assert.equal(ageBetween(D(2026, 10, 13), D(2026, 10, 12)), null);
  assert.equal(ageBetween(D(2030, 1, 1), D(2026, 10, 12)), null);
});

test('age: years, months and days always rebuild the end date and stay in range', () => {
  let checked = 0;
  for (const birth of eachDay(D(2023, 12, 20), D(2024, 3, 5))) {
    for (const on of eachDay(D(2024, 1, 1), D(2025, 4, 10))) {
      if (daysBetween(birth, on) < 0) continue;
      const a = ageBetween(birth, on);
      const tag = `${toIso(birth)} to ${toIso(on)}`;
      assert.ok(a.months >= 0 && a.months <= 11 && a.days >= 0 && a.days <= 30, `${tag}: ${ymd(a)}`);
      assert.equal(daysBetween(addMonths(birth, a.years * 12 + a.months), on), a.days, tag);
      assert.equal(a.totalMonths, a.years * 12 + a.months, tag);
      assert.equal(a.totalWeeks * 7 + a.weekDays, a.totalDays, tag);
      assert.equal(a.totalHours, a.totalDays * 24, tag);
      checked += 1;
    }
  }
  assert.ok(checked > 30000);
});

test('parse: ISO strings from a date input', () => {
  assert.deepEqual(parseIso('1990-03-14'), D(1990, 3, 14));
  assert.deepEqual(parseIso(' 2024-02-29 '), D(2024, 2, 29));
  assert.equal(parseIso('2023-02-29'), null);
  assert.equal(parseIso('1990-3-14'), null);
  assert.equal(parseIso('14/03/1990'), null);
  assert.equal(parseIso(''), null);
  assert.equal(parseIso(undefined), null);
  assert.equal(toIso(D(1990, 3, 4)), '1990-03-04');
  assert.equal(toIso(parseIso('0999-12-31')), '0999-12-31');
});

test('parse: typed dates in day-first, ISO and written-out forms', () => {
  const want = D(1990, 3, 14);
  for (const s of ['14/03/1990', '14-03-1990', '14.03.1990', '14 03 1990', '1990-03-14', '1990/03/14', '14 March 1990', '14 march 1990', '14th March 1990',
    '14 Mar 1990', '14-Mar-1990', 'March 14, 1990', 'Mar 14 1990', '  14   March,  1990 ']) {
    assert.deepEqual(parseTypedDate(s), want, s);
  }
  assert.deepEqual(parseTypedDate('3/4/1990'), D(1990, 4, 3)); // day first
  assert.deepEqual(parseTypedDate('1 Sept 2001'), D(2001, 9, 1));
  assert.deepEqual(parseTypedDate('29 feb 2024'), D(2024, 2, 29));
});

test('parse: typed dates that are refused', () => {
  for (const s of ['', '   ', '14/03/90', '03/14/1990', '29 Feb 2023', '31 April 2000', '14 Marchh 1990', 'yesterday', '1990', '14 March', '2024-02-30', '0000-01-01', null]) {
    assert.equal(parseTypedDate(s), null, JSON.stringify(s));
  }
});

test('today comes from the local clock, not UTC', () => {
  assert.deepEqual(todayLocal(new Date(2026, 9, 12, 23, 59)), D(2026, 10, 12));
  assert.deepEqual(todayLocal(new Date(2024, 1, 29, 0, 0)), D(2024, 2, 29));
});

test('format: long dates and weekdays', () => {
  assert.equal(formatLong(D(1990, 3, 14)), '14 March 1990');
  assert.equal(formatLong(D(2026, 2, 1)), '1 February 2026');
  assert.equal(formatWithWeekday(D(2027, 3, 14)), 'Sunday 14 March 2027');
});

// ---------- house rules and page markup ----------
const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const files = { lib: read('../assets/tools/lib/age.js'), page: read('../assets/tools/age.js'), ui: read('../content/tools/age.html'), tests: read('./age.test.mjs') };

test('the tool never shows an en or em dash: none in its files, and the page does not borrow the kit\'s en-dash placeholder', () => {
  for (const [name, text] of Object.entries(files)) assert.ok(!/[\u2013\u2014]/.test(text), `${name} contains an en or em dash`);
  // plain(NaN) and money(NaN) in the kit return an en dash, which an empty readout would show as its value
  assert.ok(!/(plain|money|pct)\(NaN\)/.test(files.page), 'page uses the kit\'s en-dash placeholder');
});

test('page: the ten-birthdays table has three columns and its first cell wraps, so a 360px phone never scrolls it sideways', () => {
  const thead = /<thead>(.*?)<\/thead>/s.exec(files.ui)[1];
  assert.equal((thead.match(/<th /g) || []).length, 3);
  assert.match(files.page, /<tr><td class="!whitespace-normal">\$\{formatWithWeekday\(b\.date\)\}<\/td><td>\$\{b\.turning\}<\/td><td>\$\{count\(b\.daysToGo\)\}<\/td><\/tr>/);
  assert.match(files.page, /<td colspan="3" class="!whitespace-normal">\$\{msg\}<\/td>/);
});

test('page: every input has a label, the typed date is described by its help and its error, and the label follows the visible box', () => {
  for (const tag of files.ui.match(/<input [^>]*>/g)) {
    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    const labelled = (id && files.ui.includes(`<label for="${id}"`)) || /aria-labelledby="age-dob-label"/.test(tag) || files.ui.includes(`<label>${tag}<span>`);
    assert.ok(labelled, `${tag} has no label`);
  }
  assert.match(files.ui, /id="age-dob-text"[^>]*aria-describedby="age-typed-help age-dob-error"/);
  assert.match(files.page, /htmlFor = t \? 'age-dob-text' : 'age-dob'/);
});

test('birthdays ahead: ten in a row, with the leap day falling back to 28 February', () => {
  const list = birthdaysAhead(D(2000, 2, 29), D(2026, 3, 1), 10);
  assert.equal(list.length, 10);
  assert.deepEqual(list.map(b => b.date.y), [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036]);
  assert.deepEqual(list.map(b => b.date.d), [28, 29, 28, 28, 28, 29, 28, 28, 28, 29]);
  assert.deepEqual(list.map(b => b.turning), [27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
  assert.equal(list[0].daysToGo, 364);
  assert.equal(list[1].weekday, 'Tuesday');
  assert.equal(birthdaysAhead(D(1990, 3, 14), D(2026, 3, 14), 3)[0].daysToGo, 0);
});
