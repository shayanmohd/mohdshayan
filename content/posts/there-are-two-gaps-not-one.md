---
title: There are two gaps, not one
date: 2026-09-17
summary: Every write-then-publish has two places to crash. The outbox pattern closes only the first, so a team that stops there has traded lost events for duplicated ones.
tags: Event-Driven, PostgreSQL, Reliability
draft: false
---

The bug that teaches most teams about event-driven systems is the lost event: the database commit succeeded, the publish to the broker failed, and a downstream service never learned that an order existed. The fix everybody reaches for is the outbox pattern, and it works. Then a second bug arrives, quieter than the first, and it turns out the fix had moved the problem rather than removed it. There are two gaps in every write-then-publish pipeline, not one, and the outbox closes exactly one of them.

## Gap one: between the commit and the publish

The first gap is the one the outbox is for. A service writes a row and then publishes an event, and between those two actions the process can die, the network can fail, or the broker can refuse. If the write committed and the publish did not, the event is lost. If the publish happened and the write then rolled back, the event describes something that never occurred. The two operations are on different systems and cannot share a transaction.

The outbox closes the gap by putting the event in the same transaction as the row. The service writes the order and, in the same commit, writes an outbox row describing the event. A relay reads the outbox and publishes to the broker, marking rows as sent. Now the event cannot be lost, because it was committed with the data, and it cannot describe a rollback, because it rolled back too. The relay can crash and resume, and it will publish anything it had not marked.

## Gap two: between the side effect and the acknowledgement

Which brings the second gap. The relay published the event, the consumer received it, the consumer sent the confirmation email, and then the consumer crashed before acknowledging the message. The broker, not having seen the acknowledgement, delivers the message again. The consumer sends the email again. The outbox made the event exactly-once in the sense that it exists once in the log. It did nothing for the consumer, whose side effect and whose acknowledgement are, again, on different systems and cannot share a transaction.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The write-then-publish pipeline with both gaps marked</title>
<desc id="f1-d">Five stages left to right: the service writes the row and an outbox row in one transaction; the relay publishes to the broker; the broker delivers to the consumer; the consumer performs its side effect; the consumer acknowledges. Gap one is marked between commit and publish, closed by the outbox. Gap two is marked between the side effect and the acknowledgement, and is not closed by the outbox.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Two places to crash</text>
<text x="0" y="36" class="viz-sub">The outbox closes the first; only an idempotent consumer closes the second</text>
<rect x="8" y="70" width="112" height="56" rx="8" class="viz-box"/>
<text x="64" y="94" text-anchor="middle" class="viz-label">Write row</text>
<text x="64" y="112" text-anchor="middle" class="viz-label-muted">and outbox row</text>
<line x1="122" y1="98" x2="136" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="140" y="70" width="112" height="56" rx="8" class="viz-box"/>
<text x="196" y="94" text-anchor="middle" class="viz-label">Relay</text>
<text x="196" y="112" text-anchor="middle" class="viz-label-muted">publishes</text>
<line x1="254" y1="98" x2="268" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="272" y="70" width="112" height="56" rx="8" class="viz-box"/>
<text x="328" y="94" text-anchor="middle" class="viz-label">Broker</text>
<text x="328" y="112" text-anchor="middle" class="viz-label-muted">delivers</text>
<line x1="386" y1="98" x2="400" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="404" y="70" width="112" height="56" rx="8" class="viz-box"/>
<text x="460" y="94" text-anchor="middle" class="viz-label">Side effect</text>
<text x="460" y="112" text-anchor="middle" class="viz-label-muted">email, charge</text>
<line x1="518" y1="98" x2="532" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="536" y="70" width="96" height="56" rx="8" class="viz-box"/>
<text x="584" y="94" text-anchor="middle" class="viz-label">Ack</text>
<text x="584" y="112" text-anchor="middle" class="viz-label-muted">to broker</text>
<rect x="100" y="150" width="56" height="24" rx="4" class="viz-box-accent"/>
<text x="128" y="167" text-anchor="middle" class="viz-tick">gap 1</text>
<text x="128" y="200" text-anchor="middle" class="viz-label-muted">closed by the outbox</text>
<rect x="496" y="150" width="56" height="24" rx="4" class="viz-box-ink"/>
<text x="524" y="167" text-anchor="middle" class="viz-on-ink">gap 2</text>
<text x="524" y="200" text-anchor="middle" class="viz-label-muted">still open</text>
<text x="320" y="250" text-anchor="middle" class="viz-label-muted">A crash in gap 2 means the side effect happens again when the message is redelivered.</text>
<text x="320" y="276" text-anchor="middle" class="viz-tick">draw both gaps on the diagram before choosing any tooling</text>
</svg>
<figcaption>Illustrative: the pipeline as it exists in any service that writes to a database and publishes to a broker.</figcaption>
</figure>

