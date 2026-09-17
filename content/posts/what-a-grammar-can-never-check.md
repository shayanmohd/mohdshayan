---
title: What a grammar can never check
date: 2026-09-17
summary: Constrained decoding guarantees an output's shape, never its reference. Equality of two strings is the copy language, which no grammar recognises; a checker after decoding must.
tags: Structured Output, Formal Languages, Constrained Decoding
draft: false
---

Constrained decoding is the most reassuring feature in the structured-output toolbox. Hand the engine a grammar, and every token the model emits is checked against it before it is sampled, so the output is guaranteed to be valid JSON, to match the schema, to use one of the allowed enum values, to close every bracket it opens. The guarantee is real and it is narrower than it feels. A grammar can guarantee the shape of an output. It cannot guarantee its reference: that a field equals an earlier field, that a quoted span appears verbatim in the source it claims to quote, that an identifier exists in a table that was live at the moment of decoding. The reason is a theorem, not an engineering gap, and the theorem draws a line that every structured-output pipeline has to respect with a second component.

## The copy-language wall

The engines that make constrained decoding fast, and the theory I worked with in my parsing research, both run on context-free grammars. XGrammar's central result, in the [paper that introduced it](https://arxiv.org/abs/2411.15100), is that for a JSON grammar over a 128,000-token vocabulary, only 1,134 tokens are context-dependent, meaning their validity depends on the full parser stack rather than on the current rule; the other 99 percent can be precomputed at compile time. That is what takes the mask below 40 microseconds per token, and its [2026 successor](https://arxiv.org/abs/2601.04426) extends the same machinery to grammars that change within a request. All of it is context-free by construction, because a pushdown automaton is what can be run per token at that speed.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Vocabulary split for a JSON grammar over a 128k-token vocabulary</title>
<desc id="f1-d">Two horizontal bars. Context-independent tokens, whose validity is precomputed per grammar state: about 127,000, 99.1 percent. Context-dependent tokens, checked at decode time against the parser stack: 1,134, 0.9 percent. The small bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">What a context-free engine precomputes and what it checks live</text>
<text x="0" y="36" class="viz-sub">Tokens of Llama 3.1's 128k vocabulary under a JSON grammar, as reported by XGrammar</text>
<line x1="216" y1="52" x2="216" y2="150" class="viz-axis"/>
<text x="206" y="80" text-anchor="end" class="viz-label">Context-independent</text>
<path d="M216 64 H596 a4 4 0 0 1 4 4 V84 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="592" y="59" text-anchor="end" class="viz-value">about 127,000, precomputed</text>
<text x="206" y="126" text-anchor="end" class="viz-label">Context-dependent</text>
<path d="M216 110 H220 a4 4 0 0 1 4 4 V130 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="234" y="126" class="viz-value">1,134, checked per token</text>
<text x="0" y="182" class="viz-label-muted">Both kinds are judged by a pushdown automaton; neither can compare two spans.</text>
<text x="0" y="206" class="viz-tick">the speed comes from context-freeness; so does the wall</text>
</svg>
<figcaption>Source: token counts as reported in <a href="https://arxiv.org/abs/2411.15100">XGrammar</a> (Dong et al., 2024) for JSON with the Llama 3.1 tokeniser.</figcaption>
</figure>

Here is the wall. The language of strings of the form w followed by w, for any w over an alphabet of two or more symbols, is the copy language, and it is not context-free. The [pumping lemma for context-free languages](https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages) proves it: any sufficiently long string in a context-free language can be pumped in two places at once while staying in the language, and a copy of a copy cannot survive that, because pumping one half breaks its match with the other. The consequence for decoding is exact. "This field equals that field" is the copy language. "This quoted span appears verbatim in the passage" is the copy language with the passage as the first half. No context-free grammar recognises either, so no mask built from one can enforce either, at any cost, with any engine.

## What lies on each side

