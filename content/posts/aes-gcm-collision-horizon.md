---
title: Every AES-GCM key has a collision horizon
date: 2026-09-17
summary: With a random 96-bit nonce, AES-GCM's safety is a countdown, not a property. Compute the countdown for every key, and design so that it can never be reached.
tags: Cryptography, AES-GCM, Android
draft: false
---

AES-GCM is the default authenticated cipher in almost every library, and it has one rule that libraries cannot enforce for you: never encrypt two messages under the same key with the same nonce. Break the rule once and the keystream repeats, the XOR of the two plaintexts is exposed, and the authentication key falls out of the tags. That is not a weakness people argue about. It is the design. What people under-appreciate is that with random nonces the rule is not a property you have; it is a countdown you are running, and the countdown has a number.

## The number

GCM's standard nonce is 96 bits. If nonces are drawn at random, the chance that two of them collide grows with the square of the number of messages, the birthday bound, and [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) draws the line at 2 to the 32 invocations per key for random nonce constructions, so that the collision probability stays below 2 to the negative 32. Four billion messages sounds like a lot until you are a server encrypting records, tokens or log lines, at which point it is a few weeks.

I think of it as the collision horizon: the number of messages a single key may encrypt before the nonce-collision probability crosses a tolerance you have written down. NIST's horizon is 2 to the 32 at a tolerance of 2 to the negative 32. A stricter tolerance gives a nearer horizon; a looser one, further. What matters is that every key in a design has one, that the number is known, and that a mechanism exists to stop the key before it gets there.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Nonce collision probability against messages encrypted under one key</title>
<desc id="f1-d">A rising line on logarithmic axes: at 2 to the 24 messages the collision probability is about 2 to the negative 49; at 2 to the 28, 2 to the negative 41; at 2 to the 32, 2 to the negative 33; at 2 to the 36, 2 to the negative 25. A marker at 2 to the 32 messages shows NIST's limit.</desc>
<text x="0" y="18" class="viz-title">The countdown, on log axes</text>
<text x="0" y="36" class="viz-sub">Probability of at least one repeated 96-bit random nonce, as a power of two</text>
<line x1="56" y1="56" x2="600" y2="56" class="viz-grid"/><text x="48" y="60" text-anchor="end" class="viz-tick">2^-24</text>
<line x1="56" y1="108" x2="600" y2="108" class="viz-grid"/><text x="48" y="112" text-anchor="end" class="viz-tick">2^-32</text>
<line x1="56" y1="160" x2="600" y2="160" class="viz-grid"/><text x="48" y="164" text-anchor="end" class="viz-tick">2^-40</text>
<line x1="56" y1="212" x2="600" y2="212" class="viz-grid"/><text x="48" y="216" text-anchor="end" class="viz-tick">2^-48</text>
<line x1="56" y1="264" x2="600" y2="264" class="viz-axis"/><text x="48" y="268" text-anchor="end" class="viz-tick">2^-56</text>
<text x="92" y="288" text-anchor="middle" class="viz-tick">2^24</text>
<text x="237.3" y="288" text-anchor="middle" class="viz-tick">2^28</text>
<text x="382.7" y="288" text-anchor="middle" class="viz-tick">2^32</text>
<text x="528" y="288" text-anchor="middle" class="viz-tick">2^36</text>
<text x="328" y="310" text-anchor="middle" class="viz-label-muted">Messages encrypted under one key</text>
<polyline points="92,218.5 237.3,166.5 382.7,114.5 528,62.5" class="viz-s1"/>
<circle cx="92" cy="218.5" r="4" class="viz-d1"/>
<circle cx="237.3" cy="166.5" r="4" class="viz-d1"/>
<circle cx="382.7" cy="114.5" r="6" class="viz-d4"/>
<circle cx="528" cy="62.5" r="4" class="viz-d1"/>
<line x1="382.7" y1="56" x2="382.7" y2="264" class="viz-s4"/>
<text x="374" y="250" text-anchor="end" class="viz-label-muted">NIST's limit: 2^32 messages per key</text>
</svg>
<figcaption>Illustrative: computed from the birthday approximation, probability about n squared over 2 to the 97 for n random 96-bit nonces; the limit is the one stated in <a href="https://csrc.nist.gov/pubs/sp/800/38/d/final">NIST SP 800-38D</a>.</figcaption>
</figure>

