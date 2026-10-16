// Date maths for the days-between tool. Pure functions, no DOM.
// A date is a plain { y, m, d } in the Gregorian calendar, with m from 1 to 12. All arithmetic goes through UTC noon:
// a day's index is floor(its UTC-noon timestamp / 86,400,000). UTC has no daylight saving, and the noon anchor keeps
// every timestamp half a day clear of midnight, so a clock change can never lose or gain a day.

const DAY_MS = 86400000;
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const UNITS = ['days', 'weeks', 'months', 'years'];

export const isLeapYear = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInMonth = (y, m) => (m === 2 ? (isLeapYear(y) ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31);

/** True for a real calendar day in the years 1 to 9999. */
export function isValidDate(date) {
  if (!date) return false;
  const { y, m, d } = date;
  return [y, m, d].every(Number.isInteger) && y >= 1 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** Parses 'YYYY-MM-DD', the value a date input gives. Null when empty, malformed or not a real day. */
export function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!m) return null;
  const date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return isValidDate(date) ? date : null;
}
export const toIso = ({ y, m, d }) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Today in the visitor's local calendar. The only place local time is read; everything after this is UTC noon. */
export const todayParts = (now = new Date()) => ({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });

function utcNoon({ y, m, d }) {
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d); // not Date.UTC, which reads the years 0 to 99 as 1900 to 1999
  t.setUTCHours(12, 0, 0, 0);
  return t.getTime();
}
/** Whole days since 1 January 1970. The difference of two indexes is an exact day count. */
export const dayIndex = date => Math.floor(utcNoon(date) / DAY_MS);
export function fromDayIndex(n) {
  const t = new Date(n * DAY_MS + DAY_MS / 2);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
/** 0 for Sunday to 6 for Saturday. */
export const weekday = date => new Date(utcNoon(date)).getUTCDay();
export const weekdayName = date => WEEKDAYS[weekday(date)];
export const compareDates = (a, b) => dayIndex(a) - dayIndex(b);

/** "Wednesday, 1 January 2025", assembled by hand so every browser prints the same thing. */
export const longDate = date => `${weekdayName(date)}, ${date.d} ${MONTHS[date.m - 1]} ${date.y}`;
export const shortDate = date => `${date.d} ${MONTHS[date.m - 1]} ${date.y}`;
export const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

export const addDays = (date, n) => fromDayIndex(dayIndex(date) + n);

/**
 * Calendar months, keeping the day of the month where the target month has it and otherwise stopping at that
 * month's last day: 31 January plus one month is 28 February, or 29 in a leap year. `clamped` says when that happened.
 */
export function addMonths(date, n) {
  const total = date.y * 12 + (date.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  const last = daysInMonth(y, m);
  return { date: { y, m, d: Math.min(date.d, last) }, clamped: date.d > last };
}

/**
 * Moves a date by n units: 'days', 'weeks', 'months' or 'years'. A negative n moves back.
 * Returns { date, clamped, days }, where days is how many days the move actually covered, or null when n is not a
 * whole number or the result falls outside the years 1 to 9999.
 */
export function shiftDate(date, n, unit) {
  if (!isValidDate(date) || !Number.isInteger(n) || !UNITS.includes(unit)) return null;
  const r = unit === 'days' ? { date: addDays(date, n), clamped: false }
    : unit === 'weeks' ? { date: addDays(date, n * 7), clamped: false }
    : addMonths(date, unit === 'years' ? n * 12 : n);
  if (!isValidDate(r.date)) return null;
  return { date: r.date, clamped: r.clamped, days: dayIndex(r.date) - dayIndex(date) };
}

/** Saturdays and Sundays among the `days` consecutive days that begin on `start`. */
export function weekendDays(start, days) {
  if (days <= 0) return 0;
  let n = Math.floor(days / 7) * 2;
  const w = weekday(start);
  for (let i = 0; i < days % 7; i++) if ((w + i) % 7 === 0 || (w + i) % 7 === 6) n++;
  return n;
}

// Whole calendar months from a to b (a no later than b), then the days left over, counted the way addMonths adds
// them: 31 January to 28 February is one month, and 31 January to 1 March is one month and a day.
function calendarParts(a, b) {
  let months = (b.y - a.y) * 12 + (b.m - a.m);
  if (compareDates(addMonths(a, months).date, b) > 0) months -= 1; // the last month is not complete
  const days = dayIndex(b) - dayIndex(addMonths(a, months).date);
  return { totalMonths: months, years: Math.floor(months / 12), months: months % 12, days };
}

/**
 * The span from start to end. Counts run from the start date up to, but not including, the end date; includeEnd
 * counts the end date too, which is the same as counting to the day after it. When end is before start the two are
 * swapped and `reversed` is true, so every figure stays positive. Null when either date is not a real date.
 */
export function difference(start, end, { includeEnd = false } = {}) {
  if (!isValidDate(start) || !isValidDate(end)) return null;
  const reversed = compareDates(end, start) < 0;
  const [a, last] = reversed ? [end, start] : [start, end];
  const b = includeEnd ? addDays(last, 1) : last;
  const days = dayIndex(b) - dayIndex(a);
  const cal = calendarParts(a, b);
  const weekend = weekendDays(a, days);
  return {
    days,
    reversed,
    includeEnd,
    weeks: { weeks: Math.floor(days / 7), days: days % 7 },
    months: { months: cal.totalMonths, days: cal.days },
    calendar: { years: cal.years, months: cal.months, days: cal.days },
    workingDays: days - weekend,
    weekendDays: weekend,
    startWeekday: weekdayName(start),
    endWeekday: weekdayName(end),
  };
}

/**
 * The sentence under the total. When the end date comes first the count ran from end to start, so the day left out
 * (or counted, with includeEnd) is the later one, the entered start; the sentence says so rather than calling it the end day.
 */
export function rangeText(start, end, { reversed, includeEnd }) {
  const counted = includeEnd ? 'counting' : 'not counting';
  return reversed
    ? `Counted the other way round, since the end date comes first: from ${longDate(end)} to ${longDate(start)}, ${counted} the later day.`
    : `From ${longDate(start)} to ${longDate(end)}, ${counted} the end day.`;
}

/** "1 year, 2 months and 3 days" from named parts. Every part is kept, so a zero reads as a zero. */
export function spanText(parts, format = String) {
  const bits = Object.entries(parts).map(([unit, n]) => `${format(n)} ${n === 1 ? unit.replace(/s$/, '') : unit}`);
  return bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0];
}
