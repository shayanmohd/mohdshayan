// Image compressor page: decode with the browser, redraw on a canvas, re-encode. Files never leave the device.
import { $, $$, radio, setRadio, download, debounce, escapeHtml, icon } from './kit.js';
import { zipStore, formatBytes, fitWithin } from './lib/zip.js';

const input = $('#cx-file');
const drop = $('#cx-drop');
const list = $('#cx-list');
const status = $('#cx-status');
const quality = $('#cx-quality');
const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/avif': 'avif', 'image/png': 'png' };
const NAMES = { 'image/webp': 'WebP', 'image/jpeg': 'JPEG', 'image/avif': 'AVIF', 'image/png': 'PNG' };

/** @type {{id:number, file:File, name:string, srcUrl:string, out?:Blob, outUrl?:string, kept?:boolean, w?:number, h?:number, ow?:number, oh?:number, error?:string}[]} */
let items = [];
let nextId = 1;

// ---------- encoder support ----------
// Browsers silently fall back to PNG for formats they cannot encode, so test each one with a 1-pixel canvas.
const encodes = {};
async function probe(type) {
  const c = document.createElement('canvas');
  c.width = c.height = 2;
  const blob = await new Promise(res => c.toBlob(res, type, 0.5));
  return Boolean(blob) && blob.type === type;
}
async function detectSupport() {
  for (const type of Object.keys(EXT)) encodes[type] = await probe(type);
  $$('input[name="format"]').forEach(el => {
    el.disabled = !encodes[el.value];
    el.closest('label').title = encodes[el.value] ? '' : `This browser cannot save ${NAMES[el.value]}`;
  });
  if (!encodes[radio('format')]) setRadio('format', encodes['image/webp'] ? 'image/webp' : 'image/jpeg');
  describeFormat();
}
function describeFormat() {
  const f = radio('format');
  quality.disabled = f === 'image/png';
  $('#cx-quality-value').textContent = f === 'image/png' ? 'lossless' : quality.value;
  quality.style.setProperty('--fill', `${((quality.value - quality.min) / (quality.max - quality.min)) * 100}%`);
  $('#cx-format-help').textContent = {
    'image/webp': 'WebP: the best default for websites and chat apps. Much smaller than JPEG at the same quality.',
    'image/jpeg': 'JPEG: for places that only accept JPEG. Transparent areas become white.',
    'image/avif': 'AVIF: the smallest files, readable by all current browsers. Encoding takes a little longer.',
    'image/png': 'PNG: lossless, for screenshots and graphics with sharp edges or transparency. Resizing is what saves space here.',
  }[f];
}

// ---------- processing ----------
async function encode(item, runId) {
  const type = radio('format');
  const max = Number($('#cx-max').value);
  const q = Number(quality.value) / 100;
  const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
  if (runId !== run) { bitmap.close && bitmap.close(); return; }
  const size = fitWithin(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size.width, size.height); }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  item.w = bitmap.width; item.h = bitmap.height;
  bitmap.close && bitmap.close();
  const blob = await new Promise(res => canvas.toBlob(res, type, type === 'image/png' ? undefined : q));
  if (!blob) throw new Error('The browser could not encode this image.');
  // Keep the original when re-encoding would only make the same kind of file bigger
  const resized = size.width !== item.w || size.height !== item.h;
  item.kept = blob.size >= item.file.size && item.file.type === type && !resized;
  item.out = item.kept ? item.file : blob;
  item.ow = size.width; item.oh = size.height;
  if (item.outUrl && item.outUrl !== item.srcUrl) URL.revokeObjectURL(item.outUrl);
  item.outUrl = item.kept ? item.srcUrl : URL.createObjectURL(blob);
  item.name = `${item.file.name.replace(/\.[^.]+$/, '') || 'image'}.${item.kept ? (item.file.name.split('.').pop() || EXT[type]) : EXT[type]}`;
}

let run = 0;
async function processAll(onlyNew = false) {
  const runId = ++run;
  const todo = items.filter(i => !onlyNew || !i.out);
  let done = 0;
  for (const item of todo) {
    status.textContent = `Compressing ${done + 1} of ${todo.length}…`;
    item.error = '';
    item.busy = true;
    renderItem(item);
    try { await encode(item, runId); } catch (e) { item.error = /decode|source|format|state/i.test(e.message) ? 'This browser cannot open this file type (HEIC photos, for example).' : e.message; }
    item.busy = false;
    if (runId !== run) return;
    renderItem(item);
    done++;
  }
  status.textContent = '';
  renderSummary();
}
const reprocess = debounce(() => { if (items.length) processAll(false); }, 250);