It helps to write the constraints down by the formal class they need, because the line between enforceable and not is sharper than intuition suggests.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The copy-language wall as a table of constraint types and the language class each needs</title>
<desc id="f2-d">Two groups of rows. Enforceable by a decoding grammar: a fixed enum, regular; a date or identifier format, regular; valid JSON with nesting, context-free; a schema with required keys, context-free; a bounded array length, context-free. Not enforceable, needs a checker after decoding: one field equal to another, copy language; a quotation verbatim from a source, copy language; an identifier present in a live table, runtime set; a total equal to the sum of items, arithmetic; uniqueness across an unbounded list, beyond context-free.</desc>
<text x="0" y="18" class="viz-title">Shape on one side, reference on the other</text>
<text x="20" y="48" class="viz-tick">CONSTRAINT</text>
<text x="360" y="48" class="viz-tick">NEEDS</text>
<text x="500" y="48" class="viz-tick">WHERE</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="80" class="viz-label">One of a fixed set of values</text><text x="360" y="80" class="viz-label-muted">regular</text><text x="500" y="80" class="viz-value">grammar</text>
<text x="20" y="104" class="viz-label">A date, an id pattern</text><text x="360" y="104" class="viz-label-muted">regular</text><text x="500" y="104" class="viz-value">grammar</text>
<text x="20" y="128" class="viz-label">Valid JSON, balanced nesting</text><text x="360" y="128" class="viz-label-muted">context-free</text><text x="500" y="128" class="viz-value">grammar</text>
<text x="20" y="152" class="viz-label">Required keys, bounded arrays</text><text x="360" y="152" class="viz-label-muted">context-free</text><text x="500" y="152" class="viz-value">grammar</text>
<line x1="0" y1="166" x2="640" y2="166" class="viz-s4"/>
<text x="20" y="190" class="viz-label">Field A equals field B</text><text x="360" y="190" class="viz-label-muted">copy language</text><text x="500" y="190" class="viz-value">checker</text>
<text x="20" y="214" class="viz-label">Quote appears verbatim in source</text><text x="360" y="214" class="viz-label-muted">copy language</text><text x="500" y="214" class="viz-value">checker</text>
<text x="20" y="238" class="viz-label">Id exists in a live table</text><text x="360" y="238" class="viz-label-muted">runtime set</text><text x="500" y="238" class="viz-value">checker</text>
<text x="20" y="262" class="viz-label">Total equals sum of items</text><text x="360" y="262" class="viz-label-muted">arithmetic</text><text x="500" y="262" class="viz-value">checker</text>
<text x="20" y="286" class="viz-label">All items distinct</text><text x="360" y="286" class="viz-label-muted">beyond context-free</text><text x="500" y="286" class="viz-value">checker</text>
<text x="0" y="322" class="viz-label-muted">The brick line is the wall: above it the mask guarantees, below it only a checker does.</text>
</svg>
<figcaption>Illustrative: the classification as I apply it; the language classes are standard results, the placement of each constraint follows from them.</figcaption>
</figure>

The rows above the line are the ones the sales pitch is about, and the grammar handles them completely. The rows below are the ones that decide whether the output is useful, and they share a property: each one relates the output to something outside the current grammar state, another part of the output, a document, a database, an arithmetic fact. A pushdown automaton has one stack and no memory of what it popped. It can count nesting; it cannot remember a string to compare against later.

## What the theorem does not forbid

The wall is precise, and it is worth being precise about what is on the near side of it, because some constraints that sound like reference are shape in disguise. A field that must equal a fixed constant is a regular language: the constant is written into the grammar. A field that must be one of a set of values known before decoding starts is an enum, and an enum is regular however large, so if the set of valid identifiers for this request is known when the grammar is compiled, membership in it is enforceable; engines that compile a grammar per request, which is what the dynamic machinery in XGrammar-2 exists for, make that practical for sets of a few hundred or a few thousand values. The wall is for the set that is not known at compile time, because it depends on what the model has already generated or on a lookup that happens later, and for equality between two spans the model produces.

