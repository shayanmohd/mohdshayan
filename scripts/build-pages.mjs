// Generates /blog/, /blog/<slug>/, /feed.xml, /philanthropy/, /demo/ and /tools/ from content/,
// and refreshes the free-tools section of index.html between its <!-- tools:start --> / <!-- tools:end --> markers.
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
  // Inline SVG figures are not read, so they do not count towards reading time
  const prose = body.replace(/<figure[\s\S]*?<\/figure>/g, ' ');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return { slug, ...meta, body, prose, html: marked.parse(body), minutes: Math.max(1, Math.round(words / 230)), url: `${site.url}/blog/${slug}/` };
}).sort((a, b) => (a.date < b.date ? 1 : -1));
const published = posts.filter(p => !p.draft || INCLUDE_DRAFTS);
for (const p of posts) if (!p.topic) console.warn(`warning: content/posts/${p.slug}.md has no topic, so sorting the blog by topic lists it under "Other"`);

// ---------- shared shell ----------
const NAV = [['/#about', 'About'], ['/#ventures', 'Ventures'], ['/#impact', 'Impact'], ['/#recognition', 'Recognition'], ['/#publications', 'Research'], ['/#projects', 'Work'], ['/blog/', 'Blog'], ['/tools/', 'Tools']];
const DRAWER_NAV = [...NAV, ['/philanthropy/', 'Philanthropy']];
const SOCIAL = [['mailto:contact@mohdshayan.com', 'Email', 'envelope-simple'], ['https://www.linkedin.com/in/shayanmohd', 'LinkedIn', 'linkedin-logo'], ['https://github.com/shayanmohd', 'GitHub', 'github-logo'], ['https://instagram.com/mohdshayanx', 'Instagram', 'instagram-logo'], ['https://x.com/mohdshayanX', 'X (Twitter)', 'x-logo'], ['https://www.reddit.com/user/mohdshayan', 'Reddit', 'reddit-logo']];
const socialLinks = (cls) => SOCIAL.map(([h, l, i]) => `<a href="${h}"${h.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''} class="${cls}" aria-label="${l}">${icon(i)}</a>`).join('\n                    ');

