---
title: Five order books, one frame budget
date: 2026-09-08
summary: A terminal on five venues receives more order-book updates than it can paint; rendering per message freezes the tab when a trader needs it. The unit of work is the frame.
tags: WebSockets, Realtime, Frontend Performance
topic: Backend Architecture
draft: false
---

A browser has one budget that matters for anything that moves: roughly sixteen milliseconds per frame at sixty frames a second, shared between everything the page wants to do. An order-book feed from a busy exchange does not know about that budget. It sends an update whenever the exchange's own cadence says to, and when a trading terminal is subscribed to five venues at once, the updates arrive faster than frames do, at exactly the moments, a spike or a cascade of liquidations, when the trader most needs the screen to keep up. Rendering per message is the natural first implementation and it guarantees a frozen tab in those moments. The fix is to change the unit of work from the message to the frame.

## How fast the feeds actually are

The venues publish their cadences, and they differ by an order of magnitude. Binance's [diff depth stream](https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams) offers updates every 1,000 milliseconds or every 100. Bybit's [order book topic](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook) pushes the top level every 10 milliseconds, fifty levels every 20, two hundred every 100 and a thousand every 200. Kraken's [book channel](https://docs.kraken.com/api/docs/websocket-v2/book) sends an update per event with no fixed interval, and notes that one message may carry several changes to the same price level. Coinbase's [level2 channel](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels) is a snapshot followed by incremental updates, again without a published cadence. Converted to a sixty-hertz frame, the fastest documented tier alone delivers more than one message per frame.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Documented order-book update cadence per venue, converted to updates per 16.7 millisecond frame</title>
<desc id="f1-d">Horizontal bars, updates per frame: Bybit top level at 10 milliseconds, 1.67; Bybit fifty levels at 20 milliseconds, 0.83; Binance at 100 milliseconds, 0.17; Bybit two hundred levels at 100 milliseconds, 0.17; Binance at 1,000 milliseconds, 0.02. Kraken and Coinbase are per event and shown as unbounded. A marker at 1.0 is the line above which coalescing is required.</desc>
<text x="0" y="18" class="viz-title">One venue can already exceed a frame</text>
<text x="0" y="36" class="viz-sub">Order-book updates per 60 Hz frame, from each venue's documented push interval</text>
<line x1="216" y1="52" x2="216" y2="256" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">Bybit, top level, 10 ms</text>
<path d="M216 58 H550 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-f4"/>
<text x="570" y="73" class="viz-value">1.67</text>
<text x="206" y="107" text-anchor="end" class="viz-label">Bybit, 50 levels, 20 ms</text>
<path d="M216 92 H382 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="402" y="107" class="viz-value">0.83</text>
<text x="206" y="141" text-anchor="end" class="viz-label">Binance, 100 ms</text>
<path d="M216 126 H250 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="270" y="141" class="viz-value">0.17</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Bybit, 200 levels, 100 ms</text>
<path d="M216 160 H250 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="270" y="175" class="viz-value">0.17</text>
<text x="206" y="209" text-anchor="end" class="viz-label">Binance, 1,000 ms</text>
<path d="M216 194 H220 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H216 Z" class="viz-f1"/>
<text x="240" y="209" class="viz-value">0.02</text>
<text x="206" y="243" text-anchor="end" class="viz-label">Kraken, Coinbase</text>
<text x="226" y="243" class="viz-label-muted">per event, no ceiling; bursts follow the market</text>
<line x1="416" y1="52" x2="416" y2="256" class="viz-s4"/>
<text x="422" y="274" class="viz-label-muted">1.0: coalesce above this</text>
<rect x="0" y="286" width="12" height="12" rx="3" class="viz-f4"/><text x="18" y="297" class="viz-label-muted">over one per frame</text>
<rect x="160" y="286" width="12" height="12" rx="3" class="viz-f1"/><text x="178" y="297" class="viz-label-muted">under one per frame</text>
</svg>
<figcaption>Source: the WebSocket documentation of <a href="https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams">Binance</a>, <a href="https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook">Bybit</a>, <a href="https://docs.kraken.com/api/docs/websocket-v2/book">Kraken</a> and <a href="https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels">Coinbase</a>, September 2026; per-frame values are the author's conversion at 16.7 ms per frame.</figcaption>
</figure>

