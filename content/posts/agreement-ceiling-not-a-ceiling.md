---
title: The agreement ceiling is not a ceiling
date: 2026-05-15
summary: Folk wisdom says a model cannot beat inter-annotator agreement. It can, because agreement compares two noisy people while the model is scored against a majority better than either.
tags: Labelling, Data Quality, Statistics
topic: ML Foundations
draft: false
---

There is a sentence that gets said in every labelling project, usually by someone trying to be realistic: the model cannot do better than the annotators agree with each other. If two people agree on 82 percent of items, then 82 percent is the ceiling, and a model scoring above it is measuring noise. It sounds like humility and it is a mistake. The agreement rate compares two noisy annotators with each other. The model is compared with a majority label that is more accurate than either of them. Those are different numbers, and the second one is higher.

## Two numbers that look alike

Take the simplest case: binary labels, independent annotators, each right with the same probability p. Two annotators agree when both are right or both are wrong, so the pairwise agreement a is p squared plus one minus p squared. Invert that and the per-annotator accuracy is one plus the square root of two a minus one, all over two. An agreement rate of 82 percent gives a per-annotator accuracy of 90 percent. The annotators are better than their agreement suggests, because agreement counts every disagreement against both of them.

Now build the gold label by majority vote of five annotators at 90 percent each. The majority is wrong only when three or more of the five are wrong, and with independent errors that happens about 0.9 percent of the time. The gold label is 99 percent accurate. A model is scored against that label, so a model that is 95 percent accurate against the truth scores about 95 percent against the gold set, well above the 82 percent that was supposed to be the ceiling, and it is not measuring noise. It is measuring its accuracy, against a label that is good enough to measure it.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Accuracy of a majority label against the number of annotators</title>
<desc id="f1-d">Three lines over one, three, five and seven annotators. With annotators 90 percent accurate the majority label rises from 90 to 97.2 to 99.1 to 99.7 percent. At 80 percent it rises from 80 to 89.6 to 94.2 to 96.7. At 70 percent it rises from 70 to 78.4 to 83.7 to 87.4.</desc>
<text x="0" y="18" class="viz-title">The majority is better than the people in it</text>
<text x="0" y="36" class="viz-sub">Majority-label accuracy, per cent, independent binary annotators</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">p = 0.9</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">p = 0.8</text>
<line x1="560" y1="31" x2="574" y2="31" class="viz-s3"/><text x="580" y="35" class="viz-label-muted">p = 0.7</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">90</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">80</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">70</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">60</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="237.3" y="288" text-anchor="middle" class="viz-tick">3</text>
<text x="418.7" y="288" text-anchor="middle" class="viz-tick">5</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">7</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Annotators per item, majority label</text>
<polyline points="56,108 237.3,70.6 418.7,60.7 600,57.6" class="viz-s1"/>
<polyline points="56,160 237.3,110.1 418.7,86.2 600,73.2" class="viz-s2"/>
<polyline points="56,212 237.3,168.3 418.7,140.8 600,121.5" class="viz-s3"/>
<circle cx="600" cy="57.6" r="4" class="viz-d1"/>
<circle cx="600" cy="73.2" r="4" class="viz-d2"/>
<circle cx="600" cy="121.5" r="4" class="viz-d3"/>
<text x="592" y="52" text-anchor="end" class="viz-value">99.7</text>
<text x="592" y="92" text-anchor="end" class="viz-value">96.7</text>
<text x="592" y="140" text-anchor="end" class="viz-value">87.4</text>
</svg>
<figcaption>Illustrative: computed from the binomial probability that a majority of k independent annotators is correct, at three per-annotator accuracies; the independence assumption is discussed below.</figcaption>
</figure>

## What the real datasets show

