---
title: Your backtest saw the next tick
date: 2026-09-17
summary: Most leakage in time-ordered data is not a leaked column but a leaked clock. Features joined by when an event happened, not when your system could have known it, leak the future.
tags: Evaluation, Data Leakage, Time Series
draft: false
---

The first arbitrage detector I evaluated on recorded data was extraordinary. It found spreads everywhere, it closed them at the quoted prices, and its backtested returns were the kind that make you check the code for a sign error. There was no sign error. There was a clock error, and it is the same clock error that sits inside most leaky models on time-ordered data: the features were aligned by the time an event happened, not by the time my system could have known about it.

## Two timestamps on every event

Every event in a time-ordered system has two times. The first is when it happened: the exchange matched the trade, the sensor read the value, the customer clicked the button. The second is when it became knowable to you: when the message arrived over the wire, when the batch job ran, when the record was written. The gap between them is latency, and it is never zero. Shayanomaly streams order books from five venues, and each message carries the exchange's timestamp and a local receipt time, and the two are never equal. The [hftbacktest documentation](https://hftbacktest.readthedocs.io/en/latest/data.html) builds its whole data model on this distinction, with an exchange timestamp and a local timestamp on every row and the feed latency defined as the difference.

<figure class="chart">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">One event, two timestamps, and the window in between</title>
<desc id="f1-d">A horizontal timeline for a single price update. A marker labelled happened-at, when the exchange matched it. A later marker labelled knowable-at, when the message arrived locally. Between them, a shaded window in which a backtest aligned by the exchange time believes it knew the price, and did not. A decision-time marker inside the window shows the leak.</desc>
<text x="0" y="18" class="viz-title">The window your backtest lived in</text>
<text x="0" y="36" class="viz-sub">A single price update as two moments, not one</text>
<circle cx="440" cy="31" r="4" class="viz-d1"/><text x="450" y="35" class="viz-label-muted">timestamps</text>
<circle cx="550" cy="31" r="4" class="viz-d4"/><text x="560" y="35" class="viz-label-muted">the leak</text>
<line x1="40" y1="110" x2="600" y2="110" class="viz-axis"/>
<rect x="160" y="70" width="240" height="80" class="viz-band"/>
<circle cx="160" cy="110" r="6" class="viz-d1"/>
<text x="160" y="52" text-anchor="middle" class="viz-label">happened-at</text>
<text x="160" y="176" text-anchor="middle" class="viz-tick">exchange timestamp</text>
<circle cx="400" cy="110" r="6" class="viz-d1"/>
<text x="400" y="52" text-anchor="middle" class="viz-label">knowable-at</text>
<text x="400" y="176" text-anchor="middle" class="viz-tick">local receipt time</text>
<circle cx="280" cy="110" r="5" class="viz-d4"/>
<text x="280" y="98" text-anchor="middle" class="viz-value">decision here uses a price not yet received</text>
<text x="500" y="98" text-anchor="middle" class="viz-label-muted">safe to use from here</text>
</svg>
<figcaption>Illustrative: the two-timestamp model described in the <a href="https://hftbacktest.readthedocs.io/en/latest/data.html">hftbacktest data documentation</a>, drawn for one event.</figcaption>
</figure>

A backtest that aligns everything by the exchange timestamp is a backtest in which every decision is made with information that had not yet arrived. The spreads it finds are real in the sense that the two venues really did quote those prices at those instants. They are not real in the sense that matters, which is that no system connected to those venues could have seen both quotes at the instant the backtest assumes. The detector saw the next tick, and it saw it on every trade.

## The knowable-at clock

The fix generalises far beyond trading, and I keep it as a rule about tables rather than a rule about markets. Every feature carries two timestamps: happened-at and knowable-at. A training row, or a backtest decision, may use only features whose knowable-at precedes the row's decision time. Not its happened-at. Its knowable-at.

Stated that way, the familiar kinds of leakage are all the same mistake. A random train-test split on time-ordered data puts rows whose knowable-at is in the future into training. A feature built from a full-series statistic, a mean or a standard deviation over the whole history, has a knowable-at at the end of the series, and every row before that is using it early. A label that is corrected weeks after the event, a chargeback, a cancelled order, a revised earnings figure, has a knowable-at weeks after its happened-at, and a model trained on the corrected label learns from a future it will not have in production. Order books aligned by exchange time are the fast version of the same thing.

The check is three lines of SQL against any feature table that carries both columns, and I run it as a test.

```sql
SELECT count(*) AS violations
FROM training_rows r JOIN feature_values f USING (entity_id)
WHERE f.knowable_at > r.decision_time
  AND f.happened_at <= r.decision_time;
```

