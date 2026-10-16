// Word counter page: counts, reading and speaking times and keyword density, all worked out on the device.
// The text stays in the textarea: it is never put in the URL, in storage or in any request.
import { $, plain, pct, copyText, debounce, escapeHtml } from './kit.js';
import { analyse, topWords, formatDuration, timesFor, READING_WPM, SPEAKING_WPM } from './lib/word-counter.js';

const input = $('#wc-in');
const live = $('#wc-live');
const stopWords = $('#wc-stop');
const tbody = $('#wc-table tbody');
const count = n => plain(n, 0, 'USD'); // any non-INR code means the visitor's own digit grouping rather than lakhs
let stats = analyse('');
let lastTable = '';

const noteRow = text => `<tr><td colspan="3" class="!whitespace-normal text-muted">${text}</td></tr>`;

function renderKeywords() {
  const rows = topWords(stats, { includeStopWords: stopWords.checked });
  const html = !stats.characters ? noteRow('Type or paste text to see which words you use most.')
    : !stats.words ? noteRow('No words yet: only spaces, punctuation or symbols so far.')
    : !rows.length ? noteRow('Only stop words so far. Tick Include stop words to list them.')
    : rows.map(r => `<tr><td class="!whitespace-normal [overflow-wrap:anywhere]">${escapeHtml(r.word)}</td><td>${count(r.count)}</td><td>${pct(r.percent, 2)}</td></tr>`).join('');
  if (html !== lastTable) { tbody.innerHTML = html; lastTable = html; } // untouched rows are not re-announced
  return rows;
}

function render() {
  const text = input.value;
  stats = analyse(text);
  const reading = formatDuration(stats.readingSeconds);
  const speaking = formatDuration(stats.speakingSeconds);
  $('#wc-clear').hidden = !text;
  $('#wc-words').textContent = count(stats.words);
  $('#wc-rows').hidden = !text; // punctuation-only or emoji-only text still has characters worth counting
  $('#wc-sub').textContent = !text ? 'Type or paste text to see the counts.'
    : !stats.words ? 'No words yet: only spaces, punctuation or symbols so far.'
    : `${reading} to read, ${speaking} to say aloud.`;
  $('#wc-characters').textContent = count(stats.characters);
  $('#wc-no-spaces').textContent = count(stats.charactersNoSpaces);
  $('#wc-sentences').textContent = count(stats.sentences);
  $('#wc-paragraphs').textContent = count(stats.paragraphs);
  $('#wc-lines').textContent = count(stats.lines);
  $('#wc-unique').textContent = count(stats.uniqueWords);
  $('#wc-average').textContent = plain(stats.averageWordLength, 1, 'USD');
  $('#wc-longest').textContent = stats.longestWord || 'none';
  $('#wc-reading').textContent = reading;
  $('#wc-speaking').textContent = speaking;
  renderKeywords();
}
const renderSoon = debounce(render, 120);

// Plain-text version of the readout and the keyword table, for Copy stats
function summary() {
  const rows = topWords(stats, { includeStopWords: stopWords.checked });
  return [
    `Words: ${count(stats.words)}`,
    `Characters: ${count(stats.characters)} (${count(stats.charactersNoSpaces)} without spaces)`,
    `Sentences: ${count(stats.sentences)}`,
    `Paragraphs: ${count(stats.paragraphs)}`,
    `Lines: ${count(stats.lines)}`,
    `Unique words: ${count(stats.uniqueWords)}`,
    `Average word length: ${plain(stats.averageWordLength, 1, 'USD')}`,
    `Longest word: ${stats.longestWord || 'none'}`,
    `Reading time: ${formatDuration(stats.readingSeconds)} at ${READING_WPM} wpm`,
    `Speaking time: ${formatDuration(stats.speakingSeconds)} at ${SPEAKING_WPM} wpm`,
    rows.length ? `Most used words${stopWords.checked ? '' : ' (stop words left out)'}: ${rows.map(r => `${r.word} (${count(r.count)}, ${pct(r.percent, 2)})`).join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

// Reference table: reading and speaking times for common lengths
const GLANCE = [[100, 'A short email'], [250, 'One double-spaced page'], [500, 'A one-page letter'], [1000, 'A short blog post'],
  [1500, 'A long article'], [2000, 'A magazine feature'], [5000, 'A short story'], [10000, 'A thesis chapter']];
// On phones the four columns do not fit, so each description sits on its own line above its three figures,
// and a time wraps only between its units ("1 hr 6 min" over "40 sec")
const PHONE_ROW = 'max-sm:grid max-sm:grid-cols-[3rem_1fr_1fr]';
const keepUnits = s => s.replace(/ (hr|min|sec)/g, '\u00a0$1');
$('#wc-glance tbody').innerHTML = GLANCE.map(([w, what]) => {
  const t = timesFor(w);
  return `<tr class="${PHONE_ROW}"><td class="max-sm:col-span-3 max-sm:!border-b-0 max-sm:!pb-0">${what}</td><td class="max-sm:!px-0">${count(w)}</td>`
    + `<td class="max-sm:!px-0 max-sm:!whitespace-normal">${keepUnits(formatDuration(t.reading))}</td><td class="max-sm:!px-0 max-sm:!whitespace-normal">${keepUnits(formatDuration(t.speaking))}</td></tr>`;
}).join('');

input.addEventListener('input', renderSoon);
stopWords.addEventListener('change', renderKeywords);
$('#wc-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); live.textContent = 'Text cleared.'; });
$('#wc-copy').addEventListener('click', e => {
  if (stats.characters) copyText(summary(), e.currentTarget, live);
  else live.textContent = 'Nothing to copy yet. Type or paste some text first.';
});
render();
