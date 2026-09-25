---
title: A widget is a photograph of your app
date: 2026-09-04
summary: A home-screen widget is not a running view; it is a picture the launcher shows until you send a new one. Design for the age of the picture, not for the code that drew it.
tags: Android, Jetpack Glance, UX
topic: Mobile & Games
draft: false
---

The mental model most people bring to a home-screen widget is that it is a small window onto the app, a live view that happens to sit on the launcher. It is not. A widget is a picture. The app draws it, hands the drawing to the launcher, and the launcher shows that drawing until the app sends a new one, which may be minutes later, may be half an hour later, and may not happen at all if the system decides the phone is better off asleep. Jetpack Glance makes drawing the picture pleasant, with composables instead of RemoteViews by hand, and that pleasantness hides the fact that the result is still a snapshot. Designing a widget well means designing for the age of the snapshot.

## What the launcher actually holds

Under the composable surface, a Glance widget is translated into RemoteViews and sent to the launcher process; the [Glance documentation](https://developer.android.com/develop/ui/compose/glance/glance-app-widget) is explicit that to update the content, Glance must recreate the RemoteViews and send them again. Nothing recomposes on the launcher. A state change in the app does not reach the widget until something in the app calls update, and that something has to be running. The sequence, when it works, is: data changes, a worker or broadcast wakes the app, the widget's content is recomposed, new RemoteViews are built, the launcher redraws. Each arrow in that chain has a delay, and the first two can be deferred by the system.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The path from a data change to a redrawn widget</title>
<desc id="f1-d">Five boxes in sequence: data changes in the app's store; a WorkManager job or broadcast wakes the app; Glance recomposes the widget content; new RemoteViews are built and sent; the launcher redraws. Arrows between them are labelled with the kind of delay: scheduling, deferral, recomposition, transfer.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Every arrow is a delay, and two can be deferred</text>
<rect x="8" y="60" width="112" height="60" rx="8" class="viz-box"/>
<text x="64" y="86" text-anchor="middle" class="viz-label">Data changes</text>
<text x="64" y="104" text-anchor="middle" class="viz-label-muted">in the store</text>
<line x1="122" y1="90" x2="134" y2="90" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="138" y="60" width="112" height="60" rx="8" class="viz-box-accent"/>
<text x="194" y="86" text-anchor="middle" class="viz-label">Worker wakes</text>
<text x="194" y="104" text-anchor="middle" class="viz-label-muted">may be deferred</text>
<line x1="252" y1="90" x2="264" y2="90" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="268" y="60" width="112" height="60" rx="8" class="viz-box"/>
<text x="324" y="86" text-anchor="middle" class="viz-label">Recompose</text>
<text x="324" y="104" text-anchor="middle" class="viz-label-muted">Glance content</text>
<line x1="382" y1="90" x2="394" y2="90" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="398" y="60" width="112" height="60" rx="8" class="viz-box"/>
<text x="454" y="86" text-anchor="middle" class="viz-label">RemoteViews</text>
<text x="454" y="104" text-anchor="middle" class="viz-label-muted">built and sent</text>
<line x1="512" y1="90" x2="524" y2="90" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="528" y="60" width="104" height="60" rx="8" class="viz-box-ink"/>
<text x="580" y="86" text-anchor="middle" class="viz-on-ink">Launcher</text>
<text x="580" y="104" text-anchor="middle" class="viz-on-ink">redraws</text>
<text x="320" y="160" text-anchor="middle" class="viz-label-muted">Until the last box, the launcher shows the previous picture, however old it is.</text>
<text x="320" y="190" text-anchor="middle" class="viz-tick">the second box is where the system decides whether your app runs at all</text>
</svg>
<figcaption>Illustrative: the update chain as the Glance documentation describes it, drawn as a sequence.</figcaption>
</figure>

## How old the picture can be

The mechanisms that can trigger the second box have minimum intervals, and they are documented. The widget's own updatePeriodMillis setting delivers updates at most once every thirty minutes, whatever smaller value you write. A periodic WorkManager request has a [minimum repeat interval of fifteen minutes](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work), and the same page is careful to say that the exact time the worker runs also depends on constraints and system optimisations, and that a run can be delayed or skipped. Alarms can fire more often, but inexact alarms are batched and deferred in Doze, and [exact alarms](https://developer.android.com/develop/background-work/services/alarms/schedule) on Android 12 and later require a permission that the user can revoke. An immediate update, with no minimum at all, is available only when the app is already awake: the user is in it, or has just tapped the widget, or a push message has arrived.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Minimum interval between widget updates, by mechanism</title>
<desc id="f2-d">Horizontal bars in minutes: updatePeriodMillis, 30; periodic WorkManager, 15; exact alarm, no fixed floor but needs a permission and costs battery; immediate update while the app is awake, zero. The first two are the mechanisms available while the app is asleep.</desc>
<text x="0" y="18" class="viz-title">What "at most N minutes old" can actually be</text>
<text x="0" y="36" class="viz-sub">Documented minimum interval between updates, minutes</text>
<line x1="196" y1="52" x2="196" y2="188" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">updatePeriodMillis</text>
<path d="M196 58 H556 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="576" y="73" class="viz-value">30</text>
<text x="186" y="107" text-anchor="end" class="viz-label">Periodic WorkManager</text>
<path d="M196 92 H376 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="396" y="107" class="viz-value">15, and may be deferred</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Exact alarm</text>
<path d="M196 126 H208 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="228" y="141" class="viz-value">no floor; needs a permission, drains battery</text>
<text x="186" y="175" text-anchor="end" class="viz-label">App already awake</text>
<rect x="196" y="160" width="3" height="20" class="viz-f1"/>
<text x="212" y="175" class="viz-value">0, on demand</text>
<text x="0" y="222" class="viz-label-muted">While the app is asleep, the honest promise is thirty minutes, or fifteen with luck.</text>
</svg>
<figcaption>Source: the Android documentation for <a href="https://developer.android.com/develop/ui/compose/glance/glance-app-widget">Glance widgets</a>, <a href="https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work">periodic work</a> and <a href="https://developer.android.com/develop/background-work/services/alarms/schedule">alarms</a>, September 2026.</figcaption>
</figure>

The documentation's own advice is to avoid updating every minute when the app is not awake, because it drains the battery, and that advice is right. The consequence for design is that a widget's picture, while the app sleeps, is somewhere between fifteen and thirty minutes old on a good day and older when the system is conserving power. A widget that shows a number which changes every minute is showing a lie most of the time, drawn beautifully.

## The snapshot contract

So the design question is not "how do I keep the widget fresh" but "what does the picture promise, and how do I keep the promise given the mechanisms I have". I write that down as three promises, and choose the update mechanism to fit them.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">The snapshot contract: three promises and the mechanism under each</title>
<desc id="f3-d">Three columns. Promise one: what is shown is at most N minutes old, kept by choosing content that is true for N minutes and a periodic worker at that interval. Promise two: a tap lands on a screen that is fresh, kept by making the tap open the app and reload rather than act directly. Promise three: the widget never shows an error state, kept by rendering the last good snapshot and a timestamp rather than a failure.</desc>
<text x="0" y="18" class="viz-title">What the picture promises</text>
<rect x="8" y="40" width="200" height="180" rx="8" class="viz-box-accent"/>
<text x="108" y="66" text-anchor="middle" class="viz-label">At most N minutes old</text>
<text x="24" y="96" class="viz-label-muted">show content that stays</text>
<text x="24" y="114" class="viz-label-muted">true for N minutes</text>
<text x="24" y="142" class="viz-label-muted">periodic worker at N,</text>
<text x="24" y="160" class="viz-label-muted">immediate update when</text>
<text x="24" y="178" class="viz-label-muted">the app is open</text>
<text x="24" y="206" class="viz-tick">N is 15 or 30, not 1</text>
<rect x="220" y="40" width="200" height="180" rx="8" class="viz-box-accent"/>
<text x="320" y="66" text-anchor="middle" class="viz-label">A tap lands somewhere fresh</text>
<text x="236" y="96" class="viz-label-muted">the tap opens the app,</text>
<text x="236" y="114" class="viz-label-muted">which reloads before</text>
<text x="236" y="132" class="viz-label-muted">acting on anything</text>
<text x="236" y="160" class="viz-label-muted">no destructive action</text>
<text x="236" y="178" class="viz-label-muted">from a stale number</text>
<text x="236" y="206" class="viz-tick">a link, not a control</text>
<rect x="432" y="40" width="200" height="180" rx="8" class="viz-box-accent"/>
<text x="532" y="66" text-anchor="middle" class="viz-label">Never an error state</text>
<text x="448" y="96" class="viz-label-muted">keep the last good</text>
<text x="448" y="114" class="viz-label-muted">snapshot and show it</text>
<text x="448" y="142" class="viz-label-muted">add a small "as of"</text>
<text x="448" y="160" class="viz-label-muted">time when it is old</text>
<text x="448" y="206" class="viz-tick">failed refresh: no change</text>
<text x="320" y="250" text-anchor="middle" class="viz-label-muted">Choose the mechanism to keep the promises, not the promises to flatter the mechanism.</text>
</svg>
<figcaption>Illustrative: the contract as I write it for a widget; the mechanisms named are the ones the documentation offers.</figcaption>
</figure>

The first promise is about age: what is shown is at most N minutes old, and N is a number the mechanisms can keep, which means fifteen or thirty while the app sleeps, and the content shown has to be something that is still true after that long. For the habit tracker I built, that means today's habits and whether each is done, which changes a few times a day, rather than a countdown or a streak-at-risk timer that changes by the minute. The mechanism under the promise is a periodic worker at N plus an immediate update whenever the app is in the foreground, so that the common case, the user marks a habit done and goes back to the home screen, is instant.

The second promise is about the tap: it lands on a screen that is fresh. The temptation with a widget is to make it a control, with a tick box that marks the habit done without opening the app. That is fine when the picture is current and wrong when it is not, because the user is acting on a state that may have changed, and a destructive action from a stale snapshot is the worst outcome a widget can produce. So the tap opens the app to the relevant screen, the screen reloads, and the action happens there. The picture is a link, not a control. Where an in-place action is genuinely worth it, it is safe only for idempotent changes, and the widget must update itself immediately afterwards from the app's own state rather than assuming the tap succeeded.

The third promise is about failure: the widget never shows an error state. A refresh that fails, because the worker was deferred or the data was unavailable, leaves the last good snapshot in place; the launcher was already showing it, and replacing it with a message about a failed update is worse in every way. What the widget may do is show a small "as of" time once the snapshot is older than N, so that the user can tell, and so that the promise of age is visible rather than implied.

## The contract, written out

For the habit tracker, the contract reads like this. The widget shows today's habits and which are done, and it promises that the picture is at most thirty minutes old while the app is asleep and current whenever the app has just been used. It keeps the first half of that promise with a periodic worker at the documented floor and the second half with an update call in the app's lifecycle, fired when the user leaves the app, which is the moment they are most likely to look at the home screen. Tapping any habit opens the app on today's list with that habit in view; marking it done happens there, in a screen that has just read the store. The widget's own content is written so that it is still true after thirty minutes: a habit that was done at nine is still done at nine thirty, and a habit that was not done is still not done unless the user did it, in which case they did it in the app and the widget was updated on the way out.

What the first version had, and the contract removed, was a countdown to the end of the day. It looked good and it was wrong most of the time, because the launcher showed a countdown frozen at whatever minute the last snapshot was taken, and a frozen countdown is worse than none. The contract's first promise ruled it out, and the replacement, a plain count of habits remaining today, is true for as long as the snapshot lives.

## Designing for the age

The pattern generalises past Glance and past Android. Anything that renders a snapshot into a surface it does not control, a lock-screen complication, a status bar item, an email digest, a dashboard tile refreshed by a cron job, is a photograph of the system, and the same three questions apply: how old may it be, what happens when someone acts on it, and what does it show when the refresh fails. The composable that draws it is the easy part. The contract about its age is the design, and it is worth writing down before the first line of the widget, because the mechanisms do not bend to a promise made afterwards.
