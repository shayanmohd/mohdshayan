// Hash & UUID generator page. Text and files are hashed on the device: SHA through the Web Crypto API and MD5 in plain
// JavaScript from lib/hash.js. Nothing is sent anywhere, and nothing is written to the address bar or to storage.
import { $, $$, num, radio, plain, copyText, download, debounce, icon } from './kit.js';
import { ALGORITHMS, hashBytes, utf8, textStats, formatDigest, findMatch, uuids, clampCount, formatUuid, formatBytes } from './lib/hash.js';

const input = $('#hx-in');
const fileInput = $('#hx-file');
const drop = $('#hx-drop');
const status = $('#hx-status');
const compare = $('#hx-compare');
const live = $('#hx-live');
const SAMPLE = 'The quick brown fox jumps over the lazy dog';
const CHUNK = 4 * 1024 * 1024; // MD5 is fed 4 MB at a time, with a repaint between chunks

let file = null;    // the dropped file, or null while the text box is the source
let digests = null; // { md5, sha1, sha256, sha384, sha512 } of the current source, as bytes
let run = 0;        // bumped for every new source, so a slow file never overwrites a newer result
let controller = null;

// ---------- digests ----------
$('#hx-rows').innerHTML = ALGORITHMS.map(a => `<li class="grid grid-flow-dense grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 border-t border-hairline">
    <span class="mono-meta text-ink">${a.name} <span class="text-muted">${plain(a.bits, 0)}-bit</span></span>
    <code class="col-span-2 sm:col-span-1 font-mono text-[0.8125rem] leading-relaxed text-body break-all" id="hx-${a.id}">...</code>
    <button type="button" class="btn-ghost btn-sm" data-copy="${a.id}" aria-label="Copy the ${a.name} digest">${icon('copy')} <span data-label>Copy</span></button>
  </li>`).join('');

const digestText = id => formatDigest(digests[id], radio('fmt'));
function renderDigests() {
  for (const a of ALGORITHMS) $(`#hx-${a.id}`).textContent = digests ? digestText(a.id) : '...';
  renderCompare();
}
function renderCompare() {
  const el = $('#hx-compare-status');
  const text = compare.value.trim();
  if (!text || !digests) { el.className = 'status-line'; el.textContent = ''; return; }
  const match = findMatch(text, digests);
  el.className = `status-line ${match ? 'ok' : 'bad'}`;
  el.textContent = match ? `Matches the ${match.name} digest.` : 'Does not match any of the five digests.';
}

async function hashSource() {
  const id = ++run;
  if (controller) controller.abort();
  controller = new AbortController();
  const bytes = file ? null : utf8(input.value);
  const label = file ? `${file.name} · ${formatBytes(file.size)}` : `Text · ${plain(bytes.length, 0)} bytes as UTF-8`;
  status.className = 'status-line';
  try {
    let data = bytes;
    if (file) { // the rows and the compare field must not keep describing the previous source while this one is read
      digests = null;
      renderDigests();
      status.textContent = `Reading ${label}`;
      data = new Uint8Array(await file.arrayBuffer());
    }
    if (id !== run) return;
    const result = await hashBytes(data, { chunkSize: CHUNK, signal: controller.signal, onProgress: p => {
      if (id === run && p.total > CHUNK) status.textContent = `Hashing ${label}: ${plain(p.percent, 0)}%`;
    } });
    if (id !== run) return;
    digests = result;
    status.textContent = data.length || file ? label : 'Nothing typed yet, so these are the digests of empty input.';
    renderDigests();
  } catch (e) {
    if (e.name === 'AbortError' || id !== run) return;
    digests = null;
    renderDigests();
    status.className = 'status-line bad';
    status.textContent = `Could not hash ${label}: ${e.message}`;
  }
}
const hashSoon = debounce(hashSource, 80);

function updateStats() {
  const s = textStats(input.value);
  $('#hx-in-stats').textContent = `${plain(s.bytes, 0)} ${s.bytes === 1 ? 'byte' : 'bytes'} · ${plain(s.characters, 0)} ${s.characters === 1 ? 'character' : 'characters'}`;
  $('#hx-clear').hidden = !input.value;
}
function setFile(f) {
  if (!f) return;
  file = f;
  fileInput.value = ''; // the File object is kept in `file`, so choosing the same file again still fires change
  $('#hx-file-name').textContent = `${f.name} · ${formatBytes(f.size)}`;
  $('#hx-file-info').hidden = false;
  hashSource();
}
function clearFile() {
  file = null;
  $('#hx-file-info').hidden = true;
}

