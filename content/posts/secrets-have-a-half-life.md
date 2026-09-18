---
title: Secrets have a half-life
date: 2026-03-05
summary: Leaked credentials keep working for years. The number that matters is not how many leak but how fast a leaked one stops working, and a secrets programme should be built on that.
tags: Secrets Management, CI/CD, Security
draft: false
---

The assumption most secrets programmes are built on is that leaks are preventable. Scan the commits, block the push, train the team, and the secret never reaches a public repository. The assumption is wrong at scale, and GitGuardian's [State of Secrets Sprawl 2026](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/) puts numbers on how wrong: 28.65 million new hard-coded secrets reached public GitHub commits in 2025 alone, up 34 percent on the year before. Prevention is worth doing. It is not the thing that decides whether a leak hurts you. What decides that is how long the secret keeps working after it leaks, and the report's other finding is the one to build on.

## The secret that keeps working

Of the credentials GitGuardian confirmed valid in 2022, close to 70 percent were still valid in January 2025, and when retested in January 2026, more than 64 percent still worked. Four years after being pushed to a public repository, nearly two thirds of those keys had not been rotated or revoked. They had simply been forgotten, by everyone except whoever had copied them.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of credentials leaked in 2022 that still worked years later</title>
<desc id="f1-d">Two horizontal bars: about 70 percent of the credentials confirmed valid in 2022 were still valid in January 2025, and about 64 percent were still valid in January 2026. The decay over a year is small.</desc>
<text x="0" y="18" class="viz-title">Four years on, most of them still work</text>
<text x="0" y="36" class="viz-sub">Credentials confirmed valid in 2022, retested later, per cent still valid</text>
<line x1="176" y1="52" x2="176" y2="120" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">January 2025</text>
<path d="M176 58 H484 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="500" y="73" class="viz-value">about 70</text>
<text x="166" y="107" text-anchor="end" class="viz-label">January 2026</text>
<path d="M176 92 H457.6 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="473.6" y="107" class="viz-value">above 64</text>
<text x="0" y="160" class="viz-label-muted">A half-life measured in years, for keys that were public the whole time.</text>
<text x="0" y="182" class="viz-label-muted">The 28.65 million new secrets of 2025 will decay at about the same pace.</text>
</svg>
<figcaption>Source: <a href="https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/">GitGuardian, The State of Secrets Sprawl 2026</a>.</figcaption>
</figure>

That is a half-life, in the physical sense: a leaked credential population that loses a small fraction of its validity each year and is mostly still alive after four. It should be measured in minutes. The distance between those two numbers, years and minutes, is the whole design space of a secrets programme, and prevention does not touch it.

## The blast clock

The number I care about for each secret is what I call its blast clock: the elapsed time from the moment it leaks to the moment it stops working. The clock has three segments. Detection, the time until anyone notices the leak. Revocation, the time from noticing until the credential is dead. Rotation, the time until the systems that depended on it are running on a replacement, which is what allows revocation to happen without an outage. A secrets programme sets a target for the clock per class of secret, and then chooses mechanisms by how much each one shortens which segment.

<figure class="chart">
<svg viewBox="0 0 640 220" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The blast clock for one leaked credential</title>
<desc id="f2-d">A horizontal timeline from the leak to the moment the credential stops working, split into three segments: detection, revocation and rotation. Below, two versions: a long-lived API key where each segment is days or longer, and a short-lived federated token where the whole clock is under an hour because the token expires on its own.</desc>
<text x="0" y="18" class="viz-title">Three segments, one clock</text>
<text x="0" y="36" class="viz-sub">From the leak to the moment the credential is useless</text>
<text x="0" y="70" class="viz-label">Long-lived API key</text>
<rect x="160" y="56" width="200" height="24" class="viz-f4"/>
<rect x="360" y="56" width="140" height="24" class="viz-f4"/>
<rect x="500" y="56" width="140" height="24" class="viz-f4"/>
<line x1="360" y1="56" x2="360" y2="80" class="viz-gap"/>
<line x1="500" y1="56" x2="500" y2="80" class="viz-gap"/>
<text x="260" y="72" text-anchor="middle" class="viz-onfill">detect: months</text>
<text x="430" y="72" text-anchor="middle" class="viz-onfill">revoke: days</text>
<text x="570" y="72" text-anchor="middle" class="viz-onfill">rotate: days</text>
<text x="0" y="128" class="viz-label">Short-lived token</text>
<rect x="160" y="114" width="40" height="24" class="viz-f1"/>
<text x="210" y="130" class="viz-label-muted">expires on its own; no one has to notice</text>
<line x1="160" y1="160" x2="640" y2="160" class="viz-axis"/>
<text x="160" y="184" class="viz-tick">leak</text>
<text x="640" y="184" text-anchor="end" class="viz-tick">credential dead</text>
<text x="0" y="212" class="viz-label-muted">Target: minutes for CI credentials, hours for anything a human issued.</text>
</svg>
<figcaption>Illustrative: the three segments the programme is designed around; durations are typical, not measured.</figcaption>
</figure>

The segments are not equally hard. Detection depends on scanning, on the repository being public, and on luck; the GitGuardian figures are for secrets that were found, which is a lower bound on the population. Revocation depends on whether anyone can revoke the credential quickly, which for a key issued by a vendor's console means a person with the right login and a working day. Rotation depends on whether the systems that use the credential can pick up a new one without a redeploy, which is a property of how the credential was wired in.

