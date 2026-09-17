---
title: The package everyone imports
date: 2026-09-18
summary: In a Turborepo monorepo, CI time is set by the few packages that change often and are imported everywhere: a task's cache key includes every dependency's hash. Find and split them.
tags: Turborepo, Monorepos, CI
draft: false
---

Every monorepo team reaches the point where the remote cache is on, the runners are fast, and CI still takes twenty minutes on a one-line change. The usual response is to buy a faster cache or bigger runners. The actual cause is structural: in a Turborepo, a task's cache key includes the hash of every package it depends on, so a change to a package that many others import invalidates the cache for every one of them, and the whole tree rebuilds. CI time is therefore decided by a small set of packages that change often and are imported everywhere, and the fix is not a faster cache but moving churn out of those packages. They can be found from git history and the package graph in an afternoon.

## Why one change rebuilds everything

Turborepo [hashes each task's inputs](https://turborepo.com/docs/crafting-your-repository/caching) to decide whether it can replay a cached result, and the inputs include the outputs of the tasks it depends on, transitively, through the package graph. That is the correct design: if a shared package's output changed, its dependents might build differently, so their cache entries cannot be trusted. The consequence is that the blast radius of a commit is not the number of files it touched but the number of packages that transitively depend on the packages it touched. A change to an application's own code rebuilds that application. A change to a package imported by ninety others rebuilds ninety.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">How a changed hash in one shared package propagates to every dependent task's cache key</title>
<desc id="f1-d">A package graph drawn as layers. At the bottom, a shared package whose hash changed. Above it, four packages that import it, each with a cache key that now includes the new hash and therefore misses. Above those, three applications that import them, whose keys miss in turn. Arrows flow upward from the changed package, and every box it reaches is marked as a cache miss.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One hash, ninety cache keys</text>
<rect x="250" y="220" width="140" height="44" rx="8" class="viz-box-accent"/>
<text x="320" y="240" text-anchor="middle" class="viz-label">shared package</text>
<text x="320" y="256" text-anchor="middle" class="viz-label-muted">hash changed</text>
<rect x="40" y="130" width="120" height="44" rx="8" class="viz-box-ink"/><text x="100" y="157" text-anchor="middle" class="viz-on-ink">miss</text>
<rect x="200" y="130" width="120" height="44" rx="8" class="viz-box-ink"/><text x="260" y="157" text-anchor="middle" class="viz-on-ink">miss</text>
<rect x="360" y="130" width="120" height="44" rx="8" class="viz-box-ink"/><text x="420" y="157" text-anchor="middle" class="viz-on-ink">miss</text>
<rect x="520" y="130" width="112" height="44" rx="8" class="viz-box-ink"/><text x="576" y="157" text-anchor="middle" class="viz-on-ink">miss</text>
<line x1="290" y1="218" x2="110" y2="178" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="305" y1="218" x2="265" y2="178" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="335" y1="218" x2="415" y2="178" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="350" y1="218" x2="560" y2="178" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="120" y="50" width="120" height="44" rx="8" class="viz-box-ink"/><text x="180" y="77" text-anchor="middle" class="viz-on-ink">app: miss</text>
<rect x="280" y="50" width="120" height="44" rx="8" class="viz-box-ink"/><text x="340" y="77" text-anchor="middle" class="viz-on-ink">app: miss</text>
<rect x="440" y="50" width="120" height="44" rx="8" class="viz-box-ink"/><text x="500" y="77" text-anchor="middle" class="viz-on-ink">app: miss</text>
<line x1="110" y1="128" x2="170" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="270" y1="128" x2="330" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="430" y1="128" x2="490" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="576" y1="128" x2="520" y2="98" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="320" y="290" text-anchor="middle" class="viz-label-muted">Every task whose key includes the changed hash rebuilds, however small the change was.</text>
</svg>
<figcaption>Illustrative: cache-key propagation through a package graph, as Turborepo's dependency hashing implies.</figcaption>
</figure>

The number to measure, then, is not how big a package is or how slow its build is. It is two numbers per package: how often it changes, and how many packages transitively depend on it. Their product is the expected cache invalidation the package causes per unit time, and the packages where both are high are where the CI minutes go.

## The churn-reach matrix

I call the two numbers churn and reach. Churn is the count of commits that touched the package in the last ninety days, from git history. Reach is the number of packages that transitively depend on it, from the package manifests.

Plot every workspace package on those two axes and the picture has four quadrants. Low churn, low reach: leaf packages that rarely change, harmless. High churn, low reach: applications and feature packages that change constantly and are imported by nobody, harmless too, because their rebuilds are their own. Low churn, high reach: stable foundations, configuration, type definitions, the packages everyone imports and nobody touches, harmless as long as they stay untouched. And high churn, high reach: the hot hubs, the packages that change often and are imported everywhere, and every commit to one of them is a tree-wide rebuild.

To see the shape on a real repository I ran the measurement on [cal.com](https://github.com/calcom/cal.com), a public Turborepo monorepo with 112 workspace packages, using the default branch's history over the ninety days to 18 September 2026 and the dependency declarations in each package manifest. Reach is dominated by six packages: the shared type definitions, TypeScript configuration, internationalisation, shared configuration, the date library wrapper and the general library package, each imported transitively by between 83 and 91 other packages. Churn is dominated by the application and the features package, which nobody imports. The two packages that sit in both lists are the internationalisation package, seven commits in the window and 89 dependents, and the library package, five commits and 83 dependents.

<figure class="chart">
<svg viewBox="0 0 640 380" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Churn against reach for the packages in the cal.com monorepo, with the hot hubs highlighted</title>
<desc id="f2-d">A scatter with churn, commits in ninety days, on the horizontal axis and reach, transitive dependents, on the vertical. Most of the 112 packages cluster at one commit and zero dependents. The types, tsconfig, config and dayjs packages sit at one commit and 84 to 91 dependents. The web app and features package sit at seven and ten commits with zero to five dependents. Two packages sit in the top right: i18n at seven commits and 89 dependents, and lib at five commits and 83 dependents, highlighted as the hot hubs.</desc>
<text x="0" y="18" class="viz-title">Two packages are where cal.com's cache misses come from</text>
<text x="0" y="36" class="viz-sub">Commits touching the package in 90 days against transitive dependents, 112 packages</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">100</text>
<line x1="56" y1="126" x2="600" y2="126" class="viz-grid"/><text x="48" y="130" text-anchor="end" class="viz-tick">75</text>
<line x1="56" y1="196" x2="600" y2="196" class="viz-grid"/><text x="48" y="200" text-anchor="end" class="viz-tick">50</text>
<line x1="56" y1="266" x2="600" y2="266" class="viz-grid"/><text x="48" y="270" text-anchor="end" class="viz-tick">25</text>
<line x1="56" y1="336" x2="600" y2="336" class="viz-axis"/><text x="48" y="340" text-anchor="end" class="viz-tick">0</text>
<text x="56" y="360" text-anchor="middle" class="viz-tick">0</text>
<text x="328" y="360" text-anchor="middle" class="viz-tick">5</text>
<text x="600" y="360" text-anchor="middle" class="viz-tick">10</text>
<line x1="328" y1="56" x2="328" y2="336" class="viz-grid"/>
<line x1="56" y1="196" x2="600" y2="196" class="viz-grid"/>
<text x="596" y="70" text-anchor="end" class="viz-tick">hot hubs</text>
<text x="60" y="70" class="viz-tick">stable foundations</text>
<text x="60" y="326" class="viz-tick">leaves: most packages sit here</text>
<text x="596" y="326" text-anchor="end" class="viz-tick">apps and features</text>
<circle cx="110.4" cy="81.2" r="6" class="viz-dgray"/><text x="120" y="78" class="viz-label-muted">types, 91</text>
<circle cx="110.4" cy="84" r="6" class="viz-dgray"/>
<circle cx="110.4" cy="100.8" r="6" class="viz-dgray"/><text x="120" y="108" class="viz-label-muted">config, dayjs, 84</text>
<circle cx="110.4" cy="238" r="6" class="viz-dgray"/><text x="120" y="242" class="viz-label-muted">prisma, 35</text>
<circle cx="110.4" cy="330" r="6" class="viz-dgray"/><text x="120" y="320" class="viz-label-muted">about 90 packages, churn 1, reach 0 to 7</text>
<circle cx="219.2" cy="305.2" r="6" class="viz-dgray"/><text x="229" y="300" class="viz-label-muted">ui, 11</text>
<circle cx="328" cy="316.4" r="6" class="viz-dgray"/><text x="338" y="312" class="viz-label-muted">trpc, 7</text>
<circle cx="436.8" cy="336" r="6" class="viz-dgray"/><text x="446" y="332" class="viz-label-muted">web app, 0</text>
<circle cx="436.8" cy="330.4" r="6" class="viz-dgray"/>
<circle cx="600" cy="322" r="6" class="viz-dgray"/><text x="592" y="312" text-anchor="end" class="viz-label-muted">features, 5</text>
<circle cx="436.8" cy="86.8" r="7" class="viz-d1"/><text x="448" y="92" class="viz-value">i18n: 7 commits, 89 deps</text>
<circle cx="328" cy="103.6" r="7" class="viz-d1"/><text x="300" y="120" text-anchor="end" class="viz-value">lib: 5, 83</text>
<circle cx="8" cy="374" r="5" class="viz-d1"/><text x="18" y="378" class="viz-label-muted">hot hub</text>
<circle cx="100" cy="374" r="5" class="viz-dgray"/><text x="110" y="378" class="viz-label-muted">other packages</text>
</svg>
<figcaption>Source: computed by the author from the <a href="https://github.com/calcom/cal.com">cal.com repository</a>, commits on the default branch in the ninety days to 18 September 2026 and dependency declarations in each package manifest; positions are jittered where packages overlap.</figcaption>
</figure>

The matrix says something specific about this repository that no cache metric would. The foundations, types and configuration, have enormous reach and almost no churn, so they cost nothing: a commit to them rebuilds everything, and there was one such commit in ninety days. The application changes constantly and costs only itself. The internationalisation package is the one to look at: it changes about as often as the application does, because adding a string to the interface means touching it, and it is imported by nearly everything, because nearly everything shows a string. Seven commits in ninety days, each invalidating 89 packages' cache keys, is the largest single source of rebuilds in the repository, and it comes from a package whose changes are individually trivial.

One caveat about the window is worth stating, because it changes the reading. Ninety days on cal.com's default branch, as cloned, contained 37 commits, which is a quiet period for that repository or a reflection of how its work is merged; a busier window would scale every churn number up but would not change the ranking, since the packages that get touched when strings and helpers change are the same ones. The matrix is insensitive to the window's length and sensitive to which packages are hubs, which is the property you want.

## The split rule

The rule that follows is that a hot hub gets split until it leaves the quadrant. Splitting means separating the part of the package that changes from the part that is imported. For an internationalisation package, that usually means the runtime, the functions every component calls, which is stable, and the message catalogue, the strings, which is what changes; if the catalogue is its own package that only the applications import, then adding a string invalidates the applications and not the ninety packages that merely call the translation function. For a general library package, it means splitting by domain, so that a change to a date helper does not invalidate the packages that import only a string helper, and the packages that import everything are made to import the pieces they use.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The four quadrants of the churn-reach matrix with the split rule applied to the hot-hub cell</title>
<desc id="f3-d">A two by two grid: churn on the horizontal axis, reach on the vertical. Bottom left, leaves: leave alone. Bottom right, apps and features: their rebuilds are their own. Top left, stable foundations: protect from churn. Top right, hot hubs: split the changing part from the imported part, and repeat until the package leaves the cell. An arrow shows a hot hub moving into the top-left and bottom-right cells after the split.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Stable foundations</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">protect from churn</text>
<rect x="336" y="60" width="256" height="120" rx="8" class="viz-box-accent"/>
<text x="464" y="96" text-anchor="middle" class="viz-label">Hot hubs</text>
<text x="464" y="118" text-anchor="middle" class="viz-label-muted">split the changing part from</text>
<text x="464" y="136" text-anchor="middle" class="viz-label-muted">the imported part, then repeat</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Leaves</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">leave alone</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Apps and features</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">their rebuilds are their own</text>
<path d="M400 150 C 300 150, 260 130, 240 140" class="viz-arrow" marker-end="url(#f3-ah)"/>
<path d="M480 170 C 480 230, 470 240, 464 246" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Churn: commits in 90 days</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Reach: transitive dependents</text>
</svg>
<figcaption>Illustrative: the matrix and the split rule; the arrows show where the two halves of a split hub land.</figcaption>
</figure>

The split is not free, and the matrix says when to pay for it. A package with high reach and one commit a quarter is not worth splitting, whatever its size, because it invalidates the tree once a quarter. A package with ten commits a week and two dependents is not worth splitting either. The product of churn and reach is the number to rank by, and the top of that ranking is a short list, two packages in cal.com's case, which is why the exercise fits in an afternoon rather than a quarter.

## Running it on your own repository

The measurement is two scripts. The first walks the package manifests, reads each package's declared dependencies, keeps the ones that are workspace packages, inverts the graph and counts transitive dependents per package. The second runs the git log for the window with file names, maps each touched file to the package directory that contains it, and counts commits per package. Join on the package name, multiply, sort. On a repository the size of cal.com the whole thing runs in under a minute once the history is cloned, and the output is a ranked list with two numbers beside each name.

The platform I build on is a Turborepo of the same shape, a Next.js application and a set of shared TypeScript packages, and the matrix is how the shared packages have been split over time: not by size, and not by what felt tidy, but by which package's commits were rebuilding the tree. The rule, hot hubs get split until they leave the quadrant, is simple enough that a reviewer can apply it to a pull request that adds a dependency: does this import make a hot hub hotter, or a foundation churnier? A faster remote cache answers neither question. The matrix answers both, from data the repository already has.
