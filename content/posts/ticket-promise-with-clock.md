---
title: A ticket is a promise with a clock
date: 2026-09-17
summary: Most SLA breaches are accounting failures: a clock paused by the wrong party, never resumed, or two running on one ticket. Give each state one clock and one actor who can stop it.
tags: Ticketing, Service Desk, State Machines
draft: false
---

A service-level agreement on a ticket is a promise with a clock attached: we will respond within four hours, resolve within two days. When the promise is broken, the post-mortem almost always finds that nobody was slow. The clock was paused by an agent's internal note and never resumed, or it kept running through a weekend the contract excluded, or two clocks were running on the same ticket because a reassignment started a second one. The breach was an accounting failure, and accounting failures come from modelling the ticket as a record with a status field and a nightly job that tries to reconstruct what the clocks should have done. The fix is to model the ticket as a state machine in which every state carries exactly one clock and names exactly one actor who can stop it.

## The one-pause rule

The rule that makes the design work is small enough to state in one sentence: every SLA clock has exactly one party whose action can pause it, and that party is never the one being measured. The response clock measures the agent, so an agent's action cannot pause it. Writing an internal note, reassigning the ticket, changing its priority, none of those stop the clock, because they are things the measured party does. What stops the response clock is a customer reply, because the ticket is now waiting on the customer, or a scheduled callback that the customer agreed to, because the promise has been renegotiated with the person it was made to. The resolution clock has the same shape with a longer horizon.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Ticket state machine with one clock and one pausing actor per state</title>
<desc id="f1-d">Six states: new, awaiting agent, awaiting customer, scheduled, resolved, closed. New and awaiting agent run the response or resolution clock and only a customer action or an agreed schedule can leave them. Awaiting customer pauses the clock; a customer reply leaves it. Scheduled pauses until the agreed time. Resolved runs a reopen window; closed has no clock.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Each state: one clock, one actor who can stop it</text>
<rect x="8" y="50" width="150" height="64" rx="8" class="viz-box-accent"/>
<text x="83" y="74" text-anchor="middle" class="viz-label">New</text>
<text x="83" y="92" text-anchor="middle" class="viz-label-muted">response clock runs</text>
<line x1="160" y1="82" x2="188" y2="82" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="192" y="50" width="150" height="64" rx="8" class="viz-box-accent"/>
<text x="267" y="74" text-anchor="middle" class="viz-label">Awaiting agent</text>
<text x="267" y="92" text-anchor="middle" class="viz-label-muted">resolution clock runs</text>
<line x1="344" y1="82" x2="372" y2="82" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="376" y="50" width="150" height="64" rx="8" class="viz-box"/>
<text x="451" y="74" text-anchor="middle" class="viz-label">Awaiting customer</text>
<text x="451" y="92" text-anchor="middle" class="viz-label-muted">paused; customer resumes</text>
<path d="M451 116 V150 H267 V118" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="359" y="142" text-anchor="middle" class="viz-tick">customer reply</text>
<rect x="192" y="180" width="150" height="64" rx="8" class="viz-box"/>
<text x="267" y="204" text-anchor="middle" class="viz-label">Scheduled</text>
<text x="267" y="222" text-anchor="middle" class="viz-label-muted">paused until agreed time</text>
<line x1="267" y1="178" x2="267" y2="164" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="376" y="180" width="150" height="64" rx="8" class="viz-box"/>
<text x="451" y="204" text-anchor="middle" class="viz-label">Resolved</text>
<text x="451" y="222" text-anchor="middle" class="viz-label-muted">reopen window runs</text>
<rect x="544" y="180" width="88" height="64" rx="8" class="viz-box-ink"/>
<text x="588" y="204" text-anchor="middle" class="viz-on-ink">Closed</text>
<text x="588" y="222" text-anchor="middle" class="viz-on-ink">no clock</text>
<line x1="528" y1="212" x2="540" y2="212" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="286" text-anchor="middle" class="viz-label-muted">Gold states measure the agent; no agent action can move them to a paused state.</text>
<text x="320" y="316" text-anchor="middle" class="viz-tick">an internal note, a reassignment or a priority change does not stop any clock</text>
</svg>
<figcaption>Illustrative: the state machine behind a ticketing module of the kind I built; transitions not drawn (reopen, cancel) follow the same rule.</figcaption>
</figure>

