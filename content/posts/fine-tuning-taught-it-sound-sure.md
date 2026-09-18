---
title: Fine-tuning taught it to sound sure
date: 2026-03-24
summary: Fine-tuning makes a model more accurate and less calibrated at once: cross-entropy keeps rewarding larger logits after the answers stop changing. Refit the temperature last.
tags: Calibration, Fine-Tuning, Probability
draft: false
---

A fine-tuned model is usually more accurate than the base model on the task it was tuned for, and it is usually more confident, and the second effect outruns the first. The reason is not mysterious. Cross-entropy loss on labels that are nearly deterministic keeps rewarding larger logits long after the argmax has stopped changing, so the weights keep growing in the direction that makes the model's answers sharper without making them righter. The result is a model that sounds sure in proportion to how long it was trained rather than how often it is correct. The fix is one scalar, fitted on held-out data after the final fine-tune, and the rule that matters is the word "after": no temperature survives a change to the weights, so it is the last step of every training run or it is not there at all.

## Watching the logits grow

The mechanism is easiest to see in a model small enough to watch. I trained a logistic regression, the simplest model that has logits, on eighty examples of a two-class problem in twenty dimensions with plain gradient descent on cross-entropy, no regularisation, and recorded four things at intervals: training accuracy, accuracy on four thousand held-out examples, the mean confidence the model reported on those held-out examples, and the norm of the weight vector, which is the size of the logits.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Weight norm and mean confidence keep rising after held-out accuracy has stopped changing, in a toy model</title>
<desc id="f1-d">Two lines against training epochs on a log scale from 1 to 3,000. Held-out accuracy is flat at about 90 percent from epoch 10 onward. Mean reported confidence rises from 63 percent at epoch 1 to 97 percent at epoch 3,000. A third series, the weight norm, rises from 0.4 to 9.3 over the same range, shown as labelled points.</desc>
<text x="0" y="18" class="viz-title">The answers stop changing at epoch ten; the confidence does not</text>
<text x="0" y="36" class="viz-sub">Toy logistic model, 80 train examples, log-scale epochs</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">mean confidence</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">held-out accuracy</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100%</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">90%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">80%</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">70%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">60%</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="216" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="376" y="288" text-anchor="middle" class="viz-tick">100</text>
<text x="536" y="288" text-anchor="middle" class="viz-tick">1,000</text>
<polyline points="56,247.4 132,193.8 216,144.4 292,114.8 376,94.5 452,83.0 536,74.7 600,70.0" class="viz-s1"/>
<polyline points="56,100.2 132,101.8 216,103.3 292,105.4 376,105.9 452,107.5 536,108.0 600,107.5" class="viz-s2"/>
<circle cx="56" cy="247.4" r="4" class="viz-d1"/><text x="64" y="252" class="viz-value">63%</text>
<circle cx="600" cy="70" r="4" class="viz-d1"/><text x="592" y="64" text-anchor="end" class="viz-value">97%</text>
<circle cx="600" cy="107.5" r="4" class="viz-d2"/><text x="592" y="124" text-anchor="end" class="viz-value">90%</text>
<text x="56" y="312" class="viz-tick">weight norm: 0.4</text>
<text x="216" y="312" text-anchor="middle" class="viz-tick">1.5</text>
<text x="376" y="312" text-anchor="middle" class="viz-tick">3.5</text>
<text x="536" y="312" text-anchor="middle" class="viz-tick">7.1</text>
<text x="600" y="312" text-anchor="end" class="viz-tick">9.3</text>
<text x="328" y="334" text-anchor="middle" class="viz-label-muted">Training accuracy hit 100 percent at epoch 10; everything after is the logits growing.</text>
</svg>
<figcaption>Source: computed by the author from a toy logistic regression trained with gradient descent on cross-entropy, following the calibration measures of <a href="https://arxiv.org/abs/1706.04599">Guo et al.</a>; the construction is described in the text and the numbers are from one run.</figcaption>
</figure>

By epoch ten the model fits its eighty training examples perfectly and its held-out accuracy has settled at about 90 percent, where it stays. The weight norm keeps climbing, from 1.5 at epoch ten to 9.3 at epoch three thousand, and the mean confidence climbs with it, from 83 percent to 97 percent, on a model that is right 90 percent of the time. The loss is still going down through all of that, because on training examples that are already classified correctly, a larger logit gives a smaller cross-entropy. The optimiser is doing exactly what it was asked. What it was asked has nothing to do with the held-out data.

