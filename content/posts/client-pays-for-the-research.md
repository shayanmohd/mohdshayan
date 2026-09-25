---
title: The client pays for the research
date: 2026-04-08
summary: Contract work is not a distraction from the product if every contract is chosen for what it leaves behind. A rule for picking which paying work a small product company should take.
tags: Founding, Consulting, Product Strategy
topic: Founding & Impact
draft: false
---

CustomGlide exists because SocialSure needed to pay for itself. That is the honest version of the origin story, and I no longer think it needs a better one. The unified CRM and the QR ticketing system were contract work before they were products, built for clients who described what they needed and then checked that I had built it. What turned that work into a product line was not a pivot. It was a selection rule I did not have at the start and now apply to every engagement before I quote it.

## Two ledgers

Every contract gets entered twice. The first entry is cash: the fee, the payment schedule, the retention. The second entry is residue: what the work leaves in the product once the client has their deliverable. Residue comes in three forms. A component, which is a piece of software the product line will reuse. An integration, which is a working connection to a system the product line will meet again. Demand evidence, which is a paying customer who described a need precisely, paid to have it met, and used the result.

The rule is that a contract with a blank second entry is declined, however good the first entry looks. That sounds austere until you notice what it prevents. A small company that takes every well-paid job becomes an agency with a product on the side, and the product starves quietly, one reasonable decision at a time. A small company that refuses all contract work runs out of money before it learns what the product should be. The two-ledger test is the narrow path between those, and it is narrow on purpose.

## Why this is the default path in India

I would give the same advice anywhere, but in India it is less a preference than a description. Tracxn's [annual funding report for 2025](https://tracxn.com/d/insights/market-reports/india-tech-annual-funding-report-2025/__pvsyFahv-Ilo6lB2JbwcePNNWOdgWGMsVyntzEVDIn0) puts total funding into Indian tech at 10.5 billion dollars for the year, down from 12.7 billion in 2024 and 11.0 billion in 2023. The [2023 report](https://w.tracxn.com/report-releases/india-tech-annual-report-2023) had put 2022 at 25 billion, and described 2023 as the lowest year in five. Whatever the exact revisions between editions, the shape is the same: the 2021 to 2022 window closed, and it has not reopened.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Funding into Indian tech companies by year, billions of US dollars</title>
<desc id="f1-d">Four columns: 25.0 in 2022, 11.0 in 2023, 12.7 in 2024 and 10.5 in 2025. The 2022 column is highlighted as the last year of the previous window.</desc>
<text x="0" y="18" class="viz-title">Funding into Indian tech, by year</text>
<text x="0" y="36" class="viz-sub">Billions of US dollars, Tracxn annual reports</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M112 81 V77.5 a4 4 0 0 1 4 -4 H132 a4 4 0 0 1 4 4 V250 H112 Z" class="viz-f1"/>
<text x="124" y="67" text-anchor="middle" class="viz-value">25.0</text>
<text x="124" y="272" text-anchor="middle" class="viz-label-muted">2022</text>
<path d="M248 175.7 V172.2 a4 4 0 0 1 4 -4 H268 a4 4 0 0 1 4 4 V250 H248 Z" class="viz-fgray"/>
<text x="260" y="161.6" text-anchor="middle" class="viz-value">11.0</text>
<text x="260" y="272" text-anchor="middle" class="viz-label-muted">2023</text>
<path d="M384 164.3 V160.8 a4 4 0 0 1 4 -4 H404 a4 4 0 0 1 4 4 V250 H384 Z" class="viz-fgray"/>
<text x="396" y="150.2" text-anchor="middle" class="viz-value">12.7</text>
<text x="396" y="272" text-anchor="middle" class="viz-label-muted">2024</text>
<path d="M520 179.1 V175.6 a4 4 0 0 1 4 -4 H540 a4 4 0 0 1 4 4 V250 H520 Z" class="viz-fgray"/>
<text x="532" y="165" text-anchor="middle" class="viz-value">10.5</text>
<text x="532" y="272" text-anchor="middle" class="viz-label-muted">2025</text>
</svg>
<figcaption>Source: <a href="https://tracxn.com/d/insights/market-reports/india-tech-annual-funding-report-2025/__pvsyFahv-Ilo6lB2JbwcePNNWOdgWGMsVyntzEVDIn0">Tracxn, India Tech Annual Funding Report 2025</a> for 2023 to 2025; <a href="https://w.tracxn.com/report-releases/india-tech-annual-report-2023">Tracxn's 2023 report</a> for 2022. Tracxn revises earlier years as late deals are recorded.</figcaption>
</figure>

For an engineer-founder without a fundraising story, that chart says the product will be paid for by customers or not at all, and the earliest customers who will pay are the ones who need something specific built. So the question is not whether to take contract work. It is which contract work, and the answer has to be about residue, because cash alone will keep you alive without moving you anywhere.

## The three residues, in practice

A component is the easiest to recognise and the easiest to overvalue. The ticket-validation service inside the QR system is a component: a small piece that admits a visitor exactly once and can sit beside any booking flow. It was built for one client's gates and it is now the reason the product exists. But a component only counts if it is general enough to be reused without a rewrite and specific enough to be worth reusing. A client's custom report is not a component. A rate limiter that every future API will need is.

An integration is a connector to a system the product line will meet again, and it is worth more than it looks because the second time you meet the system, the work is already paid for. A CRM that is a migration target for teams leaving Salesforce, HubSpot and Zoho lives or dies by its importers, and every importer was, at some point, one client's migration. The client paid for the first version. The product got the connector.

