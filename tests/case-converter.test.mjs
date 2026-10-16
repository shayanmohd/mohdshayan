import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASES, SMALL_WORDS, splitWords, convertCase, count } from '../assets/tools/lib/case-converter.js';
import { plain } from '../assets/tools/kit.js';

const conv = (text, id) => convertCase(text, id, { locale: 'en' });
const ids = CASES.map(c => c.id);

test('cases: thirteen cases, and each label is an example of its own case', () => {
  assert.equal(CASES.length, 13);
  assert.deepEqual(ids, ['sentence', 'lower', 'upper', 'title', 'capitalised', 'camel', 'pascal', 'snake', 'kebab', 'constant', 'dot', 'alternating', 'inverse']);
  for (const { id, label } of CASES) {
    if (id === 'inverse') assert.equal(conv(label, id), 'Inverse Case');
    else assert.equal(conv(label, id), label, id);
  }
});

test('sentence case: first word of each sentence and line, everything else lowered (FAQ example)', () => {
  assert.equal(conv('wait. what?\nFINE', 'sentence'), 'Wait. What?\nFine');
  assert.equal(conv('i met Mohd in Delhi. NASA agreed!', 'sentence'), 'I met mohd in delhi. Nasa agreed!');
  assert.equal(conv('i met Mohd at NASA', 'sentence'), 'I met mohd at nasa');
  assert.equal(conv('he said "stop." then left', 'sentence'), 'He said "stop." Then left');
});

test('sentence case: abbreviations, decimals and numbered lines', () => {
  assert.equal(conv('e.g. apples cost 3.14 each', 'sentence'), 'E.g. Apples cost 3.14 each');
  assert.equal(conv('1. first item\n3rd place', 'sentence'), '1. First item\n3rd place');
  assert.equal(conv('note: this stays lower', 'sentence'), 'Note: this stays lower');
});

test('upper and lower case are Unicode-aware (FAQ example)', () => {
  assert.equal(conv('café straße', 'upper'), 'CAFÉ STRASSE');
  assert.equal(conv('καλημέρα', 'upper'), 'ΚΑΛΗΜΈΡΑ');
  assert.equal(conv('ÉCOLE Ñandú', 'lower'), 'école ñandú');
  assert.equal(conv('नमस्ते 你好', 'upper'), 'नमस्ते 你好');
});

test('locale is passed through to the case mapping', () => {
  assert.equal(convertCase('istanbul', 'upper', { locale: 'tr' }), 'İSTANBUL');
  assert.equal(convertCase('istanbul', 'upper', { locale: 'en' }), 'ISTANBUL');
  assert.equal(convertCase('istanbul', 'upper'), 'ISTANBUL');
});

test('title case: small words stay lower unless first or last in a line, or after a sentence end (FAQ example)', () => {
  assert.equal(conv('the lord of the rings', 'title'), 'The Lord of the Rings');
  assert.equal(conv('a tale of two cities', 'title'), 'A Tale of Two Cities');
  assert.equal(conv('what it is for', 'title'), 'What It Is For');
  assert.equal(conv('a tale. of mice and men: a story', 'title'), 'A Tale. Of Mice and Men: A Story');
  assert.equal(conv('the end\nof the line', 'title'), 'The End\nOf the Line');
  const middle = SMALL_WORDS.join(' ');
  assert.equal(conv(`x ${middle} y`, 'title'), `X ${middle} Y`);
});

test('title and capitalised case: apostrophes, hyphens, accents and digits', () => {
  assert.equal(conv("don't stop the state-of-the-art 3rd élan", 'title'), "Don't Stop the State-of-the-Art 3rd Élan");
  assert.equal(conv('the lord of the rings', 'capitalised'), 'The Lord Of The Rings');
  assert.equal(conv("hello WORLD, it's 'quoted'", 'capitalised'), "Hello World, It's 'Quoted'");
});

test('splitWords: spaces, punctuation and camel boundaries (spec vectors)', () => {
  assert.deepEqual(splitWords('userID number'), ['user', 'ID', 'number']);
  assert.deepEqual(splitWords('XMLHttpRequest'), ['XML', 'Http', 'Request']);
  assert.deepEqual(splitWords('getHTTPResponseCode'), ['get', 'HTTP', 'Response', 'Code']);
  assert.deepEqual(splitWords('  version 2.0 (beta)!'), ['version', '2', '0', 'beta']);
  assert.deepEqual(splitWords("don't stop, rock 'n' roll"), ['dont', 'stop', 'rock', 'n', 'roll']);
  assert.deepEqual(splitWords('café menu'), ['café', 'menu']);
  assert.deepEqual(splitWords('caféMenu'), ['café', 'Menu']);
  assert.deepEqual(splitWords(''), []);
  assert.deepEqual(splitWords(' - - '), []);
});

