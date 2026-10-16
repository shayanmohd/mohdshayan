import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitWords, analyse, topWords, duration, formatDuration, timesFor, countSentences, countParagraphs, countLines, codePoints, wordKey, STOP_WORDS, READING_WPM, SPEAKING_WPM } from '../assets/tools/lib/word-counter.js';

const close = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);
// Every tokeniser case runs through the Intl.Segmenter path and the regex fallback
const both = text => [splitWords(text), splitWords(text, { segmenter: null })];
const FAQ_SENTENCE = "The 3-point plan costs 1,000.50 rupees, or 25% of 2026's budget.";

test('words: FAQ example, with numbers and a hyphenated word (both tokenisers)', () => {
  const expected = ['The', '3-point', 'plan', 'costs', '1,000.50', 'rupees', 'or', '25', 'of', "2026's", 'budget'];
  for (const tokens of both(FAQ_SENTENCE)) assert.deepEqual(tokens, expected);
  assert.equal(analyse(FAQ_SENTENCE).words, 11);
});
test('words: hyphen chains, spaced and dangling hyphens', () => {
  for (const tokens of both('well-known state-of-the-art re-entry a - b end- -start well--known')) {
    assert.deepEqual(tokens, ['well-known', 'state-of-the-art', 're-entry', 'a', 'b', 'end', 'start', 'well', 'known']);
  }
});
test('words: contractions, possessives and quotation marks', () => {
  for (const tokens of both("don't don’t it's O'Brien 'quoted' dogs' rock 'n' roll the '90s")) {
    assert.deepEqual(tokens, ["don't", 'don’t', "it's", "O'Brien", 'quoted', 'dogs', 'rock', 'n', 'roll', 'the', '90s']);
  }
});
test('words: Hindi, Arabic, accented and Japanese text', () => {
  for (const tokens of both('नमस्ते दुनिया। यह एक परीक्षण है।')) assert.deepEqual(tokens, ['नमस्ते', 'दुनिया', 'यह', 'एक', 'परीक्षण', 'है']);
  for (const tokens of both('السلام عليكم ورحمة الله')) assert.equal(tokens.length, 4);
  for (const tokens of both('Café naïve résumé façade')) assert.deepEqual(tokens, ['Café', 'naïve', 'résumé', 'façade']);
  // Japanese has no spaces: the segmenter's dictionary finds the words; the fallback can only count runs of script
  assert.equal(splitWords('日本語のテキストです。これはテストです。').length, 8);
  assert.equal(splitWords('日本語のテキストです。これはテストです。', { segmenter: null }).length, 2);
});
test('words: punctuation, symbols and emoji are not words', () => {
  for (const tokens of both('emoji 😀 here 👨‍👩‍👧 and -- a - b ... !!! @ # $ %')) assert.deepEqual(tokens, ['emoji', 'here', 'and', 'a', 'b']);
  for (const tokens of both('')) assert.deepEqual(tokens, []);
  for (const tokens of both(' ... \n\t ')) assert.deepEqual(tokens, []);
});
test('characters: code points, with and without spaces', () => {
  const text = 'Café 😀\nनमस्ते';
  assert.equal(text.length, 14); // UTF-16 units: the emoji is a surrogate pair
  assert.equal(codePoints(text), 13);
  const s = analyse(text);
  assert.equal(s.characters, 13);
  assert.equal(s.charactersNoSpaces, 11);
  assert.equal(analyse('a b c').charactersNoSpaces, 3); // non-breaking and em spaces are spaces
});
test('sentences: terminators, abbreviations, quotes, decimals and line breaks', () => {
  assert.equal(countSentences('Hello world'), 1);
  assert.equal(countSentences('One. Two! Three? Four'), 4);
  assert.equal(countSentences('e.g. this, i.e. that, U.S.A. is big. Mr. Smith went.'), 3);
  assert.equal(countSentences('He said "no." Then left.'), 2);
  assert.equal(countSentences('Wait... what?'), 1);
  assert.equal(countSentences('Pi is 3.14 and that is all.'), 1);
  assert.equal(countSentences('First line\nSecond line'), 2);
  assert.equal(countSentences('नमस्ते दुनिया। यह एक परीक्षण है।'), 2);
  assert.equal(countSentences('هل أنت بخير؟ نعم.'), 2);
  assert.equal(countSentences(''), 0);
  assert.equal(countSentences('... !!! ???'), 0);
});
test('paragraphs and lines', () => {
  assert.equal(countParagraphs('a\nb\n\nc\n   \nd'), 3);
  assert.equal(countLines('a\nb\n\nc\n   \nd'), 6);
  assert.equal(countParagraphs(''), 0);
  assert.equal(countLines(''), 0);
  assert.equal(countParagraphs('a\n'), 1);
  assert.equal(countLines('a\n'), 2);
  assert.equal(countParagraphs('\n\n'), 0);
  assert.equal(countLines('\n\n'), 3);
});
test('unique words, average word length and longest word', () => {
  const s = analyse('The cat and the Cat sat on the mat-stand');
  assert.equal(s.words, 9);
  assert.equal(s.uniqueWords, 6); // the, cat, and, sat, on, mat-stand
  close(s.averageWordLength, 32 / 9);
  assert.equal(s.longestWord, 'mat-stand');
  assert.equal(analyse("don't don’t Don't").uniqueWords, 1);
  assert.equal(wordKey('Don’t'), "don't");
  assert.equal(analyse('Café नमस्ते 😀').longestWord, 'नमस्ते'); // six code points beat four
  assert.equal(analyse('aa bbb cc').longestWord, 'bbb');
  assert.equal(analyse('aaa bbb').longestWord, 'aaa'); // ties go to the first
});
test('times: FAQ examples, rounding and hours', () => {
  const s = analyse('word '.repeat(575));
  assert.equal(s.words, 575);
  close(s.readingSeconds, 150);
  close(s.speakingSeconds, 230);
  assert.equal(formatDuration(s.readingSeconds), '2 min 30 sec');
  assert.equal(formatDuration(s.speakingSeconds), '3 min 50 sec');
  const t = timesFor(1000);
  close(t.reading, (1000 / READING_WPM) * 60);
  close(t.speaking, (1000 / SPEAKING_WPM) * 60);
  assert.equal(formatDuration(t.reading), '4 min 21 sec');
  assert.equal(formatDuration(t.speaking), '6 min 40 sec');
  assert.deepEqual(duration(0), { hours: 0, minutes: 0, seconds: 0 });
  assert.equal(formatDuration(0), '0 sec');
  assert.equal(formatDuration(analyse('one').readingSeconds), '1 sec'); // never 0 sec for real text
  assert.equal(formatDuration(timesFor(100).reading), '26 sec');
  assert.equal(formatDuration(3600), '1 hr 0 min 0 sec');
  assert.equal(formatDuration(timesFor(100000).reading), '7 hr 14 min 47 sec');
  assert.equal(formatDuration(timesFor(100000).speaking), '11 hr 6 min 40 sec');
});
test('keyword density: stop words, percentages, ties and limit', () => {
  const s = analyse('the cat saw the dog and the dog saw the bird');
  assert.equal(s.words, 11);
  const top = topWords(s);
  assert.deepEqual(top.map(r => [r.word, r.count]), [['saw', 2], ['dog', 2], ['cat', 1], ['bird', 1]]);
  close(top[0].percent, (2 / 11) * 100);
  const all = topWords(s, { includeStopWords: true });
  assert.deepEqual(all.map(r => [r.word, r.count]), [['the', 4], ['saw', 2], ['dog', 2], ['cat', 1], ['and', 1], ['bird', 1]]);
  close(all[0].percent, (4 / 11) * 100);
  assert.equal(topWords(s, { limit: 2 }).length, 2);
  // FAQ example: 31 uses in 575 words is 5.39%
  const faq = analyse('the '.repeat(31) + 'word '.repeat(544));
  assert.equal(faq.words, 575);
  const the = topWords(faq, { includeStopWords: true }).find(r => r.word === 'the');
  assert.equal(the.count, 31);
  close(the.percent, 5.391304347826087);
  assert.equal(topWords(faq).length, 1); // only "word" once stop words are out
});
test('keyword density groups by case and apostrophe style', () => {
  const s = analyse('Delhi delhi DELHI don’t don\'t');
  assert.deepEqual(topWords(s).map(r => [r.word, r.count]), [['delhi', 3]]);
  assert.deepEqual(topWords(s, { includeStopWords: true }).map(r => [r.word, r.count]), [['delhi', 3], ["don't", 2]]);
});
test('empty and whitespace-only text gives zeros, not NaN', () => {
  const e = analyse('');
  assert.deepEqual([e.words, e.characters, e.charactersNoSpaces, e.sentences, e.paragraphs, e.lines, e.uniqueWords, e.averageWordLength, e.longestWord, e.readingSeconds, e.speakingSeconds],
    [0, 0, 0, 0, 0, 0, 0, 0, '', 0, 0]);
  assert.deepEqual(topWords(e), []);
  const w = analyse('   \n\n '); // three spaces, two line breaks, one space
  assert.deepEqual([w.words, w.characters, w.charactersNoSpaces, w.sentences, w.paragraphs, w.lines, w.averageWordLength], [0, 6, 0, 0, 0, 3, 0]);
  assert.equal(analyse(null).words, 0);
});
test('windows line endings are normalised first', () => {
  const s = analyse('a\r\nb\r\n\r\nc');
  assert.equal(s.lines, 4);
  assert.equal(s.paragraphs, 2);
  assert.equal(s.characters, 6);
  assert.equal(s.sentences, 3);
});
test('words: full stops, slashes, colons and @ inside a word keep it whole, however ICU breaks it', () => {
  // Chrome's ICU breaks "e.g." into "e" and "g" and "example.com" into two pieces; Node's keeps them whole. Every path must agree.
  const breaking = { segment: s => (s.match(/[\p{L}\p{N}\p{M}_\u200C\u200D]+|[\s\S]/gu) || []).map(segment => ({ segment, isWordLike: /[\p{L}\p{N}]/u.test(segment) })) };
  const cases = [
    ['e.g. this, i.e. that, U.S.A. is big. Ph.D.', ['e.g', 'this', 'i.e', 'that', 'U.S.A', 'is', 'big', 'Ph.D']],
    ['Visit https://mohdshayan.com/tools/ or email contact@mohdshayan.com. See www.example.org/page?id=42', ['Visit', 'https', 'mohdshayan.com/tools', 'or', 'email', 'contact@mohdshayan.com', 'See', 'www.example.org/page', 'id', '42']],
    ['16/10/2026 at 10:30, and/or 24/7, v1.2', ['16/10/2026', 'at', '10:30', 'and/or', '24/7', 'v1.2']],
    ['end. Next line. Wait... what? a . b @ c', ['end', 'Next', 'line', 'Wait', 'what', 'a', 'b', 'c']],
  ];
  for (const [text, expected] of cases) {
    for (const opts of [{}, { segmenter: null }, { segmenter: breaking }]) assert.deepEqual(splitWords(text, opts), expected, text);
  }
  assert.equal(analyse('e.g. this').words, 2);
  assert.deepEqual(topWords(analyse('Visit mohdshayan.com, then mohdshayan.com again.')).map(r => [r.word, r.count]), [['mohdshayan.com', 2], ['visit', 1]]); // "then" and "again" are stop words
});
test('words: zero-width joiners inside Hindi words do not split them (both tokenisers)', () => {
  for (const tokens of both('कार्\u200dय और कार्\u200cय में अंतर है।')) assert.deepEqual(tokens, ['कार्\u200dय', 'और', 'कार्\u200cय', 'में', 'अंतर', 'है']);
  assert.equal(analyse('कार्\u200dय और कार्\u200cय में अंतर है।').words, 6);
});
test('stays fast on 100,000 words', () => {
  const text = 'The quick brown fox jumps over the lazy dog again. '.repeat(10000);
  const t0 = Date.now();
  const s = analyse(text);
  const top = topWords(s);
  assert.ok(Date.now() - t0 < 3000, 'analysis took too long');
  assert.equal(s.words, 100000);
  assert.equal(s.sentences, 10000);
  assert.equal(s.paragraphs, 1);
  assert.equal(s.uniqueWords, 9);
  assert.equal(s.characters, 510000);
  assert.equal(s.charactersNoSpaces, 410000);
  assert.equal(formatDuration(s.readingSeconds), '7 hr 14 min 47 sec');
  assert.deepEqual(top.map(r => r.word), ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog']);
  assert.ok(top.every(r => r.count === 10000 && r.percent === 10));
  assert.equal(topWords(s, { includeStopWords: true })[0].percent, 20); // "the" twice per sentence
});
test('stop-word list is lowercase English function words', () => {
  assert.ok(STOP_WORDS.size > 100);
  for (const w of STOP_WORDS) assert.match(w, /^[a-z']+$/, w);
  for (const w of ['the', 'and', 'of', "don't", "it's"]) assert.ok(STOP_WORDS.has(w), w);
  for (const w of ['word', 'delhi', 'counter']) assert.ok(!STOP_WORDS.has(w), w);
});
