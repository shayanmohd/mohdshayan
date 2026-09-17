---
title: Base fee takes six blocks to double
date: 2026-09-18
summary: EIP-1559 caps the base fee change at 12.5 percent a block, so it needs about six blocks to double and twenty to rise tenfold. In that lag the tip is the whole auction.
tags: Gas, Ethereum, Fee Markets
draft: false
---

Ethereum's fee market has a thermostat, and the thermostat has a speed limit. Since EIP-1559 the protocol sets a base fee for every block, raises it when the previous block was fuller than its target and lowers it when emptier, and the rule caps the change at one eighth per block in either direction. That cap has a consequence that is easy to state and easy to forget: after a step change in demand, the base fee takes about six blocks, seventy-two seconds, to double, and about twenty blocks, four minutes, to rise tenfold. During that lag the base fee is not the price. The priority fee is the whole auction, which is why bots overpay in the first minute of a spike and why any fee estimator that reads the base fee is wrong at exactly the moments it matters.

## The rule and the arithmetic

The mechanism is in [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) and it is short. Each block has a gas limit and a target of half that limit, set by an elasticity multiplier of two. If the parent block used more gas than the target, the base fee rises in proportion to the excess, up to a maximum of one eighth when the block was full; if it used less, the base fee falls in proportion, down to one eighth when the block was empty. The denominator of eight is the whole story of the lag. A sustained run of full blocks raises the base fee by a factor of 1.125 per block, and the number of blocks needed to reach a multiple m is the logarithm of m in base 1.125: 5.9 blocks to double, 19.5 blocks for ten times, 39 blocks for a hundred. I call that the doubling distance, and the six and the twenty are the numbers to carry around.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Base fee response to a step in demand under the one-eighth cap, with the doubling and tenfold distances marked</title>
<desc id="f1-d">A line rising from a base fee of 1 at block zero: with every block full, the base fee multiplies by 1.125 each block, reaching 2 at about block six and 10 at about block twenty, on a logarithmic axis where the line is straight. Vertical markers at six and twenty blocks show the doubling and tenfold distances, and a note says the lag is 72 seconds and about four minutes at twelve-second blocks.</desc>
<text x="0" y="18" class="viz-title">Six blocks to double, twenty to rise tenfold</text>
<text x="0" y="36" class="viz-sub">Base fee as a multiple of its starting value under sustained full blocks, log scale</text>
<line x1="440" y1="31" x2="454" y2="31" class="viz-s1"/><text x="460" y="35" class="viz-label-muted">base fee</text>
<circle cx="540" cy="31" r="5" class="viz-d4"/><text x="550" y="35" class="viz-label-muted">distance</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">20x</text>
<line x1="56" y1="108.1" x2="600" y2="108.1" class="viz-grid"/><text x="48" y="112.1" text-anchor="end" class="viz-tick">10x</text>
<line x1="56" y1="160.2" x2="600" y2="160.2" class="viz-grid"/><text x="48" y="164.2" text-anchor="end" class="viz-tick">5x</text>
<line x1="56" y1="229" x2="600" y2="229" class="viz-grid"/><text x="48" y="233" text-anchor="end" class="viz-tick">2x</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1x</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">6</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">12</text>
<text x="509" y="288" text-anchor="middle" class="viz-tick">20</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">24</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Blocks since the step, twelve seconds each</text>
<polyline points="56,264 600,55.7" class="viz-s1"/>
<line x1="192" y1="229" x2="192" y2="264" class="viz-s4"/>
<circle cx="192" cy="229" r="5" class="viz-d4"/>
<text x="200" y="224" class="viz-value">doubles at 5.9 blocks, 72 s</text>
<line x1="509" y1="108.1" x2="509" y2="264" class="viz-s4"/>
<circle cx="509" cy="108.1" r="5" class="viz-d4"/>
<text x="500" y="102" text-anchor="end" class="viz-value">tenfold at 19.5 blocks, 234 s</text>
</svg>
<figcaption>Illustrative: the response computed from the rule in <a href="https://eips.ethereum.org/EIPS/eip-1559">EIP-1559</a>, a factor of 1.125 per full block; the marks are the logarithms of 2 and 10 in that base.</figcaption>
</figure>

## What a real spike looks like

