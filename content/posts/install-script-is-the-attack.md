---
title: The install script is the attack
date: 2026-04-19
summary: Every big package compromise since 2018 has used one mechanism: code that runs at install time with your credentials. Count those scripts in every lockfile and drive them to zero.
tags: Supply Chain, Npm, Security
draft: false
---

Every major package compromise of the last eight years has had a different story and the same mechanism. A maintainer's token is phished, a popular package gets a new version, and the new version carries a script that runs the moment someone installs it, with the installing user's credentials, on the installing user's machine, before a single line of the package has been imported. The story changes each time. The install script is the attack every time, and it is the one part of the chain that a team can count and remove.

## The same shape, eight years running

The [event-stream](https://github.com/dominictarr/event-stream/issues/116) incident of November 2018 was the template: a widely depended-on npm package handed to a new maintainer, who added a dependency that targeted one wallet application's build. In September 2025 the shape returned as a worm. The Shai-Hulud campaign, [documented by Wiz](https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack) and in a [CISA alert](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem), published malicious versions of over two hundred packages and more than five hundred versions between 14 and 18 September, each carrying a post-install script that harvested credentials and, if it found an npm token, published itself into every package that token could reach. A second wave followed on 24 November. And in February 2026, [version 2.3.0 of the Cline CLI](https://thehackernews.com/2026/02/cline-cli-230-supply-chain-attack.html), a widely used coding-agent tool, shipped with a post-install script that silently installed a second package on every machine that ran the install, after an attacker reached its publishing credentials through a prompt injection in a GitHub issue title.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Install-time supply chain incidents, 2018 to 2026</title>
<desc id="f1-d">A timeline with five events, four compromises in brick and one defence in gold: November 2018, event-stream; 14 to 18 September 2025, Shai-Hulud, over 200 packages; 24 November 2025, the second Shai-Hulud wave; 9 December 2025, npm revokes classic tokens; 17 February 2026, Cline CLI 2.3.0 post-install compromise.</desc>
<circle cx="430" cy="18" r="5" class="viz-d4"/><text x="440" y="22" class="viz-label-muted">compromise</text>
<circle cx="540" cy="18" r="5" class="viz-d1"/><text x="550" y="22" class="viz-label-muted">defence</text>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="70" cy="90" r="6" class="viz-d4"/>
<text x="70" y="64" text-anchor="middle" class="viz-tick">Nov 2018</text>
<text x="70" y="46" text-anchor="middle" class="viz-label">event-stream</text>
<circle cx="280" cy="90" r="6" class="viz-d4"/>
<text x="280" y="124" text-anchor="middle" class="viz-tick">Sept 2025</text>
<text x="280" y="142" text-anchor="middle" class="viz-label">Shai-Hulud, 200+ packages</text>
<circle cx="400" cy="90" r="6" class="viz-d4"/>
<text x="400" y="64" text-anchor="middle" class="viz-tick">Nov 2025</text>
<text x="400" y="46" text-anchor="middle" class="viz-label">second wave</text>
<circle cx="470" cy="90" r="6" class="viz-d1"/>
<text x="470" y="124" text-anchor="middle" class="viz-tick">Dec 2025</text>
<text x="470" y="142" text-anchor="middle" class="viz-label">classic tokens revoked</text>
<circle cx="570" cy="90" r="6" class="viz-d4"/>
<text x="570" y="64" text-anchor="middle" class="viz-tick">Feb 2026</text>
<text x="570" y="46" text-anchor="middle" class="viz-label">Cline CLI 2.3.0</text>
</svg>
<figcaption>Source: the <a href="https://www.wiz.io/blog/shai-hulud-npm-supply-chain-attack">Wiz analysis</a> and <a href="https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem">CISA alert</a> on Shai-Hulud, GitHub's <a href="https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/">npm token changelog</a>, and <a href="https://thehackernews.com/2026/02/cline-cli-230-supply-chain-attack.html">reporting on the Cline incident</a>.</figcaption>
</figure>

What makes the worm form possible is one loop: the post-install script runs with the developer's environment, the environment contains a publishing token, the script uses the token to publish itself into other packages, and those packages' post-install scripts run on the next developer. Three of the four steps are outside the package ecosystem's control. The first one is not.

<figure class="chart">
<svg viewBox="0 0 640 220" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The worm loop, and the one step a team controls</title>
<desc id="f2-d">Four boxes in a cycle: a post-install script runs on install; it harvests the npm token from the environment; it publishes malicious versions of every package the token can reach; those packages run their own post-install script on the next machine. The first box is highlighted as the step a team can refuse.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="40" width="140" height="56" rx="8" class="viz-box-accent"/>
<text x="78" y="64" text-anchor="middle" class="viz-label">Script runs</text>
<text x="78" y="82" text-anchor="middle" class="viz-label-muted">at install time</text>
<line x1="150" y1="68" x2="168" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="172" y="40" width="140" height="56" rx="8" class="viz-box"/>
<text x="242" y="64" text-anchor="middle" class="viz-label">Harvests token</text>
<text x="242" y="82" text-anchor="middle" class="viz-label-muted">from the environment</text>
<line x1="314" y1="68" x2="332" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="336" y="40" width="140" height="56" rx="8" class="viz-box"/>
<text x="406" y="64" text-anchor="middle" class="viz-label">Publishes itself</text>
<text x="406" y="82" text-anchor="middle" class="viz-label-muted">into reachable packages</text>
<line x1="478" y1="68" x2="496" y2="68" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="500" y="40" width="132" height="56" rx="8" class="viz-box"/>
<text x="566" y="64" text-anchor="middle" class="viz-label">Next install</text>
<text x="566" y="82" text-anchor="middle" class="viz-label-muted">on another machine</text>
<path d="M566 98 V140 H78 V102" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="320" y="170" text-anchor="middle" class="viz-label-muted">The loop closes through the first box. A tree with no install scripts has no first box.</text>
<text x="320" y="200" text-anchor="middle" class="viz-tick">expiring tokens and two-factor publishing weaken boxes two and three</text>
</svg>
<figcaption>Illustrative: the propagation described in the Shai-Hulud analyses, drawn as a cycle.</figcaption>
</figure>

## The ecosystem has finally accepted it

The defences that arrived in 2025 were aimed at the loop's later steps and at the first one. GitHub's [September 2025 announcement](https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/) and its [November update](https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/) ended classic npm tokens, with all existing ones revoked on 9 December 2025, capped write-capable granular tokens at ninety days, and made two-factor authentication the default for tokens that can publish. Those shorten the second and third steps: a harvested token expires, and publishing needs a second factor the script does not have.

The first step got its defence from pnpm. Version 10 [blocks dependency lifecycle scripts by default](https://socket.dev/blog/pnpm-10-0-0-blocks-lifecycle-scripts-by-default): a dependency's pre-install, install and post-install scripts do not run unless the project explicitly approves that package. The install completes, the packages are on disk, and the code that would have run with your credentials sits there unexecuted. It is a breaking change, deliberately, and it is the correct default, because the number of packages that genuinely need to run code at install time is small and known.

## The postinstall tax

The practice that follows is to count. For every lockfile a team ships, count the packages that declare an install-time lifecycle script, and treat that number as a tax paid in blast radius, tracked in continuous integration the way bundle size is tracked. Each package on the list gets one of two treatments: an explicit allow, with a written reason, for the handful that compile native code or download a binary they cannot ship otherwise; or a replacement, with a package that does the same job without running code on install. A new entry on the list fails the build until it has been classified.

The count is a few lines of script over the installed tree, reading each package's manifest for preinstall, install and postinstall entries. I ran it on two trees I maintain to see the shape. The dependency tree behind this site, 75 packages for a Tailwind build and an icon sprite, declares none. A small tool tree of 27 packages, including a browser automation library, declares none either. That is not typical of a large application, where native modules and binary downloads push the number into double figures, and it is the point: for most of the software a small team ships, the tax can be zero, and the packages that raise it above zero are visible by name.

```js
// count install-time scripts across node_modules
const k = ['preinstall', 'install', 'postinstall'];
const taxed = manifests.filter(m => k.some(s => m.scripts && m.scripts[s]));
console.log(`${taxed.length} of ${manifests.length} packages run code on install`);
```

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Defences by which step of the loop they weaken</title>
<desc id="f3-d">A table of four rows. Ignoring install scripts by default, as pnpm 10 does: removes the first step entirely. Short-lived granular tokens: limit the harvested token's life, weakening the second step. Two-factor publishing: blocks the script from publishing, weakening the third step. Pinning versions in a lockfile: delays the fourth step until someone updates, but does not stop it.</desc>
<text x="0" y="18" class="viz-title">Which defence breaks which step</text>
<text x="20" y="48" class="viz-tick">DEFENCE</text>
<text x="300" y="48" class="viz-tick">STEP</text>
<text x="420" y="48" class="viz-tick">EFFECT</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="82" class="viz-label">Ignore install scripts by default</text>
<text x="300" y="82" class="viz-value">1: script runs</text>
<text x="420" y="82" class="viz-label-muted">removes the step entirely</text>
<line x1="0" y1="96" x2="640" y2="96" class="viz-grid"/>
<text x="20" y="122" class="viz-label">Short-lived granular tokens</text>
<text x="300" y="122" class="viz-value">2: harvest</text>
<text x="420" y="122" class="viz-label-muted">token dies in ninety days</text>
<line x1="0" y1="136" x2="640" y2="136" class="viz-grid"/>
<text x="20" y="162" class="viz-label">Two-factor publishing</text>
<text x="300" y="162" class="viz-value">3: publish</text>
<text x="420" y="162" class="viz-label-muted">script has no second factor</text>
<line x1="0" y1="176" x2="640" y2="176" class="viz-grid"/>
<text x="20" y="202" class="viz-label">Pinned lockfile</text>
<text x="300" y="202" class="viz-value">4: next install</text>
<text x="420" y="202" class="viz-label-muted">delays until someone updates</text>
<line x1="0" y1="216" x2="640" y2="216" class="viz-grid"/>
<text x="0" y="248" class="viz-label-muted">Only the first row makes a compromised version harmless on arrival.</text>
</svg>
<figcaption>Illustrative: the mapping between the 2025 defences and the loop; the token and two-factor changes are those in GitHub's npm changelogs.</figcaption>
</figure>

## Turning it on without breaking the build

The migration is less dramatic than it sounds, and the order matters. Start by turning scripts off globally: pnpm 10 does it by default, and for npm an `ignore-scripts=true` line in the project's `.npmrc` does the same, so that every install on every machine and in every pipeline runs with dependency scripts disabled. Then run the install and the test suite and see what breaks. Usually it is two or three packages: something that compiles a native module, something that downloads a platform binary it cannot ship in the tarball, and a browser automation library that fetches a browser. Those go on the allow list. In pnpm that is the `onlyBuiltDependencies` list in package.json, which names the packages whose scripts may run and nothing else; in npm it is a targeted rebuild of the named packages after the scripts-off install.

The allow list should be reviewed, not just written. For each package on it, ask whether there is a version or an alternative that ships prebuilt binaries as optional platform packages instead of running a download at install, because several popular native packages moved to that pattern precisely so that they could be installed with scripts off. Every package removed from the list is one fewer place a compromised version can execute on arrival.

Finally, put the count in continuous integration. A job that installs with scripts ignored, counts the packages declaring lifecycle scripts, and compares the set against the allow list will fail the moment a new dependency brings a script with it, which is the moment someone should look. The failure message should say which package and which script, so that the review takes a minute rather than a search.

## What the count does not cover

Two honest limits. A package that does not run code at install can still run malicious code at import, the first time your application requires it, and the count says nothing about that. The install-time step is special because it runs on every machine that installs, including build servers and the laptops of people who never use the package, with credentials that the application itself may never see; it is the widest blast radius and the one worms need. Import-time code is a narrower problem, caught by the same review and pinning practices that were always needed, and it is not solved by this count.

The other limit is the allow list itself. A package on the allow list runs its install script with full credentials, and a compromised version of that package is exactly as dangerous as before. The list has to be short, each entry has to be pinned to a version and a checksum, and the entries have to be the packages the team would notice a new version of. A long allow list is the old default with extra steps.

## The rule

Count the install scripts in every lockfile. Run installs with dependency scripts ignored by default, and allow the exceptions by name with a reason. Fail the build when the count rises. Then let the token and publishing defences do their slower work on the rest of the loop. The stories will keep changing. The first box does not have to be in yours.