function header(active) {
  return `    <header id="nav" class="fixed top-0 inset-x-0 z-50 gilt-top border-b border-hairline nav-glass backdrop-blur-md">
        <nav class="max-w-content mx-auto px-6 h-16 flex items-center justify-between relative" aria-label="Primary">
            <a href="/" class="font-display text-ink text-xl tracking-tight" style="font-weight:500;">Mohd Shayan<span class="text-gold-deep">.</span></a>
            <ul class="hidden lg:flex items-center gap-8">
${NAV.map(([h, l]) => `                <li><a href="${h}" class="nav-link${h === active ? ' active' : ''}"${h === active ? ' aria-current="page"' : ''}>${l}</a></li>`).join('\n')}
            </ul>
            <div class="flex items-center gap-3">
                <button id="theme-toggle" class="text-ink w-10 h-10 grid place-items-center rounded-full border border-hairline hover:border-hairline-strong transition-colors" aria-label="Dark mode" aria-pressed="false">
                    <svg class="icon text-sm" aria-hidden="true" data-theme-icon><use href="/assets/icons.svg#i-moon"></use></svg>
                </button>
                <a href="/#contact" class="hidden lg:inline-flex btn-ink btn-ink-sm">Let's Talk</a>
                <button id="menu-btn" class="lg:hidden text-ink w-10 h-10 grid place-items-center rounded-full border border-hairline hover:border-hairline-strong transition-colors" aria-label="Menu" aria-expanded="false" aria-controls="drawer">
                    <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
                </button>
            </div>
            <span id="progress" aria-hidden="true"></span>
        </nav>
    </header>
    <div id="drawer" class="fixed inset-x-0 top-[66px] bottom-0 z-40 lg:hidden">
        <aside class="panel px-7 pt-6 pb-7 flex flex-col" role="dialog" aria-modal="true" aria-label="Navigation">
            <nav class="flex flex-col">
${[['/', 'Home'], ...DRAWER_NAV].map(([h, l]) => `                <a href="${h}" class="drawer-link font-display text-ink text-[2rem] py-4 border-b border-hairline-soft" style="font-weight:400;">${l}</a>`).join('\n')}
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
${[['/#about', 'About'], ['/#ventures', 'Ventures'], ['/#impact', 'Impact'], ['/#recognition', 'Recognition'], ['/#publications', 'Research'], ['/#projects', 'Work'], ['/blog/', 'Blog'], ['/tools/', 'Free tools'], ['/philanthropy/', 'Philanthropy'], ['https://demo.mohdshayan.com/', 'Demos']].map(([h, l]) => `                    <li><a href="${h}" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">${l}</a></li>`).join('\n')}
                </ul>
            </div>
            <div>
                <p class="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-gold-bright mb-5">Connect</p>
                <ul class="space-y-3 text-sm">
                    <li><a href="mailto:contact@mohdshayan.com" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">contact@mohdshayan.com</a></li>
                    <li><a href="tel:+918920038741" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">+91 89200 38741</a></li>
                    <li><a href="/uploads/resume.pdf" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);" download>Download Résumé</a></li>
                    <li><a href="/subscribe/" class="sweep-link on-dark transition-colors" style="color:rgba(245,242,234,0.66);">Subscribe</a></li>
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
function shell({ title, description, path, active, body, jsonld, noindex = false, image = `${site.url}/assets/portrait.jpg`, canonical, scripts = [] }) {
  canonical = canonical || `${site.url}${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-PW8CPWM6');</script>
    <!-- End Google Tag Manager -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${path === '/blog/' ? '<meta name="follow.it-verification-code" content="rsyEqJ2kqDBhrcJdzLnd"/>\n    ' : ''}<title>${esc(title)}</title>
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
    <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
    <meta name="theme-color" content="#faf8f3">
    <meta name="msapplication-TileColor" content="#faf8f3">
    <script>(function(){try{var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);var s=m?m[1]:localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();</script>
    <link rel="preload" href="/assets/fonts/newsreader-normal-200-800-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/geist-normal-100-900-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/assets/site.css">
${jsonld ? `    <script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2).split('\n').map(l => '    ' + l).join('\n')}\n    </script>` : ''}
</head>
<body class="bg-paper text-body antialiased">
    <noscript><style>.reveal{opacity:1 !important;transform:none !important;}</style></noscript>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PW8CPWM6"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <a href="#main" class="skip-link">Skip to content</a>
${header(active)}
    <main id="main">
${body}
    </main>
${footer()}
    <script src="/assets/site.js" defer></script>
${scripts.map(src => `    <script type="module" src="${src}"></script>\n`).join('')}</body>
</html>
`;
}

