---
title: The pumping lemma is pigeonhole on trees
date: 2025-11-04
summary: Students learn the pumping lemma as a five-variable spell. It is one observation: a tall parse tree repeats a nonterminal, and a repeated nonterminal is a subtree you can copy.
tags: Formal Languages, Proofs, NLP
topic: NLP & Parsing
draft: false
---

The [pumping lemma for context-free languages](https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages) is taught as a spell. For any context-free language there is a length p such that any string longer than p can be split into five pieces, u v w x y, with v and x not both empty, v w x no longer than p, and every string u v^i w x^i y also in the language. Students memorise the five letters, apply the spell to a^n b^n c^n, and never quite believe it. I did not believe it either until the proof for my paper on the limits of context-free recognition forced me to draw it, at which point it stopped being a spell and became a fact about trees that a first-year student can see.

## One observation

Here is the whole lemma. Take a grammar in Chomsky normal form with V nonterminals. Every internal node of a parse tree has at most two children, so a tree of height h has at most 2 to the h leaves. Turn that around: a string of length more than 2 to the V has a parse tree of height more than V, which means some root-to-leaf path has more than V internal nodes, which means, by the pigeonhole principle, some nonterminal appears twice on that path.

Call that nonterminal A. The lower A spans a substring w. The upper A spans a larger substring v w x. Because both are the same nonterminal, the subtree under the upper A can be replaced by the subtree under the lower A, which deletes v and x, or the subtree under the lower A can be replaced by a copy of the subtree under the upper A, which duplicates v and x. Do that i times and you get u v^i w x^i y, and every one of those strings has a valid parse tree, so every one is in the language. That is the lemma. The five letters are the pieces of the string that the two A nodes cut it into, and p is 2 to the power V plus one, the length at which the tree is guaranteed to be tall enough.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">A tall parse tree with a repeated nonterminal, and the pumped copy</title>
<desc id="f1-d">On the left, a parse tree from S at the top with a root-to-leaf path on which the nonterminal A appears twice, upper and lower. The leaves under the tree are labelled u, v, w, x, y with the lower A spanning w and the upper A spanning v w x. On the right, the same tree with the subtree under the lower A replaced by a copy of the subtree under the upper A, so that the leaves read u, v, v, w, x, x, y.</desc>
<text x="0" y="18" class="viz-title">Two copies of A on one path</text>
<text x="0" y="36" class="viz-sub">Left: the tree the pigeonhole guarantees. Right: the same tree, pumped once</text>
<circle cx="150" cy="70" r="14" class="viz-dgray"/><text x="150" y="75" text-anchor="middle" class="viz-onfill">S</text>
<line x1="150" y1="84" x2="150" y2="118" class="viz-arrow"/>
<circle cx="150" cy="132" r="14" class="viz-d1"/><text x="150" y="137" text-anchor="middle" class="viz-onfill">A</text>
<line x1="150" y1="146" x2="150" y2="180" class="viz-arrow"/>
<circle cx="150" cy="194" r="14" class="viz-d1"/><text x="150" y="199" text-anchor="middle" class="viz-onfill">A</text>
<line x1="150" y1="84" x2="60" y2="240" class="viz-grid"/>
<line x1="150" y1="84" x2="240" y2="240" class="viz-grid"/>
<line x1="150" y1="146" x2="95" y2="240" class="viz-grid"/>
<line x1="150" y1="146" x2="205" y2="240" class="viz-grid"/>
<line x1="150" y1="208" x2="130" y2="240" class="viz-grid"/>
<line x1="150" y1="208" x2="170" y2="240" class="viz-grid"/>
<text x="75" y="262" text-anchor="middle" class="viz-label">u</text>
<text x="112" y="262" text-anchor="middle" class="viz-label">v</text>
<text x="150" y="262" text-anchor="middle" class="viz-label">w</text>
<text x="188" y="262" text-anchor="middle" class="viz-label">x</text>
<text x="225" y="262" text-anchor="middle" class="viz-label">y</text>
<text x="150" y="290" text-anchor="middle" class="viz-label-muted">lower A spans w; upper A spans v w x</text>
<circle cx="470" cy="70" r="14" class="viz-dgray"/><text x="470" y="75" text-anchor="middle" class="viz-onfill">S</text>
<line x1="470" y1="84" x2="470" y2="118" class="viz-arrow"/>
<circle cx="470" cy="132" r="14" class="viz-d1"/><text x="470" y="137" text-anchor="middle" class="viz-onfill">A</text>
<line x1="470" y1="146" x2="470" y2="180" class="viz-arrow"/>
<circle cx="470" cy="194" r="14" class="viz-d1"/><text x="470" y="199" text-anchor="middle" class="viz-onfill">A</text>
<line x1="470" y1="208" x2="470" y2="224" class="viz-arrow"/>
<circle cx="470" cy="236" r="12" class="viz-d1"/><text x="470" y="241" text-anchor="middle" class="viz-onfill">A</text>
<line x1="470" y1="84" x2="360" y2="270" class="viz-grid"/>
<line x1="470" y1="84" x2="580" y2="270" class="viz-grid"/>
<line x1="470" y1="146" x2="400" y2="270" class="viz-grid"/>
<line x1="470" y1="146" x2="540" y2="270" class="viz-grid"/>
<line x1="470" y1="208" x2="430" y2="270" class="viz-grid"/>
<line x1="470" y1="208" x2="510" y2="270" class="viz-grid"/>
<line x1="470" y1="248" x2="455" y2="270" class="viz-grid"/>
<line x1="470" y1="248" x2="485" y2="270" class="viz-grid"/>
<text x="375" y="292" text-anchor="middle" class="viz-label">u</text>
<text x="408" y="292" text-anchor="middle" class="viz-label">v</text>
<text x="440" y="292" text-anchor="middle" class="viz-label">v</text>
<text x="470" y="292" text-anchor="middle" class="viz-label">w</text>
<text x="500" y="292" text-anchor="middle" class="viz-label">x</text>
<text x="532" y="292" text-anchor="middle" class="viz-label">x</text>
<text x="565" y="292" text-anchor="middle" class="viz-label">y</text>
<text x="470" y="320" text-anchor="middle" class="viz-label-muted">lower subtree replaced by a copy of the upper</text>
</svg>
<figcaption>Illustrative: the standard proof drawn as trees; the shapes are schematic and the copy is the entire content of the lemma.</figcaption>
</figure>

