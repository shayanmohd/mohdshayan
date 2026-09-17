---
title: On Solana the caller writes your argument list
date: 2026-09-18
summary: An EVM contract reads its own storage; a Solana program is handed every account it touches by the caller, so the account list is untrusted input. Count what you accept unchecked.
tags: Solana, Anchor, Security
draft: false
---

The hardest habit to unlearn when moving from Solidity to Solana is trusting your own storage. An EVM contract owns its state: a mapping lives at an address the contract controls, and reading it is reading something only the contract could have written. A Solana program owns nothing at run time. Every account it touches, its own state, the user's token account, the mint, the program it will call, arrives in a list that the transaction's author assembled and passed in. The program is handed its argument list by the caller, and the caller may be hostile. Most Solana exploits are not logic bugs in the Solidity sense. They are accounts accepted without proving who owns them, who signed for them and what type they are, and the defence is a number a build pipeline can enforce rather than a longer checklist.

## What the audits find

The clearest evidence is in the aggregate audit data. Sec3's [Solana Security Ecosystem Review 2025](https://sec3.dev/report), an empirical analysis of 1,669 findings across 163 multi-auditor reviews, reports that three categories account for 85.5 percent of high and critical findings: business logic errors at 36.9 percent, input validation failures at 27.9 percent and access control weaknesses at 20.7 percent. The second and third categories are, on Solana, overwhelmingly the same mechanism: an account in the instruction's list that the program used without checking its owner, its signer status or its type. Nearly half of the severe findings are that mechanism wearing two labels.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Share of high and critical audit findings by category, Sec3 review of 163 Solana audits</title>
<desc id="f1-d">Horizontal bars in percent: business logic 36.9, input validation 27.9, access control 20.7, all other categories 14.5. Input validation and access control are highlighted as the two categories that are mostly unchecked accounts.</desc>
<text x="0" y="18" class="viz-title">Half of severe findings are an account nobody checked</text>
<text x="0" y="36" class="viz-sub">Percent of high and critical findings, 1,669 findings across 163 audits, Sec3 2025</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Business logic</text>
<path d="M176 58 H569 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="565" y="53" text-anchor="end" class="viz-value">36.9</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Input validation</text>
<path d="M176 92 H473 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="493" y="107" class="viz-value">27.9</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Access control</text>
<path d="M176 126 H397 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="417" y="141" class="viz-value">20.7</text>
<text x="166" y="175" text-anchor="end" class="viz-label">Everything else</text>
<path d="M176 160 H331 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="351" y="175" class="viz-value">14.5</text>
<rect x="0" y="212" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="223" class="viz-label-muted">mostly accounts accepted without owner, signer or type checks</text>
</svg>
<figcaption>Source: Sec3, <a href="https://sec3.dev/report">Solana Security Ecosystem Review 2025</a>; the fourth bar is the remainder to 100 percent.</figcaption>
</figure>

