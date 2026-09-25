---
title: Treat the model like a game client
date: 2026-09-06
summary: An agent's tool calls are intents from a client you do not control. Games solved that years ago: validate every intent on the host, and send each client only what it may see.
tags: Agents, Tool Use, Security
topic: LLM Engineering
draft: false
---

Every online card game has one rule that nothing else works without: the client does not get to say what happened. It says what it wants to happen, and the host decides. When I built Turup Chaal, that rule was the whole anti-cheat design, and I wrote about it in [the previous post](/blog/the-hand-you-were-never-dealt/). I have since come to think it is also the whole design for an agent that calls tools.

An agent's tool call looks like an action. It is not one. It is a message from a client you do not control, produced by a process you cannot inspect, asking for something to happen. The system that receives that message is the host, and the host owes it exactly the treatment a card game gives a tapped card.

## An intent is not an action

The [tau-bench paper](https://arxiv.org/abs/2406.12045) measured how reliably function-calling agents finish realistic tasks in a retail domain and an airline domain, with a simulated user and a written policy the agent must follow. State-of-the-art agents succeeded on fewer than half of the tasks. The authors then added a second metric, pass^k, the chance that all k independent runs of the same task succeed. In the retail domain, pass^8 was below 25%. Run the same agent on the same task eight times and fewer than one task in four comes out right every time.

In a game you would describe that as a client that sends a bad move a third of the time. Nobody ships a card game that applies such moves and reconciles later. The OWASP Top 10 for LLM applications names the equivalent failure in agents directly: [LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), damaging actions performed in response to unexpected, ambiguous or manipulated model output, whatever caused the output. OWASP splits the cause three ways: functionality the agent did not need, permissions wider than the task, and autonomy over actions that should have waited for a person. The remedy it gives is the netcode remedy: enforce authorisation outside the model, in the system that executes.

## Three checks a host already knows how to write

In Turup Chaal a PlayCardIntent passes three gates before anything changes: is it this seat's turn, does this hand hold the card, does the led suit allow it. Rename the nouns and you have the validation layer for a tool server.

1. Is it this actor's turn. The workflow state must allow the action now. A refund exists only for an order in a refundable state; a "cancel shipment" intent on a delivered order is rejected, not interpreted.
2. Does the actor hold the card. The principal the agent acts for must own the object. The agent is not the customer; it is the customer's client. If the customer cannot see order 4471, neither can the agent, whatever the model says about it.
3. Does the rule allow it. Arguments are checked against live state, never against the model's description of state. The refund amount is compared with what was paid, not with what the model reports was paid.

```ts
if (!allowed(order.state, "refund"))   return reject("Order is not refundable in this state.");
if (order.customerId !== actor.id)     return reject("Actor does not own this order.");
if (amount > order.paidMinusRefunded)  return reject("Refund exceeds what was paid.");
```

<figure class="chart">
<svg viewBox="0 0 640 140" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The host path for one tool call</title>
<desc id="f1-d">Four steps left to right: the agent emits an intent, the host validates it against live state with three checks, the host applies it, and a redacted result goes back to the agent. The validation step is highlighted.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="40" width="124" height="56" rx="8" class="viz-box"/>
<text x="70" y="64" text-anchor="middle" class="viz-label">Agent intent</text>
<text x="70" y="82" text-anchor="middle" class="viz-label-muted">refund(4471, 40)</text>
<line x1="134" y1="68" x2="164" y2="68" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="168" y="40" width="124" height="56" rx="8" class="viz-box-accent"/>
<text x="230" y="64" text-anchor="middle" class="viz-label">Host validates</text>
<text x="230" y="82" text-anchor="middle" class="viz-label-muted">turn, card, rule</text>
<line x1="294" y1="68" x2="324" y2="68" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="328" y="40" width="124" height="56" rx="8" class="viz-box"/>
<text x="390" y="64" text-anchor="middle" class="viz-label">Apply to state</text>
<text x="390" y="82" text-anchor="middle" class="viz-label-muted">one transaction</text>
<line x1="454" y1="68" x2="484" y2="68" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="488" y="40" width="124" height="56" rx="8" class="viz-box-ink"/>
<text x="550" y="64" text-anchor="middle" class="viz-on-ink">Redacted result</text>
<text x="550" y="82" text-anchor="middle" class="viz-on-ink">built for this agent</text>
<text x="230" y="120" text-anchor="middle" class="viz-tick">reject with a reason, change nothing</text>
</svg>
<figcaption>Illustrative: the same path a card-game host runs for a played card, with the nouns renamed.</figcaption>
</figure>

What the host returns on rejection matters as much as the rejection. Turup Chaal sends a rule violation event and changes nothing. A tool server should do the same: a structured refusal with the reason, so the model can try a legal move, and no partial state left behind. "Trust the client and reconcile later" was never a design in games. It should not become one here.

## Autonomy is a turn order

OWASP's third cause, excessive autonomy, has a game shape too. Some actions in a card game belong to a seat that no client occupies: the host deals, the host scores the trick, the host ends the round. In an agent system, the high-impact actions belong to a seat only a person can play. "Close the account" is not an intent the agent's seat can make; it is a proposal that moves the workflow into a state where the human seat is on turn. The agent has not been denied anything. It has been given a turn order, and the order is data the host enforces, not a policy the model is asked to remember.

## The half everyone skips

Validation stops an agent from doing something illegal. It does nothing to stop the agent from reading what it should not, and reading is where the newer failures live. A tool that returns the full customer record hands the model every field, including the ones that carry other people's data and the ones an attacker filled with instructions. A prompt injection sitting in a note field cannot fire if the note is never sent.

The game answer is redaction at the source. After each accepted move, the host builds a snapshot for each player that contains only that player's hand, the table, and the counts, and sends it only to that player. A tool result is a snapshot. Build it for this agent and this task: the fields the next step needs, nothing else. The model cannot leak, act on, or be steered by a value that never reached it.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Game concepts mapped to agent concepts</title>
<desc id="f2-d">A two column table. Left column, the card game: a played card, a hand, the host, a per-player snapshot, a rule violation event, the seat on turn. Right column, the agent system: a tool call, a record, the tool server, a redacted tool result, a structured rejection, the workflow state.</desc>
<text x="0" y="18" class="viz-title">The same design, two vocabularies</text>
<text x="20" y="48" class="viz-tick">CARD GAME</text>
<text x="340" y="48" class="viz-tick">AGENT SYSTEM</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<line x1="320" y1="56" x2="320" y2="250" class="viz-grid"/>
<text x="20" y="82" class="viz-label">A played card</text>
<text x="340" y="82" class="viz-label">A tool call</text>
<line x1="0" y1="92" x2="640" y2="92" class="viz-grid"/>
<text x="20" y="114" class="viz-label">A hand</text>
<text x="340" y="114" class="viz-label">A record the actor owns</text>
<line x1="0" y1="124" x2="640" y2="124" class="viz-grid"/>
<text x="20" y="146" class="viz-label">The host</text>
<text x="340" y="146" class="viz-label">The tool server</text>
<line x1="0" y1="156" x2="640" y2="156" class="viz-grid"/>
<text x="20" y="178" class="viz-label">A per-player snapshot</text>
<text x="340" y="178" class="viz-label">A redacted tool result</text>
<line x1="0" y1="188" x2="640" y2="188" class="viz-grid"/>
<text x="20" y="210" class="viz-label">A rule violation event</text>
<text x="340" y="210" class="viz-label">A structured rejection</text>
<line x1="0" y1="220" x2="640" y2="220" class="viz-grid"/>
<text x="20" y="242" class="viz-label">The seat on turn</text>
<text x="340" y="242" class="viz-label">The workflow state</text>
</svg>
<figcaption>Illustrative: the mapping this post uses; engineers who have written an authoritative server already know the right column.</figcaption>
</figure>

## Why the numbers make this a host problem

If eight runs of a task were independent coin flips with success probability p, pass^8 would be p to the eighth. At p equal to 0.7, that is under 6%. The measured pass^8 in tau-bench sits well above that curve, which sounds like good news and is not. It means failures cluster by task: when an agent gets a task wrong, it tends to get it wrong the same way every time. A client that repeats the same illegal move on every retry is exactly the client a host exists for. Retrying without validation does not average the error away. It re-sends it.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">What pass^k would be if runs were independent</title>
<desc id="f3-d">Three curves of p to the power k for k from 1 to 8, with p at 0.9, 0.7 and 0.5. They fall to 0.43, 0.06 and 0.004 at k equals 8. A horizontal marker at 0.25 shows the retail pass^8 ceiling reported by tau-bench.</desc>
<text x="0" y="18" class="viz-title">pass^k under independent runs</text>
<text x="0" y="36" class="viz-sub">p to the power k, for three values of p</text>
<line x1="380" y1="31" x2="394" y2="31" class="viz-s1"/><text x="400" y="35" class="viz-label-muted">p = 0.9</text>
<line x1="470" y1="31" x2="484" y2="31" class="viz-s2"/><text x="490" y="35" class="viz-label-muted">p = 0.7</text>
<line x1="560" y1="31" x2="574" y2="31" class="viz-s3"/><text x="580" y="35" class="viz-label-muted">p = 0.5</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">1.00</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">0.75</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">0.50</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-axis"/><text x="48" y="216" text-anchor="end" class="viz-tick">0.25</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="600" y="206" text-anchor="end" class="viz-label-muted">tau-bench retail pass^8 is below this line</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="133.7" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="211.4" y="288" text-anchor="middle" class="viz-tick">3</text>
<text x="289.1" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="366.9" y="288" text-anchor="middle" class="viz-tick">5</text>
<text x="444.6" y="288" text-anchor="middle" class="viz-tick">6</text>
<text x="522.3" y="288" text-anchor="middle" class="viz-tick">7</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">k, the number of consecutive runs that must all succeed</text>
<polyline points="56,76.8 133.7,95.5 211.4,112.4 289.1,127.5 366.9,141.2 444.6,153.5 522.3,164.5 600,174.5" class="viz-s1"/>
<polyline points="56,118.4 133.7,162.1 211.4,192.7 289.1,214.1 366.9,229.1 444.6,239.5 522.3,247 600,251.9" class="viz-s2"/>
<polyline points="56,160 133.7,212 211.4,238 289.1,251 366.9,257.5 444.6,260.7 522.3,262.4 600,263.2" class="viz-s3"/>
<circle cx="600" cy="174.5" r="4" class="viz-d1"/>
<circle cx="600" cy="251.9" r="4" class="viz-d2"/>
<circle cx="600" cy="263.2" r="4" class="viz-d3"/>
<text x="592" y="170" text-anchor="end" class="viz-value">0.43</text>
<text x="592" y="247" text-anchor="end" class="viz-value">0.06</text>
</svg>
<figcaption>Illustrative: curves computed from p^k. The 0.25 marker is the retail pass^8 bound reported in <a href="https://arxiv.org/abs/2406.12045">tau-bench (Yao et al., 2024)</a>; measured agents sit above the independent curve because their failures repeat by task.</figcaption>
</figure>

## What the host costs

People assume validation and redaction are expensive. In the card game it was four small payloads a move. Here it is one state lookup per mutating call and one projection per result, both cheaper than the model call they wrap. The cost that matters is design cost, and it is paid once: the tool server needs a "state as seen by agent X" view, the workflow needs explicit states with allowed transitions, and every mutating tool needs its three checks written down next to it.

There is a limit to the analogy, and it is worth naming. A card game has a finite rule book, so the host can be complete. A tool server's rules are only as complete as the states and transitions someone bothered to declare, and an action nobody modelled gets no gate. The discipline, then, is that a tool with no declared preconditions does not get wired to a mutating call at all. Read-only tools can be generous. Writes wait for their rules.

One more thing the game taught me, which I did not expect to carry over: the host's checks are also the best test suite. Every rejection the tool server produces is a labelled example of the model trying something the workflow forbids, and a week of those rejections tells you more about where the agent goes wrong than any benchmark. In Turup Chaal the rule violation log was how I found bugs in my own client. In an agent system it is how you find the prompts that need work, the tools that need clearer descriptions, and the states you forgot to declare.

What you get back is a security argument that fits in one sentence, and it is the same sentence as before. The host decides what happened, and each agent only ever learns its own part of it.
