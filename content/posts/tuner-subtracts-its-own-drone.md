---
title: The tuner subtracts its own drone
date: 2026-10-14
summary: A tuner that plays a drone through the speaker can hear itself louder than the player. Beatwheel cancels its own drone with a recursive least squares filter and shows beats near unison.
tags: Android, Signal Processing, Audio
topic: Mobile & Games
draft: false
---

Beatwheel is a strobe tuner for Android that keeps a drone sounding while it measures the note played against it. On the phone's speaker the microphone can hear the drone louder than the player, so a tuner that measures the mixture measures its own drone. The app tracks the room's gain and phase at the drone's fundamental and first eight harmonics with a recursive least squares filter that forgets over about two seconds, and subtracts the estimate; each partial becomes a notch well under 1 Hz wide, so a player a few hertz away passes through. Within 1.5 Hz of a partial the two tones cannot honestly be separated, so there the app shows signed beats per second instead of cents. The lesson is to work out what the physics allows and pin it in a test: a player 23.4 cents sharp of the drone reads within half a cent with the canceller on, and with it off the test accepts only a reading more than three cents adrift, or none.

## The number the test pins

The test is `DroneCancellerTest` in `app/src/test/kotlin/com/mohdshayan/beatwheel/core/DspTest.kt`, and it runs on the JVM with synthetic signals. It renders four seconds of the reed drone at 440 Hz at unit gain from a table that peaks at 0.9, passes it through a simulated room, a direct path delayed 37 samples at a gain of 0.9 plus one reflection at 211 samples and 0.3, and mixes in a player at 446 Hz at an amplitude of 0.5 with harmonics in the ratio 1.0, 0.5 and 0.25. 446 against 440 is 1200 log2(446/440), which is 23.45 cents. With the canceller told the drone is at 440 Hz, the estimator must report MIDI 69, lock the strobe, and read 23.4 cents within 0.5. The same signal then runs with the canceller cleared, and that assertion is loose on purpose: either no pitch at all, or a reading more than three cents from 23.4. The comment above it says why: without cancellation the drone drags the reading toward its own pitch.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">What DspTest.kt requires of the reading, in cents sharp of A 440</title>
<desc id="f1-d">Horizontal bars. The true offset of a 446 Hz player against a 440 Hz drone is 23.45 cents. With the canceller on, the test requires a reading of 23.4 cents within 0.5. With the canceller off, the test accepts any reading more than 3 cents from 23.4, shown as shaded spans below 20.4 and above 26.4 cents, or no reading at all. A fourth bar shows the half-cent demodulator test: 440.127 Hz must read 0.5 cents within 0.1.</desc>
<text x="0" y="18" class="viz-title">The number the canceller is tested against</text>
<text x="0" y="36" class="viz-sub">Cents sharp of A 440 in DspTest.kt; a 446 Hz player over a 440 Hz reed drone</text>
<line x1="190" y1="52" x2="190" y2="236" class="viz-axis"/>
<text x="180" y="70" text-anchor="end" class="viz-label">True offset</text>
<text x="180" y="88" text-anchor="end" class="viz-label-muted">446 against 440 Hz</text>
<path d="M190 58 H561.2 a4 4 0 0 1 4 4 V70 a4 4 0 0 1 -4 4 H190 Z" class="viz-fgray"/>
<text x="571" y="70" class="viz-value">23.45</text>
<text x="180" y="116" text-anchor="end" class="viz-label">Canceller on</text>
<text x="180" y="134" text-anchor="end" class="viz-label-muted">accepts 22.9 to 23.9</text>
<path d="M190 104 H560.4 a4 4 0 0 1 4 4 V116 a4 4 0 0 1 -4 4 H190 Z" class="viz-f1"/>
<rect x="556.4" y="100" width="16" height="24" rx="2" class="viz-s4"/>
<text x="580" y="116" class="viz-value">23.4</text>
<text x="180" y="162" text-anchor="end" class="viz-label">Canceller off</text>
<text x="180" y="180" text-anchor="end" class="viz-label-muted">must miss by more than 3</text>
<rect x="190" y="150" width="326.4" height="16" rx="4" class="viz-a4"/>
<rect x="612.4" y="150" width="19.6" height="16" rx="4" class="viz-a4"/>
<text x="196" y="180" class="viz-label-muted">any reading below 20.4 or above 26.4, or no pitch found</text>
<text x="180" y="208" text-anchor="end" class="viz-label">Half-cent test</text>
<text x="180" y="226" text-anchor="end" class="viz-label-muted">440.127 Hz, no drone</text>
<path d="M190 196 H194 a4 4 0 0 1 4 4 V208 a4 4 0 0 1 -4 4 H190 Z" class="viz-f1"/>
<text x="206" y="208" class="viz-value">0.5, accepts 0.4 to 0.6</text>
<text x="0" y="262" class="viz-label-muted">Sixteen pixels per cent; shading is what the test accepts with the canceller off.</text>
<text x="0" y="284" class="viz-tick">1200 log2(446/440) is 23.45 cents; the test allows 23.4 within 0.5</text>
</svg>
<figcaption>Source: the assertions in <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/test/kotlin/com/mohdshayan/beatwheel/core/DspTest.kt">DspTest.kt</a> in the Beatwheel repository, read on 12 October 2026; the true offset is 1200 log2(446/440).</figcaption>
</figure>

