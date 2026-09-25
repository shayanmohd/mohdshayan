---
title: What a student workshop actually rewards
date: 2026-08-11
summary: The ACL 2026 Student Research Workshop took 130 of 402 submissions. Its public process says what it selects for: one thing proved, one measured, one related to the field.
tags: Research, ACL, Writing
topic: NLP & Parsing
draft: false
---

My undergraduate paper on the CYK algorithm was selected for the ACL 2026 Student Research Workshop, and the most useful thing I learned from the process was not about parsing. It was about what a workshop like that is built to select for, which you can read off its public process without any inside knowledge at all. The [preface to the proceedings](https://aclanthology.org/2026.acl-srw.0.pdf) gives the numbers: 402 submissions, 379 direct and 23 committed through ACL Rolling Review, 130 accepted, an acceptance rate of 34.7% against 32.2% the year before, 109 archival papers and 21 non-archival, and 114 submissions that went through the optional pre-submission mentoring.

Those numbers describe a selective venue that nonetheless explicitly welcomes work in progress from students. That combination is unusual, and it tells you a lot about what a reviewer at such a venue is looking for.

## What the process says

The [call for papers](https://acl2026-srw.github.io/cfp) laid out the year. Pre-submission mentoring closed on 13 February 2026 and feedback went back on 26 February. Direct submissions closed on 19 March, ARR commitments on 16 April, reviews were returned on 24 April, and the accepted list was published on 10 June, ahead of the workshop with ACL in San Diego in early July.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The ACL 2026 Student Research Workshop calendar</title>
<desc id="f1-d">A timeline with six dates in 2026: mentoring deadline 13 February, mentoring feedback 26 February, direct submission deadline 19 March, ARR commitment deadline 16 April, reviews returned 24 April, accepted papers listed 10 June.</desc>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="60" cy="90" r="6" class="viz-d1"/>
<text x="60" y="64" text-anchor="middle" class="viz-tick">13 Feb</text>
<text x="60" y="46" text-anchor="middle" class="viz-label">Mentoring closes</text>
<circle cx="150" cy="90" r="6" class="viz-d1"/>
<text x="150" y="124" text-anchor="middle" class="viz-tick">26 Feb</text>
<text x="150" y="142" text-anchor="middle" class="viz-label">Feedback sent</text>
<circle cx="260" cy="90" r="6" class="viz-d1"/>
<text x="260" y="64" text-anchor="middle" class="viz-tick">19 Mar</text>
<text x="260" y="46" text-anchor="middle" class="viz-label">Submission</text>
<circle cx="380" cy="90" r="6" class="viz-dgray"/>
<text x="380" y="124" text-anchor="middle" class="viz-tick">16 Apr</text>
<text x="380" y="142" text-anchor="middle" class="viz-label">ARR commitment</text>
<circle cx="470" cy="90" r="6" class="viz-dgray"/>
<text x="470" y="64" text-anchor="middle" class="viz-tick">24 Apr</text>
<text x="470" y="46" text-anchor="middle" class="viz-label">Reviews back</text>
<circle cx="580" cy="90" r="6" class="viz-dgray"/>
<text x="580" y="124" text-anchor="middle" class="viz-tick">10 Jun</text>
<text x="580" y="142" text-anchor="middle" class="viz-label">Accepted list</text>
</svg>
<figcaption>Source: <a href="https://acl2026-srw.github.io/cfp">ACL 2026 SRW call for papers</a>.</figcaption>
</figure>

Three features of that process matter. First, mentoring is optional and comes before submission, which means the venue expects that a student's writing, not their idea, is the likeliest weak point, and offers to fix it early. Second, every submission gets full double-blind review, or arrives with ARR reviews already attached, which means the venue is not grading effort; it is checking claims. Third, work in progress is explicitly welcome, which means the venue would rather have a small result it can verify than a large one it cannot.

A fourth feature hides in the archival split. Of the 130 accepted papers, 21 are non-archival: the authors present at the workshop, get the reviews and the audience, and keep the right to publish the work somewhere else later. That option exists because the venue knows that student work is often the first version of something, and it would rather see the first version presented than held back for a main conference that may be a year away. For a student choosing between the two, the archival choice is a statement about whether this version is the finished statement of the result or a milestone on the way to one, and it is worth deciding before submission rather than after acceptance.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">ACL 2026 SRW submissions and acceptances</title>
<desc id="f2-d">Two columns: 402 submissions and 130 accepted papers, an acceptance rate of 34.7%. Of the accepted papers, 109 are archival and 21 non-archival.</desc>
<text x="0" y="18" class="viz-title">Submitted and accepted, 2026</text>
<text x="0" y="36" class="viz-sub">Papers; 34.7% accepted, against 32.2% in 2025</text>
<line x1="56" y1="250" x2="600" y2="250" class="viz-axis"/>
<path d="M195.3 80.8 V77.2 a4 4 0 0 1 4 -4 H215.3 a4 4 0 0 1 4 4 V250 H195.3 Z" class="viz-fgray"/>
<text x="207.3" y="66.4" text-anchor="middle" class="viz-value">402</text>
<text x="207.3" y="272" text-anchor="middle" class="viz-label-muted">Submitted</text>
<path d="M436.7 195.3 V191.7 a4 4 0 0 1 4 -4 H456.7 a4 4 0 0 1 4 4 V250 H436.7 Z" class="viz-f1"/>
<text x="448.7" y="180.9" text-anchor="middle" class="viz-value">130</text>
<text x="448.7" y="272" text-anchor="middle" class="viz-label-muted">Accepted</text>
<text x="470" y="215" class="viz-label-muted">109 archival</text>
<text x="470" y="233" class="viz-label-muted">21 non-archival</text>
</svg>
<figcaption>Source: <a href="https://aclanthology.org/2026.acl-srw.0.pdf">Proceedings of the ACL 2026 Student Research Workshop, preface</a>.</figcaption>
</figure>

## Prove, measure, relate

What a reviewer can check falls into three kinds. A claim with a proof, which they check by reading the proof. A claim with a measurement, which they check by reading the table and the method that produced it. A claim that places the work against a current line of research, which they check against what they already know. I have come to think of a paper that clears a venue like this as one that contains exactly one strong claim of each kind, stated so that all three are findable from the abstract. I call it the prove-measure-relate triad, and I use it as a self-review before anything goes out.

The triad is not a template for the paper's sections. It is a test of whether the paper has a checkable spine. A reviewer with three papers to read tonight is looking for the thing they can verify, and a paper that makes six claims of which two are checkable is weaker on all six than a paper that makes three claims of which three are checkable.

The reason the three kinds are different is that each fails differently and each is checked with a different tool. A proof fails by having a gap, and the reviewer finds it by reading slowly. A measurement fails by measuring the wrong thing or by having no baseline, and the reviewer finds it by asking what the table would look like if the claim were false. A relation fails by placing the work next to something it does not resemble, and the reviewer finds it because they know the neighbouring work better than the author does. A paper that leans on one kind alone leaves two of the reviewer's tools idle, and an idle reviewer looks for other things to say.

Applied to the CYK paper, the spine looks like this. The proved claim: a deterministic CYK recogniser built from first principles runs in O(n cubed times the grammar size) time and O(n squared) space, with the proof written out rather than cited. The measured claim: that implementation benchmarked against LR(1), Earley and recursive descent parsers on the same grammars, with the comparison in a table. The related claim: the probabilistic extension, Viterbi decoding over a PCFG in the log domain, placed against Compound PCFGs and against transformer-constrained neural parsing, with the Pumping Lemma proofs marking where context-free recognition stops. Each claim is one sentence in the abstract and one section in the paper.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The triad mapped onto the paper</title>
<desc id="f3-d">Three boxes in a row, labelled prove, measure and relate, each with the claim from the CYK paper that fills it: the complexity proof, the benchmark against three parsers, and the placement against Compound PCFGs and neural parsing. Below each box, the reviewer's check: read the proof, read the table, compare with the field.</desc>
<rect x="8" y="30" width="196" height="120" rx="8" class="viz-box-accent"/>
<text x="106" y="56" text-anchor="middle" class="viz-label">Prove</text>
<text x="106" y="82" text-anchor="middle" class="viz-label-muted">O(n^3 |G|) time</text>
<text x="106" y="100" text-anchor="middle" class="viz-label-muted">O(n^2) space</text>
<text x="106" y="118" text-anchor="middle" class="viz-label-muted">proof written out</text>
<rect x="222" y="30" width="196" height="120" rx="8" class="viz-box-accent"/>
<text x="320" y="56" text-anchor="middle" class="viz-label">Measure</text>
<text x="320" y="82" text-anchor="middle" class="viz-label-muted">CYK against LR(1),</text>
<text x="320" y="100" text-anchor="middle" class="viz-label-muted">Earley, recursive descent</text>
<text x="320" y="118" text-anchor="middle" class="viz-label-muted">one table, one method</text>
<rect x="436" y="30" width="196" height="120" rx="8" class="viz-box-accent"/>
<text x="534" y="56" text-anchor="middle" class="viz-label">Relate</text>
<text x="534" y="82" text-anchor="middle" class="viz-label-muted">PCFG Viterbi in log space</text>
<text x="534" y="100" text-anchor="middle" class="viz-label-muted">against Compound PCFGs</text>
<text x="534" y="118" text-anchor="middle" class="viz-label-muted">and neural parsing</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="106" y="204" text-anchor="middle" class="viz-tick">reviewer reads the proof</text>
<text x="320" y="204" text-anchor="middle" class="viz-tick">reviewer reads the table</text>
<text x="534" y="204" text-anchor="middle" class="viz-tick">reviewer vs the field</text>
<text x="320" y="240" text-anchor="middle" class="viz-label-muted">each claim is one sentence in the abstract and one section in the paper</text>
</svg>
<figcaption>Illustrative: the spine of the paper as the triad sees it, not a diagram of its table of contents.</figcaption>
</figure>

## What the triad cuts

The value of the test is in what it refuses. A second measurement that does not support one of the three claims is a distraction, even if it took a week. A background section that explains what a context-free grammar is belongs in a dissertation and not in a workshop paper, because no reviewer at ACL needs it and every reviewer will notice the pages it costs. A claim of novelty without one of the three kinds of support behind it is the claim reviewers are best at rejecting, and student papers make it most often, because a student has been told for four years that the point is to be original.

The triad also cuts the temptation that undergraduate work is most prone to, which is doing everything. A B.Tech dissertation wants breadth: the theory, the implementation, the extensions, the comparisons, the literature. A workshop paper wants three checkable things. The same body of work can be both, if the paper is the subset and the dissertation is the whole. Mine was, and the discipline of choosing the subset was harder than any of the proofs.

## What it does not reward

It is worth being plain about what a venue like this does not select for, because the public numbers make it tempting to over-read them. An acceptance rate near a third is not a measure of how good the accepted papers are; it is a measure of how many checkable papers arrived. A venue that welcomes work in progress is not rewarding ambition; it is rewarding a student who knows exactly which part of their ambition is finished. And the mentoring programme, with 114 submissions in it, is the venue saying the quiet part: the difference between accepted and rejected student work is very often the writing, and the writing is fixable.

If I had to compress the whole process into one instruction for a student about to submit, it would be this. Before you write the abstract, write three sentences: here is what I proved, here is what I measured, here is what this sits next to. If any of the three is blank, the paper is not ready, and no amount of additional work on the other two will fill it. If all three are full, the abstract writes itself, and the reviewer will find each claim exactly where they expect to.
