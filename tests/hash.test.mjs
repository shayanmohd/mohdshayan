import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { ALGORITHMS, Md5, md5, sha, hashBytes, utf8, toBytes, textStats, toHex, toBase64, formatDigest, findMatch,
  uuidFromBytes, uuidV4, uuids, clampCount, formatUuid, UUID_V4, UUID_MAX } from '../assets/tools/lib/hash.js';

const hex = bytes => toHex(bytes);
const nodeHash = (name, data) => createHash(name).update(data).digest('hex');
const FOX = 'The quick brown fox jumps over the lazy dog';

// ---------- MD5 ----------
test('md5: the RFC 1321 test suite (A.5)', () => {
  const suite = [
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
    ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a'],
  ];
  for (const [input, expected] of suite) assert.equal(hex(md5(input)), expected, JSON.stringify(input));
});
test('md5: feeding the data in chunks equals the one-shot digest', () => {
  const data = randomBytes(1000);
  const whole = hex(md5(data));
  assert.equal(whole, nodeHash('md5', data));
  for (const size of [1, 3, 7, 55, 56, 63, 64, 65, 100, 999]) {
    const h = new Md5();
    for (let i = 0; i < data.length; i += size) h.update(data.subarray(i, i + size));
    assert.equal(hex(h.digest()), whole, `chunks of ${size}`);
  }
  const mixed = new Md5().update('The quick brown ').update(utf8('fox jumps over ')).update(utf8('the lazy dog').buffer);
  assert.equal(hex(mixed.digest()), '9e107d9d372bb6826bd81d3542a419d6');
});
test('md5: every length around the block and padding boundaries matches node:crypto', () => {
  for (const n of [0, 1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 121, 127, 128, 129, 4096, 4097]) {
    const data = randomBytes(n);
    assert.equal(hex(md5(data)), nodeHash('md5', data), `${n} bytes`);
  }
});
test('md5: digest is repeatable, update after digest throws, views and buffers are read correctly', () => {
  const h = new Md5().update('abc');
  assert.equal(hex(h.digest()), hex(h.digest()));
  assert.throws(() => h.update('d'), /already/);
  const buffer = new Uint8Array([0, 0, 97, 98, 99, 0]).buffer;
  assert.equal(hex(md5(new Uint8Array(buffer, 2, 3))), '900150983cd24fb0d6963f7d28e17f72'); // only the view, not the whole buffer
  assert.equal(hex(md5(new DataView(buffer, 2, 3))), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(hex(md5(new Uint8Array([97, 98, 99]).buffer)), '900150983cd24fb0d6963f7d28e17f72');
  assert.throws(() => toBytes(42), TypeError);
});
test('md5: a multi-megabyte input is correct and quick', () => {
  const data = randomBytes(8 * 1024 * 1024);
  const t0 = Date.now();
  const got = hex(md5(data));
  assert.ok(Date.now() - t0 < 3000, 'md5 of 8 MB took too long');
  assert.equal(got, nodeHash('md5', data));
});

// ---------- SHA and the combined digest ----------
test('sha: known vectors for abc and the empty string', async () => {
  assert.equal(hex(await sha('SHA-1', 'abc')), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(hex(await sha('SHA-256', 'abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(hex(await sha('SHA-384', '')), '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b');
  assert.equal(hex(await sha('SHA-512', '')), 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
});
test('hashBytes: all five digests of the example sentence, in hex and Base64', async () => {
  const d = await hashBytes(utf8(FOX));
  assert.deepEqual(Object.keys(d), ALGORITHMS.map(a => a.id));
  assert.equal(hex(d.md5), '9e107d9d372bb6826bd81d3542a419d6');
  assert.equal(hex(d.sha1), '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12');
  assert.equal(hex(d.sha256), 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
  assert.equal(hex(d.sha384), 'ca737f1014a48f4c0b6dd43cb177b0afd9e5169367544c494011e3317dbf9a509cb1e5dc1e85a941bbee3d7f2afbc9b1');
  assert.equal(hex(d.sha512), '07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb642e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6');
  assert.equal(formatDigest(d.md5, 'base64'), 'nhB9nTcrtoJr2B01QqQZ1g==');
  assert.equal(formatDigest(d.sha256, 'base64'), '16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=');
  assert.equal(formatDigest(d.sha512, 'HEX'), '07E547D9586F6A73F73FBAC0435ED76951218FB7D0C8D788A309D785436BBB642E93A252A954F23912547D1E8A3B5ED6E1BFD7097821233FA0538F3DB854FEE6');
  for (const a of ALGORITHMS) {
    assert.equal(formatDigest(d[a.id], 'hex').length, a.hexLength, `${a.name} hex length`);
    assert.equal(formatDigest(d[a.id], 'base64').length, a.base64Length, `${a.name} Base64 length`);
  }
});
test('hashBytes: FAQ example, a trailing newline changes every hash', async () => {
  assert.equal(hex((await hashBytes('hello')).md5), '5d41402abc4b2a76b9719d911017c592');
  assert.equal(hex((await hashBytes('hello\n')).md5), 'b1946ac92492d2347c6235b4d2611184');
  assert.equal(hex((await hashBytes('hello')).sha256), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  assert.equal(hex((await hashBytes('')).md5), 'd41d8cd98f00b204e9800998ecf8427e');
});
test('hashBytes: chunked progress and the result match node:crypto on a file-sized buffer', async () => {
  const data = randomBytes(1024 * 1024 + 123);
  const seen = [];
  const d = await hashBytes(data, { chunkSize: 256 * 1024, onProgress: p => seen.push(p) });
  assert.equal(hex(d.md5), nodeHash('md5', data));
  assert.equal(hex(d.sha1), nodeHash('sha1', data));
  assert.equal(hex(d.sha256), nodeHash('sha256', data));
  assert.equal(hex(d.sha384), nodeHash('sha384', data));
  assert.equal(hex(d.sha512), nodeHash('sha512', data));
  assert.equal(seen.length, 5);
  assert.deepEqual(seen.map(p => p.percent), [24, 49, 74, 99, 100]);
  assert.equal(seen[4].done, data.length);
  assert.equal(seen[4].total, data.length);
  const empty = [];
  await hashBytes('', { onProgress: p => empty.push(p) });
  assert.deepEqual(empty, [{ done: 0, total: 0, percent: 100 }]);
});
test('hashBytes: an abort signal stops the work with an AbortError', async () => {
  const controller = new AbortController();
  const data = randomBytes(64 * 1024);
  const work = hashBytes(data, { chunkSize: 8 * 1024, signal: controller.signal, onProgress: p => { if (p.percent >= 25) controller.abort(); } });
  await assert.rejects(work, e => e.name === 'AbortError');
});

// ---------- encodings, counts and the compare field ----------
test('toHex and toBase64: RFC 4648 vectors and uppercase', () => {
  const vectors = [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']];
  for (const [input, expected] of vectors) assert.equal(toBase64(utf8(input)), expected, input);
  assert.equal(toBase64(new Uint8Array([0xfb, 0xff, 0xbf])), '+/+/');
  assert.equal(toHex(new Uint8Array([0, 15, 16, 255])), '000f10ff');
  assert.equal(toHex(new Uint8Array([0, 15, 16, 255]), true), '000F10FF');
  assert.equal(formatDigest(new Uint8Array([171, 205]), 'HEX'), 'ABCD');
});
test('textStats: bytes are UTF-8, characters are code points', () => {
  assert.deepEqual(textStats('Café ₹ 😀'), { bytes: 14, characters: 8 });
  assert.deepEqual(textStats(''), { bytes: 0, characters: 0 });
  assert.deepEqual(textStats('a\r\nb'), { bytes: 4, characters: 4 });
  assert.equal(utf8('₹').length, 3);
});
test('findMatch: case-insensitive hex, exact Base64, checksum-file lines and prefixes', async () => {
  const d = await hashBytes(FOX);
  assert.equal(findMatch('9e107d9d372bb6826bd81d3542a419d6', d).id, 'md5');
  assert.equal(findMatch('  9E107D9D372BB6826BD81D3542A419D6\n', d).id, 'md5');
  assert.equal(findMatch('2fd4e1c67a2d28fced849ee1bb76e7391b93eb12', d).name, 'SHA-1');
  assert.equal(findMatch('16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=', d).id, 'sha256');
  assert.equal(findMatch('d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592  fox.txt', d).id, 'sha256');
  assert.equal(findMatch('SHA256 (fox.txt) = d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592', d).id, 'sha256');
  assert.equal(findMatch('sha512:07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb642e93a252a954f23912547d1e8a3b5ed6e1bfd7097821233fa0538f3db854fee6', d).id, 'sha512');
  assert.equal(findMatch('9e107d9d372bb6826bd81d3542a419d7', d), null); // last digit off
  assert.equal(findMatch('NHB9NTCRTOJR2B01QQQZ1G==', d), null); // Base64 is case-sensitive
  assert.equal(findMatch('', d), null);
  assert.equal(findMatch('   ', d), null);
  assert.equal(findMatch('9e107d9d372bb6826bd81d3542a419d6', null), null);
});
test('findMatch: Base64 behind a prefix, an HTTP Digest header and a subresource integrity value', async () => {
  const d = await hashBytes(FOX);
  // The old prefix removal cut everything up to the LAST colon or equals sign, so a padded Base64 digest behind a prefix was reduced to nothing.
  assert.equal(findMatch('md5=nhB9nTcrtoJr2B01QqQZ1g==', d).id, 'md5');
  assert.equal(findMatch('md5:nhB9nTcrtoJr2B01QqQZ1g==', d).id, 'md5');
  assert.equal(findMatch('sha-256=16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=', d).id, 'sha256'); // HTTP Digest header value
  assert.equal(findMatch('sha384-ynN/EBSkj0wLbdQ8sXewr9nlFpNnVExJQBHjMX2/mlCcseXcHoWpQbvuPX8q+8mx', d).id, 'sha384'); // SRI
  assert.equal(findMatch('MD5 = 9E107D9D372BB6826BD81D3542A419D6', d).id, 'md5');
  assert.equal(findMatch('sha256-', d), null);
  assert.equal(findMatch('=', d), null);
  assert.equal(findMatch('sha256-16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZJ=', d), null); // last character off
});

// ---------- UUIDs ----------
test('uuid: version and variant bits are forced and the input bytes are left alone', () => {
  const zeros = new Uint8Array(16);
  assert.equal(uuidFromBytes(zeros), '00000000-0000-4000-8000-000000000000');
  const ones = new Uint8Array(16).fill(0xff);
  assert.equal(uuidFromBytes(ones), 'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.equal(ones[6], 0xff);
  assert.equal(ones[8], 0xff);
  assert.throws(() => uuidFromBytes(new Uint8Array(15)), RangeError);
});
test('uuid: both random paths produce distinct version 4 UUIDs', () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const a = uuidV4();
    const b = uuidV4(bytes => globalThis.crypto.getRandomValues(bytes));
    assert.match(a, UUID_V4);
    assert.match(b, UUID_V4);
    seen.add(a).add(b);
  }
  assert.equal(seen.size, 2000);
  let n = 0;
  const counting = bytes => bytes.fill(n++); // deterministic source: the fallback path must use it
  assert.equal(uuidV4(counting), '00000000-0000-4000-8000-000000000000');
  assert.equal(uuidV4(counting), '01010101-0101-4101-8101-010101010101');
});
test('uuid: count clamping, list length and display options', () => {
  for (const [input, expected] of [[1, 1], [5, 5], [2.7, 2], ['42', 42], [100, 100], [101, 100], [1000, 100], [0, 1], [-3, 1], ['abc', 1], ['', 1], [null, 1], [undefined, 1], [NaN, 1]]) {
    assert.equal(clampCount(input), expected, `clampCount(${JSON.stringify(input)})`);
  }
  assert.equal(UUID_MAX, 100);
  assert.equal(uuids(7).length, 7);
  assert.equal(uuids(500).length, 100);
  assert.equal(new Set(uuids(100)).size, 100);
  const u = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  assert.equal(formatUuid(u), u);
  assert.equal(formatUuid(u.toUpperCase()), u);
  assert.equal(formatUuid(u, { upper: true }), '3F2504E0-4F89-41D3-9A0C-0305E82C3301');
  assert.equal(formatUuid(u, { braces: true }), '{3f2504e0-4f89-41d3-9a0c-0305e82c3301}');
  assert.equal(formatUuid(u, { upper: true, braces: true }), '{3F2504E0-4F89-41D3-9A0C-0305E82C3301}');
});
test('algorithms: names, bit sizes and output lengths used by the reference table', () => {
  assert.deepEqual(ALGORITHMS.map(a => [a.name, a.bits, a.hexLength, a.base64Length]), [
    ['MD5', 128, 32, 24], ['SHA-1', 160, 40, 28], ['SHA-256', 256, 64, 44], ['SHA-384', 384, 96, 64], ['SHA-512', 512, 128, 88],
  ]);
});
