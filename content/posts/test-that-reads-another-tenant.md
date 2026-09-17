---
title: The test that reads another tenant's rows
date: 2026-09-17
summary: Tenant isolation in a shared Postgres schema is only as trustworthy as the test that tries to break it. A generated probe turns a convention into a property CI enforces.
tags: PostgreSQL, Multi-tenant SaaS, Testing
draft: false
---

Every multi-tenant application has a sentence in its design document that says every query is scoped to the tenant. The sentence is true on the day it is written. It stops being true the first time someone writes a raw query for a report, or adds a table without the scoping column, or runs a session-level setting through a connection pool that reuses sessions. None of those mistakes fails a test, because there is no test. The CRM I built at CustomGlide serves companies that must never see each other's pipelines, and the thing that let me sleep was not the WHERE clause. It was a test that logs in as one tenant and tries, table by table, to read another.

## Every implementation has a way to stop applying

There are three common ways to scope a shared-table schema, and each has a failure mode that is silent.

The WHERE clause: every query includes `tenant_id = $1`. It stops applying whenever someone writes a query that does not include it, which in a codebase of any age is a matter of when. A Prisma client extension or a query middleware that appends the clause automatically is better, and it stops applying for raw queries, for queries through a second client, and for the one model that was added after the extension's list was written.

Row-level security: Postgres policies on each table that compare a row's tenant column with a setting on the connection, set with `SET LOCAL` inside the transaction. The [Postgres documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) is clear that policies are bypassed by superusers and by roles with `BYPASSRLS`, and that a table's owner is exempt unless the table is set to force it. So RLS stops applying whenever the application connects as the wrong role, and it stops applying in a different way when the setting is made at session level instead of transaction level and the connection goes back to a pool.

