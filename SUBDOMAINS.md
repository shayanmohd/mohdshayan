# Subdomains: free tools and demos

Each free tool has its own address, and so does the demo hub:

| Address | Source page | Repository that serves it |
|---|---|---|
| https://deaify.mohdshayan.com | `tools/deaify/` | `shayanmohd/deaify.mohdshayan.com` |
| https://commission.mohdshayan.com | `tools/commission/` | `shayanmohd/commission.mohdshayan.com` |
| https://gst.mohdshayan.com | `tools/gst/` | `shayanmohd/gst.mohdshayan.com` |
| https://emi.mohdshayan.com | `tools/emi/` | `shayanmohd/emi.mohdshayan.com` |
| https://margin.mohdshayan.com | `tools/margin/` | `shayanmohd/margin.mohdshayan.com` |
| https://qr.mohdshayan.com | `tools/qr/` | `shayanmohd/qr.mohdshayan.com` |
| https://compress.mohdshayan.com | `tools/compress/` | `shayanmohd/compress.mohdshayan.com` |
| https://password.mohdshayan.com | `tools/password/` | `shayanmohd/password.mohdshayan.com` |
| https://demo.mohdshayan.com | `demo/` | `shayanmohd/demo.mohdshayan.com` (already live) |

Every tool also works on the main site at `https://mohdshayan.com/tools/<slug>/`, and the hub is at https://mohdshayan.com/tools/.

## Why one repository per address

GitHub Pages serves exactly one custom domain per repository. This repository stays the single source: `scripts/build-subdomains.mjs` turns each page into a standalone site in `dist/subdomains/<host>/` (its own copy of the CSS, icons, fonts and scripts, with links back to mohdshayan.com), and `scripts/publish-subdomains.sh` pushes each one to its repository. Never edit those repositories by hand; the next deploy overwrites them.

## One-time setup

### 1. DNS records (Namecheap → Domain List → mohdshayan.com → Advanced DNS)

Add one **CNAME record** per tool, all pointing at GitHub Pages:

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `deaify` | `shayanmohd.github.io.` | Automatic |
| CNAME | `commission` | `shayanmohd.github.io.` | Automatic |
| CNAME | `gst` | `shayanmohd.github.io.` | Automatic |
| CNAME | `emi` | `shayanmohd.github.io.` | Automatic |
| CNAME | `margin` | `shayanmohd.github.io.` | Automatic |
| CNAME | `qr` | `shayanmohd.github.io.` | Automatic |
| CNAME | `compress` | `shayanmohd.github.io.` | Automatic |
| CNAME | `password` | `shayanmohd.github.io.` | Automatic |

`demo` already exists. Do not use a wildcard (`*`) record: GitHub warns that wildcard records let anyone claim an unused subdomain. If `mohdshayan.com` is not yet a verified domain on the GitHub account (Settings → Pages → Add a domain), verify it too; that stops other accounts from taking over a subdomain.

### 2. A deploy token

The workflow needs permission to create the repositories, push to them and switch on Pages. Create a token and store it as a repository secret named **`SUBDOMAINS_TOKEN`** (this repository → Settings → Secrets and variables → Actions → New repository secret).

- **Fine-grained token** (recommended): github.com → Settings → Developer settings → Fine-grained tokens. Resource owner `shayanmohd`, repository access **All repositories** (so it covers the repositories the workflow creates), and these repository permissions set to *Read and write*: **Administration** (to create repositories), **Contents**, **Pages**.
- **Classic token**: the `repo` scope (the Pages API does not accept the narrower `public_repo`).

### 3. Deploy

Merge to `main`. The **Deploy subdomains** workflow runs on every push that touches the tools, the demo or shared assets, and can also be started by hand from the Actions tab (optionally for named hosts only). The first run creates each repository and turns on Pages; later runs only push what changed. The existing `demo.mohdshayan.com` repository is updated the same way, so its navigation stays in step with the main site. Without the secret the workflow still assembles the sites and then stops with a notice.

GitHub issues the HTTPS certificate once DNS resolves, usually within an hour. The workflow switches on *Enforce HTTPS* on its next run after that (or tick it in each repository's Pages settings).

### 4. Point the main site at the subdomains

While the subdomains are being set up, the main site links to `/tools/<slug>/` and treats that as the canonical address. Once the addresses above load, set `tools.subdomains` to `true` in `content/site.json` and run `npm run build`. Links, canonical URLs and structured data then name `https://<slug>.mohdshayan.com/`, and the tool pages leave the main sitemap (each subdomain publishes its own).

## Adding a tool

1. Add an entry to `content/tools.json` (slug, name, copy, FAQ).
2. Write its interface in `content/tools/<slug>.html` and its script in `assets/tools/<slug>.js` (pure logic in `assets/tools/lib/`, with tests in `tests/`).
3. `npm run build && npm test`, then add the DNS record for `<slug>`. The workflow creates the repository on the next deploy.

## Running it locally

```bash
npm run build                 # pages, CSS, icons, vendored libraries
npm run build:subdomains      # dist/subdomains/<host>/ for every site (or: node scripts/build-subdomains.mjs deaify qr)
GH_TOKEN=<token> OWNER=shayanmohd bash scripts/publish-subdomains.sh deaify.mohdshayan.com
```
