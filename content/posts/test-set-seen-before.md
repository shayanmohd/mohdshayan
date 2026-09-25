---
title: Your test set has been seen before
date: 2025-05-03
summary: Near-duplicates across the split boundary are the commonest reason a held-out score is not a generalisation score. Dedupe before you split, and report the overlap next to accuracy.
tags: Data Pipelines, Evaluation, Deduplication
topic: ML Foundations
draft: false
---

A held-out test set is supposed to measure how a model does on data it has not seen. It measures that only if the test data really is unseen, and in most real datasets a surprising share of it is not: not identical to a training example, but close enough that the model has, in every sense that matters, seen it before. The split was random, the duplicates were in the source, and the random split preserved them on both sides of the line. The score that comes out is not a generalisation score. It is partly a memorisation score, and it is higher than the truth.

## How much of a test set is a sibling

The numbers on well-known datasets are not small. Barz and Denzler's [Do We Train on Test Data?](https://arxiv.org/abs/1902.00423) searched CIFAR for near-duplicates and found that 3.3 percent of CIFAR-10's test images and 10 percent of CIFAR-100's have a duplicate in the training set; when they replaced those images with fresh ones from the same domain, classification accuracy fell by between 9 and 14 percent relative to the reported figures. Lee and colleagues' [Deduplicating Training Data Makes Language Models Better](https://arxiv.org/abs/2107.06499) found the same structure in text: over 4 percent of the validation sets of standard language-modelling corpora had an approximate duplicate in the training data, including one 61-word sentence that appeared over sixty thousand times in C4.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of test or validation items with a near-duplicate in training</title>
<desc id="f1-d">Horizontal bars: CIFAR-10 test set 3.3 percent, CIFAR-100 test set 10 percent, C4 validation set about 4.6 percent. A note records the 9 to 14 percent relative accuracy drop measured on duplicate-free CIFAR test sets.</desc>
<text x="0" y="18" class="viz-title">Seen before, in three well-used datasets</text>
<text x="0" y="36" class="viz-sub">Per cent of held-out items with an approximate duplicate in the training split</text>
<line x1="176" y1="52" x2="176" y2="154" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">CIFAR-10 test</text>
<path d="M176 58 H303.6 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="323.6" y="73" class="viz-value">3.3%</text>
<text x="166" y="107" text-anchor="end" class="viz-label">CIFAR-100 test</text>
<path d="M176 92 H564 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="580" y="107" class="viz-value">10%</text>
<text x="166" y="141" text-anchor="end" class="viz-label">C4 validation</text>
<path d="M176 126 H354.5 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="374.5" y="141" class="viz-value">about 4.6%</text>
<text x="0" y="190" class="viz-label-muted">On duplicate-free CIFAR test sets, accuracy fell 9 to 14% relative to reported figures.</text>
<text x="0" y="222" class="viz-tick">the drop is the part of the score that was memorisation</text>
</svg>
<figcaption>Source: <a href="https://arxiv.org/abs/1902.00423">Barz and Denzler (2020)</a> for CIFAR; <a href="https://arxiv.org/abs/2107.06499">Lee et al. (2021)</a> for C4.</figcaption>
</figure>

Those are curated academic datasets, assembled by people who cared. A dataset scraped or collected inside a company is worse, and for reasons that are easy to name: the same page fetched twice on different days, an image and its thumbnail, a record and its retried submission, a document and the copy someone pasted into a ticket, an augmentation that was applied before the split instead of after. Every one of those puts a sibling on each side of the boundary, and a random split does not know.

## Dedupe before you split, and look for siblings

The fix has two halves, and the order is the important part. Deduplication has to happen before the split, because a split of a duplicated source is a duplicated split. And the deduplication has to look for near-duplicates, because exact hashing catches almost none of the cases above: the thumbnail is not byte-identical to the image, the retried record has a new timestamp, the pasted copy has different whitespace.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Two pipeline orders, and where the leak enters</title>
<desc id="f2-d">Top row: source, then a random split into train and test, then dedupe within each side; sibling pairs that straddle the boundary survive, marked as a leak. Bottom row: source, then near-duplicate dedupe across the whole set, then the split; no siblings straddle the boundary.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Order decides everything</text>
<text x="0" y="48" class="viz-tick">SPLIT, THEN DEDUPE</text>
<rect x="8" y="60" width="120" height="44" rx="8" class="viz-box"/><text x="68" y="87" text-anchor="middle" class="viz-label">Source</text>
<line x1="130" y1="82" x2="166" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="170" y="60" width="120" height="44" rx="8" class="viz-box"/><text x="230" y="87" text-anchor="middle" class="viz-label">Random split</text>
<line x1="292" y1="82" x2="328" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="332" y="60" width="140" height="44" rx="8" class="viz-box"/><text x="402" y="87" text-anchor="middle" class="viz-label">Dedupe each side</text>
<line x1="474" y1="82" x2="510" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="514" y="60" width="118" height="44" rx="8" class="viz-box-ink"/><text x="573" y="87" text-anchor="middle" class="viz-on-ink">siblings straddle</text>
<text x="0" y="148" class="viz-tick">DEDUPE, THEN SPLIT</text>
<rect x="8" y="160" width="120" height="44" rx="8" class="viz-box"/><text x="68" y="187" text-anchor="middle" class="viz-label">Source</text>
<line x1="130" y1="182" x2="166" y2="182" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="170" y="160" width="140" height="44" rx="8" class="viz-box-accent"/><text x="240" y="187" text-anchor="middle" class="viz-label">Near-dup dedupe</text>
<line x1="312" y1="182" x2="348" y2="182" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="352" y="160" width="120" height="44" rx="8" class="viz-box"/><text x="412" y="187" text-anchor="middle" class="viz-label">Random split</text>
<line x1="474" y1="182" x2="510" y2="182" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="514" y="160" width="118" height="44" rx="8" class="viz-box"/><text x="573" y="187" text-anchor="middle" class="viz-label">clean boundary</text>
<text x="320" y="240" text-anchor="middle" class="viz-label-muted">Deduplicating within each side after the split removes nothing that crosses it.</text>
</svg>
<figcaption>Illustrative: the two orders; only the second one can remove a pair that straddles the boundary.</figcaption>
</figure>

Near-duplicate detection is a solved problem at the scale most teams need. For text, minhash over shingles or embedding similarity with a threshold; for images, a perceptual hash or an embedding from a pretrained encoder; for records, a similarity over the fields that matter with the timestamps and identifiers stripped out. The threshold has to be chosen, and the honest way to choose it is to sample pairs at several thresholds and look at them: the level at which a person says "these are the same thing" is the level, and it is different for every dataset.

## Why the score moves so much

A few percent of siblings sounds like it should move the score by a few percent, and the CIFAR result says it moves it by more. The reason is that siblings are not a random sample of the test set. They are the items the model finds easiest, because it has effectively seen them, and they are concentrated in exactly the classes and regions where the model is otherwise weakest, because those are where the source had the most redundancy: rare classes padded with near-copies, hard cases collected twice. Remove them and the test set gets harder in the places that were propping up the number.

The other reason is what the siblings were doing during training. A near-duplicate of a test item in the training set is not only a free point at test time; it is a training example the model was rewarded for memorising, and a model that has learnt to memorise redundant items generalises a little worse on everything else. Lee and colleagues' result, that deduplicated training data produces models that memorise less and reach the same accuracy in fewer steps, is the training-side half of the same finding. The sibling in the test set inflates the score; the sibling in the training set depresses the model. Removing both is what the pipeline order buys.

## The sibling scan

Deduplication before the split is a pipeline habit, and habits lapse. What keeps the habit honest is a measurement that runs every time and reports next to accuracy, and the one I use is what I call the sibling scan. Before any metric is read, embed or hash every item in the test set and every item in the training set, find each test item's nearest training neighbour, and report the fraction of test items whose nearest neighbour is above the similarity cutoff. That fraction is the sibling rate, and it sits on the evaluation report as a first-class number beside the score it qualifies.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The sibling scan as a nearest-neighbour join across the boundary</title>
<desc id="f3-d">Two columns of items, training on the left and test on the right. Each test item has an arrow to its nearest training neighbour with a similarity value. Two test items with similarity above the cutoff are marked as siblings. Below, the report line reads: accuracy 94.1 percent, sibling rate 6.2 percent above the cutoff.</desc>
<text x="0" y="18" class="viz-title">Every test item, and its closest relative in training</text>
<text x="80" y="52" text-anchor="middle" class="viz-tick">TRAINING</text>
<text x="560" y="52" text-anchor="middle" class="viz-tick">TEST</text>
<rect x="30" y="64" width="100" height="26" rx="5" class="viz-box"/><text x="80" y="82" text-anchor="middle" class="viz-label-muted">item 1</text>
<rect x="30" y="98" width="100" height="26" rx="5" class="viz-box"/><text x="80" y="116" text-anchor="middle" class="viz-label-muted">item 2</text>
<rect x="30" y="132" width="100" height="26" rx="5" class="viz-box"/><text x="80" y="150" text-anchor="middle" class="viz-label-muted">item 3</text>
<rect x="30" y="166" width="100" height="26" rx="5" class="viz-box"/><text x="80" y="184" text-anchor="middle" class="viz-label-muted">item 4</text>
<rect x="510" y="64" width="100" height="26" rx="5" class="viz-box"/><text x="560" y="82" text-anchor="middle" class="viz-label-muted">test a</text>
<rect x="510" y="115" width="100" height="26" rx="5" class="viz-box-accent"/><text x="560" y="133" text-anchor="middle" class="viz-label-muted">test b</text>
<rect x="510" y="166" width="100" height="26" rx="5" class="viz-box"/><text x="560" y="184" text-anchor="middle" class="viz-label-muted">test c</text>
<line x1="508" y1="77" x2="132" y2="145" class="viz-sgray"/><text x="320" y="100" text-anchor="middle" class="viz-tick">0.41</text>
<line x1="508" y1="128" x2="132" y2="111" class="viz-s1"/><text x="400" y="140" text-anchor="middle" class="viz-value">0.97: sibling</text>
<line x1="508" y1="179" x2="132" y2="179" class="viz-sgray"/><text x="320" y="172" text-anchor="middle" class="viz-tick">0.52</text>
<line x1="0" y1="212" x2="640" y2="212" class="viz-axis"/>
<text x="0" y="240" class="viz-label">Report: accuracy 94.1%, sibling rate 6.2% above the cutoff of 0.9</text>
</svg>
<figcaption>Illustrative: the join and the report line; the similarity values and rates are made up for the drawing.</figcaption>
</figure>

The report line is the point. An accuracy with a sibling rate beside it is a score that can be read: 94 percent with 6 percent siblings is a model whose true held-out accuracy is somewhat lower than 94 and whose evaluation set needs cleaning. An accuracy with no sibling rate is a number whose meaning depends on a pipeline habit nobody can see. The scan costs a nearest-neighbour search over the test set, which for any evaluation set a team actually uses is seconds, and it has caught leaks in pipelines that had been deduplicating carefully, because the deduplication had been happening after the split.

## Where the cutoff comes from

The cutoff has two honest sources, and I use both. The first is a small hand-labelled sample: draw pairs across a range of similarities, have a person say which are the same thing, and put the cutoff where the answers flip. The second is the random-pair baseline of the embedding model itself, the similarity that unrelated items have under this model on this data, which I wrote about in [the post on similarity thresholds](/blog/similarity-threshold-has-no-zero/): a cutoff well above that baseline is a cutoff that means something, and a cutoff copied from another dataset is a cutoff that means whatever that dataset's baseline meant.

SocialSure's training-data work is where this habit lives for me, and the reason it lives there is simple. A pipeline that assembles data from scrapes, from customer uploads and from augmentation produces siblings at every stage, and the first time a model scored suspiciously well on a held-out set was the last time the held-out set was trusted without a sibling rate next to it. The score is not the measurement. The score and the overlap together are.
