// deAIfy page: live cleanup, highlights, diff view, copy/download, and the optional bring-your-own-key rewrite.
import { $, $$, radio, setRadio, copyText, download, debounce, escapeHtml } from './kit.js';
import { deaify, diffTexts, findFlags } from './lib/deaify.js';
import { PROVIDERS, rewrite } from './lib/rewrite.js';

const input = $('#dx-in');
const out = $('#dx-out');
const live = $('#dx-live');
const PREFS_KEY = 'deaify.prefs';

const SAMPLE = 'In today’s fast-paced digital landscape, it’s important to note that clear writing matters more than ever. Let’s delve into the tapestry of modern communication — where clarity meets creativity.\n\n' +
  'Moreover, leveraging the right habits can seamlessly transform how your work is received. A robust approach showcases a myriad of benefits:\n\n' +
  '— Faster drafts, with fewer​ revisions\n— A “human” tone that readers trust\n\n' +
  'Keep code such as `const title = “Draft”` exactly as it is.\n\nIn conclusion, the realm of writing is evolving; those who adapt will thrive.';

let rewritten = null; // AI rewrite of the current input, if any
let rewrittenFor = null;

// ---------- preferences (per browser, never the text itself) ----------
function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    if (p.dashes) setRadio('dashes', p.dashes);
    if (p.filler) setRadio('filler', p.filler);
    for (const k of ['quotes', 'spaces', 'protect']) if (typeof p[k] === 'boolean') $(`#dx-${k}`).checked = p[k];
    if (p.provider) setRadio('provider', p.provider);
  } catch (e) { /* storage unavailable */ }
}
function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ dashes: radio('dashes'), filler: radio('filler'), quotes: $('#dx-quotes').checked,
      spaces: $('#dx-spaces').checked, protect: $('#dx-protect').checked, provider: radio('provider') }));
  } catch (e) { /* storage unavailable */ }
}
const options = () => ({ dashes: radio('dashes'), fillerWords: radio('filler'), quotes: $('#dx-quotes').checked, spaces: $('#dx-spaces').checked, protectCode: $('#dx-protect').checked });

// ---------- render ----------
const words = s => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
let last = { text: '' };

function render() {
  const source = input.value;
  $('#dx-clear').hidden = !source;
  $('#dx-in-stats').textContent = `${words(source).toLocaleString('en')} words · ${source.length.toLocaleString('en')} characters`;
  if (rewritten !== null && rewrittenFor !== source) { rewritten = null; rewrittenFor = null; }
  $('#dx-ai-note').hidden = rewritten === null;

  if (!source.trim()) {
    out.innerHTML = '<span class="placeholder">Your cleaned text appears here as you type.</span>';
    $('#dx-counts').innerHTML = '';
    last = { text: '' };
    return;
  }
  const opts = options();
  const result = deaify(rewritten ?? source, opts);
  last = result;
  const flagged = opts.fillerWords === 'flag';

  if (radio('view') === 'diff') {
    const segs = diffTexts(source, result.text);
    if (!segs) out.innerHTML = '<span class="placeholder">These versions differ too much to show word by word. Switch to Result to see the text.</span>';
    else if (!segs.some(s => s.added || s.removed)) out.innerHTML = `${escapeHtml(result.text)}<span class="placeholder">\n\nNo changes: nothing to fix with these settings.</span>`;
    else out.innerHTML = segs.map(s => (s.added ? `<ins>${escapeHtml(s.value)}</ins>` : s.removed ? `<del>${escapeHtml(s.value)}</del>` : escapeHtml(s.value))).join('');
  } else if (flagged) {
    const hits = findFlags(result.text);
    let html = '', i = 0;
    for (const h of hits) {
      html += escapeHtml(result.text.slice(i, h.start)) + `<mark title="Stock phrase (${h.category})">${escapeHtml(result.text.slice(h.start, h.end))}</mark>`;
      i = h.end;
    }
    out.innerHTML = html + escapeHtml(result.text.slice(i));
  } else {
    out.textContent = result.text;
  }

  const c = result.counts;
  const chips = [['Dashes', c.dash], ['Quotes', c.quote], ['Hidden', c.space], [flagged ? 'Phrases flagged' : 'Phrases', c.filler]];
  $('#dx-counts').innerHTML = chips.map(([label, n]) => `<span class="count-chip${n ? ' hot' : ''}">${label} <b>${n}</b></span>`).join('');
}
const renderSoon = debounce(render, 120);

input.addEventListener('input', renderSoon);
$$('input[name="dashes"], input[name="filler"], input[name="view"], #dx-quotes, #dx-spaces, #dx-protect').forEach(el => el.addEventListener('change', () => { savePrefs(); render(); }));

