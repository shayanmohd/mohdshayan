---
title: Your upload key is disposable
date: 2026-09-11
summary: Under Play App Signing the two keys are different classes: the upload key proves you are you and can be reset; the signing key is what devices trust. In 2026 the split sharpened.
tags: Android, Release Engineering, Post-Quantum
draft: false
---

Every Android release I ship passes through two keys, and for years the documentation described them as if they were siblings. They are not. Under Play App Signing, the upload key does one job: it proves to Google that the bundle came from the account that owns the app, and if it is lost or leaked it can be reset from the console in a day. The app signing key does a different job: it is what a device checks when it decides whether an update is really an update, and on older Android versions its loss or compromise is permanent, because the devices in the field will trust nothing else. Two keys, two security classes, and in 2026 Google sharpened the difference in a way that moves almost all of the operational risk onto the key you handle every release.

## Two keys, two classes

The [Play App Signing documentation](https://support.google.com/googleplay/android-developer/answer/9842756) is clear once you read it for the distinction. The upload key is yours: an RSA key of at least 2,048 bits in a keystore you hold, used to sign the bundle before upload, used by Google to verify your identity, and resettable if compromised or lost by generating a new one, exporting its certificate and requesting a reset in the console. The app signing key is Google's to hold: it signs the APKs that reach devices, you can let Google generate it or upload your own, and the page's warning is unambiguous about the alternative, that a key you manage yourself outside Play App Signing cannot be reset if you lose it.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">The key hierarchy under Play App Signing, and which devices verify which key</title>
<desc id="f1-d">Three boxes. The upload key, held by the developer, signs the bundle; Google verifies it and it can be reset. The classical app signing key, held by Google, signs the APKs that devices on Android 7 through 16 verify. The quantum-ready hybrid key, RSA-4096 plus ML-DSA-65, also held by Google, signs for devices on Android 17 and above, which strictly enforce it. Arrows show the bundle flowing from developer to Google and the signed APKs flowing to the two device populations.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">One key you hold, two keys Google holds</text>
<rect x="8" y="110" width="150" height="80" rx="8" class="viz-box-accent"/>
<text x="83" y="136" text-anchor="middle" class="viz-label">Upload key</text>
<text x="83" y="156" text-anchor="middle" class="viz-label-muted">held by you</text>
<text x="83" y="174" text-anchor="middle" class="viz-tick">resettable</text>
<line x1="160" y1="150" x2="216" y2="150" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="188" y="140" text-anchor="middle" class="viz-tick">bundle</text>
<rect x="220" y="50" width="200" height="200" rx="8" class="viz-box"/>
<text x="320" y="76" text-anchor="middle" class="viz-label">Google Play</text>
<rect x="236" y="92" width="168" height="60" rx="6" class="viz-box-ink"/>
<text x="320" y="116" text-anchor="middle" class="viz-on-ink">classical signing key</text>
<text x="320" y="134" text-anchor="middle" class="viz-on-ink">held by Google</text>
<rect x="236" y="164" width="168" height="70" rx="6" class="viz-box-ink"/>
<text x="320" y="188" text-anchor="middle" class="viz-on-ink">hybrid key</text>
<text x="320" y="206" text-anchor="middle" class="viz-on-ink">RSA plus ML-DSA-65</text>
<text x="320" y="224" text-anchor="middle" class="viz-on-ink">held by Google</text>
<line x1="422" y1="122" x2="478" y2="122" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="482" y="92" width="150" height="60" rx="8" class="viz-box"/>
<text x="557" y="116" text-anchor="middle" class="viz-label">Android 7 to 16</text>
<text x="557" y="134" text-anchor="middle" class="viz-label-muted">verify the classical key</text>
<line x1="422" y1="199" x2="478" y2="199" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="482" y="169" width="150" height="60" rx="8" class="viz-box"/>
<text x="557" y="193" text-anchor="middle" class="viz-label">Android 17 and above</text>
<text x="557" y="211" text-anchor="middle" class="viz-label-muted">enforce the hybrid key</text>
<text x="320" y="290" text-anchor="middle" class="viz-label-muted">The key you touch every release can be replaced; the ones devices trust never leave Google.</text>
<text x="320" y="314" text-anchor="middle" class="viz-tick">new apps are enrolled in hybrid signing with Google-generated keys by default</text>
</svg>
<figcaption>Source: the <a href="https://support.google.com/googleplay/android-developer/answer/9842756">Play App Signing help page</a>, September 2026; the device populations are the enforcement tiers it describes.</figcaption>
</figure>

## What changed in 2026

The 2026 change is the introduction of quantum-ready hybrid signing. New apps are now enrolled by default with Google-generated keys, and the app signing key becomes a pair: a classical RSA 4096-bit key and a post-quantum ML-DSA-65 key, combined so that a device can verify either. Developers can request an annual key upgrade that applies to all installs on Android 17 and above, and only Android 17, API level 37, and later strictly enforces the upgraded hybrid key. The page also notes a limitation that matters for release engineering: apps using hybrid signing are excluded from v4 signing, the [signature scheme](https://source.android.com/docs/security/features/apksigning) that supports optimised distribution on Android 11 and later, because the two are not yet compatible.

Read from the seat of someone who owns release engineering for a set of apps, the change does two things. It removes the last reason to hold your own app signing key, because a Google-generated hybrid key is now the default and the post-quantum half is something no team is going to generate and rotate correctly by hand. And it makes the enforcement of the new key a property of the device population rather than of the app, which means the fleet decides how much the new key matters. The fleet, per the [version distribution](https://apilevels.com/) compiled from April 2026 data, is where the honest picture is.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Share of active Android devices in each signing enforcement tier, April 2026</title>
<desc id="f2-d">Horizontal bars in percent of active devices: Android 13 to 16, where the latest classical key is enforced, 68.9 percent; Android 7 to 12, where verification runs through Play Protect and the classical key, 27.7 percent; below Android 7, 3.4 percent; Android 17 and above, where the hybrid key is enforced, zero percent, still in beta at the data date.</desc>
<text x="0" y="18" class="viz-title">The devices that enforce the new key do not exist yet</text>
<text x="0" y="36" class="viz-sub">Percent of active Android devices by version range, April 2026 distribution</text>
<line x1="216" y1="52" x2="216" y2="188" class="viz-axis"/>
<text x="206" y="73" text-anchor="end" class="viz-label">Android 13 to 16</text>
<path d="M216 58 H492 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="512" y="73" class="viz-value">68.9</text>
<text x="206" y="107" text-anchor="end" class="viz-label">Android 7 to 12</text>
<path d="M216 92 H327 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="347" y="107" class="viz-value">27.7</text>
<text x="206" y="141" text-anchor="end" class="viz-label">Below Android 7</text>
<path d="M216 126 H230 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H216 Z" class="viz-fgray"/>
<text x="250" y="141" class="viz-value">3.4</text>
<text x="206" y="175" text-anchor="end" class="viz-label">Android 17 and above</text>
<rect x="216" y="160" width="3" height="20" class="viz-f1"/>
<text x="232" y="175" class="viz-value">0, in beta at the data date</text>
<text x="0" y="222" class="viz-label-muted">Four pixels per percentage point. The hybrid key is enforced only on the empty bar.</text>
<text x="0" y="246" class="viz-tick">shares are derived from the cumulative figures on the source page</text>
</svg>
<figcaption>Source: derived from the cumulative distribution on <a href="https://apilevels.com/">apilevels.com</a>, updated May 2026 with April 2026 data; the tier boundaries follow the Play App Signing enforcement described in the text.</figcaption>
</figure>

The distribution says the new key is, for now, a future-proofing measure and not an operational one: in April 2026 no active device enforced it, over two thirds of devices enforced the latest classical key, and a quarter were on versions where the classical key is verified through Play's own protections. The hybrid key will matter as Android 17 devices ship, and by then the apps enrolled today will already be signed with it, which is the point of doing it by default.

## The upload-key firewall

If the app signing key is Google's and the devices' concern, then everything the release process can get wrong is concentrated in the upload key, and the practice I call the upload-key firewall follows. Treat the upload key as a disposable credential. Rotate it on any suspicion, not on proof; the reset is a form and a day, and the cost of an unnecessary rotation is nothing. Keep it in the continuous integration system's secret store and nowhere else: not in a repository, not in a shared drive, not in a keystore file on a laptop that also has the source code. And never let the two keys share a machine, a person or a backup: the app signing key should not be held at all, and if a legacy app's key is still held, it lives in a place the release pipeline cannot reach.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">APK signature schemes by the Android version that introduced them, through the 2026 hybrid signing change</title>
<desc id="f3-d">A timeline of signature schemes: v1 JAR signing from the beginning; v2 in Android 7.0; v3 in Android 9, with key rotation; v4 in Android 11, for optimised distribution; v3.1 in Android 13; and in 2026, quantum-ready hybrid signing enforced from Android 17, which is not yet compatible with v4.</desc>
<circle cx="420" cy="18" r="5" class="viz-d1"/><text x="430" y="22" class="viz-label-muted">signature scheme</text>
<circle cx="560" cy="18" r="5" class="viz-d4"/><text x="570" y="22" class="viz-label-muted">key change</text>
<line x1="40" y1="120" x2="600" y2="120" class="viz-axis"/>
<circle cx="60" cy="120" r="6" class="viz-d1"/>
<text x="60" y="94" text-anchor="middle" class="viz-tick">from the start</text>
<text x="60" y="76" text-anchor="middle" class="viz-label">v1, JAR signing</text>
<circle cx="180" cy="120" r="6" class="viz-d1"/>
<text x="180" y="154" text-anchor="middle" class="viz-tick">Android 7.0</text>
<text x="180" y="172" text-anchor="middle" class="viz-label">v2, whole-file</text>
<circle cx="290" cy="120" r="6" class="viz-d1"/>
<text x="290" y="94" text-anchor="middle" class="viz-tick">Android 9</text>
<text x="290" y="76" text-anchor="middle" class="viz-label">v3, key rotation</text>
<circle cx="390" cy="120" r="6" class="viz-d1"/>
<text x="390" y="154" text-anchor="middle" class="viz-tick">Android 11</text>
<text x="390" y="172" text-anchor="middle" class="viz-label">v4, streaming</text>
<circle cx="470" cy="120" r="6" class="viz-d1"/>
<text x="470" y="94" text-anchor="middle" class="viz-tick">Android 13</text>
<text x="470" y="76" text-anchor="middle" class="viz-label">v3.1</text>
<circle cx="580" cy="120" r="6" class="viz-d4"/>
<text x="580" y="154" text-anchor="middle" class="viz-tick">2026, Android 17</text>
<text x="580" y="172" text-anchor="middle" class="viz-label">hybrid key</text>
<text x="320" y="220" text-anchor="middle" class="viz-label-muted">Each scheme changed what a device checks; 2026 is the first to change the key's mathematics.</text>
<text x="320" y="246" text-anchor="middle" class="viz-tick">hybrid signing is not yet compatible with v4, so those apps lose optimised distribution</text>
</svg>
<figcaption>Source: the <a href="https://source.android.com/docs/security/features/apksigning">Android APK signing documentation</a> for the scheme versions and the <a href="https://support.google.com/googleplay/android-developer/answer/9842756">Play App Signing help page</a> for the 2026 change.</figcaption>
</figure>

The firewall is a practice, not a product, and it has a few specific rules. The upload keystore is generated on the build machine or in the secret store's own key generation, never on a personal laptop, and its password lives in the same secret store under a separate entry. The certificate, which is public, is what gets registered with Play; the keystore itself never leaves the pipeline. The reset procedure is rehearsed once, on a test app, so that the day it is needed for a real one it takes an hour and not a weekend. And the release process records which upload key signed which release, so that a rotation is a dated event in the log rather than a mystery a year later.

## What still cannot be reset

The honest exception is the legacy app. An app published before Play App Signing existed, still signed with a key its developers hold, is outside the model: its signing key is the one devices trust, Google does not hold a copy, and the help page's warning applies in full. For those apps the right move is to enrol, which for an existing app means uploading the current key to Google once, under the enrolment's protections, and then treating it as gone from the team's hands. The firewall's rules apply from that day. Until it is done, the legacy key is an asset that a lost laptop or a departed colleague can destroy, and the annual key upgrade that the hybrid scheme offers cannot reach it.

There is also a class of device the new key will never help, and it is the quarter of the fleet on Android 7 to 12. Those devices verify the classical key, and they will keep verifying it for as long as they are in use, which for budget hardware in the markets I ship to is years. The hybrid key protects the future fleet against a threat that does not exist yet; the classical key protects the present fleet against threats that do, and Google's holding both is what makes the arrangement work. The upload key, meanwhile, protects neither. It protects the account, for one release at a time, and that is why it can be thrown away.

## Why the split matters more now

For a small team shipping several apps under one account, the practical effect of the 2026 change is that the risk profile got simpler. There used to be two keys to protect, one of them irreplaceable. Now there is one key to protect, it is replaceable, and the irreplaceable one is held by a party whose job is to hold it, in a form, hybrid post-quantum signing, that a small team could not produce on its own. The right response is not to relax about the upload key but to treat it as what it has become: the only credential in the release process that a mistake can expose, and one whose exposure costs a day. Disposable is the correct word, and a disposable credential is handled by assuming it will be disposed of.
