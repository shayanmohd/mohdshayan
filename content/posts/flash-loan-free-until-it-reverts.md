---
title: The flash loan is free until it reverts
date: 2025-05-14
summary: Aave's premium is the smallest cost a flash-loan arbitrageur pays. The real cost is gas burned on attempts that revert, and that cost depends on how the transaction was sent.
tags: Flash Loans, Aave, MEV
draft: false
---

The number everyone quotes about flash loans is 0.05%. That is the premium Aave charges on the amount borrowed, and it is the one line on the invoice that is easy to read. When I built the execution engine for Shayanomaly, which borrows from Aave V3 and settles a cross-venue trade in one atomic transaction, the premium turned out to be the least interesting cost in the system. The cost that decides whether a strategy lives is the gas spent on attempts that fail, and that cost is not a property of the strategy. It is a property of how the transaction reaches the chain.

## Where the premium sits

Aave's [flash loan documentation](https://aave.com/docs/aave-v3/guides/flash-loans) describes the mechanism: the pool transfers the requested amount to your contract, calls your contract's `executeOperation`, and expects the amount plus the premium to be repaid before the call returns. If it is not, the entire transaction reverts and the pool never lent anything. The premium is initialised at 0.05% and can be changed by governance; the current value is read from `FLASHLOAN_PREMIUM_TOTAL` on the [Pool contract](https://aave.com/docs/aave-v3/smart-contracts/pool), and at initialisation none of it goes to the protocol treasury, so it is paid to the liquidity providers whose capital you used for one block.

Borrow a million dollars of a stablecoin and the premium is five hundred dollars. That sounds like a lot until you notice that you only pay it on success, and that the capital it buys you for one block would cost far more to hold in a wallet for a year. A reverted flash loan pays no premium, because the loan was undone. So the premium is a tax on wins, and a tax on wins never kills a strategy. It just shrinks the wins.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">One atomic flash-loan arbitrage, and where it can revert</title>
<desc id="f1-d">Three lanes: your contract, the Aave pool, and two exchanges. The pool lends, calls executeOperation, your contract swaps on exchange A then exchange B, then repays the amount plus premium. A marked point after the second swap shows where a profitability check reverts the whole transaction.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Your contract</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Aave V3 pool</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Exchanges A and B</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">flashLoan(amount)</text>
<line x1="100" y1="80" x2="312" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="207" y="114" text-anchor="middle" class="viz-label-muted">transfer, then executeOperation()</text>
<line x1="315" y1="120" x2="103" y2="120" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="154" text-anchor="middle" class="viz-label-muted">swap on A, swap on B</text>
<line x1="100" y1="160" x2="537" y2="160" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="194" text-anchor="middle" class="viz-label-muted">tokens back</text>
<line x1="540" y1="200" x2="103" y2="200" class="viz-arrow" marker-end="url(#f1-ah)"/>
<circle cx="95" cy="228" r="6" class="viz-d4"/>
<text x="110" y="232" class="viz-label">require(profit &gt; 0) or revert everything</text>
<text x="207" y="264" text-anchor="middle" class="viz-label-muted">repay amount + 0.05%</text>
<line x1="100" y1="270" x2="312" y2="270" class="viz-arrow" marker-end="url(#f1-ah)"/>
</svg>
<figcaption>Illustrative: the call shape described in the <a href="https://aave.com/docs/aave-v3/guides/flash-loans">Aave V3 flash loan guide</a>, not a trace of any live transaction.</figcaption>
</figure>

## The cost that is not on the invoice

Now look at the attempts that lose. Cross-venue arbitrage is a race: the spread you saw is visible to everyone with the same feeds, and by the time your transaction executes, someone else's may have taken it. Your contract swaps, checks the result, finds no profit, and reverts. The loan is undone, the swaps are undone, the premium is never paid. Nothing happened on chain, except that you paid for the computation.

That is the whole problem. On Ethereum a reverted transaction still pays gas for every operation it executed up to the revert, because the network did the work of finding out that it should fail. A flash loan plus two swaps plus the checks is a heavy transaction; call it 500,000 gas as a round figure. At a gas price of 20 gwei that is 0.01 ETH per failed attempt, at 5 gwei it is 0.0025 ETH, and at 80 gwei it is 0.04 ETH. Those are exact multiplications, not estimates, and they are paid on every loss.

Put the two costs side by side. The premium is paid on wins and scales with the loan. Revert gas is paid on losses and scales with how often you are wrong and how expensive the block is. A strategy that wins one attempt in ten pays nine reverts for each premium, and at ordinary gas prices the nine reverts cost more than the premium long before the loan is large.

## The revert budget

The number I keep in front of me is what I call the revert budget: the expected profit from one successful fill divided by the gas cost of one failed attempt at the current gas price. It is the number of losses a strategy can afford per win. A budget of 8 means the strategy survives a 12% hit rate; a budget below 1 means that even winning every second attempt loses money.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Revert budget against gas price for one strategy</title>
<desc id="f2-d">Five columns showing how many failed attempts a strategy can afford per win, assuming 0.02 ETH expected profit per win and 500,000 gas per attempt: 8 at 5 gwei, 4 at 10 gwei, 2 at 20 gwei, 1 at 40 gwei and 0.5 at 80 gwei.</desc>
<text x="0" y="18" class="viz-title">Failed attempts a strategy can afford per win</text>
<text x="0" y="36" class="viz-sub">0.02 ETH expected profit per win, 500,000 gas per attempt</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M89.3 84.4 V80.8 a4 4 0 0 1 4 -4 H109.3 a4 4 0 0 1 4 4 V250 H89.3 Z" class="viz-f1"/>
<text x="101.3" y="70" text-anchor="middle" class="viz-value">8</text>
<text x="101.3" y="272" text-anchor="middle" class="viz-label-muted">5 gwei</text>
<path d="M180 167.2 V163.6 a4 4 0 0 1 4 -4 H200 a4 4 0 0 1 4 4 V250 H180 Z" class="viz-f1"/>
<text x="192" y="152.8" text-anchor="middle" class="viz-value">4</text>
<text x="192" y="272" text-anchor="middle" class="viz-label-muted">10 gwei</text>
<path d="M270.7 208.6 V205 a4 4 0 0 1 4 -4 H290.7 a4 4 0 0 1 4 4 V250 H270.7 Z" class="viz-f1"/>
<text x="282.7" y="194.2" text-anchor="middle" class="viz-value">2</text>
<text x="282.7" y="272" text-anchor="middle" class="viz-label-muted">20 gwei</text>
<path d="M361.3 229.3 V225.7 a4 4 0 0 1 4 -4 H381.3 a4 4 0 0 1 4 4 V250 H361.3 Z" class="viz-f1"/>
<text x="373.3" y="214.9" text-anchor="middle" class="viz-value">1</text>
<text x="373.3" y="272" text-anchor="middle" class="viz-label-muted">40 gwei</text>
<path d="M452 239.7 V236.1 a4 4 0 0 1 4 -4 H472 a4 4 0 0 1 4 4 V250 H452 Z" class="viz-f1"/>
<text x="464" y="225.3" text-anchor="middle" class="viz-value">0.5</text>
<text x="464" y="272" text-anchor="middle" class="viz-label-muted">80 gwei</text>
<text x="554.7" y="150" text-anchor="middle" class="viz-label-muted">below 1, every</text>
<text x="554.7" y="168" text-anchor="middle" class="viz-label-muted">public attempt</text>
<text x="554.7" y="186" text-anchor="middle" class="viz-label-muted">is a losing bet</text>
</svg>
<figcaption>Illustrative: computed as profit per win divided by gas per attempt times gas price; the inputs are stated assumptions, not measured results.</figcaption>
</figure>

The budget moves with the gas market, which means a strategy that is fine at 3 in the morning is dead at 3 in the afternoon, with no change to the code. Most of the arbitrage bots that quietly bleed do so because they run one number, the gross spread threshold, and never recompute the budget from the live gas price.

## The submission path is the strategy

Here is the part that turns a cost problem into a design decision. The gas-on-revert rule is a rule of the public mempool. A bundle sent through Flashbots follows a different rule. Their [documentation](https://docs.flashbots.net/flashbots-auction/advanced/troubleshooting) states it plainly: a bundle containing a transaction that reverts is not included in the block at all, unless you listed that transaction in `revertingTxHashes`, and a bundle that is not included costs nothing. The builder simulated it, saw the revert, and dropped it. You paid for nothing because nothing happened.

That changes the revert budget from a number to a choice. Through the public mempool, every loss costs full gas and the budget is finite. Through a bundle, a loss costs only the opportunity, and the budget is effectively unlimited; what you pay instead is a tip that only lands on the wins, plus a different kind of exposure that I will come back to.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Where a strategy survives, by submission path and revert rate</title>
<desc id="f3-d">A two by two grid. Horizontal axis: revert rate, low on the left and high on the right. Vertical axis: submission path, public mempool at the bottom and bundle at the top. Bottom left survives if the budget is above one. Bottom right loses money. Top left and top right survive, paying only on wins.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Survives</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">reverts are free, tip paid on wins</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Survives</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">the only home for a low hit rate</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Survives if budget above 1</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">recompute it every block</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Loses money</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">nine reverts per premium</text>
<circle cx="464" cy="82" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Revert rate: low to high</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Submission path: public mempool to bundle</text>
</svg>
<figcaption>Illustrative: a placement of the four cases, with the dot on the cell a cross-venue arbitrage strategy usually occupies.</figcaption>
</figure>

This is why, in Shayanomaly, the flash loan and the bundle were one decision rather than two features. A cross-venue arbitrage strategy lives in the top-right cell: it is wrong often, because the spreads it chases are short-lived, and it can only afford to be wrong often if being wrong is free. Atomic execution through Aave makes the loss safe. Bundle submission makes the loss cheap. Without the second, the first only guarantees that you lose gas instead of capital.

## What the contract should do about it

Two consequences fall out for the code. First, if any path goes through the public mempool, revert early and cheap: quote both venues and check the expected profit before calling `flashLoan`, so the common failure costs a few thousand gas instead of half a million. Second, if every path goes through bundles, the early check still belongs there, but for a different reason: builders simulate bundles, and a strategy that submits hopeless bundles is spending the builder's patience rather than gas.

A third consequence is about the number itself. Read the premium from the pool at runtime, not from a constant in your code, because governance can change it and a contract that hard-codes 0.05% will repay too little on the day it changes and revert on every attempt, which on the public mempool means paying for every one of those failures. The same goes for the gas estimate in the revert budget: it should come from a simulation of the actual call against current state, the way you would run `eth_call` before sending, rather than from the figure you measured the week you deployed. Both numbers drift, and the budget is only as honest as its inputs.

And the exposure I promised to return to. A bundle removes one adversary, anyone reading the public mempool, and replaces it with a smaller set you now trust to simulate honestly and not to front-run what they saw. Flashbots' own [EIP-1559 notes](https://docs.flashbots.net/flashbots-auction/advanced/eip1559) spell out how the tip and the base fee interact for bundles, and the trust question deserves its own post. For this one, the rule is simpler. Compute the revert budget from live gas before every attempt. If it is below 1, the public mempool is not a submission path; it is a slow way to donate ETH to validators.
