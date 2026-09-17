// Moves a queued post from content/queue/ into content/posts/, stamps today's date, and rebuilds the site.
// Usage: npm run publish -- <slug> [--date YYYY-MM-DD] [--keep-date] [--no-build]
//        npm run publish -- --list        (show what is waiting in the queue)
// Nothing is committed: review the result, then commit and push when you want it live.
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const QUEUE = 'content/queue', POSTS = 'content/posts';
const queued = () => existsSync(QUEUE) ? readdirSync(QUEUE).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')).sort() : [];
const title = slug => (readFileSync(`${QUEUE}/${slug}.md`, 'utf8').match(/^title:\s*(.+)$/m) || [])[1] || '';
const list = () => { const q = queued(); console.log(q.length ? q.map(s => `  ${s}\n      ${title(s)}`).join('\n') : '  (queue is empty)'); };

if (args.includes('--list') || !args.some(a => !a.startsWith('--'))) {
  console.log('usage: npm run publish -- <slug> [--date YYYY-MM-DD] [--keep-date] [--no-build]\n\nqueued posts:');
  list();
  process.exit(args.includes('--list') ? 0 : 1);
}
const slug = args.find(a => !a.startsWith('--'));
const from = `${QUEUE}/${slug}.md`, to = `${POSTS}/${slug}.md`;
if (!existsSync(from)) { console.error(`no queued post named "${slug}". Queued posts:`); list(); process.exit(1); }
if (existsSync(to)) { console.error(`${to} already exists; pick a different slug or remove the published copy first.`); process.exit(1); }

let src = readFileSync(from, 'utf8');
const dateFlag = args.indexOf('--date');
let date = dateFlag >= 0 ? args[dateFlag + 1] : new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || isNaN(Date.parse(date))) { console.error(`--date must be YYYY-MM-DD (got "${date}")`); process.exit(1); }
if (!args.includes('--keep-date')) src = src.replace(/^date:.*$/m, `date: ${date}`);
else date = (src.match(/^date:\s*(.+)$/m) || [])[1];

writeFileSync(to, src);
unlinkSync(from);
console.log(`moved ${from} -> ${to} (date: ${date})`);
if (!args.includes('--no-build')) execSync('npm run build', { stdio: 'inherit' });
console.log(`\nReady: ${to} is dated ${date}. Preview with "npm start", then commit and push to publish.\n${queued().length} post(s) still queued.`);
