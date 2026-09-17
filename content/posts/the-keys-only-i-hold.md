---
title: The keys only I hold
date: 2026-09-17
summary: For an engineer-founder the dangerous list is not the tasks only they can do but the credentials only they hold. Delegate by irreversibility, not by how often a key is used.
tags: Founding, Security, Android
draft: false
---

Every founder is told about the bus factor, and the version they are told is about knowledge: what would the company lose if you were unreachable for a month. For an engineer-founder that framing misses the sharper problem. Knowledge can be written down, and most of mine is in repositories and runbooks. Credentials cannot be written down, or rather they can, and then they are a different problem. The dangerous list is not the things only I know how to do. It is the keys only I hold, and among those, the ones that can never be reissued.

## More of us than there were

This is not a niche worry. Carta's [solo founders report](https://carta.com/data/solo-founders-report/) puts the share of new startups on its platform led by a single founder at 35 percent in 2024, more than double the share in 2015, with 17 percent in 2017 and 29 percent in 2023. A third of new companies now start with one person holding every credential, and the data also shows those companies are less likely to raise venture capital, which is to say less likely to acquire the second and third pairs of hands that would otherwise dilute the problem by accident.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of new startups on Carta with a single founder</title>
<desc id="f1-d">A rising line: about 17 percent in 2017, 29 percent in 2023, 35 percent in 2024. A note says solo-founded companies were 35 percent of incorporations in 2024 but 17 percent of those that closed a venture round that year.</desc>
<text x="0" y="18" class="viz-title">One person, every key</text>
<text x="0" y="36" class="viz-sub">Per cent of startups incorporated on Carta led by a solo founder</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">40</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">30</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">20</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="133.7" y="288" text-anchor="middle" class="viz-tick">2017</text>
<text x="522.3" y="288" text-anchor="middle" class="viz-tick">2023</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">2024</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Year of incorporation</text>
<polyline points="133.7,175.6 522.3,113.2 600,82" class="viz-s1"/>
<circle cx="133.7" cy="175.6" r="4" class="viz-d1"/>
<circle cx="522.3" cy="113.2" r="4" class="viz-d1"/>
<circle cx="600" cy="82" r="5" class="viz-d1"/>
<text x="148" y="170" class="viz-value">17%</text>
<text x="592" y="74" text-anchor="end" class="viz-value">35%</text>
<text x="56" y="120" class="viz-label-muted">In 2024, solo founders were 35% of new</text>
<text x="56" y="140" class="viz-label-muted">companies and 17% of those that raised</text>
<text x="56" y="160" class="viz-label-muted">a venture round in the same year.</text>
</svg>
<figcaption>Source: <a href="https://carta.com/data/solo-founders-report/">Carta, Solo Founders Report 2025</a>; intermediate years are not shown because the report gives them only in aggregate.</figcaption>
</figure>

## Sort by irreversibility

The instinct is to delegate the credentials you use most, because those are the ones whose absence would be felt first. That is the wrong sort key. The right one is what happens if the credential is lost or its holder is unreachable, and specifically whether it can be reissued, by whom, and how long that takes. I keep the list as a ladder with four rungs.

