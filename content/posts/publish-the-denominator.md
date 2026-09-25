---
title: Publish the denominator
date: 2025-04-24
summary: Impact reports count outputs and drop two numbers: how many were eligible, and what would have happened anyway. A metric with no baseline would not ship, so do not fund one.
tags: Philanthropy, Measurement, Evidence
topic: Founding & Impact
draft: false
---

An impact report lands in the inbox with a number on the cover: twelve thousand meals served, four hundred students trained, three hundred families reached. The number is true, it is large, and it tells the reader almost nothing, because two other numbers are missing. How many people were eligible, so that the reach can be read as a fraction? And what would have happened to those people without the programme, so that the outcome can be read as a change? I hold the software I run to a standard where a metric without a denominator and a baseline is not a metric; it is a log line. The giving I do should meet the same standard, and the rule that makes it meet it is one sentence long.

## The denominator rule

Every impact figure is published as a numerator over the eligible population, with the source of the counterfactual stated, or it is labelled an output rather than an outcome. That is the whole rule. Twelve thousand meals is an output. Twelve thousand meals to a district where forty thousand children are eligible, which is thirty percent, is a reach figure with its denominator shown. A ten-point rise in attendance among the children fed, against a control group whose attendance did not move, is an outcome with its counterfactual named. Each of those is a legitimate thing to report. Only the last is impact, and the report should say which of the three it is presenting.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The ladder from output to outcome to counterfactual, with the denominator at each rung</title>
<desc id="f1-d">Three rungs drawn as boxes rising left to right. Output: what was delivered, with no denominator; twelve thousand meals. Reach: delivered over eligible; twelve thousand of forty thousand, thirty percent. Outcome against a counterfactual: the change in the people reached minus the change in a comparison group; attendance up ten points against no change. The top rung is highlighted as the only one that is impact.</desc>
<text x="0" y="18" class="viz-title">Three rungs, and only the top one is impact</text>
<rect x="8" y="190" width="190" height="80" rx="8" class="viz-box"/>
<text x="103" y="216" text-anchor="middle" class="viz-label">Output</text>
<text x="103" y="236" text-anchor="middle" class="viz-label-muted">12,000 meals served</text>
<text x="103" y="256" text-anchor="middle" class="viz-tick">no denominator</text>
<rect x="224" y="120" width="190" height="80" rx="8" class="viz-box"/>
<text x="319" y="146" text-anchor="middle" class="viz-label">Reach</text>
<text x="319" y="166" text-anchor="middle" class="viz-label-muted">12,000 of 40,000 eligible</text>
<text x="319" y="186" text-anchor="middle" class="viz-tick">denominator shown: 30 percent</text>
<rect x="440" y="50" width="192" height="80" rx="8" class="viz-box-accent"/>
<text x="536" y="76" text-anchor="middle" class="viz-label">Outcome, counterfactual</text>
<text x="536" y="96" text-anchor="middle" class="viz-label-muted">attendance up 10 points</text>
<text x="536" y="116" text-anchor="middle" class="viz-tick">vs a group that stayed</text>
<text x="320" y="292" text-anchor="middle" class="viz-label-muted">Each rung is honest to report. The report has to say which rung it is on.</text>
</svg>
<figcaption>Illustrative: the ladder as the rule uses it; the numbers are an example.</figcaption>
</figure>

The rule is not a demand that every programme run a randomised trial. It is a demand for labelling. A report that says "we served twelve thousand meals; we do not know the eligible population and we have no comparison group" is complying with the rule, and it is more useful than one that says "twelve thousand lives changed", because the reader can tell what has been measured and what has been assumed.

## What a real outcome number looks like