## What a collision costs

The reason the horizon deserves a number rather than a shrug is what happens on the far side of it. GCM encrypts by generating a keystream from the key and the nonce and XORing it with the plaintext. Two messages under the same key and nonce get the same keystream, so XORing the two ciphertexts together cancels the keystream and leaves the XOR of the two plaintexts, which for structured data such as JSON, headers or file formats is usually enough to recover both. Worse, the authentication tag is computed with a hash key derived from the key alone, and two tags over the same nonce let an attacker solve for that hash key, after which they can forge tags for any message under that key. One collision does not leak one message. It breaks the key.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">What a repeated nonce exposes</title>
<desc id="f2-d">Two messages encrypted under the same key and nonce produce the same keystream. XORing the two ciphertexts cancels the keystream and yields the XOR of the two plaintexts. The two authentication tags, computed over the same nonce, let an attacker recover the hash key and forge tags.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<rect x="8" y="30" width="180" height="56" rx="8" class="viz-box"/>
<text x="98" y="54" text-anchor="middle" class="viz-label">Message 1</text>
<text x="98" y="72" text-anchor="middle" class="viz-label-muted">key K, nonce N</text>
<rect x="8" y="150" width="180" height="56" rx="8" class="viz-box"/>
<text x="98" y="174" text-anchor="middle" class="viz-label">Message 2</text>
<text x="98" y="192" text-anchor="middle" class="viz-label-muted">key K, nonce N again</text>
<rect x="230" y="90" width="180" height="56" rx="8" class="viz-box-accent"/>
<text x="320" y="114" text-anchor="middle" class="viz-label">Same keystream</text>
<text x="320" y="132" text-anchor="middle" class="viz-label-muted">from K and N</text>
<line x1="190" y1="58" x2="226" y2="100" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="190" y1="178" x2="226" y2="136" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="452" y="30" width="180" height="56" rx="8" class="viz-box-ink"/>
<text x="542" y="54" text-anchor="middle" class="viz-on-ink">C1 xor C2 = P1 xor P2</text>
<text x="542" y="72" text-anchor="middle" class="viz-on-ink">both plaintexts, usually</text>
<rect x="452" y="150" width="180" height="56" rx="8" class="viz-box-ink"/>
<text x="542" y="174" text-anchor="middle" class="viz-on-ink">tags reveal the hash key</text>
<text x="542" y="192" text-anchor="middle" class="viz-on-ink">forgeries follow</text>
<line x1="412" y1="108" x2="448" y2="62" class="viz-arrow" marker-end="url(#f2-ah)"/>
<line x1="412" y1="128" x2="448" y2="174" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="320" y="240" text-anchor="middle" class="viz-tick">one repeated nonce; the key is finished, not just the two messages</text>
</svg>
<figcaption>Illustrative: the consequence of nonce reuse in GCM, as analysed in the literature on the forbidden attack; drawn as structure, not as a worked example.</figcaption>
</figure>

## Where the horizon is near and where it is far

It helps to place a few systems against the number, because the horizon is far for some designs and uncomfortably close for others. A vault on a phone that encrypts files the user adds by hand will never approach four billion files, and for that design the birthday bound is not the risk. A server that encrypts every session token, every audit log line or every row written to a table under one long-lived key can reach 2 to the 32 in weeks, and a busy one in days. A messaging protocol that derives a fresh key per conversation and rotates it on a schedule sits in between, with the horizon reset at every rotation.

The rule that falls out is about key scope rather than message count. The wider the scope of a key, the more messages share it and the nearer its horizon; the narrower the scope, the further away. A key per file, per session or per record has a horizon nobody can reach. A key per deployment has one that a successful product will reach on schedule, and the day it does is not marked on any calendar unless someone put it there.

## Making the horizon unreachable

There are two honest ways to deal with a countdown, and both are design decisions rather than parameter choices.

The first is to give each key so little to encrypt that the horizon cannot be reached. Derive a fresh key per file, per session or per record from a master key and a unique identifier, using a key derivation function, and the collision horizon of each derived key is one message: there is nothing to collide with. This is the design I use for the encrypted media vault in the Minimalist Calculator. The master key lives in the Android Keystore and never encrypts a file directly; each file gets its own derived key, and the nonce question disappears with the reuse it was protecting against.

