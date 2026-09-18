---
title: What Chomsky normal form costs you
date: 2025-07-21
summary: Converting a grammar to Chomsky normal form is taught as a formality. It can multiply the rule count many times over, and the unit-rule step, not binarisation, does the damage.
tags: Formal Languages, Parsing, Grammars
draft: false
---

Every textbook that introduces the CYK algorithm says the same thing in the same tone: the grammar must first be converted to Chomsky normal form, which can always be done, and the conversion is a formality. It can always be done. It is not a formality. On a real grammar the conversion can multiply the rule count by an order of magnitude, and because the running time of CYK carries the grammar size as a factor, the multiplication lands directly in the parser's cost. My CYK implementation takes normal-form grammars, and the complexity term in my paper is the size after conversion, so I measured what the conversion actually costs on grammars I could get hold of, step by step. The step everyone worries about, binarisation, is nearly free. The step everyone forgets, unit-rule elimination, is the bill.

## The five steps

Chomsky normal form allows two kinds of rule: a nonterminal produces exactly two nonterminals, or a nonterminal produces exactly one terminal. Getting an arbitrary grammar into that shape takes five steps, conventionally named START, TERM, BIN, DEL and UNIT. START adds a fresh start symbol so that the old one can appear on the right of rules. TERM replaces every terminal that appears in a rule with other symbols by a new nonterminal that produces only that terminal. BIN splits every rule with more than two symbols on the right into a chain of two-symbol rules. DEL removes rules that produce the empty string, by adding copies of every rule that could have used them. UNIT removes rules of the form one nonterminal produces one other nonterminal, by copying the target's rules up to the source.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The five conversion steps as a pipeline, annotated with how many rules each can add</title>
<desc id="f1-d">Five boxes in sequence: START adds one rule. TERM adds at most one rule per distinct terminal. BIN adds, for each rule with k symbols on the right, k minus two rules, linear in the grammar. DEL can add up to two to the power of the number of nullable symbols in a rule, but after BIN that is bounded by a constant. UNIT can add a copy of every rule for every unit pair, up to the number of nonterminals times the number of rules.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Four cheap steps and one that can copy the whole grammar</text>
<rect x="8" y="50" width="108" height="70" rx="8" class="viz-box"/>
<text x="62" y="76" text-anchor="middle" class="viz-label">START</text>
<text x="62" y="96" text-anchor="middle" class="viz-label-muted">adds 1</text>
<line x1="118" y1="85" x2="134" y2="85" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="138" y="50" width="108" height="70" rx="8" class="viz-box"/>
<text x="192" y="76" text-anchor="middle" class="viz-label">TERM</text>
<text x="192" y="96" text-anchor="middle" class="viz-label-muted">per terminal</text>
<line x1="248" y1="85" x2="264" y2="85" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="268" y="50" width="108" height="70" rx="8" class="viz-box"/>
<text x="322" y="76" text-anchor="middle" class="viz-label">BIN</text>
<text x="322" y="96" text-anchor="middle" class="viz-label-muted">k minus 2 each</text>
<line x1="378" y1="85" x2="394" y2="85" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="398" y="50" width="108" height="70" rx="8" class="viz-box"/>
<text x="452" y="76" text-anchor="middle" class="viz-label">DEL</text>
<text x="452" y="96" text-anchor="middle" class="viz-label-muted">bounded</text>
<line x1="508" y1="85" x2="524" y2="85" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="528" y="50" width="104" height="70" rx="8" class="viz-box-accent"/>
<text x="580" y="76" text-anchor="middle" class="viz-label">UNIT</text>
<text x="580" y="96" text-anchor="middle" class="viz-label-muted">copies rules</text>
<text x="320" y="160" text-anchor="middle" class="viz-label-muted">Worst case: every nonterminal reaches every other, and each copy is the whole grammar.</text>
<text x="320" y="186" text-anchor="middle" class="viz-tick">nonterminals times rules: quadratic; the other four steps are linear</text>
<text x="320" y="232" text-anchor="middle" class="viz-label-muted">Order matters: DEL after BIN to stay bounded, and UNIT last,</text>
<text x="320" y="254" text-anchor="middle" class="viz-label-muted">so that DEL cannot recreate unit rules after they were removed.</text>
</svg>
<figcaption>Illustrative: the standard conversion pipeline with the growth each step can cause; the bounds are the textbook ones.</figcaption>
</figure>

