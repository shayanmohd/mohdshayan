---
title: What hardware-backed actually promises
date: 2026-09-17
summary: A key in the Android Keystore cannot be copied off the device, and that is the whole promise. An attacker with root can still use it. Most vault designs quietly assume more.
tags: Android, Key Management, Hardware Security
draft: false
---

"Hardware-backed" is the most reassuring phrase in Android security, and it promises less than most people hear. When I built the encrypted media vault inside the Minimalist Calculator app, the key that protects every file lives in the Android Keystore, bound to the device's secure hardware. That is the right design. It is also a design whose guarantee fits in one sentence, and the sentence is not "your data is safe from an attacker who controls the phone". It is "your key cannot leave the phone". The difference between those two sentences is the subject of this post.

## The promise, in Google's words

Google's [Keystore documentation](https://developer.android.com/privacy-and-security/keystore) describes two measures under the heading extraction prevention. First, key material never enters the application process: an app hands plaintext to a system process that performs the operation and hands the result back, so an attacker who compromises the app can use the app's keys but cannot read them. Second, key material can be bound to secure hardware, a trusted execution environment or a secure element, so that it is never exposed outside that hardware at all. Then comes the sentence that matters: if the Android OS is compromised or an attacker can read the device's internal storage, the attacker might be able to use any app's Keystore keys on that device, but cannot extract them from it.

Read that carefully, because it is unusually honest, and because it is the sentence most product copy quietly omits. Hardware-backed keys defend against one thing, extraction. They do not defend against use. An attacker with root on the phone can call the same decrypt function the app calls, with the same key, and get the same plaintext. What they cannot do is walk away with a file that lets them decrypt tomorrow, on another machine, without the phone.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Where the extraction line and the borrow line sit</title>
<desc id="f1-d">Four stacked layers from top to bottom: the app process, the Keystore system process, KeyMint in the trusted execution environment, and the StrongBox secure element. A highlighted line between the app process and the Keystore process marks where extraction stops. A second line above the app process marks where borrowing starts: anything running as the app or as root can ask the layers below to use the key.</desc>
<text x="0" y="18" class="viz-title">Two lines, not one</text>
<text x="0" y="36" class="viz-sub">The layers a Keystore operation passes through</text>
<rect x="0" y="52" width="640" height="48" rx="8" class="viz-box"/>
<text x="16" y="81" class="viz-label">App process</text>
<text x="624" y="81" text-anchor="end" class="viz-label-muted">holds plaintext, asks for operations</text>
<rect x="0" y="112" width="640" height="48" rx="8" class="viz-box"/>
<text x="16" y="141" class="viz-label">Keystore system process</text>
<text x="624" y="141" text-anchor="end" class="viz-label-muted">carries out operations on the app's behalf</text>
<rect x="0" y="172" width="640" height="48" rx="8" class="viz-box-accent"/>
<text x="16" y="201" class="viz-label">KeyMint in the TEE</text>
<text x="624" y="201" text-anchor="end" class="viz-label-muted">key material never leaves</text>
<rect x="0" y="232" width="640" height="48" rx="8" class="viz-box-ink"/>
<text x="16" y="261" class="viz-on-ink">StrongBox secure element</text>
<text x="624" y="261" text-anchor="end" class="viz-on-ink">separate chip, API 28 and up</text>
<line x1="0" y1="106" x2="640" y2="106" class="viz-s4"/>
<text x="320" y="292" text-anchor="middle" class="viz-tick">the brick line is where extraction stops; borrowing starts anywhere above it</text>
</svg>
<figcaption>Illustrative: the layers named in the <a href="https://developer.android.com/privacy-and-security/keystore">Android Keystore documentation</a>, drawn to show what each line defends.</figcaption>
</figure>

## The borrow test

So the question to ask about any key is not whether it is hardware-backed. It is what an attacker who has root on this device can do by borrowing the key in place: sign, decrypt, silently, for how long, and how many times. I call it the borrow test, and a key passes only when borrowing it without the user noticing is impossible. That standard sounds severe, and it is the only one that matches what the vault was built to protect against.

