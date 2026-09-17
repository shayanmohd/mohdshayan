---
title: A liquidation is a race funded by the loser
date: 2026-09-18
summary: On Aave the liquidation bonus comes out of the borrower's collateral, so the race only runs when the bonus beats gas. Below that line positions rot into bad debt.
tags: Aave, DeFi, Liquidations
draft: false
---

A lending protocol does not liquidate anyone. It publishes a price for doing so, and waits for someone to accept it. On Aave the price is the liquidation bonus, a slice of the unhealthy borrower's collateral handed to whoever repays their debt, and the bonus is paid by the borrower, not by the protocol. That makes liquidation a race funded by the loser, and a race only gets run when the prize exceeds the cost of entering. The cost is gas. Below the line where the bonus no longer covers gas plus execution, no rational actor liquidates, the position sits unhealthy, and if the collateral keeps falling it becomes bad debt that the protocol's depositors eventually eat. The line has a value per asset, it moves with the base fee, and the total value of positions under it is a risk number that lending protocols should publish and mostly do not.

## The mechanism

Aave's [liquidation documentation](https://aave.com/docs/developers/liquidations) describes the current design plainly: a liquidator repays some of a borrower's debt and receives collateral worth more than the repayment, with the difference being the bonus, and in the fourth version of the protocol the bonus follows a Dutch auction in which lower health factors earn higher bonuses. The documentation's own advice to liquidators is the whole economics in a sentence: when choosing positions, ensure the liquidation bonus exceeds the gas cost. A share of the bonus, currently 10 percent for most Ethereum collateral and 20 percent for the major stablecoins after a [governance change](https://governance.aave.com/t/arfc-liquidation-protocol-fee-increase-for-wbtc-weth-and-wsteth-on-aave-v3-ethereum-core/25470), goes to the protocol as a fee, which lowers the liquidator's take and moves the line further up.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">A flash-loan-funded liquidation in one transaction, from borrow to repay</title>
<desc id="f1-d">A sequence of six steps in one transaction: borrow the debt asset with a flash loan; call the pool's liquidation function to repay the borrower's debt; receive the borrower's collateral plus the bonus; swap enough collateral back to the debt asset on an exchange; repay the flash loan with its premium; keep the remainder as profit. If the remainder is below the gas paid, the transaction is a loss and the rational liquidator does not send it.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Atomic, or not at all</text>
<rect x="8" y="50" width="196" height="56" rx="8" class="viz-box"/>
<text x="106" y="74" text-anchor="middle" class="viz-label">1. Flash-borrow the debt asset</text>
<text x="106" y="92" text-anchor="middle" class="viz-label-muted">no capital of your own</text>
<line x1="206" y1="78" x2="218" y2="78" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="222" y="50" width="196" height="56" rx="8" class="viz-box-accent"/>
<text x="320" y="74" text-anchor="middle" class="viz-label">2. Repay the borrower's debt</text>
<text x="320" y="92" text-anchor="middle" class="viz-label-muted">the pool's liquidation call</text>
<line x1="420" y1="78" x2="432" y2="78" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="436" y="50" width="196" height="56" rx="8" class="viz-box-accent"/>
<text x="534" y="74" text-anchor="middle" class="viz-label">3. Collateral plus bonus</text>
<text x="534" y="92" text-anchor="middle" class="viz-label-muted">paid from the borrower's side</text>
<path d="M534 108 V140 H106 V150" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="154" width="196" height="56" rx="8" class="viz-box"/>
<text x="106" y="178" text-anchor="middle" class="viz-label">4. Swap back to debt asset</text>
<text x="106" y="196" text-anchor="middle" class="viz-label-muted">slippage comes off the bonus</text>
<line x1="206" y1="182" x2="218" y2="182" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="222" y="154" width="196" height="56" rx="8" class="viz-box"/>
<text x="320" y="178" text-anchor="middle" class="viz-label">5. Repay the flash loan</text>
<text x="320" y="196" text-anchor="middle" class="viz-label-muted">plus its premium</text>
<line x1="420" y1="182" x2="432" y2="182" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="436" y="154" width="196" height="56" rx="8" class="viz-box-ink"/>
<text x="534" y="178" text-anchor="middle" class="viz-on-ink">6. Keep the remainder</text>
<text x="534" y="196" text-anchor="middle" class="viz-on-ink">minus the gas already paid</text>
<text x="320" y="254" text-anchor="middle" class="viz-label-muted">Every step succeeds or the whole transaction reverts; the gas is paid either way.</text>
<text x="320" y="284" text-anchor="middle" class="viz-tick">the liquidator sends it only when step 6 is expected to beat the gas: that is the line</text>
<text x="320" y="312" text-anchor="middle" class="viz-tick">the bonus in step 3 is the borrower's collateral, not the protocol's money</text>
</svg>
<figcaption>Illustrative: the canonical atomic liquidation on a pool that offers flash loans, drawn as a sequence; the shape is the same whichever asset is involved.</figcaption>
</figure>