Demand evidence is the residue people forget to count, and it is the one that would cost the most to buy any other way. A paying client is the only user who will tell you exactly what they need, pay to have it built, and then check, in production, that it does what they said. Every feature in a product roadmap that came from a paying client has passed a test that survey answers and pilot signups never pass. When I weigh a contract, a client who can describe a verb precisely is worth more than a client who pays more.

## The four cells

Two questions sort every proposal: is the cash good, and is the residue real. Each pair of answers has its own response.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The two-ledger test as a grid</title>
<desc id="f2-d">A two by two grid. Horizontal axis: residue in the product, from none on the left to real on the right. Vertical axis: cash, low at the bottom and high at the top. Top right: accept. Top left: re-scope so the deliverable becomes a component or integration, and decline if it cannot. Bottom right: accept if the calendar allows, as paid research. Bottom left: decline.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Re-scope, or decline</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">good money for a blank second ledger</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Accept</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">the client pays for the research</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Decline</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">nothing on either ledger</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Accept if the calendar allows</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">cheap research, paid for by someone</text>
<circle cx="464" cy="80" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Residue in the product: none to real</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Cash: low to high</text>
</svg>
<figcaption>Illustrative: the four responses; the dot marks the only cell where a small product company should spend most of its contract hours.</figcaption>
</figure>

The top-left cell is the dangerous one, because it is where the best-paying work usually sits. A large client wants something bespoke that nothing else will ever use, and the fee is excellent. The response there is to re-scope before declining: can the deliverable be built as a general component with a thin custom layer, can the integration be written against the vendor's public API rather than the client's private one, can the contract include the right to reuse what is built. Often it can, and the client rarely minds, because they are buying an outcome, not exclusivity. When it cannot, the money is still declined, and that is the moment the rule is either real or decorative.

## The pattern is older than the word startup

None of this is new. [Mailchimp](https://en.wikipedia.org/wiki/Mailchimp) began in 2001 as a side project of the Rocket Science Group, a web design agency in Atlanta, and outgrew the agency. [Basecamp](https://en.wikipedia.org/wiki/Basecamp_%28company%29) was built inside 37signals, a design consultancy, to manage the consultancy's own client projects, launched in 2004, and the company eventually renamed itself after the product. [Trello](https://en.wikipedia.org/wiki/Trello) was built at Fog Creek Software, launched in 2011, spun out as its own company in 2014, and was bought by Atlassian in 2017. Three agencies, three products that each began as residue from paid work.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Agency work that became a product</title>
<desc id="f3-d">A timeline with five events: 2001 Mailchimp starts inside Rocket Science Group; 2004 Basecamp launches inside 37signals; 2011 Trello launches inside Fog Creek; 2014 Trello spins out and 37signals renames itself Basecamp; 2017 Atlassian acquires Trello.</desc>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="60" cy="90" r="6" class="viz-d1"/>
<text x="60" y="64" text-anchor="middle" class="viz-tick">2001</text>
<text x="60" y="46" text-anchor="middle" class="viz-label">Mailchimp</text>
<circle cx="180" cy="90" r="6" class="viz-d1"/>
<text x="180" y="124" text-anchor="middle" class="viz-tick">2004</text>
<text x="180" y="142" text-anchor="middle" class="viz-label">Basecamp</text>
<circle cx="340" cy="90" r="6" class="viz-d1"/>
<text x="340" y="64" text-anchor="middle" class="viz-tick">2011</text>
<text x="340" y="46" text-anchor="middle" class="viz-label">Trello launches</text>
<circle cx="460" cy="90" r="6" class="viz-dgray"/>
<text x="460" y="124" text-anchor="middle" class="viz-tick">2014</text>
<text x="460" y="142" text-anchor="middle" class="viz-label">Trello spins out</text>
<circle cx="580" cy="90" r="6" class="viz-dgray"/>
<text x="580" y="64" text-anchor="middle" class="viz-tick">2017</text>
<text x="580" y="46" text-anchor="middle" class="viz-label">Atlassian buys it</text>
</svg>
<figcaption>Source: company histories on Wikipedia for <a href="https://en.wikipedia.org/wiki/Mailchimp">Mailchimp</a>, <a href="https://en.wikipedia.org/wiki/Basecamp_%28company%29">Basecamp</a> and <a href="https://en.wikipedia.org/wiki/Trello">Trello</a>.</figcaption>
</figure>

What those three have in common is not luck. In each case the agency built something for its own paid work or a client's, noticed that the residue was more valuable than the fee, and had the discipline to keep the residue general. That last part is the whole skill. Basecamp was useful to other consultancies because it was built for the general problem of managing client projects, not for one client's project. The fee for the client work paid the salaries while the general thing was being noticed, which is the only role cash plays in this story.

## The limit of the rule

Residue that nobody consumes is just code. A component with no product line waiting for it is a library you maintain for free, and an integration to a system you never meet again is a connector that rots. So the second ledger needs one more column: who consumes this, and when. If I cannot name the product line that will use the residue within a year, the entry is blank, whatever the engineering elegance of the thing. That is the correction that keeps the test honest, and it is the one I most often need.

The rule, then, in full. Enter every contract twice, decline the ones with a blank second entry, re-scope the well-paid ones until the entry fills in, and name the consumer of every residue before you count it. The client pays for the research. Your job is to make sure the research is about something you were going to build anyway.
