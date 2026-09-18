---
title: Every wrong answer has an exchange rate
date: 2026-03-08
summary: Accuracy rewards guessing. The fix is a penalty for wrong answers, and the penalty is not a research constant. It is a business number, and it sets the abstention threshold.
tags: Hallucination, Evaluation, Helpdesk
draft: false
---

A helpdesk assistant that answers every question scores higher on accuracy than one that sometimes says it does not know. That is not a quirk of one benchmark. It is arithmetic. If a wrong answer and a declined answer both score zero, then answering is never worse than declining, and a model trained and selected on that scoreboard learns to guess. Kalai, Nachum, Vempala and Zhang put this at the centre of [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664) in September 2025: under a binary right-or-wrong scheme, guessing when unsure maximises the expected score, so the evaluations themselves keep hallucination alive.

Their proposed fix is to penalise confident errors more than abstentions. I agree with the fix and I want to push on the part the paper leaves open, because it is the part an engineer building a real system has to decide. How big should the penalty be. The answer is not a constant. It is an exchange rate between wrong answers and declined ones, it differs by deployment, and once you know it the abstention threshold follows from it.

## Two models, three columns

The example that made the argument concrete came from OpenAI's [own write-up](https://openai.com/index/why-language-models-hallucinate/) of the paper, which compared two of its models on SimpleQA, a short-answer factuality test where each answer is graded correct, incorrect or not attempted, as described in the [SimpleQA paper](https://arxiv.org/abs/2411.04368). One model abstained on 52% of questions, answered 22% correctly and got 26% wrong. The other abstained on 1%, answered 24% correctly and got 75% wrong. By accuracy alone the second model is ahead, 24 to 22. By any measure that counts a wrong answer as worse than silence, it is far behind.

<figure class="chart">
<svg viewBox="0 0 640 220" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Two models on SimpleQA, three outcomes each</title>
<desc id="f1-d">Two stacked bars. The first model: 22% correct, 26% wrong, 52% abstained. The second model: 24% correct, 75% wrong, 1% abstained. The second model has slightly higher accuracy and nearly three times the error rate.</desc>
<text x="0" y="18" class="viz-title">Accuracy hides the third column</text>
<text x="0" y="36" class="viz-sub">Share of SimpleQA questions by outcome</text>
<text x="0" y="62" class="viz-label">Model that abstains when unsure</text>
<rect x="0" y="70" width="140.8" height="28" class="viz-f1"/>
<rect x="140.8" y="70" width="166.4" height="28" class="viz-f4"/>
<rect x="307.2" y="70" width="332.8" height="28" class="viz-fgray"/>
<line x1="140.8" y1="70" x2="140.8" y2="98" class="viz-gap"/>
<line x1="307.2" y1="70" x2="307.2" y2="98" class="viz-gap"/>
<text x="70.4" y="88" text-anchor="middle" class="viz-onfill">22% correct</text>
<text x="224" y="88" text-anchor="middle" class="viz-onfill">26% wrong</text>
<text x="473.6" y="88" text-anchor="middle" class="viz-onfill">52% abstained</text>
<text x="0" y="128" class="viz-label">Model that always answers</text>
<rect x="0" y="136" width="153.6" height="28" class="viz-f1"/>
<rect x="153.6" y="136" width="480" height="28" class="viz-f4"/>
<rect x="633.6" y="136" width="6.4" height="28" class="viz-fgray"/>
<line x1="153.6" y1="136" x2="153.6" y2="164" class="viz-gap"/>
<line x1="633.6" y1="136" x2="633.6" y2="164" class="viz-gap"/>
<text x="76.8" y="154" text-anchor="middle" class="viz-onfill">24% correct</text>
<text x="393.6" y="154" text-anchor="middle" class="viz-onfill">75% wrong</text>
<rect x="0" y="190" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="201" class="viz-label-muted">correct</text>
<rect x="110" y="190" width="12" height="12" rx="3" class="viz-f4"/><text x="128" y="201" class="viz-label-muted">wrong</text>
<rect x="210" y="190" width="12" height="12" rx="3" class="viz-fgray"/><text x="228" y="201" class="viz-label-muted">abstained (1% on the second bar)</text>
</svg>
<figcaption>Source: the model comparison in <a href="https://openai.com/index/why-language-models-hallucinate/">OpenAI's summary</a> of <a href="https://arxiv.org/abs/2509.04664">Kalai et al. (2025)</a>, on the SimpleQA evaluation.</figcaption>
</figure>

The chart is the whole case for a third column. But look at what it does not tell you: which model to deploy. That depends on what a wrong answer costs relative to a declined one, and the chart has no opinion about that, because it cannot.

## The exchange rate

