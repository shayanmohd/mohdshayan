// Shared helpers for the free tools. Plain ES module, no dependencies.
// Pure maths lives in /assets/tools/lib/*.js so it can be unit-tested in Node.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Parses a typed number, accepting grouping commas, spaces and a leading currency sign. NaN when empty or invalid. */
export function num(value) {
  const s = String(value ?? '').replace(/[,\s _]/g, '').replace(/^[^\d.+-]+/, '');
  if (s === '' || s === '.' || s === '-') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Value of the checked radio in a named group. */
export const radio = (name, root = document) => (root.querySelector(`input[name="${name}"]:checked`) || {}).value;
export const setRadio = (name, value, root = document) => {
  const el = root.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);
  if (el) el.checked = true;
};

// ---------- money ----------
export const CURRENCIES = [
  ['INR', 'Indian rupee'], ['USD', 'US dollar'], ['EUR', 'Euro'], ['GBP', 'British pound'], ['AED', 'UAE dirham'],
  ['CAD', 'Canadian dollar'], ['AUD', 'Australian dollar'], ['SGD', 'Singapore dollar'], ['MYR', 'Malaysian ringgit'], ['JPY', 'Japanese yen'],
];
const REGION_CURRENCY = { IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', CA: 'CAD', AU: 'AUD', SG: 'SGD', MY: 'MYR', JP: 'JPY',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR' };

/** Best guess at the visitor's currency from their browser language, falling back to INR. */
export function guessCurrency() {
  for (const tag of navigator.languages || [navigator.language || '']) {
    const region = (tag.split('-')[1] || '').toUpperCase();
    if (REGION_CURRENCY[region]) return REGION_CURRENCY[region];
  }
  return 'INR';
}
const localeFor = cur => (cur === 'INR' ? 'en-IN' : undefined);
const fmtCache = new Map();
function formatter(cur, digits) {
  const key = `${cur}|${digits}`;
  if (!fmtCache.has(key)) {
    const zeroDecimal = cur === 'JPY';
    const d = zeroDecimal ? 0 : digits;
    fmtCache.set(key, new Intl.NumberFormat(localeFor(cur), { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', minimumFractionDigits: d, maximumFractionDigits: d }));
  }
  return fmtCache.get(key);
}
/** Currency amount. Whole units by default for large figures, paise/cents otherwise. */
export function money(n, cur = 'INR', digits) {
  if (!Number.isFinite(n)) return '–';
  const d = digits ?? (Math.abs(n) >= 1e5 ? 0 : 2);
  return formatter(cur, d).format(Math.abs(n) < 0.005 ? 0 : n); // never "-₹0.00"
}
/** The bare symbol for a currency ("₹", "$", "AED"). */
export function currencySymbol(cur) {
  const part = formatter(cur, 0).formatToParts(0).find(p => p.type === 'currency');
  return part ? part.value : cur;
}
export function plain(n, digits = 2, cur = 'INR') {
  if (!Number.isFinite(n)) return '–';
  return new Intl.NumberFormat(localeFor(cur), { maximumFractionDigits: digits }).format(n);
}
export const pct = (n, digits = 2) => (Number.isFinite(n) ? `${plain(n, digits, 'USD')}%` : '–');

/** Fills a <select> with currencies and returns the chosen code. */
export function fillCurrencySelect(select, chosen = guessCurrency()) {
  select.innerHTML = CURRENCIES.map(([c, label]) => `<option value="${c}">${c} · ${label}</option>`).join('');
  select.value = CURRENCIES.some(([c]) => c === chosen) ? chosen : 'INR';
  return select.value;
}
/** Keeps every [data-cur-symbol] prefix in sync with the currency and pads its input to fit. */
export function syncCurrencyAffixes(cur, root = document) {
  const sym = currencySymbol(cur);
  $$('[data-cur-symbol]', root).forEach(el => {
    el.textContent = sym;
    const input = el.parentElement.querySelector('.input');
    if (input) input.style.paddingLeft = `calc(${Math.max(1, sym.length)}ch + 1.35rem)`;
  });
}

// ---------- range sliders ----------
/** Paints a .range track fill and links it to a number input both ways. */
export function linkRange(range, input, { onInput, toRange = v => v, fromRange = v => v } = {}) {
  const paint = () => {
    const min = Number(range.min), max = Number(range.max), v = Number(range.value);
    range.style.setProperty('--fill', `${((v - min) / (max - min)) * 100}%`);
  };
  range.addEventListener('input', () => { input.value = fromRange(Number(range.value)); paint(); onInput && onInput(); });
  input.addEventListener('input', () => {
    const v = num(input.value);
    if (Number.isFinite(v)) { range.value = String(Math.min(Number(range.max), Math.max(Number(range.min), toRange(v)))); paint(); }
  });
  const sync = () => { const v = num(input.value); if (Number.isFinite(v)) range.value = String(toRange(v)); paint(); };
  sync();
  return sync;
}

// ---------- clipboard / download ----------
/** Copies text and gives the button brief feedback; announces through an optional live region. */
export async function copyText(text, button, live) {
  const label = button && button.querySelector('[data-label]');
  const original = label ? label.textContent : '';
  try {
    await navigator.clipboard.writeText(text);
    if (label) label.textContent = 'Copied';
    if (live) live.textContent = 'Copied to the clipboard.';
  } catch (e) {
    if (live) live.textContent = 'Copy failed. Select the text and press Ctrl+C or Cmd+C.';
  }
  if (label) setTimeout(() => { label.textContent = original; }, 1600);
}
export function download(data, filename, type = 'text/plain') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- shareable state in the URL fragment ----------
// The fragment (after #) never leaves the browser, so a calculation can be bookmarked or shared
// without the figures reaching any server. State is written only when the visitor asks for a link.
export function readHashState() {
  const h = location.hash.replace(/^#/, '');
  if (!h.includes('=')) return null;
  return Object.fromEntries(new URLSearchParams(h));
}
export function linkWithState(state) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) if (v !== '' && v != null && !(typeof v === 'number' && !Number.isFinite(v))) p.set(k, String(v)); // skip empty fields
  return `${location.origin}${location.pathname}#${p.toString()}`;
}
/** Wires a "Copy link" button: copies a URL carrying the current state and updates the address bar. */
export function shareButton(button, getState, live) {
  if (!button) return;
  button.addEventListener('click', () => {
    const url = linkWithState(getState());
    history.replaceState(history.state, '', url);
    copyText(url, button, live);
  });
}

/** Debounce for input handlers on heavier work. */
export function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const icon = (name, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"></use></svg>`;
