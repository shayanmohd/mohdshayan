---
title: Your similarity threshold has no zero
date: 2025-09-01
summary: A cosine threshold of 0.8 is not 80 percent of anything. Every embedding model puts unrelated text at its own baseline, and a threshold only means something measured above it.
tags: Embeddings, Vector Search, RAG
topic: ML Foundations
draft: false
---

Somewhere in most retrieval pipelines there is a line like `if score < 0.8: skip`, and somewhere in most teams there is a belief that 0.8 means something. It does not. Cosine similarity between two embeddings is a number between minus one and one in theory, and in practice, for any given model, it lives in a narrow band whose floor is nowhere near zero. Unrelated sentences do not score zero. They score whatever that model's baseline is, and the baseline is different for every model, every fine-tune and every domain. A threshold copied from a tutorial, or carried across a model upgrade, is wrong by an offset nobody measured.

## Why unrelated text is not orthogonal

The reason is a property of learned representations that has been documented since the first contextual models. Ethayarajh's [study of contextualised representations](https://arxiv.org/abs/1909.00512) found that they are not isotropic in any layer of the models examined: rather than spreading evenly across the space, the vectors cluster in a narrow cone, sharing a common direction. Two representations that have nothing to do with each other still point roughly the same way, so their cosine similarity is positive, often substantially so, before any meaning is involved at all.

Sentence embedding models inherit the same shape. The models are trained so that related pairs land closer than unrelated pairs, which is the property retrieval needs, but nothing in the training objective requires unrelated pairs to land at zero. They land where the cone puts them. On one model, random pairs of chunks from a corpus might average 0.3; on another, 0.6; on a third, the same model after a domain fine-tune, somewhere else again. The relevant pairs sit above that, in a band that overlaps the random band more than anyone likes.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Two similarity distributions from one model on one corpus</title>
<desc id="f1-d">Two overlapping histograms of cosine similarity. Random pairs of chunks cluster around 0.45 with a spread of about 0.08. Labelled relevant pairs cluster around 0.72 with a wider spread. A vertical marker at 0.8 shows a threshold that sits above most relevant pairs, and a second marker at 0.61, two standard deviations above the random mean, shows the threshold this post proposes.</desc>
<text x="0" y="18" class="viz-title">The stranger score and the pairs you want</text>
<text x="0" y="36" class="viz-sub">Cosine similarity, one model, one corpus; an illustrative shape</text>
<rect x="380" y="24" width="12" height="12" rx="3" class="viz-fgray"/><text x="398" y="35" class="viz-label-muted">random pairs</text>
<rect x="500" y="24" width="12" height="12" rx="3" class="viz-f1"/><text x="518" y="35" class="viz-label-muted">relevant pairs</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0.2</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">0.4</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">0.6</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">0.8</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">1.0</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Cosine similarity</text>
<rect x="158" y="230" width="18" height="34" class="viz-fgray"/>
<rect x="178" y="180" width="18" height="84" class="viz-fgray"/>
<rect x="198" y="110" width="18" height="154" class="viz-fgray"/>
<rect x="218" y="70" width="18" height="194" class="viz-fgray"/>
<rect x="238" y="96" width="18" height="168" class="viz-fgray"/>
<rect x="258" y="160" width="18" height="104" class="viz-fgray"/>
<rect x="278" y="222" width="18" height="42" class="viz-fgray"/>
<rect x="298" y="250" width="18" height="14" class="viz-fgray"/>
<rect x="318" y="244" width="18" height="20" class="viz-f1"/>
<rect x="338" y="214" width="18" height="50" class="viz-f1"/>
<rect x="358" y="178" width="18" height="86" class="viz-f1"/>
<rect x="378" y="150" width="18" height="114" class="viz-f1"/>
<rect x="398" y="134" width="18" height="130" class="viz-f1"/>
<rect x="418" y="150" width="18" height="114" class="viz-f1"/>
<rect x="438" y="182" width="18" height="82" class="viz-f1"/>
<rect x="458" y="214" width="18" height="50" class="viz-f1"/>
<rect x="478" y="240" width="18" height="24" class="viz-f1"/>
<rect x="498" y="254" width="18" height="10" class="viz-f1"/>
<line x1="464" y1="56" x2="464" y2="264" class="viz-s4"/>
<text x="458" y="70" text-anchor="end" class="viz-label-muted">0.8, copied from a tutorial</text>
<line x1="335" y1="56" x2="335" y2="264" class="viz-s2"/>
<text x="329" y="90" text-anchor="end" class="viz-label-muted">stranger score + 2 sd</text>
</svg>
<figcaption>Illustrative: the shape of the two distributions as they typically appear; the numbers are drawn to show the argument, and the point of the post is that you measure yours.</figcaption>
</figure>

