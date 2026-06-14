# bizforge — AGENTS.md

## What is this?

Modular CLI toolkit for solo founders / micro-agencies. Replaces
£3k-5k/yr in professional services with free government APIs + LLM.

## Tech Stack

Node.js (ES Modules) — pure JavaScript CLI. Vitest for testing.

## Project Structure

```
bizforge/
├── src/index.js        CLI router (source of truth for commands)
├── src/lib/            Core modules (companies-house, whois, legal, finances, etc.)
├── scripts/            CLI scripts, each is an npm-scriptable .js
├── templates/          Legal templates with {{variable}} substitution
├── modules/            Extensible feature modules (MANIFEST.md)
├── test/               unit/ + integration/ + contract/ + helpers/
├── docs/               docs/LLM.md + docs/business/
```

## Commands

Source of truth: `src/index.js` lines 16-32. Run `npm start help` to list all commands.

Key ones:
- `npm run screen -- "Brand"` — Companies House + domain conflict check
- `npm run verify -- 12345678` — Client company due diligence
- `npm run contract` — Generate SOW for a client
- `npm run strategy -- 60000` — Tax optimization plan
- `npm run audit -- https://site.com` — GDPR compliance scan
- `npm run ask -- "question?"` — AI business advisor (LLM)
- `npm run enhance -- contract` — AI legal document review (LLM)

## LLM Auth

Three-tier credential resolution (see `src/lib/llm.js` lines 20-45):
1. `OPENCODE_GO_API_KEY` env var
2. `~/.local/share/opencode/auth.json` — opencode-go key
3. `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` fallback

See `docs/LLM.md` for full LLM configuration guide.

## Testing

```bash
npm test                    # 188 tests, < 1s (17s with real API)
npm run test:unit           # Pure function tests
npm run test:integration    # Mocked + one real OpenCode Go API test
npm run test:coverage       # Coverage (target 80%+)
```

## Environment

Copy `.env.example` → `.env`. Required: `COMPANIES_HOUSE_API_KEY`.
LLM credentials auto-read from opencode auth — no setup needed.