Two things in the chart matter more than the individual bars. The first is that the venues with no published cadence, the per-event feeds, are the ones that burst hardest, because a burst of orders is a burst of messages, and the burst arrives when the market is moving. The second is that the numbers add. Five venues at their mid tiers, each under one update per frame on its own, sum to more than one per frame together, and a terminal that renders each message has no way to know that the sum has crossed the line until the tab is already behind.

## The frame quotient

The number to watch is the frame quotient: updates received per animation frame, per venue and in total. Below one, rendering per message is harmless, because there is at most one render per frame anyway. Above one, the page is doing more layout work than it can finish before the next frame is due, the work queues, and the queue grows until the tab stutters or the browser throttles the timer. The quotient is measured, not assumed: count messages arriving between two animation frame callbacks and divide.

The rule that follows has three parts. When the quotient is under one you may render per message. When it is over one you must coalesce: fold every update that arrived since the last frame into the book's state and paint once per frame. And when the age of the oldest unprocessed message exceeds two frames, stop draining deltas and ask the venue for a fresh snapshot, because you are now spending frames catching up on history the screen will never show, and a snapshot replaces the whole backlog in one message.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">From WebSocket to screen with a per-frame coalescer and the snapshot escape hatch</title>
<desc id="f2-d">A flow: WebSocket messages arrive into a queue; a coalescer runs once per animation frame, applies every queued delta to the book state and paints once; a monitor checks the queue's age and, if the oldest message is older than two frames, discards the queue and requests a snapshot from the venue, which resets the state in one message.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Fold, then paint once</text>
<rect x="8" y="60" width="130" height="60" rx="8" class="viz-box"/>
<text x="73" y="86" text-anchor="middle" class="viz-label">WebSocket</text>
<text x="73" y="104" text-anchor="middle" class="viz-label-muted">deltas arrive</text>
<line x1="140" y1="90" x2="160" y2="90" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="164" y="60" width="130" height="60" rx="8" class="viz-box"/>
<text x="229" y="86" text-anchor="middle" class="viz-label">Queue</text>
<text x="229" y="104" text-anchor="middle" class="viz-label-muted">with arrival times</text>
<line x1="296" y1="90" x2="316" y2="90" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="320" y="60" width="160" height="60" rx="8" class="viz-box-accent"/>
<text x="400" y="86" text-anchor="middle" class="viz-label">Coalescer, per frame</text>
<text x="400" y="104" text-anchor="middle" class="viz-label-muted">apply all, paint once</text>
<line x1="482" y1="90" x2="502" y2="90" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="506" y="60" width="126" height="60" rx="8" class="viz-box-ink"/>
<text x="569" y="86" text-anchor="middle" class="viz-on-ink">Screen</text>
<text x="569" y="104" text-anchor="middle" class="viz-on-ink">one paint a frame</text>
<path d="M229 122 V170 H400 V122" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="314" y="190" text-anchor="middle" class="viz-tick">oldest message older than two frames?</text>
<rect x="164" y="204" width="316" height="34" rx="8" class="viz-box"/>
<text x="322" y="226" text-anchor="middle" class="viz-label">drop the queue, request a snapshot, resume</text>
</svg>
<figcaption>Illustrative: the pipeline as built for a terminal subscribed to several venues; the two-frame threshold is the design's choice.</figcaption>
</figure>

## Why a snapshot beats draining

