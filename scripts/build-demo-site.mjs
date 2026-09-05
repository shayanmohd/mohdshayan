// Assembles dist/demo-site/: a standalone copy of /demo/ for demo.mohdshayan.com.
// Assets are copied so the page is self-contained (an external SVG sprite cannot be <use>d cross-origin);
// navigation links point back at mohdshayan.com. Deploy the folder to the repo that owns the subdomain.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync } from 'node:fs';
const SITE = 'https://mohdshayan.com';
const OUT = 'dist/demo-site';
mkdirSync(OUT, { recursive: true });
for (const e of readdirSync(OUT)) if (e !== '.git') rmSync(`${OUT}/${e}`, { recursive: true, force: true });
mkdirSync(`${OUT}/assets/projects`, { recursive: true });
let html = readFileSync('demo/index.html', 'utf8');
// links that leave the demo site become absolute; asset references stay local
html = html
  .replace(/href="\/(#[^"]*)"/g, `href="${SITE}/$1"`)
  .replace(/href="\/"/g, `href="${SITE}/"`)
  .replace(/href="\/(blog|philanthropy|uploads|feed\.xml)([^"]*)"/g, `href="${SITE}/$1$2"`)
  .replace(/href="\/demo\/"/g, 'href="/"')
  .replace(`<meta property="og:url" content="${SITE}/demo/">`, '<meta property="og:url" content="https://demo.mohdshayan.com/">')
  .replace(`"url": "${SITE}/demo/"`, '"url": "https://demo.mohdshayan.com/"');
writeFileSync(`${OUT}/index.html`, html);
for (const f of ['assets/site.css', 'assets/site.js', 'assets/icons.svg', 'favicon.png', 'assets/avatar.jpg']) cpSync(f, `${OUT}/${f}`);
cpSync('assets/fonts', `${OUT}/assets/fonts`, { recursive: true });
const used = [...html.matchAll(/\/assets\/projects\/([a-z0-9-]+\.webp)/g)].map(m => m[1]);
for (const f of new Set(used)) cpSync(`assets/projects/${f}`, `${OUT}/assets/projects/${f}`);
writeFileSync(`${OUT}/CNAME`, 'demo.mohdshayan.com\n');
writeFileSync(`${OUT}/robots.txt`, 'User-agent: *\nAllow: /\n');
writeFileSync(`${OUT}/.nojekyll`, '');
cpSync('404.html', `${OUT}/404.html`);
console.log(`${OUT}: index.html + ${new Set(used).size} images + fonts/css/js/sprite + CNAME`);