$('#dx-sample').addEventListener('click', () => { input.value = SAMPLE; render(); input.focus(); live.textContent = 'Example text added.'; });
$('#dx-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
$('#dx-copy').addEventListener('click', e => { if (last.text) copyText(last.text, e.currentTarget, live); });
$('#dx-download').addEventListener('click', () => { if (last.text) download(last.text, 'deaified.txt'); });

// ---------- bring-your-own-key rewrite ----------
const keyInput = $('#dx-key');
const modelInput = $('#dx-model');
const status = $('#dx-ai-status');
const storeKey = p => `deaify.key.${p}`;
const readKey = p => { try { return localStorage.getItem(storeKey(p)) || sessionStorage.getItem(storeKey(p)) || ''; } catch (e) { return ''; } };
function writeKey(p, key, remember) {
  try {
    localStorage.removeItem(storeKey(p));
    sessionStorage.removeItem(storeKey(p));
    if (key) (remember ? localStorage : sessionStorage).setItem(storeKey(p), key);
  } catch (e) { /* storage unavailable: the key lives only in the field */ }
}
function syncProvider() {
  const p = radio('provider');
  const cfg = PROVIDERS[p];
  $('#dx-models').innerHTML = cfg.models.map(([id, label]) => `<option value="${id}">${escapeHtml(label)}</option>`).join('');
  let savedModel = '';
  try { savedModel = localStorage.getItem(`deaify.model.${p}`) || ''; } catch (e) { /* ignore */ }
  modelInput.value = savedModel || cfg.defaultModel;
  keyInput.placeholder = cfg.keyPlaceholder;
  keyInput.value = readKey(p);
  let remembered = false;
  try { remembered = Boolean(localStorage.getItem(storeKey(p))); } catch (e) { /* ignore */ }
  $('#dx-remember').checked = remembered;
  $('#dx-key-link').href = cfg.keyUrl;
}
$$('input[name="provider"]').forEach(el => el.addEventListener('change', () => { savePrefs(); syncProvider(); status.textContent = ''; }));
modelInput.addEventListener('change', () => { try { localStorage.setItem(`deaify.model.${radio('provider')}`, modelInput.value.trim()); } catch (e) { /* ignore */ } });
keyInput.addEventListener('change', () => writeKey(radio('provider'), keyInput.value.trim(), $('#dx-remember').checked));
$('#dx-remember').addEventListener('change', () => writeKey(radio('provider'), keyInput.value.trim(), $('#dx-remember').checked));
$('#dx-forget').addEventListener('click', () => {
  for (const p of Object.keys(PROVIDERS)) writeKey(p, '', false);
  keyInput.value = '';
  $('#dx-remember').checked = false;
  status.className = 'status-line';
  status.textContent = 'Saved keys removed from this browser.';
});
$('#dx-key-show').addEventListener('click', e => {
  const show = keyInput.type === 'password';
  keyInput.type = show ? 'text' : 'password';
  e.currentTarget.setAttribute('aria-pressed', String(show));
  e.currentTarget.setAttribute('aria-label', show ? 'Hide key' : 'Show key');
  e.currentTarget.querySelector('use').setAttribute('href', `/assets/icons.svg#i-${show ? 'eye-slash' : 'eye'}`);
});

let controller = null;
$('#dx-rewrite').addEventListener('click', async () => {
  const source = input.value;
  const provider = radio('provider');
  const model = modelInput.value.trim() || PROVIDERS[provider].defaultModel;
  writeKey(provider, keyInput.value.trim(), $('#dx-remember').checked);
  controller = new AbortController();
  $('#dx-rewrite').disabled = true;
  $('#dx-cancel').hidden = false;
  status.className = 'status-line';
  status.textContent = `Rewriting with ${model}…`;
  try {
    const res = await rewrite({ provider, model, apiKey: keyInput.value, input: source, signal: controller.signal });
    rewritten = res.text;
    rewrittenFor = source;
    setRadio('view', 'result');
    render();
    status.className = 'status-line ok';
    status.textContent = res.truncated ? 'Done, but the reply was cut short. Try a shorter passage.' : 'Done. The rewrite is shown under Cleaned text.';
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (e) {
    status.className = e.name === 'AbortError' ? 'status-line' : 'status-line bad';
    status.textContent = e.name === 'AbortError' ? 'Cancelled.' : e.message;
  } finally {
    $('#dx-rewrite').disabled = false;
    $('#dx-cancel').hidden = true;
    controller = null;
  }
});
$('#dx-cancel').addEventListener('click', () => controller && controller.abort());
$('#dx-ai-undo').addEventListener('click', () => { rewritten = null; rewrittenFor = null; render(); live.textContent = 'Showing the on-device result.'; });

loadPrefs();
syncProvider();
render();
