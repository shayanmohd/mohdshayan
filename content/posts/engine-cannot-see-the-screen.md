---
title: The engine cannot see the screen
date: 2026-09-17
summary: A rules engine that compiles without the game framework is the cheapest anti-cheat, test suite and replay system you can build. Turup Chaal's is plain C#; the rest followed.
tags: Unity, Architecture, Testing
draft: false
---

The best decision in Turup Chaal was made before there was a game to decide about. The rules of Court Piece, the dealing, the trump call, the follow-suit check, the trick resolution, the count to seven, live in a C# project that does not reference Unity. It cannot draw a card, play a sound, or send a packet. It cannot see the screen. Every property people later add to a multiplayer game as a feature, determinism, replay, host authority, headless testing, fell out of that one dependency rule for free, and I have come to think the rule is the whole architecture.

## One dependency direction

The rule is easy to state. The rules engine depends on nothing. The presentation layer depends on the engine. The network layer depends on the engine. The engine never depends on either of them, and the compiler enforces that, because the engine's project has no reference to the Unity assemblies or to the networking library.

<figure class="chart">
<svg viewBox="0 0 640 280" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The four layers of the game and the one permitted dependency direction</title>
<desc id="f1-d">Four full-width rows. Bottom: the rules engine in plain C#, with no references. Above it: adapters that translate intents and snapshots. Above that: Unity presentation, scenes and rendering. Top: the Photon transport. Arrows point downward only, from each layer to the engine; nothing points up.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="0" y="24" width="640" height="48" rx="8" class="viz-box"/>
<text x="16" y="53" class="viz-label">Photon transport</text>
<text x="624" y="53" text-anchor="end" class="viz-label-muted">sends intents, receives snapshots</text>
<rect x="0" y="88" width="640" height="48" rx="8" class="viz-box"/>
<text x="16" y="117" class="viz-label">Unity presentation</text>
<text x="624" y="117" text-anchor="end" class="viz-label-muted">scenes, animation, input</text>
<rect x="0" y="152" width="640" height="48" rx="8" class="viz-box"/>
<text x="16" y="181" class="viz-label">Adapters</text>
<text x="624" y="181" text-anchor="end" class="viz-label-muted">taps become intents, states become views</text>
<rect x="0" y="216" width="640" height="48" rx="8" class="viz-box-ink"/>
<text x="16" y="245" class="viz-on-ink">Rules engine, plain C#</text>
<text x="624" y="245" text-anchor="end" class="viz-on-ink">no reference to anything above</text>
<line x1="320" y1="74" x2="320" y2="84" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="320" y1="138" x2="320" y2="148" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="320" y1="202" x2="320" y2="212" class="viz-arrow" marker-end="url(#f1-ah)"/>
</svg>
<figcaption>Illustrative: the dependency direction as built; the arrows are the only ones the compiler allows.</figcaption>
</figure>

