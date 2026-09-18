---
title: Idempotency keys pointed the other way
date: 2026-06-04
summary: A payment API's idempotency key and a gate's anti-replay check are the same primitive with opposite second answers. Seen as one mechanism, the design collapses to two questions.
tags: API Design, Idempotency, Security
draft: false
---

A payment API and a ticket gate have the same problem and give opposite answers to it. Both receive a request carrying an identifier the client chose. Both must do something sensible when the same identifier arrives twice. The payment API returns the first response again, so a retried charge does not become two charges. The gate refuses, so a scanned ticket does not admit two people. Same table, same unique constraint, same first request. Only the second request differs, and the difference is a single branch. Once I saw that, the anti-replay design for the QR ticketing system stopped being a security feature and became an idempotency key pointed the other way.

## One primitive, two second answers

Stripe's [idempotent requests](https://docs.stripe.com/api/idempotent_requests) documentation describes the payment side. The client sends a key it generated; the server stores the key with the result of the first request; a repeat with the same key gets the stored result back instead of a second execution. Keys are pruned once they are at least 24 hours old, after which a reused key is treated as a new request. Adyen's [API idempotency](https://docs.adyen.com/development-resources/api-idempotency) page does the same thing with a longer memory: keys are valid for 7 to 14 days after first submission.

The gate side is the mirror. The key is the ticket identifier, chosen by the server at issue time rather than by the client, but presented by the client at the gate. The first presentation records the spend. A repeat with the same identifier is refused, and the refusal cites the first-seen time and place. Nobody calls this an idempotency key, but the storage is identical: a key, a first-seen time, and a first result.

<figure class="chart">
<svg viewBox="0 0 640 216" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">How long the key is remembered</title>
<desc id="f1-d">Horizontal bars in days: Stripe idempotency keys, at least 1; Adyen idempotency keys, 7 to 14, drawn at 7; a QR ticket in this design, the whole life of the event, drawn at 90 as an example. The ticket bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">Memory of the key, in days</text>
<text x="0" y="36" class="viz-sub">Two payment APIs and one ticket gate</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Stripe</text>
<path d="M176 58 H176.9 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="192" y="73" class="viz-value">1 (at least)</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Adyen</text>
<path d="M176 92 H206.2 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="222" y="107" class="viz-value">7 to 14</text>
<text x="166" y="141" text-anchor="end" class="viz-label">A ticket (this design)</text>
<path d="M176 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="580" y="141" class="viz-value">90</text>
<text x="0" y="176" class="viz-label-muted">The ticket row lives for the event, then is archived; it is never pruned early</text>
</svg>
<figcaption>Source: <a href="https://docs.stripe.com/api/idempotent_requests">Stripe</a> and <a href="https://docs.adyen.com/development-resources/api-idempotency">Adyen</a> documentation for the two API rows; the ticket row is this post's design choice, drawn at 90 days as an example of an event's life.</figcaption>
</figure>

The reason the two systems answer differently is not that one is about money and one is about security. It is that they mean different things by "again". A retried payment request is the same intent arriving twice because a network was unreliable, and the right thing is to make the second arrival invisible. A rescanned ticket is a different intent, a second person trying to use one admission, and the right thing is to make the second arrival fail loudly. Echo or refuse. That is the only branch.

## The mirror rule

So the rule I use now is this. For each endpoint that accepts a client-supplied identifier, decide whether a repeat is echoed or refused, write that decision down, and then store exactly the same three columns either way: the key, the time it was first seen, and the result of the first request. The branch is data, not code. The same table, the same insert, and one flag on the endpoint that says which way the second request goes.

```sql
INSERT INTO seen (key, first_seen, result)
VALUES ($1, now(), $2)
ON CONFLICT (key) DO NOTHING
RETURNING key;
```

If the insert returns a row, this is the first request: execute, store the result, reply. If it returns nothing, the key was seen before: read the stored row, then either echo its result or refuse with its first-seen time. The unique constraint does the work of deciding which request was first, under any concurrency, without a lock the application has to manage. Two requests that arrive in the same millisecond are serialised by the index, one wins, and the other reads the winner's row.

There is one subtlety the payment side handles and the gate side must copy. Between the insert and the stored result, there is a window where the first request has claimed the key but has not finished executing. A second request arriving in that window finds the row but no result. The payment API's answer is to reply with a conflict status and let the client retry after a moment; Stripe documents exactly this case. The gate's answer is the same: refuse with "in progress", which at a gate is a half-second wait, not a problem.

## Two gates, 200 milliseconds apart

The concurrency case is what makes the unique constraint the right home for the decision, and it is worth drawing.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Two gates present the same ticket 200 milliseconds apart</title>
<desc id="f2-d">Three lanes: gate A, the API with its database, and gate B. Gate A's insert succeeds and returns the key, so the API admits. Gate B's insert 200 milliseconds later conflicts and returns nothing, so the API reads the winner's row and refuses, citing gate A and the time.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Gate A</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">API and unique index</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Gate B</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">key T-4471, t = 0 ms</text>
<line x1="100" y1="80" x2="312" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="332" y="106" class="viz-value">INSERT ... ON CONFLICT DO NOTHING</text>
<text x="332" y="122" class="viz-label-muted">returns the key: first</text>
<text x="207" y="150" text-anchor="middle" class="viz-label-muted">admit</text>
<line x1="315" y1="156" x2="103" y2="156" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="190" text-anchor="middle" class="viz-label-muted">key T-4471, t = 200 ms</text>
<line x1="540" y1="196" x2="328" y2="196" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="332" y="222" class="viz-value">INSERT ... ON CONFLICT DO NOTHING</text>
<text x="332" y="238" class="viz-label-muted">returns nothing: read the winner</text>
<text x="432" y="266" text-anchor="middle" class="viz-label-muted">refuse: seen at gate A, 200 ms ago</text>
<line x1="325" y1="272" x2="537" y2="272" class="viz-arrow" marker-end="url(#f2-ah)"/>
</svg>
<figcaption>Illustrative: the same race a payment API resolves with an idempotency key, resolved the other way.</figcaption>
</figure>

For a payment endpoint the diagram is identical except for the last arrow, which would carry the stored result to gate B instead of a refusal. That is the whole point. The infrastructure that makes retried charges safe is the infrastructure that makes replayed tickets fail, and a team that has built one has built the other.

## What the key identifies

The second question is what the key should be, and the two sides answer it the same way once you ask it properly: the key identifies the intent, not the request. A payment client generates a fresh key per attempt at a charge, and reuses it across retries of that same attempt; a new charge gets a new key. If the client instead derived the key from the request body, two legitimately separate charges of the same amount would collide, and the second customer would silently get the first customer's receipt. That failure is quiet, which is what makes it expensive: nothing errors, one payment is simply missing, and the reconciliation happens weeks later in a spreadsheet.

The gate has it easier, because the intent is the admission and the identifier was minted by the server when the ticket was issued. But the same mistake is available: a gate that keys on the phone, or the person, or the booking rather than the ticket admits two tickets from one booking as one, or refuses a family of four on the second child. The key is the ticket, because the ticket is the unit of admission, and everything else is a lookup after the fact.

## How long to remember

The final question is retention, and the mirror rule gives it a clean shape. An echoing endpoint remembers for as long as a client might reasonably retry, which is why Stripe's floor is a day and Adyen's is a week; beyond that, forgetting is safe because the retry that arrives after the window is, by then, a new intent. A refusing endpoint remembers for as long as a replay would still be harmful, and for a ticket that is the life of the event, because a screenshot does not expire on a schedule the attacker knows about. Forgetting early on a refusing endpoint reopens the replay. Remembering forever on an echoing endpoint is merely a storage bill.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Endpoints by second-request behaviour and memory</title>
<desc id="f3-d">A two by two grid. Horizontal axis: what the second request gets, echo on the left and refuse on the right. Vertical axis: how long the key is remembered, a window at the bottom and forever at the top. Bottom left: payment charges. Bottom right: webhook receivers and signed requests. Top right: tickets and one-time codes. Top left: rarely useful.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Rarely worth it</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">a receipt nobody will ask for again</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Tickets, one-time codes</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">forgetting reopens the replay</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Payment charges</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">echo for a day or a week</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Webhooks, signed requests</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">refuse inside the timestamp window</text>
<circle cx="464" cy="80" r="6" class="viz-d1"/>
<circle cx="192" cy="232" r="6" class="viz-dgray"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Second request: echo to refuse</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Memory of the key: a window to forever</text>
</svg>
<figcaption>Illustrative: a placement of common endpoint types; the gold dot is the ticket gate, the grey dot is a payment charge.</figcaption>
</figure>

Webhook receivers sit in the bottom-right cell for a reason worth stating. They refuse repeats, but only within the window their signature's timestamp allows, because outside the window the signature check already rejects the message. Their memory can be short because another mechanism takes over. A ticket has no such mechanism; the row is all there is, and that is why its memory is measured in the life of the event rather than in hours.

## What this bought me

When I built the QR system, the anti-replay requirement arrived as a security feature with a security vocabulary: nonces, replay windows, freshness. Building it as an idempotency key pointed the other way meant it arrived as one table I already knew how to run, one unique constraint the database already knew how to enforce, and two decisions written next to the endpoint: refuse, and remember for the event. The same table now backs the echoing endpoints too, with the flag flipped. Two questions, one primitive, and no separate security subsystem to keep honest.
