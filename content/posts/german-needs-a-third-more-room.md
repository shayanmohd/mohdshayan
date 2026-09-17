---
title: German needs a third more room
date: 2026-09-18
summary: Translating an app into nine languages is a layout problem before it is a language problem. Short labels grow by a third or more and plurals go from two forms to six.
tags: Localisation, Android, UX
draft: false
---

Habits ships in nine languages, and the work that made that survive was not in the translation files. It was in the layout. A label that fits in English will not fit in German, a sentence with a count in it has two forms in English and six in Arabic, and a screen designed left to right mirrors when the script runs the other way. Every one of those is a layout decision that has to be made before the first translator sees a string, and the tool that makes the decisions stick is an allowance, measured in the longest locale rather than in English, with a screenshot test that fails in that locale rather than the one the developer reads.

## How much longer the words get

The expansion is not a guess; it has been measured for decades. The W3C's [guidance on text size in translation](https://www.w3.org/International/articles/article-text-size) reproduces the figures IBM published for translation from English into European languages, and they are worse for short strings than for long ones: text of up to ten characters should be expected to grow to between 200 and 300 percent of its English length, 11 to 20 characters to 180 to 200 percent, 21 to 30 to 160 to 180, 31 to 50 to 140 to 160, and only text over 70 characters settles at around 130 percent. The labels on buttons, tabs and settings rows are the short strings, and they are the ones that grow most.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Expected text expansion from English by source string length</title>
<desc id="f1-d">Horizontal range bars in percent of the English length: up to 10 characters, 200 to 300; 11 to 20, 180 to 200; 21 to 30, 160 to 180; 31 to 50, 140 to 160; 51 to 70, 151 to 170; over 70, about 130. The shortest strings expand the most.</desc>
<text x="0" y="18" class="viz-title">The shorter the label, the more room it needs</text>
<text x="0" y="36" class="viz-sub">Expected translated length as a percent of English, by English string length in characters</text>
<line x1="176" y1="52" x2="176" y2="256" class="viz-axis"/>
<text x="176" y="278" text-anchor="middle" class="viz-tick">100%</text>
<text x="388" y="278" text-anchor="middle" class="viz-tick">200%</text>
<text x="600" y="278" text-anchor="middle" class="viz-tick">300%</text>
<text x="166" y="73" text-anchor="end" class="viz-label">up to 10 characters</text>
<rect x="388" y="62" width="212" height="12" rx="4" class="viz-f1"/><text x="380" y="73" text-anchor="end" class="viz-value">200</text><text x="596" y="57" text-anchor="end" class="viz-value">300</text>
<text x="166" y="107" text-anchor="end" class="viz-label">11 to 20</text>
<rect x="346" y="96" width="42" height="12" rx="4" class="viz-f1"/><text x="338" y="107" text-anchor="end" class="viz-value">180</text><text x="396" y="107" class="viz-value">200</text>
<text x="166" y="141" text-anchor="end" class="viz-label">21 to 30</text>
<rect x="303" y="130" width="43" height="12" rx="4" class="viz-f1"/><text x="295" y="141" text-anchor="end" class="viz-value">160</text><text x="354" y="141" class="viz-value">180</text>
<text x="166" y="175" text-anchor="end" class="viz-label">31 to 50</text>
<rect x="261" y="164" width="42" height="12" rx="4" class="viz-fgray"/><text x="253" y="175" text-anchor="end" class="viz-value">140</text><text x="311" y="175" class="viz-value">160</text>
<text x="166" y="209" text-anchor="end" class="viz-label">51 to 70</text>
<rect x="284" y="198" width="40" height="12" rx="4" class="viz-fgray"/><text x="276" y="209" text-anchor="end" class="viz-value">151</text><text x="332" y="209" class="viz-value">170</text>
<text x="166" y="243" text-anchor="end" class="viz-label">over 70</text>
<rect x="240" y="232" width="4" height="12" rx="2" class="viz-fgray"/><text x="252" y="243" class="viz-value">about 130</text>
<rect x="0" y="288" width="12" height="12" rx="3" class="viz-f1"/><text x="18" y="299" class="viz-label-muted">button and label lengths</text>
<rect x="200" y="288" width="12" height="12" rx="3" class="viz-fgray"/><text x="218" y="299" class="viz-label-muted">sentence lengths</text>
</svg>
<figcaption>Source: the IBM figures as reproduced in the W3C's <a href="https://www.w3.org/International/articles/article-text-size">Text size in translation</a> article; ranges are drawn as published.</figcaption>
</figure>

The title of this post undersells it. A third more is what a paragraph needs. A four-letter button label can need three times its width, and a settings row that was designed with the English label snug against its toggle will push the toggle off the screen in German, wrap onto two lines in French, and truncate with an ellipsis in Finnish, all in the same release, all invisible to a developer running the app in English.

## Plurals are not two forms

