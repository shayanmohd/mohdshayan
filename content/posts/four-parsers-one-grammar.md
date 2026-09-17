---
title: Four parsers, one grammar, no winner
date: 2026-09-17
summary: CYK, Earley, LR(1) and recursive descent are usually ranked by asymptotic cost, which is the wrong axis. The right axes are how often the grammar changes and how ambiguous it is.
tags: Parsing, Structured Output, Algorithms
draft: false
---

My paper benchmarked a CYK parser against LR(1), Earley and recursive descent on the same grammars, and the honest summary of what a benchmark like that can tell you is less than people hope. Each parser wins on some input and loses on another, and the asymptotic bounds everybody quotes, cubic for CYK, cubic worst case for Earley, linear for LR(1) and for a hand-written descent, describe the axis on which the comparison is least interesting. The axis that decides which parser to use is not how long the input is. It is how often the grammar changes, and whether the grammar is ambiguous.

## The wrong axis

Every parsing textbook ranks the algorithms by running time in the length of the input, and for a compiler that is right. A compiler's grammar is fixed when the compiler is built, so the cost of preparing the grammar, building LR tables or writing descent functions by hand, is paid once and amortised over every file ever parsed. What remains is the per-input cost, and there the table-driven and hand-written parsers are linear and the chart-based ones are not.

That ranking assumes the grammar is a constant, and in a growing class of systems it is not. A structured-output engine for a language model receives a JSON schema with the request, compiles it to a grammar, and uses it to mask tokens for the duration of one response. A tool-calling agent switches between grammars mid-generation. A template engine parses user-supplied formats. In all of these, the grammar arrives with the input, and the cost of preparing it is paid every time. An LR(1) table for a schema-derived grammar can take longer to build than the response takes to generate, at which point the linear per-token cost is irrelevant and the parser that needs no preparation wins.

## The grammar churn quadrant

So the two axes I use are grammar stability, fixed at build time against supplied per request, and ambiguity, deterministic against ambiguous. Each quadrant has a natural parser.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Four parsers placed by grammar stability and ambiguity</title>
<desc id="f1-d">A two by two grid. Horizontal axis: grammar stability, fixed at build time on the left, supplied per request on the right. Vertical axis: ambiguity, deterministic at the bottom, ambiguous at the top. Bottom left: LR(1) tables and hand-written recursive descent. Top left: CYK, when every parse or a probability is needed. Bottom right: Earley, as used by llguidance and XGrammar-2. Top right: Earley again, or CYK if probabilities are needed.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">CYK</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">every parse, or a probability</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Earley, or CYK for probabilities</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">no tables to rebuild</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">LR(1), recursive descent</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">compilers: pay once, parse forever</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Earley</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">llguidance, XGrammar-2</text>
<circle cx="464" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Grammar stability: fixed at build time to supplied per request</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Ambiguity: deterministic to ambiguous</text>
</svg>
<figcaption>Illustrative: the placement this post argues for; the dot marks where constrained decoding engines have moved.</figcaption>
</figure>

Bottom left is the compiler's home: a fixed, deterministic grammar, parsed millions of times, where LR(1) tables or a hand-tuned descent parser earn their preparation cost many times over. Top left is where CYK lives and where my paper's implementation belongs: a fixed grammar that is ambiguous, where the job is not to find a parse but to find all of them or the most probable one, and a chart that holds every sub-parse is the natural structure for that. Bottom right is the new territory: a deterministic or nearly deterministic grammar that arrives with each request, where anything that needs a table build is paying that cost per request, and Earley, which works directly from the rules with no preparation, has an advantage that no per-token bound shows. Top right is Earley again, or CYK when probabilities matter, because Earley handles ambiguity and still needs no tables.

## The quadrant predicted a change

