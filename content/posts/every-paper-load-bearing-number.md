---
title: Every paper has one load-bearing number
date: 2026-09-17
summary: A paper's claim rests on one number that, a fifth worse, would have sunk it. Find that number first, ask four questions about how it was measured, and read the rest as context.
tags: Research, Reading Papers, Evaluation
draft: false
---

Every research paper I have read closely, and the one I have written, rests on a single number. It is the entry in one table that, had it come out a fifth worse, would have ended the submission, and everything else in the paper, the related work, the notation, the third ablation, exists to make that number credible. Reading a paper is the act of finding that number and checking how it was measured. Done in that order, it takes a quarter of the time the front-to-back approach does, and it catches the failures that the front-to-back approach reads straight past.

## Why the number matters more than the prose

Kapoor and Narayanan's survey of [leakage in machine-learning-based science](https://arxiv.org/abs/2207.07048) found that across seventeen fields, 329 papers had a data leakage problem that undermined their central result, and the [living version of the survey](https://reproducible.cs.princeton.edu/) they maintain had grown to 648 papers across thirty fields by September 2026. In every one of those papers the prose was fine. The argument was coherent, the method was described, the related work was cited. The failure was in how one number was produced: a test set that overlapped the training set, a feature that would not exist at prediction time, a split that leaked the future into the past. The number said the method worked, and the number was wrong.

<figure class="chart">
<svg viewBox="0 0 640 440" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Papers with a documented leakage problem, by field</title>
<desc id="f1-d">Horizontal bars: law 156, molecular biology 67, medicine 57, radiology 55, neuropsychiatry 54, clinical epidemiology 48, neuroimaging 33, genomics 23, computer security 22, and 133 across the remaining twenty-one fields, for a total of 648 papers in thirty fields.</desc>
<text x="0" y="18" class="viz-title">Where the load-bearing number failed</text>
<text x="0" y="36" class="viz-sub">Papers with a leakage problem in the central result, by field, September 2026</text>
<line x1="176" y1="52" x2="176" y2="392" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Law</text>
<path d="M176 58 H572 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="568" y="53" text-anchor="end" class="viz-value">156</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Molecular biology</text>
<path d="M176 92 H344 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="364" y="107" class="viz-value">67</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Medicine</text>
<path d="M176 126 H318 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="338" y="141" class="viz-value">57</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Radiology</text>
<path d="M176 160 H313 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="333" y="175" class="viz-value">55</text>
<text x="166" y="209" text-anchor="end" class="viz-label">Neuropsychiatry</text>
<path d="M176 194 H310 a4 4 0 0 1 4 4 V210 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="330" y="209" class="viz-value">54</text>
<text x="166" y="243" text-anchor="end" class="viz-label">Clinical epidemiology</text>
<path d="M176 228 H295 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="315" y="243" class="viz-value">48</text>
<text x="166" y="277" text-anchor="end" class="viz-label">Neuroimaging</text>
<path d="M176 262 H257 a4 4 0 0 1 4 4 V278 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="277" y="277" class="viz-value">33</text>
<text x="166" y="311" text-anchor="end" class="viz-label">Genomics</text>
<path d="M176 296 H231 a4 4 0 0 1 4 4 V312 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="251" y="311" class="viz-value">23</text>
<text x="166" y="345" text-anchor="end" class="viz-label">Computer security</text>
<path d="M176 330 H228 a4 4 0 0 1 4 4 V346 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="248" y="345" class="viz-value">22</text>
<text x="166" y="379" text-anchor="end" class="viz-label">21 other fields</text>
<path d="M176 364 H513 a4 4 0 0 1 4 4 V380 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="533" y="379" class="viz-value">133</text>
<text x="0" y="424" class="viz-label-muted">648 papers in 30 fields. In each, the prose held and the number did not.</text>
</svg>
<figcaption>Source: the <a href="https://reproducible.cs.princeton.edu/">living leakage survey</a> maintained by Kapoor and Narayanan, read in September 2026; the original 2022 paper counted 329 papers in 17 fields.</figcaption>
</figure>