The lever that shortens all three at once is lifetime. A credential that expires on its own in fifteen minutes has a blast clock of at most fifteen minutes whether or not anyone detects the leak, revokes anything or rotates anything. That is why the biggest single change a small team can make is not a scanner. It is replacing long-lived credentials in CI with short-lived ones obtained at the start of each job, through federation with the cloud provider, so that the pipeline never holds a secret that outlives the job. GitHub's [OpenID Connect integration](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect) is the usual mechanism: the job presents a signed token about itself, the cloud provider exchanges it for credentials scoped to that job and that repository, and there is nothing to store, nothing to leak and nothing to rotate.

The shape of that change is worth dwelling on, because it is the difference between managing secrets and not having them. Every secret in a pipeline is a liability with a half-life, and the cheapest way to shorten the half-life is to make the secret not exist between jobs. A long-lived cloud key stored in the repository's secret settings is a credential that outlives every job that used it; the federated token is a credential that dies with the job that requested it. Nothing about the work the job does changes. Only the clock does.

## Ranking secrets by how fast they die

SocialSure's platform ships through a CI/CD pipeline into containers, and the Habits app builds on GitHub Actions, so the pipeline is where most of the credentials in my life live. Sorting them by blast clock, rather than by how sensitive they feel, produced a ladder with four rungs.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Credential classes by how fast a leaked one can be killed</title>
<desc id="f3-d">Four rows. Federated tokens: seconds to minutes, expire on their own; the default for CI. Keys you issue yourself, such as API keys and database passwords: minutes, if rotation is automated. Keys a vendor issues, such as an app upload key: days, via a support process. Keys that identify the product itself, such as a legacy signing key: never; they must not touch CI at all.</desc>
<text x="0" y="18" class="viz-title">The revocation ladder</text>
<text x="20" y="48" class="viz-tick">CLASS</text>
<text x="300" y="48" class="viz-tick">TIME TO KILL</text>
<text x="450" y="48" class="viz-tick">RULE</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Federated, short-lived tokens</text>
<text x="300" y="82" class="viz-value">minutes, alone</text>
<text x="450" y="82" class="viz-label-muted">the default for every job</text>
<line x1="0" y1="96" x2="640" y2="96" class="viz-grid"/>
<text x="20" y="122" class="viz-label">Keys you issue yourself</text>
<text x="300" y="122" class="viz-value">minutes, scripted</text>
<text x="450" y="122" class="viz-label-muted">rotate on a schedule</text>
<line x1="0" y1="136" x2="640" y2="136" class="viz-grid"/>
<text x="20" y="162" class="viz-label">Keys a vendor issues</text>
<text x="300" y="162" class="viz-value">days, by support</text>
<text x="450" y="162" class="viz-label-muted">split custody</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="20" y="202" class="viz-label">Keys that are the product</text>
<text x="300" y="202" class="viz-value">never</text>
<text x="450" y="202" class="viz-label-muted">must not touch CI at all</text>
<line x1="0" y1="216" x2="640" y2="216" class="viz-grid"/>
<text x="0" y="248" class="viz-label-muted">Sorted by blast clock, not by how sensitive the secret feels.</text>
</svg>
<figcaption>Illustrative: the ladder as applied to a small team's pipeline; the classes are general, the examples are from Android and cloud release work.</figcaption>
</figure>

The ladder sorts by a different property from the one most teams use, and the difference matters. Sensitivity asks how bad a leak would be. The blast clock asks how long a leak would stay bad. A database password is sensitive and, if rotation is automated, dies in minutes; a read-only analytics key is far less sensitive and, if it was issued by a vendor and nobody knows how to revoke it, lives for years. Sorting by sensitivity puts the first one at the top of the worry list. Sorting by the clock puts the second one there, which is where the four-year-old keys in the GitGuardian figures came from.

The bottom rung is the one that changes behaviour. An Android app signing key from the era before Play App Signing cannot be replaced: lose it or leak it and the app can never be updated under its old identity on older devices. A credential with a blast clock of never does not belong in a pipeline, in a repository, or on a laptop; it belongs in an escrow with a ceremony, and the pipeline uses an upload key that Google can reset on request. The rung above, vendor-issued keys with a days-long clock, gets split custody and never appears in plaintext in a build log. The two top rungs are what the pipeline actually runs on, and the top one needs no revocation at all.

## What it changes day to day

Three practical consequences fell out of thinking in clocks rather than in prevention.

The scanner stayed, but its job changed. It is no longer the thing that keeps secrets safe; it is the detection segment of the clock, and its value is measured by how much it shortens that segment, which for a public repository is from months to minutes. For private repositories it is a cheaper and less urgent control, because the population that can read the leak is smaller, though not, as the GitGuardian figures on private and internal leaks show, small.

Rotation became a scheduled, automated event rather than a response to an incident. A key that is rotated every week by a job has a rotation segment of zero on the day it leaks, because the replacement path already exists and has been exercised. A key that has never been rotated has a rotation segment that includes discovering how, which is the segment that turns a leak into an outage.

And every new credential now arrives with a question before it is created: what is its blast clock, and can it be made shorter by not creating it at all. Most of the time the answer is a federated token, and the secret never exists.

The leak rate will keep rising. The report's numbers say so, and a small team is not going to reverse the trend. What a small team controls is the half-life, and a half-life of minutes makes the leak rate a statistic rather than a threat.
