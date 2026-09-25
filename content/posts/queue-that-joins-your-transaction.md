---
title: The queue that joins your transaction
date: 2026-02-27
summary: The reason to run background jobs from a Postgres table is not that it is cheaper than Redis. It is that the enqueue can share a transaction with the row that caused it.
tags: PostgreSQL, Background Jobs, Redis
topic: Backend Architecture
draft: false
---

The argument about where background jobs should live is usually conducted in the wrong units. One side says Redis is faster and built for it; the other says Postgres is already there and one fewer thing to run. Both are true and neither is the reason to choose. The reason to run jobs from a Postgres table is that the enqueue can sit in the same transaction as the row that caused it: the order is inserted and the job to email its confirmation is inserted in one commit, and if the commit fails, neither exists. No external broker can offer that, however fast it is, because it is not in the transaction. The folklore about throughput, meanwhile, is wrong by two orders of magnitude in both directions, so it should not be what decides anything.

## The same-transaction test

Every job type answers one question: must this job not exist if the write that caused it rolled back? For a confirmation email, yes: an email about an order that was never saved is a bug. For a search-index update, yes: indexing a document that does not exist produces a phantom result. For a nightly report, no: it is scheduled by the clock, not by a write. For a cache warm, no: a warm for a row that did not commit is wasted work and nothing worse.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The same-transaction test as a decision flow, with a vacuum tiebreak</title>
<desc id="f1-d">A flow. For each job type: must the job not exist if the causing write rolled back? If yes, the job goes in a Postgres table, enqueued in the same transaction. If no, either store works, and the tiebreak is whether the jobs table's dead-tuple rate would outrun autovacuum; if it would, use the external broker; if not, the table is fine.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Atomicity first, vacuum second, speed not at all</text>
<rect x="8" y="60" width="200" height="64" rx="8" class="viz-box-accent"/>
<text x="108" y="86" text-anchor="middle" class="viz-label">Must not exist if the</text>
<text x="108" y="104" text-anchor="middle" class="viz-label">causing write rolled back?</text>
<line x1="210" y1="92" x2="246" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="228" y="82" text-anchor="middle" class="viz-tick">yes</text>
<rect x="250" y="60" width="160" height="64" rx="8" class="viz-box-ink"/>
<text x="330" y="86" text-anchor="middle" class="viz-on-ink">Postgres jobs table</text>
<text x="330" y="104" text-anchor="middle" class="viz-on-ink">same transaction</text>
<line x1="108" y1="126" x2="108" y2="170" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="124" y="152" class="viz-tick">no</text>
<rect x="8" y="174" width="200" height="64" rx="8" class="viz-box-accent"/>
<text x="108" y="200" text-anchor="middle" class="viz-label">Would dead tuples</text>
<text x="108" y="218" text-anchor="middle" class="viz-label">outrun autovacuum?</text>
<line x1="210" y1="206" x2="246" y2="206" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="228" y="196" text-anchor="middle" class="viz-tick">yes</text>
<rect x="250" y="174" width="160" height="64" rx="8" class="viz-box"/>
<text x="330" y="200" text-anchor="middle" class="viz-label">External broker</text>
<text x="330" y="218" text-anchor="middle" class="viz-label-muted">Redis, or a queue service</text>
<line x1="412" y1="206" x2="448" y2="206" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="430" y="196" text-anchor="middle" class="viz-tick">no</text>
<rect x="452" y="174" width="180" height="64" rx="8" class="viz-box"/>
<text x="542" y="200" text-anchor="middle" class="viz-label">Either store</text>
<text x="542" y="218" text-anchor="middle" class="viz-label-muted">the table, one fewer thing</text>
<text x="320" y="276" text-anchor="middle" class="viz-label-muted">Throughput is absent from the flow: at any realistic rate both stores have plenty.</text>
</svg>
<figcaption>Illustrative: the decision as I apply it per job type; the vacuum tiebreak is discussed below.</figcaption>
</figure>

For the yes answers, the table is not a preference; it is the only design that is correct without a second mechanism. Any external broker requires the transactional outbox pattern to get the same guarantee: write the intent to a table in the transaction, then have a relay copy it to the broker afterwards. That is a jobs table with an extra hop. If you are going to have the table anyway, the question is whether the hop buys anything, and for most workloads it does not.

## The folklore is wrong both ways

