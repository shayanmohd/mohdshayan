---
title: A content update is code
date: 2024-08-20
summary: CrowdStrike staged its sensor code but shipped the Channel File 291 update, filed as data, with no canary. Anything that changes what a fleet executes is code and ships like code.
tags: CrowdStrike, Staged Rollouts, Postmortems
topic: DevOps & Cloud
draft: false
---

On 19 July 2024 at 04:09 UTC, CrowdStrike released a content update for its Falcon sensor on Windows, and at 05:27 it reverted it. The next day Microsoft [estimated](https://web.archive.org/web/20240720155434/https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/) that the update had affected 8.5 million Windows devices, "or less than one percent of all Windows machines". The bug was small, a count off by one that no bounds check caught. What I keep coming back to is the route the update took. CrowdStrike's sensor code reaches customers through a staged rollout, and customers can hold back a version or two. The file that crashed the machines went through none of that. It travelled by a separate channel, for content CrowdStrike calls configuration data rather than code. Anything that changes what a fleet executes is code, whatever it is called, and it needs the same staged rollout, canaries and rollback as code.

## Two routes to the same machine

CrowdStrike's [preliminary post-incident review](https://web.archive.org/web/20240724225030/https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/), published on 24 July, describes both routes. Sensor Content ships only inside sensor releases, which culminate in "a staged sensor rollout process that starts with dogfooding internally at CrowdStrike, followed by early adopters". Rapid Response Content, the other route, "is stored in a proprietary binary file that contains configuration data. It is not code or a kernel driver." CrowdStrike's [technical details post](https://web.archive.org/web/20240720205957/https://www.crowdstrike.com/blog/falcon-update-for-windows-hosts-technical-details/) of 20 July adds that updates to these Channel Files "occur several times a day".

The review's scope for the crash is a time window, not a ring: Windows hosts on sensor 7.11 or later that were online between 04:09 and 05:27 UTC and received the update. Its first fix for deployment implies there was no smaller group to watch: a staggered rollout "starting with a canary deployment". The later root cause analysis made the gap a finding: "Each Template Instance should be deployed in a staged rollout."

<figure class="chart">
<svg viewBox="0 0 640 270" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The Channel File 291 update window on 19 July 2024, in UTC</title>
<desc id="f1-d">A time axis from 03:40 to 06:40 UTC. A shaded band runs from 04:09, when the content update was released for the Windows sensor, to 05:27, when the defect was reverted: 78 minutes. Hosts in scope were those on sensor 7.11 and later that were online in that window and received the update. After 05:27, hosts coming online were not impacted, while a host that had already crashed might not stay up long enough to fetch the reverted file; CrowdStrike's first advice was to reboot it, preferably on a wired network, to give it the chance.</desc>
<text x="0" y="18" class="viz-title">Seventy-eight minutes on 19 July 2024</text>
<text x="0" y="36" class="viz-sub">Channel File 291 update for Windows hosts, times in UTC from CrowdStrike's review</text>
<rect x="137" y="56" width="234" height="150" class="viz-a4"/>
<line x1="137" y1="56" x2="137" y2="206" class="viz-s4"/>
<line x1="371" y1="56" x2="371" y2="206" class="viz-s4"/>
<text x="145" y="74" class="viz-label">04:09 update released</text>
<text x="145" y="92" class="viz-label-muted">for the Windows sensor</text>
<text x="254" y="140" text-anchor="middle" class="viz-value">78 minutes</text>
<text x="254" y="160" text-anchor="middle" class="viz-label-muted">in scope: hosts on 7.11 and up</text>
<text x="254" y="178" text-anchor="middle" class="viz-label-muted">online that received the update</text>
<text x="379" y="74" class="viz-label">05:27 defect reverted</text>
<text x="379" y="92" class="viz-label-muted">hosts coming online after this</text>
<text x="379" y="110" class="viz-label-muted">were not impacted</text>
<text x="379" y="150" class="viz-label-muted">a crashed host might not stay</text>
<text x="379" y="168" class="viz-label-muted">up long enough to fetch the fix</text>
<line x1="50" y1="206" x2="590" y2="206" class="viz-axis"/>
<line x1="110" y1="206" x2="110" y2="212" class="viz-axis"/>
<line x1="290" y1="206" x2="290" y2="212" class="viz-axis"/>
<line x1="470" y1="206" x2="470" y2="212" class="viz-axis"/>
<text x="110" y="228" text-anchor="middle" class="viz-tick">04:00</text>
<text x="290" y="228" text-anchor="middle" class="viz-tick">05:00</text>
<text x="470" y="228" text-anchor="middle" class="viz-tick">06:00</text>
<text x="590" y="228" text-anchor="end" class="viz-tick">UTC</text>
<text x="0" y="256" class="viz-label-muted">Three pixels per minute; the band runs from release to revert.</text>
</svg>
<figcaption>Source: release and revert times, the scope of affected hosts and the note on hosts coming online later from CrowdStrike's <a href="https://web.archive.org/web/20240724225030/https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/">preliminary post-incident review of 24 July 2024</a>; the note on crashed hosts from the remediation guidance on the same page, which first advised a reboot to give a host "an opportunity to download the reverted channel file".</figcaption>
</figure>

## Twenty values for twenty-one fields

The [root cause analysis](https://web.archive.org/web/20240806170341/https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf) CrowdStrike published on 6 August explains the crash. Sensor 7.11, released in February, added a Template Type for spotting abuse of named pipes and other interprocess communication (IPC), and Channel File 291 carried the instances that configure it. In the analysis's words: "The new IPC Template Type defined 21 input parameter fields, but the integration code that invoked the Content Interpreter with Channel File 291's Template Instances supplied only 20 input values to match against."

That mismatch sat on customers' machines for almost five months without harm, because nothing read the 21st field: the test instances and the first instances in production put a wildcard there. On 19 July two new instances went out, and one "introduced a non-wildcard matching criterion for the 21st input parameter". At the next IPC notification from the operating system, the Content Interpreter tried to read a 21st value from an array of 20, and no runtime bounds check stopped it. The crash dump in the analysis shows the index it asked for: 0x14, the 21st element.

A Content Validator checked the file before it shipped, and passed it. The analysis says it "based its assessment on the expectation that the IPC Template Type would be provided with 21 inputs". The validator compared the content with the definition of the type; the sensor ran the content against the code. The two disagreed, and the machines ran the code.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Twenty-one input fields defined, twenty supplied</title>
<desc id="f2-d">Two rows of boxes. The top row has 21 boxes: the IPC Template Type definition, which the Content Validator checked against, declared 21 input fields. The bottom row has 20 filled boxes and an outlined 21st position past the end of the array: the sensor code passed 20 input values to the Content Interpreter, and where a 21st would sit, the crash dump found a value that was not a valid pointer. An arrow points to that position from a label for the 19 July instance, which set a non-wildcard criterion in field 21, so reading index 0x14 hit a bad pointer past the end of the array. Earlier instances put a wildcard in field 21, so nothing read it.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Twenty-one fields defined, twenty supplied</text>
<text x="0" y="36" class="viz-sub">The IPC Template Type behind Channel File 291, from CrowdStrike's root cause analysis</text>
<text x="40" y="66" class="viz-label">Type definition, as the Content Validator checked it: 21 fields</text>
<rect x="40" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="66" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="92" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="118" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="144" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="170" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="196" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="222" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="248" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="274" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="300" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="326" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="352" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="378" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="404" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="430" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="456" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="482" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="508" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="534" y="76" width="22" height="28" rx="3" class="viz-box"/><rect x="560" y="76" width="22" height="28" rx="3" class="viz-box-accent"/>
<text x="51" y="124" text-anchor="middle" class="viz-tick">1</text>
<text x="545" y="124" text-anchor="middle" class="viz-tick">20</text>
<text x="571" y="124" text-anchor="middle" class="viz-tick">21</text>
<text x="40" y="152" class="viz-label">Sensor code, values passed to the Content Interpreter: 20</text>
<rect x="40" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="66" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="92" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="118" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="144" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="170" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="196" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="222" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="248" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="274" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="300" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="326" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="352" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="378" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="404" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="430" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="456" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="482" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="508" y="162" width="22" height="28" rx="3" class="viz-f2"/><rect x="534" y="162" width="22" height="28" rx="3" class="viz-f2"/>
<rect x="560" y="162" width="22" height="28" rx="3" class="viz-a4"/>
<rect x="560" y="162" width="22" height="28" rx="3" class="viz-s4"/>
<line x1="571" y1="252" x2="571" y2="196" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="556" y="224" text-anchor="end" class="viz-label">19 July instance: a non-wildcard criterion in field 21</text>
<text x="556" y="242" text-anchor="end" class="viz-label-muted">so reading index <tspan class="viz-tick">0x14</tspan> hit a bad pointer past the end</text>
<text x="0" y="268" class="viz-label-muted">Earlier instances put a wildcard in field 21, so nothing read it.</text>
<text x="0" y="290" class="viz-tick">one box per input field; the 21st was defined but never supplied</text>
</svg>
<figcaption>Source: CrowdStrike's <a href="https://web.archive.org/web/20240806170341/https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf">root cause analysis of 6 August 2024</a>, its account of what happened, findings 1, 3 and 4, and the crash dump analysis.</figcaption>
</figure>

## The label did the damage

The code that crashed had been through the full release process. Sensor 7.11 became generally available on 28 February and "followed all Sensor Content testing procedures"; the Template Type passed a stress test on 5 March; four instances shipped between March and April and "performed as expected in production". None of that found the bug, because only a particular kind of content could reach it, and none had yet. The change that altered what the fleet executed on 19 July was the file, and it came by the one route with no canary in front of it.

That is why I think the line between configuration data and code was drawn in the wrong place. The review says a Template Type's "runtime behavior is configured dynamically by the Template Instance". The analysis describes the faulting code selecting an input "according to an index specified by Channel File 291", inside a kernel driver that is "loaded from an early phase of system boot". A file that tells a kernel driver which memory to read is a program, and the interpreter is the machine it runs on. The label also trusted the interpreter to make bad content harmless; the review says it "is designed to gracefully handle exceptions from potentially problematic content", and this one "could not be gracefully handled".

The review's account of why the new instances shipped is the clearest statement of the habit. They went out on the strength of "the testing performed before the initial deployment of the Template Type (on March 05, 2024), trust in the checks performed in the Content Validator, and previous successful IPC Template Instance deployments". Two of the three say nothing about the new file. The validator did check it, but only against the type's definition; the analysis's fifth finding is that instance validation should "include testing within the Content Interpreter".

## Rollback cannot reach a machine that is down

The file was reverted 78 minutes after release, which is fast. But a revert reaches only the machines that stay up long enough to fetch it. CrowdStrike's [remediation hub](https://web.archive.org/web/20240726160557/https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/) told administrators what to do when "hosts are still crashing and unable to stay online to receive the Channel File update": reboot to give the host "an opportunity to download the reverted channel file", and if it crashed again, use bootable recovery images, delete the Channel File by hand from a mounted disk, and find BitLocker recovery keys. By the hub's count, more than 97 percent of Windows sensors were online by 24 July compared with before the update, and the root cause analysis put it at about 99 percent by 29 July, against a usual weekly variance of about 1 percent. Seventy-eight minutes to undo the file; days to undo the damage.

A change that can take down the machine that receives it can also take down the channel you would use to undo it. For that class of change, rollback is a recovery plan, and the canary is the only defence that tries the real change on real machines before the fleet has it. On the analysis's account the crash needed nothing rarer than an IPC notification, and named pipes, the technical post notes, "are used for normal, interprocess or intersystem communication in Windows". A fault triggered that easily does not hide from a small sample. I would expect a ring of a few thousand machines to show it long before anyone promoted the file to a second ring.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">How many devices each ring of a staged rollout would have exposed</title>
<desc id="f3-d">A grid of 1,000 squares standing for the 8.5 million devices Microsoft estimated were affected, so each square is 8,500 devices. Each ring includes the ones before it. One red square is a canary ring of 0.1 percent, 8,500 devices. A row of ten squares, the canary included, is a first ring of 1 percent, 85,000 devices. A block of 100 squares, the first ring included, is a second ring of 10 percent, 850,000 devices. The whole grid is everyone, 8.5 million. Halting at the canary exposes a thousandth of the devices.</desc>
<text x="0" y="18" class="viz-title">What a canary ring would have put at risk</text>
<text x="0" y="36" class="viz-sub">A thought experiment, with rings as shares of Microsoft's 8.5 million estimate</text>
<rect x="0" y="62" width="10" height="10" class="viz-f4"/>
<text x="18" y="72" class="viz-label">Canary, 0.1%</text>
<text x="215" y="72" text-anchor="end" class="viz-value">8,500</text>
<rect x="0" y="92" width="10" height="10" class="viz-fgray"/><rect x="0" y="92" width="10" height="10" class="viz-q2"/><rect x="0" y="92" width="10" height="10" class="viz-q4"/>
<text x="18" y="102" class="viz-label">Ring 1, 1%</text>
<text x="215" y="102" text-anchor="end" class="viz-value">85,000</text>
<rect x="0" y="122" width="10" height="10" class="viz-fgray"/><rect x="0" y="122" width="10" height="10" class="viz-q2"/>
<text x="18" y="132" class="viz-label">Ring 2, 10%</text>
<text x="215" y="132" text-anchor="end" class="viz-value">850,000</text>
<rect x="0" y="152" width="10" height="10" class="viz-fgray"/>
<text x="18" y="162" class="viz-label">Everyone</text>
<text x="215" y="162" text-anchor="end" class="viz-value">8,500,000</text>
<text x="0" y="202" class="viz-label-muted">Halting at the canary</text>
<text x="0" y="220" class="viz-label-muted">exposes a thousandth of</text>
<text x="0" y="238" class="viz-label-muted">the devices, not all of them</text>
<rect x="230" y="56" width="400" height="250" class="viz-fgray"/>
<rect x="230" y="56" width="100" height="100" class="viz-q2"/>
<rect x="230" y="56" width="100" height="10" class="viz-q4"/>
<rect x="230" y="56" width="10" height="10" class="viz-f4"/>
<path d="M230 56 V306 M240 56 V306 M250 56 V306 M260 56 V306 M270 56 V306 M280 56 V306 M290 56 V306 M300 56 V306 M310 56 V306 M320 56 V306 M330 56 V306 M340 56 V306 M350 56 V306 M360 56 V306 M370 56 V306 M380 56 V306 M390 56 V306 M400 56 V306 M410 56 V306 M420 56 V306 M430 56 V306 M440 56 V306 M450 56 V306 M460 56 V306 M470 56 V306 M480 56 V306 M490 56 V306 M500 56 V306 M510 56 V306 M520 56 V306 M530 56 V306 M540 56 V306 M550 56 V306 M560 56 V306 M570 56 V306 M580 56 V306 M590 56 V306 M600 56 V306 M610 56 V306 M620 56 V306 M630 56 V306 M230 56 H630 M230 66 H630 M230 76 H630 M230 86 H630 M230 96 H630 M230 106 H630 M230 116 H630 M230 126 H630 M230 136 H630 M230 146 H630 M230 156 H630 M230 166 H630 M230 176 H630 M230 186 H630 M230 196 H630 M230 206 H630 M230 216 H630 M230 226 H630 M230 236 H630 M230 246 H630 M230 256 H630 M230 266 H630 M230 276 H630 M230 286 H630 M230 296 H630 M230 306 H630" class="viz-gap"/>
<text x="0" y="278" class="viz-tick">rings are cumulative</text>
<text x="0" y="296" class="viz-tick">each square is 8,500 devices</text>
<text x="0" y="314" class="viz-tick">1,000 squares in all</text>
</svg>
<figcaption>Illustrative: the ring sizes are assumptions, not CrowdStrike's design; the whole grid is the 8.5 million devices Microsoft estimated in its <a href="https://web.archive.org/web/20240720155434/https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/">post of 20 July 2024</a>, so each square stands for 8,500 devices.</figcaption>
</figure>

Speed is the honest objection. Rapid Response Content exists to respond, in the review's phrase, "at operational speed", several times a day. But speed argues for a short ladder, not for no ladder. The root cause analysis of 6 August describes one: instances "successively promoted to wider deployment rings or rolled back if problems are detected", with "bake-in time" after each promotion. Each ring that bakes for an hour delays a detection by an hour, so a short ladder costs a few hours. Against that, the recovery from 19 July took days, some of it by hand.

## The worst case decides

The test I would apply is not what a change is called or what format it is in, but what its worst version could make a machine do. If the answer includes crashing the machine, hanging it or cutting it off from the network, the change is code. It gets a canary ring, a bake time long enough for the failure you fear to show itself, a halt condition written down before the release, and a rollback path that does not depend on the change having worked. Feature flags, routing tables, detection rules, model weights and regular expressions all go through that test, and most of them turn out to be code.

Microsoft's closing paragraph called the incident a reminder of how important it is "to prioritize operating with safe deployment and disaster recovery using the mechanisms that exist". The mechanisms existed at CrowdStrike too. They were applied to the sensor and not to the file, and the file was the program.