The same thing happens in a language model fine-tuned on a small labelled set, at a scale where nobody can watch the weight norm, and the published evidence says so. The GPT-4 [technical report](https://arxiv.org/abs/2303.08774) shows the pre-trained model well calibrated on a multiple-choice benchmark and the post-trained model markedly less so, with the plain statement that post-training hurts calibration. The 2026 [HypeLoRA](https://arxiv.org/abs/2603.19278) work on low-rank adapters treats calibration as a first-class metric precisely because adapted models trade it away for task accuracy, and finds that constraining the adaptation acts as a regulariser that improves calibration at a cost in task performance. Larger logits after the argmax has settled is the mechanism in both.

## One scalar, fitted last

The repair is old and almost embarrassingly small. Guo and colleagues showed in [On Calibration of Modern Neural Networks](https://arxiv.org/abs/1706.04599) that dividing the logits by a single temperature, fitted on held-out data to minimise the negative log-likelihood, restores calibration without changing a single prediction, because dividing every logit by the same positive number does not change which is largest. On the toy model the fitted temperature is 3.9; the expected calibration error on the held-out set falls from 0.072 to 0.013, the accuracy stays at 90.1 percent, and the mean confidence comes down from 97 percent to 89, which is what a model right nine times in ten should report.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Reliability diagram of the toy model before and after temperature scaling</title>
<desc id="f2-d">Confidence on the horizontal axis against observed accuracy on the vertical, with a diagonal for perfect calibration. Before scaling, the points sit below the diagonal: confidence 0.65 with accuracy 0.48, 0.75 with 0.54, 0.85 with 0.64, and the large top bin at confidence 0.996 with accuracy 0.93. After scaling with a fitted temperature of 3.9, the points sit on the diagonal: 0.65 with 0.67, 0.75 with 0.77, 0.86 with 0.87, 0.97 with 0.98.</desc>
<text x="0" y="18" class="viz-title">Before: sure and wrong. After: sure in proportion</text>
<text x="0" y="36" class="viz-sub">Observed against reported confidence, held-out, 0.1 bins</text>
<circle cx="340" cy="31" r="5" class="viz-d4"/><text x="350" y="35" class="viz-label-muted">before, ECE 0.072</text>
<circle cx="490" cy="31" r="5" class="viz-d1"/><text x="500" y="35" class="viz-label-muted">after, ECE 0.013</text>
<line x1="96" y1="56" x2="600" y2="56" class="viz-grid"/><text x="88" y="60" text-anchor="end" class="viz-tick">1.0</text>
<line x1="96" y1="108" x2="600" y2="108" class="viz-grid"/><text x="88" y="112" text-anchor="end" class="viz-tick">0.875</text>
<line x1="96" y1="160" x2="600" y2="160" class="viz-grid"/><text x="88" y="164" text-anchor="end" class="viz-tick">0.75</text>
<line x1="96" y1="212" x2="600" y2="212" class="viz-grid"/><text x="88" y="216" text-anchor="end" class="viz-tick">0.625</text>
<line x1="96" y1="264" x2="600" y2="264" class="viz-axis"/><text x="88" y="268" text-anchor="end" class="viz-tick">0.5</text>
<text x="96" y="288" text-anchor="middle" class="viz-tick">0.5</text>
<text x="348" y="288" text-anchor="middle" class="viz-tick">0.75</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">1.0</text>
<text x="348" y="310" text-anchor="middle" class="viz-label-muted">Reported confidence</text>
<line x1="96" y1="264" x2="600" y2="56" class="viz-s4"/>
<text x="596" y="50" text-anchor="end" class="viz-tick">perfect calibration</text>
<circle cx="142.4" cy="256.1" r="6" class="viz-d4"/>
<circle cx="246.2" cy="271.9" r="6" class="viz-d4"/>
<circle cx="353" cy="247.8" r="6" class="viz-d4"/>
<circle cx="453.8" cy="204.9" r="6" class="viz-d4"/>
<circle cx="596" cy="83.5" r="6" class="viz-d4"/>
<circle cx="147.4" cy="254" r="6" class="viz-d1"/>
<circle cx="247.2" cy="191.6" r="6" class="viz-d1"/>
<circle cx="351" cy="150.4" r="6" class="viz-d1"/>
<circle cx="453.8" cy="109.3" r="6" class="viz-d1"/>
<circle cx="572.8" cy="63.1" r="6" class="viz-d1"/>
<text x="440" y="235" class="viz-label-muted">below the line: too sure</text>
</svg>
<figcaption>Source: computed by the author from the toy model after 3,000 epochs, with a temperature of 3.9 fitted on a separate validation set by minimising negative log-likelihood, the procedure of <a href="https://arxiv.org/abs/1706.04599">Guo et al.</a>; bins with fewer than twenty examples are omitted.</figcaption>
</figure>

Two properties of the fit matter for the rule. The first is that it must be fitted on data the training never saw, because fitting it on the training set finds a temperature near one: the model is, after all, perfectly right on those examples, and perfectly right deserves perfect confidence. The second is that the temperature is a property of a specific set of weights. Change the weights, by another epoch, by a second fine-tune, by merging an adapter, by quantising, and the logits change scale, and the temperature that was right for the old logits is wrong for the new ones. There is no such thing as a calibrated model; there is a calibrated checkpoint.

## The temperature-last rule

So the rule is about pipeline order. The last step of every training run, after the final weight update of any kind, is to refit the temperature on held-out data and to record the reliability diagram beside the accuracy. A checkpoint shipped without both has not been evaluated; it has been scored, which is half of an evaluation. And any step that touches the weights afterwards, however small, invalidates the fit and sends the checkpoint back to the calibration stage.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The training pipeline with the temperature fit as the mandatory last stage, and an invalidation arrow from any weight change</title>
<desc id="f3-d">A flow: base model, fine-tune, evaluate accuracy, fit temperature on held-out data and record the reliability diagram, ship. An arrow from a box labelled any weight change, including merging, quantising or further tuning, loops back to the temperature fit, marking it invalid.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Calibrate last, and again after anything</text>
<rect x="8" y="60" width="100" height="56" rx="8" class="viz-box"/><text x="58" y="93" text-anchor="middle" class="viz-label">Base model</text>
<line x1="110" y1="88" x2="130" y2="88" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="134" y="60" width="100" height="56" rx="8" class="viz-box"/><text x="184" y="93" text-anchor="middle" class="viz-label">Fine-tune</text>
<line x1="236" y1="88" x2="256" y2="88" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="260" y="60" width="100" height="56" rx="8" class="viz-box"/><text x="310" y="85" text-anchor="middle" class="viz-label">Accuracy</text><text x="310" y="103" text-anchor="middle" class="viz-label-muted">on held-out</text>
<line x1="362" y1="88" x2="382" y2="88" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="386" y="52" width="140" height="72" rx="8" class="viz-box-accent"/>
<text x="456" y="76" text-anchor="middle" class="viz-label">Fit temperature</text>
<text x="456" y="94" text-anchor="middle" class="viz-label-muted">on held-out data</text>
<text x="456" y="112" text-anchor="middle" class="viz-label-muted">record reliability</text>
<line x1="528" y1="88" x2="548" y2="88" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="552" y="60" width="80" height="56" rx="8" class="viz-box-ink"/><text x="592" y="93" text-anchor="middle" class="viz-on-ink">Ship</text>
<rect x="134" y="170" width="226" height="56" rx="8" class="viz-box"/>
<text x="247" y="193" text-anchor="middle" class="viz-label">Any weight change</text>
<text x="247" y="211" text-anchor="middle" class="viz-label-muted">merge, quantise, tune again</text>
<path d="M362 198 H456 V128" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="500" y="176" class="viz-tick">invalidates the fit</text>
<text x="320" y="250" text-anchor="middle" class="viz-label-muted">A checkpoint without a reliability diagram has been scored, not evaluated.</text>
</svg>
<figcaption>Illustrative: the pipeline order the rule enforces; the loop from the lower box is the part most pipelines lack.</figcaption>
</figure>

## What the rule costs, and what it does not

The objection to the rule is the held-out set: fitting the temperature needs labelled examples the training never touched, and for a fine-tune on a small labelled set those examples are precious. In practice the cost is small, because a single scalar is fitted, not a model, and a few hundred examples pin it down; the toy above used two thousand and would have been fine with a tenth of that. What the rule does cost is a place in the pipeline, a step that runs after the merge and before the export, and a record, the reliability diagram, that has to be stored beside the accuracy number and looked at when the checkpoint is reviewed.

What the rule does not do is make the model right more often. Temperature scaling changes no prediction; it changes how loudly the model says each one. A team that wants better accuracy still has to do the work of better data and better training, and a team that only refits the temperature has a model that is exactly as wrong as before and honest about it. That honesty is the entire point for anything the user reads as a claim.

## Why a confident citation is worse than a hedged one

The place I learned to care about this was a helpdesk assistant that answered with grounded citations, built on open models fine-tuned with parameter-efficient adapters. A citation is a claim of certainty: here is the passage, this is where the answer comes from. When the model behind it is overconfident, the citation attaches that overconfidence to a specific document, and the user reads a wrong answer with a footnote. That is worse than a wrong answer with a hedge, because the hedge invites checking and the footnote discourages it. An assistant that says "I think it is this, see section four" when it is right 70 percent of the time is honest; one that says "It is this, see section four" with the same accuracy is not, and the difference between them is a temperature.

The fine-tune made the assistant better at the task and, in the same run, worse at knowing when it was wrong, and the second effect was invisible in the accuracy number that justified shipping. The reliability diagram was where it showed. Refitting the temperature after the final adapter merge brought the reported confidence back to something the citation could honestly carry, and the rule that it be refitted after every change was what kept it there through the next several releases, each of which changed the weights and would otherwise have quietly undone it.

## The shipping checklist, in one line

Accuracy beside a reliability diagram, both computed after the last weight change, or the checkpoint does not ship. Fine-tuning will keep teaching models to sound sure, because that is what the loss rewards once the answers are settled. The temperature is how you take the sureness back down to what the model has earned, and "last" is the only place in the pipeline where it stays true.