## The stranger score

The fix is one measurement, and I do it before setting any threshold. Sample a few thousand random pairs of chunks from your own corpus, embed them with the model you actually run, and record the mean and standard deviation of their cosine similarity. That mean is the stranger score: what two chunks that have nothing to do with each other look like, under this model, on this data. Every threshold in the system is then written as "k standard deviations above the stranger score", and the rule I enforce in review is that a threshold not written that way does not get merged.

Writing thresholds relative to the baseline does three things at once. It makes them portable across model swaps, because the k survives even though the raw number does not. It makes them meaningful to read: 2.5 standard deviations above strangers says what the author intended, 0.8 says nothing. And it forces the measurement that everyone was skipping, which is the part that actually catches problems.

The measurement itself is a few lines and runs in a minute on a corpus of tens of thousands of chunks. Pick pairs at random rather than adjacent ones, because adjacent chunks share a document and are not strangers. Use the same normalisation the query path uses, because a model that expects unit vectors gives different numbers if you forget. And store the result next to the index, dated and tagged with the model id, so that the next person can see what baseline the thresholds were written against.

```python
idx = rng.choice(len(vecs), size=(5000, 2))
idx = idx[idx[:, 0] != idx[:, 1]]
sims = (vecs[idx[:, 0]] * vecs[idx[:, 1]]).sum(axis=1)   # unit vectors
stranger_mean, stranger_sd = sims.mean(), sims.std()
threshold = stranger_mean + k * stranger_sd
```

