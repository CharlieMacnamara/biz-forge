# bizforge — AGENTS.md

## What is this?

Modular CLI toolkit for solo founders / micro-agencies. Replaces
£3k-5k/yr in professional services with free government APIs + LLM.
Strategic goal: replace the need for an accountant through deterministic
programmatic checks of all financial, legal, and compliance obligations.

## Quickstart

```bash
cp .env.example .env                    # Create config
# Edit .env: set COMPANY_NAME, COMPANY_EMAIL, COMPANIES_HOUSE_API_KEY
npm run setup                           # Formation walkthrough
npm run readiness                       # Check everything is configured (aim for GREEN)
npm run health                          # Verify API keys + domains + insurance
npm run policy -- privacy               # Generate UK GDPR privacy policy
npm run strategy -- 60000               # See your tax plan
npm run calendar                        # See your deadlines with 🔴🟡🟢 urgency
```

See `docs/business/weekly-workflow.md` for the full daily/monthly/quarterly usage guide.

## Tech Stack

Node.js (ES Modules) — pure JavaScript CLI. Vitest for testing (312 tests, 6 conditionally skipped).

## Project Structure

```
bizforge/
├── src/index.js        CLI router (source of truth for commands)
├── src/lib/            Core modules (see below)
├── scripts/            CLI scripts, each is an npm-scriptable .js
├── templates/          Legal templates with {{variable}} substitution
├── modules/            Extensible feature modules (MANIFEST.md)
├── test/               unit/ + integration/ + contract/ + helpers/
├── data/               Runtime data (dividend history, finances.json)
├── docs/               docs/LLM.md + docs/business/
```

### Core Library Modules (`src/lib/`)

| Module | Exports | Purpose |
|---|---|---|
| `finances.js` | corpTax, dividendTax, fullStrategy, flatRateVat, etc. | Tax calculations (salary, CT, VAT, pension, R&D) |
| `legal.js` | fillTemplate, loadTemplate, generatePolicy, generateContract, saveDocument | Legal document generation with `{{variable}}` templates |
| `companies-house.js` | searchCompany, getCompany, getOfficers, getFilingHistory | Companies House API integration |
| `whois.js` | checkExpiry, checkDomains, checkDomain | Domain WHOIS lookups |
| `brand-screen.js` | screenBrand, formatScreenReport | Brand name conflict screening |
| `compliance.js` | auditUrl, formatAuditReport | GDPR/PECR compliance URL scanning |
| `app-store.js` | checkDuns, checkPrivacyLabels, checkScreenshotReadiness | App Store submission readiness |
| `readiness.js` | runReadinessCheck, checkEnv, checkInsurance, getVerdict | Business readiness scoring (GREEN/AMBER/RED) |
| `dashboard.js` | buildDashboard, calculateDeadlines, getQuarterlyDeadlines | Financial dashboard aggregation |
| `dividend.js` | generateVoucher, generateBoardMinutes, saveDividendRecord, getDividendHistory, calculateDividendTax | Dividend voucher generator |
| `calendar.js` | getUrgency, getDeadlines, getQuarterlyDeadlines, getUpcomingDeadlines | Deadline calendar with urgency scoring |
| `llm.js` | ask, enhance | LLM integration (OpenCode Go / OpenAI-compatible) |
| `logger.js` | header, tick, cross, ok, fail, section, table, dim, rule | CLI output formatting |

## Commands

Source of truth: `src/index.js`. Run `npm start help` to list all commands.

### Business Operations
- `npm run screen -- "Brand"` — Companies House + domain conflict check
- `npm run verify -- 12345678` — Client company due diligence
- `npm run domain -- "name .com"` — Domain availability/expiry check
- `npm run contract` — Generate SOW for a client (interactive)
- `npm run policy -- privacy` — Generate UK GDPR privacy/terms/cookie policies
- `npm run audit -- https://site.com` — GDPR compliance scan

### Finance & Tax (Accountant Replacement)
- `npm run strategy -- 60000` — Tax optimization plan (salary/dividend/pension/VAT)
- `npm run strategy -- compare 80000 120000` — Side-by-side revenue scenario comparison
- `npm run dashboard -- 60000` — Financial dashboard: salary, CT, VAT, dividends, deadlines, insurance
- `npm run dividend -- 5000` — Generate HMRC-compliant dividend voucher + board minutes
- `npm run calendar` — Deadline calendar with 🔴🟡🟢 urgency scoring (real dates from .env)

### Readiness & Health
- `npm run readiness` — Business readiness scored checklist (GREEN/AMBER/RED)
- `npm run health` — API keys, domain expiry, insurance, template integrity

### LLM-Powered
- `npm run ask -- "question?"` — AI business advisor
- `npm run enhance -- contract` — AI legal document review
- `npm run test:generate` — AI test case generation

### Setup & Verification
- `npm run setup` — Company formation walkthrough
- `npm run verify:setup` — Integration smoke test (72 checks)
- `npm run app-store` — App Store submission readiness

## LLM Auth

Three-tier credential resolution (see `src/lib/llm.js` lines 20-45):
1. `OPENCODE_GO_API_KEY` env var
2. `~/.local/share/opencode/auth.json` — opencode-go key
3. `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` fallback

See `docs/LLM.md` for full LLM configuration guide.

## Testing

```bash
npm test                    # 318 tests, 16s (312 pass, 6 skipped without LLM key)
npm run test:unit           # Pure function tests
npm run test:integration    # Mocked + full business workflow tests
npm run test:coverage       # Coverage (target 80%+)
```

Test categories: `test/unit/` (pure functions), `test/integration/` (mocked orchestration), `test/contract/` (structural integrity).

### Determinism

All pure computation tests (finances, templates, WHOIS, compliance, brand-screen, app-store, readiness, dashboard, dividend, calendar) use **deterministic fixture data** — same input always produces same output. The 6 skipped tests in `opencode-go.test.js` require a live API key and are skipped cleanly when unavailable. No test depends on external API availability.

## Environment

Copy `.env.example` → `.env`. Two new env vars added for calendar deadlines:
- `COMPANY_INCORPORATION_DATE` — for computing Confirmation Statement, CT deadlines
- `ICO_REGISTRATION_DATE` — for computing ICO renewal deadline

Required: `COMPANIES_HOUSE_API_KEY` for CH lookups. LLM credentials auto-read
from opencode auth — no setup needed.
