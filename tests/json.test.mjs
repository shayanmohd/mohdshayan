import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJson, formatJson, minifyJson, stringifyTree, sortTree, nativeError, positionAt, excerpt, utf8Bytes, countLines, sizeChange, INDENTS, SAMPLE } from '../assets/tools/lib/json.js';

const ch = code => String.fromCharCode(code);
const err = text => { const r = parseJson(text); assert.equal(r.ok, false, `${JSON.stringify(text)} should be invalid`); return r.error; };
const nativeOk = text => { try { JSON.parse(text); return true; } catch (e) { return false; } };
// JSON.parse-based reference for the sort test: keys in code unit order at every depth
const sortNative = v => (Array.isArray(v) ? v.map(sortNative) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortNative(v[k])])) : v);

test('format: the example, with 2 spaces, has the layout JSON.stringify gives but keeps 1.0 as written', () => {
  const r = formatJson(SAMPLE);
  assert.equal(r.ok, true);
  assert.equal(r.text, JSON.stringify(JSON.parse(SAMPLE), null, 2).replace('"version": 1,', '"version": 1.0,'));
  assert.ok(r.text.includes('"version": 1.0,'));
  assert.equal(countLines(r.text), 24);
  assert.equal(r.text.endsWith('\n}'), true);
});

test('sizes: the FAQ figures for the example, 329 bytes formatted, 221 bytes minified, 32.8% saved', () => {
  const formatted = formatJson(SAMPLE).text, minified = minifyJson(SAMPLE).text;
  assert.equal(utf8Bytes(formatted), 329);
  assert.equal(utf8Bytes(minified), 221);
  const c = sizeChange(329, 221);
  assert.equal(c.saved, 108);
  assert.equal(c.percent.toFixed(1), '32.8');
  assert.equal(minified, '{"name":"JSON Formatter","version":1.0,"free":true,"tags":["format","minify","validate","sort"],"author":{"name":"Mohd Shayan","site":"https://mohdshayan.com"},"uploads":null,"limits":{"size":"5 MB","indent":[2,4,"tab"]}}');
  // As pasted the example is 269 bytes, so Minify straight away shows 269 bytes in, 221 bytes out, 17.8% smaller
  assert.equal(utf8Bytes(SAMPLE), 269);
  assert.deepEqual([sizeChange(269, 221).saved, sizeChange(269, 221).percent.toFixed(1)], [48, '17.8']);
});

test('format: 4 spaces and tabs, empty containers stay compact, top-level scalars pass through', () => {
  assert.equal(formatJson('{"a":[],"b":{},"c":[1]}', { indent: '    ' }).text, '{\n    "a": [],\n    "b": {},\n    "c": [\n        1\n    ]\n}');
  assert.equal(formatJson('{"a":{"b":[true]}}', { indent: '\t' }).text, '{\n\t"a": {\n\t\t"b": [\n\t\t\ttrue\n\t\t]\n\t}\n}');
  assert.equal(formatJson(' [ ] ').text, '[]');
  for (const scalar of ['"str"', '42', '-1.5e-3', 'true', 'false', 'null']) {
    assert.equal(formatJson(scalar).text, scalar);
    assert.equal(minifyJson(` ${scalar}\n`).text, scalar);
  }
  assert.deepEqual(INDENTS.map(i => i.indent), ['  ', '    ', '\t']);
});

test('lexemes: numbers, escapes, key order and duplicate keys come out exactly as they went in', () => {
  const text = '{"b": 1.0, "2": 1E+2, "a": -0, "big": 12345678901234567890, "huge": 1e400, "s": "\\u0041\\/\\n", "b": 2}';
  assert.equal(minifyJson(text).text, '{"b":1.0,"2":1E+2,"a":-0,"big":12345678901234567890,"huge":1e400,"s":"\\u0041\\/\\n","b":2}');
  // JSON.parse would move the integer-like key first, round the big number, turn 1e400 into null and keep one "b"
  assert.equal(JSON.stringify(JSON.parse(text)), '{"2":100,"b":2,"a":0,"big":12345678901234567000,"huge":null,"s":"A/\\n"}');
});