The reason people reach for the broker is a number that circulates in blog posts and conference talks: that a Postgres queue tops out somewhere in the low hundreds of jobs per second. The number is not from any measurement I can find, and the measurements that exist say something else. Graphile Worker, a mature Postgres-backed job runner, publishes [performance figures](https://worker.graphile.org/docs/performance): about 202,000 jobs queued per second from a single batched add call, about 183,000 jobs processed per second with batching enabled and 24 concurrent jobs per worker, and around 15,600 per second without batching, on a desktop processor with the database local, with an average latency from enqueue to execution start of about four milliseconds.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Measured throughput of a Postgres-backed queue against the folk number, jobs per second on a log scale</title>
<desc id="f2-d">Horizontal bars on a log scale: the folk number repeated in blog posts, about 200 jobs per second; Graphile Worker without batching, about 15,600 processed per second; with batching, about 183,000 processed per second; queued per second with a batched add, about 202,000. The folk number is three orders of magnitude below the measured figures.</desc>
<text x="0" y="18" class="viz-title">The folk number is off by three orders of magnitude</text>
<text x="0" y="36" class="viz-sub">Jobs per second, log scale from 100 to 1,000,000</text>
<rect x="400" y="26" width="12" height="12" rx="3" class="viz-f4"/><text x="418" y="37" class="viz-label-muted">repeated claim</text>
<rect x="530" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="548" y="37" class="viz-label-muted">measured</text>
<line x1="196" y1="52" x2="196" y2="188" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">The folk number</text>
<path d="M196 58 H226 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-f4"/>
<text x="246" y="73" class="viz-value">about 200, unsourced</text>
<text x="186" y="107" text-anchor="end" class="viz-label">Graphile, unbatched</text>
<path d="M196 92 H414 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="434" y="107" class="viz-value">15,600 processed</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Graphile, batched</text>
<path d="M196 126 H520 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="540" y="141" class="viz-value">183,000</text>
<text x="186" y="175" text-anchor="end" class="viz-label">Graphile, queued</text>
<path d="M196 160 H525 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="545" y="175" class="viz-value">202,000</text>
<text x="0" y="222" class="viz-label-muted">A hundred pixels per decade; measured on one desktop with a local database.</text>
<text x="0" y="246" class="viz-tick">a networked production database will be slower, and still nowhere near the folk number</text>
</svg>
<figcaption>Source: Graphile Worker's <a href="https://worker.graphile.org/docs/performance">performance page</a> for the measured bars; the folk number is the figure commonly repeated without measurement, shown for scale.</figcaption>
</figure>

That is the first direction the folklore is wrong: a Postgres queue is not slow. The second direction is the one that matters more for small systems. Nobody running a product with a few hundred users needs a hundred thousand jobs a second, or a thousand, or often a hundred. The workload that the throughput argument is conducted over does not exist for most of the people conducting it, and the argument distracts from the property that does matter at every scale, which is whether the job and the row commit together.

## How the table works

The mechanism that makes a table a queue is one clause. Workers select the next available job with a row lock, skipping rows other workers have already locked, using [SELECT FOR UPDATE SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE), so that two workers polling at the same instant claim disjoint rows without blocking each other. The worker runs the job, marks the row done or failed inside the same lock, and commits. A worker that crashes mid-job releases its lock when its connection dies, and the row becomes available again, which is the retry.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Two workers claiming disjoint rows with SELECT FOR UPDATE SKIP LOCKED</title>
<desc id="f3-d">A jobs table with five rows. Worker A locks row 1; worker B, polling at the same time, skips the locked row 1 and locks row 2. Rows 3 to 5 remain available. Each worker processes its row and marks it done in the same transaction, then commits.</desc>
<text x="0" y="18" class="viz-title">One clause, no coordinator</text>
<text x="20" y="48" class="viz-tick">JOBS TABLE</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<rect x="8" y="64" width="300" height="28" rx="6" class="viz-box-ink"/><text x="20" y="83" class="viz-on-ink">row 1: send confirmation, pending</text>
<rect x="8" y="98" width="300" height="28" rx="6" class="viz-box-ink"/><text x="20" y="117" class="viz-on-ink">row 2: update search index, pending</text>
<rect x="8" y="132" width="300" height="28" rx="6" class="viz-box"/><text x="20" y="151" class="viz-label-muted">row 3: resize upload, pending</text>
<rect x="8" y="166" width="300" height="28" rx="6" class="viz-box"/><text x="20" y="185" class="viz-label-muted">row 4: send confirmation, pending</text>
<rect x="8" y="200" width="300" height="28" rx="6" class="viz-box"/><text x="20" y="219" class="viz-label-muted">row 5: warm cache, pending</text>
<rect x="340" y="64" width="292" height="62" rx="8" class="viz-box-accent"/>
<text x="356" y="88" class="viz-label">Worker A</text>
<text x="356" y="108" class="viz-label-muted">FOR UPDATE SKIP LOCKED LIMIT 1: row 1</text>
<rect x="340" y="132" width="292" height="62" rx="8" class="viz-box-accent"/>
<text x="356" y="156" class="viz-label">Worker B, same instant</text>
<text x="356" y="176" class="viz-label-muted">skips locked row 1, claims row 2</text>
<text x="8" y="252" class="viz-label-muted">Each marks its row done and commits; a crashed worker's row returns to pending.</text>
</svg>
<figcaption>Illustrative: the claiming pattern from the PostgreSQL SELECT documentation, drawn for two workers.</figcaption>
</figure>

Two details make the table behave. The first is the index: the claim query filters on status and orders by a run-at time, and without an index on exactly that pair it scans, which is where the slowness stories come from at surprisingly small sizes. The second is the poll. Workers that poll every few hundred milliseconds are fine at small scale and wasteful at large; Postgres's notify mechanism lets a worker sleep until a row is inserted and wake immediately, which turns the poll into a fallback and drops the enqueue-to-start latency to the few milliseconds the measurements show. Neither detail is exotic. Both are the difference between the folk number and the measured one.

## The real cost is vacuum

If speed is not the cost of a Postgres queue, what is? Dead tuples. Every job row is inserted, updated at least once when claimed, updated again when finished, and usually deleted, and each update leaves a dead version of the row behind for autovacuum to reclaim. A jobs table at a steady rate produces dead tuples at a multiple of that rate, and autovacuum's [default trigger](https://www.postgresql.org/docs/current/routine-vacuuming.html#AUTOVACUUM) fires when dead tuples exceed a threshold of fifty rows plus twenty percent of the table, which on a small, hot table means it fires constantly, and on a table with a large backlog of old completed jobs means it fires rarely relative to the churn on the live rows.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f4-t f4-d">
<title id="f4-t">Dead tuples against job rate under default autovacuum thresholds, from a simple model</title>
<desc id="f4-d">Two lines against jobs per second. With completed jobs deleted promptly and the table kept small, dead tuples stay bounded, because autovacuum triggers often on a small table. With completed jobs retained, the table grows, the twenty percent threshold grows with it, vacuum runs less often relative to churn, and dead tuples climb steadily with the job rate until bloat dominates.</desc>
<text x="0" y="18" class="viz-title">Keep the table small and vacuum keeps up</text>
<text x="0" y="36" class="viz-sub">Dead tuples between vacuums by job rate; two policies</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">completed rows deleted</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s4"/><text x="520" y="35" class="viz-label-muted">retained</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">high</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1 a second</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">100</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">10,000</text>
<polyline points="56,258 192,250 328,238 464,226 600,218" class="viz-s1"/>
<polyline points="56,256 192,226 328,176 464,116 600,64" class="viz-s4"/>
<text x="592" y="212" text-anchor="end" class="viz-value">bounded: vacuum fires often on a small table</text>
<text x="592" y="86" text-anchor="end" class="viz-value">the threshold grows with the table</text>
</svg>
<figcaption>Illustrative: a model of dead-tuple accumulation under the default autovacuum threshold, fifty rows plus twenty percent of the table, for two retention policies; the shapes follow from the threshold rule and the values are not measured.</figcaption>
</figure>

So the tiebreak in the decision flow is not speed but vacuum. A jobs table that deletes completed rows promptly, or partitions them by day and drops old partitions, stays small, and autovacuum on a small table is cheap and frequent. A jobs table that keeps every completed job for audit grows without bound, its vacuum threshold grows with it, and the live rows at the head of the table sit among an increasing pile of dead versions. The second design is where the "Postgres queues are slow" folklore probably came from: not from Postgres, but from a table nobody ever cleaned.

The retention question also settles the audit argument. A jobs table that doubles as a history of every job ever run is doing two jobs, and the second one is what bloats it. The history belongs in a separate table, written once per completed job by the worker in the same transaction that deletes the live row, so that the live table stays small and the history table is append-only, which is the shape autovacuum handles best. Partitioning the history by month and dropping old partitions is a single statement, and it is the entire retention policy.

## What I actually do

In the Node.js and PostgreSQL backend I run, the jobs table holds the job types that pass the same-transaction test, which is most of them: anything caused by a write. The enqueue is a row insert in the same transaction as the write, workers claim with SKIP LOCKED, and completed rows are moved to a history table by a nightly job so that the live table stays at a few hundred rows and vacuum never notices it. Jobs that are scheduled by the clock rather than by a write go through the same table for the sake of having one place to look, since the vacuum load at those rates is nothing. The broker is the thing I would add for a workload that fails the vacuum tiebreak, a job rate high enough that even a small table's churn outruns autovacuum, and I have not needed it. The decision was never about speed. It was about what commits together.
