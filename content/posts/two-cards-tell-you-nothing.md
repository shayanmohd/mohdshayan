---
title: Two cards tell you nothing
date: 2026-10-13
summary: Keyfob splits a recovery phrase into guardian cards with Shamir sharing over the AES field. Below the threshold every phrase stays equally likely, and a test proves it from outside the app.
tags: Cryptography, Secret Sharing, Android
topic: Security & Cryptography
draft: false
---

Keyfob is a small Android app that turns one BIP-39 recovery phrase into guardian cards, so that, by default, any three of five rebuild the phrase and any two rebuild nothing. The arithmetic is Shamir secret sharing over the field of 256 elements, one byte at a time, and the title is exact: below the threshold, every possible phrase is as likely as it was before the cards existed. Building it taught me that for a tool like this the test is the product. A guardian of a 24-word phrase holds 27 words and has to take it on trust that they are useless alone and sufficient in company, so the repository carries a proof that does not trust the app, and the card format is where every usability decision has to pass through the arithmetic.

## A curve through the secret

Shamir's scheme is from a two-page paper of 1979, How to share a secret, in Communications of the ACM 22(11), pages 612 to 613, doi 10.1145/359168.359176, cited through [Wikipedia](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing). Treat the secret as a number, choose a random polynomial whose constant term is that number, and hand each guardian one point on it. Any k points fix a polynomial of degree at most k minus 1, and its value at x equals zero is the secret; with fewer than k, in Wikipedia's words, "no information about the secret can be gained from any number of shares below the threshold". That is a stronger promise than encryption makes: an encrypted file is a puzzle that a faster computer gets closer to, and two cards of a three-of-five plan are consistent with every possible phrase.

<figure class="chart">
<svg viewBox="0 0 640 290" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">A degree-two curve through the secret, fixed by three points and left open by two</title>
<desc id="f1-d">Two panels. On the left, one curve passes through the secret at x equals zero and through five points at x equals one to five, one per guardian card; any three of the points determine the curve. On the right, only the points at x equals two and four are known, and five different curves pass through both, each crossing x equals zero at a different height, so the secret could be any of them.</desc>
<text x="0" y="18" class="viz-title">Three points fix the curve, two leave it open</text>
<text x="0" y="36" class="viz-sub">A degree-two curve through the secret at x = 0; each guardian card is one point on it</text>
<text x="50" y="58" class="viz-label">Three of five cards</text>
<line x1="50" y1="64" x2="50" y2="240" class="viz-axis"/>
<line x1="50" y1="240" x2="270" y2="240" class="viz-axis"/>
<path d="M50 170 Q158 83.6 266 128.4" class="viz-s1"/>
<circle cx="50" cy="170" r="5" class="viz-d1"/>
<text x="44" y="174" text-anchor="end" class="viz-label">secret</text>
<circle cx="90" cy="142.5" r="4" class="viz-d1"/>
<circle cx="130" cy="124" r="4" class="viz-d1"/>
<circle cx="170" cy="114.5" r="4" class="viz-d1"/>
<circle cx="210" cy="114" r="4" class="viz-d1"/>
<circle cx="250" cy="122.5" r="4" class="viz-d1"/>
<text x="50" y="258" text-anchor="middle" class="viz-tick">0</text>
<text x="90" y="258" text-anchor="middle" class="viz-tick">1</text>
<text x="130" y="258" text-anchor="middle" class="viz-tick">2</text>
<text x="170" y="258" text-anchor="middle" class="viz-tick">3</text>
<text x="210" y="258" text-anchor="middle" class="viz-tick">4</text>
<text x="250" y="258" text-anchor="middle" class="viz-tick">5</text>
<text x="50" y="278" class="viz-label-muted">any three points give one curve</text>
<text x="370" y="58" class="viz-label">Two of five cards</text>
<line x1="370" y1="64" x2="370" y2="240" class="viz-axis"/>
<line x1="370" y1="240" x2="590" y2="240" class="viz-axis"/>
<path d="M370 206 Q478 46.7 586 149.8" class="viz-sgray"/>
<path d="M370 170 Q478 83.6 586 128.4" class="viz-sgray"/>
<path d="M370 134 Q478 120.5 586 107" class="viz-sgray"/>
<path d="M370 102 Q478 153.3 586 88" class="viz-sgray"/>
<path d="M370 70 Q478 186.1 586 68.9" class="viz-sgray"/>
<circle cx="370" cy="206" r="3.5" class="viz-dgray"/>
<circle cx="370" cy="170" r="3.5" class="viz-dgray"/>
<circle cx="370" cy="134" r="3.5" class="viz-dgray"/>
<circle cx="370" cy="102" r="3.5" class="viz-dgray"/>
<circle cx="370" cy="70" r="3.5" class="viz-dgray"/>
<circle cx="450" cy="124" r="5" class="viz-d1"/>
<circle cx="530" cy="114" r="5" class="viz-d1"/>
<text x="370" y="258" text-anchor="middle" class="viz-tick">0</text>
<text x="450" y="258" text-anchor="middle" class="viz-tick">2</text>
<text x="530" y="258" text-anchor="middle" class="viz-tick">4</text>
<text x="370" y="278" class="viz-label-muted">the secret could be any of these</text>
</svg>
<figcaption>Illustrative: the curves are drawn to shape over the real numbers. Keyfob works in GF(256), where a curve is a table of 256 values rather than a line on a page, but the counting argument is the same.</figcaption>
</figure>