Once the rule is in the state machine rather than in a settings page, the accounting failures become impossible rather than unlikely. An agent cannot pause a clock by accident because no agent action leads to a paused state. A clock cannot fail to resume because the resume is the transition the customer's reply performs, not a separate step someone has to remember. And two clocks cannot run on one ticket because a state carries exactly one, and a ticket is in exactly one state.

## What a published clock looks like

Clocks are easiest to reason about when their targets are public, and the clearest published examples are the large cloud providers' support plans. AWS [publishes first-response targets](https://aws.amazon.com/premiumsupport/plans/) by severity and plan: under 24 hours for general guidance, under 12 for a system impaired, under 4 for a production system impaired, under 1 hour for a production system down, and for a business-critical system down, under 30 minutes on the Business plan, under 15 on Enterprise, and under 5 minutes from an incident engineer on the Unified Operations tier. Each of those is a clock that starts when the case is opened and stops when a person responds, and the whole table is a promise the customer can hold the vendor to.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">AWS Support first-response targets by severity, and by plan for the top severity</title>
<desc id="f2-d">Horizontal bars on a logarithmic scale of minutes. General guidance, under 24 hours, 1,440 minutes. System impaired, under 12 hours, 720. Production system impaired, under 4 hours, 240. Production system down, under 1 hour, 60. Business-critical system down: under 30 minutes on Business, under 15 on Enterprise, under 5 on Unified Operations.</desc>
<text x="0" y="18" class="viz-title">A published clock, from a day down to five minutes</text>
<text x="0" y="36" class="viz-sub">First-response target in minutes, log scale; the last three rows differ by plan</text>
<line x1="216" y1="52" x2="216" y2="290" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">General guidance</text>
<path d="M216 58 H596 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="592" y="53" text-anchor="end" class="viz-value">under 24 h</text>
<text x="206" y="107" text-anchor="end" class="viz-label">System impaired</text>
<path d="M216 92 H551 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="547" y="87" text-anchor="end" class="viz-value">under 12 h</text>
<text x="206" y="141" text-anchor="end" class="viz-label">Production impaired</text>
<path d="M216 126 H478 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="498" y="141" class="viz-value">under 4 h</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Production down</text>
<path d="M216 160 H386 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="406" y="175" class="viz-value">under 1 h</text>
<text x="206" y="209" text-anchor="end" class="viz-label">Critical, Business</text>
<path d="M216 194 H340 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="360" y="209" class="viz-value">under 30 min</text>
<text x="206" y="243" text-anchor="end" class="viz-label">Critical, Enterprise</text>
<path d="M216 228 H294 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="314" y="243" class="viz-value">under 15 min</text>
<text x="206" y="277" text-anchor="end" class="viz-label">Critical, Unified Ops</text>
<path d="M216 262 H222 a4 4 0 0 1 4 4 V278 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="242" y="277" class="viz-value">under 5 min</text>
<text x="0" y="316" class="viz-label-muted">Each factor of ten in minutes adds the same bar length; the scale runs from 5 to 1,440.</text>
</svg>
<figcaption>Source: the <a href="https://aws.amazon.com/premiumsupport/plans/">AWS Support plans comparison</a>, September 2026; grey rows are common to the paid plans, gold rows show the top severity by plan.</figcaption>
</figure>

A published table like that only means something if the vendor's own accounting is honest about when the clock was running, which is the point of the one-pause rule. If the vendor could stop the clock by posting "we are looking into this", the fifteen minutes would be a number rather than a promise.

## Time as a query, not a job

