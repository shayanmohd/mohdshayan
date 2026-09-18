---
title: The gap between signing and verifying
date: 2026-09-07
summary: Signature checks fail far more often from re-serialisation than from cryptography: the sender signed one byte string and the receiver re-encoded it into another before checking.
tags: Security, Signing, Webhooks
draft: false
---

Almost every signature verification failure I have debugged had nothing to do with cryptography. The keys were right, the algorithm was right, the library was right. The sender had signed one byte string, and by the time the receiver checked the signature it was checking a different byte string, because something between the network and the verification code had parsed the message and written it back out. A JSON body became an object and became JSON again with the keys in a different order. A framework stripped a trailing newline. A proxy normalised a unicode escape.

The signature was over the bytes the sender sent; the check was over the bytes the receiver's stack reconstructed; and the two differed by a character nobody could see. I call the set of those transformations the re-serialisation gap, and a signed-message design is rated by whether the gap is empty.

## Where the bytes diverge

The pipeline on each side has more stages than the diagram in the documentation shows. The sender builds an object, serialises it to bytes, computes a signature over those bytes, and sends both. The receiver's web server reads the bytes, a middleware may decompress or decode them, the framework parses them into an object for the handler's convenience, and then the verification code, if it is written naively, serialises that object back to bytes and computes the signature over the result. Every stage after the network is a chance for the bytes to change without the content changing, and the signature does not care about content. It cares about bytes.

<figure class="chart">
<svg viewBox="0 0 640 330" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Sender and receiver pipelines, showing where re-serialisation happens and where the two hash inputs diverge</title>
<desc id="f1-d">Top row, the sender: object, serialise to bytes, sign those bytes, send. Bottom row, the receiver: receive bytes, framework parses to an object, handler re-serialises to bytes, verify. The bytes the sender signed and the bytes the receiver verifies are marked, and the stages between receiving and verifying are highlighted as the gap: key reordering, whitespace, unicode escapes, trailing newline, number formatting.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">The signature is over bytes; the framework hands you an object</text>
<text x="8" y="52" class="viz-tick">SENDER</text>
<rect x="8" y="60" width="120" height="44" rx="8" class="viz-box"/><text x="68" y="87" text-anchor="middle" class="viz-label">object</text>
<line x1="130" y1="82" x2="150" y2="82" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="154" y="60" width="120" height="44" rx="8" class="viz-box"/><text x="214" y="87" text-anchor="middle" class="viz-label">serialise</text>
<line x1="276" y1="82" x2="296" y2="82" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="300" y="60" width="120" height="44" rx="8" class="viz-box-ink"/><text x="360" y="87" text-anchor="middle" class="viz-on-ink">sign these bytes</text>
<line x1="422" y1="82" x2="442" y2="82" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="446" y="60" width="120" height="44" rx="8" class="viz-box"/><text x="506" y="87" text-anchor="middle" class="viz-label">send</text>
<text x="8" y="146" class="viz-tick">RECEIVER</text>
<rect x="8" y="154" width="120" height="44" rx="8" class="viz-box"/><text x="68" y="181" text-anchor="middle" class="viz-label">receive bytes</text>
<line x1="130" y1="176" x2="150" y2="176" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="154" y="154" width="120" height="44" rx="8" class="viz-box-accent"/><text x="214" y="181" text-anchor="middle" class="viz-label">framework parses</text>
<line x1="276" y1="176" x2="296" y2="176" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="300" y="154" width="120" height="44" rx="8" class="viz-box-accent"/><text x="360" y="181" text-anchor="middle" class="viz-label">handler re-serialises</text>
<line x1="422" y1="176" x2="442" y2="176" class="viz-arrow" marker-end="url(#f1-ah)"/>
<rect x="446" y="154" width="120" height="44" rx="8" class="viz-box-ink"/><text x="506" y="181" text-anchor="middle" class="viz-on-ink">verify these bytes</text>
<text x="8" y="236" class="viz-label-muted">The gap, in the highlighted stages: key order, whitespace, unicode escapes,</text>
<text x="8" y="256" class="viz-label-muted">trailing newlines, number formatting, and the framework's idea of a string.</text>
<text x="8" y="290" class="viz-label">Fix: verify against the bytes in the first receiver box, before anything parses them.</text>
<text x="8" y="312" class="viz-tick">the object is for the handler; the bytes are for the signature</text>
</svg>
<figcaption>Illustrative: the two pipelines as they exist in most web frameworks; the highlighted stages are where the gap opens.</figcaption>
</figure>

The gap has a known membership. Key reordering, because most serialisers write object keys in whatever order the language's map iterates them. Whitespace, because pretty-printed and compact JSON are the same object and different bytes.

