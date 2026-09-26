// "Rewrite to sound human" with the visitor's own API key, called straight from the browser.
// Mirrors src/llm in https://github.com/shayanmohd/deAIfy. Nothing here goes through mohdshayan.com.

export const REWRITE_SYSTEM_PROMPT = `You rewrite text so it reads as if written by a thoughtful human, not an AI.

Rules:
1. Preserve meaning, facts, names, numbers, and the original language. Add no new information and remove no information.
2. Remove AI tells: stock transitions (moreover, furthermore, in conclusion), hedging meta-commentary (it's important to note), inflated buzzwords (delve, tapestry, leverage), and mechanical parallelism.
3. Vary sentence length and rhythm. Prefer plain, direct words over ornate ones.
4. Use straight quotes and regular hyphens, not curly quotes or em dashes.
5. Preserve all Markdown structure and NEVER alter content inside code spans or fenced code blocks.
6. Keep roughly the same length unless brevity clearly helps.

Return ONLY the rewritten text. No preamble, no explanation, no surrounding quotes.`;

export const PROVIDERS = {
  anthropic: {
    label: 'Anthropic Claude',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    defaultModel: 'claude-opus-5',
    models: [
      ['claude-opus-5', 'Claude Opus 5 (best quality, default)'],
      ['claude-sonnet-5', 'Claude Sonnet 5 (balanced)'],
      ['claude-haiku-4-5', 'Claude Haiku 4.5 (fastest, cheapest)'],
    ],
  },
  openai: {
    label: 'OpenAI GPT',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    defaultModel: 'gpt-4o-mini',
    models: [
      ['gpt-4o-mini', 'GPT-4o mini (cheap, default)'],
      ['gpt-4o', 'GPT-4o (balanced)'],
      ['gpt-4.1', 'GPT-4.1 (max quality)'],
    ],
  },
};

export class RewriteError extends Error {
  constructor(message, status) { super(message); this.name = 'RewriteError'; this.status = status; }
}

// Models that support Anthropic's server-side refusal fallback: a declined request is retried on the
// model Anthropic recommends for that refusal category instead of failing outright.
const FALLBACK_MODELS = new Set(['claude-opus-5', 'claude-fable-5-1']);

const redact = (message, key) => (key ? String(message).split(key).join('[your key]') : String(message));

function describeStatus(status, provider) {
  if (status === 401) return 'The key was rejected. Check that it is correct and still active.';
  if (status === 403) return 'This key is not allowed to use that model.';
  if (status === 404) return 'That model was not found. Check the model ID.';
  if (status === 429) return `${provider} is rate limiting this key. Wait a moment and try again.`;
  if (status >= 500) return `${provider} had a server error. Try again shortly.`;
  return '';
}
async function errorDetail(res) {
  try { const j = await res.json(); return (j.error && (j.error.message || j.error.type)) || ''; } catch { return ''; }
}

/** Returns { text, truncated }. Throws RewriteError with a readable, key-free message. */
export async function rewrite({ provider, model, apiKey, input, signal }) {
  const key = apiKey.trim();
  if (!key) throw new RewriteError('Add an API key first.');
  if (!input.trim()) throw new RewriteError('There is no text to rewrite.');
  try {
    return provider === 'openai' ? await callOpenAI(model, key, input, signal) : await callAnthropic(model, key, input, signal);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    if (e instanceof RewriteError) throw new RewriteError(redact(e.message, key), e.status);
    throw new RewriteError(`Could not reach the provider. Check your connection and try again. (${redact(e.message, key)})`);
  }
}

async function callAnthropic(model, key, input, signal) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    // Required for calls made directly from a browser (CORS); the key belongs to the visitor.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  const body = { model, max_tokens: 16000, system: REWRITE_SYSTEM_PROMPT, messages: [{ role: 'user', content: input }] };
  if (FALLBACK_MODELS.has(model)) {
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    body.fallbacks = 'default';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body), signal });
  if (!res.ok) {
    const detail = await errorDetail(res);
    throw new RewriteError(describeStatus(res.status, 'Anthropic') || `Anthropic returned an error (${res.status})${detail ? `: ${detail}` : '.'}`, res.status);
  }
  const json = await res.json();
  if (json.stop_reason === 'refusal') throw new RewriteError('The model declined to rewrite this text.');
  const text = (json.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!text) throw new RewriteError('The model returned no text.');
  return { text, truncated: json.stop_reason === 'max_tokens' };
}

async function callOpenAI(model, key, input, signal) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: REWRITE_SYSTEM_PROMPT }, { role: 'user', content: input }] }),
  });
  if (!res.ok) {
    const detail = await errorDetail(res);
    throw new RewriteError(describeStatus(res.status, 'OpenAI') || `OpenAI returned an error (${res.status})${detail ? `: ${detail}` : '.'}`, res.status);
  }
  const json = await res.json();
  const choice = json.choices && json.choices[0];
  const text = choice && choice.message && typeof choice.message.content === 'string' ? choice.message.content.trim() : '';
  if (choice && choice.message && choice.message.refusal) throw new RewriteError('The model declined to rewrite this text.');
  if (!text) throw new RewriteError('The model returned no text.');
  return { text, truncated: choice.finish_reason === 'length' };
}
