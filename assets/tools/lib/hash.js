// Hashes and UUIDs for the Hash & UUID Generator. MD5 is implemented here in plain JavaScript (RFC 1321) with a
// streaming update/digest API, so a large file can be fed in chunks; SHA-1, SHA-256, SHA-384 and SHA-512 come from
// the Web Crypto API. Pure functions, no DOM.

export { formatBytes } from './zip.js';

export const ALGORITHMS = [
  { id: 'md5', name: 'MD5', bits: 128 },
  { id: 'sha1', name: 'SHA-1', bits: 160, subtle: 'SHA-1' },
  { id: 'sha256', name: 'SHA-256', bits: 256, subtle: 'SHA-256' },
  { id: 'sha384', name: 'SHA-384', bits: 384, subtle: 'SHA-384' },
  { id: 'sha512', name: 'SHA-512', bits: 512, subtle: 'SHA-512' },
].map(a => ({ ...a, hexLength: a.bits / 4, base64Length: 4 * Math.ceil(a.bits / 24) }));

// ---------- bytes, hex and Base64 ----------
const encoder = new TextEncoder();
/** UTF-8 bytes of a string exactly as typed: line endings are kept and no newline is added. */
export const utf8 = text => encoder.encode(String(text ?? ''));

/** Accepts a Uint8Array, any other typed array or DataView, an ArrayBuffer, or a string (encoded as UTF-8). */
export function toBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (typeof data === 'string') return utf8(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new TypeError('expected bytes or a string');
}

/** Byte and character counts shown under the text box. Characters are code points, so an emoji counts once. */
export function textStats(text) {
  const s = String(text ?? '');
  return { bytes: utf8(s).length, characters: [...s].length };
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
export function toHex(bytes, upper = false) {
  let s = '';
  for (const b of bytes) s += HEX[b];
  return upper ? s.toUpperCase() : s;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Standard Base64 with = padding (RFC 4648). */
export function toBase64(bytes) {
  let s = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    s += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  const rest = bytes.length - i; // one or two bytes left over are padded
  if (rest === 1) { const n = bytes[i] << 16; s += B64[n >> 18] + B64[(n >> 12) & 63] + '=='; }
  else if (rest === 2) { const n = (bytes[i] << 16) | (bytes[i + 1] << 8); s += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '='; }
  return s;
}

export const FORMATS = ['hex', 'HEX', 'base64'];
/** A digest as lowercase hex ('hex'), uppercase hex ('HEX') or Base64 ('base64'). */
export function formatDigest(bytes, format = 'hex') {
  return format === 'base64' ? toBase64(bytes) : toHex(bytes, format === 'HEX');
}

// ---------- MD5 (RFC 1321) ----------
// Per-step rotation amounts and the sine-derived constants K[i] = floor(2^32 * abs(sin(i + 1))), as tabulated in the RFC.
const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

/** Folds one 64-byte block, already split into 16 little-endian words in `w`, into the state [a, b, c, d]. */
function compress(state, w) {
  let a = state[0], b = state[1], c = state[2], d = state[3];
  for (let i = 0; i < 64; i++) {
    let f, g;
    if (i < 16) { f = (b & c) | (~b & d); g = i; }
    else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) & 15; }
    else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) & 15; }
    else { f = c ^ (b | ~d); g = (7 * i) & 15; }
    const x = (a + f + K[i] + w[g]) | 0;
    const s = S[i];
    const next = (b + ((x << s) | (x >>> (32 - s)))) | 0;
    a = d; d = c; c = b; b = next;
  }
  state[0] = (state[0] + a) | 0; state[1] = (state[1] + b) | 0; state[2] = (state[2] + c) | 0; state[3] = (state[3] + d) | 0;
}

/**
 * Incremental MD5: new Md5().update(part).update(part).digest() equals md5(whole).
 * Whole blocks are compressed straight from each chunk; only an incomplete tail is buffered, so memory stays at 64 bytes
 * however much data goes through. The byte count is a plain number, exact to 2^53 bytes.
 */
export class Md5 {
  constructor() {
    this.state = new Int32Array([0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476]);
    this.words = new Int32Array(16);
    this.tail = new Uint8Array(64);
    this.tailLength = 0;
    this.length = 0;
    this.result = null;
  }
  block(bytes, offset) {
    const w = this.words;
    for (let i = 0; i < 16; i++, offset += 4) w[i] = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    compress(this.state, w);
  }
  update(data) {
    if (this.result) throw new Error('digest() has already been called');
    const bytes = toBytes(data);
    this.length += bytes.length;
    let offset = 0;
    if (this.tailLength) { // finish the block left over from the previous chunk first
      const take = Math.min(64 - this.tailLength, bytes.length);
      this.tail.set(bytes.subarray(0, take), this.tailLength);
      this.tailLength += take;
      offset = take;
      if (this.tailLength < 64) return this;
      this.block(this.tail, 0);
      this.tailLength = 0;
    }
    for (; offset + 64 <= bytes.length; offset += 64) this.block(bytes, offset);
    if (offset < bytes.length) { this.tail.set(bytes.subarray(offset)); this.tailLength = bytes.length - offset; }
    return this;
  }
  /** The 16-byte digest. Padding: a 0x80 byte, zeros to 56 mod 64, then the bit length as a 64-bit little-endian integer. */
  digest() {
    if (this.result) return this.result;
    const pad = new Uint8Array(this.tailLength < 56 ? 64 : 128);
    pad.set(this.tail.subarray(0, this.tailLength));
    pad[this.tailLength] = 0x80;
    const bits = this.length * 8;
    const view = new DataView(pad.buffer);
    view.setUint32(pad.length - 8, bits >>> 0, true);
    view.setUint32(pad.length - 4, Math.floor(bits / 4294967296), true);
    for (let offset = 0; offset < pad.length; offset += 64) this.block(pad, offset);
    const out = new Uint8Array(16);
    const outView = new DataView(out.buffer);
    for (let i = 0; i < 4; i++) outView.setInt32(i * 4, this.state[i], true);
    this.result = out;
    return out;
  }
}

