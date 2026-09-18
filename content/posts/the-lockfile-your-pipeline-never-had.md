---
title: The lockfile your pipeline never had
date: 2026-01-02
summary: Package managers got lockfiles a decade ago; CI workflows did not, which is how one moved tag reached 23,000 repositories. Would your build survive the marketplace vanishing?
tags: GitHub Actions, Supply Chain, CI/CD
draft: false
---

A package.json without a lockfile would not pass review at any company I have worked with, and a workflow file that pulls a dozen third-party actions by tag passes every day. The two are the same mistake. A tag is a pointer that its owner can move, and in March 2025 one of the most widely used actions had its tags moved to a commit that dumped every secret in the workflow's environment into the build logs. The Habits app builds in GitHub Actions in a public repository and SocialSure's platform deploys through CI/CD, so the incident was not abstract, and the test I built afterwards is the subject of this post.

## One moving tag, twenty-three thousand repositories

The compromise of tj-actions/changed-files, tracked as [CVE-2025-30066](https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066), rewrote the action's version tags, from v1 through v45.0.7, to point at a malicious commit on 14 and 15 March 2025. Any workflow referencing the action by tag, which was nearly all of them, ran the malicious code on its next trigger; the action was used in over 23,000 repositories. The chain behind it, per [CISA's alert](https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction), ran through a second compromised action, reviewdog/action-setup, on 11 March, itself reached through the maintainers' access to the SpotBugs project. Three hops, each through a credential the previous hop exposed, and the final hop multiplied by every repository that trusted a tag.

<figure class="chart">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The chain from SpotBugs to 23,000 repositories</title>
<desc id="f1-d">Four boxes left to right: SpotBugs, a static analysis project whose workflow leaked a token; reviewdog/action-setup, compromised on 11 March 2025; tj-actions/changed-files, whose tags were moved on 14 and 15 March; and over 23,000 repositories whose workflows referenced those tags. Arrows show each hop reached through a credential the previous one exposed.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Three hops and a multiplier</text>
<rect x="8" y="60" width="130" height="64" rx="8" class="viz-box"/>
<text x="73" y="84" text-anchor="middle" class="viz-label">SpotBugs</text>
<text x="73" y="102" text-anchor="middle" class="viz-label-muted">token via workflow</text>
<line x1="140" y1="92" x2="166" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="170" y="60" width="140" height="64" rx="8" class="viz-box"/>
<text x="240" y="84" text-anchor="middle" class="viz-label">reviewdog</text>
<text x="240" y="102" text-anchor="middle" class="viz-label-muted">11 March 2025</text>
<line x1="312" y1="92" x2="338" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="342" y="60" width="140" height="64" rx="8" class="viz-box-accent"/>
<text x="412" y="84" text-anchor="middle" class="viz-label">changed-files</text>
<text x="412" y="102" text-anchor="middle" class="viz-label-muted">tags moved in March</text>
<line x1="484" y1="92" x2="510" y2="92" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="514" y="60" width="118" height="64" rx="8" class="viz-box-ink"/>
<text x="573" y="84" text-anchor="middle" class="viz-on-ink">23,000+ repos</text>
<text x="573" y="102" text-anchor="middle" class="viz-on-ink">on next trigger</text>
<text x="320" y="160" text-anchor="middle" class="viz-label-muted">Each hop used a credential the previous one exposed; the last was a trusted tag.</text>
<text x="320" y="186" text-anchor="middle" class="viz-tick">a workflow pinned to a commit SHA did not move</text>
</svg>
<figcaption>Source: the <a href="https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066">Wiz analysis</a> and the <a href="https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction">CISA alert</a>.</figcaption>
</figure>

Workflows that referenced the action by its full commit SHA were unaffected, because a SHA cannot be moved. That is the entire lesson, and it is the one every package manager learned in the previous decade: a name resolves to whatever the name's owner says today, and a hash resolves to one thing forever.

## Why a tag floats and a SHA does not

A git tag is a name for a commit, and unlike a commit it can be deleted and recreated to point somewhere else. The Actions ecosystem built a convention on that: a major-version tag such as v4 is meant to move, so that users get patch releases without editing their workflows, and even the exact-version tags are moved occasionally by maintainers fixing a bad release. The convenience is real and it is exactly the property the attackers used. A full-length commit SHA is the hash of the commit's content and history, so pointing at it means pointing at one immutable thing, which is why GitHub's own [security hardening guidance](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions) recommends pinning third-party actions to a full commit SHA rather than a tag.

