---
title: Capabilities in code, roles in rows
date: 2026-09-25
summary: Permissions change with the code, so they live in code; roles change with a customer's org chart, so they live in rows. The deploy line is the test for which side each belongs on.
tags: RBAC, PostgreSQL, Multi-tenant SaaS
topic: Backend Architecture
draft: false
---

Teams arrive at a CRM migration with their roles already named. A company leaving Salesforce has profiles called things like Regional Sales Lead and Support Tier 2; a company leaving HubSpot has its own; and each expects to keep them, because the names are how the company describes itself. A permission system built as a single enum of roles cannot accept them without a code change and a deploy, and a permission system built as tables all the way down accepts them and then loses track of what any permission actually does. The way out is to notice that the two halves of the problem change for different reasons, and to put each half where its kind of change is cheap.

## Capabilities scale with the code

A capability is a thing the software can do: view a deal, edit a pipeline stage, export contacts, connect a mailbox. New capabilities appear when engineers ship features, and only then. The clearest public record of that relationship is AWS's own permission list, which is the set of IAM actions the platform recognises, one per API operation, published in its [service authorization reference](https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html). The [iam-dataset](https://github.com/iann0036/iam-dataset) project has tracked that list daily since 2020, and the count is a nearly straight line: about 7,500 actions in June 2020, 9,259 at the start of 2021, 16,214 at the start of 2024, and 21,916 in mid-September 2026, which is roughly two thousand new permissions a year, every year, added by nobody but the engineers who shipped the APIs behind them.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Number of AWS IAM actions, June 2020 to September 2026</title>
<desc id="f1-d">A single rising line: 7,505 actions in June 2020; 9,259 in January 2021; 11,834 in January 2022; 13,699 in January 2023; 16,214 in January 2024; 18,199 in January 2025; 20,270 in January 2026; 21,916 in September 2026. The growth is close to linear at about two thousand actions a year.</desc>
<text x="0" y="18" class="viz-title">Permissions grow with the code that needs them</text>
<text x="0" y="36" class="viz-sub">AWS IAM actions recognised by the platform, count at the start of each year</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">25k</text>
<line x1="56" y1="97.6" x2="600" y2="97.6" class="viz-grid"/><text x="48" y="101.6" text-anchor="end" class="viz-tick">20k</text>
<line x1="56" y1="139.2" x2="600" y2="139.2" class="viz-grid"/><text x="48" y="143.2" text-anchor="end" class="viz-tick">15k</text>
<line x1="56" y1="180.8" x2="600" y2="180.8" class="viz-grid"/><text x="48" y="184.8" text-anchor="end" class="viz-tick">10k</text>
<line x1="56" y1="222.4" x2="600" y2="222.4" class="viz-grid"/><text x="48" y="226.4" text-anchor="end" class="viz-tick">5k</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">0</text>
<text x="105" y="288" text-anchor="middle" class="viz-tick">2021</text>
<text x="191" y="288" text-anchor="middle" class="viz-tick">2022</text>
<text x="278" y="288" text-anchor="middle" class="viz-tick">2023</text>
<text x="365" y="288" text-anchor="middle" class="viz-tick">2024</text>
<text x="452" y="288" text-anchor="middle" class="viz-tick">2025</text>
<text x="538" y="288" text-anchor="middle" class="viz-tick">2026</text>
<polyline points="56,201.6 110,187 191,165.5 278,150 365,129.1 452,112.6 538,95.4 600,81.7" class="viz-s1"/>
<circle cx="56" cy="201.6" r="4" class="viz-d1"/>
<circle cx="600" cy="81.7" r="4" class="viz-d1"/>
<text x="64" y="222" class="viz-value">7,505</text>
<text x="592" y="76" text-anchor="end" class="viz-value">21,916</text>
<text x="328" y="312" text-anchor="middle" class="viz-label-muted">About two thousand new actions a year, each one shipped with the API behind it.</text>
</svg>
<figcaption>Source: computed by the author from the historic counts file in the <a href="https://github.com/iann0036/iam-dataset">iam-dataset</a> repository, which scrapes the AWS service authorization reference daily; values at the first recorded date of each year.</figcaption>
</figure>

