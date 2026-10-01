// erised Pages Function: POST /erised/api/llm
// Hosted-mode gate for the erised mirror — beta-tested 2026-10-01 (wave-64):
// static deploy alone returned empty JSON; this function proxies to deepinfra
// with the key server-side, whitelisted model, tight caps, per-IP rate limit.
//
// env.DEEPINFRA_KEY — set via: wrangler pages secret put DEEPINFRA_KEY --project-name erised-mirror

const ALLOWED_MODELS = new Set(['ByteDance/Seed-2.0-mini']);
const MAX_TOKENS = 220;
const MAX_MSGS = 6;
const MAX_CHARS = 700; // per message
const RATE_LIMIT = 30; // requests per window per IP
const WINDOW_MS = 10 * 60 * 1000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get('Origin') || '';
  // erised calls with credentials:'include' -> CORS wildcard '*' is invalid there;
  // echo the explicit origin instead (beta-caught: empty body in browser, curl fine).
  const cors = {
    'Access-Control-Allow-Origin': origin && origin.endsWith('.pages.dev') ? origin : 'https://erised-mirror.pages.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
  const respond = (obj, status = 200) => new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json', ...cors },
  });
  if (origin && !origin.endsWith('.pages.dev')) {
    return respond({ error: 'origin not allowed' }, 403);
  }
  if (!env.DEEPINFRA_KEY) {
    return respond({ error: 'hosted gate not configured (missing secret)' }, 503);
  }

  // per-isolate rate limiter (best-effort; cheap and good enough for a playtest gate)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  if (!globalThis.__erised_rl) globalThis.__erised_rl = new Map();
  const rl = globalThis.__erised_rl;
  const rec = rl.get(ip) || { n: 0, t0: now };
  if (now - rec.t0 > WINDOW_MS) { rec.n = 0; rec.t0 = now; }
  rec.n += 1;
  rl.set(ip, rec);
  if (rl.size > 5000) rl.clear();
  if (rec.n > RATE_LIMIT) {
    return respond({ error: 'rate limited — bring your own key (byo mode) for unlimited play' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'bad json' }, 400);
  }
  const model = ALLOWED_MODELS.has(body.model) ? body.model : 'ByteDance/Seed-2.0-mini';
  let messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MSGS) : null;
  if (!messages) return respond({ error: 'messages required' }, 400);
  messages = messages
    .filter((m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length) return respond({ error: 'no usable messages' }, 400);

  const r = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DEEPINFRA_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS, temperature: 1.0 }),
  });
  if (!r.ok) {
    return respond({ error: `upstream ${r.status}` }, 502);
  }
  const data = await r.json();
  const choice = data.choices && data.choices[0] && data.choices[0].message;
  return respond({
    content: (choice && choice.content) || '',
    model: data.model || model,
    usage: data.usage || null,
  });
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin && origin.endsWith('.pages.dev') ? origin : 'https://erised-mirror.pages.dev',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}