The second is to make nonces that cannot repeat: a counter rather than a random draw. A counter has no birthday bound; it collides only when it is reset. But resets happen in exactly the places engineers forget to look. A counter kept in memory resets when the process restarts. A counter kept on disk resets when the disk is restored from a backup taken before the last messages were sent, and a vault whose files are backed up and restored is the textbook case. Whoever restores the backup also restores the counter, and the next file encrypts under a nonce that was already used. A counter is safe only when its persistence is more reliable than the data it protects, which is a high bar and a strange one.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Nonce size across authenticated ciphers</title>
<desc id="f3-d">Horizontal bars of nonce length in bits: AES-GCM 96, AES-GCM-SIV 96 but misuse resistant, XChaCha20-Poly1305 192. Longer nonces push the random-collision horizon far out; misuse resistance changes what a collision costs.</desc>
<text x="0" y="18" class="viz-title">Two ways out of the countdown</text>
<text x="0" y="36" class="viz-sub">Nonce length in bits; what happens on a repeat is noted beside each</text>
<line x1="176" y1="52" x2="176" y2="154" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">AES-GCM</text>
<path d="M176 58 H392 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="412" y="73" class="viz-value">96, repeat breaks the key</text>
<text x="166" y="107" text-anchor="end" class="viz-label">AES-GCM-SIV</text>
<path d="M176 92 H392 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="412" y="107" class="viz-value">96, repeat leaks equality only</text>
<text x="166" y="141" text-anchor="end" class="viz-label">XChaCha20-Poly1305</text>
<path d="M176 126 H608 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="600" y="121" text-anchor="end" class="viz-value">192</text>
<text x="0" y="190" class="viz-label-muted">A 192-bit random nonce moves the horizon beyond any realistic message count.</text>
<text x="0" y="212" class="viz-label-muted">Misuse resistance keeps a repeat from exposing plaintext or the hash key.</text>
</svg>
<figcaption>Source: nonce lengths from <a href="https://csrc.nist.gov/pubs/sp/800/38/d/final">NIST SP 800-38D</a>, <a href="https://www.rfc-editor.org/rfc/rfc8452">RFC 8452</a> for AES-GCM-SIV, and the <a href="https://datatracker.ietf.org/doc/draft-irtf-cfrg-xchacha/">XChaCha20-Poly1305 draft</a>.</figcaption>
</figure>

There is a third option, which is to change the cipher. [AES-GCM-SIV](https://www.rfc-editor.org/rfc/rfc8452) is built so that a repeated nonce leaks only whether two messages were identical, not their contents and not the key, which turns the countdown into a graceful degradation. XChaCha20-Poly1305 uses a 192-bit nonce, so that random nonces have a horizon nobody will reach. Both are good answers when the library offers them. Neither removes the need to know the horizon of the keys you already have.

## The mechanism, not the policy

A written policy that says "rotate keys every quarter" is not a mechanism, and this is where many designs quietly fail the test. The horizon is counted in messages, not months, and a quarter of messages is a different number in a slow month and a busy one. The mechanism has to count. A per-key message counter that refuses to encrypt past a threshold well below the horizon, and forces a rotation, is the honest implementation, and it is a few lines. A calendar reminder is a hope.

The counter has the same persistence problem as a counter nonce, but with a gentler failure mode: if it is lost and restarts from zero, the key lives somewhat longer than intended rather than immediately reusing a nonce. That is why I would rather keep a message counter for rotation than a counter nonce for uniqueness, and rely on derived per-message keys or a misuse-resistant mode for the uniqueness itself.

## Write the horizon down

The practice I follow is short. For every key in the design, write three things next to it: what nonce construction it uses, what its collision horizon is at a tolerance stated in the same line, and what mechanism stops the key before the horizon. A key with random nonces and no counter of messages has a horizon it cannot see and no mechanism, and it does not pass. A per-file derived key has a horizon of one and needs no mechanism. A counter nonce is allowed when the sentence describing what happens on restore from backup is written and true.

None of that is cryptography. The cryptography was finished when the standard was published. What remains is the engineering of a number, and the number is the difference between a system that is safe and a system that is safe so far.