input.addEventListener('input', () => { updateStats(); if (file) clearFile(); hashSoon(); }); // typing makes the text box the source again
$('#hx-sample').addEventListener('click', () => { input.value = SAMPLE; updateStats(); clearFile(); hashSource(); input.focus(); live.textContent = 'Example text added.'; });
$('#hx-clear').addEventListener('click', () => { input.value = ''; updateStats(); clearFile(); hashSource(); input.focus(); });
fileInput.addEventListener('change', () => setFile(fileInput.files[0]));
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => setFile(e.dataTransfer.files[0]));
$('#hx-file-clear').addEventListener('click', () => { clearFile(); hashSource(); live.textContent = 'File removed. Hashing the text box again.'; });
$$('input[name="fmt"]').forEach(el => el.addEventListener('change', () => { if (digests) renderDigests(); }));
compare.addEventListener('input', renderCompare);
$('#hx-rows').addEventListener('click', e => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  if (digests) copyText(digestText(btn.dataset.copy), btn, live); else live.textContent = 'Nothing to copy yet.';
});
$('#hx-copy-all').addEventListener('click', e => { if (digests) copyText(ALGORITHMS.map(a => `${a.name}: ${digestText(a.id)}`).join('\n'), e.currentTarget, live); else live.textContent = 'Nothing to copy yet.'; });

// ---------- UUIDs ----------
const uuidOut = $('#hx-uuids');
const countInput = $('#hx-count');
let list = uuids(countInput.value);
const uuidText = () => list.map(u => formatUuid(u, { upper: $('#hx-upper').checked, braces: $('#hx-braces').checked })).join('\n');
function renderUuids() {
  uuidOut.textContent = uuidText();
  $('#hx-uuid-count').textContent = `${plain(list.length, 0)} ${list.length === 1 ? 'UUID' : 'UUIDs'}, version 4`;
}
function setCount(n) { // keeps the ones already on screen: tops the list up or trims it
  if (n > list.length) list = list.concat(uuids(n - list.length));
  list.length = n;
  renderUuids();
}
countInput.addEventListener('input', () => { const n = num(countInput.value); if (Number.isFinite(n)) setCount(clampCount(n)); });
countInput.addEventListener('focusout', () => { countInput.value = String(list.length); });
$$('#hx-upper, #hx-braces').forEach(el => el.addEventListener('change', renderUuids));
$('#hx-uuid-new').addEventListener('click', () => { list = uuids(list.length); renderUuids(); live.textContent = `${plain(list.length, 0)} new ${list.length === 1 ? 'UUID' : 'UUIDs'} generated.`; });
$('#hx-uuid-copy').addEventListener('click', e => copyText(uuidText(), e.currentTarget, live));
$('#hx-uuid-download').addEventListener('click', () => download(`${uuidText()}\n`, 'uuids.txt'));

// ---------- reference table ----------
const NOTES = {
  md5: 'Checksums and spotting duplicate files. Not for signatures or passwords.',
  sha1: 'Legacy only: git object names and old signatures. Collisions are known.',
  sha256: 'The default for new work: downloads, signatures, certificates.',
  sha384: 'SHA-512 cut to 384 bits; common in TLS cipher suites.',
  sha512: 'Faster than SHA-256 on 64-bit processors, with a longer digest.',
};
// Below the sm breakpoint the note moves to its own row under the numbers, so the table never needs sideways scrolling on a phone.
$('#hx-glance tbody').innerHTML = ALGORITHMS.map(a => `<tr><td class="max-sm:!border-b-0">${a.name}</td><td class="max-sm:!border-b-0">${plain(a.bits, 0)}</td><td class="max-sm:!border-b-0">${plain(a.hexLength, 0)}</td><td class="max-sm:!border-b-0">${plain(a.base64Length, 0)}</td><td class="!text-left !whitespace-normal min-w-[12rem] hidden sm:table-cell">${NOTES[a.id]}</td></tr>
  <tr class="sm:hidden"><td colspan="4" class="!text-left !whitespace-normal !text-body !pt-0">${NOTES[a.id]}</td></tr>`).join('');

updateStats();
hashSource();
renderUuids();
