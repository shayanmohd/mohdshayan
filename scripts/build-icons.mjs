// Builds assets/icons.svg, an SVG sprite of only the Phosphor glyphs the site uses.
// Add an icon: append its Phosphor name to ICONS below, then `npm run build:icons`.
// Usage in markup: <svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#i-github-logo"/></svg>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const WEIGHT = 'bold';
const ICONS = [
  'github-logo','arrow-up-right','x-logo','reddit-logo','linkedin-logo','instagram-logo','google-play-logo',
  'envelope-simple','moon','sun','medal','x','share-network','rocket-launch','qr-code','paper-plane-tilt','cpu',
  'lightbulb','stack','laptop','heart','hand-heart','signpost','graduation-cap','globe-hemisphere-west','cube','code',
  'caret-down','chart-line-up','calendar-blank','bowl-food','list','arrow-right','arrow-down','rss','play','image',
  'arrow-left','magnifying-glass','link','check','warning','clock','tag','video',
];
const base = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@phosphor-icons', 'core') + '/';
const symbols = ICONS.map(name => {
  const file = `${base}assets/${WEIGHT}/${name}${WEIGHT === 'regular' ? '' : '-' + WEIGHT}.svg`;
  const svg = readFileSync(file, 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  return `<symbol id="i-${name}" viewBox="0 0 256 256">${inner}</symbol>`;
});
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;
mkdirSync('assets', { recursive: true });
writeFileSync('assets/icons.svg', sprite);
console.log(`assets/icons.svg: ${ICONS.length} symbols (${WEIGHT}), ${sprite.length} bytes`);
