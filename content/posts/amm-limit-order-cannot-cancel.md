---
title: An AMM is a limit order you cannot cancel
date: 2026-09-17
summary: A constant-product pool is a continuum of resting limit orders, and the liquidity provider's defining disadvantage is that none of them can be pulled when the price moves.
tags: AMM, DeFi, Market Making
draft: false
---

A market maker on an order book does one thing constantly: cancels. Quotes are posted, the price moves elsewhere, the quotes are pulled before anyone can hit them, and new ones are posted at the new price. The cancel is the whole job. An automated market maker cannot do it. A constant-product pool posts, in effect, a resting limit order at every price, and when the price moves on another venue, every one of those orders is still there, waiting for the first person who notices. That inability is the entire economics of being a liquidity provider, and the losses people argue about, impermanent loss, loss-versus-rebalancing, all follow from it.

## A curve is a ladder of orders

Take the constant-product rule, x times y equals k, that Uniswap's [second version](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/how-uniswap-works) and countless pools since have used. The pool holds x of one asset and y of the other, and it will trade along the curve so that the product stays constant. A trader who buys a small amount of y pays a price near y over x; a trader who buys a lot walks up the curve and pays more. Read that from the other side and it is a ladder: the pool is offering to sell y at every price above the current one and to buy y at every price below it, in amounts fixed by the curve. It is an order book with an order at every tick, placed by nobody, cancelled by nobody.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The constant-product curve read as a ladder of resting orders</title>
<desc id="f1-d">A convex curve x times y equals k drawn across the plot, with the current reserves marked as a dot. Along the curve above the dot, small step marks are labelled as sell orders at rising prices; below the dot, as buy orders at falling prices. A note says none of the steps can be removed when the price moves elsewhere.</desc>
<text x="0" y="18" class="viz-title">Every point on the curve is an order</text>
<text x="0" y="36" class="viz-sub">x times y equals k, read as resting bids and asks around the current reserves</text>
<line x1="56" y1="56" x2="56" y2="290" class="viz-axis"/>
<line x1="56" y1="290" x2="600" y2="290" class="viz-axis"/>
<text x="600" y="312" text-anchor="end" class="viz-label-muted">reserve of x</text>
<text x="20" y="180" transform="rotate(-90 20 180)" text-anchor="middle" class="viz-label-muted">reserve of y</text>
<polyline points="90,70 110,120 135,160 165,193 200,218 240,238 290,253 350,264 420,272 500,278 590,282" class="viz-s1"/>
<circle cx="240" cy="238" r="6" class="viz-d1"/>
<text x="254" y="232" class="viz-label">current reserves</text>
<circle cx="200" cy="218" r="4" class="viz-d2"/><circle cx="165" cy="193" r="4" class="viz-d2"/><circle cx="135" cy="160" r="4" class="viz-d2"/><circle cx="110" cy="120" r="4" class="viz-d2"/>
<text x="150" y="110" class="viz-label-muted">sells of y, at rising prices</text>
<circle cx="290" cy="253" r="4" class="viz-d3"/><circle cx="350" cy="264" r="4" class="viz-d3"/><circle cx="420" cy="272" r="4" class="viz-d3"/><circle cx="500" cy="278" r="4" class="viz-d3"/>
<text x="360" y="250" class="viz-label-muted">buys of y, at falling prices</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">curve</text>
<circle cx="470" cy="31" r="4" class="viz-d2"/><text x="480" y="35" class="viz-label-muted">ask</text>
<circle cx="530" cy="31" r="4" class="viz-d3"/><text x="540" y="35" class="viz-label-muted">bid</text>
<text x="328" y="332" text-anchor="middle" class="viz-tick">none of the marked orders can be pulled when the price moves on another venue</text>
</svg>
<figcaption>Illustrative: the geometry of a constant-product pool drawn to show the reading, not a plot of any pool's reserves.</figcaption>
</figure>

