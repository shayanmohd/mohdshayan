// JSON formatter: validates, pretty-prints, minifies and sorts JSON text by working on its tokens rather than
// through JSON.parse, so numbers, escape sequences, key order and duplicate keys come out exactly as they went in.
// An error carries the offset of the first problem, so the page can show its line, its column and an excerpt.
// Pure functions, no DOM.

export const INDENTS = [
  { id: '2', label: '2 spaces', indent: '  ' },
  { id: '4', label: '4 spaces', indent: '    ' },
  { id: 'tab', label: 'Tab', indent: '\t' },
];

// The example the page offers. The FAQ quotes its formatted and minified sizes, so the tests check them.
export const SAMPLE = '{ "name": "JSON Formatter",\n    "version": 1.0, "free": true,\n  "tags": ["format", "minify",\n      "validate", "sort"],\n' +
  '  "author": { "name": "Mohd Shayan", "site": "https://mohdshayan.com" },\n  "uploads": null,\n  "limits": { "size": "5 MB", "indent": [2, 4, "tab"] }\n}';

const NUMBER = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
const WORD = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const UNCLEAN = /[\\\u0000-\u001f]/; // a string needs the slow scan only when it holds an escape or a control character
const HEX4 = /^[0-9a-fA-F]{4}$/;
const NAMED = { 0xa0: 'no-break space', 0x85: 'next line', 0xb: 'vertical tab', 0xc: 'form feed', 0x200b: 'zero-width space',
  0x2028: 'line separator', 0x2029: 'paragraph separator', 0xfeff: 'byte order mark' };

const hex = c => `U+${c.toString(16).toUpperCase().padStart(4, '0')}`;
const isWordChar = c => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36;
/** A token as an error message shows it: strings keep their own quotes, anything else is quoted, long ones are cut. */
const show = tok => { const t = tok.length > 24 ? `${tok.slice(0, 23)}…` : tok; return tok[0] === '"' ? t : `"${t}"`; };
/** `"@"` for a printable character, `U+00A0 (no-break space)` for an invisible one. */
function describeChar(s, i) {
  const cp = s.codePointAt(i);
  if (NAMED[cp]) return `${hex(cp)} (${NAMED[cp]})`;
  if (cp < 32 || (cp >= 127 && cp <= 159)) return hex(cp);
  return `"${String.fromCodePoint(cp)}"`;
}

/** Line and column (both from 1) of an offset. CRLF is one line break; the column counts characters, not UTF-16 units. */
export function positionAt(text, offset) {
  const s = String(text ?? '');
  const at = Math.max(0, Math.min(Number(offset) || 0, s.length));
  let line = 1, lineStart = 0;
  for (let i = 0; i < at; i++) {
    const c = s.charCodeAt(i);
    if (c === 10 || (c === 13 && s.charCodeAt(i + 1) !== 10)) { line++; lineStart = i + 1; }
  }
  let column = 1;
  for (const _ of s.slice(lineStart, at)) column++;
  return { line, column };
}

/** End of a string token that starts at s[i]: the index after the closing quote, or [offset, message]. */
function scanString(s, i) {
  const q = s.indexOf('"', i + 1);
  if (q !== -1 && !UNCLEAN.test(s.slice(i + 1, q))) return q + 1;
  for (let j = i + 1; j < s.length; j++) {
    const c = s.charCodeAt(j);
    if (c === 34) return j + 1;
    if (c === 92) {
      const e = s[j + 1];
      if (e === undefined) break;
      if (e === 'u') {
        if (!HEX4.test(s.slice(j + 2, j + 6))) return [j, '"\\u" must be followed by four hexadecimal digits'];
        j += 5;
      } else if ('"\\/bfnrt'.includes(e)) j++;
      else return [j, `Invalid escape "\\${e}": the valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX`];
    } else if (c < 32) {
      if (c === 10 || c === 13) return [j, 'Line break inside a string: use \\n for a new line, or close the string before the end of the line'];
      if (c === 9) return [j, 'Tab inside a string: write it as \\t'];
      return [j, `Control character ${hex(c)} inside a string: write it as \\u${c.toString(16).padStart(4, '0')}`];
    }
  }
  return [i, 'Unterminated string: the closing double quote is missing'];
}

