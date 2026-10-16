// JSON formatter page: format, minify, sort keys and validate on a button press, with the first error shown by line and column.
// The text stays in the textarea: it is never put in the URL, in storage or in any request.
import { $, radio, plain, pct, copyText, download, debounce, escapeHtml } from './kit.js';
import { INDENTS, SAMPLE, parseJson, formatJson, nativeError, excerpt, utf8Bytes, countLines, sizeChange } from './lib/json.js';

const input = $('#js-in');
const out = $('#js-out');
const status = $('#js-status');
const errorBox = $('#js-error');
const live = $('#js-live');
const count = n => plain(n, 0, 'USD'); // counts in the visitor's own digit grouping (1,234,567 bytes, or 12,34,567 on an Indian English browser), as the other tools do
const bytes = n => `${count(n)} ${n === 1 ? 'byte' : 'bytes'}`;
const lines = n => `${count(n)} ${n === 1 ? 'line' : 'lines'}`;
let lastAction = null; // the button whose result is on show, so a new indent can redo it
let ranText = null; // the text that result came from, so a keystroke that leaves the text as it was does not mark the result stale

$('#js-indents').innerHTML = INDENTS.map((o, i) => `<label><input type="radio" name="indent" value="${o.id}"${i ? '' : ' checked'}><span>${o.label}</span></label>`).join('');
const indentChoice = () => INDENTS.find(o => o.id === radio('indent')) || INDENTS[0];

function setStatus(text, kind = '') { status.className = `status-line${kind ? ` ${kind}` : ''}`; status.textContent = text; }
function inputStats() {
  const text = input.value;
  $('#js-clear').hidden = !text;
  $('#js-in-stats').textContent = `${bytes(utf8Bytes(text))} · ${lines(countLines(text))}`;
}
const PREVIEW = 200000; // characters shown in the result box: a 10 MB result would take the browser seconds to lay out
const MAX_RESULT = 100000000; // characters. Past this a result needs hundreds of megabytes (10,000 nested arrays at 4 spaces make 400 MB), so the page refuses it rather than run out of memory
let result = ''; // the whole result, which Copy and Download use
function showOutput(text) {
  result = text;
  out.value = text.length > PREVIEW ? text.slice(0, PREVIEW) : text;
  const cut = text.length > PREVIEW ? ` · showing the first ${count(PREVIEW)} characters` : '';
  $('#js-out-stats').textContent = text ? `${bytes(utf8Bytes(text))} · ${lines(countLines(text))}${cut}` : '';
  $('#js-copy').disabled = $('#js-download').disabled = !text;
}
function clearError() { errorBox.innerHTML = ''; input.removeAttribute('aria-invalid'); }
// Line and column numbers are printed as an editor shows them, without grouping. The offending character is marked inside the
// excerpt rather than pointed at by a caret on the line below, which drifts after wide or combining glyphs (emoji, Hindi, CJK).
// An error without an offset is the browser's own message, which may name no position.
function showError(error) {
  const located = error.offset != null;
  let detail = '';
  if (located) {
    const x = excerpt(input.value, error.offset), chars = Array.from(x.line);
    const mark = `<mark style="background:var(--chipwash);color:var(--ink);border-bottom:2px solid var(--bad);border-radius:2px 2px 0 0">${escapeHtml(chars[x.caret] || ' ')}</mark>`;
    detail = `<pre class="mono-meta mt-2 whitespace-pre-wrap break-all"><span class="text-ink">${escapeHtml(chars.slice(0, x.caret).join(''))}${mark}${escapeHtml(chars.slice(x.caret + 1).join(''))}</span></pre>
    <button type="button" class="text-btn mt-1" data-goto="${error.offset}" data-line="${error.line}">Go to line ${error.line}</button>`;
  }
  errorBox.innerHTML = `<p>${located ? `Line ${error.line}, column ${error.column}. ` : ''}${escapeHtml(error.message)}.</p>${detail}`;
  input.setAttribute('aria-invalid', 'true');
  setStatus(located ? `Invalid JSON at line ${error.line}, column ${error.column}.` : 'Invalid JSON.', 'bad');
  showOutput('');
}
const describe = s => {
  const what = s.type === 'object' ? `an object with ${count(s.length)} ${s.length === 1 ? 'key' : 'keys'}`
    : s.type === 'array' ? `an array of ${count(s.length)} ${s.length === 1 ? 'item' : 'items'}` : `a single ${s.type}`;
  return s.depth ? `${what}, nested ${count(s.depth)} ${s.depth === 1 ? 'level' : 'levels'} deep` : what;
};

