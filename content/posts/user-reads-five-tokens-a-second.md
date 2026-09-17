---
title: The user reads at five tokens a second
date: 2026-09-17
summary: For a streamed answer, decode speed only needs to beat the reader. Adults read about 238 words a minute, so speed above a floor is invisible; spend the capacity elsewhere.
tags: Inference, Latency, LLM Serving
draft: false
---

The number that gets optimised in a serving stack is tokens per second, and for a streamed chat answer it is the wrong number to optimise past a point that is easy to compute. The person on the other end reads at a fixed speed. Once the model produces text faster than that, every further token per second is invisible to them, and the capacity spent producing it could have been spent on the thing they do notice, which is how long they waited before the first word appeared. When I was tuning batching for the helpdesk assistant at CRIS against a latency target, this was the reframing that made the target make sense.

## How fast people read

Brysbaert's [meta-analysis of reading rate](https://doi.org/10.1016/j.jml.2019.104047), covering 190 studies and 18,573 participants, puts the average silent reading rate for adults reading English non-fiction at 238 words per minute, fiction at 260, and reading aloud at 183. Non-fiction is the right figure for a helpdesk answer or a technical explanation. At roughly 1.3 tokens per English word for a typical subword tokeniser, 238 words a minute is about four words a second, which is a little over five tokens a second.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Human reading rates converted to tokens per second</title>
<desc id="f1-d">Horizontal bars: reading aloud about 4.0 tokens per second, silent non-fiction about 5.2, silent fiction about 5.6. A marker at about 10 tokens per second shows the reading-speed floor, twice the non-fiction rate, that this post proposes for a streamed answer.</desc>
<text x="0" y="18" class="viz-title">How fast the reader can go</text>
<text x="0" y="36" class="viz-sub">Tokens per second, at 1.3 tokens per word</text>
<line x1="210" y1="52" x2="210" y2="188" class="viz-axis"/>
<text x="200" y="73" text-anchor="end" class="viz-label">Reading aloud, 183 wpm</text>
<path d="M210 58 H346 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H210 Z" class="viz-fgray"/>
<text x="362" y="73" class="viz-value">4.0</text>
<text x="200" y="107" text-anchor="end" class="viz-label">Silent non-fiction, 238 wpm</text>
<path d="M210 92 H388 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H210 Z" class="viz-f1"/>
<text x="404" y="107" class="viz-value">5.2</text>
<text x="200" y="141" text-anchor="end" class="viz-label">Silent fiction, 260 wpm</text>
<path d="M210 126 H402 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H210 Z" class="viz-fgray"/>
<text x="418" y="141" class="viz-value">5.6</text>
<line x1="574" y1="52" x2="574" y2="188" class="viz-axis"/>
<text x="566" y="176" text-anchor="end" class="viz-label-muted">floor: 10.4, twice non-fiction</text>
<text x="0" y="222" class="viz-label-muted">A stream above the floor is never the thing the reader is waiting on.</text>
</svg>
<figcaption>Source: reading rates from <a href="https://doi.org/10.1016/j.jml.2019.104047">Brysbaert (2019)</a>; the tokens-per-word factor is a stated assumption, and the floor is this post's rule.</figcaption>
</figure>

A single stream from a modern serving stack decodes far faster than five tokens a second. That is the observation, and it is usually stated as a success. The consequence that gets missed is that the surplus is being spent on nothing. A reader who receives forty tokens a second is not reading eight times faster; they are watching text pile up below the line they are on, and the pile does not shorten the time they will spend reading it.

## Two clocks

The latency a user feels in a streamed answer has two parts, and only one of them is decode speed. The first clock runs from the moment they press enter to the moment the first token appears, and it is made of queueing, the time the request waits for a slot, and prefill, the time the model spends reading the prompt. The second clock runs from the first token to the last, and it is decode: the per-token generation rate, times the length of the answer.

<figure class="chart">
<svg viewBox="0 0 640 210" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One streamed request as a timeline with two clocks</title>
<desc id="f2-d">A horizontal timeline. From the request to the first token: a queueing segment then a prefill segment, together labelled time to first token, which the reader experiences as waiting. From the first token to the last: a long decode segment, which the reader experiences as reading, as long as tokens arrive faster than they are read.</desc>
<text x="0" y="18" class="viz-title">What the reader is waiting for</text>
<text x="0" y="36" class="viz-sub">The first clock is felt; the second is hidden above the floor</text>
<rect x="440" y="24" width="12" height="12" rx="3" class="viz-f4"/><text x="458" y="35" class="viz-label-muted">waiting</text>
<rect x="530" y="24" width="12" height="12" rx="3" class="viz-fgray"/><text x="548" y="35" class="viz-label-muted">reading</text>
<rect x="20" y="70" width="90" height="28" class="viz-f4"/>
<rect x="110" y="70" width="110" height="28" class="viz-f4"/>
<rect x="220" y="70" width="400" height="28" class="viz-fgray"/>
<line x1="110" y1="70" x2="110" y2="98" class="viz-gap"/>
<line x1="220" y1="70" x2="220" y2="98" class="viz-gap"/>
<text x="65" y="88" text-anchor="middle" class="viz-onfill">queue</text>
<text x="165" y="88" text-anchor="middle" class="viz-onfill">prefill</text>
<text x="420" y="88" text-anchor="middle" class="viz-label">decode, one token at a time</text>
<line x1="20" y1="120" x2="220" y2="120" class="viz-axis"/>
<text x="120" y="140" text-anchor="middle" class="viz-tick">time to first token: waiting</text>
<line x1="220" y1="120" x2="620" y2="120" class="viz-axis"/>
<text x="420" y="140" text-anchor="middle" class="viz-tick">time per output token: reading, if above the floor</text>
<text x="20" y="180" class="viz-label-muted">Capacity moved from the grey segment to the brick one is capacity the reader feels.</text>
</svg>
<figcaption>Illustrative: the two clocks of a streamed response; segment lengths are drawn for legibility, not to scale.</figcaption>
</figure>

