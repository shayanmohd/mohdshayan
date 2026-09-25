---
title: Which language your AI fails in
date: 2026-09-19
summary: Building AI in India means shipping a product that works in English and fails quietly in the languages most users think in. Find and publish the failure languages before users do.
tags: AI Policy, India, Evaluation
topic: Founding & Impact
draft: false
---

An AI product built in India is, by default, a product that works in English and fails quietly in the languages most of its users think in. Quietly is the important word. The product does not crash in Hindi; it answers a little worse, retrieves a little less, refuses a little more often, and costs several times as much per query, and none of that shows up in an evaluation run in English. The gap is structural, it comes from what the models were trained on, and the obligation that comes with building here is not to close it, which no single product can, but to find it and publish it before users find it themselves.

## The gap is in the data

The web that language models learn from is overwhelmingly not in Indian languages. W3Techs' [survey of website content languages](https://w3techs.com/technologies/overview/content_language), as of 17 September 2026, puts English at 49.5 percent of websites and lists Hindi, Bengali, Tamil, Urdu, Marathi and Telugu among the languages used by fewer than 0.1 percent each. Common Crawl, the corpus most open models are built from, publishes [language statistics](https://commoncrawl.github.io/cc-crawl-statistics/plots/languages) per crawl: in CC-MAIN-2026-34, the August 2026 crawl, English is 40.45 percent of pages, Hindi 0.21 percent, Bengali 0.11, Tamil 0.04, Urdu 0.03, Marathi 0.03 and Telugu 0.02. Add the six Indian languages together and they are under half a percent of the crawl for languages spoken by hundreds of millions of people.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of web pages by primary language in the August 2026 Common Crawl</title>
<desc id="f1-d">Horizontal bars on a logarithmic scale, percent of pages: English 40.45; Hindi 0.21; Bengali 0.11; Tamil 0.04; Urdu 0.03; Marathi 0.03; Telugu 0.02. The English bar is grey and the Indian-language bars are gold; the gap between them is more than two orders of magnitude.</desc>
<text x="0" y="18" class="viz-title">Two orders of magnitude between English and everything Indian</text>
<text x="0" y="36" class="viz-sub">Percent of pages by primary language, CC-MAIN-2026-34, log scale</text>
<line x1="136" y1="52" x2="136" y2="290" class="viz-axis"/>
<text x="126" y="73" text-anchor="end" class="viz-label">English</text>
<path d="M136 58 H596 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="592" y="53" text-anchor="end" class="viz-value">40.45</text>
<text x="126" y="107" text-anchor="end" class="viz-label">Hindi</text>
<path d="M136 92 H278 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="298" y="107" class="viz-value">0.21</text>
<text x="126" y="141" text-anchor="end" class="viz-label">Bengali</text>
<path d="M136 126 H237 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="257" y="141" class="viz-value">0.11</text>
<text x="126" y="175" text-anchor="end" class="viz-label">Tamil</text>
<path d="M136 160 H184 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="204" y="175" class="viz-value">0.04</text>
<text x="126" y="209" text-anchor="end" class="viz-label">Urdu</text>
<path d="M136 194 H164 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="184" y="209" class="viz-value">0.03</text>
<text x="126" y="243" text-anchor="end" class="viz-label">Marathi</text>
<path d="M136 228 H153 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="173" y="243" class="viz-value">0.03</text>
<text x="126" y="277" text-anchor="end" class="viz-label">Telugu</text>
<path d="M136 262 H136 a4 4 0 0 1 4 4 V278 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="156" y="277" class="viz-value">0.02</text>
<text x="0" y="316" class="viz-label-muted">Log scale from 0.02 to 50 percent; W3Techs' website survey gives the same ordering.</text>
</svg>
<figcaption>Source: <a href="https://commoncrawl.github.io/cc-crawl-statistics/plots/languages">Common Crawl language statistics</a> for CC-MAIN-2026-34; cross-checked against the <a href="https://w3techs.com/technologies/overview/content_language">W3Techs content-language survey</a> of 17 September 2026, which reports English at 49.5 percent of websites and each Indian language below 0.1.</figcaption>
</figure>

