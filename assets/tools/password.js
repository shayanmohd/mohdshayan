// Password generator page. Secrets exist only in this page's memory: never in the URL, storage or any request.
import { $, $$, radio, copyText, escapeHtml } from './kit.js';
import { password, passwordEntropy, passphrase, passphraseEntropy, pin, pinEntropy, strength, crackTime, SETS } from './lib/password.js';

const form = $('#pw-form');
const out = $('#pw-out');
const live = $('#pw-live');
let words = null; // EFF list, loaded on first use (60 KB)
let secret = '';

const paintRange = r => r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
const pwOpts = () => ({ length: Number($('#pw-length').value), upper: $('#pw-upper').checked, lower: $('#pw-lower').checked, digits: $('#pw-digits').checked, symbols: $('#pw-symbols').checked, avoidLookalikes: $('#pw-lookalike').checked });
const ppOpts = () => ({ words: Number($('#pw-words').value), separator: $('#pw-sep').value, capitalize: $('#pw-cap').checked, number: $('#pw-num').checked });

// Digits and symbols get their own colour so a long secret is easier to read back
function colourise(s, kind) {
  if (kind === 'passphrase') return escapeHtml(s);
  return [...s].map(c => (SETS.digits.includes(c) ? `<span class="d">${c}</span>` : SETS.symbols.includes(c) ? `<span class="s">${escapeHtml(c)}</span>` : escapeHtml(c))).join('');
}

async function generate(announce = false) {
  const kind = radio('kind');
  $$('[data-kind]', form).forEach(el => { el.hidden = el.dataset.kind !== kind; });
  $$('.range', form).forEach(paintRange);
  $('#pw-length-out').textContent = $('#pw-length').value;
  $('#pw-words-out').textContent = $('#pw-words').value;
  $('#pw-pin-out').textContent = $('#pw-pin').value;
  $('#pw-kind').textContent = { password: 'Password', passphrase: 'Passphrase', pin: 'PIN' }[kind];

  let bits = 0;
  if (kind === 'password') {
    const o = pwOpts();
    if (!o.upper && !o.lower && !o.digits && !o.symbols) {
      secret = '';
      out.innerHTML = '<span class="text-ondark-soft text-base font-sans">Choose at least one kind of character.</span>';
      $('#pw-meter').dataset.level = '0';
      $('#pw-strength').textContent = '';
      return;
    }
    secret = password(o);
    bits = passwordEntropy(o);
  } else if (kind === 'passphrase') {
    if (!words) {
      out.innerHTML = '<span class="text-ondark-soft text-base font-sans">Loading the word list…</span>';
      words = (await import('./vendor/eff-long-wordlist.js')).default;
    }
    const o = ppOpts();
    secret = passphrase(o, words);
    bits = passphraseEntropy(o, words.length);
  } else {
    const n = Number($('#pw-pin').value);
    secret = pin(n);
    bits = pinEntropy(n);
  }
  out.innerHTML = colourise(secret, kind);
  out.classList.toggle('words', kind === 'passphrase');
  const s = strength(bits);
  $('#pw-meter').dataset.level = String(s.level);
  $('#pw-strength').textContent = kind === 'pin'
    ? `${Math.round(bits)} bits. Fine behind an attempt limit; far too short to use as a password.`
    : `${s.label} · about ${Math.round(bits)} bits. Guessing it would take ${crackTime(bits)} at 100 billion guesses a second.`;
  if (announce) live.textContent = `New ${kind} generated.`;
}

form.addEventListener('input', () => generate()); // fires for sliders, checkboxes, radios and selects alike
$('#pw-new').addEventListener('click', () => generate(true));
$('#pw-copy').addEventListener('click', e => { if (secret) copyText(secret, e.currentTarget, live); });
generate();
