// Case converter page: converts as you type, with copy and download. The text never leaves the browser.
import { $, radio, plain, copyText, download, escapeHtml } from './kit.js';
import { CASES, convertCase, count } from './lib/case-converter.js';

const input = $('#cc-in');
const output = $('#cc-out');
const live = $('#cc-live');
const locale = document.documentElement.lang || undefined; // the page language decides the letter mappings
const SAMPLE = 'welcome to the case converter. paste any text, pick a case, and copy the result.\n' +
  'XMLHttpRequest, userID number and version 2.0\n' +
  'a tale of two cities and the war of the worlds\n' +
  'café, naïve and straße keep their accents';

const n0 = n => plain(n, 0, 'USD'); // counts in the visitor's own digit grouping (100,000 characters, or 1,00,000 on an Indian English browser), as the word counter does
const stats = text => {
  const c = count(text);
  return `${n0(c.words)} ${c.words === 1 ? 'word' : 'words'} · ${n0(c.characters)} ${c.characters === 1 ? 'character' : 'characters'}`;
};

// The case tray comes from the lib's list, so the ids, labels and order stay in step
$('#cc-cases').innerHTML = CASES.map((c, i) => `<label><input type="radio" name="case" value="${c.id}"${i ? '' : ' checked'}><span>${escapeHtml(c.label)}</span></label>`).join('');

function render() {
  const source = input.value;
  const text = convertCase(source, radio('case'), { locale });
  output.value = text;
  $('#cc-clear').hidden = !source;
  $('#cc-in-stats').textContent = stats(source);
  $('#cc-out-stats').textContent = stats(text);
}

input.addEventListener('input', render);
$('#cc-cases').addEventListener('change', render);
$('#cc-sample').addEventListener('click', () => { input.value = SAMPLE; render(); input.focus(); live.textContent = 'Example text added.'; });
$('#cc-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
$('#cc-copy').addEventListener('click', e => { if (output.value) copyText(output.value, e.currentTarget, live); else live.textContent = 'Nothing to copy yet.'; });
$('#cc-download').addEventListener('click', () => { if (output.value) download(output.value, `${radio('case')}-case.txt`); else live.textContent = 'Nothing to download yet.'; });

// Reference table: one sample phrase in every case
const GLANCE = 'Hello world, from the Case Converter';
$('#cc-glance tbody').innerHTML = CASES.map(c => `<tr><td>${escapeHtml(c.label)}</td><td class="!text-left !whitespace-normal [overflow-wrap:anywhere]">${escapeHtml(convertCase(GLANCE, c.id, { locale }))}</td></tr>`).join('');

render();