test('sort keys: deep, stable for duplicates, by code unit, arrays keep their order, and only when asked', () => {
  const text = '{"b":{"d":1,"c":[{"z":1,"y":2}]},"a":1,"B":2,"10":3,"9":4,"\\u0061":5,"a":6}';
  assert.equal(formatJson(text, { indent: '', sortKeys: true }).text, '{"10":3,"9":4,"B":2,"a":1,"\\u0061":5,"a":6,"b":{"c":[{"y":2,"z":1}],"d":1}}');
  assert.equal(minifyJson(text).text, text);
  assert.equal(formatJson(text).text.indexOf('"b"') < formatJson(text).text.indexOf('"a"'), true);
  assert.equal(stringifyTree(sortTree(parseJson('[3,1,2]').tree)), '[3,1,2]');
  assert.equal(stringifyTree(sortTree(parseJson('"x"').tree)), '"x"');
});

test('errors: line, column and message for the common mistakes (FAQ example first)', () => {
  const cases = [
    ['[1, 2,]', 1, 6, 'Trailing comma: remove the comma before "]"'],
    ['{"a": 1,}', 1, 8, 'Trailing comma: remove the comma before "}"'],
    ["{'a': 1}", 1, 2, 'Strings must use double quotes, not single quotes'],
    ['{a: 1}', 1, 2, 'Object keys must be strings in double quotes: write "a"'],
    ['[1 2]', 1, 4, 'Expected "," or "]" after the value, but found "2"'],
    ['{"a":1 "b":2}', 1, 8, 'Expected "," or "}" after the value, but found "b"'],
    ['{"a" 1}', 1, 6, 'Expected ":" after the key "a", but found "1"'],
    ['{"a": 1 // c\n}', 1, 9, 'Comments are not allowed in JSON'],
    ['[01]', 1, 2, 'Numbers cannot have leading zeros'],
    ['[1.]', 1, 3, 'Expected a digit after the decimal point'],
    ['[1.5.2]', 1, 5, 'Unexpected second "." in a number'],
    ['[1e]', 1, 3, 'Expected a digit in the exponent'],
    ['[.5]', 1, 2, 'Numbers must start with a digit: write 0.5, not .5'],
    ['[+1]', 1, 2, 'Numbers cannot start with "+"'],
    ['[-]', 1, 2, 'Expected a digit after the minus sign'],
    ['[0x1F]', 1, 2, 'Hexadecimal numbers are not allowed in JSON'],
    ['[1_000]', 1, 3, 'Unexpected "_" after a number'],
    ['"abc', 1, 1, 'Unterminated string: the closing double quote is missing'],
    ['"a\nb"', 1, 3, 'Line break inside a string: use \\n for a new line, or close the string before the end of the line'],
    ['"a\tb"', 1, 3, 'Tab inside a string: write it as \\t'],
    ['"a' + ch(1) + 'b"', 1, 3, 'Control character U+0001 inside a string: write it as \\u0001'],
    ['"\\x41"', 1, 2, 'Invalid escape "\\x": the valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX'],
    ['"\\u12G4"', 1, 2, '"\\u" must be followed by four hexadecimal digits'],
    ['[NaN]', 1, 2, '"NaN" is not a valid JSON value'],
    ['[True]', 1, 2, 'Unexpected "True": JSON literals are lower case, write true'],
    ['[trueish]', 1, 2, 'Unexpected word "trueish"'],
    ['[nulls]', 1, 2, 'Unexpected word "nulls"'],
    [ch(0xfeff) + '{}', 1, 1, 'Byte order mark (U+FEFF) before the document: delete this invisible first character'],
    ['{} {}', 1, 4, 'Unexpected "{" after the document ends: a JSON document holds one value'],
    ['[1, 2]]', 1, 7, 'Unexpected "]" after the document ends: a JSON document holds one value'],
    ['{"a": [1, 2}', 1, 12, 'Expected "]" to close the array opened at line 1, column 7, but found "}"'],
    ['{"a":1,]', 1, 8, 'Expected "}" to close the object opened at line 1, column 1, but found "]"'],
    ['[,]', 1, 2, 'Unexpected ",": expected a value'],
    ['[1,,2]', 1, 4, 'Unexpected ",": expected a value'],
    ['{"a":}', 1, 6, 'Expected a value after ":", but found "}"'],
    ['{1:2}', 1, 2, 'Expected a key in double quotes, but found "1"'],
    ['{,}', 1, 2, 'Expected a key in double quotes, but found ","'],
    ['[' + ch(0xa0) + '1]', 1, 2, 'Unexpected U+00A0 (no-break space): JSON allows only spaces, tabs and line breaks between values'],
    ['[' + ch(0xb) + ']', 1, 2, 'Unexpected U+000B (vertical tab): JSON allows only spaces, tabs and line breaks between values'],
    ['[@]', 1, 2, 'Unexpected "@"'],
    ['[1,\n 2,\n 3,\n]', 3, 3, 'Trailing comma: remove the comma before "]"'],
    ['{\r\n  "a": 1\r\n  "b": 2\r\n}', 3, 3, 'Expected "," or "}" after the value, but found "b"'],
  ];
  for (const [text, line, column, message] of cases) {
    const e = err(text);
    assert.deepEqual([e.line, e.column, e.message], [line, column, message], JSON.stringify(text));
  }
});

