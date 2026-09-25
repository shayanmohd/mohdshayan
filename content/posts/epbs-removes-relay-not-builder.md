---
title: Glamsterdam removes the relay, not the builder
date: 2026-09-09
summary: ePBS deletes the relay as a trusted party and makes the builder's payment unconditional. The builder still sees every bundle, and gains an in-protocol way to drop the block.
tags: MEV, Ethereum, Glamsterdam
topic: Web3 & DeFi
draft: false
---

Every bundle path I have built for Ethereum was designed for a world with three parties in the block auction: a searcher who finds the opportunity, a builder who assembles the block, and a relay that sits between the builder and the validator so that neither has to trust the other. Glamsterdam, the upgrade now in public testnets with a 2026 target, moves the auction into the protocol and deletes the third party. The headlines say this fixes the trust problem in block building. For a searcher it moves the problem rather than removing it, and the honest accounting of what changes is narrower than the headlines and more useful.

## Three eras of the auction

The block auction has had three shapes. From January 2021, Flashbots' MEV-Geth let searchers send bundles straight to miners running a patched client. From the Merge in September 2022, [MEV-Boost](https://docs.flashbots.net/flashbots-mev-boost/introduction) let validators outsource block building to specialised builders through relays, which hold the builder's block, show the validator only a header and a bid, and release the body once the validator has signed. And with Glamsterdam, [EIP-7732](https://eips.ethereum.org/EIPS/eip-7732) makes builders staked entities inside the beacon chain and lets the proposer commit to a builder's bid without anyone in the middle. The upgrade after it, Hegotá, is [scoped for 2027](https://eipsinsight.com/upgrade/hegota) with inclusion lists as its headliner, which is the part of the roadmap that addresses censorship rather than trust.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Three eras of the Ethereum block auction, 2021 to 2027</title>
<desc id="f1-d">A timeline with four points: January 2021, MEV-Geth, bundles sent to miners; September 2022, MEV-Boost with the Merge, relays between builders and validators; 2026 target, Glamsterdam with enshrined proposer-builder separation; 2027 scope, Hegotá with fork-choice inclusion lists.</desc>
<circle cx="440" cy="18" r="5" class="viz-d1"/><text x="450" y="22" class="viz-label-muted">shipped</text>
<circle cx="530" cy="18" r="5" class="viz-dgray"/><text x="540" y="22" class="viz-label-muted">scheduled</text>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="80" cy="90" r="6" class="viz-d1"/>
<text x="80" y="64" text-anchor="middle" class="viz-tick">Jan 2021</text>
<text x="80" y="46" text-anchor="middle" class="viz-label">MEV-Geth</text>
<circle cx="230" cy="90" r="6" class="viz-d1"/>
<text x="230" y="124" text-anchor="middle" class="viz-tick">Sept 2022</text>
<text x="230" y="142" text-anchor="middle" class="viz-label">MEV-Boost, relays</text>
<circle cx="440" cy="90" r="6" class="viz-dgray"/>
<text x="440" y="64" text-anchor="middle" class="viz-tick">2026 target</text>
<text x="440" y="46" text-anchor="middle" class="viz-label">Glamsterdam, ePBS</text>
<circle cx="570" cy="90" r="6" class="viz-dgray"/>
<text x="570" y="124" text-anchor="middle" class="viz-tick">2027 scope</text>
<text x="570" y="142" text-anchor="middle" class="viz-label">Hegotá, FOCIL</text>
</svg>
<figcaption>Source: <a href="https://docs.flashbots.net/flashbots-mev-boost/introduction">Flashbots documentation</a> for the first two eras; <a href="https://eipsinsight.com/upgrade/glamsterdam">EIPsInsight</a> for the Glamsterdam and Hegotá targets as of September 2026.</figcaption>
</figure>

## What the relay was for

It is worth being precise about the job the relay did, because that is the job the protocol is absorbing. Under MEV-Boost a builder cannot show a validator the block before the validator commits to it, since a validator who saw the block could copy its contents and propose them as its own. And a validator cannot commit to a block it has not seen unless someone it trusts vouches that the block is valid and that the payment inside it is real. The relay was that someone. It received the full block from the builder, checked it, showed the validator only a header and a bid, collected the validator's signature on the header, and then released the body to the network. Both sides trusted the relay: the builder trusted it not to leak the block, and the validator trusted it not to lie about the bid.

That arrangement worked, and it had two costs that were obvious from the start. The relay saw everything, every bundle in every block from every builder that used it, which made it the most valuable vantage point in the system and a party whose operators had to be trusted not to use it. And it was a handful of companies running ordinary servers, so a relay outage or a relay's policy decision, about which transactions it would carry, became a property of the chain that no protocol rule described. Enshrining the auction was the answer to both: let the protocol carry the commitment, and let the protocol pay the validator.

## What EIP-7732 actually changes

The mechanism is worth stating precisely, because the security argument depends on the details. A builder registers on the beacon chain with a stake and a balance. In each slot the builder signs a bid that commits to an execution payload by its block hash and names a value it will pay the proposer. The proposer includes the winning bid in the beacon block, and at that moment the payment is deducted from the builder's balance, unconditionally: the EIP's stated guarantee is that an honest proposer is paid whatever the builder does next. The builder then reveals the payload later in the slot, and a committee of 512 validators, the payload timeliness committee, attests to whether the payload arrived in time, without validating its contents. If the payload does not arrive, the slot's beacon block stands and its execution payload is empty.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One slot under EIP-7732, schematic</title>
<desc id="f2-d">A twelve-second slot drawn as a bar with four marked moments: the proposer publishes a beacon block containing the builder's bid and the payment is deducted; attesters vote on the beacon block; the builder reveals the payload; the payload timeliness committee votes on whether it arrived. A note marks the window between commitment and reveal as the builder's option.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Commit first, reveal later</text>
<rect x="40" y="70" width="560" height="14" rx="4" class="viz-fgray"/>
<rect x="40" y="70" width="280" height="14" rx="4" class="viz-f1"/>
<text x="40" y="106" text-anchor="middle" class="viz-tick">0 s</text>
<text x="600" y="106" text-anchor="middle" class="viz-tick">12 s</text>
<line x1="40" y1="60" x2="40" y2="92" class="viz-axis"/>
<text x="46" y="54" class="viz-label">beacon block with the bid</text>
<text x="46" y="34" class="viz-label-muted">payment deducted here</text>
<line x1="200" y1="60" x2="200" y2="92" class="viz-axis"/>
<text x="206" y="128" class="viz-label">attesters vote on the block</text>
<line x1="320" y1="60" x2="320" y2="92" class="viz-axis"/>
<text x="326" y="50" class="viz-label">builder reveals the payload</text>
<line x1="470" y1="60" x2="470" y2="92" class="viz-axis"/>
<text x="476" y="128" class="viz-label">PTC: arrived?</text>
<path d="M60 160 H300" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="180" y="184" text-anchor="middle" class="viz-label-muted">committed and paid, not yet revealed</text>
<text x="320" y="214" text-anchor="middle" class="viz-tick">positions are schematic; the EIP fixes the order of events, not these exact seconds</text>
</svg>
<figcaption>Illustrative: the order of events in <a href="https://eips.ethereum.org/EIPS/eip-7732">EIP-7732</a>, drawn on a slot; the timings are not to scale.</figcaption>
</figure>

Three things follow. The relay is gone, because the protocol itself now does what the relay did: it lets the proposer commit to a block it has not seen, and it guarantees the builder is paid only if it reveals what it committed to, or rather, in this design, that the proposer is paid regardless. The builder is now a first-class protocol entity with a balance the protocol can debit. And the builder has a window, between commitment and reveal, in which it has already paid and has not yet shown its hand.

## The see-and-drop ledger

The tool I use to think about any change to the block-production path is a two-column ledger. For each path, who can see my transaction before it is final, and who can drop it? A trust change that moves a name from one row to another matters; a headline that does not change either column does not.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The see-and-drop ledger across three block-production paths</title>
<desc id="f3-d">A table with three rows and two columns. Public mempool: seen by every node, dropped by any builder or proposer. MEV-Boost: seen by the builder and the relay, dropped by the builder, the relay, or a proposer that misses the slot. Enshrined PBS: seen by the builder only, dropped by the builder by exclusion or by withholding the whole payload. The relay's name appears only in the middle row.</desc>
<text x="0" y="18" class="viz-title">Who can see it, who can drop it</text>
<text x="20" y="48" class="viz-tick">PATH</text>
<text x="200" y="48" class="viz-tick">CAN SEE THE BUNDLE</text>
<text x="420" y="48" class="viz-tick">CAN DROP IT</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">Public mempool</text>
<text x="200" y="84" class="viz-label-muted">every node</text>
<text x="420" y="84" class="viz-label-muted">any builder or proposer</text>
<line x1="0" y1="100" x2="640" y2="100" class="viz-grid"/>
<text x="20" y="128" class="viz-label">MEV-Boost</text>
<text x="200" y="128" class="viz-label-muted">the builder</text>
<text x="200" y="146" class="viz-value">the relay</text>
<text x="420" y="128" class="viz-label-muted">the builder, by exclusion</text>
<text x="420" y="146" class="viz-value">the relay</text>
<text x="420" y="164" class="viz-label-muted">a proposer that misses the slot</text>
<line x1="0" y1="180" x2="640" y2="180" class="viz-grid"/>
<text x="20" y="208" class="viz-label">Enshrined PBS</text>
<text x="200" y="208" class="viz-label-muted">the builder</text>
<text x="420" y="208" class="viz-label-muted">the builder, by exclusion</text>
<text x="420" y="226" class="viz-value">the builder, by withholding</text>
<line x1="0" y1="242" x2="640" y2="242" class="viz-grid"/>
<text x="0" y="276" class="viz-label-muted">Gold marks what changes: one name leaves both columns, and one new way to drop appears.</text>
</svg>
<figcaption>Illustrative: the ledger as it applies before and after the upgrade; it records capability, not intent.</figcaption>
</figure>

Filled in, the ledger says what the upgrade does for a searcher. In the seeing column, the relay leaves. That is a real gain: a relay is a company that saw every builder's block, and its operators were a party a searcher had to trust not to look. The builder stays. Whoever assembles the block reads every bundle in it, and no protocol change short of encrypted mempools alters that. In the dropping column, the relay leaves too, and a new entry appears: the builder can now withhold the entire payload after committing to it, and the protocol will accept an empty slot. Under MEV-Boost a builder who wanted to abandon a block had to do it before the relay released it; now the builder holds the decision until the reveal deadline.

## The free option

That last entry is the one the formal analysis is about. Mazorra, Öz, Schlegel and Wu's [The Free Option Problem of ePBS](https://arxiv.org/abs/2509.24849) describes the window between commitment and reveal as an option: the builder has paid the bid and can still choose, when the reveal deadline arrives, whether the committed payload becomes canonical. The bid is the option's price. If the market moves against the block's contents in those few seconds, the builder can let the slot go empty and lose only the bid, and the paper's evidence is that exercising the option becomes markedly more frequent in volatile periods, when the bundles inside the block are worth the most to the searchers who built them. The mitigations it proposes, a shorter window or an additional penalty for exercising, are design choices the protocol has not yet made.

For a searcher, the option is a new correlation to price in. A bundle that captures a large move is exactly the bundle most likely to be in a block the builder has an incentive to drop, because the same move that made the bundle valuable changed the builder's own position. Under MEV-Boost that risk existed but was cut short by the relay's release; under ePBS it runs to the deadline and is paid for by the bid alone.

## What a bundle path should do about it

The practical changes are modest, which is the point. The builder is still the party to trust, so the work of choosing builders, spreading bundles across several, and measuring each one's inclusion rate against what it saw carries over unchanged. Two new measurements join that list: how often each builder's slots come up empty, and whether those empties cluster in volatile minutes. A builder whose empties correlate with the moves that made my bundles valuable is exercising the option against me, and the ledger says the protocol will let it. The unconditional payment protects the proposer, not the searcher.

Inclusion lists, when Hegotá ships them, change the dropping column again, by letting attesters force transactions into a block, and that will be worth a second ledger. Until then, the honest summary of Glamsterdam for anyone sending bundles is that the middleman is gone and the counterparty is not, and the counterparty has one more way to say no.
