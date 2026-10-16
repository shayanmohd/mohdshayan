---
title: The regulation is a reducer
date: 2026-10-16
summary: Dutyclock turns the drivers' hours rules into a pure function over a log of taps, with golden tests built from the regulator's own worked examples. What it shows is advisory, and it says so.
tags: Rules Engines, Regulation, Android
topic: Product & Enterprise
draft: false
---

Dutyclock is an Android app for lorry, coach and van drivers that counts down the hours the drivers' hours rules allow: the break due after 4.5 hours of driving, the 9-hour day, the 56-hour week, the 90-hour fortnight and the rest deadlines. The driver taps one of four modes and everything on screen is derived from the taps; no counter is stored, and an edit to the log recomputes the lot. The part of Regulation 561/2006 the app covers is one function from a list of segments to a state, a reducer, and the lesson carries to any software in a regulated trade: encode the rule as a pure function, use the regulator's own worked examples as golden tests, and say plainly that the output is advisory, not a record.

## The numbers the regulator publishes

The [GOV.UK guide to drivers' hours for goods vehicles](https://www.gov.uk/guidance/drivers-hours-goods-vehicles/1-assimilated-and-aetr-rules-on-drivers-hours), read on 12 October 2026 and showing an update date of 1 July 2026, states the rules in a page; the chart has the six limits to one scale. The 45-minute break may be split into at least 15 minutes followed by at least 30, in that order, and a break under 15 minutes contributes nothing. A fixed week runs from 00:00 Monday to 24:00 the following Sunday. The guide also records that from 1 July 2026 the assimilated rules, its name for Regulations 561/2006 and 165/2014 as they apply in the UK, reach light goods vehicles over 2.5 tonnes on international work, cabotage included.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The six limits of Regulation 561/2006 drawn to one scale in hours</title>
<desc id="f1-d">Horizontal bars in hours: driving between breaks 4.5, daily driving 9, daily rest 11, weekly rest 45, weekly driving 56, fortnight driving 90. Driving maxima are in one colour and rest minima in another, and each label states the alternative the rules allow, such as 10 hours twice a week, a 9-hour rest three times, or a 24-hour reduced weekly rest with compensation.</desc>
<text x="0" y="18" class="viz-title">Six limits, one scale</text>
<text x="0" y="36" class="viz-sub">The regular figure for each limit in hours; the alternative the rules allow is in the label</text>
<line x1="150" y1="52" x2="150" y2="256" class="viz-axis"/>
<text x="140" y="73" text-anchor="end" class="viz-label">Between breaks</text>
<path d="M150 58 H168.5 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H150 Z" class="viz-f1"/>
<text x="188" y="73" class="viz-value">4.5 h, then 45 minutes, or 15 then 30</text>
<text x="140" y="107" text-anchor="end" class="viz-label">Daily driving</text>
<path d="M150 92 H191 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H150 Z" class="viz-f1"/>
<text x="211" y="107" class="viz-value">9 h, or 10 h twice in a fixed week</text>
<text x="140" y="141" text-anchor="end" class="viz-label">Daily rest</text>
<path d="M150 126 H201 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H150 Z" class="viz-f2"/>
<text x="221" y="141" class="viz-value">11 h, or 9 h three times between weekly rests</text>
<text x="140" y="175" text-anchor="end" class="viz-label">Weekly rest</text>
<path d="M150 160 H371 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H150 Z" class="viz-f2"/>
<text x="391" y="175" class="viz-value">45 h, or 24 h with compensation</text>
<text x="140" y="209" text-anchor="end" class="viz-label">Weekly driving</text>
<path d="M150 194 H426 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H150 Z" class="viz-f1"/>
<text x="422" y="209" text-anchor="end" class="viz-onfill">56 h in a fixed week</text>
<text x="140" y="243" text-anchor="end" class="viz-label">Fortnight driving</text>
<path d="M150 228 H596 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H150 Z" class="viz-f1"/>
<text x="592" y="243" text-anchor="end" class="viz-onfill">90 h in any two consecutive weeks</text>
<rect x="150" y="272" width="12" height="12" rx="3" class="viz-f1"/><text x="168" y="283" class="viz-label-muted">driving, at most</text>
<rect x="300" y="272" width="12" height="12" rx="3" class="viz-f2"/><text x="318" y="283" class="viz-label-muted">rest, at least</text>
<text x="0" y="312" class="viz-label-muted">Five pixels per hour; the 90-hour fortnight sets the width.</text>
</svg>
<figcaption>Source: section 1 of the GOV.UK guide <a href="https://www.gov.uk/guidance/drivers-hours-goods-vehicles/1-assimilated-and-aetr-rules-on-drivers-hours">Drivers' hours and tachographs: goods vehicles</a>, which shows an update date of 1 July 2026, read on 12 October 2026.</figcaption>
</figure>

Two other rule sets ride along. The [GB domestic rules](https://www.gov.uk/guidance/drivers-hours-goods-vehicles/2-great-britain-domestic-rules-on-drivers-hours) allow 10 hours of driving and 11 of duty in a working day, the 24 hours from the start of duty. The working time rules in the guide's [Annex 2](https://www.gov.uk/guidance/drivers-hours-goods-vehicles/annex-2-working-time-rules) add an average of 48 hours a week over a reference period of normally 17 weeks, or 26 under a collective or workforce agreement, a ceiling of 60 hours in any single week, and breaks of their own: no more than 6 consecutive hours of work without one, 30 minutes of breaks across 6 to 9 hours of work and 45 beyond, each at least 15 minutes.

## Taps become segments

The vocabulary in Model.kt is the tachograph's: driving, other work, availability, and break or rest. A tap is an Entry, an instant and a mode that lasts until the next tap, and segmentsOf turns the entries into half-open segments, merging back-to-back stretches of one mode because a rest is one rest however many times it was tapped; duty merges only within one rule set. Of the four rule sets, EU 561/2006, AETR, the van set the model labels as in scope from 1 July 2026, and GB domestic goods, the first three share the 561/2006 limits and run the working time rules alongside. A Seed is the catch-up sheet, the state of a week already under way as the driver reads it off the tachograph. DayChoices holds the two things the rules let a driver elect, a 10-hour day and a reduced 9-hour rest, and its comment is the design in a sentence: nothing is assumed, the default is the stricter limit. The day's driving limit is 9 hours until the driver chooses otherwise, or passes nine hours with a 10-hour day unused, which limits() spends rather than call the day over; the rest owed is 11 hours, or 9 after a reduced-rest choice or a finished first part of a split rest, 3 hours or more.

## The replay

Replay.kt is the reducer. It takes the seed and the segments in order and keeps the running totals every rule needs, from driving since the last qualifying break to the debts for reduced weekly rests, each due by the end of the third week after the one it began in. Its comment says what that buys: the same log always produces the same state, so any edit simply replays. RuleEngine.replay clips the history to the 20 weeks before now; the longest window any rule needs is an 18-week working time period.

From the replayed state, limits() builds a Limits record, which the code describes as every number the counters, the planner and the alerts are built from. FixedWeek.kt anchors the working time reference period on the Monday on or after 1 April, 1 August and 1 December, 17 or 18 weeks at 48 hours a week, citing section 3.6 of the Department for Transport's guidance, and counts weeks in UTC, the clock the tachograph records.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The engine as a flow from taps to counters, alerts, planner and record</title>
<desc id="f2-d">A flow in two rows. Taps become entries, entries become segments with same-mode stretches merged, and the segments are replayed over a 20-week window. The replay feeds Limits, every number the rest is built from, and Limits fans out to the twelve counter kinds, the alerts and the drive-home planner. The 28-day record is drawn from the replay's findings and the entries. Everything from segments onward is plain Kotlin in core/.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">From taps to counters, in one direction</text>
<text x="0" y="36" class="viz-sub">Nothing downstream is stored; every screen is recomputed from the log</text>
<rect x="8" y="50" width="120" height="60" rx="8" class="viz-box"/>
<text x="68" y="76" text-anchor="middle" class="viz-label">Taps</text>
<text x="68" y="94" text-anchor="middle" class="viz-label-muted">mode and instant</text>
<line x1="130" y1="80" x2="156" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="160" y="50" width="130" height="60" rx="8" class="viz-box"/>
<text x="225" y="76" text-anchor="middle" class="viz-label">Entries</text>
<text x="225" y="94" text-anchor="middle" class="viz-label-muted">the editable log</text>
<line x1="292" y1="80" x2="318" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="322" y="50" width="140" height="60" rx="8" class="viz-box-accent"/>
<text x="392" y="76" text-anchor="middle" class="viz-label">Segments</text>
<text x="392" y="94" text-anchor="middle" class="viz-label-muted">same mode merged</text>
<line x1="464" y1="80" x2="490" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="494" y="50" width="138" height="60" rx="8" class="viz-box-accent"/>
<text x="563" y="76" text-anchor="middle" class="viz-label">Replay</text>
<text x="563" y="94" text-anchor="middle" class="viz-label-muted">20-week window</text>
<polyline points="520,112 520,132 68,132 68,156" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="600" y1="112" x2="600" y2="172" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="594" y="146" text-anchor="end" class="viz-tick">findings</text>
<rect x="8" y="160" width="120" height="60" rx="8" class="viz-box-accent"/>
<text x="68" y="186" text-anchor="middle" class="viz-label">Limits</text>
<text x="68" y="204" text-anchor="middle" class="viz-label-muted">every number</text>
<line x1="130" y1="190" x2="318" y2="156" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="130" y1="190" x2="318" y2="190" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="130" y1="190" x2="318" y2="224" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="322" y="142" width="140" height="28" rx="6" class="viz-box"/>
<text x="392" y="160" text-anchor="middle" class="viz-label">12 counter kinds</text>
<rect x="322" y="176" width="140" height="28" rx="6" class="viz-box"/>
<text x="392" y="194" text-anchor="middle" class="viz-label">Up to three alerts</text>
<rect x="322" y="210" width="140" height="28" rx="6" class="viz-box"/>
<text x="392" y="228" text-anchor="middle" class="viz-label">Drive-home planner</text>
<rect x="494" y="176" width="138" height="28" rx="6" class="viz-box"/>
<text x="563" y="194" text-anchor="middle" class="viz-label">28-day PDF record</text>
<text x="8" y="268" class="viz-label-muted">Segments onward is core/: plain Kotlin, no Android imports, tested on the JVM</text>
</svg>
<figcaption>Illustrative: the structure of core/ as it is laid out in Model.kt, Replay.kt and RuleEngine.kt; the alerts are planned from the counters, the planner appends a proposed drive to the entries and runs the chain again, and the record is drawn from the entries and the replay's findings.</figcaption>
</figure>

Twelve kinds of counter come out the far end: break, daily driving, daily rest, weekly rest, the 56-hour week, the 90-hour fortnight, compensation, the working time break, the 60-hour week, the 48-hour average, and GB driving and duty. Each carries the time left, the clock that moves it, driving, work, duty or the wall, and the article, regulation or Act it cites, with the guidance section. The alert planner arms at most three alarms from the list, and the drive-home planner appends a proposed drive as synthetic entries and runs the replay again to find which limit runs out first. Every write to the log re-arms the alerts, and the writes and reads together are the whole seam between the pure part and the phone.

No optional derogation is applied, not the ferry interruption, multi-manning, the coach 12-day rule or consecutive reduced weekly rests abroad, and the replay's comment calls this conservative by construction: every driving minute counts toward every EU counter, and a rest in progress never clears a debt or spends a reduced rest until it ends. The app can overcount, and what it knowingly leaves out, other work before a catch-up, is written down where the seed is read; for a countdown that ends at a roadside check, overcounting is the only acceptable error.

## The regulator's examples are the tests

The engine is plain Kotlin with no Android imports, so it runs under JUnit; BreakRulesTest.kt cites section 1.4 of the GOV.UK guide and Article 7 of the regulation at the top. Five of its six tests are the guide's sentences and diagrams turned into logs; the sixth replays the product blueprint's split break, moves one tap and checks the totals follow. Fifteen minutes of work, 270 of driving and a 45-minute break leave 4 hours 30 available and no late-break finding. Two hours of driving, a 15-minute rest, two more hours and a 30 reset the clock to 4 hours 30; with the 30 first, the same minutes leave 30, because a 15 cannot be the second part. A 14-minute break counts for nothing, and 275 minutes of driving with no break produces a BREAK_LATE finding stamped at 4 hours 30 after the first tap, not at the end of the drive.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Two logs from BreakRulesTest, the split break in the right order and the wrong one</title>
<desc id="f3-d">Two timelines of 4 hours 45 minutes drawn to scale. Log A: drive 2 hours, rest 15 minutes, drive 2 hours, rest 30 minutes; the test expects 4 hours 30 of driving left, the split break complete. Log B: drive 2 hours, rest 30 minutes, drive 2 hours, rest 15 minutes; the test expects 30 minutes left, because the 30 counted only as a first part and the 15 cannot be the second.</desc>
<text x="0" y="18" class="viz-title">The order of the split decides whether the clock resets</text>
<text x="0" y="36" class="viz-sub">Minutes to scale; driving in colour, rest in grey; both logs are 4 hours 45 minutes long</text>
<text x="40" y="66" class="viz-label">Log A: drive 2:00, rest 15, drive 2:00, rest 30</text>
<rect x="40" y="76" width="240" height="24" class="viz-f1"/>
<rect x="280" y="76" width="30" height="24" class="viz-fgray"/>
<rect x="310" y="76" width="240" height="24" class="viz-f1"/>
<rect x="550" y="76" width="60" height="24" class="viz-fgray"/>
<text x="160" y="92" text-anchor="middle" class="viz-onfill">drive 2:00</text>
<text x="430" y="92" text-anchor="middle" class="viz-onfill">drive 2:00</text>
<text x="295" y="114" text-anchor="middle" class="viz-tick">15</text>
<text x="580" y="114" text-anchor="middle" class="viz-tick">30</text>
<text x="40" y="136" class="viz-label-muted">Expected: 4:30 left. A 15 then a 30 is a qualifying break.</text>
<text x="40" y="172" class="viz-label">Log B: drive 2:00, rest 30, drive 2:00, rest 15</text>
<rect x="40" y="182" width="240" height="24" class="viz-f1"/>
<rect x="280" y="182" width="60" height="24" class="viz-fgray"/>
<rect x="340" y="182" width="240" height="24" class="viz-f1"/>
<rect x="580" y="182" width="30" height="24" class="viz-fgray"/>
<text x="160" y="198" text-anchor="middle" class="viz-onfill">drive 2:00</text>
<text x="460" y="198" text-anchor="middle" class="viz-onfill">drive 2:00</text>
<text x="310" y="220" text-anchor="middle" class="viz-tick">30</text>
<text x="595" y="220" text-anchor="middle" class="viz-tick">15</text>
<text x="40" y="242" class="viz-label-muted">Expected: 0:30 left. The 30 was a first part; the 15 is not a second.</text>
<line x1="40" y1="262" x2="610" y2="262" class="viz-axis"/>
<line x1="40" y1="258" x2="40" y2="266" class="viz-axis"/>
<line x1="160" y1="258" x2="160" y2="266" class="viz-axis"/>
<line x1="280" y1="258" x2="280" y2="266" class="viz-axis"/>
<line x1="400" y1="258" x2="400" y2="266" class="viz-axis"/>
<line x1="520" y1="258" x2="520" y2="266" class="viz-axis"/>
<text x="40" y="282" text-anchor="middle" class="viz-tick">0:00</text>
<text x="160" y="282" text-anchor="middle" class="viz-tick">1:00</text>
<text x="280" y="282" text-anchor="middle" class="viz-tick">2:00</text>
<text x="400" y="282" text-anchor="middle" class="viz-tick">3:00</text>
<text x="520" y="282" text-anchor="middle" class="viz-tick">4:00</text>
<text x="0" y="308" class="viz-label-muted">Two pixels per minute; the engine is evaluated one minute after each log ends.</text>
</svg>
<figcaption>Source: the scenarios and the expected values are the tests "15 then 30 resets the 4h30 clock" and "30 then 15 does not reset, and neither does other work" in app/src/test/kotlin/com/mohdshayan/dutyclock/core/BreakRulesTest.kt; the rule they encode is section 1.4 of the <a href="https://www.gov.uk/guidance/drivers-hours-goods-vehicles/1-assimilated-and-aetr-rules-on-drivers-hours">GOV.UK guide</a>, whose own diagrams draw the second drive at 2.5 hours; the tests shorten it to 2.</figcaption>
</figure>

The other files follow, as the repository stood on 12 October 2026: nine tests on weekly rest, compensation and the 56 and 90, six on daily driving and rest, ten on working time and the GB rules, thirteen edge cases, eleven from a review, five each for the planner and the records, three for the alert plan, 68 under core/, plus one smoke test outside it. Most are a scenario a driver could tap and a figure the regulator printed; others cover PDF text, backups, CSV and bad input.

## Advisory, and said so

The README says Dutyclock is advisory, not a tachograph, not an ELD and not a legal record, and the app repeats it at first run, in Settings, on the countdown notification and in the header of every PDF, which reads "Personal record. Not a tachograph record." The manifest declares four permissions, notifications, exact alarms, boot completion and vibration, and no network permission, so the app itself sends nothing. What leaves the phone is the PDF, CSV or backup the driver chooses to export or share, and whatever Android's own backup copies, since allowBackup is on with the default rules. The tachograph is the record the law recognises; the honest claim is that the arithmetic is right and the inputs are the driver's.

It is the shape I would use for any rule a regulator publishes with worked examples: a pure function over an append-only log, replayed rather than updated in place, the stricter reading as the default until the user elects otherwise, and the examples as golden tests. Then label the output for what it is. The code is [on GitHub](https://github.com/shayanmohd/dutyclock).
