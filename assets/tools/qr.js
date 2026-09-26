// QR code generator page. Nothing is stored or sent: the form contents stay in the page.
import { $, $$, radio, download, debounce } from './kit.js';
import { encode, toSvg, toPixels, normaliseUrl, wifi, upi, email, phone, sms, vcard, contrast, isInverted, hexToRgb, UPI_ID } from './lib/qr.js';

const form = $('#qr-form');
const stage = $('#qr-stage');
const live = $('#qr-live');
const v = id => $(`#${id}`).value;

function payload(type) {
  switch (type) {
    case 'url': return normaliseUrl(v('qr-url'));
    case 'text': return v('qr-text');
    case 'wifi': return wifi({ ssid: v('qr-ssid'), password: v('qr-wpass'), auth: radio('auth'), hidden: $('#qr-hidden').checked });
    case 'upi': return upi({ pa: v('qr-pa'), pn: v('qr-pn'), am: v('qr-am'), tn: v('qr-tn') });
    case 'email': return email({ to: v('qr-to'), subject: v('qr-subject'), body: v('qr-body') });
    case 'phone': return radio('dial') === 'sms' ? sms({ number: v('qr-number'), message: v('qr-sms') }) : phone({ number: v('qr-number') });
    case 'vcard': return vcard({ first: v('qr-first'), last: v('qr-last'), org: v('qr-org'), title: v('qr-title'), tel: v('qr-tel'), mail: v('qr-mail'), url: v('qr-web') });
    default: return '';
  }
}
const DESCRIBE = { url: 'link', text: 'text', wifi: 'Wi-Fi network', upi: 'UPI payment', email: 'email', phone: 'phone number', vcard: 'contact card' };

let current = null; // { code, fg, bg, margin, text, type }
function update() {
  const type = radio('type');
  $$('[data-type]', form).forEach(el => { el.hidden = el.dataset.type !== type; });
  $('#qr-sms-field').hidden = radio('dial') !== 'sms';
  $('#qr-text-count').textContent = v('qr-text') ? `${new TextEncoder().encode(v('qr-text')).length} bytes` : '';
  const paErr = $('#qr-pa-error');
  paErr.textContent = type === 'upi' && v('qr-pa').trim() && !UPI_ID.test(v('qr-pa').trim()) ? 'That does not look like a UPI ID (name@bank).' : '';

  const fg = v('qr-fg'), bg = v('qr-bg');
  const margin = Number(radio('margin'));
  const text = payload(type);
  $('#qr-payload').textContent = text || '(empty)';
  const warn = $('#qr-warn');
  warn.textContent = '';
  const buttons = ['#qr-png', '#qr-svg', '#qr-copy'].map(s => $(s));
  if (!text) {
    current = null;
    stage.innerHTML = '<p class="text-muted text-sm text-center py-16 px-4">Fill in the details and the code appears here.</p>';
    $('#qr-meta').textContent = '';
    buttons.forEach(b => { b.disabled = true; });
    return;
  }
  try {
    const code = encode(text, radio('ecc'));
    current = { code, fg, bg, margin, text, type };
    stage.innerHTML = toSvg(code, { fg, bg, margin, title: `QR code for this ${DESCRIBE[type]}` });
    $('#qr-meta').textContent = `Version ${code.version} · ${code.size}×${code.size} modules · ${code.bytes} bytes`;
    buttons.forEach(b => { b.disabled = false; });
    const ratio = contrast(fg, bg);
    if (isInverted(fg, bg)) warn.textContent = 'Light code on a dark background: many scanners cannot read inverted codes.';
    else if (ratio < 4) warn.textContent = `Low contrast (${ratio.toFixed(1)}:1). Some phones may fail to scan it; aim for 4:1 or more.`;
    else if (margin === 0) warn.textContent = 'Without a quiet margin, leave clear space around the code wherever you place it.';
  } catch (e) {
    current = null;
    stage.innerHTML = `<p class="text-sm text-center py-16 px-4" style="color:var(--bad)">${e.message}</p>`;
    $('#qr-meta').textContent = '';
    buttons.forEach(b => { b.disabled = true; });
  }
}
const updateSoon = debounce(update, 60);
form.addEventListener('input', updateSoon);
form.addEventListener('change', update);
$('#qr-reset').addEventListener('click', () => { $('#qr-fg').value = '#1a1814'; $('#qr-bg').value = '#ffffff'; update(); });

// ---------- export ----------
function canvasFor(c) {
  const target = Number($('#qr-size').value);
  const scale = Math.max(1, Math.round(target / (c.code.size + c.margin * 2)));
  const img = toPixels(c.code, { scale, margin: c.margin, fg: hexToRgb(c.fg), bg: hexToRgb(c.bg) });
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  canvas.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  return canvas;
}
const fileBase = () => `qr-${current.type}`;
$('#qr-png').addEventListener('click', () => {
  if (!current) return;
  canvasFor(current).toBlob(blob => { download(blob, `${fileBase()}.png`); live.textContent = 'PNG downloaded.'; }, 'image/png');
});
$('#qr-svg').addEventListener('click', () => {
  if (!current) return;
  download(toSvg(current.code, { fg: current.fg, bg: current.bg, margin: current.margin }), `${fileBase()}.svg`, 'image/svg+xml');
  live.textContent = 'SVG downloaded.';
});
if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
  const btn = $('#qr-copy');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    if (!current) return;
    const label = btn.querySelector('[data-label]');
    try {
      const blob = await new Promise(res => canvasFor(current).toBlob(res, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      label.textContent = 'Copied';
      live.textContent = 'Image copied to the clipboard.';
    } catch (e) {
      label.textContent = 'Copy not allowed';
    }
    setTimeout(() => { label.textContent = 'Copy image'; }, 1600);
  });
}
update();
