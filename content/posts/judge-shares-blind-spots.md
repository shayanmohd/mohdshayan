---
title: The judge shares the defendant's blind spots
date: 2025-04-20
summary: An LLM judge is trained on nearly the same data as the model it grades, so their errors are correlated. Judge scores inflate on the hard items; sample the calibration set there.
tags: Evaluation, LLM-as-Judge
draft: false
---

Using one language model to grade another is now the default way to evaluate anything that does not have a single right answer, and it works well enough on average that the average has become the whole story. It should not be. A judge model is trained on nearly the same data as the model it grades, by nearly the same methods, toward nearly the same objective, and so its errors are not independent of the generator's. Where the generator is confidently wrong, the judge is likely to be wrong in the same way, for the same reason, and to give the wrong answer a high score. The measured accuracy is therefore inflated exactly on the items that matter, the hard ones, and the small human-labelled sample that is supposed to calibrate the judge will miss the inflation unless it is drawn deliberately from where the inflation lives.

## The average is fine

The evidence for judges is real. Zheng and colleagues, in [the MT-Bench and Chatbot Arena paper](https://arxiv.org/abs/2306.05685), found that a strong judge agreed with human preferences over 80 percent of the time, a level that matched how often humans agreed with each other, and they named the biases they found on the way: a preference for the first of two answers, a preference for longer answers, a preference for the judge's own style, and limited ability to grade reasoning. Every subsequent judge-based evaluation leans on that 80 percent, and it is an honest number. It is also an average over items of every difficulty, and averages are where correlated errors hide.

<figure class="chart">
<svg viewBox="0 0 640 380" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Generator right or wrong against judge right or wrong, with the dangerous cell marked</title>
<desc id="f1-d">A two by two grid. Rows: the generator's answer is right or wrong. Columns: the judge's verdict is right or wrong. Top left, generator right and judge right: counted correctly. Bottom right, generator wrong and judge says wrong: counted correctly. Top right, generator right and judge says wrong: a visible miss that lowers the score. Bottom left, generator wrong and judge says right: the dangerous cell, an invisible inflation, and the one that correlated errors fill.</desc>
<text x="0" y="18" class="viz-title">The cell you cannot see from the score</text>
<text x="200" y="52" text-anchor="middle" class="viz-tick">JUDGE SAYS RIGHT</text>
<text x="464" y="52" text-anchor="middle" class="viz-tick">JUDGE SAYS WRONG</text>
<rect x="56" y="60" width="544" height="280" rx="8" class="viz-box"/>
<line x1="328" y1="60" x2="328" y2="340" class="viz-grid"/>
<line x1="56" y1="200" x2="600" y2="200" class="viz-grid"/>
<text x="20" y="130" transform="rotate(-90 20 130)" text-anchor="middle" class="viz-tick">GENERATOR RIGHT</text>
<text x="20" y="270" transform="rotate(-90 20 270)" text-anchor="middle" class="viz-tick">GENERATOR WRONG</text>
<text x="192" y="120" text-anchor="middle" class="viz-label">counted correctly</text>
<text x="192" y="142" text-anchor="middle" class="viz-label-muted">right answer, right verdict</text>
<text x="464" y="120" text-anchor="middle" class="viz-label">a visible miss</text>
<text x="464" y="142" text-anchor="middle" class="viz-label-muted">lowers the score; someone will look</text>
<rect x="64" y="208" width="256" height="124" rx="8" class="viz-box-accent"/>
<text x="192" y="250" text-anchor="middle" class="viz-label">invisible inflation</text>
<text x="192" y="272" text-anchor="middle" class="viz-label-muted">wrong answer, high score</text>
<text x="192" y="294" text-anchor="middle" class="viz-tick">where correlated errors go</text>
<text x="464" y="260" text-anchor="middle" class="viz-label">counted correctly</text>
<text x="464" y="282" text-anchor="middle" class="viz-label-muted">wrong answer, caught</text>
<text x="320" y="368" text-anchor="middle" class="viz-label-muted">If both models fail on the same items, the highlighted cell fills and the score hides it.</text>
</svg>
<figcaption>Illustrative: the four outcomes of judging one answer; the score is computed from the left column and cannot tell its two cells apart.</figcaption>
</figure>

The grid shows why. A judge's error can go two ways. It can mark a right answer wrong, which lowers the score, gets noticed, and gets investigated. Or it can mark a wrong answer right, which raises the score and is invisible, because the score is exactly the count of the left column and nothing in it distinguishes the top cell from the bottom. Independent errors would fill the bottom-left cell at random, in proportion to the judge's overall error rate, and a random human sample would catch them. Correlated errors fill it systematically, on the items where both models share a misconception, and a random sample rarely lands there because those items are a small fraction of the whole.

## Why the errors are correlated

The correlation has a documented mechanism. Panickssery, Bowman and Feng showed in [LLM Evaluators Recognize and Favor Their Own Generations](https://arxiv.org/abs/2404.13076) that a judge scores its own outputs higher than others' while humans rate them equal, and that the strength of this self-preference is linearly related to how well the judge can recognise its own output, a relationship they established by manipulating the recognition ability directly. Self-preference is the sharpest case of a general one. A judge and a generator that share pretraining data share the errors in that data; ones that share a fine-tuning recipe share the stylistic tells that recipe produces; ones that share an architecture share the reasoning failures the architecture has. The judge does not need to be the same model as the generator for the errors to correlate. It needs to have learned the world the same way.

I call the failure mode correlated blindness: judge and generator fail on the same items for the same reason. Its signature is a confident, fluent, wrong answer that the judge reads as confident, fluent and right, and the reason it is dangerous is that confidence and fluency are precisely the surface features a judge uses when it cannot verify the substance. On an easy item the judge can verify, and correlation does not matter. On a hard item it cannot, and it falls back to the features it shares with the generator.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Measured accuracy against true accuracy as the error correlation between judge and generator rises, from a stated toy model</title>
<desc id="f2-d">Lines showing measured accuracy against true accuracy for three levels of error correlation. With independent errors, measured accuracy tracks true accuracy closely. With moderate correlation, measured accuracy sits above the diagonal, most of all in the middle of the range. With high correlation, measured accuracy stays high even as true accuracy falls, so a generator that is right half the time can score near eighty percent.</desc>
<text x="0" y="18" class="viz-title">The more the two models share, the less the score can fall</text>
<text x="0" y="36" class="viz-sub">Judge-measured against true accuracy, three error correlations</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">50%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">50%</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">100%</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">True accuracy of the generator</text>
<line x1="56" y1="264" x2="600" y2="56" class="viz-sgray"/>
<polyline points="56,243 192,193 328,145 464,99 600,56" class="viz-s2"/>
<polyline points="56,222 192,166 328,122 464,86 600,56" class="viz-s1"/>
<polyline points="56,180 192,130 328,97 464,72 600,56" class="viz-s4"/>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s2"/><text x="400" y="35" class="viz-label-muted">independent</text>
<line x1="490" y1="31" x2="504" y2="31" class="viz-s1"/><text x="510" y="35" class="viz-label-muted">moderate</text>
<line x1="560" y1="31" x2="574" y2="31" class="viz-s4"/><text x="580" y="35" class="viz-label-muted">high</text>
<circle cx="328" cy="97" r="5" class="viz-d4"/>
<text x="318" y="92" text-anchor="end" class="viz-value">half right, scored near 80</text>
<text x="592" y="250" text-anchor="end" class="viz-tick">grey diagonal: a perfect judge</text>
</svg>
<figcaption>Illustrative: a toy model in which the judge has a fixed error rate and a stated fraction of its errors fall on the generator's wrong answers; the curves are constructed to show the shape and are not measurements.</figcaption>
</figure>

## The agreement-weighted sample

The standard defence is a human-labelled calibration set: label a few hundred items by hand, compare the judge's verdicts to the labels, and report the judge's accuracy as the confidence in its scores. That defence assumes the calibration set samples the failure mode, and a random sample does not. The correlated errors live in one cell, wrong answer with a high judge score, and within that cell they concentrate on the items where the generator was confident, because confident wrong answers are the ones that share the judge's blind spot. A random sample of a few hundred items from a set where most answers are right lands in that region a handful of times.

So the calibration sample should be weighted toward it. I call this the agreement-weighted sample: human-label a set drawn preferentially from items where the judge scored high and the generator was confident, since that is the cell where correlated errors hide and the cell random sampling rarely reaches. The weighting is not subtle; it can be as simple as taking every item where the judge gave a top score and the generator's own confidence was in its top quartile, and labelling as many of those as the budget allows, with a smaller random slice for comparison. The judge's accuracy on that weighted set is the number that says whether its scores on hard items can be believed, and it is usually lower than the accuracy on the random set, which is the point.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Where a random calibration sample lands against where the agreement-weighted sample is drawn</title>
<desc id="f3-d">Two panels over the same population of graded items, drawn as a field with a small dense region in one corner representing confident, high-scored, wrong answers. In the left panel, random sample points are scattered evenly and almost none fall in the dense region. In the right panel, the sample is concentrated in the region where the judge scored high and the generator was confident, so the dense region is covered.</desc>
<text x="0" y="18" class="viz-title">Sample where the errors hide, not where the items are</text>
<text x="8" y="52" class="viz-tick">RANDOM SAMPLE</text>
<rect x="8" y="60" width="300" height="180" rx="8" class="viz-box"/>
<rect x="230" y="176" width="70" height="56" rx="6" class="viz-box-accent"/>
<text x="222" y="176" text-anchor="end" class="viz-tick">confident,</text>
<text x="222" y="192" text-anchor="end" class="viz-tick">scored high, wrong</text>
<circle cx="40" cy="90" r="3" class="viz-dgray"/><circle cx="110" cy="140" r="3" class="viz-dgray"/><circle cx="180" cy="80" r="3" class="viz-dgray"/><circle cx="70" cy="200" r="3" class="viz-dgray"/><circle cx="150" cy="180" r="3" class="viz-dgray"/><circle cx="220" cy="120" r="3" class="viz-dgray"/><circle cx="260" cy="90" r="3" class="viz-dgray"/><circle cx="120" cy="100" r="3" class="viz-dgray"/><circle cx="200" cy="210" r="3" class="viz-dgray"/><circle cx="90" cy="160" r="3" class="viz-dgray"/><circle cx="240" cy="150" r="3" class="viz-dgray"/><circle cx="60" cy="120" r="3" class="viz-dgray"/>
<text x="332" y="52" class="viz-tick">AGREEMENT-WEIGHTED SAMPLE</text>
<rect x="332" y="60" width="300" height="180" rx="8" class="viz-box"/>
<rect x="554" y="176" width="70" height="56" rx="6" class="viz-box-accent"/>
<circle cx="565" cy="190" r="3" class="viz-d1"/><circle cx="580" cy="205" r="3" class="viz-d1"/><circle cx="600" cy="188" r="3" class="viz-d1"/><circle cx="612" cy="212" r="3" class="viz-d1"/><circle cx="570" cy="222" r="3" class="viz-d1"/><circle cx="595" cy="224" r="3" class="viz-d1"/><circle cx="540" cy="160" r="3" class="viz-d1"/><circle cx="520" cy="200" r="3" class="viz-d1"/><circle cx="500" cy="170" r="3" class="viz-d1"/><circle cx="470" cy="140" r="3" class="viz-dgray"/><circle cx="400" cy="100" r="3" class="viz-dgray"/><circle cx="360" cy="180" r="3" class="viz-dgray"/>
<text x="320" y="270" text-anchor="middle" class="viz-label-muted">The corner is where judge and generator fail together; only the second sample reaches it.</text>
</svg>
<figcaption>Illustrative: the two sampling schemes over one population of graded items; the corner is the cell of the first figure that correlated errors fill.</figcaption>
</figure>

Two practical notes on building the weighted set. The generator's confidence is not always exposed as a number, and when it is not, a proxy works: the absence of hedging language in the answer, or agreement between several samples of the same answer, both of which track the confident-wrong failure well enough to weight by. And the judge's own confidence can be used the same way in reverse, by preferring items where the judge's score was high but its stated reasoning was thin, which is a cheap signal that it graded on surface features. Neither proxy needs to be exact. The sample only has to land in the corner more often than a random one does, and a random one lands there almost never.

## Applying it to a helpdesk evaluation

The place I reason about this concretely is a helpdesk assistant's evaluation set, where a judge grades answers for correctness and grounding against retrieved documents. The generator's confident wrong answers are the ones that read like the documentation, cite a plausible section and state a procedure that does not exist. The judge, which learned what documentation sounds like from the same corpus, is exactly as fooled by that as the generator was, and it scores the answer high. A random calibration sample of two hundred items, from a set where the assistant is right most of the time, finds two or three of those. The weighted sample, drawn from items with a top judge score and a confident generator, finds them at a rate that says something, and the honest evaluation reports both numbers: the judge's accuracy overall, and its accuracy on the weighted set, with the second labelled as the confidence you should have in the scores on hard questions.

The rule generalises. Any time one model grades another, ask what they share, assume their errors are correlated in proportion to it, and draw the human sample from the cell where correlated errors accumulate. The 80 percent is true. It is just not the number that describes the answers you are most worried about.
