// Every payload is encoded, rasterised and decoded again with jsQR, so the test checks what a phone would read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { encode, toPixels, toSvg, wifi, upi, email, phone, sms, vcard, normaliseUrl, contrast, isInverted, UPI_ID } from '../assets/tools/lib/qr.js';

const jsQR = createRequire(import.meta.url)('jsqr');
const roundTrip = (text, ecc = 'M') => {
  const code = encode(text, ecc);
  const img = toPixels(code, { scale: 4, margin: 4 });
  const out = jsQR(img.data, img.width, img.height);
  assert.ok(out, `jsQR could not read the code for ${JSON.stringify(text).slice(0, 60)}`);
  return new TextDecoder().decode(Uint8Array.from(out.binaryData));
};

test('qr: plain text, URLs and UTF-8 survive a round trip at every level', () => {
  for (const ecc of ['L', 'M', 'Q', 'H']) {
    for (const text of ['https://mohdshayan.com/', 'Hello, world', 'Café ☕ मोहम्मद 😀', 'x'.repeat(500)]) {
      assert.equal(roundTrip(text, ecc), text);
    }
  }
});
test('qr: payload builders produce the standard formats and decode intact', () => {
  const cases = [
    [wifi({ ssid: 'Home;Net', password: 'p:a"ss\\1', auth: 'WPA' }), 'WIFI:T:WPA;S:Home\\;Net;P:p\\:a\\"ss\\\\1;;'],
    [wifi({ ssid: 'Cafe', auth: 'nopass', hidden: true }), 'WIFI:T:nopass;S:Cafe;H:true;;'],
    [upi({ pa: 'shop@okhdfc', pn: 'Asha Stores', am: '1,250', tn: 'Order 42' }), 'upi://pay?pa=shop@okhdfc&pn=Asha%20Stores&am=1250.00&cu=INR&tn=Order%2042'],
    [upi({ pa: 'shop@okhdfc' }), 'upi://pay?pa=shop@okhdfc&cu=INR'],
    [email({ to: 'a@b.co', subject: 'Hi there', body: 'Line 1\nLine 2' }), 'mailto:a@b.co?subject=Hi%20there&body=Line%201%0ALine%202'],
    [phone({ number: '+91 89200 38741' }), 'tel:+918920038741'],
    [sms({ number: '+1 (555) 010-9999', message: 'On my way' }), 'SMSTO:+15550109999:On my way'],
  ];
  for (const [got, want] of cases) {
    assert.equal(got, want);
    assert.equal(roundTrip(got), want);
  }
});
test('qr: vCard lines and escaping', () => {
  const v = vcard({ first: 'Mohd', last: 'Shayan', org: 'SocialSure, Pvt; Ltd', tel: '+91 89200 38741', mail: 'contact@mohdshayan.com', url: 'mohdshayan.com' });
  assert.ok(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\nN:Shayan;Mohd;;;\r\nFN:Mohd Shayan\r\n'));
  assert.ok(v.includes('ORG:SocialSure\\, Pvt\\; Ltd'));
  assert.ok(v.includes('TEL;TYPE=CELL:+918920038741'));
  assert.ok(v.includes('URL:https://mohdshayan.com'));
  assert.equal(roundTrip(v), v);
  assert.equal(vcard({}), '');
});
test('qr: empty inputs give empty payloads; URLs are normalised', () => {
  assert.equal(wifi({}), '');
  assert.equal(upi({}), '');
  assert.equal(phone({ number: 'abc' }), '');
  assert.equal(normaliseUrl('example.com/page?x=1'), 'https://example.com/page?x=1');
  assert.equal(normaliseUrl('mailto:x@y.z'), 'mailto:x@y.z');
  assert.equal(normaliseUrl('not a url'), 'not a url');
  assert.ok(UPI_ID.test('name.surname@okicici') && !UPI_ID.test('no-at-sign'));
});
test('qr: capacity overflow throws a readable error', () => {
  assert.throws(() => encode('x'.repeat(3000), 'H'), /Too much data/);
});
test('qr: SVG output and colour checks', () => {
  const svg = toSvg(encode('abc'), { fg: '#112233', bg: '#ffffff', margin: 2, title: 'QR <test>' });
  assert.ok(svg.startsWith('<svg') && svg.includes('fill="#112233"') && svg.includes('QR &lt;test>'));
  assert.ok(contrast('#000000', '#ffffff') > 20);
  assert.ok(isInverted('#ffffff', '#000000') && !isInverted('#000000', '#ffffff'));
});