The objection is maintenance: a SHA does not tell you which version it is, and nobody wants to update forty hexadecimal strings by hand. The answer that the package ecosystems settled on years ago applies unchanged. The version lives in a comment next to the SHA, a bot such as Dependabot opens a pull request when a new release moves the SHA forward, and a human reads the diff before merging. Updates still happen; they just happen through review rather than through a tag moving under you overnight.

## What the roadmap adds

GitHub's [2026 security roadmap for Actions](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/) is, in effect, the lockfile arriving: a dependencies section in the workflow file that records every action the workflow uses, direct and transitive, pinned to a commit SHA, in the way a language lockfile records every package. It arrives alongside rulesets that control who may trigger a workflow and which events may run one, and an evaluation mode that shows what a policy would block before it is enforced. Once the lockfile is generally available, the question changes from "did you pin your actions" to "could your build run if the marketplace were gone", and the second question is the one worth asking now, because a team can answer it today with the tools it already has.

## The vanished-marketplace test

Here is the test. Imagine that every third-party action repository and the GitHub Marketplace disappear tonight. Would your workflow still run tomorrow? A step passes if it is first-party, meaning the action is published by GitHub itself; or vendored, meaning the action's source is copied into a repository your organisation owns and referenced from there; or pinned to a commit SHA that you have mirrored, meaning a copy of that exact commit exists somewhere you control. A step referencing a third-party action by tag, branch or unmirrored SHA fails, and a workflow fails if any step does.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The vanished-marketplace test as a decision flow over one workflow step</title>
<desc id="f2-d">A flow for each uses line in a workflow: is the action first-party, published by GitHub? If yes, pass. If no, is it vendored into a repository the organisation owns? If yes, pass. If no, is it pinned to a commit SHA that is mirrored? If yes, pass. Otherwise fail, and the workflow fails.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">For every uses line</text>
<rect x="8" y="50" width="150" height="56" rx="8" class="viz-box-accent"/>
<text x="83" y="74" text-anchor="middle" class="viz-label">First-party?</text>
<text x="83" y="92" text-anchor="middle" class="viz-label-muted">published by GitHub</text>
<line x1="160" y1="78" x2="196" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="178" y="68" text-anchor="middle" class="viz-tick">no</text>
<rect x="200" y="50" width="150" height="56" rx="8" class="viz-box-accent"/>
<text x="275" y="74" text-anchor="middle" class="viz-label">Vendored?</text>
<text x="275" y="92" text-anchor="middle" class="viz-label-muted">copied into your org</text>
<line x1="352" y1="78" x2="388" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="370" y="68" text-anchor="middle" class="viz-tick">no</text>
<rect x="392" y="50" width="150" height="56" rx="8" class="viz-box-accent"/>
<text x="467" y="74" text-anchor="middle" class="viz-label">SHA, mirrored?</text>
<text x="467" y="92" text-anchor="middle" class="viz-label-muted">a copy you control</text>
<line x1="544" y1="78" x2="580" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="562" y="68" text-anchor="middle" class="viz-tick">no</text>
<rect x="584" y="50" width="48" height="56" rx="8" class="viz-box-ink"/>
<text x="608" y="82" text-anchor="middle" class="viz-on-ink">fail</text>
<line x1="83" y1="108" x2="83" y2="160" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="275" y1="108" x2="275" y2="160" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="467" y1="108" x2="467" y2="160" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="100" y="140" class="viz-tick">yes</text>
<text x="292" y="140" class="viz-tick">yes</text>
<text x="484" y="140" class="viz-tick">yes</text>
<rect x="8" y="164" width="534" height="44" rx="8" class="viz-box"/>
<text x="275" y="191" text-anchor="middle" class="viz-label">pass: the step runs with the marketplace gone</text>
<text x="320" y="250" text-anchor="middle" class="viz-label-muted">A workflow passes only if every step does. A tag, a branch, or an unmirrored SHA fails.</text>
<text x="320" y="280" text-anchor="middle" class="viz-tick">the mirrored-SHA branch is the one that catches a moved tag</text>
</svg>
<figcaption>Illustrative: the test as a flow; it turns supply-chain hygiene into a yes-or-no check on a single file.</figcaption>
</figure>

