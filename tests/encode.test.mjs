import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CODECS, URL_RESERVED, run, measure, base64Encode, base64Decode, urlEncode, urlDecode, htmlEncode, htmlDecode, hexEncode, hexDecode } from '../assets/tools/lib/encode.js';

// Expected values were worked out separately with Python (base64, urllib.parse.quote, html.unescape and str.encode).
// Invisible characters, dashes and combining marks are built from code points so they stay visible in this file.
const cp = (...codes) => String.fromCodePoint(...codes);
const NBSP = cp(0xa0);
const ZWSP = cp(0x200b);
const BOM = cp(0xfeff);
const FFFD = cp(0xfffd);
const HINDI = 'नमस्ते';
const EMOJI = '😀';
const MIXED = 'Hello, world! नमस्ते 😀';
const URL = "https://example.com/search?q=Tom & Jerry's café&page=2";
const MARKUP = 'Tom & Jerry\'s <b>café</b> © 2026 → "∞"';

test('base64: RFC 4648 section 10 test vectors, both ways', () => {
  const vectors = [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']];
  for (const [text, encoded] of vectors) {
    assert.equal(base64Encode(text), encoded);
    assert.deepEqual(base64Decode(encoded), { ok: true, text });
  }
});

test('base64: UTF-8 text such as Hindi and emoji (FAQ examples)', () => {
  assert.equal(base64Encode(HINDI), '4KSo4KSu4KS44KWN4KSk4KWH');
  assert.equal(base64Encode(EMOJI), '8J+YgA==');
  assert.equal(base64Encode(MIXED), 'SGVsbG8sIHdvcmxkISDgpKjgpK7gpLjgpY3gpKTgpYcg8J+YgA==');
  assert.deepEqual(base64Decode('SGVsbG8sIHdvcmxkISDgpKjgpK7gpLjgpY3gpKTgpYcg8J+YgA=='), { ok: true, text: MIXED });
});

test('base64: URL-safe alphabet and dropped padding', () => {
  assert.equal(base64Encode('>>>'), 'Pj4+');
  assert.equal(base64Encode('>>>', { urlSafe: true }), 'Pj4-');
  assert.equal(base64Encode('???'), 'Pz8/');
  assert.equal(base64Encode('???', { urlSafe: true }), 'Pz8_');
  assert.equal(base64Encode('f', { pad: false }), 'Zg');
  assert.equal(base64Encode('fo', { pad: false }), 'Zm8');
  assert.equal(base64Encode('foo', { urlSafe: true, pad: false }), 'Zm9v');
  assert.equal(base64Encode(MIXED, { urlSafe: true, pad: false }), 'SGVsbG8sIHdvcmxkISDgpKjgpK7gpLjgpY3gpKTgpYcg8J-YgA');
});

test('base64: decoding tolerates whitespace, missing or short padding, either alphabet, and a data URL', () => {
  assert.equal(base64Decode('Zm9v\nYmFy ').text, 'foobar');
  assert.equal(base64Decode('Zg').text, 'f');
  assert.equal(base64Decode('Zg=').text, 'f');
  assert.equal(base64Decode('Zm8').text, 'fo');
  assert.equal(base64Decode('Pj4-Pz8_').text, '>>>???');
  assert.equal(base64Decode('SGVsbG8sIHdvcmxkISDgpKjgpK7gpLjgpY3gpKTgpYcg8J-YgA').text, MIXED);
  const d = base64Decode('data:text/plain;base64,SGVsbG8=');
  assert.equal(d.text, 'Hello');
  assert.match(d.note, /data URL/);
});

test('base64: invalid input is reported plainly, with the character and its position', () => {
  assert.deepEqual(base64Decode('Zg!'), { ok: false, error: 'Not Base64: "!" at position 3 is not a Base64 character.' });
  assert.match(base64Decode('Zm9vYmFyx').error, /length is wrong/);
  assert.match(base64Decode('Zg==Zg==').error, /after = padding/);
  assert.match(base64Decode('😀Zg==').error, /"😀" at position 1/);
  assert.match(base64Decode('Zg' + ZWSP + '==').error, /U\+200B at position 3/);
});

test('base64: bytes that are not UTF-8 text are shown as hex, with a note', () => {
  const one = base64Decode('gA==');
  assert.equal(one.ok, true);
  assert.equal(one.text, '80');
  assert.equal(one.note, 'Valid Base64, but the 1 decoded byte is not UTF-8 text, so it is shown as hex.');
  const png = base64Decode('iVBORw0KGgo=');
  assert.equal(png.text, '89 50 4e 47 0d 0a 1a 0a');
  assert.match(png.note, /8 decoded bytes are not UTF-8 text/);
});

test('url: a value encodes like encodeURIComponent and a whole URL like encodeURI (FAQ example)', () => {
  assert.equal(urlEncode(URL), "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3DTom%20%26%20Jerry's%20caf%C3%A9%26page%3D2");
  assert.equal(urlEncode(URL, { whole: true }), "https://example.com/search?q=Tom%20&%20Jerry's%20caf%C3%A9&page=2");
  assert.equal(urlEncode('Tom & Jerry'), 'Tom%20%26%20Jerry');
  const samples = [URL, MIXED, MARKUP, "-_.!~*'()", URL_RESERVED, '%', 'a+b c', 'tab\tnew\nline', NBSP + ZWSP + BOM, cp(0) + cp(0x7f)];
  for (const s of samples) {
    assert.equal(urlEncode(s), encodeURIComponent(s), s);
    assert.equal(urlEncode(s, { whole: true }), encodeURI(s), s);
  }
  assert.equal(urlEncode(String.fromCharCode(0xd83d)), '%EF%BF%BD'); // a lone surrogate makes encodeURIComponent throw; here it becomes U+FFFD
});

test('url: decoding, including the escapes that decodeURI leaves alone', () => {
  assert.deepEqual(urlDecode('%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87'), { ok: true, text: HINDI });
  assert.equal(urlDecode(urlEncode(URL)).text, URL);
  assert.equal(urlDecode(urlEncode(URL, { whole: true }), { whole: true }).text, URL);
  assert.equal(urlDecode('a%2Fb%3Fc%3D1%26d%20e', { whole: true }).text, 'a%2Fb%3Fc%3D1%26d e');
  assert.equal(urlDecode('a%2Fb%3Fc%3D1%26d%20e').text, 'a/b?c=1&d e');
  assert.equal(urlDecode('a+b').text, 'a+b'); // + is left alone: it means a space only in form submissions
  assert.equal(urlDecode('%e0%a4%a8').text, 'न');
});

test('url: invalid percent-encoding is reported plainly', () => {
  assert.match(urlDecode('a%zzb').error, /"%zz" at position 2 should be a % followed by two hex digits/);
  assert.match(urlDecode('abc%4').error, /"%4" at position 4/);
  assert.match(urlDecode('abc%').error, /"%" at position 4/);
  assert.match(urlDecode('%E0%A4').error, /%E0%A4 at position 1 is not a complete UTF-8 character/);
  assert.match(urlDecode('😀%E0%A4x').error, /position 2/);
});

test('html: encoding in named, decimal and hex style (FAQ examples)', () => {
  assert.equal(htmlEncode(MARKUP), 'Tom &amp; Jerry&#39;s &lt;b&gt;caf&eacute;&lt;/b&gt; &copy; 2026 &rarr; &quot;&infin;&quot;');
  assert.equal(htmlEncode(MARKUP, { style: 'decimal' }), 'Tom &amp; Jerry&#39;s &lt;b&gt;caf&#233;&lt;/b&gt; &#169; 2026 &#8594; &quot;&#8734;&quot;');
  assert.equal(htmlEncode('café\'', { style: 'hex' }), 'caf&#xE9;&#39;');
  assert.equal(htmlEncode(MARKUP, { nonAscii: false }), 'Tom &amp; Jerry&#39;s &lt;b&gt;café&lt;/b&gt; © 2026 → &quot;∞&quot;');
  assert.equal(htmlEncode(EMOJI), '&#x1F600;'); // no named entity exists, so named style falls back to hex
  assert.equal(htmlEncode(NBSP + 'x' + cp(0x2026)), '&nbsp;x&hellip;'); // the HTML 4 name wins over NonBreakingSpace and mldr
  assert.equal(htmlEncode('plain ASCII 123'), 'plain ASCII 123');
});

test('html: the five essentials are written the same way in every style (FAQ)', () => {
  const five = '&<>"\'';
  for (const options of [{}, { style: 'decimal' }, { style: 'hex' }, { nonAscii: false }]) {
    assert.equal(htmlEncode(five, options), '&amp;&lt;&gt;&quot;&#39;', JSON.stringify(options));
  }
});

test('html: C1 controls are left alone, because a numeric reference for them reads as Windows-1252', () => {
  const c1 = cp(0x80) + 'x' + cp(0x9f);
  for (const options of [{}, { style: 'decimal' }, { style: 'hex' }]) {
    assert.equal(htmlEncode(c1, options), c1, JSON.stringify(options)); // &#x80; would decode as the euro sign, not U+0080
    assert.equal(htmlDecode(htmlEncode(c1, options)).text, c1);
  }
  assert.equal(htmlEncode(cp(0x7f) + cp(0xa0)), cp(0x7f) + '&nbsp;'); // the range is exactly U+0080 to U+009F
});

test('html: decoding named, numeric, legacy and quirky entities', () => {
  const r = htmlDecode('&lt;p&gt;caf&eacute; &amp; &#169; &#xA9; &#XA9; &copy;&nbsp;x&lt;/p&gt; &#146; &copy2024 &notin &notin; &foo; AT&T &#0; &#1114112; &#xD800; &NotNestedGreaterGreater; &nvlt; &amp');
  assert.equal(r.text, `<p>café & © © © ©${NBSP}x</p> ${cp(0x2019)} ©2024 ¬in ∉ &foo; AT&T ${FFFD} ${FFFD} ${FFFD} ${cp(0x2aa2, 0x338)} <${cp(0x20d2)} &`);
  assert.equal(r.note, '1 unknown entity was left as it was.');
  assert.equal(htmlDecode('&#128;&#130;&#150;&#151;&#153;&#159;&#129;').text, cp(0x20ac, 0x201a, 0x2013, 0x2014, 0x2122, 0x178, 0x81)); // Windows-1252: euro, low quote, en dash, em dash, trade mark, Y with diaeresis, and an unmapped control
  assert.equal(htmlDecode('&amp;lt;').text, '&lt;'); // one pass, like a browser
  assert.equal(htmlDecode('no entities').note, undefined);
  assert.equal(htmlDecode(htmlEncode(MARKUP)).text, MARKUP);
});

test('hex: encoding and decoding, with separators tolerated (FAQ example)', () => {
  assert.equal(hexEncode(HINDI), 'e0a4a8e0a4aee0a4b8e0a58de0a4a4e0a587');
  assert.equal(hexEncode('Hello'), '48656c6c6f');
  assert.equal(hexEncode('Hello', { spaced: true }), '48 65 6c 6c 6f');
  assert.equal(hexEncode(MIXED, { spaced: true }), '48 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21 20 e0 a4 a8 e0 a4 ae e0 a4 b8 e0 a5 8d e0 a4 a4 e0 a5 87 20 f0 9f 98 80');
  assert.deepEqual(hexDecode('48 65\n6C:6c,6f'), { ok: true, text: 'Hello' });
  assert.equal(hexDecode('0x48 0x65, 0X6C').text, 'Hel');
  assert.equal(hexDecode('e0a4a8e0a4aee0a4b8e0a58de0a4a4e0a587').text, HINDI);
  assert.equal(hexDecode('').text, '');
});

test('hex: invalid input is reported plainly', () => {
  assert.deepEqual(hexDecode('4g'), { ok: false, error: 'Not hex: "g" at position 2 is not a hex digit.' });
  assert.match(hexDecode('486').error, /this has 3, so one digit is missing/);
  assert.equal(hexDecode('ff').error, 'Valid hex, but the 1 byte is not UTF-8 text, so it cannot be shown as characters.');
  assert.match(hexDecode('00x1').error, /"x" at position 3/);
});

test('round trips: every codec and option returns the original text', () => {
  const family = cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467); // an emoji sequence joined with zero width joiners
  const texts = ['', 'a', MIXED, URL, MARKUP, 'line\r\nbreak\ttab', `${family} family`, cp(0xa0, 0x200b, 0x2060), '100% & more = less?', `${cp(0)}control${cp(0x7f)}${cp(0x80, 0x85, 0x9f)}`, '&copy 2024 &amp;'];
  const cases = [
    ['base64', {}], ['base64', { urlSafe: true }], ['base64', { pad: false }], ['base64', { urlSafe: true, pad: false }],
    ['url', {}], ['url', { whole: true }],
    ['html', {}], ['html', { style: 'decimal' }], ['html', { style: 'hex' }], ['html', { nonAscii: false }],
    ['hex', {}], ['hex', { spaced: true }],
  ];
  for (const text of texts) {
    for (const [codec, options] of cases) {
      const encoded = run(codec, 'encode', text, options);
      assert.equal(encoded.ok, true);
      assert.deepEqual(run(codec, 'decode', encoded.text, options), { ok: true, text }, `${codec} ${JSON.stringify(options)} ${JSON.stringify(text)}`);
    }
  }
});

test('measure: characters are code points and bytes are UTF-8 (FAQ example)', () => {
  assert.deepEqual(measure(HINDI), { characters: 6, bytes: 18 });
  assert.deepEqual(measure(EMOJI), { characters: 1, bytes: 4 });
  assert.deepEqual(measure(''), { characters: 0, bytes: 0 });
  assert.deepEqual(measure('Hello'), { characters: 5, bytes: 5 });
});

test('run: dispatches to every codec and rejects an unknown one', () => {
  assert.deepEqual(CODECS.map(c => c.id), ['base64', 'url', 'html', 'hex']);
  assert.deepEqual(run('base64', 'encode', 'f'), { ok: true, text: 'Zg==' });
  assert.deepEqual(run('url', 'encode', 'a b', { whole: true }), { ok: true, text: 'a%20b' });
  assert.deepEqual(run('hex', 'decode', '4g'), { ok: false, error: 'Not hex: "g" at position 2 is not a hex digit.' });
  assert.throws(() => run('rot13', 'encode', 'x'), /Unknown codec/);
});