function addFiles(files) {
  const images = [...files].filter(f => /^image\//.test(f.type));
  if (!images.length) { status.textContent = 'Those files are not images.'; $('#cx-results').hidden = !items.length; return; }
  for (const file of images) items.push({ id: nextId++, file, name: file.name, srcUrl: URL.createObjectURL(file) });
  $('#cx-results').hidden = false;
  list.innerHTML = items.map(i => `<li data-id="${i.id}"></li>`).join('');
  items.forEach(renderItem);
  renderSummary();
  processAll(true);
}

// ---------- rendering ----------
function renderItem(item) {
  const li = list.querySelector(`[data-id="${item.id}"]`);
  if (!li) return;
  const saved = item.out ? 1 - item.out.size / item.file.size : 0;
  const dims = item.w ? `${item.w}×${item.h}${item.ow !== item.w ? ` → ${item.ow}×${item.oh}` : ''}` : '';
  const state = item.error ? `<span class="field-error">${escapeHtml(item.error)}</span>`
    : item.busy || !item.out ? '<span class="hint">Working…</span>'
    : item.kept ? `<span class="saving worse">Already optimised · kept the original</span>`
    : `<span class="hint">${formatBytes(item.file.size)} → <b class="text-ink">${formatBytes(item.out.size)}</b></span> <span class="saving${saved <= 0 ? ' worse' : ''}">${saved > 0 ? `−${Math.round(saved * 100)}%` : `+${Math.round(-saved * 100)}%`}</span>`;
  li.innerHTML = `<img src="${item.outUrl || item.srcUrl}" alt="" loading="lazy">
    <div class="min-w-0">
      <p class="text-sm text-ink truncate" title="${escapeHtml(item.file.name)}">${escapeHtml(item.out ? item.name : item.file.name)}</p>
      <p class="mt-0.5 flex flex-wrap items-center gap-x-2">${state}</p>
      ${dims ? `<p class="hint mt-0.5">${dims}</p>` : ''}
    </div>
    <div class="flex items-center gap-2">
      <button type="button" class="icon-btn" data-act="compare" aria-label="Compare ${escapeHtml(item.file.name)}"${item.out && !item.kept ? '' : ' disabled'}>${icon('eye')}</button>
      <button type="button" class="icon-btn" data-act="download" aria-label="Download ${escapeHtml(item.name)}"${item.out ? '' : ' disabled'}>${icon('download-simple')}</button>
      <button type="button" class="icon-btn" data-act="remove" aria-label="Remove ${escapeHtml(item.file.name)}">${icon('x')}</button>
    </div>`;
}
function renderSummary() {
  const ready = items.filter(i => i.out);
  const before = ready.reduce((a, i) => a + i.file.size, 0);
  const after = ready.reduce((a, i) => a + i.out.size, 0);
  $('#cx-summary').textContent = `${items.length} image${items.length === 1 ? '' : 's'}${ready.length ? ` · ${formatBytes(before)} → ${formatBytes(after)}${before > after ? ` · saved ${Math.round((1 - after / before) * 100)}%` : ''}` : ''}`;
  $('#cx-zip').disabled = !ready.length;
  $('#cx-results').hidden = !items.length;
}

list.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const item = items.find(i => String(i.id) === btn.closest('[data-id]').dataset.id);
  if (!item) return;
  if (btn.dataset.act === 'download' && item.out) download(item.out, item.name);
  if (btn.dataset.act === 'compare') openCompare(item);
  if (btn.dataset.act === 'remove') {
    URL.revokeObjectURL(item.srcUrl);
    if (item.outUrl && item.outUrl !== item.srcUrl) URL.revokeObjectURL(item.outUrl);
    items = items.filter(i => i !== item);
    btn.closest('li').remove();
    renderSummary();
  }
});
$('#cx-clear').addEventListener('click', () => {
  run++;
  items.forEach(i => { URL.revokeObjectURL(i.srcUrl); if (i.outUrl && i.outUrl !== i.srcUrl) URL.revokeObjectURL(i.outUrl); });
  items = [];
  list.innerHTML = '';
  input.value = '';
  renderSummary();
});
$('#cx-zip').addEventListener('click', async () => {
  const ready = items.filter(i => i.out);
  if (!ready.length) return;
  status.textContent = 'Building the zip…';
  const files = await Promise.all(ready.map(async i => ({ name: i.name, data: new Uint8Array(await i.out.arrayBuffer()) })));
  download(new Blob([zipStore(files)], { type: 'application/zip' }), 'compressed-images.zip');
  status.textContent = '';
});

// ---------- compare dialog ----------
const dialog = $('#cx-dialog');
function openCompare(item) {
  $('#cx-before').src = item.srcUrl;
  $('#cx-after').src = item.outUrl;
  $('#cx-dialog-title').textContent = item.file.name;
  $('#cx-tag-before').textContent = `Original · ${formatBytes(item.file.size)}`;
  $('#cx-tag-after').textContent = `${NAMES[item.out.type] || 'Result'} · ${formatBytes(item.out.size)}`;
  setPos(50);
  dialog.showModal();
}
function setPos(v) { $('#cx-pos').value = String(v); $('#cx-compare').style.setProperty('--pos', `${v}%`); $('#cx-pos').style.setProperty('--fill', `${v}%`); }
$('#cx-pos').addEventListener('input', e => setPos(e.target.value));
$('#cx-compare').addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' && e.buttons === 0 && !e.shiftKey) {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(Math.round(((e.clientX - r.left) / r.width) * 100));
  }
});
$('#cx-dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

// ---------- input ----------
input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('drag'); }));
drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
document.addEventListener('paste', e => {
  const files = [...(e.clipboardData ? e.clipboardData.files : [])];
  if (files.length) addFiles(files.map((f, i) => (f.name && f.name !== 'image.png' ? f : new File([f], `pasted-${Date.now()}-${i + 1}.${(f.type.split('/')[1] || 'png')}`, { type: f.type }))));
});
$$('input[name="format"]').forEach(el => el.addEventListener('change', () => { describeFormat(); reprocess(); }));
quality.addEventListener('input', () => { describeFormat(); reprocess(); });
$('#cx-max').addEventListener('change', reprocess);

detectSupport();