Two details in that argument are the ones students trip on, and both are visible in the drawing. The condition that v and x are not both empty comes from choosing the lowest pair of repeated A nodes, so that the upper A really does span more than the lower one; a pair with nothing between them would pump nothing. The condition that v w x is no longer than p comes from the same choice: the subtree under the upper A is itself short enough not to contain a repeat below it, so its leaves number at most 2 to the V. Neither is a separate fact to memorise. Both are where you put your finger on the tree.

Seen that way, the famous proof that a^n b^n c^n is not context-free is two lines. If it were, a long enough string would have a repeated nonterminal, and pumping it would add copies of v and x. But v and x are two substrings of a string with three blocks, so at most two of the three letters get more copies, and the counts stop matching. A grammar with no memory beyond its finite set of nonterminals cannot keep three counts in step, because the only way it keeps any count is by nesting, and nesting pairs things.

## The tall tree test

For anything I want to show is not context-free, the working form of the lemma is what I call the tall tree test. Find a family of strings that, in any grammar for the language, must have parse trees taller than the number of nonterminals. Then show that duplicating the repeated subtree breaks something the language requires: a count that must match, or a copy that must be exact. The five letters never have to be named. The tree does the work.

The test also makes the lemma's limits obvious, which the spell version hides. The lemma says every long string in a context-free language can be pumped. It does not say every language in which every long string can be pumped is context-free; the implication runs one way. There are non-context-free languages that pass the pumping test, and that is why [Ogden's lemma](https://en.wikipedia.org/wiki/Ogden%27s_lemma) exists, which lets you mark positions and insist that the pumped part includes some of them. In the tree picture Ogden's lemma is the same pigeonhole with the path chosen to pass through the marked leaves. Nothing new is happening; the argument is being aimed.

## The number in the lemma is useless, and that is fine

The pumping length p is 2 to the power of the nonterminal count plus one, and it is worth computing once to see how useless it is as a practical test. A tidy grammar for JSON, binarised, has a few dozen nonterminals; its pumping length is in the billions of characters. A grammar induced from the Penn Treebank sample I used in [another post](/blog/cube-nobody-actually-pays/) has 707 nonterminals, and its pumping length is 2 to the 708, a number with more than two hundred digits.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Pumping length against nonterminal count, as a number of digits</title>
<desc id="f2-d">A rising line: the pumping length 2 to the power of V plus 1 has about 2 digits at 5 nonterminals, 4 at 10, 7 at 20, 16 at 50, 31 at 100 and 214 at 707, the nonterminal count of a treebank-induced grammar.</desc>
<text x="0" y="18" class="viz-title">Astronomical as a test, adequate as a proof</text>
<text x="0" y="36" class="viz-sub">Digits in the pumping length, 2 to the power V plus 1</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">240</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">180</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">120</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">60</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">5</text>
<text x="164.8" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="273.6" y="288" text-anchor="middle" class="viz-tick">20</text>
<text x="382.4" y="288" text-anchor="middle" class="viz-tick">50</text>
<text x="491.2" y="288" text-anchor="middle" class="viz-tick">100</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">707</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Nonterminals in the grammar, V (spacing is categorical)</text>
<polyline points="56,262.3 164.8,260.5 273.6,257.9 382.4,250.1 491.2,237.1 600,78.5" class="viz-s1"/>
<circle cx="600" cy="78.5" r="5" class="viz-d1"/>
<text x="592" y="72" text-anchor="end" class="viz-value">214 digits</text>
<circle cx="164.8" cy="260.5" r="4" class="viz-d1"/>
<text x="176" y="250" class="viz-value">4 digits</text>
</svg>
<figcaption>Source: computed as the digits of 2 to the power V plus 1; the nonterminal count of 707 is from the grammar induced on the <a href="https://www.nltk.org/nltk_data/">NLTK Penn Treebank sample</a>, and the standard bound is stated in any treatment of the <a href="https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages">lemma</a>.</figcaption>
</figure>

Nobody will ever test a string of that length, and nobody needs to. The number is there to make the existence claim true, and existence is all a proof requires. A student who worries that the pumping length is impractical has confused a proof with a procedure. The lemma is not a way of checking strings; it is a way of showing that no grammar can exist, and for that one tall tree is enough.

## Copy or count

The applied version of the test, the one I use when someone asks whether a format can be described by a context-free grammar, is a rule I call copy or count. If the format requires an unbounded exact copy, one substring repeated verbatim elsewhere with no bound on its length, it fails the test. If it requires three or more counts to match, it fails. If it requires only pairs to match, nested, it may pass.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Formats placed by whether they need an unbounded copy or a triple count</title>
<desc id="f3-d">A two by two grid. Horizontal axis: needs an unbounded exact copy, no on the left, yes on the right. Vertical axis: needs three matched counts, no at the bottom, yes at the top. Bottom left: JSON and balanced brackets, context-free. Bottom right: XML with matching tag names and length-prefixed records, not context-free. Top left: a to the n b to the n c to the n, not context-free. Top right: both failures at once.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">a^n b^n c^n</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">three counts: not context-free</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Both at once</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">fails twice over</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">JSON, balanced brackets</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">nested pairs: context-free</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">XML with matching names</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">and TLV length prefixes: not</text>
<circle cx="192" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Needs an unbounded exact copy: no to yes</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Needs three matched counts: no to yes</text>
</svg>
<figcaption>Illustrative: a placement of familiar formats by the two failures the tall tree test detects.</figcaption>
</figure>

The XML case surprises people, and it is the best example because everyone has parsed XML with a context-free-looking parser. An opening tag with an arbitrary name must be closed by a tag with the same name, and the name is unbounded: that is an exact copy, the language w w in disguise, and no context-free grammar generates it. Real parsers handle it by cheating in the lexer, matching names with a stack of strings rather than with the grammar, which is a fine engineering answer and is not a context-free grammar. Length-prefixed records fail the same way: the prefix is a count that must equal the length of what follows, which is a copy of a number into a length.

The practical consequence, and the reason the lemma matters to anyone building constrained decoding or a validator, is that a grammar can enforce the shape of these formats and can never enforce the copy. That has to be checked afterwards, by something that can compare two strings. The pumping lemma is the proof that no cleverness with the grammar will remove the need, and the tall tree is the reason: a grammar's only memory is the path from the root, and a path cannot hold a string it has to repeat.
