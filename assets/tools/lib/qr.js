// QR payload builders and rendering. No DOM, so the output can be decoded and checked in Node tests.
import qrcode from '../vendor/qrcode.js';

// The encoder's byte mode reads characters as Latin-1 by default; UTF-8 keeps names like "Café" or "मोहम्मद" intact.
qrcode.stringToBytes = s => Array.from(new TextEncoder().encode(s));

// ---------- payloads ----------
/** Adds https:// to a bare domain such as "example.com/page"; leaves anything with a scheme alone. */
export function normaliseUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+([/?#:].*)?$/.test(s)) return `https://${s}`;
  return s;
}

// Wi-Fi fields escape \ ; , : and " with a backslash (ZXing "WIFI:" format, read by iOS and Android cameras)
const wifiEscape = s => String(s).replace(/([\\;,:"])/g, '\\$1');
export function wifi({ ssid = '', password = '', auth = 'WPA', hidden = false }) {
  if (!ssid) return '';
  const t = auth === 'nopass' ? 'nopass' : auth;
  return `WIFI:T:${t};S:${wifiEscape(ssid)};${t !== 'nopass' && password ? `P:${wifiEscape(password)};` : ''}${hidden ? 'H:true;' : ''};`;
}

export const UPI_ID = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,64}$/;
// UPI deep link per NPCI's linking specification. The @ in the UPI ID is left readable; other values are percent-encoded.
export function upi({ pa = '', pn = '', am = '', tn = '' }) {
  const id = String(pa).trim();
  if (!id) return '';
  const enc = v => encodeURIComponent(String(v).trim()).replace(/%40/g, '@');
  const parts = [`pa=${enc(id)}`];
  if (String(pn).trim()) parts.push(`pn=${enc(pn)}`);
  const amount = Number(String(am).replace(/[,\s]/g, ''));
  if (String(am).trim() && Number.isFinite(amount) && amount > 0) parts.push(`am=${amount.toFixed(2)}`);
  parts.push('cu=INR');
  if (String(tn).trim()) parts.push(`tn=${enc(tn)}`);
  return `upi://pay?${parts.join('&')}`;
}

export function email({ to = '', subject = '', body = '' }) {
  if (!String(to).trim() && !subject && !body) return '';
  const q = [subject ? `subject=${encodeURIComponent(subject)}` : '', body ? `body=${encodeURIComponent(body)}` : ''].filter(Boolean).join('&');
  return `mailto:${String(to).trim()}${q ? `?${q}` : ''}`;
}

const dialable = n => String(n || '').replace(/[^\d+]/g, '');
export const phone = ({ number = '' }) => (dialable(number) ? `tel:${dialable(number)}` : '');
export const sms = ({ number = '', message = '' }) => (dialable(number) ? `SMSTO:${dialable(number)}:${message}` : '');

// vCard 3.0: text values escape \ , ; and newlines; lines end in CRLF
const vEsc = s => String(s).replace(/([\\,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
export function vcard({ first = '', last = '', org = '', title = '', tel = '', mail = '', url = '', note = '' }) {
  if (![first, last, org, tel, mail].some(v => String(v).trim())) return '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vEsc(last)};${vEsc(first)};;;`, `FN:${vEsc([first, last].filter(Boolean).join(' ') || org)}`];
  if (org) lines.push(`ORG:${vEsc(org)}`);
  if (title) lines.push(`TITLE:${vEsc(title)}`);
  if (dialable(tel)) lines.push(`TEL;TYPE=CELL:${dialable(tel)}`);
  if (String(mail).trim()) lines.push(`EMAIL:${String(mail).trim()}`);
  if (String(url).trim()) lines.push(`URL:${normaliseUrl(url)}`);
  if (note) lines.push(`NOTE:${vEsc(note)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

// ---------- encoding and rendering ----------
/** Encodes text. Throws a readable Error when it will not fit in a version-40 code at this error-correction level. */
export function encode(text, ecc = 'M') {
  const q = qrcode(0, ecc);
  q.addData(text, 'Byte');
  try { q.make(); } catch (e) { throw new Error('Too much data for one QR code at this error correction level. Shorten it or choose Low.'); }
  const size = q.getModuleCount();
  return { size, version: (size - 17) / 4, ecc, bytes: new TextEncoder().encode(text).length, isDark: (r, c) => q.isDark(r, c) };
}

/** Crisp SVG: one path, each row's dark runs merged into rectangles, in module units. */
export function toSvg(code, { fg = '#000000', bg = '#ffffff', margin = 4, title = 'QR code' } = {}) {
  const n = code.size, total = n + margin * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!code.isDark(r, c)) continue;
      let run = 1;
      while (c + run < n && code.isDark(r, c + run)) run++;
      d += `M${c + margin} ${r + margin}h${run}v1h-${run}z`;
      c += run - 1;
    }
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="${total}" height="${total}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
}

/** RGBA pixels at an integer module scale (for canvas export and for decoding in tests). */
export function toPixels(code, { scale = 8, margin = 4, fg = [0, 0, 0], bg = [255, 255, 255] } = {}) {
  const side = (code.size + margin * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) {
    const r = Math.floor(y / scale) - margin;
    for (let x = 0; x < side; x++) {
      const c = Math.floor(x / scale) - margin;
      const dark = r >= 0 && c >= 0 && r < code.size && c < code.size && code.isDark(r, c);
      const col = dark ? fg : bg;
      const i = (y * side + x) * 4;
      data[i] = col[0]; data[i + 1] = col[1]; data[i + 2] = col[2]; data[i + 3] = 255;
    }
  }
  return { data, width: side, height: side };
}

// ---------- colour checks ----------
export const hexToRgb = h => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? [1, 2, 3].map(i => parseInt(m[i], 16)) : null; };
const lum = rgb => { const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
/** WCAG contrast ratio between two hex colours. */
export function contrast(a, b) {
  const la = lum(hexToRgb(a)), lb = lum(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
export const isInverted = (fg, bg) => lum(hexToRgb(fg)) > lum(hexToRgb(bg));
