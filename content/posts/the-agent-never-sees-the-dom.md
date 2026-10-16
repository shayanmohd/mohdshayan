---
title: The agent never sees the DOM
date: 2026-10-12
summary: Kamapathy hands an agent a bounded text view of a page, 4,000 characters and 40 controls by default, and a fixed set of routes. That view is a product decision with a budget.
tags: AI Agents, Browser Automation, Electron
topic: LLM Engineering
draft: false
---

When an agent asks Kamapathy to look at a page, it does not get the DOM. Kamapathy is the desktop browser I built for a person to share with their agents, and the agent's whole view of a page is a bounded text snapshot: URL, title, visible text, then controls with short refs such as `@e5`, capped by default at 4,000 characters and 40 controls. The agent acts through a fixed set of routes against those refs, and nothing it writes runs inside the page. Building it taught me that what an agent sees is a product decision with a budget, and the odd calls are where the decision shows: text under `aria-hidden` is kept, controls under it are dropped, and a password field reports only that it holds a value.

## What the agent gets

The repository keeps the real captures from its benchmark run, so I can show one. This is the form builder page of the local fixture site, from `tests/fixtures/benchmarks/kamapathy-form.txt`, all 535 characters of it:

```
Create a form
http://127.0.0.1:3000/forms/new

Kamapathy form lab
Overview
Create a form
Interaction lab
Reference page
Create a form
Form title
Description
Template
Create form
Local test fixture. Submissions remain on this machine and are discarded when the server closes.

Controls:
@e1 a "Overview"
@e2 a "Create a form"
@e3 a "Interaction lab"
@e4 a "Reference page"
@e5 input "Form title"
@e6 textarea "Description"
@e7 select "Template"
  "feedback": "Product feedback"
  "research": "Research request"
@e8 button "Create form"
```

Everything the agent needs is there: the labels, the select's exact option values and a ref for each control. The agent pipes the title into `fill TAB_ID @e5 --stdin`, pipes `research` into `fill TAB_ID @e7 --stdin`, and sends `click TAB_ID @e8`, or all three as one batch. What is missing is deliberate: no tree, no attribute dump (a control keeps type, role, state and, in JSON, a CSS selector), no scripts, no styles, no bounding boxes. It reads through open shadow roots and same-origin frames, and lists a cross-origin frame as a control that refuses every action, so the agent knows there is content it cannot read.

## The budget

In `electron/automation.ts` a compact snapshot allows 4,000 characters of text and 40 controls, and a full one 24,000 and 100, which are also the caps. In `electron/automation-dom.ts` a label is cut at 80 characters in compact mode and 200 in full, a select lists at most 20 options, and a whole snapshot at most 100 options across its selects. Whatever falls outside sets a `truncated` flag, and `omittedControls` counts the controls left out, so the agent can scope the next snapshot to a CSS selector.

<figure class="chart">
<svg viewBox="0 0 640 310" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Default snapshot budgets in compact and full mode</title>
<desc id="f1-d">Three pairs of horizontal bars. Text characters: compact 4,000 against full 24,000. Controls: compact 40 against full 100. Label characters: compact 80 against full 200. Each pair is drawn to its own scale, with the full bar at 380 pixels.</desc>
<text x="0" y="18" class="viz-title">Compact is the default; full is six times the text</text>
<text x="0" y="36" class="viz-sub">Default snapshot budgets in compact and full mode, each pair to its own scale</text>
<line x1="150" y1="52" x2="150" y2="272" class="viz-axis"/>
<text x="0" y="62" class="viz-label">Text characters</text>
<text x="140" y="82" text-anchor="end" class="viz-label-muted">compact</text>
<rect x="150" y="70" width="63.3" height="16" rx="3" class="viz-f1"/>
<text x="221" y="82" class="viz-value">4,000</text>
<text x="140" y="106" text-anchor="end" class="viz-label-muted">full</text>
<rect x="150" y="94" width="380" height="16" rx="3" class="viz-fgray"/>
<text x="538" y="106" class="viz-value">24,000</text>
<text x="0" y="140" class="viz-label">Controls</text>
<text x="140" y="160" text-anchor="end" class="viz-label-muted">compact</text>
<rect x="150" y="148" width="152" height="16" rx="3" class="viz-f1"/>
<text x="310" y="160" class="viz-value">40</text>
<text x="140" y="184" text-anchor="end" class="viz-label-muted">full</text>
<rect x="150" y="172" width="380" height="16" rx="3" class="viz-fgray"/>
<text x="538" y="184" class="viz-value">100</text>
<text x="0" y="218" class="viz-label">Label characters</text>
<text x="140" y="238" text-anchor="end" class="viz-label-muted">compact</text>
<rect x="150" y="226" width="152" height="16" rx="3" class="viz-f1"/>
<text x="310" y="238" class="viz-value">80</text>
<text x="140" y="262" text-anchor="end" class="viz-label-muted">full</text>
<rect x="150" y="250" width="380" height="16" rx="3" class="viz-fgray"/>
<text x="538" y="262" class="viz-value">200</text>
<text x="0" y="296" class="viz-label-muted">Full-mode bars are 380 pixels; each compact bar shares its pair's scale.</text>
</svg>
<figcaption>Source: the defaults and caps in <a href="https://github.com/shayanmohd/kamapathy/blob/main/electron/automation.ts">electron/automation.ts</a> (lines 137 to 149) and the label limit in <a href="https://github.com/shayanmohd/kamapathy/blob/main/electron/automation-dom.ts">electron/automation-dom.ts</a> (line 1286), read on 12 October 2026.</figcaption>
</figure>

