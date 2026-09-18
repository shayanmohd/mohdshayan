---
title: What survives a pg_dump
date: 2026-07-04
summary: Disk encryption defends against a stolen drive; databases are breached by a dump run with the app's own credentials. Sort each column by whether it stays unreadable in that dump.
tags: PostgreSQL, Encryption, Threat Modelling
draft: false
---

Every managed database console has a checkbox called encryption at rest, and every compliance questionnaire asks whether it is ticked. It should be. It also defends against one specific event, someone walking off with the physical disk or a raw volume snapshot, and that is not how databases are breached. They are breached by someone who obtains the application's own connection string and runs [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), which returns every row in plain text because, to the database, that person is the application. The useful question for each column is therefore not "is the disk encrypted" but "what does this column look like in that dump". I call it the dump test, and it sorts every column into one of three layers.

## The credential is the attack surface

The reason the dump is the realistic threat is that application credentials leak constantly. GitGuardian's [2026 report](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/) counted 28.65 million new hardcoded secrets pushed to public GitHub in 2025, up 34 percent on the year, and the [previous year's report](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2025/) found that the single most commonly leaked secret type in public repositories was a MongoDB connection string, at 18.8 percent, with 70 percent of the secrets leaked in 2022 still valid when checked. A connection string in a commit, a config file in a container image, an environment variable in a crash report: each is a full-access credential, and none of them involves a disk.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">New hardcoded secrets on public GitHub, by year</title>
<desc id="f1-d">Three vertical bars: 2023, about 19 million, derived from the reported growth; 2024, 23.8 million; 2025, 28.65 million. The latest bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">The credential leaks before the disk does</text>
<text x="0" y="36" class="viz-sub">Millions of new hardcoded secrets detected on public GitHub per year</text>
<line x1="40" y1="180" x2="600" y2="180" class="viz-axis"/>
<path d="M120 84 H200 a4 4 0 0 1 4 4 V180 H116 V88 a4 4 0 0 1 4 -4 Z" class="viz-fgray"/>
<text x="160" y="76" text-anchor="middle" class="viz-value">19.0</text>
<text x="160" y="202" text-anchor="middle" class="viz-tick">2023, derived</text>
<path d="M280 61 H360 a4 4 0 0 1 4 4 V180 H276 V65 a4 4 0 0 1 4 -4 Z" class="viz-fgray"/>
<text x="320" y="53" text-anchor="middle" class="viz-value">23.8</text>
<text x="320" y="202" text-anchor="middle" class="viz-tick">2024</text>
<path d="M440 37 H520 a4 4 0 0 1 4 4 V180 H436 V41 a4 4 0 0 1 4 -4 Z" class="viz-f1"/>
<text x="480" y="29" text-anchor="middle" class="viz-value">28.65</text>
<text x="480" y="202" text-anchor="middle" class="viz-tick">2025</text>
<text x="320" y="224" text-anchor="middle" class="viz-label-muted">The 2023 value is the 2024 figure divided by its reported 25 percent growth.</text>
</svg>
<figcaption>Source: GitGuardian's <a href="https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/">2026</a> and <a href="https://blog.gitguardian.com/the-state-of-secrets-sprawl-2025/">2025</a> State of Secrets Sprawl reports; the 2023 bar is derived from the 2025 report's growth figure.</figcaption>
</figure>

## Three layers, three attackers

