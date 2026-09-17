---
title: You pay for the context every turn
date: 2026-09-18
summary: In a retrieval chat the bill is input tokens: every turn resends the prompt, passages and history while the model writes a few hundred back. One ratio shows where the cost is.
tags: Cost, Prompt Caching, RAG
draft: false
---

The intuition about language model bills is that you pay for what the model writes. Output tokens are the expensive ones, five or six times the price of input at every provider, so the answer must be where the money goes. In a retrieval chat, it is not. Every turn resends the system prompt, the retrieved passages and the entire conversation so far, and the model writes a few hundred tokens back. Over a ten-turn conversation the input tokens billed outrun the output tokens by a factor that starts around twelve and, depending on one design decision, ends anywhere between twenty and a hundred. That factor has a name in my cost reviews, and it is the first number I compute for any workload that talks to a model more than once.

## The resend ratio

The resend ratio is input tokens billed divided by output tokens generated, over a whole session. It is one number, it comes straight from the usage fields every API returns, and it answers the only question that matters before optimising: is this workload's cost in generation, which is rare, or in context, which is usual? A ratio near one is a generation workload, where the model writes about as much as it reads, and the levers are shorter answers and cheaper models. A ratio in the tens is a context workload, and the levers are the ones that follow: what goes in the prompt, what stays in the history, and what the cache can reuse. Most teams measure the second kind of workload with the instincts of the first, which is how a chat product ends up choosing a cheaper model to fix a bill that the model's price had almost nothing to do with.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Resend ratio per turn across a ten-turn retrieval chat, under two history policies</title>
<desc id="f1-d">Two rising lines against turn number one to ten. With passages kept out of the stored history, the per-turn ratio rises from 12 at turn one to 24 at turn ten. With passages kept in the history, it rises from 12 to 96. Both use a 600-token system prompt, four 300-token passages per turn, 40-token questions and 150-token answers.</desc>
<text x="0" y="18" class="viz-title">Twelve to one at the first turn, and it only goes up</text>
<text x="0" y="36" class="viz-sub">Input per output token, per turn; 600-token prompt, 4 passages of 300, 150-token answers</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s4"/><text x="350" y="35" class="viz-label-muted">passages kept in history</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s1"/><text x="520" y="35" class="viz-label-muted">passages dropped</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">75</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">50</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">25</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="237" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="418" y="288" text-anchor="middle" class="viz-tick">7</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Turn number</text>
<polyline points="56,238.5 116.4,219.2 176.9,199.9 237.3,180.7 297.8,161.4 358.2,142.2 418.7,122.9 479.1,103.6 539.6,84.4 600,65.1" class="viz-s4"/>
<polyline points="56,238.5 116.4,235.9 176.9,233.2 237.3,230.6 297.8,227.9 358.2,225.3 418.7,222.7 479.1,220 539.6,217.4 600,214.7" class="viz-s1"/>
<circle cx="56" cy="238.5" r="4" class="viz-d1"/><text x="66" y="252" class="viz-value">12</text>
<circle cx="600" cy="65.1" r="4" class="viz-d4"/><text x="592" y="60" text-anchor="end" class="viz-value">96 at turn ten</text>
<circle cx="600" cy="214.7" r="4" class="viz-d1"/><text x="592" y="208" text-anchor="end" class="viz-value">24</text>
<text x="328" y="332" text-anchor="middle" class="viz-label-muted">Cumulative over the session: 54 to 1 with passages kept, 18 to 1 with them dropped.</text>
</svg>
<figcaption>Illustrative: computed from the stated assumptions, a 600-token system prompt, four 300-token passages retrieved fresh each turn, 40-token questions and 150-token answers; no measured traffic is involved.</figcaption>
</figure>

The chart's two lines are the same conversation under two history policies, and the difference between them is the single largest cost decision in a retrieval chat. If the passages retrieved for each turn are kept in the stored history, so that turn ten's prompt contains the passages from turns one through nine as well as its own, the per-turn ratio reaches 96 by turn ten and the session averages 54 input tokens per output token. If each turn's passages are used and then dropped, with only the question and the answer retained, turn ten's ratio is 24 and the session averages 18. Same model, same answers, three times the bill.

## Why the price tables make it worse than it looks

