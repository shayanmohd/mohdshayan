---
title: Estimates are a count of open questions
date: 2026-09-17
summary: Estimation error comes from the questions nobody asked, not from optimism about visible work. Price the questions, not the features; no fixed price while the client's stay open.
tags: Contract Work, Estimation, Consulting
draft: false
---

Every estimate I have got badly wrong was wrong for the same reason, and it was not optimism about the work I could see. It was a question I had not asked. Which system holds the customer records now, and can it export them? Who approves the design, and how many of them are there? Is the launch date a wish or a contract?

Each of those, unanswered, is a range in the estimate, and the range does not shrink because the work is well understood; it shrinks when the question is closed. So the method I use to scope contract work does not start from the feature list. It starts from a list of open questions, tagged by who can close them, and the quoted range is a function of that list's length.

## The cone is a count

The oldest result in software estimation says this in a different vocabulary. Boehm's cone of uncertainty, from his 1981 [Software Engineering Economics](https://en.wikipedia.org/wiki/Cone_of_uncertainty), and the version McConnell later popularised in a [Construx white paper](https://www.construx.com/wp-content/uploads/2019/02/CxWhitePaper_ConeOfUncertainty.pdf), gives the error band of an estimate at each project milestone: a factor of four either side at initial concept, meaning the true effort lies anywhere between a quarter and four times the estimate; a factor of two at approved product definition; 0.67 to 1.5 at requirements complete; 0.8 to 1.25 when the interface design is done; 0.9 to 1.1 at detailed design. The white paper's most important sentence is not the numbers. It is the observation that the cone narrows only as decisions are made, not with the passage of time; give an estimator another week without closing any questions and the estimate is no better.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The cone of uncertainty: estimate error band by milestone</title>
<desc id="f1-d">Two lines converging from left to right on a logarithmic axis of the ratio of actual to estimated effort. At initial concept the band is 0.25 to 4; at approved product definition 0.5 to 2; at requirements complete 0.67 to 1.5; at interface design complete 0.8 to 1.25; at detailed design complete 0.9 to 1.1; at software complete, 1.</desc>
<text x="0" y="18" class="viz-title">Sixteen to one at the start, and it only narrows by decision</text>
<text x="0" y="36" class="viz-sub">Actual effort as a multiple of the estimate, high and low bound, log scale</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">4x</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">2x</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-axis"/><text x="48" y="164" text-anchor="end" class="viz-tick">1x</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">0.5x</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-grid"/><text x="48" y="268" text-anchor="end" class="viz-tick">0.25x</text>
<polyline points="56,56 165,108 274,129.6 383,143.3 492,152.8 600,160" class="viz-s1"/>
<polyline points="56,264 165,212 274,190.4 383,176.7 492,167.9 600,160" class="viz-s1"/>
<circle cx="56" cy="56" r="4" class="viz-d1"/><circle cx="56" cy="264" r="4" class="viz-d1"/>
<circle cx="165" cy="108" r="4" class="viz-d1"/><circle cx="165" cy="212" r="4" class="viz-d1"/>
<circle cx="274" cy="129.6" r="4" class="viz-d1"/><circle cx="274" cy="190.4" r="4" class="viz-d1"/>
<circle cx="383" cy="143.3" r="4" class="viz-d1"/><circle cx="383" cy="176.7" r="4" class="viz-d1"/>
<circle cx="492" cy="152.8" r="4" class="viz-d1"/><circle cx="492" cy="167.9" r="4" class="viz-d1"/>
<circle cx="600" cy="160" r="4" class="viz-d1"/>
<text x="56" y="290" text-anchor="middle" class="viz-tick">concept</text>
<text x="165" y="290" text-anchor="middle" class="viz-tick">definition</text>
<text x="274" y="290" text-anchor="middle" class="viz-tick">requirements</text>
<text x="383" y="290" text-anchor="middle" class="viz-tick">interface</text>
<text x="492" y="290" text-anchor="middle" class="viz-tick">detailed design</text>
<text x="600" y="290" text-anchor="middle" class="viz-tick">complete</text>
<text x="328" y="312" text-anchor="middle" class="viz-label-muted">Each milestone is a set of questions closed. The cone does not narrow on its own.</text>
</svg>
<figcaption>Source: milestone multipliers from McConnell's <a href="https://www.construx.com/wp-content/uploads/2019/02/CxWhitePaper_ConeOfUncertainty.pdf">Cone of Uncertainty white paper</a>, after Boehm (1981); the line is drawn through the published bounds.</figcaption>
</figure>

