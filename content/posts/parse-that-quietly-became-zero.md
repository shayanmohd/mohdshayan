---
title: The parse that quietly became zero
date: 2026-03-17
summary: A Viterbi parse multiplies one probability per rule. In float32 the best parse of a typical sentence underflows to zero and the argmax is a tie. Log space is not an optimisation.
tags: Parsing, Numerical Methods, NLP
draft: false
---

The probabilistic extension of my CYK parser decodes in the log domain, and when I wrote that sentence in the paper it read like a stylistic choice, the kind of thing a careful implementer does. It is not a choice. Done in the probability domain, the parser is wrong on most real sentences, and it is wrong silently: it returns a legal tree that happens to be the first one it tried, with a score of exactly zero, and nothing in the output says so. I measured how quickly that happens, and the answer is sooner than most people would guess.

## The arithmetic of a parse

A probabilistic context-free grammar assigns each rule a probability, and the probability of a tree is the product of the probabilities of the rules used to build it. A Viterbi parse, the most probable tree for a sentence, is found by CYK with the sum replaced by max and the count replaced by product: each chart cell holds the best probability for its span, computed as the product of the best probabilities of two sub-spans and the rule that joins them.

Every factor in that product is below one, and most are well below one, because a nonterminal with many expansions gives each of them a small share. A tree for a sentence of n tokens uses on the order of 2n rules, counting the lexical rules that attach words to tags, so its probability is a product of a few dozen small numbers. That product shrinks geometrically with the length of the sentence, and IEEE floats have a floor.

## Measured on a treebank grammar

