// Generates /blog/, /blog/<slug>/, /feed.xml, /philanthropy/ and /demo/ from content/.
// Posts are markdown with front matter in content/posts. `--drafts` includes draft posts (local preview).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { marked } from 'marked';

const INCLUDE_DRAFTS = process.argv.includes('--drafts');
const site = JSON.parse(readFileSync('content/site.json', 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = '') => `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"></use></svg>`;
const longDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// ---------- content ----------
function parseFrontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('missing front matter');
  const meta = {};
  for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  meta.tags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  meta.draft = meta.draft === 'true';
  return { meta, body: m[2] };
}
const posts = readdirSync('content/posts').filter(f => f.endsWith('.md')).map(f => {
  const { meta, body } = parseFrontMatter(readFileSync(`content/posts/${f}`, 'utf8'));
  const slug = f.replace(/\.md$/, '');
  const words = body.split(/\s+/).filter(Boolean).length;
  return { slug, ...meta, body, html: marked.parse(body), minutes: Math.max(1, Math.round(words / 230)), url: `${site.url}/blog/${slug}/` };
}).sort((a, b) => (a.date < b.date ? 1 : -1));
const published = posts.filter(p => !p.draft || INCLUDE_DRAFTS);

// ---------- shared shell ----------
const NAV = [['/#about', 'About'], ['/#ventures', 'Ventures'], ['/#publications', 'Research'], ['/#projects', 'Work'], ['/blog/', 'Blog'], ['/philanthropy/', 'Philanthropy']];
const SOCIAL = [['mailto:contact@mohdshayan.com', 'Email', 'envelope-simple'], ['https://www.linkedin.com/in/shayanmohd', 'LinkedIn', 'linkedin-logo'], ['https://github.com/shayanmohd', 'GitHub', 'github-logo'], ['https://instagram.com/mohdshayanx', 'Instagram', 'instagram-logo'], ['https://x.com/mohdshayanX', 'X (Twitter)', 'x-logo'], ['https://www.reddit.com/user/mohdshayan', 'Reddit', 'reddit-logo']];
const socialLinks = (cls) => SOCIAL.map(([h, l, i]) => `<a href="${h}"${h.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''} class="${cls}" aria-label="${l}">${icon(i)}</a>`).join('\n                    ');