The second surprise is grammatical. English has two plural forms, one item and everything else, and code written in English tends to encode that as a conditional: if the count is one, say this, otherwise say that. Unicode's [CLDR plural rules](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html) define the categories each language actually needs, and two is the exception, not the rule.

Japanese and Chinese have one form. English, German, Hindi and Turkish have two. French, Spanish and Portuguese have three, with a separate form for large round numbers. Russian, Polish and Czech have four. Irish has five. Arabic and Welsh have six, with distinct forms for zero, one, two, few, many and other.

<figure class="chart">
<svg viewBox="0 0 640 400" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">Number of cardinal plural categories by language, from CLDR</title>
<desc id="f2-d">Horizontal bars: Arabic 6, Welsh 6, Irish 5, Russian 4, Polish 4, Czech 4, French 3, Spanish 3, Portuguese 3, English 2, German 2, Hindi 2, Turkish 2, Japanese 1, Chinese 1. English is highlighted to show where a two-form assumption comes from.</desc>
<text x="0" y="18" class="viz-title">Two forms is an English assumption</text>
<text x="0" y="36" class="viz-sub">Cardinal plural categories a language needs, per CLDR</text>
<line x1="116" y1="52" x2="116" y2="374" class="viz-axis"/>
<text x="106" y="70" text-anchor="end" class="viz-label">Arabic</text><path d="M116 58 H536 a4 4 0 0 1 4 4 V68 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="556" y="70" class="viz-value">6</text>
<text x="106" y="92" text-anchor="end" class="viz-label">Welsh</text><path d="M116 80 H536 a4 4 0 0 1 4 4 V90 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="556" y="92" class="viz-value">6</text>
<text x="106" y="114" text-anchor="end" class="viz-label">Irish</text><path d="M116 102 H466 a4 4 0 0 1 4 4 V112 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="486" y="114" class="viz-value">5</text>
<text x="106" y="136" text-anchor="end" class="viz-label">Russian</text><path d="M116 124 H396 a4 4 0 0 1 4 4 V134 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="416" y="136" class="viz-value">4</text>
<text x="106" y="158" text-anchor="end" class="viz-label">Polish</text><path d="M116 146 H396 a4 4 0 0 1 4 4 V156 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="416" y="158" class="viz-value">4</text>
<text x="106" y="180" text-anchor="end" class="viz-label">Czech</text><path d="M116 168 H396 a4 4 0 0 1 4 4 V178 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="416" y="180" class="viz-value">4</text>
<text x="106" y="202" text-anchor="end" class="viz-label">French</text><path d="M116 190 H326 a4 4 0 0 1 4 4 V200 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="346" y="202" class="viz-value">3</text>
<text x="106" y="224" text-anchor="end" class="viz-label">Spanish</text><path d="M116 212 H326 a4 4 0 0 1 4 4 V222 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="346" y="224" class="viz-value">3</text>
<text x="106" y="246" text-anchor="end" class="viz-label">Portuguese</text><path d="M116 234 H326 a4 4 0 0 1 4 4 V244 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="346" y="246" class="viz-value">3</text>
<text x="106" y="268" text-anchor="end" class="viz-label">English</text><path d="M116 256 H256 a4 4 0 0 1 4 4 V266 a4 4 0 0 1 -4 4 H116 Z" class="viz-f1"/><text x="276" y="268" class="viz-value">2</text>
<text x="106" y="290" text-anchor="end" class="viz-label">German</text><path d="M116 278 H256 a4 4 0 0 1 4 4 V288 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="276" y="290" class="viz-value">2</text>
<text x="106" y="312" text-anchor="end" class="viz-label">Hindi</text><path d="M116 300 H256 a4 4 0 0 1 4 4 V310 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="276" y="312" class="viz-value">2</text>
<text x="106" y="334" text-anchor="end" class="viz-label">Turkish</text><path d="M116 322 H256 a4 4 0 0 1 4 4 V332 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="276" y="334" class="viz-value">2</text>
<text x="106" y="356" text-anchor="end" class="viz-label">Japanese</text><path d="M116 344 H186 a4 4 0 0 1 4 4 V354 a4 4 0 0 1 -4 4 H116 Z" class="viz-fgray"/><text x="206" y="356" class="viz-value">1</text>
<text x="0" y="392" class="viz-label-muted">A string with a count needs as many variants as the target language's row says.</text>
</svg>
<figcaption>Source: <a href="https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html">Unicode CLDR language plural rules</a>, cardinal categories, as published in the latest chart.</figcaption>
</figure>

The practical consequence is that a count never goes into a string by concatenation. It goes through the platform's plural resource, which asks CLDR which category the number falls in for the current locale and picks the translator's form for that category. On Android that is the plurals resource type, and the discipline is that the English file declares only the two forms English needs while the Russian file declares four and the Arabic file six, and the code never knows. The temptation to special-case "1" in code is the bug; the fix is that the code has no opinion about how many forms there are.