Output tokens are more expensive, and that fact is what hides the ratio. At the current list prices, the output price is five times the input price across the Claude line, Fable 5.1 at 10 and 50 dollars per million tokens, Opus 5 at 5 and 25, Sonnet 5 at 2 and 10, Haiku 4.5 at 1 and 5, per the [published pricing](https://claude.com/pricing); OpenAI's [current table](https://developers.openai.com/api/docs/pricing) runs from five times for its largest models to six for most of the mid and small ones and eight for one small model. So a workload with a resend ratio of five spends equal money on input and output. A ratio of 18 spends about three and a half times as much on input as on output. A ratio of 54 spends eleven times as much.

<figure class="chart">
<svg viewBox="0 0 640 350" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Ratio of output to input token price across current models from two providers</title>
<desc id="f2-d">Horizontal bars showing the output price divided by the input price: Claude Fable 5.1, Opus 5, Sonnet 5 and Haiku 4.5 all at 5; gpt-6-astra and gpt-5.6-sol at 5; gpt-5.6-terra, gpt-5.5, gpt-5.4 and gpt-5.4-mini at 6; gpt-5-mini at 8. A marker at the ratio shows where a workload's resend ratio would make input and output cost the same.</desc>
<text x="0" y="18" class="viz-title">Output costs five to eight times input; the ratio decides which dominates</text>
<text x="0" y="36" class="viz-sub">Output price divided by input price, list prices per million tokens, September 2026</text>
<line x1="176" y1="52" x2="176" y2="290" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Claude Fable 5.1</text><path d="M176 58 H426 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="446" y="73" class="viz-value">5</text>
<text x="166" y="101" text-anchor="end" class="viz-label">Claude Opus 5</text><path d="M176 86 H426 a4 4 0 0 1 4 4 V102 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="446" y="101" class="viz-value">5</text>
<text x="166" y="129" text-anchor="end" class="viz-label">Claude Sonnet 5</text><path d="M176 114 H426 a4 4 0 0 1 4 4 V130 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="446" y="129" class="viz-value">5</text>
<text x="166" y="157" text-anchor="end" class="viz-label">Claude Haiku 4.5</text><path d="M176 142 H426 a4 4 0 0 1 4 4 V158 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="446" y="157" class="viz-value">5</text>
<text x="166" y="185" text-anchor="end" class="viz-label">gpt-6-astra</text><path d="M176 170 H426 a4 4 0 0 1 4 4 V186 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="446" y="185" class="viz-value">5</text>
<text x="166" y="213" text-anchor="end" class="viz-label">gpt-5.6-terra</text><path d="M176 198 H476 a4 4 0 0 1 4 4 V214 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="496" y="213" class="viz-value">6</text>
<text x="166" y="241" text-anchor="end" class="viz-label">gpt-5.4-mini</text><path d="M176 226 H476 a4 4 0 0 1 4 4 V242 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="496" y="241" class="viz-value">6</text>
<text x="166" y="269" text-anchor="end" class="viz-label">gpt-5-mini</text><path d="M176 254 H576 a4 4 0 0 1 4 4 V270 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="596" y="269" class="viz-value">8</text>
<rect x="0" y="306" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="317" class="viz-label-muted">Anthropic</text>
<rect x="100" y="306" width="12" height="12" rx="3" class="viz-f2"/><text x="118" y="317" class="viz-label-muted">OpenAI</text>
<text x="0" y="340" class="viz-label-muted">Fifty pixels per unit; a resend ratio above the bar means input dominates.</text>
</svg>
<figcaption>Source: computed from the list prices on the <a href="https://claude.com/pricing">Claude pricing page</a> and the <a href="https://developers.openai.com/api/docs/pricing">OpenAI pricing page</a> as read on 18 September 2026; ratios only, since the prices themselves change more often than the ratios do.</figcaption>
</figure>

## What prompt caching actually attacks

Prompt caching is the provider's answer to the resend ratio, and it works on exactly one thing: a prefix of the prompt that is byte-for-byte identical to a prefix the provider has seen recently. Both major providers document the same shape with different numbers. OpenAI's [prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) discounts cached input by up to 90 percent, requires a prefix of at least 1,024 tokens on its current models, keeps entries alive for at least thirty minutes after the last use on those models, and states plainly that reuse requires the entire rendered prefix to match. Anthropic's [documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) prices cache reads at a tenth of the input price, cache writes at 1.25 times for a five-minute lifetime or twice for an hour, sets minimum cacheable lengths from 512 to 4,096 tokens depending on the model, and fixes the prefix order as tools, then system, then messages, with explicit breakpoints that cache everything up to that point.

The word that matters in both is prefix. A cache hit reuses everything up to the first byte that differs from the last request, and nothing after it. So the layout of the prompt decides whether the cache ever hits, and the natural layout for a retrieval chat, system prompt, then this turn's passages, then the history, then the question, is the worst one: the passages change every turn, they sit right after the system prompt, and everything after them is uncacheable.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Prompt layout with the cache breakpoint: stable prefix first, retrieved passages after it, history last</title>
<desc id="f3-d">Two stacked prompt layouts. The naive layout: system prompt, then this turn's passages, then history, then question; the cache breakpoint falls after the system prompt and only the system prompt is reused. The recommended layout: tools and system prompt, then the history so far, then this turn's passages, then the question; the breakpoint falls after the history, so the system prompt and the whole history are reused and only the passages and question are billed at full price.</desc>
<text x="0" y="18" class="viz-title">Put what changes last</text>
<text x="8" y="52" class="viz-tick">NAIVE: PASSAGES RIGHT AFTER THE SYSTEM PROMPT</text>
<rect x="8" y="60" width="120" height="40" rx="6" class="viz-box-accent"/><text x="68" y="85" text-anchor="middle" class="viz-label">system</text>
<rect x="132" y="60" width="150" height="40" rx="6" class="viz-box-ink"/><text x="207" y="85" text-anchor="middle" class="viz-on-ink">this turn's passages</text>
<rect x="286" y="60" width="240" height="40" rx="6" class="viz-box-ink"/><text x="406" y="85" text-anchor="middle" class="viz-on-ink">history, growing every turn</text>
<rect x="530" y="60" width="102" height="40" rx="6" class="viz-box-ink"/><text x="581" y="85" text-anchor="middle" class="viz-on-ink">question</text>
<line x1="130" y1="56" x2="130" y2="104" class="viz-s4"/>
<text x="136" y="120" class="viz-tick">breakpoint: only the system prompt is ever reused</text>
<text x="8" y="164" class="viz-tick">RECOMMENDED: STABLE PREFIX, THEN HISTORY, THEN WHAT CHANGED</text>
<rect x="8" y="172" width="120" height="40" rx="6" class="viz-box-accent"/><text x="68" y="197" text-anchor="middle" class="viz-label">tools, system</text>
<rect x="132" y="172" width="240" height="40" rx="6" class="viz-box-accent"/><text x="252" y="197" text-anchor="middle" class="viz-label">history so far</text>
<rect x="376" y="172" width="150" height="40" rx="6" class="viz-box-ink"/><text x="451" y="197" text-anchor="middle" class="viz-on-ink">this turn's passages</text>
<rect x="530" y="172" width="102" height="40" rx="6" class="viz-box-ink"/><text x="581" y="197" text-anchor="middle" class="viz-on-ink">question</text>
<line x1="374" y1="168" x2="374" y2="216" class="viz-s4"/>
<text x="136" y="232" class="viz-tick">breakpoint: system and history reused at a tenth of the price</text>
<rect x="8" y="256" width="12" height="12" rx="3" class="viz-box-accent"/><text x="26" y="267" class="viz-label-muted">cacheable, identical to the last turn</text>
<rect x="300" y="256" width="12" height="12" rx="3" class="viz-box-ink"/><text x="318" y="267" class="viz-label-muted">changes every turn, billed in full</text>
<text x="0" y="292" class="viz-label-muted">History grows one exchange a turn, extending the cached prefix instead of breaking it.</text>
</svg>
<figcaption>Illustrative: the two layouts as the caching rules in both providers' documentation imply; the breakpoint is where the cached prefix ends.</figcaption>
</figure>

The recommended layout inverts the order: the stable prefix first, then the history, then this turn's passages, then the question. The history grows by one exchange per turn, and because it grows at the end, each turn's history is the previous turn's history plus a suffix, so the previous turn's cache entry is a prefix of this turn's prompt and it hits. The passages, which change every turn, go after the breakpoint and are billed in full, and they are the only thing that is. On the ten-turn conversation above, with passages dropped from history, that turns most of the 18-to-1 into cache reads at a tenth of the price, and the effective ratio, in money rather than tokens, comes down to the low single digits.

There is one more subtlety in the numbers. A cache write costs more than a plain input token at one provider, 1.25 times for the short lifetime, so a prefix that is written and never read again costs more than not caching it. The layout above makes each turn's write the next turn's read, which is the case caching was built for, and a conversation that ends after one turn pays a small premium for nothing. The resend ratio, measured per session, is how you tell those apart.

## Where the ratio comes from in practice

The workload I have described is the shape of the helpdesk chat I worked on: a system prompt, a handful of retrieved passages per turn, a history, and short answers with citations. The ratios above are computed from stated assumptions and not from that system's traffic, but the shape is the shape, and it is the shape of most retrieval chats and most agent loops. The AI automation work I do for clients as a retained service has the same structure with a different label on the box: a stable instruction set, a changing context, a growing history, and a bill that is dominated by the parts that are resent.

So the review starts the same way each time. Pull the usage counts, divide input by output over a session, and look at the number. If it is near five, the model's answers are the cost and the conversation is about which model. If it is in the tens, the context is the cost, and the conversation is about three things in order: what is in the history, where the passages sit, and whether the prefix is stable enough to cache. The provider's discount is real, and it applies only to the part of the prompt you were disciplined enough to keep the same.
