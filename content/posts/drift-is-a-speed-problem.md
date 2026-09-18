---
title: Drift is a speed problem
date: 2026-05-31
summary: Drift is treated as a discipline failure: someone touched the console. It is a race. People use the console when code is slower than the emergency, so the fix is in the pipeline.
tags: Terraform, Infrastructure As Code, Cloud
draft: false
---

Every infrastructure-as-code team has the same conversation after a drift incident. Someone changed a security group in the console during an outage, the Terraform state no longer matched the world, and the next apply either reverted the emergency fix or refused to run. The conclusion is always the same: lock the console, make it read-only, route everything through code. It treats drift as a discipline failure. I think it is better modelled as a race, and the race has a measurable winner. People edit the console when the code path is slower than the emergency. Drift accumulates at a rate set by how long a change takes to get from a pull request to production, and locking the console removes the symptom while leaving the cause exactly where it was.

## The numbers behind the conversation

The industry surveys describe the symptom well. Firefly's [State of IaC 2025](https://www.firefly.ai/state-of-iac-2025) found that 89 percent of respondents had adopted infrastructure as code and only 6 percent had complete coverage, with less than a third continuously monitoring for drift and the rest addressing it reactively. The [2026 edition](https://www.firefly.ai/state-of-iac-2026) found a third of respondents had tied drift to a costly production incident, a further 8 percent to significant downtime, and nearly a fifth with no detection or remediation process at all, while 90 percent said their orchestration fell short of what they needed. The gap between adoption and coverage is where drift lives, and the orchestration complaint is the clue to why.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Infrastructure as code adoption, coverage and drift, from two industry surveys</title>
<desc id="f1-d">Horizontal bars in percent of respondents: adopted infrastructure as code, 89; say their orchestration falls short, 90; tied drift to a costly production incident, 33; continuously monitor drift, under 33; have no drift detection or remediation, nearly 20; have complete coverage of their cloud in code, 6. The complete-coverage bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">Adopted almost everywhere, complete almost nowhere</text>
<text x="0" y="36" class="viz-sub">Percent of surveyed infrastructure professionals, Firefly State of IaC 2025 and 2026</text>
<line x1="256" y1="52" x2="256" y2="256" class="viz-axis"/>
<text x="246" y="73" text-anchor="end" class="viz-label">Adopted IaC</text>
<path d="M256 58 H576 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H256 Z" class="viz-fgray"/>
<text x="596" y="73" class="viz-value">89</text>
<text x="246" y="107" text-anchor="end" class="viz-label">Orchestration falls short</text>
<path d="M256 92 H580 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H256 Z" class="viz-fgray"/>
<text x="600" y="107" class="viz-value">90</text>
<text x="246" y="141" text-anchor="end" class="viz-label">Drift caused a costly incident</text>
<path d="M256 126 H375 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H256 Z" class="viz-fgray"/>
<text x="395" y="141" class="viz-value">33</text>
<text x="246" y="175" text-anchor="end" class="viz-label">Continuously monitor drift</text>
<path d="M256 160 H371 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H256 Z" class="viz-fgray"/>
<text x="391" y="175" class="viz-value">under 33</text>
<text x="246" y="209" text-anchor="end" class="viz-label">No drift detection at all</text>
<path d="M256 194 H328 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H256 Z" class="viz-fgray"/>
<text x="348" y="209" class="viz-value">nearly 20</text>
<text x="246" y="243" text-anchor="end" class="viz-label">Complete coverage in code</text>
<path d="M256 228 H274 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H256 Z" class="viz-f1"/>
<text x="294" y="243" class="viz-value">6</text>
</svg>
<figcaption>Source: Firefly's <a href="https://www.firefly.ai/state-of-iac-2025">State of IaC 2025</a> (adoption, coverage, monitoring) and <a href="https://www.firefly.ai/state-of-iac-2026">State of IaC 2026</a> (incidents, detection, orchestration), as published on the report pages.</figcaption>
</figure>

## The race

