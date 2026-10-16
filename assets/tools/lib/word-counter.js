// Word counter maths: word, character, sentence, paragraph and line counts, reading and speaking times,
// and keyword density. Pure functions, no DOM.
// Words are split with Intl.Segmenter where it exists, so Hindi, Arabic and accented text count correctly;
// a Unicode-aware regex stands in on browsers without it.

export const READING_WPM = 230; // the rate the blog uses for its reading times
export const SPEAKING_WPM = 150;

// Common English function words, left out of the keyword table unless the visitor asks for them.
export const STOP_WORDS = new Set(`a about above after again against all also am an and any are aren't as at be because been before
being below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from
further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll
i'm i've if in into is isn't it it's its itself just let's me more most mustn't my myself no nor not of off on once only or other ought
our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them
themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd
we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's will with won't would wouldn't
you you'd you'll you're you've your yours yourself yourselves`.split(/\s+/));

const SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
// Marks that join two word pieces into one word when letters or digits sit on both sides: hyphens, apostrophes
// ("2026's"), and the full stop, slash, colon and @ inside "e.g.", "24/7", "10:30", "example.com" and an email
// address. Chrome's ICU breaks on these where Node's does not, so the join is done here rather than left to the segmenter.
const JOINERS = new Set(['-', '‐', '‑', "'", '’', '.', '/', ':', '@']);
// Fallback tokeniser: a letter, digit or combining mark, then more of those (zero-width joiners included, which
// sit inside Hindi words), a joiner from the list above followed by another word character, or a thousands comma inside a number.
const WORD_RE = /[\p{L}\p{N}\p{M}](?:[\p{L}\p{N}\p{M}_\u200C\u200D]|['’.\/:@‐‑-](?=[\p{L}\p{N}\p{M}])|,(?=\p{N}))*/gu;
const SENTENCE_END = /[.!?…।॥؟。！？]+["'”’)\]]*(?=\s+(?![\s\p{Ll}])|\s*$)|\n/gu;

/** Number of Unicode code points, so an emoji or a combining mark counts once rather than by UTF-16 units. */
export function codePoints(s) {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

/**
 * Splits text into words. Hyphenated words, contractions, abbreviations such as "e.g.", dates, times, domain names
 * and email addresses each stay one word, numbers count, and punctuation, spaces and emoji do not.
 * Pass { segmenter: null } to force the regex fallback.
 */
export function splitWords(text, { segmenter = SEGMENTER } = {}) {
  const s = String(text ?? '');
  if (!segmenter) return s.match(WORD_RE) || [];
  const out = [];
  let after = 0; // what came just before: 1 a word, 2 a joiner straight after a word, 0 anything else
  let joiner = '';
  for (const seg of segmenter.segment(s)) {
    if (seg.isWordLike) {
      if (after === 2) out[out.length - 1] += joiner + seg.segment; // "well-known" and "2026's" are one word each
      else out.push(seg.segment);
      after = 1;
    } else if (after === 1 && JOINERS.has(seg.segment)) {
      after = 2;
      joiner = seg.segment;
    } else after = 0;
  }
  return out;
}

/**
 * A sentence ends at a full stop, question mark or exclamation mark (or their Devanagari, Arabic and CJK
 * equivalents) followed by a space and anything other than a lowercase letter, so "e.g. this" does not
 * split, or at a line break. Only pieces with a letter or digit in them count.
 */
export const countSentences = text => text.split(SENTENCE_END).filter(p => /[\p{L}\p{N}]/u.test(p)).length;

/** Paragraphs are blocks of text separated by at least one blank line. */
export const countParagraphs = text => text.split(/\n\s*\n/).filter(p => /\S/.test(p)).length;

/** Lines as an editor numbers them: every line break starts a new one, blank lines included. */
export const countLines = text => (text === '' ? 0 : text.split('\n').length);

/** Groups "The", "the" and "the" with a curly apostrophe under one key. */
export const wordKey = w => w.toLowerCase().replace(/’/g, "'");

/**
 * Every count for a piece of text. Times are in seconds at full precision; averageWordLength is unrounded.
 * frequencies maps each word key to its count, in order of first appearance, for topWords().
 */
export function analyse(text) {
  const t = String(text ?? '').replace(/\r\n?/g, '\n');
  const tokens = splitWords(t);
  const frequencies = new Map();
  let letters = 0;
  let longest = '';
  let longestLength = 0;
  for (const w of tokens) {
    const len = codePoints(w);
    letters += len;
    if (len > longestLength) { longest = w; longestLength = len; }
    const key = wordKey(w);
    frequencies.set(key, (frequencies.get(key) || 0) + 1);
  }
  const words = tokens.length;
  return {
    words,
    characters: codePoints(t),
    charactersNoSpaces: codePoints(t.replace(/\s+/gu, '')),
    sentences: countSentences(t),
    paragraphs: countParagraphs(t),
    lines: countLines(t),
    uniqueWords: frequencies.size,
    averageWordLength: words ? letters / words : 0,
    longestWord: longest,
    readingSeconds: (words / READING_WPM) * 60,
    speakingSeconds: (words / SPEAKING_WPM) * 60,
    frequencies,
  };
}

/**
 * The most used words with their count and share of all words (count / words x 100).
 * Stop words are skipped unless includeStopWords is set; ties keep the order of first appearance.
 */
export function topWords({ frequencies, words }, { includeStopWords = false, limit = 10 } = {}) {
  const rows = [];
  for (const [word, count] of frequencies) {
    if (includeStopWords || !STOP_WORDS.has(word)) rows.push({ word, count, percent: (count / words) * 100 });
  }
  rows.sort((a, b) => b.count - a.count); // Array.prototype.sort is stable, so equal counts stay in first-appearance order
  return rows.slice(0, limit);
}

/** Whole hours, minutes and seconds for display. Rounded to the nearest second, never below one second for any text at all. */
export function duration(seconds) {
  const total = Math.max(seconds > 0 ? 1 : 0, Math.round(seconds));
  return { hours: Math.floor(total / 3600), minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
}

/** "26 sec", "2 min 30 sec" or "7 hr 14 min 47 sec". */
export function formatDuration(seconds) {
  const d = duration(seconds);
  const parts = [];
  if (d.hours) parts.push(`${d.hours} hr`);
  if (d.hours || d.minutes) parts.push(`${d.minutes} min`);
  parts.push(`${d.seconds} sec`);
  return parts.join(' ');
}

/** Reading and speaking times for a given word count, used by the reference table. */
export const timesFor = words => ({ reading: (words / READING_WPM) * 60, speaking: (words / SPEAKING_WPM) * 60 });
