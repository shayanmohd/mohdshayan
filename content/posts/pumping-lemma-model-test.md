---
title: The pumping lemma as a model test
date: 2025-05-24
summary: The pumping lemma is a doubling argument: a finite-memory recogniser that accepts a long string must accept it with the middle repeated. It tests a model for grammar versus memory.
tags: Formal Languages, Generalisation, Transformers
draft: false
---

The pumping lemma is taught as a tool for proving that a language is not regular, or not context-free, and students learn it as a ritual with five variables and a contradiction at the end. It is simpler than that and more useful. It is a doubling argument: any recogniser with a finite amount of memory that accepts a long enough string must have repeated a memory state somewhere in the middle, and if it repeated a state, it must also accept the string with that middle section repeated any number of times. That is a statement about any finite machine, and a neural network run once over an input is a finite machine. So the lemma gives a direct experimental test of whether a model learned the grammar of a task or memorised the lengths it was trained on, and it is a test I would run before believing any claim that a model parses.

## The argument, without the ritual

Take a recogniser with a bounded number of internal states, and feed it a string longer than that number. By the time it has read the string, some state must have occurred twice, because there are more positions than states. Call the section between the two occurrences the middle. The machine was in the same state before and after the middle, so if you delete the middle, or repeat it, or repeat it a thousand times, the machine ends in the same state as before and gives the same answer. If the language requires the answer to change, the machine cannot be recognising it. That is the whole [lemma](https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages) for regular languages, and the context-free version is the same argument applied to a pushdown automaton's stack, where two pumpable sections appear instead of one because the stack has to grow and shrink in matched pairs.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">A string split into five parts with the middle pumped, and what a pushdown automaton does with it against a bounded-context model</title>
<desc id="f1-d">Top: a string drawn as five segments u, v, w, x, y, with v and x highlighted as the pumpable sections. Below, the same string with v and x repeated twice. Left annotation: a pushdown automaton pushes during v and pops during x, so repeating both keeps the stack balanced and the string is still accepted. Right annotation: a bounded-context model that has memorised strings of the training length sees a string longer than any it has seen and its answer has no reason to stay the same.</desc>
<text x="0" y="18" class="viz-title">Repeat the middle; a grammar does not notice, a memoriser does</text>
<text x="8" y="56" class="viz-tick">THE STRING, SPLIT AS u v w x y</text>
<rect x="8" y="64" width="80" height="34" rx="6" class="viz-box"/><text x="48" y="87" text-anchor="middle" class="viz-label">u</text>
<rect x="96" y="64" width="80" height="34" rx="6" class="viz-box-accent"/><text x="136" y="87" text-anchor="middle" class="viz-label">v</text>
<rect x="184" y="64" width="80" height="34" rx="6" class="viz-box"/><text x="224" y="87" text-anchor="middle" class="viz-label">w</text>
<rect x="272" y="64" width="80" height="34" rx="6" class="viz-box-accent"/><text x="312" y="87" text-anchor="middle" class="viz-label">x</text>
<rect x="360" y="64" width="80" height="34" rx="6" class="viz-box"/><text x="400" y="87" text-anchor="middle" class="viz-label">y</text>
<text x="8" y="130" class="viz-tick">PUMPED TWICE: u v v w x x y</text>
<rect x="8" y="138" width="60" height="34" rx="6" class="viz-box"/><text x="38" y="161" text-anchor="middle" class="viz-label">u</text>
<rect x="76" y="138" width="60" height="34" rx="6" class="viz-box-accent"/><text x="106" y="161" text-anchor="middle" class="viz-label">v</text>
<rect x="144" y="138" width="60" height="34" rx="6" class="viz-box-accent"/><text x="174" y="161" text-anchor="middle" class="viz-label">v</text>
<rect x="212" y="138" width="60" height="34" rx="6" class="viz-box"/><text x="242" y="161" text-anchor="middle" class="viz-label">w</text>
<rect x="280" y="138" width="60" height="34" rx="6" class="viz-box-accent"/><text x="310" y="161" text-anchor="middle" class="viz-label">x</text>
<rect x="348" y="138" width="60" height="34" rx="6" class="viz-box-accent"/><text x="378" y="161" text-anchor="middle" class="viz-label">x</text>
<rect x="416" y="138" width="60" height="34" rx="6" class="viz-box"/><text x="446" y="161" text-anchor="middle" class="viz-label">y</text>
<text x="8" y="216" class="viz-label">A pushdown automaton</text>
<text x="8" y="236" class="viz-label-muted">pushes through v, pops through x;</text>
<text x="8" y="254" class="viz-label-muted">repeat both and the stack still balances.</text>
<text x="8" y="272" class="viz-tick">accepted, at any pump count</text>
<text x="330" y="216" class="viz-label">A bounded-context memoriser</text>
<text x="330" y="236" class="viz-label-muted">has seen strings up to one length;</text>
<text x="330" y="254" class="viz-label-muted">the pumped string is longer than any.</text>
<text x="330" y="272" class="viz-tick">no reason for the answer to hold</text>
<text x="320" y="310" text-anchor="middle" class="viz-label-muted">The first behaviour is forced by having the grammar; the probe checks for it.</text>
</svg>
<figcaption>Illustrative: the standard decomposition of a long string in the context-free pumping lemma, with the two behaviours the probe distinguishes.</figcaption>
</figure>