What makes me trust the quadrant is that it predicted a decision I had no part in. The first XGrammar engine, from late 2024, compiled a grammar to a pushdown automaton and precomputed token masks per automaton state; its speed came from that cache. XGrammar-2, published in [January 2026](https://arxiv.org/abs/2601.04426), replaced the automaton with an Earley parser, keeping the cache-based acceleration, and its stated reasons are the quadrant's: agentic workloads switch structures mid-generation and reuse sub-structures across requests, so the engine needs to handle grammars that change constantly and cannot afford to rebuild an automaton for each. [llguidance](https://github.com/guidance-ai/llguidance), the engine behind the Guidance library, was Earley-based from the start for the same reason. Two independent teams, working on the per-request-grammar problem, arrived at the parser the quadrant places there.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Total cost against number of inputs parsed, table-driven against table-free, for one grammar</title>
<desc id="f2-d">Two lines. A table-driven parser starts with a large fixed cost to build its tables and then rises slowly per input. A table-free parser starts near zero and rises more steeply per input. They cross at some number of inputs; below it the table-free parser is cheaper, above it the table-driven one. A per-request grammar sits at one input, far to the left of the crossing.</desc>
<text x="0" y="18" class="viz-title">Where the preparation cost pays back</text>
<text x="0" y="36" class="viz-sub">Total cost against inputs parsed with one grammar; an illustrative model</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s2"/><text x="400" y="35" class="viz-label-muted">table-driven</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s1"/><text x="520" y="35" class="viz-label-muted">table-free</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">inputs parsed</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">many</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Number of inputs parsed with the same grammar</text>
<polyline points="56,150 600,110" class="viz-s2"/>
<polyline points="56,258 600,70" class="viz-s1"/>
<circle cx="360" cy="127" r="5" class="viz-dgray"/>
<text x="374" y="122" class="viz-value">crossing</text>
<circle cx="56" cy="258" r="5" class="viz-d1"/>
<text x="70" y="250" class="viz-value">a per-request grammar lives here</text>
<text x="70" y="146" class="viz-label-muted">table build, paid before the first input</text>
</svg>
<figcaption>Illustrative: two straight lines with a fixed cost and a slope, drawn to show why a per-request grammar never reaches the crossing.</figcaption>
</figure>

## Where CYK still belongs

None of this retires the parser my paper is about, and the quadrant is careful about why. CYK's chart holds every nonterminal for every span, which is the structure a probabilistic grammar needs to compute the most likely tree, or the total probability of a sentence, or the expected counts that train the grammar in the first place. Earley can be extended to do the same, and it is, but the extension gives up the simplicity that makes Earley attractive per request, and the two converge on the same amount of work once probabilities are involved. In the top-left cell, a fixed grammar and a need for probabilities, CYK's cube is not a cost to be avoided; it is the size of the answer being computed.

The requirement that trips people is normal form. CYK needs the grammar binarised, which is a preparation cost of its own, small next to an LR table build but not zero, and for a grammar that arrives per request it is one more reason the bottom-right cell prefers Earley, which takes rules as written. For a treebank grammar that is fixed for the life of the model, the conversion is paid once and forgotten.

## What the benchmark can and cannot say

Back to the paper's comparison. On a fixed grammar and a batch of inputs, CYK loses to LR(1) on time, as it must, and the comparison is worth publishing because it puts a measured constant on the asymptotic story: how many times slower, on which grammar sizes, for which input lengths. What it cannot say is which parser to choose, because the benchmark fixed the grammar, and fixing the grammar decides the quadrant before the timer starts. A benchmark that included the table-build time per grammar, and ran each grammar against one input, would tell a different story, and it would be the story the structured-output engines are living.

The other thing the benchmark cannot say is what happens under ambiguity. A deterministic grammar gives LR(1) and descent a clean run. An ambiguous one gives LR(1) conflicts, which are resolved by rules that pick one parse and discard the rest, and gives descent an exponential blow-up or a backtracking budget. CYK and Earley keep every parse in the chart, which is why they cost more, and it is the cost of an answer the other two do not offer. Comparing them on a grammar where that answer is not needed is comparing a delivery van with a bicycle on a race track.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">An Earley chart and the equivalent CYK cells for a four-token input</title>
<desc id="f3-d">Left: an Earley chart as five state sets, one per position from zero to four, each holding dotted rules; arrows labelled predict, scan and complete connect them. Right: the CYK triangle for the same four tokens, ten cells, each holding the nonterminals that span the cell's range. A note says both hold every sub-parse, and Earley builds its sets from the rules directly, with no tables.</desc>
<text x="0" y="18" class="viz-title">Two charts, same information, no tables</text>
<text x="0" y="36" class="viz-sub">Earley state sets on the left; CYK cells on the right, for four tokens</text>
<rect x="8" y="60" width="52" height="150" rx="6" class="viz-box"/><text x="34" y="82" text-anchor="middle" class="viz-tick">S0</text>
<rect x="70" y="60" width="52" height="150" rx="6" class="viz-box"/><text x="96" y="82" text-anchor="middle" class="viz-tick">S1</text>
<rect x="132" y="60" width="52" height="150" rx="6" class="viz-box-accent"/><text x="158" y="82" text-anchor="middle" class="viz-tick">S2</text>
<rect x="194" y="60" width="52" height="150" rx="6" class="viz-box"/><text x="220" y="82" text-anchor="middle" class="viz-tick">S3</text>
<rect x="256" y="60" width="52" height="150" rx="6" class="viz-box"/><text x="282" y="82" text-anchor="middle" class="viz-tick">S4</text>
<text x="34" y="110" text-anchor="middle" class="viz-tick">predict</text>
<text x="96" y="110" text-anchor="middle" class="viz-tick">scan</text>
<text x="158" y="110" text-anchor="middle" class="viz-tick">complete</text>
<text x="158" y="236" text-anchor="middle" class="viz-label-muted">dotted rules per position</text>
<rect x="360" y="180" width="60" height="26" rx="4" class="viz-box"/><rect x="428" y="180" width="60" height="26" rx="4" class="viz-box"/><rect x="496" y="180" width="60" height="26" rx="4" class="viz-box"/><rect x="564" y="180" width="60" height="26" rx="4" class="viz-box"/>
<rect x="394" y="146" width="60" height="26" rx="4" class="viz-box"/><rect x="462" y="146" width="60" height="26" rx="4" class="viz-box-accent"/><rect x="530" y="146" width="60" height="26" rx="4" class="viz-box"/>
<rect x="428" y="112" width="60" height="26" rx="4" class="viz-box"/><rect x="496" y="112" width="60" height="26" rx="4" class="viz-box"/>
<rect x="462" y="78" width="60" height="26" rx="4" class="viz-box"/>
<text x="492" y="236" text-anchor="middle" class="viz-label-muted">nonterminals per span</text>
<text x="320" y="276" text-anchor="middle" class="viz-tick">both keep every sub-parse; Earley needs no preparation, CYK needs normal form</text>
</svg>
<figcaption>Illustrative: the two chart shapes side by side; the highlighted cells hold the same span.</figcaption>
</figure>

## How to choose

Ask two questions before reading a single benchmark. Does the grammar exist before the inputs, or arrive with them? And does the application need one parse, every parse, or the most probable one? A fixed grammar and one parse is a compiler, and the linear parsers are right. A fixed grammar and all parses or a probability is a chart parser's job, and CYK's cube is the price of the chart. A grammar per request is Earley's quadrant, whatever the input length, because the preparation is the cost and Earley has none. A grammar per request with probabilities is the hard corner, and it is where the interesting research now sits.

The benchmark in my paper is honest about what it measured, and the quadrant is what it did not. Both are needed to choose, and the second one is the one people skip, because it is not a number.
