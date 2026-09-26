// Password, passphrase and PIN generation. Pure functions: randomness comes from `rng`, which defaults to
// the Web Crypto API and can be swapped for a deterministic source in tests.

export const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
};
// Characters that are easy to misread in many fonts
export const LOOKALIKES = 'Il1|O0o';

/** Uniform integer in [0, n) from crypto.getRandomValues, using rejection sampling to avoid modulo bias. */
export function secureRandom(n) {
  if (!(n >= 1 && n <= 2 ** 32)) throw new RangeError('n out of range');
  const limit = 2 ** 32 - (2 ** 32 % n);
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

function pools(opts) {
  const strip = s => (opts.avoidLookalikes ? [...s].filter(c => !LOOKALIKES.includes(c)).join('') : s);
  return ['upper', 'lower', 'digits', 'symbols'].filter(k => opts[k]).map(k => strip(SETS[k])).filter(Boolean);
}

/**
 * Random password. Every chosen character type appears at least once (when the length allows), which is done by
 * redrawing rather than by forcing positions, so every valid password stays equally likely.
 */
export function password(opts, rng = secureRandom) {
  const sets = pools(opts);
  if (!sets.length) return '';
  const all = sets.join('');
  const length = Math.max(1, Math.floor(opts.length));
  const mustCover = length >= sets.length;
  for (let attempt = 0; attempt < 1000; attempt++) {
    let out = '';
    for (let i = 0; i < length; i++) out += all[rng(all.length)];
    if (!mustCover || sets.every(s => [...out].some(c => s.includes(c)))) return out;
  }
  throw new Error('could not satisfy the character rules');
}

export function passwordEntropy(opts) {
  const n = pools(opts).join('').length;
  return n ? Math.floor(opts.length) * Math.log2(n) : 0;
}

/** Passphrase from a word list: separator between words, optional capitals and one digit on a random word. */
export function passphrase({ words = 6, separator = '-', capitalize = false, number = false }, list, rng = secureRandom) {
  const picked = Array.from({ length: words }, () => list[rng(list.length)]);
  const shaped = capitalize ? picked.map(w => w[0].toUpperCase() + w.slice(1)) : picked;
  if (number && shaped.length) {
    const at = rng(shaped.length);
    shaped[at] += String(rng(10));
  }
  return shaped.join(separator);
}
export const passphraseEntropy = ({ words = 6, number = false }, listSize) => words * Math.log2(listSize) + (number ? Math.log2(10) + Math.log2(words) : 0);

export const pin = (length, rng = secureRandom) => Array.from({ length }, () => rng(10)).join('');
export const pinEntropy = length => length * Math.log2(10);

/** Strength band for an entropy in bits. */
export function strength(bits) {
  if (bits < 45) return { level: 1, label: 'Weak' };
  if (bits < 60) return { level: 2, label: 'Fair' };
  if (bits < 80) return { level: 3, label: 'Strong' };
  return { level: 4, label: 'Very strong' };
}

/**
 * Average time for an attacker who knows the method to guess it, at `rate` guesses a second
 * (1e11 is a fast offline attack on a leaked, weakly hashed password). Returns a human phrase.
 */
export function crackTime(bits, rate = 1e11) {
  const seconds = Math.pow(2, bits - 1) / rate;
  const units = [['year', 31557600], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  if (seconds < 1) return 'less than a second';
  const years = seconds / 31557600;
  if (years >= 1e6) {
    const big = [[1e18, 'quintillion'], [1e15, 'quadrillion'], [1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']].find(([v]) => years >= v);
    const n = years / big[0];
    return n >= 1000 ? 'longer than the age of the universe many times over' : `about ${Math.round(n).toLocaleString('en')} ${big[1]} years`;
  }
  for (const [name, s] of units) {
    if (seconds >= s) { const n = Math.round(seconds / s); return `about ${n.toLocaleString('en')} ${name}${n === 1 ? '' : 's'}`; }
  }
  return 'less than a second';
}
