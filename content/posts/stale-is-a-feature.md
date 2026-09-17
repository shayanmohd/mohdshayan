---
title: Stale is a feature
date: 2026-09-17
summary: Most origins that fall over could have kept serving for hours if the CDN had been told a slightly old answer was acceptable. Write that tolerance down per route, in one header.
tags: CDN, Caching, Cloudflare
draft: false
---

Most outages I have watched from the outside had the same shape: the origin stopped answering, the CDN in front of it had a perfectly good copy of every page from a few minutes earlier, and the CDN served error pages anyway, because nobody had told it that a slightly old answer was acceptable. The HTTP specification has had a way to say that since 2010. Almost nobody uses it, and the reason is not ignorance of the header but the absence of a number to put in it. The number is the staleness budget, and it is different for every route.

## The unused half of the specification

[RFC 5861](https://www.rfc-editor.org/rfc/rfc5861) added two extensions to Cache-Control. stale-while-revalidate lets a cache serve a stale copy immediately while fetching a fresh one in the background, which is a latency feature. stale-if-error lets a cache serve a stale copy when the origin returns an error or cannot be reached, for a stated number of seconds past expiry, which is an availability feature. The second is the one that turns a dead origin into a slow news day, and it is the rarer of the two by an order of magnitude.

The HTTP Archive's Web Almanac has counted directive usage across millions of pages. In the [2019 chapter](https://almanac.httparchive.org/en/2019/caching), stale-while-revalidate appeared on 2.4 percent of responses and stale-if-error on 0.2 percent. In [2020](https://almanac.httparchive.org/en/2020/caching) the figures were 2.2 and 0.2 percent on mobile, and in [2021](https://almanac.httparchive.org/en/2021/caching) 2.4 and 0.2. Fewer than one response in forty carries the latency directive; one in five hundred carries the outage one; and the numbers did not move across three years while the CDN industry grew around them.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of web responses carrying the two stale directives, Web Almanac 2019 to 2021</title>
<desc id="f1-d">Grouped horizontal bars for three years. stale-while-revalidate: 2.4 percent in 2019, 2.2 in 2020, 2.4 in 2021. stale-if-error: 0.2 percent in each year. Both series are flat and small.</desc>
<text x="0" y="18" class="viz-title">The outage directive is used on one response in five hundred</text>
<text x="0" y="36" class="viz-sub">Percent of responses whose Cache-Control includes the directive, mobile crawl</text>
<rect x="330" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="348" y="37" class="viz-label-muted">stale-while-revalidate</text>
<rect x="510" y="26" width="12" height="12" rx="3" class="viz-f4"/><text x="528" y="37" class="viz-label-muted">stale-if-error</text>
<line x1="96" y1="52" x2="96" y2="220" class="viz-axis"/>
<text x="86" y="75" text-anchor="end" class="viz-label">2019</text>
<path d="M96 60 H332 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H96 Z" class="viz-f1"/>
<text x="346" y="72" class="viz-value">2.4</text>
<path d="M96 80 H112 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H96 Z" class="viz-f4"/>
<text x="126" y="92" class="viz-value">0.2</text>
<text x="86" y="131" text-anchor="end" class="viz-label">2020</text>
<path d="M96 116 H312 a4 4 0 0 1 4 4 V128 a4 4 0 0 1 -4 4 H96 Z" class="viz-f1"/>
<text x="326" y="128" class="viz-value">2.2</text>
<path d="M96 136 H112 a4 4 0 0 1 4 4 V148 a4 4 0 0 1 -4 4 H96 Z" class="viz-f4"/>
<text x="126" y="148" class="viz-value">0.2</text>
<text x="86" y="187" text-anchor="end" class="viz-label">2021</text>
<path d="M96 172 H332 a4 4 0 0 1 4 4 V184 a4 4 0 0 1 -4 4 H96 Z" class="viz-f1"/>
<text x="346" y="184" class="viz-value">2.4</text>
<path d="M96 192 H112 a4 4 0 0 1 4 4 V204 a4 4 0 0 1 -4 4 H96 Z" class="viz-f4"/>
<text x="126" y="204" class="viz-value">0.2</text>
<text x="0" y="248" class="viz-label-muted">Scale: 100 pixels per percentage point. Both lines are flat across the three editions.</text>
</svg>
<figcaption>Source: HTTP Archive Web Almanac caching chapters for <a href="https://almanac.httparchive.org/en/2019/caching">2019</a>, <a href="https://almanac.httparchive.org/en/2020/caching">2020</a> and <a href="https://almanac.httparchive.org/en/2021/caching">2021</a>; mobile figures where the chapter splits them.</figcaption>
</figure>

## What the header changes

Consider a request for a page during an origin failure. Without the directive, the CDN's copy expires, the CDN asks the origin, the origin returns a 503 or nothing, and the CDN passes the failure to the user. With stale-if-error set to, say, 86,400, the CDN's copy expires, the CDN asks the origin, the origin fails, and the CDN serves the copy it already has, for up to a day past its expiry, while retrying the origin in the background. The user sees a page that is a few minutes old. The operator sees an alert instead of a customer.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A request during an origin failure, with and without stale-if-error</title>
<desc id="f2-d">Two rows of steps. Without the directive: cached copy expires, CDN asks origin, origin fails, user receives an error page. With the directive: cached copy expires, CDN asks origin, origin fails, user receives the stale copy while the CDN retries in the background. The two rows differ only at the last step.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Same failure, different last step</text>
<text x="8" y="56" class="viz-tick">WITHOUT</text>
<rect x="8" y="66" width="130" height="50" rx="8" class="viz-box"/>
<text x="73" y="96" text-anchor="middle" class="viz-label">copy expires</text>
<line x1="140" y1="91" x2="160" y2="91" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="164" y="66" width="130" height="50" rx="8" class="viz-box"/>
<text x="229" y="96" text-anchor="middle" class="viz-label">CDN asks origin</text>
<line x1="296" y1="91" x2="316" y2="91" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="320" y="66" width="130" height="50" rx="8" class="viz-box"/>
<text x="385" y="96" text-anchor="middle" class="viz-label">origin fails</text>
<line x1="452" y1="91" x2="472" y2="91" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="476" y="66" width="156" height="50" rx="8" class="viz-box-ink"/>
<text x="554" y="96" text-anchor="middle" class="viz-on-ink">user gets an error</text>
<text x="8" y="166" class="viz-tick">WITH stale-if-error</text>
<rect x="8" y="176" width="130" height="50" rx="8" class="viz-box"/>
<text x="73" y="206" text-anchor="middle" class="viz-label">copy expires</text>
<line x1="140" y1="201" x2="160" y2="201" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="164" y="176" width="130" height="50" rx="8" class="viz-box"/>
<text x="229" y="206" text-anchor="middle" class="viz-label">CDN asks origin</text>
<line x1="296" y1="201" x2="316" y2="201" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="320" y="176" width="130" height="50" rx="8" class="viz-box"/>
<text x="385" y="206" text-anchor="middle" class="viz-label">origin fails</text>
<line x1="452" y1="201" x2="472" y2="201" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="476" y="176" width="156" height="50" rx="8" class="viz-box-accent"/>
<text x="554" y="200" text-anchor="middle" class="viz-label">user gets the copy</text>
<text x="554" y="218" text-anchor="middle" class="viz-label-muted">CDN retries behind it</text>
<text x="320" y="270" text-anchor="middle" class="viz-label-muted">Three identical steps; the header decides only what happens when the origin says no.</text>
</svg>
<figcaption>Illustrative: the request path during an origin failure; whether a given CDN honours the directive, and for which status codes, is a matter for its documentation.</figcaption>
</figure>

Two cautions belong here. The first is that CDNs differ in whether and how they honour stale-if-error; some support it as written, some implement the same idea under a product setting with a different name, and some ignore it. [Cloudflare's Cache-Control documentation](https://developers.cloudflare.com/cache/concepts/cache-control/) is where I check for the sites I run on it, and every other CDN has an equivalent page. The second is that the header only helps for responses the CDN was allowed to cache in the first place. A route marked no-store has no copy to fall back on, and that is often correct, which brings us to the number.

## The staleness budget

The reason the directive goes unused is that it demands a number, and the number is a product decision disguised as a configuration value. It is the answer to: for this route, for how many seconds is a wrong answer cheaper than no answer? I call it the staleness budget, and it is different for every kind of route in a way that no site-wide default can capture.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Staleness budgets by route type, from a day to zero</title>
<desc id="f3-d">A table of route types and budgets in seconds. A marketing or portfolio page: 86,400, a day. A blog post: 86,400. A product listing: 3,600, an hour. A pricing page: 600, ten minutes. A dashboard: 60, a minute. A ticket validation endpoint: 0. An account balance: 0. The rows with a non-zero budget can carry stale-if-error; the zero rows must fail honestly.</desc>
<text x="0" y="18" class="viz-title">How long is a wrong answer cheaper than no answer?</text>
<text x="20" y="48" class="viz-tick">ROUTE</text>
<text x="300" y="48" class="viz-tick">BUDGET</text>
<text x="420" y="48" class="viz-tick">WHY</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Marketing or portfolio page</text>
<text x="300" y="82" class="viz-value">a day</text>
<text x="420" y="82" class="viz-label-muted">nothing changes by the hour</text>
<line x1="0" y1="94" x2="640" y2="94" class="viz-grid"/>
<text x="20" y="120" class="viz-label">Blog post</text>
<text x="300" y="120" class="viz-value">a day</text>
<text x="420" y="120" class="viz-label-muted">a typo fix can wait</text>
<line x1="0" y1="132" x2="640" y2="132" class="viz-grid"/>
<text x="20" y="158" class="viz-label">Product listing</text>
<text x="300" y="158" class="viz-value">an hour</text>
<text x="420" y="158" class="viz-label-muted">checkout re-checks stock</text>
<line x1="0" y1="170" x2="640" y2="170" class="viz-grid"/>
<text x="20" y="196" class="viz-label">Pricing page</text>
<text x="300" y="196" class="viz-value">ten minutes</text>
<text x="420" y="196" class="viz-label-muted">an old price is a promise</text>
<line x1="0" y1="208" x2="640" y2="208" class="viz-grid"/>
<text x="20" y="234" class="viz-label">Dashboard</text>
<text x="300" y="234" class="viz-value">a minute</text>
<text x="420" y="234" class="viz-label-muted">shown with its timestamp</text>
<line x1="0" y1="246" x2="640" y2="246" class="viz-grid"/>
<text x="20" y="272" class="viz-label">Ticket validation, balances</text>
<text x="300" y="272" class="viz-value">zero</text>
<text x="420" y="272" class="viz-label-muted">a stale yes is a real loss</text>
<line x1="0" y1="284" x2="640" y2="284" class="viz-grid"/>
<text x="0" y="310" class="viz-label-muted">Every non-zero row can carry stale-if-error. The zero rows must fail, and say so.</text>
</svg>
<figcaption>Illustrative: budgets I would set for these route types; the values are judgements, and the point is that each route gets its own.</figcaption>
</figure>

The poles are easy. A static portfolio, a lawyer's site, a game studio's landing page: nothing on them changes in a way that a visitor during an outage would notice, and a budget of a day is conservative. Anyone who visited during the hour the origin was down saw exactly what they would have seen the day before, which is the whole site. At the other pole, a ticket scan-in endpoint has a budget of zero, because a stale answer to "has this ticket already been used" is a door held open for a duplicate, and the honest behaviour when the origin is down is to refuse and say why. An account balance is the same. Between the poles is where the decision lives, and it is a decision: a product listing can be an hour old because the checkout will check stock again, a pricing page can be ten minutes old but not a day because an old price shown is a price someone will expect to pay, a dashboard can be a minute old if it shows its own timestamp so that the reader knows.

## Three objections

The first objection is that stale data is wrong data, and a site should not knowingly serve wrong data. The budget is the answer, because it makes the wrongness bounded and explicit: a page at most ten minutes old is wrong in a way the product has agreed to, while an error page is wrong in a way nobody agreed to and that carries no information at all. The routes where any staleness is unacceptable get a budget of zero and are excluded, which is the objection taken seriously rather than dismissed.

The second is that the origin does not go down. It does, and not only in incidents. Deploys restart processes, certificates expire, a database failover takes the application with it for a minute, a dependency's outage becomes a 500 on every page that calls it. stale-if-error covers all of those, because it triggers on any error response or an unreachable origin, and a one-minute deploy blip on a site with a one-hour budget is invisible to visitors. Most CDNs expose the same idea under a product name, often something like serving stale on origin error, and the header is the portable way to ask for it.

The third is subtler: purging. A cache purge deletes the copy, and a deleted copy cannot be served stale, so a team that purges the whole cache on every deploy has removed its own safety net at the moment the origin is most likely to be restarting. The fix is to purge by key rather than wholesale, invalidating only the routes whose content changed, and to sequence deploys so that the purge happens after the new origin is healthy rather than before. The budget only protects a copy that still exists.

## Writing it down

The practice that follows is small. Every route in the site or the API gets a budget, in seconds, recorded next to its cache policy, and the budget is emitted as stale-if-error on that route's responses. Routes with a budget of zero get no directive and, ideally, an explicit error page that says the service is unavailable rather than a generic one. The budget list becomes the document that describes the site's outage tolerance, and it is the only such document most sites will ever have, because it is one line per route and it is enforced by the CDN rather than by a runbook.

The same number also settles the stale-while-revalidate question. If a route can tolerate being a minute old during an outage, it can tolerate being a minute old during a background refresh, so the latency directive gets the same value or a smaller one, and the two are set together. The web's numbers say that most sites set neither. The staleness budget is how you decide what to set, and once decided, it takes one header to make the CDN keep the lights on while you fix the origin.
