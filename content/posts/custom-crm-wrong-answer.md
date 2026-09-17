---
title: When a custom CRM is the wrong answer
date: 2026-09-17
summary: I build CRMs for a living. Most teams should not hire me. A custom CRM is justified by one missing verb, never by the price on the vendor's page.
tags: CRM, Build Vs Buy, Contract Work
draft: false
---

I build CRMs for a living, so this post is mostly an argument against hiring me. The unified CRM I built at CustomGlide exists because a small number of teams have a reason to own their customer system. Most of the people who ask me for one do not have that reason. They have a spreadsheet with a vendor's price on it, and the spreadsheet is answering the wrong question.

## Price is the wrong spreadsheet

The price is real and it is high. Salesforce's [Sales Cloud pricing page](https://www.salesforce.com/sales/pricing/) lists five editions in 2026: Starter Suite at 25 dollars per user per month, Pro Suite at 100, Enterprise at 175, Unlimited at 350, and Agentforce 1 Sales at 550, with everything above Starter billed annually. Zoho prices in rupees for Indian customers: [Zoho CRM's pricing](https://www.zoho.com/crm/zohocrm-pricing.html) runs 800, 1,400, 2,400 and 2,600 rupees per user per month on annual billing for Standard, Professional, Enterprise and Ultimate, before GST.

Put twenty seats on Salesforce Enterprise and the line reads 42,000 dollars a year. Against that, a build quote for a few months of engineering looks like a bargain, and the spreadsheet says build.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Salesforce Sales Cloud list price per user per month, 2026</title>
<desc id="f1-d">Horizontal bars in US dollars: Starter Suite 25, Pro Suite 100, Enterprise 175, Unlimited 350, Agentforce 1 Sales 550. Enterprise is highlighted as the edition most mid-sized teams compare against.</desc>
<text x="0" y="18" class="viz-title">Salesforce Sales Cloud list price</text>
<text x="0" y="36" class="viz-sub">US dollars per user per month, annual billing above Starter</text>
<line x1="160" y1="52" x2="160" y2="222" class="viz-axis"/>
<text x="150" y="73" text-anchor="end" class="viz-label">Starter Suite</text>
<path d="M160 58 H176 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H160 Z" class="viz-fgray"/>
<text x="188" y="73" class="viz-value">25</text>
<text x="150" y="107" text-anchor="end" class="viz-label">Pro Suite</text>
<path d="M160 92 H232 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H160 Z" class="viz-fgray"/>
<text x="244" y="107" class="viz-value">100</text>
<text x="150" y="141" text-anchor="end" class="viz-label">Enterprise</text>
<path d="M160 126 H288 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H160 Z" class="viz-f1"/>
<text x="300" y="141" class="viz-value">175</text>
<text x="150" y="175" text-anchor="end" class="viz-label">Unlimited</text>
<path d="M160 160 H416 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H160 Z" class="viz-fgray"/>
<text x="428" y="175" class="viz-value">350</text>
<text x="150" y="209" text-anchor="end" class="viz-label">Agentforce 1 Sales</text>
<path d="M160 194 H564 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H160 Z" class="viz-fgray"/>
<text x="580" y="209" class="viz-value">550</text>
</svg>
<figcaption>Source: <a href="https://www.salesforce.com/sales/pricing/">Salesforce Sales Cloud pricing</a>, list prices as published in September 2026.</figcaption>
</figure>

The spreadsheet is wrong because it compares a subscription with a project, and a custom CRM is not a project. It is a second product your company now owns, with its own migrations, security patches, exports, backups, and the one engineer who understands the schema. That ownership runs for as long as the sales team exists, and the sales team outlives every engineer. The subscription is expensive because it is priced to include the ownership you are trying to avoid.

There is a second thing the spreadsheet leaves out, which is everything the subscription includes that nobody thinks to list. A mobile app that works. Field-level permissions that have been audited by people whose job is auditing. An activity log that satisfies a compliance reviewer without a meeting. Two thousand integrations that already exist. Email deliverability someone else worries about. A team building a custom CRM rebuilds a thin version of each of these, one support ticket at a time, and none of that work is on the quote because none of it was in the original idea.

So the decision cannot rest on price. It has to rest on something the vendor cannot sell you, and there is exactly one such thing.

## Write down ten verbs

Here is the test I run before I quote anything. Write the ten verbs your team performs on a customer record in an ordinary week. Not the nouns, not the reports, the verbs.

For most teams the list reads: create, assign, move stage, log a call, send a sequence, attach a file, set a reminder, close won, close lost, report. Every vendor on the market has those verbs. They have had them for twenty years, and their implementation of each one is better tested than anything I will write in a quarter. A team whose list looks like that should buy, and should spend the engineering money on the integrations around the edges.

Now look for a verb the vendor cannot express without a workaround. Scan a visitor in at a gate and refuse the second scan. Hold funds in escrow until both sides confirm. Dispatch a field team and require a photo before the job closes. Recheck a compliance document every ninety days and block the deal while it is expired. These are verbs that touch revenue directly and that a stock CRM can only fake with a custom object, a flag field and a workflow rule nobody trusts. That verb is the reason to build, and it is the only reason.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The verb table for a visitor attraction</title>
<desc id="f2-d">Seven verbs listed with a filled square where a stock CRM covers the verb and an empty square where it does not. Book, issue, refund, assign, report and email are covered. Scan in and admit exactly once is not.</desc>
<text x="0" y="18" class="viz-title">Ten verbs, one gap</text>
<text x="0" y="36" class="viz-sub">A visitor attraction's weekly verbs against a stock CRM</text>
<text x="20" y="66" class="viz-tick">VERB</text>
<text x="420" y="66" class="viz-tick">STOCK CRM HAS IT</text>
<line x1="0" y1="74" x2="640" y2="74" class="viz-axis"/>
<text x="20" y="98" class="viz-label">Book a visit online</text>
<rect x="424" y="86" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="108" x2="640" y2="108" class="viz-grid"/>
<text x="20" y="132" class="viz-label">Issue a signed ticket</text>
<rect x="424" y="120" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="142" x2="640" y2="142" class="viz-grid"/>
<text x="20" y="166" class="viz-label">Scan in and admit exactly once</text>
<rect x="424" y="154" width="14" height="14" rx="3" class="viz-box"/>
<text x="446" y="166" class="viz-label-muted">the missing verb</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="20" y="200" class="viz-label">Refund a cancelled visit</text>
<rect x="424" y="188" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="210" x2="640" y2="210" class="viz-grid"/>
<text x="20" y="234" class="viz-label">Assign a group to a host</text>
<rect x="424" y="222" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="244" x2="640" y2="244" class="viz-grid"/>
<text x="20" y="268" class="viz-label">Report visits by hour and channel</text>
<rect x="424" y="256" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="278" x2="640" y2="278" class="viz-grid"/>
<text x="20" y="296" class="viz-label-muted">Email, log, remind: all covered, not shown</text>
</svg>
<figcaption>Illustrative: a worked example, not a survey of any client's process.</figcaption>
</figure>

Take the attraction in the table. Booking, issuing, refunding, assigning and reporting are ordinary CRM verbs. One verb is not: admit a visitor exactly once, at a gate, in under a second, and refuse every later scan of the same code. That verb is the business, because every failed refusal is a free entry. When I built the QR ticketing system it was this verb that needed real engineering, and it is a small, sharp piece of software. The rest of that attraction's customer data belongs in a system somebody else maintains.

## The four answers

Two questions sort every case I have seen. Does the vendor have all ten verbs, or is one missing. And does the team need to own the data model outright, for regulatory, contractual or integration reasons, or does it just want the data to be exportable. Each pair of answers has one honest response.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Build or buy, by verbs and ownership</title>
<desc id="f3-d">A two by two grid. Horizontal axis: does the vendor cover every verb, from all covered on the left to one missing on the right. Vertical axis: need to own the data model, low at the bottom and high at the top. Bottom left: buy. Bottom right: build the missing verb only. Top left: buy and integrate. Top right: build.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Buy, and integrate</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">own the copy, not the system</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Build</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">you are now the vendor</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Buy</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">most teams live here</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Build the missing verb only</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">a small system beside the CRM</text>
<circle cx="464" cy="256" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Vendor's verb coverage: all covered to one missing</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Need to own the data model: low to high</text>
</svg>
<figcaption>Illustrative: the four honest answers; the dot marks where the attraction in the verb table lands.</figcaption>
</figure>

The bottom-left quadrant is where most teams live, and the right answer there is to buy the cheapest edition that has the verbs and stop. The bottom-right quadrant is the attraction: buy the CRM, build the gate, and connect them with one integration that writes a scan event back to the contact. That is a fraction of a custom CRM and it keeps the sharp piece sharp.

The seam between the two systems is where that option succeeds or fails, so it deserves a rule of its own: the built system owns exactly one kind of record, and the CRM owns everything else. The gate owns tickets and scans. It never stores a customer's email, because the CRM already does, and it never decides who a customer is, because that is the CRM's verb. When a scan succeeds, the gate writes one activity back through the vendor's API, keyed by the CRM's own contact id, and that is the entire integration. Two systems that each own one kind of truth stay simple for years. Two systems that both keep a copy of the customer spend those years arguing. The top-left quadrant is a team with a contractual or regulatory need to hold its own copy of the data; it buys, exports on a schedule, and owns a warehouse rather than a CRM. Only the top-right quadrant builds, and it builds because a missing verb and an ownership requirement arrive together.

## What building actually buys

I should say what the top-right quadrant gets for its money, because it is real. A schema you can query directly. Exports that are never a support ticket. A stage history you can replay. Integrations that do not fight an API rate limit. A system that does one unusual thing well because it was designed around that thing.

The CRM I built lives in that quadrant for a specific reason: it is a migration target for teams leaving Salesforce, HubSpot and Zoho, and the thing those teams have in common is that they arrived with a verb the vendor had been faking for years. Usually it was a pipeline whose stages meant something the vendor's stage model could not hold, or a ticketing flow that had to share a contact with sales without a sync job. They did not leave because of the price. They left because the workaround had become the process, and the process was the business.

And the price, stated plainly: you are now the vendor. When the ticketing verb changes, you change it. When a browser drops an API your scanner used, you fix it. When the engineer who built the schema leaves, you hire someone to read it. That is a fair trade for a business whose revenue runs through a verb nobody sells. It is a bad trade for everyone else, and the way to know which you are is to write the ten verbs down before you write to me.