The flash loan is what makes this a race anyone can enter. A liquidator needs no capital, only the gas to send the transaction and the code to run the six steps atomically, so the field of competitors is everyone with a bot, and the prize goes to whoever lands first in the block. That competition is good for the protocol on large positions, where the bonus is worth fighting for. It is what abandons small ones.

## The dust line

Call the dust line the position size at which the liquidation bonus, net of the protocol's fee share and of the slippage on the swap, equals the gas cost of the transaction. Above it, someone will liquidate. Below it, nobody rational will, because the transaction loses money. The line is a simple product: gas units times gas price, divided by the net bonus rate.

A liquidation of the kind drawn above uses on the order of 400,000 gas. At a base fee of half a gwei, which is where Ethereum mainnet has sat for much of 2026, that is 0.0002 ETH; at 5 gwei, 0.002; at 50 gwei, during a crash, 0.02. Divide by a 5 percent bonus and the line sits at 0.004, 0.04 and 0.4 ETH of collateral respectively. At a 1 percent bonus, which is the low end for the safest assets, the line at 50 gwei is 2 ETH.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The dust line against gas price for three liquidation bonuses, with 400,000 gas per liquidation</title>
<desc id="f2-d">Three rising lines on log axes: collateral value in ether at which the bonus equals gas, against gas price in gwei from 0.1 to 100. At a 1 percent bonus the line runs from 0.004 ether at 0.1 gwei to 4 ether at 100 gwei; at 5 percent, from 0.0008 to 0.8; at 10 percent, from 0.0004 to 0.4. Everything below a line is dust that a rational liquidator will not touch at that gas price.</desc>
<text x="0" y="18" class="viz-title">Where the race stops being worth running</text>
<text x="0" y="36" class="viz-sub">Collateral value at which the bonus equals gas, 400,000 gas per liquidation; both axes log</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s4"/><text x="400" y="35" class="viz-label-muted">1% bonus</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s1"/><text x="490" y="35" class="viz-label-muted">5%</text>
<line x1="530" y1="31" x2="544" y2="31" class="viz-s2"/><text x="550" y="35" class="viz-label-muted">10%</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">10 ETH</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">1</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">0.1</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">0.01</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0.001</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0.1 gwei</text>
<text x="237" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="418" y="288" text-anchor="middle" class="viz-tick">10</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">100 gwei</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Gas price</text>
<polyline points="56,232.7 237,180.7 418,128.7 600,76.7" class="viz-s4"/>
<polyline points="56,269 237,217 418,165 600,113" class="viz-s1"/>
<polyline points="56,284.7 237,232.7 418,180.7 600,128.7" class="viz-s2"/>
<circle cx="418" cy="165" r="5" class="viz-d1"/>
<text x="410" y="150" text-anchor="end" class="viz-value">5% at 10 gwei: 0.08 ETH</text>
<text x="328" y="332" text-anchor="middle" class="viz-label-muted">Below the line a position is dust: unhealthy, unliquidated, drifting toward bad debt.</text>
</svg>
<figcaption>Illustrative: computed from the formula in the text with 400,000 gas per liquidation and no slippage; real bonuses vary by asset and, in the fourth version of the protocol, by health factor.</figcaption>
</figure>

The chart's most important feature is that the lines move with gas, and gas rises exactly when liquidations are needed. A crash pushes prices down, which pushes positions under their thresholds, which brings out the bots, which fills blocks, which raises the base fee, which raises every dust line by an order of magnitude in the space of a few minutes. Positions that were comfortably above the line at half a gwei are below it at 50, and they stay unliquidated through the crash, which is precisely when their collateral is losing value fastest.

