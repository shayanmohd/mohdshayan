---
title: When the host leaves the table
date: 2025-01-08
summary: Host-authoritative multiplayer has one weakness: the match lives in one player's process. Per-player secrecy and host migration pull in opposite directions. Choose on purpose.
tags: Multiplayer, Photon, Netcode
draft: false
---

The design that makes Turup Chaal cheat-proof is the design that makes it fragile in one specific way. The match runs on exactly one phone, the host's, and every other player only ever sees a redacted view of it. That is the anti-cheat property, and I wrote about it in [the first post](/blog/the-hand-you-were-never-dealt/). It also means the match lives in one process, on one device, on one mobile connection, in one person's pocket, and that person can walk into a lift.

What happens next is a thought experiment I ran many times before settling the design, and the answer is less comfortable than the marketing for any networking library suggests.

## What the library gives you

Photon's room model has a master client, and its [documentation on master client and host migration](https://doc.photonengine.com/pun/current/gameplay/hostmigration) is unusually clear about what happens when that client disconnects: the server picks another actor in the room as the new master client, and it does not hand the new one any of the room state the old one held. No player properties are moved, no cached events are replayed, no events addressed to the old master are resent. The developer is responsible for making sure no state is lost across the switch. That is not a limitation of Photon; it is the honest statement of what a relay can know. The relay never had the state. The host did.

The same holds in Photon's lower-level [Realtime layer](https://doc.photonengine.com/realtime/current/gameplay/hostmigration), which PUN sits on: the server can tell you who the new master is, and nothing more. So a new master client is elected within a second or so, and it knows nothing about the match. The state has to come from somewhere, and the redaction rule has already decided where it cannot come from.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The host disconnects mid-hand</title>
<desc id="f1-d">Three lanes: the host, the Photon server, and the other three players. The host's connection drops. The server elects a new master client from the remaining players. The new master asks for the match state, but each remaining player holds only their own redacted snapshot. The full state, including the undealt cards and the other hands, existed only on the host.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Host, seat 1</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Photon server</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Seats 2, 3, 4</text>
<line x1="95" y1="48" x2="95" y2="120" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">trick 5 in progress, full state held here</text>
<line x1="100" y1="80" x2="312" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<circle cx="95" cy="120" r="6" class="viz-d4"/>
<text x="110" y="124" class="viz-label">connection lost</text>
<text x="432" y="154" text-anchor="middle" class="viz-label-muted">seat 2 is now master client</text>
<line x1="325" y1="160" x2="537" y2="160" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="432" y="194" text-anchor="middle" class="viz-label-muted">seat 2: who has the match state</text>
<line x1="540" y1="200" x2="328" y2="200" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="352" y="224" width="280" height="56" rx="8" class="viz-box-ink"/>
<text x="492" y="248" text-anchor="middle" class="viz-on-ink">nobody: each seat holds only</text>
<text x="492" y="266" text-anchor="middle" class="viz-on-ink">its own redacted snapshot</text>
</svg>
<figcaption>Illustrative: the sequence the <a href="https://doc.photonengine.com/pun/current/gameplay/hostmigration">Photon documentation</a> describes, applied to a match with per-player redaction.</figcaption>
</figure>

## The succession test

The usual answer to host migration is to have every client keep a copy of the state, so that whoever becomes host can continue from it. In a game without secrets that works. In a card game it is precisely the design the anti-cheat rule forbids: if every client holds the full state, every client holds every hand, and a modified client reads them off the wire. Redaction and migration want opposite things from the same bytes.

The test I ended up with makes the conflict explicit. For every piece of authoritative state, ask two questions: who else holds it, and were they allowed to see it. State that every client holds and may see, the table, the trick counts, whose turn it is, survives the host without any work. State that only the host may see, the other hands, the undealt deck, cannot survive the host, because the only copy that was allowed to exist just left. The design has to do one of three things with it: end the round, reveal it at the moment of migration, or move it somewhere that is not a phone.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Availability against secrecy for four multiplayer designs</title>
<desc id="f2-d">A two by two grid. Horizontal axis: secrecy from the other players, none on the left, full redaction on the right. Vertical axis: availability when the host drops, low at the bottom, high at the top. Bottom right: host-authoritative with redaction, the round ends. Top left: full-state broadcast, easy migration but no secrets. Top right: a dedicated server, both properties, at a cost. Bottom left: nothing worth building.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Full-state broadcast</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">anyone can host; anyone can peek</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">Dedicated server</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">both, for a monthly bill</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Nothing to build here</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">fragile and leaky</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Host with redaction</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">the round ends with the host</text>
<circle cx="464" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Secrecy from other players: none to full redaction</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Availability when the host drops: low to high</text>
</svg>
<figcaption>Illustrative: the placement Turup Chaal occupies, and the only cell that has both properties.</figcaption>
</figure>

