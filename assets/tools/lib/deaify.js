// deAIfy text-cleaning engine: a dependency-free port of the pure core in
// https://github.com/shayanmohd/deAIfy (src/deaify). Keep the two in step when rules change.
// Refinements over the app: "a myriad of" / "a plethora of" soften as phrases, a mid-sentence deletion that is
// followed by more words keeps the comma before it, and phrases match curly apostrophes too.
// Pipeline: protectCode → spaces → quotes → dashes → filler words. No DOM access, so it runs in Node tests too.

/** @typedef {'dash'|'quote'|'space'|'filler'} ChangeType */
/** @typedef {{type: ChangeType, start: number, end: number, original: string, replacement: string, severity: 'auto'|'flag', note?: string}} Change */

export const DEFAULT_OPTIONS = { dashes: 'spacedHyphen', quotes: true, spaces: true, fillerWords: 'flag', protectCode: true };

// Single source of truth for AI "tell" words and phrases. soften: null deletes the phrase and repairs punctuation.
export const FILLER_WORDS = [
  // Inflated buzzwords
  { match: 'delve', soften: 'look', category: 'buzzword' },
  { match: 'delving', soften: 'looking', category: 'buzzword' },
  { match: 'tapestry', soften: 'mix', category: 'buzzword' },
  { match: 'leverage', soften: 'use', category: 'buzzword' },
  { match: 'leveraging', soften: 'using', category: 'buzzword' },
  { match: 'utilize', soften: 'use', category: 'buzzword' },
  { match: 'utilizing', soften: 'using', category: 'buzzword' },
  { match: 'realm', soften: 'area', category: 'buzzword' },
  { match: 'showcase', soften: 'show', category: 'buzzword' },
  { match: 'seamless', soften: 'smooth', category: 'buzzword' },
  { match: 'seamlessly', soften: 'smoothly', category: 'buzzword' },
  { match: 'robust', soften: 'strong', category: 'buzzword' },
  { match: 'myriad', soften: 'many', category: 'buzzword' },
  { match: 'plethora', soften: 'plenty', category: 'buzzword' },
  { match: 'a myriad of', soften: 'many', category: 'buzzword' },
  { match: 'a plethora of', soften: 'plenty of', category: 'buzzword' },
  // Stock transitions
  { match: 'moreover', soften: null, category: 'transition' },
  { match: 'furthermore', soften: null, category: 'transition' },
  { match: 'additionally', soften: null, category: 'transition' },
  { match: 'consequently', soften: 'so', category: 'transition' },
  { match: 'nevertheless', soften: 'still', category: 'transition' },
  { match: 'notwithstanding', soften: null, category: 'transition' },
  // Hedges
  { match: 'arguably', soften: null, category: 'hedge' },
  { match: 'notably', soften: null, category: 'hedge' },
  { match: 'importantly', soften: null, category: 'hedge' },
  // Meta-commentary (multi-word, matched before single words by length)
  { match: "it's important to note that", soften: null, category: 'meta' },
  { match: 'it is important to note that', soften: null, category: 'meta' },
  { match: "it's important to note", soften: null, category: 'meta' },
  { match: 'it is worth noting that', soften: null, category: 'meta' },
  { match: 'in conclusion', soften: null, category: 'meta' },
  { match: 'in summary', soften: null, category: 'meta' },
  { match: 'at the end of the day', soften: null, category: 'meta' },
  { match: 'when it comes to', soften: null, category: 'meta' },
];

// ---------- shared regex runner ----------
function applyRegex(input, regex, type, replacer, note) {
  const changes = [];
  let out = '';
  let last = 0;
  const re = regex.global ? regex : new RegExp(regex.source, regex.flags + 'g');
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(input)) !== null) {
    const original = m[0];
    if (original.length === 0) { re.lastIndex++; continue; }
    const replacement = replacer(m);
    out += input.slice(last, m.index) + replacement;
    last = m.index + original.length;
    changes.push({ type, start: m.index, end: last, original, replacement, severity: 'auto', note });
  }
  return { text: out + input.slice(last), changes };
}
const toClass = codes => new RegExp('[' + codes.map(c => '\\u' + c.toString(16).padStart(4, '0')).join('') + ']', 'g');

