// Duplicate line remover page: live processing of the pasted lines, copy and download. Text never leaves the page.
import { $, plain, copyText, download, debounce } from './kit.js';
import { processLines, charCount } from './lib/lines.js';

const form = $('#ln-form');
const input = $('#ln-in');
const out = $('#ln-out');
const live = $('#ln-live');
const count = n => plain(n, 0, 'USD'); // any non-INR code means the visitor's own digit grouping rather than lakhs
const noun = (n, one, many) => `${count(n)} ${n === 1 ? one : many}`;

const SAMPLE = 'Apple\napple\nBanana\n   cherry\ncherry\n\nfile10.txt\nfile2.txt\nfile1.txt\nbanana\nApple\n';
let result = null;
let lastSummary = '';

const options = () => ({
  dedupe: $('#ln-dedupe').checked, caseSensitive: $('#ln-case').checked, ignoreWhitespace: $('#ln-space').checked,
  trim: $('#ln-trim').checked, removeEmpty: $('#ln-empty').checked, sort: $('#ln-sort').value, reverse: $('#ln-reverse').checked,
  number: $('#ln-number').checked, prefix: $('#ln-prefix').value, suffix: $('#ln-suffix').value,
});

function render() {
  const source = input.value;
  $('#ln-clear').hidden = !source;
  // The two comparison options only mean something while duplicates are being removed
  const dedupe = $('#ln-dedupe').checked;
  for (const id of ['case', 'space']) {
    $(`#ln-${id}`).disabled = !dedupe;
    $(`#ln-${id}-label`).classList.toggle('opacity-50', !dedupe);
  }
  result = processLines(source, options());
  out.value = result.text;
  const s = result.stats;
  $('#ln-in-stats').textContent = `${noun(s.linesIn, 'line', 'lines')} · ${noun(charCount(source), 'character', 'characters')}`;
  const chips = [['Lines in', s.linesIn, false], ['Lines out', s.linesOut, false], ['Duplicates removed', s.duplicatesRemoved, true], ['Empty removed', s.emptyRemoved, true]];
  $('#ln-stats').innerHTML = source ? chips.map(([label, n, hot]) => `<span class="count-chip${hot && n ? ' hot' : ''}">${label} <b>${count(n)}</b></span>`).join('') : '';
  $('#ln-copy').disabled = $('#ln-download').disabled = !result.text;
}
const renderSoon = debounce(render, 120);

// The chips are visual. A screen reader hears the counts as one sentence, after a pause in typing or at once
// for a tick, and only when they have changed, rather than four chips after every keystroke.
function summary() {
  const s = result.stats;
  if (!s.linesIn) return '';
  const parts = [`${noun(s.linesIn, 'line', 'lines')} in, ${noun(s.linesOut, 'line', 'lines')} out`];
  if (s.duplicatesRemoved) parts.push(`${noun(s.duplicatesRemoved, 'duplicate', 'duplicates')} removed`);
  if (s.emptyRemoved) parts.push(`${noun(s.emptyRemoved, 'empty line', 'empty lines')} removed`);
  return `${parts.join(', ')}.`;
}
function announce(note = '') {
  const text = summary();
  const changed = text !== lastSummary;
  lastSummary = text;
  if (note || (changed && text)) live.textContent = note ? `${note} ${text}`.trim() : text;
}
const announceSoon = debounce(announce, 1000);

// Typing in a text field waits for a pause; a tick or a sort choice shows at once
form.addEventListener('input', e => {
  if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') { render(); announce(); } else { renderSoon(); announceSoon(); }
});
$('#ln-sample').addEventListener('click', () => { input.value = SAMPLE; render(); input.focus(); announce('Example list added.'); });
$('#ln-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); announce(); });
$('#ln-copy').addEventListener('click', e => { if (result && result.text) copyText(result.text, e.currentTarget, live); });
$('#ln-download').addEventListener('click', () => { if (result && result.text) download(result.text, 'cleaned-lines.txt'); });
render();
