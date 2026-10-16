// Case converter: every case the page offers, as pure functions on strings. No DOM, so the Node tests can run it.
// Letters are mapped with toLocaleUpperCase and toLocaleLowerCase, so accented letters and other alphabets
// convert correctly. The page passes its own language as the locale; without one the browser's default applies.

// The cases in the order the page shows them. Each label is written in its own case.
export const CASES = [
  { id: 'sentence', label: 'Sentence case' },
  { id: 'lower', label: 'lower case' },
  { id: 'upper', label: 'UPPER CASE' },
  { id: 'title', label: 'Title Case' },
  { id: 'capitalised', label: 'Capitalised Case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
  { id: 'dot', label: 'dot.case' },
  { id: 'alternating', label: 'aLtErNaTiNg cAsE' },
  { id: 'inverse', label: 'iNVERSE cASE' },
];

// Words that stay lower in Title Case unless they begin or end a line or a sentence.
export const SMALL_WORDS = ['a', 'an', 'and', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'or', 'but', 'nor'];

const up = (s, locale) => s.toLocaleUpperCase(locale);
const low = (s, locale) => s.toLocaleLowerCase(locale);
// A word for the prose cases: letters, marks and digits, with apostrophes allowed inside (don't, rock'n'roll).
const WORD = /[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}'’]*/gu;
const LINE_BREAK = /(\r\n|\n|\r)/;
// A sentence ends at . ! or ? (closing quotes or brackets may follow) and then a space, so the dots inside "e.g." and "3.14" do not count.
const SENTENCE_END = /[.!?][)\]'"’”]*\s/;
// In a title a colon also starts a new part, so a small word after it is capitalised.
const TITLE_END = /[.!?:][)\]'"’”]*\s/;

/** Runs fn over each line and keeps every line break exactly as it was, CRLF included. */
const perLine = (text, fn) => text.split(LINE_BREAK).map((part, i) => (i % 2 ? part : fn(part))).join('');

/** Upper-cases the first character when it is a letter, so "3rd" stays "3rd". */
const capFirst = (word, locale) => word.replace(/^\p{L}/u, c => up(c, locale));

/**
 * Lowers a line, then rebuilds it with each word passed through `decide`, which is told whether the word is
 * first or last in the line and what sits between it and the word before (the gap).
 */
function mapWords(line, locale, decide) {
  const lower = low(line, locale);
  const matches = [...lower.matchAll(WORD)];
  let out = '';
  let last = 0;
  matches.forEach((m, i) => {
    const gap = lower.slice(last, m.index);
    out += gap + decide(m[0], { first: i === 0, last: i === matches.length - 1, gap });
    last = m.index + m[0].length;
  });
  return out + lower.slice(last);
}

const sentenceLine = (line, locale) => mapWords(line, locale, (w, p) => (p.first || SENTENCE_END.test(p.gap) ? capFirst(w, locale) : w));
const titleLine = (line, locale) => mapWords(line, locale, (w, p) => (SMALL_WORDS.includes(w) && !p.first && !p.last && !TITLE_END.test(p.gap) ? w : capFirst(w, locale)));
const capitalisedLine = (line, locale) => mapWords(line, locale, w => capFirst(w, locale));

/** Alternates lower and upper letter by letter, starting again at each word; digits and punctuation are skipped. */
function alternate(text, locale) {
  return text.replace(WORD, word => {
    let i = 0;
    return word.replace(/\p{L}/gu, c => (i++ % 2 ? up(c, locale) : low(c, locale)));
  });
}

/** Swaps the case of every letter. Characters without case are left alone. */
function invert(text, locale) {
  return [...text].map(c => {
    const u = up(c, locale);
    return c === u ? low(c, locale) : u;
  }).join('');
}

/**
 * Splits one line into the words the code cases join: on spaces, punctuation and camel boundaries, so
 * "userID number" gives user, ID, number and "XMLHttpRequest" gives XML, Http, Request.
 * An apostrophe inside a word is dropped rather than split, so "don't stop" gives dont, stop.
 */
export function splitWords(line) {
  return line
    .normalize('NFC')
    .replace(/(\p{L})['’](?=\p{L})/gu, '$1')
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

// The code cases work line by line: each line's words are lowered, then joined.
const code = (text, locale, join) => perLine(text, line => join(splitWords(line).map(w => low(w, locale))));

const CONVERTERS = {
  sentence: (t, l) => perLine(t, line => sentenceLine(line, l)),
  lower: (t, l) => low(t, l),
  upper: (t, l) => up(t, l),
  title: (t, l) => perLine(t, line => titleLine(line, l)),
  capitalised: (t, l) => perLine(t, line => capitalisedLine(line, l)),
  camel: (t, l) => code(t, l, words => words.map((w, i) => (i ? capFirst(w, l) : w)).join('')),
  pascal: (t, l) => code(t, l, words => words.map(w => capFirst(w, l)).join('')),
  snake: (t, l) => code(t, l, words => words.join('_')),
  kebab: (t, l) => code(t, l, words => words.join('-')),
  constant: (t, l) => code(t, l, words => words.map(w => up(w, l)).join('_')),
  dot: (t, l) => code(t, l, words => words.join('.')),
  alternating: alternate,
  inverse: invert,
};

/**
 * Converts text to the case with the given id (one of CASES). Line breaks are kept as they are.
 * locale is a BCP 47 tag such as "en"; it decides letter mappings like the Turkish dotted I.
 */
export function convertCase(text, id, { locale } = {}) {
  const fn = CONVERTERS[id];
  if (!fn) throw new RangeError(`Unknown case: ${id}`);
  return fn(String(text ?? ''), locale || undefined);
}

/**
 * Word and character counts for the stats lines. A word is a run of letters or digits, joined by apostrophes,
 * hyphens or underscores, so "kebab-case" and "snake_case" each count once. Characters are code points.
 */
export function count(text) {
  const s = String(text ?? '');
  return { words: (s.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’_-]*/gu) || []).length, characters: [...s].length };
}