The textbook analysis gives each step a bound, and the bounds are not equal. START adds one rule. TERM adds at most one rule per terminal. BIN adds, for a rule with k symbols on the right, k minus two new rules, so its total is linear in the size of the grammar as written. DEL is the step with the scary exponent, two to the number of nullable symbols in a rule, but after BIN every rule has at most two symbols, so the exponent is at most two and the step is bounded. UNIT is the one whose bound is quadratic: for every pair of nonterminals connected by a chain of unit rules, the target's rules are copied to the source, and in the worst case that is every nonterminal times every rule.

## Measuring the tax

I call the ratio of rules after conversion to rules before the CNF tax, and I measured it on three grammars with a script that applies the five steps and counts after each. The first is a grammar for JSON written from the productions in [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259), with character classes collapsed to single terminals: 43 rules. The second is the arithmetic expression grammar every compiler course uses: 10 rules. The third is the grammar induced from the parsed sentences in the [Penn Treebank sample](https://www.nltk.org/nltk_data/) that ships with NLTK, which is the kind of grammar a statistical parser actually runs on: 21,763 distinct rules, of which 666 are unit rules.

<figure class="chart">
<svg viewBox="0 0 640 326" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Rule count after each conversion step for three grammars, as a multiple of the original count</title>
<desc id="f2-d">Three groups of bars, one per grammar, showing the rule count as a multiple of the original after START, TERM, BIN and UNIT. JSON grammar: 1.02, 1.30, 1.58, 2.72. Expression grammar: 1.10, 1.70, 2.20, 3.70. Treebank sample: 1.00, 1.00, 1.20, 16.27. In every grammar the UNIT step is the largest jump, and for the treebank it dwarfs the others.</desc>
<text x="0" y="18" class="viz-title">Binarisation is cheap; unit rules are the bill</text>
<text x="0" y="36" class="viz-sub">Rules after each step as a multiple of the original grammar, three grammars, measured</text>
<line x1="176" y1="52" x2="176" y2="290" class="viz-axis"/>
<text x="166" y="72" text-anchor="end" class="viz-label">JSON, 43 rules</text>
<path d="M176 60 H210 a4 4 0 0 1 4 4 V68 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="222" y="70" class="viz-tick">TERM 1.30</text>
<path d="M176 76 H217 a4 4 0 0 1 4 4 V84 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="229" y="86" class="viz-tick">BIN 1.58</text>
<path d="M176 92 H247 a4 4 0 0 1 4 4 V100 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="259" y="102" class="viz-value">UNIT 2.72</text>
<text x="166" y="140" text-anchor="end" class="viz-label">Expression, 10 rules</text>
<path d="M176 128 H221 a4 4 0 0 1 4 4 V136 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="233" y="138" class="viz-tick">TERM 1.70</text>
<path d="M176 144 H233 a4 4 0 0 1 4 4 V152 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="245" y="154" class="viz-tick">BIN 2.20</text>
<path d="M176 160 H273 a4 4 0 0 1 4 4 V168 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="285" y="170" class="viz-value">UNIT 3.70</text>
<text x="166" y="208" text-anchor="end" class="viz-label">Treebank, 21,763 rules</text>
<path d="M176 196 H202 a4 4 0 0 1 4 4 V204 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="214" y="206" class="viz-tick">TERM 1.00</text>
<path d="M176 212 H207 a4 4 0 0 1 4 4 V220 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/><text x="219" y="222" class="viz-tick">BIN 1.20</text>
<path d="M176 228 H596 a4 4 0 0 1 4 4 V236 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="592" y="223" text-anchor="end" class="viz-value">UNIT 16.27: 354,170 rules</text>
<text x="0" y="272" class="viz-label-muted">Twenty-six pixels per unit. None of the three grammars needed DEL.</text>
<text x="0" y="292" class="viz-tick">treebank: TERM adds nothing, its terminals only ever appear alone on the right</text>
<rect x="0" y="304" width="12" height="12" rx="3" class="viz-fgray"/><text x="18" y="315" class="viz-label-muted">START, TERM, BIN</text>
<rect x="160" y="304" width="12" height="12" rx="3" class="viz-f1"/><text x="178" y="315" class="viz-label-muted">after UNIT</text>
</svg>
<figcaption>Source: computed by the author with a step-by-step converter over a JSON grammar from <a href="https://www.rfc-editor.org/rfc/rfc8259">RFC 8259</a>, the standard expression grammar, and the grammar induced from the NLTK <a href="https://www.nltk.org/nltk_data/">Penn Treebank sample</a>.</figcaption>
</figure>

The pattern is the same in all three and the magnitude is not. The JSON grammar grows from 43 rules to 117, a tax of 2.72, and the unit step accounts for 49 of the 74 rules added. The expression grammar goes from 10 to 37, a tax of 3.70, with 15 of the 27 new rules from unit elimination. The treebank grammar goes from 21,763 rules to 354,170, a tax of 16.27, and of the 332,407 rules added, binarisation contributed 4,447 and unit elimination 327,959. The step the textbooks spend a page on added a fifth. The step they spend a sentence on multiplied the grammar by fifteen. And the tax is not a property of size alone: the tiny expression grammar pays more per rule than the JSON grammar does, because two of its ten rules are unit rules that each carry a whole nonterminal's alternatives.

## Why unit rules explode

The reason is the shape of a treebank grammar. A parsed corpus is full of rules like a noun phrase that consists of just a noun, a sentence that consists of just a verb phrase, a phrase that consists of just a smaller phrase of the same kind. Each of those is a unit rule, and they chain: if S can be VP and VP can be VB, then S reaches VB through two unit steps, and unit elimination gives S a copy of every rule VB has. With 666 unit rules connecting a few dozen phrase categories, most categories reach most others, and each reachable pair copies a whole category's worth of rules. The treebank sample has about 12,000 distinct part-of-speech-to-word rules, and after elimination every phrase category that could once become a bare word through a chain now owns a copy of the relevant slice of the lexicon.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Worst-case growth for unit-rule elimination on a chain grammar, quadratic, against the near-linear growth of binarisation</title>
<desc id="f3-d">Two curves against the number of nonterminals in a chain. Binarisation grows linearly with the grammar. Unit elimination on a chain where each nonterminal has a unit rule to the next and a few rules of its own grows with the square of the chain length, because each nonterminal receives copies of every rule below it. The quadratic curve pulls away sharply after a few dozen nonterminals.</desc>
<text x="0" y="18" class="viz-title">Chains are the worst case, and treebanks are full of them</text>
<text x="0" y="36" class="viz-sub">Rules after conversion for a chain grammar of n nonterminals</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">UNIT on a chain</text>
<line x1="510" y1="31" x2="524" y2="31" class="viz-s2"/><text x="530" y="35" class="viz-label-muted">BIN</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">10k</text>
<line x1="56" y1="126" x2="600" y2="126" class="viz-grid"/><text x="48" y="130" text-anchor="end" class="viz-tick">1k</text>
<line x1="56" y1="196" x2="600" y2="196" class="viz-grid"/><text x="48" y="200" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">10</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">50</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">100</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Nonterminals in the chain, each with three rules of its own</text>
<polyline points="56,231 124,209 192,193 260,180 328,169 396,161 464,154 532,148 600,143" class="viz-s2"/>
<polyline points="56,216 124,170 192,146 260,129 328,116 396,105 464,96 532,88 600,81" class="viz-s1"/>
<text x="592" y="76" text-anchor="end" class="viz-value">about 15,000 rules</text>
<text x="592" y="160" text-anchor="end" class="viz-value">about 450</text>
</svg>
<figcaption>Illustrative: a chain grammar in which each of n nonterminals has a unit rule to the next and three rules of its own, so that unit elimination produces about three n squared over two rules while binarisation stays linear; the textbook upper bound for the unit step is quadratic.</figcaption>
</figure>

Two things follow for anyone who writes a CYK parser. The first is that the order of the steps, which the textbooks say matters, mattered less than expected in my measurements: running UNIT before BIN, with binarisation sharing suffixes, produced the same total on all three grammars, because unit elimination's contribution swamps everything else and does not depend on whether the rules it copies have been binarised. The order still matters for correctness, since DEL must follow BIN to stay bounded and UNIT must come last so that DEL does not recreate unit rules, but it is not where the size is decided.

The second is that the bill is optional. A recogniser does not have to eliminate unit rules at all. It can keep them and handle them in the parser: after filling a cell of the chart with the nonterminals that derive a span directly, close the cell under the unit rules, adding every nonterminal that reaches one already present through a chain. That closure is a small fixed-point computation per cell, its cost is bounded by the number of unit pairs rather than by the number of copied rules, and it leaves the grammar at 26,211 rules rather than 354,170. That is what my implementation does, and it is the reason the grammar-size term in my paper's bound is the binarised size rather than the fully normalised one.

## What the tax is for

It is fair to ask what the full conversion buys, since parsers have worked around it for decades. The answer is the clean statement of the algorithm. With every rule in normal form, the CYK recurrence is two nested loops over split points and rule pairs, the proof of correctness is a page, and the complexity bound is the cube of the sentence length times the size of the grammar, with no asterisks. Keeping unit rules in the parser trades a line of the proof for a factor of fifteen in the grammar, and for a treebank grammar that trade is not close. The textbook is right that the conversion can always be done. What it does not say is which step to skip.