At the bottom, credentials recoverable in hours by anyone with an email address: a chat admin login, a SaaS dashboard, most vendor consoles. Losing them is an afternoon. Above that, credentials recoverable in days through a support process with identity checks: the cloud account's root user, a registrar account, an Android app's upload key, which Google's [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756) lets a developer reset through a request. Above that, credentials recoverable only with the cooperation of a specific institution and a specific person, such as a company bank mandate or a signing authority registered to one name. And at the top, credentials that cannot be reissued at all: an Android app signing key from before Play App Signing, a wallet's seed, a certificate authority's root, an encryption key protecting data that has no other copy.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The irreversibility ladder, with the recovery path on each rung</title>
<desc id="f2-d">Four rungs from bottom to top. Hours: dashboards and chat admin, recovered by password reset. Days: cloud root, registrar, Play upload key, recovered by a support process with identity checks. Weeks: bank mandates and registered signing authorities, recovered with an institution's cooperation. Never: legacy app signing keys, wallet seeds, encryption keys with no other copy; no recovery exists, so custody has to be shared in advance.</desc>
<text x="0" y="18" class="viz-title">Delegate from the top rung down</text>
<text x="20" y="48" class="viz-tick">RUNG</text>
<text x="180" y="48" class="viz-tick">EXAMPLES</text>
<text x="440" y="48" class="viz-tick">RECOVERY PATH</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<rect x="0" y="66" width="640" height="44" rx="6" class="viz-box-ink"/>
<text x="20" y="93" class="viz-on-ink">Never</text>
<text x="180" y="93" class="viz-on-ink">legacy signing key, wallet seed, sole data key</text>
<text x="440" y="93" class="viz-on-ink">none; split custody early</text>
<rect x="0" y="118" width="640" height="44" rx="6" class="viz-box-accent"/>
<text x="20" y="145" class="viz-label">Weeks</text>
<text x="180" y="145" class="viz-label-muted">bank mandate, registered signatory</text>
<text x="440" y="145" class="viz-label-muted">institution and a person</text>
<rect x="0" y="170" width="640" height="44" rx="6" class="viz-box"/>
<text x="20" y="197" class="viz-label">Days</text>
<text x="180" y="197" class="viz-label-muted">cloud root, registrar, Play upload key</text>
<text x="440" y="197" class="viz-label-muted">support process, ID checks</text>
<rect x="0" y="222" width="640" height="44" rx="6" class="viz-box"/>
<text x="20" y="249" class="viz-label">Hours</text>
<text x="180" y="249" class="viz-label-muted">dashboards, chat admin, most consoles</text>
<text x="440" y="249" class="viz-label-muted">reset to a shared inbox</text>
<text x="0" y="290" class="viz-label-muted">Frequency of use is not on this table on purpose.</text>
</svg>
<figcaption>Illustrative: the ladder as I keep it; the Play upload key's reset path is documented in <a href="https://support.google.com/googleplay/android-developer/answer/9842756">Play Console Help</a>.</figcaption>
</figure>

The rule is to delegate from the top rung down. The bottom rung barely needs a plan; a shared inbox for password resets covers it. The top rung needs a ceremony, because there is no recovery, and the ceremony has to happen while the founder is present, well, and not in a hurry. Most founders do the opposite, sharing the dashboards because a colleague asked for access and never touching the signing key because nobody asked.

## What I did with the top rung

Eight Android apps ship from the SocialSure account, and the first thing the ladder changed was to move as many of their keys off the top rung as possible. Apps enrolled in Play App Signing have their app signing key held by Google, and what I hold is an upload key, which is a days-rung credential with a documented reset. That one enrolment demotes a key from never to days, and it is the single highest-value move available to any Android developer who has not made it.

