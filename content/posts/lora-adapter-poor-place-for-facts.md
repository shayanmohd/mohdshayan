---
title: A LoRA adapter is a poor place for facts
date: 2025-12-18
summary: LoRA updates are low-rank and learn less new knowledge than full fine-tuning. Adapters hold format well and facts badly, and facts change faster than anyone retrains.
tags: Fine-Tuning, LoRA, RAG
draft: false
---

At CRIS I did both halves of the usual argument on one system: I fine-tuned open models with parameter-efficient adapters for a helpdesk assistant, and I built the retrieval pipeline that fed the same assistant its documents. The two halves are usually presented as competitors, fine-tuning against retrieval, and the decision between them is usually made by taste. Doing both on one problem made the division of labour obvious, and the division turned out to depend on how fast each kind of knowledge decays, measured against how often anyone will actually retrain, rather than on which technique is better.

## What a low-rank update can hold

A LoRA adapter does not change a model's weights. It adds, to selected weight matrices, a correction that is the product of two thin matrices, so that the correction has a rank no higher than their shared inner dimension, r. The number of trainable parameters is therefore small and easy to compute from the architecture. For an eight-billion-parameter model of the Llama 3 family, whose [published architecture](https://arxiv.org/abs/2407.21783) has 32 layers, a hidden size of 4,096, grouped key and value projections of 1,024, and a feed-forward width of 14,336, adapting only the query and value projections adds about 426,000 parameters per unit of rank; adapting every linear layer in each block adds about 2.6 million per unit of rank.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Trainable parameters in a LoRA adapter against rank, for an 8B Llama-family model</title>
<desc id="f1-d">Two rising lines on a logarithmic axis. Adapting query and value projections only: 1.7 million parameters at rank 4, 3.4 million at 8, 6.8 million at 16, 13.6 million at 32, 27 million at 64. Adapting all linear layers: 10.5 million at rank 4, 21 million at 8, 42 million at 16, 84 million at 32, 168 million at 64. Even the largest is about two percent of the eight billion base parameters.</desc>
<text x="0" y="18" class="viz-title">Small by construction</text>
<text x="0" y="36" class="viz-sub">Trainable parameters, derived from the 8B architecture; log scale</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">all linear layers</text>
<line x1="510" y1="31" x2="524" y2="31" class="viz-s2"/><text x="530" y="35" class="viz-label-muted">q and v only</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1B</text>
<line x1="56" y1="125.3" x2="600" y2="125.3" class="viz-grid"/><text x="48" y="129.3" text-anchor="end" class="viz-tick">100M</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-grid"/><text x="48" y="198.7" text-anchor="end" class="viz-tick">10M</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1M</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">16</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">32</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">64</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">LoRA rank, r</text>
<polyline points="56,248 192,227.1 328,206.3 464,185.4 600,164.5" class="viz-s2"/>
<polyline points="56,193.2 192,172.3 328,151.4 464,130.5 600,109.7" class="viz-s1"/>
<circle cx="600" cy="109.7" r="4" class="viz-d1"/>
<circle cx="600" cy="164.5" r="4" class="viz-d2"/>
<text x="592" y="103" text-anchor="end" class="viz-value">168M, about 2% of the base</text>
<text x="592" y="182" text-anchor="end" class="viz-value">27M</text>
</svg>
<figcaption>Source: derived by the author from the layer dimensions in the <a href="https://arxiv.org/abs/2407.21783">Llama 3 paper</a>; parameters per unit of rank are the sums of input and output dimensions of the adapted matrices, times 32 layers.</figcaption>
</figure>

Two percent of the parameters, at a rank most people never use, and the correction is constrained to a low-dimensional subspace within that. That is a lot of capacity for shaping how a model responds. It is not a lot of capacity for storing what the model knows, and the empirical work agrees. Biderman and colleagues' [LoRA Learns Less and Forgets Less](https://arxiv.org/abs/2405.09673) compared adapters with full fine-tuning across code and mathematics, and found that LoRA learns substantially less of the new domain than full fine-tuning does, while also forgetting less of what the base model could do. The trade is the mechanism: a low-rank update cannot rewrite the model's knowledge, so it preserves the old and absorbs less of the new.

## What the paper measured

The result deserves a closer look, because it is the empirical anchor for everything that follows. The study compared LoRA against full fine-tuning on two target domains, programming and mathematics, in two regimes each: continued pretraining on large unlabelled corpora and instruction fine-tuning on smaller labelled sets. Learning was measured on the target domain's benchmarks, and forgetting was measured on general tasks the base model already did well, so that each run produced a point on a learning-versus-forgetting plane. Across the regimes, LoRA sat consistently below full fine-tuning on the target domain and above it on the retained general ability. The gap on learning was largest in continued pretraining on code, which is the regime closest to "teach the model a body of facts", and smallest in instruction fine-tuning on maths, which is closest to "teach the model a way of answering".

The paper also looked at why, and the explanation matches the arithmetic above. When the authors examined the weight changes that full fine-tuning produced, they found perturbations whose rank was ten to a hundred times higher than the ranks LoRA is normally run at. Full fine-tuning is not using a low-rank update that LoRA could match with a bigger r; it is using a genuinely high-rank one, and a low-rank adapter is a projection of it. LoRA, in return, acts as a stronger regulariser than the usual alternatives, keeping the model's outputs closer to the base and its generations more diverse. That is the behaviour-preserving property that makes an adapter safe to ship for the things it is good at.

## Behaviour versus facts