Consider a change that has to happen now: a firewall rule during an attack, a capacity bump during a traffic spike, a certificate that expired at four in the morning. There are two routes. One is the console: open it, click, done, thirty seconds. The other is the code path: edit the module, open a pull request, wait for a plan, get a review, merge, wait for the apply to reach production. On a good day that is twenty minutes. On a bad day, with a queued pipeline, a locked state file, a reviewer in another timezone and a plan that touches something unrelated, it is hours.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Two routes for the same change, with typical latencies and the point where drift enters</title>
<desc id="f2-d">Top route, the console: open, click, done, about thirty seconds; drift enters here because the state no longer matches. Bottom route, the code path: edit, pull request, plan, review, merge, apply, twenty minutes on a good day and hours on a bad one. A note says the console wins whenever the emergency is shorter than the code path.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Whichever route is faster than the emergency wins</text>
<text x="8" y="56" class="viz-tick">CONSOLE</text>
<rect x="8" y="64" width="110" height="44" rx="8" class="viz-box"/><text x="63" y="91" text-anchor="middle" class="viz-label">open</text>
<line x1="120" y1="86" x2="136" y2="86" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="140" y="64" width="110" height="44" rx="8" class="viz-box"/><text x="195" y="91" text-anchor="middle" class="viz-label">click</text>
<line x1="252" y1="86" x2="268" y2="86" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="272" y="64" width="110" height="44" rx="8" class="viz-box-ink"/><text x="327" y="91" text-anchor="middle" class="viz-on-ink">done: 30 s</text>
<circle cx="396" cy="86" r="7" class="viz-d4"/><text x="410" y="90" class="viz-label-muted">drift enters here</text>
<text x="8" y="156" class="viz-tick">CODE PATH</text>
<rect x="8" y="164" width="92" height="44" rx="8" class="viz-box"/><text x="54" y="191" text-anchor="middle" class="viz-label">edit</text>
<line x1="102" y1="186" x2="114" y2="186" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="118" y="164" width="92" height="44" rx="8" class="viz-box"/><text x="164" y="191" text-anchor="middle" class="viz-label">PR, plan</text>
<line x1="212" y1="186" x2="224" y2="186" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="228" y="164" width="92" height="44" rx="8" class="viz-box-accent"/><text x="274" y="191" text-anchor="middle" class="viz-label">review</text>
<line x1="322" y1="186" x2="334" y2="186" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="338" y="164" width="92" height="44" rx="8" class="viz-box"/><text x="384" y="191" text-anchor="middle" class="viz-label">merge</text>
<line x1="432" y1="186" x2="444" y2="186" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="448" y="164" width="92" height="44" rx="8" class="viz-box-accent"/><text x="494" y="191" text-anchor="middle" class="viz-label">apply</text>
<line x1="542" y1="186" x2="554" y2="186" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="558" y="164" width="74" height="44" rx="8" class="viz-box-ink"/><text x="595" y="191" text-anchor="middle" class="viz-on-ink">done</text>
<text x="320" y="238" text-anchor="middle" class="viz-label-muted">20 minutes on a good day; hours with a queued pipeline or an absent reviewer.</text>
<text x="320" y="270" text-anchor="middle" class="viz-tick">the gold boxes are where the latency lives, and where the fix is</text>
</svg>
<figcaption>Illustrative: the two routes as they exist on a retained deployment; latencies are typical rather than measured.</figcaption>
</figure>

An engineer with a production system on fire is not choosing between discipline and laziness. They are choosing between a thirty-second route and a twenty-minute route while the outage clock runs, and they will choose the fast one every time the emergency is shorter than the code path. Locking the console does not change that calculation; it removes the fast route and leaves the slow one, which means the emergency lasts twenty minutes longer and the next retrospective proposes a break-glass role that reopens the console. Drift is what accumulates in the gap between the two routes, and the width of the gap is the apply latency.

## Drift half-life

The number I use to see this is a drift half-life: the time after a clean apply until half of a workspace's resources show a difference in a scheduled plan. Measuring it is cheap. Run plan on a schedule, hourly or daily, against every workspace, record the count of resources with a diff, and watch the curve after each clean apply. Most tools that manage Terraform runs have a [drift detection](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/health) feature that produces the raw data, and a spreadsheet does the rest.

The half-life is the one number that tells you whether your code path is faster than your incidents. A workspace whose half-life is measured in months is one where the code path wins: people change things through code because it is not meaningfully slower than the alternative. A half-life under a week means people are routing around the code path faster than it can keep up, and the fix is in the pipeline, not in IAM.