The test is deliberately stricter than "pin to a SHA". A SHA pin protects against a moved tag, which is the March 2025 attack, and it does not protect against the repository being deleted, renamed, or taken private, which has happened to actions more than once and which turns a pinned SHA into a build that cannot start. Mirroring the commit, or vendoring the action outright, is what makes the SHA resolvable on the night the marketplace is gone. For the handful of actions a small team actually uses, the vendoring is an afternoon.

## What pinning does and does not cover

Even a workflow that passes the test has dependencies the test does not see, and it is worth being honest about the boundary. An action pinned to a SHA may itself use other actions, and the roadmap's lockfile is the first thing that pins those transitively; until then, the test applies to the actions you vendor, whose own uses lines you can read. An action may pull a container image by tag, or run an npm install of its own with a floating range, and neither is pinned by the SHA of the action's repository. And a runner image changes under you on GitHub's schedule.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">What a SHA pin on the action covers, and what it leaves floating</title>
<desc id="f3-d">A table of five dependency kinds with whether a SHA pin on the action covers them: the action's own code, yes; actions it uses transitively, no, until the lockfile; container images it pulls by tag, no; packages it installs with floating ranges, no; the runner image, no, GitHub's schedule. Filled squares mark covered.</desc>
<text x="0" y="18" class="viz-title">The pin's reach</text>
<text x="20" y="48" class="viz-tick">DEPENDENCY</text>
<text x="360" y="48" class="viz-tick">COVERED BY A SHA PIN</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">The action's own code</text>
<rect x="364" y="70" width="14" height="14" rx="3" class="viz-f1"/>
<text x="388" y="82" class="viz-label-muted">yes: a SHA cannot move</text>
<line x1="0" y1="92" x2="640" y2="92" class="viz-grid"/>
<text x="20" y="118" class="viz-label">Actions it uses in turn</text>
<rect x="364" y="106" width="14" height="14" rx="3" class="viz-box"/>
<text x="388" y="118" class="viz-label-muted">not until the lockfile pins them</text>
<line x1="0" y1="128" x2="640" y2="128" class="viz-grid"/>
<text x="20" y="154" class="viz-label">Container images it pulls by tag</text>
<rect x="364" y="142" width="14" height="14" rx="3" class="viz-box"/>
<text x="388" y="154" class="viz-label-muted">no: pin the digest separately</text>
<line x1="0" y1="164" x2="640" y2="164" class="viz-grid"/>
<text x="20" y="190" class="viz-label">Packages it installs</text>
<rect x="364" y="178" width="14" height="14" rx="3" class="viz-box"/>
<text x="388" y="190" class="viz-label-muted">no: the action's own lockfile</text>
<line x1="0" y1="200" x2="640" y2="200" class="viz-grid"/>
<text x="20" y="226" class="viz-label">The runner image</text>
<rect x="364" y="214" width="14" height="14" rx="3" class="viz-box"/>
<text x="388" y="226" class="viz-label-muted">no: GitHub's schedule</text>
<line x1="0" y1="236" x2="640" y2="236" class="viz-grid"/>
</svg>
<figcaption>Illustrative: the boundary of what pinning the action covers; the second row is the one the 2026 roadmap's lockfile is designed to close.</figcaption>
</figure>

That boundary is why the test is about vendoring and mirroring rather than about pinning. A vendored action can be read, and its own uses lines, image tags and install commands can be pinned in the copy. A pinned but unvendored action is a black box whose insides float.

## The workflow, before and after

The Habits pipeline is small: check out, set up a JDK, cache Gradle, build, run tests, sign, upload. Before the test, four of those steps referenced third-party actions by major version tag, which is the reference that moved in March 2025. After the test, the first-party steps stayed as they were, the two third-party actions that were genuinely useful were vendored into an organisation repository with their internal dependencies pinned, and one action was replaced by a dozen lines of shell that did the same thing without a dependency. The workflow got a few lines longer and the test passes. The signing step, which is the one that handles a credential, references nothing outside the organisation.

A last word on fail-closed. The test is only useful if the pipeline enforces it, and the cheapest enforcement is a check, run on every workflow change, that fails when a uses line references anything outside the allowed set. Then a colleague adding a convenient action by tag gets a red build and a link to this rule, which is a better outcome than the action working perfectly until the day its tags move. The roadmap will make the check native. Until it does, a shell script over the workflow files is the lockfile your pipeline never had.