Read as a count, the cone says something practical. "Initial concept" is the state in which almost every question is open; "requirements complete" is the state in which the questions the client owns are closed; "detailed design complete" is the state in which the ones I own are closed too. The milestones are names for how many questions remain, and the error band is a function of that number.

## The question ledger

So before quoting, I write the ledger. Every unanswered question about the work goes on it, tagged with who can close it: me, the client, or a third party. Mine are the technical ones I can answer by reading code or trying something for an hour, which data model, which library, whether the existing export is usable. The client's are the ones only they can answer: who the users are, which of two contradictory requirements wins, what the migration deadline really is, who signs off. The third party's are the ones outside both our control: whether the payment provider approves the account, whether the old vendor will release the data, whether the app store review takes a day or a month.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The question ledger from first call to signed scope</title>
<desc id="f2-d">A flow of four stages. First call: the ledger is long, most questions open, and the quote is a wide range. Discovery: my questions close through reading and trying; the range narrows. Client answers: the client-only questions close through a written list they answer; the range narrows further. Signed scope: a handful of third-party questions remain, each with a stated assumption and a price for being wrong; the quote is a narrow range or a fixed price with named exclusions.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Questions close, the range narrows</text>
<rect x="8" y="50" width="140" height="120" rx="8" class="viz-box"/>
<text x="78" y="74" text-anchor="middle" class="viz-label">First call</text>
<text x="78" y="96" text-anchor="middle" class="viz-label-muted">ledger written</text>
<text x="78" y="114" text-anchor="middle" class="viz-label-muted">most questions open</text>
<text x="78" y="142" text-anchor="middle" class="viz-value">range: wide</text>
<line x1="150" y1="110" x2="166" y2="110" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="170" y="50" width="140" height="120" rx="8" class="viz-box"/>
<text x="240" y="74" text-anchor="middle" class="viz-label">Discovery</text>
<text x="240" y="96" text-anchor="middle" class="viz-label-muted">my questions close:</text>
<text x="240" y="114" text-anchor="middle" class="viz-label-muted">read code, try things</text>
<text x="240" y="142" text-anchor="middle" class="viz-value">range: narrower</text>
<line x1="312" y1="110" x2="328" y2="110" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="332" y="50" width="140" height="120" rx="8" class="viz-box-accent"/>
<text x="402" y="74" text-anchor="middle" class="viz-label">Client answers</text>
<text x="402" y="96" text-anchor="middle" class="viz-label-muted">client-only questions</text>
<text x="402" y="114" text-anchor="middle" class="viz-label-muted">closed in writing</text>
<text x="402" y="142" text-anchor="middle" class="viz-value">range: narrow</text>
<line x1="474" y1="110" x2="490" y2="110" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="494" y="50" width="138" height="120" rx="8" class="viz-box-ink"/>
<text x="563" y="74" text-anchor="middle" class="viz-on-ink">Signed scope</text>
<text x="563" y="96" text-anchor="middle" class="viz-on-ink">third-party questions</text>
<text x="563" y="114" text-anchor="middle" class="viz-on-ink">left, each priced</text>
<text x="563" y="142" text-anchor="middle" class="viz-on-ink">fixed, with exclusions</text>
<text x="320" y="210" text-anchor="middle" class="viz-label-muted">The rule: no fixed price while more than a handful of client-only questions are open.</text>
<text x="320" y="240" text-anchor="middle" class="viz-tick">the gold stage is the one that cannot be skipped and the one clients most want to skip</text>
<text x="320" y="270" text-anchor="middle" class="viz-tick">a third-party question that cannot close becomes an assumption with a price attached</text>
</svg>
<figcaption>Illustrative: the ledger's path through a scoping engagement; the stages are the ones I run, and the ranges are qualitative.</figcaption>
</figure>

The quote is then a range whose width is set by the ledger. With the ledger long, the range is wide and I say so, with the ledger attached, because a wide range with reasons is more useful to a client than a narrow number with none. As questions close, the range narrows and the quote is revised. The rule at the end is the one that protects both sides: no fixed price while more than a handful of client-only questions remain open. Those are the questions I cannot close by working harder, and a fixed price on top of them is a bet on answers I have not been given.

