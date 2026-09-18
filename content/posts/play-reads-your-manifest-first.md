---
title: Play reads your manifest before your users do
date: 2025-12-27
summary: Every permission line in an Android manifest is a promise Google Play reviews before a user sees the app, with less context than the user has. The account carries the risk.
tags: Android, Google Play, Release Engineering
draft: false
---

An Android manifest is read twice before anyone uses the app. The device reads it at install, to know what the app may ask for. Google Play reads it before that, at review, to decide whether the app may be listed at all, and the reviewer has less context than the user will: no onboarding screen, no explanation, just a list of permissions and a policy that says which ones need justifying. When eight apps ship under one developer account, as mine do, a permission that looks unjustified in one app is a strike against the account that publishes all eight. The habit that keeps the account clean is boring and effective: a written reason for every permission, a screen where it is asked, and a path through the app when it is refused, kept in one table that the release process reads before the reviewer does.

## The policy has been tightening for years

Play's permission policy has moved in one direction, and each move has the same shape: a permission group that used to be free to request becomes one that must be justified or replaced. The [permissions policy](https://support.google.com/googleplay/android-developer/answer/10158779) restricts the SMS and call log groups to apps whose core purpose needs them, treats the inventory of installed apps as personal data so that broad package visibility is allowed only for apps like launchers, file managers and security tools, and requires high-risk permissions to be declared through a form in the console. The [photo and video policy](https://support.google.com/googleplay/android-developer/answer/14115180) says that apps targeting Android 13 or later may request the broad media permissions only when the system photo picker is not sufficient, which for one-time or occasional access it always is, with full compliance mandatory for every developer from 28 May 2025 and non-compliant apps subject to removal after that date.

<figure class="chart">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Google Play permission policy milestones, 2019 to 2025</title>
<desc id="f1-d">A timeline with four points: 2019, SMS and call log permissions restricted to core-purpose apps; 2021, package visibility restricted and broad app inventory access declared; 2024, foreground service types required with declarations; 28 May 2025, photo and video permissions restricted with the photo picker required for occasional access.</desc>
<line x1="40" y1="100" x2="600" y2="100" class="viz-axis"/>
<circle cx="80" cy="100" r="6" class="viz-d1"/>
<text x="80" y="74" text-anchor="middle" class="viz-tick">2019</text>
<text x="80" y="56" text-anchor="middle" class="viz-label">SMS and call log</text>
<circle cx="250" cy="100" r="6" class="viz-d1"/>
<text x="250" y="134" text-anchor="middle" class="viz-tick">2021</text>
<text x="250" y="152" text-anchor="middle" class="viz-label">package visibility</text>
<circle cx="420" cy="100" r="6" class="viz-d1"/>
<text x="420" y="74" text-anchor="middle" class="viz-tick">2024</text>
<text x="420" y="56" text-anchor="middle" class="viz-label">foreground service types</text>
<circle cx="570" cy="100" r="6" class="viz-d1"/>
<text x="570" y="134" text-anchor="middle" class="viz-tick">28 May 2025</text>
<text x="570" y="152" text-anchor="middle" class="viz-label">photos and video</text>
<text x="320" y="188" text-anchor="middle" class="viz-label-muted">Each step turns a free-to-request permission into one that needs a reason or a replacement.</text>
</svg>
<figcaption>Source: the Google Play <a href="https://support.google.com/googleplay/android-developer/answer/10158779">permissions policy</a> and <a href="https://support.google.com/googleplay/android-developer/answer/14115180">photo and video permissions policy</a>; the earlier dates are the years each restriction came into force, the last is the date the policy names.</figcaption>
</figure>

The direction is the point. A permission that is acceptable today is a candidate for the next restriction, and an app whose manifest carries permissions it does not need is an app that will fail a future review for a reason nobody remembers adding. The photo picker rule caught a great many apps that had requested storage access years earlier for a feature since removed, and the fix in each case was not engineering but archaeology: finding out why the line was there.

## The permission ledger