On a central limit order book, the maker whose quotes are stale loses money to whoever trades against them first, which is why makers cancel the instant they see the price move. The pool cannot see anything. It has no feed, no clock and no opinion; it only knows its own reserves. When the price on a large exchange moves, the pool's ladder is wrong, and it stays wrong until an arbitrageur trades it back to the right price, taking the difference as profit. That profit is paid by the liquidity providers, and it is paid every time the price moves, in either direction.

## The uncancellable quote test

Here is the test I apply to any market-making design, on chain or off. Ask what happens the instant the quoter learns that the price has moved. If the answer is "nothing, until someone trades against it", the design pays a cost for being unable to cancel, and everything else about its economics is a way of pricing that cost. If the answer is "the quotes move", the design is a market maker in the ordinary sense and the question is only whether it can move them fast enough.

A constant-product pool fails the test by construction. A concentrated-liquidity pool fails it too; the ladder is narrower and the orders are larger within the range, but they are just as uncancellable. In fact concentration makes the failure sharper rather than softer: the liquidity provider has chosen to post bigger orders closer to the current price, which is exactly where a stale quote is most expensive, and the reward for that choice is a larger share of the fees in exchange for a larger share of the arbitrageurs' profit. Concentration is a lever on the size of the bet, not on its direction.

The test is also useful for reading the newer designs, because most of them are attempts to pass it partially. Pools that quote from an external price feed are trying to cancel by proxy, with the oracle doing the cancelling; they pass to the extent the oracle updates before the arbitrageurs arrive and fail in every block where it does not. Pools that auction the right to trade first are not cancelling at all; they are selling the stale orders to the highest bidder and returning the proceeds to the LP, which is a way of getting some of the rent back rather than avoiding it. An order-book maker with a fast feed passes it. A pool whose quotes are set by an oracle rather than by its own reserves passes it partly, to the extent the oracle is faster than the arbitrageurs, which is the design question that most of the newer AMMs are really about.

## Loss-versus-rebalancing is the price of the missing cancel