The chart is the argument in one line. A capability is a property of the code, it changes when the code changes, and so it belongs in the code: a constant with a name, referenced at every point where it is enforced, so that searching the codebase for the name finds every place the permission matters. A capability stored only as a string in a table has no such property. Nobody can grep for it, nothing checks that the string in the row matches the string in the handler, and a typo in either is a permission that silently never applies.

## Roles scale with the customer

A role is a bundle of capabilities with a name a customer chose. It changes when the customer's organisation changes: a new team is formed, a manager wants their deputies to approve discounts, a regional structure is introduced. None of those events involve the software changing, so none of them should require a deploy, and a role that lives in an enum makes every one of them a ticket to engineering. The migration case makes this vivid. A team importing from another CRM brings dozens of role names, and the import either creates rows or it waits for a release.

The test that decides where a thing lives is a single question with two parts: who changes it, and does a deploy happen when they do? I call the boundary the deploy line.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The deploy line as a two-by-two</title>
<desc id="f2-d">A grid. Horizontal axis: who changes it, engineers on the left and the customer's admin on the right. Vertical axis: whether a deploy happens, yes at the top and no at the bottom. Top left: capabilities, code constants, changed by engineers with a deploy. Bottom right: roles and memberships, rows changed by the customer's admin with no deploy. Top right is marked as the failure where a customer's change needs a release. Bottom left holds default role templates, seeded by code into rows on boot.</desc>
<rect x="56" y="40" width="544" height="304" rx="8" class="viz-box"/>
<line x1="328" y1="40" x2="328" y2="344" class="viz-grid"/>
<line x1="56" y1="192" x2="600" y2="192" class="viz-grid"/>
<text x="192" y="104" text-anchor="middle" class="viz-label">Capabilities</text>
<text x="192" y="124" text-anchor="middle" class="viz-label-muted">constants in code, above the line</text>
<text x="464" y="104" text-anchor="middle" class="viz-label">The failure</text>
<text x="464" y="124" text-anchor="middle" class="viz-label-muted">a customer's change waits for a release</text>
<text x="192" y="256" text-anchor="middle" class="viz-label">Default role templates</text>
<text x="192" y="276" text-anchor="middle" class="viz-label-muted">code seeds rows on boot</text>
<text x="464" y="256" text-anchor="middle" class="viz-label">Roles and memberships</text>
<text x="464" y="276" text-anchor="middle" class="viz-label-muted">rows, scoped to the tenant</text>
<circle cx="464" cy="300" r="6" class="viz-d1"/>
<text x="328" y="372" text-anchor="middle" class="viz-label-muted">Who changes it: engineers, or the customer's admin</text>
<text x="20" y="192" transform="rotate(-90 20 192)" text-anchor="middle" class="viz-label-muted">Does a deploy happen: yes above, no below</text>
</svg>
<figcaption>Illustrative: the deploy line drawn as a grid; the dot marks the cell a migrated team's roles land in.</figcaption>
</figure>

Above the line, capabilities: engineers change them and a deploy happens, which is right, because a new capability only exists once the code that enforces it is running. Below the line, roles and memberships: the customer's admin changes them, no deploy happens, and the pass condition for the whole design is that an admin can create a role, name it, tick its capabilities and assign it, all before lunch and without anyone at the vendor knowing. The top-right cell is the failure, a customer change that needs a release, and it is where an enum of roles puts every customer. The bottom-left cell is the one people forget: the default roles a new tenant starts with, Admin and Member and Viewer, are defined by engineers but are still rows, seeded by code when the tenant is created so that the customer can rename or edit them afterwards.

## The schema