The pattern shows up in the datasets people actually train on. The SNLI corpus of [Bowman et al. (2015)](https://arxiv.org/abs/1508.05326) collected five labels for each item in its validation and test sets and reports that three of five annotators agreed on 98 percent of items while all five agreed on only 58.3 percent. Read the unanimous figure as the agreement ceiling and you would conclude that no model can score above the high fifties on SNLI. Models passed that years ago, because the gold label is the majority, and the majority exists on 98 percent of items.

The other direction matters too. A gold set is not perfect just because it was voted on, and its errors put a real ceiling on what a model can appear to do. Northcutt, Athalye and Mueller's [survey of test-set label errors](https://arxiv.org/abs/2103.14749) found that about 6 percent of the ImageNet validation set carries an incorrect label, 2,916 images. A model that is right about those images is scored as wrong, and a model that has learnt the errors is scored as right. The ceiling exists; it is the accuracy of the gold label, and it is a number you can raise with more annotators per item rather than with more items.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Agreement in SNLI and label errors in ImageNet</title>
<desc id="f2-d">Two horizontal bars for SNLI: items where at least three of five annotators agreed, 98 percent, and items where all five agreed, 58.3 percent. A third bar for ImageNet's validation set: about 6 percent of labels found to be errors.</desc>
<text x="0" y="18" class="viz-title">The majority exists where unanimity does not</text>
<text x="0" y="36" class="viz-sub">Per cent of items, two public datasets</text>
<line x1="220" y1="52" x2="220" y2="176" class="viz-axis"/>
<text x="210" y="73" text-anchor="end" class="viz-label">SNLI, 3 of 5 agree</text>
<path d="M220 58 H584 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H220 Z" class="viz-f1"/>
<text x="600" y="73" class="viz-value">98</text>
<text x="210" y="107" text-anchor="end" class="viz-label">SNLI, all 5 agree</text>
<path d="M220 92 H435.5 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H220 Z" class="viz-fgray"/>
<text x="451.5" y="107" class="viz-value">58.3</text>
<text x="210" y="141" text-anchor="end" class="viz-label">ImageNet val, label errors</text>
<path d="M220 126 H238.3 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H220 Z" class="viz-fgray"/>
<text x="254.3" y="141" class="viz-value">about 6</text>
<text x="0" y="204" class="viz-label-muted">The gold label's accuracy is the ceiling; unanimity is not.</text>
</svg>
<figcaption>Source: <a href="https://arxiv.org/abs/1508.05326">Bowman et al. (2015)</a> for the SNLI agreement figures; <a href="https://arxiv.org/abs/2103.14749">Northcutt et al. (2021)</a> for the ImageNet validation error estimate.</figcaption>
</figure>

## The agreement inversion

The practical tool is the inversion in the first section, which I use as a small table when budgeting a labelling job. Measure pairwise agreement on a pilot batch. Invert it to per-annotator accuracy. Then read off the majority-label accuracy for one, three, five and seven annotators per item, and pick the count that puts the gold label's accuracy comfortably above the accuracy you expect the model to reach. If you expect a model to hit 95 percent, a gold set that is 97 percent accurate is barely able to tell you so; at 99 percent it can. That decision fixes the annotators per item, and the budget follows.

The inversion says something else that is easy to miss: the way to raise the ceiling is more annotators per item, not more items. Ten thousand items with one label each have a ceiling equal to one annotator's accuracy, whatever that is, and no amount of additional single-labelled items moves it. Two thousand items with five labels each have a ceiling near 99 percent and enough items to measure most things. For evaluation sets in particular, the second design is almost always the right one.

<figure class="chart">
<svg viewBox="0 0 640 220" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Which pair each number compares</title>
<desc id="f3-d">Three boxes: annotator, majority label, and model. An arrow between two annotator boxes is labelled agreement rate. An arrow from the majority label to the model is labelled the model's score. A note says the two arrows compare different pairs, and that the majority label sits above any single annotator.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="40" width="150" height="56" rx="8" class="viz-box"/>
<text x="83" y="64" text-anchor="middle" class="viz-label">Annotator A</text>
<text x="83" y="82" text-anchor="middle" class="viz-label-muted">right 90% of the time</text>
<rect x="8" y="140" width="150" height="56" rx="8" class="viz-box"/>
<text x="83" y="164" text-anchor="middle" class="viz-label">Annotator B</text>
<text x="83" y="182" text-anchor="middle" class="viz-label-muted">right 90% of the time</text>
<line x1="83" y1="98" x2="83" y2="136" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="100" y="121" class="viz-tick">agreement: 82%</text>
<rect x="245" y="90" width="150" height="56" rx="8" class="viz-box-accent"/>
<text x="320" y="114" text-anchor="middle" class="viz-label">Majority of 5</text>
<text x="320" y="132" text-anchor="middle" class="viz-label-muted">right about 99%</text>
<line x1="160" y1="68" x2="241" y2="108" class="viz-arrow" marker-end="url(#f3-ah)"/>
<line x1="160" y1="168" x2="241" y2="128" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="482" y="90" width="150" height="56" rx="8" class="viz-box-ink"/>
<text x="557" y="114" text-anchor="middle" class="viz-on-ink">Model</text>
<text x="557" y="132" text-anchor="middle" class="viz-on-ink">scored vs the majority</text>
<line x1="397" y1="118" x2="478" y2="118" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="437" y="108" text-anchor="middle" class="viz-tick">score</text>
</svg>
<figcaption>Illustrative: the two comparisons the folk rule conflates; the numbers follow the worked example in the text.</figcaption>
</figure>

## A worked budget

The arithmetic turns into a budget in four lines. A pilot batch of 300 items, each labelled by two people, shows 82 percent agreement; inverted, that is annotators at 90 percent. The model the team hopes to ship should reach the mid-nineties, so the gold set needs to be better than that by a margin that leaves the measurement meaningful: 99 percent, say. From the chart, that is five annotators per item at 90 percent, or seven if the annotators turn out to be nearer 85. The evaluation set the team wanted, 2,000 items, therefore costs 10,000 labels rather than 2,000, and that number goes in the plan before anyone argues about it.

The alternative, 10,000 items with one label each, costs the same and is worth far less, because its ceiling is 90 percent and it cannot tell a 93 percent model from a 96 percent one. The same money buys a gold set that can, if it is spent on depth per item rather than breadth. That is the decision the inversion is for.

One caution on the formula's range. The inversion only makes sense when agreement is above 50 percent, because below that the annotators are agreeing less often than two coin flips would, and the assumption that they are each better than chance has already failed. A pilot in that range is not a budgeting problem. It is a guideline problem, and the fix is to rewrite the labelling instructions before hiring anyone.

## Where the arithmetic bends

The formula assumes that annotators err independently, and they do not always. When an item is genuinely ambiguous, everyone who reads it is likelier to make the same mistake, and adding annotators helps less than the binomial says. That is the honest limit of the argument, and it points at the right response: the items where five annotators split three to two are not noise to be voted away, they are a list of the cases where the labelling guideline is unclear, and they are worth more as a document than as labels.

It also assumes annotators of roughly equal quality. Real pools have a spread, and the standard remedy, weighting each annotator by their agreement with the majority on overlapping items, is a small model in its own right and works well. Both bends make the ceiling a little lower than the clean formula gives. Neither brings it anywhere near the pairwise agreement rate, which is where the folk rule put it.

## What it means for a data pipeline

SocialSure's training-data work involves labelling, and the rule I apply is short. Measure agreement on a pilot, invert it, and set the annotators per item from the accuracy the gold set needs to have, which is higher than the accuracy the model is expected to reach. Never quote pairwise agreement as a ceiling on model performance, because it is a ceiling on annotators compared with each other, and the model is not one of them. And keep the split items, because they are the cheapest guideline review you will ever get.

A model that scores above agreement is not measuring noise. It is measuring against a better judge than any single annotator, which is what a majority is for.
