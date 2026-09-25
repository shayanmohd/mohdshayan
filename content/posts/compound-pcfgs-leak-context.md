---
title: Compound PCFGs leak context on purpose
date: 2026-03-19
summary: A compound PCFG keeps the tree context-free so the inside algorithm still works, and lets context in through a per-sentence latent that rewrites rule probabilities.
tags: Grammar Induction, PCFG, NLP
topic: NLP & Parsing
draft: false
---

A probabilistic context-free grammar makes one assumption that is both its whole reason for being and its whole limitation: the probability of a subtree depends only on the nonterminal at its root, not on anything outside it. That assumption is what lets the [inside algorithm](https://en.wikipedia.org/wiki/Inside%E2%80%93outside_algorithm) compute the total probability of a sentence in cubic time, and it is why a PCFG cannot know that a sentence about finance and a sentence about cooking should expand their noun phrases differently. The compound PCFG of Kim, Dyer and Rush solved that tension with a trick that is worth naming as a design pattern, because it recurs well beyond grammar induction. It keeps the context-free assumption exactly, so that inference still works, and lets context in through a side door: a per-sentence latent vector that rewrites the rule probabilities before the grammar is applied. Conditioned on that vector the grammar is context-free. Marginally, it is not.

## What the side door does

In the [compound PCFG paper](https://arxiv.org/abs/1906.10225), each sentence gets a continuous latent variable, drawn from a prior, and the rule probabilities of the grammar are computed from that variable through a neural network. For a fixed value of the latent, the result is an ordinary PCFG: the same rule probabilities apply to every position in the tree, subtrees are independent given their root, and the inside algorithm runs unchanged. What differs from a plain neural PCFG is that the rule probabilities are different for each sentence, because the latent is, and so two subtrees in the same sentence are correlated through the latent they share. Integrate the latent out and the model is no longer context-free; it is a mixture of context-free grammars, one per point in the latent space.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The graphical model of a plain PCFG next to the compound PCFG with a per-sentence latent, showing the dependence path that exists only when the latent is unobserved</title>
<desc id="f1-d">Left: a plain PCFG, with fixed rule probabilities feeding a tree, and the tree's subtrees independent given their root nonterminals. Right: a compound PCFG, with a per-sentence latent z drawn from a prior, feeding the rule probabilities, which feed the tree. Given z the subtrees are independent as before; with z unobserved, a dependence path runs from one subtree up through the rule probabilities to z and back down to another subtree.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Same tree, one more variable</text>
<text x="8" y="52" class="viz-tick">PLAIN PCFG</text>
<rect x="60" y="64" width="140" height="40" rx="8" class="viz-box"/>
<text x="130" y="89" text-anchor="middle" class="viz-label">rule probabilities</text>
<line x1="130" y1="106" x2="130" y2="136" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="60" y="140" width="140" height="40" rx="8" class="viz-box"/>
<text x="130" y="165" text-anchor="middle" class="viz-label">tree</text>
<rect x="30" y="200" width="90" height="34" rx="6" class="viz-box"/><text x="75" y="222" text-anchor="middle" class="viz-label-muted">subtree A</text>
<rect x="140" y="200" width="90" height="34" rx="6" class="viz-box"/><text x="185" y="222" text-anchor="middle" class="viz-label-muted">subtree B</text>
<text x="130" y="262" text-anchor="middle" class="viz-tick">A, B independent given roots</text>
<text x="316" y="52" class="viz-tick">COMPOUND PCFG</text>
<rect x="420" y="40" width="100" height="34" rx="8" class="viz-box-accent"/>
<text x="470" y="62" text-anchor="middle" class="viz-label">z, per sentence</text>
<line x1="470" y1="76" x2="470" y2="96" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="400" y="100" width="140" height="40" rx="8" class="viz-box"/>
<text x="470" y="125" text-anchor="middle" class="viz-label">rule probabilities of z</text>
<line x1="470" y1="142" x2="470" y2="160" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="400" y="164" width="140" height="36" rx="8" class="viz-box"/>
<text x="470" y="187" text-anchor="middle" class="viz-label">tree</text>
<rect x="370" y="216" width="90" height="34" rx="6" class="viz-box"/><text x="415" y="238" text-anchor="middle" class="viz-label-muted">subtree A</text>
<rect x="480" y="216" width="90" height="34" rx="6" class="viz-box"/><text x="525" y="238" text-anchor="middle" class="viz-label-muted">subtree B</text>
<path d="M415 252 C 415 290, 330 200, 340 120 C 345 70, 420 57, 420 57" fill="none" class="viz-s4"/>
<text x="470" y="278" text-anchor="middle" class="viz-tick">given z independent; z unobserved, correlated</text>
</svg>
<figcaption>Illustrative: the two graphical models; the brick path on the right is the marginal dependence the latent introduces.</figcaption>
</figure>

That is the entire design, and its effect on the benchmark was large. On unsupervised parsing of the Penn Treebank, the paper reports unlabelled sentence-level F1 of 60.1 for the compound PCFG against 52.6 for a neural PCFG with the same parameterisation and no latent, with the earlier PRPN and ordered-neuron models at 47.3 and 48.1. The neural parameterisation on its own, going from a table of rule probabilities to a network that produces them, is worth a few points. The side door is worth seven and a half.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Unlabelled sentence-level F1 on the Penn Treebank test set for four unsupervised parsers</title>
<desc id="f2-d">Horizontal bars in F1: PRPN 47.3, ordered neurons 48.1, neural PCFG 52.6, compound PCFG 60.1. The compound PCFG bar is highlighted, and the gap between the last two bars is the effect of the per-sentence latent.</desc>
<text x="0" y="18" class="viz-title">The latent is worth seven and a half points</text>
<text x="0" y="36" class="viz-sub">Unlabelled sentence F1 on the PTB test set, best reported run; bars start at 40</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">PRPN</text>
<path d="M176 58 H322 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="342" y="73" class="viz-value">47.3</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Ordered neurons</text>
<path d="M176 92 H338 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="358" y="107" class="viz-value">48.1</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Neural PCFG</text>
<path d="M176 126 H428 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="448" y="141" class="viz-value">52.6</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Compound PCFG</text>
<path d="M176 160 H578 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="574" y="155" text-anchor="end" class="viz-value">60.1</text>
<text x="0" y="222" class="viz-label-muted">Twenty pixels per point above 40; the two PCFGs share everything but the latent.</text>
<text x="0" y="246" class="viz-tick">later replications report the gap with variance across seeds; the ordering has held</text>
</svg>
<figcaption>Source: Kim, Dyer and Rush, <a href="https://arxiv.org/abs/1906.10225">Compound Probabilistic Context-Free Grammars for Grammar Induction</a>, ACL 2019, Table 1, best-run figures.</figcaption>
</figure>

## Why inference survives

The reason the trick works, rather than merely being clever, is that the inside algorithm does not know the latent exists. Inference proceeds in a loop: sample a value of the latent from an amortised posterior network that reads the sentence, compute the rule probabilities from that value, run the inside algorithm with those probabilities exactly as for a plain PCFG, and marginalise the trees with the dynamic programme while the latent is handled by the sampler. The paper calls this collapsed variational inference, and the word collapsed is the point: the trees are integrated out exactly, in cubic time, and only the continuous latent needs approximation.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The inference loop: sample the latent from the amortised posterior, run the inside algorithm with latent-conditioned rule probabilities, marginalise the trees</title>
<desc id="f3-d">A cycle of four steps: the sentence enters an encoder that gives an approximate posterior over z; a z is sampled; the rule probabilities are computed from z; the inside algorithm runs with those probabilities and returns the marginal likelihood of the sentence over all trees; that likelihood, and the divergence to the prior, form the objective, which updates the encoder and the grammar.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">The dynamic programme never sees the latent change</text>
<rect x="8" y="60" width="140" height="60" rx="8" class="viz-box"/>
<text x="78" y="86" text-anchor="middle" class="viz-label">Encoder</text>
<text x="78" y="104" text-anchor="middle" class="viz-label-muted">posterior over z</text>
<line x1="150" y1="90" x2="170" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="174" y="60" width="130" height="60" rx="8" class="viz-box-accent"/>
<text x="239" y="86" text-anchor="middle" class="viz-label">Sample z</text>
<text x="239" y="104" text-anchor="middle" class="viz-label-muted">one per sentence</text>
<line x1="306" y1="90" x2="326" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="330" y="60" width="140" height="60" rx="8" class="viz-box"/>
<text x="400" y="86" text-anchor="middle" class="viz-label">Rules from z</text>
<text x="400" y="104" text-anchor="middle" class="viz-label-muted">a PCFG, for now</text>
<line x1="472" y1="90" x2="492" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="496" y="60" width="136" height="60" rx="8" class="viz-box-ink"/>
<text x="564" y="86" text-anchor="middle" class="viz-on-ink">Inside algorithm</text>
<text x="564" y="104" text-anchor="middle" class="viz-on-ink">trees summed exactly</text>
<path d="M564 122 V170 H78 V124" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="320" y="156" text-anchor="middle" class="viz-tick">likelihood plus divergence to the prior: the objective</text>
<text x="320" y="210" text-anchor="middle" class="viz-label-muted">Only the continuous latent is approximated; the discrete structure is handled exactly.</text>
</svg>
<figcaption>Illustrative: the training loop as described in the paper, drawn to show that the inside algorithm runs unchanged inside it.</figcaption>
</figure>

I implemented an extension to PCFGs whose relationship to the compound model my paper discusses, and the relationship holds at exactly this level: the inside recursion I wrote does not care where its rule probabilities came from. It takes a table of probabilities, or a function that produces them, and fills the chart. Any extension that changes the table per sentence, per document, per speaker, is compatible with that recursion as long as the table is fixed for the duration of the chart. The moment the extension needs the probabilities to depend on the chart itself, on which subtrees were chosen elsewhere in the sentence, the recursion no longer factors and cubic time is gone.

It is worth saying what the latent actually captures, because the pattern's value depends on it. In the paper's analysis the latent tends to encode properties that hold across a whole sentence: its length, its rough topic, whether it is a question, the register of its vocabulary. Those are exactly the things a plain PCFG cannot represent, because they are properties of the sentence rather than of any one subtree, and they are exactly the things that should change which rules are likely. A financial sentence uses noun phrases that expand into numbers and units; a narrative sentence uses ones that expand into pronouns. The latent lets the grammar be the financial grammar for one sentence and the narrative grammar for the next, and the inside algorithm sees a single grammar each time.

## The parameter side door as a pattern

Named as a pattern, the idea is this: leave a model's structural independence assumptions intact, and let context in only through parameters conditioned on a latent variable. The independence assumptions are what make inference tractable, so they are kept. The parameters are where the model's flexibility lives, so they are made to vary. And the latent is what ties the varying parameters to the data, so that the model can learn which parameters go with which contexts without any component ever violating the assumptions the inference relies on.

The pattern has a test, and it is the one I use when someone proposes an extension to a grammar model. Write down the inference recursion, the inside algorithm for a PCFG, and ask whether it still factors given the latent. If every term in the recursion depends on the latent only through the parameters, and the parameters are fixed once the latent is, the extension keeps the door on the parameter side and the dynamic programme survives. If some term depends on the latent through the structure, on which rule was chosen at another node, on the span a sibling covered, the door has moved to the structural side, the factorisation is broken, and whatever is gained in expressiveness is paid for with approximate inference over trees, which is the thing the pattern existed to avoid.

## Why the split, not the network, made the difference

It is tempting to attribute the compound PCFG's gain to neural parameterisation, since that is the visible novelty. The comparison in the paper says otherwise: the neural PCFG has the network and not the latent, and it lands within a few points of the older models. What the latent adds is a way for the grammar to be different for different sentences without giving up the property that makes it a grammar. That is a statement about where flexibility belongs in a structured model, and it generalises. Hidden Markov models, topic models, sequence-to-sequence models with structured decoders: each has an inference algorithm that depends on an independence assumption, and each can be given context the same way, by conditioning its parameters on something learned per instance and leaving the assumption alone. The compound PCFG is the cleanest example I know because the assumption is famous and the inference is a textbook algorithm. Context leaks in through the parameters, on purpose, and the chart never notices.
