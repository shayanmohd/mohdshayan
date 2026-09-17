---
title: The kernel you share with a stranger
date: 2026-09-18
summary: A container is a process in a costume; it shares the host kernel with everything else on the box, so its isolation is the kernel's bug count. Author and lifetime pick the boundary.
tags: Firecracker, Sandboxing, AI Agents
draft: false
---

A container is a process wearing a costume. It has its own view of the filesystem, its own process table, its own network namespace, and it shares the kernel with every other process on the machine, including the ones that belong to someone else. The isolation a container gives you is therefore exactly the isolation the kernel gives between processes, which is to say it is as strong as the kernel's bug count is low, and the kernel is a large program that gains and loses bugs every week. Whether that matters depends on two questions, and once they are answered the boundary picks itself: who wrote the code, and how long will it run?

## The stranger's code test

The first question is about trust, and it has four honest answers. You wrote the code, and you can read it. A dependency wrote it, someone else whose work you vetted when you added it and whose updates you review, more or less. A customer wrote it, a person you have a contract with and no visibility into. Or a language model wrote it, which is the newest answer and the one this post exists for, because model-written code is code whose author cannot be held to a contract, cannot be asked what they meant, and will produce something different next time.

The second question is about exposure. Code that runs for one request and exits has a small window to find a kernel bug and use it. Code that runs for a session, minutes to hours, has a larger one. Code that runs indefinitely, a long-lived worker or an agent that keeps a loop going, has all the time there is, and an attacker who has all the time there is will eventually find the bug that the last kernel patch did not cover.

<figure class="chart">
<svg viewBox="0 0 640 380" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The author-by-lifetime grid: who wrote the code against how long it runs, with the minimum boundary in each cell</title>
<desc id="f1-d">A grid with four rows for the author, you, a vetted dependency, a customer, a language model, and three columns for the lifetime, one request, one session, indefinitely. Cells name the minimum boundary: your own code, a process in all three columns. A vetted dependency, a process for one request, a container for a session and indefinitely. A customer, a container for one request, a userspace kernel for a session, a microVM indefinitely. A language model, a userspace kernel for one request, a microVM for a session and indefinitely. The bottom-right cell is highlighted.</desc>
<text x="0" y="18" class="viz-title">Two questions, one boundary per cell</text>
<text x="290" y="52" text-anchor="middle" class="viz-tick">ONE REQUEST</text>
<text x="420" y="52" text-anchor="middle" class="viz-tick">ONE SESSION</text>
<text x="560" y="52" text-anchor="middle" class="viz-tick">INDEFINITELY</text>
<line x1="0" y1="60" x2="640" y2="60" class="viz-axis"/>
<text x="20" y="100" class="viz-label">You wrote it</text>
<text x="290" y="100" text-anchor="middle" class="viz-label-muted">process</text>
<text x="420" y="100" text-anchor="middle" class="viz-label-muted">process</text>
<text x="560" y="100" text-anchor="middle" class="viz-label-muted">process</text>
<line x1="0" y1="124" x2="640" y2="124" class="viz-grid"/>
<text x="20" y="164" class="viz-label">A vetted dependency</text>
<text x="290" y="164" text-anchor="middle" class="viz-label-muted">process</text>
<text x="420" y="164" text-anchor="middle" class="viz-label-muted">container</text>
<text x="560" y="164" text-anchor="middle" class="viz-label-muted">container</text>
<line x1="0" y1="188" x2="640" y2="188" class="viz-grid"/>
<text x="20" y="228" class="viz-label">A customer</text>
<text x="290" y="228" text-anchor="middle" class="viz-label-muted">container</text>
<text x="420" y="228" text-anchor="middle" class="viz-label-muted">userspace kernel</text>
<text x="560" y="228" text-anchor="middle" class="viz-label-muted">microVM</text>
<line x1="0" y1="252" x2="640" y2="252" class="viz-grid"/>
<text x="20" y="292" class="viz-label">A language model</text>
<text x="290" y="292" text-anchor="middle" class="viz-label-muted">userspace kernel</text>
<text x="420" y="292" text-anchor="middle" class="viz-label-muted">microVM</text>
<rect x="490" y="270" width="140" height="34" rx="8" class="viz-box-accent"/>
<text x="560" y="292" text-anchor="middle" class="viz-label">microVM, own kernel</text>
<line x1="0" y1="316" x2="640" y2="316" class="viz-grid"/>
<text x="0" y="348" class="viz-label-muted">Down and right the boundary grows; the highlighted cell needs its own kernel.</text>
<text x="0" y="370" class="viz-tick">the cells are minimums, and a stronger boundary is always allowed</text>
</svg>
<figcaption>Illustrative: the grid as I apply it; the cell contents are the minimum boundary I would accept, not a benchmark.</figcaption>
</figure>