Encryption protects data against a particular attacker, and the layers line up against the attackers in a matrix that is worth drawing once. Volume encryption, the checkbox, defends against the stolen disk and nothing else: the database decrypts the volume on boot, so anyone who can talk to the database sees plaintext. Application-layer encryption, where the application encrypts a column's value before writing it and the key lives in a key management service outside the database, defends against the stolen disk and against the stolen credential, because the dump contains ciphertext and the key is not in the database. It does not defend against an attacker who has taken over the application server, because that server can ask the key service for the key. Only data that is never stored, or that is encrypted by the client before it reaches the server, survives that third attacker.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Which encryption layer defends against which attacker</title>
<desc id="f2-d">A three by three matrix. Rows: volume encryption, application-layer encryption with a key held outside the database, and client-side encryption or not storing the data. Columns: stolen disk or snapshot, stolen application credentials, compromised application server. Volume encryption defends only the first column. Application-layer defends the first two. Client-side or not stored defends all three.</desc>
<text x="0" y="18" class="viz-title">Three layers against three attackers</text>
<text x="230" y="52" text-anchor="middle" class="viz-tick">STOLEN DISK</text>
<text x="380" y="52" text-anchor="middle" class="viz-tick">STOLEN CREDENTIAL</text>
<text x="540" y="52" text-anchor="middle" class="viz-tick">COMPROMISED SERVER</text>
<line x1="0" y1="60" x2="640" y2="60" class="viz-axis"/>
<text x="8" y="94" class="viz-label">Volume encryption</text>
<rect x="222" y="80" width="16" height="16" rx="3" class="viz-f1"/>
<rect x="372" y="80" width="16" height="16" rx="3" class="viz-box"/>
<rect x="532" y="80" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="112" x2="640" y2="112" class="viz-grid"/>
<text x="8" y="146" class="viz-label">Application layer, key outside</text>
<rect x="222" y="132" width="16" height="16" rx="3" class="viz-f1"/>
<rect x="372" y="132" width="16" height="16" rx="3" class="viz-f1"/>
<rect x="532" y="132" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="164" x2="640" y2="164" class="viz-grid"/>
<text x="8" y="198" class="viz-label">Client side, or not stored</text>
<rect x="222" y="184" width="16" height="16" rx="3" class="viz-f1"/>
<rect x="372" y="184" width="16" height="16" rx="3" class="viz-f1"/>
<rect x="532" y="184" width="16" height="16" rx="3" class="viz-f1"/>
<line x1="0" y1="216" x2="640" y2="216" class="viz-grid"/>
<rect x="8" y="236" width="12" height="12" rx="3" class="viz-f1"/><text x="26" y="247" class="viz-label-muted">defends</text>
<rect x="100" y="236" width="12" height="12" rx="3" class="viz-box"/><text x="118" y="247" class="viz-label-muted">does not</text>
<text x="380" y="247" class="viz-label-muted">The middle column is the dump test.</text>
</svg>
<figcaption>Illustrative: the standard layering, drawn so that the column a pg_dump attacker occupies is visible.</figcaption>
</figure>

The matrix explains why "encrypted at rest" on a provider's console changes nothing in the middle column. It also explains the cost of the second row. Application-layer encryption means the database cannot index, sort or search the column, every read pays a round trip to the key service or a cached data key, and key rotation becomes the application's job. That cost is worth paying for some columns and absurd for others, and the dump test is how to tell which.

## The dump test

Take the schema, imagine the output of pg_dump run with the application's connection string in a stranger's hands, and mark each column with one of three outcomes. Readable: the value is plaintext in the dump, and that is acceptable, because the value is not sensitive or because the application needs to query it in ways encryption forbids. Unreadable: the value must be ciphertext in the dump, encrypted in the application with a key the database never holds. Not there: the value should not be in the database at all, because a version of it that is useless when unreadable exists, a hash, a token from a payment processor, a reference to a store built for that data.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The dump test applied to a CRM schema</title>
<desc id="f3-d">A list of columns from a CRM schema, each marked with one of three outcomes. Readable: contact name, company, deal stage, deal amount, ticket status. Unreadable, encrypted in the application: ticket body, contact notes, connected-mailbox tokens, phone number. Not stored: card numbers, which go to the payment processor as a token; passwords, which are stored only as a hash.</desc>
<text x="0" y="18" class="viz-title">Three outcomes for a CRM's columns</text>
<rect x="8" y="40" width="200" height="220" rx="8" class="viz-box"/>
<text x="108" y="66" text-anchor="middle" class="viz-label">Readable</text>
<text x="108" y="84" text-anchor="middle" class="viz-tick">needed for search</text>
<text x="24" y="114" class="viz-label-muted">contacts.name</text>
<text x="24" y="138" class="viz-label-muted">contacts.company</text>
<text x="24" y="162" class="viz-label-muted">deals.stage</text>
<text x="24" y="186" class="viz-label-muted">deals.amount</text>
<text x="24" y="210" class="viz-label-muted">tickets.status</text>
<text x="24" y="234" class="viz-label-muted">memberships.role</text>
<rect x="220" y="40" width="200" height="220" rx="8" class="viz-box-accent"/>
<text x="320" y="66" text-anchor="middle" class="viz-label">Unreadable</text>
<text x="320" y="84" text-anchor="middle" class="viz-tick">encrypted, key outside</text>
<text x="236" y="114" class="viz-label-muted">tickets.body</text>
<text x="236" y="138" class="viz-label-muted">contacts.notes</text>
<text x="236" y="162" class="viz-label-muted">mailboxes.refresh_token</text>
<text x="236" y="186" class="viz-label-muted">contacts.phone</text>
<text x="236" y="210" class="viz-label-muted">calls.transcript</text>
<rect x="432" y="40" width="200" height="220" rx="8" class="viz-box-ink"/>
<text x="532" y="66" text-anchor="middle" class="viz-on-ink">Not there</text>
<text x="532" y="84" text-anchor="middle" class="viz-on-ink">useless if read</text>
<text x="448" y="114" class="viz-on-ink">cards: processor token</text>
<text x="448" y="138" class="viz-on-ink">passwords: hash only</text>
<text x="448" y="162" class="viz-on-ink">ID documents: object store,</text>
<text x="448" y="180" class="viz-on-ink">reference only</text>
<text x="320" y="288" text-anchor="middle" class="viz-label-muted">Most columns are in the first box, which is why the second box is affordable.</text>
</svg>
<figcaption>Illustrative: a generic CRM schema of the kind I build, sorted by the test; no client's data or names are involved.</figcaption>
</figure>

