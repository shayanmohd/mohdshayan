---
title: What breaks when you leave Salesforce
date: 2026-04-03
summary: Migration cost is about references, not rows. Contacts export cleanly. What breaks is the graph, and you can measure how much will break in an afternoon, before you quote.
tags: CRM Migration, Data Modelling, Salesforce
topic: Product & Enterprise
draft: false
---

The first question a team asks about leaving a CRM is how many records they have, and the number they give is the least useful number in the project. The CRM I built at CustomGlide is a migration target for teams leaving Salesforce, HubSpot and Zoho, so I have spent a fair amount of time on the receiving end of exports. Row counts predict almost nothing. Contacts export cleanly, in every system, every time. What breaks is the graph: the references from one record to another that only mean something inside the source. The migration's cost is the cost of those references, and it can be measured on a trial export before anyone quotes anything.

## Rows export, references break

A CRM export is a set of tables that point at each other. A deal points at an account and an owner. An activity points at a contact and at the deal it belonged to. A contact points at the campaign that created it, the user who created it, and a dozen picklist values that were valid on the day it was saved. Every one of those pointers is an identifier that the source system minted and the target system has never seen.

Some resolve. The account the deal points at is in the accounts table, so the pointer can be rewritten to the new id. Many do not. The owner left the company two years ago and was deactivated, so the user record is missing from the export or present without a login. The deal the activity belonged to was deleted, so the activity points at nothing. The picklist value "Proposal sent (old)" was retired in a cleanup and exists only as a string in fifteen thousand records. The campaign id belongs to a marketing tool that was integrated, then replaced, and its records were never in the CRM at all.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The reference graph of a CRM export, with the edges that fail</title>
<desc id="f1-d">Six boxes: contact, account, deal, activity, user and campaign. Solid arrows show references that resolve: contact to account, deal to account, deal to contact. Highlighted arrows show references that fail: deal to a user who has left, activity to a deleted deal, contact to a campaign that lives in a retired tool, and a picklist value that no longer exists.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker><marker id="f1-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-f4"/></marker></defs>
<rect x="20" y="40" width="130" height="44" rx="8" class="viz-box"/><text x="85" y="67" text-anchor="middle" class="viz-label">Contact</text>
<rect x="255" y="40" width="130" height="44" rx="8" class="viz-box"/><text x="320" y="67" text-anchor="middle" class="viz-label">Account</text>
<rect x="490" y="40" width="130" height="44" rx="8" class="viz-box"/><text x="555" y="67" text-anchor="middle" class="viz-label">Campaign</text>
<rect x="20" y="180" width="130" height="44" rx="8" class="viz-box"/><text x="85" y="207" text-anchor="middle" class="viz-label">Activity</text>
<rect x="255" y="180" width="130" height="44" rx="8" class="viz-box"/><text x="320" y="207" text-anchor="middle" class="viz-label">Deal</text>
<rect x="490" y="180" width="130" height="44" rx="8" class="viz-box"/><text x="555" y="207" text-anchor="middle" class="viz-label">User (owner)</text>
<line x1="152" y1="62" x2="245" y2="62" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="320" y1="178" x2="320" y2="94" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="253" y1="196" x2="152" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="387" y1="202" x2="480" y2="202" class="viz-s4" marker-end="url(#f1-bad)"/>
<text x="433" y="192" text-anchor="middle" class="viz-tick">owner left</text>
<line x1="152" y1="202" x2="245" y2="202" class="viz-s4" marker-end="url(#f1-bad)"/>
<text x="198" y="192" text-anchor="middle" class="viz-tick">deal deleted</text>
<line x1="152" y1="50" x2="480" y2="50" class="viz-s4" marker-end="url(#f1-bad)"/>
<text x="433" y="40" text-anchor="middle" class="viz-tick">tool retired</text>
<line x1="320" y1="226" x2="320" y2="262" class="viz-s4"/>
<text x="320" y="282" text-anchor="middle" class="viz-tick">picklist value "Proposal sent (old)" no longer exists</text>
<line x1="20" y1="136" x2="34" y2="136" class="viz-arrow"/><text x="40" y="140" class="viz-label-muted">reference resolves</text>
<line x1="20" y1="158" x2="34" y2="158" class="viz-s4"/><text x="40" y="162" class="viz-label-muted">reference fails</text>
</svg>
<figcaption>Illustrative: the shape of a typical export, not any client's data.</figcaption>
</figure>

None of this shows up in a row count. A hundred thousand contacts with clean references migrate in a day. Ten thousand deals whose owners, stages and activities all point into the past can take a month of decisions, because every unresolved reference is a question: drop it, remap it, or invent a placeholder that someone will have to explain later.

## The orphan ratio

The measurement I run before quoting is what I call the orphan ratio. Take a trial export of everything the team wants to keep, load it into a scratch copy of the target model, attempt to resolve every reference, and count the records that have at least one reference which fails to resolve: an owner, an account, a parent, a campaign, a created-by, a picklist value. Divide by the total number of records. That fraction is the orphan ratio, and it predicts effort far better than volume does.

Every orphan then gets one of three treatments, and the proposal should say which classes get which. Reassign, when a live substitute exists: a departed owner becomes a named successor or a house user, and the record keeps its history. Archive with a tombstone, when the parent is gone but the child still carries information: the activity that pointed at a deleted deal keeps a note saying so, in a field the team can filter on, rather than being silently attached to nothing. Invent a placeholder only as a last resort, and only when the team has agreed to explain it later, because placeholders are the migration's debt and every one of them is a question someone will ask in a report six months on.