Slippage moves the line further than the formula shows. Step four of the sequence sells the seized collateral for the debt asset, and on a thin market or during a crash that sale pays a spread that comes straight out of the bonus. A 5 percent bonus with 2 percent slippage is a 3 percent bonus, and the dust line for it is two thirds higher than the chart draws. The bots that run this race price slippage from the live order book before sending, which is another way of saying that the line is not one number but a function of the moment, and that the moment it matters most is the moment it is highest.

## The protocol has noticed

The design has been catching up with the arithmetic. Aave's third version introduced a rule that lets a liquidator close small positions entirely rather than the usual fraction, so that the bonus on a small position is at least the whole bonus and not half of it, and the [current documentation](https://aave.com/docs/developers/liquidations) states the leftover rule in its present form: if the debt remaining after a liquidation would fall below 1,000 dollars, the entire debt in that reserve must be liquidated. That number is the protocol admitting where the line sits. A position left with 900 dollars of debt is a position nobody will come back for, so the rule forbids leaving it. The Dutch auction on the bonus is the same admission from the other side: as a position gets unhealthier, the protocol raises the prize, which lowers the dust line for that position and widens the field of liquidators who will run for it.

Neither mechanism removes the line; they move it. A position that was below the line before the auction started may be above it once the health factor has fallen far enough for the bonus to rise, but by then the collateral has fallen too, and the race is being run for a smaller pot. What the mechanisms cannot do is make gas free, and gas is the only term in the formula the protocol does not set.

## Publish the total under the line

So the number I would want from a lending protocol, alongside total value locked and the health factor distribution, is the total collateral value in positions below their dust line at the current base fee, and the same total at a stressed base fee of, say, 50 gwei. It is computable from public state: every position's collateral, its asset's bonus, the current gas price and a gas estimate per liquidation. The first number says how much of the book is already abandoned. The second says how much becomes abandoned the moment a crash raises gas, which is the moment the abandonment matters. Together they are the protocol's real bad-debt exposure, as opposed to the bad debt it has already recognised, and a protocol whose stressed total is a meaningful fraction of its reserve fund has a risk it has not priced.

<figure class="chart">
<svg viewBox="0 0 640 272" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">How the value under the dust line would be reported, at current and stressed gas</title>
<desc id="f3-d">A table with three rows: total collateral in positions below the dust line at the current base fee; the same at a stressed base fee of 50 gwei; and the protocol's reserve fund for comparison. Values are shown as placeholders because the point is the shape of the report, not a measurement.</desc>
<text x="0" y="18" class="viz-title">The two numbers a risk page should carry</text>
<text x="20" y="48" class="viz-tick">MEASURE</text>
<text x="330" y="48" class="viz-tick">HOW IT IS COMPUTED</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">Value under the line, now</text>
<text x="330" y="84" class="viz-label-muted">sum of collateral where bonus is under gas</text>
<text x="330" y="102" class="viz-label-muted">at the current base fee</text>
<line x1="0" y1="114" x2="640" y2="114" class="viz-grid"/>
<text x="20" y="142" class="viz-label">Value under the line, stressed</text>
<text x="330" y="142" class="viz-label-muted">the same sum at 50 gwei</text>
<text x="330" y="160" class="viz-label-muted">the gas a crash brings</text>
<line x1="0" y1="172" x2="640" y2="172" class="viz-grid"/>
<text x="20" y="200" class="viz-label">Reserve fund</text>
<text x="330" y="200" class="viz-label-muted">what absorbs bad debt</text>
<text x="330" y="218" class="viz-label-muted">if the stressed number lands</text>
<line x1="0" y1="230" x2="640" y2="230" class="viz-grid"/>
<text x="0" y="256" class="viz-label-muted">The second row divided by the third is the exposure the bonus schedule has not priced.</text>
</svg>
<figcaption>Illustrative: the report as I would want it laid out; the inputs are all public on-chain state and the computation is the dust-line formula per position.</figcaption>
</figure>

## Why a searcher cares

I write this from the liquidator's side of the race, or rather from the side of someone whose flash-loan code runs on the same pool and understands what the six steps cost. A bot that liquidates rationally is, by construction, a bot that ignores everything under the line, and the line is where the protocol's risk quietly accumulates. There is no villain in that. The borrower funded a prize, the prize was too small to claim, and the protocol's depositors will find out on the day gas spikes and the small positions go under together. Publishing the total under the line is how the depositors find out beforehand, and it is a number any team with a node and an afternoon can compute.