## The three answers, honestly

Ending the round is the answer Turup Chaal gives, and it is the least satisfying and the most honest. When the host drops, the hand in progress cannot be reconstructed without revealing what the anti-cheat design was built to hide, so the hand is void, the score from completed tricks is kept where every client already agrees on it, and the next hand starts with a new host and a new deal. Players dislike it, and they dislike it less than they would dislike a game where hands leak.

Revealing at migration is the tempting compromise: at the moment the host drops, the remaining clients pool what they know, which is their own hands, and the undealt cards are the complement. The hand continues with a new host who now knows everything. The trouble is that "the host dropped" is an event any client can cause by disconnecting their own phone, so the compromise hands every player a button that reveals the table. The test catches it in one line: the state was not allowed to be seen, and now it is.

Moving the state off the phones is the real answer, and it costs money. A dedicated server holds the full state, deals, validates and redacts, and no phone ever holds more than its own view. The host cannot leave because the host is not a player. That is the top-right cell of the matrix, and it is a monthly bill for the life of the game, which for a free card game built by one person is the reason it is not the answer. It becomes the answer when the game earns enough to pay for it, and the code is already shaped for it, because the engine that runs on the host phone is the engine that would run on the server.

There is a fourth option that looks like an answer and is not: encrypt the full state and give every client a copy they cannot read, with the key held by the host, to be released to the successor at migration. The trouble is the release. If the host is gone, so is the key, unless it was escrowed somewhere, and the only somewhere available on phones is the other clients, which returns the problem to where it started. A key split among the remaining players so that any two can reconstruct it is a real construction, and it is also two players agreeing to see everyone's hands, which the game's rules forbid. The succession test catches this one too, one level down: the key is state only the host may hold.

## How often the host actually leaves

The choice between ending the round and paying for a server should be made with a number, and the number is how often a four-player match loses its host in the length of a round. If each player disconnects at some rate, the chance a match survives a twenty-minute round is the chance that all four stay, and the chance that the specific player who is host stays is one fourth of the story; the other three dropping merely costs a seat. I modelled it simply, with independent players and a per-player hourly disconnect rate, to see the shape.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Probability that all four players stay connected for a twenty-minute round</title>
<desc id="f3-d">A falling curve over per-player disconnect rates from 0.05 to 0.8 per hour: 94 percent at 0.05, 88 at 0.1, 77 at 0.2, 59 at 0.4 and 34 at 0.8. The host-only line, the chance the host alone stays, is higher: 98, 97, 94, 88 and 77.</desc>
<text x="0" y="18" class="viz-title">How many rounds finish with the host they started with</text>
<text x="0" y="36" class="viz-sub">Twenty-minute round, independent players, a stated model</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">host stays</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-sgray"/><text x="520" y="35" class="viz-label-muted">all four stay</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100%</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">75%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">50%</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">25%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">0.05</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">0.1</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">0.2</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">0.4</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">0.8</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Disconnects per player per hour (spacing is categorical)</text>
<polyline points="56,69.3 192,82 328,104.7 464,142.1 600,193.3" class="viz-sgray"/>
<polyline points="56,59.4 192,62.8 328,69.4 464,82 600,104.7" class="viz-s1"/>
<circle cx="600" cy="104.7" r="4" class="viz-d1"/>
<circle cx="600" cy="193.3" r="4" class="viz-dgray"/>
<text x="592" y="98" text-anchor="end" class="viz-value">77%</text>
<text x="592" y="212" text-anchor="end" class="viz-value">34%</text>
</svg>
<figcaption>Illustrative: computed as the probability that a player with a constant hourly disconnect rate stays connected for one third of an hour, raised to the first power for the host alone and the fourth for all four seats; the rates are inputs, not measurements.</figcaption>
</figure>

The curve says what the decision depends on. On good connections, a host drop is a few percent of rounds, and voiding the hand is a small annoyance that a server would cost a great deal to remove. On poor connections, where a player drops every couple of hours, a fifth of rounds lose their host and the annoyance is the game. The same design is right for one population and wrong for the other, which is why the number has to be measured on the players you actually have rather than assumed.

## The rule

Write down, for every piece of authoritative state, who else holds it and whether they may. The state only the host may see is the state that dies with the host, and there is no clever protocol that keeps both the secret and the availability on phones alone. Choose the cell of the matrix on purpose, tell the players what happens when the host leaves, and measure how often it happens. Turup Chaal ends the hand. It says so, and a game that says so is more trustworthy than one that quietly reveals the table to whoever pulls the plug.
