---
title: An unsolvable puzzle cannot ship
date: 2026-10-12
summary: Every puzzle in Axiom is a theorem checked by a 758-line kernel on the phone; before a release, tools/par.js runs the kernel's own solver over all 44 theorems and fails if one cannot be finished.
tags: Natural Deduction, Proof Checking, Search
topic: NLP & Parsing
draft: false
---

Axiom is a puzzle game for Android whose puzzles are theorems: you grow a proof tree by hand, and a verification kernel on the phone decides whether you have proved anything. The kernel is one file, web/js/kernel.js, 758 of the 3,113 lines of JavaScript in web/js and tools/ as I cloned it on 12 October 2026, and nothing outside it is trusted. Before a release, tools/par.js runs the kernel's own solver over all 44 theorems, replays and re-verifies every proof it finds, writes the results to pars.js, and exits with status 1 if a single theorem could not be finished. An unsolvable puzzle cannot ship, not because somebody re-read the content, but because one script runs the player's own checker over all of it, and its exit status is the gate. The lesson is older than the app: keep the checker small enough to read, derive everything through it, and make one script prove the content before it ships.

## A small language and a smaller parser

The kernel is an engine for classical natural deduction, which the [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/entries/natural-deduction/) describes as "a type of logical system described initially in Gentzen (1934) and Jaśkowski (1934)". Its language is first-order, with a grammar that fits in six lines of comment above the parser: implication is right associative and binds loosest, then disjunction, conjunction and negation, and a quantifier takes one or more names and a dot. Negation is not a connective of its own; `~P` is parsed as `P -> false`. The lexer is thirteen lines, the recursive-descent parser under forty, and a name is a variable only when a quantifier in scope has bound it. The 44 theorems in content.js and the 39 axioms, which the app calls tools, are text run through that parser, such as `all X Y. eq(X,Y) -> eq(Y,X)`.

Dragging a tool onto a goal is one-way matching: strip the tool's leading universals, peel off as many premises as possible, and match the conclusion against the goal, binding each metavariable once and refusing a second binding that differs. Variables bind on the tool's side only, which makes it matching rather than unification. A slot the match leaves open is filled by the player from a pool of at most fourteen ground terms, and the premises become new goals.

## Nothing in the interface is trusted

The header of board.js says it plainly: "this file never marks a goal closed on its own". Every move goes through Kernel.apply, and a step the kernel refuses produces a toast rather than a change. The rules live in one function, children(), which returns the child sequents a rule demands, or null. It has ten rule tags: split, suppose, pick, cases, contradict, induct, fix, fixEx, witness and use. apply() and verify() both call it, so the interface cannot invent a step the kernel would not sanction.

verify() is the part I would keep if I had to throw the rest away. It walks the finished tree from the root and re-derives every child, and it fails for nine named reasons, among them a node reached twice, a step that does not follow from the rule it claims, a goal altered after the step that made it, and detached nodes. The victory card appears only when it returns "checked from the root", and prints that phrase. The shape is the one Robin Milner's [LCF](https://en.wikipedia.org/wiki/Logic_for_Computable_Functions) gave proof assistants in the early 1970s, where "theorems are derived using only the inference rules given by the operations of the theorem abstract type". A closed goal in Axiom is a flag that only kernel.js ever sets; the board only draws it.

