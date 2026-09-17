---
title: Timeouts run in two directions
date: 2026-09-17
summary: Through a proxy chain, idle timeouts must get longer as you go inward and deadlines must get shorter. Most timeout bugs are one of those staircases built the wrong way round.
tags: Reverse Proxies, Node.js, Reliability
draft: false
---

The random 502 and the hung connection pool are the two timeout bugs every backend engineer meets, and they are usually treated as unrelated. They are the same bug in two directions. A request passes through a chain of hops, a load balancer, a reverse proxy, an application server, a database, and every hop has two timeouts on it: how long it will keep an idle connection open, and how long it will wait for a response. Those two numbers have to move in opposite directions along the chain, and when either one does not, the failure has a name.

## Two staircases

Draw every hop from the client to the database and write two numbers on each. The first is the idle timeout: how long this hop keeps a connection open with nothing happening on it. The second is the deadline: how long this hop waits for the hop behind it to answer before giving up.

The idle staircase must ascend inward. Each hop's idle timeout must be longer than the timeout of the hop in front of it, so that the outer hop is always the one that closes an idle connection. If an inner hop closes first, the outer hop may already have written the next request onto a socket the inner hop just shut, and the outer hop reports that as a bad gateway.

The deadline staircase must descend inward. Each hop's deadline must be shorter than the deadline of the hop in front of it, so that the innermost hop is always the one that gives up first and the failure propagates outward as a clean error. If an inner hop waits longer than an outer one, the outer hop has already sent an error to the client while the inner hop is still working, holding a worker, a connection, and a slot in the pool for a response nobody will read.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Documented default timeouts along a common chain</title>
<desc id="f1-d">Four hops on the horizontal axis: an AWS application load balancer, nginx, a Node.js HTTP server and PostgreSQL. Two series on a logarithmic seconds axis. Idle timeouts: 60 at the load balancer, 75 at nginx, 5 at Node, which breaks the ascending rule and is highlighted. Deadlines: 60 at the load balancer, 60 at nginx, 300 at Node, and no limit at PostgreSQL, which breaks the descending rule and is highlighted.</desc>
<text x="0" y="18" class="viz-title">Defaults, before anyone sets anything</text>
<text x="0" y="36" class="viz-sub">Seconds, log scale; the two series should step in opposite directions</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s2"/><text x="400" y="35" class="viz-label-muted">idle timeout</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s3"/><text x="520" y="35" class="viz-label-muted">deadline</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1,000</text>
<line x1="56" y1="125.3" x2="600" y2="125.3" class="viz-grid"/><text x="48" y="129.3" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-grid"/><text x="48" y="198.7" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1</text>
<text x="124" y="288" text-anchor="middle" class="viz-tick">ALB</text>
<text x="260" y="288" text-anchor="middle" class="viz-tick">nginx</text>
<text x="396" y="288" text-anchor="middle" class="viz-tick">Node.js</text>
<text x="532" y="288" text-anchor="middle" class="viz-tick">PostgreSQL</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Hops, from the client inward</text>
<polyline points="124,140.6 260,133.9 396,215.5" class="viz-s2"/>
<circle cx="124" cy="140.6" r="4" class="viz-d2"/>
<circle cx="260" cy="133.9" r="4" class="viz-d2"/>
<circle cx="396" cy="215.5" r="6" class="viz-d4"/>
<text x="396" y="240" text-anchor="middle" class="viz-value">5 s: closes before nginx</text>
<polyline points="124,140.6 260,140.6 396,92.1" class="viz-s3"/>
<circle cx="124" cy="140.6" r="4" class="viz-d3"/>
<circle cx="260" cy="140.6" r="4" class="viz-d3"/>
<circle cx="396" cy="92.1" r="6" class="viz-d4"/>
<text x="396" y="80" text-anchor="middle" class="viz-value">300 s: outlives the proxy</text>
<circle cx="532" cy="56" r="6" class="viz-d4"/>
<text x="532" y="44" text-anchor="middle" class="viz-value">no limit</text>
<text x="124" y="160" text-anchor="middle" class="viz-value">60</text>
<text x="260" y="120" text-anchor="middle" class="viz-value">75 / 60</text>
</svg>
<figcaption>Source: default values from the <a href="https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html">AWS ALB documentation</a> (idle timeout 60 s), the nginx <a href="https://nginx.org/en/docs/http/ngx_http_core_module.html#keepalive_timeout">keepalive_timeout</a> (75 s) and <a href="https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout">proxy_read_timeout</a> (60 s) directives, the <a href="https://nodejs.org/api/http.html#serverkeepalivetimeout">Node.js HTTP server</a> (keepAliveTimeout 5 s, requestTimeout 300 s), and PostgreSQL's <a href="https://www.postgresql.org/docs/current/runtime-config-client.html">statement_timeout</a> (0, disabled).</figcaption>
</figure>