Unity makes this straightforward with [assembly definition files](https://docs.unity3d.com/Manual/ScriptCompilationAssemblyDefinitionFiles.html), which split a project's scripts into separately compiled assemblies with explicit references. The engine's assembly definition lists no references. If someone writes a line in the engine that touches a Unity type, the build fails. That is the entire enforcement mechanism, and it costs nothing at runtime.

The test I use to know whether the rule still holds is blunt. Copy the engine's source to a machine with no Unity installed, compile it with the plain [.NET SDK](https://learn.microsoft.com/en-us/dotnet/core/sdk), and run its tests. If anything fails to compile, the engine has grown a dependency on the renderer, and every property that depends on the rule is now in doubt. I call it the framework-free build test, and it runs in the engine's continuous integration on a plain runner with no game engine on it.

## What falls out

Determinism came first, and it came from the shuffle. The engine deals from a seeded random source, so a match is a function of its seed and its sequence of intents. Two engines given the same seed and the same intents produce the same state, on any device, at any time. That is not a feature that was added. It is what a pure function does.

Replay came from determinism. Record the seed and the intent log and you have the whole match in a few kilobytes. Bug reports became reproducible: a player's complaint that the trump call was scored wrongly is a seed and a log, and the engine replays it on my machine to the exact card. Practice mode became free, because a practice match is the same engine with the intents coming from local input instead of the network.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One seed and one intent log replayed on two devices</title>
<desc id="f2-d">Three lanes: device A, the recorded seed and intent log, and device B. Both devices load the same seed, receive the same intents in order, and reach an identical state hash at the end. A mismatch at any step would identify the exact intent where behaviour diverged.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="20" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="95" y="31" text-anchor="middle" class="viz-label">Device A</text>
<rect x="245" y="8" width="150" height="36" rx="8" class="viz-box-accent"/>
<text x="320" y="31" text-anchor="middle" class="viz-label">Seed and intent log</text>
<rect x="470" y="8" width="150" height="36" rx="8" class="viz-box"/>
<text x="545" y="31" text-anchor="middle" class="viz-label">Device B</text>
<line x1="95" y1="48" x2="95" y2="290" class="viz-grid"/>
<line x1="320" y1="48" x2="320" y2="290" class="viz-grid"/>
<line x1="545" y1="48" x2="545" y2="290" class="viz-grid"/>
<text x="207" y="74" text-anchor="middle" class="viz-label-muted">seed 8f3a, deal 5-4-4</text>
<line x1="315" y1="80" x2="103" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="74" text-anchor="middle" class="viz-label-muted">seed 8f3a, deal 5-4-4</text>
<line x1="325" y1="80" x2="537" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="207" y="124" text-anchor="middle" class="viz-label-muted">intent 1: seat 2 calls trump</text>
<line x1="315" y1="130" x2="103" y2="130" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="124" text-anchor="middle" class="viz-label-muted">intent 1: seat 2 calls trump</text>
<line x1="325" y1="130" x2="537" y2="130" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="207" y="174" text-anchor="middle" class="viz-label-muted">intents 2 to 53, in order</text>
<line x1="315" y1="180" x2="103" y2="180" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="432" y="174" text-anchor="middle" class="viz-label-muted">intents 2 to 53, in order</text>
<line x1="325" y1="180" x2="537" y2="180" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="8" y="220" width="174" height="44" rx="8" class="viz-box-ink"/>
<text x="95" y="238" text-anchor="middle" class="viz-on-ink">state hash c41e</text>
<text x="95" y="256" text-anchor="middle" class="viz-on-ink">tricks 7 to 6</text>
<rect x="458" y="220" width="174" height="44" rx="8" class="viz-box-ink"/>
<text x="545" y="238" text-anchor="middle" class="viz-on-ink">state hash c41e</text>
<text x="545" y="256" text-anchor="middle" class="viz-on-ink">tricks 7 to 6</text>
<text x="320" y="284" text-anchor="middle" class="viz-tick">identical, or the first differing intent is the bug</text>
</svg>
<figcaption>Illustrative: the replay contract; the seed and hash values are made up for the drawing.</figcaption>
</figure>

Host authority came from the same place. I wrote in [an earlier post](/blog/the-hand-you-were-never-dealt/) about how the online match runs exactly one engine, on the host, and how every other client only sends intents. The transport is [Photon PUN](https://doc.photonengine.com/pun/current/getting-started/pun-intro), and it is a thin adapter: it carries intents to the host and redacted snapshots back, and the engine never sees a Photon type any more than it sees a Unity one. That design is only possible because the engine is a separate thing that can be run in one place and not another. If the rules were tangled into the scene, every client would have to run them to draw the screen, and every client would therefore have the full state, and the anti-cheat property would be gone. The engine's ignorance of the screen is what lets the host keep secrets from the clients.

And testing came last, though it should have come first. The engine's test suite runs thousands of simulated matches with random seeds and random legal intents, checking invariants after every move: the deck plus the hands plus the table always sum to fifty-two, no seat ever holds a card twice, the trick count never exceeds thirteen. It runs in seconds on a build server, because there is no scene to load and no frame to render. A test of the same rules inside the game would take minutes per match and would be flaky in the way every test that involves a renderer is flaky.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">How many matches a test run can simulate per second, headless against in-engine</title>
<desc id="f3-d">Two columns on a logarithmic scale. A headless run of the rules engine simulates on the order of thousands of full matches per second. A play-mode run inside the game engine, with a scene loaded and frames rendered, manages on the order of one. The gap is about three orders of magnitude and is shown as an illustrative model.</desc>
<text x="0" y="18" class="viz-title">Matches per second in a test run</text>
<text x="0" y="36" class="viz-sub">Log scale; orders of magnitude from a stated model, not a benchmark</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">10,000</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">1,000</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">1</text>
<path d="M195.3 96 V92 a4 4 0 0 1 4 -4 H215.3 a4 4 0 0 1 4 4 V264 H195.3 Z" class="viz-f1"/>
<text x="207.3" y="80" text-anchor="middle" class="viz-value">about 2,000</text>
<text x="207.3" y="288" text-anchor="middle" class="viz-label-muted">Headless engine</text>
<rect x="436.7" y="258" width="24" height="6" class="viz-fgray"/>
<text x="448.7" y="246" text-anchor="middle" class="viz-value">about 1</text>
<text x="448.7" y="288" text-anchor="middle" class="viz-label-muted">In-engine play mode</text>
</svg>
<figcaption>Illustrative: constructed from a model in which a headless match of 52 intents takes under a millisecond of pure C# and a play-mode match is bounded by scene loading and frame time; the point is the ratio, not the figures.</figcaption>
</figure>

## What the engine is allowed to know

The rule has a corollary that took me longer to accept: the engine has no clock. A card game has turn timers, and the obvious place to put a timer is in the rules, where the turn is. But a timer is a source of non-determinism. Two engines replaying the same intents would diverge the moment one of them read the wall clock. So the timer lives in the adapter, outside the engine, and when it fires it does what everything else does: it sends an intent. A turn that times out is a TimeoutIntent for that seat, recorded in the log like any card play, and the engine handles it with a rule that says what a timed-out seat does. Replay stays exact, because the timeout is data rather than time.

The same goes for randomness beyond the seed, for the player's identity, and for the network's opinion about who is connected. Each of those arrives as an intent or is fixed at match start. The engine knows the seed, the seats, and the sequence of intents, and nothing else. That is a smaller world than most game code lives in, and its smallness is the point.

## The cost, paid once

The rule is not free, and the cost is paid at the boundary. Every input from the screen has to be turned into an intent the engine understands, and every state the engine produces has to be turned into something the screen can draw. That is the adapter layer, and it is where most of the tedious code in the game lives: a tap on a card becomes a PlayCardIntent with a seat and a card id; a snapshot of the state becomes a list of card views with positions and face-up flags. None of it is clever, all of it has to exist, and a team that has never separated the two will feel it as friction for the first month.

There is also a temptation the rule creates, which is to let the engine grow a little convenience for the screen. A method that returns cards in display order. A field that remembers which card was last played, for the animation. Each one is harmless alone and each one is a thread from the engine to the renderer, and after enough of them the framework-free build test fails and nobody remembers why. The assembly definition catches the ones that reference Unity types. It does not catch the ones that merely think like a renderer, and that is what code review is for.

## The rule, restated for anything

None of this is specific to card games or to Unity. The rule is that the thing which decides what happened must compile without the thing which shows it, and it applies to a trading engine behind a terminal, a ticketing validator behind a scanner app, or a CRM's pipeline logic behind a web page. In each case the same properties follow: the deciding part can be run in one place, tested in bulk, replayed from a log, and kept away from the parts you do not control. The game version is just the one where the payoff is easiest to see, because the moment the engine can see the screen, the screen can lie to it.