test('errors: at the end of the document, what was expected and the unclosed container are named', () => {
  assert.equal(err('[1, 2').message, 'Unexpected end of the document: expected "," or "]". The array opened at line 1, column 1 is not closed');
  assert.equal(err('{"a":').message, 'Unexpected end of the document: expected a value. The object opened at line 1, column 1 is not closed');
  assert.equal(err('{"a"').message, 'Unexpected end of the document: expected ":" after the key "a". The object opened at line 1, column 1 is not closed');
  assert.equal(err('{').message, 'Unexpected end of the document: expected a key in double quotes. The object opened at line 1, column 1 is not closed');
  const e = err('{\n  "a": [\n    1,\n');
  assert.deepEqual([e.line, e.column, e.offset], [4, 1, 18]);
  assert.equal(e.message, 'Unexpected end of the document: expected a value. The array opened at line 2, column 8 is not closed');
  assert.equal(err('').message, 'The document is empty');
  assert.equal(err(' \n\t ').message, 'The document is empty');
  assert.deepEqual([err('').line, err('').column, err('').offset], [1, 1, 0]);
});

test('positionAt: LF, CRLF and CR line breaks, columns in characters', () => {
  assert.deepEqual(positionAt('ab\ncd', 4), { line: 2, column: 2 });
  assert.deepEqual(positionAt('ab\r\ncd', 5), { line: 2, column: 2 });
  assert.deepEqual(positionAt('ab\rcd', 4), { line: 2, column: 2 });
  assert.deepEqual(positionAt('a' + String.fromCodePoint(0x1f600) + 'b', 3), { line: 1, column: 3 }); // the emoji is one character, not two code units
  assert.deepEqual(positionAt('x', 1), { line: 1, column: 2 });
  assert.deepEqual(positionAt('', 0), { line: 1, column: 1 });
  assert.deepEqual(positionAt('a\n\n\nb', 4), { line: 4, column: 1 });
});

test('excerpt: the line around the error, cut with ellipses, and the index the caret belongs at', () => {
  assert.deepEqual(excerpt('{"a": 1,}', 7), { line: '{"a": 1,}', caret: 7 });
  assert.deepEqual(excerpt('[1,\n 2,\n 3,\n]', 10), { line: ' 3,', caret: 2 });
  assert.deepEqual(excerpt('[1,\r\n 2,\r\n 3,\r\n]', 12), { line: ' 3,', caret: 2 });
  const middle = excerpt('x'.repeat(200) + '@' + 'y'.repeat(200), 200);
  assert.equal(middle.line.length, 50); // 48 characters plus an ellipsis at each end
  assert.equal(middle.line[middle.caret], '@');
  assert.ok(middle.line.startsWith('…') && middle.line.endsWith('…'));
  const tail = excerpt('x'.repeat(100) + '@', 100);
  assert.deepEqual(tail, { line: `…${'x'.repeat(47)}@`, caret: 48 });
  const head = excerpt('@' + 'y'.repeat(100), 0);
  assert.deepEqual(head, { line: `@${'y'.repeat(47)}…`, caret: 0 });
  assert.deepEqual(excerpt('a\tb' + ch(1) + 'c', 3), { line: 'a b·c', caret: 3 });
  assert.deepEqual(excerpt(ch(0xfeff) + '{}', 0), { line: '·{}', caret: 0 });
  assert.deepEqual(excerpt('ab', 2), { line: 'ab', caret: 2 }); // at the end of the document the caret sits after the last character
  assert.deepEqual(excerpt('', 0), { line: '', caret: 0 });
});