## Why the client-only tag matters

The three tags are not decoration; they decide what happens next. My questions are closed by discovery, which is work I do and can schedule. Third-party questions usually cannot be closed before signing, so each becomes a stated assumption in the scope with a price for the assumption being wrong: if the vendor does not release the data in a usable format, the migration is re-quoted; if store review exceeds two weeks, the launch date moves with it. That converts an unknowable into a known cost.

Client-only questions are the dangerous category, because they look closeable and often are not. A client who has not decided which of two departments owns the process will say they will decide next week, and the question will still be open at launch. The tag makes the ledger show, in one column, how much of the range is in the client's hands, and it turns the scoping conversation from "can you do it cheaper" into "here are the six things only you can settle, and each one you settle brings the price down". Most clients, shown the list, settle four of the six in the meeting.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Quoted range width against the number of open client-only questions, from the rule in the post</title>
<desc id="f3-d">A rising curve: with zero open client-only questions the quoted range is narrow, about plus or minus ten percent; with two, about plus or minus twenty-five; with four, about plus or minus fifty; with eight, roughly a factor of two either way. A marker at three questions shows where the rule stops allowing a fixed price.</desc>
<text x="0" y="18" class="viz-title">Every open client question widens the quote</text>
<text x="0" y="36" class="viz-sub">Quoted range as a multiple either side of the point estimate; illustrative</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">2.0x</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">1.75x</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">1.5x</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">1.25x</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1.0x</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">6</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Open client-only questions</text>
<polyline points="56,243 124,228 192,212 260,190 328,160 396,130 464,100 532,76 600,56" class="viz-s1"/>
<line x1="260" y1="56" x2="260" y2="264" class="viz-s4"/>
<text x="268" y="70" class="viz-tick">no fixed price beyond here</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">range width</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s4"/><text x="520" y="35" class="viz-label-muted">the handful</text>
<circle cx="56" cy="243" r="5" class="viz-d1"/>
<text x="68" y="238" class="viz-value">about plus or minus ten percent</text>
</svg>
<figcaption>Illustrative: the curve is constructed from the rule described in the post, with the widths chosen to show the shape; the threshold at three is the "handful" the rule refers to.</figcaption>
</figure>

## Pricing the questions, not the features

The reason to say "price the questions" rather than "price the features" is that the features are the part everyone can see and the part that is usually estimated well. A CRM migration's feature list is knowable in an hour: import contacts, map pipelines, migrate tickets, set up roles, train the team. What makes one such migration take three weeks and another take three months is not on that list. It is whether the old system's export is complete, whether the client's data has two years of duplicates, whether the person who knows the old workflow still works there. Those are questions, and each open one is a multiplier on the whole estimate, not an addition to one line of it.

That multiplicative shape is why the ledger matters more than the feature list at the quoting stage, and why the cone's bands are ratios rather than sums. A feature costs what it costs. An open question can double the project, and the double applies to everything.

## Keeping the ledger after signing

The ledger does not retire when the scope is signed; it becomes the project's risk register, and it is a better one than most because every entry already has an owner. The third-party questions that were priced as assumptions are watched, and the day one resolves the wrong way is the day the priced clause is invoked, calmly, because it was agreed in advance. The client-only questions that were closed in writing are the reference when a decision drifts, which it will: when the department that was to own the process changes its mind in week six, the ledger shows the answer that was given in week one and the price that was set on it, and the conversation is about a change, not about blame.

New questions appear during the work, and they go on the same ledger with the same tags. That is the honest form of scope creep control: not a refusal to answer new questions, but a record of who owns each one and what its answer is worth. A project whose ledger has grown by a dozen client-only questions since signing is one whose price should be revisited, and the ledger is the evidence for that conversation rather than a feeling that things have got bigger.

## The refusal

The hardest part of the method is the last line of the rule, refusing the fixed price. Clients want a number, and a range with a ledger attached looks like hedging until it is explained. The explanation that works is the honest one: a fixed price with the client's questions open is a price for a project neither of us has defined, and one of us will pay for the difference; I would rather close the questions this week and give a real number next week than give a fake number today. Put that way, the ledger stops being an obstacle to the deal and becomes the agenda for closing it, and the fixed price, when it comes, is one both sides can hold each other to.
