---
title: Every external call is a handover
date: 2026-09-17
summary: Reentrancy is a symptom. The event underneath is control leaving your contract while state is half-written. Count those moments per function and audit the count.
tags: Solidity, Security, Audits
topic: Web3 & DeFi
draft: false
---

Every Solidity audit checklist has a line for reentrancy, and every tutorial teaches the same fix: checks, effects, interactions, plus a guard modifier. The fix works for the case the tutorial shows and it names the wrong thing. Reentrancy is a symptom. The event underneath it is that control leaves your contract while some of your state is still to be written, and that event has more consequences than the one where the caller comes straight back in. It is also how a token's transfer hook runs your counterparty's code, how another contract reads your half-updated numbers, and how a flash-loan receiver ends up running inside someone else's transaction. Counting those moments is a better habit than pattern-matching for the symptom, and the count has a target, which is zero.

## The handover count

For each function, count the points where control leaves the contract, by any external call, with at least one state variable still to be written after that point. That is the handover count. A function with zero handovers cannot be re-entered in any way that matters, because there is nothing half-written for a re-entrant caller to exploit, and nothing stale for an outside reader to see. A function with a non-zero count is not necessarily wrong; it has a reason, and the reason gets written next to the call in the code, and the count and its reasons are reported per function in the audit.

The definition is deliberately about state written after the call, not about whether the callee is trusted. Trust is what the tutorials use, and it is the wrong axis: a trusted callee can be upgraded, can itself call an untrusted contract, or can be a token whose transfer runs a hook you did not know about. The state ordering is a property of your own code, and it is the one you control.

## What a flash-loan receiver looks like under the count

The clearest shape I have worked with is a flash-loan receiver. In Aave's [pool contract](https://aave.com/docs/developers/smart-contracts/pool), a receiver calls flashLoan, the pool transfers the borrowed tokens and calls back into the receiver's executeOperation, the receiver does whatever it borrowed the money for, approves the repayment, and returns; the pool then pulls the loan plus premium. The whole design is a handover: your code runs inside the pool's transaction, between the pool's transfer and the pool's repayment check. Inside your executeOperation, every swap on a decentralised exchange is another handover, and every token transfer is a potential one, because a token that follows [ERC-777](https://eips.ethereum.org/EIPS/eip-777) calls a hook on the recipient during the transfer, and an [ERC-721](https://eips.ethereum.org/EIPS/eip-721) safe transfer calls the receiver's acceptance function.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Control flow of a flash-loan receiver with the handover points marked</title>
<desc id="f1-d">A vertical flow. The receiver calls the pool's flashLoan: handover one, control moves to the pool. The pool transfers tokens and calls back executeOperation. Inside it, a swap on exchange A: handover two. A swap on exchange B: handover three. An approve on the token contract: handover four. Return true, and the pool pulls repayment. Beside each handover, the state the receiver still has to write afterwards is listed: the in-flight flag, the profit accounting, and the recipient of the profit.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Four handovers in one function, and what is still unwritten at each</text>
<rect x="8" y="40" width="250" height="40" rx="8" class="viz-box"/>
<text x="133" y="65" text-anchor="middle" class="viz-label">receiver calls pool.flashLoan</text>
<circle cx="270" cy="60" r="7" class="viz-d4"/><text x="284" y="64" class="viz-label-muted">1: control to the pool</text>
<line x1="133" y1="82" x2="133" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="102" width="250" height="40" rx="8" class="viz-box-accent"/>
<text x="133" y="127" text-anchor="middle" class="viz-label">pool calls back executeOperation</text>
<line x1="133" y1="144" x2="133" y2="160" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="164" width="250" height="40" rx="8" class="viz-box"/>
<text x="133" y="189" text-anchor="middle" class="viz-label">swap on exchange A</text>
<circle cx="270" cy="184" r="7" class="viz-d4"/><text x="284" y="188" class="viz-label-muted">2: exchange, and its tokens' hooks</text>
<line x1="133" y1="206" x2="133" y2="222" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="226" width="250" height="40" rx="8" class="viz-box"/>
<text x="133" y="251" text-anchor="middle" class="viz-label">swap on exchange B, approve repayment</text>
<circle cx="270" cy="246" r="7" class="viz-d4"/><text x="284" y="250" class="viz-label-muted">3 and 4: exchange, token contract</text>
<line x1="133" y1="268" x2="133" y2="284" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="288" width="250" height="34" rx="8" class="viz-box-ink"/>
<text x="133" y="310" text-anchor="middle" class="viz-on-ink">return; pool pulls loan plus premium</text>
<text x="284" y="290" class="viz-tick">still to be written after 2, 3, 4:</text>
<text x="284" y="306" class="viz-label-muted">in-flight flag, profit accounting, payee</text>
<text x="284" y="322" class="viz-label-muted">each one a reason in the code, or moved earlier</text>
</svg>
<figcaption>Illustrative: the shape of a receiver built for Aave's flashLoan and executeOperation; the state listed is the kind such a contract keeps, not a particular deployment's.</figcaption>
</figure>