The second consequence of the state machine is that elapsed SLA time stops being a stored field and becomes a query. Every transition is a row: ticket, from state, to state, actor, timestamp. The response time of a ticket is the sum of the durations it spent in states whose clock was the response clock, computed from consecutive transition rows, and the same for resolution. The business calendar, if the contract has one, is applied to those intervals at query time. Nothing is precomputed, nothing is cached in a column that can drift, and a report for last quarter is the same query with a date range.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">One ticket's timeline with the clock running and paused, and the elapsed time computed from transitions</title>
<desc id="f3-d">A horizontal timeline of a single ticket. Segments where the clock runs are gold: opened to first reply, and customer reply to resolution. Segments where it is paused are grey: awaiting the customer, and a scheduled callback. Below, the elapsed resolution time is shown as the sum of the gold segments only.</desc>
<text x="0" y="18" class="viz-title">Elapsed time is the sum of the running segments</text>
<line x1="40" y1="100" x2="600" y2="100" class="viz-axis"/>
<rect x="40" y="88" width="110" height="24" rx="4" class="viz-f1"/>
<rect x="150" y="88" width="150" height="24" rx="4" class="viz-fgray"/>
<rect x="300" y="88" width="90" height="24" rx="4" class="viz-f1"/>
<rect x="390" y="88" width="100" height="24" rx="4" class="viz-fgray"/>
<rect x="490" y="88" width="110" height="24" rx="4" class="viz-f1"/>
<text x="95" y="72" text-anchor="middle" class="viz-tick">awaiting agent</text>
<text x="225" y="72" text-anchor="middle" class="viz-tick">awaiting customer</text>
<text x="345" y="72" text-anchor="middle" class="viz-tick">agent</text>
<text x="440" y="72" text-anchor="middle" class="viz-tick">scheduled</text>
<text x="545" y="72" text-anchor="middle" class="viz-tick">agent, resolved</text>
<text x="40" y="136" text-anchor="middle" class="viz-tick">opened</text>
<text x="150" y="136" text-anchor="middle" class="viz-tick">reply sent</text>
<text x="300" y="136" text-anchor="middle" class="viz-tick">customer replies</text>
<text x="440" y="136" text-anchor="middle" class="viz-tick">callback agreed</text>
<text x="600" y="136" text-anchor="middle" class="viz-tick">resolved</text>
<rect x="40" y="166" width="12" height="12" rx="3" class="viz-f1"/><text x="58" y="177" class="viz-label-muted">clock running: counts</text>
<rect x="240" y="166" width="12" height="12" rx="3" class="viz-fgray"/><text x="258" y="177" class="viz-label-muted">paused by the customer or an agreed schedule</text>
<text x="320" y="216" text-anchor="middle" class="viz-label-muted">Resolution time is the sum of the gold segments, computed from the transition rows.</text>
</svg>
<figcaption>Illustrative: one ticket's transitions; the segment widths are drawn, not measured.</figcaption>
</figure>

The design is also what makes the report trustworthy to the people it measures. An agent who sees a breach can open the ticket and read the transitions: here is where the clock ran, here is who paused it and when, here is the customer reply that resumed it. There is nothing to dispute except the timestamps, and the timestamps were written by the system at the moment of the transition. A nightly job that recomputes a stored field produces a number nobody can trace, and a number nobody can trace becomes a number nobody trusts, at which point the SLA report is a formality and the promise behind it is not really being kept.

## Calendars, reassignment, escalation

Three details decide whether the model survives contact with a real desk. The first is the business calendar. A contract that promises four working hours means the clock runs only inside the customer's business hours and holidays, and the state machine does not need to know that; the transition rows carry wall-clock timestamps, and the calendar is applied when the elapsed time is computed, by intersecting each running interval with the calendar's working periods. Changing the calendar, or correcting a holiday that was entered wrong, changes every report retroactively and correctly, which a stored elapsed-time column could never do.

The second is reassignment. Handing a ticket from one agent to another is an event the desk cares about, and it is recorded as a transition with an actor, but it does not change state and it does not touch the clock, because the promise was made to the customer, not to a particular agent. The same holds for internal escalation: the ticket moves up a tier, the row records who moved it, and the clock that was running keeps running.

The third is a change of target. When a ticket's priority is raised, or a customer's plan changes the promised response time, the target changes but the elapsed time does not; the clock has been running since the ticket opened and carries that time into the new target, which may already be breached at the moment of the change. That is uncomfortable and correct, and it is the reason a priority change is a transition with an actor rather than an edit to a field: the record shows who changed the promise and when, and the report shows what the change cost.

## Where the vendors stop

Every ticketing product has SLA pausing, and their help pages describe it as a setting: choose the statuses that pause the clock. Atlassian's [SLA conditions documentation](https://support.atlassian.com/jira-service-management-cloud/docs/set-up-sla-conditions/) is a good example of the shape, and the shape is a list of statuses with a checkbox. What the setting cannot express is the rule about who may move a ticket into a paused status, and that is where the accounting failures come from: any agent can set the status to awaiting customer, whether or not a customer is being awaited. The one-pause rule moves that decision out of the settings page and into the transitions, where the actor is part of the row and the state machine refuses the ones the rule forbids.

Whether a team builds its own desk or configures a vendor's, the rule is worth applying. Write down each state's clock. Write down the single actor whose action can stop it, and check that the actor is never the party the clock measures. Then look at the transition log for the last ten breaches. In my experience most of them were never slow work. They were a clock that someone stopped, and the state machine is how you make sure that only the right someone can.
