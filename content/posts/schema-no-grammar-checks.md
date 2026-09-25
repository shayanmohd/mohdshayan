---
title: The part of your schema no grammar checks
date: 2026-09-11
summary: A JSON Schema is compiled to a grammar for constrained decoding, and several keywords cannot survive the compilation. Know which, and validate that residue after decoding.
tags: Structured Output, JSON Schema, Validation
topic: NLP & Parsing
draft: false
---

When a structured-output engine accepts your JSON Schema, it is not promising to enforce your JSON Schema. It is promising to enforce the part of it that can be turned into a grammar the decoder can check one token at a time. Several keywords cannot be, either because the constraint is not context-free at all or because the only grammar that expresses it is exponentially large, and every engine quietly drops or approximates those. If you do not know which keywords those are, you will ship outputs the schema forbids while believing they are guaranteed. I call the dropped part the schema residue, and the rule that follows is short: validate the residue after decoding, and only the residue.

## How much gets dropped

The clearest measurement is the JSONSchemaBench study by Geng and colleagues, which ran [ten thousand real-world schemas](https://arxiv.org/abs/2501.10868) through six engines, Guidance, Outlines, llama.cpp, XGrammar, OpenAI and Gemini, and measured three things: whether an engine accepts a schema at all, whether its outputs then validate against the full schema, and how long compilation takes. Declared coverage, the share of schemas accepted without error, ranges from near-total on the easy collections to as low as 6 percent for the hosted engines on the hardest, and empirical coverage, the share of generated outputs that actually validate, is lower still, because an engine can accept a schema and then produce output that violates the part of it the grammar did not encode.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Declared coverage range across schema collections, by engine, from JSONSchemaBench</title>
<desc id="f1-d">Range bars from the lowest to the highest collection score for each engine, in share of schemas accepted: llama.cpp 0.54 to 0.98, Outlines 0.38 to 0.99, Guidance 0.35 to 0.98, XGrammar 0.12 to 1.00, OpenAI 0.06 to 0.89, Gemini 0.08 to 0.86. Every engine has at least one collection where a large share of schemas is rejected.</desc>
<text x="0" y="18" class="viz-title">No engine accepts everything, and the hard collections show it</text>
<text x="0" y="36" class="viz-sub">Share of schemas an engine accepts, lowest to highest collection, JSONSchemaBench</text>
<line x1="136" y1="52" x2="136" y2="262" class="viz-axis"/>
<text x="136" y="282" text-anchor="middle" class="viz-tick">0</text>
<text x="368" y="282" text-anchor="middle" class="viz-tick">0.5</text>
<text x="600" y="282" text-anchor="middle" class="viz-tick">1.0</text>
<text x="126" y="73" text-anchor="end" class="viz-label">llama.cpp</text>
<rect x="387" y="62" width="204" height="12" rx="4" class="viz-fgray"/><text x="380" y="73" text-anchor="end" class="viz-value">0.54</text><text x="596" y="73" class="viz-value">0.98</text>
<text x="126" y="107" text-anchor="end" class="viz-label">Outlines</text>
<rect x="312" y="96" width="283" height="12" rx="4" class="viz-fgray"/><text x="305" y="107" text-anchor="end" class="viz-value">0.38</text><text x="600" y="107" class="viz-value">0.99</text>
<text x="126" y="141" text-anchor="end" class="viz-label">Guidance</text>
<rect x="298" y="130" width="293" height="12" rx="4" class="viz-fgray"/><text x="291" y="141" text-anchor="end" class="viz-value">0.35</text><text x="596" y="141" class="viz-value">0.98</text>
<text x="126" y="175" text-anchor="end" class="viz-label">XGrammar</text>
<rect x="192" y="164" width="408" height="12" rx="4" class="viz-fgray"/><text x="185" y="175" text-anchor="end" class="viz-value">0.12</text><text x="604" y="175" class="viz-value">1.00</text>
<text x="126" y="209" text-anchor="end" class="viz-label">OpenAI</text>
<rect x="164" y="198" width="385" height="12" rx="4" class="viz-f1"/><text x="157" y="209" text-anchor="end" class="viz-value">0.06</text><text x="554" y="209" class="viz-value">0.89</text>
<text x="126" y="243" text-anchor="end" class="viz-label">Gemini</text>
<rect x="173" y="232" width="362" height="12" rx="4" class="viz-f1"/><text x="166" y="243" text-anchor="end" class="viz-value">0.08</text><text x="540" y="243" class="viz-value">0.86</text>
</svg>
<figcaption>Source: coverage ranges as reported in <a href="https://arxiv.org/abs/2501.10868">JSONSchemaBench</a> (Geng et al., 2025), Table 4, lowest to highest collection per engine; the hosted engines are highlighted because their supported subsets are documented rather than inferred.</figcaption>
</figure>

The hosted engines are the honest case, because they publish the subset. OpenAI's [structured outputs documentation](https://developers.openai.com/api/docs/guides/structured-outputs) lists what is supported, pattern and a fixed set of formats for strings, minimum, maximum and multipleOf for numbers, minItems and maxItems for arrays, and what is not: allOf, not, dependentRequired, dependentSchemas, if, then and else, with further keywords dropped for fine-tuned models, plus limits of 5,000 properties, ten levels of nesting, a thousand enum values and 120,000 characters of names. A schema outside the subset is rejected with an error, which is the right behaviour. The engines that accept a schema and silently ignore part of it are the ones the rule is for.

## Why a keyword falls out

The keywords that drop are not arbitrary; each falls out for one of three reasons, and knowing the reason tells you what the post-decode check has to do.

<figure class="chart">
<svg viewBox="0 0 640 310" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A schema splitting into grammar-enforceable keywords and residue keywords, with the residue routed to a post-validator</title>
<desc id="f2-d">A schema box on the left feeds two boxes. The top box, grammar-enforceable: types, required, enum, const, additionalProperties, nesting, regular patterns, bounded lengths, and this box feeds the decoder. The bottom box, residue: uniqueItems, numeric bounds on decimals, patterns with backreferences, dependentSchemas and dependentRequired, format semantics, contains with counts, if-then-else across properties, allOf and not, multipleOf, and this box feeds a post-validator that runs on the decoded output.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One schema, two destinations</text>
<rect x="8" y="110" width="120" height="70" rx="8" class="viz-box"/>
<text x="68" y="140" text-anchor="middle" class="viz-label">Schema</text>
<text x="68" y="158" text-anchor="middle" class="viz-label-muted">as written</text>
<path d="M130 130 H170 V80 H196" class="viz-arrow" marker-end="url(#f2-ah)"/>
<path d="M130 160 H170 V220 H196" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="200" y="44" width="250" height="76" rx="8" class="viz-box"/>
<text x="325" y="68" text-anchor="middle" class="viz-label">Grammar-enforceable</text>
<text x="325" y="88" text-anchor="middle" class="viz-label-muted">types, required, enum, const, nesting,</text>
<text x="325" y="106" text-anchor="middle" class="viz-label-muted">regular patterns, bounded lengths</text>
<line x1="452" y1="82" x2="486" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="490" y="52" width="142" height="60" rx="8" class="viz-box-ink"/>
<text x="561" y="78" text-anchor="middle" class="viz-on-ink">Decoder</text>
<text x="561" y="96" text-anchor="middle" class="viz-on-ink">enforced per token</text>
<rect x="200" y="176" width="250" height="104" rx="8" class="viz-box-accent"/>
<text x="325" y="198" text-anchor="middle" class="viz-label">Residue</text>
<text x="325" y="218" text-anchor="middle" class="viz-label-muted">uniqueItems, decimal bounds,</text>
<text x="325" y="236" text-anchor="middle" class="viz-label-muted">backreferences, dependent keywords,</text>
<text x="325" y="254" text-anchor="middle" class="viz-label-muted">if-then-else, format, contains counts,</text>
<text x="325" y="272" text-anchor="middle" class="viz-label-muted">allOf, not, multipleOf</text>
<line x1="452" y1="220" x2="486" y2="220" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="490" y="190" width="142" height="60" rx="8" class="viz-box-ink"/>
<text x="561" y="216" text-anchor="middle" class="viz-on-ink">Post-validator</text>
<text x="561" y="234" text-anchor="middle" class="viz-on-ink">on decoded output</text>
<text x="320" y="298" text-anchor="middle" class="viz-tick">the residue is validated with the full schema after decoding; the rest is guaranteed</text>
</svg>
<figcaption>Illustrative: the split as the checklist applies it; which keywords land in the residue depends on the engine, and the list shown is the union across common ones.</figcaption>
</figure>

The first reason is that the constraint is not context-free. uniqueItems asks whether any two items in an array are equal, which is the copy language with extra steps, and no grammar recognises it. A pattern with a backreference is a regular expression in name only; backreferences make the language non-regular and in general non-context-free. allOf is an intersection, and the intersection of two context-free languages need not be context-free; not is a complement, with the same problem.

The second reason is that the constraint is context-free but only with an exponential grammar. A condition across properties, if this property has that value then that other property is required, is expressible in a context-free grammar only by enumerating the orderings in which the properties may appear, and JSON objects allow any order, so the grammar grows with the factorial of the property count. dependentSchemas and dependentRequired have the same shape. contains with minContains and maxContains is a counting constraint across an array; a grammar can count to a small fixed bound by unrolling, and the unrolling is the exponential.

The third reason is that the constraint is about meaning, not syntax. format says a string is an email address or a date, and a grammar can enforce the shape of a date but not that the thirtieth of February does not exist. A numeric minimum or maximum is a constraint on a number, and a number in JSON is a string of digits: a grammar can bound an integer by enumerating digit patterns, which is tedious but finite, and cannot bound a decimal with arbitrary precision without an automaton that grows with the precision. multipleOf is arithmetic and has no grammar at all.

## How common the residue is

The residue would not matter if schemas rarely used those keywords. They use them constantly. I counted keyword usage across the [JSON Schema Store](https://github.com/SchemaStore/schemastore) catalogue, 984 public schemas for configuration files and manifests, and the residue keywords are in a large minority of them.

<figure class="chart">
<svg viewBox="0 0 640 380" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Share of Schema Store schemas using each keyword, with residue keywords highlighted</title>
<desc id="f3-d">Horizontal bars in percent of 984 schemas: pattern 40.1, format 32.4, minimum 31.3, allOf 27.8, maximum 22.1, uniqueItems 21.7, not 14.9, dependencies 12.0, if 11.8, propertyNames 4.7, multipleOf 1.6, contains 1.3. Residue keywords are gold; pattern is grey because most patterns are plain regular expressions and only those with backreferences drop, of which the catalogue has none.</desc>
<text x="0" y="18" class="viz-title">The residue is in a third of real schemas</text>
<text x="0" y="36" class="viz-sub">Percent of 984 public schemas using the keyword at least once, September 2026</text>
<line x1="136" y1="52" x2="136" y2="344" class="viz-axis"/>
<text x="126" y="73" text-anchor="end" class="viz-label">pattern</text>
<path d="M136 58 H457 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/><text x="477" y="73" class="viz-value">40.1</text>
<text x="126" y="97" text-anchor="end" class="viz-label">format</text>
<path d="M136 82 H395 a4 4 0 0 1 4 4 V98 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="415" y="97" class="viz-value">32.4</text>
<text x="126" y="121" text-anchor="end" class="viz-label">minimum</text>
<path d="M136 106 H386 a4 4 0 0 1 4 4 V122 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="406" y="121" class="viz-value">31.3</text>
<text x="126" y="145" text-anchor="end" class="viz-label">allOf</text>
<path d="M136 130 H358 a4 4 0 0 1 4 4 V146 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="378" y="145" class="viz-value">27.8</text>
<text x="126" y="169" text-anchor="end" class="viz-label">maximum</text>
<path d="M136 154 H313 a4 4 0 0 1 4 4 V170 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="333" y="169" class="viz-value">22.1</text>
<text x="126" y="193" text-anchor="end" class="viz-label">uniqueItems</text>
<path d="M136 178 H310 a4 4 0 0 1 4 4 V194 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="330" y="193" class="viz-value">21.7</text>
<text x="126" y="217" text-anchor="end" class="viz-label">not</text>
<path d="M136 202 H255 a4 4 0 0 1 4 4 V218 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="275" y="217" class="viz-value">14.9</text>
<text x="126" y="241" text-anchor="end" class="viz-label">dependencies</text>
<path d="M136 226 H232 a4 4 0 0 1 4 4 V242 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="252" y="241" class="viz-value">12.0</text>
<text x="126" y="265" text-anchor="end" class="viz-label">if, then, else</text>
<path d="M136 250 H230 a4 4 0 0 1 4 4 V266 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="250" y="265" class="viz-value">11.8</text>
<text x="126" y="289" text-anchor="end" class="viz-label">propertyNames</text>
<path d="M136 274 H174 a4 4 0 0 1 4 4 V290 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="194" y="289" class="viz-value">4.7</text>
<text x="126" y="313" text-anchor="end" class="viz-label">multipleOf</text>
<path d="M136 298 H149 a4 4 0 0 1 4 4 V314 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="169" y="313" class="viz-value">1.6</text>
<text x="126" y="337" text-anchor="end" class="viz-label">contains</text>
<path d="M136 322 H146 a4 4 0 0 1 4 4 V338 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/><text x="166" y="337" class="viz-value">1.3</text>
<rect x="0" y="360" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="371" class="viz-label-muted">residue on at least one common engine</text>
<rect x="300" y="360" width="12" height="12" rx="3" class="viz-fgray"/><text x="318" y="371" class="viz-label-muted">regular in practice: no backreferences found</text>
</svg>
<figcaption>Source: computed by the author over the <a href="https://github.com/SchemaStore/schemastore">SchemaStore</a> repository's schema catalogue, 984 parsed schemas, counting each keyword once per schema.</figcaption>
</figure>

A third of these schemas use format, a third use a numeric minimum, over a fifth use uniqueItems, and one in eight uses a conditional across properties. None of those is exotic. A CRM-style schema, the kind our APIs emit and accept, has an email format on a contact, a minimum of zero on a deal amount, uniqueItems on a list of tags, and a conditional that requires a close date when the stage is won. Every one of those is residue on at least one common engine, and an output that violates any of them will pass the grammar. The pattern keyword is the exception that proves the shape of the rule: it is the most used keyword in the catalogue and it is enforceable, because a plain regular expression is a regular language and a grammar contains it, so it is grey in the chart. It would drop only for patterns with backreferences, and the catalogue has none, which says something about how rarely real schemas need them.

## The residue checklist

The practice is a checklist run against the schema before it is handed to an engine. For each keyword in the residue list, uniqueItems, numeric bounds on non-integers, patterns with backreferences, dependentSchemas and dependentRequired, format, contains with counts, conditionals across properties, allOf, not, multipleOf, mark whether the schema uses it and whether the target engine documents support for it. What remains marked is the residue for that schema on that engine. The decoded output is then validated against the full schema with an ordinary validator implementing the [validation vocabulary](https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-validation-01), and the validator's failures are, by construction, residue failures, because everything else was guaranteed by the grammar.

The "only the residue" half of the rule is about cost and about honesty. Validating the whole schema after decoding costs nothing extra, since the validator does it in one pass, so run the whole thing. What the checklist adds is that you know in advance which failures are possible, so that a failure on a keyword outside the residue is a bug in the engine rather than an expected rejection, and a failure inside it is the system working as designed. Reporting the residue rejection rate next to the schema validity rate is the same discipline as reporting the checker's failures for [copy constraints](/blog/what-a-grammar-can-never-check/): the grammar's guarantee is real, and the number that matters is what it does not cover.

There is a limit to the checklist that is worth stating. Engines change, and a keyword that is residue this quarter may be enforced next quarter, or the reverse, when an engine trades coverage for speed. The checklist is therefore per engine and per version, and the safest posture is the one the hosted engines take: reject what you cannot enforce, so that nobody is left believing a guarantee that was never made.