The reason to insist on the top rung is that when it is measured, the numbers are often smaller and more informative than the outputs suggest. The clearest example I know from Indian education is the evaluation of Mindspark, a computer-assisted learning programme, by Muralidharan, Singh and Ganimian, published in the [American Economic Review](https://www.aeaweb.org/articles?id=10.1257/aer.20171112) in 2019. Access was allocated by lottery, which supplies the counterfactual, and after four and a half months the winners scored 0.37 standard deviations higher in maths and 0.23 higher in Hindi than the losers; the authors' estimate for ninety days of actual attendance is 0.6 and 0.39 standard deviations. Those are large effects by the standards of the education literature, and they are stated as a difference against a group that did not get the programme, which is the only way an effect can be stated at all.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Measured learning gains from the Mindspark evaluation, in standard deviations</title>
<desc id="f2-d">Grouped horizontal bars. Lottery winners after 4.5 months: maths 0.37, Hindi 0.23. Estimate for 90 days of attendance: maths 0.60, Hindi 0.39. Maths bars are gold and Hindi bars are blue.</desc>
<text x="0" y="18" class="viz-title">An outcome with its counterfactual named</text>
<text x="0" y="36" class="viz-sub">Test score gain over the lottery losers, standard deviations</text>
<rect x="460" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="478" y="37" class="viz-label-muted">maths</text>
<rect x="540" y="26" width="12" height="12" rx="3" class="viz-f2"/><text x="558" y="37" class="viz-label-muted">Hindi</text>
<line x1="216" y1="52" x2="216" y2="200" class="viz-axis"/>
<text x="206" y="75" text-anchor="end" class="viz-label">Winners, 4.5 months</text>
<path d="M216 60 H438 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="452" y="72" class="viz-value">0.37</text>
<path d="M216 80 H354 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="368" y="92" class="viz-value">0.23</text>
<text x="206" y="139" text-anchor="end" class="viz-label">Per 90 days attended</text>
<path d="M216 124 H576 a4 4 0 0 1 4 4 V136 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="590" y="136" class="viz-value">0.60</text>
<path d="M216 144 H450 a4 4 0 0 1 4 4 V156 a4 4 0 0 1 -4 4 H216 Z" class="viz-f2"/>
<text x="464" y="156" class="viz-value">0.39</text>
<text x="0" y="230" class="viz-label-muted">Six hundred pixels per standard deviation; the second pair is the instrumental estimate.</text>
<text x="0" y="250" class="viz-tick">the denominator is the lottery: everyone who applied, winners and losers alike</text>
</svg>
<figcaption>Source: Muralidharan, Singh and Ganimian, <a href="https://www.aeaweb.org/articles?id=10.1257/aer.20171112">Disrupting Education? Experimental Evidence on Technology-Aided Instruction in India</a>, American Economic Review, 2019.</figcaption>
</figure>

The same discipline is what let Teaching at the Right Level move from a small trial to state-wide programmes: J-PAL's [account of that work](https://www.povertyactionlab.org/case-study/teaching-right-level-improve-learning) reports, among other results, that learning camps in Uttar Pradesh doubled the share of children who could read a paragraph or a story, and the doubling is a comparison, not a count. Nobody funded those programmes on the strength of the number of children who attended.

## The three-line template

The rule becomes a template that fits on an index card and that I now ask for before giving. Line one: the output, as delivered, with its unit. Line two: the eligible population and its source, so that line one can be divided by it. Line three: the counterfactual, which is one of four things: a randomised comparison group, a matched comparison group, a before-and-after measurement with the caveat stated, or the words "none; this figure is an output". A report that fills in all three lines has told the reader everything they need to weigh it, whichever rung it is on.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">One programme reported three ways</title>
<desc id="f3-d">A table with three rows. As reach: 400 students trained. As a fraction of eligible: 400 of 6,000 eligible in the district, 6.7 percent, source the district enrolment register. Against a counterfactual: completion of the course 82 percent, against 79 percent for a matched comparison group of non-participants, a 3-point difference with the caveat that the groups differ in motivation. The third row is highlighted.</desc>
<text x="0" y="18" class="viz-title">The same programme, on each rung</text>
<text x="20" y="48" class="viz-tick">REPORTED AS</text>
<text x="200" y="48" class="viz-tick">THE FIGURE</text>
<text x="440" y="48" class="viz-tick">WHAT IT LETS YOU JUDGE</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">Output</text>
<text x="200" y="84" class="viz-label-muted">400 students trained</text>
<text x="440" y="84" class="viz-label-muted">that work was done</text>
<line x1="0" y1="104" x2="640" y2="104" class="viz-grid"/>
<text x="20" y="132" class="viz-label">Reach</text>
<text x="200" y="132" class="viz-label-muted">400 of 6,000 eligible, 6.7%</text>
<text x="200" y="150" class="viz-tick">source: enrolment register</text>
<text x="440" y="132" class="viz-label-muted">how much of the problem</text>
<text x="440" y="150" class="viz-label-muted">the programme touched</text>
<line x1="0" y1="168" x2="640" y2="168" class="viz-grid"/>
<rect x="8" y="180" width="624" height="70" rx="8" class="viz-box-accent"/>
<text x="20" y="206" class="viz-label">Outcome</text>
<text x="200" y="206" class="viz-label-muted">82% employed at six months,</text>
<text x="200" y="224" class="viz-label-muted">against 79% in a matched group</text>
<text x="200" y="242" class="viz-tick">caveat: groups differ in motivation</text>
<text x="440" y="206" class="viz-label-muted">whether the programme</text>
<text x="440" y="224" class="viz-label-muted">changed anything: 3 points</text>
<text x="320" y="284" text-anchor="middle" class="viz-label-muted">Only the last row is a claim about impact, and it is the smallest number on the page.</text>
</svg>
<figcaption>Illustrative: an invented training programme reported on each rung, to show what each line of the template adds.</figcaption>
</figure>

The template's third row is where reports get uncomfortable, because the honest number is usually smaller than the headline. Eighty-two percent employed sounds like a result until the comparison group is at seventy-nine, at which point the programme's contribution is three points and a caveat. That is not a reason to hide the row. It is the reason the row exists: a donor who knows the contribution is three points can ask whether three points for the cost is a good use of money, and that question is the one philanthropy is supposed to be answering.

Asking for the template is not an adversarial act, and the way to ask matters. I send it before giving, with the offer that if the second or third line is missing because measuring it costs money, I will fund the measurement as part of the gift. Most organisations doing real work already know their eligible population roughly and have a before-and-after figure they were unsure whether to show; what they lack is a donor who would rather see the small honest number than the large vague one. Saying so in advance changes what comes back.

## The limit: unknowable denominators

The rule has a limit, and the limit needs its own line rather than silence. Some denominators cannot be counted. The number of children in a district who would benefit from a reading programme is not in any register; the number of families eligible for a relief effort during a flood is a guess made while the water is rising. The rule for those cases is that the denominator is estimated with a range and the method stated, never omitted. "Between five and eight thousand eligible, estimated from census population and the enrolment ratio" is a denominator. "Thousands" is not. A range is honest about uncertainty in a way that a missing number is not, and a reader can carry the range through the arithmetic to see what the reach figure could be at either end.

Counterfactuals have the same limit. There are programmes for which no comparison group can ethically exist, and the honest report says so and falls back to before-and-after with the caveat that other things changed too. The rule does not forbid that report. It forbids the report that presents before-and-after as if it were a comparison.

## Why a technologist should insist

I am strict about this because I know what the alternative looks like from the other side. In production, a metric without a denominator is a count that goes up and to the right whatever is happening: requests served, not the share of requests that succeeded; users signed up, not the share who came back. A count without a baseline is an alert that fires on Monday morning because Monday is busier than Sunday. Nobody who has run a service accepts those numbers as evidence of health, and the observability practice I follow exists precisely to replace counts with rates and rates with comparisons.

Giving is not different in kind. A programme is a system whose purpose is to change something in a population, and the question of whether it did is a measurement question with a denominator and a baseline, like every other measurement question. The denominator rule is the observability standard applied to the one place where people are most tempted to relax it, because the numbers are about kindness rather than uptime. The kindness is real. The number should be too.