That is the case for reading numbers first. A paper's prose is written by people who believe the result, and it is persuasive in proportion to their belief. The number was produced by a procedure, and the procedure can be checked.

## Finding it

The load-bearing number is rarely labelled. It is the cell in the results table that the abstract's claim points at, and the way to find it is to read the abstract, write down the claim in one sentence, and then go straight to the table that would have to contain the evidence for that sentence. Skip everything in between. The introduction, the related work and the method description are where the paper explains why the number should be believed; they are useless until you know which number.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The reading order, as a flow</title>
<desc id="f2-d">Five boxes in sequence: read the abstract and write the claim in one sentence; find the table cell the claim points at; read only the method section that produced that cell; ask the four questions; then, and only if the answers hold, read the rest as context.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Number first, prose last</text>
<rect x="8" y="50" width="112" height="60" rx="8" class="viz-box"/>
<text x="64" y="76" text-anchor="middle" class="viz-label">Abstract</text>
<text x="64" y="94" text-anchor="middle" class="viz-label-muted">claim, one line</text>
<line x1="122" y1="80" x2="134" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="138" y="50" width="112" height="60" rx="8" class="viz-box-accent"/>
<text x="194" y="76" text-anchor="middle" class="viz-label">The cell</text>
<text x="194" y="94" text-anchor="middle" class="viz-label-muted">the number it rests on</text>
<line x1="252" y1="80" x2="264" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="268" y="50" width="112" height="60" rx="8" class="viz-box"/>
<text x="324" y="76" text-anchor="middle" class="viz-label">Its method</text>
<text x="324" y="94" text-anchor="middle" class="viz-label-muted">only what made it</text>
<line x1="382" y1="80" x2="394" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="398" y="50" width="112" height="60" rx="8" class="viz-box"/>
<text x="454" y="76" text-anchor="middle" class="viz-label">Four questions</text>
<text x="454" y="94" text-anchor="middle" class="viz-label-muted">pass or bookmark</text>
<line x1="512" y1="80" x2="524" y2="80" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="528" y="50" width="104" height="60" rx="8" class="viz-box"/>
<text x="580" y="76" text-anchor="middle" class="viz-label">The rest</text>
<text x="580" y="94" text-anchor="middle" class="viz-label-muted">as context</text>
<text x="320" y="150" text-anchor="middle" class="viz-label-muted">Related work, notation and ablations are read last, and only if the number holds.</text>
<text x="320" y="180" text-anchor="middle" class="viz-tick">a quarter of the time, and it finds the failures front to back misses</text>
</svg>
<figcaption>Illustrative: the order I read in; it is the reverse of the order papers are written in.</figcaption>
</figure>

The "fifth worse" test is how to be sure you have the right cell. Ask, for each candidate number: if this were twenty percent worse, would the paper still have been submitted? For most numbers in a results table the answer is yes; they are supporting evidence. For one, usually the comparison against the strongest baseline on the headline benchmark, the answer is no. That is the load-bearing number.

## The four questions

