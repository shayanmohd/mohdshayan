---
title: The key that is never assembled
date: 2026-09-18
summary: Shamir rebuilds the private key in one process every time you sign, so it protects the key at rest and abandons it when it matters. Threshold signatures never assemble it.
tags: Cryptography, MPC, Wallets
draft: false
---

Split the key into five shares, require three to sign, keep the shares in different places. That is the sentence every custody design starts with, and it describes two schemes that could not be more different at the moment of signing. Under Shamir's secret sharing, the three shares are brought together, the private key is reconstructed in one process's memory, the signature is produced, and the key is discarded. Under a threshold signature scheme, the three parties each compute a partial signature from their own share, the partials are combined, and a valid signature appears without the whole key ever existing anywhere. For a system that signs once a year, the difference is academic. For a system that signs many times a day, it is the entire threat model, and the question to ask of any custody design is not how many shares exist but whether a full key ever exists in one memory.

## The reconstruction moment

I call it the reconstruction moment: the instant, if any, at which the complete private key exists in one address space. A custody design is audited by locating that moment, where it happens, in which process, for how long, and who could read that process's memory during it. Shamir has one on every signature. A hardware wallet has one permanently, inside the secure element, which is the point of the secure element. A threshold scheme has none during signing, and the audit question becomes whether it has one anywhere else: at key generation, if a dealer creates the key and splits it; at backup, if the shares are combined to produce a recovery phrase; at recovery, if the phrase is used to rebuild them.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Shamir reconstruct-then-sign against FROST two-round partial signing, with the reconstruction moment marked or absent</title>
<desc id="f1-d">Two sequences. Top, Shamir: three share holders send their shares to a signing process, which reconstructs the full private key, marked as the reconstruction moment, signs, and discards the key. Bottom, FROST: a coordinator sends the message and commitments to three signers, each computes a partial signature from its own share, and the coordinator aggregates the partials into one valid signature; no box ever holds the full key.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Same threshold, different moment</text>
<circle cx="420" cy="14" r="5" class="viz-d4"/><text x="430" y="18" class="viz-label-muted">the reconstruction moment</text>
<text x="8" y="52" class="viz-tick">SHAMIR: RECONSTRUCT, THEN SIGN</text>
<rect x="8" y="60" width="90" height="40" rx="8" class="viz-box"/><text x="53" y="85" text-anchor="middle" class="viz-label">share 1</text>
<rect x="8" y="106" width="90" height="40" rx="8" class="viz-box"/><text x="53" y="131" text-anchor="middle" class="viz-label">share 2</text>
<rect x="8" y="152" width="90" height="40" rx="8" class="viz-box"/><text x="53" y="177" text-anchor="middle" class="viz-label">share 3</text>
<line x1="100" y1="80" x2="196" y2="118" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="100" y1="126" x2="196" y2="126" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="100" y1="172" x2="196" y2="134" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="200" y="96" width="150" height="60" rx="8" class="viz-box-ink"/>
<text x="275" y="120" text-anchor="middle" class="viz-on-ink">full key in memory</text>
<text x="275" y="138" text-anchor="middle" class="viz-on-ink">the reconstruction moment</text>
<circle cx="350" cy="96" r="8" class="viz-d4"/>
<line x1="352" y1="126" x2="386" y2="126" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="390" y="106" width="110" height="40" rx="8" class="viz-box"/><text x="445" y="131" text-anchor="middle" class="viz-label">signature</text>
<text x="8" y="222" class="viz-tick">FROST: PARTIAL SIGNATURES, NO RECONSTRUCTION</text>
<rect x="8" y="230" width="90" height="34" rx="8" class="viz-box-accent"/><text x="53" y="252" text-anchor="middle" class="viz-label">signer 1</text>
<rect x="8" y="268" width="90" height="34" rx="8" class="viz-box-accent"/><text x="53" y="290" text-anchor="middle" class="viz-label">signer 2</text>
<rect x="110" y="249" width="90" height="34" rx="8" class="viz-box-accent"/><text x="155" y="271" text-anchor="middle" class="viz-label">signer 3</text>
<text x="53" y="318" class="viz-tick">each signs with its own share</text>
<line x1="202" y1="266" x2="296" y2="266" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="249" y="256" text-anchor="middle" class="viz-tick">partials</text>
<rect x="300" y="246" width="140" height="40" rx="8" class="viz-box"/><text x="370" y="271" text-anchor="middle" class="viz-label">aggregate</text>
<line x1="442" y1="266" x2="476" y2="266" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="480" y="246" width="110" height="40" rx="8" class="viz-box"/><text x="535" y="271" text-anchor="middle" class="viz-label">signature</text>
<text x="370" y="310" text-anchor="middle" class="viz-label-muted">no box holds the full key, at any point, in either round</text>
</svg>
<figcaption>Illustrative: the two signing flows for a three-of-five threshold; the FROST flow is the two-round protocol of RFC 9591, simplified.</figcaption>
</figure>