For what remains on the top rung, the answer is split custody, and the tool is Shamir's secret sharing, which I have used in applied cryptography work and which is simpler than its reputation. The secret is split into three shares such that any two reconstruct it and any one alone reveals nothing. One share stays with me, one goes to a second person the company trusts, and one goes to a third party with no operational role, a lawyer or a family member, with written instructions. No single share is useful, no single person is a point of failure, and reconstruction needs two people to agree that it is time.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">A two-of-three escrow for a credential that cannot be reissued</title>
<desc id="f3-d">A flow: the secret is split into three shares at a ceremony. Share one stays with the founder, share two goes to a trusted second person, share three to a third party with written instructions. Reconstruction requires any two shares and a rehearsed procedure. A note says the procedure itself must not live only in the founder's head.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="90" width="140" height="56" rx="8" class="viz-box-ink"/>
<text x="78" y="114" text-anchor="middle" class="viz-on-ink">The secret</text>
<text x="78" y="132" text-anchor="middle" class="viz-on-ink">split at a ceremony</text>
<line x1="150" y1="104" x2="236" y2="60" class="viz-arrow" marker-end="url(#f3-ah)"/>
<line x1="150" y1="118" x2="236" y2="118" class="viz-arrow" marker-end="url(#f3-ah)"/>
<line x1="150" y1="132" x2="236" y2="176" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="240" y="32" width="150" height="48" rx="8" class="viz-box"/>
<text x="315" y="52" text-anchor="middle" class="viz-label">Share 1</text>
<text x="315" y="70" text-anchor="middle" class="viz-label-muted">the founder</text>
<rect x="240" y="94" width="150" height="48" rx="8" class="viz-box"/>
<text x="315" y="114" text-anchor="middle" class="viz-label">Share 2</text>
<text x="315" y="132" text-anchor="middle" class="viz-label-muted">a trusted second person</text>
<rect x="240" y="156" width="150" height="48" rx="8" class="viz-box"/>
<text x="315" y="176" text-anchor="middle" class="viz-label">Share 3</text>
<text x="315" y="194" text-anchor="middle" class="viz-label-muted">a third party, with instructions</text>
<line x1="392" y1="118" x2="478" y2="118" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="435" y="108" text-anchor="middle" class="viz-tick">any two</text>
<rect x="482" y="90" width="150" height="56" rx="8" class="viz-box-accent"/>
<text x="557" y="114" text-anchor="middle" class="viz-label">Reconstruct</text>
<text x="557" y="132" text-anchor="middle" class="viz-label-muted">by a rehearsed procedure</text>
<text x="320" y="240" text-anchor="middle" class="viz-label-muted">A split key is useless if only the founder knows how to reassemble it.</text>
</svg>
<figcaption>Illustrative: the escrow as practised for the top rung; the threshold scheme is <a href="https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing">Shamir's</a>, and the ceremony is the part that matters.</figcaption>
</figure>

## Why frequency of use is the wrong sort

It is worth saying why the instinct to delegate by frequency fails, because it fails in a way that feels like success. The credentials used every day are the ones colleagues ask for, so they get shared, and the sharing feels like progress on the bus factor. But daily credentials are almost always on the bottom two rungs: if the person holding them vanished, a password reset or a support ticket would restore access within the week. The company would be inconvenienced and would survive. The credentials on the top rung are used rarely, sometimes once a year at a key rotation or an app's first release, and nobody asks for them because nobody needs them, until the day they are the only thing that matters and the only person who held them cannot be reached.

The ladder inverts the priority on purpose. The rarely used, never-reissuable key gets the ceremony first. The daily dashboard gets a shared inbox last. Done in that order, the exercise front-loads the one hour of work that cannot be done after the fact, and leaves the easy hours for whenever they happen.

## The limit the ladder taught me

The escrow has a failure mode that the cryptography does not cover, and it is the one I nearly built. A split key does not help if the process to reassemble it is also only in the founder's head. Which tool reconstructs the shares, in what format, on which machine, with what verification that the result is the right key, what to do with the key once it exists, and whom to tell: all of that is a procedure, and a procedure known to one person is a top-rung credential wearing a different costume. So the ceremony produces two things, the shares and a written, rehearsed runbook, and the runbook is tested by the second person reconstructing a dummy secret without me in the room. The first rehearsal found four steps I had never written down.

The same limit applies one rung lower. A cloud root credential in a password manager is only delegated if the second person can open the password manager, which means the password manager's own recovery is on the ladder too, and so is the phone that receives its second factor. The ladder is recursive, and the way to stop the recursion is to reach a rung where recovery goes through an institution rather than a person, and to make sure the institution has a second name on file.

## The list, once

The exercise is a single afternoon: write every credential the company depends on, put each on a rung, and for each rung write who else can act and how. The top rung gets an escrow and a rehearsed runbook. The next gets a second named person at each institution. The lower rungs get a shared inbox. Then the list is reviewed whenever a new credential is created, because every new key arrives on some rung, and the ones that arrive on the top rung are the ones that will matter on the day nobody can reach me.
