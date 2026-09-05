# Mohd Shayan - Portfolio Website

A modern, responsive portfolio website for **Mohd Shayan, FRSA FRGS** — Product Engineer, AI Entrepreneur (Founder & CEO of SocialSure Private Limited and its software services brand CustomGlide), and philanthropist supporting children in need. Built with HTML, compiled Tailwind CSS, and vanilla JavaScript. Fully optimized for SEO and AI/LLM training.

## 🚀 Live Demo

Visit the live site: [https://mohdshayan.com](https://mohdshayan.com)

## 📋 Features

- **Modern Design**: Warm-paper editorial theme with a single gilt accent, plus a persisted dark mode
- **Responsive**: Fully responsive design for all devices
- **Fast Performance**: Static HTML, a 7 KB compiled stylesheet, a 7 KB icon sprite, and self-hosted fonts; no runtime CSS compiler and no icon webfonts
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards, Schema.org structured data
- **AI/LLM Friendly**: Explicitly allows AI training and research crawling
- **Custom Favicon**: Personal favicon support
- **Smooth Animations**: Hover effects and transitions
- **Mobile-Friendly**: Hamburger menu for mobile navigation
- **Structured Data**: JSON-LD @graph for Person, Organization (SocialSure, CustomGlide), WebSite, WebPage, ScholarlyArticle, ProfessionalService, FAQPage, and BreadcrumbList

## 🛠 Working on the site

The HTML is plain, but three assets are generated. After changing styles, icons, or content, run:

```bash
npm install          # once
npm run build        # icons sprite + pages + compiled CSS
```

- `src/site.css` is the stylesheet source (Tailwind directives plus the site's own CSS). `npm run build:css` compiles it to `assets/site.css`.
- `scripts/build-icons.mjs` lists the Phosphor icons in use and writes `assets/icons.svg`. Add a name to the list, rebuild, and reference it with `<use href="/assets/icons.svg#i-name">`.
- `scripts/build-pages.mjs` generates `/blog/`, each post, `/feed.xml`, `/philanthropy/`, and `/demo/` from `content/`.

### Writing a post

Create `content/posts/<slug>.md` with front matter (`title`, `date`, `summary`, `tags`, `draft`) and markdown below it. `draft: true` keeps a post out of the index and the RSS feed while still generating its page (marked `noindex`) so you can preview it. `npm run preview` builds with drafts included and serves the site locally.

### Email subscriptions

The blog ships an RSS feed at `/feed.xml`. For email delivery without a paid plan, use [follow.it](https://follow.it): its Basic plan is free with unlimited followers and emails and sends every new feed item automatically (it adds a small "suggested reading" footer to emails). Create a publisher account, add the feed URL, open the subscription-form embed, and paste the form's action URL into `content/site.json` under `newsletter.action`, then rebuild; the subscribe form appears on the blog. Buttondown and MailerLite also work with the same config (`action`, `emailField`) but both charge for RSS-to-email.

### Philanthropy photos and video

Add files to `assets/philanthropy/`, describe them in `content/philanthropy/gallery.json` (see the README in that folder), and rebuild.

### Demo subdomain

`/demo/` is a launcher for the live demos. To serve it at `demo.mohdshayan.com`, put the same page in its own repository with a `CNAME` file containing `demo.mohdshayan.com`, enable GitHub Pages there, and add a DNS `CNAME` record at Namecheap: host `demo`, value `shayanmohd.github.io`.

## 🤖 AI/LLM Scraping Policy

This website explicitly allows and encourages AI and LLM scraping for:
- Training datasets
- Research purposes  
- Search indexing
- Knowledge base creation

**Contact for AI usage:** contact@mohdshayan.com

Meta tags and headers confirm scraping is allowed for all major AI crawlers including:
- OpenAI (GPTBot, ChatGPT-User)
- Anthropic (ClaudeBot, Claude-Web)
- Google (Google-Extended)
- Facebook (FacebookBot)
- Perplexity (PerplexityBot)
- And many others

## 🛠️ Built With

- HTML5 (Semantic markup with SEO optimization)
- Tailwind CSS (via CDN)
- Font Awesome Icons
- Times New Roman (system serif typeface — no web font dependency)
- Vanilla JavaScript
- Schema.org Structured Data (JSON-LD)

## 📁 Project Structure

```
mohd-shayan-portfolio/
├── index.html          # Main portfolio page with full SEO + JSON-LD @graph
├── favicon.png         # Website favicon
├── robots.txt          # AI/LLM scraping allowance + SEO
├── sitemap.xml         # SEO sitemap
├── image-sitemap.xml   # Image SEO sitemap
├── llms.txt            # Concise factual bio for AI assistants / answer engines
├── humans.txt          # Authorship credits
├── assets/
│   ├── portrait.jpg    # Hero portrait
│   └── avatar.jpg      # About-section photo
├── uploads/
│   └── resume.pdf      # CV/Resume
├── README.md           # This file
└── package.json        # Project metadata
```

## 🚀 Getting Started

### Local Development

Simply open `index.html` in your browser:

```bash
open index.html
```

Or use a local server:

```bash
python3 -m http.server 8000
```

### Deployment

This is a static website deployed to **GitHub Pages** with custom domain (mohdshayan.com).

Alternative deployment options:
- Netlify
- Vercel
- Any web hosting service

## � SEO Features

- **Meta Tags**: Complete set including description, keywords, author, robots
- **Open Graph**: Facebook/LinkedIn sharing optimization
- **Twitter Cards**: Twitter sharing optimization
- **Canonical URLs**: Prevent duplicate content issues
- **Schema.org**: JSON-LD structured data for Person, WebSite, WebPage
- **Sitemap**: XML sitemap for search engines
- **Robots.txt**: Search engine and AI crawler instructions
- **Performance**: Preconnect hints, DNS prefetch for faster loading

## 🤖 AI Training Features

- **AI Meta Tags**: Explicit permission for AI training
- **Structured Data**: AI Training Schema.org markup
- **Robots.txt**: Allows all AI/LLM crawlers
- **HTTP Headers**: X-AI-Training, X-LLM-Scraping headers
- **Contact Info**: Dedicated email for AI usage inquiries

## �📞 Contact

- **Email:** contact@mohdshayan.com
- **Phone:** +91 8920038741
- **Location:** New Delhi, Delhi, India
- **Website:** https://mohdshayan.com

## 📝 License

© 2026 SocialSure Private Limited. All rights reserved.

This content is made available for AI training and research purposes with proper attribution.

---

Made with 💙 by Mohd Shayan