Two things about the argument matter for models. The first is that it is about memory, not about training. A machine with a bounded number of states cannot recognise a language that needs unbounded counting, however it was built, and more examples of the language do not add states. The second is that the argument is constructive: it tells you what string to build to expose the limit. Take a string the machine handles and repeat its middle. If the machine has the grammar, the answer is forced. If it does not, the answer will drift, and it will drift at a length that reveals how much memory the machine actually has.

## What the benchmark found

Delétang and colleagues ran the closest thing to this test at scale in [Neural Networks and the Chomsky Hierarchy](https://arxiv.org/abs/2207.02098), training 20,910 models across fifteen tasks arranged by the hierarchy and testing on inputs longer than anything seen in training. The finding is the one the lemma predicts. Recurrent networks and transformers failed to generalise on tasks above the regular level. Networks with an explicit counter, the LSTM family, handled regular tasks and counter languages. Only networks with an external memory, a stack or a tape, generalised on context-free and context-sensitive tasks. The grouping by hierarchy level forecast which architectures would generalise, independently of data or compute, which is a polite way of saying that the limits are formal properties and not training bugs.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Length generalisation by architecture and task class, as summarised from the Chomsky hierarchy benchmark</title>
<desc id="f2-d">A matrix with architectures as rows, RNN, Transformer, LSTM, Stack-RNN, Tape-RNN, and task classes as columns, regular, counter, context-free, context-sensitive. Filled cells mark where the paper reports generalisation to longer inputs: RNN and Transformer on regular tasks only, with the paper noting transformers struggling even there on some tasks; LSTM on regular and counter; Stack-RNN on regular, counter and context-free; Tape-RNN on all four.</desc>
<text x="0" y="18" class="viz-title">Memory decides the class a model can generalise on</text>
<text x="230" y="52" text-anchor="middle" class="viz-tick">REGULAR</text>
<text x="330" y="52" text-anchor="middle" class="viz-tick">COUNTER</text>
<text x="440" y="52" text-anchor="middle" class="viz-tick">CONTEXT-FREE</text>
<text x="565" y="52" text-anchor="middle" class="viz-tick">CONTEXT-SENSITIVE</text>
<line x1="0" y1="60" x2="640" y2="60" class="viz-axis"/>
<text x="20" y="88" class="viz-label">RNN</text>
<rect x="222" y="74" width="16" height="16" rx="3" class="viz-f1"/><rect x="322" y="74" width="16" height="16" rx="3" class="viz-box"/><rect x="432" y="74" width="16" height="16" rx="3" class="viz-box"/><rect x="557" y="74" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="100" x2="640" y2="100" class="viz-grid"/>
<text x="20" y="128" class="viz-label">Transformer</text>
<rect x="222" y="114" width="16" height="16" rx="3" class="viz-f1"/><rect x="322" y="114" width="16" height="16" rx="3" class="viz-box"/><rect x="432" y="114" width="16" height="16" rx="3" class="viz-box"/><rect x="557" y="114" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="140" x2="640" y2="140" class="viz-grid"/>
<text x="20" y="168" class="viz-label">LSTM</text>
<rect x="222" y="154" width="16" height="16" rx="3" class="viz-f1"/><rect x="322" y="154" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="154" width="16" height="16" rx="3" class="viz-box"/><rect x="557" y="154" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="180" x2="640" y2="180" class="viz-grid"/>
<text x="20" y="208" class="viz-label">Stack-RNN</text>
<rect x="222" y="194" width="16" height="16" rx="3" class="viz-f1"/><rect x="322" y="194" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="194" width="16" height="16" rx="3" class="viz-f1"/><rect x="557" y="194" width="16" height="16" rx="3" class="viz-box"/>
<line x1="0" y1="220" x2="640" y2="220" class="viz-grid"/>
<text x="20" y="248" class="viz-label">Tape-RNN</text>
<rect x="222" y="234" width="16" height="16" rx="3" class="viz-f1"/><rect x="322" y="234" width="16" height="16" rx="3" class="viz-f1"/><rect x="432" y="234" width="16" height="16" rx="3" class="viz-f1"/><rect x="557" y="234" width="16" height="16" rx="3" class="viz-f1"/>
<line x1="0" y1="260" x2="640" y2="260" class="viz-grid"/>
<rect x="20" y="276" width="12" height="12" rx="3" class="viz-f1"/><text x="38" y="287" class="viz-label-muted">generalises to longer inputs</text>
<rect x="260" y="276" width="12" height="12" rx="3" class="viz-box"/><text x="278" y="287" class="viz-label-muted">does not</text>
</svg>
<figcaption>Source: the findings stated in Delétang et al., <a href="https://arxiv.org/abs/2207.02098">Neural Networks and the Chomsky Hierarchy</a>, 2023, summarised as a matrix; the paper's per-task accuracies are finer than this and the summary follows its abstract.</figcaption>
</figure>

The transformer row is the one people find hardest to accept, because transformers do so much else. But a transformer run once over an input has a fixed number of layers and a fixed-width state per position, and the lemma does not care what else it can do. More data moves a transformer along its row, toward doing the regular tasks it can already do more reliably. It does not move it down the table, because down the table is a memory it does not have.

## The doubling probe

The test that falls out of the lemma is what I call the doubling probe. Take a set of strings the model handles correctly, at the lengths it was trained on. Identify the pumpable middle for each, which for bracket matching is a balanced inner span and for a regular language is any section between repeated automaton states. Pump the middle two, four and eight times, and plot accuracy against the pump count.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The doubling probe curve for a memoriser and for a grammar-learner</title>
<desc id="f3-d">Accuracy against pump count on a log scale of one, two, four, eight, sixteen. A grammar-learner's line stays flat near one hundred percent. A memoriser's line stays high while the pumped string is within the training length, then falls off a cliff toward chance once the pumped length exceeds it. A vertical marker at the cliff is labelled as the model's effective memory.</desc>
<text x="0" y="18" class="viz-title">Flat means the grammar; a cliff means the lengths</text>
<text x="0" y="36" class="viz-sub">Accuracy on pumped strings by pump count; illustrative</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">has the grammar</text>
<line x1="490" y1="31" x2="504" y2="31" class="viz-s4"/><text x="510" y="35" class="viz-label-muted">memorised lengths</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">50%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">1</text>
<text x="192" y="288" text-anchor="middle" class="viz-tick">2</text>
<text x="328" y="288" text-anchor="middle" class="viz-tick">4</text>
<text x="464" y="288" text-anchor="middle" class="viz-tick">8</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">16</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Pump count</text>
<polyline points="56,60 192,61 328,62 464,63 600,64" class="viz-s1"/>
<polyline points="56,60 192,64 260,80 328,150 396,215 464,240 600,250" class="viz-s4"/>
<line x1="300" y1="56" x2="300" y2="264" class="viz-s4"/>
<text x="292" y="236" text-anchor="end" class="viz-tick">the cliff: training length,</text>
<text x="292" y="252" text-anchor="end" class="viz-tick">effective memory</text>
</svg>
<figcaption>Illustrative: the two curves the probe can produce, constructed from the definitions in the text; the position of the cliff is what the probe measures.</figcaption>
</figure>

The curve has two readings and one number. A flat line means the model has the grammar: the pumped strings are still in the language, the model still accepts them, and the lemma's forced behaviour is what it does. A cliff means the model has the lengths: it handled the training distribution by memorising what strings of those lengths look like, and once the pumped string is longer than anything it saw, it has nothing to say. The position of the cliff is the number, because it is the length beyond which the model's memory of the task runs out, and that is its effective memory for the task in the sense the lemma uses the word.

The probe is cheap because it reuses the model's own successes. There is no need to construct adversarial strings or to search for failures; the lemma says where the failure has to be, if there is one, and the probe goes there directly. It also separates two claims that evaluation sets usually blur: that a model is accurate on a task, and that it has learned the structure the task is defined by. A model can be very accurate on a length-bounded benchmark and fail the probe at pump count two, and that model has not learned to parse, whatever the benchmark says.

One refinement makes the probe sharper. Pumping the middle keeps the string in the language, so a grammar-learner should keep saying yes; the complementary probe pumps only one of the two sections in a context-free language, which takes the string out of the language, so a grammar-learner should switch to no. A model that says yes to both has not learned the grammar; it has learned that long strings with familiar pieces are probably fine. Running both halves distinguishes a model that recognises the structure from one that recognises the vocabulary, and the second is far more common than benchmark scores suggest.

## Why the proof is the point

My paper on CYK recognition includes pumping lemma proofs about the limits of context-free recognition, and relating that work to transformer-based parsing is where the probe came from: the same argument that bounds what a pushdown automaton can recognise bounds what any bounded-memory model can, and the argument is constructive enough to run. That is also the clearest example I have of what a mathematics degree teaches that a bootcamp skips. Not the lemma, which is a page in any textbook, but the habit of asking what a proof of impossibility says you can measure, and then measuring it.

The probe's limit is the one the lemma has. It detects the absence of the grammar; it cannot certify its presence, because a flat line to pump count sixteen is consistent with a cliff at thirty-two. What it can do is push the cliff out until it is beyond any input the model will see in use, and report where it was found. A model that parses in production should come with that number, and the lemma is how you get it.