Once found, the number gets four questions, and the answers decide what the paper is.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The four-question card beside a mock results table</title>
<desc id="f3-d">On the left, a small results table with three rows, a baseline at 71.2, a second baseline at 72.5, and the paper's method at 74.8, with the 74.8 cell highlighted as the load-bearing number. On the right, a card with four questions: what was compared, on how many items, with what variance, and who ran the baseline.</desc>
<text x="0" y="18" class="viz-title">One cell, four questions</text>
<rect x="8" y="40" width="290" height="180" rx="8" class="viz-box"/>
<text x="24" y="66" class="viz-tick">METHOD</text>
<text x="200" y="66" class="viz-tick">ACCURACY</text>
<line x1="24" y1="74" x2="282" y2="74" class="viz-grid"/>
<text x="24" y="100" class="viz-label-muted">Baseline A, as reported</text>
<text x="200" y="100" class="viz-label-muted">71.2</text>
<text x="24" y="134" class="viz-label-muted">Baseline B, re-run</text>
<text x="200" y="134" class="viz-label-muted">72.5</text>
<rect x="190" y="152" width="60" height="26" rx="6" class="viz-box-accent"/>
<text x="24" y="170" class="viz-label">This paper</text>
<text x="200" y="170" class="viz-value">74.8</text>
<text x="24" y="204" class="viz-tick">the highlighted cell is the one a fifth worse would sink</text>
<rect x="332" y="40" width="300" height="180" rx="8" class="viz-box-ink"/>
<text x="348" y="70" class="viz-on-ink">1. What was compared, tuned how?</text>
<text x="348" y="106" class="viz-on-ink">2. On how many items?</text>
<text x="348" y="142" class="viz-on-ink">3. With what variance? Seeds, intervals.</text>
<text x="348" y="178" class="viz-on-ink">4. Who ran the baseline?</text>
<text x="320" y="256" text-anchor="middle" class="viz-label-muted">Four answers: a result to build on. Fewer: a preprint to bookmark.</text>
<text x="320" y="284" text-anchor="middle" class="viz-tick">the table is a mock; the questions are the ones a reviewer asked of mine</text>
</svg>
<figcaption>Illustrative: a mock table and the four-question card; the values are invented to show the shape.</figcaption>
</figure>

What was compared, and how was the comparison tuned? A method that beats a baseline the authors configured carelessly has beaten nothing. On how many items? A two-point gain on a thousand test items is a different claim from a two-point gain on fifty. With what variance? If the number is a single run, the gain may be a lucky seed, and a paper that reports no spread is asking to be trusted rather than checked.

And who ran the baseline? A baseline number copied from another paper, measured on a different split, with a different tokeniser or preprocessing, is not a comparison; it is two numbers that happen to share a column.

A paper that answers all four is a result to build on. A paper that cannot is a preprint to bookmark, which is not an insult. Most interesting ideas are first published before their number can be trusted, and the bookmark is the correct response: come back when someone has re-run it.

## How a number goes wrong

The survey's own worked example shows how the load-bearing number fails while the prose holds. In civil war prediction, a series of papers reported that complex machine learning models substantially outperformed the logistic regression models political scientists had used for decades. The claim was specific, the tables were clear, and the argument in the text was reasonable. When Kapoor and Narayanan re-ran the comparisons, every one of the claimed improvements disappeared, because the pipelines had leaked information across the train-test split: imputation done on the whole dataset before splitting, or features that encoded the outcome. The load-bearing number in each paper was the gap between the complex model and the simple one, and the gap was an artefact of the procedure that produced it. No amount of reading the introduction would have found that. Reading the method section that produced the number, with the second question in hand, would.

It is also worth saying where the number lives when the paper has no results table. In a systems paper it is a latency or a throughput, usually in a figure rather than a table, and the four questions become: against what configuration, on what workload, over how many runs, and who tuned the baseline system. In a theory paper the analogue is the lemma the main theorem rests on, the one step in the proof that would collapse the result if it failed, and the questions become whether the lemma's conditions match the theorem's, and whether the step is proved or cited. The shape is the same: one place carries the weight, and the reading starts there.

## What carried my own paper

I say this as someone who has been on the other side of the questions. My paper on CYK parsing at the ACL 2026 Student Research Workshop made a claim that rested on one table: the benchmark comparison between CYK and three other parsers, LR(1), Earley and recursive descent, on a shared grammar. Every other section of the paper, the background on normal forms, the complexity analysis, the discussion, was context for that table. A reviewer who read it the way this post describes would have gone to the table first, and what the table needed in order to be trusted was exactly the four answers: the same grammar and sentences for every parser, the number of sentences, the spread across runs, and the fact that I had run all four parsers myself rather than quoting three of the numbers from elsewhere.

Knowing that the table was the paper changed how I wrote it. The method section that produced the table got more care than the introduction, the variance got reported even where it was boring, and the sentence in the abstract was written to point at the cell. It is the discipline the [classic three-pass reading method](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf) gets at from the reader's side, and the load-bearing number is what it is looking for. Find it first. Everything else in the paper is there to help you check it.