The rule is easy to see in live data, because the base fee history is a standard call on any node. I pulled a day of blocks from a public RPC endpoint through [eth_feeHistory](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_feehistory), 7,168 blocks ending at block 26,000,047 on 18 September 2026, with a gas limit of 60 million, and looked for the sharpest rise within any twenty-block window. It came at block 25,996,624: a run of full blocks, gas used at or near the limit, took the base fee from 0.15 gwei to 0.55 in fourteen blocks, a factor of 3.6, and the blocks that fell below target in the middle of the run show as the small dips where the fee paused. Absolute fees on mainnet are tiny in 2026; the shape is what matters, and the shape is the one the arithmetic predicts.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Base fee per block across the sharpest rise in a day of mainnet blocks, 18 September 2026</title>
<desc id="f2-d">A line over 45 consecutive blocks from 25,996,619 to 25,996,663. The base fee sits near 0.15 gwei for the first six blocks, then climbs steeply to 0.55 gwei by block 25,996,638 during a run of full blocks, dips briefly as a few blocks come in under target, and continues to about 0.9 gwei by the end of the window. Small marks below the line show blocks that were full.</desc>
<text x="0" y="18" class="viz-title">A run of full blocks, and the fee climbing at the speed limit</text>
<text x="0" y="36" class="viz-sub">Base fee in gwei per block, blocks 25,996,619 to 25,996,663, Ethereum mainnet</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s1"/><text x="490" y="35" class="viz-label-muted">base fee</text>
<circle cx="570" cy="31" r="5" class="viz-d4"/><text x="580" y="35" class="viz-label-muted">marked</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1.0</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">0.75</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">0.5</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">0.25</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">619</text>
<text x="180" y="288" text-anchor="middle" class="viz-tick">629</text>
<text x="303" y="288" text-anchor="middle" class="viz-tick">639</text>
<text x="427" y="288" text-anchor="middle" class="viz-tick">649</text>
<text x="551" y="288" text-anchor="middle" class="viz-tick">659</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Block number, last three digits of 25,996,6xx</text>
<polyline points="56,232.8 68.4,230.7 80.7,232.8 93.1,230.7 105.5,228.6 117.8,232.8 130.2,228.6 142.5,224.5 154.9,218.2 167.3,214.1 179.6,214.1 192,207.8 204.4,201.6 216.7,193.3 229.1,187 241.5,178.7 253.8,168.3 266.2,157.9 278.5,153.8 290.9,149.6 303.3,151.7 315.6,155.8 328,162.1 340.4,149.6 352.7,135 365.1,118.4 377.5,118.4 389.8,118.4 402.2,120.5 414.5,124.6 426.9,122.6 439.3,105.9 451.6,108 464,114.2 476.4,95.5 488.7,81 501.1,87.2 513.5,93.4 525.8,93.4 538.2,83.1 550.5,83.1 562.9,87.2 575.3,87.2 587.6,72.7 600,89.3" class="viz-s1"/>
<circle cx="117.8" cy="232.8" r="4" class="viz-d4"/><text x="124" y="248" class="viz-value">0.15 gwei</text>
<circle cx="290.9" cy="149.6" r="4" class="viz-d4"/><text x="298" y="146" class="viz-value">0.55, fourteen blocks later</text>
<text x="0" y="330" class="viz-tick">pauses in the climb are blocks under target; every full block is a step of one eighth</text>
</svg>
<figcaption>Source: pulled by the author from a public Ethereum mainnet RPC via <a href="https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_feehistory">eth_feeHistory</a> on 18 September 2026; the window is the twenty-block span with the largest multiplicative rise in the preceding day.</figcaption>
</figure>

## The lag is where the tip lives