The incident history says the same thing with larger numbers. The Wormhole bridge lost 326 million dollars in February 2022 to a signature verification flaw, an instruction that accepted an account standing in for a system program without checking that it was the real one; Cashio lost 52.8 million a month later to a missing check on the accounts in its mint instruction. Both are input validation in the [DefiLlama hacks dataset](https://defillama.com/hacks), both are the caller writing an argument list the program believed, and both would have been caught by a check that fits on one line.

## The three gates

Every account in an instruction has to pass three gates before the logic runs. The owner gate: which program owns this account, and is it the one expected? A token account owned by anything other than the token program is a forgery. The signer gate: did the private key for this account sign the transaction? An instruction that moves funds out of an account the caller merely listed, rather than signed for, moves anyone's funds. The type gate: does the account's data begin with the discriminator for the type the program expects? An account of the wrong type, owned by the right program, is how one struct is read as another.

<figure class="chart">
<svg viewBox="0 0 640 260" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">One instruction's account list passing through the owner, signer and type gates before any logic runs</title>
<desc id="f2-d">A flow from left to right. The caller supplies the account list. Gate one, owner: is each account owned by the expected program? Gate two, signer: did the accounts that must authorise sign? Gate three, type: does each account's discriminator match? Only after all three does the instruction logic run. An unchecked account bypasses all three gates and is drawn as a path around them.</desc>
<defs><marker id="f2-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">Three questions per account, before the first line of logic</text>
<rect x="8" y="70" width="110" height="60" rx="8" class="viz-box-ink"/>
<text x="63" y="96" text-anchor="middle" class="viz-on-ink">Caller's list</text>
<text x="63" y="114" text-anchor="middle" class="viz-on-ink">untrusted</text>
<line x1="120" y1="100" x2="136" y2="100" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="140" y="70" width="104" height="60" rx="8" class="viz-box-accent"/>
<text x="192" y="96" text-anchor="middle" class="viz-label">Owner?</text>
<text x="192" y="114" text-anchor="middle" class="viz-label-muted">expected program</text>
<line x1="246" y1="100" x2="262" y2="100" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="266" y="70" width="104" height="60" rx="8" class="viz-box-accent"/>
<text x="318" y="96" text-anchor="middle" class="viz-label">Signer?</text>
<text x="318" y="114" text-anchor="middle" class="viz-label-muted">key authorised</text>
<line x1="372" y1="100" x2="388" y2="100" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="392" y="70" width="104" height="60" rx="8" class="viz-box-accent"/>
<text x="444" y="96" text-anchor="middle" class="viz-label">Type?</text>
<text x="444" y="114" text-anchor="middle" class="viz-label-muted">discriminator</text>
<line x1="498" y1="100" x2="514" y2="100" class="viz-arrow" marker-end="url(#f2-ah)"/>
<rect x="518" y="70" width="114" height="60" rx="8" class="viz-box"/>
<text x="575" y="96" text-anchor="middle" class="viz-label">Logic</text>
<text x="575" y="114" text-anchor="middle" class="viz-label-muted">trusted input</text>
<path d="M63 132 V190 H575 V134" class="viz-arrow" marker-end="url(#f2-ah)"/>
<text x="320" y="184" text-anchor="middle" class="viz-tick">an unchecked account takes this path: straight to the logic, past all three gates</text>
<text x="320" y="234" text-anchor="middle" class="viz-label-muted">Anchor makes the gates attributes on the struct; UncheckedAccount is the bypass.</text>
</svg>
<figcaption>Illustrative: the gates as an instruction's account validation, drawn as a pipeline; Anchor's constraint attributes implement the first three boxes.</figcaption>
</figure>

Anchor exists to make the three gates the default. Declaring an account as a typed Account of a given struct checks owner and discriminator; the Signer type checks the signature; constraints on the struct check relationships between accounts, that this token account's mint is that mint, that this authority matches the one stored in state. The escape hatch is [UncheckedAccount](https://docs.rs/anchor-lang/latest/anchor_lang/accounts/unchecked_account/struct.UncheckedAccount.html), and raw AccountInfo, which accept whatever the caller supplied and leave every check to the programmer. They exist for good reasons: an account that only needs its address read, a program the instruction will invoke, an account the logic will validate in a way the attributes cannot express. And every one of them is a place where the argument list is trusted.

## The unchecked ratio

So the number is this: across a program, the count of accounts declared as UncheckedAccount or raw AccountInfo, divided by the count of all accounts across all instructions. It is a ratio between zero and one, it is computable with a grep over the account structs, and in my reading of public audit reports it tracks the findings better than any property of the logic does, because it is a direct count of the places where the three gates were skipped.

The ratio belongs in continuous integration with a ceiling and a written justification for every unchecked account. Anchor already requires a doc comment on each UncheckedAccount explaining why it is safe, and the build fails without one; the ratio turns that from a per-field formality into a program-level budget. A pull request that adds an unchecked account raises the ratio, the check reports the new value against the ceiling, and the reviewer reads the justification with the number in front of them. A program whose ratio climbs release by release is one whose surface for the two largest severe-finding categories is growing, whatever its test suite says.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Notable Solana exploits by loss and root cause, 2022 to 2026</title>
<desc id="f3-d">Horizontal bars in millions of US dollars: Wormhole, February 2022, 326, signature verification flaw; Drift, April 2026, 295, proxy upgrade hijack; Mango Markets, October 2022, 115, spot price manipulation; Cashio, March 2022, 52.8, missing input validation. The two account-validation incidents are highlighted.</desc>
<text x="0" y="18" class="viz-title">The largest losses, and which were an unchecked account</text>
<text x="0" y="36" class="viz-sub">Millions of US dollars, on-chain Solana incidents from the DefiLlama hacks dataset</text>
<line x1="196" y1="52" x2="196" y2="188" class="viz-axis"/>
<text x="186" y="73" text-anchor="end" class="viz-label">Wormhole, Feb 2022</text>
<path d="M196 58 H588 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="584" y="53" text-anchor="end" class="viz-value">326, signature check</text>
<text x="186" y="107" text-anchor="end" class="viz-label">Drift, Apr 2026</text>
<path d="M196 92 H551 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="547" y="87" text-anchor="end" class="viz-value">295, upgrade authority</text>
<text x="186" y="141" text-anchor="end" class="viz-label">Mango, Oct 2022</text>
<path d="M196 126 H334 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H196 Z" class="viz-fgray"/>
<text x="354" y="141" class="viz-value">115, price manipulation</text>
<text x="186" y="175" text-anchor="end" class="viz-label">Cashio, Mar 2022</text>
<path d="M196 160 H259 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H196 Z" class="viz-f1"/>
<text x="279" y="175" class="viz-value">52.8, missing account check</text>
<rect x="0" y="212" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="223" class="viz-label-muted">an account accepted without a gate</text>
<rect x="260" y="212" width="12" height="12" rx="3" class="viz-fgray"/><text x="278" y="223" class="viz-label-muted">other root cause</text>
<text x="0" y="250" class="viz-label-muted">Exchange key compromises that touched Solana are excluded; they are not program bugs.</text>
</svg>
<figcaption>Source: computed by the author from the <a href="https://defillama.com/hacks">DefiLlama hacks dataset</a>, filtered to on-chain Solana incidents and labelled with the dataset's technique field.</figcaption>
</figure>

## Computing it

The count is a walk over the account structs, which in an Anchor program are the structs annotated as the accounts of an instruction. Each field is one account. A field typed as a checked wrapper, an Account of a named state type, a Signer, a Program, a typed token account, counts as checked; a field typed UncheckedAccount or AccountInfo counts as unchecked. The ratio is the second count over the total, program-wide, and a per-instruction breakdown is worth keeping beside it, because an instruction with three unchecked accounts out of four is a different risk from three unchecked accounts spread across a hundred instructions.

Two refinements keep the number honest. An unchecked account that carries an explicit address or owner constraint in its attributes is still counted as unchecked, because the point is that the type system did not do the work and a reviewer has to; the constraint is the justification, not the check. And the doc comment Anchor requires on each unchecked field is captured alongside the count, so that the CI output is a list: instruction, field, justification, and the ratio at the top. A justification that reads "safe because we only read the key" is fine. One that reads "checked in the handler" sends the reviewer to the handler, which is where the audit findings live.

The ceiling is set per program and lowered over time. A new program starts wherever it starts, the number is recorded, and every release either holds it or explains why it rose. That is the whole discipline, and it costs a script.

## The Solidity habit, named

It is worth saying what the EVM habit is, because the ratio is a cure for a specific way of thinking. In Solidity I wrote a flash-loan receiver whose state was its own: the contract read its balances and its flags from storage that no caller could substitute, and the security work was about ordering, what got written before control left. On Solana the same receiver would be handed its state account by the caller, and the first question is not what order to write things in but whether the account being written is the one the program created. The EVM developer's instinct is to reach for the logic; the Solana developer's first job is to establish that the inputs are what they claim to be, and only then to reach for the logic.

That difference is why checklists underperform here. A checklist is a list of things to remember, and the account model produces one of them per account per instruction, which for a program of forty instructions is hundreds of items that all look alike. A ratio is a single number that goes up when any of them is skipped. It does not replace the audit, and it does not catch the business-logic third of the findings. It catches the half that is the caller writing your argument list, and it catches it before the reviewer opens the file.