The second condition is the interesting one. Features whose happened-at is also after the decision time are the obvious future, and most pipelines already exclude them. The rows this query finds are the ones that happened before the decision and became knowable after it: the slow labels, the late-arriving messages, the statistics computed at the end. Those are the leaks nobody looks for, because by the happened-at clock they look fine.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Four kinds of leakage, one clock error</title>
<desc id="f2-d">A two column table. Left, the familiar name: random split, full-series feature, corrected label, exchange-time alignment. Right, the same thing stated by the knowable-at clock: future rows in training; a feature knowable only at the end of the series; a label knowable weeks after the event; a price knowable only after network latency.</desc>
<text x="0" y="18" class="viz-title">Different names, the same mistake</text>
<text x="20" y="48" class="viz-tick">THE FAMILIAR NAME</text>
<text x="340" y="48" class="viz-tick">BY THE KNOWABLE-AT CLOCK</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<line x1="320" y1="56" x2="320" y2="250" class="viz-grid"/>
<text x="20" y="82" class="viz-label">Random train-test split</text>
<text x="340" y="82" class="viz-label">Future rows placed in training</text>
<line x1="0" y1="92" x2="640" y2="92" class="viz-grid"/>
<text x="20" y="114" class="viz-label">Full-series statistic as a feature</text>
<text x="340" y="114" class="viz-label">Knowable only at the end of the series</text>
<line x1="0" y1="124" x2="640" y2="124" class="viz-grid"/>
<text x="20" y="146" class="viz-label">Corrected or revised label</text>
<text x="340" y="146" class="viz-label">Knowable weeks after it happened</text>
<line x1="0" y1="156" x2="640" y2="156" class="viz-grid"/>
<text x="20" y="178" class="viz-label">Exchange-time alignment</text>
<text x="340" y="178" class="viz-label">Knowable only after the feed latency</text>
<line x1="0" y1="188" x2="640" y2="188" class="viz-grid"/>
<text x="20" y="210" class="viz-label">Model with a training cutoff</text>
<text x="340" y="210" class="viz-label">Knowable-at is the training corpus</text>
<line x1="0" y1="220" x2="640" y2="220" class="viz-grid"/>
<text x="20" y="242" class="viz-label-muted">A chronological split alone catches only the first row.</text>
</svg>
<figcaption>Illustrative: the mapping this post uses; each row is a case the three-line check finds.</figcaption>
</figure>

## Why the chronological split is not enough

The standard defence against leakage on time-ordered data is to split by time: train on everything before a date, test on everything after. It is necessary and it is the first row of the table. It does nothing about the other rows. A feature computed over the whole training period, a mean of the last year's prices, say, is used by every training row including the ones at the start of the year, whose knowable-at for that feature was months in their future. The model learns a relationship between a row and a statistic the row could not have seen, the relationship holds in the test period too because the statistic was computed there as well, and the chronological split passes the leak straight through.

The same happens with labels that are revised. A fraud label finalised sixty days after the transaction is, for the last sixty days of the training window, a label from the test period. A chronological split at the boundary counts those rows as clean. The knowable-at clock counts them as leaks, and it is right, because in production the model will have to score today's transaction without knowing what the investigators will decide in two months.

## The newest version of the old bug

The last row of that table is the one that has arrived with language models, and it is worth spelling out because it is the same clock error at a new scale. A model's knowable-at is its training corpus, which extends up to a cutoff date, and a backtest that asks the model to forecast events before its cutoff is asking it to recall rather than to predict. A 2026 study of [temporal leakage in LLM backtesting](https://arxiv.org/abs/2608.02985) shows that the usual check, comparing scores before and after the cutoff, is not enough: models legitimately know more about the period near their cutoff, so recency looks like leakage and leakage looks like recency, and the authors argue that only a matched clean control separates the two.

That is the knowable-at clock applied to a feature whose knowable-at is fuzzy, and the lesson is the same as for the order book. If you cannot say when the system could have known something, you cannot say whether the backtest is honest, and the default assumption should be that it is not.

## What the fix looked like

For the arbitrage detector the fix was mechanical once the clock was named. Every message got its receipt time as the primary time, the exchange time was kept as a field for measuring latency, and the backtest replayed messages in receipt order, so that at every decision the detector saw exactly the set of quotes that had arrived by then. The spreads shrank, the returns fell to something believable, and the thing that remained was the actual edge: the moments when one venue's message arrived materially before another's, which is a property of network paths rather than of prices, and which is measurable.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Backtested edge under exchange-time and receipt-time alignment</title>
<desc id="f3-d">Two horizontal bars. Aligned by exchange time, the apparent spread captured per trade is large. Aligned by receipt time, it is a small fraction of that. The difference is the part of the edge that never existed for any real system.</desc>
<text x="0" y="18" class="viz-title">How much of the edge was the clock</text>
<text x="0" y="36" class="viz-sub">Apparent captured spread per trade, two alignments; an illustrative ratio</text>
<line x1="176" y1="52" x2="176" y2="120" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">By exchange time</text>
<path d="M176 58 H564 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="580" y="73" class="viz-value">100</text>
<text x="166" y="107" text-anchor="end" class="viz-label">By receipt time</text>
<path d="M176 92 H231 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="247" y="107" class="viz-value">a small fraction</text>
<text x="0" y="160" class="viz-label-muted">The grey bar is what the detector reported. The gold bar is what any</text>
<text x="0" y="180" class="viz-label-muted">system connected to the venues could actually have captured.</text>
<text x="0" y="212" class="viz-label-muted">The gap between them was never edge. It was latency, counted as profit.</text>
<text x="0" y="250" class="viz-tick">drawn as a ratio; no measured returns are claimed</text>
</svg>
<figcaption>Illustrative: the shape of the correction, not measured results from any strategy.</figcaption>
</figure>

## Two columns, always

The rule I carry from this into every time-ordered dataset is a schema rule, and it is cheap: every feature table has both columns, happened-at and knowable-at, and the second is never defaulted to the first. For a sensor reading, knowable-at is when the reading was written to the store. For a label, it is when the label became final. For a market message, it is the local receipt time. For anything computed, it is the time the computation ran, over data that itself had knowable-at values before it.

Then the three-line check runs in CI, against every feature table, and a count above zero fails the build. It has caught more leakage than any chronological split ever did, because the chronological split protects against one row of that table and the clock protects against all of them.