A neighbouring test sets the scale for that half cent: the phase demodulator alone, fed a 440.127 Hz tone with a little noise, must read 0.5 cents within 0.1.

## From the microphone to the reading

The microphone delivers 48 kHz mono float blocks of 480 samples to an analysis thread in `audio/AudioEngine.kt`, which runs the canceller, then the estimator, then the beat meter. The canceller is told about the drone only when the drone is on the speaker: `DroneSynth.isOutputPrivate()` looks for wired, USB or Bluetooth headphones, and with any of those present the canceller is given 0 Hz and passes the signal through.

The estimator in `core/pitch/PitchEstimator.kt` is two detectors stacked. The coarse one is YIN, run every 40 ms on a copy decimated by four to 12 kHz, as de Cheveigné and Kawahara [published it in 2002](https://cagnazzo.wp.imt.fr/files/2013/05/2002_JASA_YIN.pdf). The paper reports error rates about three times lower than the best competing methods on speech recorded with a laryngograph, and its name, from yin and yang, refers to the interplay of autocorrelation and cancellation. YIN chooses the note, two agreeing frames to pick one from silence and three to change it.

The fine detector is `PhaseDemodulator.kt`. The signal is mixed against a quadrature oscillator at the target frequency and averaged over blocks a whole number of periods long, so every harmonic of the target averages out, leaving a phasor that turns at the difference frequency; its angle drives the disc, and the least-squares slope of its unwrapped angle over 0.5 s (1.5 s in held-tone mode) gives the cents. That is a mechanical strobe in software: the Peterson strobe tuner [patent](https://patents.google.com/patent/US5877443A/en), granted in 1999, has the pattern stationary when the note is perfectly in tune, moving clockwise when sharp and counterclockwise when flat, at a speed proportional to the error in frequency.

<figure class="chart">
<svg viewBox="0 0 640 310" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">The analysis chain in Beatwheel from microphone to reading</title>
<desc id="f2-d">A flow of boxes. The microphone, 48 kHz mono float in blocks of 480, feeds the drone canceller, nine partials by recursive least squares with a two-second memory, used on the speaker only. Then the pitch estimator, decimated four times to 12 kHz with YIN every 40 ms, then the phase demodulator, which gives the strobe angle and the cents from a slope over 0.5 s. A branch from the canceller feeds the beat meter when the note is within 1.5 Hz of a drone partial, giving signed beats per second over a two-second window. Both end in the reading, published every 30 ms.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">From the microphone to the reading</text>
<rect x="8" y="40" width="140" height="76" rx="8" class="viz-box"/>
<text x="78" y="64" text-anchor="middle" class="viz-label">Microphone</text>
<text x="78" y="82" text-anchor="middle" class="viz-label-muted">48 kHz mono float</text>
<text x="78" y="100" text-anchor="middle" class="viz-label-muted">blocks of 480</text>
<line x1="150" y1="78" x2="168" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="172" y="40" width="140" height="76" rx="8" class="viz-box-accent"/>
<text x="242" y="64" text-anchor="middle" class="viz-label">Drone canceller</text>
<text x="242" y="82" text-anchor="middle" class="viz-label-muted">9 partials, RLS</text>
<text x="242" y="100" text-anchor="middle" class="viz-label-muted">2 s memory</text>
<line x1="314" y1="78" x2="332" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="336" y="40" width="140" height="76" rx="8" class="viz-box"/>
<text x="406" y="64" text-anchor="middle" class="viz-label">Pitch estimator</text>
<text x="406" y="82" text-anchor="middle" class="viz-label-muted">4x down to 12 kHz</text>
<text x="406" y="100" text-anchor="middle" class="viz-label-muted">YIN every 40 ms</text>
<line x1="478" y1="78" x2="496" y2="78" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="500" y="40" width="132" height="76" rx="8" class="viz-box"/>
<text x="566" y="64" text-anchor="middle" class="viz-label">Phase demodulator</text>
<text x="566" y="82" text-anchor="middle" class="viz-label-muted">strobe angle</text>
<text x="566" y="100" text-anchor="middle" class="viz-label-muted">slope over 0.5 s</text>
<path d="M242 118 V214 H344" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="250" y="140" class="viz-label-muted">on the speaker only</text>
<text x="250" y="156" class="viz-label-muted">headphones skip it</text>
<text x="250" y="192" class="viz-tick">within 1.5 Hz</text>
<text x="250" y="208" class="viz-tick">of a partial</text>
<rect x="348" y="176" width="128" height="76" rx="8" class="viz-box-accent"/>
<text x="412" y="200" text-anchor="middle" class="viz-label">Beat meter</text>
<text x="412" y="218" text-anchor="middle" class="viz-label-muted">signed beats/s</text>
<text x="412" y="236" text-anchor="middle" class="viz-label-muted">2 s window</text>
<line x1="478" y1="214" x2="496" y2="214" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="566" y1="118" x2="566" y2="172" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="500" y="176" width="132" height="76" rx="8" class="viz-box-ink"/>
<text x="566" y="200" text-anchor="middle" class="viz-on-ink">Reading</text>
<text x="566" y="218" text-anchor="middle" class="viz-on-ink">cents or beats</text>
<text x="566" y="236" text-anchor="middle" class="viz-on-ink">every 30 ms</text>
<text x="0" y="280" class="viz-label-muted">Cents come from the phase slope once it agrees with YIN within 20 cents.</text>
<text x="0" y="300" class="viz-tick">AudioEngine.kt publishes one reading every third 10 ms block</text>
</svg>
<figcaption>Source: the constants in <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/audio/MicSource.kt">MicSource.kt</a>, <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/pitch/PitchEstimator.kt">PitchEstimator.kt</a>, <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/drone/DroneCanceller.kt">DroneCanceller.kt</a>, <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/drone/BeatMeter.kt">BeatMeter.kt</a>, <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/audio/DroneSynth.kt">DroneSynth.kt</a> and <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/audio/AudioEngine.kt">AudioEngine.kt</a>, read on 12 October 2026.</figcaption>
</figure>

## A notch per partial

`core/drone/DroneCanceller.kt` is short. For each partial, up to nine, it keeps a reference phase advancing at that partial's frequency, two weights on the cosine and sine of the phase, and a symmetric two by two matrix. Every sample it predicts the drone from the weighted cosines and sines, subtracts the prediction, and updates each partial's weights by the recursive least squares rule with the error left over. The forgetting factor is 1 minus 1 over two seconds of samples, 0.99999 at 48 kHz to five places. Partials above 0.45 times the sample rate are dropped, 21,600 Hz at 48 kHz, and nine partials of A 440 top out at 3,960. Nine is the length of the reed drone's harmonic list in `Wavetables.kt`.

In the [RLS filter](https://en.wikipedia.org/wiki/Recursive_least_squares_filter), as Wikipedia describes it (read on 12 October 2026), the forgetting factor gives exponentially less weight to older error samples and is usually chosen between 0.98 and 1. Beatwheel's is close enough to 1 that the weights average over about two seconds, and that is what makes each partial a narrow notch. A component at the partial's own frequency holds a fixed phase against the reference and the weights settle on it; one a few hertz away turns through several cycles inside two seconds, leaves nothing lasting in the weights, and passes. The header comment states the consequence and the assumption together: each partial becomes a notch well under 1 Hz wide, and the room path is assumed steady, which is what makes the notches narrow.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">A sketch of the drone's partials, the notches and the unison window</title>
<desc id="f3-d">Two panels. On the left, a spectrum from 0 to 1.5 kHz with the reed drone's first three partials at 440, 880 and 1320 Hz, heights 1.0, 0.72 and 0.55, and the player's 446 Hz line standing beside the 440 Hz partial, too close to tell apart at this scale. On the right, a zoom from 436 to 450 Hz: a flat pass line with a notch narrower than 1 Hz at 440 Hz where the drone partial sits, a shaded unison window 1.5 Hz either side of 440 within which the app shows beats instead of cents, and the player's 446 Hz line passing through untouched.</desc>
<text x="0" y="18" class="viz-title">A notch per partial, and the window where cents stop</text>
<text x="0" y="36" class="viz-sub">Left: what the microphone hears. Right: 436 to 450 Hz at twenty pixels per hertz</text>
<text x="8" y="60" class="viz-label">First three of nine partials</text>
<text x="8" y="78" class="viz-label-muted">0 to 1.5 kHz, reed drone</text>
<line x1="8" y1="230" x2="280" y2="230" class="viz-axis"/>
<line x1="88" y1="230" x2="88" y2="110" class="viz-sgray"/>
<line x1="168" y1="230" x2="168" y2="144" class="viz-sgray"/>
<line x1="247" y1="230" x2="247" y2="164" class="viz-sgray"/>
<line x1="91" y1="230" x2="91" y2="170" class="viz-s1"/>
<text x="96" y="135" class="viz-label-muted">player, 446, sits here</text>
<text x="88" y="250" text-anchor="middle" class="viz-tick">440</text>
<text x="168" y="250" text-anchor="middle" class="viz-tick">880</text>
<text x="247" y="250" text-anchor="middle" class="viz-tick">1320</text>
<line x1="300" y1="52" x2="300" y2="256" class="viz-grid"/>
<text x="320" y="60" class="viz-label">Around the first partial</text>
<text x="320" y="78" class="viz-label-muted">436 to 450 Hz</text>
<rect x="370" y="130" width="60" height="100" class="viz-a4"/>
<path d="M320 110 H394 L400 210 L406 110 H600" class="viz-s3"/>
<line x1="400" y1="230" x2="400" y2="150" class="viz-sgray"/>
<line x1="520" y1="230" x2="520" y2="150" class="viz-s1"/>
<line x1="320" y1="230" x2="600" y2="230" class="viz-axis"/>
<text x="400" y="100" text-anchor="middle" class="viz-label-muted">notch, under 1 Hz</text>
<text x="598" y="104" text-anchor="end" class="viz-label-muted">passes</text>
<text x="434" y="204" class="viz-label-muted">drone</text>
<text x="434" y="220" class="viz-label-muted">removed</text>
<text x="320" y="250" text-anchor="middle" class="viz-tick">436</text>
<text x="400" y="250" text-anchor="middle" class="viz-tick">440</text>
<text x="520" y="250" text-anchor="middle" class="viz-tick">446</text>
<text x="600" y="250" text-anchor="middle" class="viz-tick">450</text>
<text x="400" y="268" text-anchor="middle" class="viz-label-muted">beats, not cents</text>
<text x="520" y="268" text-anchor="middle" class="viz-label-muted">passes</text>
<text x="0" y="290" class="viz-label-muted">Partial heights follow the reed table in Wavetables.kt: 1.0, 0.72 and 0.55.</text>
<text x="0" y="310" class="viz-tick">notch and window widths from the comments in DroneCanceller.kt and BeatMeter.kt</text>
</svg>
<figcaption>Illustrative: the notch is drawn 0.6 Hz wide and the pass line flat to show the shape, not a measured response; the under-1 Hz notch and the 1.5 Hz window are the figures stated in <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/drone/DroneCanceller.kt">DroneCanceller.kt</a> and <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/drone/BeatMeter.kt">BeatMeter.kt</a>, and the partial heights are the reed table in <a href="https://github.com/shayanmohd/beatwheel/blob/main/app/src/main/kotlin/com/mohdshayan/beatwheel/core/drone/Wavetables.kt">Wavetables.kt</a>.</figcaption>
</figure>

## Where the physics stops

A notch under 1 Hz wide does not help when the player is inside it. Play A 440 against an A 440 drone and the canceller removes the drone and the player together. `BeatMeter.kt` carries the constant for this, `UNISON_WINDOW_HZ = 1.5`, and `AudioEngine.kt` engages the meter when the estimate lies within 1.5 Hz of the nearest drone partial, about six cents at A 440. The meter demodulates the cancelled signal at the partial over a two-second window, subtracts the mean phasor, the steady drone residue, and fits a least-squares line to the unwrapped phase of the remainder. The slope is the beat rate, signed, positive when the player is sharp.

That is the honest output because it is what the player hears. [Beats](https://en.wikipedia.org/wiki/Beat_(acoustics)) occur at the difference of the two frequencies, musicians use them to check tuning at the unison, and piano and organ tuners count them for particular intervals. A readout claiming 0.3 cents there would be inventing a number; the test instead asks the meter for 1.0 beats per second within 0.05 from a 441 Hz player over a 440 Hz drone, and minus 1.0 from 439.

## What the test does not say

The simulated room is kinder than a real one: one reflection, no movement, four seconds. It checks the design, not a hall, and the raw assertion proves only that the canceller does the work. `BLUEPRINT.md` in the repository names measuring with the drone on the speaker as the hardest subsystem, makes the simulated-room JVM test the gate when no phone check is available, and keeps headphones-only measuring as the fallback if cancellation failed.

Two facts about the app, as the public repository on [GitHub](https://github.com/shayanmohd/beatwheel) stood on 12 October 2026, last changed on 8 October. The manifest declares RECORD_AUDIO and removes INTERNET and ACCESS_NETWORK_STATE from the merged manifest. And the 8 October commit, versioned 1.1.0, moves the code to a free tier with one optional full unlock: `core/unlock/FreeTier.kt` lets the meter publish only when no drone sounds or the unlock is on, so that build plays the drone but shows no reading while it sounds. That is a commit, not a release: the repository has no release or tag, the [Play listing](https://play.google.com/store/apps/details?id=com.mohdshayan.beatwheel), read on 12 October 2026, still sells version 1.0.0 as a one-time purchase, and the README, last changed on 13 September, still says paid once.

## Measure what the physics allows

The two numbers this post turns on are in `BLUEPRINT.md` as well as in the code: a two-second memory fixes the notch at under a hertz, and the notch fixes the point, 1.5 Hz, past which no honest cents reading exists. The blueprint's list of JVM tests includes the canceller test at 23.4 cents within 0.5. A canceller that passed on a phone with no such test would be a feeling about one room; one with the test is a claim anyone can run with `./gradlew testDebugUnitTest`.
