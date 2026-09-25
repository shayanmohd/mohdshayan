---
title: A QR ticket is a bearer token that walks
date: 2026-03-30
summary: A signature on a ticket proves it was issued, not that it is unused. Replay protection is a state problem, and it lives in one atomic write at the moment of admission.
tags: Security, QR Ticketing, System Design
topic: Security & Cryptography
draft: false
---

A QR code on a phone screen is a bearer credential. Whoever presents it gets what it grants, and there is no channel binding, no device it is tied to, nothing that distinguishes the original from a screenshot. Copy the pixels and you have copied the ticket. That is not a flaw in QR codes; it is what a printable credential is. When I built the QR ticketing and contactless entry system for visitor attractions, most of the security discussion was about how to sign the ticket, and almost none of it was about the only question that decides whether a gate can be fooled: where does the spend happen.

## What a signature proves

Signing is the easy half, and it is worth doing well. A ticket token can be small: an identifier, an expiry, and an Ed25519 signature, which [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) fixes at 64 bytes. Put a 16-byte id and an 8-byte expiry next to it and the whole token is 88 bytes before encoding. QR codes have room to spare. The [ISO/IEC 18004](https://www.iso.org/standard/83389.html) capacity tables, reproduced on most [QR reference sites](https://qrmake.dev/blog/qr-code-capacity-reference/), give a version 40 symbol at the lowest error correction level 2,953 bytes, and a version 5 symbol, which scans comfortably from a phone screen at arm's length, over a hundred. The token fits in a small, dense, fast-scanning code with capacity left for a stronger error correction level, which matters more at a gate than payload does.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">QR byte capacity by symbol version, error correction level L</title>
<desc id="f1-d">Horizontal bars of byte capacity: version 1 holds 17, version 5 holds 106, version 10 holds 271, version 20 holds 858 and version 40 holds 2,953. A marker at about 90 bytes shows the size of a signed ticket token, which fits inside version 5.</desc>
<text x="0" y="18" class="viz-title">Bytes a QR symbol can carry at level L</text>
<text x="0" y="36" class="viz-sub">Binary mode; a signed ticket token needs about 90</text>
<line x1="128" y1="52" x2="128" y2="222" class="viz-axis"/>
<text x="118" y="73" text-anchor="end" class="viz-label">Version 1</text>
<rect x="128" y="58" width="3" height="20" class="viz-fgray"/>
<text x="143" y="73" class="viz-value">17</text>
<text x="118" y="107" text-anchor="end" class="viz-label">Version 5</text>
<path d="M128 92 H139.8 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H128 Z" class="viz-f1"/>
<text x="155.8" y="107" class="viz-value">106</text>
<text x="118" y="141" text-anchor="end" class="viz-label">Version 10</text>
<path d="M128 126 H164.4 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H128 Z" class="viz-fgray"/>
<text x="180.4" y="141" class="viz-value">271</text>
<text x="118" y="175" text-anchor="end" class="viz-label">Version 20</text>
<path d="M128 160 H251.8 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H128 Z" class="viz-fgray"/>
<text x="267.8" y="175" class="viz-value">858</text>
<text x="118" y="209" text-anchor="end" class="viz-label">Version 40</text>
<path d="M128 194 H564 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H128 Z" class="viz-fgray"/>
<text x="580" y="209" class="viz-value">2,953</text>
<line x1="141.4" y1="52" x2="141.4" y2="222" class="viz-axis"/>
<text x="150" y="240" class="viz-label-muted">the marker is a 90-byte signed token</text>
</svg>
<figcaption>Source: capacity table of <a href="https://www.iso.org/standard/83389.html">ISO/IEC 18004</a> as reproduced by <a href="https://qrmake.dev/blog/qr-code-capacity-reference/">qrmake.dev</a>; token size from RFC 8032's 64-byte signature plus a 16-byte id and an 8-byte expiry.</figcaption>
</figure>

Here is what that signature proves at the gate: this token was produced by someone holding the issuing key, and it has not been altered since. It proves nothing about whether the token has been presented before. A signature check is a pure function of the bytes, and the same bytes give the same answer at nine in the morning and at nine at night, at gate A and at gate B, on the original phone and on the screenshot a friend received over a messaging app. Verification is stateless by design, and a stateless check cannot count.

## The turnstile invariant

The property gateless entry actually needs is a property about state, and it can be stated in one sentence. Each ticket identifier moves from unspent to spent exactly once, that transition is atomic at the point of admission, and no scanner decides admission on its own. I think of it as the turnstile invariant, because a mechanical turnstile has it built in: it turns once per token and it cannot be argued with. A design either satisfies the invariant or accepts replays. There is no partial credit, and in particular there is no amount of cryptography that substitutes for it.

In a relational database the invariant is one statement. The scanner sends the token, the server verifies the signature, and then the server runs a conditional update.

```sql
UPDATE tickets
SET status = 'spent', spent_at = now(), spent_gate = $2
WHERE id = $1 AND status = 'unspent';
```

If one row was updated, the visitor is admitted. If zero rows were updated, the ticket was already spent, and the server can say exactly when and where, because the row remembers. Two gates that scan the same ticket 200 milliseconds apart both send their update; the database serialises them on the row, the first one wins, and the second one sees zero rows. No lock is taken explicitly, no cache is consulted, no scanner had an opinion. The row is the turnstile.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Two gates scan the same ticket 200 milliseconds apart</title>
<desc id="f2-d">Three lanes: gate A, the API with its database, and gate B. Gate A scans first; the API runs a conditional update that changes one row and admits. Gate B scans 200 milliseconds later; the same update changes zero rows and the API refuses, naming the earlier gate and time.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Gate A</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">API and database</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Gate B</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">scan, t = 0 ms</text>
<line x1="100" y1="80" x2="312" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="332" y="106" class="viz-value">UPDATE ... WHERE status = 'unspent'</text>
<text x="332" y="122" class="viz-label-muted">1 row changed</text>
<text x="207" y="150" text-anchor="middle" class="viz-label-muted">admit</text>
<line x1="315" y1="156" x2="103" y2="156" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="190" text-anchor="middle" class="viz-label-muted">same token, t = 200 ms</text>
<line x1="540" y1="196" x2="328" y2="196" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="332" y="222" class="viz-value">UPDATE ... WHERE status = 'unspent'</text>
<text x="332" y="238" class="viz-label-muted">0 rows changed</text>
<text x="432" y="266" text-anchor="middle" class="viz-label-muted">refuse: spent at gate A, 200 ms ago</text>
<line x1="325" y1="272" x2="537" y2="272" class="viz-arrow" marker-end="url(#f2-ah)"/>
</svg>
<figcaption>Illustrative: the race the invariant is designed for, with the database row as the only arbiter.</figcaption>
</figure>

## Where the spend can live

Once you see the invariant, every ticketing architecture sorts itself by where it puts the transition. On the scanner: the scanner keeps a list of tokens it has seen. That stops the same phone being scanned twice at the same gate and nothing else; the screenshot walks to the next gate and is new there. In a cache in front of the database: faster, and now two gates can race the cache and both win before the write lands. On the server, in the row: one conditional write, the invariant holds, and the cost is a network round trip per scan.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Which designs satisfy the turnstile invariant</title>
<desc id="f3-d">A two by two grid. Horizontal axis: scanner connectivity, offline on the left and online on the right. Vertical axis: where admission is decided, on the scanner from a signature at the bottom, in a server row at the top. Only the top right cell, online scanners with the spend in a server row, satisfies the invariant. The other three accept replays in some form.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Queue until reconnect</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">or accept now and replay across gates</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">The invariant holds</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">one conditional write per scan</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Signature only</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">every copy verifies</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Signature, checked online</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">still verifies twice</text>
<circle cx="464" cy="80" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Scanner connectivity: offline to online</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Where admission is decided: signature to server row</text>
</svg>
<figcaption>Illustrative: a placement of the four designs; only one cell can count.</figcaption>
</figure>

The bottom row is the one that surprises people, because the right-hand cell looks safe. The scanner is online, it asks the server, the server verifies the signature and says yes. But if the server only verifies, it says yes twice. Being online is necessary for the invariant and not sufficient. The write is what counts, and it has to be conditional on the current state of the row, in the same statement, so that no gap exists between reading "unspent" and writing "spent".

## Rotating codes are a mitigation

The obvious objection is that big wallets do not show static codes. Google Wallet's [rotating barcode](https://developers.google.com/wallet/reference/rest/v1/RotatingBarcode) regenerates the code on a timer using a TOTP value, with a `periodMillis` of 30,000 in the documented example and `TOTP_SHA1` as the algorithm, so that a screenshot is stale within a period. That is a real improvement, and it is a mitigation, not the mechanism. A rotating code shrinks the replay window from the life of the ticket to thirty seconds. Two phones showing the same live code within the same thirty seconds still both pass a stateless check. The rotation makes the attacker work harder; the row is what makes the attacker fail.

Rotation earns its place in exactly one situation: the scanner is offline, so the row cannot be reached, and you would rather bound the replay window than refuse everyone. That is the top-left cell of the matrix with a time limit attached, and it should be called what it is, a degraded mode that accepts some replays until it resyncs. Writing that sentence into the design document is more useful than any amount of signature ceremony.

## What gateless means for the write

An attraction without turnstiles has no machine to stop a visitor, so the refusal is a person with a phone, and the latency budget is however long a visitor will stand there before walking through. In practice that is about a second, and most of it is spent on the network. The conditional update itself is a single indexed row change, and the database does that in a millisecond. So the design puts the scanner in front of a small API, the API in front of the database, and nothing else in the path: no queue, no cache, no batch reconciliation. A scan is one request and one row.

The reply carries the reason, because a refusal at a gate is a conversation. "Already used at gate A at 09:41" lets the person with the phone decide what to do with the person in front of them. "Invalid" does not. The row knows the answer, so the API should say it.

The same row is also the analytics. Because every admission is one conditional write with a gate and a timestamp, the live visitor count, the arrivals per hour and the busiest gate are all queries over the tickets table, with no separate event stream to keep in sync. A design that had put the spend on the scanner would have needed a second pipeline to collect what the scanners saw, and that pipeline would have been the first thing to drift from the truth.

When I look back at the system, the signature, the encoding, the expiry and the rotation were all details, and the details were fine. The security argument was one conditional update, and the decision that mattered was that nothing in the building except that row was allowed to say yes.