// ---------- blocks ----------
function subscribe(compact = false, rssLink = true) {
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
                ${rssLink ? `<a href="/subscribe/" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm mt-5 whitespace-nowrap">${icon('rss', 'text-xs')} Subscribe with RSS</a>` : ''}
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
// Sort options for the blog index; the default (first) matches the order the page is built in.
const BLOG_SORTS = [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['title', 'Title: A to Z'], ['topic', 'Topic'], ['longest', 'Longest read first'], ['shortest', 'Shortest read first']];

function blogIndex() {
  // The sort bar stays hidden until site.js wires it up, so without JavaScript the list is simply newest first.
  const sortBar = published.length > 1 ? `            <div class="blog-sort mt-4" hidden>
                <label for="blog-sort" class="mono-meta text-muted">Sort by</label>
                <span class="select-wrap">
                    <select id="blog-sort" class="select">
${BLOG_SORTS.map(([v, l]) => `                        <option value="${v}">${l}</option>`).join('\n')}
                    </select>
                    ${icon('caret-down', 'select-caret')}
                </span>
                <p id="blog-sort-status" class="sr-only" aria-live="polite"></p>
            </div>\n` : '';
  const list = published.length ? `${sortBar}            <ul id="post-list" class="ruled-list border-t border-hairline mt-4">
${published.map(p => `                <li class="reveal" data-date="${p.date}" data-title="${esc(p.title)}" data-topic="${esc(p.topic || 'Other')}" data-minutes="${p.minutes}">
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
// Right-hand column on wide screens (hidden below lg): a short author card that stays in view while reading.
function postAside() {
  return `                <aside class="post-aside hidden lg:block" aria-label="About the author">
                    <div class="post-aside-inner">
                        <div class="plate p-6 reveal">
                            <img src="/assets/avatar-160.webp" alt="" width="64" height="64" loading="lazy" decoding="async" class="w-16 h-16 rounded-full object-cover bg-cream">
                            <p class="font-display text-ink text-xl mt-4" style="font-weight:500;">Mohd Shayan</p>
                            <p class="mono-meta text-muted mt-1">Product Engineer, AI Entrepreneur &amp; Philanthropist</p>
                            <p class="text-body text-sm leading-relaxed mt-4">Founder &amp; CEO of <strong class="text-ink">SocialSure Private Limited</strong>, an AI-first company, building intelligent products and channeling that work into opportunity for children in need.</p>
                            <a href="/#about" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm mt-4 whitespace-nowrap">More about me ${icon('arrow-right', 'text-xs')}</a>
                            <div class="flex justify-between mt-5">
                    ${socialLinks('social')}
                            </div>
                        </div>
                    </div>
                </aside>`;
}

function postPage(p) {
  const body = `        <article>
${pageHead(esc(p.title), esc(p.summary), `${longDate(p.date)} <span class="mx-2">·</span> ${p.minutes} min read`)}
            <div class="max-w-content mx-auto px-6 pb-24">
                <div class="post-layout">
                <div class="min-w-0">
                <div class="prose">
${p.html}
                </div>
                ${p.tags.length ? `<div class="flex flex-wrap gap-2 mt-10 reveal">${p.tags.map(t => `<span class="tag-chip">${esc(t)}</span>`).join('')}</div>` : ''}
                <div class="border-t border-hairline mt-12 pt-8 flex flex-wrap items-center justify-between gap-4 reveal">
                    <a href="/blog/" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm whitespace-nowrap">${icon('arrow-left', 'text-xs')} All writing</a>
                    <p class="mono-meta text-muted">Written by Mohd Shayan</p>
                </div>
                </div>
${postAside()}
                </div>
${subscribe()}
            </div>
        </article>`;
  return shell({ title: `${p.title} | Mohd Shayan`, description: p.summary, path: `/blog/${p.slug}/`, active: '/blog/', body, noindex: p.draft,
    jsonld: { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${p.url}#post`, headline: p.title, description: p.summary, url: p.url, mainEntityOfPage: p.url, datePublished: p.date, dateModified: p.date,
      author: { '@type': 'Person', '@id': `${site.url}/#person`, name: site.author, url: site.url }, publisher: { '@id': `${site.url}/#person` }, isPartOf: { '@id': `${site.url}/blog/#blog` }, keywords: p.tags.join(', '), inLanguage: 'en', wordCount: p.prose.split(/\s+/).length } });
}

// ---------- feed ----------
// Feed readers and email do not load the site's CSS, so inline SVG figures would render as black shapes.
// Each figure becomes a one-line pointer back to the post instead.
function feedHtml(p) {
  return p.html
    .replace(/<figure class="chart">[\s\S]*?<\/figure>/g, m => {
      const title = (m.match(/<title[^>]*>([^<]*)<\/title>/) || ['', 'Figure'])[1].trim();
      return `<p><em>Figure: ${title}. <a href="${p.url}">View it on mohdshayan.com</a></em></p>`;
    })
    .replace(/src="\//g, `src="${site.url}/`).replace(/href="\//g, `href="${site.url}/`);
}
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
      <content:encoded><![CDATA[${feedHtml(p)}]]></content:encoded>
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

// ---------- subscribe ----------
function subscribePage() {
  const feedUrl = `${site.url}/feed.xml`;
  const body = `${pageHead('Subscribe', 'Get new posts by email, or follow them in a feed reader.')}
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
${subscribe(true, false).replace('mt-12', 'mt-4')}
            <div class="plate p-8 md:p-10 mt-6 reveal">
                <h2 class="h3-serif" style="font-weight:500;">Follow in a feed reader</h2>
                <p class="text-body mt-2 max-w-xl">Paste this address into a feed reader such as Feedly, Inoreader, or NetNewsWire, and new posts will show up there.</p>
                <div class="subscribe flex flex-col sm:flex-row gap-3 mt-6 max-w-xl">
                    <label for="feed-url" class="sr-only">Feed address</label>
                    <input type="text" id="feed-url" value="${feedUrl}" readonly class="font-mono text-sm">
                    <button type="button" class="btn-ghost shrink-0" data-copy="feed-url">Copy</button>
                </div>
                <p id="feed-url-status" class="mono-meta text-muted mt-3" aria-live="polite"></p>
            </div>
            </div>
        </section>`;
  return shell({ title: 'Subscribe | Mohd Shayan', description: 'Get new posts by Mohd Shayan by email or in a feed reader.', path: '/subscribe/', active: '', body });
}

// ---------- free tools ----------
// Registry: content/tools.json. Each tool lives at /tools/<slug>/, with its UI in content/tools/<slug>.html
// and its script in /assets/tools/<slug>.js.
const toolsData = JSON.parse(readFileSync('content/tools.json', 'utf8'));
const TOOLS = toolsData.tools;
const toolHref = t => `/tools/${t.slug}/`;
const toolCanonical = t => `${site.url}/tools/${t.slug}/`;
const stripTags = h => String(h).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const ORIGIN = { '@type': 'Person', '@id': `${site.url}/#person`, name: site.author, url: site.url };

function toolRow(t) {
  return `                    <li>
                        <a href="${toolHref(t)}" class="tool-row grid grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[40px_minmax(0,16rem)_minmax(0,1fr)_auto] gap-x-5 gap-y-2 items-start reveal">
                            <span class="icon-sq wash">${icon(t.icon)}</span>
                            <span class="min-w-0">
                                <span class="card-title text-lg block"><span class="sweep-target">${esc(t.name)}</span></span>
                            </span>
                            <span class="text-body text-[0.9375rem] leading-relaxed col-start-2 md:col-start-auto md:pt-0.5">${esc(t.summary)}</span>
                            <span class="hidden md:inline-flex items-center gap-2 text-gold-deep font-[550] text-sm whitespace-nowrap pt-1">Open ${icon('arrow-right', 'text-xs')}</span>
                        </a>
                    </li>`;
}

function toolsIndex() {
  const groups = toolsData.categories.map(c => [c, TOOLS.filter(t => t.category === c)]).filter(([, list]) => list.length);
  const promises = [
    ['shield-check', 'Private by design', 'Everything runs in your browser. What you type, paste or drop in stays on your device.'],
    ['sparkle', 'Free, with no catch', 'No sign-up, no watermark, no limits, and no trial that runs out.'],
    ['github-logo', 'Open source', 'The code behind every tool is <a href="https://github.com/shayanmohd/mohdshayan" target="_blank" rel="noopener noreferrer" class="sweep-link text-ink">public on GitHub</a>, so you can read exactly what it does.'],
  ];
  const body = `${pageHead('Free <span class="text-gold-deep">tools</span>', 'Small, fast utilities, free for anyone to use. Each one runs entirely in your browser, so what you enter stays on your device.')}
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
                <div class="ruled-grid md:grid-cols-3 reveal">
${promises.map(([ic, h, p]) => `                    <div class="cell">
                        <div class="icon-sq mb-5">${icon(ic)}</div>
                        <h2 class="card-title mb-2">${h}</h2>
                        <p class="text-body text-[0.9375rem] leading-relaxed">${p}</p>
                    </div>`).join('\n')}
                </div>
${groups.map(([c, list]) => `                <h2 class="eyebrow mt-16 reveal">${esc(c)}</h2>
                <ul class="ruled-list border-t border-hairline mt-4">
${list.map(toolRow).join('\n')}
                </ul>`).join('\n')}
                <div class="plate p-8 md:p-10 mt-16 flex flex-col md:flex-row md:items-center justify-between gap-6 reveal">
                    <div>
                        <h2 class="h3-serif" style="font-weight:500;">Missing a tool you need?</h2>
                        <p class="text-body mt-2 max-w-xl">Suggest one. The most useful ideas get built and added here, free for everyone.</p>
                    </div>
                    <a href="mailto:contact@mohdshayan.com?subject=Tool%20suggestion" class="btn-ink shrink-0">${icon('envelope-simple')} Suggest a tool</a>
                </div>
            </div>
        </section>`;
  return shell({ title: 'Free Online Tools | Mohd Shayan', description: 'Free, private tools by Mohd Shayan that run in your browser: deAIfy, commission, GST, EMI and margin calculators, a QR code generator, an image compressor and a password generator.', path: '/tools/', active: '/tools/', body,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${site.url}/tools/#page`, url: `${site.url}/tools/`, name: 'Free tools', about: { '@id': `${site.url}/#person` }, inLanguage: 'en',
      hasPart: TOOLS.map(t => ({ '@type': 'WebApplication', name: t.name, url: toolCanonical(t), applicationCategory: t.appCategory, operatingSystem: 'Any', isAccessibleForFree: true })) } });
}

function relatedTools(t) {
  const others = TOOLS.filter(o => o.slug !== t.slug);
  const picks = [...others.filter(o => o.category === t.category), ...others.filter(o => o.category !== t.category)].slice(0, 4);
  return picks.map(o => `                    <a href="${toolHref(o)}" class="cell block group">
                        <div class="icon-sq wash mb-4">${icon(o.icon)}</div>
                        <h3 class="card-title"><span class="sweep-target">${esc(o.name)}</span></h3>
                        <p class="text-body text-sm leading-relaxed mt-2">${esc(o.summary)}</p>
                    </a>`).join('\n');
}

function toolPage(t) {
  const ui = readFileSync(`content/tools/${t.slug}.html`, 'utf8').trimEnd();
  const canonical = toolCanonical(t);
  const body = `        <section class="page-head pb-8 md:pb-10">
            <div class="max-w-content mx-auto px-6">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 reveal">
                    <a href="/tools/" class="chip-pill">${icon('toolbox', 'text-xs')} Free tools</a>
                    <span class="mono-meta text-muted">${esc(t.category)}</span>
                </div>
                <h1 class="h2 mt-4 max-w-3xl balance reveal">${t.h1}</h1>
                <p class="lead mt-5 max-w-2xl reveal d1">${t.lead}</p>
            </div>
        </section>
${ui}
        <section class="py-16 md:py-20">
            <div class="max-w-content mx-auto px-6">
                <hr class="section-rule">
                <div class="grid lg:grid-cols-[1fr_2fr] gap-8 lg:gap-14 mt-10">
                    <div>
                        <h2 class="h3-serif" style="font-weight:500;">Questions</h2>
                        <p class="text-body text-[0.9375rem] leading-relaxed mt-3 max-w-xs">Built by <a href="${site.url}/" class="sweep-link text-ink">Mohd Shayan</a>. Found a problem or have an idea? <a href="mailto:contact@mohdshayan.com?subject=${encodeURIComponent(t.name)}" class="sweep-link text-ink">Send a note</a>.</p>
                    </div>
                    <div>
${t.faq.map((f, i) => `                        <details class="faq"${i === 0 ? ' open' : ''}>
                            <summary>${f.q}${icon('caret-down')}</summary>
                            <div class="faq-body"><p>${f.a}</p></div>
                        </details>`).join('\n')}
                    </div>
                </div>
            </div>
        </section>
        <section class="pb-24">
            <div class="max-w-content mx-auto px-6">
                <div class="flex flex-wrap items-end justify-between gap-4">
                    <h2 class="h3-serif" style="font-weight:500;">More free tools</h2>
                    <a href="/tools/" class="sweep-link inline-flex items-center gap-2 text-gold-deep font-[550] text-sm whitespace-nowrap">All tools ${icon('arrow-right', 'text-xs')}</a>
                </div>
                <div class="ruled-grid sm:grid-cols-2 lg:grid-cols-4 mt-6">
${relatedTools(t)}
                </div>
            </div>
        </section>`;
  return shell({ title: t.title, description: t.description, path: `/tools/${t.slug}/`, active: '/tools/', body, scripts: [`/assets/tools/${t.slug}.js`],
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${canonical}#app`, name: t.name, url: canonical, description: t.description, applicationCategory: t.appCategory, operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, author: ORIGIN, publisher: ORIGIN, inLanguage: 'en' },
      { '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: t.faq.map(f => ({ '@type': 'Question', name: stripTags(f.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) } })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
        { '@type': 'ListItem', position: 2, name: 'Free tools', item: `${site.url}/tools/` },
        { '@type': 'ListItem', position: 3, name: t.name, item: canonical } ] },
    ] } });
}