The moment has a duration as well as a place, and the duration matters less than people hope. A key that exists in memory for a millisecond is still a key that existed in memory, and an attacker who can read the process can read it in that millisecond, because the attacker is not waiting for a lucky moment; they are reading every signature. Once the moment is located, the rest of the audit writes itself. The process that holds the reconstructed key is the target; whoever can read its memory, dump its core, attach a debugger, or compromise the host it runs on has the key, and every one of the four other shares was irrelevant to that attacker. A Shamir design protects the key at rest, in the interval between signatures, and abandons it at the moment it is used. For a cold key that signs a treasury transfer twice a year, that interval is almost all of the time and the trade is fine. For a hot wallet that executes arbitrage across five venues, the moment recurs hundreds of times a day, on a machine that is connected to the internet by design, and the interval in which Shamir protects anything shrinks toward nothing.

## What threshold signatures changed

The schemes that avoid the moment are threshold signature schemes, and the practical ones have converged over the last few years. For ECDSA, the curve Ethereum and Bitcoin use, the line runs from Gennaro and Goldfeder's 2018 protocol, through their [2020 protocol](https://eprint.iacr.org/2020/540) with a non-interactive online phase and identifiable aborts, to [CGGMP21](https://eprint.iacr.org/2021/060), whose abstract commits to only the last round needing the message, with the other rounds done in a preprocessing stage, plus a periodic refresh that gives proactive security. For Schnorr signatures, FROST, standardised as [RFC 9591](https://www.rfc-editor.org/rfc/rfc9591) in June 2024, signs in two rounds, and the first round can be run ahead of time so that the signature needs one round when the message arrives.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Threshold signing protocols: year, what the abstract commits to, and rounds that need the message</title>
<desc id="f2-d">A table. GG18, 2019: fast dealerless key generation, interactive signing. GG20, 2020: non-interactive online phase, identifiable abort, zero rounds needing the message beyond the preprocessing. CGGMP21, 2021: only the last round needs the message, proactive refresh, identifiable aborts, one online round. FROST, RFC 9591, 2024: two rounds, one with preprocessing, Schnorr rather than ECDSA.</desc>
<text x="0" y="18" class="viz-title">Each generation moved more of the work before the message exists</text>
<text x="20" y="48" class="viz-tick">PROTOCOL</text>
<text x="160" y="48" class="viz-tick">YEAR</text>
<text x="230" y="48" class="viz-tick">WHAT IT COMMITS TO</text>
<text x="520" y="48" class="viz-tick">ONLINE ROUNDS</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="84" class="viz-label">GG18</text><text x="160" y="84" class="viz-label-muted">2019</text>
<text x="230" y="84" class="viz-label-muted">dealerless key generation, interactive signing</text><text x="520" y="84" class="viz-value">all</text>
<line x1="0" y1="98" x2="640" y2="98" class="viz-grid"/>
<text x="20" y="126" class="viz-label">GG20</text><text x="160" y="126" class="viz-label-muted">2020</text>
<text x="230" y="126" class="viz-label-muted">non-interactive online phase, identifiable abort</text><text x="520" y="126" class="viz-value">none</text>
<line x1="0" y1="140" x2="640" y2="140" class="viz-grid"/>
<text x="20" y="168" class="viz-label">CGGMP21</text><text x="160" y="168" class="viz-label-muted">2021</text>
<text x="230" y="168" class="viz-label-muted">last round only needs the message, proactive refresh</text><text x="520" y="168" class="viz-value">one</text>
<line x1="0" y1="182" x2="640" y2="182" class="viz-grid"/>
<text x="20" y="210" class="viz-label">FROST, RFC 9591</text><text x="160" y="210" class="viz-label-muted">2024</text>
<text x="230" y="210" class="viz-label-muted">two rounds, first can be preprocessed; Schnorr</text><text x="520" y="210" class="viz-value">one</text>
<line x1="0" y1="224" x2="640" y2="224" class="viz-grid"/>
<text x="0" y="252" class="viz-label-muted">None of the four assembles the key during signing; what changed across them is latency.</text>
</svg>
<figcaption>Source: the abstracts of <a href="https://eprint.iacr.org/2019/114">GG18</a>, <a href="https://eprint.iacr.org/2020/540">GG20</a> and <a href="https://eprint.iacr.org/2021/060">CGGMP21</a>, and <a href="https://www.rfc-editor.org/rfc/rfc9591">RFC 9591</a>; the online-rounds column is what each states about rounds that require the message.</figcaption>
</figure>