/** What is wrong with the character glued to the end of a number token, if anything: [offset, message] or null. */
function numberGlue(s, i, tok) {
  const c = s.charCodeAt(i);
  if (c >= 48 && c <= 57) return [i - tok.length, 'Numbers cannot have leading zeros']; // only "0" or "-0" can be followed by a digit
  if (c === 46) return [i, tok.includes('.') ? 'Unexpected second "." in a number' : 'Expected a digit after the decimal point'];
  if (c === 101 || c === 69) return [i, /[eE]/.test(tok) ? `Unexpected "${s[i]}" in a number` : 'Expected a digit in the exponent'];
  if ((c === 120 || c === 88) && (tok === '0' || tok === '-0')) return [i - tok.length, 'Hexadecimal numbers are not allowed in JSON'];
  if (isWordChar(c)) return [i, `Unexpected "${s[i]}" after a number`];
  return null;
}

/** Explains a character that cannot start a token: [offset, message]. */
function diagnose(s, i, state) {
  const c = s.charCodeAt(i);
  if (c === 0xfeff && i === 0) return [0, 'Byte order mark (U+FEFF) before the document: delete this invisible first character'];
  if (c === 39) return [i, 'Strings must use double quotes, not single quotes'];
  if (c === 47 && (s[i + 1] === '/' || s[i + 1] === '*')) return [i, 'Comments are not allowed in JSON'];
  if (c === 43) return [i, 'Numbers cannot start with "+"'];
  if (c === 46) return [i, 'Numbers must start with a digit: write 0.5, not .5'];
  WORD.lastIndex = i;
  const m = WORD.exec(s);
  if (m) {
    const w = m[0], lower = w.toLowerCase();
    if (lower === 'true' || lower === 'false' || lower === 'null') return [i, `Unexpected "${w}": JSON literals are lower case, write ${lower}`];
    if (w === 'NaN' || w === 'Infinity' || w === 'undefined') return [i, `"${w}" is not a valid JSON value`];
    if (state === 'key' || state === 'keyOrEnd') return [i, `Object keys must be strings in double quotes: write "${w}"`];
    return [i, `Unexpected word "${w}"`];
  }
  const cp = s.codePointAt(i);
  return [i, `Unexpected ${describeChar(s, i)}${NAMED[cp] ? ': JSON allows only spaces, tabs and line breaks between values' : ''}`];
}

/**
 * Parses JSON text into an ordered tree that keeps every lexeme: a scalar is its source text (`"café"`, `1.50`,
 * `true`), an array is a JS array of nodes and an object is { keys, values } with the key lexemes in source order.
 * Returns { ok: true, tree, stats } or { ok: false, error: { message, offset, line, column } } for the first problem.
 * stats: { type, length, depth, objects, arrays, strings, numbers, booleans, nulls, keys }.
 */
