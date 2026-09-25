---
title: The spread that survives the fees
date: 2026-09-10
summary: Most cross-venue spreads a detector flags are gross spreads. After two taker fees, two slippage terms, transfer cost and decay, the number that matters is what survives.
tags: Arbitrage, Market Microstructure, Shayanomaly
topic: Web3 & DeFi
draft: false
---

The first version of any arbitrage detector finds opportunities everywhere. Two venues quote the same asset a few basis points apart, the detector lights up, and the log fills with spreads that would have made money if the world had ended at the moment the quote arrived. When I built the engine behind Shayanomaly, which streams order books from five venues and looks for cross-venue anomalies, the first thing I learned was that the number the detector was computing was not the number I cared about. It was computing the gross spread. The number that decides anything is the spread that survives the deductions, and there are six of them.

## Six deductions

Start with a gross spread: venue A asks 100.00, venue B bids 100.50, so buying on A and selling on B shows 50 basis points. Then take it apart.

Two taker fees. Crossing the spread on both legs means paying the taker rate at each venue, and at the base tier those rates are public. Binance charges [0.10% on spot](https://www.binance.com/en/fee/spotMaker) for regular users, as does [Bybit](https://www.bybit.com/en/help-center/article/Bybit-Spot-Fees-Explained) and [OKX](https://www.okx.com/en-us/help/trading-fee-rules-faq), whose base tier is 0.08% maker and 0.10% taker. Kraken's [fee schedule](https://www.kraken.com/features/fee-schedule) starts higher, at 0.40% maker and 0.80% taker for the entry tier before volume and balance discounts. Two legs at 10 basis points each is 20 of the 50 gone before anything has moved.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Base-tier spot taker fee by venue</title>
<desc id="f1-d">Horizontal bars in basis points: Binance 10, Bybit 10, OKX 10, Kraken 80 at the entry tier. Kraken's bar is much longer than the other three.</desc>
<text x="0" y="18" class="viz-title">What crossing the spread costs, per leg</text>
<text x="0" y="36" class="viz-sub">Spot taker fee at the base tier, basis points, September 2026</text>
<line x1="128" y1="52" x2="128" y2="188" class="viz-axis"/>
<text x="118" y="73" text-anchor="end" class="viz-label">Binance</text>
<path d="M128 58 H179 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H128 Z" class="viz-f1"/>
<text x="195" y="73" class="viz-value">10</text>
<text x="118" y="107" text-anchor="end" class="viz-label">Bybit</text>
<path d="M128 92 H179 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H128 Z" class="viz-f1"/>
<text x="195" y="107" class="viz-value">10</text>
<text x="118" y="141" text-anchor="end" class="viz-label">OKX</text>
<path d="M128 126 H179 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H128 Z" class="viz-f1"/>
<text x="195" y="141" class="viz-value">10</text>
<text x="118" y="175" text-anchor="end" class="viz-label">Kraken</text>
<path d="M128 160 H564 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H128 Z" class="viz-f1"/>
<text x="580" y="175" class="viz-value">80</text>
<text x="128" y="212" class="viz-label-muted">Every tier above the base is cheaper; a detector should read</text>
<text x="128" y="232" class="viz-label-muted">the account's actual tier, not the public page.</text>
</svg>
<figcaption>Source: the public fee pages of <a href="https://www.binance.com/en/fee/spotMaker">Binance</a>, <a href="https://www.bybit.com/en/help-center/article/Bybit-Spot-Fees-Explained">Bybit</a>, <a href="https://www.okx.com/en-us/help/trading-fee-rules-faq">OKX</a> and <a href="https://www.kraken.com/features/fee-schedule">Kraken</a>, entry tier, read in September 2026.</figcaption>
</figure>

Two notes on those fees before moving on. First, they are taker fees, because an arbitrage that has to complete before the spread closes crosses the book on both legs; resting a maker order on one side changes the fee and adds a new risk, that the maker leg never fills while the taker leg already has. A detector that assumes maker fees is pricing a strategy it is not running. Second, the fifth venue in a five-venue terminal is often a large regulated exchange whose entry tiers sit above the 0.10% level of the three cheapest here, and a pair that includes it starts its life with a larger first deduction than the others. That is not a reason to exclude the venue. It is a reason to compute the deduction per venue rather than assume one number.

Two slippage terms. The quoted price is the best level, and the best level has a size. Buying more than the size at the ask walks the book to the next level and the one after that, so the average fill price is worse than the quote by an amount that depends on the trade size and the depth. The same happens on the sell side. A detector that reads only the top of book is pricing a trade of the smallest possible size, which is the one trade nobody wants to make.

Transfer or gas. If the two legs settle on different venues, the asset or the cash has to get from one to the other at some point, and moving it costs a withdrawal fee or an on-chain transaction. Strategies that pre-position inventory on both sides pay this less often but still pay it, amortised over the trades the inventory supports.

Decay. The quote is a snapshot and the fill is later. Between the two, the spread moves, usually against you, because the spread you saw is the same spread everyone else saw. The expected loss from that movement over the fill window is a cost, and it is the one most detectors do not even have a variable for.

<figure class="chart">
<svg viewBox="0 0 640 180" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A 50 basis point gross spread, taken apart</title>
<desc id="f2-d">One stacked bar. Of 50 basis points: 20 go to taker fees on the two legs, 12 to slippage against the depth of both books, 9 to transfer cost and decay over the fill window, and 9 survive. The surviving segment is highlighted.</desc>
<text x="0" y="18" class="viz-title">What is left of 50 basis points</text>
<text x="0" y="36" class="viz-sub">Fees from public schedules; slippage, transfer and decay are stated assumptions</text>
<rect x="0" y="60" width="256" height="28" class="viz-f2"/>
<rect x="256" y="60" width="153.6" height="28" class="viz-f3"/>
<rect x="409.6" y="60" width="115.2" height="28" class="viz-f4"/>
<rect x="524.8" y="60" width="115.2" height="28" class="viz-f1"/>
<line x1="256" y1="60" x2="256" y2="88" class="viz-gap"/>
<line x1="409.6" y1="60" x2="409.6" y2="88" class="viz-gap"/>
<line x1="524.8" y1="60" x2="524.8" y2="88" class="viz-gap"/>
<text x="128" y="78" text-anchor="middle" class="viz-onfill">fees 20</text>
<text x="332.8" y="78" text-anchor="middle" class="viz-onfill">slippage 12</text>
<text x="467.2" y="78" text-anchor="middle" class="viz-onfill">move 9</text>
<text x="582.4" y="78" text-anchor="middle" class="viz-onfill">left 9</text>
<rect x="0" y="120" width="12" height="12" rx="3" class="viz-f2"/><text x="18" y="131" class="viz-label-muted">two taker fees</text>
<rect x="150" y="120" width="12" height="12" rx="3" class="viz-f3"/><text x="168" y="131" class="viz-label-muted">two slippage terms</text>
<rect x="320" y="120" width="12" height="12" rx="3" class="viz-f4"/><text x="338" y="131" class="viz-label-muted">transfer and decay</text>
<rect x="490" y="120" width="12" height="12" rx="3" class="viz-f1"/><text x="508" y="131" class="viz-label-muted">surviving spread</text>
<text x="0" y="164" class="viz-tick">basis points; the gross figure alone would have been reported as 50</text>
</svg>
<figcaption>Illustrative: fees from the schedules above at 10 basis points per leg; the other three terms are example values chosen to show the shape of the calculation.</figcaption>
</figure>

## The surviving spread

So the number the detector computes, for every venue pair on every book update, is the surviving spread: the gross spread minus all six deductions, with the two slippage terms computed by walking each book to the intended trade size and the fee terms read from the account's actual tier rather than the public page. Then one more rule, which is the one that keeps the strategy alive: the uncertain terms are inflated by a safety multiple before they are subtracted. Fees are exact. Slippage from the current book is exact for this instant and wrong the next. Decay is an estimate. Multiply the estimated terms by a factor, 1.5 or 2 depending on how much you trust your latency, and only a spread that is still positive after that counts as an opportunity.

The fee lookup deserves one more sentence, because it is the term people get wrong in the easy direction. Public fee pages describe the base tier, and almost no account that trades enough to arbitrage sits at the base tier. Volume discounts, token-holding discounts and negotiated rates all lower the number, and a detector that uses the public rate will discard opportunities that were real. So the fee term is read from the account, refreshed on a schedule, and logged with the spread, so that a trade that looked marginal can be checked against the fee that actually applied.

The gross number is never shown without the surviving one beside it. That is a display rule as much as a computation rule, and it matters, because a screen full of gross spreads trains the person watching it to believe in money that does not exist.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The detector pipeline, from book update to decision</title>
<desc id="f3-d">Two rows of boxes. First row: book update arrives, walk both books to the trade size, look up the account's fee tier. Second row: subtract the six deductions with the safety multiple applied to the estimated ones, then a threshold gate that either reports an opportunity or discards it. The surviving-spread step is highlighted.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="40" width="180" height="56" rx="8" class="viz-box"/>
<text x="98" y="64" text-anchor="middle" class="viz-label">Book update</text>
<text x="98" y="82" text-anchor="middle" class="viz-label-muted">both venues, timestamped</text>
<line x1="190" y1="68" x2="222" y2="68" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="226" y="40" width="180" height="56" rx="8" class="viz-box"/>
<text x="316" y="64" text-anchor="middle" class="viz-label">Walk both books</text>
<text x="316" y="82" text-anchor="middle" class="viz-label-muted">to the intended size</text>
<line x1="408" y1="68" x2="440" y2="68" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="444" y="40" width="188" height="56" rx="8" class="viz-box"/>
<text x="538" y="64" text-anchor="middle" class="viz-label">Fee lookup</text>
<text x="538" y="82" text-anchor="middle" class="viz-label-muted">the account's tier, both legs</text>
<line x1="538" y1="98" x2="538" y2="126" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="352" y="130" width="280" height="56" rx="8" class="viz-box-accent"/>
<text x="492" y="154" text-anchor="middle" class="viz-label">Surviving spread</text>
<text x="492" y="172" text-anchor="middle" class="viz-label-muted">gross minus six terms, estimates inflated</text>
<line x1="350" y1="158" x2="318" y2="158" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="134" y="130" width="180" height="56" rx="8" class="viz-box-ink"/>
<text x="224" y="154" text-anchor="middle" class="viz-on-ink">Threshold gate</text>
<text x="224" y="172" text-anchor="middle" class="viz-on-ink">positive after the multiple</text>
<line x1="132" y1="158" x2="100" y2="158" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="50" y="154" text-anchor="middle" class="viz-label">Report</text>
<text x="50" y="172" text-anchor="middle" class="viz-label-muted">or discard</text>
<text x="320" y="228" text-anchor="middle" class="viz-tick">runs on every update, for every venue pair; gross spread logged, never shown alone</text>
</svg>
<figcaption>Illustrative: the shape of the calculation, not a diagram of any particular codebase.</figcaption>
</figure>

## What changes when you compute it

The first thing that changes is the count. A detector that flags gross spreads fires constantly; one that flags surviving spreads fires rarely, and the difference is the point. Most of what looked like opportunity was the market's fee structure showing through. The venues with the highest published fees produce the widest gross spreads for exactly that reason: nobody is arbitraging them away, because after fees there is nothing to arbitrage.

The second thing that changes is what you watch. Once the detector is honest, the interesting question stops being which pairs show a spread and becomes which deductions dominate for each pair. Fee-dominated pairs are dead until your tier improves. Slippage-dominated pairs are alive only at small sizes, which caps the profit at a number you can compute in advance. Decay-dominated pairs are a latency problem, not a pricing problem, and no amount of book-walking fixes them. Each dominant term points at a different piece of engineering, or at a decision to leave the pair alone.

The third thing that changes is the conversation with anyone looking over your shoulder. A gross spread is a story about money you could have made. A surviving spread is a claim you can be held to, because every term in it is either read from a public schedule or written down as an assumption with a multiple on it. When the number is wrong, and it will be, you can see which term was wrong.

## The limit

The surviving spread is a per-trade number, and it says nothing about how many such trades exist or how often. A pair can survive the deductions once an hour and still not be worth the infrastructure that watches it. That is a different calculation, about capacity and frequency, and it sits on top of this one rather than inside it. What this one buys is more modest and more necessary: it stops the detector from lying, and it does so by refusing to display any spread that has not paid its way out.
