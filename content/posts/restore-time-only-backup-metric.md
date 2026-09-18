---
title: Restore time is the only backup metric
date: 2025-06-09
summary: Backup success rate is a vanity number. The number that decides whether a company survives is how long a restore takes from nothing, and in every public postmortem it ran long.
tags: Disaster Recovery, Backups, Postmortems
draft: false
---

Every backup dashboard I have seen reports the same thing: last night's job succeeded, the snapshot exists, the retention policy is in force. All true, all reassuring, and none of it is the number that matters. The number that matters is how long it takes to get from nothing, an empty cloud account, a repository and an offsite copy, to a system that passes its production health check. That number is rarely measured, because measuring it is frightening, and the three most instructive postmortems in the industry are instructive precisely because nobody had measured it before the day it mattered.

## Three restores that took longer than anyone planned

GitLab's [postmortem of its January 2017 database outage](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/) is the best-known. An engineer removed the data directory on the wrong server; the regular backups turned out not to be usable; the restore ran from a staging snapshot, which had to be copied across a slow network link, and the copy alone took about eighteen hours, with roughly six hours of production data lost for good.

Roblox's [account of its October 2021 outage](https://about.roblox.com/newsroom/2022/01/roblox-return-to-service-10-28-10-31-2021) describes seventy-three hours of downtime for a service with tens of millions of daily users, most of it spent diagnosing a pathological interaction between a service-discovery system and its storage engine before recovery could begin. Atlassian's [post-incident review of April 2022](https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage) describes a maintenance script that deleted 883 sites belonging to 775 customers, and a restoration that ran for up to two weeks because the recovery process had been designed for one site at a time, not for hundreds at once.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Time to restore in three public postmortems</title>
<desc id="f1-d">Horizontal bars on a logarithmic scale of hours: GitLab, January 2017, about 18 hours to copy the database back. Roblox, October 2021, 73 hours to full service. Atlassian, April 2022, up to 14 days, about 336 hours, for the last customers restored.</desc>
<text x="0" y="18" class="viz-title">Longer than anyone planned, every time</text>
<text x="0" y="36" class="viz-sub">Hours to restoration, log scale, from each company's own account</text>
<line x1="176" y1="52" x2="176" y2="154" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">GitLab, 2017</text>
<path d="M176 58 H328 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="348" y="73" class="viz-value">about 18 h</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Roblox, 2021</text>
<path d="M176 92 H420 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="440" y="107" class="viz-value">73 h</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Atlassian, 2022</text>
<path d="M176 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="580" y="141" class="viz-value">336 h</text>
<text x="0" y="190" class="viz-label-muted">Three causes, one finding: the restore path had never been run at full scale.</text>
<text x="0" y="222" class="viz-tick">log scale; the Atlassian figure is the upper end of a range that varied by customer</text>
</svg>
<figcaption>Source: the <a href="https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/">GitLab</a>, <a href="https://about.roblox.com/newsroom/2022/01/roblox-return-to-service-10-28-10-31-2021">Roblox</a> and <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage">Atlassian</a> postmortems.</figcaption>
</figure>

Three companies with more engineers than most of my clients have employees, three completely different root causes, and one shared property: the restore path had never been exercised under the conditions of the day, so the time it would take was a guess, and the guess was low. That is the pattern I want a small team to take from the large ones. The failure is not that the backup did not exist. It is that the time to use it was unknown.

## The empty-account drill

The drill I run for the systems CustomGlide maintains under retained support is simple to describe and uncomfortable to do. Start from a brand-new cloud account, with nothing in it. Give the person running the drill the repository, the offsite backup, and nothing else: no access to the old account, no colleague on chat, no wiki that is not in the repository. Start a stopwatch. Stop it when the production health check passes on the new account.

The elapsed time is the recovery objective. Not the one in the document; the real one. And every moment during the drill when the person had to look something up outside the repository, ask someone for a credential, or click through a console because the step was not scripted, is a finding, written down as it happens. The drill produces two outputs: a number and a list, and the list is the more valuable of the two, because it is the set of reasons the number is what it is.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The empty-account drill as a sequence with the stopwatch running</title>
<desc id="f2-d">Three lanes: the person running the drill, the new empty account, and the offsite backup. Steps in order: create the account, apply the infrastructure from the repository, fetch the backup, restore the database, deploy the application, and run the health check. Three points are marked where humans usually get involved: a credential that is not in the repository, a console step that is not scripted, and a backup that needs a key nobody can find.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Person, stopwatch</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Empty account</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Offsite backup</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="70" text-anchor="middle" class="viz-label-muted">apply infrastructure from the repo</text>
<line x1="100" y1="76" x2="312" y2="76" class="viz-arrow" marker-end="url(#f2-ah)"/>
<circle cx="207" cy="96" r="5" class="viz-d4"/><text x="220" y="100" class="viz-tick">finding: a credential not in the repo</text>
<text x="320" y="126" text-anchor="middle" class="viz-label-muted">fetch the backup</text>
<line x1="100" y1="132" x2="537" y2="132" class="viz-arrow" marker-end="url(#f2-ah)"/>
<circle cx="432" cy="152" r="5" class="viz-d4"/><text x="445" y="156" class="viz-tick">finding: single-holder key</text>
<text x="207" y="182" text-anchor="middle" class="viz-label-muted">restore, then deploy</text>
<line x1="100" y1="188" x2="312" y2="188" class="viz-arrow" marker-end="url(#f2-ah)"/>
<circle cx="207" cy="208" r="5" class="viz-d4"/><text x="220" y="212" class="viz-tick">finding: a console step nobody scripted</text>
<text x="207" y="242" text-anchor="middle" class="viz-label-muted">health check passes: stop the clock</text>
<line x1="315" y1="248" x2="103" y2="248" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="320" y="280" text-anchor="middle" class="viz-tick">the number is the objective; the findings are why it is that number</text>
</svg>
<figcaption>Illustrative: the drill as I run it for a PostgreSQL-backed containerised service; the three findings are the ones that appear most often.</figcaption>
</figure>