<figure class="chart">
<svg viewBox="0 0 640 340" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Drift half-life as a function of apply latency, from a simple decay model</title>
<desc id="f3-d">A curve falling from left to right on a log-scaled vertical axis. At an apply latency of five minutes, the modelled half-life is many months; at twenty minutes, weeks; at an hour, days; at four hours, under a day. The model assumes a fixed rate of urgent changes with a distribution of urgency, and that each change whose urgency window is shorter than the apply latency goes through the console.</desc>
<text x="0" y="18" class="viz-title">Halve the apply latency and the half-life more than doubles</text>
<text x="0" y="36" class="viz-sub">Modelled time until half a workspace has drifted, against pull-request-to-production latency</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1 yr</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">1 mo</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">1 wk</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">1 day</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1 hr</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">5 min</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">20 min</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">1 hr</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">4 hr</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">1 day</text>
<text x="328" y="306" text-anchor="middle" class="viz-label-muted">Apply latency, log scale</text>
<line x1="56" y1="328" x2="70" y2="328" class="viz-s1"/><text x="76" y="332" class="viz-label-muted">modelled half-life</text>
<line x1="220" y1="328" x2="234" y2="328" class="viz-s4"/><text x="240" y="332" class="viz-label-muted">one-week line</text>
<polyline points="56,62 124,88 192,124 260,158 328,186 396,208 464,226 532,240 600,250" class="viz-s1"/>
<circle cx="192" cy="124" r="5" class="viz-d1"/>
<text x="204" y="118" class="viz-value">weeks at twenty minutes</text>
<circle cx="464" cy="226" r="5" class="viz-d4"/>
<text x="452" y="246" text-anchor="end" class="viz-value">under a day at four hours</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-s4"/>
<text x="596" y="154" text-anchor="end" class="viz-tick">one week: below this, people are routing around you</text>
</svg>
<figcaption>Illustrative: a decay model in which urgent changes arrive at a steady rate with a spread of urgency windows, and every change whose window is shorter than the apply latency goes through the console; the curve's shape is the point, not its values.</figcaption>
</figure>

The model behind the curve is simple enough to state. Urgent changes arrive at some steady rate. Each has an urgency window, the time within which it has to land, and those windows are spread across a wide range, from minutes to days. A change goes through the console when its window is shorter than the apply latency and through code otherwise. The share of changes that drift is therefore the share of windows shorter than the latency, and because the windows are spread over orders of magnitude, halving the latency removes more than half of the drifting changes. That is the whole argument for spending on the pipeline: the returns are better than linear.

## What locking the console actually does

The read-only console deserves a fair hearing, because it is the standard advice and it is not useless. It makes drift visible: every change now leaves a trace in code or in a break-glass audit log, and a team that could not previously say how much of its estate was hand-edited can. It also removes the accidental drift, the well-meaning tweak by someone who did not know the resource was managed. Those are real gains.

What it does not do is change the race. The urgent change still has an urgency window, the code path still has its latency, and when the window is shorter, one of three things happens: the break-glass role gets used, which is the console with paperwork; the change is made in a tool outside Terraform's view, a Kubernetes manifest applied by hand, a database parameter set through a client, a DNS record changed at the registrar, which is drift the scheduled plan cannot even see; or the change is not made and the outage runs longer. None of those is the outcome the lock was meant to buy. The half-life measurement still applies after the lock, and if it does not improve, the lock has moved the drift rather than removed it.

## Shortening the path

On the retained deployments I run, the work of shortening the path is unglamorous and specific. Plans run on every pull request automatically, so the review has the plan in front of it rather than waiting for one. Workspaces are split so that an urgent change to a firewall rule does not plan against the whole estate, which is what makes the plan slow and the diff noisy. Reviews for a small, well-defined class of changes, a rule, a size, a count, are approved by a policy check rather than a person, so that the four-in-the-morning change does not wait for a timezone. The apply runs from the merge, not from a manual trigger someone has to remember. And the state lock is held for as short a time as the tool allows, because a locked state during an incident is the single most reliable way to make someone open the console.

None of that touches IAM. The console stays available, because during a real emergency it should be, and what changes is that it stops being the faster route for anything but the true emergencies. Then the half-life, measured by the scheduled plans, tells you whether it worked. When the number climbs from days to months, the discipline conversation stops happening, not because people became more disciplined but because the race was won by the route you wanted them to take.
