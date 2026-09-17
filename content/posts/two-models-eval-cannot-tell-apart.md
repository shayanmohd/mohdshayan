---
title: Two models your eval cannot tell apart
date: 2026-09-17
summary: A benchmark's item count sets its resolution. On HumanEval a six-point gap between two models is a tie, and most leaderboard gaps are smaller than that.
tags: Evaluation, Statistics, Benchmarks
draft: false
---

Two checkpoints, one evaluation set of two hundred questions. Checkpoint A scores 81, checkpoint B scores 78. The team ships A. Nobody asks whether 81 and 78 are different numbers, because they look different, and looking different is enough at four in the afternoon.

They are not different. At two hundred items, a three-point gap is well inside the noise of the measurement, and the decision to ship A was a coin toss with a spreadsheet attached. This post is about the size of that noise, which turns out to be a fixed property of the benchmark that you can look up before you run anything.

## A benchmark's resolution

An accuracy score is a proportion: correct items over total items. If the benchmark's questions are a sample from some larger population of questions you care about, and Evan Miller's [Adding Error Bars to Evals](https://arxiv.org/abs/2411.00640) argues that this is the only sensible way to read them, then the score has a standard error like any other proportion: the square root of p times one minus p, divided by the item count.

At an accuracy of 80% the numerator is fixed, so the standard error depends only on the number of items, and the 95% interval is about two standard errors either side. Work that through for the benchmarks people actually quote. HumanEval has 164 problems, from the [paper that introduced it](https://arxiv.org/abs/2107.03374). GSM8K's test split has 1,319, per [Cobbe et al.](https://arxiv.org/abs/2110.14168). SWE-bench Verified has 500, per [OpenAI's announcement](https://openai.com/index/introducing-swe-bench-verified/). ARC-Challenge's test set has 1,172, per [Clark et al.](https://arxiv.org/abs/1803.05457). MMLU's test set has 14,042, per [Hendrycks et al.](https://arxiv.org/abs/2009.03300).

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">How far a single score can be from the truth, by benchmark</title>
<desc id="f1-d">Horizontal bars of the 95% half-width in accuracy points for one model scoring 80%: HumanEval with 164 items, 6.1; SWE-bench Verified with 500 items, 3.5; ARC-Challenge with 1,172 items, 2.3; GSM8K with 1,319 items, 2.2; MMLU with 14,042 items, 0.7. HumanEval is highlighted.</desc>
<text x="0" y="18" class="viz-title">95% half-width of one score at 80% accuracy</text>
<text x="0" y="36" class="viz-sub">Accuracy points, from the binomial standard error</text>
<line x1="200" y1="52" x2="200" y2="222" class="viz-axis"/>
<text x="190" y="73" text-anchor="end" class="viz-label">HumanEval (164)</text>
<path d="M200 58 H566 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H200 Z" class="viz-f1"/>
<text x="582" y="73" class="viz-value">6.1</text>
<text x="190" y="107" text-anchor="end" class="viz-label">SWE-bench Verified (500)</text>
<path d="M200 92 H408 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H200 Z" class="viz-fgray"/>
<text x="420" y="107" class="viz-value">3.5</text>
<text x="190" y="141" text-anchor="end" class="viz-label">ARC-Challenge (1,172)</text>
<path d="M200 126 H336 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H200 Z" class="viz-fgray"/>
<text x="348" y="141" class="viz-value">2.3</text>
<text x="190" y="175" text-anchor="end" class="viz-label">GSM8K (1,319)</text>
<path d="M200 160 H330 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H200 Z" class="viz-fgray"/>
<text x="342" y="175" class="viz-value">2.2</text>
<text x="190" y="209" text-anchor="end" class="viz-label">MMLU (14,042)</text>
<path d="M200 194 H238 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H200 Z" class="viz-fgray"/>
<text x="250" y="209" class="viz-value">0.7</text>
</svg>
<figcaption>Source: item counts from the <a href="https://arxiv.org/abs/2107.03374">HumanEval</a>, <a href="https://openai.com/index/introducing-swe-bench-verified/">SWE-bench Verified</a>, <a href="https://arxiv.org/abs/1803.05457">ARC</a>, <a href="https://arxiv.org/abs/2110.14168">GSM8K</a> and <a href="https://arxiv.org/abs/2009.03300">MMLU</a> papers; half-widths computed as 1.96 times the binomial standard error at p = 0.8.</figcaption>
</figure>

Read the first bar. A model that scores 80 on HumanEval could plausibly be a 74 model or an 86 model, on the same task, with a different draw of 164 problems. That is not a criticism of HumanEval. It is what 164 items can resolve, and it has been true since the day the benchmark was published.

## Two scores, one gap

Comparing two models is worse than scoring one, because both scores carry noise. If the two models were evaluated on different draws of questions, or if you only kept the two totals, the standard error of the difference is the single-score error times the square root of two. Call the 95% half-width of that difference the tie zone: any gap smaller than it cannot be ranked. On HumanEval the tie zone at 80% accuracy is about 8.7 points. On SWE-bench Verified it is 5.0. On GSM8K it is 3.1. On MMLU it is 0.9. A great many of the gaps announced with adjectives on leaderboards live inside those bands.

There is a way to shrink the zone, and it costs nothing but bookkeeping. Evaluate both models on the same items and keep the per-item outcomes. Then the comparison is paired: for each question you know whether A and B both passed, both failed, or split. Only the split items carry information about the difference, and when the two models agree on most items, which similar checkpoints do, the paired standard error can be a fraction of the unpaired one. Miller's paper works through the paired formula and recommends it as the default; it is the difference between a coin toss and a measurement.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Paired and unpaired comparison of two models</title>
<desc id="f2-d">Two rows of eight items for model A and model B. In the unpaired view only the two totals, six of eight and five of eight, are kept. In the paired view each column is compared: six columns agree and two split, and only the two split columns carry information about the difference.</desc>
<text x="0" y="18" class="viz-title">Keep the per-item outcomes</text>
<text x="0" y="36" class="viz-sub">The same eight questions, read two ways</text>
<text x="0" y="78" class="viz-label">Model A</text>
<text x="0" y="118" class="viz-label">Model B</text>
<rect x="100" y="64" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="150" y="64" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="200" y="64" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="250" y="64" width="40" height="20" rx="3" class="viz-f1"/>
<rect x="300" y="64" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="350" y="64" width="40" height="20" rx="3" class="viz-box"/>
<rect x="400" y="64" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="450" y="64" width="40" height="20" rx="3" class="viz-box"/>
<rect x="100" y="104" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="150" y="104" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="200" y="104" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="250" y="104" width="40" height="20" rx="3" class="viz-box"/>
<rect x="300" y="104" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="350" y="104" width="40" height="20" rx="3" class="viz-box"/>
<rect x="400" y="104" width="40" height="20" rx="3" class="viz-fgray"/>
<rect x="450" y="104" width="40" height="20" rx="3" class="viz-f1"/>
<text x="520" y="78" class="viz-value">6 / 8</text>
<text x="520" y="118" class="viz-value">5 / 8</text>
<rect x="246" y="58" width="48" height="72" rx="6" class="viz-box-accent"/>
<rect x="446" y="58" width="48" height="72" rx="6" class="viz-box-accent"/>
<rect x="250" y="64" width="40" height="20" rx="3" class="viz-f1"/>
<rect x="250" y="104" width="40" height="20" rx="3" class="viz-box"/>
<rect x="450" y="64" width="40" height="20" rx="3" class="viz-box"/>
<rect x="450" y="104" width="40" height="20" rx="3" class="viz-f1"/>
<text x="0" y="160" class="viz-label-muted">Unpaired: two totals, one point apart, noise from all eight items on both sides</text>
<text x="0" y="182" class="viz-label-muted">Paired: six columns agree and cancel; the difference lives in two split columns</text>
<rect x="100" y="200" width="14" height="14" rx="3" class="viz-fgray"/><text x="120" y="212" class="viz-label-muted">pass, both</text>
<rect x="220" y="200" width="14" height="14" rx="3" class="viz-box"/><text x="240" y="212" class="viz-label-muted">fail</text>
<rect x="300" y="200" width="14" height="14" rx="3" class="viz-f1"/><text x="320" y="212" class="viz-label-muted">pass where the other failed</text>
</svg>
<figcaption>Illustrative: a toy set of eight items, drawn to show which columns carry information about a difference.</figcaption>
</figure>

## The tie zone as a rule

Two habits follow. The first is for reading other people's numbers: report a gap smaller than the benchmark's tie zone as a tie, whatever the leaderboard's sort order says. A leaderboard sorts on the point estimate because a table needs an order, not because the order is known. A model that is "second" by half a point on MMLU may be first; the table cannot tell, and neither can you.

The second habit is for your own evaluations: decide the gap you need to resolve before you build the set, and size the set to it. To tell a three-point difference from zero at 95% confidence, unpaired, at around 80% accuracy, you need roughly 1,400 items. To resolve one point you need about 12,000. Pairing brings both numbers down, sometimes by a lot, but only if the outcomes are kept per item, which is a decision made on the day the evaluation code is written and expensive to reverse later.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Tie zone against evaluation set size</title>
<desc id="f3-d">A single line falling as the item count rises: 11.1 points at 100 items, 7.8 at 200, 5.0 at 500, 3.5 at 1,000, 2.5 at 2,000, 1.6 at 5,000 and 1.1 at 10,000, for an unpaired comparison at 80% accuracy.</desc>
<text x="0" y="18" class="viz-title">The gap you can resolve, by item count</text>
<text x="0" y="36" class="viz-sub">95% tie zone in accuracy points, unpaired, both models near 80%</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">12</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">9</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">6</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">3</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">100</text>
<text x="146.7" y="288" text-anchor="middle" class="viz-tick">200</text>
<text x="237.3" y="288" text-anchor="middle" class="viz-tick">500</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">1,000</text>
<text x="418.7" y="288" text-anchor="middle" class="viz-tick">2,000</text>
<text x="509.3" y="288" text-anchor="middle" class="viz-tick">5,000</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">10,000</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Items in the evaluation set (spacing is categorical, not linear)</text>
<polyline points="56,71.6 146.7,128.8 237.3,177.3 328,203.3 418.7,220.7 509.3,236.3 600,245" class="viz-s1"/>
<circle cx="56" cy="71.6" r="4" class="viz-d1"/>
<circle cx="600" cy="245" r="4" class="viz-d1"/>
<text x="70" y="68" class="viz-value">11.1</text>
<text x="592" y="240" text-anchor="end" class="viz-value">1.1</text>
</svg>
<figcaption>Illustrative: computed as 1.96 times the square root of 2 times p(1 minus p) over n, with p = 0.8; the construction follows the unpaired difference in <a href="https://arxiv.org/abs/2411.00640">Miller (2024)</a>.</figcaption>
</figure>

## The noise the item count does not cover

The item count sets the floor on the noise, and two other sources sit on top of it. The first is the model's own randomness. A sampled answer at any temperature above zero is one draw, so a score of 80 on one run is itself a sample of the model's behaviour on those questions, and rerunning the same checkpoint on the same items can move the total by a point or two before any question changes. Miller's recommendation is to score several samples per question and average them, which is also the only way the paired comparison stays honest, since a single lucky draw on a split item would otherwise decide the gap.

The second is structure in the items. Benchmarks built from passages, with several questions per passage, or from problem families with shared templates, do not contain as many independent items as they have rows. Questions that share a passage tend to be answered right or wrong together, and the standard error must be computed on the clusters rather than the rows, which widens the interval further. A reading-comprehension set with 2,000 questions over 400 passages has the resolution of something closer to 400 items than 2,000, and a leaderboard that reports it as 2,000 is quietly overstating its own precision.

Neither correction changes the direction of the argument. They both say the tie zone is wider than the first chart shows, never narrower.

## What I do with a small set

When I was evaluating a helpdesk assistant at CRIS, the internal question set was the size internal sets always are: small, hand-written, and precious. The temptation with a set like that is to treat every point of movement as a signal, and the tie zone says that most of the movement is weather.

So the rules I use now are short. Keep the per-item outcomes for every run, so that any two checkpoints can be compared paired rather than by their totals. Score more than one sample per question when the decoding is not deterministic. Decide the smallest gap that would change a decision, and compute the item count that gap needs; if the set is too small to resolve it, say so in the report rather than rounding the noise into a verdict.

And when two checkpoints tie, which on a small set is most of the time, choose on the things the eval does not measure: latency, cost, and the failure modes a person can read in the transcripts. A tie is not a failure of the evaluation. It is the evaluation telling you, correctly, that the decision belongs to a different set of numbers.

A three-point gap on two hundred items is not a reason to ship A. It is a reason to write down how many items it would take to know, and to decide whether knowing is worth that many questions.