## What the drill finds

The findings repeat across systems with a regularity that is almost funny. The backup is encrypted, and the key is in a password manager that belongs to one person, who is on a flight. The infrastructure is in code, but one resource, usually a DNS record or an OAuth client, was created by hand and the code does not know about it. The database restores, but the application's first migration on a fresh database fails because the migrations were written against a schema that already existed. The container image is in a registry in the old account. The health check depends on a third-party service whose credential was rotated last year and stored nowhere.

None of these is exotic. Each is a few minutes to fix once found and a few hours to find during an incident, and the drill converts the second into the first. The list gets shorter each time the drill is run, and the number comes down with it, which is the only way I know to make a recovery objective true rather than aspirational.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Assumed and measured recovery time across repeated drills</title>
<desc id="f3-d">Two lines over five drills. The assumed recovery time, from the document, stays flat at two hours. The measured time starts far above it, near fourteen hours on the first drill, and falls with each drill as findings are fixed, reaching a little above the assumption by the fifth. The gap on the first drill is the part that would have been discovered during an incident.</desc>
<text x="0" y="18" class="viz-title">The document says two hours; the stopwatch disagrees, then converges</text>
<text x="0" y="36" class="viz-sub">Hours from empty account to passing health check; illustrative</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">measured</text>
<line x1="490" y1="31" x2="504" y2="31" class="viz-sgray"/><text x="510" y="35" class="viz-label-muted">assumed</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">16</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">12</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">8</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">4</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">drill 1</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">3</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">5</text>
<polyline points="56,238 600,238" class="viz-sgray"/>
<polyline points="56,82 192,147 328,186 464,212 600,225" class="viz-s1"/>
<circle cx="56" cy="82" r="4" class="viz-d1"/>
<circle cx="600" cy="225" r="4" class="viz-d1"/>
<text x="70" y="78" class="viz-value">14 h</text>
<text x="592" y="218" text-anchor="end" class="viz-value">3 h</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Each drill fixes its findings before the next</text>
</svg>
<figcaption>Illustrative: a series drawn to show the shape of convergence, not measured results from any client's system.</figcaption>
</figure>

## What to do with the number

The measured number goes in two places. It goes in the runbook, as the current recovery time with the date it was measured, replacing whatever aspiration was there. And it goes in the conversation with whoever owns the business, as a plain statement: if we lost the account tonight, we would be back in this many hours, and here is the list of things that make it that many rather than fewer. That conversation is where the drill earns its cost, because it converts an abstract worry into a priced list of fixes, and most of the fixes are cheap.

It also sets the cadence. A system whose measured recovery is under an hour and whose findings list is empty can be drilled quarterly. A system whose measured recovery is a day and whose list is long is drilled monthly until the list is short, because each drill is the fastest way to shorten it. The drill is not a compliance exercise to be done once and filed. It is how the number gets smaller.

## Why the drill has to start from nothing

Restoring into the existing account is a different and easier exercise, and it is the one most teams do when they do anything. It reuses the credentials, the DNS, the registry, the hand-made resources and the person's memory of where things are. It tests the backup file. It does not test the recovery, because the recovery, on the day it matters, may not have the account: a compromised root credential, a billing dispute, a region gone, a script that deleted the wrong thing at scale. The three postmortems above are, in different ways, all stories about the day the surrounding environment could not be relied on, and a drill that relies on it measures the wrong thing.

Starting from nothing is also what makes the drill honest about people. The drill is run by someone who does not carry the system in their head, or by the person who does, with the rule that nothing in their head counts. Every fact they needed and did not find in the repository is a fact that would have been unavailable if they had been the one on the flight.

## The metric, restated

Report one number for backups: the hours from an empty account to a passing health check, as last measured, with the date of the measurement. If the number has never been measured, report that, in those words, because it is the truth and it is more useful than a green tick next to last night's job. Then run the drill, fix the list, and run it again. Backup success rate tells you the file exists. Restore time tells you whether the company does.
