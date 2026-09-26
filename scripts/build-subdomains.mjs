// Assembles dist/subdomains/<host>/, a standalone static site for every page served from its own subdomain:
//   demo.mohdshayan.com      ← /demo/
//   <slug>.mohdshayan.com    ← /tools/<slug>/ for each tool in content/tools.json
// GitHub Pages serves one custom domain per repository, so each folder is published to the repository
// <owner>/<host> by scripts/publish-subdomains.sh (run by .github/workflows/deploy-subdomains.yml). See SUBDOMAINS.md.
//
// Assets are copied rather than linked because an SVG sprite cannot be <use>d across origins. Links that leave the
// subdomain point back at mohdshayan.com, and links to another tool point at that tool's own subdomain.
// Run `npm run build:pages` first: this reads the generated pages.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { dirname, posix } from 'node:path';

const SITE = 'https://mohdshayan.com';
const OUT = 'dist/subdomains';
const { tools } = JSON.parse(readFileSync('content/tools.json', 'utf8'));
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));

const sites = [
  { host: 'demo.mohdshayan.com', page: 'demo/index.html', self: '/demo/' },
  ...tools.map(t => ({ host: `${t.slug}.mohdshayan.com`, page: `tools/${t.slug}/index.html`, self: `/tools/${t.slug}/` })),
].filter(s => !only.length || only.includes(s.host) || only.includes(s.host.split('.')[0]));

const toolHosts = new Map(tools.map(t => [`/tools/${t.slug}/`, `https://${t.slug}.mohdshayan.com/`]));

function rewrite(html, site) {
  return html
    // this site's own address, wherever the main-site copy named it (canonical, og:url, JSON-LD)
    .split(`${SITE}${site.self}`).join(`https://${site.host}/`)
    // navigation between subdomains and back to the main site
    .replace(/href="(\/tools\/[a-z0-9-]+\/)"/g, (m, p) => (p === site.self ? 'href="/"' : toolHosts.has(p) ? `href="${toolHosts.get(p)}"` : `href="${SITE}${p}"`))
    .replace(/href="\/demo\/"/g, site.self === '/demo/' ? 'href="/"' : 'href="https://demo.mohdshayan.com/"')
    .replace(/href="\/(#[^"]*)?"/g, (m, hash) => `href="${SITE}/${hash || ''}"`)
    .replace(/href="\/(blog|philanthropy|subscribe|uploads|tools|feed\.xml|llms\.txt)([^"]*)"/g, `href="${SITE}/$1$2"`);
}

// Every local asset a page needs: direct src/href references plus the JavaScript module graph behind them.
function assetsFor(html) {
  const found = new Set(['assets/site.css', 'assets/site.js', 'assets/icons.svg', 'favicon.png', 'assets/apple-touch-icon.png']);
  for (const m of html.matchAll(/(?:src|href)="\/((?:assets\/)[^"#?]+|favicon\.png)"/g)) found.add(m[1]);
  const queue = [...found].filter(f => f.endsWith('.js'));
  while (queue.length) {
    const file = queue.pop();
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
      const dep = posix.normalize(posix.join(posix.dirname(file), m[1] || m[2]));
      if (!found.has(dep)) { found.add(dep); queue.push(dep); }
    }
  }
  return [...found];
}

const robots = host => `User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`;
const sitemap = host => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://${host}/</loc>\n    <changefreq>monthly</changefreq>\n  </url>\n</urlset>\n`;
const readme = host => `# ${host}\n\nGenerated from [shayanmohd/mohdshayan](https://github.com/shayanmohd/mohdshayan) by \`scripts/build-subdomains.mjs\`.\nDo not edit this repository by hand: changes are overwritten on the next deploy. Edit the source there instead.\n`;

mkdirSync(OUT, { recursive: true });
for (const site of sites) {
  if (!existsSync(site.page)) throw new Error(`${site.page} is missing: run npm run build:pages first`);
  const dir = `${OUT}/${site.host}`;
  mkdirSync(dir, { recursive: true });
  for (const e of readdirSync(dir)) if (e !== '.git') rmSync(`${dir}/${e}`, { recursive: true, force: true });
  const html = rewrite(readFileSync(site.page, 'utf8'), site);
  writeFileSync(`${dir}/index.html`, html);
  const assets = assetsFor(html);
  for (const f of assets) { mkdirSync(dirname(`${dir}/${f}`), { recursive: true }); cpSync(f, `${dir}/${f}`); }
  cpSync('assets/fonts', `${dir}/assets/fonts`, { recursive: true });
  writeFileSync(`${dir}/404.html`, readFileSync('404.html', 'utf8'));
  writeFileSync(`${dir}/CNAME`, `${site.host}\n`);
  writeFileSync(`${dir}/robots.txt`, robots(site.host));
  writeFileSync(`${dir}/sitemap.xml`, sitemap(site.host));
  writeFileSync(`${dir}/README.md`, readme(site.host));
  writeFileSync(`${dir}/.nojekyll`, '');
  console.log(`  ${dir}: index.html + ${assets.length} assets + fonts`);
}
console.log(`subdomains: ${sites.length} site(s) in ${OUT}/`);