export function parseJson(text) {
  const s = String(text ?? '');
  const n = s.length;
  const stats = { depth: 0, objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, keys: 0 };
  const stack = []; // open containers, innermost last: { node, isObject, open, key }
  let root = null;
  let state = 'value'; // what the grammar expects next
  let lastComma = -1; // offset of the comma just consumed, for trailing-comma messages
  let i = 0;

  const fail = (offset, message) => ({ ok: false, error: { message, offset, ...positionAt(s, offset) } });
  const frame = () => stack[stack.length - 1];
  const opened = f => { const p = positionAt(s, f.open); return `${f.isObject ? 'object' : 'array'} opened at line ${p.line}, column ${p.column}`; };
  const closer = f => (f.isObject ? '"}"' : '"]"');
  const attach = node => {
    const f = frame();
    if (!f) root = node;
    else if (f.isObject) { f.node.keys.push(f.key); f.node.values.push(node); }
    else f.node.push(node);
  };
  const close = () => { stack.pop(); state = stack.length ? 'commaOrEnd' : 'end'; };
  const expecting = () => {
    const f = frame();
    if (state === 'colon') return `expected ":" after the key ${show(f.key)}`;
    if (state === 'commaOrEnd') return `expected "," or ${closer(f)}`;
    if (state === 'key' || state === 'keyOrEnd') return 'expected a key in double quotes';
    return 'expected a value';
  };

  for (;;) {
    while (i < n) { const c = s.charCodeAt(i); if (c === 32 || c === 10 || c === 13 || c === 9) i++; else break; }
    if (i >= n) {
      if (state === 'end') break;
      if (!stack.length) return fail(0, 'The document is empty');
      return fail(n, `Unexpected end of the document: ${expecting()}. The ${opened(frame())} is not closed`);
    }
    if (state === 'end') return fail(i, `Unexpected ${describeChar(s, i)} after the document ends: a JSON document holds one value`);
    const c = s.charCodeAt(i);
    const start = i;
    let tok, kind; // kind: punct, string, number, boolean or null
    if (c === 123 || c === 125 || c === 91 || c === 93 || c === 58 || c === 44) { tok = s[i]; kind = 'punct'; i++; }
    else if (c === 34) {
      const r = scanString(s, i);
      if (typeof r !== 'number') return fail(r[0], r[1]);
      tok = s.slice(i, r); kind = 'string'; i = r;
    } else if (c === 45 || (c >= 48 && c <= 57)) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(s);
      if (!m) return fail(i, 'Expected a digit after the minus sign');
      tok = m[0]; kind = 'number'; i += tok.length;
      const glued = numberGlue(s, i, tok);
      if (glued) return fail(glued[0], glued[1]);
    } else if (c === 116 || c === 102 || c === 110) {
      const word = c === 116 ? 'true' : c === 102 ? 'false' : 'null';
      if (!s.startsWith(word, i) || isWordChar(s.charCodeAt(i + word.length))) return fail(...diagnose(s, i, state));
      tok = word; kind = word === 'null' ? 'null' : 'boolean'; i += word.length;
    } else return fail(...diagnose(s, i, state));

    switch (state) {
      case 'value':
      case 'valueOrEnd': {
        if (kind !== 'punct') {
          attach(tok);
          if (kind === 'string') stats.strings++; else if (kind === 'number') stats.numbers++; else if (kind === 'boolean') stats.booleans++; else stats.nulls++;
          state = stack.length ? 'commaOrEnd' : 'end';
          break;
        }
        if (tok === '{' || tok === '[') {
          const isObject = tok === '{';
          const node = isObject ? { keys: [], values: [] } : [];
          attach(node);
          stack.push({ node, isObject, open: start, key: '' });
          if (stack.length > stats.depth) stats.depth = stack.length;
          stats[isObject ? 'objects' : 'arrays']++;
          state = isObject ? 'keyOrEnd' : 'valueOrEnd';
          break;
        }
        if (tok === ']' && state === 'valueOrEnd') { close(); break; }
        const f = frame();
        if (!f) return fail(start, `Unexpected ${show(tok)}: expected a value`);
        if (f.isObject) return fail(start, `Expected a value after ":", but found ${show(tok)}`);
        if (tok === ']') return fail(lastComma, 'Trailing comma: remove the comma before "]"');
        if (tok === '}') return fail(start, `Expected "]" to close the ${opened(f)}, but found "}"`);
        return fail(start, `Unexpected ${show(tok)}: expected a value`);
      }
      case 'keyOrEnd':
      case 'key': {
        if (kind === 'string') { frame().key = tok; stats.keys++; state = 'colon'; break; }
        if (kind === 'punct' && tok === '}') {
          if (state === 'keyOrEnd') { close(); break; }
          return fail(lastComma, 'Trailing comma: remove the comma before "}"');
        }
        if (kind === 'punct' && tok === ']') return fail(start, `Expected "}" to close the ${opened(frame())}, but found "]"`);
        return fail(start, `Expected a key in double quotes, but found ${show(tok)}`);
      }
      case 'colon': {
        if (kind === 'punct' && tok === ':') { state = 'value'; break; }
        return fail(start, `Expected ":" after the key ${show(frame().key)}, but found ${show(tok)}`);
      }
      default: { // commaOrEnd
        const f = frame();
        if (kind === 'punct') {
          if (tok === ',') { lastComma = start; state = f.isObject ? 'key' : 'value'; break; }
          if (tok === (f.isObject ? '}' : ']')) { close(); break; }
          if (tok === '}' || tok === ']') return fail(start, `Expected ${closer(f)} to close the ${opened(f)}, but found "${tok}"`);
        }
        return fail(start, `Expected "," or ${closer(f)} after the value, but found ${show(tok)}`);
      }
    }
  }
  const type = Array.isArray(root) ? 'array' : typeof root !== 'string' ? 'object'
    : root[0] === '"' ? 'string' : root === 'null' ? 'null' : root === 'true' || root === 'false' ? 'boolean' : 'number';
  const length = type === 'array' ? root.length : type === 'object' ? root.keys.length : 0;
  return { ok: true, tree: root, stats: { type, length, ...stats } };
}

