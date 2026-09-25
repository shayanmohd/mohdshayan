---
title: Your migration tool does not know about locks
date: 2026-07-08
summary: Prisma and Drizzle run the SQL you give them and neither sets a lock timeout. The danger of a migration is the lock it takes and the queue behind it, not the size of the change.
tags: PostgreSQL, Migrations, Prisma
topic: Backend Architecture
draft: false
---

The migration that takes a production system down is almost never the big one. Adding a column with a default to a table of a hundred rows can stop every request for a minute, and rewriting a table of a hundred million rows can pass unnoticed, because the thing that decides is not the size of the change. It is the lock the statement takes and the queue that forms behind it while it waits. SocialSure's backend runs PostgreSQL through Prisma and Drizzle, and the lesson I keep relearning is that the migration tools are honest about what they do: they run the SQL you give them. What they do not do is know anything about locks.

## The queue is the danger

Most schema changes in Postgres take an ACCESS EXCLUSIVE lock on the table they touch, the strongest lock there is, and the [locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html) lists which statements take which level. ACCESS EXCLUSIVE conflicts with everything, including the ACCESS SHARE lock that a plain SELECT holds. The statement cannot proceed until every existing reader has finished.

That alone would be fine, because most reads are short. The problem is the queue. Postgres grants locks in order, so once an ALTER TABLE is waiting for its exclusive lock, every new query that wants any conflicting lock, which is every query on that table, queues behind it. A single long-running report that started before the migration holds the ALTER off for as long as it runs, and for that whole time the table is effectively offline to everyone else, not because anything is being altered but because everyone is waiting behind something that is waiting.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The lock queue behind a waiting ALTER TABLE</title>
<desc id="f1-d">A row of boxes. First, a long SELECT holding an ACCESS SHARE lock since before the migration. Second, the ALTER TABLE waiting for ACCESS EXCLUSIVE, which conflicts with the SELECT. Third, fourth and fifth, ordinary reads and writes that arrived after the ALTER and queue behind it, even though they would not conflict with the SELECT. The table is idle for all of them.</desc>
<text x="0" y="18" class="viz-title">Nothing is being altered; everything is waiting</text>
<text x="0" y="36" class="viz-sub">Lock queue on one table, in arrival order</text>
<rect x="8" y="70" width="150" height="72" rx="8" class="viz-box"/>
<text x="83" y="94" text-anchor="middle" class="viz-label">Long SELECT</text>
<text x="83" y="112" text-anchor="middle" class="viz-label-muted">ACCESS SHARE, held</text>
<text x="83" y="130" text-anchor="middle" class="viz-label-muted">started an hour ago</text>
<rect x="174" y="70" width="150" height="72" rx="8" class="viz-box-accent"/>
<text x="249" y="94" text-anchor="middle" class="viz-label">ALTER TABLE</text>
<text x="249" y="112" text-anchor="middle" class="viz-label-muted">ACCESS EXCLUSIVE</text>
<text x="249" y="130" text-anchor="middle" class="viz-label-muted">waiting for the SELECT</text>
<rect x="340" y="70" width="90" height="72" rx="8" class="viz-box"/>
<text x="385" y="100" text-anchor="middle" class="viz-label">SELECT</text>
<text x="385" y="120" text-anchor="middle" class="viz-label-muted">queued</text>
<rect x="440" y="70" width="90" height="72" rx="8" class="viz-box"/>
<text x="485" y="100" text-anchor="middle" class="viz-label">UPDATE</text>
<text x="485" y="120" text-anchor="middle" class="viz-label-muted">queued</text>
<rect x="540" y="70" width="90" height="72" rx="8" class="viz-box"/>
<text x="585" y="100" text-anchor="middle" class="viz-label">SELECT</text>
<text x="585" y="120" text-anchor="middle" class="viz-label-muted">queued</text>
<line x1="8" y1="160" x2="632" y2="160" class="viz-axis"/>
<text x="83" y="184" text-anchor="middle" class="viz-tick">holding</text>
<text x="249" y="184" text-anchor="middle" class="viz-tick">blocked</text>
<text x="485" y="184" text-anchor="middle" class="viz-tick">blocked by the blocked one</text>
<text x="0" y="224" class="viz-label-muted">A lock_timeout on the ALTER makes it give up instead of holding the queue.</text>
<text x="0" y="246" class="viz-label-muted">Nothing else in the stack does that for you.</text>
</svg>
<figcaption>Illustrative: the FIFO lock queue described in the <a href="https://www.postgresql.org/docs/current/explicit-locking.html">PostgreSQL locking documentation</a>; the queued statements would not have conflicted with the SELECT on their own.</figcaption>
</figure>