One more thing the number is not. It is not a substitute for top-k. Retrieval usually asks for the k best chunks and then applies a threshold to drop the ones that are not good enough, and the two controls answer different questions: k bounds the cost of the prompt, the threshold bounds the noise in it. A pipeline with only a threshold sends the model forty chunks on a broad question and none on a narrow one. A pipeline with only top-k sends five chunks whether or not any of them is relevant, which is how an assistant ends up citing a passage about the wrong product with complete confidence. Both controls belong in the pipeline, and only one of them has a baseline problem.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Embeddings live in a cone, and a threshold is a shell above its floor</title>
<desc id="f2-d">A quarter circle representing the unit sphere with a narrow cone of embedding vectors drawn inside it, all pointing in roughly the same direction. The floor of the cone is labelled the stranger score. A shell drawn a fixed angular distance above the floor is labelled the threshold. A second, differently shaped cone for another model shows that the same raw number would fall in a different place.</desc>
<text x="0" y="18" class="viz-title">Where a threshold actually sits</text>
<text x="0" y="36" class="viz-sub">Two models, the same raw threshold, different meanings</text>
<path d="M60 344 A284 284 0 0 1 344 60" fill="none" class="viz-axis"/>
<line x1="60" y1="344" x2="344" y2="60" class="viz-grid"/>
<path d="M60 344 L316 108 A284 284 0 0 1 344 60 Z" class="viz-f1" fill-opacity="0.2"/>
<line x1="60" y1="344" x2="316" y2="108" class="viz-s1"/>
<line x1="60" y1="344" x2="344" y2="60" class="viz-s1"/>
<text x="352" y="56" class="viz-label">Model A's cone</text>
<text x="352" y="116" class="viz-label-muted">floor = stranger score</text>
<path d="M60 344 A284 284 0 0 1 60 60" fill="none" class="viz-grid"/>
<path d="M60 344 L100 74 A284 284 0 0 1 60 60 Z" class="viz-f2" fill-opacity="0.2"/>
<line x1="60" y1="344" x2="100" y2="74" class="viz-s2"/>
<line x1="60" y1="344" x2="60" y2="60" class="viz-s2"/>
<text x="110" y="70" class="viz-label">Model B's cone</text>
<circle cx="60" cy="344" r="5" class="viz-dgray"/>
<text x="72" y="368" class="viz-label-muted">origin</text>
<text x="380" y="240" class="viz-label-muted">The same raw cosine sits at a</text>
<text x="380" y="260" class="viz-label-muted">different height above each floor.</text>
<text x="380" y="292" class="viz-label-muted">Written as k standard deviations</text>
<text x="380" y="312" class="viz-label-muted">above the floor, it means the same</text>
<text x="380" y="332" class="viz-label-muted">thing in both.</text>
</svg>
<figcaption>Illustrative: a two-dimensional sketch of the anisotropy described by <a href="https://arxiv.org/abs/1909.00512">Ethayarajh (2019)</a>; real embeddings have hundreds of dimensions and the cone is a picture, not a measurement.</figcaption>
</figure>

## What the measurement catches

Three failures, in my experience, and all three are silent without it.

The model swap. A team upgrades from one embedding model to a newer one, re-embeds the corpus, and keeps the threshold. The new model's stranger score is lower, so the old threshold now admits pairs that are two standard deviations above strangers instead of four, and retrieval quietly gets noisier. Or the score is higher and the threshold now excludes nearly everything, and the assistant starts declining questions it used to answer. Nobody changed the threshold, so nobody looks at it.

The domain shift. The same model, but the corpus changes from product documentation to support tickets. Tickets are shorter, more repetitive and full of the same identifiers, so random pairs of them look more alike; the stranger score rises and a threshold set on the documentation is now too permissive. The pgvector [distance operators](https://github.com/pgvector/pgvector) and the sentence-transformers [similarity utilities](https://www.sbert.net/) will compute whatever you ask of them and will never tell you that the baseline moved.

The mixed index. Two corpora with different stranger scores in one index, one threshold across both. This one is common in helpdesk systems, where procedure manuals, ticket histories and product pages are embedded into the same collection because that was the simplest thing to do on the day. Every query is now evaluated against two different baselines at once, and the results from the corpus with the higher floor crowd out the other. The measurement per corpus is what shows you the floors differ, and the fix is either separate thresholds or separate indexes.

## What it does not fix

The stranger score is a baseline, not a relevance model. It tells you where unrelated pairs sit; it does not tell you where the relevant pairs sit, and the two distributions overlap. It also says nothing about direction: two chunks can be far above the baseline because they share a rare identifier, a product code or a customer name, and be about entirely different things. Lexical overlap of that kind is exactly what dense models are worst at distinguishing from meaning, which is why the labelled relevant set is not optional. Setting k requires the second distribution too: a few hundred labelled relevant pairs from your own data, so that you can see how much of the relevant band a given k keeps and how much of the random band it admits. That labelled set is the same one you need for any retrieval evaluation, so it is not extra work. It is the work, and the stranger score is the first thing to compute from it.

When I was tuning retrieval for the helpdesk assistant at CRIS, retrieval depth was the parameter that got the attention, and the threshold was the parameter that got copied. In hindsight the threshold was the more dangerous of the two, precisely because it looked like a number with a meaning. It has one, but the meaning is relative, and the zero it seems to be measured from does not exist.