<figure class="chart">
<svg viewBox="0 0 640 350" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Lines of JavaScript per file in Axiom's web/js and tools/, with the kernel highlighted</title>
<desc id="f1-d">Horizontal bars of line counts: kernel.js 758, board.js 744, content.js 541, app.js 462, store.js 219, the three files under tools 199, forge.js 90, sound.js 53, pars.js 47. Only kernel.js is coloured; it is 758 of 3,113 lines, about a quarter.</desc>
<text x="0" y="18" class="viz-title">The trusted base is a quarter of the code</text>
<text x="0" y="36" class="viz-sub">Lines per JavaScript file, 3,113 in all; only kernel.js is trusted and only it is coloured</text>
<line x1="120" y1="52" x2="120" y2="320" class="viz-axis"/>
<text x="110" y="70" text-anchor="end" class="viz-label">kernel.js</text>
<rect x="120" y="58" width="454.8" height="16" rx="4" class="viz-f1"/><text x="582.8" y="70" class="viz-value">758</text>
<text x="110" y="100" text-anchor="end" class="viz-label">board.js</text>
<rect x="120" y="88" width="446.4" height="16" rx="4" class="viz-fgray"/><text x="574.4" y="100" class="viz-value">744</text>
<text x="110" y="130" text-anchor="end" class="viz-label">content.js</text>
<rect x="120" y="118" width="324.6" height="16" rx="4" class="viz-fgray"/><text x="452.6" y="130" class="viz-value">541</text>
<text x="110" y="160" text-anchor="end" class="viz-label">app.js</text>
<rect x="120" y="148" width="277.2" height="16" rx="4" class="viz-fgray"/><text x="405.2" y="160" class="viz-value">462</text>
<text x="110" y="190" text-anchor="end" class="viz-label">store.js</text>
<rect x="120" y="178" width="131.4" height="16" rx="4" class="viz-fgray"/><text x="259.4" y="190" class="viz-value">219</text>
<text x="110" y="220" text-anchor="end" class="viz-label">tools, 3 files</text>
<rect x="120" y="208" width="119.4" height="16" rx="4" class="viz-fgray"/><text x="247.4" y="220" class="viz-value">199</text>
<text x="110" y="250" text-anchor="end" class="viz-label">forge.js</text>
<rect x="120" y="238" width="54" height="16" rx="4" class="viz-fgray"/><text x="182" y="250" class="viz-value">90</text>
<text x="110" y="280" text-anchor="end" class="viz-label">sound.js</text>
<rect x="120" y="268" width="31.8" height="16" rx="4" class="viz-fgray"/><text x="159.8" y="280" class="viz-value">53</text>
<text x="110" y="310" text-anchor="end" class="viz-label">pars.js</text>
<rect x="120" y="298" width="28.2" height="16" rx="4" class="viz-fgray"/><text x="156.2" y="310" class="viz-value">47</text>
<text x="0" y="340" class="viz-label-muted">Six tenths of a pixel per line; the board is nearly as long as the kernel it obeys.</text>
</svg>
<figcaption>Source: wc -l over web/js/*.js and tools/*.js in a clone of <a href="https://github.com/shayanmohd/axiom/tree/main/web/js">shayanmohd/axiom</a> at commit 6b3b8e5, counted on 12 October 2026.</figcaption>
</figure>

## The solver is the rules run forwards

The solver, solve(), is in the same file because it uses the same rules. It is depth-first iterative deepening: one move, then two, and so on up to a maximum, with a budget per depth of 400,000 calls; a depth that runs out is abandoned and the search moves on to the next. [Richard Korf's 1985 paper](https://cse.sc.edu/~mgv/csce580f12/gradPres/korf_IDAStar_1985.pdf) showed the method "asymptotically optimal along all three dimensions for exponential tree searches", time, space and the cost of the solution path, and the third is what matters here: the first proof found is the shallowest, and the shallowest proof is par. Three cheap prunings keep it inside the budget: give up when there are more open goals than moves left, remember each set of open sequents at each remaining depth, and try the moves that create the fewest new goals first.

## The exit status is the gate

tools/par.js is 49 lines. For each theorem it calls solve() with a maximum depth of 11 and the 400,000 budget, then does what a quicker script would skip: it builds a second fresh state, replays the proof with applySeq(), runs verify() and checks that no goal is open. A proof that does not replay counts as a failure. The lengths go to web/js/pars.js, and the process exits with status 1 if anything failed. The README says the build fails; strictly, nothing in the repository runs the script for you. The Gradle build does nothing with web/ but copy it into the app's assets, so the gate is the exit status, read before gradlew bundleRelease. Ignore it and the failed theorem ships anyway: pars.js is written without it, the board shows a question mark for par, and store.js scores the player against their own length. The header of content.js says the rest: "Every par in this file is produced by the kernel's own solver in tools/par.js, never typed by hand."

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The release gate in tools/par.js as a flow from content.js to pars.js, with the failure branch</title>
<desc id="f2-d">A flow in the script's order. content.js, with 44 theorems and 39 tools and no pars, feeds solve(), which searches to depth 11 with at most 400,000 calls per depth. A found proof is replayed from scratch with applySeq() and re-checked with verify(), then its length is written to pars.js. If no proof is found, or the replay is rejected, par.js exits with status 1, and that status is the release gate.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">The release step proves the content before it ships</text>
<rect x="8" y="50" width="130" height="76" rx="8" class="viz-box"/>
<text x="73" y="76" text-anchor="middle" class="viz-label">content.js</text>
<text x="73" y="94" text-anchor="middle" class="viz-label-muted">44 theorems</text>
<text x="73" y="110" text-anchor="middle" class="viz-label-muted">39 tools, no pars</text>
<line x1="140" y1="88" x2="162" y2="88" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="166" y="50" width="172" height="76" rx="8" class="viz-box-accent"/>
<text x="252" y="76" text-anchor="middle" class="viz-label">solve()</text>
<text x="252" y="94" text-anchor="middle" class="viz-label-muted">depth at most 11</text>
<text x="252" y="110" text-anchor="middle" class="viz-label-muted">400,000 calls per depth</text>
<line x1="340" y1="88" x2="362" y2="88" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="366" y="50" width="166" height="76" rx="8" class="viz-box-accent"/>
<text x="449" y="76" text-anchor="middle" class="viz-label">applySeq(), verify()</text>
<text x="449" y="94" text-anchor="middle" class="viz-label-muted">replay from scratch</text>
<text x="449" y="110" text-anchor="middle" class="viz-label-muted">re-check from the root</text>
<line x1="534" y1="88" x2="556" y2="88" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="545" y="80" text-anchor="middle" class="viz-tick">ok</text>
<rect x="560" y="50" width="72" height="76" rx="8" class="viz-box"/>
<text x="596" y="76" text-anchor="middle" class="viz-label">pars.js</text>
<text x="596" y="94" text-anchor="middle" class="viz-label-muted">44 pars</text>
<text x="596" y="110" text-anchor="middle" class="viz-label-muted">shipped</text>
<line x1="252" y1="128" x2="252" y2="172" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="262" y="154" class="viz-tick">no proof</text>
<line x1="449" y1="128" x2="449" y2="172" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="459" y="154" class="viz-tick">rejected</text>
<rect x="166" y="176" width="466" height="36" rx="8" class="viz-box-ink"/>
<text x="399" y="199" text-anchor="middle" class="viz-on-ink">no proof, or a rejected replay: exit status 1, the release stops</text>
<text x="0" y="236" class="viz-label-muted">The arrows run in the script's order, left to right; the limits are its defaults.</text>
</svg>
<figcaption>Illustrative: the gate drawn as a flow. The boxes and limits are read from <a href="https://github.com/shayanmohd/axiom/blob/main/tools/par.js">tools/par.js</a>; the layout is mine.</figcaption>
</figure>

The file it writes has 44 entries between 1 and 10. The single 1 is the first theorem, a segment is equal to itself; the single 10 is the induction proof that every number is even or odd. Crowns are scored against par: gold needs no hints and a proof no longer than par, silver is within two moves, and the victory card says what gold means, "This matches the shortest proof the kernel can find." Leaderboards were left out because they need a server, and rather than fake them the game scores against its own solver.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Number of theorems at each par value from one to ten</title>
<desc id="f3-d">A column chart with one bar per par value from one to ten. Par 1, one theorem; par 2, five; par 3, nine; par 4, seven; par 5, eleven; par 6, five; par 7, two; par 8, three; par 9, none; par 10, one. Forty-four theorems in all.</desc>
<text x="0" y="18" class="viz-title">Most theorems take three to six moves</text>
<text x="0" y="36" class="viz-sub">Theorems at each par across all 44; the lone ten is s10, even or odd by induction</text>
<line x1="56" y1="110" x2="600" y2="110" class="viz-grid"/><text x="48" y="114" text-anchor="end" class="viz-tick">10</text>
<line x1="56" y1="180" x2="600" y2="180" class="viz-grid"/><text x="48" y="184" text-anchor="end" class="viz-tick">5</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/><text x="48" y="254" text-anchor="end" class="viz-tick">0</text>
<rect x="60" y="236" width="40" height="14" rx="3" class="viz-f1"/><text x="80" y="230" text-anchor="middle" class="viz-value">1</text>
<rect x="114" y="180" width="40" height="70" rx="3" class="viz-f1"/><text x="134" y="174" text-anchor="middle" class="viz-value">5</text>
<rect x="168" y="124" width="40" height="126" rx="3" class="viz-f1"/><text x="188" y="118" text-anchor="middle" class="viz-value">9</text>
<rect x="222" y="152" width="40" height="98" rx="3" class="viz-f1"/><text x="242" y="146" text-anchor="middle" class="viz-value">7</text>
<rect x="276" y="96" width="40" height="154" rx="3" class="viz-f1"/><text x="296" y="90" text-anchor="middle" class="viz-value">11</text>
<rect x="330" y="180" width="40" height="70" rx="3" class="viz-f1"/><text x="350" y="174" text-anchor="middle" class="viz-value">5</text>
<rect x="384" y="222" width="40" height="28" rx="3" class="viz-f1"/><text x="404" y="216" text-anchor="middle" class="viz-value">2</text>
<rect x="438" y="208" width="40" height="42" rx="3" class="viz-f1"/><text x="458" y="202" text-anchor="middle" class="viz-value">3</text>
<text x="512" y="244" text-anchor="middle" class="viz-value">0</text>
<rect x="546" y="236" width="40" height="14" rx="3" class="viz-f1"/><text x="566" y="230" text-anchor="middle" class="viz-value">1</text>
<text x="80" y="270" text-anchor="middle" class="viz-tick">1</text>
<text x="134" y="270" text-anchor="middle" class="viz-tick">2</text>
<text x="188" y="270" text-anchor="middle" class="viz-tick">3</text>
<text x="242" y="270" text-anchor="middle" class="viz-tick">4</text>
<text x="296" y="270" text-anchor="middle" class="viz-tick">5</text>
<text x="350" y="270" text-anchor="middle" class="viz-tick">6</text>
<text x="404" y="270" text-anchor="middle" class="viz-tick">7</text>
<text x="458" y="270" text-anchor="middle" class="viz-tick">8</text>
<text x="512" y="270" text-anchor="middle" class="viz-tick">9</text>
<text x="566" y="270" text-anchor="middle" class="viz-tick">10</text>
<text x="328" y="290" text-anchor="middle" class="viz-label-muted">Par, the length of the kernel's shortest proof in moves</text>
<text x="0" y="312" class="viz-label-muted">Fourteen pixels per theorem; the four keystone theorems sit at five and six.</text>
</svg>
<figcaption>Source: <a href="https://github.com/shayanmohd/axiom/blob/main/web/js/pars.js">web/js/pars.js</a> in the Axiom repository, read on 12 October 2026; the file is written by tools/par.js and holds 44 entries.</figcaption>
</figure>

## What the gate does not prove

The gate proves derivability, not truth. The 39 tools are axioms, and a wrong one would let a false theorem through with a clean verify() and a par. So the trusted base is the kernel plus those 39 formulas, plus the parser's reading of them: if `->` associated to the left, every theorem would say something else, and par.js would cheerfully prove the something else. That is why the grammar is written down and the parser is under forty lines. The LCF entry notes that the compiler underneath "adds to the trusted computing base"; here that is the WebView's JavaScript engine, which I cannot shrink. The kernel is a quarter of the app's JavaScript, and the other three quarters can be wrong without producing a false "proved".

Par is also only as good as the solver's caps: fourteen candidate terms, eight bare names for a tool with two open slots, and 400,000 calls per depth. A shorter proof that needs a term outside that pool would not be found, nor would one hiding at a depth the solver had to abandon, and a player who found either would beat par, which is why the victory card says the shortest proof the kernel can find.

## The rule

Freek Wiedijk's [comparison of seventeen proof assistants](https://www.cs.ru.nl/~freek/comparison/comparison.pdf) lists a "small proof kernel" as a property a system either has or lacks, and footnotes it: "This is also called the de Bruijn criterion." A game is an odd place to apply it, but the reason it holds is the same. A player's trust in "you proved it" is worth exactly as much as the smallest piece of code that can say it, and 758 lines is small enough to read in an evening. Then point the same code at the content. If the solver cannot prove a puzzle with the checker that will judge the player, the script says so with its exit status and the puzzle does not ship. What has to be remembered is one command and its exit status, not forty-four proofs.

Axiom is on [Google Play](https://play.google.com/store/apps/details?id=com.mohdshayan.axiom) and the [source is on GitHub](https://github.com/shayanmohd/axiom).
