// Minimal ZIP writer (stored entries, no compression): compressed images gain nothing from deflate,
// so storing them keeps this tiny and fast. UTF-8 file names. Pure functions, no DOM.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const dosTime = d => (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
const dosDate = d => ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

/** Makes names unique within one archive: "photo.webp", "photo (2).webp", ... */
export function uniqueNames(names) {
  const seen = new Map();
  return names.map(n => {
    const key = n.toLowerCase();
    const count = (seen.get(key) || 0) + 1;
    seen.set(key, count);
    if (count === 1) return n;
    const dot = n.lastIndexOf('.');
    const candidate = dot > 0 ? `${n.slice(0, dot)} (${count})${n.slice(dot)}` : `${n} (${count})`;
    seen.set(candidate.toLowerCase(), 1);
    return candidate;
  });
}

/** files: [{ name, data: Uint8Array, date?: Date }] → Uint8Array holding a .zip archive. */
export function zipStore(files, now = new Date()) {
  const enc = new TextEncoder();
  const names = uniqueNames(files.map(f => f.name));
  const entries = files.map((f, i) => ({ name: enc.encode(names[i]), data: f.data, crc: crc32(f.data), date: f.date || now }));
  const localSize = entries.reduce((a, e) => a + 30 + e.name.length + e.data.length, 0);
  const centralSize = entries.reduce((a, e) => a + 46 + e.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  let p = 0;
  const u16 = v => { view.setUint16(p, v, true); p += 2; };
  const u32 = v => { view.setUint32(p, v >>> 0, true); p += 4; };
  const offsets = [];
  for (const e of entries) {
    offsets.push(p);
    u32(0x04034b50); u16(20); u16(0x0800); u16(0); u16(dosTime(e.date)); u16(dosDate(e.date));
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0);
    out.set(e.name, p); p += e.name.length;
    out.set(e.data, p); p += e.data.length;
  }
  const cdStart = p;
  entries.forEach((e, i) => {
    u32(0x02014b50); u16(20); u16(20); u16(0x0800); u16(0); u16(dosTime(e.date)); u16(dosDate(e.date));
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0); u16(0); u16(0); u16(0); u32(0); u32(offsets[i]);
    out.set(e.name, p); p += e.name.length;
  });
  const cdSize = p - cdStart; // measured before the end record moves p
  u32(0x06054b50); u16(0); u16(0); u16(entries.length); u16(entries.length); u32(cdSize); u32(cdStart); u16(0);
  return out;
}

/** "2.4 MB", "612 KB", "900 B" */
export function formatBytes(n) {
  if (!Number.isFinite(n)) return '–';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1048576).toFixed(n < 10485760 ? 2 : 1)} MB`;
}

/** Scales (w, h) so the longest side is at most `max` (0 = no limit), never enlarging. */
export function fitWithin(w, h, max) {
  if (!max || Math.max(w, h) <= max) return { width: w, height: h };
  const k = max / Math.max(w, h);
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}
