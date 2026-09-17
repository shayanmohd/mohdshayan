---
title: The first thing a quantised model forgets
date: 2026-09-17
summary: Quantised models recover over 99 percent of accuracy on average, and the average hides where the loss lands. A canary set from the classes that fail first should choose the format.
tags: Quantisation, Inference, Evaluation
draft: false
---

The case for shipping a 4-bit model is an average, and the average is excellent. Red Hat's evaluation team [ran over half a million evaluations](https://developers.redhat.com/articles/2024/10/17/we-ran-over-half-million-evaluations-quantized-llms) on quantised Llama 3.1 models and found that every scheme at every size recovered over 99 percent of the full-precision score on the OpenLLM v1 benchmarks, close to 99 percent on v2, and 98.9 percent on code at 4-bit. Those numbers are why teams quantise without looking further, and they are true. What they do not say is where the missing one percent lives, and the answer from the studies that looked is that it is not spread thinly across everything. It is concentrated in a few task classes, and in those classes the loss is ten times the average.

## The average and the tail

The same evaluation series publishes per-model numbers, and the 8B model at 4-bit weights is the interesting one. Its [model card](https://huggingface.co/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16) reports 98.9 percent recovery on OpenLLM v1, 96.1 percent on v2, and 93.0 percent on Arena-Hard, the open-ended, judged benchmark closest to real conversational use; the [8-bit version](https://huggingface.co/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w8a8) of the same model sits at or above 100 percent on all three. The ordering is the point: the more the task looks like a hard, open-ended conversation, the more the 4-bit model gives up, and the smaller the model, the more it gives up.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Accuracy recovery of the quantised Llama 3.1 8B Instruct model, by benchmark and format</title>
<desc id="f1-d">Grouped horizontal bars. OpenLLM v1: 8-bit 100.3 percent, 4-bit 98.9. OpenLLM v2: 8-bit 101.5, 4-bit 96.1. Arena-Hard: 8-bit 105.4, 4-bit 93.0. The 4-bit loss grows as the benchmark gets harder and more open-ended.</desc>
<text x="0" y="18" class="viz-title">Where the 8B model's 4-bit loss lands</text>
<text x="0" y="36" class="viz-sub">Percent of the full-precision score recovered; bars start at 90</text>
<rect x="470" y="26" width="12" height="12" rx="3" class="viz-fgray"/><text x="488" y="37" class="viz-label-muted">8-bit</text>
<rect x="540" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="558" y="37" class="viz-label-muted">4-bit</text>
<line x1="136" y1="52" x2="136" y2="220" class="viz-axis"/>
<text x="126" y="75" text-anchor="end" class="viz-label">OpenLLM v1</text>
<path d="M136 60 H444 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="458" y="72" class="viz-value">100.3</text>
<path d="M136 80 H402 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="416" y="92" class="viz-value">98.9</text>
<text x="126" y="131" text-anchor="end" class="viz-label">OpenLLM v2</text>
<path d="M136 116 H480 a4 4 0 0 1 4 4 V128 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="494" y="128" class="viz-value">101.5</text>
<path d="M136 136 H319 a4 4 0 0 1 4 4 V148 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="333" y="148" class="viz-value">96.1</text>
<text x="126" y="187" text-anchor="end" class="viz-label">Arena-Hard</text>
<path d="M136 172 H597 a4 4 0 0 1 4 4 V184 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="593" y="167" text-anchor="end" class="viz-value">105.4</text>
<path d="M136 192 H226 a4 4 0 0 1 4 4 V204 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="240" y="204" class="viz-value">93.0</text>
<text x="0" y="248" class="viz-label-muted">Bars start at 90. The harder and more open-ended the task, the larger the 4-bit gap.</text>
</svg>
<figcaption>Source: the Red Hat AI model cards for the <a href="https://huggingface.co/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16">W4A16</a> and <a href="https://huggingface.co/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w8a8">W8A8</a> quantisations of Llama 3.1 8B Instruct.</figcaption>
</figure>

Two other studies name the classes. Marchisio and colleagues asked [how quantisation affects multilingual models](https://arxiv.org/abs/2407.03211) and found that multi-step mathematical reasoning degrades fastest: at 4-bit with group-wise quantisation, a 35B model dropped 13.1 percent on average across languages on the multilingual maths benchmark and 17.3 percent in Chinese, while non-Latin-script languages were hurt worst in general. Their most sobering number is the gap between what automatic metrics see and what people see: a 1.7 percent average drop in Japanese on automatic tasks corresponded to a 16.0 percent drop reported by human evaluators on realistic prompts. And an [April 2026 paper](https://arxiv.org/abs/2604.19884) separates two failure modes: signal degradation, where the computation is intact but precision erodes cumulatively, and computation collapse, where components in the early layers stop working and the signal is destroyed, which is the cliff that appears below 4-bit and which no post-hoc repair fixes.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Relative drops at 4-bit reported for fragile task classes, versus the automatic-metric average</title>
<desc id="f2-d">Horizontal bars, percent relative drop: automatic metrics, Japanese average, 1.7; human evaluation, Japanese, 16.0; multilingual maths, 35B model average, 13.1; multilingual maths, Chinese, 17.3. The first bar is small and the other three are large.</desc>
<text x="0" y="18" class="viz-title">Ten times the average, in the classes that fail first</text>
<text x="0" y="36" class="viz-sub">Relative drop from full precision at 4-bit, percent, from one multilingual study</text>
<line x1="216" y1="52" x2="216" y2="188" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">Automatic metrics, Japanese</text>
<path d="M216 58 H246 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="266" y="73" class="viz-value">1.7</text>
<text x="206" y="107" text-anchor="end" class="viz-label">Human evaluation, Japanese</text>
<path d="M216 92 H532 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-f4"/>
<text x="552" y="107" class="viz-value">16.0</text>
<text x="206" y="141" text-anchor="end" class="viz-label">Maths, average of languages</text>
<path d="M216 126 H474 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-f4"/>
<text x="494" y="141" class="viz-value">13.1</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Maths, Chinese</text>
<path d="M216 160 H558 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H216 Z" class="viz-f4"/>
<text x="578" y="175" class="viz-value">17.3</text>
<text x="0" y="222" class="viz-label-muted">The first bar justifies shipping. The users who notice live in the other three.</text>
<rect x="0" y="232" width="12" height="12" rx="3" class="viz-fgray"/><text x="18" y="243" class="viz-label-muted">automatic-metric average</text>
<rect x="200" y="232" width="12" height="12" rx="3" class="viz-f4"/><text x="218" y="243" class="viz-label-muted">measured drop in a fragile class</text>
</svg>
<figcaption>Source: Marchisio et al., <a href="https://arxiv.org/abs/2407.03211">How Does Quantization Affect Multilingual LLMs?</a>, 2024; maths figures are for the 35B model with group-wise 4-bit weights, human evaluation for the 103B model.</figcaption>
</figure>

## Why this fooled nobody at the helpdesk

At CRIS I tuned quantisation against latency targets for a helpdesk model, and the averages there were honest, for a reason worth stating: a helpdesk corpus in English, with short factual answers drawn from retrieved documents, is the easy case. It has no multi-step arithmetic, no non-Latin scripts, no long open-ended reasoning, and no rare identifiers that the tokeniser splits into unfamiliar pieces. The task classes that degrade first were simply absent, so the average was also the tail. That is not a reason to trust the average elsewhere. It is a description of the one kind of workload where trusting it happens to be safe, and most workloads are not that kind.

## The canary set

The practice that follows is to stop evaluating the average and start evaluating the tail, deliberately, with a small fixed set of prompts drawn only from the classes that fail first. I call it the canary set: thirty to fifty prompts, chosen for fragility rather than representativeness. Multi-step arithmetic with the working shown. Long-context lookup where the answer is a specific detail far from the question. Rare identifiers, part numbers, hashes, unusual names, that must be reproduced exactly. And, for any product with users outside English, prompts in the non-Latin scripts those users write in, judged by someone who reads them, because the multilingual study's central finding is that automatic metrics miss most of that damage.

The set is run at every quantisation level under consideration, against the full-precision model as the reference, and the selection rule is a tolerance: pick the smallest format whose canary score stays within a set margin of full precision. The margin is a product decision, a few percent for a general assistant, near zero for anything that does arithmetic on the user's behalf. Because the canaries are the fragile classes, they move long before the benchmark average does, and the rule catches the format that has quietly started to fail on the users who would notice.

<figure class="chart">
<svg viewBox="0 0 640 312" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">GPU memory for an 8B model: weights by format against KV cache by context length</title>
<desc id="f3-d">Stacked comparison in gigabytes. Weights: 16-bit about 16.1, 8-bit about 8.0, 4-bit about 4.0. KV cache at 16-bit, derived from the architecture at 128 kilobytes per token: 8k context 1.0, 32k 4.0, 128k 16.0. At long context the cache, not the weights, dominates, which is where quantising the weights buys the least.</desc>
<text x="0" y="18" class="viz-title">What 4-bit buys depends on the context length</text>
<text x="0" y="36" class="viz-sub">Gigabytes for an 8B Llama-family model, derived from the published dimensions</text>
<text x="20" y="66" class="viz-tick">WEIGHTS</text>
<line x1="136" y1="72" x2="136" y2="160" class="viz-axis"/>
<text x="126" y="93" text-anchor="end" class="viz-label">16-bit</text>
<path d="M136 80 H458 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="472" y="92" class="viz-value">16.1</text>
<text x="126" y="121" text-anchor="end" class="viz-label">8-bit</text>
<path d="M136 108 H296 a4 4 0 0 1 4 4 V120 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="310" y="120" class="viz-value">8.0</text>
<text x="126" y="149" text-anchor="end" class="viz-label">4-bit</text>
<path d="M136 136 H216 a4 4 0 0 1 4 4 V148 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="230" y="148" class="viz-value">4.0</text>
<text x="20" y="186" class="viz-tick">KV CACHE, 16-BIT</text>
<line x1="136" y1="192" x2="136" y2="280" class="viz-axis"/>
<text x="126" y="213" text-anchor="end" class="viz-label">8k context</text>
<path d="M136 200 H156 a4 4 0 0 1 4 4 V212 a4 4 0 0 1 -4 4 H136 Z" class="viz-f2"/>
<text x="170" y="212" class="viz-value">1.0</text>
<text x="126" y="241" text-anchor="end" class="viz-label">32k context</text>
<path d="M136 228 H216 a4 4 0 0 1 4 4 V240 a4 4 0 0 1 -4 4 H136 Z" class="viz-f2"/>
<text x="230" y="240" class="viz-value">4.0</text>
<text x="126" y="269" text-anchor="end" class="viz-label">128k context</text>
<path d="M136 256 H456 a4 4 0 0 1 4 4 V268 a4 4 0 0 1 -4 4 H136 Z" class="viz-f2"/>
<text x="470" y="268" class="viz-value">16.0</text>
<rect x="0" y="292" width="12" height="12" rx="3" class="viz-fgray"/><text x="18" y="303" class="viz-label-muted">weights, 16 and 8-bit</text>
<rect x="180" y="292" width="12" height="12" rx="3" class="viz-f1"/><text x="198" y="303" class="viz-label-muted">weights, 4-bit</text>
<rect x="320" y="292" width="12" height="12" rx="3" class="viz-f2"/><text x="338" y="303" class="viz-label-muted">KV cache at 16-bit</text>
</svg>
<figcaption>Illustrative: derived by the author from the Llama 3 8B dimensions (32 layers, 8 key-value heads of 128, so 128 KB per token at 16-bit) and 8.03 billion parameters; the 4-bit weight figure ignores scale and zero-point overhead.</figcaption>
</figure>

## Building the set

The set is easy to build badly and only slightly harder to build well. The prompts should come from real traffic where there is any, sorted into the fragile classes by hand, and from written examples where there is not, and they should exclude anything the full-precision model already gets wrong, because a canary that fails at every precision measures nothing. Each prompt gets a scoring rule appropriate to its class: exact match for arithmetic results and identifiers, where a single wrong digit is a failure; a rubric applied by a person or a strong judge model for open-ended answers, with the judge's own agreement with humans checked once on a sample. Decoding is deterministic, at zero temperature, so that a change in the score is a change in the model rather than in the dice.

Two disciplines keep the set useful over time. It stays fixed across releases, so that scores are comparable and a regression is a regression; new prompts go into a candidate pool that is promoted only at a planned revision. And it stays small, thirty to fifty prompts, because the point is that it runs in minutes on every candidate build, including the ones that nobody expected to change the model, such as a runtime upgrade that quietly changed the quantisation kernels.

When a canary trips, the response is graduated. The first step is a less aggressive format for the same weights, 8-bit instead of 4, or a 4-bit scheme with smaller groups or activation-aware calibration, and the canaries are re-run. The second, informed by the two-failure-modes finding, is to leave the early layers, where computation collapse begins, at higher precision while quantising the rest, which several toolchains now support per layer. The third is to accept the larger model and find the memory elsewhere, which is where the last figure comes in.

## What the canaries do not decide

The canary set answers one question, which format is safe, and it deliberately does not answer the other, whether quantisation is worth it at all. That depends on where the memory goes, and the third figure is the reminder that for an 8B model the answer changes with context length. At short contexts the weights dominate and 4-bit halves the footprint again over 8-bit. At 128k tokens the key-value cache at 16-bit is as large as the full-precision weights, and shaving the weights to 4-bit saves a quarter of the total while spending accuracy in the fragile classes. There, the better trade is often 8-bit weights and a quantised cache, which is a different decision with its own canaries.

The rule, then, has two halves. Decide whether to quantise from the memory budget at the context length you actually serve. Decide how far to quantise from the canary set, not from the benchmark average, because the average is the last number to move and the canaries are the first. The first thing a quantised model forgets is the thing your evaluation was not looking at, and the canary set is how you make sure something is.
