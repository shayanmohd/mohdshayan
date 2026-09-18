// One-off helper: give each listed post a random date in the last two years,
// never earlier than the latest dated source the post itself cites.
// Usage: node scripts/randomise-dates.mjs <slugs-file> [seed]
import fs from 'node:fs';
const [slugsFile, seedArg] = process.argv.slice(2);
const slugs = fs.readFileSync(slugsFile, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
const TODAY = Date.UTC(2026, 8, 18);
const FLOOR = Date.UTC(2024, 8, 18);
const DAY = 86400000;
let seed = Number(seedArg || 20260918) >>> 0;
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, sept: 8, october: 9, november: 10, december: 11 };
const iso = t => new Date(t).toISOString().slice(0, 10);
const used = new Set();
const rows = [];
for (const slug of slugs) {
  const p = `content/posts/${slug}.md`;
  const md = fs.readFileSync(p, 'utf8');
  const body = md.replace(/^---[\s\S]*?---/, '');
  let latest = 0;
  const bump = t => { if (t <= TODAY && t > latest) latest = t; };
  for (const m of body.matchAll(/\b(\d{1,2})?\s*(January|February|March|April|May|June|July|August|September|Sept|October|November|December)\s+(20\d\d)\b/gi)) bump(Date.UTC(+m[3], months[m[2].toLowerCase()], +(m[1] || 1)));
  for (const m of body.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g)) bump(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  for (const m of body.matchAll(/\b(20\d\d)\b/g)) bump(Date.UTC(+m[1], 0, 1));
  const lo = Math.max(FLOOR, latest);
  const span = Math.floor((TODAY - lo) / DAY);
  let t;
  for (let tries = 0; tries < 50; tries++) { t = lo + Math.floor(rand() * (span + 1)) * DAY; if (!used.has(t)) break; }
  used.add(t);
  const date = iso(t);
  const re = /^(---\n[\s\S]*?\ndate: )\d{4}-\d{2}-\d{2}(\n)/;
  if (!re.test(md)) { console.error('no date line', slug); process.exit(1); }
  const out = md.replace(re, `$1${date}$2`);
  fs.writeFileSync(p, out);
  rows.push({ slug, date, floor: iso(lo) });
}
rows.sort((a, b) => a.date.localeCompare(b.date));
for (const r of rows) console.log(r.date, r.slug, r.floor === '2024-09-18' ? '' : `(not before ${r.floor})`);
