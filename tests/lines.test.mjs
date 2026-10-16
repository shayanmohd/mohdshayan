import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitLines, dedupeLines, sortLines, shuffle, secureRandom, processLines, charCount, SORTS } from '../assets/tools/lib/lines.js';

const run = (text, options) => processLines(text, options);
const out = (text, options) => run(text, options).lines;

test('splitLines: every terminator counts, and a final terminator does not start a new line', () => {
  assert.deepEqual(splitLines('a\nb\r\nc\rd'), ['a', 'b', 'c', 'd']);
  assert.deepEqual(splitLines('a\nb\n'), ['a', 'b']);
  assert.deepEqual(splitLines('a\nb\n\n'), ['a', 'b', '']);
  assert.deepEqual(splitLines('\n'), ['']);
  assert.deepEqual(splitLines(''), []);
  assert.deepEqual(splitLines('single'), ['single']);
});

test('dedupe: case-sensitive and case-insensitive (FAQ example)', () => {
  const text = 'apple\nApple\nbanana\napple';
  const strict = run(text, { caseSensitive: true });
  assert.deepEqual(strict.lines, ['apple', 'Apple', 'banana']);
  assert.equal(strict.stats.duplicatesRemoved, 1);
  const loose = run(text, { caseSensitive: false });
  assert.deepEqual(loose.lines, ['apple', 'banana']);
  assert.equal(loose.stats.duplicatesRemoved, 2);
  assert.deepEqual(out(text, { dedupe: false }), ['apple', 'Apple', 'banana', 'apple']);
});

test('dedupe: surrounding whitespace can be ignored, and the first occurrence keeps its own spacing', () => {
  const lines = ['apple ', '  apple', 'apple'];
  assert.deepEqual(dedupeLines(lines, { ignoreWhitespace: true }), { lines: ['apple '], removed: 2 });
  assert.deepEqual(dedupeLines(lines, { ignoreWhitespace: false }), { lines, removed: 0 });
  assert.deepEqual(dedupeLines(['a', 'b', 'a', 'c', 'b'], {}).lines, ['a', 'b', 'c']);
});

test('trim: runs before dedupe, so " apple" and "apple " become one line (FAQ example)', () => {
  const r = run(' apple\napple \napple', { trim: true });
  assert.deepEqual(r.lines, ['apple']);
  assert.equal(r.stats.duplicatesRemoved, 2);
  assert.deepEqual(out('\tx \n y ', { trim: true, dedupe: false }), ['x', 'y']);
});

test('remove empty: lines of only spaces or tabs count as empty, and the count is reported', () => {
  const r = run('a\n\n   \n\t\nb\n', { removeEmpty: true });
  assert.deepEqual(r.lines, ['a', 'b']);
  assert.deepEqual(r.stats, { linesIn: 5, linesOut: 2, duplicatesRemoved: 0, emptyRemoved: 3 });
  // Without the option, blank lines are ordinary lines: dedupe keeps the first of them
  const kept = run('a\n\n\nb', { removeEmpty: false });
  assert.deepEqual(kept.lines, ['a', '', 'b']);
  assert.equal(kept.stats.duplicatesRemoved, 1);
  assert.equal(kept.stats.emptyRemoved, 0);
});

test('order of operations: sort before numbering, numbering before prefix and suffix (FAQ example)', () => {
  assert.deepEqual(out('pear\napple', { sort: 'az', number: true, prefix: '- ' }), ['- 1. apple', '- 2. pear']);
  assert.deepEqual(out('b\na', { sort: 'az', reverse: true, number: true, suffix: ';' }), ['1. b;', '2. a;']);
  assert.deepEqual(out('x\ny', { prefix: '<', suffix: '>' }), ['<x>', '<y>']);
  assert.deepEqual(out('x\n\ny', { dedupe: false, number: true }), ['1. x', '2. ', '3. y']);
});

test('sort: A to Z is dictionary order, natural reads numbers, Z to A reverses (FAQ example)', () => {
  const files = ['img1.png', 'img10.png', 'img2.png'];
  assert.deepEqual(sortLines(files, 'natural'), ['img1.png', 'img2.png', 'img10.png']);
  assert.deepEqual(sortLines(files, 'az'), ['img1.png', 'img10.png', 'img2.png']);
  assert.deepEqual(sortLines(['Banana', 'cherry', 'apple'], 'az'), ['apple', 'Banana', 'cherry']);
  assert.deepEqual(sortLines(['Banana', 'cherry', 'apple'], 'za'), ['cherry', 'Banana', 'apple']);
  assert.deepEqual(sortLines(['file2', 'file10', 'file1'], 'natural'), ['file1', 'file2', 'file10']);
  assert.deepEqual(sortLines(files, 'none'), files);
});