Unicode, because a serialiser may escape a character the sender wrote literally, or normalise a composed character into a decomposed one. Trailing newlines, which some HTTP clients add and some frameworks strip. Number formatting, where 1.0 and 1 and 1e0 are one value and three byte strings. And, the one that catches people who think they are safe, the framework's decoding of the body into a string at all, which can replace bytes it considers invalid with a replacement character before the handler ever sees them.

## What the providers do

The public webhook schemes show the two design choices side by side, and the well-designed ones share a rule. Stripe's [verification guide](https://docs.stripe.com/webhooks) signs a payload built from a timestamp, a dot, and the raw request body, with a header that carries both the timestamp and the signature; the libraries reject anything older than five minutes by default; and the documentation says, in a highlighted box, that any manipulation of the raw body causes verification to fail. Slack's [scheme](https://docs.slack.dev/authentication/verifying-requests-from-slack) is the same shape: a version string, the timestamp and the raw body joined by colons, an HMAC, and a check that the timestamp is within five minutes. GitHub's [deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries) sign the raw body alone, with a secret and no timestamp, and the guidance is to compare in constant time.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Replay tolerance and timestamp binding across public webhook signing schemes</title>
<desc id="f2-d">A table of six schemes. Stripe: timestamp inside the signed payload, five-minute default tolerance. Slack: timestamp inside the signed payload, five-minute check. GitHub: HMAC over the raw body, no timestamp. Shopify: HMAC over the raw body, no timestamp. Twilio: HMAC over the URL and parameters, no timestamp. Telegram Mini App initData: an auth_date field inside the signed data, tolerance chosen by the app. The rows with a bound timestamp are highlighted.</desc>
<text x="0" y="18" class="viz-title">What is signed, and whether time is in it</text>
<text x="20" y="48" class="viz-tick">SCHEME</text>
<text x="200" y="48" class="viz-tick">SIGNED BYTES</text>
<text x="440" y="48" class="viz-tick">REPLAY WINDOW</text>
<line x1="0" y1="56" x2="640" y2="56" class="viz-axis"/>
<text x="20" y="80" class="viz-label">Stripe</text><text x="200" y="80" class="viz-label-muted">timestamp, dot, raw body</text><text x="440" y="80" class="viz-value">300 s by default</text>
<line x1="0" y1="92" x2="640" y2="92" class="viz-grid"/>
<text x="20" y="116" class="viz-label">Slack</text><text x="200" y="116" class="viz-label-muted">version, timestamp, raw body</text><text x="440" y="116" class="viz-value">5 minutes</text>
<line x1="0" y1="128" x2="640" y2="128" class="viz-grid"/>
<text x="20" y="152" class="viz-label">GitHub</text><text x="200" y="152" class="viz-label-muted">raw body only</text><text x="440" y="152" class="viz-label-muted">none in the scheme</text>
<line x1="0" y1="164" x2="640" y2="164" class="viz-grid"/>
<text x="20" y="188" class="viz-label">Shopify</text><text x="200" y="188" class="viz-label-muted">raw body only</text><text x="440" y="188" class="viz-label-muted">none in the scheme</text>
<line x1="0" y1="200" x2="640" y2="200" class="viz-grid"/>
<text x="20" y="224" class="viz-label">Twilio</text><text x="200" y="224" class="viz-label-muted">URL plus sorted parameters</text><text x="440" y="224" class="viz-label-muted">none in the scheme</text>
<line x1="0" y1="236" x2="640" y2="236" class="viz-grid"/>
<text x="20" y="260" class="viz-label">Telegram Mini App</text><text x="200" y="260" class="viz-label-muted">sorted fields including auth_date</text><text x="440" y="260" class="viz-value">app decides, from auth_date</text>
<line x1="0" y1="272" x2="640" y2="272" class="viz-grid"/>
<text x="0" y="294" class="viz-label-muted">Every row signs bytes as sent, never an object; the timestamped rows also close replay.</text>
</svg>
<figcaption>Source: the signing documentation of <a href="https://docs.stripe.com/webhooks">Stripe</a>, <a href="https://docs.slack.dev/authentication/verifying-requests-from-slack">Slack</a>, <a href="https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries">GitHub</a>, <a href="https://shopify.dev/docs/apps/build/webhooks/subscribe/https">Shopify</a>, <a href="https://www.twilio.com/docs/usage/webhooks/webhooks-security">Twilio</a> and <a href="https://core.telegram.org/bots/webapps">Telegram</a>, September 2026.</figcaption>
</figure>

Not one of them signs a JSON object. They all sign bytes, and the ones that bind a timestamp sign it as part of the same byte string, so that the replay check and the integrity check are one operation. That is the design rule in its entirety: sign and verify the exact bytes on the wire, bind a timestamp into them, and never let a parsed object stand in for the bytes it came from.

The practical symptom of the gap is a verification that fails intermittently, which is the worst kind of failure to debug. It works in the test suite, where the test constructs the request and the framework's parser round-trips it cleanly. It fails in production for the one sender whose serialiser emits a unicode escape, or for the one message that contains a number with a trailing zero, and the failure is logged as a bad signature, which sends the investigation toward the keys. The tell is that the same key verifies most messages. A key that is wrong fails all of them.

## When the bytes cannot be kept

There are designs where the receiver genuinely cannot get at the original bytes, because the message has passed through a system that reconstructs it, a message queue that stores objects, a database that holds the payload as a document, a second service that forwards a parsed copy. For those, the gap cannot be made empty by discipline, and it has to be closed by specification: both sides agree on a canonical serialisation, so that the bytes are a deterministic function of the content, and the signature is computed over the canonical form on both ends. [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785), the JSON Canonicalization Scheme, is the standard way to do that for JSON: keys sorted, whitespace removed, numbers and strings serialised one way. A design that signs objects without a canonical form is a design that will fail on the first serialiser upgrade, and the failure will look like a broken key.

The two approaches are not equal, and the order of preference is clear. Keep the bytes if you can, because a byte-for-byte check has no serialiser in it and nothing to disagree about. Canonicalise if you must, and then show that both sides actually use the canonical form, which means a test that signs on one side and verifies on the other through the real pipeline rather than a unit test of the canonicaliser alone.

## Three gates, in order

The verification code itself is three gates, and the order matters. The first is the signature, computed over the raw bytes and compared in constant time, because a comparison that returns early on the first mismatched byte leaks how many bytes matched. The second is the timestamp, checked against the receiver's clock with a tolerance measured in minutes, which turns a captured message into one that expires. The third is an idempotency key, the message's own identifier, checked against a store of recently processed ones, which turns a replay inside the window into a no-op rather than a duplicate action.

<figure class="chart">
<svg viewBox="0 0 640 230" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Constant-time compare, timestamp check and idempotency key as three gates in order</title>
<desc id="f3-d">A flow of three gates a received message passes through: first, HMAC over the raw bytes compared in constant time, rejecting forgeries; second, timestamp within tolerance, rejecting old captures; third, message id not seen before, rejecting replays inside the window. Only after all three does the handler run.</desc>
<defs><marker id="f3-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Forgery, then age, then duplicates</text>
<rect x="8" y="60" width="130" height="64" rx="8" class="viz-box"/>
<text x="73" y="86" text-anchor="middle" class="viz-label">Raw bytes</text>
<text x="73" y="104" text-anchor="middle" class="viz-label-muted">and headers</text>
<line x1="140" y1="92" x2="160" y2="92" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="164" y="60" width="140" height="64" rx="8" class="viz-box-accent"/>
<text x="234" y="86" text-anchor="middle" class="viz-label">1. Signature</text>
<text x="234" y="104" text-anchor="middle" class="viz-label-muted">constant-time check</text>
<line x1="306" y1="92" x2="326" y2="92" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="330" y="60" width="140" height="64" rx="8" class="viz-box-accent"/>
<text x="400" y="86" text-anchor="middle" class="viz-label">2. Timestamp</text>
<text x="400" y="104" text-anchor="middle" class="viz-label-muted">within tolerance</text>
<line x1="472" y1="92" x2="492" y2="92" class="viz-arrow" marker-end="url(#f3-ah)"/>
<rect x="496" y="60" width="136" height="64" rx="8" class="viz-box-accent"/>
<text x="564" y="86" text-anchor="middle" class="viz-label">3. Message id</text>
<text x="564" y="104" text-anchor="middle" class="viz-label-muted">not seen before</text>
<text x="320" y="164" text-anchor="middle" class="viz-label-muted">Each gate answers one question: is it genuine, is it current, is it new.</text>
<text x="320" y="194" text-anchor="middle" class="viz-tick">the handler parses the body only after the third gate</text>
</svg>
<figcaption>Illustrative: the three checks as the receiving code should order them; the parse into an object happens after, not before.</figcaption>
</figure>

The order is not aesthetic. Checking the timestamp before the signature lets an attacker learn your clock tolerance from an unsigned message; checking the idempotency key before the signature lets an attacker fill the store with forged ids. The signature goes first because it is the only gate that costs nothing to fail, and everything after it runs only on messages that are provably from the sender.

## The same gap in every signed message

Webhooks are where the gap is most visible, because the two sides are different companies and the bytes cross a network, but the gap is the same in every signed structure. A JWS token is a signature over base64 segments, and a library that decodes, reformats and re-encodes the payload before verifying has opened the gap in a place nobody looks. A signed configuration file, a signed manifest, a signed audit record stored in a database: each is a case where the bytes the signer hashed and the bytes the verifier hashes are separated by a store or a parser that may not round-trip. The rule is the same. Find the exact bytes that were signed, keep them, and verify those. If they cannot be kept, specify a canonical form and prove both sides produce it. The cryptography is the easy part. The bytes are where it fails.
