# bizforge — LLM Layer

## Credentials

Three-tier priority (see `src/lib/llm.js`):
1. `OPENCODE_GO_API_KEY` env var
2. `~/.local/share/opencode/auth.json` — opencode-go key
3. `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` fallback

## Default Configuration

| Setting | Default | Override via |
|---|---|---|
| Endpoint | `https://opencode.ai/zen/go/v1/chat/completions` | `LLM_ENDPOINT` |
| Model | `deepseek-v4-flash` (~31k req/5h) | `LLM_MODEL` |
| Temperature | 0.3 (ask), 0.2 (test gen, enhance) | Per-function option |

If using OpenCode Go, you already have credentials. No setup needed.

## Features

| CLI | Function | Default model |
|---|---|---|
| `npm run ask` | UK business/tax/legal Q&A | deepseek-v4-flash |
| `npm run enhance` | Legal document review | deepseek-v4-flash |
| `npm run test:generate` | Edge-case test generation | deepseek-v4-flash |

## Examples

```bash
npm run ask -- "Is flat rate VAT worth it at £80k revenue?"
npm run enhance -- contract       # Review SOW completeness
npm run test:generate -- finances # Generate edge-case tests
```

## Using a Different Provider

```env
LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o
# or local:
LLM_ENDPOINT=http://localhost:11434/v1/chat/completions
LLM_MODEL=llama3
```