Read the grid from the top left. Your own code, however long it runs, is a process; the kernel's process isolation is what it was built for and you are the only author. A vetted dependency gets a container once it runs for any length of time, because a container adds the filesystem and network fences that limit what a bug in the dependency can reach, and those fences cost nothing. A customer's code, for a single request, is also a container; for a session it wants a userspace kernel such as gVisor, which intercepts the system calls and answers most of them without touching the host kernel, so the attack surface shrinks to the calls the userspace kernel passes through; and for anything indefinite it wants a microVM, a separate guest kernel behind a hardware virtualisation boundary.

A language model's code starts one column further right than a customer's, because there is no contract and no author to call. Even for one request it gets a userspace kernel. For a session or longer, it gets its own kernel. The bottom-right cell, model-written code running indefinitely, is the corner where the shared kernel is the whole risk and nothing short of not sharing it is acceptable.

## The excuse Firecracker removed

The usual objection to microVMs is cost: a virtual machine takes seconds to boot and hundreds of megabytes to exist, so you cannot give one to every request. That objection describes a general-purpose hypervisor, and Firecracker was built to remove it. Its [specification](https://github.com/firecracker-microvm/firecracker/blob/main/SPECIFICATION.md) commits to at most 125 milliseconds from the API call that starts a microVM to the guest's init process, and at most 5 mebibytes of memory overhead for the virtual machine manager's threads, measured on bare-metal hosts; the [paper that introduced it](https://www.usenix.org/conference/nsdi20/presentation/agache) reports starting 150 microVMs a second on a single host. A boundary that costs an eighth of a second and five mebibytes is a boundary you can afford per session and, for many workloads, per request.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Firecracker's published targets against the cost people assume a virtual machine has</title>
<desc id="f2-d">A table of three rows. Time to guest init: Firecracker target at most 125 milliseconds, against the seconds a general-purpose virtual machine takes. Memory overhead of the manager: at most 5 mebibytes, against hundreds of megabytes. Creation rate: 150 microVMs a second per host, from the paper.</desc>
<text x="0" y="18" class="viz-title">A separate kernel for an eighth of a second and five mebibytes</text>
<text x="20" y="48" class="viz-tick">COST</text>
<text x="260" y="48" class="viz-tick">FIRECRACKER TARGET</text>
<text x="470" y="48" class="viz-tick">THE OLD ASSUMPTION</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">Time to guest init</text>
<text x="260" y="84" class="viz-value">at most 125 ms</text>
<text x="470" y="84" class="viz-label-muted">seconds</text>
<line x1="0" y1="100" x2="640" y2="100" class="viz-grid"/>
<text x="20" y="128" class="viz-label">Manager memory overhead</text>
<text x="260" y="128" class="viz-value">at most 5 MiB</text>
<text x="470" y="128" class="viz-label-muted">hundreds of megabytes</text>
<line x1="0" y1="144" x2="640" y2="144" class="viz-grid"/>
<text x="20" y="172" class="viz-label">Creation rate per host</text>
<text x="260" y="172" class="viz-value">150 a second</text>
<text x="470" y="172" class="viz-label-muted">a handful a minute</text>
<line x1="0" y1="188" x2="640" y2="188" class="viz-grid"/>
<text x="0" y="216" class="viz-label-muted">Targets are measured on bare-metal hosts; nested or shared hosts will be slower.</text>
</svg>
<figcaption>Source: the Firecracker <a href="https://github.com/firecracker-microvm/firecracker/blob/main/SPECIFICATION.md">specification</a> for the first two rows and Agache et al., <a href="https://www.usenix.org/conference/nsdi20/presentation/agache">NSDI 2020</a>, for the third; the right column is the assumption the numbers replace, not a measurement.</figcaption>
</figure>

The reason those numbers are possible is the same reason the boundary is strong: Firecracker implements a deliberately small device model, a few virtual devices and nothing else, so there is little for a guest to attack and little to initialise. A general-purpose hypervisor emulates a whole machine. A microVM emulates just enough of one to run a kernel, and the missing parts are missing attack surface.

## What the engine class buys and what it does not

A 2026 comparative study of sandboxes for model-written code, [Andronchik and Lokhmakov](https://arxiv.org/abs/2606.08433), looked at five products across the three engine classes, microVMs, userspace kernels and containers, and reached three conclusions that fit the grid. The engine classes separate cleanly on every architectural axis, which is the justification for choosing by class first. Products within a class do not separate, so the choice between two microVM products is about operations rather than architecture. And the property that dominated real outcomes was patch latency: engine-side patches for coordinated disclosures landed in roughly zero days, while downstream lag, the time before a product actually shipped the patched engine, ranged from zero days to more than 471, to opaque, to never.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Patch latency: engine-side against downstream, from the 2026 comparative study</title>
<desc id="f3-d">Two horizontal bars on a scale of days. Engine-side patch latency for coordinated disclosures, about zero days. Downstream lag before products ship the patched engine, a range from zero to over 471 days, with a note that some products were opaque or never updated. The downstream bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">The engine patches in a day; the product you run may not</text>
<text x="0" y="36" class="viz-sub">Days from disclosure to patch, engine versus downstream products, as reported</text>
<line x1="176" y1="52" x2="176" y2="150" class="viz-axis"/>
<text x="166" y="80" text-anchor="end" class="viz-label">Engine-side</text>
<rect x="176" y="64" width="4" height="20" class="viz-fgray"/>
<text x="192" y="80" class="viz-value">about 0 days</text>
<text x="166" y="126" text-anchor="end" class="viz-label">Downstream products</text>
<path d="M176 110 H586 a4 4 0 0 1 4 4 V130 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="582" y="105" text-anchor="end" class="viz-value">0 to over 471 days, or opaque, or never</text>
<text x="0" y="184" class="viz-label-muted">The boundary you chose is only as patched as the product you run it through.</text>
<text x="0" y="208" class="viz-tick">the study ranks nothing overall; class and operator patch policy are the variables</text>
</svg>
<figcaption>Source: Andronchik and Lokhmakov, <a href="https://arxiv.org/abs/2606.08433">AI Code Sandboxes: A Comparative Security Study</a>, June 2026, as stated in the abstract; the bar length for the downstream range is schematic.</figcaption>
</figure>

That third finding is the one to carry into procurement. The grid tells you which class of boundary a cell needs. It does not tell you that a product in that class is patched, and a microVM running a guest kernel that is 471 days behind is a separate kernel with 471 days of known holes. The two questions that pick the boundary get a third, operational one: how quickly does the product you run ship the engine's fixes, and can you see the answer?

## What I would require before letting a model's code run

None of the products I have shipped executes model-written code, so what follows is a requirement rather than a report. Before a product of mine ran code that a model produced, I would want three things written down. The cell in the grid the workload occupies, which for an agent that keeps state between steps is the bottom row and rarely the left column. The boundary that cell demands, which for the bottom row is a userspace kernel at minimum and a microVM for anything that lasts, with the microVM's cost now small enough that the argument for the weaker option is thin. And the patch policy of whatever runs the boundary, with a number of days attached, because the study's finding is that the number varies by three orders of magnitude between products that look the same on a feature list.

There is a fourth thing worth writing down, which is what the boundary is for. A sandbox is not a substitute for limiting what the code can reach: a microVM with the production database's credentials mounted inside it is a separate kernel with a straight road to the data. The boundary protects the host from the code; the credentials, network policy and filesystem mounts protect everything else from it, and the grid says nothing about those because they are the same in every cell.

The kernel is the thing you share with a stranger when you run their code in a container, and the stranger, increasingly, is a model. The costume is fine for your own code. For theirs, give them their own kernel. It costs an eighth of a second.