function run(action) {
  const text = input.value;
  lastAction = action;
  ranText = text;
  if (!text.trim()) { clearError(); showOutput(''); setStatus('Paste or type some JSON first.'); return; }
  const choice = indentChoice();
  const how = choice.id === 'tab' ? 'tabs' : choice.label;
  let r;
  try {
    r = action === 'validate' ? parseJson(text) : formatJson(text, { indent: action === 'minify' ? '' : choice.indent, sortKeys: action === 'sort', maxLength: MAX_RESULT });
  } catch (e) { // the scanner is not expected to throw; if it ever does, the browser's own verdict beats a silent failure
    r = { ok: false, error: nativeError(text) || { message: `This page could not read the document (${e.message || e})` } };
  }
  if (r.tooLarge) {
    clearError();
    showOutput('');
    setStatus(`${action === 'sort' ? 'Sorted and formatted' : 'Formatted'} with ${how}, the result would run past ${count(MAX_RESULT)} characters, more than this page can hold. Try a smaller indent, or Minify.`, 'bad');
    return;
  }
  if (!r.ok) { showError(r.error); return; }
  clearError();
  if (action === 'validate') { showOutput(''); setStatus(`Valid JSON: ${describe(r.stats)}.`, 'ok'); return; }
  showOutput(r.text);
  const before = utf8Bytes(text), after = utf8Bytes(r.text);
  const sizes = `${bytes(before)} in, ${bytes(after)} out`;
  const note = r.text.length > PREVIEW ? ' The box shows the first part; Copy and Download use the whole result.' : '';
  if (action === 'minify') {
    const change = sizeChange(before, after);
    setStatus(`Minified: ${sizes}${change.saved > 0 ? `, ${pct(change.percent, 1)} smaller` : ', already as small as it gets'}.${note}`, 'ok');
  } else {
    setStatus(`${action === 'sort' ? 'Keys sorted at every level and formatted' : 'Formatted'} with ${how}: ${sizes}.${note}`, 'ok');
  }
}

$('#js-format').addEventListener('click', () => run('format'));
$('#js-minify').addEventListener('click', () => run('minify'));
$('#js-sort').addEventListener('click', () => run('sort'));
$('#js-validate').addEventListener('click', () => run('validate'));
// A new indent redoes the formatting on show. Typing only refreshes the counts, so a 5 MB document is never parsed on every keystroke.
$('#js-indents').addEventListener('change', () => { if (lastAction === 'format' || lastAction === 'sort') run(lastAction); });
input.addEventListener('input', debounce(() => {
  inputStats();
  // Compared with ranText because a button pressed within the debounce delay of the last keystroke has already used the new text
  if (lastAction && input.value !== ranText) { lastAction = null; clearError(); setStatus('Your text changed. Press a button to update the result.'); }
}, 120));
$('#js-sample').addEventListener('click', () => {
  input.value = SAMPLE;
  inputStats();
  clearError();
  lastAction = null;
  setStatus('Example added. Press Format, Minify, Sort keys or Validate.');
  input.focus();
});
$('#js-clear').addEventListener('click', () => { input.value = ''; inputStats(); clearError(); showOutput(''); setStatus(''); lastAction = null; input.focus(); });
$('#js-copy').addEventListener('click', e => { if (result) copyText(result, e.currentTarget, live); });
$('#js-download').addEventListener('click', () => {
  if (result) download(result, `${lastAction === 'minify' ? 'minified' : lastAction === 'sort' ? 'sorted' : 'formatted'}.json`, 'application/json');
});
// "Go to line" puts the cursor on the offending character and scrolls the textarea to it
errorBox.addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (!b) return;
  const at = Number(b.dataset.goto);
  const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 24;
  input.focus();
  input.setSelectionRange(at, Math.min(at + 1, input.value.length));
  input.scrollTop = Math.max(0, (Number(b.dataset.line) - 1) * lineHeight - input.clientHeight / 2);
});
inputStats();