test('code cases: the spec vectors in every separator style', () => {
  assert.equal(conv('userID number', 'snake'), 'user_id_number');
  assert.equal(conv('XMLHttpRequest', 'snake'), 'xml_http_request');
  assert.equal(conv('userID number', 'kebab'), 'user-id-number');
  assert.equal(conv('userID number', 'constant'), 'USER_ID_NUMBER');
  assert.equal(conv('userID number', 'dot'), 'user.id.number');
  assert.equal(conv('XMLHttpRequest', 'camel'), 'xmlHttpRequest');
  assert.equal(conv('XMLHttpRequest', 'pascal'), 'XmlHttpRequest');
  assert.equal(conv('hello world', 'camel'), 'helloWorld');
  assert.equal(conv('  leading spaces and -- punctuation!', 'pascal'), 'LeadingSpacesAndPunctuation');
  assert.equal(conv("don't stop", 'snake'), 'dont_stop');
  assert.equal(conv('version 2.0 (beta)', 'snake'), 'version_2_0_beta');
});

test('code cases work line by line and keep blank lines and CRLF', () => {
  assert.equal(conv('first line\nsecond line', 'snake'), 'first_line\nsecond_line');
  assert.equal(conv('a b\r\nc d', 'kebab'), 'a-b\r\nc-d');
  assert.equal(conv('a b\n\n  \nc d', 'camel'), 'aB\n\n\ncD');
});

test('alternating case restarts at each word and skips non-letters', () => {
  assert.equal(conv('alternating case', 'alternating'), 'aLtErNaTiNg cAsE');
  assert.equal(conv("don't 2b", 'alternating'), "dOn'T 2b");
  assert.equal(conv('SPONGE BOB\nmock', 'alternating'), 'sPoNgE bOb\nmOcK');
});

test('inverse case swaps every letter and leaves the rest', () => {
  assert.equal(conv('Hello World 123 !?', 'inverse'), 'hELLO wORLD 123 !?');
  assert.equal(conv('Inverse Case', 'inverse'), 'iNVERSE cASE');
  assert.equal(conv(conv('Mixed Case Text', 'inverse'), 'inverse'), 'Mixed Case Text');
  assert.equal(conv('Éé', 'inverse'), 'éÉ');
});

test('every case keeps line breaks and handles empty input', () => {
  for (const id of ids) {
    assert.equal(conv('', id), '', id);
    assert.equal(conv('\n\n', id), '\n\n', id);
    const out = conv('one two\r\nthree. four\n\nfive', id);
    assert.deepEqual(out.match(/\r\n|\n/g), ['\r\n', '\n', '\n'], id);
  }
});

test('invalid input: unknown case throws, non-strings are coerced', () => {
  assert.throws(() => convertCase('x', 'shouty'), RangeError);
  assert.throws(() => convertCase('x'), RangeError);
  assert.equal(convertCase(null, 'upper'), '');
  assert.equal(convertCase(undefined, 'lower'), '');
  assert.equal(convertCase(42, 'snake'), '42');
  assert.equal(convertCase('x', 'upper', { locale: '' }), 'X');
});

test('count: words and characters', () => {
  assert.deepEqual(count('hello world'), { words: 2, characters: 11 });
  assert.deepEqual(count(''), { words: 0, characters: 0 });
  assert.deepEqual(count('user_id and kebab-case, dot.case'), { words: 5, characters: 32 });
  assert.deepEqual(count("don't 👍 café"), { words: 2, characters: 12 });
  assert.deepEqual(count('a\r\nb'), { words: 2, characters: 4 });
  assert.equal(count(null).words, 0);
});

test('page stats group counts in thousands, like the word counter, not in lakhs', () => {
  // The kit's default is the rupee lakh grouping; the page passes 'USD' so the visitor's own grouping applies.
  assert.equal(plain(100000, 0), '1,00,000');
  assert.equal(plain(100000, 0, 'USD'), '100,000');
  const page = readFileSync(new URL('../assets/tools/case-converter.js', import.meta.url), 'utf8');
  assert.match(page, /plain\(n, 0, 'USD'\)/, 'the stats formatter must pass USD');
});

test('reference table: the glance sample converts as the page shows', () => {
  const sample = 'Hello world, from the Case Converter';
  assert.deepEqual(ids.map(id => conv(sample, id)), [
    'Hello world, from the case converter',
    'hello world, from the case converter',
    'HELLO WORLD, FROM THE CASE CONVERTER',
    'Hello World, From the Case Converter',
    'Hello World, From The Case Converter',
    'helloWorldFromTheCaseConverter',
    'HelloWorldFromTheCaseConverter',
    'hello_world_from_the_case_converter',
    'hello-world-from-the-case-converter',
    'HELLO_WORLD_FROM_THE_CASE_CONVERTER',
    'hello.world.from.the.case.converter',
    'hElLo wOrLd, fRoM tHe cAsE cOnVeRtEr',
    'hELLO WORLD, FROM THE cASE cONVERTER',
  ]);
});