// The homepage keeps its hand-written markup; only the region between the markers is regenerated.
function homepageTools(html) {
  const start = '<!-- tools:start -->', end = '<!-- tools:end -->';
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) { console.warn('warning: index.html has no tools markers, so the homepage tools section was not refreshed'); return html; }
  const cells = TOOLS.map(t => `                <a href="${toolHref(t)}" class="cell block">
                    <div class="icon-sq wash mb-5">${icon(t.icon)}</div>
                    <h3 class="card-title"><span class="sweep-target">${esc(t.name)}</span></h3>
                    <p class="mono-meta text-gold-deep mt-1">${esc(t.category)}</p>
                    <p class="text-body text-[0.9375rem] leading-relaxed mt-3">${esc(t.summary)}</p>
                </a>`).join('\n');
  return `${html.slice(0, a + start.length)}
            <div class="ruled-grid sm:grid-cols-2 lg:grid-cols-4 mt-12 reveal">
${cells}
            </div>
            ${html.slice(b)}`;
}

// ---------- sitemap (regenerated every build so published posts are always listed) ----------
function sitemap() {
  const live = posts.filter(p => !p.draft);
  const newest = live.length ? live[0].date : '';
  const url = (loc, { lastmod = '', changefreq, priority, extra = '' }) => `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${extra}
  </url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[
    url(`${site.url}/`, { changefreq: 'weekly', priority: '1.0', extra: `\n    <xhtml:link rel="alternate" hreflang="en" href="${site.url}/"/>` }),
    url(`${site.url}/llms.txt`, { changefreq: 'monthly', priority: '0.5' }),
    url(`${site.url}/blog/`, { lastmod: newest, changefreq: 'weekly', priority: '0.8' }),
    ...live.map(p => url(p.url, { lastmod: p.date, changefreq: 'monthly', priority: '0.7' })),
    url(`${site.url}/philanthropy/`, { changefreq: 'monthly', priority: '0.7' }),
    url(`${site.url}/subscribe/`, { changefreq: 'yearly', priority: '0.4' }),
    url(`${site.url}/tools/`, { changefreq: 'monthly', priority: '0.8' }),
    ...TOOLS.map(t => url(toolCanonical(t), { changefreq: 'monthly', priority: '0.7' })),
  ].join('\n')}
</urlset>
`;
}

// ---------- write ----------
const out = (p, s) => { if (p.includes('/')) mkdirSync(p.replace(/\/[^/]*$/, ''), { recursive: true }); writeFileSync(p, s); console.log('  wrote', p); };
out('blog/index.html', blogIndex());
for (const p of posts) out(`blog/${p.slug}/index.html`, postPage(p));
out('feed.xml', feed());
out('subscribe/index.html', subscribePage());
out('philanthropy/index.html', galleryPage());
out('demo/index.html', demoPage());
out('tools/index.html', toolsIndex());
for (const t of TOOLS) out(`tools/${t.slug}/index.html`, toolPage(t));
out('index.html', homepageTools(readFileSync('index.html', 'utf8')));
out('sitemap.xml', sitemap());
console.log(`pages: ${posts.length} post(s) (${posts.filter(p => p.draft).length} draft), drafts ${INCLUDE_DRAFTS ? 'included' : 'hidden'} from index/feed`);