When a page holds more controls than the budget, which survive is a second decision, made in code: controls inside open dialogs, popups, listboxes and menus first, then controls on screen inside fixed or sticky bars, then the rest of the screen, then tall pinned columns such as a navigation sidebar, then everything else. That rule is why a snapshot of a modal shows the modal and not forty navigation links.

The budget is what the agent pays for, so I measured it. The repository keeps four full-mode captures of the fixture site, which `docs/benchmark-results.json` dates to 11 September 2026 on a pre-release 0.1.0 build, and `scripts/benchmark.mjs` counts them through js-tiktoken 1.0.21 with `o200k_base`, an encoding from [tiktoken](https://github.com/openai/tiktoken), "a fast BPE tokeniser for use with OpenAI's models". That JSON came from earlier drafts whose hashes match none of the committed files, so on 12 October 2026 I re-ran the count on the committed files. The form builder costs 149 tokens, the created form 248, the receipt 156 and a reference page with 18 notes 1,056: 1,609 for all four. The skill's instructions cost more: `SKILL.md` is 1,493 tokens, `references/actions.md` 2,617 and `references/connection.md` 842, 4,952 for the three files the script counts, and `references/scripting.md`, which `SKILL.md` sends the agent to, adds 2,247 the script never counts. The instructions for looking at a page cost at least three times what four pages cost.

<figure class="chart">
<svg viewBox="0 0 640 376" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Tokens per fixture page snapshot and per skill instruction file</title>
<desc id="f2-d">Horizontal bars of tokens under the o200k_base encoding, counted on 12 October 2026 from the committed files. Four snapshots: form builder 149, created form 248, receipt 156, reference page with 18 notes 1,056, totalling 1,609. Four skill files: SKILL.md 1,493, actions.md 2,617, connection.md 842 and, in grey because the repository's script leaves it out, scripting.md 2,247; 4,952 for the three the script counts and 7,199 for all four.</desc>
<text x="0" y="18" class="viz-title">Reading the instructions costs more than reading the pages</text>
<text x="0" y="36" class="viz-sub">Tokens per full-mode snapshot of four fixture pages, and per skill instruction file</text>
<text x="0" y="60" class="viz-label-muted">Four fixture pages, 1,609 tokens together</text>
<line x1="190" y1="66" x2="190" y2="180" class="viz-axis"/>
<text x="180" y="83" text-anchor="end" class="viz-label">Form builder</text>
<rect x="190" y="68" width="20.9" height="20" rx="3" class="viz-f1"/>
<text x="219" y="83" class="viz-value">149</text>
<text x="180" y="113" text-anchor="end" class="viz-label">Created form</text>
<rect x="190" y="98" width="34.7" height="20" rx="3" class="viz-f1"/>
<text x="233" y="113" class="viz-value">248</text>
<text x="180" y="143" text-anchor="end" class="viz-label">Receipt</text>
<rect x="190" y="128" width="21.8" height="20" rx="3" class="viz-f1"/>
<text x="220" y="143" class="viz-value">156</text>
<text x="180" y="173" text-anchor="end" class="viz-label">Reference, 18 notes</text>
<rect x="190" y="158" width="147.8" height="20" rx="3" class="viz-f1"/>
<text x="346" y="173" class="viz-value">1,056</text>
<text x="0" y="204" class="viz-label-muted">Four skill instruction files, 7,199 tokens together</text>
<line x1="190" y1="210" x2="190" y2="324" class="viz-axis"/>
<text x="180" y="227" text-anchor="end" class="viz-label">SKILL.md</text>
<rect x="190" y="212" width="209" height="20" rx="3" class="viz-f2"/>
<text x="407" y="227" class="viz-value">1,493</text>
<text x="180" y="257" text-anchor="end" class="viz-label">actions.md</text>
<rect x="190" y="242" width="366.4" height="20" rx="3" class="viz-f2"/>
<text x="564" y="257" class="viz-value">2,617</text>
<text x="180" y="287" text-anchor="end" class="viz-label">connection.md</text>
<rect x="190" y="272" width="117.9" height="20" rx="3" class="viz-f2"/>
<text x="316" y="287" class="viz-value">842</text>
<text x="180" y="317" text-anchor="end" class="viz-label">scripting.md</text>
<rect x="190" y="302" width="314.6" height="20" rx="3" class="viz-fgray"/>
<text x="513" y="317" class="viz-value">2,247</text>
<text x="0" y="346" class="viz-label-muted">0.14 pixels per token, o200k_base, committed files counted on 12 October 2026</text>
<text x="0" y="364" class="viz-label-muted">Grey: scripting.md, which SKILL.md points to and the script never counts</text>
</svg>
<figcaption>Source: the captures in <a href="https://github.com/shayanmohd/kamapathy/tree/main/tests/fixtures/benchmarks">tests/fixtures/benchmarks</a> and the files in <a href="https://github.com/shayanmohd/kamapathy/tree/main/skills/kamapathy">skills/kamapathy</a>, counted on 12 October 2026 with the method in <a href="https://github.com/shayanmohd/kamapathy/blob/main/scripts/benchmark.mjs">scripts/benchmark.mjs</a> (js-tiktoken 1.0.21, o200k_base). <a href="https://github.com/shayanmohd/kamapathy/blob/main/docs/benchmark-results.json">docs/benchmark-results.json</a> dates the captures to 11 September 2026 on a 0.1.0 build, fifteen days before the <a href="https://github.com/shayanmohd/kamapathy/releases">v0.1.0 release</a>, and records 1,605 tokens for the pages and 2,463 for three skill files from earlier drafts; the method's exclusions are in <a href="https://github.com/shayanmohd/kamapathy/blob/main/docs/benchmarks.md">docs/benchmarks.md</a>.</figcaption>
</figure>

None of the pages reached full mode's 24,000-character or 100-control limits, so compact mode would cost the same or less. As `docs/benchmarks.md` says, the numbers exclude the model's reasoning, its commands, tool schemas, screenshots, caching and latency: they measure the observation, not the task.

## The odd calls

Three edge cases look wrong until you know why.

The first is `aria-hidden`. The attribute, as [MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden) puts it, "hides content from assistive technology but doesn't visually hide anything", and component libraries put visible field labels and questions inside it. So the page text includes rendered text under `aria-hidden`; a snapshot that followed the accessibility tree would drop the question above a group of radio buttons. Controls under `aria-hidden` stay excluded, because an open modal hides the page behind it that way, and an agent offered forty links from behind a dialog will click one.

The second is secrets. A field reports only that its value is hidden when it is a password input, when its name or id contains a token such as `pwd`, `otp`, `cvc` or `pin`, when its `autocomplete` is `current-password`, `new-password`, `one-time-code` or any `cc-` value, or when a stylesheet masks it with `-webkit-text-security`. Once judged secret a field stays secret, so a "show password" toggle does not leak it on the next snapshot. The security notes state the limit: a site can echo a value in ordinary text, and the snapshot does not pretend to redact that.

The third is what the snapshot is not. Playwright's aria snapshots, in [its documentation](https://playwright.dev/docs/aria-snapshots), "provide a YAML representation of the accessibility tree of a page". Kamapathy's docs say its snapshots are "bounded DOM summaries, not accessibility tree exports". The snapshot is a cheap, truncated model for a language model, which would read an icon font's `arrow_drop_down` as a word, so those are dropped, and which has to be told a select option's exact value, so that is printed. The differences are decisions, not gaps.

## Nothing the model wrote runs in the page

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The observe and act loop between a page, Kamapathy and the model</title>
<desc id="f3-d">A loop of six boxes. Observing: the web page feeds a fixed snapshot function running in an isolated world, which produces bounded text with refs, capped at 4,000 characters and 40 controls, which the model reads. Acting: the model sends one documented route such as click, fill or batch, which becomes native Chromium input back to the page. A dark box below lists what never crosses the socket: JavaScript evaluation, the Chrome DevTools Protocol, Node.js, a shell and the filesystem.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One fixed function out, one documented route back</text>
<rect x="8" y="48" width="172" height="60" rx="8" class="viz-box"/>
<text x="94" y="74" text-anchor="middle" class="viz-label">Web page</text>
<text x="94" y="92" text-anchor="middle" class="viz-label-muted">DOM, scripts, styles</text>
<text x="205" y="70" text-anchor="middle" class="viz-tick">observe</text>
<line x1="182" y1="78" x2="228" y2="78" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="234" y="48" width="172" height="60" rx="8" class="viz-box-accent"/>
<text x="320" y="74" text-anchor="middle" class="viz-label">Snapshot function</text>
<text x="320" y="92" text-anchor="middle" class="viz-label-muted">fixed code, world 1001</text>
<line x1="408" y1="78" x2="454" y2="78" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="460" y="48" width="172" height="60" rx="8" class="viz-box-accent"/>
<text x="546" y="74" text-anchor="middle" class="viz-label">Bounded text</text>
<text x="546" y="92" text-anchor="middle" class="viz-label-muted">4,000 chars, 40 @refs</text>
<line x1="546" y1="110" x2="546" y2="156" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="554" y="136" class="viz-tick">snapshot</text>
<rect x="460" y="160" width="172" height="60" rx="8" class="viz-box"/>
<text x="546" y="186" text-anchor="middle" class="viz-label">The model</text>
<text x="546" y="204" text-anchor="middle" class="viz-label-muted">reads text, picks a ref</text>
<text x="435" y="182" text-anchor="middle" class="viz-tick">act</text>
<line x1="458" y1="190" x2="412" y2="190" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="234" y="160" width="172" height="60" rx="8" class="viz-box-accent"/>
<text x="320" y="186" text-anchor="middle" class="viz-label">One documented route</text>
<text x="320" y="204" text-anchor="middle" class="viz-label-muted">click @e5, fill, batch</text>
<line x1="232" y1="190" x2="186" y2="190" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="8" y="160" width="172" height="60" rx="8" class="viz-box"/>
<text x="94" y="186" text-anchor="middle" class="viz-label">Chromium input</text>
<text x="94" y="204" text-anchor="middle" class="viz-label-muted">native mouse and keys</text>
<line x1="94" y1="158" x2="94" y2="112" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="102" y="136" class="viz-tick">click @e5</text>
<rect x="8" y="250" width="624" height="56" rx="8" class="viz-box-ink"/>
<text x="320" y="274" text-anchor="middle" class="viz-on-ink">What never crosses the socket</text>
<text x="320" y="294" text-anchor="middle" class="viz-on-ink">JavaScript eval, CDP, Node.js, shell, filesystem</text>
</svg>
<figcaption>Illustrative: the loop drawn as structure, from the route table and isolation notes in <a href="https://github.com/shayanmohd/kamapathy/blob/main/docs/automation.md">docs/automation.md</a>; the budget on the bounded text box is the compact default.</figcaption>
</figure>

The other half of the boundary is what goes back. Every observation runs the same fixed function through Electron's `executeJavaScriptInIsolatedWorld`, which [the Electron docs](https://www.electronjs.org/docs/latest/api/web-contents) describe as working "like executeJavaScript but evaluates scripts in an isolated context". There is exactly one such call in the main process, in `electron/automation.ts`, and it runs a function defined in the source, with the operation name and the agent's arguments passed as JSON-encoded values: data in that call, never code. The docs list what is absent: no arbitrary JavaScript, no Chrome DevTools Protocol, no Node.js, no shell, no filesystem. The skill tells the model the same thing: one documented route per call, and "nothing runs inside the page".

The transport is as narrow as the view. The server listens on a Unix socket in a per-profile directory created with mode 0o700, the socket file set to 0o600 once open; on Windows it is a named pipe called `kamapathy-` followed by 16 random bytes, new on every start. There is no token: the operating system account is the trust boundary, and nothing running as another account can open the socket.

## A view is a decision

The DOM is not the page as a person sees it, and the accessibility tree is not the page as a model needs it. Either one, handed over whole, is a bigger prompt and a larger surface that still leaves the model to find the Save button among three hundred nodes. Deciding that the agent gets 4,000 characters, 40 controls, 80-character labels, 20 options per select and nothing executable is deciding what the agent is for: filling the form in front of it, in a page the person can watch and take over. The cost is real and the docs list it: closed shadow roots, PDF documents, canvas editors and JavaScript dialogs are out of reach, and the agent hands those to the person.

Kamapathy is at version 0.2.0 on Electron 44 and React 19, MIT licensed, an early preview with unsigned installers (read on 12 October 2026). The code, fixtures and benchmark script are in the [repository on GitHub](https://github.com/shayanmohd/kamapathy). If you build a tool for agents, write down the budget first. The model will see whatever you give it, and the moment you can quote the snapshot in full, as I did above, you have decided what it is allowed to know.