The models built in India are the response to that gap, and the [India AI Impact Summit](https://en.wikipedia.org/wiki/India_AI_Impact_Summit_2026) in New Delhi in February 2026 was where the response was shown: BharatGen's Param2, a 17-billion-parameter model [built for 22 Indian languages](https://www.businesstoday.in/technology/news/story/bharatgen-to-launch-17-billion-parameter-multilingual-ai-model-at-india-ai-impact-summit-515923-2026-02-12), and Sarvam's 30 and 105-billion-parameter models. Those matter, and they do not remove the product obligation, because a product ships on whichever model it ships on, and the question for its users is not how good the best Indic model is but how the product they are holding behaves in their language.

## Where the failure hides

The failure has four modes, and a product that measures only accuracy sees at most one of them. Refusal: the model declines in a language where it would have answered in English, because its safety training saw fewer examples and errs toward silence. Hallucination: the model answers fluently and wrongly, because fluency in the script was learned and the facts were not. Degraded retrieval: in a retrieval pipeline, the embedding model ranks passages worse in the query's language, so the generator is grounded on the wrong text and the citation is to the wrong place. And the token budget: the tokeniser, built on the frequencies of the web, spends several times as many tokens on the same sentence in an Indian script, which raises the cost per query and shortens the effective context by the same factor.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Tokens for the same sentence, the first article of the Universal Declaration of Human Rights, in four languages and two public tokenisers</title>
<desc id="f2-d">Grouped horizontal bars. cl100k tokeniser: English 33 tokens, Hindi 180, Bengali 213, Tamil 330. o200k tokeniser: English 33, Hindi 54, Bengali 56, Tamil 76. The newer tokeniser cuts the multiple from ten times down to about twice, and the gap is still there.</desc>
<text x="0" y="18" class="viz-title">The same sentence costs two to ten times as much</text>
<text x="0" y="36" class="viz-sub">Tokens for Article 1 of the Universal Declaration of Human Rights</text>
<rect x="440" y="26" width="12" height="12" rx="3" class="viz-fgray"/><text x="458" y="37" class="viz-label-muted">cl100k</text>
<rect x="530" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="548" y="37" class="viz-label-muted">o200k</text>
<line x1="116" y1="52" x2="116" y2="236" class="viz-axis"/>
<text x="106" y="75" text-anchor="end" class="viz-label">English</text>
<path d="M116 60 H160 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="174" y="72" class="viz-value">33</text>
<path d="M116 80 H160 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H116 Z" class="viz-f1"/><text x="174" y="92" class="viz-value">33</text>
<text x="106" y="121" text-anchor="end" class="viz-label">Hindi</text>
<path d="M116 106 H372 a4 4 0 0 1 4 4 V118 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="386" y="118" class="viz-value">180</text>
<path d="M116 126 H190 a4 4 0 0 1 4 4 V138 a4 4 0 0 1 -4 4 H116 Z" class="viz-f1"/><text x="204" y="138" class="viz-value">54</text>
<text x="106" y="167" text-anchor="end" class="viz-label">Bengali</text>
<path d="M116 152 H420 a4 4 0 0 1 4 4 V164 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="434" y="164" class="viz-value">213</text>
<path d="M116 172 H193 a4 4 0 0 1 4 4 V184 a4 4 0 0 1 -4 4 H116 Z" class="viz-f1"/><text x="207" y="184" class="viz-value">56</text>
<text x="106" y="213" text-anchor="end" class="viz-label">Tamil</text>
<path d="M116 198 H588 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="584" y="193" text-anchor="end" class="viz-value">330</text>
<path d="M116 218 H225 a4 4 0 0 1 4 4 V230 a4 4 0 0 1 -4 4 H116 Z" class="viz-f1"/><text x="239" y="230" class="viz-value">76</text>
<text x="0" y="254" class="viz-label-muted">Same passage; the difference is what the tokeniser was trained to expect.</text>
</svg>
<figcaption>Source: computed by the author with <a href="https://github.com/openai/tiktoken">tiktoken</a> over the cl100k and o200k encodings, using the published translations of Article 1 of the Universal Declaration of Human Rights.</figcaption>
</figure>

The token figure is the one I can compute exactly, and it is the one most teams never look at. With the older of the two public tokenisers, the Tamil sentence costs ten times the English one; with the newer, about two and a third times. A product priced per query in English is a product that loses money, or shortens its context, or both, for every Tamil user, and the team will discover this from the bill rather than from a benchmark.

## The failure-language test

The obligation, then, is a test run before release, and it is not complicated. Take a fixed task set: the twenty or fifty things the product is actually for, with reference answers. Run it in every scheduled language a user could reasonably use with the product, which for most Indian products is a dozen rather than twenty-two. For each language, record the four modes: the refusal rate, an error rate judged by someone who reads the language, the retrieval quality if the product retrieves, and the tokens per task relative to English. Then publish the list of languages in which the product refuses, hallucinates, retrieves badly or blows the token budget, and say what "badly" meant.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The failure-language matrix: languages against failure modes, with the publish rule</title>
<desc id="f3-d">A grid with languages down the side, English, Hindi, Bengali, Tamil, Telugu, Marathi, and four failure modes across the top: refusal, hallucination, degraded retrieval, token budget. Cells are marked pass or fail with example results: English passes all; Hindi fails token budget; Tamil fails retrieval and token budget; Telugu fails refusal, retrieval and token budget. A rule beneath says any row with a fail is published as a failure language with the mode named.</desc>
<text x="0" y="18" class="viz-title">Run the same tasks in every language, publish every failing row</text>
<text x="200" y="52" text-anchor="middle" class="viz-tick">REFUSAL</text>
<text x="320" y="52" text-anchor="middle" class="viz-tick">HALLUCINATION</text>
<text x="440" y="52" text-anchor="middle" class="viz-tick">RETRIEVAL</text>
<text x="560" y="52" text-anchor="middle" class="viz-tick">TOKEN BUDGET</text>
<line x1="0" y1="60" x2="640" y2="60" class="viz-axis"/>
<text x="20" y="88" class="viz-label">English</text>
<rect x="192" y="74" width="16" height="16" rx="3" class="viz-f1"/><rect x="312" y="74" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="74" width="16" height="16" rx="3" class="viz-f1"/><rect x="552" y="74" width="16" height="16" rx="3" class="viz-f1"/>
<line x1="0" y1="100" x2="640" y2="100" class="viz-grid"/>
<text x="20" y="128" class="viz-label">Hindi</text>
<rect x="192" y="114" width="16" height="16" rx="3" class="viz-f1"/><rect x="312" y="114" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="114" width="16" height="16" rx="3" class="viz-f1"/><rect x="552" y="114" width="16" height="16" rx="3" class="viz-f4"/>
<line x1="0" y1="140" x2="640" y2="140" class="viz-grid"/>
<text x="20" y="168" class="viz-label">Tamil</text>
<rect x="192" y="154" width="16" height="16" rx="3" class="viz-f1"/><rect x="312" y="154" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="154" width="16" height="16" rx="3" class="viz-f4"/><rect x="552" y="154" width="16" height="16" rx="3" class="viz-f4"/>
<line x1="0" y1="180" x2="640" y2="180" class="viz-grid"/>
<text x="20" y="208" class="viz-label">Telugu</text>
<rect x="192" y="194" width="16" height="16" rx="3" class="viz-f4"/><rect x="312" y="194" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="194" width="16" height="16" rx="3" class="viz-f4"/><rect x="552" y="194" width="16" height="16" rx="3" class="viz-f4"/>
<line x1="0" y1="220" x2="640" y2="220" class="viz-grid"/>
<rect x="20" y="238" width="12" height="12" rx="3" class="viz-f1"/><text x="38" y="249" class="viz-label-muted">within the English tolerance</text>
<rect x="260" y="238" width="12" height="12" rx="3" class="viz-f4"/><text x="278" y="249" class="viz-label-muted">fails: this row is published, with the mode named</text>
<text x="0" y="284" class="viz-label-muted">Cells are an example pattern, not a measurement; the shape is what the test produces.</text>
</svg>
<figcaption>Illustrative: the matrix the test fills in, with an example pattern of results; the languages shown are a subset of the scheduled languages a product would run.</figcaption>
</figure>

A product that has not run the test cannot claim to serve India, and a product that has run it and published the failing rows can, honestly, because it has told its users where it works. That is the whole obligation. The test finds failure; it does not fix it, and pretending it does would be a worse dishonesty than the one it replaces. Fixing a failure language is a model choice, a retrieval choice, a tokeniser choice or a data choice, and each is a project. Publishing the list is an afternoon, once the task set exists, and it is the afternoon most products skip.

## Running it without fooling yourself

Three details decide whether the test measures the product or measures something else. The first is where the task set comes from. It should be drawn from what users actually ask, from logs where they exist and from the product's own onboarding where they do not, so that the languages are tested on the product's job rather than on a translated benchmark that nobody uses it for. The second is translation. If the tasks are machine-translated into each language, the test measures the translator as much as the product, and a translation error becomes a product failure in the results; the tasks and the reference answers have to be written or checked by someone who speaks the language, which is a cost, and it is the cost that makes the test mean something. The third is the threshold: "fails" is defined relative to English on the same tasks, not against an absolute bar, because the obligation is to know where the product is worse than it claims, and the claim is calibrated in English.

Retrieval deserves a separate word, because it fails in a way that the other modes hide. A pipeline that indexes documents in English and receives a query in Tamil depends on a cross-lingual embedding to match them, and the match quality is a property of the embedding model in that language pair, not of the generator. A product can have a generator that handles Tamil adequately and still fail the retrieval column, because the passages it was handed were the wrong ones; the answer then looks like hallucination and is not. Measuring retrieval separately, by whether the right passage is in the top results for the translated query, is what tells the two apart, and it is what points the fix at the right component.

## Why I hold to this

The pipeline I worked on during my internship was a retrieval system with grounded citations, served on fine-tuned open models against latency targets, and every stage of it was tuned in English because that is the language the documents, the evaluators and the latency budget were in. Nothing about it was wrong for English. What I could see, without measuring, was that retrieval quality and generation quality would move differently for a user who typed in Hindi, and that the latency target, which was set in tokens per second, would be met in English and missed for that user for reasons that had nothing to do with the hardware. I did not have the failure-language test then. I have it now, and it is the first thing I would run on that pipeline.

The reason it belongs to founders rather than to researchers is that researchers have already done their part: the gap is documented, the Indic models exist, the tokeniser cost is measurable with a public library in ten minutes. What remains is the decision, per product, to look, and to say what was found. Building AI in India comes with the languages of India attached. The test is how you find out which of them you have actually built for.
