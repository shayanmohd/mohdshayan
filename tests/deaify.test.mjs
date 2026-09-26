// Port of shayanmohd/deAIfy test/deaify/core.test.ts, plus checks for the web port's diff and flag finder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deaify, diffTexts, findFlags } from '../assets/tools/lib/deaify.js';

const ch = code => String.fromCharCode(code);
const EM = ch(0x2014), EN = ch(0x2013), LDQUO = ch(0x201c), RDQUO = ch(0x201d), LSQUO = ch(0x2018), RSQUO = ch(0x2019);
const NBSP = ch(0x00a0), ZWSP = ch(0x200b), BOM = ch(0xfeff);

test('dashes: em dash to comma', () => {
  assert.equal(deaify(`A ${EM} B`, { dashes: 'comma' }).text, 'A, B');
  assert.equal(deaify(`A${EM}B`, { dashes: 'comma' }).text, 'A, B');
});
test('dashes: spaced hyphen, plain hyphen, off', () => {
  assert.equal(deaify(`A ${EM} B`, { dashes: 'spacedHyphen' }).text, 'A - B');
  assert.equal(deaify(`A${EN}B`, { dashes: 'hyphen' }).text, 'A-B');
  assert.equal(deaify(`A ${EM} B`, { dashes: 'off' }).text, `A ${EM} B`);
});
test('dashes: a bulleted dash line is not merged into the previous line', () => {
  assert.equal(deaify(`Intro\n${EM} item`, { dashes: 'spacedHyphen' }).text, 'Intro\n - item');
});
test('quotes: curly quotes and apostrophes straightened', () => {
  assert.equal(deaify(`${LDQUO}He${RSQUO}s ${LSQUO}in${RSQUO}${RDQUO}`, { quotes: true }).text, `"He's 'in'"`);
});
test('spaces: NBSP becomes a space, zero-width characters removed', () => {
  assert.equal(deaify(`a${NBSP}b${ZWSP}c${BOM}`, { spaces: true }).text, 'a bc');
});
test('filler: flag mode records without changing text', () => {
  const input = 'We delve into the tapestry.';
  const r = deaify(input, { fillerWords: 'flag', dashes: 'off' });
  assert.equal(r.text, input);
  assert.equal(r.counts.filler, 2);
});
test('filler: soften replaces buzzwords and removes transitions', () => {
  assert.equal(deaify('We delve into it.', { fillerWords: 'soften' }).text, 'We look into it.');
  assert.equal(deaify('In conclusion, the results are clear.', { fillerWords: 'soften' }).text, 'The results are clear.');
});
test('filler: consecutive duplicate openers do not corrupt text', () => {
  assert.equal(deaify('Moreover, moreover works.', { fillerWords: 'soften' }).text, 'Works.');
  assert.equal(deaify('Additionally additionally the plan is done.', { fillerWords: 'soften' }).text, 'The plan is done.');
});
test('filler: punctuation healed around deletions', () => {
  assert.equal(deaify('The plan works, moreover.', { fillerWords: 'soften' }).text, 'The plan works.');
  assert.equal(deaify('Moreover. We ship.', { fillerWords: 'soften' }).text, 'We ship.');
  assert.equal(deaify('Moreover; we ship.', { fillerWords: 'soften' }).text, 'We ship.');
  assert.equal(deaify('Moreover! We ship.', { fillerWords: 'soften' }).text, 'We ship.');
});
test('filler: phrase-level softening and comma kept before following words', () => {
  assert.equal(deaify('It shows a myriad of benefits.', { fillerWords: 'soften' }).text, 'It shows many benefits.');
  assert.equal(deaify('We have a plethora of options.', { fillerWords: 'soften' }).text, 'We have plenty of options.');
  assert.equal(deaify("In this landscape, it's important to note that clear writing wins.", { fillerWords: 'soften' }).text, 'In this landscape, clear writing wins.');
  assert.equal(deaify('Ship it, moreover, today.', { fillerWords: 'soften' }).text, 'Ship it, today.');
  assert.equal(deaify('We will moreover ship.', { fillerWords: 'soften' }).text, 'We will ship.');
});
test('filler: a bare newline is not a sentence boundary', () => {
  assert.equal(deaify('This is a long line\nmoreover it continues.', { fillerWords: 'soften' }).text, 'This is a long line\nit continues.');
});
test('filler: curly apostrophe phrases match when quotes are left alone', () => {
  const r = deaify(`It${RSQUO}s important to note that tests pass.`, { fillerWords: 'soften', quotes: false });
  assert.equal(r.text, 'Tests pass.');
});
test('protectCode: inline code untouched while prose is cleaned', () => {
  const input = `Text ${EM} here \`const x = a ${EM} b\` and ${LDQUO}quote${RDQUO}`;
  const r = deaify(input, { dashes: 'comma', quotes: true, protectCode: true });
  assert.ok(r.text.includes(`\`const x = a ${EM} b\``));
  assert.ok(r.text.includes('Text, here'));
  assert.ok(r.text.includes('"quote"'));
});
test('protectCode: fenced blocks and URLs untouched', () => {
  const r = deaify('Before\n```\nlet s = ' + LDQUO + 'x' + RDQUO + '\n```\nAfter', { quotes: true });
  assert.ok(r.text.includes(LDQUO + 'x' + RDQUO));
  const url = `https://example.com/a${EN}b`;
  assert.ok(deaify(`See ${url} now`, { dashes: 'comma' }).text.includes(url));
});
test('protectCode: literal sentinel characters cannot corrupt restored code', () => {
  const r = deaify('see `code` and ' + ch(0xe000) + '0' + ch(0xe001) + ' literal', { protectCode: true, quotes: true });
  assert.equal(r.text.match(/`code`/g).length, 1);
});
test('idempotence: applying twice equals applying once', () => {
  const input = `${LDQUO}We${RSQUO}ll delve${EM}${NBSP}into${ZWSP} the tapestry.${RDQUO} Moreover, it works.`;
  const opts = { dashes: 'comma', quotes: true, spaces: true, fillerWords: 'soften' };
  const once = deaify(input, opts).text;
  assert.equal(deaify(once, opts).text, once);
});
test('diff: segments rebuild both sides', () => {
  const pairs = [['a b c', 'a X c'], ['', 'new text'], ['old', ''], ['same', 'same'],
    [`One ${EM} two.\nThree ${LDQUO}four${RDQUO}.`, 'One - two.\nThree "four".'], ['x\ny', 'x y z']];
  for (const [a, b] of pairs) {
    const segs = diffTexts(a, b);
    assert.equal(segs.filter(s => !s.added).map(s => s.value).join(''), a, `old side of ${JSON.stringify(a)}`);
    assert.equal(segs.filter(s => !s.removed).map(s => s.value).join(''), b, `new side of ${JSON.stringify(b)}`);
  }
  const s = diffTexts('a b c', 'a X c');
  assert.ok(s.some(x => x.removed) && s.some(x => x.added));
});
test('diff: long documents stay fast and exact', () => {
  const para = `The team will delve into the data ${EM} carefully ${EM} and ${LDQUO}leverage${RDQUO} it.`;
  const input = Array.from({ length: 800 }, (_, i) => `${i}. ${para}`).join('\n');
  const out = deaify(input, { fillerWords: 'soften' }).text;
  const t0 = Date.now();
  const segs = diffTexts(input, out);
  assert.ok(Date.now() - t0 < 2000, 'diff took too long');
  assert.equal(segs.filter(s => !s.removed).map(s => s.value).join(''), out);
});
test('findFlags: finds phrases but not inside code', () => {
  const text = 'We delve here. `delve()` is code. Moreover, see https://x.io/tapestry';
  const hits = findFlags(text).map(h => text.slice(h.start, h.end));
  assert.deepEqual(hits, ['delve', 'Moreover']);
});