The Keystore has parameters that change the answer to the borrow test, and they are the parameters people leave at their defaults. A key can require user authentication, so that an operation succeeds only if the user has unlocked the device recently, or, with a timeout of zero, only for one operation after a fresh biometric or credential prompt. A key can require the device to be unlocked at all. A key can be generated inside StrongBox rather than the TEE, so that even a compromised TEE cannot use it without the separate chip's cooperation. And a key's properties can be attested, so that a server can verify that the key it is talking to really does live in hardware and really does carry those constraints.

Attestation deserves a sentence of its own, because it is the only one of these that reaches off the device. The [KeyMint and Keymaster](https://source.android.com/docs/security/features/keystore) implementations can produce a certificate chain, rooted in a Google key, that states where a key lives and what constraints it carries. A server that receives that chain can refuse to talk to a key that is not in hardware, or that lacks authentication binding, before any data is sent. For a vault with no server it does nothing. For a wallet or a banking client it is the mechanism that lets the other side check your configuration rather than take your word for it.

Each of those changes what borrowing costs. A key with no authentication binding can be borrowed silently and forever: the attacker with root decrypts every file while the phone sits on the desk. A key bound to a per-operation biometric can be borrowed only while the user's finger is on the sensor, once per press, which makes borrowing loud and bounded. A key that requires an unlocked device cannot be borrowed from a phone that was seized locked. None of these stops extraction, because extraction was already stopped. They stop the thing extraction prevention never addressed.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">What each key configuration still protects against, by attacker</title>
<desc id="f2-d">A grid with four attacker columns: a compromised app, root on the OS, physical seizure of a locked device, and chip-level extraction. Three key configurations as rows: a plain hardware-backed key, a key requiring an unlocked device, and a key requiring authentication per operation in StrongBox. Filled cells mean the configuration still protects the data. The plain key protects only against chip-level extraction. The unlocked-device key adds seizure while locked. The per-operation key adds the compromised app and root cases as long as the user is not tricked into authenticating.</desc>
<text x="0" y="18" class="viz-title">The borrow test as a grid</text>
<text x="0" y="36" class="viz-sub">Filled: the data stays protected against that attacker</text>
<text x="290" y="70" text-anchor="middle" class="viz-tick">APP</text>
<text x="380" y="70" text-anchor="middle" class="viz-tick">ROOT</text>
<text x="470" y="70" text-anchor="middle" class="viz-tick">SEIZED</text>
<text x="560" y="70" text-anchor="middle" class="viz-tick">EXTRACT</text>
<line x1="0" y1="78" x2="640" y2="78" class="viz-axis"/>
<text x="0" y="112" class="viz-label">Hardware-backed, no binding</text>
<rect x="283" y="98" width="14" height="14" rx="3" class="viz-box"/>
<rect x="373" y="98" width="14" height="14" rx="3" class="viz-box"/>
<rect x="463" y="98" width="14" height="14" rx="3" class="viz-box"/>
<rect x="553" y="98" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="128" x2="640" y2="128" class="viz-grid"/>
<text x="0" y="162" class="viz-label">Plus unlocked device required</text>
<rect x="283" y="148" width="14" height="14" rx="3" class="viz-box"/>
<rect x="373" y="148" width="14" height="14" rx="3" class="viz-box"/>
<rect x="463" y="148" width="14" height="14" rx="3" class="viz-f1"/>
<rect x="553" y="148" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="178" x2="640" y2="178" class="viz-grid"/>
<text x="0" y="212" class="viz-label">Plus auth per operation, StrongBox</text>
<rect x="283" y="198" width="14" height="14" rx="3" class="viz-f1"/>
<rect x="373" y="198" width="14" height="14" rx="3" class="viz-f1"/>
<rect x="463" y="198" width="14" height="14" rx="3" class="viz-f1"/>
<rect x="553" y="198" width="14" height="14" rx="3" class="viz-f1"/>
<line x1="0" y1="228" x2="640" y2="228" class="viz-grid"/>
<text x="0" y="258" class="viz-label-muted">APP: the app process is compromised. ROOT: the OS is compromised.</text>
<text x="0" y="280" class="viz-label-muted">SEIZED: the locked phone is taken. EXTRACT: the chip is attacked directly.</text>
<text x="0" y="312" class="viz-tick">the last row holds only while the user is not tricked into authenticating</text>
</svg>
<figcaption>Illustrative: a reading of the guarantees described in the Keystore documentation, not a test result; the last row's protection depends on the user refusing prompts they did not expect.</figcaption>
</figure>

## What the vault does with this

The Minimalist Calculator is a working calculator that opens an AES-GCM encrypted vault when a secret tap sequence is entered. Run the borrow test against it and the honest answer is in three parts. Against a stranger who borrows the unlocked phone for a minute, the disguise and the tap sequence do the work; the Keystore is irrelevant, because that attacker never reaches the key. Against someone who images the storage, the Keystore does everything: the files on disk are ciphertext and the key is not on the disk. Against someone with root on the running device, the only thing that helps is authentication binding, because without it root can ask the Keystore to decrypt exactly as the app does.

That third case is the one the phrase hardware-backed is quietly assumed to cover, and it does not. The design decision that actually covers it is to bind the vault key to a fresh user authentication, so that decrypting a file requires the owner's biometric at the moment of decryption, and so that an attacker with root gets a prompt the owner did not ask for. It costs a prompt. It is the only part of the design that turns silent borrowing into a visible event.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">When each Keystore guarantee arrived, by API level</title>
<desc id="f3-d">A timeline of API levels: 23, hardware-backed key flags and secure-hardware checks; 24, key attestation; 28, StrongBox and the unlocked-device requirement; 30, per-operation authentication parameters. The API 28 point is highlighted.</desc>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="80" cy="90" r="6" class="viz-dgray"/>
<text x="80" y="64" text-anchor="middle" class="viz-tick">API 23</text>
<text x="80" y="46" text-anchor="middle" class="viz-label">Secure-hardware flags</text>
<circle cx="240" cy="90" r="6" class="viz-dgray"/>
<text x="240" y="124" text-anchor="middle" class="viz-tick">API 24</text>
<text x="240" y="142" text-anchor="middle" class="viz-label">Key attestation</text>
<circle cx="400" cy="90" r="6" class="viz-d1"/>
<text x="400" y="64" text-anchor="middle" class="viz-tick">API 28</text>
<text x="400" y="46" text-anchor="middle" class="viz-label">StrongBox, unlocked-device</text>
<circle cx="560" cy="90" r="6" class="viz-dgray"/>
<text x="560" y="124" text-anchor="middle" class="viz-tick">API 30</text>
<text x="560" y="142" text-anchor="middle" class="viz-label">Auth per operation</text>
</svg>
<figcaption>Source: the <a href="https://developer.android.com/privacy-and-security/keystore">Android Keystore documentation</a> and the <a href="https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.Builder">KeyGenParameterSpec.Builder</a> reference, which lists the API level of each parameter.</figcaption>
</figure>

## Why the gap survives

The gap between extraction and use survives in product designs for a simple reason: extraction is the threat that sounds like a movie, and use is the threat that sounds like an inconvenience. A key leaving the device is a scene; a prompt appearing at an odd moment is a support ticket. So designs invest in the guarantee they already have and skip the one they need, and the marketing copy that says hardware-backed is, in the narrow sense, true.

The other reason is that the parameters that close the gap have costs a demo never shows. Per-operation authentication means a biometric prompt every time the vault opens a file, which is fine for a vault and unacceptable for a messaging app. Unlocked-device binding means background work cannot use the key, which breaks a sync that runs overnight. StrongBox has its own limits on key sizes and throughput. Each product has to decide how much borrowing it can tolerate and pay for the binding that bounds it, and the decision cannot be made by reading a feature list.

## The rule

For each key, write down what an attacker with root can do by borrowing it: which operation, how silently, how often, for how long. Then set the key's authentication, device-state and hardware parameters until the answer is "not without the owner noticing". If you cannot get there, say so in the threat model rather than in the marketing. Hardware-backed means the key stays on the phone. What the phone does with the key is still up to you.
