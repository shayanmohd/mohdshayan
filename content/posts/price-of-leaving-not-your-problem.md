---
title: The price of leaving is not your problem
date: 2026-09-18
summary: The EU Data Act bans cloud switching charges from January 2027, and the big providers already waive exit egress. For a small SaaS the exit bill never mattered; serving does.
tags: Cloud Cost, Egress, EU Data Act
draft: false
---

The cloud exit fee is dying, and the obituaries are being written by people it never affected. The EU's Data Act makes switching charges illegal from January 2027, the large providers have already agreed to waive egress for customers who leave, and the commentary treats this as the end of lock-in. For a large enterprise with petabytes in one region it might be. For the kind of software I build and run, dashboards, ticketing analytics, a CRM, the exit bill was never the problem, because those systems store little and serve constantly. The bill that matters is serving egress, the bytes sent to users every month, and the law does not touch that, and at the large providers' [list prices](https://aws.amazon.com/s3/pricing/) it dwarfs a one-off exit within a year.

## What the law actually bans

[Regulation 2023/2854](https://eur-lex.europa.eu/eli/reg/2023/2854/oj), the Data Act, applies from 12 September 2025, and its Article 29 phases out switching charges: providers may keep charging reduced charges until 12 January 2027, after which they may not impose switching charges at all. A switching charge is a fee for moving to another provider, and the regulation is careful to treat it as distinct from ordinary data egress charges, the fees for sending bytes out of the provider's network in the course of using the service. The ban is on the first. The second is the one every product pays every month.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">EU Data Act timeline for cloud switching</title>
<desc id="f1-d">A timeline with three points: the regulation applies from 12 September 2025; reduced switching charges are permitted during a transition; switching charges are abolished from 12 January 2027. A note says serving egress is outside the regulation's ban throughout.</desc>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="120" cy="90" r="6" class="viz-d1"/>
<text x="120" y="64" text-anchor="middle" class="viz-tick">12 Sept 2025</text>
<text x="120" y="46" text-anchor="middle" class="viz-label">Data Act applies</text>
<rect x="120" y="84" width="400" height="12" class="viz-band"/>
<text x="320" y="124" text-anchor="middle" class="viz-tick">transition: reduced switching charges permitted</text>
<circle cx="520" cy="90" r="6" class="viz-d1"/>
<text x="520" y="64" text-anchor="middle" class="viz-tick">12 Jan 2027</text>
<text x="520" y="46" text-anchor="middle" class="viz-label">switching charges banned</text>
<text x="320" y="156" text-anchor="middle" class="viz-label-muted">Serving egress, the monthly bytes to users, is outside the ban throughout.</text>
</svg>
<figcaption>Source: Regulation (EU) 2023/2854, the <a href="https://eur-lex.europa.eu/eli/reg/2023/2854/oj">Data Act</a>, Article 29 and its application date.</figcaption>
</figure>

The providers moved ahead of the law. Since 2024 the three largest have offered free egress to customers migrating away, subject to notice and a full departure, so for most accounts the exit invoice was already zero before the regulation required it. That is worth having. It is also worth noticing what it costs them, which is almost nothing, because customers leave once and serve every day.

## Two egress bills

Every product has two egress bills and they are not the same size. The exit bill is what it would cost to move everything you store to another provider once: your total stored bytes, multiplied by the per-gigabyte transfer price, paid on the day you leave. The serving bill is what it costs to send bytes to your users in the ordinary course of business: every dashboard load, every report download, every image and export, multiplied by the same per-gigabyte price, paid every month. The Data Act and the waivers cover the first. The second is untouched, and for most small software it is the larger of the two by a wide margin.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The two egress bills, and which the Data Act and provider waivers cover</title>
<desc id="f2-d">Two boxes. Left, the exit bill: total stored bytes times the transfer price, paid once, covered by the Data Act ban from 2027 and by provider waivers today. Right, the serving bill: monthly bytes sent to users times the transfer price, paid every month, covered by nothing. An arrow labels the serving bill as the one a small SaaS actually pays.</desc>
<text x="0" y="18" class="viz-title">One bill is regulated. The other is the one you pay.</text>
<rect x="8" y="50" width="300" height="150" rx="8" class="viz-box"/>
<text x="158" y="76" text-anchor="middle" class="viz-label">Exit bill</text>
<text x="158" y="100" text-anchor="middle" class="viz-label-muted">stored bytes times transfer price</text>
<text x="158" y="120" text-anchor="middle" class="viz-label-muted">paid once, on leaving</text>
<text x="158" y="150" text-anchor="middle" class="viz-tick">covered: Data Act from 2027</text>
<text x="158" y="180" text-anchor="middle" class="viz-tick">for a small SaaS: small, and now free</text>
<rect x="332" y="50" width="300" height="150" rx="8" class="viz-box-accent"/>
<text x="482" y="76" text-anchor="middle" class="viz-label">Serving bill</text>
<text x="482" y="100" text-anchor="middle" class="viz-label-muted">bytes to users times transfer price</text>
<text x="482" y="120" text-anchor="middle" class="viz-label-muted">paid every month</text>
<text x="482" y="150" text-anchor="middle" class="viz-tick">covered: nothing</text>
<text x="482" y="180" text-anchor="middle" class="viz-tick">for a small SaaS: the whole egress line</text>
<text x="320" y="240" text-anchor="middle" class="viz-label-muted">Their ratio is a property of the product, and it decides which price to shop on.</text>
</svg>
<figcaption>Illustrative: the two bills as a pair; the regulation's scope is the left box.</figcaption>
</figure>

## The serving-to-leaving ratio

The number that says which bill you should care about is what I call the serving-to-leaving ratio: monthly bytes served to users divided by total bytes stored. A product that stores 500 gigabytes and serves 100 gigabytes a month has a ratio of 0.2, and for it the exit bill is five months of serving; the waivers and the law matter. A product that stores 50 gigabytes and serves 500 a month has a ratio of 10, and for it the exit bill is three days of serving; the law is irrelevant, and the only egress price that matters is the monthly one. Above a ratio of one, your serving bill exceeds your worst-case exit bill every single month.

Dashboards, ticketing analytics and CRMs sit firmly in the second group. They hold rows, not videos; a year of a small business's records is megabytes, while the reports, exports and page loads that read those records are served hundreds of times a day. That is the profile of the products I build, and it is why the celebration of the exit-fee ban has passed me by. The storage decision for that profile should be made on serving egress price, and that is exactly where the large providers and the smaller ones diverge.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Cost to serve one terabyte a month for a year against a one-off ten-terabyte exit, by provider, at list prices</title>
<desc id="f3-d">Grouped horizontal bars in US dollars. AWS S3: serving 1 TB a month for a year at 0.09 dollars per gigabyte, about 1,106; a 10 TB exit at the same price, about 922, or zero under the migration waiver. Cloudflare R2: serving zero, exit zero, egress is free. Backblaze B2: serving zero for a 1 TB store because egress up to three times storage is free; a 10 TB exit about 72 dollars at 0.01 per gigabyte beyond the free allowance.</desc>
<text x="0" y="18" class="viz-title">At the large providers, one year of serving costs more than leaving ever did</text>
<text x="0" y="36" class="viz-sub">List prices; a year of serving 1 TB a month against a 10 TB exit</text>
<rect x="400" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="418" y="37" class="viz-label-muted">serving, a year</text>
<rect x="530" y="26" width="12" height="12" rx="3" class="viz-fgray"/><text x="548" y="37" class="viz-label-muted">exit, once</text>
<line x1="156" y1="52" x2="156" y2="240" class="viz-axis"/>
<text x="146" y="75" text-anchor="end" class="viz-label">AWS S3</text>
<path d="M156 60 H598 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H156 Z" class="viz-f1"/><text x="594" y="55" text-anchor="end" class="viz-value">1,106</text>
<path d="M156 80 H525 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H156 Z" class="viz-fgray"/><text x="539" y="92" class="viz-value">922, or 0</text>
<text x="146" y="139" text-anchor="end" class="viz-label">Cloudflare R2</text>
<rect x="156" y="124" width="3" height="12" class="viz-f1"/><text x="170" y="136" class="viz-value">0</text>
<rect x="156" y="144" width="3" height="12" class="viz-fgray"/><text x="170" y="156" class="viz-value">0</text>
<text x="146" y="203" text-anchor="end" class="viz-label">Backblaze B2</text>
<rect x="156" y="188" width="3" height="12" class="viz-f1"/><text x="170" y="200" class="viz-value">0, within three times storage</text>
<path d="M156 208 H185 a4 4 0 0 1 4 4 V220 a4 4 0 0 1 -4 4 H156 Z" class="viz-fgray"/><text x="199" y="220" class="viz-value">72</text>
<text x="0" y="266" class="viz-label-muted">Four tenths of a pixel per dollar; storage per GB-month: S3 0.023, R2 0.015, B2 0.007.</text>
<text x="0" y="290" class="viz-tick">the B2 serving figure assumes the 1 TB served is within three times the volume stored</text>
</svg>
<figcaption>Source: computed from the <a href="https://aws.amazon.com/s3/pricing/">AWS S3 pricing page</a> (0.09 dollars per GB out to the internet after the first 100 GB a month), the <a href="https://developers.cloudflare.com/r2/pricing/">Cloudflare R2 pricing page</a> (no egress fees) and the <a href="https://www.backblaze.com/cloud-storage/pricing">Backblaze B2 pricing page</a> (egress free to three times monthly storage, then 0.01 per GB), read on 18 September 2026.</figcaption>
</figure>

The chart's arithmetic is short. Serving a terabyte a month from S3 at nine cents a gigabyte is about 92 dollars a month and about 1,106 a year, against a ten-terabyte exit at the same rate of about 922, which the migration waiver makes zero. On R2 both bills are zero, because the product charges for storage and operations and not for bytes out. On B2 the serving is free within three times the stored volume and the exit costs about 72 dollars beyond the free allowance. For the high-ratio product, the difference between providers is not the exit bill, which is now roughly zero everywhere. It is a thousand dollars a year per terabyte served, and that figure scales with users rather than with data.

The storage prices in the chart's footnote matter less than they look, and that is the second thing the ratio reveals. S3 Standard charges about 2.3 cents per gigabyte-month, R2 1.5 cents and B2 under a cent, so for a product storing 50 gigabytes the whole storage line is between a few cents and a dollar a month at any of them. The providers differ by a factor of three on storage and by a factor of infinity on serving, since two of the three charge nothing for it, and for a high-ratio product the second factor is the entire bill. That is why the decision should be made on serving price: it is the only line where the choice of provider changes the number by more than the price of a coffee.

## Compare your own two bills

The practical instruction is to compute the ratio before reading any more commentary on the Data Act. Take last month's egress from the bill, divide it by the total stored, and look at the number. Below one, the exit bill matters and the law and waivers are real money; the stored data is the asset, and the storage price and exit terms are what to shop on. Above one, the exit bill is noise and the serving price is the decision; a provider that charges nothing to serve is worth a migration on that alone, and the Data Act's contribution is that the migration itself is now free.

There is a caveat that keeps this honest. Serving from a store with free egress is not the same as serving from a store with free egress and no cache in front of it; a content delivery network changes what "bytes served from storage" means, and a product with a good cache hit rate serves most of its bytes from the edge rather than from the bucket. The ratio should be computed on the bytes that actually leave the storage provider, which the bill reports directly. But the shape of the conclusion survives the caveat: for a product that reads its data far more often than it moves it, the price of leaving was never the problem, and the price of staying is on every invoice.