The progression in the table is about latency, not security: every protocol on it is reconstruction-free during signing, and what improved was how much of the work could be done before the message existed, which is what makes a threshold scheme usable on a hot path where a signature is needed within a block time. That is the property a bot needs. A key that is never assembled is only useful if the signature it produces arrives before the opportunity is gone.

## The moments outside signing

The audit is not finished when signing is shown to be reconstruction-free, because the other three lifecycle events can reintroduce the moment. Key generation is the first: a scheme that has a dealer create the private key and split it has a reconstruction moment at birth, in the dealer's memory, and everything after is protecting a key that already existed in one place; distributed key generation, which every protocol in the table supports, avoids it. Backup is the second and the one that most often undoes the design: a product that exports a seed phrase for recovery has, at that moment, combined the shares, and a user who writes the phrase on paper has a full key in one place for the life of the paper. Recovery is the third, and it mirrors backup.

A design is reconstruction-free only if no moment exists in signing, generation, backup and recovery alike. The honest alternative for backup is share-level recovery: each share is backed up separately, to separate custodians or devices, and recovery means re-establishing enough shares to sign, never rebuilding the key. That is more work for the user than a seed phrase, and it is the price of the property.

## Where the standards are

The reason to write this in 2026 is that the standards process has caught up with the practice. FROST has an RFC. NIST's multi-party threshold cryptography project [published its final call](https://csrc.nist.gov/projects/threshold-cryptography) for threshold schemes, NIST IR 8214C, on 20 January 2026, and is running preview talks for the submissions through the year, with the third set scheduled for 29 and 30 September 2026. The vocabulary in which a custody design is described to an auditor is about to become standard, and the reconstruction moment is the property that vocabulary is organised around, even where it is not named that way.

<figure class="chart">
<svg viewBox="0 0 640 170" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Standardisation timeline for threshold signatures, 2024 to 2026</title>
<desc id="f3-d">A timeline with three points: June 2024, FROST published as RFC 9591; 20 January 2026, NIST publishes the final Threshold Call, NIST IR 8214C; 29 to 30 September 2026, NIST Threshold Call Preview Talks 3.</desc>
<circle cx="440" cy="18" r="5" class="viz-d1"/><text x="450" y="22" class="viz-label-muted">published</text>
<circle cx="540" cy="18" r="5" class="viz-dgray"/><text x="550" y="22" class="viz-label-muted">scheduled</text>
<line x1="40" y1="90" x2="600" y2="90" class="viz-axis"/>
<circle cx="90" cy="90" r="6" class="viz-d1"/>
<text x="90" y="64" text-anchor="middle" class="viz-tick">June 2024</text>
<text x="90" y="46" text-anchor="middle" class="viz-label">FROST, RFC 9591</text>
<circle cx="400" cy="90" r="6" class="viz-d1"/>
<text x="400" y="124" text-anchor="middle" class="viz-tick">20 Jan 2026</text>
<text x="400" y="142" text-anchor="middle" class="viz-label">NIST Threshold Call, IR 8214C</text>
<circle cx="560" cy="90" r="6" class="viz-dgray"/>
<text x="560" y="64" text-anchor="middle" class="viz-tick">29 to 30 Sept 2026</text>
<text x="560" y="46" text-anchor="middle" class="viz-label">Preview Talks 3</text>
</svg>
<figcaption>Source: the <a href="https://www.rfc-editor.org/rfc/rfc9591">RFC 9591</a> publication date and the <a href="https://csrc.nist.gov/projects/threshold-cryptography">NIST threshold cryptography project page</a>, September 2026.</figcaption>
</figure>

## What this means for a hot wallet

I run a bot that executes flash-loan arbitrage from a hot wallet across five venues, which is the kind of system that signs many times a day from a machine that is online by definition, and the reconstruction moment is the lens I use to think about its custody without claiming any particular scheme for it. Shamir, for that wallet, would be a key-at-rest protection on a key that is almost never at rest. Threshold signing removes the moment from the hot path, at the cost of a round of communication per signature that the newer protocols have pushed almost entirely into preprocessing. What it does not remove is every other way a hot wallet loses money: a compromised host can still be made to sign a transaction it should not, with a perfectly reconstruction-free protocol, because the protocol authenticates the shares and not the intent.

That last point is the boundary of the argument. Locating the reconstruction moment tells you whether an attacker who reads memory gets the key. It does not tell you whether an attacker who controls the process gets a signature, which is a policy question, answered by transaction limits, allow-lists and a signer that refuses what the policy forbids. A custody design needs both answers. The first one is a single question, and the schemes that answer it well have RFC numbers now.
