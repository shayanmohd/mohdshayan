---
title: Without a TO clause, every policy is public
date: 2026-10-15
summary: A policy without a TO clause applies to PUBLIC, which includes anon. That made KabutarBaazi's listings and profiles readable with a curl and the key inside the APK.
tags: PostgreSQL, Row-Level Security, Supabase
topic: Backend Architecture
draft: false
---

KabutarBaazi is a marketplace app for pigeon keepers, and its Android client talks to Postgres directly through PostgREST, with the Supabase anon key compiled into the APK. No API server of mine sits between the app and the tables it reads, so row-level security is the only boundary between one user and everybody else's data. I wrote 61 policies for its 26 tables, and not one had a TO clause. In PostgreSQL a policy without one applies to PUBLIC, every role, including anon, the role of a request with no login. So the listings feed and the entire profiles table could be read with a plain curl and the key from the app. The local test suite could not catch it without one deliberate line, because its throwaway database is otherwise stricter than production. The lesson is narrower than "test your policies": a test environment more locked down than production cannot catch a production leak.

## The key in the APK is public

`app/build.gradle.kts` reads `SUPABASE_ANON_KEY` from `local.properties` into `BuildConfig`, and `SupabaseFactory.kt` hands it to the client. Anyone with the APK can read the string. Supabase's [API keys page](https://supabase.com/docs/guides/api/api-keys), read on 12 October 2026, says its publishable key is "Safe to expose online: web page, mobile or desktop app, GitHub actions, CLIs, source code" and that "Anyone can read it, so it only reaches what Row Level Security allows." The same page now calls the anon key the "Legacy version of publishable keys" and says Supabase "is deprecating the `anon` and `service_role` keys by the end of 2026". The comfortable reading of that sentence is that RLS protects you. The accurate one is that RLS is all that protects you.

