---
title: One shared hour with Canada is enough
date: 2026-08-24
summary: From New Delhi, Kuala Lumpur overlaps my working day by six and a half hours and Dubai by seven and a half. Toronto and Vancouver overlap it by zero; the shared hour is made.
tags: Remote Work, Contract Work, Time Zones
draft: false
---

I work from New Delhi with clients in Malaysia, Canada and the United Arab Emirates, and the honest arithmetic of that arrangement is not what the phrase "different time zones" suggests. Kuala Lumpur and Dubai are easy: their working days overlap mine for most of the day. Canada is not a smaller overlap. It is none. A nine-to-six day in Delhi and a nine-to-six day in Toronto or Vancouver share zero hours, in summer and in winter, and the shared hour with Canada does not exist until someone builds it out of their evening or their early morning. It has been enough, and the reason is that the list of things which genuinely need both sides awake is short, and I keep it written down.

## The arithmetic

The overlaps are a computation on the [IANA time zone database](https://www.iana.org/time-zones), which any language exposes; I used Python's [zoneinfo](https://docs.python.org/3/library/zoneinfo.html) module, and it is worth doing exactly rather than by feel, because the daylight-saving shifts move the answer by an hour in each direction twice a year. Delhi is at UTC plus five and a half all year. Kuala Lumpur is at UTC plus eight, Dubai at plus four, Toronto at minus five in winter and minus four in summer, Vancouver at minus eight and minus seven. Take a nine-to-six day in every city, on the same calendar date, and count the hours in which both are inside their day.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Hours of overlap between a nine-to-six day in New Delhi and the same day in four cities, summer and winter</title>
<desc id="f1-d">Horizontal bars in hours. Kuala Lumpur: 6.5 in both seasons. Dubai: 7.5 in both. Toronto: 0 in both. Vancouver: 0 in both. A second set of bars shows the Delhi day stretched to eight in the evening: Kuala Lumpur 6.5, Dubai 9, Toronto 1.5 in summer and 0.5 in winter, Vancouver 0 in both.</desc>
<text x="0" y="18" class="viz-title">Two clients share most of my day; two share none of it</text>
<text x="0" y="36" class="viz-sub">Hours when both cities are inside a working day, two Delhi days</text>
<rect x="380" y="26" width="12" height="12" rx="3" class="viz-f1"/><text x="398" y="37" class="viz-label-muted">09:00 to 18:00</text>
<rect x="510" y="26" width="12" height="12" rx="3" class="viz-f2"/><text x="528" y="37" class="viz-label-muted">to 20:00</text>
<line x1="176" y1="52" x2="176" y2="290" class="viz-axis"/>
<text x="166" y="75" text-anchor="end" class="viz-label">Kuala Lumpur</text>
<path d="M176 60 H436 a4 4 0 0 1 4 4 V72 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="450" y="72" class="viz-value">6.5</text>
<path d="M176 80 H436 a4 4 0 0 1 4 4 V92 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="450" y="92" class="viz-value">6.5</text>
<text x="166" y="133" text-anchor="end" class="viz-label">Dubai</text>
<path d="M176 118 H476 a4 4 0 0 1 4 4 V130 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/><text x="490" y="130" class="viz-value">7.5</text>
<path d="M176 138 H536 a4 4 0 0 1 4 4 V150 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="550" y="150" class="viz-value">9.0</text>
<text x="166" y="191" text-anchor="end" class="viz-label">Toronto</text>
<rect x="176" y="176" width="3" height="12" class="viz-f1"/><text x="190" y="188" class="viz-value">0, summer and winter</text>
<path d="M176 196 H236 a4 4 0 0 1 4 4 V208 a4 4 0 0 1 -4 4 H176 Z" class="viz-f2"/><text x="250" y="208" class="viz-value">1.5 summer, 0.5 winter</text>
<text x="166" y="249" text-anchor="end" class="viz-label">Vancouver</text>
<rect x="176" y="234" width="3" height="12" class="viz-f1"/><text x="190" y="246" class="viz-value">0, summer and winter</text>
<rect x="176" y="254" width="3" height="12" class="viz-f2"/><text x="190" y="266" class="viz-value">0 even to 20:00</text>
<text x="0" y="316" class="viz-label-muted">Forty pixels per hour; the stretch buys ninety minutes with Toronto in summer.</text>
</svg>
<figcaption>Source: computed by the author from the <a href="https://www.iana.org/time-zones">IANA time zone database</a> offsets for 15 July and 15 January 2026, with a 09:00 to 18:00 day in each city.</figcaption>
</figure>

The numbers are stark. Kuala Lumpur, two and a half hours ahead, shares six and a half hours of my day. Dubai, an hour and a half behind, shares seven and a half. Toronto, nine and a half or ten and a half hours behind depending on the season, shares nothing: their nine in the morning is my half past six or half past seven in the evening, and their six in the evening is my early morning. Vancouver, three hours further west, is worse in the same direction.

Stretching my day to eight in the evening buys an hour and a half with Toronto in summer and half an hour in winter, and nothing with Vancouver at all. The shared hour with Canada is not found on the clock. It is made, by one side extending its day into an evening or a dawn.

## Where the hour comes from

The ring below is how I picture it. Twenty-four hours around the circle, four working windows drawn on it, and the Canadian windows sitting on the opposite side from mine. The hour we share is a wedge that belongs to nobody's working day: my evening, their morning, or my early morning, their late afternoon, and which one it is gets decided per client and then does not move. For Toronto it is my seven to eight in the evening, their half past nine to half past ten in the morning in summer. For Vancouver it has to be my early morning, because their afternoon is my night.

<figure class="chart">
<svg viewBox="0 0 640 392" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A twenty-four-hour ring showing the five working windows in Delhi time and the manufactured shared hour</title>
<desc id="f2-d">Five concentric arcs on a ring representing twenty-four hours in New Delhi time, midnight at the top. Outer to inner: Delhi from nine to eighteen; Kuala Lumpur from six thirty to fifteen thirty; Dubai from ten thirty to nineteen thirty; Toronto in summer from eighteen thirty to three thirty the next morning; Vancouver from twenty-one thirty to six thirty. A shaded wedge from nineteen to twenty marks the manufactured shared hour with Toronto, inside Toronto's morning and outside the Delhi day.</desc>
<text x="0" y="18" class="viz-title">The shared hour lives in nobody's working day</text>
<text x="0" y="36" class="viz-sub">Each city's 09:00 to 18:00 day drawn in Delhi time on a 24-hour ring, summer offsets</text>
<path d="M 198.3 157.4 A 126 126 0 0 1 210.9 127.0 L 276.7 165.0 A 50 50 0 0 0 271.7 177.1 Z" class="viz-band"/>
<circle cx="320" cy="190" r="120" fill="none" class="viz-grid"/>
<path d="M 404.9 274.9 A 120 120 0 0 1 200.0 190.0" fill="none" class="viz-s1"/>
<circle cx="320" cy="190" r="104" fill="none" class="viz-grid"/>
<path d="M 423.1 203.6 A 104 104 0 0 1 237.5 253.3" fill="none" class="viz-s2"/>
<circle cx="320" cy="190" r="88" fill="none" class="viz-grid"/>
<path d="M 353.7 271.3 A 88 88 0 0 1 238.7 156.3" fill="none" class="viz-s3"/>
<circle cx="320" cy="190" r="72" fill="none" class="viz-grid"/>
<path d="M 248.6 180.6 A 72 72 0 0 1 377.1 146.2" fill="none" class="viz-s4"/>
<circle cx="320" cy="190" r="56" fill="none" class="viz-grid"/>
<path d="M 285.9 145.6 A 56 56 0 0 1 375.5 197.3" fill="none" class="viz-sgray"/>
<text x="320" y="56" text-anchor="middle" class="viz-tick">00:00</text>
<text x="466" y="194" text-anchor="middle" class="viz-tick">06:00</text>
<text x="320" y="338" text-anchor="middle" class="viz-tick">12:00</text>
<text x="174" y="194" text-anchor="middle" class="viz-tick">18:00</text>
<text x="8" y="120" class="viz-value">the shared hour:</text>
<text x="8" y="140" class="viz-value">19:00 to 20:00 Delhi</text>
<line x1="150" y1="132" x2="196" y2="150" class="viz-sgray"/>
<line x1="8" y1="352" x2="22" y2="352" class="viz-s1"/><text x="28" y="356" class="viz-label-muted">Delhi</text>
<line x1="88.5" y1="352" x2="102.5" y2="352" class="viz-s2"/><text x="108.5" y="356" class="viz-label-muted">Kuala Lumpur</text>
<line x1="220.1" y1="352" x2="234.1" y2="352" class="viz-s3"/><text x="240.1" y="356" class="viz-label-muted">Dubai</text>
<line x1="300.6" y1="352" x2="314.6" y2="352" class="viz-s4"/><text x="320.6" y="356" class="viz-label-muted">Toronto</text>
<line x1="395.70000000000005" y1="352" x2="409.70000000000005" y2="352" class="viz-sgray"/><text x="415.70000000000005" y="356" class="viz-label-muted">Vancouver</text>
<rect x="505" y="346" width="12" height="12" rx="3" class="viz-band"/><text x="523" y="356" class="viz-label-muted">the shared hour</text>
<text x="320" y="382" text-anchor="middle" class="viz-label-muted">Outer ring is Delhi; each ring inward is a client, its day converted to Delhi time.</text>
</svg>
<figcaption>Illustrative: the five working days drawn in Delhi time for a summer date, computed from the IANA offsets; the wedge is the hour I keep for Toronto.</figcaption>
</figure>

The hour costs something, which is why it has to be defended. An hour every day in my evening is an hour that is not mine, and an hour in a client's dawn is one they resent if it is spent on anything that could have been an email. So the question of what is allowed into the hour is the whole discipline, and the answer is a ledger.

## The overlap ledger

The overlap ledger is the written list of activities that genuinely need both parties awake at the same time. Mine has three entries. Decisions with money attached: a scope change, a price, a go or no-go, anything where a misunderstanding costs more than the hour. Demos: showing working software to the people who will use it, because a recorded demo answers the questions you thought of and a live one answers theirs. And incidents: when something is broken in production, the hour is whenever it is needed, and it is the one entry that overrides the schedule.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The overlap ledger: what goes in the shared hour and what stays asynchronous</title>
<desc id="f3-d">A two-column table. In the shared hour: decisions with money attached, demos of working software, incidents. Asynchronous with a twenty-four-hour reply window: status updates, code review, design feedback, questions with a written answer, scheduling itself. A rule beneath: adding to the left column requires removing something.</desc>
<text x="0" y="18" class="viz-title">Three things need both sides awake. Everything else waits a day.</text>
<rect x="8" y="44" width="300" height="200" rx="8" class="viz-box-accent"/>
<text x="158" y="70" text-anchor="middle" class="viz-label">In the shared hour</text>
<text x="24" y="104" class="viz-label-muted">decisions with money attached</text>
<text x="24" y="130" class="viz-label-muted">demos of working software</text>
<text x="24" y="156" class="viz-label-muted">incidents, at whatever hour</text>
<text x="24" y="200" class="viz-tick">three entries; a fourth removes one</text>
<rect x="332" y="44" width="300" height="200" rx="8" class="viz-box"/>
<text x="482" y="70" text-anchor="middle" class="viz-label">Asynchronous, 24-hour reply</text>
<text x="348" y="104" class="viz-label-muted">status updates and progress</text>
<text x="348" y="130" class="viz-label-muted">code review and design feedback</text>
<text x="348" y="156" class="viz-label-muted">any question with a written answer</text>
<text x="348" y="182" class="viz-label-muted">scheduling the shared hour itself</text>
<text x="348" y="222" class="viz-tick">written to be answered once</text>
<text x="320" y="280" text-anchor="middle" class="viz-label-muted">The left column is capped by rule, because the hour is paid for out of someone's evening.</text>
</svg>
<figcaption>Illustrative: the ledger as I keep it; the entries are the general categories, and clients see the same list.</figcaption>
</figure>

Everything not on the ledger defaults to asynchronous with a twenty-four-hour reply window, which is a promise rather than a limit: a message sent at any hour gets a considered answer within a day, written well enough that it does not need a follow-up. That covers status, review, design feedback, questions, and the scheduling of the shared hour itself, which is negotiated in writing so that the hour is spent on the ledger and not on deciding when to meet. The ledger's last rule is the one that keeps it short: adding an entry requires removing one. A client who wants a weekly planning call in the hour has to say which of the three it replaces, and the conversation that follows usually ends with the planning done in writing and the hour left for what it was for.

## What the hour looks like in practice

The hour has a shape that the ledger dictates. It starts with whatever is on the ledger that week, which is often nothing, in which case the hour is cancelled in writing the day before and both sides get it back. When there is a decision, the material for it was sent at least a day ahead, in a form that states the options and a recommendation, so that the hour is spent choosing rather than explaining. When there is a demo, the software is deployed to a place the client can open before the call, so that the hour is spent on their questions rather than on screen sharing. And an incident, the third entry, is the one case where the hour is whenever it is needed and the ledger's other rules are suspended; it is also, by the nature of the work, rare.

The manufactured hour also needs an owner for its inconvenience, and the fair answer is that it alternates. A standing arrangement where the Canadian side is always up at dawn, or where I am always working at nine at night, decays into resentment within a quarter. The ledger records whose evening or morning the hour is taken from, and the cost moves back and forth. The written-answer discipline is what makes that affordable: because almost everything is asynchronous, the hour is needed perhaps once a week, and once a week in an evening is a price nobody minds paying for a client on the other side of the planet.

## Why zero is easier than three

A counterintuitive thing about the arithmetic is that Canada's zero overlap has been easier to work with than a small overlap would be. When two working days share three hours, both sides assume those three hours are for meetings, the meetings fill them, and the asynchronous discipline never develops because it never has to. When they share nothing, the discipline is forced from the first week: every message is written to be answered once, every decision is prepared before the hour so the hour can decide it, and the hour is spent on the three things that need it. Kuala Lumpur and Dubai, with their generous overlaps, are where I have to apply the ledger deliberately, because the clock lets a working relationship drift into calls. Canada applied it for me.

The ledger has held for the same reason the arithmetic is stark. The number of things that need two people awake at the same moment is small, it is smaller than most schedules admit, and writing it down is how you find that out. One shared hour with Canada has been enough. Most days it has not been needed at all.