That result reads as a limitation, and for one class of knowledge it is a feature. The things a helpdesk assistant most needs to learn from fine-tuning are behavioural: answer in this format, refuse these categories, cite in this style, keep this tone, stop after the answer. Those are patterns, not facts, and patterns live comfortably in a low-rank correction to how attention and projections behave. An adapter trained on a few thousand well-formed examples teaches them reliably, and forgetting less of the base model is exactly what you want while it does.

The things the assistant most needs to know are facts: which form to file, which screen to open, what the policy says this quarter, which phone number moved. Facts are the wrong shape for a low-rank update, they are the category the paper shows adapters learning least of, and they have a second problem that is worse than capacity. They change.

## The half-life split

So the rule I use is a question about decay rather than about technique. For each class of knowledge the system needs, estimate how long until half the answers in that class have changed. Then compare that half-life with the retraining cadence, how often anyone will actually build, evaluate and ship a new adapter, which for most teams is quarterly at best and, honestly, less often than that.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Where each class of knowledge belongs, by decay and kind</title>
<desc id="f2-d">A two by two grid. Horizontal axis: kind of knowledge, behavioural on the left and factual on the right. Vertical axis: half-life, shorter than the retraining cadence at the bottom, longer at the top. Bottom right: fast-changing facts, retrieval. Top right: stable facts, the one contested cell, where rank decides. Top left: stable behaviour, the adapter. Bottom left: fast-changing behaviour, prompts and retrieved instructions.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">The adapter</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">format, tone, refusals, style</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Contested: rank decides</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">stable facts, domain vocabulary</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Prompt and instructions</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">behaviour that changes with policy</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Retrieval</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">procedures, numbers, this quarter's rules</text>
<circle cx="464" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Kind of knowledge: behavioural to factual</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Half-life: shorter than retraining to longer</text>
</svg>
<figcaption>Illustrative: the split as a grid; the dot is where most of a helpdesk's knowledge sits.</figcaption>
</figure>

Anything with a half-life shorter than the retraining cadence goes to retrieval, whatever its kind, because a fact baked into an adapter is wrong from the day it changes until the day someone retrains, and that gap is the half-life's whole length. Anything with a long half-life and a behavioural kind goes to the adapter, because that is what a low-rank update is good at and the knowledge will not rot before the next release. The one contested cell is long-lived factual knowledge, domain vocabulary, the stable structure of a product, the things that were true five years ago and will be true in five more, and there the adapter and retrieval genuinely compete. Rank decides it: a higher rank absorbs more, at the cost of forgetting more, and the paper's curves are the guide to where that trade sits for a given domain.

## Estimating the half-life

The half-life is easier to estimate than it sounds, because the organisation already knows it. Ask how often each kind of document is revised.

Pricing changes monthly. Procedures change with each release. Policy changes when the regulator does. Product names change at the whim of marketing. The tone of a good answer changes never. Put those on one axis and the retraining cadence on the same axis, and the classes sort themselves.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Knowledge classes by half-life against a quarterly retraining cadence</title>
<desc id="f3-d">Horizontal bars on a logarithmic scale of weeks: pricing about 4 weeks, procedures about 12, product names about 26, policy about 52, tone and format effectively unbounded. A vertical marker at 13 weeks is the retraining cadence. Everything left of it belongs in retrieval.</desc>
<text x="0" y="18" class="viz-title">Which classes decay before the next retrain</text>
<text x="0" y="36" class="viz-sub">Half-life in weeks, log scale; example values for a helpdesk, stated as assumptions</text>
<line x1="176" y1="52" x2="176" y2="222" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Pricing</text>
<path d="M176 58 H278 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="298" y="73" class="viz-value">4</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Procedures</text>
<path d="M176 92 H360 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="380" y="107" class="viz-value">12</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Product names</text>
<path d="M176 126 H418 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="438" y="141" class="viz-value">26</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Policy</text>
<path d="M176 160 H470 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="490" y="175" class="viz-value">52</text>
<text x="166" y="209" text-anchor="end" class="viz-label">Tone and format</text>
<path d="M176 194 H600 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="596" y="189" text-anchor="end" class="viz-value">effectively never</text>
<line x1="366" y1="52" x2="366" y2="222" class="viz-s4"/>
<text x="372" y="240" class="viz-label-muted">retraining cadence: 13 weeks</text>
<rect x="0" y="252" width="12" height="12" rx="3" class="viz-f2"/><text x="18" y="263" class="viz-label-muted">retrieval</text>
<rect x="100" y="252" width="12" height="12" rx="3" class="viz-fgray"/><text x="118" y="263" class="viz-label-muted">contested</text>
<rect x="210" y="252" width="12" height="12" rx="3" class="viz-f1"/><text x="228" y="263" class="viz-label-muted">adapter</text>
</svg>
<figcaption>Illustrative: half-lives are example values for a helpdesk domain, chosen to show the sort against a quarterly cadence; a real estimate comes from the organisation's own revision history.</figcaption>
</figure>

## What this meant in practice

The split settled a question that had been consuming effort in the wrong place. The adapter's training set stopped being a dump of the manuals and became a few thousand examples of good answers: the right format, the right refusals, the right citation style, the right way to say that a question needs a human. The manuals went into the retrieval index, where a revised procedure replaced the old one the same afternoon, with no training run. And the evaluation split the same way: the adapter was judged on whether answers had the right shape, and retrieval was judged on whether the right passage was found, which are different failures with different fixes.

The rule generalises past helpdesks. Any time the question is "fine-tune or retrieve", replace it with two questions: what kind of knowledge is this, and how long until half of it is wrong. The adapter is where you put the things that will still be true at the next release. Everything else is a document, and documents are for retrieving.
