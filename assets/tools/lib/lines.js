// Line processing for the Duplicate Line Remover: split, trim, drop empty lines, dedupe, sort, reverse, number, wrap.
// Pure functions, no DOM. Randomness for the shuffle comes from `rng`, which defaults to the Web Crypto API
// and can be swapped for a deterministic source in tests.

/** Splits text into lines on \n, \r\n or \r. A final line terminator closes the last line and does not start a new one. */
export function splitLines(text) {
  const s = String(text ?? '');
  if (s === '') return [];
  const lines = s.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** Keeps the first occurrence of each line. Returns { lines, removed }. */
export function dedupeLines(lines, { caseSensitive = true, ignoreWhitespace = true } = {}) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    let key = ignoreWhitespace ? line.trim() : line;
    if (!caseSensitive) key = key.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line); // the original spelling and spacing of the first occurrence is what survives
  }
  return { lines: out, removed: lines.length - out.length };
}

/** Uniform integer in [0, n) from crypto.getRandomValues, using rejection sampling to avoid modulo bias. */
// Values are drawn 1,024 at a time: one getRandomValues call per line would make a 50,000-line shuffle slow.
const pool = new Uint32Array(1024);
let poolAt = pool.length;
export function secureRandom(n) {
  if (!(n >= 1 && n <= 2 ** 32)) throw new RangeError('n out of range');
  const limit = 2 ** 32 - (2 ** 32 % n);
  for (;;) {
    if (poolAt >= pool.length) { crypto.getRandomValues(pool); poolAt = 0; }
    const v = pool[poolAt++];
    if (v < limit) return v % n;
  }
}

/** Fisher-Yates shuffle: every order is equally likely when rng(n) is uniform. Returns a new array. */
export function shuffle(lines, rng = secureRandom) {
  const out = lines.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Dictionary order rather than character codes, so "apple" sorts before "Banana"; natural also reads digit runs as numbers.
const ALPHA = new Intl.Collator('en');
const NATURAL = new Intl.Collator('en', { numeric: true });
/** Characters as a reader counts them (code points), so an emoji is one character and not two. */
export const charCount = s => { let n = 0; for (const _ of s) n++; return n; };

export const SORTS = ['none', 'az', 'za', 'short', 'long', 'natural', 'random'];

/** Sorted copy of the lines. Ties keep their input order; an unknown order returns the lines unchanged. */
export function sortLines(lines, order = 'none', rng = secureRandom) {
  switch (order) {
    case 'az': return lines.slice().sort(ALPHA.compare);
    case 'za': return lines.slice().sort((a, b) => ALPHA.compare(b, a));
    case 'natural': return lines.slice().sort(NATURAL.compare);
    case 'short':
    case 'long': {
      const sign = order === 'short' ? 1 : -1;
      return lines.map((line, i) => ({ line, n: charCount(line), i })).sort((a, b) => sign * (a.n - b.n) || a.i - b.i).map(x => x.line);
    }
    case 'random': return shuffle(lines, rng);
    default: return lines;
  }
}

export const DEFAULTS = { trim: false, removeEmpty: false, dedupe: true, caseSensitive: true, ignoreWhitespace: true, sort: 'none', reverse: false, number: false, prefix: '', suffix: '' };

/**
 * Runs every option in a fixed order: trim, remove empty, dedupe, sort, reverse, number, then prefix and suffix.
 * "Empty" means nothing but whitespace. Lines are joined with LF, and a trailing newline on the input is kept.
 * Returns { text, lines, stats: { linesIn, linesOut, duplicatesRemoved, emptyRemoved } }.
 */
export function processLines(text, options = {}, rng = secureRandom) {
  const o = { ...DEFAULTS, ...options };
  const source = String(text ?? '');
  let lines = splitLines(source);
  const linesIn = lines.length;
  if (o.trim) lines = lines.map(l => l.trim());
  let emptyRemoved = 0;
  if (o.removeEmpty) {
    const kept = lines.filter(l => l.trim() !== '');
    emptyRemoved = lines.length - kept.length;
    lines = kept;
  }
  let duplicatesRemoved = 0;
  if (o.dedupe) ({ lines, removed: duplicatesRemoved } = dedupeLines(lines, o));
  lines = sortLines(lines, o.sort, rng);
  if (o.reverse) lines = lines.slice().reverse();
  if (o.number) lines = lines.map((l, i) => `${i + 1}. ${l}`);
  const prefix = String(o.prefix ?? ''), suffix = String(o.suffix ?? '');
  if (prefix || suffix) lines = lines.map(l => prefix + l + suffix);
  const trailing = lines.length && /[\r\n]$/.test(source) ? '\n' : '';
  return { text: lines.join('\n') + trailing, lines, stats: { linesIn, linesOut: lines.length, duplicatesRemoved, emptyRemoved } };
}