/**
 * Writes a tree back out. indent '' minifies; otherwise each level is indented by it and keys are followed by ": ".
 * Returns null, before building anything large, when the result would be longer than maxLength characters: ten
 * thousand nested arrays formatted with 4 spaces would be a 400 MB string.
 */
export function stringifyTree(root, indent = '', maxLength = Infinity) {
  if (typeof root === 'string') return root.length > maxLength ? null : root;
  const out = [];
  let length = 0;
  const push = s => { out.push(s); length += s.length; };
  const colon = indent ? ': ' : ':';
  const pads = []; // pads[d] is a line break followed by d indents
  const pad = d => { while (pads.length <= d) pads.push(`\n${indent.repeat(pads.length)}`); return indent ? pads[d] : ''; };
  // An explicit stack instead of recursion, so a deeply nested document cannot overflow the call stack
  const stack = [];
  const enter = node => {
    const arr = Array.isArray(node);
    const len = arr ? node.length : node.keys.length;
    if (!len) { push(arr ? '[]' : '{}'); return; }
    push(arr ? '[' : '{');
    stack.push({ node, arr, len, i: 0 });
  };
  enter(root);
  while (stack.length) {
    if (length > maxLength) return null;
    const f = stack[stack.length - 1];
    if (f.i === f.len) { push(pad(stack.length - 1)); push(f.arr ? ']' : '}'); stack.pop(); continue; }
    if (f.i) push(',');
    push(pad(stack.length));
    if (!f.arr) { push(f.node.keys[f.i]); push(colon); }
    const child = f.arr ? f.node[f.i] : f.node.values[f.i];
    f.i++;
    if (typeof child === 'string') push(child); else enter(child);
  }
  return length > maxLength ? null : out.join('');
}

// Keys compare by their decoded text, so "a" sorts as "a"; a key without escapes is just its lexeme unquoted
const decodeKey = lexeme => (lexeme.indexOf('\\') === -1 ? lexeme.slice(1, -1) : JSON.parse(lexeme));

/**
 * Sorts the keys of every object in the tree, in place, and returns the tree. Keys order by UTF-16 code unit
 * (the order < gives for strings), so "B" comes before "a" and "10" before "9"; duplicate keys keep their
 * relative order; arrays keep theirs.
 */
export function sortTree(root) {
  const todo = [root];
  while (todo.length) {
    const node = todo.pop();
    if (typeof node === 'string') continue;
    if (Array.isArray(node)) { for (const c of node) if (typeof c !== 'string') todo.push(c); continue; }
    const { keys, values } = node;
    const order = keys.map((k, i) => ({ key: decodeKey(k), i })).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : a.i - b.i));
    node.keys = order.map(o => keys[o.i]);
    node.values = order.map(o => values[o.i]);
    for (const v of node.values) if (typeof v !== 'string') todo.push(v);
  }
  return root;
}

