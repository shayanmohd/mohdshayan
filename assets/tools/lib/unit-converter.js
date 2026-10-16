// Unit conversion through one base unit per category. Pure functions, no DOM.
// Each unit is written once as its size in the base unit, taken from the exact definition named beside it; nothing here is rounded.
// A conversion is value × from.factor ÷ to.factor. Temperature units add an offset before the factor, kelvin = (value + offset) × factor,
// so they take the same route. Results keep full precision: the page rounds for display only.

// `fraction` is how the page prints a factor that has no finite decimal form (5/9, 5/18). `offset` is only non-zero for temperatures.
const unit = (id, name, plural, symbol, factor, extra) => ({ id, name, plural, symbol, factor, offset: 0, ...extra });

export const CATEGORIES = [
  { id: 'length', name: 'Length', base: 'm', defaults: ['ft', 'cm'], units: [
    unit('mm', 'Millimetre', 'millimetres', 'mm', 0.001),
    unit('cm', 'Centimetre', 'centimetres', 'cm', 0.01),
    unit('m', 'Metre', 'metres', 'm', 1),
    unit('km', 'Kilometre', 'kilometres', 'km', 1000),
    unit('in', 'Inch', 'inches', 'in', 0.0254), // 25.4 mm exactly: international yard and pound agreement, 1959
    unit('ft', 'Foot', 'feet', 'ft', 0.3048), // 12 inches
    unit('yd', 'Yard', 'yards', 'yd', 0.9144), // 3 feet
    unit('mi', 'Mile', 'miles', 'mi', 1609.344), // 1,760 yards
    unit('nmi', 'Nautical mile', 'nautical miles', 'nmi', 1852), // 1,852 m exactly: International Hydrographic Conference, 1929
  ] },
  { id: 'weight', name: 'Weight', base: 'kg', defaults: ['lb', 'kg'], units: [
    unit('mg', 'Milligram', 'milligrams', 'mg', 0.000001),
    unit('g', 'Gram', 'grams', 'g', 0.001),
    unit('kg', 'Kilogram', 'kilograms', 'kg', 1),
    unit('t', 'Tonne', 'tonnes', 't', 1000),
    unit('oz', 'Ounce', 'ounces', 'oz', 0.028349523125), // a sixteenth of a pound
    unit('lb', 'Pound', 'pounds', 'lb', 0.45359237), // 0.45359237 kg exactly: international yard and pound agreement, 1959
    unit('st', 'Stone', 'stone', 'st', 6.35029318), // 14 pounds
  ] },
  { id: 'temperature', name: 'Temperature', base: 'k', defaults: ['c', 'f'], units: [
    unit('c', 'Celsius', 'degrees Celsius', '°C', 1, { offset: 273.15 }), // K = °C + 273.15
    unit('f', 'Fahrenheit', 'degrees Fahrenheit', '°F', 5 / 9, { offset: 459.67, fraction: '5/9' }), // K = (°F + 459.67) × 5/9
    unit('k', 'Kelvin', 'kelvin', 'K', 1),
  ] },
  { id: 'area', name: 'Area', base: 'm2', defaults: ['ac', 'm2'], units: [
    unit('mm2', 'Square millimetre', 'square millimetres', 'mm²', 0.000001),
    unit('cm2', 'Square centimetre', 'square centimetres', 'cm²', 0.0001),
    unit('m2', 'Square metre', 'square metres', 'm²', 1),
    unit('ha', 'Hectare', 'hectares', 'ha', 10000),
    unit('km2', 'Square kilometre', 'square kilometres', 'km²', 1000000),
    unit('in2', 'Square inch', 'square inches', 'in²', 0.00064516), // 0.0254²
    unit('ft2', 'Square foot', 'square feet', 'ft²', 0.09290304), // 0.3048²
    unit('yd2', 'Square yard', 'square yards', 'yd²', 0.83612736), // 0.9144²
    unit('ac', 'Acre', 'acres', 'ac', 4046.8564224), // 4,840 square yards
    unit('mi2', 'Square mile', 'square miles', 'mi²', 2589988.110336), // 1,609.344²
  ] },
  { id: 'volume', name: 'Volume', base: 'l', defaults: ['gal', 'l'], units: [
    unit('ml', 'Millilitre', 'millilitres', 'mL', 0.001),
    unit('l', 'Litre', 'litres', 'L', 1),
    unit('m3', 'Cubic metre', 'cubic metres', 'm³', 1000),
    unit('tsp', 'Teaspoon (US)', 'US teaspoons', 'tsp', 0.00492892159375), // a 768th of a US gallon
    unit('tbsp', 'Tablespoon (US)', 'US tablespoons', 'tbsp', 0.01478676478125), // a 256th of a US gallon
    unit('floz', 'Fluid ounce (US)', 'US fluid ounces', 'fl oz', 0.0295735295625), // a 128th of a US gallon
    unit('cup', 'Cup (US)', 'US cups', 'cup', 0.2365882365), // a sixteenth of a US gallon
    unit('pt', 'Pint (US)', 'US pints', 'pt', 0.473176473), // an eighth of a US gallon
    unit('qt', 'Quart (US)', 'US quarts', 'qt', 0.946352946), // a quarter of a US gallon
    unit('gal', 'Gallon (US)', 'US gallons', 'gal', 3.785411784), // 231 cubic inches = 3.785411784 L exactly
    unit('ukgal', 'Gallon (UK)', 'UK gallons', 'UK gal', 4.54609), // 4.54609 L exactly: Weights and Measures Act 1985
  ] },
  { id: 'speed', name: 'Speed', base: 'mps', defaults: ['kmh', 'mph'], units: [
    unit('mps', 'Metre per second', 'metres per second', 'm/s', 1),
    unit('kmh', 'Kilometre per hour', 'kilometres per hour', 'km/h', 1000 / 3600, { fraction: '5/18' }),
    unit('mph', 'Mile per hour', 'miles per hour', 'mph', 0.44704), // 1,609.344 m per 3,600 s
    unit('kn', 'Knot', 'knots', 'kn', 1852 / 3600, { fraction: '463/900' }), // one nautical mile per hour
    unit('fps', 'Foot per second', 'feet per second', 'ft/s', 0.3048),
  ] },
  { id: 'data', name: 'Data', base: 'b', defaults: ['gb', 'gib'], units: [
    unit('bit', 'Bit', 'bits', 'bit', 0.125),
    unit('b', 'Byte', 'bytes', 'B', 1),
    unit('kb', 'Kilobyte', 'kilobytes', 'KB', 1000), // SI prefixes: powers of 1,000
    unit('mb', 'Megabyte', 'megabytes', 'MB', 1000000),
    unit('gb', 'Gigabyte', 'gigabytes', 'GB', 1000000000),
    unit('tb', 'Terabyte', 'terabytes', 'TB', 1000000000000),
    unit('kib', 'Kibibyte', 'kibibytes', 'KiB', 1024), // IEC 80000-13 binary prefixes: powers of 1,024
    unit('mib', 'Mebibyte', 'mebibytes', 'MiB', 1048576),
    unit('gib', 'Gibibyte', 'gibibytes', 'GiB', 1073741824),
    unit('tib', 'Tebibyte', 'tebibytes', 'TiB', 1099511627776),
  ] },
];
for (const c of CATEGORIES) for (const u of c.units) u.category = c.id;

