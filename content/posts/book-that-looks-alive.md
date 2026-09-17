---
title: A book that looks alive can be dead
date: 2026-09-17
summary: A local order book fed by WebSocket deltas keeps updating while being wrong. One dropped message desynchronises every level it touched, and a live stream proves nothing.
tags: WebSockets, Order Books, CCXT
draft: false
---

An order book maintained from a WebSocket stream has one property that fools everyone the first time: it keeps moving. Updates arrive, levels change, the display flickers with activity, and every one of those signs of life is compatible with the book being wrong. A single dropped message desynchronises every price level the message touched, and every later update to those levels is applied to a base that no longer matches the exchange. Shayanomaly maintains books from five venues, and the second thing I learned building it, after the first thing about fees, was that a stream being alive is not evidence of a book being correct.

## Snapshot plus deltas, and the gap in between

The standard design is a snapshot followed by deltas. Fetch the full book once over REST, then apply a stream of changes: this price level is now this size, this level is gone. The design is efficient and it is fragile at exactly one point, the join between the snapshot and the stream. Binance's [guide to managing a local order book](https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/How-to-manage-a-local-order-book-correctly) spells out the procedure: open the stream first and buffer its events, then fetch the snapshot, discard any buffered event whose final update id is at or below the snapshot's, and apply the rest in order. Each event carries a first and last update id, and the rule for every subsequent event is that its first id must be exactly one more than the id your book is at. If it is greater, you missed an event, and the instruction is unambiguous: discard the book and start again.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Joining a REST snapshot to a delta stream, and detecting a gap</title>
<desc id="f1-d">Three lanes: the local book, the REST snapshot endpoint, and the WebSocket delta stream. The stream is opened first and its events buffered. The snapshot arrives with a last update id. Buffered events at or below that id are discarded; the first event spanning it is applied. A later event whose first id skips ahead is flagged as a gap and the book is rebuilt.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Local book</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">REST snapshot</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Delta stream</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="320" y="70" text-anchor="middle" class="viz-label-muted">open the stream, buffer events</text>
<line x1="540" y1="76" x2="103" y2="76" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="207" y="106" text-anchor="middle" class="viz-label-muted">snapshot, lastUpdateId = 1000</text>
<line x1="315" y1="112" x2="103" y2="112" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="142" text-anchor="middle" class="viz-label-muted">drop buffered events with u at or below 1000</text>
<text x="320" y="172" text-anchor="middle" class="viz-label-muted">apply the event with U at or below 1001 and u above it</text>
<line x1="540" y1="178" x2="103" y2="178" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="208" text-anchor="middle" class="viz-label-muted">next event: U must equal the book's id plus one</text>
<line x1="540" y1="214" x2="103" y2="214" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="248" text-anchor="middle" class="viz-label-muted">U = 1187 when the book is at 1184: a gap</text>
<line x1="540" y1="254" x2="103" y2="254" class="viz-s4" marker-end="url(#f1-ah)"/>
<text x="95" y="282" text-anchor="middle" class="viz-tick">discard, start again</text>
</svg>
<figcaption>Illustrative: the procedure described in <a href="https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/How-to-manage-a-local-order-book-correctly">Binance's local order book guide</a>, with example ids.</figcaption>
</figure>

That last rule is the whole defence, and it depends on the venue sending sequence numbers. Where it does, a gap is detectable the instant it happens. Where it does not, a gap is invisible: the next event arrives, applies cleanly to the levels it names, and the book carries on, alive and wrong.

## Two venues, two integrity mechanisms