It takes an afternoon, and most of the afternoon is the export, not the counting. The resolution step is a handful of joins. The output is a table by object type and by reference field, which is more useful than the single ratio, because it says where the orphans are. Owners who left are usually the largest group and the easiest to fix, with one rule: reassign to a named successor or to a house account. Deleted parents are the next largest and the hardest, because the record still carries information and the thing it was about is gone. Retired picklist values are numerous and cheap once someone decides what the old value maps to.

## Getting the data out is the easy part

People expect the export itself to be the bottleneck, and it rarely is. HubSpot, for example, raised its [API limits in September 2024](https://developers.hubspot.com/changelog/increasing-our-api-limits) to 650,000 requests per day on Professional and 1 million on Enterprise, with a burst limit of 190 requests per 10 seconds for private apps, and its [usage guidelines](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines) spell out how the two limits interact. Paging at 100 records per request, the burst limit is the binding one, and it works out to under nine minutes per million records.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Time to page records out of HubSpot at the burst limit</title>
<desc id="f2-d">Three columns in minutes: about 9 minutes for one million records, 44 for five million and 88 for ten million, at 100 records per request and 190 requests per 10 seconds.</desc>
<text x="0" y="18" class="viz-title">Paging out is minutes, not days</text>
<text x="0" y="36" class="viz-sub">Minutes at 100 records per request and 190 requests per 10 seconds</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M195.3 233.3 V229.8 a4 4 0 0 1 4 -4 H215.3 a4 4 0 0 1 4 4 V250 H195.3 Z" class="viz-f1"/>
<text x="207.3" y="219.2" text-anchor="middle" class="viz-value">8.8</text>
<text x="207.3" y="272" text-anchor="middle" class="viz-label-muted">1 million records</text>
<path d="M316 165.5 V162 a4 4 0 0 1 4 -4 H336 a4 4 0 0 1 4 4 V250 H316 Z" class="viz-f1"/>
<text x="328" y="151.4" text-anchor="middle" class="viz-value">43.9</text>
<text x="328" y="272" text-anchor="middle" class="viz-label-muted">5 million</text>
<path d="M436.7 81 V77.5 a4 4 0 0 1 4 -4 H456.7 a4 4 0 0 1 4 4 V250 H436.7 Z" class="viz-f1"/>
<text x="448.7" y="67" text-anchor="middle" class="viz-value">87.7</text>
<text x="448.7" y="272" text-anchor="middle" class="viz-label-muted">10 million</text>
</svg>
<figcaption>Source: computed from the limits in <a href="https://developers.hubspot.com/changelog/increasing-our-api-limits">HubSpot's API limits changelog</a>; the daily cap of 650,000 or 1 million requests is not the binding constraint at these volumes.</figcaption>
</figure>

The chart is there to kill the wrong worry. Nobody's migration is slow because the API is slow. It is slow because of what happens after the records land, and the orphan ratio is the measurement of that.

## Where the hours go

Once the export is on disk, the work sorts into five kinds, and the reference work dominates. Resolving references is the bulk: deciding rules for each orphan class, applying them, and checking the result against what the sales team remembers. Field mapping is next: the source has forty custom fields on a contact and the target has a data model, so each field is either mapped, promoted to a proper entity, or dropped with the team's agreement. Picklist reconciliation is cheap per value and expensive in total, because there are hundreds of values and each needs an owner to say what it meant. Validation is the reconciliation of counts and sums before and after, so that the team trusts the result. The transfer itself, the part everyone worried about, is the smallest.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Where the hours of a CRM migration go</title>
<desc id="f3-d">Horizontal bars as a share of effort: resolving references 45 percent, field mapping 20, picklist reconciliation 15, validation 10, transfer 10. Resolving references is highlighted.</desc>
<text x="0" y="18" class="viz-title">Where the hours go</text>
<text x="0" y="36" class="viz-sub">Share of migration effort, an illustrative split</text>
<line x1="176" y1="52" x2="176" y2="222" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Resolving references</text>
<path d="M176 58 H564 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="580" y="73" class="viz-value">45%</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Field mapping</text>
<path d="M176 92 H346.2 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="362.2" y="107" class="viz-value">20%</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Picklist reconciliation</text>
<path d="M176 126 H302.7 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="318.7" y="141" class="viz-value">15%</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Validation</text>
<path d="M176 160 H259.1 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="275.1" y="175" class="viz-value">10%</text>
<text x="166" y="209" text-anchor="end" class="viz-label">Transfer</text>
<path d="M176 194 H259.1 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="275.1" y="209" class="viz-value">10%</text>
</svg>
<figcaption>Illustrative: a split drawn from the shape of the work described in this post, not a measurement of any engagement.</figcaption>
</figure>

## How to quote from the ratio

The orphan ratio turns a guess into a range. A trial export with a ratio under a few percent, concentrated in departed owners, is a migration that will run on rules: write the reassignment rule, apply it, move on. A ratio in the tens of percent, spread across deleted parents and retired values, is a migration that will run on meetings, because each class of orphan needs a decision from someone who remembers what the data meant. The quote should say which kind it is, and it should say so before the price, because the price follows from it.

Two more things the trial export teaches, both worth writing into the proposal. First, which records the team is willing to leave behind. Activities older than a certain date, deals lost before a certain year, and contacts with no activity in years are often the largest source of orphans and the least valuable to migrate, and a team that has seen the ratio by object type will usually agree to an archive rather than a migration for them. Second, what the target model is missing. If a whole class of records has nowhere to land, the trial export finds it on the first afternoon rather than in the final week.

## The rule

Never quote a migration from a row count. Export a trial, resolve every reference, count the orphans by object and by field, and quote from that table. The graph is the job. The rows were never the problem.