The frontier also moves. Work on [type-constrained decoding](https://arxiv.org/abs/2504.09246) for code generation enforces typing rules during decoding that a context-free grammar cannot express, by giving the decoder a checker with more state than a stack. That is not a refutation of the wall; it is a checker moved inside the loop, and it pays for its extra state per token. The question for any pipeline is the same either way: which constraints are checked by an automaton with a stack, which by something with more memory, and where in the pipeline each one runs.

## The gate after the decoder

The architecture that follows is two components rather than one. The decoder runs with the grammar and guarantees shape. A checker runs on the finished output and verifies reference: it compares the fields that must match, searches the source for every quoted span, looks up every identifier, adds up every total. An output that fails the checker is rejected or regenerated, and the checker's failure rate is a number the team has to know, because it is the number the grammar hides.

<figure class="chart">
<svg viewBox="0 0 640 270" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">A decoding step with the grammar mask, followed by the post-decode checker gate</title>
<desc id="f3-d">Left: at one decoding step the vocabulary is split into tokens allowed by the grammar state and tokens masked out; the sampler picks from the allowed set. Right: after the full output is decoded, a checker gate tests the copy constraints, verbatim spans, identifiers and sums, and passes or rejects the output. The gate is highlighted as the component the grammar cannot replace.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Two components, two kinds of guarantee</text>
<text x="8" y="52" class="viz-tick">EACH TOKEN</text>
<rect x="8" y="60" width="140" height="120" rx="8" class="viz-box"/>
<text x="78" y="84" text-anchor="middle" class="viz-label">Vocabulary</text>
<rect x="24" y="96" width="108" height="30" rx="6" class="viz-box-accent"/><text x="78" y="116" text-anchor="middle" class="viz-label-muted">allowed by grammar</text>
<rect x="24" y="134" width="108" height="30" rx="6" class="viz-box-ink"/><text x="78" y="154" text-anchor="middle" class="viz-on-ink">masked out</text>
<line x1="150" y1="120" x2="172" y2="120" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="176" y="90" width="110" height="60" rx="8" class="viz-box"/>
<text x="231" y="116" text-anchor="middle" class="viz-label">Sampler</text>
<text x="231" y="134" text-anchor="middle" class="viz-label-muted">shape is guaranteed</text>
<line x1="288" y1="120" x2="310" y2="120" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="330" y="52" class="viz-tick">WHOLE OUTPUT</text>
<rect x="314" y="60" width="150" height="120" rx="8" class="viz-box-accent"/>
<text x="389" y="84" text-anchor="middle" class="viz-label">Checker gate</text>
<text x="389" y="106" text-anchor="middle" class="viz-label-muted">fields that must match</text>
<text x="389" y="124" text-anchor="middle" class="viz-label-muted">spans found in source</text>
<text x="389" y="142" text-anchor="middle" class="viz-label-muted">ids present, sums correct</text>
<text x="389" y="166" text-anchor="middle" class="viz-tick">reference is checked here</text>
<line x1="466" y1="100" x2="500" y2="100" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="504" y="80" width="128" height="40" rx="8" class="viz-box"/><text x="568" y="105" text-anchor="middle" class="viz-label">pass: deliver</text>
<line x1="466" y1="150" x2="500" y2="150" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="504" y="130" width="128" height="40" rx="8" class="viz-box-ink"/><text x="568" y="155" text-anchor="middle" class="viz-on-ink">fail: regenerate</text>
<text x="320" y="216" text-anchor="middle" class="viz-label-muted">Valid output is a necessary condition. The gate is where it becomes a sufficient one.</text>
<text x="320" y="248" text-anchor="middle" class="viz-tick">the share of outputs that pass the grammar and fail the gate is the valid-but-wrong rate</text>
</svg>
<figcaption>Illustrative: the two-component pipeline; the mask is drawn for one step and the gate for the finished output.</figcaption>
</figure>

I call that number the valid-but-wrong rate: the share of outputs that pass the grammar and fail the checker. It is the honest measure of a structured-output system, and it is invisible to anyone who only measures schema validity, which is why teams that adopt constrained decoding often report their error rate going to zero while their users keep finding wrong answers. The errors did not go away. They moved below the line, where the grammar could not see them.

## The citation that needed a string match

The case where I met the wall in practice was grounded citations. A helpdesk assistant built on retrieval is expected to quote its sources, and the natural schema has an answer field and a list of citation objects, each with a source identifier and a quoted span. The grammar guarantees that every citation has both fields and that the identifier matches the pattern. It cannot guarantee that the quoted span appears in the retrieved passage, because that is the copy language with the passage as the first half, and it cannot guarantee that the identifier refers to a passage that was actually retrieved for this query, because that is membership in a runtime set. Both had to be checked outside the decoder: a string match of each span against its passage, exact or with whitespace normalised, and a lookup of each identifier against the retrieval results. Citations that failed either check were dropped, and an answer whose citations were all dropped was regenerated.

That checker was a few dozen lines and it was the component that made the citations trustworthy. The grammar made them well-formed. The distinction is the whole post: a well-formed citation to a passage that does not contain the quote is worse than no citation, because it carries the appearance of grounding without the fact of it.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f4-t f4-d">
<title id="f4-t">Valid-but-wrong rate for quoted spans as the checker tightens, in a toy model</title>
<desc id="f4-d">A line rising from left to right across four checker settings: no check, zero percent detected by construction; identifier exists, a small share; span found with whitespace normalised, a larger share; span found exactly, the largest share. Each tighter setting reveals more outputs that the grammar had passed. The model assumes a fixed underlying error rate that the checks progressively uncover.</desc>
<text x="0" y="18" class="viz-title">Tighten the checker and the hidden errors appear</text>
<text x="0" y="36" class="viz-sub">Share of grammar-valid outputs the checker rejects, toy model with a fixed underlying error rate</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">20%</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">15%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">10%</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">5%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="92" y="288" text-anchor="middle" class="viz-tick">no check</text>
<text x="256" y="288" text-anchor="middle" class="viz-tick">id exists</text>
<text x="420" y="288" text-anchor="middle" class="viz-tick">span, normalised</text>
<text x="584" y="288" text-anchor="middle" class="viz-tick">span, exact</text>
<polyline points="92,264 256,233 420,140 584,98" class="viz-s1"/>
<circle cx="92" cy="264" r="5" class="viz-d1"/>
<circle cx="256" cy="233" r="5" class="viz-d1"/>
<circle cx="420" cy="140" r="5" class="viz-d1"/>
<circle cx="584" cy="98" r="5" class="viz-d1"/>
<text x="580" y="90" text-anchor="end" class="viz-value">what the grammar was hiding</text>
</svg>
<figcaption>Illustrative: a toy model in which a fixed share of citations are fabricated or misattributed and each checker setting uncovers more of them; the values are constructed to show the shape, not measured.</figcaption>
</figure>

## The rule

Write the constraints down and sort them by the line. Everything above it goes in the grammar, where it is enforced per token at negligible cost. Everything below it goes in a checker that runs on the finished output, and the checker's rejection rate is reported next to the schema validity rate, because the second number without the first is a claim that the copy language is context-free, and it is not. The theorem that bounds what a parser can recognise bounds what a mask can enforce. Valid is necessary. The checker is what makes it sufficient.
