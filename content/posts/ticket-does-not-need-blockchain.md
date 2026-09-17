---
title: Your ticket does not need a blockchain
date: 2026-09-17
summary: A ledger earns its cost only when several parties who distrust each other must write to it. A venue's ticketing has one writer, and one writer means a signature and a row.
tags: Architecture, Blockchain, Ticketing
draft: false
---

The pitch for blockchain ticketing is that a ticket on a chain cannot be forged or double-spent, and both halves of that are true. They are also true of a signed ticket in a database, at a fraction of the cost and latency, and the reason is that a venue's ticketing has exactly one writer. When I built the QR ticketing and contactless entry system for visitor attractions, the question of whether the tickets should live on a chain came up early and was settled by a count, not by an opinion about blockchains.

## Count the writers

Here is the test. Count the mutually distrusting parties that must append to the record. Not read it, append to it. If the answer is one, the record is a database with signatures: the one writer signs what it writes, anyone can verify the signature, and nobody else needs to be trusted because nobody else writes. If the answer is two, the two parties need a shared log that neither can rewrite alone, and there are several ways to get one that are not a blockchain. Only when the answer is many, and there is no operator all of them would accept, does a chain pay for itself, because a chain is the machine for letting strangers append to one record without an operator.

A venue's tickets have one writer: the venue, or the platform it uses. The venue issues the ticket, the venue admits the visitor, the venue refunds the cancellation. The visitor never writes to the record; the visitor presents a credential and the venue writes the result. There is no second party who needs to append anything and who would distrust the venue's log, because the only party with an interest in the log's integrity is the party keeping it.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Where different records sit, by writer count and need for public verification</title>
<desc id="f1-d">A two by two grid. Horizontal axis: number of mutually distrusting writers, one on the left, many on the right. Vertical axis: need for public verifiability, low at the bottom, high at the top. Bottom left: tickets, receipts, loyalty points; a signed database. Top left: audit logs and certificates; a signed database with published hashes. Bottom right: settlement between a few known firms; a shared log among the parties. Top right: a public asset register among strangers; a chain.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Signed rows, hashes published</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">certificates, audit logs</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">A chain</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">strangers, no operator anyone accepts</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Signed rows in a database</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">tickets, receipts, loyalty points</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">A shared log among the parties</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">settlement between known firms</text>
<circle cx="192" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Mutually distrusting writers: one to many</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Need for public verifiability: low to high</text>
</svg>
<figcaption>Illustrative: a placement of record types; the dot is a venue's tickets.</figcaption>
</figure>

## What a signed row gives you

Take the two properties the chain pitch promises and check them against a signed ticket in a database.

