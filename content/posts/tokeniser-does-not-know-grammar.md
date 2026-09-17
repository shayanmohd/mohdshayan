---
title: The tokeniser does not know your grammar
date: 2026-09-17
summary: Constrained decoding is sold as a parser masking logits, but the model emits tokens that ignore the parser's boundaries. The tokens that straddle a boundary set the cost.
tags: Structured Output, Tokenisation, LLM Inference
draft: false
---

The one-sentence explanation of grammar-constrained decoding is that a parser sits beside the model and, at each step, masks out every token that would break the grammar. It is a good sentence and it hides the whole difficulty. The parser reads characters. The model emits subword tokens, and the tokeniser that made those tokens was trained on text frequencies with no knowledge that a JSON string ends at a quote or that a key is followed by a colon. So the units the model chooses from do not line up with the units the grammar is written in, and every real engine's cost and correctness come down to how it handles the tokens that cross a boundary. Those tokens are a computable set, and its size, not the rule count of the grammar, is what predicts the per-token overhead.

## Two segmentations of one string

Take the smallest JSON object that has anything in it. A grammar sees nine terminals: an opening brace, a quoted key, a colon, a quoted value, a comma, a second key, a colon, a number and a closing brace. A byte-pair tokeniser sees something else. Run through the cl100k vocabulary used by a generation of OpenAI models, via the public [tiktoken](https://github.com/openai/tiktoken) library, the same object becomes nine tokens too, but they are not the same nine: the first token is the brace fused with the opening quote of the key, the third is the closing quote, the colon and the opening quote of the value fused into one, and the fifth is a quote, a comma and a quote. Four of the nine tokens span a boundary the grammar cares about.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">One JSON object segmented by the grammar and by a BPE tokeniser</title>
<desc id="f1-d">Two rows of boxes for the object with a name key of Ada and an age of 36. The grammar row has nine terminals: brace, quoted key, colon, quoted value, comma, quoted key, colon, number, brace. The tokeniser row has nine tokens from the cl100k vocabulary: brace-plus-quote, name, quote-colon-quote, Ada, quote-comma-quote, age, quote-colon, 36, brace. The four tokens that cross a terminal boundary are highlighted.</desc>
<text x="0" y="18" class="viz-title">Same bytes, two sets of boundaries</text>
<text x="8" y="56" class="viz-tick">GRAMMAR TERMINALS</text>
<rect x="8" y="64" width="40" height="36" rx="6" class="viz-box"/><text x="28" y="88" text-anchor="middle" class="viz-label">{</text>
<rect x="54" y="64" width="76" height="36" rx="6" class="viz-box"/><text x="92" y="88" text-anchor="middle" class="viz-label">"name"</text>
<rect x="136" y="64" width="40" height="36" rx="6" class="viz-box"/><text x="156" y="88" text-anchor="middle" class="viz-label">:</text>
<rect x="182" y="64" width="70" height="36" rx="6" class="viz-box"/><text x="217" y="88" text-anchor="middle" class="viz-label">"Ada"</text>
<rect x="258" y="64" width="40" height="36" rx="6" class="viz-box"/><text x="278" y="88" text-anchor="middle" class="viz-label">,</text>
<rect x="304" y="64" width="70" height="36" rx="6" class="viz-box"/><text x="339" y="88" text-anchor="middle" class="viz-label">"age"</text>
<rect x="380" y="64" width="40" height="36" rx="6" class="viz-box"/><text x="400" y="88" text-anchor="middle" class="viz-label">:</text>
<rect x="426" y="64" width="50" height="36" rx="6" class="viz-box"/><text x="451" y="88" text-anchor="middle" class="viz-label">36</text>
<rect x="482" y="64" width="40" height="36" rx="6" class="viz-box"/><text x="502" y="88" text-anchor="middle" class="viz-label">}</text>
<text x="8" y="146" class="viz-tick">BPE TOKENS, cl100k</text>
<rect x="8" y="154" width="46" height="36" rx="6" class="viz-box-accent"/><text x="31" y="178" text-anchor="middle" class="viz-label">{"</text>
<rect x="60" y="154" width="64" height="36" rx="6" class="viz-box"/><text x="92" y="178" text-anchor="middle" class="viz-label">name</text>
<rect x="130" y="154" width="50" height="36" rx="6" class="viz-box-accent"/><text x="155" y="178" text-anchor="middle" class="viz-label">":"</text>
<rect x="186" y="154" width="56" height="36" rx="6" class="viz-box"/><text x="214" y="178" text-anchor="middle" class="viz-label">Ada</text>
<rect x="248" y="154" width="50" height="36" rx="6" class="viz-box-accent"/><text x="273" y="178" text-anchor="middle" class="viz-label">","</text>
<rect x="304" y="154" width="56" height="36" rx="6" class="viz-box"/><text x="332" y="178" text-anchor="middle" class="viz-label">age</text>
<rect x="366" y="154" width="46" height="36" rx="6" class="viz-box-accent"/><text x="389" y="178" text-anchor="middle" class="viz-label">":</text>
<rect x="418" y="154" width="50" height="36" rx="6" class="viz-box"/><text x="443" y="178" text-anchor="middle" class="viz-label">36</text>
<rect x="474" y="154" width="40" height="36" rx="6" class="viz-box"/><text x="494" y="178" text-anchor="middle" class="viz-label">}</text>
<rect x="8" y="216" width="12" height="12" rx="3" class="viz-box-accent"/><text x="26" y="227" class="viz-label-muted">token crosses a terminal boundary: four of nine here</text>
</svg>
<figcaption>Illustrative: the segmentation is real, reproduced with the cl100k encoding in tiktoken; the layout is drawn.</figcaption>
</figure>

The straddling tokens are the problem. A token that lies entirely inside one terminal is easy to judge: it is valid if the terminal accepts those characters. A token that crosses a boundary can only be judged by advancing the parser through the first part, checking that the terminal has ended where the token says it has, and continuing into whatever comes next, which may involve leaving the current grammar rule and consulting the rules above it. Every engine does that work somewhere; the question is how often and for how many tokens.

## The straddle set

For a grammar and a vocabulary, define the straddle set as the tokens whose byte string crosses at least one terminal boundary of the grammar. For JSON the dominant boundaries are the quotes that begin and end every string, so a good first approximation is the set of vocabulary tokens that contain a quote character together with at least one other byte. Computed over the two public OpenAI vocabularies, that set is 1,342 tokens of the 100,277 in cl100k, about 1.3 percent, and 1,140 of the 200,019 in o200k, about 0.6 percent. The figure lines up with what the XGrammar authors report for a different tokeniser: for JSON with Llama 3.1's 128k vocabulary, they count [1,134 context-dependent tokens](https://arxiv.org/abs/2411.15100), under one percent, and their engine's central trick is that the other 99 percent can be judged once, at grammar compile time, and stored as a bitmask per parser state.

That is why the [XGrammar paper](https://arxiv.org/abs/2411.15100) can report mask generation under 40 microseconds per token for JSON schemas against roughly 150 for Outlines and over 800 for lm-format-enforcer, and its [2026 successor](https://arxiv.org/abs/2601.04426) can claim near-zero end-to-end overhead while compiling grammars six times faster for workloads where the grammar changes from request to request. The per-token cost that remains is almost entirely the straddle set: the tokens that have to be run through the parser at decode time because their validity depends on where in the grammar you are.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Per-token mask generation time by engine, JSON schema workloads</title>
<desc id="f2-d">Horizontal bars in microseconds: lm-format-enforcer, over 800; llama.cpp grammar mode, over 500; Outlines, about 150; XGrammar, under 40. XGrammar is highlighted.</desc>
<text x="0" y="18" class="viz-title">What the straddle set costs, engine by engine</text>
<text x="0" y="36" class="viz-sub">Mask time per token in microseconds, as reported in the XGrammar paper's comparison</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">lm-format-enforcer</text>
<path d="M176 58 H572 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="568" y="53" text-anchor="end" class="viz-value">over 800</text>
<text x="166" y="107" text-anchor="end" class="viz-label">llama.cpp grammars</text>
<path d="M176 92 H422 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="442" y="107" class="viz-value">over 500</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Outlines</text>
<path d="M176 126 H250 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="270" y="141" class="viz-value">about 150</text>
<text x="166" y="175" text-anchor="end" class="viz-label">XGrammar</text>
<path d="M176 160 H192 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="212" y="175" class="viz-value">under 40</text>
<text x="0" y="222" class="viz-label-muted">The gap is the share of the vocabulary each engine re-checks at decode time.</text>
</svg>
<figcaption>Source: figures as reported in <a href="https://arxiv.org/abs/2411.15100">XGrammar</a> (Dong et al., 2024), read from the paper's comparison; the llama.cpp figure is for its context-free grammar mode.</figcaption>
</figure>

## One percent of the vocabulary, one in eight of the output

The straddle set is small as a share of the vocabulary and that is not the number that matters at decode time. What matters is how often the model actually emits a straddling token, and for JSON the answer is: at every string boundary, which is twice per string. I measured it on two JSON documents with both tokenisers. On a document of long prose-like strings averaging seventeen tokens each, 6.2 percent of all emitted tokens were straddling tokens. On a package lockfile, whose strings are short names and versions averaging seven or eight tokens, the share was 13 to 14 percent. One token in sixteen, or one in eight, is a token the engine cannot judge from the precomputed mask, and that ratio is set by the shape of the output, not by the grammar's rule count.

<figure class="chart">
<svg viewBox="0 0 640 270" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Straddling tokens as a share of the vocabulary and as a share of emitted tokens</title>
<desc id="f3-d">Horizontal bars in percent. Share of vocabulary: cl100k 1.34, o200k 0.57. Share of emitted tokens on a prose-heavy JSON document, both tokenisers about 6.2. Share on a package lockfile: cl100k 13.2, o200k 14.0. The emitted shares are highlighted.</desc>
<text x="0" y="18" class="viz-title">Rare in the vocabulary, common in the output</text>
<text x="0" y="36" class="viz-sub">Tokens containing a string delimiter plus other bytes, percent</text>
<rect x="420" y="26" width="12" height="12" rx="3" class="viz-fgray"/><text x="438" y="37" class="viz-label-muted">of vocabulary</text>
<rect x="540" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="558" y="37" class="viz-label-muted">of output</text>
<line x1="216" y1="52" x2="216" y2="222" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">cl100k vocabulary</text>
<path d="M216 58 H250 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="270" y="73" class="viz-value">1.34</text>
<text x="206" y="107" text-anchor="end" class="viz-label">o200k vocabulary</text>
<path d="M216 92 H230 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="250" y="107" class="viz-value">0.57</text>
<text x="206" y="141" text-anchor="end" class="viz-label">Prose-heavy JSON, output</text>
<path d="M216 126 H378 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="398" y="141" class="viz-value">6.2, both tokenisers</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Lockfile JSON, cl100k</text>
<path d="M216 160 H562 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="558" y="155" text-anchor="end" class="viz-value">13.2</text>
<text x="206" y="209" text-anchor="end" class="viz-label">Lockfile JSON, o200k</text>
<path d="M216 194 H584 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="580" y="189" text-anchor="end" class="viz-value">14.0</text>
<text x="0" y="252" class="viz-label-muted">Shorter strings, more boundaries per token: the lockfile pays twice as often.</text>
</svg>
<figcaption>Source: computed by the author with <a href="https://github.com/openai/tiktoken">tiktoken</a> over the cl100k and o200k encodings; the two documents are a 212 KB planning file with 2,595 strings and a 27 KB package lockfile with 1,311 strings.</figcaption>
</figure>

The measurement suggests a simple predictor for constrained-decoding overhead that has nothing to do with the grammar's size: the number of string boundaries per emitted token. A schema that produces many short strings, identifiers, enum values, version numbers, will spend a larger share of its decode steps in the expensive path than a schema that produces a few long ones, whatever the rule count. The grammar's rules affect compile time; the straddle rate affects every token.

## Why a microsecond is a budget

The reason to care about tens of microseconds is that serving is a per-token business. During my internship I tuned batching and quantisation for served Llama and Mistral models against latency targets, and the arithmetic of that job is unforgiving: a decode step for a batch has a budget of a few milliseconds, the mask has to be ready before the sampler runs, and anything on the critical path is multiplied by every token of every request. A mask that costs a millisecond is a real cost; at a few hundred tokens per response it is a few hundred milliseconds of added latency, or a batch that cannot be made larger. The engines that got the overhead under a few tens of microseconds did it by moving the work off the critical path, and the work that could not be moved is exactly the straddle set.

There is a second consequence that is about correctness rather than speed, and the paper titled [Lost in Space](https://arxiv.org/abs/2502.14969) documents it under the name token misalignment: because the model's preferred tokenisation of a string is not the only tokenisation that spells it, a constrained decoder that forces the grammar's boundaries can push the model onto token sequences it never saw in training, where its predictions are poor. The straddle set is where that happens, because a straddling token is precisely one whose natural use spans a boundary the constraint may forbid. An engine that handles the set well is not only faster; it lets the model write the way it learned to.

## What to take from it

If you are choosing an engine, the number to ask for is the per-token mask time on your schema, not the grammar's expressiveness, and the number to measure on your own traffic is the straddle rate: the share of emitted tokens that cross a string boundary. If you are designing a schema, longer strings and fewer of them are cheaper to constrain than many short ones, which is the opposite of what tidy schema design usually produces. And if you are explaining constrained decoding to someone, the one-sentence version is fine as long as the second sentence follows it: the parser reads characters, the model emits tokens, and the tokens that straddle the boundary between the two are where the cost lives.