The instinct when behind is to work harder: process the queue faster, skip the paint, catch up. It is the wrong instinct because the deltas describe a path the screen will never display. If two hundred updates arrived during a stall, applying all two hundred produces the same final book as one snapshot taken now, at two hundred times the cost, and every one of those frames is a frame during which new deltas keep arriving. The snapshot flip is what makes the backlog bounded: whatever happened during the stall, recovery is one message and one paint.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Queue age over time during a burst, draining deltas versus flipping to a snapshot</title>
<desc id="f3-d">Two lines over time. In delta mode, the age of the oldest unprocessed message rises through the burst and keeps rising after it, because the page cannot catch up. In snapshot mode, the age rises to the two-frame threshold, then drops to zero when the snapshot arrives, and stays low. A horizontal marker shows the two-frame threshold.</desc>
<text x="0" y="18" class="viz-title">The backlog you drain versus the backlog you replace</text>
<text x="0" y="36" class="viz-sub">Age of the oldest queued message in frames during a burst</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s4"/><text x="400" y="35" class="viz-label-muted">drain deltas</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s1"/><text x="520" y="35" class="viz-label-muted">snapshot flip</text>
<line x1="56" y1="60" x2="600" y2="60" class="viz-grid"/><text x="48" y="64" text-anchor="end" class="viz-tick">12</text>
<line x1="56" y1="112" x2="600" y2="112" class="viz-grid"/><text x="48" y="116" text-anchor="end" class="viz-tick">8</text>
<line x1="56" y1="164" x2="600" y2="164" class="viz-grid"/><text x="48" y="168" text-anchor="end" class="viz-tick">4</text>
<line x1="56" y1="216" x2="600" y2="216" class="viz-axis"/><text x="48" y="220" text-anchor="end" class="viz-tick">0</text>
<line x1="56" y1="190" x2="600" y2="190" class="viz-s4" stroke-dasharray="4 4"/>
<text x="600" y="186" text-anchor="end" class="viz-tick">two-frame threshold</text>
<polyline points="56,216 130,214 170,200 210,170 250,130 290,100 330,84 370,78 410,80 450,84 490,86 530,88 600,90" class="viz-s4"/>
<polyline points="56,216 130,214 170,200 200,190 204,216 240,208 270,190 274,216 330,212 370,214 410,212 450,214 600,214" class="viz-s1"/>
<text x="328" y="244" text-anchor="middle" class="viz-tick">burst begins</text>
<text x="328" y="276" text-anchor="middle" class="viz-label-muted">Draining never catches up; the flip resets the age to zero in one message.</text>
</svg>
<figcaption>Illustrative: the shape of the two strategies during a burst; the curves are drawn to show the behaviour, not measured.</figcaption>
</figure>

## Measuring the quotient

The measurement is two counters. The message handler increments a per-venue count on every arrival and stamps the arrival time; the animation frame callback reads the counts, divides by the frames elapsed, resets, and keeps a short rolling window so that a one-frame spike does not flip the mode. The quotient during a quiet market is a fraction; during an announcement it can be several, from a single per-event venue, for a few seconds at a time. The design has to be right for those seconds, because the quiet minutes were never the problem.

Two edge cases shape the implementation more than the steady state. The first is the background tab. Browsers stop or heavily throttle animation frames when a tab is hidden, so a terminal left in a background tab for ten minutes accumulates ten minutes of deltas that no frame will ever drain; on the visibility change back to the foreground the correct move is to discard every queue and request snapshots from every venue, which is the same escape hatch triggered by a different cause. The second is the engine behind the browser. A Node.js process that fans the venues in can coalesce on a fixed tick before forwarding, which caps the browser's quotient at the tick rate at the cost of adding up to one tick of latency to what the screen shows. For a terminal, a tick of twenty or thirty milliseconds is invisible to a human and halves the worst-case work in the tab; for anything that acts on the book automatically, the tick is latency and belongs elsewhere.

## What the terminal does with this

In the terminal I built, which streams books from five exchanges over WebSockets with a Node.js engine behind the browser, the frame quotient is a number on the diagnostics panel, per venue and in total, and it is the number I watch when something feels slow. The coalescer is small: each incoming delta is appended to a per-venue queue with its arrival time; a single requestAnimationFrame loop drains every queue into the book state and triggers one render; and a check at the top of the loop compares the oldest arrival time to the current frame and flips that venue into snapshot mode if the gap is over two frames. The venues that publish snapshots on request make the flip a single subscribe message; for the ones that do not, the flip is a resubscribe, which costs a round trip and is still cheaper than the backlog.

Two details took longer than the design. The first is that the book state and the rendered state have to be separate: the coalescer updates a data structure, and the render reads it, so that folding two hundred deltas costs two hundred map updates and one layout rather than two hundred layouts. The second is that the diagnostics themselves must not be rendered per message, which is the same bug in a smaller room; the quotient is computed per frame and displayed per second.

The general lesson is older than trading terminals. Any client that consumes a feed faster than it can draw has to decide whether its unit of work is the message or the frame, and the message is the wrong answer whenever the quotient can exceed one. The frame quotient gives that decision a number, the coalescer gives it a mechanism, and the snapshot flip gives it a way back when the mechanism falls behind.