Run on a CRM schema of the kind I build, with pipelines, campaigns and service tickets in PostgreSQL, the test sorts most columns into the first box, and that is the point that makes the second box affordable. Names, companies, stages and amounts need to be searched, sorted and summed, so they stay readable and the disk checkbox is their only protection, which is honest: the dump reveals a customer list, and a customer list is what a CRM is. The columns that go into the second box are the ones where the dump would reveal something the customer list does not: the bodies of support tickets, free-text notes, call transcripts, and the refresh tokens for connected mailboxes, which are credentials to a different system and whose exposure is a second breach. Phone numbers sit at the boundary; they can go in the second box with a keyed hash alongside for exact-match lookup, which is a fair trade for losing prefix search.

The third box is the one people forget exists. Card numbers do not belong in the schema at all, because the payment processor will hold them and hand back a token that is useless in a dump. Passwords are stored as a slow hash, never encrypted, because a hash cannot be decrypted by anyone, including the application. Uploaded identity documents belong in an object store with their own access control, with the database holding only a reference. For each of these the question is not how to protect the column but why the column exists.

## The dump is also the backup

The same command that models the attacker runs every night as the backup, and that is the second reason the test is the right lens. Whatever the dump test says a column looks like is also what it looks like in every backup, in the object storage bucket the backups are copied to, in the read replica, and in the nightly export to the analytics warehouse where the data science team has a broader set of credentials than the application does. Volume encryption on the primary says nothing about any of those copies. Application-layer encryption travels with the data: a column that is ciphertext in the table is ciphertext in the backup and in the warehouse, and the key service's access log is the one place that records who ever turned it back into text.

That property has a price that has to be paid up front. If the key is lost, every copy of the column is lost with it, including the backups that were supposed to be the safety net, so the key service's own durability and the procedure for escrowing its keys become part of the database's backup plan. And the warehouse loses the column entirely unless a deliberate decision is made to decrypt on the way in, which is a decision worth making in writing, because a warehouse that holds readable ticket bodies has the same dump test to pass as the database did and usually a wider audience.

## Running it

The test takes an afternoon for a schema of a hundred tables, and its output is a list of columns for the second box, each with a note on which queries it breaks. That list is the actual work: adding an encryption step in the data access layer, choosing an [envelope encryption](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping) scheme so that the key service signs data keys rather than every row, deciding how rotation happens, and replacing the broken queries with hashed lookups or application-side filtering. Everything not on the list stays as it is, and the disk checkbox stays ticked.

What the test refuses to do is let a console setting stand in for a decision. The setting answers the stolen-disk column of the matrix. The dump is the other column, it is the one the leaked-secret numbers describe, and the only thing that changes what it contains is deciding, column by column, what should be in it.