/** Every unit by id. Ids are unique across categories, so a share link only needs the unit ids. */
export const UNITS = Object.fromEntries(CATEGORIES.flatMap(c => c.units.map(u => [u.id, u])));

/** Significant figures the page offers, and the one it starts with. */
export const PRECISIONS = [3, 4, 6, 8, 10, 12];
export const DEFAULT_PRECISION = 6;

const lookup = u => (typeof u === 'string' ? UNITS[u] : u) || null;
// Number('') is 0, which would turn an empty box into a zero; an empty value is not a number here
const toNumber = x => (x === null || x === undefined || String(x).trim() === '' ? NaN : Number(x));

/** The value of `value` units of `u` in the category's base unit. */
export function toBase(value, u) {
  const a = lookup(u);
  return (toNumber(value) + a.offset) * a.factor;
}
/** The value of `value` base units expressed in unit `u`. */
export function fromBase(value, u) {
  const a = lookup(u);
  return toNumber(value) / a.factor - a.offset;
}

/**
 * Converts `value` from one unit to another in the same category, through the base unit. 5 feet is 152.4 centimetres.
 * NaN when the value is not a number, a unit is unknown, or the units belong to different categories.
 */
export function convert(value, from, to) {
  const a = lookup(from), b = lookup(to);
  const v = toNumber(value);
  if (!a || !b || a.category !== b.category || !Number.isFinite(v)) return NaN;
  const base = toBase(v, a);
  const result = fromBase(base, b);
  // Offsets subtract near-equal figures (32 °F and 0 °C are both 273.15 K), which can leave floating-point dust such as
  // 2.8e-14 where the answer is 0. A result that small beside the figures it came from is that dust, not a temperature.
  if ((a.offset || b.offset) && Math.abs(result) < Math.max(Math.abs(v), Math.abs(base)) * 1e-14) return 0;
  return result;
}

/** `value` in unit `from` expressed in every unit of its category, in the category's order: [{ unit, value }]. */
export function convertAll(value, from) {
  const a = lookup(from);
  if (!a) return [];
  return CATEGORIES.find(c => c.id === a.category).units.map(u => ({ unit: u, value: convert(value, a, u) }));
}

/**
 * Rounds to `sf` significant figures (1 to 15) for display: 152.39999999999998 at 6 is 152.4, and 1,609.344 at 6 is 1,609.34.
 * A typed decimal such as 1.2345 is stored a hair below itself, so the value is nudged away from zero by one unit in the
 * last place first; it then rounds the way it would on paper, to 1.235 at 4 figures.
 */
export function toSignificant(value, sf) {
  const v = toNumber(value);
  if (!Number.isFinite(v) || v === 0) return v === 0 ? 0 : v;
  const p = Math.min(15, Math.max(1, Math.round(Number(sf) || 1)));
  return Number((v * (1 + Number.EPSILON)).toPrecision(p));
}

/**
 * Decimal places needed to show `value` to `sf` significant figures without losing any: 152.4 at 6 needs 3 (152.400),
 * 0.0328084 needs 7, and 1,609.34 needs 2. Whole numbers of `sf` digits or more need 0. Display only.
 */
export function decimalsFor(value, sf) {
  const v = Math.abs(toNumber(value));
  if (!Number.isFinite(v) || v === 0) return 0;
  const exponent = Number(v.toExponential().split('e')[1]); // the power of ten of the first significant digit, found exactly
  return Math.max(0, Math.round(Number(sf) || 1) - 1 - exponent);
}

/**
 * Whether `value` is shown as a power of ten rather than written out at `sf` significant figures: when it is 10^21 or more,
 * or would need more than 20 decimal places, the most Intl.NumberFormat can be asked for everywhere. One rule for the readout,
 * the table and the value boxes, so a figure never appears written out in one and as a power of ten in another.
 */
export function usesExponent(value, sf) {
  const v = Math.abs(toNumber(value));
  return Number.isFinite(v) && (v >= 1e21 || decimalsFor(v, sf) > 20);
}
