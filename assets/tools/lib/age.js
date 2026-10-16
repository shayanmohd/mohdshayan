// Age maths on the Gregorian calendar: whole years first, then whole months, then the days left over, every month at its real length.
// Dates are plain { y, m, d } objects with the month 1 to 12. Pure functions, no DOM; the only Date object is the device clock in todayLocal.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const isLeapYear = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInMonth = (y, m) => (m === 2 ? (isLeapYear(y) ? 29 : 28) : [4, 6, 9, 11].includes(m) ? 30 : 31);

/** True when y, m and d name a real calendar day in the years 1 to 9999. */
export function isValidDate(date) {
  if (!date) return false;
  const { y, m, d } = date;
  return [y, m, d].every(Number.isInteger) && y >= 1 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** Days since 1 January 1970, negative before it (Howard Hinnant's days_from_civil), so no time zone can move a date. */
export function dayNumber({ y, m, d }) {
  const yy = m <= 2 ? y - 1 : y; // count years from March, which puts any leap day at the end of the year
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}
/** Days from a to b, negative when b is the earlier date. */
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);

/** 0 for Sunday to 6 for Saturday. 1 January 1970 was a Thursday. */
export const weekday = date => (((dayNumber(date) + 4) % 7) + 7) % 7;
export const weekdayName = date => WEEKDAYS[weekday(date)];

/** The same day of the month n months on, held to the last day of a shorter month: 31 January plus one month is 28 or 29 February. */
export function addMonths({ y, m, d }, n) {
  const total = y * 12 + (m - 1) + n;
  const yy = Math.floor(total / 12), mm = total - yy * 12 + 1;
  return { y: yy, m: mm, d: Math.min(d, daysInMonth(yy, mm)) };
}
/** The birthday in a given year. A 29 February birthday falls on 28 February in a common year. */
export const birthdayIn = (birth, year) => ({ y: year, m: birth.m, d: Math.min(birth.d, daysInMonth(year, birth.m)) });

/**
 * Age on a date, or null when `on` is before `birth`.
 * Years and months come from stepping the birthday forward through the calendar, so every month keeps its real length and a leap day
 * counts as a day; the days are what is left after the last step. totalHours is whole days times 24, since the calculator knows dates,
 * not times of birth.
 */
export function ageBetween(birth, on) {
  const totalDays = daysBetween(birth, on);
  if (totalDays < 0) return null;
  let totalMonths = (on.y - birth.y) * 12 + (on.m - birth.m);
  if (daysBetween(addMonths(birth, totalMonths), on) < 0) totalMonths -= 1; // that many steps would land after `on`
  const days = daysBetween(addMonths(birth, totalMonths), on);
  return {
    years: Math.floor(totalMonths / 12), months: totalMonths % 12, days,
    totalMonths, totalWeeks: Math.floor(totalDays / 7), weekDays: totalDays % 7, totalDays, totalHours: totalDays * 24,
  };
}

/** The first birthday on or after `on`: its date, weekday, days to go and the age reached. daysToGo is 0 on the birthday itself. */
export function nextBirthday(birth, on) {
  let date = birthdayIn(birth, on.y);
  if (daysBetween(on, date) < 0) date = birthdayIn(birth, on.y + 1);
  return { date, weekday: weekdayName(date), daysToGo: daysBetween(on, date), turning: date.y - birth.y };
}
/** The next `count` birthdays on or after `on`, in order. */
export function birthdaysAhead(birth, on, count = 10) {
  const first = nextBirthday(birth, on).date.y;
  return Array.from({ length: count }, (_, i) => {
    const date = birthdayIn(birth, first + i);
    return { date, weekday: weekdayName(date), daysToGo: daysBetween(on, date), turning: date.y - birth.y };
  });
}

// ---------- reading and writing dates ----------
/** 'YYYY-MM-DD', as a date input reports it, to a date; null for anything else or for a day that does not exist. */
export function parseIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  const date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return isValidDate(date) ? date : null;
}
export const toIso = ({ y, m, d }) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const MONTH_BY_NAME = Object.fromEntries(MONTHS.flatMap((name, i) => [[name.toLowerCase(), i + 1], [name.slice(0, 3).toLowerCase(), i + 1]]));
MONTH_BY_NAME.sept = 9;
// Each form: a pattern over the lower-cased text, and the groups that hold the year, month and day. Numbers are read day first.
const FORMS = [
  [/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/, m => [m[1], m[2], m[3]]], // 1990-03-14
  [/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/, m => [m[3], m[2], m[1]]], // 14/03/1990
  [/^(\d{1,2})(?:st|nd|rd|th)?[-/. ]([a-z]+)[-/. ](\d{4})$/, m => [m[3], MONTH_BY_NAME[m[2]], m[1]]], // 14 March 1990, 14th Mar 1990
  [/^([a-z]+)[-/. ](\d{1,2})(?:st|nd|rd|th)?[-/. ](\d{4})$/, m => [m[3], MONTH_BY_NAME[m[1]], m[2]]], // March 14, 1990
];
/**
 * A typed date to a date, or null. Numbers are read day first (14/03/1990), ISO order also works (1990-03-14), and the month may be
 * written out or shortened. The year must have four digits, so 03/04/90 is refused rather than guessed at.
 */
export function parseTypedDate(text) {
  const s = String(text ?? '').trim().toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  for (const [re, pick] of FORMS) {
    const m = re.exec(s);
    if (!m) continue;
    const [y, mo, d] = pick(m).map(Number);
    const date = { y, m: mo, d };
    return isValidDate(date) ? date : null;
  }
  return null;
}

/** Today on the device clock in its own time zone. toISOString would give the UTC date, which can be a day out. */
export const todayLocal = (now = new Date()) => ({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });

/** "14 March 1990", day month year. */
export const formatLong = ({ y, m, d }) => `${d} ${MONTHS[m - 1]} ${y}`;
/** "Wednesday 14 March 1990". */
export const formatWithWeekday = date => `${weekdayName(date)} ${formatLong(date)}`;
