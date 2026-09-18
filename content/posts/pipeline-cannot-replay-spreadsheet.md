---
title: A pipeline you cannot replay is a spreadsheet
date: 2026-09-18
summary: The real product of a CRM is the history of state changes. If it cannot show the pipeline exactly as it stood at nine last Monday, every historical report is a reconstruction.
tags: Data Modelling, CRM, Databases
draft: false
---

Ask a CRM a simple question: what did the pipeline look like at nine o'clock last Monday. Not what it looks like now with a date filter, which is a different question with a different answer. What was in each stage, at that moment, before the week's moves. Most systems cannot answer, and the ones that cannot are, whatever their price, a spreadsheet with a login screen. The current state is stored; the history that produced it is not, or is kept for a while and then thrown away. When I designed the pipeline model for the CRM at CustomGlide, this was the question I built around, and the design that answers it is older than any CRM.

## The Monday replay test

The test is one query. Pick any past instant and ask the system for the pipeline as it was. A system that passes has a transition log as its source of truth: every change of stage, owner, amount or status is a row with a timestamp, and the current state of a deal is derived from its rows. A system that fails has a mutable deal record whose stage column was overwritten, with maybe a history table on the side that was never the source of anything.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">A mutable deal row against a transition log</title>
<desc id="f1-d">On the left, a single deal row whose stage column has been overwritten: it reads Negotiation and nothing else is known. On the right, a transition log for the same deal with five rows, each with a timestamp, from Lead through Qualified, Demo done, Proposal sent and Negotiation. A query that filters the log to rows at or before a chosen instant and takes the latest reconstructs the state at that instant.</desc>
<text x="0" y="18" class="viz-title">One remembers; the other only knows</text>
<text x="0" y="36" class="viz-sub">The same deal, stored two ways</text>
<rect x="8" y="56" width="280" height="90" rx="8" class="viz-box"/>
<text x="24" y="82" class="viz-label">deals</text>
<text x="24" y="106" class="viz-value">id 4471   stage Negotiation</text>
<text x="24" y="128" class="viz-label-muted">what was it last Monday: unknown</text>
<rect x="352" y="56" width="280" height="200" rx="8" class="viz-box-accent"/>
<text x="368" y="82" class="viz-label">stage_transitions</text>
<text x="368" y="106" class="viz-value">4471  Lead           08-21 10:12</text>
<text x="368" y="126" class="viz-value">4471  Qualified      08-28 15:40</text>
<text x="368" y="146" class="viz-value">4471  Demo done      09-04 11:05</text>
<text x="368" y="166" class="viz-value">4471  Proposal sent  09-12 14:02</text>
<text x="368" y="186" class="viz-value">4471  Negotiation    09-16 09:30</text>
<line x1="368" y1="196" x2="616" y2="196" class="viz-grid"/>
<text x="368" y="220" class="viz-label-muted">as of Monday 09-15 09:00: the latest</text>
<text x="368" y="240" class="viz-label-muted">row at or before it, so Proposal sent</text>
<text x="8" y="180" class="viz-label-muted">The left is the state.</text>
<text x="8" y="200" class="viz-label-muted">The right is the state and every</text>
<text x="8" y="220" class="viz-label-muted">state it has ever been, with the</text>
<text x="8" y="240" class="viz-label-muted">current row derived, not stored.</text>
</svg>
<figcaption>Illustrative: the two storage shapes; the dates are made up for the drawing.</figcaption>
</figure>

The replay query is short, and it is the same query for every report that asks about the past.

```sql
SELECT DISTINCT ON (deal_id) deal_id, to_stage AS stage
FROM stage_transitions
WHERE moved_at <= '2026-09-15 09:00+05:30'
ORDER BY deal_id, moved_at DESC;
```

Group that by stage and you have the pipeline as it stood. Run it for the previous Monday too and you have the week's net movement, exactly, rather than as a reconstruction from whatever the current rows happen to say about their created and modified dates.

## Why the current row is not enough