Now put a bot in that window. A trading opportunity appears at block 25,996,624, demand steps up, and the base fee is 0.15 gwei, which was the right price a block ago and is wrong now. For the next six blocks the base fee is below where it will settle, because the cap will not let it get there faster, and the protocol has nothing else to say about who gets included. The tip does. Every transaction that wants a place in those blocks bids a priority fee, the builder orders by it, and the tip market is briefly the entire fee market, running on top of a base fee that is still catching up. That is why bots overpay in the first minute of a spike: the base fee tells them the block is cheap, the block is not cheap, and the only signal that says so is what other people are tipping.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">An EIP-1559 block: limit, target, base fee burned and tip paid</title>
<desc id="f3-d">A block drawn as a bar with a gas limit of 60 million and a target of 30 million marked at the midpoint. Gas used above the target raises the next base fee by up to one eighth; below lowers it. Beside it, a transaction's fee is split into the base fee, which is burned, and the priority fee, which goes to the builder, with the note that during the lag the priority fee is the whole auction.</desc>
<text x="0" y="18" class="viz-title">What the block knows and what it does not</text>
<rect x="8" y="60" width="380" height="40" rx="6" class="viz-box"/>
<rect x="8" y="60" width="190" height="40" rx="6" class="viz-box-accent"/>
<line x1="198" y1="52" x2="198" y2="108" class="viz-s4"/>
<text x="103" y="85" text-anchor="middle" class="viz-label">target: 30M gas</text>
<text x="293" y="85" text-anchor="middle" class="viz-label-muted">up to the limit: 60M</text>
<text x="8" y="130" class="viz-tick">above target: next base fee up, at most one eighth</text>
<text x="8" y="148" class="viz-tick">below target: next base fee down, at most one eighth</text>
<rect x="420" y="60" width="212" height="40" rx="6" class="viz-box"/>
<rect x="420" y="60" width="140" height="40" rx="6" class="viz-box-ink"/>
<text x="490" y="85" text-anchor="middle" class="viz-on-ink">base fee: burned</text>
<text x="596" y="85" text-anchor="middle" class="viz-label">tip</text>
<text x="420" y="130" class="viz-tick">base fee: from the last block</text>
<text x="420" y="148" class="viz-tick">tip: everyone else, right now</text>
<text x="320" y="200" text-anchor="middle" class="viz-label-muted">In the lag the base fee is stale by construction; the tip carries the auction.</text>
<text x="320" y="232" text-anchor="middle" class="viz-tick">an estimator reading the base fee reads the previous block's demand, not this one's</text>
<text x="320" y="270" text-anchor="middle" class="viz-label-muted">The limit was 60 million gas at the time of writing; the target is always half of it.</text>
</svg>
<figcaption>Illustrative: the block and fee split as EIP-1559 defines them; the gas limit is the mainnet value read from the chain on 18 September 2026.</figcaption>
</figure>

The rule for a bot follows from the doubling distance. When you detect a spike, the base fee will be wrong for about six blocks and materially wrong for more, and during that window the decision is a bid on tips, not a wait for the base fee to price the block. After the doubling distance the base fee has caught up to a doubling of demand and the tip market cools toward normal; after the tenfold distance it has caught up to nearly anything. So the window in which paying a high tip is rational is bounded by the arithmetic: bid on tips for roughly six blocks, watch the base fee's trajectory to see whether the step was a doubling or a tenfold, and stop bidding when the base fee's climb flattens, because a flattening climb means the blocks stopped being full, which means the demand step is over.

## What the arithmetic says about atomic transactions

The reason I care about six blocks is that the transactions I send are atomic: a flash-loan arbitrage either executes in full within one block or reverts and pays gas for nothing. For a transaction like that, the fee decision is not "what is the fair price" but "what gets me into the next block, and is the opportunity still there when I land". During a spike the second question dominates. The opportunity that appeared at block one is being competed for by everyone who saw it, the base fee says nothing about that competition for six blocks, and the tip is the only lever that moves inclusion order. Paying a high tip for those six blocks is not overpaying if it wins the block; it is overpaying if the opportunity was gone before the block was built, which is a question about the opportunity's lifetime rather than the fee.

That splits the bot's fee logic into two regimes with a boundary the arithmetic supplies. Inside the doubling distance from a detected step, the base fee is treated as a floor rather than a price, the tip is bid from the observed tips in the last block or two rather than from any estimator, and the bid is capped by the opportunity's expected value net of the reverted-gas cost. Outside it, when the base fee's climb has flattened, the estimator is trusted again and the tip drops back to a small margin. The boundary is not a tuning parameter. It is six blocks, because the denominator is eight.

## Why estimators fail here

Fee estimators fail during spikes for a reason the arithmetic makes precise. Most of them look at recent blocks and report a base fee plus a tip percentile, which is the right thing to do in steady state and exactly the wrong thing in the first six blocks of a step, when the base fee is lagging and the tip percentiles from the last few blocks describe a market that no longer exists. An estimator that understood the cap would do something different: notice that the last block was full, project the base fee forward by 1.125 per block for as long as it expects full blocks, and report a tip that reflects the gap between the projected and current base fee rather than the historical tip. That projection is a one-line calculation, and the doubling distance is its horizon.

There is a mirror image on the way down. When a spike ends, the base fee falls by at most one eighth per block too, so it stays high for six blocks after the demand is gone, and a bot that keeps paying the spike's tip on top of a still-elevated base fee is overpaying in the other direction. The thermostat is symmetric, and so is the rule: the base fee tells you where demand was a block ago, the cap tells you how far it can move by the next block, and everything in between is the tip.
