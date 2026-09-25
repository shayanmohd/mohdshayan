---
title: A citation is a claim about a passage
date: 2026-08-21
summary: A citation marker asserts that this passage supports this sentence, and it fails on its own schedule. Make the model commit to spans, check them outside the model, drop the rest.
tags: RAG, Grounding, Citations
topic: LLM Engineering
draft: false
---

A citation looks like evidence and is actually a second claim. The first claim is the sentence: the refund window is fourteen days. The second is the marker after it: passage 3 says so. Both can be wrong, and they fail independently, on different schedules, for different reasons. When I built grounded citation into the helpdesk assistant at CRIS, the thing I had not appreciated was that the marker needed exactly the same scrutiny as the sentence, and that giving it that scrutiny changes what the model is asked to produce.

## Citations fail on their own schedule

The evidence that citation markers are unreliable is not anecdotal. The ALCE benchmark from [Gao and colleagues](https://arxiv.org/abs/2305.14627) measures citation recall, whether the cited passages entail the sentence, and citation precision, whether each cited passage is actually needed, and found the best models of its time far from full support on long-form questions. Wallat and colleagues went further in [Correctness is not Faithfulness in RAG Attributions](https://arxiv.org/abs/2412.18004), distinguishing a citation that happens to point at a supporting passage from one that reflects how the answer was actually produced. They report that 57 percent of citations from a RAG-optimised model showed unfaithful behaviour: the model answered from its own memory and then found a passage to attach, a pattern they call post-rationalisation.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Unfaithful citations in a RAG-optimised model</title>
<desc id="f1-d">A stacked bar: 57 percent of citations judged unfaithful, the model answering from memory and attaching a passage afterwards, and 43 percent faithful. A note explains that a citation can point at a passage that does support the sentence and still be unfaithful.</desc>
<text x="0" y="18" class="viz-title">The marker can be right for the wrong reason</text>
<text x="0" y="36" class="viz-sub">Share of citations by faithfulness, RAG-optimised model, Wallat et al.</text>
<rect x="0" y="60" width="364.8" height="28" class="viz-f4"/>
<rect x="364.8" y="60" width="275.2" height="28" class="viz-f1"/>
<line x1="364.8" y1="60" x2="364.8" y2="88" class="viz-gap"/>
<text x="182.4" y="78" text-anchor="middle" class="viz-onfill">57% unfaithful</text>
<text x="502.4" y="78" text-anchor="middle" class="viz-onfill">43% faithful</text>
<rect x="0" y="120" width="12" height="12" rx="3" class="viz-f4"/><text x="18" y="131" class="viz-label-muted">answer first, passage attached after</text>
<rect x="300" y="120" width="12" height="12" rx="3" class="viz-f1"/><text x="318" y="131" class="viz-label-muted">answer produced from the passage</text>
<text x="0" y="172" class="viz-label-muted">An unfaithful citation can still point at a passage that supports the sentence.</text>
<text x="0" y="194" class="viz-label-muted">It is a correct marker on a claim the passage did not produce.</text>
</svg>
<figcaption>Source: <a href="https://arxiv.org/abs/2412.18004">Wallat et al. (2024)</a>, presented at ICTIR 2025.</figcaption>
</figure>

That distinction matters for a helpdesk more than it sounds. A post-rationalised citation is right on the day the model's memory agrees with the manual and wrong on the day the manual changes, because the model was never reading the manual. The citation looked like grounding and was decoration.

## A document citation cannot be checked at scale

The usual citation is a document identifier: passage 3, or a URL. To verify it, a person opens passage 3 and reads it against the sentence. That is fine for a demonstration and impossible for a system answering thousands of questions a day. There is no cheap mechanical check for "this document supports this sentence" that does not itself involve a model, and a model checking a model's citations is the same problem with a second opinion.

A span citation is different. If the model has to quote the exact words from the passage that support the sentence, two cheap checks become possible. The first is string matching: does the quoted span actually occur in the cited passage, character for character. That check is free, deterministic and cannot be argued with. The second is entailment: does the span, read on its own, support the sentence. That check needs a model, but a small one, given a short span and a short sentence, and it is a far narrower question than "does this document support this answer".

## The no-span, no-claim rule

So the rule I built is this. Every sentence in a grounded answer carries a passage identifier and a verbatim span. A checker outside the model confirms the span exists in that passage by string match, and an entailment model confirms that the span supports the sentence. A sentence that fails either check is removed from the answer before it is shown. Not flagged, not marked uncertain, removed. The answer's length becomes a function of the evidence: an answer with three supported sentences is three sentences long, and an answer with none is a decline.

<figure class="chart">
<svg viewBox="0 0 640 160" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The four gates a sentence passes before it is shown</title>
<desc id="f2-d">Five boxes left to right: generate a sentence with a passage id and a quoted span; extract the span; string-match the span against the passage; run an entailment check of the span against the sentence; show or drop. A note under the third gate says it is deterministic and free.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="40" width="112" height="56" rx="8" class="viz-box"/>
<text x="64" y="64" text-anchor="middle" class="viz-label">Generate</text>
<text x="64" y="82" text-anchor="middle" class="viz-label-muted">id plus span</text>
<line x1="122" y1="68" x2="136" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="140" y="40" width="112" height="56" rx="8" class="viz-box"/>
<text x="196" y="64" text-anchor="middle" class="viz-label">Extract</text>
<text x="196" y="82" text-anchor="middle" class="viz-label-muted">the quoted span</text>
<line x1="254" y1="68" x2="268" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="272" y="40" width="112" height="56" rx="8" class="viz-box-accent"/>
<text x="328" y="64" text-anchor="middle" class="viz-label">String match</text>
<text x="328" y="82" text-anchor="middle" class="viz-label-muted">in that passage</text>
<line x1="386" y1="68" x2="400" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="404" y="40" width="112" height="56" rx="8" class="viz-box"/>
<text x="460" y="64" text-anchor="middle" class="viz-label">Entailment</text>
<text x="460" y="82" text-anchor="middle" class="viz-label-muted">span supports it</text>
<line x1="518" y1="68" x2="532" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="536" y="40" width="96" height="56" rx="8" class="viz-box-ink"/>
<text x="584" y="64" text-anchor="middle" class="viz-on-ink">Show</text>
<text x="584" y="82" text-anchor="middle" class="viz-on-ink">or drop</text>
<text x="328" y="126" text-anchor="middle" class="viz-tick">deterministic and free</text>
<text x="320" y="150" text-anchor="middle" class="viz-label-muted">A sentence that fails any gate is removed; the answer shrinks to its evidence.</text>
</svg>
<figcaption>Illustrative: the pipeline as designed; the string-match gate is the one that costs nothing and catches the most.</figcaption>
</figure>

The string-match gate does more work than it looks. A model that has post-rationalised, answering from memory and reaching for a passage afterwards, tends to quote loosely: it paraphrases the passage, or quotes something close to it, or quotes a span from a different passage than the one it cited. Exact matching catches all of that. The model is being asked to prove it read the passage by reproducing its words, and a model that did not read it cannot.

The entailment gate catches the remainder: spans that are real but do not say what the sentence says. "Refunds are processed within fourteen days" does not support "the refund window is fourteen days", and a span-level entailment model, asked only about those two short strings, is good at seeing the difference.

## What it costs

Two things, and both are worth stating plainly. The first is that answers get shorter, sometimes to nothing, and a product team has to be willing to show a two-sentence answer where the model would have written six. The trade is that the two sentences are checkable, and the four that were dropped were the ones that would have been wrong on the day the manual changed.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Answer length against the entailment threshold, a model</title>
<desc id="f3-d">A falling line: as the entailment threshold rises from lenient to strict, the average number of sentences surviving in an answer falls from about six to about two. A marker shows the threshold at which sentences that would fail when the source changes are removed.</desc>
<text x="0" y="18" class="viz-title">Shorter, and checkable</text>
<text x="0" y="36" class="viz-sub">Average sentences surviving per answer as the entailment gate tightens; an illustrative curve</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">8</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">6</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">4</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">2</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">lenient</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">moderate</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">strict</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Entailment threshold</text>
<polyline points="56,108 164.8,118 273.6,140 382.4,170 491.2,196 600,212" class="viz-s1"/>
<circle cx="382.4" cy="170" r="5" class="viz-d1"/>
<text x="370" y="150" text-anchor="end" class="viz-value">post-rationalised sentences fall away here</text>
<circle cx="600" cy="212" r="4" class="viz-d1"/>
<text x="592" y="232" text-anchor="end" class="viz-value">2 sentences</text>
</svg>
<figcaption>Illustrative: a curve drawn to show the trade the rule makes; the sentence counts are a model, not measurements.</figcaption>
</figure>

The second cost is latency. Two extra passes, one deterministic and one a small model, run after generation and before display. The string match is microseconds. The entailment check on a handful of short pairs is tens of milliseconds on a small model, which for a helpdesk answer read by a person is invisible, and for a pipeline that must stream tokens as they are produced is a real constraint, because the gate needs the whole sentence before it can pass it. For the streamed case the answer is to gate per sentence as each completes, which delays each sentence by one check rather than the whole answer by all of them.

## What the gates miss

The rule is not a guarantee of truth, and it is worth saying which failures survive it. A span can be real, support the sentence, and still be the wrong span: the passage says the refund window is fourteen days for one product and thirty for another, the model quotes the fourteen, and the entailment gate passes because the quoted words do support the sentence. The gates check that the answer came from the passage. They do not check that the passage was the right one, which is a retrieval problem and belongs to the retriever's evaluation rather than to the citation checker.

A span can also be real and the passage itself wrong, out of date, or superseded by a later document. The gates verify the chain from sentence to passage, not the passage's standing in the corpus, and a helpdesk with stale manuals will produce faithfully cited stale answers. That is a better failure than an unfaithful one, because the stale passage is named and can be fixed at the source, but it is a failure, and the corpus needs its own hygiene.

What the gates do guarantee is narrower and more valuable than it looks: every sentence shown to the reader has a named passage and a quoted span that a person can check in seconds. The failure modes that remain are the ones a person can find by following the citation. The ones removed are the ones nobody could have found, because there was nothing at the end of the marker.

## What it changes about the prompt

Asking for spans changes the model's job in a way that helps before the gates even run. A model told to quote the exact supporting words for every sentence is a model that has been told, in effect, to read the passages first. It is harder to post-rationalise a quotation than a citation, because the quotation has to come from the text. The Wallat result says that a marker on its own does not make the model read; the span requirement makes reading the shortest path to a passing answer.

That is the design in one sentence: make the cheapest way to produce a citation the honest way, then check it anyway. A citation is a claim about a passage. Treat it like any other claim the model makes, and refuse to show it until it has been verified by something that is not the model.
