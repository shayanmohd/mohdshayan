---
title: The cube nobody actually pays
date: 2026-09-17
summary: CYK is quoted as cubic in sentence length. For a treebank-scale grammar the grammar term dominates until sentences are longer than people write, so shrink the grammar first.
tags: Parsing, Algorithms, NLP
draft: false
---

Every textbook introduction to the CYK algorithm ends with the same sentence: it runs in time cubic in the length of the input. That is true, and it is the least useful true thing you can say about the algorithm. The full bound, the one I proved for the parser in my ACL Student Research Workshop paper, is O(n cubed times the size of the grammar), and for the grammars anyone actually parses with, the second factor is the one you pay. The cube is a threat that only arrives for sentences longer than people write.

## The bound, read properly

CYK fills a triangular chart with one cell for every span of the sentence: n squared over two cells for n tokens. Each cell asks, for every split point inside the span, whether some binary rule A to B C has B covering the left part and C covering the right. That inner loop is where the cube comes from: n squared cells, up to n split points each. But for each split point the parser considers every binary rule in the grammar, and that is the factor the textbook sentence drops.

So the work is roughly n cubed times the number of binary rules, or, more carefully, n cubed times a constant that depends on how many rules can fire per cell. Written that way, the question of which term dominates is a question about a number: the sentence length at which n cubed first exceeds the grammar size. Call it n star, the grammar-length crossover. Below it the parser is grammar-bound and the way to make it faster is to shrink the grammar or prune the cells. Above it the parser is length-bound and the split-point tricks start to matter.

## Measured on a real grammar

