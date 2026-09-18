---
title: Chain of thought is the memory transformers lack
date: 2026-08-15
summary: A fixed-depth transformer has no working memory that grows with the input, so it cannot recognise regular languages at any length. Chain of thought writes that memory as tokens.
tags: Transformers, Chain Of Thought, Formal Languages
draft: false
---

A transformer of fixed depth, run once over an input, has no memory that grows with the input. Every layer sees the whole sequence at once and passes a fixed-width vector per position to the next, and the number of layers does not change when the input gets longer. That is a stronger limitation than it sounds. It means the model cannot, in general, simulate a finite-state machine over an arbitrarily long string, which means it cannot recognise every regular language at every length, let alone match brackets or check a grammar, tasks that need a stack. Chain of thought is the workaround, and the theory of the last few years says exactly what kind of workaround it is: it writes the missing memory into the output, one token at a time, and the number of tokens written is a hard budget on what the model can compute.

## The ladder

Merrill and Sabharwal's [ICLR 2024 paper](https://arxiv.org/abs/2310.07923) gives the result as a ladder with three rungs, indexed by how many intermediate tokens the model is allowed to generate before answering. With a logarithmic number of steps in the input length, the limits of a standard transformer move only slightly. With a linear number of steps, the model gains a clearly new ability: it can recognise every regular language, which is to say it can simulate any finite-state machine over the input, one token per state transition. And with a polynomial number of steps, a transformer with a generalised pre-norm recognises exactly the class of problems solvable in polynomial time. The characterisation is exact, which is rare in this area, and it says something specific about parsing.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Chain-of-thought length against the language class gained, as a step chart</title>
<desc id="f1-d">A staircase with four levels. No chain of thought: below the regular languages, unable to simulate a finite-state machine in general. Logarithmic steps: only slightly more. Linear steps: all regular languages. Polynomial steps: all of polynomial time. The horizontal axis is the number of intermediate tokens as a function of input length; the vertical axis is the class of languages recognised.</desc>
<text x="0" y="18" class="viz-title">Each rung of memory written buys a class of languages</text>
<text x="0" y="36" class="viz-sub">Intermediate tokens as a function of input length n, against what becomes recognisable</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/>
<text x="90" y="288" text-anchor="middle" class="viz-tick">none</text>
<text x="230" y="288" text-anchor="middle" class="viz-tick">log n</text>
<text x="370" y="288" text-anchor="middle" class="viz-tick">linear in n</text>
<text x="530" y="288" text-anchor="middle" class="viz-tick">polynomial in n</text>
<polyline points="56,236 160,236 160,222 300,222 300,150 440,150 440,64 600,64" class="viz-s1"/>
<rect x="56" y="236" width="104" height="28" class="viz-band"/>
<rect x="160" y="222" width="140" height="42" class="viz-band"/>
<rect x="300" y="150" width="140" height="114" class="viz-band"/>
<rect x="440" y="64" width="160" height="200" class="viz-band"/>
<text x="108" y="256" text-anchor="middle" class="viz-tick">below regular</text>
<text x="230" y="212" text-anchor="middle" class="viz-label-muted">slightly more</text>
<text x="370" y="140" text-anchor="middle" class="viz-label">regular languages</text>
<text x="370" y="176" text-anchor="middle" class="viz-tick">any finite-state machine</text>
<text x="520" y="54" text-anchor="middle" class="viz-label">everything in P</text>
<text x="520" y="90" text-anchor="middle" class="viz-tick">exact, with generalised pre-norm</text>
<text x="520" y="110" text-anchor="middle" class="viz-tick">a stack fits here</text>
</svg>
<figcaption>Source: the stated results of Merrill and Sabharwal, <a href="https://arxiv.org/abs/2310.07923">The Expressive Power of Transformers with Chain of Thought</a>, ICLR 2024; the heights are a schematic of class inclusion, not a measurement.</figcaption>
</figure>

Li, Liu, Zhou and Ma's [companion result](https://arxiv.org/abs/2402.12875) at the same conference gives the mechanism from the circuit side: a constant-depth transformer with constant-precision arithmetic and no chain of thought computes only what shallow parallel circuits compute, a class properly inside the one usually quoted, and a transformer that writes T intermediate tokens can compute anything a boolean circuit of size T can. Their framing is that chain of thought supplies inherently serial computation, and their experiments show accuracy on tasks that resist parallel evaluation, composing permutations, iterated squaring, evaluating a circuit, improving dramatically once the model is allowed to write its working out. The two papers say the same thing in two vocabularies. The transformer's forward pass is parallel and shallow. Serial memory has to be written down.