test('validity agrees with JSON.parse for every single-character deletion and insertion in a sample', () => {
  const base = '{"a": [1, 2.5, -3e2, true, false, null, "x\\"y\\\\n\\u00e9", {}, []], "b": {"c": "d", "": 0}, "e": -0.0}';
  const inserts = ['"', ',', ':', '{', '}', '[', ']', ' ', '\n', '\r', '1', '0', 'a', '.', '-', '\\', "'", '/', 'e', '+', '\t', 'u', 'n', 'E'];
  let checked = 0;
  const check = text => {
    const r = parseJson(text);
    assert.equal(r.ok, nativeOk(text), JSON.stringify(text));
    if (r.ok) assert.deepEqual(JSON.parse(stringifyTree(r.tree)), JSON.parse(text), JSON.stringify(text)); // the minified text means the same thing
    checked++;
  };
  check(base);
  for (let i = 0; i <= base.length; i++) {
    if (i < base.length) check(base.slice(0, i) + base.slice(i + 1));
    for (const c of inserts) check(base.slice(0, i) + c + base.slice(i));
  }
  assert.ok(checked > 2000);
});

test('stats: type, length, depth and counts', () => {
  assert.deepEqual(parseJson(SAMPLE).stats, { type: 'object', length: 7, depth: 3, objects: 3, arrays: 2, strings: 9, numbers: 3, booleans: 1, nulls: 1, keys: 11 });
  assert.deepEqual(parseJson('42').stats, { type: 'number', length: 0, depth: 0, objects: 0, arrays: 0, strings: 0, numbers: 1, booleans: 0, nulls: 0, keys: 0 });
  assert.equal(parseJson('[[],{}]').stats.depth, 2);
  assert.deepEqual([parseJson('"s"').stats.type, parseJson('null').stats.type, parseJson('true').stats.type, parseJson('[1]').stats.length], ['string', 'null', 'boolean', 1]);
});

test('strings and whitespace: every escape, lone surrogates, DEL and all four whitespace characters are accepted', () => {
  const text = ' \t\r\n{ "k" : "\\" \\\\ \\/ \\b \\f \\n \\r \\t \\u00e9 \\ud800" ,\n"raw": "' + ch(0xd800) + ch(0x7f) + ch(0x2028) + '" }\r\n';
  assert.equal(nativeOk(text), true);
  assert.equal(minifyJson(text).text, '{"k":"\\" \\\\ \\/ \\b \\f \\n \\r \\t \\u00e9 \\ud800","raw":"' + ch(0xd800) + ch(0x7f) + ch(0x2028) + '"}');
  assert.equal(formatJson('{"a":"x\\"y"}', { indent: '\t' }).text, '{\n\t"a": "x\\"y"\n}');
});

test('helpers: UTF-8 byte counts, line counts and size change', () => {
  assert.equal(utf8Bytes('abc'), 3);
  assert.equal(utf8Bytes('caf' + ch(0xe9)), 5);
  assert.equal(utf8Bytes(ch(0x20b9) + String.fromCodePoint(0x1f600)), 7);
  assert.equal(utf8Bytes(''), 0);
  assert.equal(countLines(''), 0);
  assert.equal(countLines('a'), 1);
  assert.equal(countLines('a\nb'), 2);
  assert.equal(countLines('a\r\nb\rc\n'), 4);
  assert.deepEqual(sizeChange(329, 221), { saved: 108, percent: (108 / 329) * 100 });
  assert.deepEqual(sizeChange(100, 125), { saved: -25, percent: -25 });
  assert.deepEqual(sizeChange(0, 0), { saved: 0, percent: 0 });
});

test('deep nesting: 100,000 levels parse, sort and minify without overflowing the stack', () => {
  const text = '['.repeat(100000) + ']'.repeat(100000);
  const r = parseJson(text);
  assert.equal(r.ok, true);
  assert.equal(r.stats.depth, 100000);
  assert.equal(stringifyTree(sortTree(r.tree)), text);
  const nested = '{"a":'.repeat(5000) + '1' + '}'.repeat(5000);
  const f = formatJson(nested, { sortKeys: true });
  assert.equal(f.ok, true);
  assert.equal(countLines(f.text), 10001);
  assert.equal(err('['.repeat(50000)).message, 'Unexpected end of the document: expected a value. The array opened at line 1, column 50000 is not closed');
});

test('errors: no message ends with a full stop, because the page adds one after it', () => {
  for (const text of ['[1, 2,]', '{"a": 1', '[1, 2', '{"a":', '{', '', ' ', '{} {}', '"abc', '[NaN]', ch(0xfeff) + '{}', '{"a": [1, 2}', '[01]', '[' + ch(0xa0) + ']']) {
    const e = err(text);
    assert.ok(e.message.length > 0 && !e.message.endsWith('.'), `${JSON.stringify(text)}: ${e.message}`);
  }
});