A team that stops at the outbox has made a trade it did not intend: lost events for duplicated ones. Duplicates are usually less damaging than losses, which is why the trade feels like progress, but a duplicated charge or a duplicated dispatch is still a bug, and it is a bug that appears only under failure, which is the hardest kind to reproduce.

## The two-gap rule

So the rule I apply to every pipeline is short. It is correct only when gap one is closed by a same-transaction record and gap two is closed by a same-transaction dedupe. The first is the outbox row. The second is a processed-message table on the consumer's side: before performing the side effect, the consumer inserts the message id into a table with a unique constraint, in the same transaction as whatever database change the side effect involves. A redelivered message hits the constraint and is acknowledged without being processed. Where the side effect is not a database change, an email, a call to a payment provider, the dedupe key travels with it, as an idempotency key the downstream system honours, and the processed-message row is written when the downstream confirms.

Both gaps get drawn on the sequence diagram before any tooling is chosen, because the tooling conversation is where teams get lost. Which broker, which delivery guarantee, which client library: none of it closes either gap. The gaps are closed by transactions and constraints in the database the service already has, and the broker's job is only to carry messages between them reliably enough that the dedupe table is rarely consulted.

## What the broker's retention buys

The broker still matters, in one specific way: how long it keeps a message the consumer has not acknowledged, which is the safety margin for gap two. A consumer that crashes and is not restarted for a day needs the message to still be there when it comes back. The defaults differ widely: Kafka's [log.retention.hours](https://kafka.apache.org/documentation/#brokerconfigs_log.retention.hours) is 168, a week; Amazon SQS keeps a message for [four days](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-basic-architecture.html) unless told otherwise; Google Pub/Sub's [subscription default](https://cloud.google.com/pubsub/docs/subscription-properties) is seven days; and Redis Pub/Sub keeps nothing at all.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Default message retention across common brokers</title>
<desc id="f2-d">Horizontal bars in hours: Redis Pub/Sub, zero, messages are dropped if no subscriber is connected; Amazon SQS, 96 hours, four days; Kafka, 168 hours, seven days; Google Pub/Sub, 168 hours, seven days. Redis Streams retain until trimmed and are shown as unbounded.</desc>
<text x="0" y="18" class="viz-title">How long the safety margin lasts by default</text>
<text x="0" y="36" class="viz-sub">Default retention of an unacknowledged message, hours</text>
<rect x="420" y="24" width="12" height="12" rx="3" class="viz-f1"/><text x="438" y="35" class="viz-label-muted">a week</text>
<rect x="500" y="24" width="12" height="12" rx="3" class="viz-f4"/><text x="518" y="35" class="viz-label-muted">no margin</text>
<line x1="176" y1="52" x2="176" y2="222" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Redis Pub/Sub</text>
<rect x="176" y="58" width="3" height="20" class="viz-f4"/>
<text x="192" y="73" class="viz-value">0: dropped if nobody is listening</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Amazon SQS</text>
<path d="M176 92 H418 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="438" y="107" class="viz-value">96</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Kafka</text>
<path d="M176 126 H600 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="596" y="121" text-anchor="end" class="viz-value">168</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Google Pub/Sub</text>
<path d="M176 160 H600 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="596" y="155" text-anchor="end" class="viz-value">168</text>
<text x="166" y="209" text-anchor="end" class="viz-label">Redis Streams</text>
<path d="M176 194 H600 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="596" y="189" text-anchor="end" class="viz-value">until trimmed</text>
</svg>
<figcaption>Source: <a href="https://redis.io/docs/latest/develop/interact/pubsub/">Redis Pub/Sub</a> and <a href="https://redis.io/docs/latest/develop/data-types/streams/">Streams</a> documentation, the <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-basic-architecture.html">SQS developer guide</a>, Kafka's <a href="https://kafka.apache.org/documentation/#brokerconfigs_log.retention.hours">log.retention.hours</a> default, and <a href="https://cloud.google.com/pubsub/docs/subscription-properties">Pub/Sub subscription properties</a>.</figcaption>
</figure>

The first bar is the one to notice. Redis Pub/Sub delivers to whoever is connected at the instant of publication and keeps nothing, so for a consumer that was down at that instant the safety margin is zero and gap two is not a gap; it is a hole. That is the right behaviour for a dashboard tick and the wrong one for an order event, and choosing between Pub/Sub and Streams is exactly the question of whether a missed message still costs something after the next one arrives. The other brokers give days, which is long enough for a consumer to be repaired, provided the consumer is idempotent when it comes back.

## The dedupe key is the hard part

The processed-message table is simple to describe and has one design decision that decides whether it works: what the key is. The obvious choice, the broker's message id, is wrong in the case that matters. If the relay crashes after publishing but before marking the outbox row as sent, it will publish the same event again with a new message id, and a consumer keyed on message id will process both. The key has to be the event's own identity, minted when the outbox row was written and carried through every hop unchanged: the order id plus the event type plus a sequence, or a UUID generated at the point of the original commit. Then two publishes of one event collide on the same key, wherever in the pipeline the duplication happened.

That is the same lesson as [idempotency keys](/blog/idempotency-keys-pointed-other-way/) in an API: the key identifies the intent, not the delivery attempt. A consumer that keys on the attempt is idempotent against the broker's retries and nothing else.

## Four outcomes

Closing neither gap, one, or both produces four systems, and each has a failure with a name.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The four outcomes of closing neither, one or both gaps</title>
<desc id="f3-d">A two by two grid. Horizontal axis: gap one closed, no on the left and yes on the right. Vertical axis: gap two closed, no at the bottom and yes at the top. Bottom left: lost and duplicated events. Bottom right: events never lost but duplicated on redelivery; the outbox alone. Top left: no duplicates but events can be lost; a careful consumer behind a leaky publisher. Top right: correct.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Lost, never duplicated</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">careful consumer, leaky publisher</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Correct</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">outbox and idempotent consumer</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Lost and duplicated</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">the starting point</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Duplicated, never lost</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">the outbox alone: where most teams stop</text>
<circle cx="464" cy="80" r="6" class="viz-d1"/>
<circle cx="464" cy="300" r="6" class="viz-dgray"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Gap one closed by an outbox: no to yes</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Gap two closed by a same-transaction dedupe: no to yes</text>
</svg>
<figcaption>Illustrative: the grey dot is where the first bug's fix leaves a system; the gold dot is where the rule requires it to be.</figcaption>
</figure>

SocialSure's services are event-driven, and the honest description of how they got to the top-right cell is that they visited the bottom-right one first. The outbox went in after a lost event; the processed-message table went in after the duplicate that the outbox made possible. The second fix was smaller than the first and later, which is the wrong order, and the two-gap rule exists so that the next pipeline gets both on the first day.

## What the rule does not say

It does not say exactly-once. Exactly-once delivery between independent systems is not a property a broker can provide, and the vendors that claim it are describing their own internal semantics, not the edge between your database and your email provider. What the rule provides is effectively-once: the event exists once in the log, and the side effect happens once because repeats are recognised and discarded. That is the property a business needs, and it is built from two transactions and two constraints, not from a delivery guarantee.

It also does not say the dedupe table can be forgotten. The processed-message rows have to live at least as long as the broker's retention, because a message can be redelivered for as long as the broker keeps it, and a dedupe table pruned before the broker's window closes reopens gap two for the tail. The retention chart above is the minimum age of the rows, and it is one more reason the broker's default matters.

Draw both gaps. Close both with the database. Then pick the broker, and set its retention to the length of the repair you might one day need.
