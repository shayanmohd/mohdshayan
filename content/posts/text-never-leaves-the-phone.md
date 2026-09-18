---
title: The text never leaves the phone
date: 2026-09-13
summary: deAIfy strips the tells of machine writing on the device and calls a model only with the user's own key. Making that the default, not the fallback, changes three things at once.
tags: Privacy, React Native, On-Device
draft: false
---

deAIfy does one thing: it takes a piece of text and removes the marks that machine writing leaves behind, the long dashes, the curly quotes, the invisible characters, the filler words. Most of that is deterministic, and it runs entirely on the phone. The optional part, asking a language model to rewrite the text to sound more human, runs only when the user pastes in their own API key, and then it runs against that user's account, not mine. Choosing on-device as the default and the model as the exception, rather than the other way round, was the most consequential product decision in the tool, and it changed three things that I did not fully anticipate.

## Three things that disappear

The first thing that disappears is the leak. Text that never leaves the device cannot be intercepted, logged, retained, subpoenaed or used for training, because there is no server to do any of those things. A privacy policy for the on-device path is one sentence, and it is true.

The second is the bill. A deterministic pipeline costs nothing per use, so the tool has no marginal cost, which means it has no reason to meter, no reason to throttle, and no reason to gate features behind a subscription. The model path, when the user chooses it, is billed by their provider to their key, at whatever rate they have agreed. The tool itself never touches money.

The third is the account. There is nothing to sign up for, because there is nothing to bill and nothing to store. A tool with no account has no password database, no session tokens, no reset emails and no way to lose any of them.

<figure class="chart">
<svg viewBox="0 0 640 240" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The two paths through the tool, and the single point where bytes can leave</title>
<desc id="f1-d">Top path: text enters, a deterministic pipeline of transforms runs on the device, cleaned text comes out; nothing leaves. Bottom path, optional: with a user-supplied key, the text is sent to the user's chosen model provider under their account and the rewrite comes back; the egress point is marked and is the only one in the tool.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Default on the device, model by exception</text>
<rect x="8" y="50" width="120" height="48" rx="8" class="viz-box"/>
<text x="68" y="79" text-anchor="middle" class="viz-label">Text in</text>
<line x1="130" y1="74" x2="176" y2="74" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="180" y="50" width="200" height="48" rx="8" class="viz-box-accent"/>
<text x="280" y="70" text-anchor="middle" class="viz-label">Deterministic transforms</text>
<text x="280" y="88" text-anchor="middle" class="viz-label-muted">dashes, quotes, hidden characters</text>
<line x1="382" y1="74" x2="428" y2="74" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="432" y="50" width="200" height="48" rx="8" class="viz-box"/>
<text x="532" y="70" text-anchor="middle" class="viz-label">Cleaned text</text>
<text x="532" y="88" text-anchor="middle" class="viz-label-muted">nothing left the device</text>
<line x1="280" y1="100" x2="280" y2="140" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="300" y="126" class="viz-tick">only with the user's own key</text>
<rect x="180" y="144" width="200" height="48" rx="8" class="viz-box-ink"/>
<text x="280" y="164" text-anchor="middle" class="viz-on-ink">User's model provider</text>
<text x="280" y="182" text-anchor="middle" class="viz-on-ink">their account, their bill</text>
<circle cx="180" cy="168" r="6" class="viz-d4"/>
<text x="166" y="172" text-anchor="end" class="viz-label-muted">the egress point</text>
<text x="320" y="224" text-anchor="middle" class="viz-label-muted">One arrow leaves the device, and the user chooses whether it exists.</text>
</svg>
<figcaption>Illustrative: the tool's two paths as designed; the brick dot is the only place bytes can leave.</figcaption>
</figure>

## What the deterministic pass actually does

It helps to be concrete about what runs on the device, because the word deterministic hides how much of the job it covers. The pass is a table of rules applied in order. The dash rules take the four Unicode dash characters that keyboards never produce and word processors and models do, and replace each according to where it sits: between two words with spaces around it, a comma or a colon depending on what follows; between digits, a plain hyphen; at the end of a clause, a full stop. The quote rules turn curly quotation marks and apostrophes into their straight forms. The invisible rules strip zero-width spaces and joiners, soft hyphens, byte-order marks and non-breaking spaces, which are the characters that survive copy and paste and mark a passage as generated more reliably than any word does. The ellipsis character becomes three full stops. The filler rules remove or rewrite a list of phrases that appear in machine prose at many times their natural rate, and the list is the part of the table that gets edited most.

Every rule is a lookup, which is why the whole pass runs in a few milliseconds on a phone and why it can be shipped inside the app. A model cannot be shipped that way at useful quality on most phones yet, and it also cannot be read. The rule table can: the entire list of what the tool changes is short enough to print, and a user who wants to know exactly what will happen to their text can read it before pressing the button. That auditability is a property of the on-device path that the model path can never have, whichever key it runs under.

## What zero marginal cost is worth