test('result cap: formatJson refuses, before building it, a result longer than maxLength characters', () => {
  const d = 3000, text = '['.repeat(d) + ']'.repeat(d);
  const full = 2 * (d - 1) ** 2 + 4 * d - 2; // the length of d nested arrays formatted with 2 spaces: 18,000,000 here, 200,000,000 for 10,000
  assert.equal(full, 18000000);
  assert.equal(formatJson(text).text.length, full);
  assert.equal(formatJson(text, { maxLength: full }).ok, true);
  const refused = formatJson(text, { maxLength: full - 1 });
  assert.deepEqual([refused.ok, refused.tooLarge, refused.maxLength, refused.stats.depth, 'text' in refused], [false, true, full - 1, d, false]);
  assert.equal(formatJson(text, { indent: '', maxLength: full - 1 }).text, text); // minified it is only 6,000 characters
  assert.equal(formatJson('[1]', { maxLength: 7 }).text, '[\n  1\n]');
  assert.equal(formatJson('[1]', { maxLength: 6 }).tooLarge, true);
  assert.equal(formatJson('"abcd"', { maxLength: 5 }).tooLarge, true);
  assert.equal(formatJson('[1, 2,]', { maxLength: 1 }).error.column, 6); // a parse error still comes first
  assert.equal(stringifyTree(parseJson('[[1]]').tree, '    ', 10), null);
});

test('nativeError: the browser\'s own message, with the position when it names one', () => {
  assert.equal(nativeError('{"a": 1}'), null);
  const e = nativeError('{"a": 1,}'); // V8: "Expected double-quoted property name in JSON at position 8 (line 1 column 9)"
  assert.deepEqual([e.offset, e.line, e.column], [8, 1, 9]);
  assert.ok(e.message.length > 0 && !/at position|\.$/.test(e.message), e.message);
  assert.ok(nativeError('').message.length > 0);
  const m = nativeError('[1, 2,]'); // V8 names no position for this one; a future engine might
  assert.ok(m.message.length > 0);
  if ('offset' in m) assert.ok(m.offset >= 0 && m.offset <= 7 && m.line === 1); else assert.ok(!('line' in m));
});

test('excerpt: the caret index counts code points, so the page can mark the offending character after Hindi, emoji or CJK text', () => {
  for (const text of ['{"नमस्ते": "नमस्ते" "b": 1}', '{"😀": "😀" "b": 1}', '{"日本語": "日本語" "b": 1}', '{"a": "b" "b": 1}']) {
    const e = err(text);
    const x = excerpt(text, e.offset);
    assert.equal(Array.from(x.line).slice(x.caret, x.caret + 3).join(''), '"b"', text);
  }
  const end = excerpt('[1, 2', 5); // an error at the end of the document has no character to mark: the index is one past the last
  assert.equal(Array.from(end.line).length, end.caret);
});

test('performance: a 5 MB document formats in well under a second and matches JSON.stringify', () => {
  const rows = [];
  let size = 0;
  for (let i = 0; size < 4e6; i++) {
    const row = `{"id":${i},"name":"Item ${i}","price":${(i % 97) * 1.25},"tags":["a","b","c"],"ok":${i % 2 ? 'true' : 'false'},"nested":{"x":${i},"y":null}}`;
    rows.push(row);
    size += row.length + 1;
  }
  const doc = `{"items":[${rows.join(',')}],"blob":"${'x'.repeat(1e6)}"}`;
  assert.ok(utf8Bytes(doc) > 5e6);
  const t0 = performance.now();
  const r = formatJson(doc);
  const ms = performance.now() - t0;
  assert.equal(r.ok, true);
  assert.ok(ms < 1500, `took ${ms.toFixed(0)} ms`); // generous, to catch a quadratic step rather than a slow machine
  assert.equal(r.text, JSON.stringify(JSON.parse(doc), null, 2));
  assert.equal(minifyJson(doc).text, doc);
  assert.equal(formatJson(doc, { indent: '\t', sortKeys: true }).text, JSON.stringify(sortNative(JSON.parse(doc)), null, '\t'));
  const bad = parseJson(doc.slice(0, -1));
  assert.deepEqual([bad.error.line, bad.error.column], [1, doc.length]);
});