The archaeology is what the ledger prevents. It is a table with one row per manifest permission and five columns: the user-visible reason, in the words the app will show; the screen on which the permission is requested, which must be the screen where the feature that needs it is used; the fallback when the user refuses, which must be a working path through the app and not a dead end; the policy section the permission falls under; and the date and release in which it was added. A permission without a complete row does not ship. A row whose reason no longer describes a feature in the app is a permission to remove.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The permission ledger for a small habit tracker</title>
<desc id="f2-d">A table with rows for each permission a habit tracker might declare. Post notifications: reason, remind you at the time you chose; screen, the reminder settings; fallback, reminders shown in-app only; policy, user data and notifications. Exact alarms: reason, fire the reminder at the exact minute; screen, when a reminder time is set; fallback, inexact alarm within a window; policy, alarms and reminders. Internet: not declared, the app has no server. Read media images: not declared, no feature needs photos. Two rows are marked as candidates for removal because their reason no longer matches a feature.</desc>
<text x="0" y="18" class="viz-title">One row per line in the manifest</text>
<text x="20" y="48" class="viz-tick">PERMISSION</text>
<text x="200" y="48" class="viz-tick">REASON SHOWN</text>
<text x="400" y="48" class="viz-tick">SCREEN</text>
<text x="520" y="48" class="viz-tick">IF REFUSED</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">Post notifications</text>
<text x="200" y="84" class="viz-label-muted">remind you at your time</text>
<text x="400" y="84" class="viz-label-muted">reminder settings</text>
<text x="520" y="84" class="viz-label-muted">in-app reminders</text>
<line x1="0" y1="98" x2="640" y2="98" class="viz-grid"/>
<text x="20" y="126" class="viz-label">Schedule exact alarm</text>
<text x="200" y="126" class="viz-label-muted">fire at the exact minute</text>
<text x="400" y="126" class="viz-label-muted">when a time is set</text>
<text x="520" y="126" class="viz-label-muted">inexact window</text>
<line x1="0" y1="140" x2="640" y2="140" class="viz-grid"/>
<text x="20" y="168" class="viz-label">Vibrate</text>
<text x="200" y="168" class="viz-label-muted">buzz with the reminder</text>
<text x="400" y="168" class="viz-label-muted">reminder settings</text>
<text x="520" y="168" class="viz-label-muted">silent reminder</text>
<line x1="0" y1="182" x2="640" y2="182" class="viz-grid"/>
<rect x="8" y="192" width="624" height="34" rx="6" class="viz-box-accent"/>
<text x="20" y="214" class="viz-label">Internet</text>
<text x="200" y="214" class="viz-label-muted">no feature needs it: the app has no server</text>
<text x="520" y="214" class="viz-value">remove</text>
<rect x="8" y="232" width="624" height="34" rx="6" class="viz-box-accent"/>
<text x="20" y="254" class="viz-label">Read media images</text>
<text x="200" y="254" class="viz-label-muted">reason points at a feature removed two releases ago</text>
<text x="520" y="254" class="viz-value">remove</text>
<line x1="0" y1="278" x2="640" y2="278" class="viz-grid"/>
<text x="0" y="308" class="viz-label-muted">The highlighted rows are the point: permissions with no living reason, found first.</text>
</svg>
<figcaption>Illustrative: a ledger for a habit tracker of the kind I ship; the rows are examples of the shape, not a specific app's manifest.</figcaption>
</figure>

The three middle columns do work that the policy text asks for in different words. The reason column is what the permissions declaration form wants, written once and reused. The screen column enforces the rule that permissions are requested in context, at the moment the feature needs them and not at first launch, which is both policy and the single largest factor in whether users grant them. The fallback column is the one most teams skip and the one the photo policy makes explicit: an app must make a reasonable effort to work for a user who declines, and a feature that dead-ends on refusal is a feature that will be described in a review as coercive.

## The review path, with the ledger feeding it