The shape that follows has four tables and one list that is not a table.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The schema: capabilities in code, three tenant-scoped tables in rows</title>
<desc id="f3-d">On the left, a box labelled capabilities, a list of constants in code such as deals.view, deals.edit, contacts.export, mailbox.connect, synced into a small reference table on boot. On the right, three tables: roles with tenant id and name; role capabilities linking a role to a capability; memberships linking a user to a tenant and a role. Arrows show the foreign keys and the boot-time sync.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One list in code, three tables in the tenant</text>
<rect x="8" y="44" width="200" height="120" rx="8" class="viz-box-ink"/>
<text x="24" y="70" class="viz-on-ink">capabilities (code)</text>
<text x="24" y="94" class="viz-on-ink">deals.view, deals.edit</text>
<text x="24" y="112" class="viz-on-ink">contacts.export</text>
<text x="24" y="130" class="viz-on-ink">mailbox.connect ...</text>
<text x="24" y="152" class="viz-on-ink">synced to a table on boot</text>
<rect x="240" y="44" width="180" height="70" rx="8" class="viz-box-accent"/>
<text x="256" y="70" class="viz-label">roles</text>
<text x="256" y="92" class="viz-label-muted">id, tenant_id, name</text>
<rect x="240" y="134" width="180" height="70" rx="8" class="viz-box-accent"/>
<text x="256" y="160" class="viz-label">role_capabilities</text>
<text x="256" y="182" class="viz-label-muted">role_id, capability</text>
<rect x="452" y="44" width="180" height="70" rx="8" class="viz-box-accent"/>
<text x="468" y="70" class="viz-label">memberships</text>
<text x="468" y="92" class="viz-label-muted">user, tenant, role</text>
<line x1="210" y1="170" x2="236" y2="170" class="viz-arrow" marker-end="url(#f3-ah)"/>
<line x1="330" y1="132" x2="330" y2="118" class="viz-arrow" marker-end="url(#f3-ah)"/>
<line x1="448" y1="79" x2="424" y2="79" class="viz-arrow" marker-end="url(#f3-ah)"/>
<text x="330" y="236" text-anchor="middle" class="viz-label-muted">capability references the synced list, so a typo cannot be saved</text>
<text x="330" y="266" text-anchor="middle" class="viz-tick">tables on the right carry a tenant id; the list on the left is shared by all tenants</text>
</svg>
<figcaption>Illustrative: the tables as I build them; names are examples, the shape is the point.</figcaption>
</figure>

The capabilities are a list of constants in the codebase, named in a dotted style that reads as the thing being permitted, and every handler that enforces one refers to the constant, never to a string. On boot the application syncs that list into a small reference table, which exists for one reason: so that the role_capabilities table can carry a foreign key to it and the database will refuse to store a capability that the code does not know. A capability removed from the code fails the sync loudly if any role still references it, which is the migration warning you want. Roles carry a tenant id and a customer-chosen name. Role capabilities link a role to the capabilities it grants. Memberships link a user to a tenant and a role, which is where a person's access actually comes from, and the check at request time is one join: does the caller's role in this tenant include this capability.

## Where the check runs

Keeping capabilities in code pays off at the point of enforcement. Every handler declares the capability it needs through one function, the only function in the codebase that is allowed to answer "may this caller do this", and the declaration is the constant, not a string. In a typed language the constants are an object whose keys the compiler knows, so a misspelt capability is a build error rather than a permission that quietly never applies. The check itself is the join described above, resolved once per request and cached for its duration, so that a screen that touches ten capabilities pays for one lookup.

Two tests keep the design honest. The first walks every registered route and asserts that each one declares a capability or is explicitly marked public, which catches the endpoint someone added in a hurry with no check at all. The second runs the boot-time sync against a copy of production's role_capabilities table and fails if any row references a capability the code no longer defines, which turns the removal of a feature into a visible migration step rather than a silent hole. Neither test knows anything about any customer's roles, which is the point: the rows can be anything, and the code is still checkable.

## The two failures, side by side

The all-in-code version, an enum of roles with permissions attached in a switch statement, fails the deploy line on every customer change, and its symptom is a backlog of tickets titled "add a role for". The all-in-tables version, with permissions as strings and roles as rows, passes the deploy line and fails the code: the strings drift from the handlers, nobody can find every place a permission is enforced, and the permissions table accumulates entries that no code checks any more. The split takes the half of each that is right. Code holds the list of what can be done, and the codebase is the single source of truth for it. Rows hold who can do it, per tenant, and the customer is the single source of truth for that.

The pass condition, again, is the one an imported team tests on day one: the admin who arrived with fourteen role names from the old system creates fourteen rows, maps each to the capabilities that match what the old profiles allowed, and assigns their people, and no engineer at the vendor learns about it except from the audit log. The permission list they mapped onto is the one in the code, which grew last week when a feature shipped and will grow next week when another does, which is exactly the rate at which permissions should change, and exactly the rate at which roles should not.