Under the count, that function starts at four. The work of reducing it is ordinary: the in-flight flag is set before the first call and cleared at the very end, which is fine as long as the flag is the only thing read by anything re-entrant, and it is written down as the reason; the profit accounting moves to after the last external call, which reduces the number of handovers with unwritten state behind them from three to zero for that variable; the payee is fixed before anything is called. The count that remains, one, with the flag as its reason, is what the audit reports. It is a smaller and more honest number than "uses a reentrancy guard".

## Why the symptom is the wrong thing to count

The public loss data explains why the broader framing matters. DefiLlama's [hacks dataset](https://defillama.com/hacks) classifies incidents by technique, and for the period from January 2025 to mid-September 2026, incidents labelled reentrancy account for six events and about 45 million dollars, which is a small slice of the roughly 4.5 billion lost in the period, most of it to key and signer compromise rather than to contract logic. Among the contract-logic categories, arithmetic errors, donation attacks, rounding errors, price manipulation and access control are each larger than reentrancy.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">DeFi losses by contract-logic technique, January 2025 to September 2026</title>
<desc id="f2-d">Horizontal bars in millions of US dollars: arithmetic error 313, donation attack 145, rounding error 139, spot price manipulation 91, improper access control 83, reentrancy 45, incorrect share accounting 19. Reentrancy is highlighted and is sixth of seven.</desc>
<text x="0" y="18" class="viz-title">Reentrancy is a small slice of contract-logic losses</text>
<text x="0" y="36" class="viz-sub">Millions of US dollars lost, by technique, 1 January 2025 to 16 September 2026</text>
<line x1="196" y1="52" x2="196" y2="290" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">Arithmetic error</text>
<path d="M196 58 H588 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="584" y="53" text-anchor="end" class="viz-value">313, 13 incidents</text>
<text x="186" y="107" text-anchor="end" class="viz-label">Donation attack</text>
<path d="M196 92 H378 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="398" y="107" class="viz-value">145, 7</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Rounding error</text>
<path d="M196 126 H370 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="390" y="141" class="viz-value">139, 5</text>
<text x="186" y="175" text-anchor="end" class="viz-label">Spot price manipulation</text>
<path d="M196 160 H310 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="330" y="175" class="viz-value">91, 43</text>
<text x="186" y="209" text-anchor="end" class="viz-label">Improper access control</text>
<path d="M196 194 H300 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="320" y="209" class="viz-value">83, 42</text>
<text x="186" y="243" text-anchor="end" class="viz-label">Reentrancy</text>
<path d="M196 228 H252 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="272" y="243" class="viz-value">45, 6</text>
<text x="186" y="277" text-anchor="end" class="viz-label">Share accounting</text>
<path d="M196 262 H219 a4 4 0 0 1 4 4 V278 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="239" y="277" class="viz-value">19, 24</text>
<text x="0" y="316" class="viz-label-muted">Key and signer compromise, not shown, dwarf all of these rows.</text>
</svg>
<figcaption>Source: computed by the author from the <a href="https://defillama.com/hacks">DefiLlama hacks dataset</a> via its public API, incidents dated 1 January 2025 to 16 September 2026, grouped by the dataset's technique label.</figcaption>
</figure>

The numbers are not an argument that reentrancy does not matter; the dataset's largest reentrancy loss in the period, a 42 million dollar exploit of a perpetuals protocol in July 2025, is reason enough to keep the line on the checklist. They are an argument about what to count. A guard modifier defends against the one technique labelled reentrancy. A handover count defends against every technique whose mechanism is "someone else's code ran while my state was inconsistent", and that mechanism shows up under other labels: a donation that lands between a balance read and its use, a price read from a pool that is mid-swap, a share calculation that ran before a callback finished. The label on the incident is decided afterwards. The handover was visible in the code beforehand.

