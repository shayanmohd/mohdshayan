// Base64 and URL encoder page: four codecs, either direction, live as you type. Nothing entered here leaves the browser.
import { $, $$, radio, plain, copyText, download, debounce, escapeHtml } from './kit.js';
import { run, measure } from './lib/encode.js';

const input = $('#en-in');
const output = $('#en-out');
const status = $('#en-status');
const live = $('#en-live');
let direction = 'encode';

const SAMPLES = {
  base64: 'Hello, world! नमस्ते 😀',
  url: "https://example.com/search?q=Tom & Jerry's café&page=2",
  html: 'Tom & Jerry\'s <b>café</b> © 2026 → "∞"',
  hex: 'Hello, world! नमस्ते 😀',
};
// What each codec does and what its decoder accepts, shown under the options
const HELP = {
  base64: 'Base64 writes the UTF-8 bytes of the text with A to Z, a to z, 0 to 9, + and /, padded with = to a multiple of 4 characters. Decoding accepts either alphabet, with or without padding, and ignores spaces and line breaks.',
  url: "A value (encodeURIComponent) escapes everything except letters, digits and - _ . ! ~ * ' ( ). A whole URL (encodeURI) also keeps ; , / ? : @ & = + $ # so the address still works. Decoding follows the same rule, so a whole URL keeps those escapes.",
  html: 'The five characters that break HTML (& < > " and \') are always encoded. Other characters above ASCII can be written as named entities where HTML defines one, or as decimal or hex numbers. Decoding reads every named and numeric entity.',
  hex: 'Each UTF-8 byte becomes two hex digits, 00 to ff. Decoding accepts upper or lower case and ignores spaces, line breaks, colons, commas and 0x prefixes between bytes.',
};
const options = () => ({
  base64: { urlSafe: $('#en-urlsafe').checked, pad: !$('#en-nopad').checked },
  url: { whole: radio('urlmode') === 'whole' },
  html: { style: radio('style'), nonAscii: $('#en-nonascii').checked },
  hex: { spaced: $('#en-spaced').checked },
}[radio('codec')]);
const stats = text => {
  const m = measure(text);
  return `${plain(m.characters, 0)} ${m.characters === 1 ? 'character' : 'characters'} · ${plain(m.bytes, 0)} ${m.bytes === 1 ? 'byte' : 'bytes'}`;
};

function render() {
  const codec = radio('codec');
  $$('[data-codec]').forEach(el => { el.hidden = el.dataset.codec !== codec; });
  $('#en-codec-help').textContent = HELP[codec];
  $('#en-encode').setAttribute('aria-pressed', String(direction === 'encode'));
  $('#en-decode').setAttribute('aria-pressed', String(direction === 'decode'));
  const source = input.value;
  $('#en-clear').hidden = !source;
  $('#en-in-stats').textContent = stats(source);
  const r = source ? run(codec, direction, source, options()) : { ok: true, text: '' };
  output.value = r.ok ? r.text : '';
  if (r.ok) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
  status.className = `status-line${r.ok ? '' : ' bad'}`;
  status.textContent = !source ? '' : !r.ok ? r.error : `${direction === 'encode' ? 'Encoded' : 'Decoded'}: ${stats(r.text)}${r.note ? `. ${r.note}` : ''}`;
}
const renderSoon = debounce(render, 120);

input.addEventListener('input', renderSoon);
$$('input[name="codec"], input[name="urlmode"], input[name="style"], #en-urlsafe, #en-nopad, #en-nonascii, #en-spaced').forEach(el => el.addEventListener('change', render));
$('#en-encode').addEventListener('click', () => { direction = 'encode'; render(); });
$('#en-decode').addEventListener('click', () => { direction = 'decode'; render(); });
$('#en-swap').addEventListener('click', () => {
  if (!output.value) { live.textContent = 'Nothing to swap yet.'; return; }
  input.value = output.value;
  direction = direction === 'encode' ? 'decode' : 'encode'; // the output of one direction is input for the other
  render();
  live.textContent = `Swapped: the output is now the input and is being ${direction === 'encode' ? 'encoded' : 'decoded'}.`;
});
$('#en-sample').addEventListener('click', () => {
  const codec = radio('codec');
  input.value = direction === 'encode' ? SAMPLES[codec] : run(codec, 'encode', SAMPLES[codec], options()).text;
  render();
  input.focus();
  live.textContent = 'Example text added.';
});
$('#en-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
$('#en-copy').addEventListener('click', e => { if (output.value) copyText(output.value, e.currentTarget, live); else live.textContent = 'Nothing to copy yet.'; });
$('#en-download').addEventListener('click', () => { if (output.value) download(output.value, `${radio('codec')}-${direction}d.txt`); else live.textContent = 'Nothing to download yet.'; });

// Reference table: one sample in every codec, so the differences between the options are visible side by side
const GLANCE = "/search?q=Tom & Jerry's café";
const ROWS = [
  ['Base64', 'base64', {}],
  ['Base64 URL-safe', 'base64', { urlSafe: true, pad: false }],
  ['URL value', 'url', {}],
  ['URL whole', 'url', { whole: true }],
  ['HTML named', 'html', {}],
  ['HTML decimal', 'html', { style: 'decimal' }],
  ['Hex', 'hex', { spaced: true }],
];
$('#en-glance tbody').innerHTML = ROWS.map(([label, codec, opts]) => `<tr><td>${label}</td><td class="!whitespace-normal !text-left [overflow-wrap:anywhere]">${escapeHtml(run(codec, 'encode', GLANCE, opts).text)}</td></tr>`).join('');

render();
