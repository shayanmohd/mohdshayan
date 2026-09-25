---
title: Price the outage, not the hour
date: 2026-05-13
summary: For infrastructure and security work the hour is the wrong unit. The client is buying a lower probability of an expensive failure, which is what an insurer sells, with arithmetic.
tags: Pricing, Consulting, Reliability
topic: Founding & Impact
draft: false
---

The first quotes I wrote for infrastructure work were in hours, because that is how engineering is bought, and every one of them was wrong in the same direction. The client was not buying my hours. They were buying a lower chance of the thing they were afraid of: the gate that stops validating tickets on the busiest day of the year, the database that cannot be restored, the credential that walks out of the building. Hours are what it costs me to reduce that chance. They say nothing about what the reduction is worth, and the gap between the two is where a quote is either fair or foolish.

## What the client is actually buying

Uptime Institute's annual survey makes the shape of the thing plain. In its [2026 outage analysis](https://uptimeinstitute.com/about-ui/press-releases/uptime-announces-annual-outage-analysis-report-2026), 57 percent of respondents said their most recent significant outage cost more than 100,000 dollars, and one in five said it cost more than a million, the second year running at that level; the [2025 edition](https://uptimeinstitute.com/about-ui/press-releases/uptime-announces-annual-outage-analysis-report-2025) had 54 percent above 100,000. Those are large operators, and a small client's numbers are smaller, but the structure is the same: an outage has a cost, the cost is large relative to the work that prevents it, and the work changes a probability rather than delivering a thing.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Cost of the most recent significant outage, share of respondents</title>
<desc id="f1-d">Two pairs of horizontal bars. Over 100,000 dollars: 54 percent in the 2024 survey, 57 percent in the 2025 survey. Over one million dollars: about 20 percent in both.</desc>
<text x="0" y="18" class="viz-title">What an outage costs the people who had one</text>
<text x="0" y="36" class="viz-sub">Share of respondents, Uptime Institute annual surveys</text>
<line x1="220" y1="52" x2="220" y2="188" class="viz-axis"/>
<text x="210" y="73" text-anchor="end" class="viz-label">Over $100,000, 2024 survey</text>
<path d="M220 58 H430.4 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H220 Z" class="viz-fgray"/>
<text x="446.4" y="73" class="viz-value">54%</text>
<text x="210" y="107" text-anchor="end" class="viz-label">Over $100,000, 2025 survey</text>
<path d="M220 92 H442.1 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H220 Z" class="viz-f1"/>
<text x="458.1" y="107" class="viz-value">57%</text>
<text x="210" y="141" text-anchor="end" class="viz-label">Over $1 million, 2024 survey</text>
<path d="M220 126 H298 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H220 Z" class="viz-fgray"/>
<text x="314" y="141" class="viz-value">one in five</text>
<text x="210" y="175" text-anchor="end" class="viz-label">Over $1 million, 2025 survey</text>
<path d="M220 160 H298 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H220 Z" class="viz-f1"/>
<text x="314" y="175" class="viz-value">one in five</text>
<text x="0" y="216" class="viz-tick">the million-dollar rows are drawn at 20 per cent, as the reports state them</text>
</svg>
<figcaption>Source: Uptime Institute press releases for the <a href="https://uptimeinstitute.com/about-ui/press-releases/uptime-announces-annual-outage-analysis-report-2025">2025</a> and <a href="https://uptimeinstitute.com/about-ui/press-releases/uptime-announces-annual-outage-analysis-report-2026">2026</a> annual outage analyses.</figcaption>
</figure>

An engagement that reduces a probability is an insurance product, whatever the invoice calls it. And insurers do not price by the hour. They price by the expected loss they are absorbing, and they add a margin for the risk they cannot measure. That arithmetic transfers to infrastructure and security work almost unchanged, and it produces quotes that survive negotiation because every number in them is the client's own.

## The premium quote

The quote has four inputs, and all four come from the client. The cost of the failure: what a day without the gate, or a lost database, or a leaked key would cost, in money, using the client's own figures for revenue, penalties and recovery. The baseline probability: how likely that failure is over the retention period, before the work. The post-work probability: how likely it is after. And the retention period itself: how long the client is buying protection for, which is usually the length of the support contract.

The fee is a stated share of the expected loss avoided: the cost of failure, times the reduction in probability, over the period. To that I attach a deductible, which is the residual risk the client keeps, stated plainly: the failures the work does not prevent, and the probability that remains.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The premium quote as a flow</title>
<desc id="f2-d">Three inputs on the left: cost of failure, baseline probability, and probability after the work. They combine into expected loss avoided over the retention period. A share of that becomes the fee. What remains, the residual probability times the cost, is stated as the deductible the client keeps.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="30" width="170" height="48" rx="8" class="viz-box"/>
<text x="93" y="59" text-anchor="middle" class="viz-label">Cost of failure</text>
<rect x="8" y="94" width="170" height="48" rx="8" class="viz-box"/>
<text x="93" y="123" text-anchor="middle" class="viz-label">Probability before</text>
<rect x="8" y="158" width="170" height="48" rx="8" class="viz-box"/>
<text x="93" y="187" text-anchor="middle" class="viz-label">Probability after</text>
<line x1="180" y1="54" x2="236" y2="108" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="180" y1="118" x2="236" y2="118" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="180" y1="182" x2="236" y2="128" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="240" y="86" width="180" height="64" rx="8" class="viz-box-accent"/>
<text x="330" y="112" text-anchor="middle" class="viz-label">Expected loss avoided</text>
<text x="330" y="132" text-anchor="middle" class="viz-label-muted">cost x reduction, per period</text>
<line x1="422" y1="106" x2="470" y2="70" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="422" y1="130" x2="470" y2="166" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="474" y="42" width="158" height="52" rx="8" class="viz-box-ink"/>
<text x="553" y="66" text-anchor="middle" class="viz-on-ink">Fee: a stated share</text>
<text x="553" y="84" text-anchor="middle" class="viz-on-ink">of the loss avoided</text>
<rect x="474" y="142" width="158" height="52" rx="8" class="viz-box"/>
<text x="553" y="166" text-anchor="middle" class="viz-label">Deductible</text>
<text x="553" y="184" text-anchor="middle" class="viz-label-muted">residual risk, in writing</text>
<text x="320" y="240" text-anchor="middle" class="viz-tick">every input is the client's own number; the share is the only one that is mine</text>
</svg>
<figcaption>Illustrative: the structure of the quote; the share and the inputs vary by engagement.</figcaption>
</figure>

