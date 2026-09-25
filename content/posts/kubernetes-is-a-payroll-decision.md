---
title: Kubernetes is a payroll decision
date: 2026-07-11
summary: For a team of a few engineers, the cost of Kubernetes is not compute. It is a second product with its own release train, and the question is who gets paged for it.
tags: Kubernetes, Small Teams, Operations
topic: DevOps & Cloud
draft: false
---

Every few months someone asks me whether their three-person company should move to Kubernetes, and every few months I give an answer that has nothing to do with their workload. The workload is almost never the constraint. The constraint is a person. Kubernetes is a second product your company now runs, with its own release schedule, its own upgrade deadlines and its own ways of failing at two in the morning, and the honest question is whether there is someone on the payroll whose job it is to answer that page.

## A second release train

Here is the part of Kubernetes that does not appear on the architecture diagram. The project ships a minor version roughly [three times a year](https://kubernetes.io/releases/), and each minor version receives patches for about fourteen months: a year of support and a two-month window in which to upgrade off it. That policy has held since 1.19, and [endoflife.date](https://endoflife.date/kubernetes) keeps the dates for every version.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Support windows of five Kubernetes minor versions</title>
<desc id="f1-d">A Gantt chart from January 2024 to January 2027. Version 1.30 is supported from April 2024 to June 2025, 1.31 from August 2024 to October 2025, 1.32 from December 2024 to February 2026, 1.33 from April 2025 to June 2026, and 1.34 from August 2025 to October 2026. Each bar is about fourteen months long and a new one starts every four months.</desc>
<text x="0" y="18" class="viz-title">Fourteen months each, a new one every four</text>
<text x="0" y="36" class="viz-sub">Patch support windows, Kubernetes 1.30 to 1.34</text>
<line x1="130" y1="52" x2="130" y2="222" class="viz-axis"/>
<line x1="286.7" y1="52" x2="286.7" y2="222" class="viz-grid"/>
<line x1="443.4" y1="52" x2="443.4" y2="222" class="viz-grid"/>
<line x1="600" y1="52" x2="600" y2="222" class="viz-grid"/>
<text x="130" y="242" text-anchor="middle" class="viz-tick">Jan 2024</text>
<text x="286.7" y="242" text-anchor="middle" class="viz-tick">Jan 2025</text>
<text x="443.4" y="242" text-anchor="middle" class="viz-tick">Jan 2026</text>
<text x="600" y="242" text-anchor="middle" class="viz-tick">Jan 2027</text>
<text x="118" y="73" text-anchor="end" class="viz-label">1.30</text>
<path d="M175.7 58 H359.8 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H175.7 Z" class="viz-f1"/>
<text x="118" y="107" text-anchor="end" class="viz-label">1.31</text>
<path d="M226.6 92 H412 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H226.6 Z" class="viz-f1"/>
<text x="118" y="141" text-anchor="end" class="viz-label">1.32</text>
<path d="M277.6 126 H464.3 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H277.6 Z" class="viz-f1"/>
<text x="118" y="175" text-anchor="end" class="viz-label">1.33</text>
<path d="M335 160 H516.5 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H335 Z" class="viz-f1"/>
<text x="118" y="209" text-anchor="end" class="viz-label">1.34</text>
<path d="M389.9 194 H568.7 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H389.9 Z" class="viz-f1"/>
</svg>
<figcaption>Source: release and end-of-life dates from <a href="https://endoflife.date/kubernetes">endoflife.date</a>, following the policy on <a href="https://kubernetes.io/releases/">kubernetes.io/releases</a>.</figcaption>
</figure>

Read the chart as a calendar rather than as a feature list. If you stay on a supported version, you upgrade the cluster at least every fourteen months, and in practice every eight or so, because nobody wants to run the last two months of a window. Each upgrade is a control plane change, a node image change, and a walk through the deprecation notes to find the API your ingress controller still uses. Managed offerings do some of that walking for you and none of the reading.

The managed offerings also enforce the calendar rather than relax it. A version that leaves upstream support leaves the provider's support soon after, and most providers will move a cluster off an unsupported version on their own schedule if you have not moved it on yours. So the fourteen months is not a suggestion with a managed control plane. It is the longest you can go without someone on your team doing an upgrade, and the upgrade is the same work whoever hosts the API server: read what changed, test what you run against it, and find out what broke on the day.

Your application has its own release train, the one you chose, with deploys whenever you like. The cluster's train runs on the project's schedule, whether or not this quarter is a good time. For a large team the two trains have different drivers. For a small one they have the same driver, and the collisions land on that person's calendar with no regard for what the product needed that week.

<figure class="chart">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Two release trains on one calendar</title>
<desc id="f2-d">Two horizontal lanes across a year. The upper lane shows the application's deploys as frequent small marks chosen by the team. The lower lane shows the cluster's forced upgrades as three larger marks at fixed points. Two of the cluster marks land in the same weeks as product launches, shown as highlighted collisions.</desc>
<text x="0" y="18" class="viz-title">Whose calendar is it</text>
<text x="0" y="36" class="viz-sub">One year of an application's deploys and its cluster's forced upgrades</text>
<rect x="440" y="24" width="12" height="12" rx="3" class="viz-fgray"/><text x="458" y="35" class="viz-label-muted">upgrade</text>
<rect x="530" y="24" width="12" height="12" rx="3" class="viz-f4"/><text x="548" y="35" class="viz-label-muted">collision</text>
<rect x="0" y="56" width="640" height="52" rx="8" class="viz-band"/>
<text x="12" y="86" class="viz-label">App deploys</text>
<circle cx="150" cy="82" r="4" class="viz-d1"/><circle cx="185" cy="82" r="4" class="viz-d1"/><circle cx="215" cy="82" r="4" class="viz-d1"/><circle cx="260" cy="82" r="4" class="viz-d1"/><circle cx="300" cy="82" r="4" class="viz-d1"/><circle cx="330" cy="82" r="4" class="viz-d1"/><circle cx="380" cy="82" r="4" class="viz-d1"/><circle cx="410" cy="82" r="4" class="viz-d1"/><circle cx="450" cy="82" r="4" class="viz-d1"/><circle cx="500" cy="82" r="4" class="viz-d1"/><circle cx="540" cy="82" r="4" class="viz-d1"/><circle cx="590" cy="82" r="4" class="viz-d1"/>
<text x="300" y="70" text-anchor="middle" class="viz-tick">launch</text>
<text x="540" y="70" text-anchor="middle" class="viz-tick">launch</text>
<rect x="0" y="120" width="640" height="52" rx="8" class="viz-box"/>
<text x="12" y="150" class="viz-label">Cluster upgrades</text>
<rect x="290" y="136" width="20" height="20" rx="4" class="viz-f4"/>
<rect x="425" y="136" width="20" height="20" rx="4" class="viz-fgray"/>
<rect x="532" y="136" width="20" height="20" rx="4" class="viz-f4"/>
<text x="300" y="190" text-anchor="middle" class="viz-tick">collision</text>
<text x="542" y="190" text-anchor="middle" class="viz-tick">collision</text>
</svg>
<figcaption>Illustrative: the cluster's dates are set by the project's cadence, the launches by the product; on a small team both land on one person.</figcaption>
</figure>

## The second-pager rule

So the rule I use is about staffing, not about scale. Adopt Kubernetes when there is a second person who can be paged for the cluster, for etcd, upgrades, the network plugin, the ingress and the certificates, independently of the person paged for the application. Until that second pager exists, a container runtime on one or two machines is the more reliable system, not the less ambitious one.

The reason is what happens during an incident when one person holds both pagers. A cluster problem is, by construction, also an application outage, because the application runs on the cluster. The single engineer is now debugging a node that stopped scheduling pods while the product is down, and there is nobody free to look at the product, to answer the customer, or to notice that the real cause was a bad deploy an hour earlier. Two pagers held by one person are not redundancy. They are one person with two ways to be woken.

Compare the alternative. SocialSure's platform ships as Docker containers through a CI/CD pipeline onto a small number of machines, with structured logs, metrics and alerting around it, and that arrangement has never once needed a person who was not also the person who wrote the code. When that setup breaks, the failure is one of a handful of things, each of them visible from a shell, each of them fixable by a person who understands the application, because the runtime is doing almost nothing the application did not ask for. There is no second product to page for. The boring setup has a shorter list of ways to be wrong, and on a small team the length of that list is the reliability.

## What people think the decision is about

The usual argument for Kubernetes on a small team is a list of capabilities: rolling deploys, health checks, restarts, secrets, autoscaling, service discovery. Every item on the list is real and every item is available without the cluster. A process manager restarts a crashed container. A reverse proxy does health checks and a rolling swap between two containers. Secrets come from the environment or a vault. Autoscaling, for a product whose traffic a small team can describe from memory, is one spare machine. The list is a list of things Kubernetes does well at a scale where doing them by hand would take a team; it is not a list of things only Kubernetes can do.

The other usual argument is that you will need it later, so you should learn it now. That one is half right. Learning it is cheap and worth doing. Running it in production before you can staff it is the expensive part, because the learning happens during incidents, and incidents on a small team are the product being down.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The decision as two questions</title>
<desc id="f3-d">A two by two grid. Horizontal axis: does the workload need orchestration, no on the left and yes on the right. Vertical axis: is there a second person who can be paged for the cluster, no at the bottom and yes at the top. Bottom left: containers on a box. Bottom right: managed Kubernetes only if someone is hired first, or a platform that runs it for you. Top left: still a box, the second person has better things to do. Top right: Kubernetes.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Still a box or two</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">the second person has better work</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Kubernetes</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">two trains, two drivers</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Containers on a box</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">most small products</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Hire first, or rent the platform</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">a cluster nobody can page for</text>
<circle cx="464" cy="80" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Does the workload need orchestration: no to yes</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Is there a second pager: no to yes</text>
</svg>
<figcaption>Illustrative: the second-pager rule as a grid; only one cell is a cluster you run yourself.</figcaption>
</figure>

## The cell people get wrong

The bottom-right cell is the interesting one: the workload genuinely needs orchestration, many services, real scaling, and there is still only one person. The tempting answer is a managed control plane, and it helps, because the cloud provider takes etcd and the control plane upgrades off your list. It does not take the node upgrades, the deprecated APIs, the network plugin, the ingress, the certificates, or the reading. A managed cluster removes the first pager's hardest hour and leaves the rest of the night.

The honest options in that cell are two. Hire the second person before the cluster, not after it, so that the cluster arrives with someone whose job it is. Or rent the whole platform, the kind where you push a container and never see a node, and accept the price and the lock-in as the cost of not staffing an operations role. Both are payroll decisions. Neither is an architecture decision, which is why the architecture diagram never settles the argument.

## When the answer flips

It flips on the day the second pager is real, and not before. Not when traffic doubles, not when a client asks for a compliance checklist that mentions orchestration, not when a new hire arrives who used it at their last job. The person has to exist, be on the rota, and be able to fix the cluster without the application engineer in the room. On that day Kubernetes stops being a second product with one owner and becomes what it was designed to be, a shared platform with a team behind it, and the fourteen-month windows become a schedule rather than a threat.

Until then, the most reliable thing a small team can run is the thing it fully understands, on the fewest machines that will hold it, with a pager that only rings for one product. That is not a lack of ambition. It is arithmetic about who is awake.