Milionis, Moallemi, Roughgarden and Zhang gave the cost a name and a formula in [Automated Market Making and Loss-Versus-Rebalancing](https://arxiv.org/abs/2208.06046). Loss-versus-rebalancing compares the liquidity provider's position against a benchmark that holds the same assets but rebalances at the true market price instead of being picked off at stale ones. The difference is exactly the arbitrageurs' profit, and for a constant-product pool it has a closed form: the LVR accrues at a rate proportional to the square of the asset's volatility, sigma squared over eight, as a fraction of the pool's value, per unit time. Higher volatility means the price moves more, the ladder is wrong more often and by more, and the cost of not cancelling rises with the square.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Annual loss-versus-rebalancing for a constant-product pool against volatility</title>
<desc id="f2-d">A curve rising with the square of annualised volatility: about 1.1 percent of pool value per year at 30 percent volatility, 3.1 at 50, 6.1 at 70, 10.1 at 90 and 15.1 at 110 percent. Fees have to exceed this to make providing liquidity worthwhile.</desc>
<text x="0" y="18" class="viz-title">The rent for being unable to cancel</text>
<text x="0" y="36" class="viz-sub">LVR as a share of pool value per year, sigma squared over eight</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">16%</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">12%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">8%</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">4%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">30%</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">50%</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">70%</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">90%</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">110%</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Annualised volatility of the asset</text>
<polyline points="56,249.4 192,223.4 328,184.5 464,132.7 600,67.9" class="viz-s1"/>
<circle cx="56" cy="249.4" r="4" class="viz-d1"/>
<circle cx="192" cy="223.4" r="4" class="viz-d1"/>
<circle cx="328" cy="184.5" r="4" class="viz-d1"/>
<circle cx="464" cy="132.7" r="4" class="viz-d1"/>
<circle cx="600" cy="67.9" r="4" class="viz-d1"/>
<text x="70" y="244" class="viz-value">1.1%</text>
<text x="592" y="62" text-anchor="end" class="viz-value">15.1%</text>
</svg>
<figcaption>Illustrative: computed from the constant-product result in <a href="https://arxiv.org/abs/2208.06046">Milionis et al. (2022)</a>, LVR rate equal to sigma squared over eight; the volatility values on the axis are inputs, not a claim about any asset.</figcaption>
</figure>

Read the chart as a rent. At 70 percent annualised volatility, which is not unusual for a large crypto asset, the pool loses about six percent of its value a year to the people who correct its prices, before a single fee is counted. Fees are what the pool charges in return for the service of always being there, and the position is profitable only when fee income exceeds the rent. That is the whole calculation, and it is why fee tiers exist: a volatile pair needs a higher fee to cover a higher LVR, and a stable pair can charge almost nothing because its ladder is almost never wrong.

## Where impermanent loss fits

Impermanent loss is the older and more confusing name for a related quantity, and the ladder view sorts out the confusion. Impermanent loss compares the LP's position with simply holding the two assets; it depends on where the price ends up and is zero if the price returns to where it started. LVR compares the LP with a rebalancing benchmark and depends on the path, on how much the price moved along the way, not on where it ended. Both are the cost of the missing cancel, measured against different benchmarks. LVR is the better measure of what the LP actually pays, because arbitrageurs are paid on every move and do not give the money back when the price comes home.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">An order-book maker and a pool, at the moment the price moves</title>
<desc id="f3-d">Two panels side by side. Left, the order-book maker: on a price move it cancels its stale quotes and reposts at the new price, losing nothing. Right, the pool: on the same move its ladder stays where it was, an arbitrageur trades against the stale orders, and the pool ends up at the new price having paid the difference.</desc>
<rect x="8" y="30" width="300" height="160" rx="8" class="viz-box"/>
<text x="158" y="58" text-anchor="middle" class="viz-label">Order-book maker</text>
<text x="158" y="86" text-anchor="middle" class="viz-label-muted">price moves elsewhere</text>
<text x="158" y="110" text-anchor="middle" class="viz-label-muted">cancel stale quotes</text>
<text x="158" y="134" text-anchor="middle" class="viz-label-muted">repost at the new price</text>
<text x="158" y="166" text-anchor="middle" class="viz-value">cost: nothing, if fast enough</text>
<rect x="332" y="30" width="300" height="160" rx="8" class="viz-box-accent"/>
<text x="482" y="58" text-anchor="middle" class="viz-label">Constant-product pool</text>
<text x="482" y="86" text-anchor="middle" class="viz-label-muted">price moves elsewhere</text>
<text x="482" y="110" text-anchor="middle" class="viz-label-muted">ladder stays where it was</text>
<text x="482" y="134" text-anchor="middle" class="viz-label-muted">arbitrageur trades it to the new price</text>
<text x="482" y="166" text-anchor="middle" class="viz-value">cost: the difference, every time</text>
<text x="320" y="216" text-anchor="middle" class="viz-tick">the same price move, two responses; only one of them is a choice</text>
</svg>
<figcaption>Illustrative: the two behaviours the uncancellable quote test distinguishes.</figcaption>
</figure>

## What it means for the other side

I spend more of my time on the other side of this trade than on it. Shayanomaly watches five venues for the moments when a pool's ladder and an exchange's book disagree, and the disagreement is exactly the LVR the pool is about to pay. From that side, the ladder view is also the clearest explanation of what the arbitrage is: not a free lunch, but a service the pool has agreed in advance to pay for, at a rate set by volatility, to whoever gets there first. The competition to get there first is what keeps the pool's price honest and keeps the LP's rent from being any higher than it has to be.

For anyone providing liquidity, the test reduces to one question that is easier to answer than the literature makes it look. What does this design do the instant it learns the price has moved? If the answer is nothing, then the fee tier is the only thing standing between you and the square of the volatility, and it needs to be large enough to cover it.
