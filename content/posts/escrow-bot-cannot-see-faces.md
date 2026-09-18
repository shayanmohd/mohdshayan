---
title: An escrow bot that cannot see faces
date: 2026-09-01
summary: Anonymity in a mediated trade is not a property of the transport. It is a property of one table, the map from a relayed message to its sender, and every feature is judged by it.
tags: Telegram, Privacy, System Design
draft: false
---

ShreezyPay Bot mediates trades between two Telegram groups that must not learn who is in the other. Each side talks to the bot, the bot relays what needs relaying, and if the trade goes wrong the bot holds enough to settle a dispute. The property that makes it work is not encryption, which Telegram supplies to everyone, and it is not the relay itself. It is the size of one table: the mapping from a relayed message back to the person who sent it. Anonymity between two parties in a mediated trade is a property of that table, its contents, its lifetime and its distance from everything else the bot stores, and every other feature in the bot exists to stop the two parties from leaking the mapping themselves.

## The unmask table

I call it the unmask table because that is what its disclosure would do: unmask a pair. The bot needs some version of it, because a reply from one side has to reach the right thread on the other, and a dispute has to be attributable to a party. The design question is how little the table can hold while still doing those two jobs, and the answer is much less than the obvious implementation stores.

The obvious implementation maps Telegram user identifiers and usernames to trades. The minimal one maps a thread identifier in one group to an opaque pair identifier, and the pair identifier to a thread identifier in the other group. No usernames, no user identifiers, no display names. When a message update arrives from the [Bot API](https://core.telegram.org/bots/api) for a thread, the bot looks up the pair, finds the mirror thread, rewrites the message with the sender stripped and the thread identifier swapped, and sends it. The bot never needs to know who a person is, only which thread they are in, and a thread is not a person.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Two groups, the bot and the unmask table: a reply crossing with identity stripped and the thread id rewritten</title>
<desc id="f1-d">Left, group A with a thread; right, group B with a thread; the bot in the middle holds a small table mapping thread A to pair P and pair P to thread B. A message from a member of group A enters its thread with a sender and text; the bot looks up the pair, strips the sender, rewrites the thread reference to B's thread, and posts only the text in group B. The escrow state is drawn as a separate store the table does not touch.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">What crosses, and what stays behind</text>
<rect x="8" y="60" width="150" height="110" rx="8" class="viz-box"/>
<text x="83" y="84" text-anchor="middle" class="viz-label">Group A</text>
<text x="83" y="106" text-anchor="middle" class="viz-label-muted">thread 4127</text>
<text x="83" y="128" text-anchor="middle" class="viz-label-muted">sender: a member</text>
<text x="83" y="150" text-anchor="middle" class="viz-label-muted">text: "sent, check"</text>
<line x1="160" y1="115" x2="236" y2="115" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="240" y="50" width="160" height="130" rx="8" class="viz-box-accent"/>
<text x="320" y="74" text-anchor="middle" class="viz-label">The bot</text>
<text x="320" y="98" text-anchor="middle" class="viz-tick">UNMASK TABLE</text>
<text x="320" y="118" text-anchor="middle" class="viz-label-muted">A:4127 to pair P9</text>
<text x="320" y="136" text-anchor="middle" class="viz-label-muted">pair P9 to B:588</text>
<text x="320" y="164" text-anchor="middle" class="viz-tick">no names, no user ids</text>
<line x1="402" y1="115" x2="478" y2="115" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="482" y="60" width="150" height="110" rx="8" class="viz-box"/>
<text x="557" y="84" text-anchor="middle" class="viz-label">Group B</text>
<text x="557" y="106" text-anchor="middle" class="viz-label-muted">thread 588</text>
<text x="557" y="128" text-anchor="middle" class="viz-label-muted">sender: the bot</text>
<text x="557" y="150" text-anchor="middle" class="viz-label-muted">text: "sent, check"</text>
<rect x="240" y="210" width="160" height="60" rx="8" class="viz-box-ink"/>
<text x="320" y="234" text-anchor="middle" class="viz-on-ink">Escrow state</text>
<text x="320" y="254" text-anchor="middle" class="viz-on-ink">pair P9: amount, status</text>
<text x="320" y="300" text-anchor="middle" class="viz-label-muted">The escrow store knows the pair and the money, never a thread, so it unmasks nobody.</text>
</svg>
<figcaption>Illustrative: the relay path and the two stores as designed; the identifiers are invented.</figcaption>
</figure>

The bot still has to enforce the send permissions, which means checking who sent a message, and that check reads the sender's identifier from the update, compares it against the thread's allow list, and drops it; the identifier is never written to disk and never crosses. Three properties follow, and each is a design constraint rather than a hope. The table is small, holding two thread identifiers and one pair identifier per active trade, and nothing about people. The table is short-lived, created when a pair is opened and deleted when the trade settles, so that a dispute a month later cannot be traced to a thread that no longer maps to anything. And the table is separate from the escrow state, which knows the pair identifier, the amount and the status, and never a thread identifier, so that the store a dispute actually needs cannot by itself connect a party to a group.

## Everything else is leak prevention

Once the bot's own table is minimal, the remaining way for a pair to be unmasked is the parties doing it themselves, and the rest of the bot's features exist for that. Per-user send permissions decide who in a group may post into a relayed thread at all, because a member who was never meant to speak to the other side is the likeliest source of an unguarded message. Keyword filtering scans outgoing relayed text for the things that leak identity, handles, phone numbers, invite links, the name of the group, and blocks or masks them before they cross. Reply-thread sync keeps replies attached to the right relayed message on both sides, which sounds like a convenience and is a privacy feature, because a reply that lands in the wrong thread quotes text from a different trade to a party who should never have seen it.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">What the bot must know, may cache and must never store, per message field</title>
<desc id="f2-d">A matrix with message fields as rows and three columns. Thread id: must know, kept only while the trade is open. Pair id: must know, kept with the escrow state. Message text: may cache briefly for reply sync, never stored beyond the relay. Sender user id: must never store; it is read to check send permission and discarded. Sender username and display name: must never store or relay. Group name and invite links: must never relay, filtered out. Amount and status: must know, in the escrow store only.</desc>
<text x="0" y="18" class="viz-title">Every field sorted by what would unmask a pair</text>
<text x="20" y="48" class="viz-tick">FIELD</text>
<text x="240" y="48" class="viz-tick">TREATMENT</text>
<text x="420" y="48" class="viz-tick">WHY</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Thread id</text><text x="240" y="82" class="viz-value">must know, until settled</text><text x="420" y="82" class="viz-label-muted">routes the reply</text>
<line x1="0" y1="94" x2="640" y2="94" class="viz-grid"/>
<text x="20" y="120" class="viz-label">Pair id</text><text x="240" y="120" class="viz-value">must know</text><text x="420" y="120" class="viz-label-muted">the only key escrow sees</text>
<line x1="0" y1="132" x2="640" y2="132" class="viz-grid"/>
<text x="20" y="158" class="viz-label">Message text</text><text x="240" y="158" class="viz-value">may cache, briefly</text><text x="420" y="158" class="viz-label-muted">reply sync, then gone</text>
<line x1="0" y1="170" x2="640" y2="170" class="viz-grid"/>
<text x="20" y="196" class="viz-label">Sender user id</text><text x="240" y="196" class="viz-value">read, never stored</text><text x="420" y="196" class="viz-label-muted">checks permission, discarded</text>
<line x1="0" y1="208" x2="640" y2="208" class="viz-grid"/>
<text x="20" y="234" class="viz-label">Username, display name</text><text x="240" y="234" class="viz-value">never stored or relayed</text><text x="420" y="234" class="viz-label-muted">would unmask on sight</text>
<line x1="0" y1="246" x2="640" y2="246" class="viz-grid"/>
<text x="20" y="272" class="viz-label">Group name, invite links</text><text x="240" y="272" class="viz-value">never relayed, filtered</text><text x="420" y="272" class="viz-label-muted">the keyword filter's job</text>
<line x1="0" y1="284" x2="640" y2="284" class="viz-grid"/>
<text x="0" y="316" class="viz-label-muted">The test for a new feature: does it move any field toward "must know"?</text>
</svg>
<figcaption>Illustrative: the field-level policy as the design applies it; the rows are the fields a Telegram message update carries that matter to anonymity.</figcaption>
</figure>

The matrix is the review tool. When a feature is proposed, a read receipt, a typing indicator, a history export, the question is which row it touches and whether it moves the field's treatment toward "must know". A history export that includes sender identifiers moves two rows at once and is refused. A typing indicator that shows which side is typing but not who is fine, because "a side" is a pair identifier, not a person. The rule is that every feature is judged by whether it grows or shrinks the unmask table, and features that grow it need a reason as strong as the dispute process, which is the only thing that has ever justified the table's existence.

## The limits Telegram imposes

A relay lives inside the platform's rate ceilings, and Telegram's [Bot API FAQ](https://core.telegram.org/bots/faq) publishes them: about one message per second to a single chat, with brief bursts tolerated before the API answers with errors; no more than twenty messages per minute to the same group; and about thirty messages per second for bulk notifications, unless the bot pays for a higher broadcast tier. For a relay those numbers are architecture. The per-group ceiling of twenty a minute is the tightest, and it is per group, not per thread, so a busy pair of groups with several concurrent trades shares one budget of a message every three seconds in each direction.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Telegram Bot API rate ceilings that shape a relay, in messages per second on a log scale</title>
<desc id="f3-d">Horizontal bars: to one chat, about 1 per second; to the same group, 20 per minute, about 0.33 per second; bulk notifications, about 30 per second; paid broadcast tier, up to 1,000 per second. The per-group ceiling is highlighted as the one that binds a relay.</desc>
<text x="0" y="18" class="viz-title">The per-group ceiling is the one a relay hits</text>
<text x="0" y="36" class="viz-sub">Messages per second, log scale from 0.1 to 1,000, from the Bot API FAQ</text>
<line x1="196" y1="52" x2="196" y2="188" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">Same group</text>
<path d="M196 58 H238 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="258" y="73" class="viz-value">0.33, twenty a minute</text>
<text x="186" y="107" text-anchor="end" class="viz-label">One chat</text>
<path d="M196 92 H277 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="297" y="107" class="viz-value">about 1</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Bulk notifications</text>
<path d="M196 126 H394 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="414" y="141" class="viz-value">about 30</text>
<text x="186" y="175" text-anchor="end" class="viz-label">Paid broadcast tier</text>
<path d="M196 160 H516 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="536" y="175" class="viz-value">up to 1,000</text>
<text x="0" y="222" class="viz-label-muted">A pair of groups shares one twenty-a-minute budget each way, whatever the trade count.</text>
<text x="0" y="246" class="viz-tick">eighty pixels per decade</text>
</svg>
<figcaption>Source: the <a href="https://core.telegram.org/bots/faq">Telegram Bot API FAQ</a>, section on hitting limits, September 2026.</figcaption>
</figure>

That budget interacts with anonymity in a way that is easy to miss. A relay that queues messages under the ceiling has to decide what to do when the queue is long, and the tempting answer, batching several relayed messages into one, is a leak: a batch reveals that three messages came from one side in quick succession, which is timing information about the other party's activity, and if the batch preserves order across threads it reveals which trades are active together. The design keeps one relayed message per outgoing message, delays rather than merges, and accepts the ceiling as the price of not letting the queue itself become a side channel.

## What a dispute looks like

The test of the design is the dispute, because that is when the bot is asked to know the most. A party claims the other side did not deliver. The bot has the escrow state for the pair, the amount and the status, and it has the relayed thread on each side, which is the record of what was said. It does not have, and cannot produce, the identity of the party on the other side, because the unmask table maps threads to pairs and nothing to people. The mediator, a human or a rule, reads the two threads, decides, and instructs the escrow store to settle one way or the other by pair identifier. The parties are never introduced. The bot could not introduce them if it wanted to, and the design's whole purpose is that "could not" rather than "will not" is the guarantee.

There is one honest limit. Telegram itself knows who is in every group and who sent every message, and a party who is compelled or persuaded to hand over their own group's history has their own side's identities in hand. The unmask table protects the pairing, the link between one side and the other, and it protects it against the bot's operator, against the bot's database, and against the other party. It cannot protect either side from itself, and the send permissions and keyword filter are the acknowledgement that the biggest risk to a party's anonymity was always going to be a member of their own group typing their own name.
