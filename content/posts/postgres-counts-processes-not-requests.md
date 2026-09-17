---
title: Postgres counts processes, not requests
date: 2026-09-17
summary: Connection exhaustion under serverless is a topology problem. Postgres runs one backend per connection, every instance carries a pool, and the platform sets the instance count.
tags: PostgreSQL, Serverless, Next.js
draft: false
---

The error arrives as "too many connections", and the first instinct is to raise the limit. The limit is not the problem. Postgres runs one operating-system process per connection, and the number of connections is not something your code decides; it is the product of two numbers, only one of which you control. Every instance of your application carries a pool, and the number of instances is set by whoever scales your compute. Under a serverless platform that is the platform, and it can decide to run fifty copies of your function in the same second. Fifty pools of ten is five hundred backends asking for a database that was provisioned for a hundred.

## The pool product

I keep this as an equation because it is the only way the conversation stays honest. The pool product is the number of instances that can run at once, times the maximum connections each instance's pool will open. It has to stay below the database's connection ceiling, minus the connections reserved for administration, replication and monitoring, or the database will refuse connections at exactly the moment traffic is highest. Nobody should set a pool size until they can write the product down, and most teams cannot, because they do not know the first factor.

Postgres itself ships with a [max_connections](https://www.postgresql.org/docs/current/runtime-config-connection.html) default of 100, and a managed provider sizes the ceiling to the compute it sells. Supabase's [pooling and limits documentation](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits) gives its smallest compute about 60 direct connections and 200 client connections through its transaction-mode pooler, with larger tiers scaling both. Those are the ceilings the product has to fit under.

<figure class="chart">
<svg viewBox="0 0 640 280" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Instances, pools and backends, with the product written on the arrows</title>
<desc id="f1-d">On the left, a stack of N function instances, each holding a pool of P connections. Arrows labelled N times P lead to a transaction-mode pooler in the middle, which holds a smaller number of server connections. From the pooler, arrows lead to Postgres on the right, where each connection is one backend process and the ceiling is max_connections minus reserved slots.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Where the product is formed</text>
<text x="0" y="36" class="viz-sub">The platform sets N; your code sets P; the database sets the ceiling</text>
<rect x="8" y="60" width="150" height="40" rx="6" class="viz-box"/><text x="83" y="85" text-anchor="middle" class="viz-label">Instance 1, pool P</text>
<rect x="8" y="108" width="150" height="40" rx="6" class="viz-box"/><text x="83" y="133" text-anchor="middle" class="viz-label">Instance 2, pool P</text>
<rect x="8" y="156" width="150" height="40" rx="6" class="viz-box"/><text x="83" y="181" text-anchor="middle" class="viz-label-muted">...</text>
<rect x="8" y="204" width="150" height="40" rx="6" class="viz-box"/><text x="83" y="229" text-anchor="middle" class="viz-label">Instance N, pool P</text>
<line x1="160" y1="152" x2="236" y2="152" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="198" y="142" text-anchor="middle" class="viz-value">N x P</text>
<rect x="240" y="112" width="160" height="80" rx="8" class="viz-box-accent"/>
<text x="320" y="142" text-anchor="middle" class="viz-label">Transaction pooler</text>
<text x="320" y="164" text-anchor="middle" class="viz-label-muted">many clients, few servers</text>
<line x1="402" y1="152" x2="478" y2="152" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="440" y="142" text-anchor="middle" class="viz-value">server pool</text>
<rect x="482" y="100" width="150" height="104" rx="8" class="viz-box-ink"/>
<text x="557" y="130" text-anchor="middle" class="viz-on-ink">Postgres</text>
<text x="557" y="152" text-anchor="middle" class="viz-on-ink">one process per</text>
<text x="557" y="170" text-anchor="middle" class="viz-on-ink">connection, up to</text>
<text x="557" y="188" text-anchor="middle" class="viz-on-ink">max_connections</text>
<text x="320" y="268" text-anchor="middle" class="viz-tick">without the pooler, N x P lands on the database directly, and N is not yours to set</text>
</svg>
<figcaption>Illustrative: the topology under a serverless platform; the pooler is the only component that changes the product rather than one of its factors.</figcaption>
</figure>

## The multiplier changed again

The classic version of this problem was the one-request-per-instance model of early serverless functions: each invocation got its own instance, each instance opened its own connection, and a burst of a thousand requests was a thousand connections. The classic advice, a pool size of one per function and a pooler in front of the database, came from that world. Vercel's Fluid compute changed the multiplier, and its [knowledge base on connection pools](https://vercel.com/kb/guide/efficiently-manage-database-connection-pools-with-fluid-compute) explains how: an instance now serves concurrent requests and stays warm between them, so a pool initialised at module scope survives across invocations and is shared by the requests an instance handles. The platform also provides an `attachDatabasePool` helper that closes idle connections before an instance is suspended, so that suspended instances do not hold connections the database still counts.

That is better, and it means the 2022 arithmetic is wrong in both directions. A pool size of one is now too small, because one instance serves many requests at once and they would queue on a single connection. A pool size of ten is too large if the instance count can still climb into the dozens. The right P is a function of the concurrency per instance, and the right N is whatever the platform's scaling limits say, and the product still has to be written down.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Pool product against instance count for three pool sizes, against a ceiling of 60</title>
<desc id="f2-d">Three rising lines over instance counts from 1 to 32: pool size 2 stays under 60 until 30 instances; pool size 5 crosses 60 at 12 instances; pool size 10 crosses at 6. A horizontal marker at 60 is the ceiling of a small managed database with reserved slots removed.</desc>
<text x="0" y="18" class="viz-title">Write the product down before setting the pool</text>
<text x="0" y="36" class="viz-sub">Connections demanded, N times P, against a ceiling of 60</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">P = 2</text>
<line x1="460" y1="31" x2="474" y2="31" class="viz-s2"/><text x="480" y="35" class="viz-label-muted">P = 5</text>
<line x1="540" y1="31" x2="554" y2="31" class="viz-s3"/><text x="560" y="35" class="viz-label-muted">P = 10</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">160</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">120</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">80</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">40</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">16</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">24</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">32</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Instances running at once, N</text>
<line x1="56" y1="186" x2="600" y2="186" class="viz-s4"/>
<text x="596" y="180" text-anchor="end" class="viz-label-muted">ceiling: 60 usable connections</text>
<polyline points="56,261.4 192,243.2 328,222.4 464,201.6 600,180.8" class="viz-s1"/>
<polyline points="56,257.5 192,212 328,160 464,108 600,56" class="viz-s2"/>
<polyline points="56,251 192,160 328,56" class="viz-s3"/>
<circle cx="600" cy="180.8" r="4" class="viz-d1"/>
<circle cx="256" cy="186" r="5" class="viz-d2"/>
<circle cx="141" cy="186" r="5" class="viz-d3"/>
<text x="256" y="206" text-anchor="middle" class="viz-value">12 instances</text>
<text x="141" y="206" text-anchor="middle" class="viz-value">6</text>
</svg>
<figcaption>Illustrative: arithmetic on a 60-connection ceiling, which is the order of a small managed tier's direct connections after reserved slots, as in <a href="https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits">Supabase's published limits</a>; the pool sizes are examples.</figcaption>
</figure>

## Why raising the limit makes it worse

The instinct to raise max_connections deserves a paragraph of its own, because it is not merely ineffective; it is harmful in a way that hides for a while. A Postgres backend is a process with its own memory, and a server sized for a hundred of them will run five hundred only by swapping or by starving the shared buffers that make queries fast. The connections are accepted, the error goes away, and the database gets slower for everyone, including the instances that were behaving. Then the slow queries hold their connections longer, the pools open more, and the new limit is reached too, at a higher level of pain.

The reason Postgres counts processes rather than requests is that a process is the unit that costs memory and scheduler time, and the count is a statement about what the machine can do. A limit set from the machine is a limit that means something. A limit raised to make an error message stop is a limit that has been disconnected from the thing it measured.

## The only lever that changes the product

Every setting in the application changes one factor of the product. The pooler changes the product itself. A transaction-mode pooler such as PgBouncer or Supavisor accepts a large number of client connections, hundreds or thousands, and multiplexes their transactions onto a small fixed number of server connections to Postgres, so that the database sees the server pool's size regardless of how many instances are connected to the pooler. The topology becomes N times P client connections to the pooler, which is cheap, and a fixed number of backends behind it, which is what the database can actually afford.

That is why the pooler is not optional under serverless, and why it was never really about performance. It is a fixed point in a topology whose other numbers move. Behind it, the pool product still matters, because the pooler has its own client ceiling and a burst of instances can exhaust that too, but the ceiling is an order of magnitude higher and the failure is a queue rather than a refused connection.

Two things the pooler cannot do are worth knowing before relying on it. Transaction mode breaks session state: prepared statements, session-level settings and advisory locks held across transactions do not survive the multiplexing, and an ORM that uses them needs to be told. And the pooler does not fix a pool that never returns connections; an instance that opens a connection and holds it through an idle period is still holding one of the pooler's server slots, which is precisely the case the platform's idle-close helper exists for.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Connection ceilings a small database exposes</title>
<desc id="f3-d">Horizontal bars: Postgres default max_connections 100; a small managed tier's direct connections about 60; the same tier's pooler client connections about 200. The pooler bar is highlighted because it is the ceiling the application actually sees when a transaction-mode pooler is in front of the database.</desc>
<text x="0" y="18" class="viz-title">Three ceilings, one database</text>
<text x="0" y="36" class="viz-sub">Connections, from documentation for a default install and a small managed tier</text>
<line x1="250" y1="52" x2="250" y2="154" class="viz-axis"/>
<text x="240" y="73" text-anchor="end" class="viz-label">Postgres default max_connections</text>
<path d="M250 58 H407 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H250 Z" class="viz-fgray"/>
<text x="427" y="73" class="viz-value">100</text>
<text x="240" y="107" text-anchor="end" class="viz-label">Small tier, direct connections</text>
<path d="M250 92 H343 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H250 Z" class="viz-fgray"/>
<text x="363" y="107" class="viz-value">about 60</text>
<text x="240" y="141" text-anchor="end" class="viz-label">Small tier, pooler clients</text>
<path d="M250 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H250 Z" class="viz-f1"/>
<text x="580" y="141" class="viz-value">about 200</text>
<text x="0" y="190" class="viz-label-muted">The application connects to the gold bar; the database only ever sees the grey ones.</text>
<text x="0" y="222" class="viz-tick">larger tiers raise all three; the shape stays the same</text>
</svg>
<figcaption>Source: the default from the <a href="https://www.postgresql.org/docs/current/runtime-config-connection.html">PostgreSQL configuration documentation</a>; the managed tier figures from <a href="https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits">Supabase's connection limits</a> for its smallest compute.</figcaption>
</figure>

## Reading the failure from the symptoms

Connection exhaustion presents in two ways, and the topology tells you which factor of the product is to blame. A sharp cliff at the moment of a traffic burst, "too many connections" errors arriving in a cluster and then clearing, is the instance count: the platform scaled out, N jumped, and the product crossed the ceiling. A slow climb over hours or days, with the count of open connections rising while traffic stays flat, is the pool: instances are opening connections and not returning them, usually because something holds a connection across an await, or because an idle instance was suspended with its pool open. The first is fixed with a pooler and a cap on N. The second is fixed in the application, and no pooler will save a pool that leaks.

## How I set it now

SocialSure's platform runs Prisma and Drizzle against Postgres from containers, which is a kinder topology than serverless because the instance count is mine, but the discipline is the same. First, find N: the maximum instances the platform will run, from its scaling configuration or its documented limit, and if it is unbounded, treat that as the first bug. Second, find the ceiling: max_connections minus the reserved slots, from the database's documentation, not from memory. Third, put a transaction-mode pooler in front of the database and point every instance at it. Fourth, set P from the concurrency each instance actually serves, with a ceiling such that N times P stays under the pooler's client limit, and write the product in the deployment configuration next to the pool size, so that the next person who raises P sees the multiplication they are doing.

The error was never that the limit was too low. It was that the product was never written down, and a number nobody wrote down is a number the platform will choose for you.
