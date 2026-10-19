---
title: The tarball is not the repository
date: 2024-05-14
summary: The xz backdoor's trigger was never in git, only in the signed release tarballs that distributions compiled. Build from the tag, and treat test files as code.
tags: Supply Chain, Open Source, Release Engineering
topic: Security & Cryptography
draft: false
---

Andres Freund's [message to the oss-security list](https://www.openwall.com/lists/oss-security/2024/03/29/4) on 29 March 2024 gave its finding in one line: "The upstream xz repository and the xz tarballs have been backdoored." That sentence names two objects, and the gap between them is the lesson. The code that switched the backdoor on, a doctored copy of build-to-host.m4, a standard gnulib macro file that [recent versions of gettext pull in](https://web.archive.org/web/20240402213156/https://lists.debian.org/debian-devel/2024/03/msg00367.html), was never in the xz git repository. It existed only in the release tarballs for 5.6.0 and 5.6.1, which the attacker built and signed and distributions compiled. The payload was in git, packed into two binary test files of the kind reviewers skip. "The code is open" was true and beside the point: the artefact that was built was not the artefact anyone reviewed. The rule I take from it is to build from the tag, regenerate what the tag lacks, and treat test fixtures and generated files as code.

## Two downloads on one release page

One portion of the backdoor, Freund wrote, "is *solely in the distributed tarballs*". The line he pointed to in build-to-host.m4 "is *not* in the upstream source of build-to-host, nor is build-to-host used by xz in git." The release pages offered [both kinds of download](https://web.archive.org/web/20240425061843/https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives): the uploaded, signed tarballs carried the trigger, and the "source code" archives, which he thought "github generates directly from the repository contents", did not. Lasse Collin, the project's original maintainer, confirmed on [his incident page](https://web.archive.org/web/20240511045004/https://tukaani.org/xz-backdoor/) that those tarballs "were created and signed by Jia Tan", the attacker's alias, and that the test files are harmless "without the trigger code that was never included in the Git repository."

Russ Cox's [walkthrough of the script](https://web.archive.org/web/20240508161556/https://research.swtch.com/xz-script) shows the macro, during configure, finding tests/files/bad-3-corrupt_lzma2.xz by a marker string, swapping some characters back with tr, decompressing it and piping it to a shell. That script carves a second one out of good-large_compressed.lzma. The second checks, among other things, for x86-64 Linux, gcc, the GNU linker, GNU indirect-function support and a Debian or RPM package build, and if they hold, edits the generated Makefile so that make links an object file hidden in the test data into liblzma. OpenSSH did not use liblzma directly, but Debian and several other distributions patched it to notify systemd through libsystemd, which depended on liblzma.

<figure class="chart">
<svg viewBox="0 0 640 504" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">What was in git, what was only in the xz release tarball, and what a package build ran</title>
<desc id="f1-d">Left, three panels. Only in the signed release tarball: a generated configure script and the macros copied in at packaging, including a doctored m4/build-to-host.m4. In git at the tag, and so also in the tarball: the source code, configure.ac, and two binary test files, bad-3-corrupt_lzma2.xz and good-large_compressed.lzma, which hold the payload and which make check fed to xz by glob, like every other good-* and bad-* file. GitHub's source code archives, built from the tag by git archive, held no trigger. Right, the steps a Debian or RPM build ran: configure runs the macro; it greps the source tree for a marker; tr and xz -d turn the first test file into a script; that script carves a second script from the other test file; among other checks, it requires x86-64, gcc, GNU ld, GNU indirect-function support and a Debian or RPM build; if so, the Makefile is edited and make links the hidden object into liblzma, which patched sshd loaded through libsystemd. Arrows run from the macro and from each test file to the step that reads it.</desc>
<defs><marker id="f1-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" class="viz-arrowhead"/></marker></defs>
<text x="0" y="18" class="viz-title">The trigger was only in the tarball; the payload was in git</text>
<text x="0" y="36" class="viz-sub">xz 5.6.0 and 5.6.1: what each artefact held, and what a package build executed</text>
<rect x="4" y="50" width="312" height="110" rx="8" class="viz-box"/>
<text x="16" y="72" class="viz-label">Only in the signed release tarball</text>
<text x="16" y="92" class="viz-label-muted">generated configure, macros copied in</text>
<rect x="16" y="106" width="288" height="40" rx="6" class="viz-box-accent"/>
<text x="28" y="131" class="viz-value">m4/build-to-host.m4</text>
<text x="292" y="131" text-anchor="end" class="viz-label-muted">doctored</text>
<rect x="4" y="176" width="312" height="192" rx="8" class="viz-box"/>
<text x="16" y="198" class="viz-label">In git at the tag, and in the tarball</text>
<text x="16" y="218" class="viz-label-muted">source code and configure.ac</text>
<rect x="16" y="232" width="288" height="40" rx="6" class="viz-box"/>
<text x="28" y="257" class="viz-value">bad-3-corrupt_lzma2.xz</text>
<text x="292" y="257" text-anchor="end" class="viz-tick">test file</text>
<rect x="16" y="296" width="288" height="40" rx="6" class="viz-box"/>
<text x="28" y="321" class="viz-value">good-large_compressed.lzma</text>
<text x="292" y="321" text-anchor="end" class="viz-tick">test file</text>
<text x="16" y="356" class="viz-tick">payload; make check read both</text>
<rect x="4" y="384" width="312" height="88" rx="8" class="viz-band"/>
<text x="16" y="408" class="viz-label">GitHub's "Source code" archives</text>
<text x="16" y="430" class="viz-label-muted">built from the tag by git archive,</text>
<text x="16" y="450" class="viz-label-muted">so they held no trigger</text>
<text x="344" y="72" class="viz-label">What a Debian or RPM build ran</text>
<rect x="344" y="106" width="292" height="40" rx="6" class="viz-box"/>
<text x="490" y="131" text-anchor="middle" class="viz-label">configure runs the macro</text>
<rect x="344" y="169" width="292" height="40" rx="6" class="viz-box"/>
<text x="490" y="194" text-anchor="middle" class="viz-label">it greps the tree for a marker</text>
<rect x="344" y="232" width="292" height="40" rx="6" class="viz-box"/>
<text x="490" y="257" text-anchor="middle" class="viz-label">tr and xz -d turn it into a script</text>
<rect x="344" y="296" width="292" height="40" rx="6" class="viz-box"/>
<text x="490" y="321" text-anchor="middle" class="viz-label">that script carves a second from it</text>
<rect x="344" y="360" width="292" height="40" rx="6" class="viz-box"/>
<text x="490" y="385" text-anchor="middle" class="viz-label">x86-64, gcc, GNU ld, ifunc, Debian/RPM?</text>
<rect x="344" y="424" width="292" height="48" rx="6" class="viz-box-ink"/>
<text x="490" y="443" text-anchor="middle" class="viz-on-ink">Makefile edited; make links the</text>
<text x="490" y="462" text-anchor="middle" class="viz-on-ink">hidden object into liblzma</text>
<text x="490" y="494" text-anchor="middle" class="viz-label-muted">which patched sshd loaded via libsystemd</text>
<line x1="306" y1="126" x2="340" y2="126" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="306" y1="252" x2="340" y2="252" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="306" y1="316" x2="340" y2="316" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="490" y1="148" x2="490" y2="165" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="490" y1="211" x2="490" y2="228" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="490" y1="274" x2="490" y2="292" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="490" y1="338" x2="490" y2="356" class="viz-arrow" marker-end="url(#f1-ah)"/>
<line x1="490" y1="402" x2="490" y2="420" class="viz-arrow" marker-end="url(#f1-ah)"/>
<text x="500" y="415" class="viz-tick">yes</text>
</svg>
<figcaption>Source: Andres Freund's <a href="https://www.openwall.com/lists/oss-security/2024/03/29/4">oss-security post</a> of 29 March 2024 for what the tarball, the repository and GitHub's archives contained; GitHub's <a href="https://web.archive.org/web/20240425061843/https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives">documentation on source code archives</a>; Lasse Collin's <a href="https://web.archive.org/web/20240509020630/https://tukaani.org/xz-backdoor/review.html">review notes</a>, last updated on 8 May 2024, for tests/test_files.sh picking up the test files by glob; Russ Cox's <a href="https://web.archive.org/web/20240508161556/https://research.swtch.com/xz-script">walkthrough of the script</a>, posted on 2 April 2024 and updated on 3 April 2024, for the steps and the build conditions.</figcaption>
</figure>

## Why nobody compared them

None of this needed the tarball to look odd, because autotools tarballs are meant to differ from the repository. "Usually, the configure script and its support libraries are only added to the tarball distributions, not the source repository," Cox writes. "The xz distribution works this way too." His [timeline](https://web.archive.org/web/20240512051254/https://research.swtch.com/xz-timeline) judges the extra macro "not suspicious by itself", since many legitimate ones arrive the same way. Against the standard copy the changes were small: the serial number went from 3 to 30, the copyright line gained 2024, and a handful of other changes did not, in Cox's words, "look terribly out of place". The serial bump mattered: [Guillem Jover found](https://web.archive.org/web/20240402213156/https://lists.debian.org/debian-devel/2024/03/msg00367.html) that the autoreconf -f -i in Debian's build left alone macro files with a higher serial than the installed copy, so the tarball's newer gettext.m4 survived to pull in the doctored file, which serial 30 would have kept through a gettext upgrade.

The signature was no help either, because it answered a different question. Arch Linux's first [build recipe for 5.6.1](https://web.archive.org/web/20240330102951/https://gitlab.archlinux.org/archlinux/packaging/packages/xz/-/commit/881385757abdc39d3cfea1c3e34ec09f637424ad.patch) fetched xz-5.6.1.tar.gz and its .sig from the GitHub release and listed two valid signing keys, Lasse Collin's and Jia Tan's. A signature binds a file to a key. It says nothing about whether the file matches the repository, and here the key was the attacker's own.

## Seventeen months to own the release

The campaign ran for more than two years, and Cox's [timeline of the attack](https://web.archive.org/web/20240512051254/https://research.swtch.com/xz-timeline) shows it aimed at the one role a review of git cannot audit. Jia Tan's first patch reached the xz-devel list on 29 October 2021. From April 2022, accounts that Cox thinks were probably fakes complained about Jia Tan's stalled patch, and by June demanded a new maintainer: "Progress will not happen until there is new maintainer," one wrote. Collin replied that this was "an unpaid hobby project", and on 29 June called Jia Tan "practically a co-maintainer already". Jia Tan was committing directly by 30 December 2022. Collin built his last release, 5.4.1, on 11 January 2023, and Jia Tan built a first, 5.4.2, on 18 March. From then on, the person producing the signed tarballs was the attacker.

On 23 February 2024 the payload went into git as test files, and the next day 5.6.0 was tagged and its tarball published with the extra macro. The object code caused Valgrind errors, so on 9 March Jia Tan replaced the test files, with a commit message explaining that "a constant seed was used to recreate these files", and shipped 5.6.1 the same day.

<figure class="chart">
<svg viewBox="0 0 640 488" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Timeline of the xz attack from the first patch in 2021 to the disclosure in March 2024</title>
<desc id="f2-d">Two time axes, each drawn to scale. Top, October 2021 to March 2024: 29 October 2021, first patch; 22 April 2022, pressure emails begin; 29 June 2022, Collin calls Jia Tan practically a co-maintainer; 30 December 2022, Jia Tan commits directly; 11 January 2023, Collin's last release, 5.4.1; 18 March 2023, Jia Tan's first release, 5.4.2; 19 January 2024, Jia Tan controls the web page. A red band at the end marks the five weeks shown below. Bottom, 20 February to 31 March 2024: 23 February, payload committed in test files; 24 February, 5.6.0 tarball with the trigger; 26 February, Debian unstable takes 5.6.0; 9 March, the two test files replaced and 5.6.1; 25 March, a Debian bug asks for 5.6.1; 27 March, Debian takes 5.6.1; 28 March, reported privately; 29 March, public disclosure.</desc>
<text x="0" y="18" class="viz-title">Over two years of patience, then five weeks of attack</text>
<text x="0" y="36" class="viz-sub">Dates from Russ Cox's timeline, to scale on each axis</text>
<circle cx="436" cy="32" r="4.5" class="viz-d2"/>
<text x="445" y="36" class="viz-label-muted">access</text>
<circle cx="504" cy="32" r="4.5" class="viz-d4"/>
<text x="513" y="36" class="viz-label-muted">attack</text>
<circle cx="572" cy="32" r="4.5" class="viz-d3"/>
<text x="581" y="36" class="viz-label-muted">response</text>
<text x="0" y="58" class="viz-label-muted">Gaining control, October 2021 to January 2024</text>
<line x1="24" y1="148" x2="616" y2="148" class="viz-axis"/>
<text x="86.7" y="170" class="viz-tick">2022</text>
<text x="323.3" y="170" class="viz-tick">2023</text>
<text x="560" y="170" class="viz-tick">2024</text>
<rect x="591.4" y="144" width="22.7" height="8" class="viz-f4"/>
<line x1="602.7" y1="153" x2="602.7" y2="236" class="viz-grid"/>
<text x="597.7" y="233" text-anchor="end" class="viz-label-muted">zoomed below</text>
<line x1="42.2" y1="143" x2="42.2" y2="105" class="viz-grid"/>
<text x="47.2" y="116" class="viz-tick">29 Oct 2021</text>
<text x="47.2" y="131" class="viz-label">first patch</text>
<line x1="155.6" y1="153" x2="155.6" y2="204" class="viz-grid"/>
<text x="160.6" y="186" class="viz-tick">22 Apr 2022</text>
<text x="160.6" y="201" class="viz-label">pressure emails begin</text>
<line x1="199.7" y1="143" x2="199.7" y2="73" class="viz-grid"/>
<text x="204.7" y="84" class="viz-tick">29 Jun 2022</text>
<text x="204.7" y="99" class="viz-label">"practically a co-maintainer"</text>
<line x1="319" y1="153" x2="319" y2="236" class="viz-grid"/>
<text x="324" y="218" class="viz-tick">30 Dec 2022</text>
<text x="324" y="233" class="viz-label">commits directly</text>
<line x1="326.8" y1="143" x2="326.8" y2="105" class="viz-grid"/>
<text x="331.8" y="116" class="viz-tick">11 Jan 2023</text>
<text x="331.8" y="131" class="viz-label">Collin's last release, 5.4.1</text>
<line x1="369.6" y1="153" x2="369.6" y2="204" class="viz-grid"/>
<text x="374.6" y="186" class="viz-tick">18 Mar 2023</text>
<text x="374.6" y="201" class="viz-label">Jia Tan's first, 5.4.2</text>
<line x1="568.7" y1="143" x2="568.7" y2="73" class="viz-grid"/>
<text x="563.7" y="84" text-anchor="end" class="viz-tick">19 Jan 2024</text>
<text x="563.7" y="99" text-anchor="end" class="viz-label">controls the web page</text>
<circle cx="42.2" cy="148" r="4.5" class="viz-d2"/>
<circle cx="155.6" cy="148" r="4.5" class="viz-d2"/>
<circle cx="199.7" cy="148" r="4.5" class="viz-d2"/>
<circle cx="319" cy="148" r="4.5" class="viz-d2"/>
<circle cx="326.8" cy="148" r="4.5" class="viz-d2"/>
<circle cx="369.6" cy="148" r="4.5" class="viz-d2"/>
<circle cx="568.7" cy="148" r="4.5" class="viz-d2"/>
<line x1="83.7" y1="138" x2="83.7" y2="158" class="viz-axis"/>
<line x1="320.3" y1="138" x2="320.3" y2="158" class="viz-axis"/>
<line x1="557" y1="138" x2="557" y2="158" class="viz-axis"/>
<text x="0" y="268" class="viz-label-muted">The attack and its discovery, 20 February to 31 March 2024</text>
<line x1="24" y1="358" x2="616" y2="358" class="viz-axis"/>
<line x1="24" y1="354" x2="24" y2="362" class="viz-axis"/>
<text x="24" y="374" class="viz-tick">20 Feb</text>
<line x1="172" y1="354" x2="172" y2="362" class="viz-axis"/>
<text x="172" y="374" text-anchor="middle" class="viz-tick">1 Mar</text>
<line x1="616" y1="354" x2="616" y2="380" class="viz-axis"/>
<text x="610" y="390" text-anchor="end" class="viz-tick">31 Mar</text>
<line x1="68.4" y1="353" x2="68.4" y2="283" class="viz-grid"/>
<text x="73.4" y="294" class="viz-tick">23 Feb</text>
<text x="73.4" y="309" class="viz-label">payload in test files</text>
<line x1="83.2" y1="353" x2="83.2" y2="315" class="viz-grid"/>
<text x="88.2" y="326" class="viz-tick">24 Feb</text>
<text x="88.2" y="341" class="viz-label">5.6.0 tarball with trigger</text>
<line x1="112.8" y1="363" x2="112.8" y2="414" class="viz-grid"/>
<text x="117.8" y="396" class="viz-tick">26 Feb</text>
<text x="117.8" y="411" class="viz-label">Debian unstable: 5.6.0</text>
<line x1="290.4" y1="353" x2="290.4" y2="283" class="viz-grid"/>
<text x="295.4" y="294" class="viz-tick">9 Mar</text>
<text x="295.4" y="309" class="viz-label">files replaced, 5.6.1</text>
<line x1="527.2" y1="363" x2="527.2" y2="414" class="viz-grid"/>
<text x="522.2" y="396" text-anchor="end" class="viz-tick">25 Mar</text>
<text x="522.2" y="411" text-anchor="end" class="viz-label">Debian bug asks for 5.6.1</text>
<line x1="556.8" y1="363" x2="556.8" y2="446" class="viz-grid"/>
<text x="551.8" y="428" text-anchor="end" class="viz-tick">27 Mar</text>
<text x="551.8" y="443" text-anchor="end" class="viz-label">Debian takes 5.6.1</text>
<line x1="571.6" y1="353" x2="571.6" y2="315" class="viz-grid"/>
<text x="566.6" y="326" text-anchor="end" class="viz-tick">28 Mar</text>
<text x="566.6" y="341" text-anchor="end" class="viz-label">reported privately</text>
<line x1="586.4" y1="353" x2="586.4" y2="283" class="viz-grid"/>
<text x="581.4" y="294" text-anchor="end" class="viz-tick">29 Mar</text>
<text x="581.4" y="309" text-anchor="end" class="viz-label">public disclosure</text>
<circle cx="68.4" cy="358" r="4.5" class="viz-d4"/>
<circle cx="83.2" cy="358" r="4.5" class="viz-d4"/>
<circle cx="112.8" cy="358" r="4.5" class="viz-d4"/>
<circle cx="290.4" cy="358" r="4.5" class="viz-d4"/>
<circle cx="527.2" cy="358" r="4.5" class="viz-d4"/>
<circle cx="556.8" cy="358" r="4.5" class="viz-d4"/>
<circle cx="571.6" cy="358" r="4.5" class="viz-d3"/>
<circle cx="586.4" cy="358" r="4.5" class="viz-d3"/>
<text x="0" y="478" class="viz-label-muted">Linear in days: top axis 913 days, bottom 40 days, so a day below is about 23 times wider.</text>
</svg>
<figcaption>Source: dates from Russ Cox's <a href="https://web.archive.org/web/20240512051254/https://research.swtch.com/xz-timeline">timeline of the xz attack</a>, posted on 1 April 2024 and updated on 3 April 2024.</figcaption>
</figure>

## Found by a stopwatch

It was not found by reading code. Freund was chasing "logins with ssh taking a lot of CPU, valgrind errors" on Debian sid; a failed login took 0.807 seconds instead of 0.299, and the slow step, he wrote, appeared to be the backdoor parsing symbol tables in memory. The damage was contained because the versions were new, and had "not yet widely been integrated by linux distributions, and where they have, mostly in pre-release versions." [Debian's advisory](https://lists.debian.org/debian-security-announce/2024/msg00057.html) lists its testing, unstable and experimental distributions, and [Red Hat's alert](https://web.archive.org/web/20240513100950/https://www.redhat.com/en/blog/urgent-security-alert-fedora-41-and-rawhide-users) lists Fedora 40 beta and Rawhide. The [NVD entry for CVE-2024-3094](https://web.archive.org/web/20240513055518/https://nvd.nist.gov/vuln/detail/CVE-2024-3094) carries a CVSS base score of 10.0.

## The rule

It has three parts, one for each gap.

Build from the tag. Fetch the source at the release tag and run the project's own bootstrap, autoreconf or autogen.sh, so every generated file comes from tools you installed, not from the maintainer's machine. [Arch Linux did exactly this](https://web.archive.org/web/20240330102951/https://gitlab.archlinux.org/archlinux/packaging/packages/xz/-/commit/881385757abdc39d3cfea1c3e34ec09f637424ad.patch) for xz on 28 March 2024, the day Freund privately warned distributions and the day before the public disclosure: its package switched from the tarball and signature to the git tag v5.6.1 and carried the message "improve reproducibility by running autogen.sh ourselves". That does not remove the payload, which was in git, but it leaves the payload inert, because the trigger never was.

Diff the tarball against the tag, and make the diff explain itself. A bare list of the files that exist only in the tarball would have shown build-to-host.m4 as one more macro added at packaging, which is Cox's point. The check that catches it is regenerating those files from the tag with the maintainer's tool versions, which the files record, and comparing contents, so a macro claiming to be the standard copy is compared with the standard copy.

Treat test fixtures and generated files as code. If the build can read a file, it is an input to the build, whatever directory it sits in. Freund wrote that the two files "were not even used for any 'tests' in 5.6.0", but make check fed every good-* and bad-* file to xz [by glob](https://web.archive.org/web/20240509020630/https://tukaani.org/xz-backdoor/review.html), and 5.6.1 added a test aimed at one of them, so a rule that every fixture be tested would have passed both. Two checks would not have: a fixture described as generated must ship its generator, and a traced build that opens anything in tests/files/ outside make check fails. The README in tests/files said many of its files were made by hand, with no better source code "than the files themselves", which is exactly what an attacker wants in a hiding place.

## What the rule does not fix

Building from the tag makes what runs the same as what can be read. It does not make anyone read it. The payload sat in git for five weeks, and an attacker with commit access can put a trigger in git too, dressed as plausibly as a version bump. What the rule changes is where that attacker has to work: every step becomes a public commit that anyone can diff and bisect, not a file that existed only on a release page. That is a smaller hiding place, and the only one review was ever going to cover.

"The code is open" is a statement about a repository. A build consumes whatever it is handed. The two are the same only when the builder makes them the same, and in March 2024 both Debian and Arch were building xz from the tarball.
