---
title: The number that grows before the loss spikes
date: 2025-07-28
summary: Loss spikes in transformer runs are preceded by growth of the largest attention logit. QK-norm, z-loss and QK-clip bound that quantity, so log it rather than waiting for the loss.
tags: Training Dynamics, Transformers, Numerics
topic: ML Foundations
draft: false
---

A loss spike in a transformer training run looks like an accident. The curve is descending, then in a few hundred steps it jumps, sometimes recovers, sometimes never does, and the post-mortem blames the learning rate, the data, the precision, or bad luck. It is rarely an accident. In the runs where the mechanism has been studied, the spike is the visible end of a process that started long before: the largest attention logit, the dot product of a query and a key divided by the square root of the head dimension, drifted upward until the softmax that consumes it saturated, and a saturated softmax passes back a gradient that is either nothing or enormous. The loss is the last thing to move. The logit moved first, and it was loggable the whole time.

## The mechanism

Attention takes a query vector and a set of key vectors, computes their dot products, scales, and pushes the result through a softmax to get weights. The softmax is well behaved when the logits are of moderate size and badly behaved when one logit is much larger than the rest, because the weights then collapse onto that one key and the gradient with respect to every other key goes to zero, while the gradient with respect to the winning logit itself can become large and erratic. Nothing in the standard architecture bounds the size of the logits. The query and key projections are linear layers, and if their weights grow, or the residual stream feeding them grows, the logits grow with them, quadratically, since both factors of the dot product scale.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The attention path from query and key to output logits, with the three fixes marked where each clamps</title>
<desc id="f1-d">A flow: the residual stream feeds query and key projections; their dot product scaled by the square root of the head dimension gives attention logits; softmax gives weights; weights times values give the output; and later the final layer produces output logits. QK-norm is marked at the query and key vectors, normalising them before the dot product. QK-clip is marked at the projection weights, rescaling them when the logit exceeds a threshold. Z-loss is marked at the output logits, penalising the log partition function.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Three fixes, one quantity</text>
<rect x="8" y="70" width="100" height="56" rx="8" class="viz-box"/><text x="58" y="94" text-anchor="middle" class="viz-label">q, k</text><text x="58" y="112" text-anchor="middle" class="viz-label-muted">projections</text>
<line x1="110" y1="98" x2="132" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="136" y="70" width="120" height="56" rx="8" class="viz-box-accent"/><text x="196" y="94" text-anchor="middle" class="viz-label">q dot k</text><text x="196" y="112" text-anchor="middle" class="viz-label-muted">over root d</text>
<line x1="258" y1="98" x2="280" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="284" y="70" width="100" height="56" rx="8" class="viz-box"/><text x="334" y="94" text-anchor="middle" class="viz-label">softmax</text><text x="334" y="112" text-anchor="middle" class="viz-label-muted">saturates</text>
<line x1="386" y1="98" x2="408" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="412" y="70" width="100" height="56" rx="8" class="viz-box"/><text x="462" y="94" text-anchor="middle" class="viz-label">output</text><text x="462" y="112" text-anchor="middle" class="viz-label-muted">weights times v</text>
<line x1="514" y1="98" x2="536" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="540" y="70" width="92" height="56" rx="8" class="viz-box"/><text x="586" y="94" text-anchor="middle" class="viz-label">final</text><text x="586" y="112" text-anchor="middle" class="viz-label-muted">logits</text>
<circle cx="58" cy="150" r="7" class="viz-d1"/><text x="72" y="154" class="viz-label-muted">QK-clip: rescale the projection weights</text>
<circle cx="58" cy="182" r="7" class="viz-d2"/><text x="72" y="186" class="viz-label-muted">QK-norm: normalise q and k before the dot product</text>
<circle cx="58" cy="214" r="7" class="viz-d4"/><text x="72" y="218" class="viz-label-muted">z-loss: penalise the log partition of the final logits</text>
<text x="320" y="262" text-anchor="middle" class="viz-label-muted">Each fix bounds a logit that would otherwise grow; the softmax is where it hurts.</text>
<text x="320" y="286" text-anchor="middle" class="viz-tick">the quantity to log is the maximum of q dot k over root d, per layer</text>
</svg>
<figcaption>Illustrative: the attention path with the three interventions placed where each acts; the z-loss acts on the output softmax rather than the attention softmax, and bounds the same failure at a different layer.</figcaption>
</figure>

