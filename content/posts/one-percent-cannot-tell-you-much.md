---
title: One percent of users cannot tell you much
date: 2025-02-04
summary: A staged rollout is a statistical test, and at one percent the sample is too small to see the crash-rate rise Play penalises. Write each halt rule from what the stage can detect.
tags: Android, Staged Rollouts, Release Engineering
draft: false
---

A staged rollout feels like caution. Ship to one percent, watch the crash rate, widen to five, watch again, and so on to everyone. I run that ladder for eight apps on Google Play, and for a long time I treated the early stages as if they were telling me something about the crash rate. They were not, or not the thing I thought. At one percent of a small app's users, the sample is too small to see the very rise in crashes that Play would penalise, and a stage that cannot see the thing you are watching for is not a test of it. It is a delay with a dashboard.

## What Play is watching for

Google Play measures app quality through Android vitals, and its [documentation](https://support.google.com/googleplay/android-developer/answer/9844486) states the thresholds it acts on, with the definitions of a user-perceived crash and ANR in the [Android vitals developer guide](https://developer.android.com/topic/performance/vitals). An app whose user-perceived crash rate exceeds 1.09 percent of daily users, or whose user-perceived ANR rate exceeds 0.47 percent, is over the bad-behaviour threshold and becomes less discoverable on the store; on any single device model the threshold is 8 percent, and an app over it there may get a warning on its listing for that device. Those are the numbers a rollout is guarding against, so the question for each stage is whether it could detect a rise across them.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Google Play's bad-behaviour thresholds</title>
<desc id="f1-d">Three horizontal bars, in per cent of daily users: user-perceived crash rate 1.09, user-perceived ANR rate 0.47, and the per-device threshold for either, 8. The per-device bar is much longer.</desc>
<text x="0" y="18" class="viz-title">The lines a rollout must not cross</text>
<text x="0" y="36" class="viz-sub">Per cent of daily users, Android vitals bad-behaviour thresholds</text>
<line x1="220" y1="52" x2="220" y2="154" class="viz-axis"/>
<text x="210" y="73" text-anchor="end" class="viz-label">Crash rate, overall</text>
<path d="M220 58 H262 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H220 Z" class="viz-f1"/>
<text x="282" y="73" class="viz-value">1.09%</text>
<text x="210" y="107" text-anchor="end" class="viz-label">ANR rate, overall</text>
<path d="M220 92 H236 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H220 Z" class="viz-f1"/>
<text x="256" y="107" class="viz-value">0.47%</text>
<text x="210" y="141" text-anchor="end" class="viz-label">Either, on one device model</text>
<path d="M220 126 H564 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H220 Z" class="viz-fgray"/>
<text x="580" y="141" class="viz-value">8%</text>
<text x="0" y="190" class="viz-label-muted">The overall crash threshold is the one a small rollout stage cannot see a move across.</text>
</svg>
<figcaption>Source: <a href="https://support.google.com/googleplay/android-developer/answer/9844486">Play Console Help, Android vitals</a>, and the <a href="https://developer.android.com/topic/performance/vitals">Android vitals documentation</a>.</figcaption>
</figure>

## The stage as a statistical test

A crash rate is a proportion, and detecting a change in a proportion needs a sample whose size depends on how small the change is. Suppose the baseline is right at the threshold, 1.09 percent, and the new release has quietly doubled it to 2 percent, which would put the app well over the line. How many sessions does a stage need to observe before that doubling shows up as more than noise?

The standard one-sided calculation, at 95 percent confidence and 80 percent power, gives about a thousand sessions to distinguish 2 percent from 1.09. To see a rise to 1.5 percent takes over four thousand. To see 3 percent takes under three hundred, and 5 percent under a hundred. The relationship is steep: halving the size of the rise you want to catch roughly quadruples the sample you need.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Sessions a stage needs to detect a crash-rate rise from the 1.09 percent threshold</title>
<desc id="f2-d">Four columns: to detect a rise to 1.5 percent, about 4,400 sessions; to 2 percent, about 1,000; to 3 percent, about 270; to 5 percent, about 80. At 95 percent confidence and 80 percent power, one-sided.</desc>
<text x="0" y="18" class="viz-title">What a stage has to see before it can see anything</text>
<text x="0" y="36" class="viz-sub">Sessions needed, one-sided, 95% confidence, 80% power, baseline 1.09%</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M89.3 81 V77.5 a4 4 0 0 1 4 -4 H109.3 a4 4 0 0 1 4 4 V250 H89.3 Z" class="viz-f1"/>
<text x="101.3" y="67" text-anchor="middle" class="viz-value">4,400</text>
<text x="101.3" y="272" text-anchor="middle" class="viz-label-muted">rise to 1.5%</text>
<path d="M234.7 211.6 V208.1 a4 4 0 0 1 4 -4 H254.7 a4 4 0 0 1 4 4 V250 H234.7 Z" class="viz-f1"/>
<text x="246.7" y="197.6" text-anchor="middle" class="viz-value">1,000</text>
<text x="246.7" y="272" text-anchor="middle" class="viz-label-muted">to 2%</text>
<path d="M380 239.6 V236.1 a4 4 0 0 1 4 -4 H400 a4 4 0 0 1 4 4 V250 H380 Z" class="viz-f1"/>
<text x="392" y="225.5" text-anchor="middle" class="viz-value">270</text>
<text x="392" y="272" text-anchor="middle" class="viz-label-muted">to 3%</text>
<rect x="525.3" y="246.9" width="24" height="3.1" class="viz-f1"/>
<text x="537.3" y="232.8" text-anchor="middle" class="viz-value">80</text>
<text x="537.3" y="272" text-anchor="middle" class="viz-label-muted">to 5%</text>
</svg>
<figcaption>Illustrative: computed from the standard normal-approximation sample size for comparing an observed proportion with a fixed baseline; the thresholds are Play's, the rises are examples.</figcaption>
</figure>

Now put a small app on that chart. An app with two thousand daily sessions, at a one percent rollout, collects twenty sessions a day. The stage would need two months to see a rise to 2 percent, and the ladder widens it after two days. So the one percent stage of that app is not a test of whether the crash rate rose to 2 percent. It cannot be. What it can detect in two days, at forty sessions, is a catastrophe: a release that crashes for most users on launch. That is a real thing to guard against, and it is the only thing the stage guards against.

## The detectable-defect floor

The rule I use is to compute, for each stage of the ladder, the smallest rise in crash rate that the stage can detect with the sessions it will actually gather before the ladder widens. I call that the detectable-defect floor, and it is arithmetic on three numbers the team already has: the app's daily sessions, the stage's percentage, and the number of days the stage will run. If the floor is above the threshold you care about, the stage is not a test of that threshold, and the halt condition written for it should say what it can see.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">A rollout ladder with a detectable floor and a halt condition on each rung</title>
<desc id="f3-d">Five rungs from the bottom: 1 percent for two days, floor: only a launch crash for most users; 5 percent for two days, floor: a rise to about 5 percent; 20 percent for three days, floor: a rise to about 2 percent; 50 percent for three days, floor: a rise to about 1.5 percent; 100 percent, ongoing, floor: the threshold itself. Each rung's halt condition is written against its floor.</desc>
<text x="0" y="18" class="viz-title">Halt on what the rung can see</text>
<text x="0" y="36" class="viz-sub">An example ladder for an app with a few thousand daily sessions</text>
<text x="20" y="66" class="viz-tick">STAGE</text>
<text x="200" y="66" class="viz-tick">SESSIONS SEEN</text>
<text x="380" y="66" class="viz-tick">CAN DETECT, AND SO HALTS ON</text>
<line x1="0" y1="74" x2="640" y2="74" class="viz-axis"/>
<text x="20" y="100" class="viz-label">100%, ongoing</text>
<text x="200" y="100" class="viz-value">all of them</text>
<text x="380" y="100" class="viz-label-muted">the 1.09% threshold itself</text>
<line x1="0" y1="110" x2="640" y2="110" class="viz-grid"/>
<text x="20" y="136" class="viz-label">50%, three days</text>
<text x="200" y="136" class="viz-value">about 3,000</text>
<text x="380" y="136" class="viz-label-muted">a rise to about 1.5%</text>
<line x1="0" y1="146" x2="640" y2="146" class="viz-grid"/>
<text x="20" y="172" class="viz-label">20%, three days</text>
<text x="200" y="172" class="viz-value">about 1,200</text>
<text x="380" y="172" class="viz-label-muted">a rise to about 2%</text>
<line x1="0" y1="182" x2="640" y2="182" class="viz-grid"/>
<text x="20" y="208" class="viz-label">5%, two days</text>
<text x="200" y="208" class="viz-value">about 200</text>
<text x="380" y="208" class="viz-label-muted">a rise to about 5%, or a crash loop</text>
<line x1="0" y1="218" x2="640" y2="218" class="viz-grid"/>
<text x="20" y="244" class="viz-label">1%, two days</text>
<text x="200" y="244" class="viz-value">about 40</text>
<text x="380" y="244" class="viz-label-muted">a crash for most users on launch</text>
<line x1="0" y1="254" x2="640" y2="254" class="viz-grid"/>
<text x="0" y="284" class="viz-label-muted">Sessions assume 2,000 a day; recompute the floors for your own numbers.</text>
</svg>
<figcaption>Illustrative: one ladder with floors computed from the chart above for an app with about two thousand daily sessions; the structure is the point.</figcaption>
</figure>

Writing the halt condition that way changes what people do with the dashboard. At one percent, nobody stares at a crash-rate graph, because forty sessions cannot draw one; the halt condition is "any crash on launch in more than a handful of sessions", which a person can check in a minute, and the stage's job is to run for two days and confirm the app opens. At fifty percent the crash rate is finally a number with meaning, and the halt condition is a rise the stage can actually see.

## The per-device threshold makes it worse

The 8 percent per-device threshold sounds generous and is the one a small rollout is least able to guard. A crash that affects one device model, a particular manufacturer's camera driver, say, shows up as a large rate on that model and a tiny rise in the overall rate, and Play judges the model separately. At one percent of a small app, the number of sessions from any single model is a handful, and a crash rate on a handful of sessions is a coin toss. The stage that could detect a device-specific regression is the one at which each model contributes a few hundred sessions, which for most models on most small apps is the last stage or none.

That argues for a different early check than the crash graph: a list of the device models that have reported at all, compared with the list from the previous release, so that a model that has gone silent, because the app now crashes before it can report, is at least visible as an absence. Absence is a weaker signal than a rate, and it is the only one the early stages can give.

## What this does to the early stages

It shortens them, honestly. If a one percent stage can only detect a launch crash, and a launch crash shows up in the first hour, holding the stage for two days is a delay that protects nobody. The ladder for a small app should spend its time in the middle rungs, where the sample grows fast enough to see a real rise before the release reaches everyone, and should move through the bottom rung as soon as the catastrophic check passes.

It also explains a thing every release engineer has felt: the early stages always look fine. Of course they do. A stage that can only detect disasters reports no disasters almost every time, and the absence of a signal from a stage that could not have produced one gets read as reassurance. The floor puts a name on that, and the name stops the reassurance from being counted as evidence.

For an app with hundreds of thousands of daily sessions the arithmetic changes completely: one percent is thousands of sessions a day, the floor at the bottom rung sits near the threshold, and the classic ladder works as advertised. The rule is not that one percent stages are useless. It is that the stage's power is a number, the number comes from the app's size, and the halt condition should be written from the number rather than from the shape of the ladder.