## The read-only case the guard misses

The variant that makes the point sharpest is read-only reentrancy, where nobody re-enters the vulnerable contract at all. Contract A is mid-withdrawal: it has sent tokens to the caller but not yet updated the reserves it uses to compute its share price. During the send, the caller's code runs, and it calls contract B, a lender that values A's shares by asking A for its price. A answers from the half-updated reserves, B lends against the inflated value, and the loop closes without A's guard ever firing, because A was never called again. A's handover count on that withdrawal function was one, with the reserves as the unwritten state, and the count would have flagged it.

<figure class="chart">
<svg viewBox="0 0 640 270" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Read-only reentrancy across two contracts</title>
<desc id="f3-d">Three boxes. Contract A, a pool, is mid-withdrawal: tokens sent, reserves not yet updated. Control is with the attacker's contract, which calls contract B, a lender. B calls A's price view, which answers from the stale reserves. B lends against the inflated value. A's reentrancy guard never fires because A is only read, not re-entered.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Nobody re-enters A, and A is still the victim</text>
<rect x="8" y="50" width="190" height="90" rx="8" class="viz-box-accent"/>
<text x="103" y="74" text-anchor="middle" class="viz-label">Contract A, pool</text>
<text x="103" y="94" text-anchor="middle" class="viz-label-muted">tokens sent to caller</text>
<text x="103" y="112" text-anchor="middle" class="viz-label-muted">reserves not yet updated</text>
<text x="103" y="130" text-anchor="middle" class="viz-tick">handover count: 1</text>
<line x1="200" y1="95" x2="222" y2="95" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="226" y="50" width="190" height="90" rx="8" class="viz-box"/>
<text x="321" y="74" text-anchor="middle" class="viz-label">Attacker's contract</text>
<text x="321" y="94" text-anchor="middle" class="viz-label-muted">running inside A's send</text>
<text x="321" y="112" text-anchor="middle" class="viz-label-muted">calls B, not A</text>
<line x1="418" y1="95" x2="440" y2="95" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="444" y="50" width="188" height="90" rx="8" class="viz-box"/>
<text x="538" y="74" text-anchor="middle" class="viz-label">Contract B, lender</text>
<text x="538" y="94" text-anchor="middle" class="viz-label-muted">asks A for its price</text>
<text x="538" y="112" text-anchor="middle" class="viz-label-muted">lends against the answer</text>
<path d="M538 142 V180 H103 V144" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="320" y="172" text-anchor="middle" class="viz-tick">a view call: A answers from the stale reserves</text>
<text x="320" y="214" text-anchor="middle" class="viz-label-muted">A's guard checks for a second entry. There is none. The unwritten state was the problem.</text>
<text x="320" y="246" text-anchor="middle" class="viz-tick">the fix is the same as for the classic case: write the reserves before the send</text>
</svg>
<figcaption>Illustrative: the read-only reentrancy pattern drawn as three contracts; it is the case that a guard modifier on A cannot catch.</figcaption>
</figure>

## Running the count

The count is easy to produce by hand for a small contract and easy to automate for a large one: for each function, list external calls in order, and for each call, list the storage writes that follow it in the same function. The audit report carries a table with one row per function: handover count, and for each non-zero entry, the call, the state still unwritten, and the reason given in the code. Reasons that are acceptable are specific: "the flag is the only state read by re-entrant paths and it is set before the call"; "the callee is this contract's own library and makes no external calls". Reasons that are not acceptable are the ones the tutorials teach: "the callee is trusted", "there is a guard".

Automating it is a walk over the syntax tree. For each function, visit the statements in order; an external call is any call expression whose target is an address or an interface rather than an internal function or a library that makes no calls of its own; a state write is any assignment whose left-hand side resolves to storage. Emit one row per call that has at least one state write after it in the same function, including writes inside branches and loops, and include writes that happen in internal functions called after the external call, because those are the ones a manual review skips. The tool does not need to decide what is safe. It needs to produce the list, and the reasons are a human's job.

What the count does not cover deserves saying. Arithmetic and rounding errors, the largest contract-logic category in the data, are not handovers and need their own discipline. Key compromise, the largest category of all, is not a contract property at all. The handover count is a narrow tool for a specific mechanism, and its value is that the mechanism is the one that hides behind several labels. Get every function to zero, write a reason for every one that cannot be, and the reentrancy line on the checklist becomes a consequence rather than a hope.