## The written stack rule

For parsing the consequence is a rule I call the written stack rule: if a task needs memory that grows with the input, a transformer must emit that memory as tokens, and the number of emitted tokens is a hard budget on the computation. A finite-state machine needs one state's worth of memory, so a linear scratchpad, one token per input symbol, is enough, and that is the second rung. A pushdown automaton needs a stack whose depth can grow with the input, so the scratchpad has to hold the stack, and a stack that is pushed and popped over the input needs the transcript of every push and pop, which is still linear in the input for a single pass but with the stack's contents repeated at each step if the model cannot look back, and that is where the budget starts to matter.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The same pushdown computation on a bracket string, drawn as an automaton with a stack and as a scratchpad transcript</title>
<desc id="f2-d">Left: a pushdown automaton reading the string open, open, close, open, close, close, with the stack drawn at each step growing to depth two, back to one, to two, to one, to zero. Right: a scratchpad transcript in which each step is written as a line: the symbol read and the stack contents after it, so that the stack exists as text. Both accept the string; the transcript is the stack written down.</desc>
<text x="0" y="18" class="viz-title">The stack has to exist somewhere</text>
<text x="8" y="52" class="viz-tick">AUTOMATON WITH A STACK</text>
<text x="8" y="80" class="viz-label-muted">input:  ( ( ) ( ) )</text>
<rect x="8" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="26" y="113" text-anchor="middle" class="viz-tick">(</text>
<rect x="52" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="70" y="113" text-anchor="middle" class="viz-tick">(</text>
<rect x="96" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="114" y="113" text-anchor="middle" class="viz-tick">)</text>
<rect x="140" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="158" y="113" text-anchor="middle" class="viz-tick">(</text>
<rect x="184" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="202" y="113" text-anchor="middle" class="viz-tick">)</text>
<rect x="228" y="96" width="36" height="24" rx="4" class="viz-box"/><text x="246" y="113" text-anchor="middle" class="viz-tick">)</text>
<text x="8" y="150" class="viz-label-muted">stack depth after each symbol:</text>
<rect x="8" y="160" width="36" height="14" class="viz-f1"/>
<rect x="52" y="160" width="36" height="14" class="viz-f1"/><rect x="52" y="176" width="36" height="14" class="viz-f1"/>
<rect x="96" y="160" width="36" height="14" class="viz-f1"/>
<rect x="140" y="160" width="36" height="14" class="viz-f1"/><rect x="140" y="176" width="36" height="14" class="viz-f1"/>
<rect x="184" y="160" width="36" height="14" class="viz-f1"/>
<text x="246" y="172" text-anchor="middle" class="viz-tick">empty</text>
<text x="8" y="222" class="viz-tick">the stack lives in the machine, unseen</text>
<text x="330" y="52" class="viz-tick">SCRATCHPAD TRANSCRIPT</text>
<rect x="330" y="64" width="302" height="200" rx="8" class="viz-box-accent"/>
<text x="346" y="90" class="viz-label-muted">read (   stack: [</text>
<text x="346" y="112" class="viz-label-muted">read (   stack: [[</text>
<text x="346" y="134" class="viz-label-muted">read )   stack: [</text>
<text x="346" y="156" class="viz-label-muted">read (   stack: [[</text>
<text x="346" y="178" class="viz-label-muted">read )   stack: [</text>
<text x="346" y="200" class="viz-label-muted">read )   stack: empty</text>
<text x="346" y="230" class="viz-label">end of input, stack empty: accept</text>
<text x="346" y="252" class="viz-tick">the stack lives in tokens, at a cost</text>
<text x="320" y="300" text-anchor="middle" class="viz-label-muted">Same computation; on the right every stack state is paid for in output tokens.</text>
</svg>
<figcaption>Illustrative: a Dyck string processed by a pushdown automaton and by a scratchpad that writes the stack; the transcript is what the written stack rule requires.</figcaption>
</figure>

The rule says what a scratchpad has to contain, which is more specific than "think step by step". For bracket matching, the scratchpad has to contain the stack, or at least its depth and the last unmatched symbol, after each input symbol; a scratchpad that writes only a running commentary without the stack state is not doing the computation, and a model that appears to match brackets from such a scratchpad is doing it from the forward pass, which the theory says will fail past some length. For grammar checking against a context-free grammar, the scratchpad has to contain whatever the parser's state is, which for a shift-reduce parser is a stack of partial constituents and for a CYK-style parser is a chart, and the chart is quadratic in the input, so a scratchpad that faithfully wrote it would need quadratically many tokens. That is the third rung, polynomial, and it is where the budget becomes a cost that shows up on the bill.

The budget also explains a pattern anyone who has used long reasoning traces has seen: the trace is mostly bookkeeping. A model matching brackets in its scratchpad writes the depth after every symbol, and most of those lines change nothing but are required, because a line skipped is a stack state the forward pass would have to hold on its own. That is not verbosity in the ordinary sense. It is the memory being written where the architecture can read it back, and the rule says a shorter trace that omits it is a trace that has quietly moved the work back into the part of the model that cannot do it.

## What this means for neural parsing

My paper related CYK recognition to what a transformer constrained by a grammar can and cannot do, and the written stack rule is the bridge between the two halves. A grammar-constrained decoder masks tokens against a pushdown automaton that runs beside the model, outside it; the automaton holds the stack, and the model never has to. That is why constrained decoding works for structure at any length: the memory the transformer lacks is supplied by a separate machine. Take the automaton away and ask the model to enforce the grammar itself, and the rule applies: it can do so only by writing the stack into its output, and the amount it writes bounds the depth it can handle.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Accuracy against problem size for a serial task with and without chain of thought, illustrative of the reported pattern</title>
<desc id="f3-d">Two curves against problem size. Without chain of thought, accuracy is high at small sizes and falls toward chance as the size grows past what the forward pass can hold. With chain of thought proportional to the size, accuracy stays high across the range. A vertical marker shows the size at which the two curves separate.</desc>
<text x="0" y="18" class="viz-title">Without the written memory, accuracy falls with size</text>
<text x="0" y="36" class="viz-sub">Accuracy on a serial task by input size, illustrative</text>
<line x1="330" y1="31" x2="344" y2="31" class="viz-s1"/><text x="350" y="35" class="viz-label-muted">with chain of thought</text>
<line x1="500" y1="31" x2="514" y2="31" class="viz-s4"/><text x="520" y="35" class="viz-label-muted">without</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100%</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">75%</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">50%</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">25%</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="288" text-anchor="middle" class="viz-tick">small</text>
<text x="600" y="288" text-anchor="middle" class="viz-tick">large</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Input size</text>
<polyline points="56,60 150,60 250,62 350,64 450,66 550,68 600,70" class="viz-s1"/>
<polyline points="56,62 120,70 180,96 240,130 300,160 360,180 420,192 480,198 540,202 600,204" class="viz-s4"/>
<line x1="180" y1="56" x2="180" y2="264" class="viz-s4"/>
<text x="188" y="250" class="viz-tick">where the forward pass runs out of memory</text>
<text x="592" y="222" text-anchor="end" class="viz-value">toward chance</text>
</svg>
<figcaption>Illustrative: the shape reported by Li et al. for permutation composition, iterated squaring and circuit evaluation; the curves are drawn from the paper's qualitative description, not its data tables.</figcaption>
</figure>

There is a practical corollary for anyone using chain of thought to get structure out of a model. Length of reasoning is not a knob to turn for quality; it is a memory allocation, and the task sets its size. A task that needs a stack of depth d needs a scratchpad that can hold depth d, and a token budget below that is not a slightly worse answer, it is a task the model cannot do. When a model with a short reasoning budget fails on long nested inputs and succeeds on short ones, the written stack rule says why, and the fix is either more tokens or an external automaton, which is what grammar-constrained decoding is.

## What the rule does not say

The rule is a statement about what must be written, not about what will be. A model allowed a linear scratchpad can recognise regular languages; nothing guarantees a given trained model uses its scratchpad that way, and the experiments in both papers are about models trained to. The theory draws the ceiling, and the ceiling is the useful part: it says which tasks are impossible without the written memory, at any model size, for reasons that no scaling will change, and it says how much memory each class of task needs. For a parser, the memory is a stack, the stack has to be written or held by a machine beside the model, and the tokens it costs are not overhead. They are the computation.