The chart is the defaults, and both staircases are broken out of the box. That is not a criticism of any of the projects; each default is sensible for the component on its own. The bugs are in the combination, and nobody ships the combination.

## The 502 is the idle staircase reversed

Node's HTTP server closes an idle keep-alive connection after five seconds by default, per its [server.keepAliveTimeout](https://nodejs.org/api/http.html#serverkeepalivetimeout) documentation. nginx keeps an idle upstream connection for longer than that, and an application load balancer in front of nginx holds client connections for sixty, its [documented default](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html). So a request arrives at nginx, nginx picks an upstream connection that has been idle for five seconds and a few milliseconds, writes the request onto it, and Node has already closed its end. nginx sees a connection reset with no response, and the client gets a 502. It happens on a small fraction of requests, at random, more often under light load than heavy, which is the signature that sends people looking at the application code for a bug that is not there.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The race that produces a random 502</title>
<desc id="f2-d">Three lanes: nginx, the idle upstream socket, and Node. Node closes the socket at five seconds of idleness. A few milliseconds later nginx writes a new request onto the same socket, receives a reset, and returns 502 to the client. Setting Node's keep-alive timeout above nginx's fixes the order.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">nginx</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Idle upstream socket</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Node.js</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="320" y="74" text-anchor="middle" class="viz-label-muted">last response, t = 0; socket goes idle</text>
<line x1="540" y1="80" x2="103" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="116" text-anchor="middle" class="viz-label-muted">t = 5,000 ms: keepAliveTimeout, FIN</text>
<line x1="540" y1="122" x2="328" y2="122" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="207" y="158" text-anchor="middle" class="viz-label-muted">t = 5,004 ms: new request written</text>
<line x1="100" y1="164" x2="312" y2="164" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="207" y="200" text-anchor="middle" class="viz-label-muted">reset, no response</text>
<line x1="315" y1="206" x2="103" y2="206" class="viz-s4" marker-end="url(#f2-ah)"/>
<rect x="8" y="230" width="174" height="44" rx="8" class="viz-box-ink"/>
<text x="95" y="248" text-anchor="middle" class="viz-on-ink">502 Bad Gateway</text>
<text x="95" y="266" text-anchor="middle" class="viz-on-ink">to the client</text>
</svg>
<figcaption>Illustrative: the ordering of events that the default values allow; the fix is to make Node the last to close.</figcaption>
</figure>

The fix is one line, and it is the line the staircase tells you to write: set Node's keep-alive timeout above nginx's, and nginx's above the load balancer's. Node also has a headers timeout that must sit above its keep-alive timeout, which the Node documentation notes, because a keep-alive connection that has just been reused is waiting for headers, and the two timers interact. Once the idle staircase ascends inward, the outermost hop always closes first, and a socket is never reused after the far end has left.

## The hung pool is the deadline staircase reversed

The other direction is quieter and worse. PostgreSQL's [statement_timeout](https://www.postgresql.org/docs/current/runtime-config-client.html) is disabled by default, so a query that hits a lock or a bad plan runs until it finishes, however long that is. nginx's read timeout is sixty seconds, so after a minute nginx returns a 504 to the client and forgets the request. But the request is not over. Node is still waiting on the database, the database is still running the query, and the connection is still checked out of the pool. Repeat that a dozen times in a bad minute and the pool is empty, every new request queues behind a connection that will not come back for a while, and the service is down for a reason that no log line will state directly.

