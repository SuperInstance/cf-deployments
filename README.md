# cf-deployments

The fleet's Cloudflare Workers & Pages deployments (wave-64 token handoff).

## Live

| deployment | URL | what |
|---|---|---|
| erised-mirror (Pages + Function) | https://erised-mirror.pages.dev | the erised cooperative-fiction stage; `functions/erised/api/llm.js` = hosted-mode gate (deepinfra server-side, model whitelist, per-IP rate limit, origin lock) |
| cot-quilt-view (Pages) | https://cot-quilt-view.pages.dev | static SVG viewer for cot-quilt's decomposition graphs |
| superinstance-api (Worker, pre-existing) | https://superinstance-api.casey-digennaro.workers.dev | fleet memory brain: D1 + Vectorize + MCP at /mcp (health 200 verified wave-64) |

## Banked gotchas (wave-64, receipted)

- The new `CLOUDFLARE_API_TOKEN` (cfut-prefix) token passes `/user/tokens/verify` (the OLD one failed 6111) — use
  `CLOUDFLARE_API_TOKEN`; wrangler 4.146 confirmed: "You are logged in with an User API Token".
- **Credentialed CORS**: erised calls `fetch(..., {credentials:'include'})` — a wildcard
  `Access-Control-Allow-Origin: *` is invalid there and the browser strips the body
  (curl never catches this; the browser beta-test did). Echo the explicit origin +
  `Access-Control-Allow-Credentials: true` + `Vary: Origin`.
- Pages Functions auto-deploy from `functions/` in the project dir; secrets via
  `wrangler pages secret put <NAME> --project-name <proj>`.
- superinstance-api's deploy.sh is idempotent (scout 64-2c): AI binding is `[ai]` not
  `[[ai]]`; Vectorize metadata filters must be JS-side; empty-string metadata rejected.

## Deploy

```bash
export CLOUDFLARE_API_TOKEN=...   # from .env.keys, never committed
cd erised-mirror-page && npx wrangler@latest pages deploy . --project-name erised-mirror --branch main
cd ../cot-quilt-view-page && npx wrangler@latest pages deploy . --project-name cot-quilt-view --branch main
```