Cannot be forged. The venue signs each ticket at issue with a private key; the signature, 64 bytes under [Ed25519](https://www.rfc-editor.org/rfc/rfc8032), proves the ticket came from the venue and has not been altered. A gate verifies it with the public key, offline if it has to. Nobody without the private key can produce a ticket that verifies. That is the same guarantee a chain gives, from the same primitive, because a chain's forgery resistance is also a signature.

Cannot be double-spent. This is the one people think needs a chain, and it needs a row. The ticket's row has a status, and admission is a conditional update: set it to spent where it is unspent, in one statement. The database serialises two gates racing on the same ticket and exactly one wins. I wrote up that design in [an earlier post](/blog/qr-ticket-bearer-token/). A chain achieves double-spend protection by having many parties agree on the order of transactions; a single-writer database achieves it by having one party, whose ordering is the only one that matters.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A signed ticket from issue to refused replay, with one writer</title>
<desc id="f2-d">Three lanes: the visitor's phone, the venue's API and database, and a gate. The venue issues a signed ticket to the phone. The gate scans it; the venue verifies the signature and atomically marks the row spent, admitting the visitor. A second scan of the same ticket fails the conditional update and is refused. The venue is the only lane that ever writes.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Visitor's phone</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Venue: the one writer</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Gate</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">issue: signed ticket, row status unspent</text>
<line x1="315" y1="80" x2="103" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="320" y="114" text-anchor="middle" class="viz-label-muted">present the code at the gate</text>
<line x1="100" y1="120" x2="537" y2="120" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="154" text-anchor="middle" class="viz-label-muted">verify signature, set spent where unspent</text>
<line x1="540" y1="160" x2="328" y2="160" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="194" text-anchor="middle" class="viz-label-muted">1 row: admit</text>
<line x1="325" y1="200" x2="537" y2="200" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="234" text-anchor="middle" class="viz-label-muted">same code again</text>
<line x1="540" y1="240" x2="328" y2="240" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="274" text-anchor="middle" class="viz-label-muted">0 rows: refuse, already used</text>
<line x1="325" y1="280" x2="537" y2="280" class="viz-s4" marker-end="url(#f2-ah)"/>
</svg>
<figcaption>Illustrative: the full life of a ticket with a single writer; the visitor and the gate only present and verify.</figcaption>
</figure>

## What a chain would cost you

Against those two properties, which the signed row already has, a chain adds three costs that a gate cannot afford.

Latency. Ethereum's mainnet produces a block every [twelve seconds](https://ethereum.org/en/developers/docs/blocks/), and a write is not final for longer than that. Layer-two networks confirm faster at their sequencer, in seconds, and settle to the base layer later. A gate has about a second before a visitor starts wondering, and a conditional update on an indexed row takes a millisecond. Nothing on a chain gets close, and the usual answer, admit first and settle on chain later, means the chain is not the thing preventing the double-spend. The database is, again.

Cost per write. A chain charges for every append, in a fee that moves with demand for block space, and a venue's busiest hour is exactly when it can least afford variable cost per scan. A row in a database costs the same at nine in the morning and at noon.

A public record of who went where. A ticket on a public chain is a public record of an admission, tied to an address, forever. Most venues do not want that, most visitors do not want that, and the privacy work needed to avoid it on a chain is larger than the ticketing system it was meant to support.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Time for one write to be safe to act on, by where the write lives</title>
<desc id="f3-d">Horizontal bars on a logarithmic scale. A conditional update on a database row, about one millisecond. A layer-two sequencer confirmation, about two seconds. One Ethereum mainnet block, twelve seconds. The gate's budget of about one second is marked between the first two.</desc>
<text x="0" y="18" class="viz-title">How long before the write can be trusted</text>
<text x="0" y="36" class="viz-sub">Log scale, milliseconds to seconds</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Database row</text>
<path d="M176 58 H188 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="204" y="73" class="viz-value">about 1 ms</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Layer-two sequencer</text>
<path d="M176 92 H466 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="482" y="107" class="viz-value">seconds</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Ethereum mainnet block</text>
<path d="M176 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="580" y="141" class="viz-value">12 s</text>
<line x1="440" y1="52" x2="440" y2="188" class="viz-s4"/>
<text x="434" y="176" text-anchor="end" class="viz-label-muted">the gate's budget, about 1 s</text>
<text x="0" y="220" class="viz-label-muted">Anything to the right of the brick line admits first and records later.</text>
</svg>
<figcaption>Source: the twelve-second slot time from the <a href="https://ethereum.org/en/developers/docs/blocks/">Ethereum developer documentation</a>; the database and layer-two figures are order-of-magnitude values stated as assumptions, and the gate budget is this post's design constraint.</figcaption>
</figure>

## The middle case, and what to keep

The two-writer case deserves its own paragraph because it is where the count most often lands in practice, and where people reach for a chain out of habit. A venue and a payment provider, a venue and a tour operator, a venue and an auditor: two parties who each write to the record and who would each like to be able to prove the other did not rewrite it. The answer there is a log that neither party can alter alone, and the cheap way to build one is to publish. Each party keeps its own database and, at intervals, publishes a hash of its log, a Merkle root over the day's entries, somewhere the other party can see and keep. Any later alteration changes the root, and the other party has the old one. That is an append-only log with a witness, it costs a few bytes a day, and it is what a chain provides for strangers at a thousand times the cost.

Which points at what the single-writer design should keep from the chain conversation, because it is not nothing. Signatures on every record, so that a copy can be verified without asking the venue. An append-only transition log rather than a mutable status column, so that the history of a ticket is a sequence of signed events and a refund is an event rather than an edit. Published hashes when a second party needs assurance. Those are the ideas that made chains interesting, and they all work in a database with one writer.

## When the count says yes

The test is not an argument that chains are useless, and it is worth showing the case where it says yes, because that is what makes it a test rather than a prejudice. Suppose the ticket is resold. Now a second party, the reseller, wants to append to the record, and the venue and the reseller may distrust each other about whether a resale happened and at what price. Add a third and a fourth reseller, and a rule that the venue takes a cut of every resale, and a public market where buyers want to verify a ticket without trusting any reseller. The writer count is now many, there may be no operator all of them accept, and public verifiability is a requirement. That is the top-right cell, and a chain is a defensible answer there.

Even then, the admission itself stays a single-writer event. The gate still needs a millisecond answer, and the venue is still the only party that admits. The chain, if there is one, records ownership between admissions; the row records the admission. The two are different records with different writer counts, and confusing them is how ticketing systems end up with a chain in the critical path of a turnstile.

## The rule

Before choosing where a record lives, count the parties that must append to it and would not trust each other's log. One writer means signatures and a database. Two means a shared log. Many, with no acceptable operator, means a chain. A ticket is a one-writer record, and the decision is a count, not a philosophy.