The numbers below come from the Penn Treebank sample that ships with [NLTK](https://www.nltk.org/nltk_data/), about a tenth of the Wall Street Journal portion of the treebank described by [Marcus, Santorini and Marcinkiewicz](https://aclanthology.org/J93-2004/). Reading every production off its parse trees gives an induced grammar with 707 nonterminals and 21,763 distinct productions, of which 13,781 are lexical (a part of speech to a word) and 7,982 are phrasal. Of the phrasal rules, 666 are unary, 1,848 are binary, and 5,468 have three or more symbols on the right-hand side and would each become several binary rules under conversion to Chomsky normal form.

Take the 7,982 phrasal rules as the grammar size and the crossover is the cube root of 7,982, which is 20. Take all 21,763 productions and it is about 28. Convert to normal form first, which expands the 5,468 long rules, and it moves higher still.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Sentence length cubed against the size of an induced treebank grammar</title>
<desc id="f1-d">A curve of n cubed on a logarithmic axis, from 1,000 at n equals 10 to 125,000 at n equals 50, crossing two horizontal lines: 7,982 phrasal rules at n equals 20, and 21,763 total productions at n equals 28.</desc>
<text x="0" y="18" class="viz-title">Where n cubed overtakes the grammar</text>
<text x="0" y="36" class="viz-sub">Log scale; grammar induced from the NLTK Penn Treebank sample</text>
<line x1="56" y1="66" x2="600" y2="66" class="viz-grid"/><text x="52" y="70" text-anchor="end" class="viz-tick">100,000</text>
<line x1="56" y1="165" x2="600" y2="165" class="viz-grid"/><text x="48" y="169" text-anchor="end" class="viz-tick">10,000</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1,000</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">20</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">30</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">40</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">50</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Sentence length in tokens, n</text>
<line x1="56" y1="174.7" x2="600" y2="174.7" class="viz-s2"/>
<text x="596" y="188" text-anchor="end" class="viz-label-muted">7,982 phrasal rules</text>
<line x1="56" y1="131.5" x2="600" y2="131.5" class="viz-s3"/>
<text x="596" y="126" text-anchor="end" class="viz-label-muted">21,763 productions in total</text>
<polyline points="56,264 124,211.7 192,174.6 260,145.8 328,122.3 464,85.2 600,56.4" class="viz-s1"/>
<circle cx="192" cy="174.7" r="5" class="viz-d1"/>
<text x="200" y="200" class="viz-value">n = 20</text>
<circle cx="299.4" cy="131.5" r="5" class="viz-d1"/>
<text x="308" y="150" class="viz-value">n = 28</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">n cubed</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">phrasal</text>
<line x1="550" y1="31" x2="564" y2="31" class="viz-s3"/><text x="570" y="35" class="viz-label-muted">all rules</text>
</svg>
<figcaption>Source: grammar sizes computed by the author from the productions of the parsed sentences in the <a href="https://www.nltk.org/nltk_data/">NLTK Penn Treebank sample</a>; the curve is n cubed.</figcaption>
</figure>

Now put that beside the sentences. The same sample has 3,914 sentences with a mean length of 25.7 tokens, a median of 25, and a 90th percentile of 41. About a third of them are shorter than 20 tokens, and those sit entirely below the phrasal crossover: for them, the parser spends more of its time on the grammar than on the length. Most of the rest sit between 20 and 40, where the two terms are within a small factor of each other. The sentences where the cube is clearly the cost, above 50 tokens, are about 3.5 percent of the corpus.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Sentence lengths in the Penn Treebank sample</title>
<desc id="f2-d">Seven columns counting sentences by length: 295 under 10 tokens, 979 from 10 to 19, 1,312 from 20 to 29, 853 from 30 to 39, 338 from 40 to 49, 102 from 50 to 59, and 35 at 60 or more. Most sentences fall between 10 and 39 tokens.</desc>
<text x="0" y="18" class="viz-title">Where the sentences are</text>
<text x="0" y="36" class="viz-sub">3,914 sentences by length in tokens, NLTK Penn Treebank sample</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M82.9 210.4 V206.4 a4 4 0 0 1 4 -4 H102.9 a4 4 0 0 1 4 4 V250 H82.9 Z" class="viz-fgray"/>
<text x="94.9" y="194.4" text-anchor="middle" class="viz-value">295</text>
<text x="94.9" y="272" text-anchor="middle" class="viz-label-muted">under 10</text>
<path d="M160.6 109.2 V105.2 a4 4 0 0 1 4 -4 H180.6 a4 4 0 0 1 4 4 V250 H160.6 Z" class="viz-fgray"/>
<text x="172.6" y="93.2" text-anchor="middle" class="viz-value">979</text>
<text x="172.6" y="272" text-anchor="middle" class="viz-label-muted">10 to 19</text>
<path d="M238.3 60 V56 a4 4 0 0 1 4 -4 H258.3 a4 4 0 0 1 4 4 V250 H238.3 Z" class="viz-f1"/>
<text x="250.3" y="44" text-anchor="middle" class="viz-value">1,312</text>
<text x="250.3" y="272" text-anchor="middle" class="viz-label-muted">20 to 29</text>
<path d="M316 127.9 V123.9 a4 4 0 0 1 4 -4 H336 a4 4 0 0 1 4 4 V250 H316 Z" class="viz-fgray"/>
<text x="328" y="111.9" text-anchor="middle" class="viz-value">853</text>
<text x="328" y="272" text-anchor="middle" class="viz-label-muted">30 to 39</text>
<path d="M393.7 204 V200 a4 4 0 0 1 4 -4 H413.7 a4 4 0 0 1 4 4 V250 H393.7 Z" class="viz-fgray"/>
<text x="405.7" y="188" text-anchor="middle" class="viz-value">338</text>
<text x="405.7" y="272" text-anchor="middle" class="viz-label-muted">40 to 49</text>
<path d="M471.4 238.9 V234.9 a4 4 0 0 1 4 -4 H491.4 a4 4 0 0 1 4 4 V250 H471.4 Z" class="viz-fgray"/>
<text x="483.4" y="222.9" text-anchor="middle" class="viz-value">102</text>
<text x="483.4" y="272" text-anchor="middle" class="viz-label-muted">50 to 59</text>
<rect x="549.1" y="244.8" width="24" height="5.2" class="viz-fgray"/>
<text x="561.1" y="232.8" text-anchor="middle" class="viz-value">35</text>
<text x="561.1" y="272" text-anchor="middle" class="viz-label-muted">60 or more</text>
</svg>
<figcaption>Source: computed by the author from the <a href="https://www.nltk.org/nltk_data/">NLTK Penn Treebank sample</a>, a subset of the corpus described in <a href="https://aclanthology.org/J93-2004/">Marcus et al. (1993)</a>.</figcaption>
</figure>

## What conversion does to the number

The crossover moves in one direction under conversion to Chomsky normal form, and it is worth knowing which. Of the sample's phrasal rules, 5,468 have three or more symbols on the right-hand side, and CYK cannot use them as they are. Binarisation replaces each rule of arity k with k minus 1 binary rules, introducing a fresh nonterminal at each step, so a rule with five symbols on the right becomes four rules. The unary rules go the other way, being eliminated by composing them into the rules they chain to, which can add rules too. The exact size after conversion depends on the order of the steps and on how much sharing the binarisation finds, but for a grammar shaped like this one the binary rule count after conversion is several times the 1,848 that were binary to begin with, and the crossover rises with it.

The lexical rules deserve a separate note because they look like the largest part of the grammar and are not part of the cube at all. The 13,781 lexical rules are consulted once per token, to fill the bottom row of the chart, and never again. Their cost is linear in the sentence length and proportional to the lookup, not to the number of splits. Counting them in the grammar term overstates the constant; the term that multiplies the cube is the number of binary rules the split loop can try, and that is the number to shrink.

## What the practitioner actually pays

The consequence is a reversal of where the effort should go. If the cube were the cost, the right optimisations would be about the split loop: better memory layout for the chart, vectorising the inner comparison, pruning split points. Those are the optimisations people reach for, because the textbook sentence told them where the cost was. For sentences of the length that exists, the cost is the number of rules that can fire in each cell, and the optimisations that pay are the ones that make that number small.

Shrinking the grammar is the first. Two grammars that recognise the same language can differ in rule count by a large factor, and every rule the parser does not have to try is work saved in every cell of every sentence. The conversion to Chomsky normal form is where a grammar's size is most often decided, and it deserves more care than it gets. Indexing the grammar is the second: rather than trying every binary rule at every split, index rules by their right-hand-side symbols so that a cell only looks at rules whose B and C are actually present. That turns the per-cell constant from the grammar size into the number of matching rules, which for most cells is a small number.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The CYK chart for a six-token sentence, and where the two terms live</title>
<desc id="f3-d">A triangle of cells: six in the bottom row for single tokens, then five, four, three, two, and one at the top for the whole sentence. One cell in the middle is highlighted with arrows to the cells below it that its split loop combines. A note explains that the number of cells and splits gives the cube, and the rules tried inside each cell give the grammar term.</desc>
<rect x="56" y="240" width="76" height="30" rx="4" class="viz-box"/><rect x="142" y="240" width="76" height="30" rx="4" class="viz-box"/><rect x="228" y="240" width="76" height="30" rx="4" class="viz-box"/><rect x="314" y="240" width="76" height="30" rx="4" class="viz-box"/><rect x="400" y="240" width="76" height="30" rx="4" class="viz-box"/><rect x="486" y="240" width="76" height="30" rx="4" class="viz-box"/>
<rect x="99" y="200" width="76" height="30" rx="4" class="viz-box"/><rect x="185" y="200" width="76" height="30" rx="4" class="viz-box"/><rect x="271" y="200" width="76" height="30" rx="4" class="viz-box"/><rect x="357" y="200" width="76" height="30" rx="4" class="viz-box"/><rect x="443" y="200" width="76" height="30" rx="4" class="viz-box"/>
<rect x="142" y="160" width="76" height="30" rx="4" class="viz-box"/><rect x="228" y="160" width="76" height="30" rx="4" class="viz-box-accent"/><rect x="314" y="160" width="76" height="30" rx="4" class="viz-box"/><rect x="400" y="160" width="76" height="30" rx="4" class="viz-box"/>
<rect x="185" y="120" width="76" height="30" rx="4" class="viz-box"/><rect x="271" y="120" width="76" height="30" rx="4" class="viz-box"/><rect x="357" y="120" width="76" height="30" rx="4" class="viz-box"/>
<rect x="228" y="80" width="76" height="30" rx="4" class="viz-box"/><rect x="314" y="80" width="76" height="30" rx="4" class="viz-box"/>
<rect x="271" y="40" width="76" height="30" rx="4" class="viz-box"/>
<text x="309" y="60" text-anchor="middle" class="viz-label-muted">whole sentence</text>
<text x="266" y="180" text-anchor="middle" class="viz-label">span 3 to 5</text>
<line x1="266" y1="192" x2="228" y2="240" class="viz-arrow"/>
<line x1="266" y1="192" x2="309" y2="200" class="viz-arrow"/>
<text x="30" y="258" class="viz-tick">tokens</text>
<text x="600" y="100" text-anchor="end" class="viz-label-muted">cells times splits: the cube</text>
<text x="600" y="120" text-anchor="end" class="viz-label-muted">rules tried per split: the grammar</text>
</svg>
<figcaption>Illustrative: the chart shape for n equals 6; the highlighted cell combines two of its sub-spans at each split point.</figcaption>
</figure>

## Why the sentence survives

The textbook sentence survives because it is true for a fixed grammar, and a course fixes the grammar on the whiteboard. Once the grammar is a constant, the only variable is n, and the bound is cubic in the only variable. The sentence is not wrong. It answers a question nobody building a parser is asking.

There is also a fairness point on the other side. For very long inputs, and for grammars that are small by design, the cube is real. A parser for a programming language with a few hundred rules and inputs of thousands of tokens is length-bound from the first line, which is one reason nobody parses programs with CYK. The crossover is a number, and for that grammar it is low. For a grammar read off a treebank it is roughly where the sentences are, and that is the whole point of computing it rather than quoting it.

If you are building or benchmarking a CYK parser, do the arithmetic before the engineering. Count the rules after conversion, take the cube root, and put that number next to the length distribution of what you will parse. Whichever side of the crossover your sentences sit on tells you which term you are paying, and it is usually not the one on the whiteboard.
