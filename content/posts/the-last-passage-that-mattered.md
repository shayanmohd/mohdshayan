---
title: The last passage that mattered
date: 2026-07-18
summary: Retrieval depth is set by feel and never touched, yet every extra passage is prefill and latency on every turn. Measure the rank of the last passage an answer used, then set k.
tags: RAG, Retrieval, Latency
topic: LLM Engineering
draft: false
---

Somewhere in every retrieval pipeline is a number that was chosen on the first day and never revisited: how many passages to retrieve. Five, because the tutorial said five. Ten, because ten felt safer. The number sets the prompt length on every turn, which sets the prefill cost and the time to first token, and it also sets how much noise sits next to the evidence. When I tuned the helpdesk assistant at CRIS against a latency target, retrieval depth was one of three knobs I had, and it was the one nobody had a principled way to set. This is the way I settled on.

## More is not better past a point

The intuition that more passages can only help is wrong, and the evidence for that has accumulated. Liu and colleagues' [Lost in the Middle](https://arxiv.org/abs/2307.03172) showed that models use evidence unevenly across a long context, with accuracy dropping when the relevant passage sits in the middle of the retrieved set. Cuconasu and colleagues' [The Power of Noise](https://arxiv.org/abs/2401.14887) found that a moderate share of irrelevant passages in the retrieved set substantially degrades factual accuracy, and argued that precision and reranking matter more than raw recall. A 2026 [systems-level analysis of retrieval-augmented generation](https://arxiv.org/abs/2606.28337) reports the pattern directly in one of its configurations: answer quality peaked at a retrieval depth of three and fell at higher depths, even as more of the gold evidence was retrieved.

So the curve of answer quality against k rises, peaks early, and then flattens or falls, and the passages past the peak are paid for twice: once in latency and once in noise.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Answer quality and prefill cost against retrieval depth</title>
<desc id="f1-d">Two curves over retrieval depth from one to twenty. Answer quality rises steeply to a peak around three to five passages and then drifts downward. Prefill tokens rise in a straight line with depth. The region past the peak is where cost keeps rising and quality does not.</desc>
<text x="0" y="18" class="viz-title">The knee, and what lies past it</text>
<text x="0" y="36" class="viz-sub">Shape of the reported pattern; a drawing, not measured data</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">answer quality</text>
<line x1="510" y1="31" x2="524" y2="31" class="viz-sgray"/><text x="530" y="35" class="viz-label-muted">prefill tokens</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="170.5" y="288" text-anchor="middle" class="viz-tick">5</text>
<text x="313.7" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="456.8" y="288" text-anchor="middle" class="viz-tick">15</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">20</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Passages retrieved, k</text>
<polyline points="56,254 600,66" class="viz-sgray"/>
<polyline points="56,220 84.6,150 113.3,110 142,96 170.5,94 199.1,98 256.4,106 313.7,114 400,124 500,134 600,142" class="viz-s1"/>
<circle cx="142" cy="96" r="5" class="viz-d1"/>
<text x="156" y="86" class="viz-value">peak near 3 to 5</text>
<text x="450" y="200" text-anchor="middle" class="viz-label-muted">paid for twice: latency and noise</text>
</svg>
<figcaption>Illustrative: the shape described in <a href="https://arxiv.org/abs/2401.14887">Cuconasu et al. (2024)</a> and the 2026 <a href="https://arxiv.org/abs/2606.28337">systems-level analysis</a>; the curves are drawn, not plotted from a table.</figcaption>
</figure>

That tells you the shape. It does not tell you where the knee is for your corpus, your chunk size and your questions, and the published peaks move around from study to study because those things differ. The knee has to be measured locally, and the usual way to measure it, sweeping k and re-running the whole evaluation at each value, is expensive enough that nobody does it more than once.

## The last useful passage

The measurement I use instead is cheaper and more direct. For each question in the evaluation set, retrieve generously, say twenty passages, generate the answer, and then find the highest rank among the passages the answer actually used: the ones it cites, or, where citation is not enforced, the ones that contain the gold span. That rank is the question's last useful passage, and I write it as LUP. A question whose answer drew on passages ranked 1, 2 and 7 has an LUP of 7. A question whose answer used only the top passage has an LUP of 1.

The distribution of LUP across the evaluation set is the whole picture of how deep retrieval needs to go, and one number from it sets k: the 95th percentile. Retrieve that many and nineteen questions in twenty have every passage they needed. Retrieve more and you are paying prefill on every turn for the twentieth question, which the noise past the knee is likely to hurt anyway.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A last-useful-passage histogram for a helpdesk evaluation set</title>
<desc id="f2-d">Columns for LUP values from one to ten. Most questions have an LUP of one or two, the counts fall away quickly, and a marker at the 95th percentile sits at rank four. Ranks five to ten hold a thin tail.</desc>
<text x="0" y="18" class="viz-title">Where the evidence actually was</text>
<text x="0" y="36" class="viz-sub">Questions by the rank of the last passage their answer used; an illustrative set</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<rect x="72" y="70" width="32" height="180" class="viz-f1"/>
<rect x="126" y="130" width="32" height="120" class="viz-f1"/>
<rect x="180" y="190" width="32" height="60" class="viz-f1"/>
<rect x="234" y="220" width="32" height="30" class="viz-f1"/>
<rect x="288" y="236" width="32" height="14" class="viz-fgray"/>
<rect x="342" y="242" width="32" height="8" class="viz-fgray"/>
<rect x="396" y="245" width="32" height="5" class="viz-fgray"/>
<rect x="450" y="247" width="32" height="3" class="viz-fgray"/>
<rect x="504" y="248" width="32" height="2" class="viz-fgray"/>
<rect x="558" y="249" width="32" height="1" class="viz-fgray"/>
<text x="88" y="272" text-anchor="middle" class="viz-tick">1</text>
<text x="142" y="272" text-anchor="middle" class="viz-tick">2</text>
<text x="196" y="272" text-anchor="middle" class="viz-tick">3</text>
<text x="250" y="272" text-anchor="middle" class="viz-tick">4</text>
<text x="304" y="272" text-anchor="middle" class="viz-tick">5</text>
<text x="358" y="272" text-anchor="middle" class="viz-tick">6</text>
<text x="412" y="272" text-anchor="middle" class="viz-tick">7</text>
<text x="466" y="272" text-anchor="middle" class="viz-tick">8</text>
<text x="520" y="272" text-anchor="middle" class="viz-tick">9</text>
<text x="574" y="272" text-anchor="middle" class="viz-tick">10</text>
<line x1="277" y1="56" x2="277" y2="250" class="viz-s4"/>
<text x="285" y="70" class="viz-label-muted">95th percentile: k = 4</text>
<text x="328" y="292" text-anchor="middle" class="viz-label-muted">Last useful passage rank</text>
</svg>
<figcaption>Illustrative: a distribution of the shape the measurement usually produces on short-answer helpdesk questions; the counts are drawn to show the method, not taken from any deployment.</figcaption>
</figure>

## What the histogram tells you that k does not

The histogram is worth more than the single number, because its shape diagnoses the retriever. A tall bar at rank one and a short tail says the retriever is putting the evidence first and a small k is safe. A flat spread across ranks says the retriever cannot distinguish the relevant passage from its neighbours, and the fix is reranking or better embeddings, not a larger k. A second bump at high ranks says some class of question needs evidence the retriever ranks poorly, and it is worth looking at those questions by hand, because they are usually a chunking problem: the answer spans two chunks, or lives in a table the chunker split.

The measurement also separates two things that a sweep over k conflates. Retrieval quality is where the evidence lands in the ranking. Generation quality is what the model does with it. LUP measures the first directly, on the answers the model actually produced, and leaves the second to the usual accuracy metrics. When accuracy is poor and LUP is low, the retriever is fine and the prompt or the model is the problem. When LUP is high, no prompt will save a pipeline that is hiding its evidence at rank nine.

## Two things the measurement needs to be honest

The first is that the answer's use of a passage has to be observable, and the cleanest way to make it observable is to require citations in the prompt: every sentence the model writes names the passage it came from. That is a design choice with benefits beyond this measurement, since it is also how a helpdesk answer becomes checkable by the person reading it, but it changes the model's behaviour, and a pipeline measured with citations on should run with citations on. Where citations cannot be enforced, the fallback is the gold span: the passage that contains the answer the evaluation set says is correct, whether or not the model used it. That measures where the evidence was rather than what the model touched, which is a slightly different quantity and still a good one.

The second is that the generous retrieval used for the measurement must not be the retrieval used in production, or the measurement is circular. Retrieve twenty to find out that four would have done, then run with four. If the histogram's tail grows when you check again in a month, the corpus or the questions have changed, and the number moves with them. That is the point of making it a measurement rather than a setting.

## What the extra passages cost

Every passage above the 95th percentile is prefill on every turn, and prefill is the part of latency the user feels most, because it happens before the first token. A passage of three hundred tokens, at k of ten instead of four, is eighteen hundred extra tokens of prompt on every request. That is not only time to first token; on a hosted API it is billed input on every turn of every conversation, and on a self-hosted model it is accelerator time that could have served another user.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Prompt tokens against retrieval depth at a fixed chunk size</title>
<desc id="f3-d">Columns for k of 2, 4, 6, 8 and 10 at 300 tokens per passage plus a fixed 600-token system prompt and history: 1,200, 1,800, 2,400, 3,000 and 3,600 tokens. The column at k equals 4, the 95th percentile from the histogram, is highlighted.</desc>
<text x="0" y="18" class="viz-title">What each extra passage adds to every turn</text>
<text x="0" y="36" class="viz-sub">Prompt tokens at 300 per passage, plus 600 of system prompt and history</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M89.3 185.3 V181.3 a4 4 0 0 1 4 -4 H109.3 a4 4 0 0 1 4 4 V250 H89.3 Z" class="viz-fgray"/>
<text x="101.3" y="169.3" text-anchor="middle" class="viz-value">1,200</text>
<text x="101.3" y="272" text-anchor="middle" class="viz-label-muted">k = 2</text>
<path d="M198 153 V149 a4 4 0 0 1 4 -4 H218 a4 4 0 0 1 4 4 V250 H198 Z" class="viz-f1"/>
<text x="210" y="137" text-anchor="middle" class="viz-value">1,800</text>
<text x="210" y="272" text-anchor="middle" class="viz-label-muted">k = 4</text>
<path d="M306.7 120.7 V116.7 a4 4 0 0 1 4 -4 H326.7 a4 4 0 0 1 4 4 V250 H306.7 Z" class="viz-fgray"/>
<text x="318.7" y="104.7" text-anchor="middle" class="viz-value">2,400</text>
<text x="318.7" y="272" text-anchor="middle" class="viz-label-muted">k = 6</text>
<path d="M415.3 88.3 V84.3 a4 4 0 0 1 4 -4 H435.3 a4 4 0 0 1 4 4 V250 H415.3 Z" class="viz-fgray"/>
<text x="427.3" y="72.3" text-anchor="middle" class="viz-value">3,000</text>
<text x="427.3" y="272" text-anchor="middle" class="viz-label-muted">k = 8</text>
<path d="M524 56 V52 a4 4 0 0 1 4 -4 H544 a4 4 0 0 1 4 4 V250 H524 Z" class="viz-fgray"/>
<text x="536" y="40" text-anchor="middle" class="viz-value">3,600</text>
<text x="536" y="272" text-anchor="middle" class="viz-label-muted">k = 10</text>
</svg>
<figcaption>Illustrative: arithmetic on stated assumptions about chunk size and prompt overhead; the highlighted column is the k the histogram above would choose.</figcaption>
</figure>

## How to run it

The measurement needs three things most teams already have: an evaluation set with gold spans or a citation-enforcing prompt, a retriever that can return more than it normally does, and a way to map an answer back to the passages it used. Retrieve twenty, generate, record LUP per question, and plot. Set k at the 95th percentile, or the 90th if latency is tight and the tail is thin. Then re-run the measurement whenever the corpus, the chunker or the embedding model changes, because each of those moves the histogram and none of them announces it.

One more habit follows from having the histogram: keep it per question type. Short factual questions and long procedural ones usually have different tails, and a single k chosen for both is either too deep for the first or too shallow for the second. Where the pipeline can classify the question cheaply, it can choose k per class, and the two histograms tell it what to choose.

The number that came out of the tutorial was never the problem. The problem was that it stayed a number instead of becoming a measurement, and the measurement costs one afternoon.