It is easy to underrate the second point because the numbers per use are small. They are not small in aggregate, and a chart makes the shape clear. Take a rewrite of a five-hundred-token passage, which returns roughly the same length, and price it at three providers' small models as published in September 2026: Anthropic's [Claude Haiku 4.5](https://www.anthropic.com/claude/haiku) at one dollar per million input tokens and five per million output; OpenAI's [current small model](https://developers.openai.com/api/docs/pricing) at 75 cents and 4.50; Google's [Gemini Flash tier](https://ai.google.dev/gemini-api/docs/pricing) at an introductory 75 cents and 3.75. A thousand rewrites cost between about two and three dollars, and a tool with a hundred thousand daily rewrites would carry a bill of several hundred dollars a day that it would have to recover from someone.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Cost of a thousand rewrites of a 500-token passage, by path</title>
<desc id="f2-d">Horizontal bars in US dollars: on-device deterministic pipeline, zero; Google Gemini Flash at introductory pricing, about 2.25; OpenAI's small model, about 2.63; Anthropic Claude Haiku 4.5, about 3.00. The on-device bar is highlighted.</desc>
<text x="0" y="18" class="viz-title">What the default path saves</text>
<text x="0" y="36" class="viz-sub">US dollars per 1,000 rewrites, 500 tokens in and 500 out, list prices, September 2026</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">On the device</text>
<rect x="176" y="58" width="3" height="20" class="viz-f1"/>
<text x="192" y="73" class="viz-value">0</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Gemini Flash, intro</text>
<path d="M176 92 H466 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="486" y="107" class="viz-value">2.25</text>
<text x="166" y="141" text-anchor="end" class="viz-label">OpenAI small model</text>
<path d="M176 126 H516 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="536" y="141" class="viz-value">2.63</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Claude Haiku 4.5</text>
<path d="M176 160 H564 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="580" y="175" class="viz-value">3.00</text>
<text x="0" y="222" class="viz-label-muted">The device path has no bill, so it has no meter, no throttle and no subscription.</text>
</svg>
<figcaption>Source: computed from list prices on the <a href="https://www.anthropic.com/claude/haiku">Anthropic</a>, <a href="https://developers.openai.com/api/docs/pricing">OpenAI</a> and <a href="https://ai.google.dev/gemini-api/docs/pricing">Google</a> pricing pages as read in September 2026; the token counts are stated assumptions.</figcaption>
</figure>

The chart also says why the model path is a bring-your-own-key feature rather than a built-in one. A built-in key means the tool pays those bars, which means the tool needs revenue, which means accounts, metering and a subscription, which means the three things that disappeared come back. Routing the model call through the user's own key keeps the tool at zero and keeps the model's cost with the person who chose to use it.

## The egress ledger

The design decision generalises into a document I now ship with anything that handles a person's text, and I call it the egress ledger. It lists every byte that can leave the device: what is sent, to whom, under what condition, and which setting stops it. For deAIfy the ledger has one row. The text is sent to the model provider the user configured, only when the user has entered a key and pressed the rewrite action, and removing the key removes the row. There is no telemetry row, no crash-report row with text in it, no analytics row, because there is no server to receive any of them.

<figure class="chart">
<svg viewBox="0 0 640 210" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The egress ledger for the tool</title>
<desc id="f3-d">A table with four columns: what leaves, who receives it, the condition, and the setting that stops it. One row: the pasted text and the rewrite instruction, sent to the user's chosen model provider, only when a user-supplied key is present and the rewrite action is pressed, stopped by removing the key. A note says an empty ledger is a feature and an unreadable one is a liability.</desc>
<text x="0" y="18" class="viz-title">Every byte that can leave, in one table</text>
<text x="20" y="48" class="viz-tick">WHAT</text>
<text x="200" y="48" class="viz-tick">TO WHOM</text>
<text x="360" y="48" class="viz-tick">WHEN</text>
<text x="520" y="48" class="viz-tick">STOPPED BY</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">The pasted text</text>
<text x="20" y="100" class="viz-label-muted">and the instruction</text>
<text x="200" y="82" class="viz-label-muted">the provider the</text>
<text x="200" y="100" class="viz-label-muted">user configured</text>
<text x="360" y="82" class="viz-label-muted">key present and</text>
<text x="360" y="100" class="viz-label-muted">rewrite pressed</text>
<text x="520" y="82" class="viz-label-muted">removing the key</text>
<line x1="0" y1="112" x2="640" y2="112" class="viz-grid"/>
<text x="20" y="140" class="viz-label-muted">no telemetry row, no analytics row, no crash report with text in it</text>
<line x1="0" y1="152" x2="640" y2="152" class="viz-grid"/>
<text x="0" y="184" class="viz-label-muted">An empty ledger is a product feature. A ledger the user cannot read is a liability.</text>
</svg>
<figcaption>Illustrative: the ledger as it applies to deAIfy; other tools have more rows, and the point is that each row is written down.</figcaption>
</figure>

The ledger is useful in proportion to how honest it forces the author to be. Writing the telemetry row for a product that has telemetry means writing down that a crash report contains the text the user was editing, which is a thing many products do and few say. Writing the condition column means discovering the code path that sends analytics on launch before the user has agreed to anything. A ledger that a user can read, in the settings screen or the repository, is a promise with a checklist attached, and a ledger that exists only as a paragraph in a privacy policy is not the same document.

## Where the on-device line sits

The honest limit of the design is that the on-device path can only do what a deterministic pipeline can do. Dashes, quotes, hidden characters and a list of filler phrases are rules, and rules run anywhere. Making a paragraph read as if a particular person wrote it is not a rule, and the tool does not pretend it is; that is what the model path is for, and it is why the path exists at all rather than being left out for purity. The line between the two is the line between what can be specified and what can only be judged, and the tool puts the deterministic side on the device and the judgement side behind the user's own key.

There is a middle ground opening up, which is small language models that run on the phone itself, and the day one of them can do the rewrite acceptably on the hardware most people carry, the egress ledger loses its only row. That is the direction the design points, and it is the reason the model path was built as a pluggable provider rather than a fixed one. The default is already on the device. The exception is waiting to join it.