The reason this matters is not archival tidiness. It is that most of the questions a sales team asks are questions about change, and change is not visible in a snapshot. How much of this quarter's forecast was already in the pipeline at the start of the quarter. Which deals moved backwards last month. How long do deals spend in Negotiation before they close, and has that got longer. Whether the manager's Monday view was right, now that the month has closed. Every one of those is a query over transitions, and every one is a guess if the transitions were not kept.

The disputes are worse than the reports. A rep says the deal was in Proposal Sent when the target was set; the manager remembers otherwise; the system shows Negotiation and a modified-date. Without the log, the argument is settled by seniority. With the log, it is settled by a row.

## What the vendors keep

The major CRMs do keep history, and how much they keep is instructive, because each of them treats it as a feature with a limit rather than as the source of truth. Salesforce's standard [field history tracking](https://help.salesforce.com/s/articleView?id=000383595&language=en_US&type=1) retains changes for up to 18 months in the interface and 24 through the API, and the paid [Field Audit Trail](https://help.salesforce.com/s/articleView?id=xcloud.field_audit_trail.htm&language=en_US) add-on extends that to as long as ten years. HubSpot's [property history](https://knowledge.hubspot.com/properties/export-property-history) is capped by revisions rather than time, at 45 for contact properties and 20 for deal, company and ticket properties, and deleting a property deletes its history. Zoho CRM's [audit log](https://help.zoho.com/portal/en/kb/crm/faqs/audit-log) is kept for three years and then permanently deleted.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">How long three CRMs keep a field's history</title>
<desc id="f2-d">Horizontal bars in months: Salesforce standard field history 18, Zoho audit log 36, Salesforce Field Audit Trail up to 120. HubSpot is shown as a note because its limit is 20 revisions per deal property rather than a time.</desc>
<text x="0" y="18" class="viz-title">History as a feature with a limit</text>
<text x="0" y="36" class="viz-sub">Months of retained history, by product and plan</text>
<line x1="224" y1="52" x2="224" y2="154" class="viz-axis"/>
<text x="214" y="73" text-anchor="end" class="viz-label">Salesforce, standard</text>
<path d="M224 58 H275 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H224 Z" class="viz-fgray"/>
<text x="291" y="73" class="viz-value">18</text>
<text x="214" y="107" text-anchor="end" class="viz-label">Zoho, audit log</text>
<path d="M224 92 H330 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H224 Z" class="viz-fgray"/>
<text x="346" y="107" class="viz-value">36</text>
<text x="214" y="141" text-anchor="end" class="viz-label">Salesforce, Field Audit Trail</text>
<path d="M224 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H224 Z" class="viz-f1"/>
<text x="580" y="141" class="viz-value">120</text>
<text x="0" y="186" class="viz-label-muted">HubSpot keeps the last 20 revisions of a deal property, however long they span,</text>
<text x="0" y="206" class="viz-label-muted">and 45 of a contact property; a deleted property takes its history with it.</text>
<text x="0" y="236" class="viz-tick">an add-on, a cap, and a three-year clock: none of them is the source of truth</text>
</svg>
<figcaption>Source: <a href="https://help.salesforce.com/s/articleView?id=000383595&language=en_US&type=1">Salesforce field history retention</a>, <a href="https://help.salesforce.com/s/articleView?id=xcloud.field_audit_trail.htm&language=en_US">Field Audit Trail</a>, <a href="https://knowledge.hubspot.com/properties/export-property-history">HubSpot property history</a> and <a href="https://help.zoho.com/portal/en/kb/crm/faqs/audit-log">Zoho CRM audit log</a> documentation, September 2026.</figcaption>
</figure>

None of that is a criticism of the products. Keeping history as a bounded side table is a reasonable engineering choice for a system whose current state is the product. It is a statement about what the product is. A CRM that stores the state and remembers some of the history is a system of record for the present. A CRM that stores the history and derives the state is a system of record for the business, and the difference shows up the first time someone asks about last Monday.

## What "as of" makes possible

Once the log is the source of truth, a class of reports that were previously impossible become ordinary, and they are the reports a sales leader actually wants. Pipeline coverage at the start of a period against bookings at its end, which is the only honest way to judge a forecast. Stage duration distributions computed from the actual entry and exit times of every deal, rather than from a "days in stage" field that resets when someone edits the record. Backflow, the share of departures from a stage that go backwards, which is the subject of [another post](/blog/backflow-ratio-fake-stages/) and is a single query over the same table. A cohort view that follows the deals created in one month through every stage they visited afterwards.

None of these needs a data warehouse or an export. They need the table that a mutable design threw away, kept, and a timestamp parameter on the query. The reporting layer of the CRM shrank when the log arrived, because most of what it had been doing was reconstructing history from clues.

## The append-only ledger, without the vocabulary

The pattern has a name in software architecture and a body of writing behind it, and I have avoided the name on purpose, because the name makes it sound like a rewrite. It is not. It is one table, appended to on every change, and one derived view of the latest row per deal. The rest of the application reads the view exactly as it read the old mutable row. The dashboards, the forecasts, the stage reports all become queries over the log with a timestamp parameter that defaults to now.

The cost that people expect, storage, is small. A deal that passes through six stages produces six rows. A pipeline of a hundred thousand deals with a dozen transitions each is a million or so rows of a few columns, which is a small table by any modern database's standard. The growth is linear in activity, and activity is the thing the business wants more of.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Rows in the transition table against deals in the pipeline</title>
<desc id="f3-d">Three lines over deal counts from ten thousand to one million, on log axes, for an average of six, twelve and twenty-four transitions per deal. At a million deals with twelve transitions each the table holds twelve million rows. The growth is linear and the scale is modest for a relational database.</desc>
<text x="0" y="18" class="viz-title">The storage cost is linear and small</text>
<text x="0" y="36" class="viz-sub">Transition rows, log scale; a model with stated assumptions</text>
<line x1="360" y1="31" x2="374" y2="31" class="viz-s1"/><text x="380" y="35" class="viz-label-muted">12 per deal</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">24</text>
<line x1="540" y1="31" x2="554" y2="31" class="viz-sgray"/><text x="560" y="35" class="viz-label-muted">6</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100M</text>
<line x1="56" y1="125.3" x2="600" y2="125.3" class="viz-grid"/><text x="48" y="129.3" text-anchor="end" class="viz-tick">10M</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-grid"/><text x="48" y="198.7" text-anchor="end" class="viz-tick">1M</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">100k</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">10k</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">100k</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">1M</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Deals in the pipeline, log scale</text>
<polyline points="56,240.4 328,171 600,101.6" class="viz-sgray"/>
<polyline points="56,219.5 328,150.1 600,80.7" class="viz-s1"/>
<polyline points="56,198.6 328,129.2 600,59.8" class="viz-s2"/>
<circle cx="600" cy="80.7" r="4" class="viz-d1"/>
<text x="606" y="85" class="viz-value">12M</text>
</svg>
<figcaption>Illustrative: rows equal deals times transitions per deal, plotted for three assumed averages; a row here is a handful of columns, so twelve million of them is a modest table.</figcaption>
</figure>

## What it changed

Three things, in the CRM. Every dashboard gained an "as of" parameter, which by default is now and can be any instant, and the forecast page compares the pipeline as it was at the start of the quarter with the pipeline now, from the same query with two timestamps. The stage report that used to be a nightly job that nobody trusted became a view that is correct at any moment because it is computed from the log at that moment. And the argument about last Monday stopped happening, because the system could answer it.

The test is worth running against any system that calls itself a system of record. Pick a Monday. Ask for nine o'clock. If the answer is a reconstruction, a best guess from modified dates and a side table with a retention limit, the system knows the present and has opinions about the past. If the answer is a query, it remembers. A pipeline you cannot replay was never a pipeline. It was a spreadsheet with a stage column, and the stage column has been overwritten.