The ledger is not documentation for its own sake; it feeds the release process at the points where Play asks questions. The console's data safety section and the permissions declaration form are both filled in from the ledger's columns, so that the answers Play sees are the same answers the app shows users, which is the consistency a reviewer is checking for. A pull request that adds a manifest permission fails a check unless it also adds a ledger row, and a release checklist step diffs the manifest against the ledger so that a permission added by a dependency, which happens more often than people expect, is caught before upload rather than by the reviewer.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The review path from upload through policy review to publication, with the ledger feeding the declaration forms</title>
<desc id="f3-d">A flow: the manifest is diffed against the ledger in continuous integration; the bundle is uploaded; the console's declaration forms and data safety section are filled from the ledger; Play's policy review reads the manifest and the declarations; the app is published, or a policy issue is raised against the account. The ledger feeds the forms and the diff, and the account, not the app, is marked as where a strike lands.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">The ledger answers the reviewer before the reviewer asks</text>
<rect x="8" y="60" width="120" height="60" rx="8" class="viz-box-accent"/>
<text x="68" y="86" text-anchor="middle" class="viz-label">Ledger</text>
<text x="68" y="104" text-anchor="middle" class="viz-label-muted">one row each</text>
<line x1="130" y1="90" x2="150" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="154" y="60" width="120" height="60" rx="8" class="viz-box"/>
<text x="214" y="86" text-anchor="middle" class="viz-label">CI diff</text>
<text x="214" y="104" text-anchor="middle" class="viz-label-muted">manifest vs ledger</text>
<line x1="276" y1="90" x2="296" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="300" y="60" width="120" height="60" rx="8" class="viz-box"/>
<text x="360" y="86" text-anchor="middle" class="viz-label">Declarations</text>
<text x="360" y="104" text-anchor="middle" class="viz-label-muted">from the ledger</text>
<line x1="422" y1="90" x2="442" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="446" y="60" width="120" height="60" rx="8" class="viz-box"/>
<text x="506" y="86" text-anchor="middle" class="viz-label">Policy review</text>
<text x="506" y="104" text-anchor="middle" class="viz-label-muted">manifest and forms</text>
<line x1="568" y1="90" x2="588" y2="90" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="592" y="60" width="40" height="60" rx="8" class="viz-box-ink"/>
<text x="612" y="95" text-anchor="middle" class="viz-on-ink">live</text>
<path d="M506 122 V170 H320" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="160" y="150" width="156" height="40" rx="8" class="viz-box-ink"/>
<text x="238" y="175" text-anchor="middle" class="viz-on-ink">issue against the account</text>
<text x="320" y="226" text-anchor="middle" class="viz-label-muted">A strike lands on the account behind all eight apps, so the ledger is kept per account.</text>
<text x="320" y="250" text-anchor="middle" class="viz-tick">the diff catches permissions that dependencies add without anyone deciding to</text>
</svg>
<figcaption>Illustrative: the release path as I run it; the ledger is the single source for both the automated check and the console forms.</figcaption>
</figure>

## Two permissions that look free and are not

Two lines in particular deserve rows because they are so easily added without thought. The first is the internet permission, which nearly every template includes and which a device-only app does not need; its presence in an app that promises not to send data anywhere is a contradiction a reviewer can see in the manifest and a user can see in the store listing, and removing it is the cheapest credibility an offline app can buy. The second is the exact alarm permission, which reminder features reach for by habit and which Android 12 and later treat as a user-revocable grant; its row needs a fallback, an inexact alarm within a window, because a user who revokes it must still get their reminder, late by a few minutes rather than never.

The ledger also has to say who owns each row, because permissions arrive from libraries as often as from feature work. An analytics or advertising dependency can add a permission through its own manifest that merges into the app's, and the first the team hears of it is a reviewer's question. The diff in continuous integration is what catches that, and the row it demands is what forces the decision: keep the dependency and justify the permission, or drop the dependency. There is no third option, and pretending there is one is how manifests grow lines nobody can explain.

## Why the account is the unit of risk

Google Play's enforcement is applied to developer accounts, and the practical meaning of that for a small studio is that every app is a liability for every other. A permissions problem in the least-used of eight apps is not contained to that app; repeated or serious issues escalate to the account, and an account under enforcement cannot publish updates to any of its apps. That is the asymmetry the ledger is built for. The cost of a row is ten minutes per permission. The cost of a missing one is, in the worst case, every release of every app stalled while an appeal is written about a line in a manifest that nobody remembers adding.

It also changes what "minimal permissions" means. For a single app, minimal is a nice principle. For an account with several, minimal is a control on shared risk, and the ledger is the mechanism: fewer rows means fewer things to justify, fewer surfaces for a future policy to catch, and fewer questions from a reviewer who has only the manifest to go on. The manifest is the first thing Play reads and the last thing most developers look at. Reading it first, with a ledger, is how the eight apps keep publishing.