function header(active) {
  return `    <header id="nav" class="fixed top-0 inset-x-0 z-50 gilt-top border-b border-hairline nav-glass backdrop-blur-md">
        <nav class="max-w-content mx-auto px-6 h-16 flex items-center justify-between relative" aria-label="Primary">
            <a href="/" class="font-display text-ink text-xl tracking-tight" style="font-weight:500;">Mohd Shayan<span class="text-gold-deep">.</span></a>
            <ul class="hidden md:flex items-center gap-8">
${NAV.map(([h, l]) => `                <li><a href="${h}" class="nav-link${h === active ? ' active' : ''}"${h === active ? ' aria-current="page"' : ''}>${l}</a></li>`).join('\n')}
            </ul>
            <div class="flex items-center gap-3">
                <button id="theme-toggle" class="text-ink w-10 h-10 grid place-items-center rounded-full border border-hairline hover:border-hairline-strong transition-colors" aria-label="Dark mode" aria-pressed="false">
                    <svg class="icon text-sm" aria-hidden="true" data-theme-icon><use href="/assets/icons.svg#i-moon"></use></svg>
                </button>
                <a href="/#contact" class="hidden md:inline-flex btn-ink btn-ink-sm">Let's Talk</a>
                <button id="menu-btn" class="md:hidden text-ink w-10 h-10 grid place-items-center rounded-full border border-hairline hover:border-hairline-strong transition-colors" aria-label="Menu" aria-expanded="false" aria-controls="drawer">
                    <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
                </button>
            </div>
            <span id="progress" aria-hidden="true"></span>
        </nav>
    </header>
    <div id="drawer" class="fixed inset-x-0 top-[66px] bottom-0 z-40 md:hidden">
        <aside class="panel px-7 pt-6 pb-7 flex flex-col" role="dialog" aria-modal="true" aria-label="Navigation">
            <nav class="flex flex-col">
${[['/', 'Home'], ...NAV].map(([h, l]) => `                <a href="${h}" class="drawer-link font-display text-ink text-[2rem] py-4 border-b border-hairline-soft" style="font-weight:400;">${l}</a>`).join('\n')}
            </nav>
            <div class="mt-auto">
                <a href="/#contact" class="drawer-link btn-ink w-full">Let's Talk</a>
                <div class="drawer-link flex items-center gap-2 mt-6">
                    ${socialLinks('social')}
                </div>
            </div>
        </aside>
    </div>`;
}
function footer() {
  return `    <footer class="bg-dark-3 border-t border-white/[0.08]">
        <div class="max-w-content mx-auto px-6 py-14 grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
            <div>
                <a href="/" class="font-display text-2xl" style="color:#f5f2ea; font-weight:400;">Mohd Shayan<span class="text-gold-bright">.</span></a>
                <p class="text-sm mt-3 max-w-xs leading-relaxed" style="color:rgba(245,242,234,0.55);">Product Engineer, AI Entrepreneur &amp; Philanthropist. Building technology with purpose.</p>
                <div class="flex gap-3 mt-6">
                    ${socialLinks('social social-dark')}
                </div>
            </div>
            <div>
                <p class="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-bright mb-5">Explore</p>
                <ul class="space-y-3 text-sm">
${[['/#about', 'About'], ['/#ventures', 'Ventures'], ['/#impact', 'Impact'], ['/#recognition', 'Recognition'], ['/#projects', 'Work'], ['/blog/', 'Blog'], ['/philanthropy/', 'Philanthropy'], ['/demo/', 'Demos']].map(([h, l]) => `                    <li><a href="${h}" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">${l}</a></li>`).join('\n')}
                </ul>
            </div>
            <div>
                <p class="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-bright mb-5">Connect</p>
                <ul class="space-y-3 text-sm">
                    <li><a href="mailto:contact@mohdshayan.com" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">contact@mohdshayan.com</a></li>
                    <li><a href="tel:+918920038741" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">+91 89200 38741</a></li>
                    <li><a href="/uploads/resume.pdf" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);" download>Download Résumé</a></li>
                    <li><a href="/feed.xml" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">RSS feed</a></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-white/[0.08]">
            <div class="max-w-content mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-xs" style="color:rgba(245,242,234,0.4);">
                <span>© 2026 Mohd Shayan, FRSA FRGS. All rights reserved.</span>
                <span>mohdshayan.com</span>
            </div>
        </div>
        <div class="gilt-edge" aria-hidden="true"></div>
    </footer>`;
}
function shell({ title, description, path, active, body, jsonld, noindex = false, image = `${site.url}/assets/portrait.jpg`, canonical }) {
  canonical = canonical || `${site.url}${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    ${noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${path.startsWith('/blog/') && path !== '/blog/' ? 'article' : 'website'}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${image}">
    <meta property="og:site_name" content="Mohd Shayan">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${image}">
    <link rel="alternate" type="application/rss+xml" title="Mohd Shayan" href="${site.url}/feed.xml">
    <link rel="shortcut icon" href="/favicon.png" type="image/png">
    <link rel="apple-touch-icon" href="/assets/avatar.jpg">
    <meta name="theme-color" content="#faf8f3">
    <meta name="msapplication-TileColor" content="#faf8f3">
    <script>(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();</script>
    <link rel="preload" href="/assets/fonts/newsreader-normal-200-800-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/geist-normal-100-900-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/assets/site.css">
${jsonld ? `    <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2).split('\n').map(l => '    ' + l).join('\n')}\n    </script>` : ''}
</head>
<body class="bg-paper text-body antialiased">
    <a href="#main" class="skip-link">Skip to content</a>
${header(active)}
    <main id="main">
${body}
    </main>
${footer()}
    <script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------- blocks ----------
function subscribe(compact = false) {
  const nl = site.newsletter || {};
  const action = nl.action || (nl.provider === 'buttondown' && nl.username ? `https://buttondown.com/api/emails/embed-subscribe/${nl.username}` : '');
  const field = nl.emailField || 'email';
  const form = action ? `
                <form class="subscribe flex flex-col sm:flex-row gap-3 mt-6 max-w-md" action="${action}" method="post" target="_blank" rel="noopener">
                    <label for="nl-email" class="sr-only">Email address</label>
                    <input type="email" name="${field}" id="nl-email" placeholder="you@example.com" required autocomplete="email">
                    <button type="submit" class="btn-ink shrink-0">Subscribe</button>
                </form>
                <p class="mono-meta text-muted mt-3">One email per new post. Unsubscribe any time.</p>` : `
                <!-- Email subscription: set newsletter.action in content/site.json and run npm run build -->`;
  return `            <div class="plate p-8 md:p-10 ${compact ? 'mt-12' : 'mt-16'} reveal">
                <h2 class="h3-serif" style="font-weight:500;">Get new posts by email</h2>
                <p class="text-body mt-2 max-w-xl">Occasional essays on engineering, AI, and building for the people technology leaves behind.</p>${form}
                <a href="/feed.xml" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm mt-5 whitespace-nowrap">${icon('rss', 'text-xs')} Subscribe with RSS</a>
            </div>`;
}
const pageHead = (h1, lead, eyebrow = '') => `        <section class="page-head pb-8">
            <div class="max-w-content mx-auto px-6">
                ${eyebrow ? `<p class="mono-meta text-muted reveal">${eyebrow}</p>` : ''}
                <h1 class="h2 ${eyebrow ? 'mt-3' : ''} balance reveal">${h1}</h1>
                ${lead ? `<p class="lead mt-5 max-w-2xl reveal d1">${lead}</p>` : ''}
            </div>
        </section>`;

// ---------- blog index ----------
function blogIndex() {
  const list = published.length ? `            <ul class="ruled-list border-t border-hairline mt-4">
${published.map(p => `                <li class="reveal">
                    <div class="grid md:grid-cols-[200px_1fr] gap-x-10 gap-y-3">
                        <p class="mono-meta text-muted pt-1.5">${longDate(p.date)}<br>${p.minutes} min read</p>
                        <div>
                            <h2 class="h3-serif" style="font-weight:500;"><a href="/blog/${p.slug}/" class="sweep-link">${esc(p.title)}</a>${p.draft ? ' <span class="chip-mini align-middle ml-2">Draft</span>' : ''}</h2>
                            <p class="text-body mt-2 max-w-[62ch]">${esc(p.summary)}</p>
                            ${p.tags.length ? `<div class="flex flex-wrap gap-2 mt-4">${p.tags.map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}</div>` : ''}
                        </div>
                    </div>
                </li>`).join('\n')}
            </ul>` : `            <div class="plate p-8 md:p-10 mt-4 reveal">
                <p class="text-body">The first essays are being written. Subscribe below and they will reach you when they are published.</p>
            </div>`;
  const body = `${pageHead('Writing', 'Notes on engineering, AI, and building for the people technology leaves behind.')}
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
${list}
${subscribe(true)}
            </div>
        </section>`;
  return shell({ title: 'Writing | Mohd Shayan', description: 'Essays and notes by Mohd Shayan on engineering, AI, and building technology with purpose.', path: '/blog/', active: '/blog/', body,
    jsonld: { '@context': 'https://schema.org', '@type': 'Blog', '@id': `${site.url}/blog/#blog`, url: `${site.url}/blog/`, name: 'Mohd Shayan: Writing', author: { '@id': `${site.url}/#person` }, publisher: { '@id': `${site.url}/#person` }, inLanguage: 'en',
      blogPost: published.filter(p => !p.draft).map(p => ({ '@type': 'BlogPosting', '@id': `${p.url}#post`, headline: p.title, url: p.url, datePublished: p.date })) } });
}

// ---------- post ----------
function postPage(p) {
  const body = `        <article>
${pageHead(esc(p.title), esc(p.summary), `${longDate(p.date)} <span class="mx-2">·</span> ${p.minutes} min read`)}
            <div class="max-w-content mx-auto px-6 pb-24">
                <div class="prose reveal">
${p.html}
                </div>
                ${p.tags.length ? `<div class="flex flex-wrap gap-2 mt-10 reveal">${p.tags.map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}</div>` : ''}
                <div class="border-t border-hairline mt-12 pt-8 flex flex-wrap items-center justify-between gap-4 reveal">
                    <a href="/blog/" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm whitespace-nowrap">${icon('arrow-left', 'text-xs')} All writing</a>
                    <p class="mono-meta text-muted">Written by Mohd Shayan</p>
                </div>
${subscribe()}
            </div>
        </article>`;
  return shell({ title: `${p.title} | Mohd Shayan`, description: p.summary, path: `/blog/${p.slug}/`, active: '/blog/', body, noindex: p.draft,
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${p.url}#post`, headline: p.title, description: p.summary, url: p.url, mainEntityOfPage: p.url, datePublished: p.date, dateModified: p.date,
      author: { '@type': 'Person', '@id': `${site.url}/#person`, name: site.author, url: site.url }, publisher: { '@id': `${site.url}/#person` }, isPartOf: { '@id': `${site.url}/blog/#blog` }, keywords: p.tags.join(', '), inLanguage: 'en', wordCount: p.body.split(/\s+/).length } });
}

// ---------- feed ----------
function feed() {
  const items = published.filter(p => !p.draft);
  const x = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Mohd Shayan</title>
    <link>${site.url}/blog/</link>
    <description>Essays and notes by Mohd Shayan on engineering, AI, and building technology with purpose.</description>
    <language>en</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items.map(p => `    <item>
      <title>${x(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${new Date(p.date + 'T09:00:00Z').toUTCString()}</pubDate>
      <description>${x(p.summary)}</description>
      <content:encoded><![CDATA[${p.html.replace(/src="\//g, `src="${site.url}/`).replace(/href="\//g, `href="${site.url}/`)}]]></content:encoded>
    </item>`).join('\n')}
  </channel>
</rss>
`;
}

// ---------- philanthropy gallery ----------
function galleryPage() {
  const g = JSON.parse(readFileSync('content/philanthropy/gallery.json', 'utf8'));
  const items = g.items || [];
  const tile = (it, i) => {
    const isVideo = it.type === 'video';
    const video = isVideo ? (it.provider === 'vimeo' ? `https://player.vimeo.com/video/${it.id}` : `https://www.youtube-nocookie.com/embed/${it.id}`) : '';
    const src = isVideo ? it.poster : it.src;
    return `                <a href="${isVideo ? video : it.src}" class="gallery-item${it.wide ? ' wide' : ''} reveal" data-lightbox data-caption="${esc(it.caption || '')}"${isVideo ? ` data-video="${video}"` : ` data-full="${it.src}"`}>
                    <img src="${src}" alt="${esc(it.alt)}" loading="${i < 3 ? 'eager' : 'lazy'}">
                    ${isVideo ? `<span class="play" aria-hidden="true"><span>${icon('play', 'text-xl')}</span></span>` : ''}
                    ${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}
                </a>`;
  };
  const grid = items.length ? `            <div class="gallery${items.length === 1 ? ' single' : ''} mt-12">\n${items.map(tile).join('\n')}\n            </div>
            <dialog id="lightbox" class="lightbox" aria-label="Media viewer">
                <div class="frame">
                    <img alt="" hidden>
                    <iframe title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen hidden></iframe>
                    <button type="button" class="lb-btn" style="left:.75rem" data-prev aria-label="Previous">${icon('arrow-left')}</button>
                    <button type="button" class="lb-btn" style="right:.75rem" data-next aria-label="Next">${icon('arrow-right')}</button>
                    <button type="button" class="lb-close" data-close aria-label="Close">${icon('x')}</button>
                </div>
                <p class="mono-meta text-center mt-3" style="color:rgba(245,242,234,0.7);" data-caption></p>
            </dialog>` : `            <div class="plate p-8 md:p-10 mt-12 reveal">
                <p class="text-body">Photographs and video from this work are being added.</p>
            </div>`;
  const body = `${pageHead('Giving Back to <span class="text-gold-deep">Children in Need</span>', 'The measure of progress is who it lifts along the way.')}
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
                <div class="max-w-[68ch] reveal">
                    <p class="text-[1.03125rem] leading-[1.7]">Alongside his work in technology, Mohd Shayan dedicates time and resources to the children who need it most. He supports causes that open doors for young people, because talent is universal, but opportunity is not.</p>
                    <p class="text-[1.03125rem] leading-[1.7] mt-5">From funding education and nutrition to bridging the digital divide, his goal is simple: help more children get a fair start, and a real chance to build the future on their own terms.</p>
                </div>
${grid}
            </div>
        </section>`;
  return shell({ title: 'Philanthropy | Mohd Shayan', description: 'Photographs and video from Mohd Shayan\'s work supporting children in need: education, nutrition, digital access, and opportunity.', path: '/philanthropy/', active: '/philanthropy/', body,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${site.url}/philanthropy/#page`, url: `${site.url}/philanthropy/`, name: 'Philanthropy: Giving Back to Children in Need', about: { '@id': `${site.url}/#person` }, inLanguage: 'en',
      hasPart: items.filter(i => i.type !== 'video').map(i => ({ '@type': 'ImageObject', contentUrl: `${site.url}${i.src}`, caption: i.caption || i.alt })) } });
}

// ---------- demo hub ----------
function demoPage() {
  const demos = JSON.parse(readFileSync('content/demos.json', 'utf8'));
  const body = `${pageHead('Live demos', 'Working software you can open right now. Each one runs in the browser.')}
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
${demos.map((d, i) => `                    <a href="${d.url}" target="_blank" rel="noopener noreferrer" class="plate overflow-hidden flex flex-col reveal d${(i % 6) + 1} group">
                        <div class="p-4 pb-0"><div class="shot-mat"><img src="${d.image}" alt="${esc(d.title)}" loading="lazy" width="1200" height="750" class="w-full aspect-[16/10] object-cover object-top"></div></div>
                        <div class="p-6 flex flex-col flex-1">
                            <h2 class="card-title text-lg"><span class="sweep-target">${esc(d.title)}</span></h2>
                            <p class="text-body text-[0.9375rem] leading-relaxed mt-2 flex-1">${esc(d.text)}</p>
                            <span class="inline-flex items-center gap-2 text-gold-deep font-[550] text-sm mt-5">Open demo ${icon('arrow-up-right', 'text-xs')}</span>
                        </div>
                    </a>`).join('\n')}
                </div>
            </div>
        </section>`;
  return shell({ title: 'Live demos | Mohd Shayan', description: 'Live, browser-based demos of software built by Mohd Shayan: CustomGlide CRM, QR ticketing, Shayanomaly, deAIfy, and more.', path: '/demo/', active: '', body, canonical: 'https://demo.mohdshayan.com/',
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${site.url}/demo/#page`, url: `${site.url}/demo/`, name: 'Live demos', about: { '@id': `${site.url}/#person` }, inLanguage: 'en',
      hasPart: demos.map(d => ({ '@type': 'SoftwareApplication', name: d.title, url: d.url, applicationCategory: 'WebApplication' })) } });
}

// ---------- write ----------
const out = (p, s) => { if (p.includes('/')) mkdirSync(p.replace(/\/[^/]*$/, ''), { recursive: true }); writeFileSync(p, s); console.log('  wrote', p); };
out('blog/index.html', blogIndex());
for (const p of posts) out(`blog/${p.slug}/index.html`, postPage(p));
out('feed.xml', feed());
out('philanthropy/index.html', galleryPage());
out('demo/index.html', demoPage());
console.log(`pages: ${posts.length} post(s) (${posts.filter(p => p.draft).length} draft), drafts ${INCLUDE_DRAFTS ? 'included' : 'hidden'} from index/feed`);