The key chooses a database role. The [PostgREST authentication docs](https://docs.postgrest.org/en/latest/references/auth.html) say that "When a request contains a valid JWT with a role claim PostgREST will switch to the database role with that name for the duration of the HTTP request". The anon key is itself such a JWT, "JWT (long-lived)" on the API keys page, and the copy in `docs/delete-account.html` decodes to `"role":"anon"`. A request carrying only that key runs as `anon`, which Supabase's [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) describes as "an unauthenticated request"; a signed-in user's request runs as `authenticated`, "an authenticated request". KabutarBaazi requires a login for every screen, so all but three of the policies were written with a signed-in user in mind. The policies were about which user. The leak was about which role.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">How the anon key reaches the tables, and the path a policy without a TO clause opened</title>
<desc id="f1-d">A flow. The Android APK, carrying the anon key, calls PostgREST, which switches to the authenticated role when a user JWT is present and to the anon role when only the anon key is sent; Postgres then applies row-level security on 26 tables and returns the rows the policies allow. A second path follows the anon role: with no user JWT auth.uid() is null, a policy with no TO clause applies to PUBLIC, which includes anon, and because not is_blocked_with(x) is true for a null user the listings and profiles policies passed and their rows were readable. A note records that migration 0006 altered 58 of the 61 policies to authenticated and revoked anon's table privileges.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One key, two roles, and a policy that did not say which</text>
<text x="0" y="36" class="viz-sub">The key in the APK is public; the JWT sent decides which role PostgREST becomes</text>
<rect x="8" y="50" width="130" height="60" rx="8" class="viz-box"/>
<text x="73" y="76" text-anchor="middle" class="viz-label">Android APK</text>
<text x="73" y="94" text-anchor="middle" class="viz-label-muted">anon key inside</text>
<line x1="140" y1="80" x2="166" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="170" y="50" width="150" height="60" rx="8" class="viz-box-accent"/>
<text x="245" y="76" text-anchor="middle" class="viz-label">PostgREST</text>
<text x="245" y="94" text-anchor="middle" class="viz-label-muted">switches role</text>
<line x1="322" y1="80" x2="348" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="352" y="50" width="140" height="60" rx="8" class="viz-box"/>
<text x="422" y="76" text-anchor="middle" class="viz-label">Postgres</text>
<text x="422" y="94" text-anchor="middle" class="viz-label-muted">RLS on 26 tables</text>
<line x1="494" y1="80" x2="520" y2="80" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="524" y="50" width="108" height="60" rx="8" class="viz-box"/>
<text x="578" y="76" text-anchor="middle" class="viz-label">Rows</text>
<text x="578" y="94" text-anchor="middle" class="viz-label-muted">policy allows</text>
<line x1="245" y1="112" x2="245" y2="134" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="225" y1="112" x2="90" y2="134" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="170" y="138" width="150" height="40" rx="6" class="viz-box"/>
<text x="245" y="155" text-anchor="middle" class="viz-label">authenticated</text>
<text x="245" y="171" text-anchor="middle" class="viz-label-muted">user JWT present</text>
<text x="330" y="162" class="viz-tick">the role 58 of 61 were written for</text>
<rect x="8" y="138" width="130" height="40" rx="6" class="viz-box-accent"/>
<text x="73" y="155" text-anchor="middle" class="viz-label">anon</text>
<text x="73" y="171" text-anchor="middle" class="viz-label-muted">no user JWT</text>
<line x1="73" y1="180" x2="73" y2="204" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="632" y="200" text-anchor="end" class="viz-tick">the leak path, before 0006</text>
<rect x="8" y="208" width="130" height="56" rx="8" class="viz-box-accent"/>
<text x="73" y="232" text-anchor="middle" class="viz-label">anon</text>
<text x="73" y="250" text-anchor="middle" class="viz-label-muted">auth.uid() is null</text>
<line x1="140" y1="236" x2="166" y2="236" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="170" y="208" width="206" height="56" rx="8" class="viz-box"/>
<text x="273" y="232" text-anchor="middle" class="viz-label">policy with no TO clause</text>
<text x="273" y="250" text-anchor="middle" class="viz-label-muted">applies to PUBLIC, anon too</text>
<line x1="378" y1="236" x2="404" y2="236" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="408" y="208" width="224" height="56" rx="8" class="viz-box-ink"/>
<text x="520" y="232" text-anchor="middle" class="viz-on-ink">not is_blocked_with(x) is true</text>
<text x="520" y="250" text-anchor="middle" class="viz-on-ink">listings and profiles readable</text>
<text x="0" y="292" class="viz-label-muted">0006 alters 58 of the 61 policies to authenticated and revokes anon's table privileges</text>
</svg>
<figcaption>Illustrative: the layout is mine; the role switch is from the <a href="https://docs.postgrest.org/en/latest/references/auth.html">PostgREST authentication docs</a> and the PUBLIC default from the <a href="https://www.postgresql.org/docs/current/sql-createpolicy.html">PostgreSQL CREATE POLICY page</a>; the table and policy counts are from the repository's migrations.</figcaption>
</figure>

## Sixty-one policies and no TO clause

`supabase/migrations/0003_rls.sql` enables RLS on all 26 tables from `0001_schema.sql` and creates 61 policies. Only the parent table carries the visibility predicate; a child gates on an `exists` against its parent, which RLS filters in turn, unless its rows are the user's own, like saved listings. The profiles policy reads:

```sql
create policy profiles_read on profiles for select
  using (id = (select auth.uid()) or is_admin()
         or (not is_suspended and not is_blocked_with(id)));
```

The listings policy has the same shape: admin, or the seller, or not hidden, not removed and `not is_blocked_with(seller_id)`.

`is_blocked_with`, in `0002_functions_triggers.sql`, is a security definer function that looks in `blocks` for a row pairing `auth.uid()` with the other user in either direction. Run it with only the anon key, no user JWT. `auth.uid()` is null, `blocker_id = null` is never true, no row matches, and `not is_blocked_with(seller_id)` is true for every seller. In `profiles_read` the first branch is null, `is_admin()` is false, and the third branch is true for every profile that is not suspended: the whole table. In `listings_read`, every listing not hidden or removed. The policy was correct for every signed-in user and wide open for the one caller I had not pictured.

The PostgreSQL manual's [CREATE POLICY page](https://www.postgresql.org/docs/current/sql-createpolicy.html) says it plainly. For `TO role_name`: "The default is PUBLIC, which will apply the policy to all roles." Supabase's RLS guide has a heading for this, "Specify roles in your policies", whose first line is: "Always name the role a policy applies to, using the `to` clause." I had read both. Writing the content policies I was thinking about users, and a rule about roles did not feel like it was about me. The comment at the top of `0006_restrict_anon.sql` records how I found out: against the live project, "a plain `curl` with only the anon key returned both", the feed and the profiles.

## One migration and two lines of defence

The fix, `supabase/migrations/0006_restrict_anon.sql`, is 43 lines. A `do` block reads every policy in the public schema from `pg_policies`, skips a keep list of three, and runs `alter policy ... to authenticated` on the other 58. The three left on PUBLIC are `regions_read` and `breeds_read`, reference data, and `deletion_insert_public`, insert-only, for the public account-deletion page Play requires. Then the second line: `revoke all on all tables in schema public from anon`, and grant anon exactly select on `regions` and `breeds` and insert on `deletion_requests`, plus execute on `username_available(text)`, for a signup form before a session exists; `SessionRepository.kt` wraps it, and no screen calls it yet. A role with no privilege on a table cannot reach it, so on the tables that existed when the revoke ran, a policy written later without a TO clause fails closed for anon. A new table gets the automatic grants again, which is why the README's first invariant is a rule and not a mechanism.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Policies in KabutarBaazi's public schema by role, before and after migration 0006</title>
<desc id="f2-d">Horizontal bars at eight pixels per policy. Before 0006, all 61 policies applied to PUBLIC because none named a role. After 0006, 58 are scoped to authenticated and 3 are left on PUBLIC: regions_read, breeds_read and deletion_insert_public.</desc>
<text x="0" y="18" class="viz-title">Fifty-eight of sixty-one policies now name their role</text>
<text x="0" y="36" class="viz-sub">Policies in the public schema by the role they apply to, before and after migration 0006</text>
<line x1="136" y1="52" x2="136" y2="170" class="viz-axis"/>
<text x="126" y="72" text-anchor="end" class="viz-label">Before 0006</text>
<text x="620" y="54" text-anchor="end" class="viz-value">61 policies, no TO clause, so all PUBLIC</text>
<path d="M136 58 H620 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="126" y="114" text-anchor="end" class="viz-label">To authenticated</text>
<path d="M136 100 H596 a4 4 0 0 1 4 4 V116 a4 4 0 0 1 -4 4 H136 Z" class="viz-f1"/>
<text x="616" y="114" class="viz-value">58</text>
<text x="126" y="156" text-anchor="end" class="viz-label">Left PUBLIC</text>
<path d="M136 142 H156 a4 4 0 0 1 4 4 V158 a4 4 0 0 1 -4 4 H136 Z" class="viz-fgray"/>
<text x="176" y="156" class="viz-value">3: regions, breeds, the deletion form</text>
<text x="0" y="196" class="viz-label-muted">Eight pixels per policy; the three left public are reference data or insert-only.</text>
<text x="0" y="218" class="viz-tick">0006 loops over pg_policies and alters every policy not in its keep list</text>
</svg>
<figcaption>Source: counted from <a href="https://github.com/shayanmohd/kabutarbaazi/blob/main/supabase/migrations/0003_rls.sql">supabase/migrations/0003_rls.sql</a>, which has 61 create policy statements, and <a href="https://github.com/shayanmohd/kabutarbaazi/blob/main/supabase/migrations/0006_restrict_anon.sql">0006_restrict_anon.sql</a>, whose keep list has three names; read on 12 October 2026.</figcaption>
</figure>

## The test that could not fail

The reason a local suite misses it is the harness. `supabase/tests/run_tests.sh` runs `initdb` into a throwaway directory, starts a cluster on port 55432 with `listen_addresses=''` so it answers only on a socket, applies a harness that stubs what Supabase provides (`auth.users`, `auth.uid()` and the three roles), then applies every migration and runs the assertions. No Docker, and nothing touches the live project.

On a bare Postgres a new role can read nothing: the manual's [privileges page](https://www.postgresql.org/docs/current/ddl-priv.html) says "No privileges are granted to PUBLIC by default on tables, table columns, sequences" and the rest. The harness's `anon` would have been refused by the missing grant before any policy was consulted. A hosted Supabase project is the opposite. Its [hardening guide](https://supabase.com/docs/guides/database/hardening-data-api), read on 12 October 2026, says that on existing projects "tables created in `public` receive `SELECT`, `INSERT`, `UPDATE`, and `DELETE` privileges" for "`anon`, `authenticated`, and `service_role` by default". The page says that default is changing to opt-in; my project has the old one, or the curl would have been refused. Production handed anon a privilege on every table and relied on the policies; my test database handed anon nothing.

`supabase/tests/01_grants.sql` is the correction. It grants `all on all tables in schema public to anon`, with a comment saying why: "without this line the local suite is more restrictive than production and cannot catch an anon leak." It then re-applies the `profiles` column whitelist that the file's blanket grant to `authenticated` undoes, without which any user could run `update profiles set role = 'admin'`. Only once the test database is as open as production does `rls_test.sql` run. Its last block, a regression guard headed "ANONYMOUS ACCESS (the anon key ships inside the APK, so it is effectively public)", switches to the anon role with an empty `sub` claim and asserts that profiles, listings, reels, community posts, messages and private contacts come back empty, and that regions, breeds and `username_available()` still work. Nine assertions out of 53, and the only nine that would have caught the leak.

<figure class="chart">
<svg viewBox="0 0 640 290" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The 53 RLS assertions by the role they run under</title>
<desc id="f3-d">Horizontal bars at eight pixels per assertion. 24 assertions are checked under the authenticated role, 20 from the superuser (14 read side effects after a user has acted, such as a trigger's counter or the audit log, and 6 are t_raises calls that switch to a user inside and expect a refusal), and 9 as anon in the anonymous-access block, of which 6 assert that anon cannot read profiles, listings, reels, posts, messages or phone contacts, and 3 assert that anon can still read regions and breeds and check a username.</desc>
<text x="0" y="18" class="viz-title">Nine of the 53 assertions run as anon</text>
<text x="0" y="36" class="viz-sub">Assertions in rls_test.sql by the role in effect when each is checked</text>
<line x1="176" y1="52" x2="176" y2="250" class="viz-axis"/>
<text x="166" y="72" text-anchor="end" class="viz-label">As authenticated</text>
<path d="M176 58 H364 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="384" y="72" class="viz-value">24</text>
<text x="406" y="72" class="viz-tick">what the user sees or can do</text>
<text x="166" y="114" text-anchor="end" class="viz-label">As superuser</text>
<path d="M176 100 H332 a4 4 0 0 1 4 4 V116 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="352" y="114" class="viz-value">20</text>
<text x="374" y="114" class="viz-tick">14 side effects, 6 t_raises calls</text>
<text x="166" y="156" text-anchor="end" class="viz-label">As anon</text>
<path d="M176 142 H244 a4 4 0 0 1 4 4 V158 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="264" y="156" class="viz-value">9</text>
<text x="166" y="198" text-anchor="end" class="viz-label">of which CANNOT read</text>
<path d="M176 184 H220 a4 4 0 0 1 4 4 V200 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="240" y="198" class="viz-value">6</text>
<text x="262" y="198" class="viz-tick">profiles, listings, reels, posts, messages, phones</text>
<text x="166" y="240" text-anchor="end" class="viz-label">of which CAN still</text>
<path d="M176 226 H196 a4 4 0 0 1 4 4 V242 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="216" y="240" class="viz-value">3</text>
<text x="238" y="240" class="viz-tick">regions, breeds, username check</text>
<text x="0" y="280" class="viz-label-muted">Eight pixels per assertion; 46 t() calls and 7 t_raises() calls make 53.</text>
</svg>
<figcaption>Source: counted assertion by assertion from <a href="https://github.com/shayanmohd/kabutarbaazi/blob/main/supabase/tests/rls_test.sql">supabase/tests/rls_test.sql</a> on 12 October 2026, by the role set before each; the README states the same 53.</figcaption>
</figure>

## As open as production, then test for closure

The rule I take from this is about fixtures, not assertions. Every stub in a test harness is a place where the test environment can be stricter than production without anyone noticing, because strictness never fails a test; it only makes passes meaningless. The test-side fix was nine assertions and a less safe fixture, and the fixture is the half that mattered, commented so nobody tidies it away: without it the CANNOT assertions would have met a missing grant, not a policy. The 94 JVM tests in `domain/` could never have found this, because the bug was not in a code path. It was in a default.

The README carries the rule as its first invariant: never write a policy without a `TO` clause. A boundary that depends on a default is only as safe as your memory of what the default is. Migrations, harness and the curl-shaped hole are all in the [KabutarBaazi repository](https://github.com/shayanmohd/kabutarbaazi).