## What the tools do and do not set

Prisma Migrate takes an advisory lock so that two migration runs cannot overlap, and its [documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) describes the workflow around that. Ten seconds of waiting for that advisory lock and the run fails. That lock is about migrations racing each other. It has nothing to do with the table locks the migration's SQL will take, and Prisma does not set a `lock_timeout` for those. Drizzle Kit runs the generated SQL the same way. In both cases the statement waits for its table lock as long as Postgres lets it, which by default is forever, and the queue grows the whole time.

The fix is one setting, and the tools let you write it because it is just SQL: set `lock_timeout` at the top of the migration, to a value shorter than the time you are willing to block the table. If the exclusive lock cannot be obtained within that window, the statement fails instead of waiting, the queue drains, and the migration retries later or under a maintenance window. The failure is the safe outcome. The wait was the dangerous one.

```sql
SET lock_timeout = '3s';
ALTER TABLE deals ADD COLUMN source text;
```

Which statements need the timeout is the part the tools cannot tell you, and it is where the size intuition goes wrong. Adding a nullable column with no default takes the exclusive lock for a moment and is cheap once obtained; its danger is entirely the queue. Adding a column with a volatile default rewrites the table and holds the lock for the whole rewrite. Creating an index the ordinary way takes a SHARE lock that blocks writes for the duration; creating it concurrently takes a weaker lock and runs alongside traffic. The right question about every migration is which lock, for how long, behind what.

## Postgres has been making this cheaper for twenty years

Most of the expensive operations have a cheap form now, and the history of when each arrived is a useful map of what to reach for.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">When common schema changes became cheap in PostgreSQL</title>
<desc id="f2-d">A timeline: 2006, version 8.2, CREATE INDEX CONCURRENTLY; 2011, version 9.1, ADD CONSTRAINT NOT VALID with a separate VALIDATE; 2018, version 11, ADD COLUMN with a constant default without rewriting the table; 2021, version 14, DETACH PARTITION CONCURRENTLY.</desc>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="80" cy="90" r="6" class="viz-d1"/>
<text x="80" y="64" text-anchor="middle" class="viz-tick">2006, 8.2</text>
<text x="80" y="46" text-anchor="middle" class="viz-label">Index concurrently</text>
<circle cx="240" cy="90" r="6" class="viz-d1"/>
<text x="240" y="124" text-anchor="middle" class="viz-tick">2011, 9.1</text>
<text x="240" y="142" text-anchor="middle" class="viz-label">Constraint NOT VALID</text>
<circle cx="400" cy="90" r="6" class="viz-d1"/>
<text x="400" y="64" text-anchor="middle" class="viz-tick">2018, 11</text>
<text x="400" y="46" text-anchor="middle" class="viz-label">Default without rewrite</text>
<circle cx="560" cy="90" r="6" class="viz-d1"/>
<text x="560" y="124" text-anchor="middle" class="viz-tick">2021, 14</text>
<text x="560" y="142" text-anchor="middle" class="viz-label">Detach concurrently</text>
</svg>
<figcaption>Source: PostgreSQL release notes for <a href="https://www.postgresql.org/docs/release/8.2.0/">8.2</a>, <a href="https://www.postgresql.org/docs/release/9.1.0/">9.1</a>, <a href="https://www.postgresql.org/docs/release/11.0/">11</a> and <a href="https://www.postgresql.org/docs/release/14.0/">14</a>.</figcaption>
</figure>

Each entry on that line replaces an operation that held a strong lock for a long time with one that holds a weak lock, or a strong lock briefly. Since version 11, adding a column with a constant default is a catalogue change rather than a rewrite. Since 9.1, a foreign key or check constraint can be added as NOT VALID, which takes the exclusive lock only for an instant, and validated later under a lock that allows reads and writes. Since 8.2, an index can be built without blocking writes. The tools generate the plain forms by default, because the plain forms are portable and simple, and the migration author has to know to write the cheap ones.

## The lock receipt

The habit I use to make that knowledge visible is a five-line header committed with every migration file. It states the lock level taken, the tables affected, the worst-case hold time and what it depends on, the lock timeout set, and the retry plan if the timeout fires. A migration without a receipt does not merge. The header is not enforced by any tool. It is enforced by the reviewer, who can now see in five lines what the SQL below is going to do to the table at three in the afternoon.