Keyfob does this in GF(2^8), the field AES uses. `web/js/shamir.js` reduces modulo x^8 + x^4 + x^3 + x + 1, equation 4.3 in section 4.2 of [FIPS 197](https://csrc.nist.gov/pubs/fips/197/final), whose current revision is dated 9 May 2023 (read on 12 October 2026). It is also the field of [SLIP-0039](https://github.com/satoshilabs/slips/blob/master/slip-0039.md), the SatoshiLabs mnemonic standard, which applies the scheme "separately to each byte of the shared secret" and caps groups and members at 16 each; Keyfob's card format is its own. Working byte by byte means a share is exactly as long as the secret: 32 bytes for the entropy behind a 24-word phrase.

Log tables for the field are built by multiplying repeatedly by a generator, and the obvious choice, 2, is not one here: doubling walks a cycle of only 51 elements, so the tables are built by multiplying by 3, which visits all 255 non-zero elements once; I confirmed both orders on 12 October 2026. `split` draws fresh random coefficients for every byte position from `crypto.getRandomValues`, and `combine` interpolates at x equals zero and refuses a card numbered 0 or two cards with the same number.

## The proof does not trust the app

The file that matters most is `test/00-crypto-proof.js`, and its first rule is that nothing in it trusts the app's own word. It starts from a known 24-word phrase, beginning congress, stadium, chest, whose 256 bits of entropy are checked against the phrase with Node's own crypto module, BIP-39 checksum included. It carries its own GF(256), written from the field definition, its own Lagrange interpolation, and a `readCard` that reads a card the way the estate document tells a stranger to: eleven bits per word, card number first, SHA-256 over the body, compare two bytes.

Then it does everything twice. The app's module splits the phrase three of five into five cards of 27 words. Node, on its own, decodes all five and interpolates each of the ten subsets of three: all ten return the entropy. It interpolates each of the ten pairs: none does. The same twenty subsets then go through the app's own `fromCard` and `combine`, and the 24 words have to come back, word for word, from every triple and no pair. It also runs the module's `selfTest` at 400 rounds rather than the default 120, and refuses to pass unless at least 1,600 reconstructions were checked.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">All ten triples of a three-of-five plan rebuilt the phrase and none of the ten pairs did</title>
<desc id="f2-d">A grid of twenty boxes. On the left, the ten combinations of three cards out of five, from 1 plus 2 plus 3 to 3 plus 4 plus 5, all filled, each rebuilding the known 24-word phrase. On the right, the ten combinations of two cards, from 1 plus 2 to 4 plus 5, drawn as empty outlines, none rebuilding it. Cards 1, 3 and 5 were also typed into the real screens.</desc>
<text x="0" y="18" class="viz-title">Every triple rebuilt the phrase, no pair did</text>
<text x="0" y="36" class="viz-sub">A 3 of 5 plan over a known 24-word phrase, every subset of three cards and of two</text>
<text x="0" y="64" class="viz-label">Three cards, 10 of 10 rebuild it</text>
<text x="330" y="64" class="viz-label">Two cards, 0 of 10</text>
<rect x="0" y="74" width="140" height="30" rx="6" class="viz-f1"/><text x="70" y="94" text-anchor="middle" class="viz-onfill">1 + 2 + 3</text>
<rect x="150" y="74" width="140" height="30" rx="6" class="viz-f1"/><text x="220" y="94" text-anchor="middle" class="viz-onfill">1 + 4 + 5</text>
<rect x="0" y="112" width="140" height="30" rx="6" class="viz-f1"/><text x="70" y="132" text-anchor="middle" class="viz-onfill">1 + 2 + 4</text>
<rect x="150" y="112" width="140" height="30" rx="6" class="viz-f1"/><text x="220" y="132" text-anchor="middle" class="viz-onfill">2 + 3 + 4</text>
<rect x="0" y="150" width="140" height="30" rx="6" class="viz-f1"/><text x="70" y="170" text-anchor="middle" class="viz-onfill">1 + 2 + 5</text>
<rect x="150" y="150" width="140" height="30" rx="6" class="viz-f1"/><text x="220" y="170" text-anchor="middle" class="viz-onfill">2 + 3 + 5</text>
<rect x="0" y="188" width="140" height="30" rx="6" class="viz-f1"/><text x="70" y="208" text-anchor="middle" class="viz-onfill">1 + 3 + 4</text>
<rect x="150" y="188" width="140" height="30" rx="6" class="viz-f1"/><text x="220" y="208" text-anchor="middle" class="viz-onfill">2 + 4 + 5</text>
<rect x="0" y="226" width="140" height="30" rx="6" class="viz-f1"/><text x="70" y="246" text-anchor="middle" class="viz-onfill">1 + 3 + 5</text>
<rect x="150" y="226" width="140" height="30" rx="6" class="viz-f1"/><text x="220" y="246" text-anchor="middle" class="viz-onfill">3 + 4 + 5</text>
<rect x="330" y="74" width="140" height="30" rx="6" class="viz-box"/><text x="400" y="94" text-anchor="middle" class="viz-label-muted">1 + 2</text>
<rect x="480" y="74" width="140" height="30" rx="6" class="viz-box"/><text x="550" y="94" text-anchor="middle" class="viz-label-muted">2 + 4</text>
<rect x="330" y="112" width="140" height="30" rx="6" class="viz-box"/><text x="400" y="132" text-anchor="middle" class="viz-label-muted">1 + 3</text>
<rect x="480" y="112" width="140" height="30" rx="6" class="viz-box"/><text x="550" y="132" text-anchor="middle" class="viz-label-muted">2 + 5</text>
<rect x="330" y="150" width="140" height="30" rx="6" class="viz-box"/><text x="400" y="170" text-anchor="middle" class="viz-label-muted">1 + 4</text>
<rect x="480" y="150" width="140" height="30" rx="6" class="viz-box"/><text x="550" y="170" text-anchor="middle" class="viz-label-muted">3 + 4</text>
<rect x="330" y="188" width="140" height="30" rx="6" class="viz-box"/><text x="400" y="208" text-anchor="middle" class="viz-label-muted">1 + 5</text>
<rect x="480" y="188" width="140" height="30" rx="6" class="viz-box"/><text x="550" y="208" text-anchor="middle" class="viz-label-muted">3 + 5</text>
<rect x="330" y="226" width="140" height="30" rx="6" class="viz-box"/><text x="400" y="246" text-anchor="middle" class="viz-label-muted">2 + 3</text>
<rect x="480" y="226" width="140" height="30" rx="6" class="viz-box"/><text x="550" y="246" text-anchor="middle" class="viz-label-muted">4 + 5</text>
<text x="0" y="282" class="viz-label-muted">Cards 1, 3 and 5 were also typed into the real screens and returned the 24 words.</text>
<text x="0" y="304" class="viz-tick">checked twice: an independent GF(256) in Node, then the app's own combine</text>
</svg>
<figcaption>Source: <a href="https://github.com/shayanmohd/keyfob/blob/main/test/00-crypto-proof.js">test/00-crypto-proof.js</a> in the Keyfob repository, which fails unless all ten triples and none of the ten pairs rebuild the phrase; the same counts came back when I ran the modules in Node on 12 October 2026.</figcaption>
</figure>

Two cards do not fail loudly. A line through two points still crosses zero somewhere, so a pair returns 32 bytes that make a 24-word phrase with a valid checksum. In my Node run on 12 October 2026, cards 1 and 2 gave a phrase beginning soon, refuse, uniform, derive, and nothing in it says it is wrong. That is what "no information" looks like, and it is why the gather screen waits for the threshold number of cards before calling `combine`, then checks the result against a four-byte fingerprint of the original phrase.

One word of card 1 swapped for another real word: refused, and by the checksum, not by accident. The same card with its last word missing: refused, told that a card for this size of phrase is 27 words and you entered 26. A word not on the list: refused, naming the position. Finally the test drives the real screens in a headless browser, through a harness outside the repository: it types the phrase, accepts the default three of five, counts 27 words on each card, then types cards 1, 3 and 5 into the gather screen and reads the 24 words off the result.

## Where the words meet the arithmetic

Nobody copies 32 bytes out by hand, so the card format is where the usability decisions live. Keyfob writes a card in the same 2048 words a recovery phrase uses. [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) fixes the packing, eleven bits per word with each word an index from 0 to 2047, and its list is built so that the first four letters are enough, which lets the app finish a word as you type. The list in `web/js/bip39.js` has 2048 words with 2048 distinct four-letter prefixes, and it lives in the file because the app declares no internet permission.

The payload is five bytes around the share: the card number, the secret length, one byte holding the threshold and the total (m minus 1 in the high nibble, n minus 1 in the low, which is where the limit of 16 comes from), the share bytes, then the first two bytes of SHA-256 over everything before them. Packed eleven bits to a word and padded with zeros to a whole word, a card for a 24-word phrase is 27 words, the ceiling of (32 + 5) × 8 / 11.

<figure class="chart">
<svg viewBox="0 0 640 320" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Words per guardian card against words per recovery phrase, for the five BIP-39 phrase lengths</title>
<desc id="f3-d">Paired horizontal bars. A 12-word phrase gives a 16-word card; 15 gives 19; 18 gives 22; 21 gives 24; 24 gives 27. The card bar is longer in every row by the five header and checksum bytes packed into eleven-bit words.</desc>
<text x="0" y="18" class="viz-title">The card is a few words longer than the phrase</text>
<text x="0" y="36" class="viz-sub">Phrase words against card words; the difference is five header and checksum bytes</text>
<rect x="0" y="47" width="12" height="12" rx="3" class="viz-fgray"/><text x="18" y="57" class="viz-label-muted">recovery phrase</text>
<rect x="150" y="47" width="12" height="12" rx="3" class="viz-f1"/><text x="168" y="57" class="viz-label-muted">guardian card</text>
<line x1="116" y1="66" x2="116" y2="262" class="viz-axis"/>
<text x="106" y="90" text-anchor="end" class="viz-label">12-word phrase</text>
<rect x="116" y="70" width="216" height="12" rx="3" class="viz-fgray"/><text x="338" y="80" class="viz-value">12</text>
<rect x="116" y="86" width="288" height="12" rx="3" class="viz-f1"/><text x="410" y="96" class="viz-value">16</text>
<text x="106" y="130" text-anchor="end" class="viz-label">15-word phrase</text>
<rect x="116" y="110" width="270" height="12" rx="3" class="viz-fgray"/><text x="392" y="120" class="viz-value">15</text>
<rect x="116" y="126" width="342" height="12" rx="3" class="viz-f1"/><text x="464" y="136" class="viz-value">19</text>
<text x="106" y="170" text-anchor="end" class="viz-label">18-word phrase</text>
<rect x="116" y="150" width="324" height="12" rx="3" class="viz-fgray"/><text x="446" y="160" class="viz-value">18</text>
<rect x="116" y="166" width="396" height="12" rx="3" class="viz-f1"/><text x="518" y="176" class="viz-value">22</text>
<text x="106" y="210" text-anchor="end" class="viz-label">21-word phrase</text>
<rect x="116" y="190" width="378" height="12" rx="3" class="viz-fgray"/><text x="500" y="200" class="viz-value">21</text>
<rect x="116" y="206" width="432" height="12" rx="3" class="viz-f1"/><text x="554" y="216" class="viz-value">24</text>
<text x="106" y="250" text-anchor="end" class="viz-label">24-word phrase</text>
<rect x="116" y="230" width="432" height="12" rx="3" class="viz-fgray"/><text x="554" y="240" class="viz-value">24</text>
<rect x="116" y="246" width="486" height="12" rx="3" class="viz-f1"/><text x="608" y="256" class="viz-value">27</text>
<text x="0" y="288" class="viz-label-muted">Eighteen pixels per word; a card is ceil((bytes + 5) × 8 / 11) words.</text>
<text x="0" y="306" class="viz-tick">a 21-word phrase packs to exactly 24 words; the other sizes pad the last word</text>
</svg>
<figcaption>Source: the wordCount function in <a href="https://github.com/shayanmohd/keyfob/blob/main/web/js/shamir.js">web/js/shamir.js</a>; phrase lengths from the <a href="https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki">BIP-39</a> table, 128 to 256 bits of entropy giving 12 to 24 words.</figcaption>
</figure>

Two of those decisions are worth defending. The card number goes first so that two cards from one set differ from their first word, which is what stops a guardian copying out the wrong one; for a 24-word phrase, card k always opens with the word at zero-based index 8k + 1, so the five cards in my run began abuse, acquire, add, aerobic and ahead. The two-byte checksum is sixteen bits, so a damaged card slips through by luck once in 65,536 tries, and it costs one word on a 27-word card, two on the three shortest sizes. It is what turns "something is wrong with these cards" into "every word is real, but the card fails its own checksum". The reader accepts only the five BIP-39 secret lengths, so random real words decode to nothing.

Keyfob is not a wallet: it never sees an address, a balance or a transaction, and the manifest in the [Keyfob repository](https://github.com/shayanmohd/keyfob) asks for one permission, VIBRATE, with backups switched off and no INTERNET permission. The whole app is plain HTML, CSS and JavaScript in `web/`, no build step, no dependencies, inside a thin Kotlin WebView shell. All of this is true of the repository at its last commit, 7 September 2026, read on 12 October 2026.

## The test is the product

Nobody will ever see two cards tell them nothing; the only observable event is a rebuild, and a rebuild looks the same whether the pairs are safe or not. If the random coefficients were weak, or a field bug made some pairs informative, every screen would still render and every drill would still pass. In the repository the proof is the second of two commits, two days after the screens, and it should have been the first file. For a tool whose purpose is a property you cannot see, the test is not a quality step after the product. It is the product, and the app is the part a guardian can hold.