/**
 * Formats JSON text: { ok: true, text, stats }, the parse error, or { ok: false, tooLarge: true, maxLength, stats } when
 * the result would be longer than maxLength characters. indent is the string for one level ('' minifies); sortKeys
 * sorts the keys of every object first. Only whitespace between tokens changes unless keys are sorted.
 */
export function formatJson(text, { indent = '  ', sortKeys = false, maxLength = Infinity } = {}) {
  const r = parseJson(text);
  if (!r.ok) return r;
  const out = stringifyTree(sortKeys ? sortTree(r.tree) : r.tree, indent, maxLength);
  if (out === null) return { ok: false, tooLarge: true, maxLength, stats: r.stats };
  return { ok: true, text: out, stats: r.stats };
}
export const minifyJson = text => formatJson(text, { indent: '' });

/**
 * The browser's own verdict, for when the scanner cannot give one: JSON.parse's message, with the position when the
 * message names one (Chrome and Node say "at position N"). null when JSON.parse accepts the text.
 */
export function nativeError(text) {
  const s = String(text ?? '');
  try { JSON.parse(s); return null; } catch (e) {
    const raw = String((e && e.message) || e);
    const p = /\bat position (\d+)/.exec(raw);
    const message = raw.replace(/ at position \d+.*$/, '').replace(/\.$/, '');
    if (!p) return { message };
    const offset = Math.min(Number(p[1]), s.length);
    return { message, offset, ...positionAt(s, offset) };
  }
}

/**
 * The line around an offset, cut to about `width` characters with "…" where it was cut, and the index the caret
 * belongs at. Tabs become spaces and other control or zero-width characters "·", so each character takes one column.
 */
export function excerpt(text, offset, width = 48) {
  const s = String(text ?? '');
  const at = Math.max(0, Math.min(Number(offset) || 0, s.length));
  const start = at === 0 ? 0 : Math.max(s.lastIndexOf('\n', at - 1), s.lastIndexOf('\r', at - 1)) + 1;
  const ends = [s.indexOf('\n', at), s.indexOf('\r', at)].filter(e => e !== -1);
  const end = ends.length ? Math.min(...ends) : s.length;
  // Only the characters near the offset are split into code points: the line may be a whole minified document
  const lo = Math.max(start, at - width * 2), hi = Math.min(end, at + width * 2);
  const leftAll = Array.from(s.slice(lo, at)), rightAll = Array.from(s.slice(at, hi));
  const half = Math.floor(width / 2);
  let left = leftAll.slice(Math.max(0, leftAll.length - half));
  const right = rightAll.slice(0, width - left.length);
  if (right.length < width - left.length) left = leftAll.slice(Math.max(0, leftAll.length - (width - right.length)));
  const cutLeft = lo > start || left.length < leftAll.length;
  const cutRight = hi < end || right.length < rightAll.length;
  const visible = ch => (ch === '\t' ? ' ' : /[\u0000-\u001f\u007f-\u009f\u200b\u2028\u2029\ufeff]/.test(ch) ? '·' : ch);
  const line = `${cutLeft ? '…' : ''}${left.map(visible).join('')}${right.map(visible).join('')}${cutRight ? '…' : ''}`;
  return { line, caret: left.length + (cutLeft ? 1 : 0) };
}

const encoder = new TextEncoder();
/** Size of the text in bytes when saved as UTF-8. */
export const utf8Bytes = text => encoder.encode(String(text ?? '')).length;

/** Lines as an editor counts them: line breaks plus one, and none for empty text. */
export function countLines(text) {
  const s = String(text ?? '');
  if (!s) return 0;
  let lines = 1;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 10 || (c === 13 && s.charCodeAt(i + 1) !== 10)) lines++;
  }
  return lines;
}

/** Bytes saved going from one size to another and the saving as a percentage of the original (negative when it grew). */
export function sizeChange(before, after) {
  const saved = before - after;
  return { saved, percent: before > 0 ? (saved / before) * 100 : 0 };
}
