---
title: The phone in the house is not the child's
date: 2026-02-08
summary: About 90 percent of rural Indian teenagers have a smartphone at home; a third own one. Learning apps run on borrowed, shared devices, and that changes what offline-first means.
tags: Digital Access, Education, Android
draft: false
---

Digital access is usually measured by asking whether a household has a smartphone, and by that measure Indian teenagers are nearly all online. The measure is wrong for anyone building software for them. The phone in the house belongs to a parent or an older sibling, it is available in windows rather than all day, and it goes back when the window closes. An app that assumes the person holding the phone is its owner will lose their progress, lock them out with an OTP sent to someone else's number, or ask them to install something on a device that is not theirs to fill. Offline-first is necessary for that user and not sufficient. What they need is borrowed-phone design, and the gap between access and ownership is the reason.

## Access is not ownership

The ASER 2024 survey, the first of the annual rural household surveys to add a digital section for 14 to 16 year olds, put numbers on the gap. According to the [national findings](https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf), nearly 90 percent of both girls and boys in that age group have a smartphone at home, and 82.2 percent can use one. Of the children who can use one, 27 percent of 14 year olds and 37.8 percent of 16 year olds own the phone they use, and the split by gender is 36.2 percent of boys against 26.9 percent of girls. About 57 percent had used a phone for something educational in the reference week, and 76 percent for social media, as [reported](https://theprint.in/india/education/in-rural-india-82-2-teens-aged-14-16-know-how-to-use-smartphone-but-only-57-use-it-for-studies/2467560/) when the survey was released.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Smartphone access against ownership among rural Indian 14 to 16 year olds, ASER 2024</title>
<desc id="f1-d">Horizontal bars in percent. Access: smartphone at home, nearly 90; can use a smartphone, 82.2. Ownership, among those who can use one: 14 year olds, 27; 16 year olds, 37.8; boys, 36.2; girls, 26.9. Access bars are gold, ownership bars are blue.</desc>
<text x="0" y="18" class="viz-title">Nearly everyone can reach a phone; a third have their own</text>
<text x="0" y="36" class="viz-sub">Percent of rural 14 to 16 year olds, ASER 2024</text>
<rect x="420" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="438" y="37" class="viz-label-muted">access</text>
<rect x="510" y="26" width="12" height="12" rx="3" class="viz-f2"/><text x="528" y="37" class="viz-label-muted">ownership</text>
<line x1="176" y1="52" x2="176" y2="290" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Smartphone at home</text>
<path d="M176 58 H532 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="552" y="73" class="viz-value">nearly 90</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Can use one</text>
<path d="M176 92 H501 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="521" y="107" class="viz-value">82.2</text>
<text x="166" y="149" text-anchor="end" class="viz-label">Own one, age 14</text>
<path d="M176 134 H280 a4 4 0 0 1 4 4 V150 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="300" y="149" class="viz-value">27.0</text>
<text x="166" y="183" text-anchor="end" class="viz-label">Own one, age 16</text>
<path d="M176 168 H323 a4 4 0 0 1 4 4 V184 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="343" y="183" class="viz-value">37.8</text>
<text x="166" y="217" text-anchor="end" class="viz-label">Own one, boys</text>
<path d="M176 202 H317 a4 4 0 0 1 4 4 V218 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="337" y="217" class="viz-value">36.2</text>
<text x="166" y="251" text-anchor="end" class="viz-label">Own one, girls</text>
<path d="M176 236 H280 a4 4 0 0 1 4 4 V252 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/>
<text x="300" y="251" class="viz-value">26.9</text>
<text x="0" y="316" class="viz-label-muted">Ownership is asked of those who can use a phone; the gap is the borrowed device.</text>
</svg>
<figcaption>Source: <a href="https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf">ASER 2024 national findings</a>, digital section for ages 14 to 16; the at-home figure is reported as nearly 90 percent.</figcaption>
</figure>

Read as a product constraint, the chart says that for roughly two in three of these teenagers, and closer to three in four of the girls, the phone a learning app runs on is someone else's. It is available when its owner is home and not using it. It has the owner's SIM, the owner's app store account, the owner's storage budget and the owner's notifications. And tomorrow it may be a different phone, because the parent who lent theirs last night is out and a sibling's is the one on the table.

## Borrowed-phone design

The specification I use has three parts and one test. The first part is that state must survive handover: the app's data has to be scoped to the child, not to the device, so that when the phone goes back and comes out again, possibly with someone else having used the app in between, the child's progress is intact and separate. On Android that is a local store, [Room](https://developer.android.com/training/data-storage/room) in my case, with a lightweight profile switch in front of it and no assumption that one device means one user.

The second part is that a session must complete in under twenty minutes, because that is the shape of a borrowed window. Anything that needs an hour of continuous access, a long video, a timed test, a large download, will be interrupted by the phone being reclaimed, and the app has to treat interruption as the normal end of a session rather than an error. Every step saves as it goes; nothing is lost if the phone is handed back mid-screen.

The third part is that no step may require the phone's own number or account. An OTP goes to the parent's number, which may not be in the room. A sign-in with the store account is the parent's identity, not the child's. Both are fine on an owned phone and both fail on a borrowed one, so the app has no account and no OTP, which is also why it has no server and no data that can leak.

<figure class="chart">
<svg viewBox="0 0 640 270" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A borrowed-phone session, with the handover points marked</title>
<desc id="f2-d">A flow of five boxes: the child picks up a shared phone; opens the app and selects their profile, restoring local state; completes a short session with every step saved; hands the phone back, which is a normal end; and tomorrow picks up a possibly different phone. A note marks that state crosses the first handover on the device and the second only if it is portable.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Handover is the normal end of a session</text>
<rect x="8" y="50" width="112" height="64" rx="8" class="viz-box"/>
<text x="64" y="76" text-anchor="middle" class="viz-label">Picks up</text>
<text x="64" y="94" text-anchor="middle" class="viz-label-muted">a shared phone</text>
<line x1="122" y1="82" x2="134" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="138" y="50" width="112" height="64" rx="8" class="viz-box-accent"/>
<text x="194" y="76" text-anchor="middle" class="viz-label">Own profile</text>
<text x="194" y="94" text-anchor="middle" class="viz-label-muted">state restored</text>
<line x1="252" y1="82" x2="264" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="268" y="50" width="112" height="64" rx="8" class="viz-box"/>
<text x="324" y="76" text-anchor="middle" class="viz-label">Short session</text>
<text x="324" y="94" text-anchor="middle" class="viz-label-muted">every step saved</text>
<line x1="382" y1="82" x2="394" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="398" y="50" width="112" height="64" rx="8" class="viz-box"/>
<text x="454" y="76" text-anchor="middle" class="viz-label">Hands back</text>
<text x="454" y="94" text-anchor="middle" class="viz-label-muted">a normal end</text>
<line x1="512" y1="82" x2="524" y2="82" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="528" y="50" width="104" height="64" rx="8" class="viz-box-ink"/>
<text x="580" y="76" text-anchor="middle" class="viz-on-ink">Tomorrow</text>
<text x="580" y="94" text-anchor="middle" class="viz-on-ink">another phone?</text>
<text x="194" y="150" text-anchor="middle" class="viz-tick">handover 1: same device, other user</text>
<text x="194" y="168" text-anchor="middle" class="viz-label-muted">state crosses on the device</text>
<text x="500" y="150" text-anchor="middle" class="viz-tick">handover 2: different device</text>
<text x="500" y="168" text-anchor="middle" class="viz-label-muted">state crosses only if portable</text>
<text x="320" y="212" text-anchor="middle" class="viz-label-muted">The handover test: can the child continue on a different phone tomorrow?</text>
<text x="320" y="244" text-anchor="middle" class="viz-tick">no account, no OTP, no server: the state has to carry itself</text>
</svg>
<figcaption>Illustrative: the session shape the specification is written for, with the two handovers that state has to cross.</figcaption>
</figure>

The test that ties the three parts together is the handover test: can the child pick up where they left off on a different phone tomorrow? The first handover, same phone and a different user in between, is passed by scoping state to a profile. The second, a different phone entirely, is harder without a server, and the honest answer for an app with no account is that state has to carry itself: a habit tracker's entire history is small enough to travel as a code the child can type or a QR the other phone can scan, and that portability, rather than a login, is what an offline app owes a borrowed-phone user.

## Storage and notifications are borrowed too

Two more things belong to the phone's owner and are easy to forget. The first is storage. An app that downloads a large content pack is filling a device whose owner did not agree to that, and on the budget phones most of these households have, the pack competes with the owner's photos and messages. The design consequence is a small install and content that arrives in small units, each one useful on its own, rather than a library fetched up front. The second is notifications. A reminder from the app appears on the owner's lock screen, at a time the owner did not choose, about a child who may not be nearby, and the owner's likely response is to uninstall it. So the reminder feature that a habit tracker is built around has to be rethought for a borrowed phone: reminders live inside the app, shown when the child opens it, and the app never asks for permission to interrupt the owner.

There is a quieter version of the same point about privacy. When the profile switch puts two children's data on one phone, each child's progress is visible to the sibling who used the app before them unless the profile is protected, and a four-digit PIN per profile, optional and set by the child, is enough to keep a younger sibling's streak from being edited by an older one. It costs a screen. It is the difference between an app that a child trusts with their own effort and one they use only when nobody else is around.

## What the window is worth

It helps to be concrete about how little time a borrowed window contains, even though the exact minutes vary by household and nobody has measured them at scale. An owned phone is available for most waking hours. A phone shared with a working parent is available in the evening, after the parent's own use, for perhaps half an hour to an hour. A phone shared among siblings splits that window again. The design consequence is that a session has to deliver something complete in the smallest of those windows, and a curriculum that assumes daily hour-long sessions is a curriculum for the third of teenagers who own their phone.

<figure class="chart">
<svg viewBox="0 0 640 220" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Minutes of device access per day under three ownership assumptions</title>
<desc id="f3-d">Three horizontal bars, illustrative: owned phone, several hours; shared with a working parent, about forty-five minutes in the evening; shared among siblings, about twenty minutes. A marker at twenty minutes shows the session ceiling the specification adopts.</desc>
<text x="0" y="18" class="viz-title">The window a session has to fit</text>
<text x="0" y="36" class="viz-sub">Minutes of access per day, illustrative assumptions</text>
<line x1="176" y1="52" x2="176" y2="154" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Owned phone</text>
<path d="M176 58 H596 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="592" y="53" text-anchor="end" class="viz-value">most waking hours</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Shared with a parent</text>
<path d="M176 92 H281 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="301" y="107" class="viz-value">about 45, evenings</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Shared among siblings</text>
<path d="M176 126 H222 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="242" y="141" class="viz-value">about 20</text>
<line x1="226" y1="52" x2="226" y2="154" class="viz-s4"/>
<text x="232" y="172" class="viz-label-muted">session ceiling: 20 minutes</text>
<text x="0" y="204" class="viz-label-muted">Bars are assumptions for the design, not survey results; the ordering is the point.</text>
</svg>
<figcaption>Illustrative: three ownership assumptions and the session ceiling; the minute values are stated assumptions, not measurements.</figcaption>
</figure>

## Where the design stops

Borrowed-phone design has a limit, and it is identity. An app that has no account and no OTP cannot prove who is using it, which is fine for a habit tracker and for most practice and revision, and is not fine for anything that must certify a person: an examination, a scholarship application, a credential. Those need the phone's number or a document, and they are precisely the services that the ownership gap locks a third of teenagers, and most girls, out of. The design cannot fix that; it can only be clear about where it stops, and hand off to a process that does not run on a phone at all.

That limit is also the argument for building the rest of the stack this way. Everything that does not need identity can be made to work on a borrowed phone in a twenty-minute window with no account, and if it is built that way, the phone in the house is enough. The measure that says nearly all teenagers are online is not wrong. It is just measuring the house.