That last one is the subtle one. A transaction-mode pooler such as PgBouncer hands each transaction to whichever server connection is free; its [documentation](https://www.pgbouncer.org/features.html) lists session-level features that do not work in that mode, and `SET` outside a transaction is one of them. A `SET app.tenant = 'A'` that is not `LOCAL` survives the transaction, follows the server connection back to the pool, and is inherited by the next client, who may be tenant B. Nothing errors. B's first query runs as A.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Where a session-level setting leaks through a transaction pooler</title>
<desc id="f1-d">Three lanes: the application, the pooler, and one Postgres server connection. Request one begins a transaction, sets the tenant, queries and commits; the connection returns to the pool. Request two from a different tenant is given the same server connection. With SET LOCAL the setting was cleared at commit. With a plain SET it is still A, and B's query reads A's rows.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Application</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Transaction pooler</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Server connection</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="320" y="70" text-anchor="middle" class="viz-label-muted">tenant A: BEGIN; SET tenant = 'A'; query; COMMIT</text>
<line x1="100" y1="76" x2="537" y2="76" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="432" y="106" text-anchor="middle" class="viz-label-muted">connection returned to the pool</text>
<line x1="540" y1="112" x2="328" y2="112" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="146" text-anchor="middle" class="viz-label-muted">tenant B: BEGIN; query; COMMIT</text>
<line x1="100" y1="152" x2="537" y2="152" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="352" y="176" width="280" height="44" rx="8" class="viz-band"/>
<text x="492" y="194" text-anchor="middle" class="viz-label">SET LOCAL: setting cleared at COMMIT</text>
<text x="492" y="212" text-anchor="middle" class="viz-label-muted">B's query sees no tenant, or its own</text>
<rect x="352" y="232" width="280" height="44" rx="8" class="viz-box-ink"/>
<text x="492" y="250" text-anchor="middle" class="viz-on-ink">SET: still 'A' on the reused connection</text>
<text x="492" y="268" text-anchor="middle" class="viz-on-ink">B reads A's rows, no error anywhere</text>
</svg>
<figcaption>Illustrative: the hangover case that a transaction-mode pooler produces when a setting is not transaction-scoped; see the <a href="https://www.pgbouncer.org/features.html">PgBouncer feature notes</a>.</figcaption>
</figure>

## The cross-tenant probe

So the test is generated, not written, because a hand-written test covers the tables someone remembered. The probe reads the schema, finds every table that carries a tenant column, and produces one case per table. Each case seeds a row for tenant B, authenticates as tenant A through the application's normal path, and asserts that a query for that table returns zero rows belonging to B. It does this through every read path the application has: the ORM, the raw query helper, the reporting endpoint, and anything else that talks to the database.

Two details of the seeding decide whether the probe means anything. The rows for tenant B must be identical to tenant A's in every column except the tenant column, so that a leak cannot hide behind a filter that happens to exclude B's data for some other reason, a status, a date range, a soft-delete flag. And the probe must run through the same connection topology as production, pooler included, because the failure modes worth finding live in the pooler and a probe that connects directly to Postgres will never see them.

Then one more case per table, the pool-hangover case. Run a request as tenant A that sets the tenant, commit, return the connection, then run a request as tenant B on the same pool and assert that B's first query does not see A's rows. On a transaction pooler this case fails within seconds if the setting is session-level. On a direct connection it passes, which is exactly why the bug survives in development and appears in production.

The probe reports two numbers: tables covered and tables leaking. The first number is how much of the schema the probe understands. The second must be zero, and a leaking count above zero fails the build. That is the entire contract. The isolation guarantee is no longer a sentence in a design document; it is a CI job with a number in it.

## What the schema tells you before the probe runs

Generating the probe from the schema has a side effect: it makes you look at which tables carry a tenant column and which do not. I ran that count against a large public schema, the [Prisma schema of cal.com](https://github.com/calcom/cal.com/blob/main/packages/prisma/schema.prisma), on the main branch on 17 September 2026. Of 100 models, 61 carry a team, user or organisation column directly, and 39 do not.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Models with and without a direct scoping column in cal.com's schema</title>
<desc id="f2-d">Two horizontal bars: 61 of 100 models carry a teamId, userId, organizationId or orgId column directly; 39 do not. The unscoped bar is highlighted because it is the set the probe has to classify.</desc>
<text x="0" y="18" class="viz-title">One public schema, counted</text>
<text x="0" y="36" class="viz-sub">cal.com, packages/prisma/schema.prisma, main branch, 100 models</text>
<line x1="200" y1="52" x2="200" y2="140" class="viz-axis"/>
<text x="190" y="73" text-anchor="end" class="viz-label">Direct tenant column</text>
<path d="M200 58 H444.4 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H200 Z" class="viz-fgray"/>
<text x="460.4" y="73" class="viz-value">61</text>
<text x="190" y="107" text-anchor="end" class="viz-label">No direct tenant column</text>
<path d="M200 92 H355.6 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H200 Z" class="viz-f1"/>
<text x="371.6" y="107" class="viz-value">39</text>
<text x="0" y="170" class="viz-label-muted">Among the 39: Attendee, Payment, BookingReference and BookingSeat reach a tenant</text>
<text x="0" y="190" class="viz-label-muted">through a booking; App, Feature, Deployment and RateLimit are global by design.</text>
<text x="0" y="218" class="viz-tick">counted with a script over the schema file;</text>
<text x="0" y="236" class="viz-tick">scoping columns matched: teamId, userId, organizationId, orgId</text>
</svg>
<figcaption>Source: computed from the <a href="https://github.com/calcom/cal.com/blob/main/packages/prisma/schema.prisma">cal.com Prisma schema</a> on 17 September 2026; the classification of the 39 is the author's reading of the model names, not a statement about cal.com's isolation.</figcaption>
</figure>

That second group is not a list of bugs. It is a list of decisions. Some of those models are global by design: feature flags, app metadata, deployment settings. Some reach a tenant through a parent: an attendee belongs to a booking, and a booking belongs to a user or a team, so the scoping is one join away. The probe has to know which is which, and the honest way to give it that knowledge is a small annotation per table: global, direct, or through-parent-X. A table with no annotation fails the build too, because an unclassified table is the one that will be added next month with the scoping forgotten.

## Four ways it stops applying, four cases that catch each

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Failure modes of tenant isolation and the probe case that catches each</title>
<desc id="f3-d">A two column table. Left column, how isolation stops applying: a raw query without the clause; a model missing from the client extension; a session-level SET through a transaction pooler; a connection role with BYPASSRLS or table ownership. Right column, the probe case that catches it: the per-table read through every path; the generated case for every table with a tenant column; the pool-hangover case; a role check that runs before the suite.</desc>
<text x="0" y="18" class="viz-title">Each way in, one case that catches it</text>
<text x="20" y="48" class="viz-tick">HOW ISOLATION STOPS APPLYING</text>
<text x="340" y="48" class="viz-tick">THE CASE THAT CATCHES IT</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<line x1="320" y1="56" x2="320" y2="250" class="viz-grid"/>
<text x="20" y="82" class="viz-label">Raw query without the clause</text>
<text x="340" y="82" class="viz-label">Per-table read through every path</text>
<line x1="0" y1="92" x2="640" y2="92" class="viz-grid"/>
<text x="20" y="114" class="viz-label">Model missing from the extension</text>
<text x="340" y="114" class="viz-label">Generated case for every scoped table</text>
<line x1="0" y1="124" x2="640" y2="124" class="viz-grid"/>
<text x="20" y="146" class="viz-label">Session SET through a pooler</text>
<text x="340" y="146" class="viz-label">The pool-hangover case</text>
<line x1="0" y1="156" x2="640" y2="156" class="viz-grid"/>
<text x="20" y="178" class="viz-label">Role that bypasses RLS</text>
<text x="340" y="178" class="viz-label">Role check before the suite runs</text>
<line x1="0" y1="188" x2="640" y2="188" class="viz-grid"/>
<text x="20" y="210" class="viz-label">Table added without a tenant column</text>
<text x="340" y="210" class="viz-label">Unclassified table fails the build</text>
<line x1="0" y1="220" x2="640" y2="220" class="viz-grid"/>
<text x="20" y="242" class="viz-label-muted">The list grows; the generator does not need to know in advance.</text>
</svg>
<figcaption>Illustrative: the mapping the probe is built around; the fifth row is the one that keeps the other four honest over time.</figcaption>
</figure>

The role check is worth spelling out because it is the cheapest and the most often skipped. Before the suite runs, it asks the database which role the application is connected as, and whether that role is a superuser, has `BYPASSRLS`, or owns the tables it queries. If any answer is yes, the suite fails before a single tenant case runs, because every RLS-based case would pass for the wrong reason. A probe that reports zero leaks while connected as a role that policies do not apply to is worse than no probe.

## What it costs and what it buys

The generator is a few hundred lines. It reads the schema, emits one test file per table, and runs in the same CI job as everything else against a database seeded with two tenants. The suite is slow in the way any database suite is slow, minutes rather than seconds, and the way to keep it from being skipped is to make it the job that gates deployment rather than the job that runs nightly. A leak found nightly is a leak that shipped.

What it buys is a different relationship with the sentence in the design document. The sentence still says every query is scoped to the tenant. Now it is followed by a number, the count of tables the probe checks, and by a job that turns red on the day the sentence stops being true. That is the whole difference between a convention and a property, and for a CRM where two companies' pipelines share a table, it is the difference that matters.