Venues differ in what they give you to detect corruption, and a system that streams several of them needs a different rule per venue rather than one integrity check applied everywhere. Binance's mechanism is sequence continuity: the first and last update ids on every event, and the rule that they must chain. Kraken's is a checksum. Its [book channel](https://docs.kraken.com/api/docs/guides/spot-ws-book-v2/) sends a CRC32 with every update, calculated over the top ten price levels on each side of the book regardless of the depth subscribed, so that after applying an update you compute the same checksum over your own top ten and compare. A mismatch means your book has diverged, whether or not a message was lost, and the response is again to resubscribe.

The two mechanisms catch different things. Sequence continuity catches a missing message and nothing else; if a message arrives and is applied wrongly, the sequence is intact and the book is still wrong. A checksum catches any divergence in the top of the book, from any cause, but only in the levels it covers; a corruption deep in the book is invisible to a top-ten checksum until it rises. A venue that offers neither leaves you with one honest option, which is to fetch a fresh snapshot on a timer and accept that between snapshots the book may be wrong for as long as the timer runs.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">What each integrity mechanism detects</title>
<desc id="f2-d">A table with three rows: sequence ids, as on Binance, detect a dropped message immediately but not a misapplied one; a checksum over the top levels, as on Kraken, detects any divergence in those levels from any cause but nothing deeper; a timed resnapshot, for venues with neither, detects nothing between snapshots and corrects everything at each one.</desc>
<text x="0" y="18" class="viz-title">Three ways to know the book is wrong</text>
<text x="20" y="48" class="viz-tick">MECHANISM</text>
<text x="260" y="48" class="viz-tick">CATCHES</text>
<text x="470" y="48" class="viz-tick">MISSES</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Sequence ids</text>
<text x="20" y="100" class="viz-label-muted">Binance depth streams</text>
<text x="260" y="82" class="viz-label-muted">a dropped message, at once</text>
<text x="470" y="82" class="viz-label-muted">a misapplied message</text>
<line x1="0" y1="110" x2="640" y2="110" class="viz-grid"/>
<text x="20" y="136" class="viz-label">Checksum, top levels</text>
<text x="20" y="154" class="viz-label-muted">Kraken book channel, CRC32</text>
<text x="260" y="136" class="viz-label-muted">any divergence in the top ten</text>
<text x="470" y="136" class="viz-label-muted">deeper levels</text>
<line x1="0" y1="164" x2="640" y2="164" class="viz-grid"/>
<text x="20" y="190" class="viz-label">Timed resnapshot</text>
<text x="20" y="208" class="viz-label-muted">venues with neither</text>
<text x="260" y="190" class="viz-label-muted">everything, at each snapshot</text>
<text x="470" y="190" class="viz-label-muted">everything, between them</text>
<line x1="0" y1="218" x2="640" y2="218" class="viz-grid"/>
<text x="0" y="248" class="viz-label-muted">One integrity rule cannot cover five venues; each gets the check its feed supports.</text>
</svg>
<figcaption>Source: mechanisms as documented by <a href="https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/How-to-manage-a-local-order-book-correctly">Binance</a> and <a href="https://docs.kraken.com/api/docs/guides/spot-ws-book-v2/">Kraken</a>; the third row is the fallback for any feed without either.</figcaption>
</figure>

## Where the messages go missing

It is worth being concrete about how a message goes missing, because the mechanisms are mundane and none of them announces itself. A WebSocket connection drops and reconnects, and the stream resumes from now rather than from where it left off; every update during the gap is gone. A client's receive buffer fills during a burst, the library's backpressure handling discards or coalesces, and the book gets the last of a run of updates without the middle. A venue's own infrastructure fails over, and the new server's sequence numbers or snapshots are not the old server's. A message arrives out of order and is applied before its predecessor, which for a delta that says "this level is now zero" followed by one that says "this level is now 5" produces a level that should be empty and is not.

Each of those leaves the stream alive. The connection is open, messages are flowing, the display is moving. Without a per-message check, the only symptom is that the book's numbers drift from the venue's, slowly at first and then, as later updates land on corrupted levels, in ways that compound. A detector reading that book sees spreads that do not exist and misses ones that do, and it has no way to know which of its inputs is lying.

## The book drift score

Detection is necessary and it is not a measurement. What I wanted, once the per-venue checks were in place, was a number that said how often each venue's book had been wrong and for how long, so that the venues could be compared and the gap-handling code could be trusted or not. The number I settled on is the book drift score: per venue, the count of price levels that differ between the locally maintained book and a periodic REST snapshot, taken at an interval and kept as a rolling metric alongside the time since the last resync.

A venue whose drift score is not zero between resyncs has a gap-handling bug, whatever its sequence checks say, because the checks passed and the book still diverged. The score also puts a duration on the damage: the time between the last event that was applied and the snapshot that revealed the drift is how many milliseconds of wrong data the detector tolerated before anyone noticed, and that number goes straight into the age gate that decides whether a quote is fresh enough to act on.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Divergence of a local book after one dropped delta, with and without detection</title>
<desc id="f3-d">Two lines over time after a dropped message at time zero. Without detection, the count of wrong price levels climbs steadily as later updates are applied to a corrupt base, reaching dozens within seconds. With a checksum or sequence check, the count jumps at the drop and falls to zero within one resync interval.</desc>
<text x="0" y="18" class="viz-title">Alive, and increasingly wrong</text>
<text x="0" y="36" class="viz-sub">Wrong price levels after one dropped delta; an illustrative model</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s4"/><text x="400" y="35" class="viz-label-muted">no detection</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s1"/><text x="520" y="35" class="viz-label-muted">with a check</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">40</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">30</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">20</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">drop</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">+1 s</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">+2 s</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">+3 s</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">+4 s</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Time after the dropped message</text>
<polyline points="56,264 60,243 120,222 192,196 260,170 328,144 400,118 464,98 532,80 600,66" class="viz-s4"/>
<polyline points="56,264 60,243 90,243 96,264 600,264" class="viz-s1"/>
<circle cx="600" cy="66" r="4" class="viz-d4"/>
<circle cx="96" cy="264" r="4" class="viz-d1"/>
<text x="108" y="250" class="viz-value">resync, back to zero</text>
<text x="592" y="86" text-anchor="end" class="viz-value">still climbing</text>
</svg>
<figcaption>Illustrative: the shape of divergence under a simple model in which later updates touch levels the dropped message had already changed; not a measured trace.</figcaption>
</figure>

## What the score changed

Three things, in the engine. Each venue got its own integrity rule, matched to what its feed provides, instead of one rule that was right for one venue and decorative for the rest. The resync interval per venue was set from the measured drift rather than from a guess: a venue whose score stayed at zero could be snapshotted rarely, and one whose score twitched got snapshotted often until the cause was found. And the detector stopped trusting liveness. A book is usable when its drift score is zero and its last verified update is younger than the venue's interval, and a book that is merely moving does not qualify.

The general lesson is older than order books. Any local replica fed by a stream of changes has this property: it can be arbitrarily wrong while appearing to be fully up to date, because the appearance comes from the stream and the correctness comes from the base the stream is applied to. Liveness is a fact about the connection. Correctness is a fact about the replica, and it has to be measured against the source, on a schedule, by something other than the stream that is fooling you.
