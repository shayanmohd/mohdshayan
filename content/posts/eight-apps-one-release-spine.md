---
title: Eight apps and one release spine
date: 2026-09-17
summary: A portfolio of small apps is only cheaper than one big app if shipping each costs almost nothing. Play charges that cost per app, per year; a shared release system pays it once.
tags: Android, Release Engineering, Product Strategy
draft: false
---

Eight Android apps ship from the SocialSure developer account, and I own the release engineering for all of them: signing, policy compliance, staged rollouts, and the annual scramble that Google Play schedules for every app on the store. The decision to run a portfolio of small apps instead of one large one is often argued as a bet on odds, many small chances at one hit. That framing misses where the money goes. A portfolio is only cheaper than a single product if the fixed cost of shipping each app is driven close to zero, and Play is structured so that the fixed cost never goes to zero on its own.

## Play charges per app, per year

Two deadlines this year make the point. The [target API level requirement](https://support.google.com/googleplay/android-developer/answer/11926878) says that from 31 August 2026 new apps and updates must target Android 16, API level 36, and existing apps must target at least API 35 to remain available to new users on newer devices, with an extension available to 1 November for apps that need it. That requirement has moved up one level nearly every year since 2018, and it applies to each app separately: eight apps, eight upgrades, eight rounds of finding out what the new target level breaks.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Google Play's target API requirement for new apps, by year</title>
<desc id="f1-d">A line rising from API level 26 in 2018 to 28 in 2019, 29 in 2020, 30 in 2021, 31 in 2022, 33 in 2023, 34 in 2024, 35 in 2025 and 36 in 2026. The steps are one level per year, with a two-level jump in 2023.</desc>
<text x="0" y="18" class="viz-title">The target API ladder</text>
<text x="0" y="36" class="viz-sub">Minimum target API level for new apps and updates, August of each year</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">36</text>
<line x1="56" y1="125.3" x2="600" y2="125.3" class="viz-grid"/><text x="48" y="129.3" text-anchor="end" class="viz-tick">32</text>
<line x1="56" y1="194.7" x2="600" y2="194.7" class="viz-grid"/><text x="48" y="198.7" text-anchor="end" class="viz-tick">28</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">24</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">2018</text>
<text x="124" y="288" text-anchor="middle" class="viz-tick">2019</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">2020</text>
<text x="260" y="288" text-anchor="middle" class="viz-tick">2021</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">2022</text>
<text x="396" y="288" text-anchor="middle" class="viz-tick">2023</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">2024</text>
<text x="532" y="288" text-anchor="middle" class="viz-tick">2025</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">2026</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Year of the August deadline</text>
<polyline points="56,229.3 124,194.7 192,177.3 260,160 328,142.7 396,108 464,90.7 532,73.3 600,56" class="viz-s1"/>
<circle cx="56" cy="229.3" r="4" class="viz-d1"/>
<circle cx="124" cy="194.7" r="4" class="viz-d1"/>
<circle cx="192" cy="177.3" r="4" class="viz-d1"/>
<circle cx="260" cy="160" r="4" class="viz-d1"/>
<circle cx="328" cy="142.7" r="4" class="viz-d1"/>
<circle cx="396" cy="108" r="4" class="viz-d1"/>
<circle cx="464" cy="90.7" r="4" class="viz-d1"/>
<circle cx="532" cy="73.3" r="4" class="viz-d1"/>
<circle cx="600" cy="56" r="4" class="viz-d1"/>
<text x="70" y="233" class="viz-value">26</text>
<text x="592" y="50" text-anchor="end" class="viz-value">36</text>
</svg>
<figcaption>Source: the 2026 requirement from <a href="https://support.google.com/googleplay/android-developer/answer/11926878">Play Console Help</a>; earlier years from Google's annual announcements on the <a href="https://android-developers.googleblog.com/">Android Developers Blog</a>.</figcaption>
</figure>

The second deadline is newer. Google's [developer verification](https://developer.android.com/developer-verification) programme begins enforcement on 30 September 2026 in Brazil, Indonesia, Singapore and Thailand, where apps must come from verified developers to install on certified devices, with the [June 2026 announcement](https://android-developers.googleblog.com/2026/06/android-developer-verification.html) describing the expansion to all certified devices in 2027. Verification is per developer rather than per app, but every app carries the account's status, and an account with eight apps has eight places for a verification problem to become a user-facing one.

Add the ordinary annual items: the policy declarations that change wording each year, the data safety form, the permissions review, the signing key hygiene, and the update that every app needs simply because its libraries moved. None of these is large. All of them are per app. Eight apps with separate pipelines pay them eight times, and the total is a quiet tax that grows with every app you add.

The target API deadline is the clearest example of how the tax compounds, because it is not one task. Raising the target level changes runtime behaviour: permissions that were granted at install become requests at use, background work that used to run is now scheduled or refused, storage paths that were open are now scoped. Each app has to be rebuilt against the new level, run through its screens, and shipped through a rollout before the date. For an app that has not been touched in a year, that rebuild also drags every library forward, and the libraries have their own opinions. Done separately, it is a week per app. Done through a shared pipeline with the same dependency baseline, it is a week for the baseline and a day per app to confirm.

## The spine

The only way a portfolio stays cheap is if the per-app cost is paid once, by a shared system, and each app plugs into it. I think of that system as the release spine, and it has four vertebrae.

The keys. Every app is enrolled in Play App Signing, so the key devices trust is held by Google and the key I handle is an upload key, stored in the CI secret store and nowhere else. New apps get a fresh upload key from the same procedure, and no key lives on a laptop.

The pipeline. One CI configuration builds, tests, signs and uploads a bundle, parameterised by the app. The Habits app builds on GitHub Actions in a public repository, and the shape of that workflow is the shape of all of them: a build step, a verification step, a signing step that never sees the key in plaintext, and an upload to a named track. A new app is a new set of parameters, not a new pipeline.

The policy checklist. A single document lists every declaration Play requires and the answer for each app, kept as data so that a policy change is one row edited eight times, not eight forms filled from memory.

The rollout ladder. Every release walks the same staged rollout, with the same halt conditions at each stage, so that a bad release in any app is caught by the same reflex.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One release spine feeding eight apps</title>
<desc id="f2-d">A tall box on the left labelled release spine, listing its four parts: upload keys under Play App Signing, one parameterised CI pipeline, a policy checklist kept as data, and a staged rollout ladder. Lines connect it to eight small app boxes on the right arranged in two columns, with a ninth, dotted-looking box below them labelled the ninth app.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="30" width="220" height="230" rx="8" class="viz-box-accent"/>
<text x="118" y="58" text-anchor="middle" class="viz-label">Release spine</text>
<text x="24" y="92" class="viz-label-muted">Upload keys, Play App Signing</text>
<text x="24" y="126" class="viz-label-muted">One parameterised pipeline</text>
<text x="24" y="160" class="viz-label-muted">Policy checklist as data</text>
<text x="24" y="194" class="viz-label-muted">One staged rollout ladder</text>
<text x="24" y="240" class="viz-tick">paid once</text>
<line x1="230" y1="145" x2="330" y2="145" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="340" y="30" width="130" height="36" rx="6" class="viz-box"/><text x="405" y="53" text-anchor="middle" class="viz-label">App 1</text>
<rect x="500" y="30" width="130" height="36" rx="6" class="viz-box"/><text x="565" y="53" text-anchor="middle" class="viz-label">App 2</text>
<rect x="340" y="80" width="130" height="36" rx="6" class="viz-box"/><text x="405" y="103" text-anchor="middle" class="viz-label">App 3</text>
<rect x="500" y="80" width="130" height="36" rx="6" class="viz-box"/><text x="565" y="103" text-anchor="middle" class="viz-label">App 4</text>
<rect x="340" y="130" width="130" height="36" rx="6" class="viz-box"/><text x="405" y="153" text-anchor="middle" class="viz-label">App 5</text>
<rect x="500" y="130" width="130" height="36" rx="6" class="viz-box"/><text x="565" y="153" text-anchor="middle" class="viz-label">App 6</text>
<rect x="340" y="180" width="130" height="36" rx="6" class="viz-box"/><text x="405" y="203" text-anchor="middle" class="viz-label">App 7</text>
<rect x="500" y="180" width="130" height="36" rx="6" class="viz-box"/><text x="565" y="203" text-anchor="middle" class="viz-label">App 8</text>
<rect x="420" y="236" width="130" height="36" rx="6" class="viz-band"/><text x="485" y="259" text-anchor="middle" class="viz-label-muted">the ninth app</text>
<text x="485" y="290" text-anchor="middle" class="viz-tick">how many days would it take</text>
</svg>
<figcaption>Illustrative: the shared system and the eight apps it feeds, drawn as structure rather than as any app's real pipeline.</figcaption>
</figure>

## What the spine does not share

The spine holds the questions; each app holds its own answers. That distinction is what keeps a shared release system from becoming a shared liability. The data safety form asks the same questions of every app, so the checklist is shared, but an offline habit tracker and a multiplayer card game answer them differently, and the answers live with the app. The rollout ladder is shared, but the halt condition for a game with a live server is tighter than for a tool that never touches the network. The pipeline is shared, but each app's tests are its own, and a green build on the spine means only that the app compiled, signed and uploaded, not that it works.

Keeping that line clear also keeps the failure modes separate. A mistake in the spine, a wrong signing step or a policy answer copied to the wrong app, is caught by the first app through it and fixed once. A mistake in an app's answers is that app's problem and nobody else's. The account carries the consequences either way, which is the strongest argument for making the shared part small, well tested, and boring.

## The ninth-app test

The test I run before agreeing to add another app is to estimate, honestly, how much un-automated effort it would take to ship a hypothetical ninth app to production: create the listing, enrol the key, wire the pipeline, complete the declarations, walk the first rollout. If the answer is more than one working day, the spine is not finished, and the portfolio is already too expensive to grow. The ninth app is not a plan. It is a measurement of the spine, and a spine that fails the test needs work before the next real app, not after it.

The test has a second use. It tells you what to automate next. Whatever step of the imaginary ninth app takes longest by hand is the vertebra that is missing, and it is usually not the one you expected. For a long time mine was the policy declarations, which I had been answering from memory for each app, and the fix was a spreadsheet, not code.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Annual fixed cost against number of apps, two ways of shipping</title>
<desc id="f3-d">Two lines over one to eight apps. Per-app pipelines rise steadily from 6 engineer-days for one app to 48 for eight. A shared spine starts higher at 21 days for one app and rises slowly to 28 for eight. The lines cross at about three apps.</desc>
<text x="0" y="18" class="viz-title">Where a portfolio stops being cheap</text>
<text x="0" y="36" class="viz-sub">Engineer-days per year on release work, a model with stated assumptions</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">Shared spine</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-sgray"/><text x="520" y="35" class="viz-label-muted">Per-app pipelines</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">50</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">37.5</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">25</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">12.5</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="133.7" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="211.4" y="288" text-anchor="middle" class="viz-tick">3</text>
<text x="289.1" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="366.9" y="288" text-anchor="middle" class="viz-tick">5</text>
<text x="444.6" y="288" text-anchor="middle" class="viz-tick">6</text>
<text x="522.3" y="288" text-anchor="middle" class="viz-tick">7</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Number of apps in the portfolio</text>
<polyline points="56,239 133.7,214.1 211.4,189.1 289.1,164.2 366.9,139.2 444.6,114.3 522.3,89.3 600,64.3" class="viz-sgray"/>
<polyline points="56,176.6 133.7,172.5 211.4,168.3 289.1,164.2 366.9,160 444.6,155.8 522.3,151.7 600,147.5" class="viz-s1"/>
<circle cx="600" cy="64.3" r="4" class="viz-dgray"/>
<circle cx="600" cy="147.5" r="4" class="viz-d1"/>
<text x="592" y="58" text-anchor="end" class="viz-value">48</text>
<text x="592" y="142" text-anchor="end" class="viz-value">28</text>
</svg>
<figcaption>Illustrative: constructed as 6 days per app for separate pipelines and 20 days plus 1 day per app for the spine; the numbers are assumptions chosen to show the shape, not measurements.</figcaption>
</figure>

## What the model says and does not say

The chart is a model, and its two assumptions are the whole argument: separate pipelines cost a roughly fixed number of days per app per year, and a shared spine costs a larger fixed amount once plus a small amount per app. Change the numbers and the crossing point moves, but it does not disappear, because a per-app line always crosses a mostly-flat one eventually. What the model does not say is that the spine is free to build. Twenty days is a real month of work that a one-app company should not spend, and the right time to build the spine is when the second app is real, not when the first one is.

It also does not say that the spine makes the apps good. It makes them shippable, which is a different property. Eight apps that ship on time with no policy strikes and no key incidents can still be eight apps nobody wants, and the spine will not tell you that. It only guarantees that finding out costs a day rather than a fortnight.

## The rule

Count the un-automated days for the ninth app. If it is more than one, stop adding apps and add a vertebra. If it is one or less, the portfolio is a portfolio, and the next question is which app deserves the day.
