---
title: Counting people out is the hard part
date: 2025-03-27
summary: Gateless entry gives a perfect entry count and no exit count, so live occupancy is an estimate that drifts up all day. Show the drift, and let it decide when to count exits.
tags: Ticketing, Analytics, Queueing
draft: false
---

A QR ticket scanned at the gate is a perfect record of one thing: a person came in, at this time, on this ticket. It records nothing about when they left, because nobody scans out. So the number every venue wants from a scan-in system, how many people are inside right now, is not a count. It is an estimate, built from a count of arrivals and an assumption about how long people stay, and it drifts upward all day, because every arrival is certain and every departure is a guess. The honest dashboard does not hide that. It shows the estimate with its drift, resets it at close, and uses the size of the drift to decide when counting exits becomes worth the door.

## The scale of the problem

Arrival counts at real venues are large enough that the drift matters. The Association of Leading Visitor Attractions publishes [annual visitor figures](https://www.alva.org.uk/details.cfm?p=423) for its members: in 2025 the Natural History Museum recorded 7,116,929 visits, the British Museum 6,440,120, Tate Modern 4,514,266 and the Science Museum 2,640,417. Spread over opening days, the largest of those is on the order of twenty thousand arrivals a day, and a museum that wants to hold a gallery under a safe occupancy needs to know how many of the morning's arrivals are still in the building at two in the afternoon, which no scan at the door can say.

<figure class="chart">
<svg viewBox="0 0 640 420" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Visits in 2025 to the ten most visited ALVA member attractions</title>
<desc id="f1-d">Horizontal bars in millions of visits: Natural History Museum 7.12, British Museum 6.44, Windsor Great Park 4.98, Tate Modern 4.51, National Gallery 4.15, Southbank Centre 3.42, V and A South Kensington 3.33, Somerset House 2.90, Tower of London 2.82, Science Museum 2.64.</desc>
<text x="0" y="18" class="viz-title">Tens of thousands of arrivals a day, and no record of departures</text>
<text x="0" y="36" class="viz-sub">Visits in 2025, millions, ten most visited ALVA member attractions</text>
<line x1="196" y1="52" x2="196" y2="392" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">Natural History Museum</text>
<path d="M196 58 H596 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="592" y="53" text-anchor="end" class="viz-value">7.12</text>
<text x="186" y="107" text-anchor="end" class="viz-label">British Museum</text>
<path d="M196 92 H558 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="554" y="87" text-anchor="end" class="viz-value">6.44</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Windsor Great Park</text>
<path d="M196 126 H476 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="496" y="141" class="viz-value">4.98</text>
<text x="186" y="175" text-anchor="end" class="viz-label">Tate Modern</text>
<path d="M196 160 H450 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="470" y="175" class="viz-value">4.51</text>
<text x="186" y="209" text-anchor="end" class="viz-label">National Gallery</text>
<path d="M196 194 H429 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="449" y="209" class="viz-value">4.15</text>
<text x="186" y="243" text-anchor="end" class="viz-label">Southbank Centre</text>
<path d="M196 228 H388 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="408" y="243" class="viz-value">3.42</text>
<text x="186" y="277" text-anchor="end" class="viz-label">V&amp;A South Kensington</text>
<path d="M196 262 H383 a4 4 0 0 1 4 4 V278 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="403" y="277" class="viz-value">3.33</text>
<text x="186" y="311" text-anchor="end" class="viz-label">Somerset House</text>
<path d="M196 296 H359 a4 4 0 0 1 4 4 V312 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="379" y="311" class="viz-value">2.90</text>
<text x="186" y="345" text-anchor="end" class="viz-label">Tower of London</text>
<path d="M196 330 H354 a4 4 0 0 1 4 4 V346 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="374" y="345" class="viz-value">2.82</text>
<text x="186" y="379" text-anchor="end" class="viz-label">Science Museum</text>
<path d="M196 364 H344 a4 4 0 0 1 4 4 V380 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/><text x="364" y="379" class="viz-value">2.64</text>
<text x="0" y="412" class="viz-label-muted">Fifty-six pixels per million visits.</text>
</svg>
<figcaption>Source: <a href="https://www.alva.org.uk/details.cfm?p=423">ALVA visitor figures</a> for 2025; the Windsor figure is for the Crown Estate's Great Park.</figcaption>
</figure>

## Little's law, pointed the right way

The tool for turning arrivals into occupancy is [Little's law](https://en.wikipedia.org/wiki/Little%27s_law), which says that in any stable system the average number inside equals the average arrival rate times the average time spent inside. For a venue, occupancy equals arrivals per hour times the average dwell time in hours. If people arrive at two thousand an hour and stay two hours on average, there are about four thousand inside. The arrival rate is measured exactly by the scans. The dwell time is not measured at all; it is assumed, from surveys, from past exit counts, or from a guess, and the occupancy estimate inherits that assumption whole.

What makes the estimate usable rather than dangerous is that its error has a known direction. If the dwell assumption is too long, the estimate is too high, and a venue that acts on it holds people at the door earlier than it needs to, which costs revenue and goodwill. If the assumption is too short, the estimate is too low, and the venue admits people into a space that is fuller than it thinks, which is the failure that safety limits exist to prevent. So the assumption is set long, deliberately, and the estimate is a figure that is wrong in a predictable direction. That is better than a count that is wrong in an unknown one, and it is the standard a dashboard can be honest about.

## The exit deficit

The number that expresses the honesty is what I call the exit deficit: at any moment, the gap between scanned entries and inferred exits. It is the error bar on the occupancy figure. Early in the day it is small, because few people have been inside long enough for the dwell assumption to matter. By mid-afternoon it is large, because the estimate of who has left is entirely a product of the assumption and the assumption has been compounding since opening. The dashboard shows the occupancy estimate and the deficit side by side, and resets both at close, when the building is empty and the count is known.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One day of scanned entries, modelled exits and the resulting occupancy estimate, with the exit deficit shaded</title>
<desc id="f2-d">Lines over a day from opening to close. Cumulative scanned entries rise steadily and flatten toward close. Modelled cumulative exits, from an assumed dwell distribution, rise with a lag. The occupancy estimate is the gap between them, peaking in the early afternoon. A shaded band around the occupancy line widens through the day and is labelled the exit deficit, the uncertainty from the unmeasured dwell time.</desc>
<text x="0" y="18" class="viz-title">Entries are certain; the gap is a guess that grows</text>
<text x="0" y="36" class="viz-sub">Cumulative people in a day; an assumed dwell distribution</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">scanned entries</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">modelled exits</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/>
<line x1="56" y1="126" x2="600" y2="126" class="viz-grid"/>
<line x1="56" y1="196" x2="600" y2="196" class="viz-grid"/>
<line x1="56" y1="266" x2="600" y2="266" class="viz-axis"/>
<text x="56" y="290" text-anchor="middle" class="viz-tick">open</text>
<text x="328" y="290" text-anchor="middle" class="viz-tick">midday</text>
<text x="600" y="290" text-anchor="middle" class="viz-tick">close</text>
<path d="M56 266 L140 236 L220 186 L300 126 L380 86 L460 66 L540 60 L600 58 L600 58 L540 70 L460 84 L380 112 L300 158 L220 214 L140 250 L56 266 Z" class="viz-band"/>
<polyline points="56,266 140,236 220,186 300,126 380,86 460,66 540,60 600,58" class="viz-s1"/>
<polyline points="56,266 140,264 220,246 300,206 380,156 460,110 540,78 600,60" class="viz-s2"/>
<text x="60" y="70" class="viz-label-muted">occupancy estimate: the gap</text>
<text x="60" y="88" class="viz-tick">shaded: the exit deficit, widening</text>
<text x="328" y="318" text-anchor="middle" class="viz-label-muted">At close the building is empty, the lines meet, and the day's estimate can be checked.</text>
</svg>
<figcaption>Illustrative: the shape produced by steady arrivals and an assumed dwell distribution; the curves are constructed, not measured at any venue.</figcaption>
</figure>

The reset at close is not a formality. It is the one moment in the day when the estimate can be checked: the building is empty, so the true exits equal the day's entries, and the model's cumulative exits can be compared against them. A model that predicted the building would be empty an hour before close was assuming dwell times too short; one that still predicted people inside at close was assuming too long. That comparison, done daily, is how the dwell assumption gets calibrated without ever installing an exit counter, and it is why the dashboard's error bar narrows over weeks even though the data it runs on does not change.

The dwell assumption itself deserves to be a distribution rather than a number, because visitors do not all stay the same time. A school group stays ninety minutes and leaves together; a tourist stays three hours; a member drops in for twenty minutes. Little's law works with the average, but the deficit is better computed from the spread, since a wide spread means the modelled exits are uncertain even when their average is right. In practice the model I use assumes a distribution shaped by past sampled counts where they exist and by the venue's own judgement where they do not, and the deficit is the range of occupancy figures the plausible dwell distributions produce, not a single subtraction.

## When to start counting exits

The deficit is also the trigger for the next investment. A venue has a tolerance: the amount of uncertainty in the occupancy figure it can live with, set by how close it runs to its safe limit. While the deficit stays inside that tolerance, entry-only counting is enough and the exit door stays unstaffed. When the deficit exceeds it, regularly, at the times that matter, the venue needs measured exits, and the cheapest version is not a scanner on every exit. It is a sampled count at one door, a person or a sensor counting departures through the busiest exit for an hour at a time, which measures the actual dwell distribution and replaces the assumption with data for that day.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Three counting architectures and the data each produces</title>
<desc id="f3-d">Three columns. Entry only: scan at the gate; produces exact arrivals, occupancy as an estimate with an exit deficit. Entry plus sampled exit: scan at the gate plus a sampled count at one exit; produces exact arrivals and a measured dwell distribution, occupancy as an estimate with a small deficit. Entry plus exit: scan in and scan out at every door; produces exact occupancy but requires every exit to be gated. The middle column is highlighted as the usual right answer.</desc>
<text x="0" y="18" class="viz-title">What each architecture can honestly show</text>
<rect x="8" y="40" width="200" height="200" rx="8" class="viz-box"/>
<text x="108" y="66" text-anchor="middle" class="viz-label">Entry only</text>
<text x="108" y="90" text-anchor="middle" class="viz-label-muted">scan at the gate</text>
<text x="108" y="120" text-anchor="middle" class="viz-label-muted">arrivals: exact</text>
<text x="108" y="140" text-anchor="middle" class="viz-label-muted">dwell: assumed</text>
<text x="108" y="160" text-anchor="middle" class="viz-label-muted">occupancy: estimate</text>
<text x="108" y="180" text-anchor="middle" class="viz-label-muted">deficit: grows all day</text>
<text x="108" y="220" text-anchor="middle" class="viz-tick">no extra doors</text>
<rect x="220" y="40" width="200" height="200" rx="8" class="viz-box-accent"/>
<text x="320" y="66" text-anchor="middle" class="viz-label">Entry plus sampled exit</text>
<text x="320" y="90" text-anchor="middle" class="viz-label-muted">gate scan, one exit counted</text>
<text x="320" y="120" text-anchor="middle" class="viz-label-muted">arrivals: exact</text>
<text x="320" y="140" text-anchor="middle" class="viz-label-muted">dwell: measured today</text>
<text x="320" y="160" text-anchor="middle" class="viz-label-muted">occupancy: estimate</text>
<text x="320" y="180" text-anchor="middle" class="viz-label-muted">deficit: small, bounded</text>
<text x="320" y="220" text-anchor="middle" class="viz-tick">one door, part of the day</text>
<rect x="432" y="40" width="200" height="200" rx="8" class="viz-box"/>
<text x="532" y="66" text-anchor="middle" class="viz-label">Entry plus exit</text>
<text x="532" y="90" text-anchor="middle" class="viz-label-muted">scan in and out everywhere</text>
<text x="532" y="120" text-anchor="middle" class="viz-label-muted">arrivals: exact</text>
<text x="532" y="140" text-anchor="middle" class="viz-label-muted">departures: exact</text>
<text x="532" y="160" text-anchor="middle" class="viz-label-muted">occupancy: a count</text>
<text x="532" y="180" text-anchor="middle" class="viz-label-muted">deficit: zero, if no door leaks</text>
<text x="532" y="220" text-anchor="middle" class="viz-tick">every exit gated</text>
<text x="320" y="276" text-anchor="middle" class="viz-label-muted">The deficit decides which column a venue needs; most never need the third.</text>
</svg>
<figcaption>Illustrative: the three architectures and their outputs, as the design reasons about them.</figcaption>
</figure>

The third architecture, scanning out at every door, is the one venues imagine they want and almost never need. It produces a true count only if every exit is gated, which for a museum with fire doors and a garden and a cafe is not a property the building has, and a single ungated door turns the count back into an estimate with an error that nobody is tracking. The sampled exit is honest about being a sample, and it costs one person for one hour rather than a turnstile on every door.

## What the dashboard says

The live visitor view in the ticketing system I built counts scan-ins at the gate, and the design decisions above are how the occupancy figure on that view is meant to be read. It is labelled as an estimate. It carries the deficit beside it. It resets at close, and the close-of-day comparison feeds the next day's dwell assumption. When the deficit crosses the venue's tolerance, the view says so, and the recommended response is a sampled exit count rather than a change to the software. A number with its error bar is a number an operations manager can act on. A number without one is a number they will either over-trust or ignore, and neither is what the gate was scanning for.