Wortsman and colleagues made this reproducible at small scale in [Small-scale proxies for large-scale transformer training instabilities](https://arxiv.org/abs/2309.14322): the instability that large runs hit appears in small models trained at high learning rates, the growth of attention logits is one of its two documented sources, and the same mitigations that work at scale work in the small proxies, which is what makes the mechanism testable on a single machine. Their most useful finding for a practitioner is that the instability can be predicted before it emerges, from the scaling behaviour of activation and gradient norms, which is the same claim as this post's in more general form: the numbers that move first are not the loss.

## How large is too large

The threshold at which a softmax saturates is a matter of arithmetic, and it depends on the context length. With n keys and a gap g between the largest logit and the rest, the weight on the largest key is about one over one plus n times e to the minus g, and the total weight left for every other key is about n times e to the minus g. Saturation, in the sense that the other keys together receive less than some small fraction ε, happens when g exceeds the natural log of n over ε. For a thousand keys and ε of one in a thousand, that is a gap of about 14; for a context of 128,000 and the same ε, about 19. A maximum logit in the twenties, with typical logits near zero, means the softmax has already stopped distributing gradient.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Logit gap at which a softmax leaves less than one part in a thousand for all other keys, by context length</title>
<desc id="f2-d">A slowly rising line against context length on a log scale from 512 to 131,072: the saturating gap is the natural log of n over epsilon, about 13.1 at 512 keys, 13.8 at 1,024, 15.2 at 4,096, 16.6 at 16,384, 18 at 65,536 and 18.7 at 131,072. The line is nearly flat, which is the point: a maximum logit in the high teens saturates attention at any modern context length.</desc>
<text x="0" y="18" class="viz-title">A gap in the high teens saturates attention at any context length</text>
<text x="0" y="36" class="viz-sub">Gap between the largest logit and the rest at which other keys share under 0.1 percent</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">20</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">17.5</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">15</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">12.5</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">10</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">512</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">2k</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">8k</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">32k</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">128k</text>
<polyline points="56,199.5 124,185.1 192,170.7 260,156.2 328,141.8 396,127.4 464,113 532,98.6 600,84.2" class="viz-s1"/>
<circle cx="56" cy="199.5" r="4" class="viz-d1"/><text x="64" y="216" class="viz-value">13.1</text>
<circle cx="600" cy="84.2" r="4" class="viz-d1"/><text x="592" y="78" text-anchor="end" class="viz-value">18.7</text>
</svg>
<figcaption>Illustrative: derived from the softmax, the gap g at which n times e to the minus g equals 0.001, plotted against n; the derivation is in the text.</figcaption>
</figure>

That derivation gives the logit runaway check its threshold. Log, every N steps and per layer, the maximum over the batch of the scaled query-key dot product. Compare it to the saturation gap for your context length, which is about 14 to 19 at the sizes anyone trains today, and treat a sustained approach toward that number as the warning it is. In a healthy run the maximum logit sits well below the threshold and stays there; in a run heading for a spike it climbs, steadily, over thousands of steps, with the loss curve giving no sign until the softmax has already saturated. The check costs nothing at training time, because the logits are computed anyway, and it moves the alarm from the loss, which fires after the damage, to the cause, which fires before.

## Three fixes for one quantity

Once the quantity is named, the fixes that the field has converged on read as three ways of bounding it, and the diagram above places each. QK-norm applies a normalisation to the query and key vectors before the dot product, so that their magnitudes cannot grow and the logit is bounded by a learned scale; it was introduced for the largest vision transformers and it is now standard in many open language models. The z-loss, from the PaLM training recipe, adds a small penalty on the log of the softmax's normaliser at the output layer, which keeps the output logits from drifting to large values and, by the same mechanism, keeps the output softmax out of saturation. And QK-clip, described in the [Kimi K2 technical report](https://arxiv.org/abs/2507.20534) as the technique that lets its MuonClip optimiser train through 15.5 trillion tokens with no loss spike, watches the maximum attention logit directly and rescales the query and key projection weights whenever it exceeds a threshold, which is the runaway check with the response built in.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Maximum attention logit and training loss over steps in a run heading for a spike, illustrative</title>
<desc id="f3-d">Two curves over training steps. The maximum attention logit rises slowly and steadily from about 4 to past 18, crossing a marked saturation threshold well before the end. The loss falls smoothly throughout and then jumps sharply after the logit crosses the threshold. A vertical marker at the crossing shows how many steps of warning the logit gives.</desc>
<text x="0" y="18" class="viz-title">The logit crosses the line long before the loss moves</text>
<text x="0" y="36" class="viz-sub">Max attention logit and loss over training steps; drawn</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">max attention logit</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s2"/><text x="520" y="35" class="viz-label-muted">training loss</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/>
<line x1="56" y1="126" x2="600" y2="126" class="viz-grid"/>
<line x1="56" y1="196" x2="600" y2="196" class="viz-grid"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">start</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">steps</text>
<line x1="56" y1="112" x2="600" y2="112" class="viz-s4"/>
<text x="596" y="106" text-anchor="end" class="viz-tick">saturation gap for this context length</text>
<polyline points="56,236 120,226 184,214 248,200 312,184 376,166 440,146 470,132 504,112 540,90 600,70" class="viz-s1"/>
<polyline points="56,90 120,124 184,150 248,170 312,186 376,198 440,206 504,212 540,214 556,150 572,120 588,140 600,160" class="viz-s2"/>
<line x1="504" y1="112" x2="504" y2="264" class="viz-s4"/>
<circle cx="504" cy="112" r="5" class="viz-d4"/>
<text x="496" y="250" text-anchor="end" class="viz-value">crossing: the warning</text>
<circle cx="556" cy="150" r="5" class="viz-d2"/>
<text x="330" y="310" text-anchor="middle" class="viz-label-muted">The gap between the crossing and the spike is the time the check buys.</text>
</svg>
<figcaption>Illustrative: the relationship the studies describe, drawn as two curves; the number of steps of warning depends on the run, and the point is that it is positive.</figcaption>
</figure>

## Why the loss is the wrong alarm

It is worth being explicit about why the loss curve fails as a monitor, because most training dashboards have it as the only one. The loss is an average over every token in the batch, and a softmax that has saturated in one head of one layer changes the prediction on a small fraction of tokens, which moves the average by less than the batch-to-batch noise. The run looks healthy. Meanwhile the gradient flowing back through that head has become unreliable, the optimiser state for the query and key projections accumulates a bad direction, and the weights grow along it, which makes the next batch's logits larger still. The loop closes over thousands of steps and the loss only reacts when enough heads have gone that the average moves, at which point the optimiser state is already poisoned and a rollback of a few thousand steps is the cheapest repair.

The maximum logit sees the same loop from the inside. It is not an average; it is the extreme value of exactly the quantity the softmax is sensitive to, per layer, and it rises monotonically through the loop rather than waiting for the loop's consequences to reach the average. That is the whole reason to log it. A monitor on the extreme catches a fault in one head; a monitor on the mean catches it once it has spread.

## What to actually do with the number

The practice is short. Log the per-layer maximum attention logit at the same cadence as the loss, on the same dashboard, with the saturation gap for the run's context length drawn as a line. Alert on the logit crossing, not on the loss, and treat the alert as a reason to act before the spike rather than a curiosity: lower the learning rate, apply the clip, or, if the architecture allows a change mid-run, turn on the normalisation. Keep the logs for post-mortems, because a spike that arrives with no logit growth beforehand is a different failure, a data or a precision problem, and the absence of the warning is as informative as its presence.

The reason to prefer the log to the fix is that the fixes are not free. QK-norm changes the architecture and the checkpoints; the z-loss changes the objective; the clip changes the optimiser. Each is a decision a team should make with evidence, and the evidence is the number that grows before the loss spikes. A run that has never approached the saturation gap does not need any of them. A run that approaches it every few thousand steps needs one of them, and the log is how you find out which run you are in before the loss tells you the expensive way.