## The same hours, three prices

Here is why the hour was the wrong unit, in numbers I have made up to show the shape. Take forty hours of the same work: a restore drill, a lock-timeout policy for migrations, secrets moved to short-lived tokens, and a runbook. Do it for a hobby site whose worst day costs its owner a few hundred rupees of embarrassment. Do it for a visitor attraction whose gates fail on a festival weekend and refund a day's tickets. Do it for a payments backend whose outage triggers contractual penalties and a regulator's letter. The hours are identical. The loss avoided differs by orders of magnitude, and a fee that is a share of the loss avoided differs with it.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The same forty hours priced for three clients</title>
<desc id="f3-d">Horizontal bars on a logarithmic scale of expected loss avoided: a hobby site at about 1, a ticketing gate at about 100, a payments backend at about 10,000, in relative units. The fee follows the bar, not the hours.</desc>
<text x="0" y="18" class="viz-title">Identical work, different worth</text>
<text x="0" y="36" class="viz-sub">Expected loss avoided by the same 40 hours, relative units, log scale</text>
<line x1="176" y1="52" x2="176" y2="154" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Hobby site</text>
<path d="M176 58 H203 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="219" y="73" class="viz-value">1</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Ticketing gate</text>
<path d="M176 92 H384 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="400" y="107" class="viz-value">100</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Payments backend</text>
<path d="M176 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="580" y="141" class="viz-value">10,000</text>
<text x="0" y="190" class="viz-label-muted">An hourly quote charges all three the same. A premium quote charges each</text>
<text x="0" y="210" class="viz-label-muted">a share of its own bar, and is cheap for the first and fair for the third.</text>
<text x="0" y="238" class="viz-tick">made-up magnitudes; the point is the spread, not the values</text>
</svg>
<figcaption>Illustrative: three client profiles with invented magnitudes, drawn to show why the hour cannot be the unit.</figcaption>
</figure>

The hobby site should probably not buy the work at all, and the premium quote says so honestly: the loss avoided is too small to be worth a fee that covers my time, and the right answer is a checklist they can follow themselves. The payments backend should buy it and should pay a great deal more than forty hours' worth, and will, because the quote is a fraction of a number their own finance team produced. The ticketing gate sits in between, and the deductible matters most there, because the work reduces the chance of a bad festival weekend and does not eliminate it, and the client should know which failures are still theirs.

## Estimating the probabilities without pretending

The two probabilities are the inputs people distrust, and the honest answer is that they are estimates and should be presented as ranges. The baseline comes from three places. Public base rates, such as the outage surveys above, give an order of magnitude for a class of failure. The client's own history gives a second: how many times in the last three years the gate went down, the database needed a restore, a credential had to be rotated in a hurry. And a short review of the system gives a third, because a database with no tested restore has a higher probability of an unrecoverable failure than one with a monthly drill, and that difference is visible in an afternoon.

The post-work probability is the harder one, and I state it as a claim about mechanism rather than a number pulled from the air. A restore drill that runs monthly does not make data loss impossible; it makes an unrecoverable loss depend on two failures in the same month instead of one. A lock timeout on migrations does not prevent bad migrations; it turns a table-wide outage into a failed deployment. Each mechanism converts one kind of failure into a smaller kind, and the reduction in probability is the reduction in the kinds that remain. Written that way, the client can argue with the mechanism, which is a better argument than one about a decimal.

## Where the formula stops working

The arithmetic needs a cost of failure, and some work has none that anyone will write down. A refactor that makes the code nicer, a migration between two adequate frameworks, a dashboard that nobody's decision depends on. For those the premium quote produces zero, which is the formula telling you the work should be priced by the hour, if at all, because there is no risk being transferred. That is a useful answer, not a failure of the method.

It also needs honest probabilities, and both sides have reasons to shade them. The client would like the baseline to be low, so the work looks unnecessary, and then high, so the fee looks steep. I would like the reduction to be large. The defence is to use public base rates where they exist, the outage surveys, the secrets-sprawl figures, the migration-incident post-mortems, and to write the assumptions into the quote so that they can be argued about before the work rather than after the failure.

## What changed

Quoting this way changed two things about CustomGlide's retained infrastructure work. The conversations moved from "how many hours" to "what does the bad day cost you", which is a conversation the client's leadership can join and the engineering manager could not have held alone. And the deductible line, the plain statement of what is still their risk, became the part of the proposal clients read most carefully, because it is the only part that tells them what they are not buying.

Value-based pricing is old advice, and it usually arrives without arithmetic, as an exhortation to charge what the work is worth. Underwriting is the arithmetic. Cost of failure, probability before, probability after, a share of the difference, and a deductible in writing. It is not a way to charge more. It is a way to charge the right amount, which for some clients is less and for a few is a great deal more, and to be able to say why.
