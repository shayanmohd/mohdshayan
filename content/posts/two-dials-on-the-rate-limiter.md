---
title: Two dials on the rate limiter
date: 2026-09-15
summary: A per-tenant limit stops tenants hurting each other; a per-principal limit stops one bug hurting you. They come from different numbers, and one dial with one number gives neither.
tags: Rate Limiting, API Design, Multi-tenant SaaS
topic: Backend Architecture
draft: false
---

Most rate limiters in multi-tenant software are one middleware with one number, and the number was chosen by someone who had to pick something. It is usually described as protecting the platform, which it does, badly, and as being fair to tenants, which it is not. The reason is that a rate limit is two protections wearing one hat. A per-tenant limit exists so that tenants cannot hurt each other. A per-principal limit, per user or per API key, exists so that one runaway client cannot hurt you. Those are set from different numbers, derived from different facts about the system, and putting both behind a single dial means the dial is wrong for at least one of them at every setting.

## What the public limits are made of

Every large API publishes its limits, and reading them side by side shows the two dials in the open. GitHub's [REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) allows an authenticated user 5,000 requests an hour, 60 unauthenticated, and 15,000 an hour for Enterprise Cloud, with a separate secondary limit of no more than 100 concurrent requests, 900 points a minute per endpoint, and 90 seconds of CPU per 60 seconds of real time. Stripe's [global limit](https://docs.stripe.com/rate-limits) is 100 requests a second per account in live mode, 25 in a sandbox, with 25 a second on individual endpoints and separate concurrency limits. Shopify's [GraphQL Admin API](https://shopify.dev/docs/api/usage/limits) meters query cost in points from a leaky bucket that refills at 100 points a second on standard plans and 1,000 on Plus. Slack's [Web API](https://docs.slack.dev/apis/web-api/rate-limits) tiers its methods at one, twenty, fifty or a hundred-plus calls a minute, with a special rule that a message may be posted about once a second per channel.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Published rate limits of four public APIs, converted to requests per second</title>
<desc id="f1-d">Horizontal bars on a logarithmic scale of requests per second: Stripe live mode, 100; Stripe per endpoint, 25; GitHub Enterprise Cloud, 15,000 an hour, about 4.2; Slack tier 4, 100 a minute, about 1.7; GitHub authenticated, 5,000 an hour, about 1.4; Slack tier 1, one a minute, about 0.017. Shopify is noted separately because it meters points rather than requests.</desc>
<text x="0" y="18" class="viz-title">Four vendors, four different answers to a different question each</text>
<text x="0" y="36" class="viz-sub">Published limit converted to requests per second, log scale from 0.01 to 100</text>
<line x1="216" y1="52" x2="216" y2="256" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">Stripe, live, per account</text>
<path d="M216 58 H600 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="596" y="53" text-anchor="end" class="viz-value">100 a second</text>
<text x="206" y="107" text-anchor="end" class="viz-label">Stripe, per endpoint</text>
<path d="M216 92 H542 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="562" y="107" class="viz-value">25</text>
<text x="206" y="141" text-anchor="end" class="viz-label">GitHub, Enterprise Cloud</text>
<path d="M216 126 H466 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="486" y="141" class="viz-value">4.2, from 15k an hour</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Slack, tier 4</text>
<path d="M216 160 H427 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="447" y="175" class="viz-value">1.7, from 100 a minute</text>
<text x="206" y="209" text-anchor="end" class="viz-label">GitHub, authenticated user</text>
<path d="M216 194 H420 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="440" y="209" class="viz-value">1.4, from 5,000 an hour</text>
<text x="206" y="243" text-anchor="end" class="viz-label">Slack, tier 1</text>
<path d="M216 228 H236 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="256" y="243" class="viz-value">0.017, from one a minute</text>
<rect x="0" y="274" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="285" class="viz-label-muted">keyed by account: the tenant dial</text>
<rect x="260" y="274" width="12" height="12" rx="3" class="viz-f2"/><text x="278" y="285" class="viz-label-muted">keyed by user, token or method: the principal dial</text>
</svg>
<figcaption>Source: the rate-limit documentation of <a href="https://docs.stripe.com/rate-limits">Stripe</a>, <a href="https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api">GitHub</a> and <a href="https://docs.slack.dev/apis/web-api/rate-limits">Slack</a>, September 2026; Shopify's point-based limits are omitted because they do not convert to requests.</figcaption>
</figure>

Read closely, the vendors are not disagreeing about the right number. They are answering different questions. Stripe's 100 a second is keyed by account, which is the tenant: it is a share of Stripe's capacity that one customer may consume. GitHub's 5,000 an hour is keyed by user or token, which is the principal: it is the rate at which one client may reasonably act, and the secondary limits on concurrency and CPU are the platform protecting itself from one badly written integration regardless of who owns it. Slack's tiers are per method, a third axis, set by how expensive each call is to serve. None of these vendors has one number, and the reason is that no single number answers both questions.

## The two numbers, and where they come from

The per-tenant number comes from capacity. If the platform can serve a certain number of requests a second at the latency it promises, and a certain number of tenants are active at once, then capacity divided by active tenants is the rate every tenant can be guaranteed when everyone is busy at the same time. I call that the fairness floor. It is the number that goes in the contract, because it is the one the platform can honour under full saturation, and it is computed from two facts the platform knows about itself: what it can serve and how many are being served.

The per-tenant ceiling, the limit actually enforced, sits above the floor by exactly the burst the platform can absorb. Most tenants are idle most of the time, so the capacity not being used by idle tenants is available to busy ones, and the ceiling lets a busy tenant use it. But the ceiling is not a promise; it is an opportunity, and the difference between ceiling and floor is what shrinks when many tenants are busy at once. Contracts that quote the ceiling are contracts that break on the busiest day of the year.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">An edge limiter keyed by tenant in front of an application limiter keyed by principal, with the source of each number</title>
<desc id="f2-d">A flow from left to right. Requests enter an edge limiter keyed by tenant, whose number comes from capacity divided by active tenants plus absorbable burst. They then reach an application limiter keyed by user or API key, whose number comes from the fastest legitimate client. Then the application. Two callouts show the number sources.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Two limiters, two keys, two sources for the number</text>
<rect x="8" y="100" width="100" height="56" rx="8" class="viz-box"/>
<text x="58" y="124" text-anchor="middle" class="viz-label">Requests</text>
<text x="58" y="142" text-anchor="middle" class="viz-label-muted">all tenants</text>
<line x1="110" y1="128" x2="140" y2="128" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="144" y="90" width="170" height="76" rx="8" class="viz-box-accent"/>
<text x="229" y="114" text-anchor="middle" class="viz-label">Edge limiter</text>
<text x="229" y="132" text-anchor="middle" class="viz-label-muted">keyed by tenant</text>
<text x="229" y="150" text-anchor="middle" class="viz-tick">tenant against tenant</text>
<line x1="316" y1="128" x2="346" y2="128" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="350" y="90" width="170" height="76" rx="8" class="viz-box-accent"/>
<text x="435" y="114" text-anchor="middle" class="viz-label">Application limiter</text>
<text x="435" y="132" text-anchor="middle" class="viz-label-muted">keyed by user or key</text>
<text x="435" y="150" text-anchor="middle" class="viz-tick">contains one client's bug</text>
<line x1="522" y1="128" x2="552" y2="128" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="556" y="100" width="76" height="56" rx="8" class="viz-box-ink"/>
<text x="594" y="132" text-anchor="middle" class="viz-on-ink">App</text>
<text x="229" y="200" text-anchor="middle" class="viz-label">capacity divided by active tenants</text>
<text x="229" y="218" text-anchor="middle" class="viz-label-muted">plus the burst you can absorb</text>
<text x="229" y="236" text-anchor="middle" class="viz-tick">the floor is the contract</text>
<text x="435" y="200" text-anchor="middle" class="viz-label">the fastest legitimate client</text>
<text x="435" y="218" text-anchor="middle" class="viz-label-muted">measured, with headroom</text>
<text x="435" y="236" text-anchor="middle" class="viz-tick">a bug outruns any user</text>
<text x="320" y="278" text-anchor="middle" class="viz-label-muted">One middleware with one number is one of these two, mislabelled as both.</text>
</svg>
<figcaption>Illustrative: the layering as I build it; the edge limiter is the one the contract references, the application limiter is the one that catches the retry loop.</figcaption>
</figure>

The per-principal number comes from a different fact entirely: how fast the fastest legitimate client actually goes. A person clicking through a dashboard makes a request every few seconds. A well-written integration syncing records makes a handful a second. A retry loop with no backoff makes hundreds. The per-principal limit is set just above the legitimate maximum, measured rather than guessed, and its job is to stop the retry loop, the runaway script, the integration that fetches a list on every keystroke, before the damage reaches the tenant limit and gets billed to every other user of the same tenant. It has nothing to do with capacity. A platform with infinite capacity would still want it, because the bug is also costing the tenant money and filling their audit log.

## Why one dial fails both ways

Set the single number from capacity and it is far above any legitimate client's rate, so the retry loop runs freely until it exhausts the tenant's share, at which point every user in that tenant is locked out by one colleague's bug. Set it from the fastest client and it is far below what a large tenant with many users legitimately needs in aggregate, so the tenant hits it during normal operation and the platform's answer is to raise it, which moves the number away from the client rate and back toward the first failure. Teams that have one dial oscillate between these two settings for years, and every incident review proposes moving it.

## The algorithm is the smaller decision

The choice between a token bucket and a sliding window matters less than the choice of keys and numbers, but it is worth one figure, because the two respond differently to the same burst. A token bucket lets a client spend saved-up capacity in a burst up to the bucket size and then holds it to the refill rate; a sliding window counts requests over a trailing interval and rejects once the count is reached, with no notion of saved capacity. For the tenant dial the bucket is right, because burst is precisely what the ceiling above the floor is for. For the principal dial the window is often better, because a client that has been idle for an hour and then fires a thousand requests in a second is more likely to be a bug than a legitimate burst, and the window rejects it while a large bucket would wave it through.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Token bucket and sliding window responding to the same burst</title>
<desc id="f3-d">Two lines over time showing requests admitted per second during a burst. The token bucket line rises to the burst rate for a short interval, draining saved tokens, then falls to the refill rate. The sliding window line rises only to the window's rate and stays flat, rejecting the excess from the start. A shaded band marks the burst.</desc>
<text x="0" y="18" class="viz-title">Same burst, two shapes of admission</text>
<text x="0" y="36" class="viz-sub">Requests admitted per second during a burst; illustrative</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">token bucket</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s2"/><text x="520" y="35" class="viz-label-muted">sliding window</text>
<rect x="220" y="52" width="160" height="212" class="viz-band"/>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">burst</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">limit</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<polyline points="56,230 220,230 222,70 280,70 300,160 380,160 382,230 600,230" class="viz-s1"/>
<polyline points="56,230 220,230 222,160 380,160 382,230 600,230" class="viz-s2"/>
<text x="300" y="282" text-anchor="middle" class="viz-tick">burst begins and ends at the band</text>
<text x="450" y="110" class="viz-label-muted">bucket: spends, then holds</text>
<text x="450" y="128" class="viz-label-muted">window: holds throughout</text>
</svg>
<figcaption>Illustrative: the two algorithms' admission curves for one burst; the shapes are the point, not the values.</figcaption>
</figure>

## The floor goes in the contract

On the platform I run, the practical output of this is two limiters and one document. The edge limiter is keyed by tenant, with a ceiling set from capacity and a floor computed from capacity divided by active tenants, and the floor is the number written into the service description, because it is the one that holds when everyone is busy. The application limiter is keyed by user and by API key, set from measured client rates with headroom, and its rejections are logged with the principal, because a principal hitting it is a bug report with a name attached. The two are tuned separately, by different people, from different dashboards, and neither one is ever described as "the rate limit".

The document is the part most teams skip. It states the floor, the ceiling, and the per-principal limit, and it says which is a promise and which is a courtesy. A tenant reading it knows what they are guaranteed and what they might get; an engineer reading it knows which dial an incident is about. That is what two dials buy: not a better number, but the ability to say which question a number is answering.