test('sort: shortest and longest first count characters, and ties keep their input order', () => {
  const lines = ['ccc', 'a', 'bb', 'dd', 'e'];
  assert.deepEqual(sortLines(lines, 'short'), ['a', 'e', 'bb', 'dd', 'ccc']);
  assert.deepEqual(sortLines(lines, 'long'), ['ccc', 'bb', 'dd', 'a', 'e']);
  assert.deepEqual(sortLines(['ab', '\u{1F600}'], 'short'), ['\u{1F600}', 'ab']); // an emoji is one character
  assert.deepEqual(lines, ['ccc', 'a', 'bb', 'dd', 'e']); // the input is never mutated
});

test('charCount: code points, so an emoji or any astral character is one character, not two UTF-16 units', () => {
  assert.equal(charCount('\u{1F600}\u{1F600}\nab'), 5); // the page's character hint relies on this: String.length would say 7
  assert.equal('\u{1F600}\u{1F600}\nab'.length, 7);
  assert.equal(charCount('caf\u00e9'), 4);
  assert.equal(charCount('\u{20BB7}'), 1); // a CJK extension B character
  assert.equal(charCount(''), 0);
});

test('shuffle: Fisher-Yates driven by rng, always a permutation, random by default', () => {
  assert.deepEqual(shuffle(['a', 'b', 'c', 'd'], () => 0), ['b', 'c', 'd', 'a']);
  assert.deepEqual(shuffle(['a', 'b', 'c', 'd'], n => n - 1), ['a', 'b', 'c', 'd']);
  const lines = Array.from({ length: 500 }, (_, i) => `line ${i}`);
  const mixed = sortLines(lines, 'random');
  assert.deepEqual([...mixed].sort(), [...lines].sort());
  assert.notDeepEqual(mixed, lines);
  assert.equal(run('a\nb\nc', { sort: 'random' }).stats.linesOut, 3);
  assert.deepEqual(shuffle([]), []);
});

test('secureRandom: in range, roughly uniform, and rejects a bad range', () => {
  const counts = new Array(7).fill(0);
  for (let i = 0; i < 70000; i++) counts[secureRandom(7)]++;
  for (const c of counts) assert.ok(c > 9300 && c < 10700, `bucket ${c}`);
  assert.equal(secureRandom(1), 0);
  assert.throws(() => secureRandom(0), RangeError);
  assert.throws(() => secureRandom(2 ** 33), RangeError);
});

test('reverse, and the trailing newline follows the input', () => {
  assert.deepEqual(out('a\nb\nc', { reverse: true }), ['c', 'b', 'a']);
  assert.equal(run('b\r\na\r\n', { sort: 'az' }).text, 'a\nb\n');
  assert.equal(run('b\na', { sort: 'az' }).text, 'a\nb');
  assert.equal(run('b\na\n', {}).text, 'b\na\n');
  assert.equal(run('\n\n', { removeEmpty: true }).text, '');
});

test('invalid input: nothing, non-strings and an unknown sort are handled', () => {
  for (const v of ['', null, undefined]) assert.deepEqual(run(v).stats, { linesIn: 0, linesOut: 0, duplicatesRemoved: 0, emptyRemoved: 0 });
  assert.equal(run(null).text, '');
  assert.deepEqual(out(42), ['42']);
  assert.deepEqual(out('b\na', { sort: 'sideways' }), ['b', 'a']);
  assert.deepEqual(out('a', { prefix: null, suffix: undefined }), ['a']);
  assert.deepEqual(SORTS, ['none', 'az', 'za', 'short', 'long', 'natural', 'random']);
});

test('stats: lines in minus empty minus duplicates equals lines out, whatever the options', () => {
  const text = 'b\n\nA\na\n  \nb \nc\n\nB\n';
  for (const trim of [false, true]) for (const removeEmpty of [false, true]) for (const dedupe of [false, true]) for (const caseSensitive of [false, true]) for (const sort of SORTS) {
    const r = run(text, { trim, removeEmpty, dedupe, caseSensitive, sort, number: true, prefix: '>' });
    const s = r.stats;
    assert.equal(s.linesIn, 9);
    assert.equal(s.linesIn - s.emptyRemoved - s.duplicatesRemoved, s.linesOut, JSON.stringify({ trim, removeEmpty, dedupe, caseSensitive, sort }));
    assert.equal(r.lines.length, s.linesOut);
  }
});

test('speed: 50,000 lines are processed quickly with every sort', () => {
  // Typically 20 to 170 ms a sort on a laptop (natural is the slowest); the bound only catches a quadratic regression
  const text = Array.from({ length: 50000 }, (_, i) => `item ${(i * 7919) % 20000} ${i % 3 ? 'x' : '  '}`).join('\n');
  for (const sort of SORTS) {
    const t0 = performance.now();
    const r = run(text, { trim: true, removeEmpty: true, caseSensitive: false, sort, number: true, prefix: '- ', suffix: ';' });
    const ms = performance.now() - t0;
    assert.ok(ms < 5000, `${sort} took ${ms.toFixed(0)} ms`);
    assert.equal(r.stats.linesIn, 50000);
    assert.equal(r.stats.linesIn - r.stats.emptyRemoved - r.stats.duplicatesRemoved, r.stats.linesOut);
  }
});