The reader feels the first clock entirely. Nothing is on the screen, and every hundred milliseconds is noticed. The reader feels the second clock only when it runs slower than they read, because then the text stalls under their eyes. Above reading speed, the second clock is invisible: the answer finishes arriving before they finish reading it, and it makes no difference to them whether it finished arriving one second in or five.

## The reading-speed floor

So the rule is this. Set a floor on per-stream decode rate at about twice the audience's reading speed, which for English non-fiction is roughly ten tokens a second. The factor of two covers variation between readers, the fact that people skim the start of an answer faster than they read the middle, and the way tokens arrive in bursts rather than evenly. Above the floor, per-stream speed is not a metric to improve. Below it, the reader is waiting on the model and it is the metric.

Then spend everything above the floor on the first clock. In practice that means larger batches. Continuous batching stacks more concurrent requests onto the same accelerator, which raises aggregate throughput and lowers per-stream decode rate at the same time; the [vLLM paper](https://arxiv.org/abs/2309.06180) reports throughput improvements of two to four times over earlier systems at the same latency, from managing attention memory well enough to keep batches large. The reading-speed floor says how large: push the batch until the per-stream rate reaches the floor, and no further. The capacity that frees up serves more users, which shortens the queue, which shortens the first clock for everyone.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Per-stream decode rate and aggregate throughput against batch size, a model</title>
<desc id="f3-d">Two curves over batch sizes from 1 to 64. Per-stream tokens per second falls from 60 at batch 1 to about 6 at batch 64. Aggregate tokens per second rises from 60 to about 380. A horizontal marker at 10 tokens per second, the reading-speed floor, crosses the per-stream curve near batch 32, which is where the model says to stop growing the batch.</desc>
<text x="0" y="18" class="viz-title">Push the batch to the floor, then stop</text>
<text x="0" y="36" class="viz-sub">Tokens per second, from a stated model; log scale</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">per stream</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s2"/><text x="520" y="35" class="viz-label-muted">aggregate</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1,000</text>
<line x1="56" y1="125.3" x2="600" y2="125.3" class="viz-grid"/><text x="48" y="129.3" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-grid"/><text x="48" y="198.7" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="146.7" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="237.3" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="418.7" y="288" text-anchor="middle" class="viz-tick">16</text>
<text x="509.3" y="288" text-anchor="middle" class="viz-tick">32</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">64</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Concurrent requests in the batch</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-s4"/>
<text x="596" y="188" text-anchor="end" class="viz-label-muted">reading-speed floor, 10 tokens per second</text>
<polyline points="56,140.6 146.7,143.4 237.3,148.8 328,158.4 418.7,173.2 509.3,192.5 600,214" class="viz-s1"/>
<polyline points="56,140.6 146.7,122.5 237.3,107 328,95.7 418.7,89.6 509.3,88 600,88.6" class="viz-s2"/>
<circle cx="509.3" cy="192.5" r="5" class="viz-d1"/>
<text x="500" y="226" text-anchor="end" class="viz-value">stop near 32</text>
</svg>
<figcaption>Illustrative: constructed from a model in which a step of decode takes 16 ms plus 1.2 ms per request in the batch, chosen to show the shape of the trade rather than to describe any hardware.</figcaption>
</figure>

## Measuring the floor for your own audience

The floor is not a universal constant, and two of its inputs are worth measuring rather than copying. The first is the tokeniser ratio. English runs at roughly 1.3 tokens per word on common subword vocabularies, but other scripts run higher, sometimes much higher, because their characters are split into more pieces. An assistant answering in Hindi or Tamil emits more tokens per word the reader reads, so the floor in tokens per second rises even though the reader's speed in words has not changed. Measure tokens per word on your own answers, per language, and set the floor per language.

The second is the reader. Brysbaert's figure is an average across adults reading prose; a support engineer scanning a known procedure reads faster, and a person reading in their second language reads slower. Where the product can afford it, the honest measurement is direct: how long the reader keeps the answer open before acting, compared with the time the stream took to finish. If the stream finished long before they acted, the floor is comfortably met and the decode budget can be cut further.

What the floor does to the operations dashboard is the practical payoff. Aggregate tokens per second stops being the headline. In its place go two service objectives: a per-stream decode rate that stays above the floor at the 95th percentile, and a time to first token that is as low as the freed capacity can make it. The first is a constraint. The second is the thing to improve.

## Where the floor does not apply

The rule is about people reading a stream, and it fails wherever that description does not hold. A model whose output feeds another program, a parser, a tool call, a second model, has no reader, and there the per-token rate is the whole latency and should be as high as the hardware allows. A model producing code that the user will scroll through rather than read in order is somewhere in between. And a user who has stopped reading and is waiting for the end, because the answer is a long list they only want the bottom of, has become a machine consumer for the duration.

It also fails for very short answers, where the first clock dominates whatever the decode rate, and for the pathological case where prefill is so long that the first token arrives after the reader has given up. Neither of those is fixed by decode speed either. They are fixed by shorter prompts and shorter queues, which is where the freed capacity goes.

## What it changed

For a helpdesk answer read by a person on a screen, the floor applied cleanly, and the number that mattered was the first clock. The work that improved the experience was not faster decode. It was keeping the retrieved passages short so prefill was short, and keeping the batch large so the queue was short, with the per-stream rate held at the floor rather than maximised. Five tokens a second is the reader's speed. The model only has to beat it.
