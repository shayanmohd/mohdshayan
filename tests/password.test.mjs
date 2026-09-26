import { test } from 'node:test';
import assert from 'node:assert/strict';
import { password, passwordEntropy, passphrase, passphraseEntropy, pin, secureRandom, strength, crackTime, SETS, LOOKALIKES } from '../assets/tools/lib/password.js';
import words from '../assets/tools/vendor/eff-long-wordlist.js';

test('password: secureRandom is in range and roughly uniform', () => {
  const counts = new Array(7).fill(0);
  for (let i = 0; i < 70000; i++) counts[secureRandom(7)]++;
  for (const c of counts) assert.ok(c > 9300 && c < 10700, `bucket ${c}`);
  assert.throws(() => secureRandom(0));
});
test('password: length, character classes and look-alikes', () => {
  const opts = { length: 24, upper: true, lower: true, digits: true, symbols: true, avoidLookalikes: true };
  for (let i = 0; i < 300; i++) {
    const p = password(opts);
    assert.equal(p.length, 24);
    for (const set of Object.values(SETS)) assert.ok([...p].some(c => set.includes(c)), `${p} misses a class`);
    assert.ok(![...p].some(c => LOOKALIKES.includes(c)), `${p} has a look-alike`);
  }
  assert.match(password({ length: 12, digits: true }), /^\d{12}$/);
  assert.equal(password({ length: 12 }), '');
  assert.equal(password({ length: 2, upper: true, lower: true, digits: true }).length, 2); // too short to cover every class
});
test('password: entropy', () => {
  const bits = passwordEntropy({ length: 20, upper: true, lower: true, digits: true, symbols: true });
  assert.ok(Math.abs(bits - 20 * Math.log2(26 + 26 + 10 + SETS.symbols.length)) < 1e-9);
});
test('passphrase: EFF list, separators, capitals and number', () => {
  assert.equal(words.length, 7776);
  const p = passphrase({ words: 6, separator: '-' }, words);
  assert.equal(p.split('-').length >= 6, true);
  const q = passphrase({ words: 5, separator: ' ', capitalize: true, number: true }, words);
  const parts = q.split(' ');
  assert.equal(parts.length, 5);
  assert.ok(parts.every(w => /^[A-Z]/.test(w)));
  assert.equal(parts.filter(w => /\d$/.test(w)).length, 1);
  assert.ok(Math.abs(passphraseEntropy({ words: 6 }, 7776) - 77.55) < 0.01);
});
test('pin, strength bands and crack time', () => {
  assert.match(pin(6), /^\d{6}$/);
  assert.deepEqual([30, 50, 70, 90].map(b => strength(b).label), ['Weak', 'Fair', 'Strong', 'Very strong']);
  assert.equal(crackTime(20), 'less than a second');
  assert.match(crackTime(60), /^about [\d,]+ (days|weeks|hours)$/);
  assert.match(crackTime(130), /years|universe/);
});