// ---------- protect code and links ----------
// Fenced blocks, inline code and bare URLs are swapped for Private-Use-Area placeholders before the
// destructive passes and restored afterwards, so quotes and dashes inside them are never touched.
const OPEN = '';
const CLOSE = '';
const PROTECT = [/```[\s\S]*?```/g, /`[^`\n]+`/g, /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi];

export function maskCode(input) {
  const tokens = [];
  let masked = input.replace(new RegExp(`[${OPEN}${CLOSE}]`, 'g'), '');
  for (const pattern of PROTECT) {
    masked = masked.replace(pattern, m => { const token = `${OPEN}${tokens.length}${CLOSE}`; tokens.push(m); return token; });
  }
  return { masked, tokens };
}
export function restoreCode(text, tokens) {
  if (!tokens.length) return text;
  return text.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (m, i) => tokens[Number(i)] ?? m);
}

// ---------- spaces ----------
const ZERO_WIDTH = toClass([0x200b, 0x200c, 0x200d, 0x2060, 0xfeff, 0x00ad, 0x200e, 0x200f]);
const WEIRD_SPACE = toClass([0x00a0, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000]);
export function transformSpaces(input) {
  const zw = applyRegex(input, ZERO_WIDTH, 'space', () => '', 'removed hidden character');
  const sp = applyRegex(zw.text, WEIRD_SPACE, 'space', () => ' ', 'normalised space');
  return { text: sp.text, changes: [...zw.changes, ...sp.changes] };
}

// ---------- quotes ----------
const DOUBLE = toClass([0x201c, 0x201d, 0x201e, 0x201f, 0x00ab, 0x00bb]);
const SINGLE = toClass([0x2018, 0x2019, 0x201a, 0x201b, 0x2039, 0x203a, 0x2032]);
export function transformQuotes(input) {
  const d = applyRegex(input, DOUBLE, 'quote', () => '"', 'straightened quote');
  const s = applyRegex(d.text, SINGLE, 'quote', () => "'", 'straightened apostrophe');
  return { text: s.text, changes: [...d.changes, ...s.changes] };
}

// ---------- dashes ----------
// Figure, en and em dashes and the horizontal bar. Surrounding spaces and tabs (not newlines) are absorbed
// so "A — B", "A—B" and "A —B" normalise the same way, and a dash that opens a line stays on that line.
const DASH = /[ \t]*[‒–—―]+[ \t]*/g;
export function transformDashes(input, style) {
  if (style === 'off') return { text: input, changes: [] };
  const replacement = style === 'comma' ? ', ' : style === 'spacedHyphen' ? ' - ' : '-';
  return applyRegex(input, DASH, 'dash', () => replacement, `dash → ${style === 'comma' ? 'comma' : style === 'spacedHyphen' ? 'spaced hyphen' : 'hyphen'}`);
}

// ---------- filler words ----------
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const applyCase = (replacement, original) => (/^[A-Z]/.test(original) && replacement.length ? replacement[0].toUpperCase() + replacement.slice(1) : replacement);
const atSentenceStart = (text, index) => {
  const before = text.slice(0, index).replace(/[ \t]+$/, '');
  return before.length === 0 || /[.!?\n]$/.test(before);
};
function buildRegex(entry) {
  const body = escapeRe(entry.match).replace(/'/g, "['’]");
  return new RegExp(entry.wholeWord === false ? body : `\\b${body}\\b`, 'gi');
}
// Repairs spacing and punctuation left by deletions, then recapitalises sentence starts (never after a bare newline).
function healPunctuation(s) {
  return s
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/,[ \t]*,/g, ',')
    .replace(/,[ \t]*([.;:!?])/g, '$1')
    .replace(/([.!?])[ \t]*[,;:]/g, '$1')
    .replace(/(^|\n)[ \t]*[,;:][ \t]*/g, '$1')
    .replace(/(^|[.!?]["')\]]?[ \t\n]+)([a-z])/g, (_m, p, c) => p + c.toUpperCase())
    .replace(/[ \t]+$/gm, '')
    .trim();
}
export function transformFillerWords(input, mode, list = FILLER_WORDS) {
  if (mode === 'off') return { text: input, changes: [] };
  const entries = [...list].sort((a, b) => b.match.length - a.match.length);
  const changes = [];
  let text = input;
  let deletedAny = false;
  for (const entry of entries) {
    const re = buildRegex(entry);
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const original = m[0];
      if (!original.length) { re.lastIndex++; continue; }
      const ms = m.index;
      const me = ms + original.length;
      if (mode === 'flag') {
        out += text.slice(last, me);
        changes.push({ type: 'filler', start: ms, end: me, original, replacement: original, severity: 'flag', note: entry.category });
        last = me;
        continue;
      }
      if (entry.soften !== null) {
        const replacement = applyCase(entry.soften, original);
        out += text.slice(last, ms) + replacement;
        changes.push({ type: 'filler', start: ms, end: me, original, replacement, severity: 'auto', note: entry.category });
        last = me;
        continue;
      }
      // Delete, choosing the span from context: an opener takes its following punctuation,
      // a mid-sentence phrase takes the comma before it so trailing punctuation survives.
      let cutStart = ms;
      let cutEnd = me;
      if (atSentenceStart(text, ms)) {
        const a = /^[ \t]*(?:,|[.;:!?]+)?[ \t]*/.exec(text.slice(me));
        cutEnd = me + (a ? a[0].length : 0);
      } else {
        // Before punctuation or the end, the phrase takes the comma before it ("works, moreover." → "works.").
        // Before more words it takes the spaces after it, so "landscape, it is worth noting that clear" keeps its comma.
        const pre = /[ \t]*,[ \t]*$/.exec(text.slice(0, ms));
        const wordFollows = /^[ \t]+[\p{L}\p{N}]/u.test(text.slice(me));
        if (pre && ms - pre[0].length >= last && !wordFollows) cutStart = ms - pre[0].length;
        else { const a = /^[ \t]*,?[ \t]*/.exec(text.slice(me)); cutEnd = me + (a ? a[0].length : 0); }
      }
      out += text.slice(last, cutStart);
      changes.push({ type: 'filler', start: cutStart, end: cutEnd, original: text.slice(cutStart, cutEnd), replacement: '', severity: 'auto', note: entry.category });
      last = cutEnd;
      deletedAny = true;
      re.lastIndex = cutEnd; // never re-enter the consumed region
    }
    text = out + text.slice(last);
  }
  if (deletedAny) text = healPunctuation(text);
  return { text, changes };
}

// ---------- pipeline ----------
export function deaify(input, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const changes = [];
  const { masked, tokens } = opts.protectCode ? maskCode(input) : { masked: input, tokens: [] };
  let text = masked;
  const run = r => { text = r.text; changes.push(...r.changes); };
  if (opts.spaces) run(transformSpaces(text));
  if (opts.quotes) run(transformQuotes(text));
  if (opts.dashes !== 'off') run(transformDashes(text, opts.dashes));
  // Flags are located on the masked text, so their offsets are only meaningful without code placeholders;
  // the UI re-finds flagged phrases in the final text instead of trusting offsets.
  if (opts.fillerWords !== 'off') run(transformFillerWords(text, opts.fillerWords, options.fillerList));
  text = opts.protectCode ? restoreCode(text, tokens) : text;
  const counts = { dash: 0, quote: 0, space: 0, filler: 0 };
  for (const c of changes) counts[c.type] += 1;
  return { text, changes, counts };
}

/** Finds every filler phrase in `text` (after cleanup) for highlighting, skipping protected code and links. */
export function findFlags(text, list = FILLER_WORDS) {
  const { masked, tokens } = maskCode(text);
  if (tokens.length) {
    // Work on a copy where placeholders are padded back to their original length, so offsets map onto `text`.
    let padded = '';
    let i = 0;
    masked.replace(new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'), (m, n, at) => { padded += masked.slice(i, at) + '\u0000'.repeat(tokens[Number(n)].length); i = at + m.length; return m; });
    padded += masked.slice(i);
    if (padded.length === text.length) return scanFlags(padded, list);
  }
  return scanFlags(text, list);
}
function scanFlags(text, list) {
  const hits = [];
  for (const entry of [...list].sort((a, b) => b.match.length - a.match.length)) {
    const re = buildRegex(entry);
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index, end = start + m[0].length;
      if (!hits.some(h => start < h.end && end > h.start)) hits.push({ start, end, category: entry.category });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

// ---------- word diff (Myers O(ND)) ----------
const TOKEN = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu; // apostrophes are tokens of their own, so a quote fix marks one character
export const tokenize = s => s.match(TOKEN) || [];

/**
 * Diffs two texts at word level. Returns [{value, added?, removed?}] segments, merging runs of the same kind.
 * Cleanup edits are local and keep line breaks, so when both texts have the same number of lines each line is
 * diffed on its own, which keeps long documents fast. Returns null when the texts are too different to diff quickly.
 */
export function diffTexts(a, b, maxCost = 3000) {
  const la = a.split('\n'), lb = b.split('\n');
  const out = [];
  if (la.length > 1 && la.length === lb.length) {
    for (let i = 0; i < la.length; i++) {
      if (i) pushSeg(out, '\n', 'eq');
      const segs = la[i] === lb[i] ? [{ value: la[i] }] : diffTokens(la[i], lb[i], maxCost);
      if (!segs) return null;
      for (const seg of segs) pushSeg(out, seg.value, seg.added ? 'add' : seg.removed ? 'del' : 'eq');
    }
    return out;
  }
  return diffTokens(a, b, maxCost);
}
function pushSeg(segs, value, kind) {
  if (!value) return;
  const last = segs[segs.length - 1];
  if (last && Boolean(last.added) === (kind === 'add') && Boolean(last.removed) === (kind === 'del')) last.value += value;
  else segs.push(kind === 'add' ? { value, added: true } : kind === 'del' ? { value, removed: true } : { value });
}
function diffTokens(a, b, maxCost) {
  const A = tokenize(a), B = tokenize(b);
  // Trim the common prefix and suffix first; the edit script only has to cover the middle.
  let pre = 0;
  while (pre < A.length && pre < B.length && A[pre] === B[pre]) pre++;
  let suf = 0;
  while (suf < A.length - pre && suf < B.length - pre && A[A.length - 1 - suf] === B[B.length - 1 - suf]) suf++;
  const mid = myers(A.slice(pre, A.length - suf), B.slice(pre, B.length - suf), maxCost);
  if (!mid) return null;
  const segs = [];
  pushSeg(segs, A.slice(0, pre).join(''), 'eq');
  for (const [kind, tok] of mid) pushSeg(segs, tok, kind);
  pushSeg(segs, A.slice(A.length - suf).join(''), 'eq');
  return segs;
}
// Myers' O(ND) shortest edit script. trace[d] keeps only diagonals -d-1..d+1 of the frontier, so memory is O(D²).
function myers(a, b, maxCost) {
  const n = a.length, m = b.length;
  if (n + m === 0) return [];
  const offset = n + m + 1;
  const v = new Int32Array(2 * (n + m) + 3);
  const trace = [];
  for (let d = 0; d <= n + m; d++) {
    if (d > maxCost) return null;
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, a, b, d);
    }
  }
  return null;
}
function backtrack(trace, a, b, dEnd) {
  const ops = [];
  let x = a.length, y = b.length;
  for (let d = dEnd; d > 0; d--) {
    const w = trace[d]; // w[k + d + 1] is the furthest x on diagonal k before step d
    const at = k => w[k + d + 1];
    const k = x - y;
    const prevK = (k === -d || (k !== d && at(k - 1) < at(k + 1))) ? k + 1 : k - 1;
    const prevX = at(prevK), prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push(['eq', a[x - 1]]); x--; y--; }
    if (x === prevX) ops.push(['add', b[y - 1]]); else ops.push(['del', a[x - 1]]);
    x = prevX; y = prevY;
  }
  while (x > 0 && y > 0) { ops.push(['eq', a[x - 1]]); x--; y--; }
  return ops.reverse();
}
