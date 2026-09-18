---
title: Autoscaling buys you the next spike
date: 2025-11-17
summary: Reactive autoscaling cannot serve the spike that triggers it. The new capacity arrives after a chain of delays that add up to minutes. What it buys is the spike after this one.
tags: AWS, Autoscaling, Capacity
draft: false
---

The promise of autoscaling is that capacity appears when demand does. The mechanism cannot keep that promise, because capacity is a consequence of demand being measured, and measurement takes time at every step. By the time a reactive policy has noticed a spike, decided about it, launched an instance, waited for it to boot, and let it into the load balancer, the spike that triggered all of that is several minutes old. What the new instance serves is whatever comes next. That is not a flaw to be tuned away. It is what "reactive" means, and it changes what the policy is for.

## The arrival gap

I call the total delay the arrival gap: the time between demand crossing the threshold and a new instance taking its first request. It is a sum of documented settings and physical facts, and every one of the settings defaults to a number that assumes you are not in a hurry.

First the metric has to be observed. CloudWatch collects EC2 metrics in periods of a minute with detailed monitoring and five minutes without it, so the earliest the system can know about a change is the end of the current period. Then the alarm has to evaluate: a target tracking policy, per the [AWS documentation](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html), creates alarms that need several consecutive periods above the target before they fire, so that a single noisy minute does not launch a fleet. Then an instance has to launch, which takes as long as the image takes to boot and the bootstrap takes to run. Then the load balancer's health check has to pass, after its own grace period. And then, with a default instance warmup configured, the instance is held out of the aggregate metrics for that long; AWS's [warm-up and cooldown page](https://docs.aws.amazon.com/autoscaling/ec2/userguide/consolidated-view-of-warm-up-and-cooldown-settings.html) explains how the warmup falls back to the default cooldown, which is 300 seconds, when it is not set.

<figure class="chart">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The arrival gap as a sum of stages</title>
<desc id="f1-d">One stacked horizontal bar in seconds: metric period 60, alarm evaluation 180, instance launch and bootstrap 120, health check grace 60, instance warmup 300, for a total of about 720 seconds or twelve minutes. Warmup is the largest segment.</desc>
<text x="0" y="18" class="viz-title">Twelve minutes, from documented defaults and a typical boot</text>
<text x="0" y="36" class="viz-sub">Seconds from demand crossing the threshold to the new instance serving</text>
<rect x="0" y="60" width="53.3" height="28" class="viz-q2"/>
<rect x="53.3" y="60" width="160" height="28" class="viz-q3"/>
<rect x="213.3" y="60" width="106.7" height="28" class="viz-q4"/>
<rect x="320" y="60" width="53.3" height="28" class="viz-q3"/>
<rect x="373.3" y="60" width="266.7" height="28" class="viz-q5"/>
<line x1="53.3" y1="60" x2="53.3" y2="88" class="viz-gap"/>
<line x1="213.3" y1="60" x2="213.3" y2="88" class="viz-gap"/>
<line x1="320" y1="60" x2="320" y2="88" class="viz-gap"/>
<line x1="373.3" y1="60" x2="373.3" y2="88" class="viz-gap"/>
<text x="133.3" y="78" text-anchor="middle" class="viz-onfill">alarm 180</text>
<text x="266.7" y="78" text-anchor="middle" class="viz-onfill">boot 120</text>
<text x="506.7" y="78" text-anchor="middle" class="viz-onfill">warmup 300</text>
<text x="26.7" y="108" text-anchor="middle" class="viz-tick">60</text>
<text x="346.7" y="108" text-anchor="middle" class="viz-tick">60</text>
<text x="0" y="140" class="viz-label-muted">Metric 60, alarm 180, launch and bootstrap 120, health grace 60, warmup 300.</text>
<text x="0" y="162" class="viz-label-muted">Only the boot figure is a guess; the rest are defaults or usual values.</text>
<text x="0" y="188" class="viz-tick">total: about 720 seconds</text>
</svg>
<figcaption>Source: the 300-second default cooldown and warmup fallback from the <a href="https://docs.aws.amazon.com/autoscaling/ec2/userguide/consolidated-view-of-warm-up-and-cooldown-settings.html">EC2 Auto Scaling warm-up and cooldown documentation</a>; the metric period and evaluation from the <a href="https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html">target tracking documentation</a>; boot and grace are illustrative values stated as assumptions.</figcaption>
</figure>

Twelve minutes is a long time. Most of the spikes a small service sees are shorter than that: a link shared somewhere, a batch job that fires on the hour, a scheduled email that sends everyone to the site at once. Against a spike that lasts five minutes, a twelve-minute arrival gap means the new capacity comes online after the spike is over, serves the trough, and is then scaled back in by the same policy. The requests that failed during the spike failed. The policy was decoration.

## What it does buy

Reactive scaling is not useless. It is late, which is different, and late is fine for the demand it was designed for: a rise that lasts long enough for the arrival gap to be a small fraction of it. A morning ramp that builds over an hour, a campaign that doubles traffic for a week, a slow growth that the fleet has to follow across a quarter. Against those, the gap is a few minutes of under-provisioning at the front of a long period of correct provisioning, and the policy earns its keep.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Demand against reactive capacity on one timeline</title>
<desc id="f2-d">A demand curve rises sharply at one point and falls back a few minutes later. A capacity line stays flat, then steps up twelve minutes after the rise, after the demand has already fallen. The window between the rise and the capacity step is shaded as the period in which requests fail.</desc>
<text x="0" y="18" class="viz-title">The step arrives after the spike</text>
<text x="0" y="36" class="viz-sub">A short spike under a reactive policy; shaded where requests fail</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">demand</text>
<line x1="480" y1="31" x2="494" y2="31" class="viz-s2"/><text x="500" y="35" class="viz-label-muted">capacity</text>
<rect x="200" y="56" width="180" height="208" class="viz-band"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0</text>
<text x="200" y="288" text-anchor="middle" class="viz-tick">spike</text>
<text x="380" y="288" text-anchor="middle" class="viz-tick">+12 min</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">+30 min</text>
<polyline points="56,200 380,200 380,110 600,110" class="viz-s2"/>
<polyline points="56,210 190,210 200,90 240,80 290,100 330,190 380,210 600,210" class="viz-s1"/>
<text x="290" y="72" text-anchor="middle" class="viz-label-muted">demand above capacity</text>
<text x="490" y="100" text-anchor="middle" class="viz-label-muted">capacity above demand</text>
</svg>
<figcaption>Illustrative: the timing relationship the arrival gap produces, drawn to show shape rather than measured traffic.</figcaption>
</figure>

For everything shorter, the honest question is what the policy is defending against, and the answer is the next spike. If spikes come in waves, one after another, the capacity that arrived late for the first one is in place for the second, and that is worth something. If spikes come alone, it is worth nothing, and the money spent on the extra instance that arrives late and leaves later is money that could have bought a spare instance that was already there.

## Scaling in is where the money goes

The same delays run in the other direction, and they are set longer on purpose. Target tracking scales in more cautiously than it scales out, with more evaluation periods before it removes an instance, because removing capacity too early is the failure operators notice. The consequence is that a fleet that scaled out late for a spike also scales in late after it, and the extra instance that arrived when the spike was over stays for a good while after that. Over a day of isolated spikes, the fleet spends most of its time one instance larger than the traffic needs and never one instance larger at the moment it needed to be. That is the cost profile of reactive scaling against short spikes: paying for capacity in the troughs and lacking it at the peaks.

Seen that way, the spare instance is not an extravagance. It is the same instance the policy would have bought anyway, held at a time when it is useful instead of at a time when it is not.

## When the schedule beats the policy

The QR ticketing system I built serves visitor attractions, and an attraction's demand is not a mystery. The gates open at a fixed time. The scan-in traffic starts at that minute, peaks in the first hour, and follows the day's programme. Nobody needs a metric to discover that ten o'clock is busier than nine; it is printed on the sign outside. A reactive policy would spend the first twelve minutes of every morning learning something the operator has known for years.

The same is true of most of the small services I have run. A CRM's traffic follows office hours in the client's time zone. A marketing site's traffic follows the campaign calendar. A helpdesk assistant's traffic follows the shifts of the people who ask it questions. In each case someone in the business can draw the demand curve from memory, and a policy that has to rediscover it from a metric every day is doing expensive, slow, slightly wrong work that a calendar entry does for free.

For a service whose peaks are on a schedule, two things beat target tracking, and both are cheaper. One spare instance, N plus one, absorbs any spike smaller than one instance's worth of capacity with no gap at all, because it is already there. A scheduled action, which AWS supports directly, raises the fleet before the known peak and lowers it after, with an arrival gap of zero because the launch happens before the demand rather than after it. Reactive scaling then sits behind both as a backstop for the day the sign outside is wrong.

<figure class="chart">
<svg viewBox="0 0 640 346" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">An opening-hour surge against three capacity strategies</title>
<desc id="f3-d">Demand steps up sharply at opening time and stays high for an hour. Reactive capacity steps up twelve minutes late. N plus one capacity is flat and slightly above demand from the start. Scheduled capacity steps up fifteen minutes before opening. Only the reactive line has a window where demand exceeds capacity.</desc>
<text x="0" y="18" class="viz-title">Three ways to meet ten o'clock</text>
<text x="0" y="36" class="viz-sub">An opening-hour step in demand; a model with the construction stated below</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="56" y="288" text-anchor="middle" class="viz-tick">9:30</text>
<text x="237.3" y="288" text-anchor="middle" class="viz-tick">10:00</text>
<text x="418.7" y="288" text-anchor="middle" class="viz-tick">10:30</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">11:00</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Time of day</text>
<polyline points="56,236 237.3,236 237.3,110 600,110" class="viz-s1"/>
<polyline points="56,214 237.3,214 309.9,214 309.9,90 600,90" class="viz-s4"/>
<polyline points="56,90 600,90" class="viz-sgray"/>
<polyline points="56,214 146.7,214 146.7,90 600,90" class="viz-s2"/>
<line x1="380" y1="331" x2="394" y2="331" class="viz-s1"/><text x="400" y="335" class="viz-label-muted">demand</text>
<line x1="150" y1="331" x2="164" y2="331" class="viz-s4"/><text x="170" y="335" class="viz-label-muted">reactive</text>
<line x1="240" y1="331" x2="254" y2="331" class="viz-s2"/><text x="260" y="335" class="viz-label-muted">scheduled</text>
<line x1="480" y1="331" x2="494" y2="331" class="viz-sgray"/><text x="500" y="335" class="viz-label-muted">N plus one</text>
<text x="273" y="200" text-anchor="middle" class="viz-label-muted">reactive gap</text>
</svg>
<figcaption>Illustrative: demand modelled as a step at opening, reactive capacity as the same step delayed by the twelve-minute arrival gap, scheduled capacity as the step fifteen minutes early, and N plus one as a flat line above the peak.</figcaption>
</figure>

## Computing your own gap

The arrival gap is a number you can compute from your own settings in a few minutes, and it is worth computing before choosing a policy rather than after an incident. Read the metric period from the monitoring level. Read the alarm's evaluation periods from the policy. Time a launch from the console to the first successful health check. Add the warmup or the cooldown it falls back to. The sum is how late every reactive decision will be, and it should be compared with the length of the spikes in your own request logs, not with a feeling about how fast the cloud is.

If the gap is shorter than your typical spike, reactive scaling will catch most of them, and the tuning that matters is bringing the gap down further: detailed monitoring, fewer evaluation periods, a faster image, a shorter warmup. If the gap is longer than your typical spike, no tuning of the policy fixes the problem, because the policy is the wrong tool. The tools for that case are a spare instance and a calendar, and for a great many small services they are the whole answer. Autoscaling then does what it is good at, which is following the slow tide, and stops being asked to catch the wave.