```sql
-- lock: ACCESS EXCLUSIVE on deals (instant, catalogue only)
-- tables: deals
-- worst case: held for the duration of any SELECT already running on deals
-- lock_timeout: 3s
-- retry: rerun; safe to repeat, the column add is idempotent via IF NOT EXISTS
```

Writing the receipt is what forces the right questions. Filling in the worst-case line for an ADD COLUMN with a default on version 10 makes you look up whether it rewrites, and it did. Filling it in for a CREATE INDEX makes you write CONCURRENTLY. Filling in the retry line for a rewrite that cannot be repeated makes you split it into a backfill in batches and a final constraint. The receipt is small because the thinking it forces is where the value is.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Lock level by statement, plain form against cheap form</title>
<desc id="f3-d">A table with three rows: create an index, add a constraint, add a column with a default. For each, the plain form and its lock: CREATE INDEX takes SHARE and blocks writes; ADD CONSTRAINT takes ACCESS EXCLUSIVE for a full scan; ADD COLUMN DEFAULT before version 11 rewrote the table under ACCESS EXCLUSIVE. And the cheap form: CONCURRENTLY under SHARE UPDATE EXCLUSIVE; NOT VALID then VALIDATE; a constant default on version 11 or later, an instant catalogue change.</desc>
<text x="0" y="18" class="viz-title">The same change, two locks</text>
<text x="20" y="48" class="viz-tick">CHANGE</text>
<text x="200" y="48" class="viz-tick">PLAIN FORM</text>
<text x="420" y="48" class="viz-tick">CHEAP FORM</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Add an index</text>
<text x="200" y="82" class="viz-label-muted">SHARE, blocks writes</text>
<text x="420" y="82" class="viz-label-muted">CONCURRENTLY, writes continue</text>
<line x1="0" y1="96" x2="640" y2="96" class="viz-grid"/>
<text x="20" y="122" class="viz-label">Add a constraint</text>
<text x="200" y="122" class="viz-label-muted">ACCESS EXCLUSIVE, full scan</text>
<text x="420" y="122" class="viz-label-muted">NOT VALID, then VALIDATE</text>
<line x1="0" y1="136" x2="640" y2="136" class="viz-grid"/>
<text x="20" y="162" class="viz-label">Column with default</text>
<text x="200" y="162" class="viz-label-muted">rewrite, before version 11</text>
<text x="420" y="162" class="viz-label-muted">constant default, instant</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="20" y="202" class="viz-label">Any of the above</text>
<text x="200" y="202" class="viz-label-muted">no lock_timeout, waits forever</text>
<text x="420" y="202" class="viz-label-muted">lock_timeout set, fails safe</text>
<line x1="0" y1="216" x2="640" y2="216" class="viz-grid"/>
<text x="0" y="244" class="viz-label-muted">The tool writes the left column by default; the receipt gets the right one written.</text>
</svg>
<figcaption>Source: lock levels from the <a href="https://www.postgresql.org/docs/current/explicit-locking.html">PostgreSQL explicit locking documentation</a>; the version-11 default behaviour from its release notes.</figcaption>
</figure>

## The retry that is not a retry

One line of the receipt deserves more than a line, because it is where migrations go from risky to safe: the retry plan. A statement that fails on `lock_timeout` has done nothing, and rerunning it is fine. A statement that was halfway through a table rewrite when the connection dropped may have left the table in a state the tool does not recognise, and the tool's own record of which migrations have run may disagree with the schema. The receipt forces the author to say which kind of statement this is before it runs.

For the dangerous kind, the plan is almost always to split. A backfill runs in batches of a few thousand rows, each in its own short transaction, so that a failure loses one batch and a rerun resumes. The constraint that depends on the backfill is added NOT VALID at the start, so that new rows obey it while old rows catch up, and validated at the end under a lock that lets traffic through. The migration that would have held the table for ten minutes becomes a hundred migrations that each hold it for none, and the receipt for each one says "safe to repeat".

## What the tools could do

It is worth saying that none of this is a complaint about Prisma or Drizzle. Generating portable SQL from a schema diff is the right job for a tool, and knowing your production traffic pattern is not something a tool can do. A lock timeout is a value only the team can choose, because it encodes how long they are willing to block a table, and that number is different for a reporting database and a ticketing gate. The tools could make the setting more visible, and some of the safer-migration libraries do exactly that, but the decision was always going to be the team's.

So the rule is the team's too. Every migration says what lock it takes, for how long, behind what, with a timeout that makes waiting fail instead of spreading. The size of the change never appears in that sentence, because it was never the thing that mattered.