Here is the number I keep next to any evaluation of an assistant that can decline. The wrong-answer exchange rate is the number of declined answers that one wrong answer is worth, in the deployment where the model will actually run. Call it R. It converts the three-column scorecard into a single cost: each declined answer costs 1, each wrong answer costs R, each correct answer costs 0, and the model with the lowest total is the one to ship.

R is not a property of the model. It is a property of what happens next. For a helpdesk with a human fallback, a decline costs a ticket: the person gets routed to someone who can answer. A wrong answer costs the same ticket, plus a repair conversation in which the person explains that they followed the assistant's instructions and it made things worse, plus some amount of trust that does not come back.

That is an R of several, and in a domain where following a wrong procedure can lock an account or corrupt a form, it is an R of many. For a trivia game with no consequences, R is close to 1, and the always-answer model is the right one. Same models, same chart, opposite decision.

Apply the rate to the two models. At R equal to 1, the abstaining model costs 26 plus 52, which is 78 per hundred questions, and the always-answer model costs 75 plus 1, which is 76. The guesser wins, narrowly. At R equal to 5, the abstaining model costs 130 plus 52, which is 182, and the guesser costs 375 plus 1, which is 376. The guesser loses by a factor of two. Neither result is visible in the accuracy column.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The same scorecard under two exchange rates</title>
<desc id="f2-d">A table with two models as rows and columns for correct, wrong and declined shares, followed by two cost columns. At an exchange rate of 1, the abstaining model costs 78 and the always-answer model 76, so the guesser wins. At an exchange rate of 5, the abstaining model costs 182 and the guesser 376, so the abstaining model wins.</desc>
<text x="0" y="18" class="viz-title">Cost per 100 questions = wrong times R + declined</text>
<text x="0" y="48" class="viz-tick">MODEL</text>
<text x="250" y="48" text-anchor="middle" class="viz-tick">CORRECT</text>
<text x="330" y="48" text-anchor="middle" class="viz-tick">WRONG</text>
<text x="415" y="48" text-anchor="middle" class="viz-tick">DECLINED</text>
<text x="510" y="48" text-anchor="middle" class="viz-tick">R = 1</text>
<text x="595" y="48" text-anchor="middle" class="viz-tick">R = 5</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="0" y="86" class="viz-label">Abstains when unsure</text>
<text x="250" y="86" text-anchor="middle" class="viz-value">22</text>
<text x="330" y="86" text-anchor="middle" class="viz-value">26</text>
<text x="415" y="86" text-anchor="middle" class="viz-value">52</text>
<text x="510" y="86" text-anchor="middle" class="viz-value">78</text>
<text x="595" y="86" text-anchor="middle" class="viz-value">182</text>
<line x1="0" y1="100" x2="640" y2="100" class="viz-grid"/>
<text x="0" y="130" class="viz-label">Always answers</text>
<text x="250" y="130" text-anchor="middle" class="viz-value">24</text>
<text x="330" y="130" text-anchor="middle" class="viz-value">75</text>
<text x="415" y="130" text-anchor="middle" class="viz-value">1</text>
<text x="510" y="130" text-anchor="middle" class="viz-value">76</text>
<text x="595" y="130" text-anchor="middle" class="viz-value">376</text>
<line x1="0" y1="144" x2="640" y2="144" class="viz-grid"/>
<circle cx="495" cy="126" r="6" class="viz-d1"/>
<circle cx="580" cy="82" r="6" class="viz-d1"/>
<text x="0" y="180" class="viz-label-muted">The dot marks the cheaper model: the guesser at R = 1, the abstainer at R = 5.</text>
<text x="0" y="204" class="viz-label-muted">Accuracy, the first column, ranks them the same way under both rates.</text>
<text x="0" y="240" class="viz-tick">shares from the chart above; costs are arithmetic on those shares</text>
</svg>
<figcaption>Illustrative: the costs are computed from the published shares under two stated exchange rates; the shares are from <a href="https://openai.com/index/why-language-models-hallucinate/">OpenAI's comparison</a>.</figcaption>
</figure>

## The threshold falls out of the rate

