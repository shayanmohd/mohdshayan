import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATEGORIES, UNITS, PRECISIONS, DEFAULT_PRECISION, convert, convertAll, toBase, fromBase, toSignificant, decimalsFor, usesExponent } from '../assets/tools/lib/unit-converter.js';

const close = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≈ ${b}`);
// Rounded the way the page shows it: to the default six significant figures
const shown = (value, from, to, sf = DEFAULT_PRECISION) => toSignificant(convert(value, from, to), sf);

// ---------- definitions ----------
test('factors are the exact definitions quoted on the page', () => {
  const expected = {
    in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852,
    lb: 0.45359237, oz: 0.028349523125, st: 6.35029318, t: 1000,
    in2: 0.00064516, ft2: 0.09290304, yd2: 0.83612736, ac: 4046.8564224, mi2: 2589988.110336, ha: 10000,
    gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, floz: 0.0295735295625, tbsp: 0.01478676478125, tsp: 0.00492892159375, ukgal: 4.54609,
    mph: 0.44704, fps: 0.3048, kmh: 1000 / 3600, kn: 1852 / 3600,
    bit: 0.125, kb: 1000, mb: 1e6, gb: 1e9, tb: 1e12, kib: 1024, mib: 1048576, gib: 1073741824, tib: 1099511627776,
  };
  for (const [id, factor] of Object.entries(expected)) assert.equal(UNITS[id].factor, factor, id);
  assert.deepEqual([UNITS.c.offset, UNITS.f.offset, UNITS.f.factor, UNITS.k.offset], [273.15, 459.67, 5 / 9, 0]);
});
test('every category has a base unit of size 1, unique ids, and defaults from its own units', () => {
  const ids = CATEGORIES.flatMap(c => c.units.map(u => u.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const c of CATEGORIES) {
    const base = UNITS[c.base];
    assert.ok(base && base.category === c.id, `${c.id} base`);
    assert.deepEqual([base.factor, base.offset], [1, 0], `${c.id} base is 1 with no offset`);
    for (const id of c.defaults) assert.equal(UNITS[id].category, c.id, `${c.id} default ${id}`);
    for (const u of c.units) assert.ok(u.name && u.plural && u.symbol && u.factor > 0, `${u.id} is complete`);
  }
  assert.deepEqual(CATEGORIES.map(c => c.id), ['length', 'weight', 'temperature', 'area', 'volume', 'speed', 'data']);
  assert.ok(PRECISIONS.includes(DEFAULT_PRECISION));
});

// ---------- length, weight, area ----------
test('length: FAQ example, 5 feet is 152.4 centimetres, and a mile is 1.609344 km', () => {
  close(convert(5, 'ft', 'cm'), 152.4, 1e-12);
  assert.equal(shown(5, 'ft', 'cm'), 152.4);
  close(convert(1, 'mi', 'km'), 1.609344, 1e-12);
  close(convert(1, 'in', 'mm'), 25.4, 1e-12);
  close(convert(1, 'nmi', 'm'), 1852, 1e-12);
  close(convert(100, 'cm', 'ft'), 3.2808398950131235, 1e-12);
  assert.equal(shown(1, 'cm', 'ft'), 0.0328084);
});
test('weight: pounds to kilograms, a stone is 14 pounds, an ounce is a sixteenth', () => {
  close(convert(5, 'lb', 'kg'), 2.26796185, 1e-12);
  close(convert(1, 'st', 'lb'), 14, 1e-12);
  close(convert(1, 'lb', 'oz'), 16, 1e-12);
  close(convert(1, 't', 'kg'), 1000, 1e-12);
  close(convert(2500, 'mg', 'g'), 2.5, 1e-12);
});
test('area: 2.5 acres, 640 acres to the square mile, 144 square inches to the square foot', () => {
  close(convert(2.5, 'ac', 'm2'), 10117.141056, 1e-9);
  assert.equal(shown(2.5, 'ac', 'm2', 10), 10117.14106);
  close(convert(1, 'mi2', 'ac'), 640, 1e-9);
  close(convert(1, 'ft2', 'in2'), 144, 1e-9);
  close(convert(1, 'ha', 'ac'), 2.471053814671653, 1e-12);
  close(convert(1, 'km2', 'ha'), 100, 1e-9);
});

// ---------- temperature ----------
test('temperature: FAQ examples through kelvin with offsets', () => {
  close(convert(68, 'f', 'c'), 20, 1e-12);
  close(convert(98.6, 'f', 'c'), 37, 1e-12);
  close(convert(68, 'f', 'k'), 293.15, 1e-12);
  close(convert(20, 'c', 'f'), 68, 1e-12);
  close(convert(100, 'c', 'f'), 212, 1e-12);
  close(convert(0, 'c', 'k'), 273.15, 1e-12);
  close(convert(300, 'k', 'c'), 26.85, 1e-12);
  close(convert(-40, 'c', 'f'), -40, 1e-12);
  close(convert(451, 'f', 'c'), 232.77777777777777, 1e-12);
  assert.equal(shown(451, 'f', 'c'), 232.778);
  close(toBase(68, 'f'), 293.15, 1e-12);
  close(fromBase(293.15, 'c'), 20, 1e-12);
});
test('temperature: freezing point lands on exactly 0, not floating-point dust', () => {
  assert.equal(convert(32, 'f', 'c'), 0);
  assert.equal(convert(-459.67, 'f', 'k'), 0);
  assert.equal(convert(convert(0, 'f', 'k'), 'k', 'f'), 0);
  assert.equal(convert(273.15, 'k', 'c'), 0);
  assert.equal(convert(0, 'k', 'k'), 0);
  // a tiny but real temperature is kept
  close(convert(0.001, 'c', 'f'), 32.0018, 1e-12);
  close(convert(0.01, 'k', 'c'), -273.14, 1e-12);
});

// ---------- volume, speed, data ----------
test('volume: US and UK gallons, and the US cup, spoons and fluid ounce as fractions of the gallon', () => {
  close(convert(3, 'gal', 'l'), 11.356235352, 1e-12);
  assert.equal(shown(3, 'gal', 'l'), 11.3562);
  close(convert(1, 'ukgal', 'l'), 4.54609, 1e-12);
  close(convert(1, 'ukgal', 'gal'), 1.2009499255048296, 1e-12);
  close(convert(1, 'gal', 'floz'), 128, 1e-9);
  close(convert(1, 'cup', 'tbsp'), 16, 1e-9);
  close(convert(1, 'tbsp', 'tsp'), 3, 1e-9);
  close(convert(1, 'pt', 'cup'), 2, 1e-9);
  close(convert(1, 'qt', 'pt'), 2, 1e-9);
  close(convert(1, 'cup', 'ml'), 236.5882365, 1e-9);
  close(convert(1, 'tbsp', 'ml'), 14.78676478125, 1e-9);
  close(convert(1, 'm3', 'l'), 1000, 1e-9);
});
test('speed: 100 km/h is 62.1371 mph, a knot is 1.852 km/h', () => {
  close(convert(100, 'kmh', 'mph'), 62.13711922373339, 1e-12);
  assert.equal(shown(100, 'kmh', 'mph'), 62.1371);
  close(convert(1, 'kn', 'kmh'), 1.852, 1e-12);
  close(convert(1, 'mps', 'kmh'), 3.6, 1e-12);
  close(convert(60, 'mph', 'fps'), 88, 1e-9);
  close(convert(1, 'mph', 'mps'), 0.44704, 1e-12);
});
test('data: FAQ example, a 1 TB drive is 931.323 GiB; bytes, bits and binary prefixes', () => {
  close(convert(1, 'tb', 'gib'), 931.3225746154785, 1e-9);
  assert.equal(shown(1, 'tb', 'gib'), 931.323);
  close(convert(1, 'gib', 'gb'), 1.073741824, 1e-12);
  assert.equal(convert(1, 'b', 'bit'), 8);
  assert.equal(convert(1, 'kib', 'b'), 1024);
  assert.equal(convert(1, 'tb', 'b'), 1e12);
  assert.equal(convert(1, 'tib', 'bit'), 8796093022208);
  close(convert(1, 'b', 'tib'), 9.094947017729282e-13, 1e-25); // a small result in a category without offsets is never snapped to 0
});

// ---------- general behaviour ----------
test('every pair in every category round-trips to the value it started from', () => {
  for (const c of CATEGORIES) {
    for (const a of c.units) {
      for (const b of c.units) {
        for (const v of [1, 7.25, 123456.789, -3]) {
          const back = convert(convert(v, a, b), b, a);
          close(back, v, Math.abs(v) * 1e-12 + 1e-12, `${v} ${a.id} to ${b.id} and back gives ${back}`);
        }
      }
    }
  }
});
test('same unit returns the value unchanged; numeric strings work', () => {
  assert.equal(convert(5, 'ft', 'ft'), 5);
  assert.equal(convert(0, 'kg', 'lb'), 0);
  close(convert('5', 'ft', 'cm'), 152.4, 1e-12);
  close(convert(-5, 'ft', 'cm'), -152.4, 1e-12);
});
test('invalid input and mismatched units give NaN, never a number', () => {
  for (const v of ['', ' ', 'abc', null, undefined, NaN, Infinity]) assert.ok(Number.isNaN(convert(v, 'ft', 'cm')), String(v));
  assert.ok(Number.isNaN(convert(5, 'ft', 'kg')), 'length to weight');
  assert.ok(Number.isNaN(convert(5, 'ft', 'furlong')), 'unknown unit');
  assert.ok(Number.isNaN(convert(5, undefined, 'cm')), 'missing unit');
  assert.deepEqual(convertAll(5, 'nope'), []);
});
test('convertAll lists every unit of the category in order, with the source unit equal to the value', () => {
  const rows = convertAll(5, 'ft');
  assert.deepEqual(rows.map(r => r.unit.id), ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'nmi']);
  assert.equal(rows.find(r => r.unit.id === 'ft').value, 5);
  close(rows.find(r => r.unit.id === 'in').value, 60, 1e-12);
  close(rows.find(r => r.unit.id === 'cm').value, 152.4, 1e-12);
  assert.ok(convertAll('', 'ft').every(r => Number.isNaN(r.value)));
});

// ---------- display rounding ----------
test('toSignificant: FAQ examples and paper rounding of typed decimals', () => {
  assert.equal(toSignificant(152.39999999999998, 6), 152.4);
  assert.equal(toSignificant(1609.344, 6), 1609.34);
  assert.equal(toSignificant(1609.344, 7), 1609.344);
  assert.equal(toSignificant(1609.344, 10), 1609.344);
  assert.equal(toSignificant(0.032808398950131235, 6), 0.0328084);
  assert.equal(toSignificant(1.2345, 4), 1.235);
  assert.equal(toSignificant(-1.2345, 4), -1.235);
  assert.equal(toSignificant(2.5, 1), 3);
  assert.equal(toSignificant(1234567, 3), 1230000);
  assert.equal(toSignificant(0.000123456, 3), 0.000123);
  assert.equal(toSignificant(0, 6), 0);
  assert.ok(Object.is(toSignificant(-0, 6), 0), 'negative zero becomes plain zero');
  assert.equal(toSignificant(-273.15, 6), -273.15);
});
test('toSignificant: precision is clamped to 1 to 15 figures, and non-numbers pass through as NaN', () => {
  assert.equal(toSignificant(123.456, 0), 100);
  assert.equal(toSignificant(123.456, 99), 123.456);
  assert.equal(toSignificant(Math.PI, 15), 3.14159265358979);
  assert.ok(Number.isNaN(toSignificant('', 6)));
  assert.ok(Number.isNaN(toSignificant('abc', 6)));
  assert.equal(toSignificant(Infinity, 6), Infinity);
});
test('decimalsFor: enough places to keep every significant figure, none for large whole numbers', () => {
  assert.equal(decimalsFor(152.4, 6), 3);
  assert.equal(decimalsFor(0.0328084, 6), 7);
  assert.equal(decimalsFor(1609.34, 6), 2);
  assert.equal(decimalsFor(1609.344, 10), 6);
  assert.equal(decimalsFor(931.323, 6), 3);
  assert.equal(decimalsFor(1234567, 3), 0);
  assert.equal(decimalsFor(1e21, 6), 0);
  assert.equal(decimalsFor(3.86102e-13, 6), 18);
  assert.equal(decimalsFor(-0.5, 3), 3);
  assert.equal(decimalsFor(0, 6), 0);
  assert.equal(decimalsFor(NaN, 6), 0);
  assert.equal(decimalsFor(1000, 6), 2); // 1000.00: the exponent is found exactly, where a logarithm could land on 2.9999
});
test('usesExponent: one rule for the readout, the table and the value boxes', () => {
  // 123,456,789 TiB in bits is 1.0859e21: the readout showed it as a power of ten while the To box held 22 grouped digits cut off at its edge
  assert.equal(usesExponent(convert(123456789, 'tib', 'bit'), 12), true);
  assert.equal(usesExponent(1e21, 3), true);
  assert.equal(usesExponent(-1e21, 3), true);
  assert.equal(usesExponent(1e20, 12), false); // 100,000,000,000,000,000,000 is still written out
  assert.equal(usesExponent(convert(1000000, 'tib', 'bit'), 12), false); // 8,796,093,022,210,000,000
  // a byte in tebibytes needs 24 decimals at 12 figures but only 18 at 6
  assert.equal(usesExponent(convert(1, 'b', 'tib'), 12), true);
  assert.equal(usesExponent(convert(1, 'b', 'tib'), 6), false);
  assert.equal(usesExponent(1e-15, 6), false); // exactly 20 decimals
  assert.equal(usesExponent(1e-16, 6), true); // 21
  assert.equal(usesExponent(0, 6), false);
  assert.equal(usesExponent(NaN, 6), false);
  assert.equal(usesExponent('', 6), false);
  assert.equal(usesExponent(Infinity, 6), false);
});

// ---------- house rules ----------
test('the tool never shows an en or em dash: none in its files, and the page does not borrow the kit\'s en-dash placeholder', () => {
  const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
  const files = { lib: read('../assets/tools/lib/unit-converter.js'), page: read('../assets/tools/unit-converter.js'), ui: read('../content/tools/unit-converter.html'), tests: read('./unit-converter.test.mjs') };
  for (const [name, text] of Object.entries(files)) assert.ok(!/[\u2013\u2014]/.test(text), `${name} contains an en or em dash`);
  // plain(NaN) and money(NaN) in the kit return an en dash, which an empty value box would put in the readout and every table row
  assert.ok(!/(plain|money|pct)\(NaN\)/.test(files.page), 'page uses the kit\'s en-dash placeholder');
});