The fix is again what the staircase says: a statement timeout at the database shorter than the application's request deadline, which is shorter than the proxy's read timeout, which is shorter than the load balancer's. Then the database is always the first to give up, the application receives a clean error and releases the connection, the proxy receives a clean error from the application, and the client receives a real status instead of a silence that turned into a 504.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The two staircases, built the right way round</title>
<desc id="f3-d">A table with four hops as rows, load balancer, nginx, Node, PostgreSQL, and two columns. The idle column rises inward: 60, 75, 80 seconds, and not applicable for the database. The deadline column falls inward: 60, 30, 20, 15 seconds. Example values, chosen to satisfy the rules.</desc>
<text x="0" y="18" class="viz-title">Idle ascends inward, deadline descends inward</text>
<text x="0" y="36" class="viz-sub">Example values in seconds that satisfy both rules</text>
<text x="20" y="66" class="viz-tick">HOP</text>
<text x="300" y="66" text-anchor="middle" class="viz-tick">IDLE TIMEOUT</text>
<text x="500" y="66" text-anchor="middle" class="viz-tick">DEADLINE</text>
<line x1="0" y1="74" x2="640" y2="74" class="viz-axis"/>
<text x="20" y="100" class="viz-label">Load balancer</text>
<text x="300" y="100" text-anchor="middle" class="viz-value">60</text>
<text x="500" y="100" text-anchor="middle" class="viz-value">60</text>
<line x1="0" y1="110" x2="640" y2="110" class="viz-grid"/>
<text x="20" y="136" class="viz-label">nginx</text>
<text x="300" y="136" text-anchor="middle" class="viz-value">75</text>
<text x="500" y="136" text-anchor="middle" class="viz-value">30</text>
<line x1="0" y1="146" x2="640" y2="146" class="viz-grid"/>
<text x="20" y="172" class="viz-label">Node.js</text>
<text x="300" y="172" text-anchor="middle" class="viz-value">80</text>
<text x="500" y="172" text-anchor="middle" class="viz-value">20</text>
<line x1="0" y1="182" x2="640" y2="182" class="viz-grid"/>
<text x="20" y="208" class="viz-label">PostgreSQL</text>
<text x="300" y="208" text-anchor="middle" class="viz-label-muted">not a hop it holds</text>
<text x="500" y="208" text-anchor="middle" class="viz-value">15</text>
<line x1="0" y1="218" x2="640" y2="218" class="viz-grid"/>
<text x="0" y="248" class="viz-label-muted">Outermost closes idle sockets first; innermost gives up on slow work first.</text>
</svg>
<figcaption>Illustrative: one consistent assignment; the specific numbers matter less than their order.</figcaption>
</figure>

## Why the deadline staircase is the harder one

The idle staircase is a configuration problem: four numbers in four config files, checked once. The deadline staircase is a design problem, because a deadline the innermost hop enforces has to be a deadline the application can live with. Setting a statement timeout of fifteen seconds means every query in the system must finish in fifteen seconds, including the reporting query somebody wrote last spring. That is the correct constraint, and enforcing it surfaces the queries that were quietly taking a minute. But it surfaces them as errors, and a team that is not ready for that will raise the timeout back to nothing and lose the staircase.

The way through is to set the innermost deadline first, at the value the product needs, and to treat every query that breaks it as a defect to fix rather than a reason to loosen the number. The QR ticketing system's gate check is the sharpest version of this I have built: the deadline is however long a visitor will stand at a gate, the database has to answer inside it, and a query that cannot is not a slow query. It is a broken gate.

One more row belongs on the deadline staircase, and it is the one that hides. Health checks are requests too, and the load balancer's health check has its own timeout, usually a few seconds. If the application answers its health endpoint by touching the database, and the database's statement timeout is longer than the health check's, a slow database makes the health check time out, the load balancer marks the instance unhealthy, and traffic moves to the other instances, which are talking to the same slow database. The staircase says the health check's deadline is the shortest of all, and a health endpoint that cannot answer inside it should not be doing the work that made it slow.

## The check on paper

Both bugs can be found before they fire, without load tests, by drawing the chain and writing the two numbers on each hop. Read the idle column from the outside in: every number must be larger than the one before it. Read the deadline column from the outside in: every number must be smaller. Any step where a column flattens or reverses is a bug, and it is a bug you found in five minutes with a pen. Most timeout bugs I have seen were one staircase built the wrong way round, and every one of them was visible on paper the whole time.