The exchange rate does more than rank models. If a model can report a confidence and abstain below a threshold, the rate tells you where to put the threshold, and the argument is short. Suppose the model's confidence is calibrated, so that an answer given with confidence c is right with probability c. Answering costs an expected R times (1 minus c). Declining costs 1. Answer whenever the first is smaller, which is whenever c exceeds 1 minus 1 over R. At R equal to 1 the threshold is zero and the model should always answer. At R equal to 5 it should answer only above 80% confidence. At R equal to 10, only above 90%.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Expected cost against abstention threshold under two exchange rates</title>
<desc id="f3-d">Two curves over thresholds from 0 to 1. At an exchange rate of 1 the cost per 100 questions rises from 50 at threshold zero to 100 at threshold one, so the best threshold is zero. At an exchange rate of 5 the cost falls from 250 at threshold zero to a minimum of 90 at threshold 0.8 and rises to 100 at threshold one.</desc>
<text x="0" y="18" class="viz-title">Where to put the abstention threshold</text>
<text x="0" y="36" class="viz-sub">Cost per 100 questions, in declined-answer units, calibrated model</text>
<line x1="420" y1="31" x2="434" y2="31" class="viz-s1"/><text x="440" y="35" class="viz-label-muted">R = 5</text>
<line x1="520" y1="31" x2="534" y2="31" class="viz-sgray"/><text x="540" y="35" class="viz-label-muted">R = 1</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">250</text>
<line x1="56" y1="97.6" x2="600" y2="97.6" class="viz-grid"/><text x="48" y="101.6" text-anchor="end" class="viz-tick">200</text>
<line x1="56" y1="139.2" x2="600" y2="139.2" class="viz-grid"/><text x="48" y="143.2" text-anchor="end" class="viz-tick">150</text>
<line x1="56" y1="180.8" x2="600" y2="180.8" class="viz-grid"/><text x="48" y="184.8" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="222.4" x2="600" y2="222.4" class="viz-grid"/><text x="48" y="226.4" text-anchor="end" class="viz-tick">50</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0</text>
<text x="164.8" y="288" text-anchor="middle" class="viz-tick">0.2</text>
<text x="273.6" y="288" text-anchor="middle" class="viz-tick">0.4</text>
<text x="382.4" y="288" text-anchor="middle" class="viz-tick">0.6</text>
<text x="491.2" y="288" text-anchor="middle" class="viz-tick">0.8</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">1.0</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Confidence below which the model declines</text>
<polyline points="56,222.4 164.8,220.7 273.6,215.7 382.4,207.4 491.2,195.8 600,180.8" class="viz-sgray"/>
<polyline points="56,56 164.8,114.3 273.6,155.8 382.4,180.8 491.2,189.1 600,180.8" class="viz-s1"/>
<circle cx="491.2" cy="189.1" r="5" class="viz-d1"/>
<text x="491.2" y="212" text-anchor="middle" class="viz-value">minimum at 0.8</text>
<circle cx="56" cy="222.4" r="4" class="viz-dgray"/>
<text x="70" y="240" class="viz-value">minimum at 0</text>
</svg>
<figcaption>Illustrative: computed from a calibrated model whose per-question confidence is spread evenly from 0 to 1, so cost per question is the declined share plus R times the expected wrong share; the construction is stated in the text.</figcaption>
</figure>

The curve is a model and its assumption is strong: calibration. Real models are overconfident in places, and a fine-tuned model is often less calibrated than the base it came from. That does not break the rule; it changes the input. Measure the model's actual reliability curve on held-out questions, replace the straight line with it, and the threshold moves to wherever the measured curve says the expected wrong cost crosses 1. The exchange rate stays what it was, because it never depended on the model.

## Where the rate comes from

When I was building the helpdesk assistant at CRIS, the thing that made abstention cheap was structural: a declined question went to a human queue that already existed. The assistant was in front of a process, not instead of one. That is the situation in which R is large and abstention is a feature, and it is the situation most internal assistants are in. The situation in which R is small is rarer than people assume: a consumer product with no fallback, where a shrug is as bad as an error because the user simply leaves.

Estimating R does not need a spreadsheet of costs, though one helps. It needs an honest answer to two questions. What happens after a decline, and what happens after a confident wrong answer. If the first is a ticket and the second is a ticket plus an apology plus a corrected form, R is at least 3. If the second can cause an action that someone has to undo, R is 10 or more, and the assistant should be quiet most of the time and precise when it speaks.

R also changes over the life of a deployment, and it is worth re-estimating when the surroundings change. Add a confirmation step before any action the assistant proposes, and wrong answers get cheaper, because a person now catches them; R falls and the threshold can drop. Remove the human queue behind the assistant to save money, and declines get more expensive, because a decline is now a dead end; R falls again, for the opposite reason. Both changes are made by people who never look at the model, and both should move the threshold. A rate written down once and never revisited is a threshold tuned for a system that no longer exists.

## What this changes in the evaluation

Three things, and they are cheap. Report three columns, never one; an accuracy number with no abstention rate beside it is a number that rewards guessing, and you will select a guesser. Write R down for each deployment before you compare models, so that the comparison is a cost and not a taste. And set the abstention threshold from R and the measured reliability curve, rather than from a round number someone found in a demo.

The paper's authors argue that the field's scoreboards should change. Until they do, the scoreboard that matters is yours, and it needs one more number than it has.