## The expansion allowance

Knowing the numbers is the easy half. The rule that turns them into a shipped app is the expansion allowance: every label is designed at the width of its longest translation plus a margin, not at the width of its English, and the screenshot test that guards the layout runs in the longest locale rather than in English. Concretely, for each screen, the build renders it in every supported locale, finds the locale whose strings are widest for that screen, and that locale becomes the one whose screenshot is compared against the reference. A layout change that breaks German fails the build in German, before anyone who reads German has seen it.

<figure class="chart">
<svg viewBox="0 0 640 280" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">One settings row at English width and at the longest-locale width, with the allowance marked</title>
<desc id="f3-d">Two rows drawn as settings entries with a label on the left and a toggle on the right. In the first, the English label is short and the row has empty space beside it. In the second, the German label is much longer; the allowance is drawn as a bracket showing the space reserved beyond the English width, and the toggle stays in place. A note says the row is designed at the second width.</desc>
<text x="0" y="18" class="viz-title">Design the row for the second label, not the first</text>
<text x="8" y="56" class="viz-tick">ENGLISH</text>
<rect x="8" y="64" width="624" height="52" rx="8" class="viz-box"/>
<text x="28" y="95" class="viz-label">Remind me daily</text>
<rect x="570" y="80" width="44" height="20" rx="10" class="viz-f1"/>
<text x="8" y="150" class="viz-tick">GERMAN, THE LONGEST LOCALE FOR THIS ROW</text>
<rect x="8" y="158" width="624" height="52" rx="8" class="viz-box-accent"/>
<text x="28" y="189" class="viz-label">Täglich an meine Gewohnheiten erinnern</text>
<rect x="570" y="174" width="44" height="20" rx="10" class="viz-f1"/>
<line x1="152" y1="222" x2="380" y2="222" class="viz-s4"/>
<line x1="152" y1="216" x2="152" y2="228" class="viz-s4"/>
<line x1="380" y1="216" x2="380" y2="228" class="viz-s4"/>
<text x="266" y="246" text-anchor="middle" class="viz-label-muted">the allowance: reserved beyond the English width; the toggle never moves</text>
<rect x="8" y="256" width="12" height="12" rx="3" class="viz-f1"/><text x="26" y="267" class="viz-label-muted">toggle, fixed position</text>
<line x1="200" y1="262" x2="214" y2="262" class="viz-s4"/><text x="220" y="267" class="viz-label-muted">the allowance</text>
</svg>
<figcaption>Illustrative: a settings row as designed with the allowance; the German string is a plausible translation, not the app's actual one.</figcaption>
</figure>

The allowance has consequences that ripple through the design. Labels that would wrap in the longest locale are shortened in every locale, or the row is given two lines from the start, so that the English version does not look different from the German one in a way that would surprise a user switching languages. Icons with text beside them are laid out so that the text can grow without the icon moving. Toolbars with several actions are designed with the longest locale's labels, which usually means fewer actions per toolbar than an English-only design would allow. None of that is visible in English, and all of it is why the German user sees an app that looks designed rather than translated.

The test itself is worth describing, because it is the part that keeps the allowance honest after launch. Every screen has a reference screenshot per locale, and the build renders each screen in each locale on a fixed device profile and compares. The comparison that gates the merge is the one in the longest locale for that screen, which the build computes rather than a person remembering; the other locales are compared too, but a difference in them is a warning, because a change that fits the longest locale fits the rest. The test catches the two failures that matter, a label that now wraps or truncates and a control that has moved, and it catches them in the language where they happen rather than in the one the developer reads.

## Mirroring is the third problem

Right-to-left scripts add a third dimension that no width allowance covers. In Arabic, Hebrew, Persian and Urdu the reading direction reverses, and with it the layout: leading edges become trailing, back arrows point the other way, progress bars fill from the right, and a horizontal list scrolls in the opposite direction. On Android, the platform mirrors a layout automatically if the layout was written in terms of start and end rather than left and right, and Compose's layout primitives follow the same rule; the work is to never write "left" or "right" in a layout, and to check that icons which imply direction, an arrow, a back chevron, a "next" glyph, are marked to mirror while icons that do not, a clock, a checkmark, are not. The screenshot test in a right-to-left locale is the only reliable way to find the one that was missed, and it belongs in the same build as the width test.

## Why the layout is where the work lives

The translation file is where people expect localisation to live, and it is the smallest part. The nine languages in Habits are nine files, and the files are maintained by people who know the languages better than I do. What those people cannot do is fix a layout that was designed for English and asked to hold their words. The expansion allowance, the plural resource and the start-and-end discipline are the three decisions that make their work fit, they are made by the person who builds the screens, and they are made once, at design time, for every language the app will ever add. The build that fails in German is how you know the decisions held.
