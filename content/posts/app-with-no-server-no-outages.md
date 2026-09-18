---
title: An app with no server has no outages
date: 2026-09-05
summary: Habits keeps every record in a Room database on the phone: no account, no sync, no backend. That removes whole categories of work and two things users want. Pricing both sides.
tags: Android, Offline-First, Product Strategy
draft: false
---

Habits, the tracker I built for Android, has no server. Every record lives in a [Room](https://developer.android.com/training/data-storage/room) database on the phone; there is no account to create, nothing to sync, no backend to keep alive. I made that decision for reasons of taste before I understood what it bought and what it cost, and the accounting is worth writing down because the same decision faces every small product, and it is usually made by default in the other direction. A server is the assumed starting point. It should be the exception, added for a specific reason, and the reason should be on a short list.

## The dividend

Start with what disappears when there is no server. Uptime disappears as a concern: there is nothing to be down, no on-call, no status page, no incident retrospective. Authentication disappears: no passwords to store, no reset flow, no session tokens, no account takeover to defend against. Per-user cost disappears: the thousandth user costs exactly what the first did, which is nothing, so there is no pricing model needed to cover infrastructure and no reason to gate features behind one. The privacy policy shrinks to a paragraph, because there is nothing to describe: the data is on the device, the app does not send it anywhere, and the sentence is true. Compliance questions about data residency and retention answer themselves. And the codebase loses an entire tier, the API layer, its client, the retry logic, the migration coordination between server and app versions.

That is a long list, and it is the dividend for a decision most products never consider. The costs are shorter but they are real.

## The price list

There are three things a user wants from an app that a device-only design cannot give them directly: a second device, a guaranteed backup, and recovery when the phone is lost. Android covers part of the second and third for free, and it is worth being exact about how much. [Auto Backup](https://developer.android.com/identity/data/autobackup) copies an app's internal files, shared preferences and database files to a private folder in the user's Google Drive, with a quota of 25 megabytes per app that does not count against the user's own storage. It runs when the device has been idle, on Wi-Fi, at least 24 hours since the last backup, which in practice means roughly nightly, and only the most recent backup is kept. On Android 9 and later the backup is end-to-end encrypted with the device's lock screen credential. When the user sets up a new phone with the same account, the data is restored.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The data lifecycle of a device-only app: Room database, Auto Backup, restore, and uninstall</title>
<desc id="f1-d">A flow. The app writes to a Room database on the device. Auto Backup copies it nightly, when idle on Wi-Fi, to a private folder in the user's Google Drive, within a 25 megabyte quota. A new device with the same account restores from that copy. Uninstalling the app deletes the local data; the backup persists until it is replaced or the account's backup is cleared.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Where the data goes when there is no server</text>
<rect x="8" y="60" width="150" height="64" rx="8" class="viz-box-accent"/>
<text x="83" y="86" text-anchor="middle" class="viz-label">Room database</text>
<text x="83" y="104" text-anchor="middle" class="viz-label-muted">on the device</text>
<line x1="160" y1="92" x2="188" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="174" y="52" text-anchor="middle" class="viz-tick">nightly</text>
<rect x="192" y="60" width="170" height="64" rx="8" class="viz-box"/>
<text x="277" y="86" text-anchor="middle" class="viz-label">Auto Backup</text>
<text x="277" y="104" text-anchor="middle" class="viz-label-muted">private Drive folder, 25 MB</text>
<line x1="364" y1="92" x2="392" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="378" y="52" text-anchor="middle" class="viz-tick">new phone</text>
<rect x="396" y="60" width="150" height="64" rx="8" class="viz-box"/>
<text x="471" y="86" text-anchor="middle" class="viz-label">Restore</text>
<text x="471" y="104" text-anchor="middle" class="viz-label-muted">same account, at setup</text>
<line x1="83" y1="126" x2="83" y2="170" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="8" y="174" width="150" height="50" rx="8" class="viz-box-ink"/>
<text x="83" y="196" text-anchor="middle" class="viz-on-ink">Uninstall</text>
<text x="83" y="214" text-anchor="middle" class="viz-on-ink">local data gone</text>
<text x="380" y="180" class="viz-label-muted">The platform gives, for free:</text>
<text x="380" y="200" class="viz-label-muted">nightly copy, restore to next phone</text>
<text x="380" y="220" class="viz-label-muted">Not given: two phones at once,</text>
<text x="380" y="240" class="viz-label-muted">or a restore on demand</text>
</svg>
<figcaption>Illustrative: the lifecycle as the <a href="https://developer.android.com/identity/data/autobackup">Auto Backup documentation</a> describes it, drawn for a Room-backed app.</figcaption>
</figure>

That covers the ordinary case: a phone is replaced, the data comes back. It does not cover a second device used at the same time, because Auto Backup is a restore mechanism, not a sync. It does not let the user trigger a restore on demand, and it does not keep history, so a corrupted database backed up last night has replaced the good one from the night before. And it has a quota, which for a habit tracker is generous and for a photo journal is not.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The constraints of Android Auto Backup</title>
<desc id="f2-d">A table of four constraints with their values: per-app quota, 25 megabytes; minimum interval between backups, 24 hours, and only when idle on Wi-Fi; backups retained, one, the most recent; encryption, end-to-end with the lock screen credential on Android 9 and later. Each row notes what it means for a device-only app.</desc>
<text x="0" y="18" class="viz-title">Free, nightly, and one copy deep</text>
<text x="20" y="48" class="viz-tick">CONSTRAINT</text>
<text x="240" y="48" class="viz-tick">VALUE</text>
<text x="420" y="48" class="viz-tick">MEANS FOR THE APP</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Quota per app</text>
<text x="240" y="82" class="viz-value">25 MB</text>
<text x="420" y="82" class="viz-label-muted">years of records; no photos</text>
<line x1="0" y1="96" x2="640" y2="96" class="viz-grid"/>
<text x="20" y="122" class="viz-label">Interval</text>
<text x="240" y="122" class="viz-value">24 h, idle, Wi-Fi</text>
<text x="420" y="122" class="viz-label-muted">up to a day of entries at risk</text>
<line x1="0" y1="136" x2="640" y2="136" class="viz-grid"/>
<text x="20" y="162" class="viz-label">Copies retained</text>
<text x="240" y="162" class="viz-value">1, the latest</text>
<text x="420" y="162" class="viz-label-muted">a bad night replaces a good one</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="20" y="202" class="viz-label">Encryption</text>
<text x="240" y="202" class="viz-value">end to end, API 28+</text>
<text x="420" y="202" class="viz-label-muted">the developer never sees it</text>
<line x1="0" y1="216" x2="640" y2="216" class="viz-grid"/>
</svg>
<figcaption>Source: the Android <a href="https://developer.android.com/identity/data/autobackup">Auto Backup documentation</a>, September 2026.</figcaption>
</figure>

## The rule

So the price list has three items: a second device, a backup the user controls, and recovery that does not depend on the platform's schedule. The rule for a new product is that it should start with no server when nothing on that list is a launch requirement, and it should add a server only for the item that becomes one, and only as much server as that item needs. The reason to state it that way is that the items have very different prices, and a full backend buys all three whether or not they were wanted.

A user-controlled backup is the cheapest item, and it needs no server at all: an export to a file the user keeps, and an import that reads it, which for a small database is an afternoon's work and which also happens to be the portability feature that lets the data leave the app. On-demand recovery is the same feature seen from the other side. A second device is the expensive item, because it is sync, and sync means conflict resolution, identity, and a place for the data to meet, which is a server and everything that comes with it. Habits has no second-device requirement, so it has no server, and the export is the honest answer to the backup question.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">When a product can start with no server: identity against multi-device</title>
<desc id="f3-d">A two by two grid. Horizontal axis: needs more than one device, no on the left and yes on the right. Vertical axis: needs identity, no at the bottom and yes at the top. Bottom left: no server; device-only with export, where a habit tracker sits. Bottom right: a sync service without accounts, such as a pairing code. Top left: an account for identity but data stays local. Top right: a full backend. The bottom-left cell is highlighted.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Identity, local data</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">an account for who, not for what</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Full backend</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">accounts, sync, everything</text>
<rect x="60" y="196" width="264" height="144" rx="8" class="viz-box-accent"/>
<text x="192" y="256" text-anchor="middle" class="viz-label">No server</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">device only, with export</text>
<circle cx="192" cy="300" r="6" class="viz-d1"/>
<text x="464" y="256" text-anchor="middle" class="viz-label">Sync without identity</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">a pairing code, a relay</text>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Needs more than one device: no on the left, yes on the right</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Needs identity: no below, yes above</text>
</svg>
<figcaption>Illustrative: the decision as a grid; the dot is where a habit tracker sits, and most small tools start in the same cell.</figcaption>
</figure>

## The export is the backup

The export deserves a closer look, because it is the item on the price list that costs the least and settles the most. In a device-only app it is a file: the database's contents written out in a plain, documented format, JSON for structure or CSV for anything tabular, handed to the system share sheet so that the user can send it to their own cloud drive, their email, or another phone. The import reads the same file back, and the only design decision of any weight is what to do when the file and the current database both have entries: merge by identity where records have stable ids, and otherwise ask.

That single feature does three jobs. It is the backup the user controls, taken when they choose and kept where they choose, independent of the platform's nightly schedule and its one-copy limit. It is the recovery path that does not depend on setting up a new phone with the same account. And it is portability: the data can leave the app, into a spreadsheet or into a competitor, which is a promise a device-only app can make more credibly than most, because there is no server whose business depends on keeping the data in. The whole feature is a few hundred lines, and it removes two of the three items from the price list without adding a byte of infrastructure.

## What the grid says about the default

The grid's useful property is that the cells are not equally expensive, and the expensive one is the one most products start in. Bottom left is free. Top left, identity without server-held data, is cheap if the platform provides sign-in and the data stays on the device. Bottom right, sync without identity, is a smaller server than people expect: a relay that passes encrypted blobs between two devices that share a pairing code, with no accounts and nothing readable on the server. Top right is the full cost, and it is the cost that the dividend list above was measured against.

Most small products belong in the bottom left at launch and drift toward the top right by assumption rather than by need, because the assumption is that a real product has a backend. The device-only version ships faster, costs nothing to run, cannot leak what it does not hold, and has no outages. The day a user needs the same data on two phones is the day to add a relay, and not a day before.

## Where the design has been honest with me

The decision has one cost I did not price at the start, and it is worth naming. A device-only app cannot tell its developer anything. There is no server log to read, no usage count, no crash report with context unless the platform's own reporting is turned on. Every product decision is made on judgement and on what people say, not on what they do, and that is a different way of working from the one the industry teaches. I have found it a better way for a tool this small, because the questions I can answer without data, does the screen make sense, is the export easy to find, are the ones that matter for it. For a product where behaviour needs measuring, that is an item for the price list too, and it is the one that a server is least honestly added for.