/** One-shot MD5 of bytes or a string, as a 16-byte Uint8Array. */
export const md5 = data => new Md5().update(data).digest();

// ---------- SHA family and the combined digest ----------
/** SHA digest through the Web Crypto API; `name` is 'SHA-1', 'SHA-256', 'SHA-384' or 'SHA-512'. */
export async function sha(name, data) {
  return new Uint8Array(await globalThis.crypto.subtle.digest(name, toBytes(data)));
}

const abortError = () => Object.assign(new Error('Hashing was cancelled'), { name: 'AbortError' });

/**
 * All five digests of `data` as { md5, sha1, sha256, sha384, sha512 }, each a Uint8Array.
 * MD5 runs in JavaScript in chunks of `chunkSize` bytes and yields between chunks so a page can repaint and show
 * progress ({ done, total, percent }). The SHA digests run one after another in the crypto implementation meanwhile,
 * so a large file is copied at most once at a time. An AbortSignal in `signal` stops the work early.
 */
export async function hashBytes(data, { chunkSize = 4 * 1024 * 1024, onProgress, signal } = {}) {
  const bytes = toBytes(data);
  const total = bytes.length;
  const shas = (async () => {
    const out = {};
    for (const a of ALGORITHMS) if (a.subtle) out[a.id] = await sha(a.subtle, bytes);
    return out;
  })();
  shas.catch(() => {}); // a failure here surfaces at the await below, not as an unhandled rejection
  const hasher = new Md5();
  let done = 0;
  do {
    if (signal && signal.aborted) throw abortError();
    const end = Math.min(done + chunkSize, total);
    hasher.update(bytes.subarray(done, end));
    done = end;
    if (onProgress) onProgress({ done, total, percent: total ? Math.floor((done / total) * 100) : 100 });
    if (done < total) await new Promise(resolve => setTimeout(resolve, 0));
  } while (done < total);
  const result = { md5: hasher.digest(), ...(await shas) };
  if (signal && signal.aborted) throw abortError();
  return result;
}

/**
 * Which computed digest a pasted checksum equals, or null. Hex is compared without regard to case, Base64 exactly.
 * Every whitespace-separated piece of the paste is tried, and so is what follows each colon, equals sign or hyphen in
 * a piece (none of which occurs in hex or standard Base64), so a line from sha256sum ("<hex>  file"), the BSD form
 * ("SHA256 (file) = <hex>"), a "sha256:<hex>" prefix, an HTTP Digest header ("sha-256=<base64>") and a subresource
 * integrity value ("sha384-<base64>") all match.
 */
export function findMatch(candidate, digests) {
  const text = String(candidate ?? '').trim();
  if (!text || !digests) return null;
  const pieces = new Set();
  for (const part of text.split(/\s+/)) {
    pieces.add(part);
    for (const m of part.matchAll(/[:=-]/g)) pieces.add(part.slice(m.index + 1));
  }
  for (const a of ALGORITHMS) {
    const bytes = digests[a.id];
    if (!bytes) continue;
    const hex = toHex(bytes), base64 = toBase64(bytes);
    for (const p of pieces) if (p.toLowerCase() === hex || p === base64) return a;
  }
  return null;
}

// ---------- UUIDs (version 4, RFC 9562) ----------
export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const UUID_MAX = 100;

/** Lays out 16 random bytes as a version 4 UUID: the version nibble and the two variant bits are forced, leaving 122 random bits. */
export function uuidFromBytes(bytes) {
  if (bytes.length !== 16) throw new RangeError('a UUID needs 16 bytes');
  const b = Uint8Array.from(bytes);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = toHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * One random UUID. Uses crypto.randomUUID where the browser has it, otherwise 16 bytes from crypto.getRandomValues.
 * `fill` replaces the byte source (tests pass a deterministic one), which also forces the second path.
 */
export function uuidV4(fill) {
  const c = globalThis.crypto;
  if (!fill && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  (fill || (b => c.getRandomValues(b)))(bytes);
  return uuidFromBytes(bytes);
}

/** How many UUIDs to make: a whole number from 1 to UUID_MAX, with anything unusable treated as 1. */
export const clampCount = n => Math.min(UUID_MAX, Math.max(1, Math.floor(Number(n)) || 1));

export function uuids(count, fill) {
  return Array.from({ length: clampCount(count) }, () => uuidV4(fill));
}

/** Display form: lowercase by default, optionally uppercase and wrapped in braces, the way Windows tooling prints GUIDs. */
export function formatUuid(uuid, { upper = false, braces = false } = {}) {
  const s = upper ? uuid.toUpperCase() : uuid.toLowerCase();
  return braces ? `{${s}}` : s;
}
