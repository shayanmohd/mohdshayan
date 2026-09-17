---
title: The backflow ratio finds your fake stages
date: 2026-09-17
summary: A pipeline stage should record a fact proven about a deal. When deals keep moving backwards out of a stage, it was recording a mood, and the proof is in a table every CRM keeps.
tags: CRM, Sales Pipelines, Data Modelling
draft: false
---

Every sales pipeline has a stage nobody believes in. The deals enter it, sit for a while, and then move backwards to the stage before, or forwards on a date that has nothing to do with the customer. Ask the team what the stage means and you get three answers. The stage is still there because removing it feels like admitting the process was wrong, and because nobody has a number that says it is. There is such a number, and the CRM already has the data to compute it.

## A stage is a proven fact

A pipeline stage should mean that something has been proven about the deal. "Qualified" means someone confirmed the budget and the authority. "Proposal sent" means a document left the building. "Negotiation" means the customer replied with terms. If moving a deal into a stage requires no evidence, the stage is a mood: how the rep feels about the deal this week. Moods change, and when they do the deal moves backwards.

The vendors' defaults are not the problem, and they are worth looking at because they show how many stages a pipeline needs. HubSpot's [default deal pipeline](https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines) has seven stages, five open and two closed, each with a win probability attached. Salesforce's default opportunity stages, as described in guides such as [Salesforce Ben's](https://www.salesforceben.com/complete-guide-tutorial-to-salesforce-opportunity-stages/), run to ten, from Prospecting through Perception Analysis to the two closed states. Zoho's [deal stages](https://help.zoho.com/portal/en/kb/crm/sales-force-automation/deal-management/articles/create-deals) are system-defined and cover a similar arc. Every one of them is customisable, which is where the trouble starts, because a team customises by adding.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Default stage counts in three CRMs</title>
<desc id="f1-d">Three columns: Salesforce with ten default opportunity stages, HubSpot with seven default deal stages, Zoho with nine default deal stages. Closed states are included in each count.</desc>
<text x="0" y="18" class="viz-title">Out of the box, including closed states</text>
<text x="0" y="36" class="viz-sub">Default pipeline stages per vendor, 2026 documentation</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M148.7 60 V56 a4 4 0 0 1 4 -4 H168.7 a4 4 0 0 1 4 4 V250 H148.7 Z" class="viz-f1"/>
<text x="160.7" y="44" text-anchor="middle" class="viz-value">10</text>
<text x="160.7" y="272" text-anchor="middle" class="viz-label-muted">Salesforce</text>
<path d="M316 118.8 V114.8 a4 4 0 0 1 4 -4 H336 a4 4 0 0 1 4 4 V250 H316 Z" class="viz-f1"/>
<text x="328" y="102.8" text-anchor="middle" class="viz-value">7</text>
<text x="328" y="272" text-anchor="middle" class="viz-label-muted">HubSpot</text>
<path d="M483.3 79.6 V75.6 a4 4 0 0 1 4 -4 H503.3 a4 4 0 0 1 4 4 V250 H483.3 Z" class="viz-f1"/>
<text x="495.3" y="63.6" text-anchor="middle" class="viz-value">9</text>
<text x="495.3" y="272" text-anchor="middle" class="viz-label-muted">Zoho</text>
</svg>
<figcaption>Source: <a href="https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines">HubSpot's pipeline documentation</a>, <a href="https://www.salesforceben.com/complete-guide-tutorial-to-salesforce-opportunity-stages/">Salesforce Ben's guide to the default opportunity stages</a>, and <a href="https://help.zoho.com/portal/en/kb/crm/sales-force-automation/deal-management/articles/create-deals">Zoho CRM's deal documentation</a>.</figcaption>
</figure>

## The ratio

Every CRM records stage transitions, because it has to, to draw the history on the deal. Almost none of them show the transitions in aggregate. The unified CRM I built stores every transition as a row: deal, from stage, to stage, timestamp, actor. From that table one number falls out per stage, and I call it the backflow ratio: of all the departures from a stage in the last ninety days, the share that went to an earlier stage rather than forward or to closed.

```sql
SELECT from_stage,
       AVG(CASE WHEN to_rank < from_rank THEN 1 ELSE 0 END) AS backflow_ratio,
       COUNT(*) AS departures
FROM stage_transitions
WHERE moved_at > now() - interval '90 days'
GROUP BY from_stage;
```

A stage with a ratio near zero is a fact: once proven, it stays proven. A stage above roughly 0.2 is a status flag wearing a stage's clothes: a fifth of the deals that leave it go backwards, which means entering it never required evidence in the first place. A pipeline whose stages all sit under 0.1 is one the team actually believes, and it is usually shorter than the one they started with.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A six-stage pipeline with one stage leaking backwards</title>
<desc id="f2-d">Six boxes in a row: Lead, Qualified, Demo done, Proposal sent, Negotiation, Closed. Forward arrows connect each to the next. A thick highlighted arrow runs backwards from Proposal sent to Demo done, labelled with a backflow ratio of 0.31, while the other stages show ratios under 0.1.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker><marker id="f2-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-f4"/></marker></defs>
<text x="0" y="18" class="viz-title">Where the deals go backwards</text>
<text x="0" y="36" class="viz-sub">Backflow ratio per stage over ninety days, an illustrative pipeline</text>
<line x1="440" y1="56" x2="454" y2="56" class="viz-arrow"/><text x="460" y="60" class="viz-label-muted">forward</text>
<line x1="540" y1="56" x2="554" y2="56" class="viz-s4"/><text x="560" y="60" class="viz-label-muted">backwards</text>
<rect x="8" y="80" width="92" height="48" rx="8" class="viz-box"/><text x="54" y="109" text-anchor="middle" class="viz-label">Lead</text>
<rect x="116" y="80" width="92" height="48" rx="8" class="viz-box"/><text x="162" y="109" text-anchor="middle" class="viz-label">Qualified</text>
<rect x="224" y="80" width="92" height="48" rx="8" class="viz-box"/><text x="270" y="109" text-anchor="middle" class="viz-label">Demo done</text>
<rect x="332" y="80" width="92" height="48" rx="8" class="viz-box-accent"/><text x="378" y="103" text-anchor="middle" class="viz-label">Proposal</text><text x="378" y="119" text-anchor="middle" class="viz-label">sent</text>
<rect x="440" y="80" width="92" height="48" rx="8" class="viz-box"/><text x="486" y="109" text-anchor="middle" class="viz-label">Negotiation</text>
<rect x="548" y="80" width="84" height="48" rx="8" class="viz-box-ink"/><text x="590" y="109" text-anchor="middle" class="viz-on-ink">Closed</text>
<line x1="102" y1="104" x2="112" y2="104" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="210" y1="104" x2="220" y2="104" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="318" y1="104" x2="328" y2="104" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="426" y1="104" x2="436" y2="104" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="534" y1="104" x2="544" y2="104" class="viz-arrow" marker-end="url(#f2-ah)"/>
<path d="M378 132 V160 H270 V134" class="viz-s4" marker-end="url(#f2-bad)"/>
<text x="324" y="180" text-anchor="middle" class="viz-value">0.31 of departures go back</text>
<text x="54" y="220" text-anchor="middle" class="viz-tick">0.04</text>
<text x="162" y="220" text-anchor="middle" class="viz-tick">0.06</text>
<text x="270" y="220" text-anchor="middle" class="viz-tick">0.05</text>
<text x="378" y="220" text-anchor="middle" class="viz-tick">0.31</text>
<text x="486" y="220" text-anchor="middle" class="viz-tick">0.08</text>
<text x="590" y="220" text-anchor="middle" class="viz-tick">0.00</text>
<text x="320" y="248" text-anchor="middle" class="viz-label-muted">backflow ratio under each stage; one of them is not a fact</text>
</svg>
<figcaption>Illustrative: a pipeline drawn to show the shape of the ratio, not any client's data.</figcaption>
</figure>

## Why "Proposal sent" leaks

The example stage is the usual culprit, and the reason is instructive. Sending a proposal is an action the rep takes, not a fact about the customer. The rep sends it, moves the deal forward, and then the customer asks for a second demo, or goes quiet, or turns out not to have been qualified after all. The rep moves the deal back, because the stage no longer describes it. The stage was recording the rep's activity, and activity is a field on the deal with a timestamp, not a place in a sequence.

That is the demotion the ratio points at. A leaky stage becomes a boolean with a date: proposal_sent_at. The pipeline loses a stage and gets shorter, the report that used to ask how many deals are in Proposal Sent now asks how many deals have a proposal date in the last month, and both questions have better answers than before, because the second one cannot be undone by a mood.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Demoting a leaky stage to a field</title>
<desc id="f3-d">Before: six stages in a row including Proposal sent. After: five stages in a row, with Proposal sent removed, and a field on the deal record labelled proposal_sent_at with a timestamp. The stage count drops by one and the fact survives as a date.</desc>
<text x="0" y="18" class="viz-title">Same fact, better home</text>
<text x="0" y="48" class="viz-tick">BEFORE: six stages</text>
<rect x="0" y="58" width="96" height="36" rx="6" class="viz-box"/><text x="48" y="81" text-anchor="middle" class="viz-label-muted">Lead</text>
<rect x="106" y="58" width="96" height="36" rx="6" class="viz-box"/><text x="154" y="81" text-anchor="middle" class="viz-label-muted">Qualified</text>
<rect x="212" y="58" width="96" height="36" rx="6" class="viz-box"/><text x="260" y="81" text-anchor="middle" class="viz-label-muted">Demo done</text>
<rect x="318" y="58" width="110" height="36" rx="6" class="viz-box-accent"/><text x="373" y="81" text-anchor="middle" class="viz-label-muted">Proposal sent</text>
<rect x="438" y="58" width="96" height="36" rx="6" class="viz-box"/><text x="486" y="81" text-anchor="middle" class="viz-label-muted">Negotiation</text>
<rect x="544" y="58" width="96" height="36" rx="6" class="viz-box"/><text x="592" y="81" text-anchor="middle" class="viz-label-muted">Closed</text>
<text x="0" y="132" class="viz-tick">AFTER: five stages and one field</text>
<rect x="0" y="142" width="96" height="36" rx="6" class="viz-box"/><text x="48" y="165" text-anchor="middle" class="viz-label-muted">Lead</text>
<rect x="106" y="142" width="96" height="36" rx="6" class="viz-box"/><text x="154" y="165" text-anchor="middle" class="viz-label-muted">Qualified</text>
<rect x="212" y="142" width="96" height="36" rx="6" class="viz-box"/><text x="260" y="165" text-anchor="middle" class="viz-label-muted">Demo done</text>
<rect x="318" y="142" width="96" height="36" rx="6" class="viz-box"/><text x="366" y="165" text-anchor="middle" class="viz-label-muted">Negotiation</text>
<rect x="424" y="142" width="96" height="36" rx="6" class="viz-box"/><text x="472" y="165" text-anchor="middle" class="viz-label-muted">Closed</text>
<rect x="530" y="142" width="110" height="36" rx="6" class="viz-box-ink"/><text x="585" y="160" text-anchor="middle" class="viz-on-ink">proposal_sent_at</text><text x="585" y="174" text-anchor="middle" class="viz-on-ink">2026-09-12 14:02</text>
<text x="0" y="214" class="viz-label-muted">The field cannot be moved backwards. It can only be set, and the date is the evidence.</text>
</svg>
<figcaption>Illustrative: the demotion the backflow ratio recommends for a stage that records an action rather than a fact.</figcaption>
</figure>

## Backflow is not loss

One distinction keeps the ratio honest. A deal that moves from Negotiation to Closed Lost has not moved backwards; it has moved to a terminal state, and the ratio counts it as a forward departure. Losing deals late is a sales problem worth its own report, but it is not evidence that Negotiation was a mood. Backflow is specifically a move to an earlier open stage, which is the system saying that a fact it recorded turned out not to be one. Conflating the two inflates the ratio on the late stages and hides the real leak, which is usually in the middle of the pipeline where actions masquerade as facts.

The 0.2 line is a working rule rather than a law. Below it, one departure in five or fewer goes backwards, which is the level of churn a stage with genuine entry criteria produces from ordinary mistakes and corrections. Above it, more than one in five, the stage's meaning is being revised by the people who use it, and the revision is the data. Teams with strict pipelines sit well under 0.1 everywhere; the first time I computed the ratio on a pipeline that had grown by accretion, three of its nine stages were over 0.25, and the team recognised all three by name before I showed them the numbers.

## Running it on your own pipeline

The query needs a transitions table with a rank per stage, and every major CRM exposes one under some name: a stage history object, a property history, an audit log of the stage field. Export it, attach the rank from the pipeline's stage order, and the query above runs in a spreadsheet if it has to. The only care needed is with pipelines that were reordered during the window, because a stage that moved from third to fifth makes old transitions look like backflow they were not. Compute within the period of the current order, or rank by the order in force at the time of each move.

## What the ratio does not say

A high ratio is a symptom with more than one cause, and the query only finds the symptom. Sometimes the stage is fine and the process is not: deals go backwards from Negotiation because reps move deals forward to hit a weekly target and the manager moves them back on Monday. The ratio flags Negotiation, and the fix is a conversation, not a schema change. Sometimes a low ratio is hiding a problem: a stage nobody moves deals out of at all has a ratio of zero and a departure count of zero, and the second number is the one to read. The query returns both for a reason.

The ratio also needs a window. Ninety days is long enough to include a few hundred departures in most pipelines and short enough that the process being measured is the current one. A ratio computed over three years measures three years of process changes at once and says nothing about any of them.

## What this changed in the CRM

Two things. The transition table went from a private detail behind the deal history to a first-class report, with the ratio per stage on the pipeline settings page next to the button that adds a stage. And the pipeline editor got one question that appears when a stage is created: what has to be true about the deal for it to enter this stage. A blank answer is allowed, but it is shown next to the ratio a quarter later, and the two together usually settle the argument that the stage should have been a field.

The number the team was missing was in their own database the whole time. Every CRM keeps the transitions; the report that reads them is a single GROUP BY.