The grammar and the sentences below come from the Penn Treebank sample that ships with [NLTK](https://www.nltk.org/nltk_data/): 3,914 parsed sentences, from which a PCFG can be induced by counting the rules in the gold trees. For each sentence I computed the log probability of its own gold tree under that grammar, which is a fair proxy for the probability of the best parse, since the gold tree is usually at or near it.

The mean log probability per token comes out at about minus 6.8 nats, and it is nearly flat across lengths: a ten-token sentence's tree scores around minus 100, a thirty-token sentence's around minus 230, a fifty-token sentence's around minus 370. The float floors sit at fixed heights. The smallest normal single-precision value is 2 to the negative 126, whose natural log is minus 87.3; for double precision it is 2 to the negative 1022, with a log of minus 708.4, per the [IEEE 754 formats](https://en.wikipedia.org/wiki/Single-precision_floating-point_format).

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Log probability of the gold tree against sentence length, with the float32 floor</title>
<desc id="f1-d">A falling line of mean gold-tree log probability by length bin: minus 46 for sentences under ten tokens, minus 101 for ten to nineteen, minus 165 for twenty to twenty-nine, minus 231 for thirty to thirty-nine, minus 292 for forty to forty-nine, minus 368 for fifty to fifty-nine, and minus 543 for sixty or more. A horizontal marker at minus 87.3 shows the float32 floor; every bin from ten tokens upward is below it. The float64 floor at minus 708 is below the chart.</desc>
<text x="0" y="18" class="viz-title">Below the floor by the second bin</text>
<text x="0" y="36" class="viz-sub">Mean natural log probability of the gold tree, by sentence length</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-axis"/><text x="48" y="60" text-anchor="end" class="viz-tick">0</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">-150</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">-300</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">-450</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-grid"/><text x="48" y="268" text-anchor="end" class="viz-tick">-600</text>
<text x="94.9" y="288" text-anchor="middle" class="viz-tick">under 10</text>
<text x="172.6" y="288" text-anchor="middle" class="viz-tick">10s</text>
<text x="250.3" y="288" text-anchor="middle" class="viz-tick">20s</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">30s</text>
<text x="405.7" y="288" text-anchor="middle" class="viz-tick">40s</text>
<text x="483.4" y="288" text-anchor="middle" class="viz-tick">50s</text>
<text x="561.1" y="288" text-anchor="middle" class="viz-tick">60 or more</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Sentence length in tokens</text>
<line x1="56" y1="86.3" x2="600" y2="86.3" class="viz-s4"/>
<text x="596" y="80" text-anchor="end" class="viz-label-muted">float32 floor, ln 2^-126 = -87.3</text>
<polyline points="94.9,72 172.6,91.2 250.3,113.1 328,136 405.7,157.1 483.4,183.4 561.1,244.2" class="viz-s1"/>
<circle cx="94.9" cy="72" r="4" class="viz-d1"/>
<circle cx="172.6" cy="91.2" r="4" class="viz-d1"/>
<circle cx="250.3" cy="113.1" r="4" class="viz-d1"/>
<circle cx="328" cy="136" r="4" class="viz-d1"/>
<circle cx="405.7" cy="157.1" r="4" class="viz-d1"/>
<circle cx="483.4" cy="183.4" r="4" class="viz-d1"/>
<circle cx="561.1" cy="244.2" r="4" class="viz-d1"/>
<text x="110" y="68" class="viz-value">-46</text>
<text x="553" y="262" text-anchor="end" class="viz-value">-543</text>
</svg>
<figcaption>Source: computed by the author from a PCFG induced on the <a href="https://www.nltk.org/nltk_data/">NLTK Penn Treebank sample</a>, scoring each sentence's gold tree; floor from the IEEE 754 single-precision minimum normal value.</figcaption>
</figure>

The per-token figure includes the lexical rules, one per word, which carry most of the cost: a part-of-speech tag with thousands of possible words gives each word a small probability, and those factors dominate the product. A grammar with a smaller vocabulary per tag would drift down more slowly, and a grammar with finer tags would drift faster. The rate is a property of the grammar, and the floors are not.

Divide the floor by the per-token rate and you get what I call the underflow horizon: the sentence length beyond which the best parse's probability is expected to fall below the smallest normal float. For this grammar it is about 13 tokens in single precision and about 104 in double. The median sentence in the sample is 25 tokens long. In single precision, 3,349 of the 3,914 gold trees, 86 percent, have a probability below the float32 floor. In double precision, three do.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Share of gold trees whose probability underflows, by float type</title>
<desc id="f2-d">Two columns: in float32, 85.6 percent of the 3,914 gold trees have a probability below the smallest normal value; in float64, 0.08 percent, three trees.</desc>
<text x="0" y="18" class="viz-title">How much of a corpus the parser cannot score</text>
<text x="0" y="36" class="viz-sub">Per cent of 3,914 gold trees below the smallest normal float</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M195.3 84 V80 a4 4 0 0 1 4 -4 H215.3 a4 4 0 0 1 4 4 V250 H195.3 Z" class="viz-f1"/>
<text x="207.3" y="68" text-anchor="middle" class="viz-value">85.6%</text>
<text x="207.3" y="272" text-anchor="middle" class="viz-label-muted">float32, 3,349 trees</text>
<rect x="436.7" y="248.5" width="24" height="1.5" class="viz-fgray"/>
<text x="448.7" y="236" text-anchor="middle" class="viz-value">0.08%</text>
<text x="448.7" y="272" text-anchor="middle" class="viz-label-muted">float64, 3 trees</text>
</svg>
<figcaption>Source: computed by the author from the grammar induced on the <a href="https://www.nltk.org/nltk_data/">NLTK Penn Treebank sample</a> and the IEEE 754 minimum normal values for single and double precision.</figcaption>
</figure>

Subnormal floats extend the floors a little, to a log of about minus 103 in single precision, but they lose precision as they go and they do not change the picture: most sentences in a newspaper are past the horizon before the parser is halfway through them.

## Why the failure is silent

Underflow in a max-product parse does not raise an error. The chart cell for a span whose best probability is too small simply holds zero, and every larger span built on it holds zero too. When the parser reaches the top cell, the best probability over all trees is zero, and so is the second best, and the third.

The argmax is a tie, and a tie is broken by whatever the implementation does first, usually the first rule tried at the first split point. The traceback then follows those arbitrary choices down the chart and produces a grammatical tree with the right leaves and a structure that has nothing to do with likelihood. The output is well-formed. The score is 0.0. Nothing complains.

It gets worse before it gets to zero. Between the smallest normal value and true zero lie the subnormal floats, where the number of significant bits shrinks as the value falls. A parser operating in that range is comparing probabilities that have lost most of their precision, so two trees whose true probabilities differ by a factor of two can compare equal, or the wrong way round, before either reaches zero. The tie among zeros is the visible end of a failure that began several tokens earlier, when the comparisons quietly stopped being accurate.

There is also the scaling trick, which is worth naming because it is the alternative some implementations choose. Multiply every cell by a large constant at each level and keep track of the exponent separately, the way some HMM implementations do. It works, and it is more bookkeeping than the log domain for no gain: the log form needs no rescaling, has no constant to tune, and turns the multiplication into an addition. For a parser, logs win on every axis.

That is why the log domain is not an optimisation. Replace every probability with its natural log, every product with a sum, and leave max as max, since the log is monotonic and the argmax is unchanged. The chart now holds numbers around minus 200 instead of numbers around 10 to the negative 90, and double precision has room for sentences tens of thousands of tokens long. The arithmetic is slightly different, addition instead of multiplication, and slightly faster on most hardware, but that is incidental. The point is that the answer is the correct tree instead of the first one.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">One CYK cell update in the probability domain and in the log domain</title>
<desc id="f3-d">Two side by side boxes. On the left, the probability domain: the cell's value is the maximum over splits and rules of the product of the left sub-span, the right sub-span and the rule probability, and the product becomes zero once it is below the float floor. On the right, the log domain: the cell's value is the maximum over splits and rules of the sum of the three log probabilities, and the sum stays representable.</desc>
<rect x="8" y="30" width="300" height="180" rx="8" class="viz-box"/>
<text x="158" y="58" text-anchor="middle" class="viz-label">Probability domain</text>
<text x="158" y="86" text-anchor="middle" class="viz-value">cell[i,j][A] = max over k of</text>
<text x="158" y="104" text-anchor="middle" class="viz-value">cell[i,k][B] x cell[k,j][C]</text>
<text x="158" y="122" text-anchor="middle" class="viz-value">x P(A to B C)</text>
<text x="158" y="150" text-anchor="middle" class="viz-label-muted">product of many numbers below 1</text>
<text x="158" y="170" text-anchor="middle" class="viz-label-muted">reaches 0.0 near 13 tokens in float32</text>
<text x="158" y="196" text-anchor="middle" class="viz-tick">argmax over zeros: a tie</text>
<rect x="332" y="30" width="300" height="180" rx="8" class="viz-box-accent"/>
<text x="482" y="58" text-anchor="middle" class="viz-label">Log domain</text>
<text x="482" y="86" text-anchor="middle" class="viz-value">cell[i,j][A] = max over k of</text>
<text x="482" y="104" text-anchor="middle" class="viz-value">cell[i,k][B] + cell[k,j][C]</text>
<text x="482" y="122" text-anchor="middle" class="viz-value">+ log P(A to B C)</text>
<text x="482" y="150" text-anchor="middle" class="viz-label-muted">sum of many negative numbers</text>
<text x="482" y="170" text-anchor="middle" class="viz-label-muted">around -200 for a long sentence</text>
<text x="482" y="196" text-anchor="middle" class="viz-tick">argmax unchanged, and defined</text>
<text x="320" y="244" text-anchor="middle" class="viz-label-muted">max survives the log; the product does not survive the float</text>
</svg>
<figcaption>Illustrative: the same recurrence written both ways; the log form is the one in the paper's PCFG extension.</figcaption>
</figure>

## Where the same bug lives

Nothing here is specific to parsing. Any model that scores a sequence as a product of per-step probabilities has the same horizon: hidden Markov models, beam search over a language model, any pipeline that multiplies likelihoods across a long input. The per-step rate differs, the floor is the same, and the failure is the same tie among zeros. The inside algorithm, which sums over trees instead of taking the max, has a harder version of the problem, because a sum of logs is not the log of a sum and needs the log-sum-exp trick at every cell, at a cost in exponentials that Viterbi never pays.

The general rule is the one every numerical methods course teaches and every fresh implementation forgets: a probability is a log until the very end, and it is converted back, if at all, only for display. When the paper says the Viterbi extension decodes in the log domain, that sentence is the difference between a parser that finds the most probable tree and one that finds a tree.
